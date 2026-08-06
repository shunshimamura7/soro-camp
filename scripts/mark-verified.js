/**
 * 既存の座標確認済みデータに coordsVerified: true を一括付与する。
 *
 * 除外（＝未検証のまま残す）：
 *   - batch6 / batch7 由来の slug（座標が機械生成のまま未検証）
 *   - lat または lng が 0 のもの（座標未設定。野営地9件）
 *
 * 一度実行すれば済む想定。再実行しても結果は変わらない（冪等）。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const batch6 = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch6.json'), 'utf-8'));
const batch7 = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch7.json'), 'utf-8'));

const unverifiedSlugs = new Set([...batch6, ...batch7].map(c => c.slug));

/** lng の直後に coordsVerified を差し込む（キー順を保って差分を読みやすく保つ） */
function withVerified(camp, value) {
  const out = {};
  for (const [k, v] of Object.entries(camp)) {
    if (k === 'coordsVerified') continue;
    out[k] = v;
    if (k === 'lng') out.coordsVerified = value;
  }
  if (!('coordsVerified' in out)) out.coordsVerified = value;
  return out;
}

let marked = 0;
const skippedBatch = [];
const skippedZero = [];

const updated = camps.map(c => {
  if (c.lat === 0 || c.lng === 0) {
    skippedZero.push(c.slug);
    return c;
  }
  if (unverifiedSlugs.has(c.slug)) {
    skippedBatch.push(c.slug);
    return c;
  }
  if (c.coordsVerified === true) return c;
  marked++;
  return withVerified(c, true);
});

fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));

console.log(`全${camps.length}件`);
console.log(`coordsVerified: true を付与: ${marked}件`);
console.log(`除外（batch6/batch7 由来）: ${skippedBatch.length}件`);
console.log(`除外（lat/lng = 0）: ${skippedZero.length}件`);
console.log(`残る未検証: ${updated.filter(c => c.coordsVerified !== true).length}件`);
