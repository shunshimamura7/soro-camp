/**
 * 調査用の使い捨てスクリプト（読み取り専用）。
 * 既存 sweep-*.md の「ソースの取得結果」表から、じゃらん行を列名で引く。
 * §18-3 の轍を踏まないため、位置決め打ちはしない。解釈できない見出しなら throw。
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES } = require('./district-sweep.js');

const dir = __dirname;

// --- 1. コード側: じゃらんを持つ市町村 -------------------------------------
console.log('=== MUNI_SOURCES で jalan を持つ市町村 ===');
const withJalan = [];
for (const [muni, entry] of Object.entries(MUNI_SOURCES)) {
  const j = entry.sources.filter(s => s.id === 'jalan');
  if (j.length) withJalan.push({ muni, pref: entry.pref, labels: j.map(s => s.label) });
}
console.log(`${withJalan.length} / ${Object.keys(MUNI_SOURCES).length} 市町村`);
for (const w of withJalan) console.log(`  ${w.muni}(${w.pref}) ${w.labels.join(' | ')}`);

// --- 2. md 側: 実測の取得件数 ----------------------------------------------
function parseSourceTable(md, file) {
  const lines = md.split('\n');
  const i = lines.findIndex(l => /^\|\s*層\s*\|/.test(l));
  if (i < 0) return null;
  const head = lines[i].split('|').slice(1, -1).map(s => s.trim());
  const col = name => {
    const k = head.indexOf(name);
    if (k < 0) throw new Error(`${file}: 見出し「${name}」が無い / 実際: ${head.join(' , ')}`);
    return k;
  };
  const c = {
    layer: col('層'), src: col('ソース'), status: col('状態'),
    got: col('取得件数'), here: col('うちこの地区'),
  };
  const rows = [];
  for (let k = i + 2; k < lines.length; k++) {
    if (!/^\|/.test(lines[k])) break;
    const cells = lines[k].split('|').slice(1, -1).map(s => s.trim());
    rows.push({
      layer: cells[c.layer], src: cells[c.src], status: cells[c.status],
      got: cells[c.got], here: cells[c.here],
    });
  }
  return rows;
}

console.log('\n=== sweep-*.md のじゃらん行（実測） ===');
const files = fs.readdirSync(dir).filter(f => /^sweep-.*\.md$/.test(f));
let tot = { files: 0, got: 0, here: 0 };
const perMuni = new Map();
for (const f of files.sort()) {
  const md = fs.readFileSync(path.join(dir, f), 'utf8');
  let rows;
  try { rows = parseSourceTable(md, f); } catch (e) { console.log(`  !! ${f}: ${e.message}`); continue; }
  if (!rows) continue;
  const j = rows.filter(r => /じゃらん/.test(r.src));
  if (!j.length) continue;
  tot.files++;
  for (const r of j) {
    const got = Number(r.got), here = Number(r.here);
    if (Number.isFinite(got)) tot.got += got;
    if (Number.isFinite(here)) tot.here += here;
    const muni = (r.src.match(/じゃらん観光ガイド\s+(\S+?)（/) || [])[1] || '?';
    if (!perMuni.has(muni)) perMuni.set(muni, { got: 0, here: 0, files: 0 });
    const p = perMuni.get(muni);
    p.got += Number.isFinite(got) ? got : 0;
    p.here += Number.isFinite(here) ? here : 0;
    p.files++;
    console.log(`  ${f.replace(/^sweep-|\.md$/g, '').padEnd(30)} ${r.status.padEnd(6)} 取得${String(r.got).padStart(4)} / この地区${String(r.here).padStart(4)}`);
  }
}
console.log(`\nじゃらん行を持つ md: ${tot.files} 本 / 取得計 ${tot.got} / うちこの地区 ${tot.here}`);

console.log('\n=== 市町村別の合計（地区mdの延べ） ===');
for (const [muni, p] of [...perMuni].sort((a, b) => b[1].got - a[1].got)) {
  console.log(`  ${muni.padEnd(10)} md${String(p.files).padStart(3)}本  取得計${String(p.got).padStart(5)}  この地区計${String(p.here).padStart(4)}`);
}

// --- 3. addressKnown が使われているか --------------------------------------
const src = fs.readFileSync(path.join(dir, 'district-sweep.js'), 'utf8');
const n = (src.match(/addressKnown/g) || []).length;
console.log(`\naddressKnown の出現回数: ${n}（1なら代入のみ＝どこからも読まれていない）`);
