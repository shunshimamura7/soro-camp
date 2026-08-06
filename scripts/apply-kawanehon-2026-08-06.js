/**
 * 川根本町の公認キャンプ場情報の反映（2026-08-06）。
 *
 * - 既存2件の同定修正（sessokyo-camp / kawanehon-camp）
 * - 公認キャンプ場6件の追加（slug・名前とも重複がないもののみ）
 *
 * 重複していた場合は追加せず情報補完のみ行い、その旨を出力する。
 * 使い方: node scripts/apply-kawanehon-2026-08-06.js
 */
const fs = require('fs');
const path = require('path');

const { normalizeName } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH  = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'added-2026-08-06.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// 情報が与えられていない項目の既定値。断定を避けるため注記を付ける。
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

const base = (slug, name, address, scores, extra = {}) => ({
  id: slug,
  slug,
  name,
  prefecture: '静岡',
  area: '川根本町',
  address,
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

// ── 追加候補 ────────────────────────────────────────────────────────────────
const NEW = [];

// a) 池の谷ファミリーキャンプ場
{
  const c = base('ikenoya-family', '池の谷ファミリーキャンプ場', '静岡県榛原郡川根本町千頭528-5地先',
    { quietness: 3, scenery: 3, value: 4, access: 3, facility: 3 });
  c.tel = '0547-59-2746';
  c.telNote = '川根本町まちづくり観光協会';
  c.soloComment =
    '千頭にある町営サイト。管理は川根本町まちづくり観光協会で、予約や現地の状況はここに確認できる。ユネスコエコパークの町ならではの澄んだ空が魅力。';
  NEW.push(c);
}

// b) くのわき親水公園キャンプ場
{
  const c = base('kunowaki-shinsui', 'くのわき親水公園キャンプ場', '静岡県榛原郡川根本町久野脇280',
    { quietness: 2, scenery: 4, value: 4, access: 3, facility: 4 });
  c.tel = '0547-56-1781';
  c.telNote = 'くのわき親水公園管理運営組合';
  c.officialUrl = 'https://www.kunowaki.net/';
  Object.assign(c.features, {
    shower: true,
    showerNote: 'シャワーあり',
    toilet: '洋式',
    toiletNote: 'トイレ2棟',
    carIn: true,
    carInNote: '',
  });
  c.soloComment =
    '敷地4万㎡・収容700人の大規模サイト。半島状の地形で180度のリバービューが広がる。シャワーやコインランドリーもあり、長めの滞在にも耐える。';
  c.cautions = ['近くに塩郷の吊り橋（恋金橋）・塩郷ダムあり'];
  NEW.push(c);
}

// c) 八木キャンプ場
{
  const c = base('yagi-camp', '八木キャンプ場', '静岡県榛原郡川根本町奥泉761-2地先',
    { quietness: 4, scenery: 3, value: 4, access: 2, facility: 3 });
  c.tel = '0547-59-2746';
  c.telNote = '川根本町まちづくり観光協会';
  c.officialUrl = 'https://okuooi.gr.jp/contact_camp_yagi/index.php';
  c.season = '3月15日〜11月30日';
  c.features.reservation = '要';
  c.features.reservationNote = 'オンライン（なっぷ）のみ';
  c.soloComment =
    '奥泉の静かな林間サイト。3月中旬から11月末までの営業で、予約はなっぷのオンラインのみ。3か月前の1日解禁なので計画的に押さえたい。';
  c.cautions = [
    '予約はオンライン（なっぷ）のみ。電話受付なし',
    '予約は3か月前の月の1日から受付開始',
  ];
  NEW.push(c);
}

// d) 三ツ星オートキャンプ場
{
  const c = base('mitsuboshi-auto', '三ツ星オートキャンプ場', '静岡県榛原郡川根本町上長尾1143',
    { quietness: 3, scenery: 3, value: 4, access: 3, facility: 3 });
  c.tel = '090-2137-2551';
  c.telNote = 'かわね来風';
  c.officialUrl = 'http://kawanelife.org/camp/';
  c.features.carIn = true;               // 「オートキャンプ場」なので車の乗り入れ前提
  c.features.carInNote = 'オートサイト';
  c.soloComment =
    '上長尾にあるオートサイトで、運営は地元のかわね来風。車を横付けできるので装備を選ばず、川根本町の澄んだ夜空をゆっくり眺められる。';
  NEW.push(c);
}

// e) 不動の滝自然広場オートキャンプ場
{
  const c = base('fudonotaki-auto', '不動の滝自然広場オートキャンプ場', '静岡県榛原郡川根本町下泉1122',
    { quietness: 4, scenery: 4, value: 4, access: 3, facility: 3 });
  c.tel = '0547-56-1600';
  c.telNote = 'リバールーツ リサーチ＆ラボ';
  c.officialUrl = 'https://ffnpcs.com/';
  c.features.carIn = true;               // 「オートキャンプ場」なので車の乗り入れ前提
  c.features.carInNote = 'オートサイト';
  c.soloComment =
    '下泉の不動の滝に隣接する自然広場のサイト。水音が絶えず、川根本町のなかでも静けさは上位。焚き火を眺めて過ごす夜に向く。';
  NEW.push(c);
}

// f) アプトいちしろキャンプ場
{
  const c = base('apt-ichishiro', 'アプトいちしろキャンプ場', '静岡県榛原郡川根本町梅地3-19',
    { quietness: 3, scenery: 4, value: 4, access: 3, facility: 5 });
  c.officialUrl = 'https://abt-camp.shizu.website/';
  c.season = '通年（冬季営業あり）';
  Object.assign(c.features, {
    toilet: '洋式',
    toiletNote: '全個室ウォシュレット',
    carIn: true,
    carInNote: '',
  });
  c.soloComment =
    '南アルプスの麓、芝サイトからあぷとライン・大井川・長島ダムを望む。全個室ウォシュレット付きで快適、アプトいちしろ駅から徒歩5分と電車派にも。';
  c.cautions = ['川根本町から静岡市井川への閑蔵林道が通行止めの場合あり。要確認'];
  NEW.push(c);
}

// ── 重複チェック（slug と正規化した名前の両方） ────────────────────────────
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
  if (slugHit || nameHit.length) {
    dupes.push({ c, slugHit, nameHit });
  } else {
    toAdd.push(c);
  }
}

console.log('── 重複チェック ──────────────────────────');
console.log(`追加候補 ${NEW.length}件 → 追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件`);
for (const d of dupes) {
  console.log(`  スキップ: ${d.c.name}（${d.c.slug}）`);
  if (d.slugHit) console.log('    理由: slug が既存と重複');
  d.nameHit.forEach(h => console.log(`    理由: 名前が既存と重複 → ${h.slug} / ${h.name}`));
}

// ── 1. 既存2件の同定 ───────────────────────────────────────────────────────
console.log('\n── 既存2件の同定 ────────────────────────');
const s = camps.find(c => c.slug === 'sessokyo-camp');
if (!s) console.warn('警告: sessokyo-camp が見つかりません');
else {
  const before = s.name;
  s.name = '接岨YANBY OUTDOOR FIELD';
  s.needsVerify = true;
  s.lastVerified = '2026-08-06';
  s.soloComment =
    '川根本町は澄んだ星空が全国2位。奥大井湖上駅へのシャトルバスがあり、八橋小道ラブロマンスロード（1周約1時間）も近い。星を眺めて過ごす夜向き。';
  console.log(`  sessokyo-camp: "${before}" → "${s.name}"（slug 据え置き / needsVerify: true）`);
}

const k = camps.find(c => c.slug === 'kawanehon-camp');
if (!k) console.warn('警告: kawanehon-camp が見つかりません');
else {
  const PREFIX = '※家山は島田市川根町であり川根本町ではない。施設名・所在地を確認中です';
  k.needsVerify = true;
  if (!k.soloComment.startsWith(PREFIX)) k.soloComment = `${PREFIX}。${k.soloComment}`;
  console.log(`  kawanehon-camp: needsVerify: true / soloComment に所在地の断りを追加`);
}

// ── 反映 ────────────────────────────────────────────────────────────────────
camps.push(...toAdd);
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

// ── 判断根拠のノート ────────────────────────────────────────────────────────
// 与えられた情報でどの軸が裏付けられるかを記録する。
const EVIDENCE = {
  'ikenoya-family': { quietness: null, scenery: null, value: null, access: null, facility: null },
  'kunowaki-shinsui': {
    quietness: '収容700人の大規模施設', scenery: '半島状の地形で180度のリバービュー',
    value: null, access: null, facility: 'トイレ2棟・シャワー・コインランドリー・BBQ棟・炊事場',
  },
  'yagi-camp': { quietness: null, scenery: null, value: null, access: '奥泉（町の奥部）', facility: null },
  'mitsuboshi-auto': { quietness: null, scenery: null, value: null, access: 'オートサイト', facility: null },
  'fudonotaki-auto': { quietness: null, scenery: '不動の滝に隣接', value: null, access: 'オートサイト', facility: null },
  'apt-ichishiro': {
    quietness: null, scenery: '南アルプス・大井川・長島ダムを望む芝サイト',
    value: null, access: 'アプトいちしろ駅から徒歩5分', facility: '全個室ウォシュレット付きトイレ',
  },
};
const AXES = ['quietness', 'scenery', 'value', 'access', 'facility'];
const LABEL = { quietness: '静けさ', scenery: '絶景', value: 'コスパ', access: 'アクセス', facility: '設備' };

let md = '# 川根本町 公認キャンプ場の追加（2026-08-06）\n\n';
md += `追加候補 ${NEW.length}件 → **追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件**\n\n`;
md += '重複チェックは slug の一致と、正規化した施設名の一致の両方で行った。\n\n';
md += '## scores の根拠\n\n';
md += '与えられた情報から裏付けられる軸と、そうでない軸を分けて記録する。\n';
md += '根拠のない軸は中央値 **3** を基本とし、提示された値をそのまま採用した。\n';
md += '料金は全件未提示のため `priceMin/priceMax = 0`、表示は「要問合せ」。\n\n';
md += '| slug | 名前 | ' + AXES.map(a => LABEL[a]).join(' | ') + ' |\n';
md += '| --- | --- | ' + AXES.map(() => '---').join(' | ') + ' |\n';
for (const c of toAdd) {
  const ev = EVIDENCE[c.slug] || {};
  md += `| \`${c.slug}\` | ${c.name} | ` +
    AXES.map(a => `${c.scores[a]}${ev[a] ? `<br><sub>${ev[a]}</sub>` : '<br><sub>**根拠なし**</sub>'}`).join(' | ') + ' |\n';
}
md += '\n### 根拠がない軸の扱い\n\n';
for (const c of toAdd) {
  const ev = EVIDENCE[c.slug] || {};
  const none = AXES.filter(a => !ev[a]);
  md += `- \`${c.slug}\`: ${none.length ? none.map(a => `${LABEL[a]}(${c.scores[a]})`).join('、') : 'なし'}\n`;
}
md += '\n## 断定を避けた項目\n\n';
md += '情報が与えられていない設備は、推測で確定させず注記付きにした。\n\n';
md += '- `toilet: "不明"` + `toiletNote: "要確認"` … 池の谷 / 八木 / 三ツ星 / 不動の滝\n';
md += '- `reservation: "要"` + `reservationNote: "要確認"` … 予約要否が未提示のもの（「予約不要」と誤表示しないため安全側に倒した）\n';
md += '- `bonfire: true` + `bonfireNote: "可否は要確認"` … 焚き火可否が未提示のもの（false にすると「焚き火不可」バッジが誤って出るため）\n';
md += '- `carIn: true` … 三ツ星・不動の滝は「オートキャンプ場」という施設種別からの判断\n';
md += '- `season: "要確認"` … 営業期間が未提示のもの\n';
md += '\n## 既存2件の同定\n\n';
md += '| slug | 変更 |\n| --- | --- |\n';
md += '| `sessokyo-camp` | name を「接岨YANBY OUTDOOR FIELD」に修正。なっぷ掲載施設との同定が推定のため `needsVerify: true` |\n';
md += '| `kawanehon-camp` | 家山は島田市川根町であり川根本町ではないため `needsVerify: true`。soloComment 冒頭に断りを追加 |\n';
fs.writeFileSync(NOTES_PATH, md);

console.log(`\n合計 ${camps.length}件`);
console.log(`needsVerify: ${camps.filter(c => c.needsVerify).length}件`);
console.log(`出力: ${path.relative(process.cwd(), NOTES_PATH)}`);
