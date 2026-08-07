/**
 * address-check-2026-08.md の OAZA_MISS を、**Web検索なしで**3群に仕分ける。
 *
 * ## なぜ仕分けを挟むか
 *
 * OAZA_MISS は43件出た。そのまま1件ずつ精査すると誤検出に埋もれる。
 * `duplicate-check.js` を全件総当たりにしたとき10ペア→133ペアになり、
 * **増えた123件の大半が誤検出だった**のと同じ形（引き継ぎ §7-4）。
 *
 * ## 基準の作り方
 *
 * **距離では仕分けられないことが分かっている。**
 * `takizawaso` の修正前（秦野市堀山下1513）を検証データとして測ると、
 * 住所の座標と施設の座標は **1.96km しか離れていなかった**。
 * 一方で山間部の正常なケースは10km超になる（寸又峡 12.9km、奥大井湖上 14.3km）。
 * **本物のほうが近く、誤検出のほうが遠い。**距離を閾値にすると本命を取り逃す。
 *
 * 代わりに主軸にしたのが「**同じ場所が複数の住所に対して返っている**」という観測（I5・I7・I8）。
 * 牧野6件・大平柿木3件・内野3件のように、**国土地理院の lv01Nm は山間部や
 * 合併市で粒度が粗く、数km離れた代表的な大字にスナップする。**
 * これは施設側ではなく GSI 側の事情なので、住所の誤りの証拠にならない。
 *
 * ## 判定
 *
 *   IGNORABLE : 食い違いに説明がつく（下の I1〜I8。理由を1件ずつ出す）
 *   SUSPECT   : 説明がつかず、address の大字と lv01Nm が全く別の地名 ← takizawaso 型
 *   UNKNOWN   : 判定材料が足りない
 *
 * **データは書き換えない。**md に節を追記するだけ。
 *
 *   node scripts/classify-oaza-miss.js
 *   node scripts/classify-oaza-miss.js --selftest   # takizawaso 修正前が SUSPECT に落ちるか
 */
const fs = require('fs');
const path = require('path');

const MD = path.join(__dirname, 'address-check-2026-08.md');

/** 通称・地物を指す語。これが address にあると番地まで書けていない住所の可能性が高い */
const NICKNAME_WORDS = [
  '湖', '峡', '高原', '国有林', '河川敷', '公園', '海岸', '地先', '牧場',
  '温泉', '渓谷', '半島', '岬', '浜', '滝', '岳', '演習林', '緑地',
];

const KANJI_NUM = { 〇: '0', 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9' };

function normalize(s) {
  return String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/大字|字(?=[^\d])/g, '')
    .replace(/[〇一二三四五六七八九]/g, (c) => KANJI_NUM[c] ?? c);
}

/** 2つの文字列が共有する最長の連続部分の長さ */
function longestCommonSubstring(a, b) {
  if (!a || !b) return 0;
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + best + 1; j <= a.length; j++) {
      const sub = a.slice(i, j);
      if (b.includes(sub)) best = Math.max(best, sub.length);
      else break;
    }
  }
  return best;
}

/** address から都道府県・市区町村を落とした残り */
function remainder(address, city) {
  let rest = normalize(address).replace(/^(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/, '');
  const c = normalize(city);
  const candidates = [c, c.split('郡').pop()].filter(Boolean);
  for (const cand of candidates) {
    const i = rest.indexOf(cand);
    if (i >= 0) return rest.slice(i + cand.length);
  }
  return rest;
}

/** 「長坂町大八田」→「長坂町」。合併市の旧町名の接頭辞を取る。「湖東町」のように後ろが無いものは対象外 */
function chouPrefix(lv01Nm) {
  const m = /^(.+?町)(.+)$/.exec(normalize(lv01Nm));
  return m ? m[1] : null;
}

/** address 残余の先頭の地名部分（数字の手前まで）。「堀山下1513」→「堀山下」 */
function addressOaza(address, city) {
  const rest = remainder(address, city);
  const m = /^([^\d]+)/.exec(rest);
  return m ? m[1].replace(/[（(].*$/, '') : rest;
}

/**
 * 1件を仕分ける。
 * - oazaFreq   … 同じ lv01Nm が OAZA_MISS 全体で何件に出たか
 * - chouFreq   … 同じ「◯◯町」接頭辞が何件に出たか（I7）
 * - addrGroups … 同じ市区町村＋同じ address 大字の組で、lv01Nm が何種類に割れたか（I8）
 */
function classify(row, oazaFreq, chouFreq = new Map(), addrGroups = new Map()) {
  const rest = remainder(row.address, row.city);
  const oaza = normalize(row.lv01Nm);
  const reasons = [];

  // I1: GSI が大字を持っていない。「−」は未整備を表すマーカー
  if (!oaza || oaza === '-' || oaza === '−' || oaza === 'なし') {
    return { verdict: 'IGNORABLE', reason: 'I1 lv01Nm が「−」＝国土地理院側に大字データが無い' };
  }

  // I2: 表記ゆれ・旧字・部分一致。「大平柿木」と「大平」のようなケース
  const lcs = longestCommonSubstring(oaza, rest);
  if (lcs >= 2) {
    reasons.push(`I2 lv01Nm「${row.lv01Nm}」と address の「${rest}」が ${lcs} 文字一致（表記ゆれ・部分一致）`);
  }

  // I3: 政令市の区までで大字を持たない
  if (!/[぀-ヿ一-鿿]/.test(rest)) {
    return { verdict: 'IGNORABLE', reason: 'I3 address が市区町村までで大字を持たない' };
  }

  // I4: 通称・地物名を含む住所。番地まで特定できていない
  const nick = NICKNAME_WORDS.find((w) => rest.includes(w));
  if (nick || /[（(]/.test(rest)) {
    reasons.push(
      `I4 address に通称・地物の表記がある（${nick ? `「${nick}」` : '括弧書き'}）。番地まで確定していない住所`
    );
  }

  // I5: 同じ lv01Nm が複数の住所に返っている＝広域スナップ先。GSI 側の粒度の問題
  const freq = oazaFreq.get(oaza) || 0;
  if (freq >= 2) {
    reasons.push(`I5 lv01Nm「${row.lv01Nm}」は OAZA_MISS 内で ${freq} 件に返っている（広域スナップ先）`);
  }

  // I6: 住所と座標がほぼ同じ地点。lv01Nm の粒度の問題でしかない
  if (row.distKm != null && row.distKm < 0.5) {
    reasons.push(`I6 住所と座標が ${row.distKm.toFixed(2)}km しか離れていない（同一地点）`);
  }

  // I7: 合併市の旧町名にスナップしている。「長坂町◯◯」が複数件に返るなら、
  //     その旧町が代表点として使われているだけで、施設が長坂町にあるという意味ではない
  const cp = chouPrefix(row.lv01Nm);
  if (cp && (chouFreq.get(cp) || 0) >= 2) {
    reasons.push(`I7 lv01Nm の旧町名「${cp}」が ${chouFreq.get(cp)} 件に返っている（合併市の旧町名スナップ）`);
  }

  // I8: 同じ大字を名乗る施設が複数あり、lv01Nm がばらけている。
  //     その大字が広く、GSI の代表点が場所ごとに違う先を返している
  const ao = addressOaza(row.address, row.city);
  const g = addrGroups.get(`${normalize(row.city)}|${normalize(ao)}`);
  if (g && g.count >= 2 && g.lv01Set.size >= 2) {
    reasons.push(
      `I8 大字「${ao}」を名乗る施設が ${g.count} 件あり、lv01Nm が ${g.lv01Set.size} 種類に割れている（大字が広い）`
    );
  }

  if (reasons.length) return { verdict: 'IGNORABLE', reason: reasons.join(' / ') };

  if (row.distKm == null) {
    return { verdict: 'UNKNOWN', reason: '住所検索が座標を返さず、距離が測れない' };
  }

  return {
    verdict: 'SUSPECT',
    reason: `address の大字「${rest}」と lv01Nm「${row.lv01Nm}」が全く別の地名。距離 ${row.distKm.toFixed(2)}km`,
  };
}

/** md の OAZA_MISS の表を読む */
function parseRows(md) {
  // 「## OAZA_MISS を『住所が誤り』と読まないこと」という解説の見出しが別にあるので、
  // 件数付きの見出し（## OAZA_MISS（43件））だけを拾う
  const section = md.split(/^## OAZA_MISS（/m)[1]?.split(/^## /m)[0] ?? '';
  const rows = [];
  for (const line of section.split(/\r?\n/)) {
    const m = /^\|\s*`([^`]+)`\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/.exec(line);
    if (!m) continue;
    const [, slug, name, address, geo, dist] = m;
    const [city, lv01Nm] = geo.split('/').map((s) => s.trim());
    const dm = /([\d.]+)km/.exec(dist);
    rows.push({
      slug,
      name: name.trim(),
      address: address.trim(),
      city,
      lv01Nm,
      distKm: dm ? Number(dm[1]) : null,
    });
  }
  return rows;
}

function selftest(oazaFreq, chouFreq, addrGroups) {
  // takizawaso の**修正前**の値。実測: 住所検索は「秦野市堀山下1513番地」を正確に返し、
  // 施設の座標との距離は 1.96km だった
  const row = {
    slug: 'takizawaso（修正前・検証データ）',
    name: '滝沢園キャンプ場',
    address: '神奈川県秦野市堀山下1513',
    city: '秦野市',
    lv01Nm: '戸川',
    distKm: 1.96,
  };
  const r = classify(row, oazaFreq, chouFreq, addrGroups);
  const ok = r.verdict === 'SUSPECT';
  console.log(`\n[selftest] takizawaso 修正前 → ${r.verdict}  ${ok ? 'OK' : '❌ 基準が緩い'}`);
  console.log(`           ${r.reason}`);
  return ok;
}

function main() {
  const md = fs.readFileSync(MD, 'utf8');
  const rows = parseRows(md);
  if (!rows.length) throw new Error('OAZA_MISS の表を読めなかった');

  const oazaFreq = new Map();
  const chouFreq = new Map();
  const addrGroups = new Map();
  for (const r of rows) {
    const k = normalize(r.lv01Nm);
    oazaFreq.set(k, (oazaFreq.get(k) || 0) + 1);

    const cp = chouPrefix(r.lv01Nm);
    if (cp) chouFreq.set(cp, (chouFreq.get(cp) || 0) + 1);

    const key = `${normalize(r.city)}|${normalize(addressOaza(r.address, r.city))}`;
    if (!addrGroups.has(key)) addrGroups.set(key, { count: 0, lv01Set: new Set() });
    const g = addrGroups.get(key);
    g.count++;
    g.lv01Set.add(k);
  }

  const ok = selftest(oazaFreq, chouFreq, addrGroups);
  if (process.argv.includes('--selftest')) process.exit(ok ? 0 : 1);
  if (!ok) {
    console.error('\n検証データが SUSPECT に落ちない。仕分け基準を締め直すこと。中止する。');
    process.exit(1);
  }

  const results = rows.map((r) => ({ ...r, ...classify(r, oazaFreq, chouFreq, addrGroups) }));
  const ORDER = ['SUSPECT', 'UNKNOWN', 'IGNORABLE'];
  const counts = Object.fromEntries(ORDER.map((v) => [v, 0]));
  results.forEach((r) => counts[r.verdict]++);

  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
  const table = (v) =>
    results
      .filter((r) => r.verdict === v)
      .sort((a, b) => (b.distKm ?? -1) - (a.distKm ?? -1))
      .map(
        (r) =>
          `| \`${r.slug}\` | ${esc(r.name)} | ${esc(r.address)} | ${esc(r.city)} / ${esc(r.lv01Nm)} | ${
            r.distKm == null ? '—' : r.distKm.toFixed(2) + 'km'
          } | ${esc(r.reason)} |`
      )
      .join('\n');
  const HEAD =
    '| slug | 施設名 | address | 逆ジオ（市区町村 / 大字） | 距離 | 理由 |\n|---|---|---|---|---|---|';

  const freqLines = [...oazaFreq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `| ${k} | ${n} |`)
    .join('\n');

  const section = `

---

# D-1.5. OAZA_MISS ${rows.length}件の仕分け（Web検索なし）

そのまま精査すると誤検出に埋もれるので、**コードで機械的に3群に分けた。**
\`duplicate-check.js\` を全件総当たりにしたとき10ペア→133ペアになり、
**増えた123件の大半が誤検出だった**のと同じ形を避けるため（引き継ぎ §7-4）。

## 距離では仕分けられない

**検証データ（\`takizawaso\` の修正前）で確かめた。**

| | 住所検索の結果 | 施設の座標との距離 |
|---|---|---|
| 修正前 神奈川県秦野市**堀山下**1513 | 秦野市堀山下1513番地（正確に解決） | **1.96km** |
| 修正後 神奈川県秦野市**戸川**1445 | 秦野市戸川1445番地 | 0.27km |

**本物の誤りが 1.96km しか離れていない。**一方で誤検出のほうは
寸又峡 12.9km、奥大井湖上 14.3km と桁が違う。**距離を閾値にすると本命だけ落ちる。**

主軸に据えたのは「**同じ \`lv01Nm\` が複数の住所に返っている**」という観測。

| 反復している lv01Nm | 件数 |
|---|---|
${freqLines || '| （なし） | |'}

国土地理院の \`lv01Nm\` は**山間部と合併市で粒度が粗く**、数km離れた代表的な大字にスナップする。
北杜市の4件が全部「長坂町◯◯」「須玉町◯◯」に落ちているのがその例で、
**これは施設側ではなく GSI 側の事情**なので住所の誤りの証拠にならない。

## 仕分けの規則

| | 内容 |
|---|---|
| I1 | \`lv01Nm\` が「−」＝国土地理院側に大字データが無い |
| I2 | \`lv01Nm\` と address が2文字以上一致（表記ゆれ・旧字・「大字」の有無） |
| I3 | address が市区町村までで大字を持たない |
| I4 | address に通称・地物の表記（湖・峡・高原・河川敷・海岸・地先ほか）や括弧書きがある |
| I5 | \`lv01Nm\` が OAZA_MISS 内で2件以上に返っている（広域スナップ先） |
| I6 | 住所と座標が 0.5km 未満（同一地点。粒度の問題） |
| I7 | \`lv01Nm\` の旧町名の接頭辞（「長坂町◯◯」の「長坂町」）が2件以上で共通（合併市の旧町名スナップ） |
| I8 | 同じ大字を名乗る施設が2件以上あり、\`lv01Nm\` が2種類以上に割れている（大字が広い） |

I1〜I8 のどれかに当たれば **IGNORABLE**。どれにも当たらず距離が測れていれば **SUSPECT**。
距離が測れなければ **UNKNOWN**。

**検証データを通すことを必須にしてある。**
\`takizawaso\` の修正前が SUSPECT に落ちなければスクリプトは中止する（\`--selftest\`）。

## 集計

| 判定 | 件数 |
|---|---|
| **SUSPECT** | **${counts.SUSPECT}** |
| UNKNOWN | ${counts.UNKNOWN} |
| IGNORABLE | ${counts.IGNORABLE} |

## SUSPECT（${counts.SUSPECT}件）

**ここだけが D-2 の対象。**

${HEAD}
${table('SUSPECT') || '| （なし） | | | | | |'}

## UNKNOWN（${counts.UNKNOWN}件）

${HEAD}
${table('UNKNOWN') || '| （なし） | | | | | |'}

## IGNORABLE（${counts.IGNORABLE}件）

**食い違いに説明がつくもの。理由を1件ずつ書いてある。**
ただし「説明がつく」は「住所が正しい」ではない。**説明がつく以上は優先度が下がる、というだけ。**

${HEAD}
${table('IGNORABLE') || '| （なし） | | | | | |'}
`;

  // 基準を締め直して回し直すことがあるので、自分が前に書いた節は消してから書く。
  // 追記しっぱなしにすると古い基準の結果が残って、どれが最新か分からなくなる
  const base = md.split(/^\n*---\n\n# D-1\.5\./m)[0].replace(/\s*$/, '\n');
  fs.writeFileSync(MD, base + section, 'utf8');
  console.log(`\nSUSPECT ${counts.SUSPECT} / UNKNOWN ${counts.UNKNOWN} / IGNORABLE ${counts.IGNORABLE}`);
  console.log(`→ ${path.relative(path.join(__dirname, '..'), MD)} に追記`);
}

main();
