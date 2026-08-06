/**
 * 情報欠損の棚卸し。campgrounds.json 全件を検査して scripts/data-gaps.md に出力する。
 *
 * データは読むだけで変更しない。
 * 使い方: node scripts/data-gaps.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH   = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'data-gaps.md');

const SOLO_COMMENT_MIN = 80;

const isEmpty = v => v == null || String(v).trim() === '';

/**
 * lastVerified の鮮度。
 * 「2026年以前」は文字どおり 2026 年を含む（今日が 2026-08-06 なので、
 * ほぼ全件が該当する）。判断できるよう「空」「2025年以前」「2026年」を分けて数える。
 */
function verifiedAge(lastVerified) {
  if (isEmpty(lastVerified)) return 'empty';
  const y = Number(String(lastVerified).slice(0, 4));
  if (!Number.isFinite(y)) return 'invalid';
  if (y <= 2025) return 'stale';      // 2025年以前
  if (y === 2026) return 'y2026';     // 2026年（＝「2026年以前」に含まれる）
  return 'fresh';
}

const CHECKS = [
  { key: 'tel',            label: 'tel が空',                 test: c => isEmpty(c.tel) },
  { key: 'officialUrl',    label: 'officialUrl が空',         test: c => isEmpty(c.officialUrl) },
  { key: 'reservationUrl', label: 'reservationUrl が空',      test: c => isEmpty(c.reservationUrl) },
  { key: 'lastVerified',   label: 'lastVerified が空/2026年以前', test: c => ['empty', 'invalid', 'stale', 'y2026'].includes(verifiedAge(c.lastVerified)) },
  { key: 'soloComment',    label: `soloComment が${SOLO_COMMENT_MIN}字未満`, test: c => (c.soloComment || '').length < SOLO_COMMENT_MIN },
  { key: 'priceRange',     label: 'priceMin と priceMax が同値', test: c => c.priceMin === c.priceMax },
];

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const rows = camps.map(c => {
  const gaps = CHECKS.filter(ck => ck.test(c));
  return { c, gaps };
});

// ── 集計 ────────────────────────────────────────────────────────────────────
const totalByCheck = {};
for (const ck of CHECKS) totalByCheck[ck.key] = rows.filter(r => r.gaps.some(g => g.key === ck.key)).length;

const ageCounts = { empty: 0, invalid: 0, stale: 0, y2026: 0, fresh: 0 };
camps.forEach(c => { ageCounts[verifiedAge(c.lastVerified)]++; });

function groupStats(keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r.c);
    if (!map.has(k)) map.set(k, { total: 0, gapTotal: 0, withAny: 0 });
    const g = map.get(k);
    g.total++;
    g.gapTotal += r.gaps.length;
    if (r.gaps.length) g.withAny++;
  }
  return [...map.entries()]
    .map(([k, v]) => ({
      key: k,
      total: v.total,
      withAny: v.withAny,
      // 欠損率 = 実際の欠損数 / (件数 × チェック項目数)
      rate: v.gapTotal / (v.total * CHECKS.length),
      avgGaps: v.gapTotal / v.total,
    }))
    .sort((a, b) => b.rate - a.rate);
}

const byPref = groupStats(c => c.prefecture);
const byArea = groupStats(c => `${c.prefecture}・${c.area}`);

const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const pct = n => (n * 100).toFixed(1) + '%';

// ── レポート ────────────────────────────────────────────────────────────────
let md = '';
md += '# 情報欠損の棚卸し\n\n';
md += `対象: 全 **${camps.length}件** / チェック項目 ${CHECKS.length}種\n\n`;
md += `何らかの欠損があるもの: **${rows.filter(r => r.gaps.length).length}件**`;
md += `（欠損ゼロ: ${rows.filter(r => !r.gaps.length).length}件）\n\n`;

md += '## 項目別の欠損数\n\n';
md += '| 項目 | 欠損数 | 割合 |\n| --- | --- | --- |\n';
for (const ck of CHECKS) {
  md += `| ${ck.label} | ${totalByCheck[ck.key]} | ${pct(totalByCheck[ck.key] / camps.length)} |\n`;
}
md += '\n';

md += '### lastVerified の内訳\n\n';
md += 'この項目だけ「2026年以前」の解釈で結果が大きく変わるため分解して示す。\n\n';
md += '| 状態 | 件数 |\n| --- | --- |\n';
md += `| 空 | ${ageCounts.empty} |\n`;
md += `| 日付として不正 | ${ageCounts.invalid} |\n`;
md += `| 2025年以前 | ${ageCounts.stale} |\n`;
md += `| 2026年 | ${ageCounts.y2026} |\n`;
md += `| 2027年以降 | ${ageCounts.fresh} |\n\n`;

md += '## 県別の欠損率\n\n';
md += '欠損率 = 欠損した項目数 ÷（件数 × チェック項目数）\n\n';
md += '| 県 | 件数 | 欠損ありの件数 | 平均欠損項目数 | 欠損率 |\n| --- | --- | --- | --- | --- |\n';
for (const g of byPref) {
  md += `| ${g.key} | ${g.total} | ${g.withAny} | ${g.avgGaps.toFixed(2)} | ${pct(g.rate)} |\n`;
}
md += '\n';

md += '## エリア別の欠損率（欠損率の高い順）\n\n';
md += '| エリア | 件数 | 欠損ありの件数 | 平均欠損項目数 | 欠損率 |\n| --- | --- | --- | --- | --- |\n';
for (const g of byArea) {
  md += `| ${esc(g.key)} | ${g.total} | ${g.withAny} | ${g.avgGaps.toFixed(2)} | ${pct(g.rate)} |\n`;
}
md += '\n';

md += '## 全件の内訳\n\n';
md += '欠損項目数の多い順。\n\n';
md += '| slug | name | 県・エリア | 欠損数 | 欠損項目 |\n| --- | --- | --- | --- | --- |\n';
for (const r of [...rows].sort((a, b) => b.gaps.length - a.gaps.length)) {
  md += `| \`${r.c.slug}\` | ${esc(r.c.name)} | ${r.c.prefecture}・${esc(r.c.area)} | ${r.gaps.length} | ${r.gaps.map(g => g.label).join('<br>') || '—'} |\n`;
}
md += '\n※ このレポートは検出結果のみ。data/campgrounds.json は変更していない。\n';

fs.writeFileSync(REPORT_PATH, md);

console.log(`対象 ${camps.length}件 / チェック${CHECKS.length}項目`);
for (const ck of CHECKS) {
  console.log(`  ${ck.label}: ${totalByCheck[ck.key]}件 (${pct(totalByCheck[ck.key] / camps.length)})`);
}
console.log(`欠損ゼロ: ${rows.filter(r => !r.gaps.length).length}件`);
console.log('県別欠損率: ' + byPref.map(g => `${g.key} ${pct(g.rate)}`).join(' / '));
console.log(`出力: ${path.relative(process.cwd(), REPORT_PATH)}`);
