/**
 * 南部町（山梨）のキャンプ場情報の反映（2026-08-06）。
 *
 * - minobe-camp に needsVerify
 * - 南部町のキャンプ場6件を追加（slug・名前とも重複がないもののみ）
 * - ginga-momiji-camp の「日本一の星空」を出典不明の最上級表現として削除
 *
 * 使い方: node scripts/apply-nanbu-2026-08-06.js
 */
const fs = require('fs');
const path = require('path');

const { normalizeName } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH  = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'added-nanbu-2026-08-06.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// 情報が与えられていない項目は断定せず注記を付ける
const baseFeatures = () => ({
  bonfire: true,
  bonfireNote: '可否は要確認（焚き火台持参が無難）',
  pet: false,
  shower: false,
  bath: false,
  toilet: '不明',
  toiletNote: '要確認',
  carIn: false,
  carInNote: '要確認',
  soloPlan: false,
  reservation: '要',
  reservationNote: '要確認',
  convenience: false,
  shop: false,
  wifi: false,
  firewood: false,
  ice: false,
  alcohol: false,
  garbage: '',
  nearbySupermarket: '',
  nearbyShop: '',
});

const base = (slug, name, scores, extra = {}) => ({
  id: slug,
  slug,
  name,
  prefecture: '山梨',
  area: '南部町',
  address: '山梨県南巨摩郡南部町',
  type: 'campground',
  lat: 0,
  lng: 0,
  priceMin: 0,
  priceMax: 0,
  priceNote: '要問合せ',
  scores,
  features: baseFeatures(),
  season: '要確認',
  tel: null,
  lastVerified: '2026-08-06',
  ...extra,
});

const NEW = [];

// a) 福士川渓谷青少年旅行村
{
  const c = base('fukushigawa-seishonen', '福士川渓谷青少年旅行村',
    { quietness: 5, scenery: 4, value: 4, access: 2, facility: 3 });
  c.tel = '0556-66-3366';
  c.telNote = '奥山温泉';
  c.officialUrl = 'https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html';
  Object.assign(c.features, {
    bath: true,
    bathNote: '徒歩圏内に奥山温泉',
    reservation: '要',
    reservationNote: '予約・問い合わせは奥山温泉へ',
  });
  c.soloComment =
    '奥山グリーンロッジ併設、運営は隣接の奥山温泉。福士川渓谷に七ッ釜の滝や吊り橋があり、歩いて温泉に行ける。静けさは南部町でも随一。';
  c.cautions = [
    '臨時休業の場合があるため事前確認が必要',
    '予約・問い合わせは奥山温泉へ',
  ];
  NEW.push(c);
}

// b) 福士川オートキャンプ場
{
  const c = base('fukushigawa-auto', '福士川オートキャンプ場',
    { quietness: 4, scenery: 3, value: 4, access: 2, facility: 3 });
  c.address = '山梨県南巨摩郡南部町福士19867';
  c.tel = '0556-66-2272';
  c.season = '4月〜11月';
  c.features.carIn = true;
  c.features.carInNote = 'オートサイト';
  c.soloComment =
    '福士川沿いのオートサイト。車を横付けできるので装備を選ばない。井出駅から徒歩40分と歩けなくはないが、車で行きたい立地。';
  NEW.push(c);
}

// c) ターキーズハウス
{
  const c = base('turkeys-house', 'ターキーズハウス',
    { quietness: 4, scenery: 3, value: 5, access: 2, facility: 3 });
  c.address = '山梨県南巨摩郡南部町福士16095';
  c.tel = '0556-66-3155';
  c.season = '4月中旬〜11月30日';
  c.priceNote = '大人500円／小人400円／幼児300円';
  c.soloComment =
    '福士川沿いのこぢんまりとしたキャンプ場。実際の江ノ電車両に泊まれるのが名物で、大人500円という値段も含めてソロ向き。';
  NEW.push(c);
}

// d) ランバージャック
{
  const c = base('lumberjack-nanbu', 'ランバージャック',
    { quietness: 5, scenery: 3, value: 3, access: 2, facility: 4 });
  c.officialUrl = 'https://www.lumberjacktaimo.jp/';
  Object.assign(c.features, {
    bath: true,
    bathNote: '管理棟に入浴施設',
    carIn: true,
    carInNote: 'オートサイト',
    firewood: true,
    firewoodNote: '薪の販売あり',
  });
  c.soloComment =
    '福士川のほとりの小さなオートキャンプ場。管理棟に炊事場・トイレ・入浴施設が揃い、ドラム缶BBQコンロも借りられる。薪も現地調達できる。';
  NEW.push(c);
}

// e) 福士川根熊山荘ファミリーオートキャンプ場
{
  const c = base('nekumasanso-auto', '福士川根熊山荘ファミリーオートキャンプ場',
    { quietness: 4, scenery: 3, value: 4, access: 2, facility: 3 });
  c.needsVerify = true;   // tel・詳細が未取得
  c.features.carIn = true;
  c.features.carInNote = 'オートサイト';
  c.soloComment =
    '※詳細を確認中です。民宿・福士川根熊山荘の敷地内にあるオートサイトで、サイトの横を福士川が流れる。川音を聞きながら過ごせる。';
  NEW.push(c);
}

// f) 佐野川キャンプ場（野営地）
{
  const c = base('sanogawa-camp', '佐野川キャンプ場',
    { quietness: 5, scenery: 3, value: 5, access: 2, facility: 1 });
  c.type = 'wild';
  c.needsVerify = true;
  c.priceNote = '無料開放';
  Object.assign(c.features, {
    bonfire: true,
    bonfireNote: '焚き火可。直火の可否は要確認',
    toilet: '不明',
    toiletNote: '有無を含めて要確認',
    carIn: true,
    carInNote: '要確認',
    reservation: '不要',
    reservationNote: '',
    garbage: '全て持ち帰り',
  });
  c.soloComment =
    '※詳細を確認中です。無料で焚き火ができる野営地としてソロキャンパーに知られる場所。設備は期待せず、増水と落石に備えて設営位置を選びたい。';
  c.cautions = [
    '山側は落石が多い。設営位置に注意',
    '上流に日本軽金属の自家発電用ダムがあり、放流による増水の可能性',
    '無料野営地は閉鎖・有料化のリスクがある。現況は要確認',
    'トイレ・水場の有無は要確認',
    'ゴミ完全持ち帰り',
  ];
  NEW.push(c);
}

// ── 重複チェック ────────────────────────────────────────────────────────────
const bySlug = new Set(camps.map(c => c.slug));
const byName = new Map();
for (const c of camps) {
  const n = normalizeName(c.name);
  if (!byName.has(n)) byName.set(n, []);
  byName.get(n).push(c);
}

const toAdd = [];
const dupes = [];
for (const c of NEW) {
  const slugHit = bySlug.has(c.slug);
  const nameHit = byName.get(normalizeName(c.name)) || [];
  if (slugHit || nameHit.length) dupes.push({ c, slugHit, nameHit });
  else toAdd.push(c);
}

console.log('── 重複チェック ──────────────────────────');
console.log(`追加候補 ${NEW.length}件 → 追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件`);
for (const d of dupes) {
  console.log(`  スキップ: ${d.c.name}（${d.c.slug}）`);
  if (d.slugHit) console.log('    理由: slug が既存と重複');
  d.nameHit.forEach(h => console.log(`    理由: 名前が既存と重複 → ${h.slug} / ${h.name}`));
}

// ── 1. minobe-camp ─────────────────────────────────────────────────────────
console.log('\n── 既存の修正 ───────────────────────────');
const m = camps.find(c => c.slug === 'minobe-camp');
if (!m) console.warn('警告: minobe-camp が見つかりません');
else {
  const PREFIX = '※施設名・所在地を確認中です';
  m.needsVerify = true;
  if (!m.soloComment.startsWith(PREFIX)) m.soloComment = `${PREFIX}。${m.soloComment}`;
  console.log('  minobe-camp: needsVerify: true / soloComment に断りを追加');
}

// ── 3. 銀河もみじの最上級表現を削除 ────────────────────────────────────────
const g = camps.find(c => c.slug === 'ginga-momiji-camp');
if (!g) console.warn('警告: ginga-momiji-camp が見つかりません');
else {
  const before = g.soloComment;
  // 「日本一の星空」は出典不明の最上級表現。順位の言及自体を外す。
  g.soloComment = '川根本町の山奥、天の川がはっきり見えるほど空が暗い。秋は紅葉と星空が同時に楽しめる。';
  console.log('  ginga-momiji-camp: soloComment を修正');
  console.log(`    変更前: ${before}`);
  console.log(`    変更後: ${g.soloComment}`);
}

camps.push(...toAdd);
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

// ── ノート ──────────────────────────────────────────────────────────────────
const EVIDENCE = {
  'fukushigawa-seishonen': { quietness: '渓谷奥・青少年旅行村', scenery: '七ッ釜の滝・風吹の滝・吊り橋', value: null, access: '奥山温泉と同エリアの山間部', facility: '奥山グリーンロッジ併設・徒歩圏に温泉' },
  'fukushigawa-auto': { quietness: null, scenery: null, value: null, access: '井出駅から徒歩約40分', facility: null },
  'turkeys-house': { quietness: 'こぢんまりとした規模', scenery: null, value: '大人500円', access: '井出駅から徒歩約59分', facility: null },
  'lumberjack-nanbu': { quietness: '小さなオートキャンプ場', scenery: null, value: null, access: null, facility: '炊事場・トイレ・入浴施設・薪販売' },
  'nekumasanso-auto': { quietness: null, scenery: '福士川がサイト横を流れる', value: null, access: null, facility: '民宿の敷地内' },
  'sanogawa-camp': { quietness: '管理者不在の無料野営地', scenery: null, value: '無料', access: null, facility: '設備情報なし' },
};
const AXES = ['quietness', 'scenery', 'value', 'access', 'facility'];
const LABEL = { quietness: '静けさ', scenery: '絶景', value: 'コスパ', access: 'アクセス', facility: '設備' };

let md = '# 南部町（山梨）のキャンプ場追加（2026-08-06）\n\n';
md += `追加候補 ${NEW.length}件 → **追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件**\n\n`;
md += '重複チェックは slug の一致と、正規化した施設名の一致の両方で実施。\n\n';
md += '## scores の根拠\n\n';
md += '料金は e/f を除き未提示のため `priceMin/priceMax = 0`（表示は「要問合せ」）。\n';
md += 'ターキーズハウスのみ `priceNote` に実額を記載。\n\n';
md += '| slug | 名前 | ' + AXES.map(a => LABEL[a]).join(' | ') + ' |\n';
md += '| --- | --- | ' + AXES.map(() => '---').join(' | ') + ' |\n';
for (const c of toAdd) {
  const ev = EVIDENCE[c.slug] || {};
  md += `| \`${c.slug}\` | ${c.name} | ` +
    AXES.map(a => `${c.scores[a]}${ev[a] ? `<br><sub>${ev[a]}</sub>` : '<br><sub>**根拠なし**</sub>'}`).join(' | ') + ' |\n';
}
md += '\n### 根拠がない軸\n\n';
for (const c of toAdd) {
  const ev = EVIDENCE[c.slug] || {};
  const none = AXES.filter(a => !ev[a]);
  md += `- \`${c.slug}\`: ${none.length ? none.map(a => `${LABEL[a]}(${c.scores[a]})`).join('、') : 'なし'}\n`;
}
md += '\n## needsVerify を立てたもの\n\n';
md += '| slug | 理由 |\n| --- | --- |\n';
md += '| `minobe-camp` | 南部町にその名称の施設を確認できず |\n';
md += '| `nekumasanso-auto` | tel・詳細が未取得 |\n';
md += '| `sanogawa-camp` | 無料野営地のため現況・正式名称とも未確認 |\n';
md += '\n## 銀河もみじキャンプ場の記述修正\n\n';
md += '「日本一の星空」は出典不明の最上級表現のため削除した。\n';
md += '川根本町の他施設が「澄んだ星空 全国第2位」としているため、\n';
md += '同一の町について異なる順位を主張する矛盾も解消される。\n';
md += '順位の言及自体を外し、観測できる事実（天の川が見える暗さ）の記述に置き換えた。\n';
fs.writeFileSync(NOTES_PATH, md);

console.log(`\n合計 ${camps.length}件`);
console.log(`野営地（type: "wild"）: ${camps.filter(c => c.type === 'wild').length}件`);
console.log(`needsVerify: ${camps.filter(c => c.needsVerify).length}件`);
console.log(`出力: ${path.relative(process.cwd(), NOTES_PATH)}`);
