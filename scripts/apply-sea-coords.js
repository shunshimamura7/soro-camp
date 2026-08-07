/**
 * sea-coord-check.md の反映。
 *
 *   - FIXED 4件: 座標を差し替え、lastVerified を更新
 *   - NOT_FOUND 1件（伊東マリンタウン）: status を unverified に。座標は触らない
 *   - CANDIDATE 2件: 座標は触らず needsCoord: true で目視待ちにする
 *   - SEA 判定だった7件の coordsVerified を false に戻す
 *     （人が目視した根拠がないのに立っていた。coordsGsiChecked は別スクリプトで付ける）
 *
 * 使い方: node scripts/apply-sea-coords.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const VERIFIED = '2026-08-07';
const changes = [];

function find(slug) {
  const c = camps.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug "${slug}" が見つからない`);
  return c;
}

function set(camp, key, next) {
  const prev = camp[key];
  camp[key] = next;
  changes.push({ slug: camp.slug, field: key, prev, next });
}

// ── FIXED 4件 ───────────────────────────────────────────────────────────────
// いずれも GoogleマップURL の q= の値。国土地理院の逆ジオで市区町村・大字まで住所と一致を確認済み。
const FIXED = [
  { slug: 'kouan-motosuko',            lat: 35.473200, lng: 138.574763, note: 'やまなし観光ネット p2_3119 / 身延町 中ノ倉 標高910.7m' },
  { slug: 'shojiko-camping',           lat: 35.488970, lng: 138.602625, note: 'やまなし観光ネット p2_3121 / 富士河口湖町 精進 標高913.9m' },
  { slug: 'minamiizu-camping-terrace', lat: 34.673001, lng: 138.791973, note: 'キャンナビ / 南伊豆町 子浦 標高61.8m' },
  { slug: 'motosu-shore-camp',         lat: 35.456549, lng: 138.600814, note: 'やまなし観光ネット p_9208 / 富士河口湖町 本栖 標高909m' },
];

for (const f of FIXED) {
  const c = find(f.slug);
  set(c, 'lat', f.lat);
  set(c, 'lng', f.lng);
  set(c, 'lastVerified', VERIFIED);
}

// ── NOT_FOUND: 伊東マリンタウンキャンプ場 ──────────────────────────────────
// 住所は道の駅 伊東マリンタウンのもの。道の駅公式にキャンプ場の案内がなく、
// 電話番号も一致せず、予約・料金の情報がどこにも出てこない。
// 実在しない施設に正しい座標を置いても意味がないので、座標には触らない。
{
  const c = find('ito-marine-town-camp');
  set(c, 'status', 'unverified');
  set(c, 'needsVerify', true);
}

// ── CANDIDATE 2件 ───────────────────────────────────────────────────────────
// 現行座標が誤りなのは確定しているが、差し替える値が確定していない。
// 誤った値を残したままフラグで示す（0 で潰すと「未取得」と区別できなくなる）。
for (const slug of ['gandahara-manazuru', 'motosu-lakeside']) {
  set(find(slug), 'needsCoord', true);
}

// ── SEA 判定7件の coordsVerified を落とす ──────────────────────────────────
// 「人が目視で確認した」を意味するフラグだが、7件とも水面・海上を指していた。
// 目視した根拠がないので false に戻す。
const SEA_SEVEN = [
  'gandahara-manazuru', 'kouan-motosuko', 'motosu-lakeside', 'shojiko-camping',
  'minamiizu-camping-terrace', 'ito-marine-town-camp', 'motosu-shore-camp',
];
for (const slug of SEA_SEVEN) {
  const c = find(slug);
  if (c.coordsVerified !== false) set(c, 'coordsVerified', false);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`sea-coord 反映: ${changes.length}件の変更\n`);
let current = '';
for (const ch of changes) {
  if (ch.slug !== current) {
    current = ch.slug;
    console.log(`── ${current}`);
  }
  const fmt = (v) => (v === undefined ? 'undefined' : typeof v === 'string' ? `"${v}"` : JSON.stringify(v));
  console.log(`  ${ch.field}: ${fmt(ch.prev)} → ${fmt(ch.next)}`);
}
