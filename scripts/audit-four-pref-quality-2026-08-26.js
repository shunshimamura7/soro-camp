const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'campgrounds.json');
const camps = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const prefs = ['神奈川', '静岡', '山梨', '千葉'];
const today = '2026-08-26';

function daysSince(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  return Math.floor((Date.parse(today) - Date.parse(date)) / 86400000);
}
function hasSource(c) {
  return Boolean(c.officialUrl || (Array.isArray(c.source) && c.source.length) || (c.cautions || []).some(x => /https?:\/\//.test(x)));
}
function flags(c) {
  const f = [];
  if (c.status !== 'active') f.push(`status:${c.status || 'missing'}`);
  if (!c.priceVerified) f.push('価格未検証');
  if (!c.scoresVerified) f.push('採点未検証');
  if (c.needsCoord || !c.lat || !c.lng) f.push('座標要確認');
  if (c.needsVerify) f.push('総合要確認');
  if (!hasSource(c)) f.push('一次情報URL不足');
  const age = daysSince(c.lastVerified);
  if (age === null) f.push('確認日なし');
  else if (age > 90) f.push(`確認日${age}日前`);
  return f;
}

const summary = {};
const priority = [];
for (const pref of prefs) {
  const all = camps.filter(c => c.prefecture === pref);
  const active = all.filter(c => c.status === 'active');
  const fieldCounts = {
    total: all.length,
    active: active.length,
    held: all.length - active.length,
    priceVerified: active.filter(c => c.priceVerified).length,
    scoresVerified: active.filter(c => c.scoresVerified).length,
    coordsUsable: active.filter(c => c.lat && c.lng && !c.needsCoord).length,
    sourceBacked: active.filter(hasSource).length,
    needsVerify: active.filter(c => c.needsVerify).length,
    stale90: active.filter(c => (daysSince(c.lastVerified) ?? 9999) > 90).length,
  };
  summary[pref] = fieldCounts;
  for (const c of all) {
    const f = flags(c);
    if (f.length >= 2 || (c.status === 'active' && f.length >= 1)) {
      priority.push({pref, id: c.id, name: c.name, status: c.status, flags: f});
    }
  }
}

const output = [];
output.push('# 4県掲載品質監査（2026-08-26）\n');
output.push('| 都県 | 登録 | 通常掲載 | 保留等 | 料金確認 | 採点確認 | 座標可 | 一次情報URL | 総合要確認 | 90日超 |');
output.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const pref of prefs) {
  const s = summary[pref];
  output.push(`| ${pref} | ${s.total} | ${s.active} | ${s.held} | ${s.priceVerified}/${s.active} | ${s.scoresVerified}/${s.active} | ${s.coordsUsable}/${s.active} | ${s.sourceBacked}/${s.active} | ${s.needsVerify} | ${s.stale90} |`);
}
output.push(`\n## 優先確認リスト（${priority.length}件）\n`);
for (const row of priority.sort((a,b) => a.pref.localeCompare(b.pref) || a.name.localeCompare(b.name, 'ja'))) {
  output.push(`- **${row.pref}｜${row.name}** (${row.id}) — ${row.flags.join('、')}`);
}

const outPath = path.join(__dirname, 'four-pref-quality-audit-2026-08-26.md');
fs.writeFileSync(outPath, `${output.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({summary, priorityCount: priority.length, outPath}, null, 2));
