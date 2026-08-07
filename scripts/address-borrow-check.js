/**
 * address の借用を機械検出する。
 *
 * ## なぜ要るか
 *
 * `takizawaso` の誤住所「秦野市堀山下1513」は **`hadano-togawa-camp`（神奈川県立秦野戸川公園）の
 * 住所だった**（D-2）。しかも借用元の `hadano-togawa-camp` 自身も「堀山下777」という
 * 別の誤住所を持っていた。
 *
 * 引き継ぎ §6-4 は「**実在しない施設**は実在する何かの名前や住所を借りて作られる」だったが、
 * これは **実在する施設どうしの借用**で、型が違う。
 * `duplicate-check.js` は「同じ施設が二重登録されていないか」を見る道具なので、
 * 「別の施設が同じ住所を持っている」を主目的にしていない。
 *
 * ## 判定
 *
 *   EXACT_DUP : 正規化後の address が完全一致する2件以上
 *   BLOCK_DUP : 大字＋番地の**主番号**まで一致（枝番違い）。「1513」と「1513-2」など
 *   OAZA_DUP  : 同一の市区町村＋大字に3件以上。**通常あり得るので参考情報**
 *
 * **判定するだけで data/campgrounds.json は書き換えない。**
 *
 * ## 正常な重複がある
 *
 * `pica-sagamiko` と `sagamiko-pleasure-camp` は**同じ地番（相模原市緑区若柳1634）**を持つ。
 * PICAさがみ湖はさがみ湖MORI MORI の敷地内にあり、**これは借用ではない。**
 *
 * **除外リストには入れていない。**確認済みのものを検査対象から外すと、
 * 「確認済みフラグが検証をすり抜けさせる」（§6-1）の再発になる。
 * 毎回出てくるので、md 側に「確認済みの正常な重複」として書いてある。
 *
 *   node scripts/address-borrow-check.js
 *   node scripts/address-borrow-check.js --selftest   # takizawaso 修正前を拾えるか
 *   → scripts/address-borrow-2026-08.md
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const OUT = path.join(__dirname, 'address-borrow-2026-08.md');
/** D-1 の結果。**これが無ければ動かさない。**古い判定で借用を疑わないため */
const D1 = path.join(__dirname, 'address-check-2026-08.md');

const KANJI_NUM = { 〇: '0', 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9' };

/**
 * address を比較できる形に揃える。
 * 全角/半角・ハイフンの種類・「大字」「字」の有無・丁目の書き方・空白を吸収する。
 */
function normalize(address) {
  return String(address || '')
    .normalize('NFKC')
    // ハイフンに見える文字を全部 '-' に寄せる。番地の区切りは表記がばらつく
    .replace(/[‐‑‒–—―ー−ｰ─－]/g, '-')
    .replace(/[のノ](?=\d)/g, '-') // 「1513の2」→「1513-2」
    .replace(/番地?の?|号/g, '-')
    .replace(/\s+|　/g, '')
    .replace(/大字|字(?=[^\d])/g, '')
    // 漢数字→算用数字は**丁目の直前だけ**。住所全体にかけると
    // 「七沢」が「7沢」、「三ケ木」が「3ケ木」になって地名が壊れる
    .replace(/([〇一二三四五六七八九十]+)丁目/g, (_, n) => {
      const arabic = n === '十' ? '10' : n.replace(/十/g, '').replace(/[〇一二三四五六七八九]/g, (c) => KANJI_NUM[c] ?? c);
      return `${arabic}-`;
    })
    .replace(/丁目/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '');
}

/** 「神奈川県秦野市堀山下1513-2」→ { area: '神奈川県秦野市堀山下', main: '1513', sub: '2' } */
function split(address) {
  const n = normalize(address);
  const m = /^(.*?)(\d[\d-]*)$/.exec(n);
  if (!m) return { norm: n, area: n, main: null, sub: null };
  const [, area, num] = m;
  const [main, ...rest] = num.split('-');
  return { norm: n, area, main, sub: rest.join('-') || null };
}

/**
 * D-1（verify-address-gsi.js ＋ classify-oaza-miss.js）の結果から
 * 「address と座標が食い違っている」施設を拾う。
 *
 * **CITY_MISS の全件**と、**OAZA_MISS のうち SUSPECT に仕分けられたもの**だけ。
 * IGNORABLE まで入れると、GSI の粒度の問題で落ちた26件が混ざって意味が薄れる。
 */
function loadMismatched() {
  if (!fs.existsSync(D1)) {
    console.error(`D-1 の結果が無い: ${path.relative(path.join(__dirname, '..'), D1)}`);
    console.error('先に node scripts/verify-address-gsi.js と node scripts/classify-oaza-miss.js を回すこと。');
    console.error('**古い判定で借用を疑わないために、依存を必須にしてある。**');
    process.exit(1);
  }
  const md = fs.readFileSync(D1, 'utf8');
  const section = (heading) => {
    const parts = md.split(new RegExp('^## ' + heading + '（', 'm'));
    return parts[1] ? parts[1].split(/^## /m)[0] : null;
  };
  const out = new Map();
  for (const [heading, label] of [['CITY_MISS', 'CITY_MISS'], ['SUSPECT', 'OAZA_MISS-SUSPECT']]) {
    const sec = section(heading);
    if (sec == null) {
      console.error(`D-1 の結果に「## ${heading}（」の節が無い。D-1 を回し直すこと。`);
      process.exit(1);
    }
    for (const m of sec.matchAll(/^\|\s*`([^`]+)`/gm)) out.set(m[1], label);
  }
  return out;
}

/** 市区町村＋大字（＝番地を落とした部分）。OAZA_DUP に使う */
function areaKey(address) {
  return split(address).area;
}

function analyze(records, mismatched = new Map()) {
  const exact = new Map();
  const block = new Map();
  const oaza = new Map();

  for (const c of records) {
    if (!c.address || !String(c.address).trim()) continue;
    const s = split(c.address);
    const push = (map, key) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ camp: c, ...s });
    };
    push(exact, s.norm);
    push(block, s.main ? `${s.area}|${s.main}` : null);
    push(oaza, s.area);
  }

  const pick = (map, min) =>
    [...map.entries()]
      .filter(([, v]) => v.length >= min)
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  const exactGroups = pick(exact, 2);
  const exactKeys = new Set(exactGroups.map(([k]) => k));
  // EXACT に出たものを BLOCK で二重に出さない
  const blockGroups = pick(block, 2).filter(
    ([, v]) => !(v.length === v.filter((x) => exactKeys.has(x.norm)).length && new Set(v.map((x) => x.norm)).size === 1)
  );
  const oazaGroups = pick(oaza, 3);

  // BORROW_SUSPECT: 同一大字に2件以上あり、そのうち1件以上が
  // D-1 で address と座標が食い違っていた組。
  //
  // **address 同士の突き合わせだけでは足りない**ことが分かったので入れた判定。
  // 座標という独立ソースを噛ませて初めて、借用の候補が絞れる（§6-15）。
  const borrowGroups = pick(oaza, 2).filter(([, v]) => v.some((x) => mismatched.has(x.camp.slug)));

  return { exactGroups, blockGroups, oazaGroups, borrowGroups };
}

/**
 * 必須の検証。**借用が起きた当時のデータ**を通す。
 *
 *   takizawaso          … 秦野市堀山下1513（誤・hadano-togawa-camp から借用）
 *   hadano-togawa-camp  … 秦野市堀山下777（こちらも誤）
 *
 * 当時は D-1 で takizawaso が OAZA_MISS-SUSPECT、hadano-togawa-camp が CITY_MISS だった。
 *
 * **address 同士の突き合わせ（EXACT/BLOCK）では拾えない。**両方が汚染されていて
 * 番号が一致しないため。BORROW_SUSPECT で拾えることを必須にする。
 */
function selftest() {
  const then = [
    { slug: 'takizawaso', address: '神奈川県秦野市堀山下1513' },
    { slug: 'hadano-togawa-camp', address: '神奈川県秦野市堀山下777' },
  ].map((c) => ({ ...c, name: c.slug }));
  // 当時の D-1 の判定
  const mismatchedThen = new Map([
    ['takizawaso', 'OAZA_MISS-SUSPECT'],
    ['hadano-togawa-camp', 'CITY_MISS'],
  ]);

  const r = analyze(then, mismatchedThen);
  const byAddress = r.exactGroups.length + r.blockGroups.length > 0;
  const byBorrow = r.borrowGroups.length > 0;

  console.log('[selftest] 借用が起きた当時のデータ（堀山下1513 と 堀山下777）');
  console.log(`  EXACT_DUP / BLOCK_DUP     → ${byAddress ? '検出' : '検出できない'}（両方が汚染されていて番号が一致しない）`);
  console.log(`  BORROW_SUSPECT            → ${byBorrow ? '検出' : '検出できない'}  ${byBorrow ? 'OK' : '❌ 判定が甘い'}`);
  return byBorrow;
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const ok = selftest();
  if (process.argv.includes('--selftest')) process.exit(ok ? 0 : 1);
  if (!ok) {
    console.error('\n検証データを拾えない。正規化か判定が甘い。中止する。');
    process.exit(1);
  }

  const mismatched = loadMismatched();

  // ★ 確認済みフラグで絞らない（§6-1）
  const targets = data.filter((c) => c.status === 'active');
  const { exactGroups, blockGroups, oazaGroups, borrowGroups } = analyze(targets, mismatched);

  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
  /**
   * BORROW_SUSPECT 用。判断材料を並べて出す。
   * **どちらが借用側でどちらが借用元かは人が読んで決める。**機械では決めない。
   */
  const borrowTable = (groups) =>
    groups
      .map(([key, members]) => {
        const rows = members
          .map((m) => {
            const c = m.camp;
            const d1 = mismatched.get(c.slug) || '—';
            const nv = c.needsVerify ? '**要検証**' : '—';
            const url = c.officialUrl && String(c.officialUrl).trim() ? 'あり' : '**なし**';
            return `| \`${c.slug}\` | ${esc(c.name)} | ${esc(c.address)} | ${d1} | ${nv} | ${c.lastVerified || '—'} | ${url} |`;
          })
          .join('\n');
        return (
          `**${esc(key)}**（${members.length}件）\n\n` +
          '| slug | 施設名 | address | D-1 判定 | needsVerify | lastVerified | officialUrl |\n' +
          '|---|---|---|---|---|---|---|\n' +
          rows +
          '\n'
        );
      })
      .join('\n');

  const groupTable = (groups) =>
    groups
      .map(([key, members]) => {
        const rows = members
          .map((m) => `| \`${m.camp.slug}\` | ${esc(m.camp.name)} | ${esc(m.camp.address)} | ${esc(m.camp.area)} |`)
          .join('\n');
        return `**${esc(key)}**（${members.length}件）\n\n| slug | 施設名 | address | area |\n|---|---|---|---|\n${rows}\n`;
      })
      .join('\n');

  const md = `# address の借用チェック（2026-08）

\`node scripts/address-borrow-check.js\` の出力。**このスクリプトはデータを書き換えない。**

## 何を見ているか

\`takizawaso\` の誤住所「秦野市堀山下1513」は **\`hadano-togawa-camp\`
（神奈川県立秦野戸川公園）の住所だった**（D-2）。
引き継ぎ §6-4 は「**実在しない施設**が実在する何かから借りる」型だったが、
これは **実在する施設どうしの借用**で別の型になる。

\`duplicate-check.js\` は「同じ施設が二重登録されていないか」を見る道具なので、
「**別の施設が同じ住所を持っている**」を主目的にしていない。そこでこちらを分けた。

対象: \`status === 'active'\` の **${targets.length}件**。
**\`coordsVerified\` や \`lastVerified\` で絞っていない**（§6-1）。

## address 同士の突き合わせだけでは足りなかった

**最初は EXACT_DUP と BLOCK_DUP だけで作ったが、この検査が作られた元の事例を1件も拾えなかった。**

| | takizawaso | hadano-togawa-camp | address 同士の一致 |
|---|---|---|---|
| 当時 | 堀山下**1513**（誤・借用） | 堀山下**777**（**こちらも誤**） | **しない** |
| 借用元を正した後 | 堀山下**1513**（誤・借用） | 堀山下**1513**（正） | EXACT_DUP |

**借用元の \`hadano-togawa-camp\` 自身が誤住所を持っていたため、番号が一致しなかった。**

これは引き継ぎ §6-15「**一致を見る2つの値は独立に生成されたものでなければならない**」の実例。
**address と address は独立ではない。**同じ人が同じ推測から書けば、両方同時に汚染される。
そこで**座標という独立ソースを噛ませる**のが BORROW_SUSPECT。

大字レベルまで緩めれば address 同士でも拾えるが、
**同一大字2件以上は26グループ・71施設（active の43%）**になり、
\`duplicate-check.js\` が133ペアで使い物にならなくなったのと同じ状態になる（§7-4）。
**D-1 の不整合と交差させて初めて絞れる。**

3つの検査は役割が違う。

| 検査 | 拾えるもの |
|---|---|
| \`verify-address-gsi.js\`（D-1） | address と座標の食い違い。**借用元まで壊れていても拾える** |
| EXACT_DUP / BLOCK_DUP | **借用元が正しい住所を持っている**ときの借用 |
| **BORROW_SUSPECT** | 両方が汚染されていても、**片方が座標と食い違っていれば**拾える |

## BORROW_SUSPECT（${borrowGroups.length}グループ）

**同一大字に2件以上あり、そのうち1件以上が D-1 で address と座標が食い違っていた組。**
D-1 の判定は \`CITY_MISS\` 全件と、\`OAZA_MISS\` のうち **SUSPECT に仕分けられたもの**だけを使う
（IGNORABLE を入れると GSI の粒度の問題で落ちた26件が混ざる）。

**どちらが借用側でどちらが借用元かは、この表を人が読んで決める。**機械では決めない。
判断材料として D-1 判定・\`needsVerify\`・\`lastVerified\`・\`officialUrl\` の有無を並べてある。

${borrowGroups.length ? borrowTable(borrowGroups) : '（なし）'}

## 判定

| | 内容 |
|---|---|
| **EXACT_DUP** | 正規化後の address が完全一致する2件以上 |
| **BLOCK_DUP** | 大字＋番地の**主番号**まで一致（枝番違い）。「1513」と「1513-2」など |
| OAZA_DUP | 同一の市区町村＋大字に3件以上。**通常あり得るので参考情報** |

正規化は 全角/半角・ハイフンの種類・「番地」「号」「の」・「大字」「字」・丁目・空白 を吸収する。

## 集計

| 判定 | グループ数 |
|---|---|
| **BORROW_SUSPECT** | **${borrowGroups.length}** |
| **EXACT_DUP** | **${exactGroups.length}** |
| **BLOCK_DUP** | **${blockGroups.length}** |
| OAZA_DUP | ${oazaGroups.length} |

## 確認済みの正常な重複

**\`pica-sagamiko\` と \`sagamiko-pleasure-camp\` は同じ「相模原市緑区若柳1634」を持つ。**
PICAさがみ湖は**さがみ湖MORI MORI（旧プレジャーフォレスト）の敷地内**にあり、地番を共有している。
**借用ではない。**

**除外リストには入れていない。**確認済みのものを検査対象から外すと
「確認済みフラグが検証をすり抜けさせる」（§6-1）の再発になるため、
毎回 EXACT_DUP に出てくる。ここを読んで飛ばすこと。

## EXACT_DUP（${exactGroups.length}グループ）

${exactGroups.length ? groupTable(exactGroups) : '（なし）'}

## BLOCK_DUP（${blockGroups.length}グループ）

枝番だけが違うもの。**同じ敷地に複数の施設がある**場合と、**片方が借用**の場合がある。

${blockGroups.length ? groupTable(blockGroups) : '（なし）'}

## OAZA_DUP（${oazaGroups.length}グループ・参考）

同じ大字に3件以上。**キャンプ場が集まる地域では普通に起きる**ので、これ自体は異常ではない。
借用を疑うのは、上の2つに出たものと突き合わせるとき。

${oazaGroups.length ? groupTable(oazaGroups) : '（なし）'}
`;

  fs.writeFileSync(OUT, md, 'utf8');
  console.log(
    `\nBORROW_SUSPECT ${borrowGroups.length} / EXACT_DUP ${exactGroups.length} / BLOCK_DUP ${blockGroups.length} / OAZA_DUP ${oazaGroups.length}`
  );
  console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
}

main();
