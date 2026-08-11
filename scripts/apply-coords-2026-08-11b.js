/**
 * 目視取得した座標7件を反映する（2026-08-11）。
 *
 * 取得元は **Googleマップの実ピン**（URL の `data=` 末尾 `!8m2!3d<lat>!4d<lng>`）。
 * `@緯度,経度` は地図の表示中心でピンの位置とは違うので使っていない（§7 の A）。
 *
 * 内訳。
 * - `sankoso-auto` / `saiko-tsuhara-camp` … §7-3 / §7-4 のブロッカー。
 *   住所を確定させてから取り直した（`sankoso-saiko-check-2026-08.md`）
 * - 残り5件 … 不良バッチの点検で**住所を直した**ため貼る文字列が変わったもの
 *   （`batch-2026-05-26-check.md` §5）。5件とも `coordsVerified: true` が立ったまま
 *   小数4桁以下の粗い値が入っていた。**実ピンの7桁で置き換える**
 *
 * フラグの扱い（§2-5）。
 * - `needsCoord` を外す（残すと「まだ取得すべき対象」という誤ったシグナルになる）
 * - `coordsVerified: true` … **人が地図上で目視して確定させた**ので本来の用途に沿う
 * - `coordsGsiChecked` は**手で触らない。** 反映後に
 *   `verify-coords-gsi.js` → `apply-gsi-flags.js` で機械的に付ける
 *
 * `soloComment` は座標変更で中身が変わらないので触らない（前回の点検で整合済み）。
 *
 * 使い方: node scripts/apply-coords-2026-08-11b.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

/** slug または id で引く（`ootaki` と `sorairo` は id と slug が違う） */
const COORDS = [
  { key: 'sankoso-auto',        lat: 35.4875176, lng: 138.9678346 },
  { key: 'saiko-tsuhara-camp',  lat: 35.498973,  lng: 138.698817  },
  { key: 'norolodge',           lat: 35.5692444, lng: 139.1992747 },
  { key: 'nishitanzawa-ootaki', lat: 35.4543931, lng: 139.0523013 },
  { key: 'onoji-family',        lat: 35.2586003, lng: 138.862875  },
  { key: 'darumayama-kogen',    lat: 34.9744376, lng: 138.8543504 },
  { key: 'asagiri-sorairo',     lat: 35.3934589, lng: 138.5648634 },
];

const R = 6371;
const dist = (a, b, c, d) => {
  if (!a && !b) return null; // 0,0 は未取得なので距離を出しても意味がない
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
    `${c.id.padEnd(20)} ${String(c.lat).padStart(11)},${String(c.lng).padStart(12)}` +
      ` → ${lat},${lng}` +
      (moved === null ? '  （未取得 0,0 からの確定）' : `  ずれ ${(moved * 1000).toFixed(0)}m`)
  );

  c.lat = lat;
  c.lng = lng;
  delete c.needsCoord;
  c.coordsVerified = true;
  // coordsGsiChecked は触らない（apply-gsi-flags.js が入れる）
}

/* ── あわせて `darumayama-kogen` の address を差し戻す ──────────────
 *
 * この座標の検証（`verify-address-gsi.js` が OAZA_MISS を返した）を追ううちに、
 * **2026-08-11 の不良バッチ点検で入れた住所の修正が誤りだったと分かった。**
 *
 * | 出典 | 住所 | 格 |
 * |---|---|---|
 * | **伊豆市 市役所公式**（2026-07-23 更新） | **大沢1018-1** | 自治体公式（市そのもの） |
 * | 伊豆市 観光情報サイト | 大沢1021-19 | 自治体公式（観光部門） |
 *
 * https://www.city.izu.shizuoka.jp/soshiki/1004/2/1/928.html
 *
 * `batch-2026-05-26-check.md` では観光情報サイトだけを見て 1018-1 → 1021-19 に変えたが、
 * **市役所本体のページのほうが格が上で、更新日も新しい。** 元の値に戻す。
 *
 * **教訓: 「自治体公式」は1枚岩ではない。** 同じ市のドメインでも
 * 市役所本体と観光部門で値が違うことがある。片方だけ見て直さない。
 *
 * なお OAZA_MISS（逆ジオが「修善寺」を返す）は住所を戻しても解消しない。
 * §3 のとおり GSI の `lv01Nm` は山間部で粒度が粗く、**これは候補出しの信号であって
 * 誤りの証明ではない。** 座標側は標高609.1mで、市の資料の「標高600m」と整合する。 */
const daruma = camps.find((c) => c.id === 'darumayama-kogen');
daruma.address = '静岡県伊豆市大沢1018-1';
daruma.officialUrl = 'https://www.city.izu.shizuoka.jp/soshiki/1004/2/1/928.html';
console.log('\ndarumayama-kogen: address 大沢1021-19 → 大沢1018-1（伊豆市 市役所公式に差し戻し）');

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');

const needsCoord = camps.filter((c) => c.needsCoord).length;
const cv = camps.filter((c) => c.coordsVerified === true).length;
console.log(`\napply-coords: ${COORDS.length}件を反映した`);
console.log(`  needsCoord ${needsCoord}件 / coordsVerified ${cv}件`);
console.log('  次: node scripts/verify-coords-gsi.js → node scripts/apply-gsi-flags.js');
