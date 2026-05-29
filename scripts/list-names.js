const fs = require('fs');
const path = require('path');

const camps = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/campgrounds.json'), 'utf-8')
);

// 県 → エリア → name でソート
const sorted = [...camps].sort((a, b) => {
  if (a.prefecture !== b.prefecture) return a.prefecture.localeCompare(b.prefecture, 'ja');
  if (a.area !== b.area) return a.area.localeCompare(b.area, 'ja');
  return a.name.localeCompare(b.name, 'ja');
});

const lines = [];
lines.push(`合計: ${camps.length}件`);
lines.push('');

const byPref = {};
sorted.forEach(c => {
  if (!byPref[c.prefecture]) byPref[c.prefecture] = [];
  byPref[c.prefecture].push(c);
});

Object.entries(byPref).forEach(([pref, list]) => {
  lines.push(`### ${pref} (${list.length}件)`);
  list.forEach(c => {
    lines.push(`- [${c.area}] ${c.name} (slug: ${c.slug})`);
  });
  lines.push('');
});

fs.writeFileSync(
  path.join(__dirname, 'names.txt'),
  lines.join('\n'),
  'utf-8'
);

console.log(`書き出し完了: scripts/names.txt (${camps.length}件)`);
