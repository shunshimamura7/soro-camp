/**
 * wild-sites-check.md フェーズ3の反映。
 *
 *   - 大柳川: 有料化に伴う value スコアの見直し、officialUrl、season
 *   - 黒川:   tel / officialUrl / address
 *   - 沼津市民の森: 予約期限の訂正、飲料水の注意追加
 *   - 伊東市青少年キャンプ場: 予約受付開始の訂正、利用日数・夜間手続きの追加、古い記述の削除
 *   - lastVerified が空の8件のうち、今回一次情報で確認できた7件に 2026-08-07
 *   - OK_TOLERATED の4件に「公認ではない（黙認）」と分かる注意書き
 *
 * 使い方: node scripts/apply-phase3-wild.js
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

/** cautions の1件を置き換える。見つからなければエラー */
function replaceCaution(camp, from, to) {
  const i = camp.cautions.indexOf(from);
  if (i === -1) throw new Error(`${camp.slug}: cautions に "${from}" が見つからない`);
  camp.cautions[i] = to;
  changes.push({ slug: camp.slug, field: `cautions[${i}]`, prev: from, next: to });
}

function dropCaution(camp, text) {
  const i = camp.cautions.indexOf(text);
  if (i === -1) throw new Error(`${camp.slug}: cautions に "${text}" が見つからない`);
  camp.cautions.splice(i, 1);
  changes.push({ slug: camp.slug, field: 'cautions[削除]', prev: text, next: '(削除)' });
}

function addCaution(camp, text) {
  if (camp.cautions.includes(text)) return;
  camp.cautions.push(text);
  changes.push({ slug: camp.slug, field: 'cautions[追加]', prev: '(なし)', next: text });
}

// ── 大柳川渓流キャンプ場 ────────────────────────────────────────────────────
{
  const c = find('ogayanagawa-keikoku');
  // value:5 は無料開放だった頃の値。有料化したので同価格帯に合わせる
  set(c, 'scores.value', 4);
  set(c, 'officialUrl', 'https://ooyanagawa-camp.com/');
  set(c, 'season', '通年（降雪時は休業する場合あり）');
}

// ── 黒川キャンプ場（清水森林公園） ──────────────────────────────────────────
{
  const c = find('kurokawa-shizuoka');
  set(c, 'tel', '054-395-2999');
  set(c, 'officialUrl', 'https://www.city.shizuoka.lg.jp/okushizuoka/spot/s000093.html');
  set(c, 'address', '静岡県静岡市清水区西里1310-1');
}

// ── 沼津市民の森 ────────────────────────────────────────────────────────────
{
  const c = find('numazu-shimin-no-mori');
  // 沼津市公式は「3日前まで」。1週間前は誤り
  set(
    c,
    'features.reservationNote',
    '利用日の3日前まで。沼津市公共施設予約システムまたは TEL 055-942-3103',
  );
  // 無料で炊事棟もあるという印象と正面から食い違う情報なので明記する
  addCaution(c, '園内の水は飲料に適さない。飲料水は持参');
}

// ── 伊東市青少年キャンプ場 ──────────────────────────────────────────────────
{
  const c = find('omuroyama-camp');
  // 振興公社の公式ページで「2ヶ月」に取消線が引かれ「3ヶ月」に変更されている
  replaceCaution(
    c,
    '予約は使用希望月の2ヶ月前の1日から受付',
    '予約は使用希望月の3ヶ月前の1日から受付（1日が土日祝なら次の平日）',
  );
  addCaution(c, '春季・GW・夏季（7〜8月）は最大1泊2日、その他の期間は最大2泊3日');
  addCaution(c, '夜間（18:00〜翌8:00）利用は当日16:00までに申請と鍵の受取りが必要。間に合わない場合は利用不可');
  // フェーズAで座標は確定済み
  dropCaution(c, '座標が未確定。場所は要現地確認');
  // 同じ内容が2つ入っている
  dropCaution(c, '酒類の持ち込み禁止');
}

// ── lastVerified ───────────────────────────────────────────────────────────
// 今回、一次情報で現況を確認できたものだけに日付を入れる。
// tsuchimura（土村）は静岡市のキャンプ適地ルールのページが404で、
// 二次情報（2024年8月）しか得られていないので空のまま残す。
{
  const verified = [
    'nakatsugawa-kasenjiki',    // 愛川町 商工観光課・消防本部
    'sumida-ohashi-kasenjiki',  // 同上
    'hasugebashi-kasenjiki',    // 同上
    'wadanagahama-kaigan',      // 三浦市海水浴場ルール第25条
    'kofu-shinrinyoku-hiroba',  // 甲府市 施設カルテ 3-10
    'ogayanagawa-keikoku',      // 大柳川渓流キャンプ場 公式
    'kurokawa-shizuoka',        // 静岡市 やすらぎの森
  ];
  for (const slug of verified) {
    const c = find(slug);
    if (c.lastVerified !== VERIFIED) set(c, 'lastVerified', VERIFIED);
  }
}

// ── OK_TOLERATED の4件 ─────────────────────────────────────────────────────
// 「禁止情報がない」ことと「認められている」ことは違う。
// 愛川町3件（町が利用を前提にルールを公開している）と同じ顔で並ばないようにする。
{
  const SHIZUOKA_NOTE =
    '静岡市の「キャンプ適地」だが、市の利用ルールのページは現在閲覧できず、公認の裏付けは取れていない（黙認）';
  const SAGAMIHARA_NOTE =
    '自治体が公認した野営地ではない（黙認）。相模原市はキャンプについて市営キャンプ場を案内している';

  addCaution(find('tsuchimura'), SHIZUOKA_NOTE);
  addCaution(find('nishizato-camp-tekichi'), SHIZUOKA_NOTE);
  addCaution(find('ogurabashi-kasenjiki'), SAGAMIHARA_NOTE);
  addCaution(find('takadabashi-kasenjiki'), SAGAMIHARA_NOTE);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`フェーズ3: ${changes.length}件の変更を適用\n`);
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
