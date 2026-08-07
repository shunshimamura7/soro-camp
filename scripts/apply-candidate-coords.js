/**
 * sea-coord-check.md の CANDIDATE 2件の反映。
 *
 * どちらも現行座標が誤りなのは確定していたが、差し替える値を確定できず
 * needsCoord: true で目視待ちにしていた。GoogleマップURLの実ピン（!3d!4d）から
 * 座標を取得したので反映する。
 *
 *   gandahara-manazuru … 候補が3つに割れ、標高が 2.2m と 53m に分かれていた。
 *                        実ピンは 2.2m 側で、「海岸にテントを張れる」という
 *                        施設説明と整合した
 *   motosu-lakeside    … 候補は収束していたが出典が埋め込み地図の中心だけだった
 *
 * 座標は人が地図上で目視して確定させたので coordsVerified: true を立てる。
 * これは「人が目視した」という本来の用途に沿った使い方（scripts/引き継ぎ_2026-08-07.md §2-5）。
 *
 * 使い方: node scripts/apply-candidate-coords.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const VERIFIED = '2026-08-07';

/** 国土地理院の逆ジオで住所の大字まで一致を確認済み */
const FIXED = [
  {
    slug: 'gandahara-manazuru',
    lat: 35.1436301,
    lng: 139.1582528,
    gsi: '神奈川県 / 真鶴町 / 真鶴・標高2.2m',
    source: 'https://www.google.co.jp/maps/place/ガンダーラ真鶴シーサイドキャンプ場/@35.1436301,139.1556779,17z/data=!3m1!4b1!4m6!3m5!1s0x6019bbea3677a9af:0xf198ed9ac900b478!8m2!3d35.1436301!4d139.1582528',
  },
  {
    slug: 'motosu-lakeside',
    lat: 35.476964,
    lng: 138.5931453,
    gsi: '山梨県 / 富士河口湖町 / 本栖・標高914.7m',
    source: 'https://www.google.co.jp/maps/place/本栖レークサイドキャンプ場/@35.476964,138.5905704,17z/data=!3m1!4b1!4m6!3m5!1s0x601be65c11cef55f:0xf1ec94b52cc74e3b!8m2!3d35.476964!4d138.5931453',
  },
];

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLng = r(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

for (const f of FIXED) {
  const c = camps.find((x) => x.slug === f.slug);
  if (!c) throw new Error(`slug "${f.slug}" が見つからない`);

  const moved = haversineM(c.lat, c.lng, f.lat, f.lng);

  console.log(`── ${f.slug}（${c.name}）`);
  console.log(`  lat/lng        : ${c.lat}, ${c.lng} → ${f.lat}, ${f.lng}`);
  console.log(`  ずれ           : ${Math.round(moved)}m`);
  console.log(`  国土地理院     : ${f.gsi}`);
  console.log(`  needsCoord     : ${c.needsCoord === true ? 'true → 削除' : '(なし)'}`);
  console.log(`  coordsVerified : ${c.coordsVerified === true} → true`);
  console.log(`  lastVerified   : ${c.lastVerified || '(空)'} → ${VERIFIED}`);
  console.log();

  c.lat = f.lat;
  c.lng = f.lng;
  delete c.needsCoord;          // 正しい座標が確定したのでフラグを外す
  c.coordsVerified = true;      // 人が地図上で目視して確定させた
  c.lastVerified = VERIFIED;
  // coordsGsiChecked は verify-coords-gsi.js → apply-gsi-flags.js で付ける。
  // 機械の判定を手で書かない（引き継ぎ §2-5）
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`needsCoord が残っているのは: ${camps.filter((c) => c.needsCoord).map((c) => c.slug).join(', ') || '(なし)'}`);
