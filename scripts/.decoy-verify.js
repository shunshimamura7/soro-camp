/**
 * §5 突合パーサの偽ゼロ検証（§18-3 の3回目に対する「答えが分かっている入力」）。
 *
 * `sweep-都留市.md` の**コピー**にデコイ表を仕込んで、旧実装と新実装に同じ入力を通す。
 * **本物のファイルは読むだけ。書き換えない。**
 *
 * 検証は両方向。
 *   (a) 誤った値のデコイ … 旧は ❌ を出す（＝今回の事故）／新は無視して ✅
 *   (b) **正解と同じ値**のデコイ … 旧も ✅ になるが**それは偽の一致**。
 *       新も ✅ だが、**読んだ行番号**を見れば本物の表を読んだと確かめられる
 *   (c) 引用ブロックの外にデコイ … 新は候補2個で PARSE_ERROR（黙って1つ目を採らない）
 */
const fs = require('fs');
const path = require('path');
const { readSummary } = require('./lib/sweep-summary-md');

const SRC = path.join(__dirname, 'sweep-都留市.md');

// 08-15 の再計算値（`node scripts/dropped-buckets-all.js --muni=都留市` の出力）。
// 本物の集計表もこの値なので、正しく読めれば一致する
const TRUTH = { MISSING: 9, ORPHAN: 0, IN_DATA: 2 };

/* ---- 旧実装（コミット 7b87f02 時点）をそのまま再現する ---- */
function oldParse(md) {
  const pick = re => { const m = md.match(re); return m ? Number(m[1]) : null; };
  return {
    MISSING: pick(/\|\s*\*\*MISSING\*\*[^|]*\|\s*\*\*(\d+)\*\*\s*\|/),
    ORPHAN: pick(/\|\s*ORPHAN[^|]*\|\s*(\d+)\s*\|/),
    IN_DATA: pick(/\|\s*IN_DATA[^|]*\|\s*(\d+)\s*\|/),
  };
}

const table = (inData, quoted) => {
  const rows = [
    '### 【デコイ】手書きの過去版（このスクリプトが仕込んだもの）',
    '',
    '| | 件数 |',
    '|---|---|',
    '| MISSING | 8 |',
    `| IN_DATA | ${inData} |`,
    '| ORPHAN | 0 |',
    '',
  ];
  return rows.map(r => (quoted ? (r ? `> ${r}` : '>') : r)).join('\n');
};

const base = fs.readFileSync(SRC, 'utf8');
const lines = base.split(/\r?\n/);
const inject = block => [lines[0], '', block, ...lines.slice(1)].join('\n');

const CASES = [
  { key: 'a', file: '.decoy-a-引用内-誤値.md', md: inject(table(3, true)),
    desc: '(a) 引用ブロック内・IN_DATA=3（誤り）を本物より前に' },
  { key: 'b', file: '.decoy-b-引用内-正解と同値.md', md: inject(table(TRUTH.IN_DATA, true)),
    desc: `(b) 引用ブロック内・IN_DATA=${TRUTH.IN_DATA}（正解と同じ）を本物より前に` },
  { key: 'c', file: '.decoy-c-引用外-誤値.md', md: inject(table(3, false)),
    desc: '(c) 引用ブロックの外・IN_DATA=3 を本物より前に' },
  { key: '0', file: '.decoy-0-無改造.md', md: base,
    desc: '(参考) デコイ無し（本物のまま）' },
];

const eq = (v, t) => v.MISSING === t.MISSING && v.ORPHAN === t.ORPHAN && v.IN_DATA === t.IN_DATA;
const fmt = v => `${v.MISSING}/${v.ORPHAN}/${v.IN_DATA}`;

console.log(`正解（再計算値）= MISSING/ORPHAN/IN_DATA = ${fmt(TRUTH)}\n`);
const written = [];
for (const c of CASES) {
  const p = path.join(__dirname, c.file);
  fs.writeFileSync(p, c.md, 'utf8');
  written.push(p);

  const o = oldParse(c.md);
  const n = readSummary(p);

  console.log(`■ ${c.desc}`);
  console.log(`  旧: ${fmt(o)}  → ${eq(o, TRUTH) ? '✅ 一致' : '❌ 不一致'}`);
  if (!n.ok) {
    console.log(`  新: ❌ ${n.error} — ${n.reason.replace(/\*\*/g, '')}`);
  } else {
    console.log(`  新: ${fmt(n.values)}  → ${eq(n.values, TRUTH) ? '✅ 一致' : '❌ 不一致'}`);
    console.log(`      読んだ表: ${n.at.section} / 表の開始 ${n.at.table}行目 / ヘッダ ${n.at.header}行目`);
    console.log(`      値の行: MISSING ${n.at.rows.MISSING} / ORPHAN ${n.at.rows.ORPHAN} / IN_DATA ${n.at.rows.IN_DATA}`);
    console.log(`      データ鮮度の記録: ${n.dataStamp ? `${n.dataStamp.count}件 / ${n.dataStamp.mtime}（${n.dataStamp.line}行目）` : 'なし'}`);
  }
  console.log('');
}

if (process.argv.includes('--keep')) {
  console.log('デコイ入りコピーを残した:', written.map(p => path.basename(p)).join(' / '));
} else {
  for (const p of written) fs.unlinkSync(p);
  console.log('デコイ入りコピーは削除した。');
}
