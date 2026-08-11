/**
 * `folkwood-yatsugatake` の座標を実ピンに差し替える（2026-08-11）。
 * §7-6 の「小数2桁で粒度およそ1km」だった最後の1件。
 *
 * 旧 35.87, 138.27 は**経度が約3.5kmずれていて、逆ジオが長野県富士見町落合を返していた**
 * （PREF_MISMATCH）。新 35.8807379, 138.3090095 は 山梨県 / 北杜市 / 小淵沢町・標高993.2m。
 *
 * 取得元は Googleマップの place href の `!8m2!3d<lat>!4d<lng>`（`@` の表示中心ではない）。
 *
 * ## どちらのピンを採るか — FLEX FIELD は別施設ではなく「敷地内のエリア」
 *
 * 約110m離れて FLEX FIELD キャンプ場（35.8797437, 138.309498）のピンが別に立っているが、
 * flexnet.co.jp が「**FOLKWOOD VILLAGE 八ヶ岳内で FLEX が運営するキャンプエリア**」と
 * 明記しており、住所も同じ 小淵沢町3900-2。予約サイトも1施設1ページで
 * 「VILLAGE FIELD」と「FLEX FIELD」のプランを並べている。
 * **`nekumasanso-auto` のような別施設の取り違えではない。**
 * このレコードは複合施設全体を指すので、本体ピンを採る。
 *
 * 施設公式 folkwood-camp.com は本文が JS 描画で住所が取れなかった（§6-24 の型）。
 *
 * ## ⚠ 北杜市観光協会の住所は使えない（§7 の注意が再確認された）
 *
 * 北杜市観光協会の施設ページは住所を「北杜市高根町村山北割3261」と出すが、
 * これは**観光協会自身の所在地**。§12 の K-2（北杜市の L1 が使えなかった理由）と
 * §7 の `flora-campsite` の注意と同じもので、**同じ罠がこの施設でも出た。**
 * データの 小淵沢町3900-2 が正しい（FLEX FIELD 側の記載とも一致）。
 *
 * 使い方: node scripts/apply-folkwood-coord-2026-08.js
 */
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const c = camps.find((x) => x.id === 'folkwood-yatsugatake');
if (!c) throw new Error('folkwood-yatsugatake が見つからない');

const R = 6371, r = (x) => (x * Math.PI) / 180;
const lat = 35.8807379, lng = 138.3090095;
const h = Math.sin(r(lat - c.lat) / 2) ** 2 +
  Math.cos(r(c.lat)) * Math.cos(r(lat)) * Math.sin(r(lng - c.lng) / 2) ** 2;
console.log(`folkwood-yatsugatake: ${c.lat},${c.lng} → ${lat},${lng}  ずれ ${(2 * R * Math.asin(Math.sqrt(h))).toFixed(2)}km`);

c.lat = lat;
c.lng = lng;
c.coordsVerified = true;
// coordsGsiChecked は触らない（apply-gsi-flags.js が入れる）
c.lastVerified = '2026-08-11';

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
console.log('  次: node scripts/verify-coords-gsi.js → node scripts/apply-gsi-flags.js');
