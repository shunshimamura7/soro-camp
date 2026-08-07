/**
 * cluster-fix-check.md の反映。
 *
 *   - FIXED 3件の座標を差し替え、officialUrl を補う
 *   - 実在が確認できない2件と掲載範囲外の1件をレコードごと削除
 *   - tanzawako-roadside-camp を tanzawako-lodge に統合してから削除
 *
 * 使い方: node scripts/apply-cluster-fix.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
let camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const VERIFIED = '2026-08-07';
const changes = [];

function find(slug) {
  const c = camps.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug "${slug}" が見つからない`);
  return c;
}

function set(camp, pathStr, next) {
  const keys = pathStr.split('.');
  let obj = camp;
  for (const k of keys.slice(0, -1)) {
    if (obj[k] == null) throw new Error(`${camp.slug}: パス "${pathStr}" の途中 "${k}" が存在しない`);
    obj = obj[k];
  }
  const last = keys[keys.length - 1];
  const prev = obj[last];
  obj[last] = next;
  changes.push({ slug: camp.slug, field: pathStr, prev, next });
}

// ── FIXED 3件 ───────────────────────────────────────────────────────────────
// いずれも GoogleマップURL の q= の値。国土地理院の逆ジオで大字まで住所と一致を確認済み。
{
  const c = find('kiyosato-oka');
  set(c, 'lat', 35.903967);
  set(c, 'lng', 138.431998);
  set(c, 'lastVerified', VERIFIED);
}
{
  const c = find('kiyosato-chuo-auto');
  set(c, 'lat', 35.898533866);
  set(c, 'lng', 138.449199805);
  set(c, 'officialUrl', 'https://autocamp.co.jp/');
  set(c, 'lastVerified', VERIFIED);
}
{
  const c = find('tanzawako-lodge');
  set(c, 'lat', 35.4158351);
  set(c, 'lng', 139.06893615);
  set(c, 'lastVerified', VERIFIED);
}

// ── tanzawako-roadside-camp を tanzawako-lodge に統合 ──────────────────────
// 2件は同一施設（roadside 側の officialUrl が指す住所・電話が lodge 側と一致）。
// 互いに補完しあっているので、裏が取れた情報だけを lodge 側に移す。
{
  const lodge = find('tanzawako-lodge');

  // 公式サイトの表記は「丹沢湖ロッヂ」。「キャンプ場」は付いていない
  set(lodge, 'name', '丹沢湖ロッヂ');
  set(lodge, 'officialUrl', 'https://tanzawakolodge.com/');

  // 焚き火の可否は公式で裏を取った。
  //   https://tanzawakolodge.com/terms/  禁止事項に「直火」「水風船・打上げ吹上げ花火」
  //                                      「※林野火災警報発令中は、たき火は出来ません」
  //   https://tanzawakolodge.com/about/  「直火 禁止」「花火 手持ち花火可」
  // roadside 側の「焚き火・直火とも全面禁止」は誤り。直火は禁止だが焚き火はできる。
  set(lodge, 'features.bonfire', true);
  set(
    lodge,
    'features.bonfireNote',
    '直火禁止・焚き火台必須。林野火災警報の発令中はたき火不可',
  );

  // roadside 側にあって lodge 側に無く、公式で裏が取れたもの
  set(lodge, 'features.petNote', '湖サイト・P1サイトのみ可');
  set(lodge, 'features.garbage', '可燃ごみは有料処理');
  set(lodge, 'features.reservationNote', '前日までに要予約。宿泊受付は17:00まで');

  lodge.cautions = [
    '直火禁止（焚き火台必須）',
    '林野火災警報の発令中はたき火ができない',
    '打上げ・吹上げ花火は禁止（手持ち花火は可）',
    'おやすみタイム21:00〜6:00。音響機器・発電機は使用禁止',
    '車の出し入れは19:00まで',
  ];
  changes.push({ slug: lodge.slug, field: 'cautions', prev: '(なし)', next: `${lodge.cautions.length}件を設定` });

  set(
    lodge,
    'soloComment',
    '丹沢湖を望む玄倉の静かなキャンプ場。おやすみタイムを設けるほど静粛性を重視した運営で、' +
      '雨天でも使える炊事スペースが揃う。直火は禁止だが焚き火台なら使える。前日までの予約を忘れずに。',
  );
}

// ── 削除3件 ────────────────────────────────────────────────────────────────
// 実在しなかったものに「閉鎖」の記録は要らないので、status を落とすのではなく
// レコードごと消す。
const DELETE = [
  { slug: 'makiba-kogen-camp',       reason: 'まきば公園はキャンプ場ではない（県立八ヶ岳牧場の一部の公園。9:00-17:00・入場無料・冬季閉鎖）。住所は kiyosato-oka の枝番違いで流用の疑い' },
  { slug: 'ginga-momiji-camp',       reason: '長野県下伊那郡阿智村の実在施設。掲載範囲（神奈川・静岡・山梨）外' },
  { slug: 'tanzawako-roadside-camp', reason: 'tanzawako-lodge と同一施設。統合済み' },
];

const before = camps.length;
const deleted = [];
for (const d of DELETE) {
  const i = camps.findIndex((c) => c.slug === d.slug);
  if (i === -1) throw new Error(`削除対象 "${d.slug}" が見つからない`);
  deleted.push({ ...d, name: camps[i].name });
  camps.splice(i, 1);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`cluster-fix 反映: ${changes.length}件の変更 / ${deleted.length}件の削除\n`);
let current = '';
for (const ch of changes) {
  if (ch.slug !== current) {
    current = ch.slug;
    console.log(`── ${current}`);
  }
  const fmt = (v) => (v === undefined ? 'undefined' : typeof v === 'string' ? `"${v}"` : JSON.stringify(v));
  console.log(`  ${ch.field}: ${fmt(ch.prev)} → ${fmt(ch.next)}`);
}
console.log('\n── 削除');
deleted.forEach((d) => console.log(`  ${d.slug}（${d.name}）\n    理由: ${d.reason}`));
console.log(`\n件数: ${before} → ${camps.length}`);
