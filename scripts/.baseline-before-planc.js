/**
 * **案C実装前の基準線を固定する。**実装後にこれと比べる。
 *
 * **ネットを踏まない。**既存の `sweep-*.md` と `data/campgrounds.json` と
 * 既存の監査 md から数字を集めるだけ。判定も実装も変えない。
 *
 *   node scripts/.baseline-before-planc.js
 *   → scripts/baseline-before-planc-2026-08-16.md
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES, _internal: I, sweepNormalizeName } = require('./district-sweep.js');

const SKIP = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;
const OUT = path.join(__dirname, 'baseline-before-planc-2026-08-16.md');

/** sweep md から MISSING/IN_DATA/ORPHAN を読む */
function readSweep(file) {
  const body = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const sec = h => body.split('\n## ').find(x => x.startsWith(h));
  const missing = [...(sec('MISSING') || '').matchAll(/^### \d+\.\s*(.+)$/gm)].map(m => m[1].trim());
  const conf = [...(sec('MISSING') || '').matchAll(/\*\*confidence\*\*:\s*(HIGH|MID|LOW)/g)].map(m => m[1]);
  const orphan = [...(sec('ORPHAN') || '').matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(m => m[1]);
  const inData = [...(sec('IN_DATA') || '').matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(m => m[1]);
  // 冒頭のサマリ表からも拾う（節の書式が違う版があるため）
  const sum = {};
  for (const [, k, v] of body.matchAll(/^\|\s*\*?\*?(MISSING|IN_DATA|ORPHAN)[^|]*\|\s*\*?\*?(\d+)/gm)) sum[k] = Number(v);
  return { missing, conf, orphan, inData, sum };
}

const files = fs.readdirSync(__dirname).filter(f => /^sweep-.+\.md$/.test(f) && !SKIP.test(f.replace(/^sweep-|\.md$/g, '')));
const rows = files.map(f => ({ district: f.replace(/^sweep-|\.md$/g, ''), ...readSweep(f) })).sort((a, b) => a.district.localeCompare(b.district, 'ja'));

const totMissing = rows.reduce((a, r) => a + r.missing.length, 0);
const totOrphan = rows.reduce((a, r) => a + (r.sum.ORPHAN ?? r.orphan.length), 0);
const totIn = rows.reduce((a, r) => a + (r.sum.IN_DATA ?? r.inData.length), 0);
const confTot = rows.flatMap(r => r.conf).reduce((m, c) => (m[c] = (m[c] || 0) + 1, m), {});

/** 地区キーの構造 */
const parsed = new Map();
for (const r of rows) { try { parsed.set(r.district, I.parseDistrict(r.district)); } catch { } }
const muniKeyOf = d => { const p = parsed.get(d); return p ? (p.gun || '') + p.city + (p.ward || '') : null; };
const overlaps = [];
for (const a of rows) for (const b of rows) {
  const pa = parsed.get(a.district), pb = parsed.get(b.district);
  if (a === b || !pa || !pb || muniKeyOf(a.district) !== muniKeyOf(b.district)) continue;
  const oa = pa.oaza || '', ob = pb.oaza || '';
  if (ob.startsWith(oa) && oa.length < ob.length) overlaps.push([a.district, b.district]);
}

/** ユニーク（市区町村 × 正規化名） */
const flat = rows.flatMap(r => r.missing.map(n => ({ d: r.district, key: muniKeyOf(r.district) + '|' + (sweepNormalizeName(n) || n) })));
const uniq = new Set(flat.map(x => x.key));

/** データ側 */
const recs = I.loadRecords();
const byStatus = recs.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});

/** 既存の監査 md から数字を引く（あれば） */
/** dropped-buckets-all の §4 の地区表だけを合計する（§4-1 のソース表を巻き込まない） */
function sumB2() {
  const p = path.join(__dirname, 'dropped-buckets-all-2026-08.md');
  if (!fs.existsSync(p)) return { tot: '?', other: '?', same: '?' };
  const sec = (fs.readFileSync(p, 'utf8').split('\n## ').find(x => x.startsWith('4. b2')) || '').split('\n### 4-1')[0];
  let tot = 0, other = 0, same = 0;
  for (const m of sec.matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|/gm)) {
    tot += +m[2]; other += +m[3]; same += +m[4];
  }
  return { tot, other, same };
}

function grab(file, re) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, 'utf8').match(re);
  return m ? m[1] : null;
}

const L = [];
L.push('# 案C実装前の基準線 — 2026-08-16');
L.push('');
L.push('**実装後にこれと比べる。**ネットを踏まずに、既存の `sweep-*.md` と `data/campgrounds.json` から集めた。');
L.push('');
L.push('生成: `node scripts/.baseline-before-planc.js`');
L.push('');
L.push('## 1. 全体');
L.push('');
L.push('| | 値 |');
L.push('|---|---:|');
L.push(`| 地区数（sweep md） | **${rows.length}** |`);
L.push(`| MUNI_SOURCES のキー数 | **${Object.keys(MUNI_SOURCES).length}** |`);
L.push(`| 地区キーを市区町村に畳んだ数（区を分ける） | **${new Set(rows.map(r => muniKeyOf(r.district)).filter(Boolean)).size}** |`);
L.push(`| **MISSING（延べ）** | **${totMissing}** |`);
L.push(`| MISSING（ユニーク: 市区町村×正規化名） | **${uniq.size}** |`);
L.push(`| 差（重複） | ${totMissing - uniq.size} |`);
L.push(`| IN_DATA | ${totIn} |`);
L.push(`| ORPHAN | ${totOrphan} |`);
L.push(`| confidence HIGH / MID / LOW | ${confTot.HIGH || 0} / ${confTot.MID || 0} / ${confTot.LOW || 0} |`);
L.push(`| 包含関係のある地区ペア | **${overlaps.length}** 組 |`);
L.push('');
L.push('### データ側');
L.push('');
L.push(`レコード ${recs.length}件 — ` + Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(' / '));
L.push('');
L.push('## 2. 他の監査からの基準値');
L.push('');
L.push('| 指標 | 値 | 出典 |');
L.push('|---|---:|---|');
const b2 = sumB2();
L.push(`| **b2（地区外の項目・延べ）** | **${b2.tot}** | dropped-buckets-all-2026-08.md §4 |`);
L.push(`| うち市区町村も違う | ${b2.other} | 同上 |`);
L.push(`| **うち市は同じで大字が違う**（案Cで効く分） | **${b2.same}** | 同上 |`);
L.push('| **126件**（どの登録地区にも入らない住所） | 126 | §19-5 / `.audit-district-gap.js` |');
L.push(`| banchi-mismatch 素の一覧 | ${grab('banchi-mismatch-2026-08.md', /素の一覧 \| (\d+)/) || '?'} | banchi-mismatch-2026-08.md |`);
L.push(`| うち人が見る（無害でない） | ${grab('banchi-mismatch-2026-08.md', /人が見る[^|]*\| \*\*(\d+)/) || '?'} | 同上 |`);
L.push('');
L.push('> **b2 と banchi-mismatch は md からの抽出。**書式が変わっていたら再計算すること。');
L.push('> 126件は §19-5 の実測値（`.audit-district-gap.js` を再実行すれば出る）。');
L.push('');
L.push('## 3. 包含関係のある地区ペア（案Cで消える）');
L.push('');
L.push('| 広い地区 | 狭い地区 |');
L.push('|---|---|');
overlaps.forEach(([a, b]) => L.push(`| ${a} | ${b} |`));
L.push('');
L.push('## 4. 地区別（全' + rows.length + '地区）');
L.push('');
L.push('| 地区 | MISSING | IN_DATA | ORPHAN |');
L.push('|---|---:|---:|---:|');
for (const r of rows) {
  L.push(`| ${r.district} | ${r.missing.length} | ${r.sum.IN_DATA ?? r.inData.length} | ${r.sum.ORPHAN ?? r.orphan.length} |`);
}
L.push('');
L.push('## 5. 実装後に確かめること');
L.push('');
L.push('- 地区数が **' + rows.length + ' → 18**（MUNI_SOURCES のキー単位）になる');
L.push('- **包含ペアが ' + overlaps.length + ' → 0**');
L.push('- MISSING のユニークが **' + uniq.size + ' から大きく減らない**（減ったら検出力が落ちている）');
L.push('- **126件**が0に近づく（地区がレコード由来でなくなるため）');
L.push('- 大字検査が**5件前後**出る（§19-5。判定には使わない）');

fs.writeFileSync(OUT, L.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(__dirname, '.baseline-before-planc.json'),
  JSON.stringify({ rows: rows.map(r => ({ district: r.district, missing: r.missing.length, names: r.missing, inData: r.sum.IN_DATA ?? r.inData.length, orphan: r.sum.ORPHAN ?? r.orphan.length })), totMissing, uniq: uniq.size, totIn, totOrphan, confTot, overlaps }, null, 1), 'utf8');

console.log(`地区 ${rows.length} / MISSING 延べ ${totMissing} / ユニーク ${uniq.size} / IN_DATA ${totIn} / ORPHAN ${totOrphan}`);
console.log(`包含ペア ${overlaps.length} 組 / confidence HIGH ${confTot.HIGH || 0} MID ${confTot.MID || 0} LOW ${confTot.LOW || 0}`);
console.log('→ ' + path.relative(path.join(__dirname, '..'), OUT));
// **基準線が汚れていないかを自分で確かめる。**
// 2026-08-16、`--district` を1本走らせただけで77地区になり ORPHAN が 48→49 に動いた。
// 凍結した76本に新しい sweep md が混ざると、比較の土台が静かにずれる。
const EXPECT = { districts: 76, missing: 214, uniq: 184, inData: 103, orphan: 48, pairs: 7 };
const got = { districts: rows.length, missing: totMissing, uniq: uniq.size, inData: totIn, orphan: totOrphan, pairs: overlaps.length };
const drift = Object.keys(EXPECT).filter(k => EXPECT[k] !== got[k]);
if (drift.length) {
  console.error('\n⚠ **基準線がずれている。**案C実装前の凍結値と違う:');
  drift.forEach(k => console.error(`   ${k}: 期待 ${EXPECT[k]} / 実際 ${got[k]}`));
  console.error('   sweep-*.md が増減していないか確認すること（検証用に走らせた地区 md が残っていないか）。');
  process.exitCode = 1;
}
