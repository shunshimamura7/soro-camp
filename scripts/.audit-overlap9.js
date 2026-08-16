/**
 * 19-8 の「重なり9件」を、(a)/(b)/案C の3通りで数え直す。**判定も実装も変えない。数えるだけ。**
 *
 * 既存の `sweep-*.md` から MISSING を読む（ネットを踏まない）。
 *
 *   現状   … 76地区。市町村どまりキーと大字地区が共存し、同じ施設が2地区で MISSING に出る
 *   (a)    … 重なっている**大字地区のほうを外す**（市町村どまりに寄せる）
 *   (b)    … 重なりを許したまま**集計時に重複排除**する
 *   案C    … 地区を**市町村単位**にする（76 → 18）。大字は判定に使わない
 *
 * 実行: `node scripts/.audit-overlap9.js`
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES, _internal: I } = require('./district-sweep.js');

const SKIP = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;

/** sweep-<地区>.md から MISSING の施設名を拾う */
function readSweeps() {
  const out = [];
  for (const f of fs.readdirSync(__dirname)) {
    const m = f.match(/^sweep-(.+)\.md$/);
    if (!m || SKIP.test(m[1])) continue;
    const district = m[1];
    const body = fs.readFileSync(path.join(__dirname, f), 'utf8');
    // MISSING の節は `### N. 施設名` の見出しで並ぶ（表ではない）
    const sec = body.split('\n## ').find(x => /^MISSING/.test(x));
    if (!sec) { out.push({ district, names: [] }); continue; }
    const names = [...sec.matchAll(/^### \d+\.\s*(.+)$/gm)].map(m => m[1].trim());
    out.push({ district, names });
  }
  return out;
}

const sweeps = readSweeps();
const districts = sweeps.map(s => s.district);

/** 地区キー -> {gun,city,ward,oaza} */
const parsed = new Map();
for (const d of districts) {
  try { parsed.set(d, I.parseDistrict(d)); } catch { /* パースできないものは飛ばす */ }
}

/** その地区の市区町村（区まで含む）キー */
const muniKeyOf = d => {
  const p = parsed.get(d);
  if (!p) return null;
  return (p.gun || '') + p.city + (p.ward || '');
};

/* ── 重なりの構造を出す ─────────────────────────────── */
console.log('地区数:', districts.length, '/ MISSING 延べ:', sweeps.reduce((a, s) => a + s.names.length, 0));

/** 同じ市区町村の中で、大字が空の地区（＝その市を丸ごと見る地区）*/
const wholeMuni = districts.filter(d => parsed.get(d) && !parsed.get(d).oaza);
console.log('\n大字なし地区（市町村/区どまり）:', wholeMuni.length, '本');
wholeMuni.forEach(d => console.log('   ' + d));

/** 重なり: 同じ市区町村で、片方の大字が他方の前方一致（空を含む） */
const overlaps = [];
for (const a of districts) for (const b of districts) {
  if (a === b) continue;
  const pa = parsed.get(a), pb = parsed.get(b);
  if (!pa || !pb || muniKeyOf(a) !== muniKeyOf(b)) continue;
  const oa = pa.oaza || '', ob = pb.oaza || '';
  // a が b を含む（a のほうが広い）
  if (ob.startsWith(oa) && oa.length < ob.length) overlaps.push([a, b]);
}
console.log('\n包含関係のある地区ペア:', overlaps.length, '組');
overlaps.forEach(([a, b]) => console.log('   ' + a + '  ⊃  ' + b));

/* ── 3案での MISSING 件数 ───────────────────────────── */
const norm = n => (I.sweepNormalizeName ? I.sweepNormalizeName(n) : n) || n;

/** 現状: 延べ */
const cur = sweeps.flatMap(s => s.names.map(n => ({ d: s.district, key: muniKeyOf(s.district) + '|' + norm(n), name: n })));

/** 二重計上: 同じ (市区町村, 正規化名) が、包含関係にある2地区の両方に出ているもの */
const byKey = new Map();
for (const x of cur) {
  if (!byKey.has(x.key)) byKey.set(x.key, []);
  byKey.get(x.key).push(x);
}
const dup = [...byKey.values()].filter(v => v.length > 1);
const overlapPair = new Set(overlaps.map(([a, b]) => a + '||' + b));
const dupByOverlap = dup.filter(v => {
  for (const x of v) for (const y of v) {
    if (overlapPair.has(x.d + '||' + y.d) || overlapPair.has(y.d + '||' + x.d)) return true;
  }
  return false;
});

console.log('\n===== 重複の内訳 =====');
console.log('MISSING 延べ           :', cur.length);
console.log('ユニーク（市区町村×名前）:', byKey.size);
console.log('差（重複）             :', cur.length - byKey.size);
console.log('  うち**地区の包含由来** :', dupByOverlap.reduce((a, v) => a + v.length - 1, 0), `（${dupByOverlap.length}施設）`);
console.log('  残り（同地区内の同名等）:', (cur.length - byKey.size) - dupByOverlap.reduce((a, v) => a + v.length - 1, 0));
console.log('\n包含由来の重複:');
dupByOverlap.forEach(v => console.log('   ' + v[0].name + '  →  ' + v.map(x => x.d).join('  /  ')));

/* ── (a) 広いほうを残して狭い大字地区を外す ──────────── */
const dropForA = new Set(overlaps.map(([, b]) => b));
const aList = districts.filter(d => !dropForA.has(d));
const aCur = cur.filter(x => !dropForA.has(x.d));
console.log('\n===== (a) 重なっている大字地区を外す =====');
console.log('地区数  :', districts.length, '→', aList.length, `（-${districts.length - aList.length}）`);
console.log('外す地区:', [...dropForA].join(' / ') || 'なし');
console.log('MISSING 延べ:', cur.length, '→', aCur.length, `（-${cur.length - aCur.length}）`);
console.log('ユニーク    :', byKey.size, '→', new Set(aCur.map(x => x.key)).size);

/* ── (b) 重なりを許して集計時に重複排除 ───────────────── */
console.log('\n===== (b) 集計時に重複排除 =====');
console.log('地区数  :', districts.length, '（変えない）');
console.log('MISSING 延べ:', cur.length, '（変えない。地区 md はそのまま）');
console.log('集計値      :', byKey.size, `（延べから -${cur.length - byKey.size}）`);

/* ── 案C: 市町村単位 ─────────────────────────────── */
const muniSet = new Set(districts.map(muniKeyOf).filter(Boolean));
console.log('\n===== 案C: 地区を市町村単位にする =====');
console.log('地区数  :', districts.length, '→', muniSet.size);
console.log('**包含関係のある地区ペア: 0組**（大字を持つ地区が無くなるため）');
console.log('MISSING の二重計上（包含由来）:', dupByOverlap.reduce((a, v) => a + v.length - 1, 0), '→ **0**');
console.log('\n案Cの市町村一覧:');
[...muniSet].sort().forEach(m => console.log('   ' + m));
