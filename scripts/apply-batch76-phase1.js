/**
 * batch76-check.md の反映 フェーズ1。
 *
 *   1. GHOST 25件をレコードごと削除（202 → 177件）
 *   2. hayakawa-camp を status: 'suspended' に（災害復旧のため休業中）
 *   3. 既存の kofu-shinrinyoku-hiroba の eligibility に type: 'exclusive' を付与
 *
 * 実在しなかったものに「閉鎖」の記録は要らないので、status を落とすのではなく削除する。
 * 判断の根拠は scripts/batch76-check.md の各項に記録してある。
 *
 * 使い方: node scripts/apply-batch76-phase1.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
let camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const before = camps.length;

// ── 1. GHOST 25件の削除 ─────────────────────────────────────────────────────
// 借用の型ごとに並べてある（batch76-check.md 総括 §2）
const GHOSTS = [
  // 型A: 実在する近い名前の施設からの派生
  { slug: 'momijino-sato',            borrowed: 'もみじの里松原オートキャンプ場（滋賀県東近江市）' },
  { slug: 'yamaboshi-camp',           borrowed: 'やまぼうしオートキャンプ場（静岡県御殿場市）／山伏オートキャンプ場（道志村）' },
  { slug: 'marutamura-camp',          borrowed: '丸太の森キャンプ場（南足柄市）' },
  { slug: 'doshi-fureainomori',       borrowed: '道志の森キャンプ場（doshi-no-mori として既存）' },
  { slug: 'doshi-minamoto-camp',      borrowed: 'みなもと体験館道志久保分校／水の元オートキャンプ場' },
  { slug: 'mountkan-kannogawa',       borrowed: '西丹沢マウントブリッジキャンプ場（既存）／神之川キャンプ・マス釣り場' },
  { slug: 'sagamiko-camping-village', borrowed: '相模湖休養村（既存）／PICAさがみ湖（既存）' },
  { slug: 'minamialps-auto-camp',     borrowed: 'ウエストリバーオート／南アルプス三景園オート' },
  { slug: 'kaikoma-camp',             borrowed: 'モルゲンローテ甲斐駒オート／フレンドパークむかわ' },
  { slug: 'fuji-international-camp',  borrowed: '富士山YMCA グローバル・エコ・ヴィレッジ（fuji-ymca として既存）' },
  // 型B: 実在する地名・山名 ＋ キャンプ場
  { slug: 'okuyugawara-auto',         borrowed: '奥湯河原温泉（温泉地名）' },
  { slug: 'nishiizu-seto',            borrowed: '「せと」（西伊豆町に該当海岸を確認できず）' },
  { slug: 'nishiizu-dogashima-camp',  borrowed: '堂ヶ島（西伊豆町の景勝地）' },
  { slug: 'kawanehon-camp',           borrowed: '家山（島田市の地名。町名と矛盾）' },
  { slug: 'minobe-camp',              borrowed: '南部町（町名そのもの）' },
  { slug: 'makigaya-auto',            borrowed: '牧ケ谷（静岡市葵区の地名）' },
  { slug: 'yakeyamazawa-shinpukuji',  borrowed: '焼山（丹沢の山名）' },
  { slug: 'shiroyama-fureainosato',   borrowed: '城山（相模原市緑区の地名）' },
  { slug: 'oyama-kogen-camp',         borrowed: '大野山（山北町の山）' },
  { slug: 'miura-camp-beach',         borrowed: '三浦海岸（地名・駅名）' },
  { slug: 'hadano-camp-valley',       borrowed: '秦野＋「渓谷」（一般名詞）' },
  // 型C: 実在するがキャンプ場ではない施設
  { slug: 'hayatogawa-masu',          borrowed: '早戸川国際マス釣場（管理釣り場。キャンプ不可）' },
  { slug: 'izukogen-granpal-camp',    borrowed: '伊豆ぐらんぱる公園（レジャー公園）' },
  { slug: 'kirara-yamanakako',        borrowed: '山中湖交流プラザきらら（運動・イベント施設）' },
  // 型D: 既存レコードとの重複
  { slug: 'nakatsugawa-camp',         borrowed: 'nakatsugawa-kasenjiki と座標が完全一致。実態は無料の河川敷' },
];

const deleted = [];
for (const g of GHOSTS) {
  const i = camps.findIndex((c) => c.slug === g.slug);
  if (i === -1) throw new Error(`削除対象 "${g.slug}" が見つからない`);
  deleted.push({ ...g, name: camps[i].name, prefecture: camps[i].prefecture, area: camps[i].area });
  camps.splice(i, 1);
}

// ── 2. hayakawa-camp を suspended に ────────────────────────────────────────
{
  const c = camps.find((x) => x.slug === 'hayakawa-camp');
  if (!c) throw new Error('hayakawa-camp が見つからない');
  c.status = 'suspended';
  c.suspendedNote =
    '災害復旧後のリニューアルオープンを目指して休業中。再開まで数ヵ年を要する見込み（早川町観光協会） ' +
    'https://hayakawakankou.jp/archives/spot/hayakawao-tocampjyou/';
  // 正式名称も町公式の表記に合わせる
  c.name = '早川町オートキャンプ場';
  c.lastVerified = '2026-08-07';
}

// ── 3. 既存 eligibility に type を付与 ──────────────────────────────────────
{
  const c = camps.find((x) => x.slug === 'kofu-shinrinyoku-hiroba');
  if (!c || !c.eligibility) throw new Error('kofu-shinrinyoku-hiroba の eligibility が見つからない');
  // 施設カルテの利用対象者が「甲府市民」＝市外の人は使えない
  c.eligibility = { type: 'exclusive', ...c.eligibility };
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

// ── 結果 ────────────────────────────────────────────────────────────────────
console.log(`削除: ${deleted.length}件\n`);
const byPref = {};
deleted.forEach((d) => (byPref[d.prefecture] = (byPref[d.prefecture] || 0) + 1));
deleted.forEach((d) => {
  console.log(`  ${d.slug.padEnd(26)} ${d.prefecture}/${d.area}`);
  console.log(`    ${d.name}`);
  console.log(`    借用元: ${d.borrowed}`);
});
console.log(`\n県別: ${Object.entries(byPref).map(([k, v]) => `${k} ${v}件`).join(' / ')}`);

const suspended = camps.filter((c) => c.status === 'suspended');
console.log(`\nsuspended に変更: ${suspended.map((c) => `${c.slug}（${c.name}）`).join(', ')}`);

console.log(`\n件数: ${before} → ${camps.length}`);
const st = {};
camps.forEach((c) => (st[c.status] = (st[c.status] || 0) + 1));
console.log(`status 内訳: ${JSON.stringify(st)}`);
