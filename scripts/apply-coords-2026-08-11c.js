/**
 * 目視取得した座標5件を反映する（2026-08-11・前回7件の続き）。
 *
 * 取得元は **Googleマップの実ピン**（`data=` 末尾の `!8m2!3d<lat>!4d<lng>`）。
 * `@緯度,経度`（地図の表示中心）は使っていない。
 *
 * これで `needsCoord` は `nekumasanso-auto` の1件だけになる。
 * そちらは**施設が2つに割れていて実体が確定していない**ので座標を入れない（§7-4 と同じ扱い）。
 * 所見は `nekumasanso-check-2026-08.md`。
 *
 * フラグの扱い（§2-5）。
 * - `needsCoord` を外す
 * - `coordsVerified: true` … 人が地図上で目視して確定させた
 * - `coordsGsiChecked` は**手で触らない。**
 *   反映後に `verify-coords-gsi.js` → `apply-gsi-flags.js` で機械的に付ける
 *
 * `soloComment` は座標変更で中身が変わらないので触らない。
 *
 * 使い方: node scripts/apply-coords-2026-08-11c.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const COORDS = [
  // §2-6 の用途2（誤りと分かっている座標を残していた1件）。小数2桁で粒度およそ1kmだった
  { key: 'okudoshi-auto',               lat: 35.4701461, lng: 138.9443768 },
  { key: 'fujino-art-camp',             lat: 35.5948938, lng: 139.1521269 },
  { key: 'saiko-kohan-camp',            lat: 35.5048412, lng: 138.6997185 },
  { key: 'shiraishi-auto-camp',         lat: 35.484174,  lng: 139.063771  },
  { key: 'nishitanzawa-nakagawa-lodge', lat: 35.435518,  lng: 139.0462467 },
];

const R = 6371;
const dist = (a, b, c, d) => {
  if (!a && !b) return null; // 0,0 は未取得。距離を出しても意味がない
  const r = (x) => (x * Math.PI) / 180;
  const h =
    Math.sin(r(c - a) / 2) ** 2 +
    Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

for (const { key, lat, lng } of COORDS) {
  const c = camps.find((x) => x.id === key) || camps.find((x) => x.slug === key);
  if (!c) throw new Error(`${key} が見つからない`);
  const moved = dist(c.lat, c.lng, lat, lng);
  console.log(
    `${c.id.padEnd(28)} ${String(c.lat).padStart(10)},${String(c.lng).padStart(11)} → ${lat},${lng}` +
      (moved === null ? '  （未取得 0,0 からの確定）' : `  ずれ ${(moved * 1000).toFixed(0)}m`)
  );
  c.lat = lat;
  c.lng = lng;
  delete c.needsCoord;
  c.coordsVerified = true;
  // coordsGsiChecked は触らない
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');

const nc = camps.filter((c) => c.needsCoord);
console.log(`\napply-coords: ${COORDS.length}件を反映した`);
console.log(`  needsCoord 残り ${nc.length}件: ${nc.map((c) => c.id).join(', ') || '（なし）'}`);
console.log(`  coordsVerified ${camps.filter((c) => c.coordsVerified === true).length}件`);
console.log('  次: node scripts/verify-coords-gsi.js → node scripts/apply-gsi-flags.js');
