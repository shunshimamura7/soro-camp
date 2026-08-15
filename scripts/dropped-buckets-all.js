/**
 * 全市町村の「出力に載らなかったソース側の項目」を1本にまとめる。
 *
 * ## なぜ別スクリプトなのか
 *
 * `--district` / `--all` は `sweep-{地区}.md` を書き出す。**既存の記録を上書きしたくない**ので、
 * 判定ロジック（`district-sweep.js` の内部関数）をそのまま呼び、**書き出しだけ別ファイル**にする。
 * **判定は1行も持っていない。**`_internal` 経由で本体の関数を呼ぶだけ。
 *
 * ## 案C — 収集は市町村ごとに1回だけ
 *
 * `collected` は地区に依存しない（市町村＋県のソースだけで決まる）。
 * 地区ごとに収集し直すと、**404 は毎回取りに行くので**通信が 295回 → 79回 になる。
 * 収集を市町村単位で1回にして、`mergeItems` 以降だけを地区ごとに回す。
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES, sweepNormalizeName, _internal: I } = require('./district-sweep.js');
const { namesMatch } = require('./name-match');

/* ---- 対象の決定と、そのラベル ---------------------------------------------
 *
 * **見出しと出力ファイル名を固定文字列にしていたせいで、`--muni=都留市` で
 * 走らせた結果が「全市町村」と名乗り、`dropped-buckets-all-2026-08.md` を
 * 名乗って上書きしていた。**（§18-3。生成側のラベルが実際の対象と無関係だと、
 * 消費側＝人は md を信じて「全件やった」と読む。）
 * **対象は argv からだけ決め、見出し・ファイル名・件数はすべてそこから作る。**
 */
const ARGV = process.argv.slice(2);
const onlyMuni = (ARGV.find(a => a.startsWith('--muni=')) || '').split('=')[1] || null;
const CMD = ['node', 'scripts/dropped-buckets-all.js', ...ARGV].join(' ');

if (onlyMuni && !MUNI_SOURCES[onlyMuni]) {
  console.error(`--muni=${onlyMuni} は MUNI_SOURCES に無い。対象0件の md を書くほうが危ないので中止する。`);
  console.error(`指定できるのは: ${Object.keys(MUNI_SOURCES).join(' / ')}`);
  process.exit(1);
}

const OUT_NAME = `dropped-buckets-${onlyMuni || 'all'}-2026-08.md`;
const OUT = path.join(__dirname, OUT_NAME);

/* 対象地区は既存の sweep-*.md から取る（そこが実際に回した地区だから） */
function districtList() {
  const skip = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;
  const out = [];
  for (const f of fs.readdirSync(__dirname)) {
    const m = f.match(/^sweep-(.+)\.md$/);
    if (!m || skip.test(m[1])) continue;
    out.push(m[1]);
  }
  return out.sort();
}

const muniOf = name => Object.keys(MUNI_SOURCES).find(m => name.startsWith(m) || name.includes(m));

async function main() {
  const records = I.loadRecords();
  const opts = { useCache: true };
  const allDistricts = districtList();
  let districts = allDistricts;
  if (onlyMuni) districts = districts.filter(d => muniOf(d) === onlyMuni);
  if (!districts.length) {
    console.error(`対象地区が0件（${onlyMuni || '絞り込み無し'}）。sweep-*.md が無い市町村は回せない。`);
    process.exit(1);
  }

  // 市町村ごとに1回だけ収集する
  const byMuni = new Map();
  for (const d of districts) {
    const m = muniOf(d);
    if (!m) { console.log(`  ?? 市町村が決まらない地区: ${d}`); continue; }
    if (!byMuni.has(m)) byMuni.set(m, []);
    byMuni.get(m).push(d);
  }

  const collectedByMuni = new Map();
  for (const [muni, ds] of byMuni) {
    const { sources } = I.sourcesFor(ds[0], records);
    process.stdout.write(`[${muni}] ソース${sources.length}件 収集 ... `);
    const collected = [];
    for (const src of sources) collected.push(await I.collectSource(src, opts));
    collectedByMuni.set(muni, collected);
    console.log(collected.map(c => `${c.source.id}:${c.status}:${c.items.length}`).join(' '));
  }

  // 地区ごとに判定と落選分の解析（通信なし）
  const per = [];
  for (const d of districts) {
    const muni = muniOf(d);
    if (!muni) continue;
    const collected = collectedByMuni.get(muni);
    const { district } = I.sourcesFor(d, records);
    const merged = I.mergeItems(collected, district);
    const { results, inData } = I.classify(merged, records, district);
    const drop = I.analyzeDropped(merged, results, district);
    const bySrc = I.droppedBySource(merged, collected);
    const badDetail = I.failedDetailUrls(collected);
    per.push({ d, muni, district, collected, merged, results, inData, drop, bySrc, badDetail });
  }
  // `collectedByMuni` も返す。detailLimit の打ち切りは**市町村ごとに1回の収集**で
  // 決まるので、地区ごとの `per` から数えると同じ市町村の地区数だけ多重計上になる。
  return { per, records, districts, allDistricts, collectedByMuni };
}

/* ---- b1 の原因分け（district-sweep.js の renderMd と同じ規則） -------------- */
function causeOf(b, badDetail) {
  const fails = b.hits.map(h => (badDetail.get(h.sourceId) || new Map()).get(h.url)).filter(Boolean);
  return fails.length ? [...new Set(fails)].join(' / ') : null;   // null = 一覧に住所が無い
}

const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

main().then(({ per, records, districts, allDistricts, collectedByMuni }) => {
  const L = [];
  const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  /* ---- 0. 対象のラベル（すべて実測値から作る。固定文字列を置かない） ---- */
  const muniDone = [...new Set(per.map(p => p.muni))].sort();
  const allMuniCount = new Set(allDistricts.map(muniOf).filter(Boolean)).size;
  const scopeTitle = onlyMuni ? `${onlyMuni}のみ` : '全市町村';
  const isPartial = districts.length < allDistricts.length;

  L.push(`# 出力に載らなかったソース側の項目 — ${scopeTitle} 2026-08-15`);
  L.push('');
  L.push(`**この md は ${muniDone.length}市町村 / ${districts.length}地区 の結果。** ` +
    (isPartial
      ? `**全体は ${allMuniCount}市町村 / ${allDistricts.length}地区 なので、これは一部です。`
        + `ここに出ていない市町村は「0件」ではなく「回していない」。**`
      : `（\`sweep-*.md\` のある全 ${allMuniCount}市町村 / ${allDistricts.length}地区。絞り込み無し。）`));
  L.push('');
  L.push(`実行: ${stamp}　/　\`${CMD}\``);
  L.push(`出力: \`scripts/${OUT_NAME}\``);
  L.push(`対象市町村: ${muniDone.join(' / ')}`);
  L.push('');
  L.push('**調査のみ。`data/campgrounds.json` は読むだけ。既存の `sweep-*.md` は1つも上書きしていない。**');
  L.push('**判定は `district-sweep.js` の関数をそのまま呼んでいる**（このスクリプトは判定を持たない）。');
  L.push('');
  L.push('`classify()` は地区内のバケットしか見ない。ここに出るのは**そこで落ちた分**で、');
  L.push('`MISSING` / `ORPHAN` / `IN_DATA` のどこにも出てこない項目。');
  L.push('');

  /* ---- 0. 「出していない」を「0件」と読ませない ---- */
  L.push('## 0. この md が出さないもの（0件ではなく、出力対象外）');
  L.push('');
  L.push('**b3（住所なしの項目が地区内バケットに合流した＝漏れていない分）は本スクリプトの出力対象外。**');
  L.push('b3 の節は `district-sweep.js` が書く地区別 `sweep-{地区}.md` の側にのみ存在する。');
  L.push('**ここに b3 の節が無いのは「0件だった」ではなく「数えていない」。**');
  L.push('b1 の件数だけを見ると過大に見えるので、実数が要るときは地区別 md を見ること。');
  L.push('');
  if (isPartial) {
    L.push('**回していない市町村の b1-1 / b1-2 / b2 も同じ。**この md に名前が出てこない市町村は、');
    L.push('検出漏れが無いのではなく**測っていない**。§2 の分類はソース定義から作るので全市町村ぶん出るが、');
    L.push('**§1 / §3 / §4 / §5 / §6 は上の対象市町村ぶんしか無い。**');
    L.push('');
  }

  /* ---- 1. b1-2（詳細404）を最優先で全件 ---- */
  const b12 = [];
  for (const p of per) {
    for (const b of p.drop.b1) {
      const c = causeOf(b, p.badDetail);
      if (!c) continue;
      for (const h of b.hits) {
        const note = (p.badDetail.get(h.sourceId) || new Map()).get(h.url);
        if (note) b12.push({ muni: p.muni, district: p.d, src: h.sourceId, label: h.label, name: b.name, url: h.url, status: note });
      }
    }
  }
  const b12uniq = [...new Map(b12.map(x => [x.muni + '|' + x.url, x])).values()];

  L.push('## 1. b1-2 — 一覧には載っているが、詳細ページが取得できず住所が取れなかった');
  L.push('');
  L.push('**これが原理的な検出漏れ。**一覧に名前があるのに住所が決まらないので地区に入らず、');
  L.push('`MISSING` にも `ORPHAN` にも `IN_DATA` にも出ない。**省略せず全件出す。**');
  L.push('');
  L.push('**★ 404 の意味は分類していない。**「ページが消えた＝施設が無くなった」と');
  L.push('「サイト改装で URL が変わっただけ」の両方がありうる。**ここは事実だけ並べる。**');
  L.push('実在の判定は §6-4（予約・料金が出るか）で別途やること。');
  L.push('');
  if (!b12uniq.length) {
    L.push(`**この md の対象（${muniDone.join(' / ')}）で 0件。**`);
    L.push('**0 の読み方は §2 の表と §6 を見ること。**詳細ページを踏まないソースでは原理的に出ず、');
    L.push('`detailLimit` で打ち切った分も 0 に混ざる。**「404 が無い」ではない。**');
  } else {
    L.push('| 市町村 | ソース | 施設名 | 詳細URL | ステータス |');
    L.push('|---|---|---|---|---|');
    for (const x of b12uniq.sort((a, b) => a.muni.localeCompare(b.muni) || a.name.localeCompare(b.name))) {
      L.push(`| ${esc(x.muni)} | ${esc(x.src)} | ${esc(x.name)} | ${esc(x.url)} | ${esc(x.status)} |`);
    }
    L.push('');
    const uniqUrls = new Set(b12uniq.map(x => x.url));
    L.push(`合計 ${b12uniq.length} 行 / **ユニークURL ${uniqUrls.size} 件**`);
    L.push('（同じ L2 を複数の市町村が共有しているため、同じ URL が複数行に出る）');
  }
  L.push('');

  /* ---- 2. ソースの2分類（b1-2 が出うるか） ---- */
  L.push('## 2. ★「詳細404ゼロ」は安全の証拠か — ソースを2分類する');
  L.push('');
  L.push('**b1-2 は「詳細ページを踏む実装のソース」でしか発生しない。**');
  L.push('一覧だけで完結するソースは、404 が起きようがないので**ゼロなのは当たり前**で、');
  L.push('「その市町村に検出漏れが無い」ことの証拠には**ならない**。');
  L.push('');
  L.push('**この節だけは `MUNI_SOURCES` の定義から作るので、対象を絞っていても全市町村ぶん出る。**');
  L.push('他の節（§1 / §3 / §4 / §5 / §6）とは分母が違うので、突き合わせないこと。');
  L.push('');
  L.push('**「踏む」は上限であって実績ではない。**`listDetail` でも詳細を取りに行くのは');
  L.push('**一覧に住所が無く、かつ URL を持つ項目だけ**で、さらに `detailLimit` で打ち切られる（§6）。');
  L.push('');
  L.push('| 市町村 | ソース | kind | 詳細を踏むか | b1-2 が出うるか |');
  L.push('|---|---|---|---|---|');
  const kindRows = [];
  for (const [muni, entry] of Object.entries(MUNI_SOURCES)) {
    for (const s of entry.sources) {
      const detail = s.kind === 'listDetail';
      kindRows.push({ muni, id: s.id, kind: s.kind, detail });
      L.push(`| ${esc(muni)} | ${esc(s.id)} | ${s.kind} | ${detail ? '**踏む**' : '踏まない' } | ${detail ? '**出うる**' : '原理的に出ない'} |`);
    }
  }
  L.push('');
  const muniDetail = new Map();
  for (const r of kindRows) muniDetail.set(r.muni, (muniDetail.get(r.muni) || false) || r.detail);
  const noDetailMuni = [...muniDetail].filter(([, v]) => !v).map(([k]) => k);
  L.push(`**詳細ページを踏むソースを1つも持たない市町村: ${noDetailMuni.length}件**` +
    (noDetailMuni.length ? ` — ${noDetailMuni.join(' / ')}` : ''));
  L.push('');

  /* ---- 3. b1-1（住所を持たないソース）全件 ---- */
  L.push('## 3. b1-1 — ソースの一覧に住所が無く、他ソースとも合流できなかった');
  L.push('');
  L.push('**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。');
  L.push('**既存レコードと名前が部分一致するかで2つに分けた。判定は変えていない（候補として並べるだけ）。**');
  L.push('名寄せロジックには触っていない。');
  L.push('');
  L.push('**部分一致の基準**: 完全一致 / `namesMatch` / 片方が他方を含む / **最長共通部分文字列が4文字以上**');
  L.push('（汎用語のみの一致は除く）。');
  L.push('**最初は最長共通部分文字列を入れておらず、その状態では「合流しうる 0件」というきれいな結果が出た。**');
  L.push('動機だった「山の中の天然温泉和みの里」対「都留戸沢の森和みの里」は、');
  L.push('**どちらも相手を含まないので `includes` では拾えない。**基準が弱かっただけ（§18-3）。');
  L.push('**偽陽性は出る前提**（人が見る候補一覧なので、取りこぼすより出すほうを選んだ）。');
  L.push('');

  const recName = records.map(r => ({ r, n: sweepNormalizeName(r.name) })).filter(x => x.n);

  /**
   * 名前の部分一致。**最初は「完全一致 / namesMatch / 片方が他方を含む」だけにしていたが、
   * それでは動機になった件が拾えなかった。**
   *
   *   「山の中の天然温泉和みの里」 vs 「都留戸沢の森和みの里」
   *   → どちらも相手を含まないので includes では 0件になり、**「合流しうる 0件」という
   *     きれいな結果が出た。**基準が弱いだけだった（§18-3）。
   *
   * そこで**最長共通部分文字列が4文字以上**を足した。「和みの里」で拾える。
   * **偽陽性は出る前提**（候補として人が見る一覧なので、取りこぼすより出すほうを選ぶ）。
   * ありふれた語だけで一致するのを避けるため、汎用語は共通部分から除く。
   */
  const GENERIC = ['オートキャンプ', 'キャンプ', 'ファミリー', 'グリーン', 'リゾート', 'ランド', 'パーク',
    'ビレッジ', 'village', 'camp', 'サイト', 'フリー', '公園', '高原', '国民宿舎', 'ロッジ', 'コテージ'];
  const lcsLen = (a, b) => {
    let best = '', prev = new Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) {
      const cur = new Array(b.length + 1).fill(0);
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          cur[j] = prev[j - 1] + 1;
          if (cur[j] > best.length) best = a.slice(i - cur[j], i);
        }
      }
      prev = cur;
    }
    return best;
  };
  const partial = name => {
    const n = sweepNormalizeName(name);
    if (!n) return [];
    const out = [];
    for (const x of recName) {
      let how = null;
      if (x.n === n) how = '完全一致';
      else if (namesMatch(x.n, n)) how = 'namesMatch';
      else if (x.n.includes(n) || n.includes(x.n)) how = '片方が他方を含む';
      else {
        const c = lcsLen(x.n, n);
        if (c.length >= 4 && !GENERIC.some(g => c === g || g.includes(c))) how = `共通「${c}」`;
      }
      if (how) out.push({ r: x.r, how });
    }
    return out;
  };

  const b11 = [];
  for (const p of per) {
    for (const b of p.drop.b1) {
      if (causeOf(b, p.badDetail)) continue;
      const srcs = [...new Set(b.hits.map(h => `${h.layer} ${h.sourceId}`))].join(' / ');
      b11.push({ muni: p.muni, district: p.d, name: b.name, srcs, cand: partial(b.name) });
    }
  }
  const b11uniq = [...new Map(b11.map(x => [x.muni + '|' + x.name, x])).values()]
    .sort((a, b) => a.muni.localeCompare(b.muni) || a.name.localeCompare(b.name));
  const mergeable = b11uniq.filter(x => x.cand.length);
  const brandNew = b11uniq.filter(x => !x.cand.length);

  L.push(`**合計 ${b11uniq.length} 件（市町村×名前でユニーク）。合流しうる ${mergeable.length} / 既存に無い ${brandNew.length}。**`);
  L.push('');
  L.push('### 3-1. 既存レコードと名前が部分一致する（＝名寄せ漏れの疑い）');
  L.push('');
  L.push('**同一施設なら、いま MISSING にも IN_DATA にも出ていないのは名寄せの取りこぼし。**');
  L.push('別施設の可能性もあるので、**同一と決めつけないこと。**');
  L.push('');
  if (!mergeable.length) L.push('なし。');
  else {
    L.push('| 市町村 | ソース側の名前 | 出典 | 部分一致した既存レコード | 一致の根拠 |');
    L.push('|---|---|---|---|---|');
    for (const x of mergeable) {
      L.push(`| ${esc(x.muni)} | ${esc(x.name)} | ${esc(x.srcs)} | ${esc(x.cand.map(c => `\`${c.r.id}\` ${c.r.name}（${c.r.address || '住所なし'}）`).join(' / '))} | ${esc([...new Set(x.cand.map(c => c.how))].join(' / '))} |`);
    }
  }
  L.push('');
  L.push('### 3-2. 既存レコードに名前が部分一致しない（＝新規候補になりうる）');
  L.push('');
  L.push('**MISSING に出ていない新規候補。**ただし住所が無いので地区も確定していない。');
  L.push('**投入の可否はここでは決めない**（グランピング専門・宿泊施設・公園は対象外）。');
  L.push('');
  if (!brandNew.length) L.push('なし。');
  else {
    L.push('| 市町村 | ソース側の名前 | 出典 |');
    L.push('|---|---|---|');
    for (const x of brandNew) L.push(`| ${esc(x.muni)} | ${esc(x.name)} | ${esc(x.srcs)} |`);
  }
  L.push('');

  /* ---- 4. b2（件数のみ）＋ b2-b は全件 ---- */
  L.push('## 4. b2 — 住所はあるが地区外');
  L.push('');
  L.push('**大半は正常。**市単位・県単位のソースを大字単位の地区に当てれば必ず出る。');
  L.push('**全件は出さない。**件数と内訳だけ。');
  L.push('');
  L.push('| 地区 | b2 合計 | うち市区町村も違う | **うち市は同じで大字が違う** |');
  L.push('|---|---|---|---|');
  for (const p of per) {
    const same = p.drop.b2.filter(b => b.dropSameCity);
    L.push(`| ${esc(p.d)} | ${p.drop.b2.length} | ${p.drop.b2.length - same.length} | ${same.length ? `**${same.length}**` : '0'} |`);
  }
  L.push('');
  L.push('### 4-1. ソース別の b2 合計（全地区の延べ）');
  L.push('');
  const srcAgg = new Map();
  for (const p of per) for (const r of p.bySrc) {
    if (!srcAgg.has(r.id)) srcAgg.set(r.id, { items: 0, inDist: 0, b1: 0, b2: 0, bad: 0 });
    const a = srcAgg.get(r.id);
    a.items += r.items; a.inDist += r.inDist; a.b1 += r.b1; a.b2 += r.b2;
    if (!r.reconciles) a.bad++;
  }
  L.push('| ソース | 取得（延べ） | 地区内 | b1 | b2 | 突合NG |');
  L.push('|---|---|---|---|---|---|');
  for (const [id, a] of [...srcAgg].sort((x, y) => y[1].b2 - x[1].b2)) {
    L.push(`| ${esc(id)} | ${a.items} | ${a.inDist} | ${a.b1} | ${a.b2} | ${a.bad ? `**⚠ ${a.bad}地区**` : '0'} |`);
  }
  L.push('');

  L.push('### 4-2. ★ 市区町村は同じだが大字が違う（住所誤りの疑いがあるのはここだけ）');
  L.push('');
  L.push('**市単位のソースを大字単位の地区に当てた場合、正常でもここに入る。**');
  L.push('疑うべきは「その市の別の大字ではなく、本来この地区のはず」のもの。**全件出す。**');
  L.push('');
  const b2b = [];
  for (const p of per) for (const b of p.drop.b2.filter(x => x.dropSameCity)) {
    b2b.push({ district: p.d, name: b.name, addr: b.addresses.join(' / '),
      srcs: [...new Set(b.hits.map(h => `${h.layer} ${h.sourceId}`))].join(' / ') });
  }
  if (!b2b.length) L.push('なし。');
  else {
    L.push('| 地区 | 名前 | 住所 | 出典 |');
    L.push('|---|---|---|---|');
    for (const x of b2b) L.push(`| ${esc(x.district)} | ${esc(x.name)} | ${esc(x.addr)} | ${esc(x.srcs)} |`);
  }
  L.push('');

  /* ---- 5. 判定が動いていないことの確認 ---- */
  L.push('## 5. 既存の判定と一致しているか');
  L.push('');
  L.push('各地区の `MISSING` / `ORPHAN` / `IN_DATA` の件数を、既存 `sweep-*.md` の');
  L.push('冒頭の表と突き合わせた。**このスクリプトは判定を持たず、本体の関数を呼んでいるだけ**なので、');
  L.push('ここが食い違うならソース側かデータ側が変わったということ。');
  L.push('');
  L.push('| 地区 | MISSING | ORPHAN | IN_DATA | 既存 md | 一致 |');
  L.push('|---|---|---|---|---|---|');
  let mismatch = 0;
  for (const p of per) {
    const md = fs.readFileSync(path.join(__dirname, `sweep-${p.d}.md`), 'utf8');
    const pick = re => { const m = md.match(re); return m ? Number(m[1]) : null; };
    const oldM = pick(/\|\s*\*\*MISSING\*\*[^|]*\|\s*\*\*(\d+)\*\*\s*\|/);
    const oldO = pick(/\|\s*ORPHAN[^|]*\|\s*(\d+)\s*\|/);
    const oldI = pick(/\|\s*IN_DATA[^|]*\|\s*(\d+)\s*\|/);
    const nm = p.results.filter(r => r.kind === 'MISSING').length;
    const no = p.results.filter(r => r.kind === 'ORPHAN').length;
    const ni = p.results.filter(r => r.kind === 'IN_DATA').length;
    const ok = nm === oldM && no === oldO && ni === oldI;
    if (!ok) mismatch++;
    L.push(`| ${esc(p.d)} | ${nm} | ${no} | ${ni} | ${oldM}/${oldO}/${oldI} | ${ok ? 'OK' : '**❌ 不一致**'} |`);
  }
  L.push('');
  L.push(mismatch
    ? `> **❌ ${mismatch}地区で不一致。**この監査の数字を読む前に原因を特定すること。`
    : '> **全地区で一致。**この監査は既存の判定を1件も動かしていない。');
  L.push('');

  /* ---- 6. detailLimit の打ち切り（0でも節ごと出す） ---- */
  L.push('## 6. `detailLimit` の打ち切り — 詳細を踏まずに終わった件数');
  L.push('');
  L.push('**打ち切られた項目は住所が取れないまま b1-1 に落ちる。**');
  L.push('取得を試して失敗した b1-2 とは原因が違う（**そもそも取りに行っていない**）のに、');
  L.push('これまで `collectSource` の `notes` に日本語1行が出るだけで、どの集計にも出ていなかった。');
  L.push('');
  L.push('**この節は打ち切り0でも必ず出す。**節ごと消すと「打ち切りを見ていない」と区別が付かない。');
  L.push('');

  const budgets = new Map();   // ソースid → 打ち切り実績（市町村ごとに1回の収集で数える）
  for (const [muni, collected] of collectedByMuni) {
    for (const c of collected) {
      if (!c.detailBudget) continue;   // listDetail でない＝詳細を踏まない実装。0ではない
      const id = c.source.id;
      if (!budgets.has(id)) budgets.set(id, { limit: c.detailBudget.limit, targets: 0, fetched: 0, skipped: 0, munis: [] });
      const a = budgets.get(id);
      a.targets += c.detailBudget.targets;
      a.fetched += c.detailBudget.fetched;
      a.skipped += c.detailBudget.skipped;
      if (c.detailBudget.skipped) a.munis.push(`${muni}(${c.detailBudget.skipped})`);
    }
  }
  const totalSkipped = [...budgets.values()].reduce((s, a) => s + a.skipped, 0);
  const hitLimit = [...budgets].filter(([, a]) => a.skipped);

  const noDetailIds = [...new Set(
    [...collectedByMuni.values()].flat().filter(c => !c.detailBudget).map(c => c.source.id))].sort();

  if (!budgets.size) {
    L.push('**対象の市町村に `listDetail` のソースが1本も無い。**打ち切りは原理的に起きない。');
  } else {
    L.push('| ソース | limit | 詳細対象（延べ） | 実際に踏んだ | **打ち切り** | 打ち切った市町村 |');
    L.push('|---|---:|---:|---:|---:|---|');
    for (const [id, a] of [...budgets].sort((x, y) => y[1].skipped - x[1].skipped || x[0].localeCompare(y[0]))) {
      L.push(`| ${esc(id)} | ${a.limit} | ${a.targets} | ${a.fetched} | ${a.skipped ? `**${a.skipped}**` : '0'} | ${esc(a.munis.join(' / ')) || '—'} |`);
    }
    L.push('');
    L.push(totalSkipped
      ? `**⚠ 打ち切り合計 ${totalSkipped}件（${hitLimit.length}ソース）。この分は住所を取りに行っていないので、`
        + 'b1-2 にも b1-1 の「取れなかった理由」にも正しく出ていない。**`detailLimit` を上げて再実行すること。'
      : '**打ち切り 0件。**対象のソースはすべて上限に達しておらず、詳細対象は全件取りに行っている。');
  }
  L.push('');
  L.push(`**詳細を踏まない実装のソース（打ち切りの概念が無い）: ${noDetailIds.length ? noDetailIds.join(' / ') : 'なし'}。**`);
  L.push('この行が空でも「打ち切り0」ではなく「対象外」。分類は §2 を見ること。');
  L.push('');

  fs.writeFileSync(OUT, L.join('\n'), 'utf8');
  console.log(`\n→ ${OUT}`);
  console.log(`対象: ${muniDone.length}市町村 / ${districts.length}地区（全体 ${allMuniCount}市町村 / ${allDistricts.length}地区）${isPartial ? ' ★一部' : ''}`);
  console.log(`b1-2 ${b12uniq.length}行 / b1-1 ${b11uniq.length}件（合流しうる ${mergeable.length} / 新規 ${brandNew.length}）/ b2-b ${b2b.length}件 / detailLimit打ち切り ${totalSkipped}件 / 判定不一致 ${mismatch}地区`);
}).catch(e => { console.error(e); process.exit(1); });
