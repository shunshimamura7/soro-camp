/**
 * 2026-08-06 確認分（第2弾）。
 *
 * - 宇久須キャンプ場を新規追加
 * - 西伊豆町観光協会の掲載施設に該当がなく実在を確認できなかった2件に
 *   needsVerify を立て、soloComment の冒頭にも断りを入れる
 *
 * 使い方: node scripts/apply-verified-2026-08-06b.js
 */
const fs = require('fs');
const path = require('path');

const { normalizeName } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// ── 1. 宇久須キャンプ場を追加 ──────────────────────────────────────────────
const NEW = {
  id: 'ugusu-camp',
  slug: 'ugusu-camp',
  name: '宇久須キャンプ場',
  prefecture: '静岡',
  area: '西伊豆町',
  address: '静岡県賀茂郡西伊豆町宇久須',
  type: 'campground',
  cautions: [
    'サイトでの直火は禁止（焚き火台は可）',
    '海岸でのバーベキューは不可',
    'ペットの持ち込み不可',
    '発電機・カラオケ禁止、花火は夜9時まで',
    '車両乗入不可。駐車場から荷物を運ぶ必要あり',
  ],
  lat: 0,
  lng: 0,
  priceMin: 2200,
  priceMax: 5500,
  priceNote: '＋駐車料金1台1,000円',
  scores: { quietness: 2, scenery: 5, value: 3, access: 3, facility: 4 },
  features: {
    bonfire: true,
    bonfireNote: '焚き火台のみ。直火は禁止',
    pet: false,
    shower: true,
    showerNote: '温水シャワー',
    bath: false,
    toilet: '洋式',
    toiletNote: '水洗',
    carIn: false,
    carInNote: '車両乗入不可。駐車場から荷物を運搬',
    soloPlan: false,
    reservation: '要',
    convenience: false,
    shop: false,
    wifi: false,
    firewood: false,
    ice: false,
    alcohol: false,
    garbage: '',
    nearbySupermarket: '',
    nearbyShop: '',
  },
  season: '要確認',
  soloComment:
    '伊豆半島最大の海岸公営キャンプ場。全長500mの遠浅海岸が目の前で、水平線に沈む夕陽が最大の魅力。1サイト5m×5mでソロには十分。車両乗入不可なので荷物運搬に注意。',
  officialUrl: 'https://www.nishiizu-kankou.com/stay/ugusucanp',
  tel: null,
  lastVerified: '2026-08-06',
};

if (camps.some(c => c.slug === NEW.slug)) {
  console.error(`エラー: slug "${NEW.slug}" は既に存在します。中止します。`);
  process.exit(1);
}
const nameClash = camps.filter(c => normalizeName(c.name) === normalizeName(NEW.name));
if (nameClash.length) {
  console.error(`エラー: 名前が既存と重複しています: ${nameClash.map(c => c.slug).join(', ')}。中止します。`);
  process.exit(1);
}
camps.push(NEW);
console.log(`追加: ${NEW.name}（${NEW.slug}）— ¥${NEW.priceMin}〜¥${NEW.priceMax} / ${NEW.priceNote}`);

// ── 2. 実在を確認できなかった2件 ───────────────────────────────────────────
const PREFIX = '※この施設の実在・正式名称を確認中です';
const UNCONFIRMED = ['nishiizu-seto', 'nishiizu-dogashima-camp'];

for (const slug of UNCONFIRMED) {
  const c = camps.find(x => x.slug === slug);
  if (!c) { console.warn(`警告: slug "${slug}" が見つかりません`); continue; }
  c.needsVerify = true;
  if (!c.soloComment.startsWith(PREFIX)) {
    c.soloComment = `${PREFIX}。${c.soloComment}`;
  }
  console.log(`needsVerify: ${slug}（${c.name}）`);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

console.log(`\n合計 ${camps.length}件`);
console.log(`needsVerify: ${camps.filter(c => c.needsVerify).length}件 — ${camps.filter(c => c.needsVerify).map(c => c.slug).join(', ')}`);
