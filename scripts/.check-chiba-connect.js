/**
 * 千葉を接続したことで**既存18市区町村が1件も動いていない**ことを確かめる。
 *
 * ## なぜスイープし直さないか
 *
 * 走らせ直すと1時間かかるうえ、**差が出たときに「接続のせい」か「ソース側が変わったせい」か
 * 切り分けられない。**ネットを1回も踏まずに、
 *
 *   いまのコードが返す `sourcesFor(市区町村)` の中身
 *     vs
 *   接続前に生成された `sweep-<市区町村>.md` に記録されているソース一覧
 *
 * を突き合わせる。**ソースが1本も変わっていなければ、判定も変わりようがない。**
 * （`classify` は `sourcesFor` の結果と `records` にしか依存しない）
 *
 * ## 何を見るか
 *
 *   1. 既存18の `sources` の **id と順序**が同じか
 *   2. 既存18の `pref` / `l1NotFound` の数が同じか
 *   3. 千葉8市町のキーが**既存と衝突していない**か
 *   4. 千葉の8市町が `sourcesFor` から正しく引けるか（`registered: true`）
 *
 * 実行: `node scripts/.check-chiba-connect.js`
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES, _internal: I } = require('./district-sweep.js');
const { chibaMuniSources } = require('./chiba-sources.js');

const CHIBA = Object.keys(chibaMuniSources());
const EXISTING = Object.keys(MUNI_SOURCES).filter(m => !CHIBA.includes(m));

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

const records = I.loadRecords();

console.log('\n■ 既存18市区町村のソースが1本も変わっていない');
console.log(`  （接続前に生成された sweep-<市区町村>.md のソース表と突き合わせる）`);
const moved = [];
let compared = 0;
for (const m of EXISTING) {
  const p = path.join(__dirname, `sweep-${m}.md`);
  if (!fs.existsSync(p)) { moved.push(`${m}: md が無く比較できない`); continue; }
  const body = fs.readFileSync(p, 'utf8');
  const sec = body.split('\n## ').find(x => x.startsWith('ソースの取得結果')) || '';
  // ソース表は「取りに行ったソース」と「L1_NOT_FOUND（探したが無い）」を1つの表に出す。
  // **前者だけを比べる。**後者は `sources` ではなく `l1NotFound` なので、
  // 混ぜると「本数が違う」という嘘の差分が出る（最初にこれを踏んだ）。
  const rows = [...sec.matchAll(/^\|\s*(L[123])\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm)];
  const fromMd = rows.filter(x => !/L1_NOT_FOUND/.test(x[3])).map(x => x[2].replace(/\\/g, ''));
  const mdNotFound = rows.filter(x => /L1_NOT_FOUND/.test(x[3])).length;
  const now = I.sourcesFor(m, records);
  const fromCode = now.sources.map(s => s.label.replace(/\\/g, ''));
  compared++;
  if (JSON.stringify(fromMd) !== JSON.stringify(fromCode)) {
    moved.push(`${m}: md ${fromMd.length}本 / いま ${fromCode.length}本`);
    const only = (a, b) => a.filter(x => !b.includes(x));
    if (only(fromMd, fromCode).length) moved.push(`    md にだけ: ${only(fromMd, fromCode).join(' / ')}`);
    if (only(fromCode, fromMd).length) moved.push(`    いまだけ: ${only(fromCode, fromMd).join(' / ')}`);
  }
  // l1NotFound は md 側が「+1（県オープンデータ）」を足して出す作りなので、そのぶん見込む
  if (mdNotFound !== now.l1NotFound.length + 1) {
    moved.push(`${m}: l1NotFound md ${mdNotFound} / いま ${now.l1NotFound.length}+1`);
  }
}
check(`ソースの並びが md と一致（${compared}市区町村を比較）`, moved.length === 0, moved.slice(0, 6).join(' | ') || '全一致');

console.log('\n■ 千葉のキーが既存と衝突していない');
const dup = CHIBA.filter(k => EXISTING.includes(k));
check('衝突なし', dup.length === 0, dup.join(' / ') || `既存${EXISTING.length} + 千葉${CHIBA.length} = ${Object.keys(MUNI_SOURCES).length}`);
check('--all の対象が 18 → 26 になっている', Object.keys(MUNI_SOURCES).length === 26,
  `${Object.keys(MUNI_SOURCES).length}件`);

console.log('\n■ 千葉8市町が sourcesFor から引ける');
const bad = [];
for (const m of CHIBA) {
  const r = I.sourcesFor(m, records);
  if (!r.registered) bad.push(`${m}: registered=false`);
  if (r.pref !== '千葉') bad.push(`${m}: pref=${r.pref}`);
  if (!r.sources.length) bad.push(`${m}: sources 0本`);
  console.log(`    ${m.padEnd(7)} L1 ${r.sources.filter(s => s.layer === 'L1').length} / L2 ${r.sources.filter(s => s.layer === 'L2').length}` +
    ` / l1NotFound ${r.l1NotFound.length}  ${r.sources.map(s => s.id).join(',')}`);
}
check('8市町とも registered で pref=千葉', bad.length === 0, bad.join(' / ') || 'OK');

console.log('\n■ 千葉には PREF_SOURCES が無い（県単位の L3 を持たない）');
const nb = I.sourcesFor('南房総市', records);
check('キャンナビ・ウォーカープラスが付いていない',
  !nb.sources.some(s => /japancamp|walkerplus/.test(s.id)),
  nb.sources.map(s => s.id).join(','));
console.log('    ※ 既存3県は県単位の L3 が付く。**千葉だけ層が薄い**ので、');
console.log('       MISSING の少なさを「掲載漏れが少ない」と読まないこと。');

console.log('\n■ データ側に千葉のレコードはまだ1件も無い');
const chibaRecs = records.filter(r => r.prefecture === '千葉' || (r.address || '').includes('千葉県'));
check('0件（＝ ORPHAN は構造上0、IN_DATA も0になる）', chibaRecs.length === 0, `${chibaRecs.length}件`);

const ng = results.filter(r => !r.ok);
console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
if (ng.length) process.exitCode = 1;
