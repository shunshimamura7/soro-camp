/**
 * coord-tool.html が書き出した scripts/coords-fixed.json を
 * data/campgrounds.json に反映する。
 *
 * 入力形式: [{ slug, lat, lng, coordsVerified: true }, ...]
 * slug 照合で lat / lng / coordsVerified を更新。
 * 該当 slug がなければ警告を出して継続する。
 *
 * 使い方: node scripts/apply-coords.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH  = path.join(__dirname, '../data/campgrounds.json');
const FIXED_PATH = path.join(__dirname, 'coords-fixed.json');

if (!fs.existsSync(FIXED_PATH)) {
  console.error('エラー: scripts/coords-fixed.json が見つかりません。');
  console.error('coord-tool.html の「JSONをダウンロード」で書き出し、この場所に置いてください。');
  process.exit(1);
}

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const fixes = JSON.parse(fs.readFileSync(FIXED_PATH, 'utf-8'));

if (!Array.isArray(fixes)) {
  console.error('エラー: coords-fixed.json は配列である必要があります。');
  process.exit(1);
}

const bySlug = new Map(camps.map(c => [c.slug, c]));

let updated = 0;
let unchanged = 0;
const notFound = [];
const invalid = [];

fixes.forEach(fix => {
  if (!fix || typeof fix.slug !== 'string' ||
      typeof fix.lat !== 'number' || typeof fix.lng !== 'number' ||
      Number.isNaN(fix.lat) || Number.isNaN(fix.lng)) {
    invalid.push(JSON.stringify(fix));
    return;
  }
  const camp = bySlug.get(fix.slug);
  if (!camp) {
    notFound.push(fix.slug);
    return;
  }
  const same =
    camp.lat === fix.lat && camp.lng === fix.lng && camp.coordsVerified === true;
  camp.lat = fix.lat;
  camp.lng = fix.lng;
  camp.coordsVerified = fix.coordsVerified !== false;
  if (same) unchanged++;
  else updated++;
});

// lng の直後に coordsVerified を置き直してキー順を揃える
const normalized = camps.map(camp => {
  if (!('coordsVerified' in camp)) return camp;
  const out = {};
  for (const [k, v] of Object.entries(camp)) {
    if (k === 'coordsVerified') continue;
    out[k] = v;
    if (k === 'lng') out.coordsVerified = camp.coordsVerified;
  }
  return out;
});

fs.writeFileSync(DATA_PATH, JSON.stringify(normalized, null, 2));

console.log('── 反映サマリ ──────────────────────────────');
console.log(`入力: ${fixes.length}件`);
console.log(`更新: ${updated}件`);
if (unchanged) console.log(`変更なし（既に同じ値）: ${unchanged}件`);
if (notFound.length) {
  console.log(`警告: slug が見つかりません ${notFound.length}件`);
  notFound.forEach(s => console.log(`  - ${s}`));
}
if (invalid.length) {
  console.log(`警告: 形式が不正なエントリ ${invalid.length}件`);
  invalid.forEach(s => console.log(`  - ${s}`));
}
const remaining = normalized.filter(c => c.lat === 0 || c.lng === 0 || c.coordsVerified !== true);
console.log(`残る要確認: ${remaining.length}件 / 全${normalized.length}件`);
