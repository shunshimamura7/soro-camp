/**
 * wild-sites-check.md フェーズ4と、フェーズ3から持ち越した項目の反映。
 *
 *   - 高田橋多目的広場: 公園扱いか河原扱いかで火気の結論が逆になる件を明記（判定は保留）
 *   - 伊東市青少年キャンプ場: closedDays
 *   - 沼津市民の森: officialUrl / チェックイン・アウト時刻 / carIn の訂正
 *   - 土村キャンプ場: area / address の葵区 → 清水区
 *   - ターキーズハウス: priceMin/priceMax が 0 のまま金額だけ priceNote にあった件
 *
 * 使い方: node scripts/apply-phase4-wild.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

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

function addCaution(camp, text) {
  if (camp.cautions.includes(text)) return;
  camp.cautions.push(text);
  changes.push({ slug: camp.slug, field: 'cautions[追加]', prev: '(なし)', next: text });
}

// ── フェーズ4: 高田橋多目的広場 ────────────────────────────────────────────
// 相模原市の河川課FAQ（河原でのBBQは「特に規制はありません」）と
// 公園課FAQ（公園では火気を使用したBBQは原則不可）のどちらが及ぶ場所か、
// 市の公式ページが存在せず判定できなかった。判定は保留し、事実だけ書く。
// status は active のまま。
{
  const c = find('takadabashi-kasenjiki');
  addCaution(
    c,
    '管理区分により火気の扱いが異なる可能性がある。事前に相模原市へ確認を推奨（公園課 042-769-8243）',
  );
}

// ── 伊東市青少年キャンプ場 ──────────────────────────────────────────────────
{
  const c = find('omuroyama-camp');
  set(c, 'closedDays', '12/28〜1/4');
  set(c, 'officialUrl', 'https://www.city.ito.shizuoka.jp/gyosei/soshikikarasagasu/shogaigakushuka/kanko/2379.html');
}

// ── 沼津市民の森 ────────────────────────────────────────────────────────────
{
  const c = find('numazu-shimin-no-mori');
  set(c, 'officialUrl', 'https://www.city.numazu.shizuoka.jp/kurashi/shisetsu/shiminnomori/');

  // 「乗り入れ可否」ではなく「サイト脇に停めたままにできるか」が carIn の意味。
  // 荷物の搬出入では入れるが、そのあとは指定場所に移す必要があるので false のまま。
  // 誤っていたのは「要確認」という注記のほう。
  set(
    c,
    'features.carInNote',
    '荷物の搬出入時のみ乗り入れ可。その後は指定場所に駐車。キャンピングカーでの利用は不可',
  );
  addCaution(c, 'チェックイン10:00〜16:00、チェックアウト8:00〜10:00。いずれも管理棟に立ち寄ること');
}

// ── 土村キャンプ場 ──────────────────────────────────────────────────────────
// lat/lng（35.1194, 138.4512）は興津川沿いの清水区側を指しており、
// 二次情報の所在地表記とも一致する。葵区はデータ側の誤り。
{
  const c = find('tsuchimura');
  set(c, 'area', '静岡市清水区');
  set(c, 'address', '静岡県静岡市清水区');
}

// ── ターキーズハウス ────────────────────────────────────────────────────────
// 公式の料金ページ http://www.turkeyshouse.com/information/charge.htm より。
// priceNote にあった「大人500円」は施設使用料だけで、宿泊料が別にかかる。
// 0 のままだと価格順ソートで最安に並んでしまう。
{
  const c = find('turkeys-house');

  // ソロ1名1泊 = オートキャンプ1サイト 4,000円 + 施設使用料 大人500円
  set(c, 'priceMin', 4500);
  // 名物の江ノ電バンガロー1両 13,000円 + 施設使用料 500円
  set(c, 'priceMax', 13500);
  set(
    c,
    'priceNote',
    '宿泊料1泊：オートキャンプ1サイト（テント1張・車1台）4,000円／バンガロー1棟8,000円／江ノ電バンガロー1両13,000円。' +
      'これに施設使用料1泊が加算（大人500円・小学生400円・乳幼児300円）。' +
      'AC電源1,000円、追加の車1台1,000円。2泊目以降は1泊につき500円割引',
  );

  // 有料4,000円以上の帯（value 平均 2.68）。貸切露天風呂が無料で使える分を上乗せして3
  set(c, 'scores.value', 3);

  // 「大人500円という値段も含めてソロ向き」は施設使用料だけを見た誤り
  set(
    c,
    'soloComment',
    '福士川沿いのこぢんまりとしたキャンプ場。実際の江ノ電車両に泊まれるのが名物で、貸切露天風呂「とと湯」を無料で使える。' +
      '営業は連休を中心とした限られた日だけなので、公式の営業カレンダーを見てから動きたい。',
  );

  // 公式トップに「限られた連休のみ営業」「夏季は施設への貸切」と明記されている。
  // 「4月中旬〜11月30日」は通しで営業していると読めてしまう
  set(c, 'season', '連休を中心とした限定営業（公式の営業カレンダー要確認）。夏季は施設貸切');
  set(c, 'features.reservationNote', '2026年は2月1日9:00から予約受付開始');
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`フェーズ4: ${changes.length}件の変更を適用\n`);
let current = '';
for (const ch of changes) {
  if (ch.slug !== current) {
    current = ch.slug;
    console.log(`── ${current}`);
  }
  const fmt = (v) => (v === undefined ? 'undefined' : typeof v === 'string' ? `"${v}"` : JSON.stringify(v));
  console.log(`  ${ch.field}`);
  console.log(`    - ${fmt(ch.prev)}`);
  console.log(`    + ${fmt(ch.next)}`);
}
