const fs = require('fs');
const path = require('path');

const existing = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/campgrounds.json'), 'utf-8'));
const batchWild = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch-wild.json'), 'utf-8'));

const existingSlugs = new Set(existing.map(c => c.slug));
const toAdd = batchWild.filter(c => !existingSlugs.has(c.slug));
const skipped = batchWild.filter(c => existingSlugs.has(c.slug));

console.log(`既存: ${existing.length}件`);
console.log(`追加: ${toAdd.length}件（野営地）`);
console.log(`重複スキップ: ${skipped.map(c => c.name).join(', ') || 'なし'}`);

const merged = [...existing, ...toAdd];
fs.writeFileSync(path.join(__dirname, '../data/campgrounds.json'), JSON.stringify(merged, null, 2));
console.log(`完了: 合計${merged.length}件（うち野営地${merged.filter(c => c.type === 'wild').length}件）`);
