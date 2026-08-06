/**
 * 実在確認できた施設の情報を反映する（2026-08-06 確認分）。
 *
 * - kuragari-camp            玄倉キャンプ場 → 丹沢湖キャンプサイト（正式名称）
 * - tanzawako-roadside-camp  丹沢湖レイクサイドキャンプ場 → 丹沢湖ロッヂ
 *
 * slug と id は URL 維持のため変更しない。
 * 使い方: node scripts/apply-verified-2026-08-06.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const find = slug => {
  const c = camps.find(x => x.slug === slug);
  if (!c) console.warn(`警告: slug "${slug}" が見つかりません`);
  return c;
};

const addCautions = (c, items) => {
  if (!c.cautions) c.cautions = [];
  for (const i of items) if (!c.cautions.includes(i)) c.cautions.push(i);
};

// ── 1. 丹沢湖キャンプサイト ────────────────────────────────────────────────
const k = find('kuragari-camp');
if (k) {
  const before = k.name;
  k.name = '丹沢湖キャンプサイト';
  k.prefecture = '神奈川';
  k.area = '丹沢湖';
  k.tel = '0465-78-3242';
  k.telNote = '受付10:00〜21:00';
  k.officialUrl = 'https://www.yamakita.net/stay/detail.php?id=13&type=2';
  k.reservationUrl = 'https://tanzawa-camp.sakura.ne.jp/';
  k.season = '4月〜11月末';
  k.features.pet = false;
  k.features.reservation = '要';
  k.lastVerified = '2026-08-06';
  k.soloComment =
    '丹沢湖畔・標高340mの林間サイト。地面は砂で設営しやすく、玄倉バス停から徒歩3分と電車バス派にも向く。中川温泉ぶなの湯まで車11分。';
  addCautions(k, ['玄倉川はダム放流で急激に増水する。河原には降りないこと']);
  console.log(`kuragari-camp: "${before}" → "${k.name}"（slug/id は据え置き）`);
  console.log(`  season: ${k.season} / reservation: ${k.features.reservation} / pet: ${k.features.pet}`);
  console.log(`  cautions: ${k.cautions.length}項目`);
}

// ── 2. 丹沢湖ロッヂ ────────────────────────────────────────────────────────
const t = find('tanzawako-roadside-camp');
if (t) {
  const before = t.name;
  const beforeQuiet = t.scores.quietness;
  t.name = '丹沢湖ロッヂ';
  t.officialUrl = 'https://tanzawakolodge.com/';
  t.features.bonfire = false;
  t.features.bonfireNote = '焚き火・直火とも全面禁止';
  t.features.pet = true;
  t.features.petNote = '湖サイトのみリード着用で可';
  t.lastVerified = '2026-08-06';
  t.needsVerify = true;   // レイクサイド→ロッヂの同定がまだ推定
  addCautions(t, [
    '焚き火・直火は全面禁止',
    'おやすみタイム21:00〜6:00。発電機・音楽プレーヤー禁止',
    '水源地のため合成洗剤の使用不可',
  ]);
  t.soloComment =
    '都心から90分、富士山と湖を一望できる高台。おやすみタイムを設けるほど静粛性を重視した運営だが、焚き火・直火は全面禁止なので注意。';
  // 静けさ: おやすみタイム21:00〜6:00 と発電機・音楽プレーヤー禁止という
  // 明文化された運営方針は、他の施設にはない強い根拠なので 5 に引き上げる。
  // 他の4軸は新たな根拠がないため据え置き。
  t.scores.quietness = 5;
  console.log(`tanzawako-roadside-camp: "${before}" → "${t.name}"（slug/id は据え置き）`);
  console.log(`  bonfire: false / pet: true（${t.features.petNote}）/ needsVerify: true`);
  console.log(`  静けさ: ${beforeQuiet} → ${t.scores.quietness}（おやすみタイム・発電機禁止を根拠に）`);
  console.log(`  cautions: ${t.cautions.length}項目`);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));
console.log(`\n焚き火不可（bonfire: false）の施設: ${camps.filter(c => !c.features.bonfire).length}件`);
