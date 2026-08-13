/**
 * 座標の反映（2026-08-13）。`fuji-midori-kyuka-auto` の1件。
 *
 *   node scripts/apply-fuji-midori-coord-2026-08-13.js
 *
 * GoogleマップURL の `!8m2!3d35.4764213!4d138.6893238`（実ピン）をしゅんが取得。
 * **`@緯度,経度`（表示中心・約200m西にずれる）ではない。**
 *
 * ## 経緯
 *
 * 穴1（`verify-coords-gsi.js` に市区町村の比較を入れた）で CITY_MISMATCH に出た1件。
 * address は鳴沢村なのに逆ジオが富士河口湖町 西湖を返していた。
 *
 * **一次情報に当たった結果、名称・住所・運営者・電話・料金・営業期間・予約が全部一致し、
 * 裏の取れていない値は座標だけになっていた**（`scripts/fuji-midori-check-2026-08.md`）。
 * 座標は 2026-05-28 の一括投入（`65943ee` batch7）以来一度も動いておらず、
 * 小数3桁（約100m 粒度）で `coordsVerified` も立っていなかった。
 *
 * ## 検算（反映前に実施）
 *
 *   逆ジオ : 山梨県 / 鳴沢村 / −        ← address の鳴沢村と一致
 *   標高   : 1247.5m → 992m           ← 施設公式の「標高約1,000m」と整合
 *   移動   : 2.51km
 *   住所検索の代表点との距離: 3.42km → 0.94km
 *
 * **`lv01Nm` が「−」なのは正常。**鳴沢村は大字を持たない自治体なので、
 * `verify-address-gsi.js` は MATCH ではなく NO_LV01（相対評価 UNKNOWN）を返す（引き継ぎ §18-4）。
 *
 * ## coordsGsiChecked は触らない
 *
 * 機械検証のフラグは `apply-gsi-flags.js` が `coord-report.json` から埋める。
 * **手で書かないこと**（引き継ぎ §2-5）。このスクリプトが立てるのは
 * `coordsVerified`（人が実ピンを引いた記録）だけ。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');

const SLUG = 'fuji-midori-kyuka-auto';
const NEXT = { lat: 35.4764213, lng: 138.6893238 };
const TODAY = '2026-08-13';

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const c = data.find((x) => x.slug === SLUG);
if (!c) throw new Error(`${SLUG} が見つからない`);

const before = { lat: c.lat, lng: c.lng, coordsVerified: c.coordsVerified, lastVerified: c.lastVerified };

c.lat = NEXT.lat;
c.lng = NEXT.lng;
c.coordsVerified = true;
c.lastVerified = TODAY;

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

console.log(`${SLUG} を更新`);
console.log(`  lat/lng        : ${before.lat}, ${before.lng} → ${c.lat}, ${c.lng}`);
console.log(`  coordsVerified : ${JSON.stringify(before.coordsVerified)} → ${JSON.stringify(c.coordsVerified)}`);
console.log(`  lastVerified   : ${before.lastVerified} → ${c.lastVerified}`);
console.log(`  coordsGsiChecked: ${JSON.stringify(c.coordsGsiChecked)}（触っていない。apply-gsi-flags.js が埋める）`);
