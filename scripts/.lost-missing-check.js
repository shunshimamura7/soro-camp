/**
 * 案C後に MISSING から消えた項目の行き先を1件ずつ分類する。**使い捨ての確認用。**
 *
 * 「MISSING のユニークが減っていないか」だけでは足りない。
 * **減った分が「誤検出が消えた」なのか「検出力が落ちた」なのか**を分けないと、
 * §19-5 の合格条件（検出力が落ちていないこと）を確かめたことにならない。
 */
const fs = require('fs');
const { MUNI_SOURCES, _internal: I, sweepNormalizeName: N } = require('./district-sweep.js');

const SNAP = JSON.parse(fs.readFileSync(__dirname + '/.baseline-before-planc.json', 'utf8'));
const city = d => { try { return I.parseDistrict(d).city; } catch { return null; } };
const missingOf = d => {
  const b = fs.readFileSync(`${__dirname}/sweep-${d}.md`, 'utf8');
  const s = b.split('\n## ').find(x => x.startsWith('MISSING')) || '';
  return [...s.matchAll(/^### \d+\.\s*(.+)$/gm)].map(m => m[1].trim());
};

const newKeys = new Set();
for (const d of Object.keys(MUNI_SOURCES)) for (const n of missingOf(d)) newKeys.add(city(d) + '|' + (N(n) || n));

const seen = new Set();
const lost = [];
for (const r of SNAP.rows) for (const n of r.names) {
  const c = city(r.district), k = c + '|' + (N(n) || n);
  if (newKeys.has(k) || seen.has(k)) continue;
  seen.add(k);
  lost.push({ c, n });
}

const tally = {};
for (const x of lost) {
  const b = fs.readFileSync(`${__dirname}/sweep-${x.c}.md`, 'utf8');
  const sec = h => b.split('\n## ').find(y => y.startsWith(h)) || '';
  const inMissingAlias = sec('MISSING').split('\n').some(l => l.startsWith('- **表記ゆれ**') && l.includes(x.n));
  const v = sec('IN_DATA').includes(x.n) ? 'IN_DATA に変わった（大字の壁が外れて突合できた）'
    : inMissingAlias ? '別表記として1件に統合された'
      : b.includes(x.n) ? 'md のどこかに残っている（落選側。要確認）'
        : '★ どこにも出てこない';
  (tally[v] = tally[v] || []).push(`${x.c} ${x.n}`);
}

console.log(`案C後に MISSING から消えた: ${lost.length}件`);
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${k}: ${v.length}件`);
  v.forEach(s => console.log('    ' + s));
}
