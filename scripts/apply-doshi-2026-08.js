/**
 * 道志村の掲載追加（2026-08-10 の検証、2026-08-11 反映）。
 *
 * `district-sweep.js` が道志村1地区から出した MISSING HIGH 22件を1件ずつ検証し、
 * 3条件（キャンプ場か／ソロで泊まれるか／今も営業しているか）を満たした3件を追加する。
 * 判定の全記録は `missing-high-doshi-2026-08.md`、候補は `candidates-doshi-2026-08.json`。
 *
 * 使い方: node scripts/apply-doshi-2026-08.js
 *
 * ## 道志村を扱うときの注意
 *
 * **道志村は大字を持たない。**住所が「道志村＋地番」で完結する。
 * - `verify-address-gsi.js` は **NO_OAZA になるのが正常**で MATCH は出ない
 * - **住所の裏取りを座標でできない。**番地が正しいかは
 *   村公式と施設公式の記載が一致していることだけが根拠
 *
 * ## 3件に共通すること
 *
 * - 座標なし（`lat/lng = 0` + `needsCoord: true`）。推測で入れると §6-16 の捏造
 * - `soloComment` は空。実在と実態が確定してから書く
 * - `priceNote` の先頭に**課金方式**を書く（§10-2。白石オートと同じ書き方）
 */
const fs = require('fs');
const path = require('path');

const { normalizeName } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'added-doshi-2026-08.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const baseFeatures = () => ({
  bonfire: false,
  bonfireNote: '可否は要確認（焚き火台持参が無難）',
  pet: false,
  petNote: '要確認',
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
  area: '道志村',
  status: 'active',
  address: '',
  type: 'campground',
  lat: 0,
  lng: 0,
  needsCoord: true,
  priceMin: 0,
  priceMax: 0,
  priceNote: '',
  scores,
  features: baseFeatures(),
  season: '要確認',
  soloComment: '',   // **空のまま**
  tel: null,
  lastVerified: '2026-08-10',   // 検証した日。反映は 2026-08-11
  ...extra,
});

const NEW = [];

/* ── a) 両国橋キャンプ場 ─────────────────────────────────────────────── */
{
  const c = base('ryokokubashi-camp', '両国橋キャンプ場',
    { quietness: 3, scenery: 4, value: 4, access: 4, facility: 3 });
  c.address = '山梨県南都留郡道志村49';
  c.tel = '042-787-2250';
  c.season = '通年（年末年始休）';
  c.priceMin = 3200;
  c.priceMax = 4100;
  c.priceNote =
    '**人数課金＋サイト料＋車両料の3階建て。**テント泊（通常期）大人700円＋サイト料2,000円に、' +
    'バイク126cc〜500円／普通車・軽1,400円が加算される。' +
    'ソロ（バイク）3,200円／ソロ（車）4,100円。繁忙期は車両料金が上がる。' +
    '※オートキャンプ（サイトへの乗り入れ）は受け入れ不可';
  c.priceVerified = true;
  c.officialUrl = 'http://yukawaya.a.la9.jp/';
  Object.assign(c.features, {
    carIn: false,
    carInNote: 'オートキャンプは受け入れ不可。駐車は車両料金が別途かかる',
    reservation: '要',
    reservationNote: '通常料金の日は2〜3台なら予約不要',
  });
  c.cautions = ['オートキャンプ（サイトへの車の乗り入れ）は不可'];
  NEW.push(c);
}

/* ── b) ニュー田代オートキャンプ場 ──────────────────────────────────── */
{
  const c = base('new-tashiro-auto-camp', 'ニュー田代オートキャンプ場',
    { quietness: 3, scenery: 3, value: 4, access: 3, facility: 3 });
  c.address = '山梨県南都留郡道志村5910';
  c.tel = '090-7713-8364';
  c.season = '通年（2月中旬〜3月上旬休）';
  c.priceMin = 3000;
  c.priceMax = 3000;
  c.priceNote =
    '**人数課金＋テントサイト料＋駐車料の3階建て。**利用料金 中学生以上1,000円＋' +
    'テントサイト利用料 1張1,000円＋駐車料（車1,000円／バイク1,000円）。' +
    'ソロ3,000円（車・バイクとも同額）。キャンピングカーは3,000円でFサイト限定';
  c.priceVerified = true;
  c.officialUrl = 'https://tashiro-autocamp.com/';
  Object.assign(c.features, {
    shower: true,
    showerNote: '宿泊者は無料',
    carIn: true,
    carInNote: 'オートキャンプ場。駐車料は別',
  });
  NEW.push(c);
}

/* ── c) 室久保グリーンパーク（THE Do-c Camp） ───────────────────────────
 * **名前を併記にした理由。**
 * 村公式（自治体公式）は「室久保グリーンパーク」、施設公式は「THE Do-c Camp！」で、
 * **施設サイトは「室久保グリーンパーク」を一度も名乗っていない**（室久保は川の名前として
 * 出てくるだけ）。改称して、村の一覧が旧称のまま残っていると読める。
 *
 * 出典の格は 自治体公式 > 施設公式 なので村公式の表記を主にするが、
 * §6-22 のとおり**一覧に載っていることは、その一覧が更新されている意味にはならない。**
 * 利用者が施設公式や予約サイトで見る名前と乖離するので、施設側の名前を括弧で併記する。
 */
{
  const c = base('murokubo-greenpark', '室久保グリーンパーク（THE Do-c Camp）',
    { quietness: 4, scenery: 3, value: 3, access: 3, facility: 3 });
  c.address = '山梨県南都留郡道志村7329';
  c.season = '不定休';
  c.priceMin = 3300;
  c.priceMax = 4400;
  c.priceNote =
    '**サイト単位課金。ソロでも定員1〜5名分の満額を払う。**' +
    '9m×9mのサイトが3,300円（週末・祝前日4,400円）で、1〜5名程度まで同額。' +
    '追加は大人+2,200円／子供+1,650円／ペット+1,100円。予約サイトから事前決済';
  c.priceVerified = true;
  c.officialUrl = 'https://the-do-c.com';
  Object.assign(c.features, {
    pet: true,
    petNote: 'ペット+1,100円',
    carIn: true,
    carInNote: '9m×9mの区画サイト',
    reservation: '要',
    reservationNote: '公式の予約サイトから事前決済',
  });
  c.cautions = ['村公式は「室久保グリーンパーク」、施設公式は「THE Do-c Camp」で名称が異なる'];
  NEW.push(c);
}

/* ── 重複チェック（slug・正規化した名前・大字＋番地の3通り） ─────────────
 * 道志村には既に12件あり、名前が似た施設が多い。
 * 椿／椿荘・水の元／水源の森・長又／とやの沢・ブナの森／道志森のコテージは
 * **全部別施設**（番地も電話も違う）で、名前だけで寄せると実在する施設を潰す。
 */
const bySlug = new Map(camps.map(c => [c.slug, c]));
const byName = new Map();
for (const c of camps) {
  const k = normalizeName(c.name);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(c);
}
const banchi = a => {
  if (!a) return null;
  const t = String(a).normalize('NFKC').replace(/\s+/g, '')
    .replace(/^.{2,3}[都道府県]/, '').replace(/[（(].*$/, '')
    .replace(/番地?|号|丁目/g, '-').replace(/-{2,}/g, '-');
  const m = t.match(/^(.*?)(\d[\d-]*)/);
  return m ? m[1] + m[2].replace(/-+$/, '') : null;
};
const byBanchi = new Map();
for (const c of camps) {
  const k = banchi(c.address);
  if (!k) continue;
  if (!byBanchi.has(k)) byBanchi.set(k, []);
  byBanchi.get(k).push(c);
}
/** 電話番号でも見る。道志村は名前が似た施設が多く、電話が最も強い識別子だった */
const byTel = new Map();
for (const c of camps) {
  if (!c.tel) continue;
  const k = String(c.tel).replace(/-/g, '');
  if (!byTel.has(k)) byTel.set(k, []);
  byTel.get(k).push(c);
}

const toAdd = [];
const dupes = [];
for (const c of NEW) {
  const slugHit = bySlug.get(c.slug);
  const nameHit = byName.get(normalizeName(c.name)) || [];
  const banchiHit = byBanchi.get(banchi(c.address)) || [];
  const telHit = c.tel ? (byTel.get(String(c.tel).replace(/-/g, '')) || []) : [];
  if (slugHit || nameHit.length || banchiHit.length || telHit.length) {
    dupes.push({ c, slugHit, nameHit, banchiHit, telHit });
  } else toAdd.push(c);
}

console.log('── 重複チェック（slug / 名前 / 大字＋番地 / 電話） ──────────');
console.log(`追加候補 ${NEW.length}件 → 追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件`);
for (const d of dupes) {
  console.log(`  スキップ: ${d.c.name}（${d.c.slug}）`);
  if (d.slugHit) console.log('    理由: slug が既存と重複');
  d.nameHit.forEach(h => console.log(`    理由: 名前が既存と重複 → ${h.slug} / ${h.name}`));
  d.banchiHit.forEach(h => console.log(`    理由: 番地が既存と一致 → ${h.slug} / ${h.address}`));
  d.telHit.forEach(h => console.log(`    理由: 電話が既存と一致 → ${h.slug} / ${h.tel}`));
}

camps.push(...toAdd);
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

console.log('\n── 追加した施設 ────────────────────────');
for (const c of toAdd) {
  console.log(`  ${c.slug.padEnd(24)} ${c.name}`);
  console.log(`    ${c.address} / priceMin ${c.priceMin} / needsCoord ${c.needsCoord} / soloComment 空=${c.soloComment === ''}`);
}

/* ── ノート ───────────────────────────────────────────────────────── */
const EVIDENCE = {
  'ryokokubashi-camp': {
    quietness: null, scenery: '道志川沿い・国道413号のすぐ脇', value: 'ソロ3,200円（バイク）',
    access: '国道413号沿い、道志村の東端で相模湖IC寄り', facility: 'サイト20／バンガロー9棟',
  },
  'new-tashiro-auto-camp': {
    quietness: null, scenery: null, value: 'ソロ3,000円',
    access: null, facility: 'サイト25／バンガロー2棟・シャワー無料（宿泊者）',
  },
  'murokubo-greenpark': {
    quietness: '室久保川沿いで国道から入った位置', scenery: null, value: 'サイト単位3,300円（ソロでも満額）',
    access: null, facility: 'サイト26・9m×9mの区画',
  },
};
const AXES = ['quietness', 'scenery', 'value', 'access', 'facility'];
const LABEL = { quietness: '静けさ', scenery: '絶景', value: 'コスパ', access: 'アクセス', facility: '設備' };

let md = '# 道志村の掲載追加（2026-08-11 反映）\n\n';
md += `追加候補 ${NEW.length}件 → **追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件**\n\n`;
md += '`district-sweep.js` が道志村から出した MISSING HIGH 22件を1件ずつ検証し、\n';
md += '3条件を満たした3件。判定の全記録は `missing-high-doshi-2026-08.md`\n';
md += '（候補3件 / 除外1件 / 保留18件）。\n\n';
md += '重複チェックは slug・正規化した施設名・**大字＋番地**・**電話番号**の4通りで実施した。\n';
md += '道志村は名前が似た施設が多く（椿／椿荘、水の元／水源の森、長又／とやの沢、\n';
md += 'ブナの森／道志森のコテージ）、**4組とも番地と電話が両方違う別施設**だった。\n\n';

md += '## 道志村の前提\n\n';
md += '**大字を持たない。**住所が「道志村＋地番」で完結する。\n\n';
md += '- `verify-address-gsi.js` は **NO_OAZA になるのが正常**で MATCH は出ない\n';
md += '- **住所の裏取りを座標でできない。**番地が正しいかは村公式と施設公式の\n';
md += '  記載が一致していることだけが根拠になる\n\n';

md += '## 名前の扱い — `murokubo-greenpark`\n\n';
md += '村公式（自治体公式）は「室久保グリーンパーク」、施設公式は「THE Do-c Camp！」。\n';
md += '**施設サイトは「室久保グリーンパーク」を一度も名乗っていない**\n';
md += '（「室久保川」という川の名前として出てくるだけ）。改称して、村の一覧が\n';
md += '旧称のまま残っていると読める。\n\n';
md += '出典の格は 自治体公式 > 施設公式 なので村公式の表記を主にしたが、\n';
md += '**§6-22 のとおり「一覧に載っている」ことは、その一覧が更新されている意味にはならない。**\n';
md += '利用者が施設公式や予約サイトで見る名前と乖離するので、\n';
md += '**`室久保グリーンパーク（THE Do-c Camp）` と併記**した。\n\n';

md += '## scores の根拠\n\n';
md += '**根拠が無い軸は「根拠なし」と書いてある。**推測値なので、確認したら直すこと。\n\n';
md += '| slug | 名前 | ' + AXES.map(a => LABEL[a]).join(' | ') + ' |\n';
md += '| --- | --- | ' + AXES.map(() => '---').join(' | ') + ' |\n';
for (const c of toAdd) {
  const ev = EVIDENCE[c.slug] || {};
  md += `| \`${c.slug}\` | ${c.name} | ` +
    AXES.map(a => `${c.scores[a]}<br><sub>${ev[a] ? ev[a] : '**根拠なし**'}</sub>`).join(' | ') + ' |\n';
}
md += '\n### 根拠がない軸\n\n';
for (const c of toAdd) {
  const ev = EVIDENCE[c.slug] || {};
  const none = AXES.filter(a => !ev[a]);
  md += `- \`${c.slug}\`: ${none.length ? none.map(a => `${LABEL[a]}(${c.scores[a]})`).join('、') : 'なし'}\n`;
}

md += '\n## 料金 — 3件とも課金方式が違う\n\n';
md += '`priceMin` は**ソロ1名が実際に払う総額**。`priceNote` の先頭に課金方式を書いた。\n\n';
md += '| slug | priceMin | priceMax | 課金方式 |\n| --- | --- | --- | --- |\n';
md += '| `ryokokubashi-camp` | 3,200 | 4,100 | 人数課金＋サイト料＋車両料の3階建て |\n';
md += '| `new-tashiro-auto-camp` | 3,000 | 3,000 | 人数課金＋テントサイト料＋駐車料の3階建て |\n';
md += '| `murokubo-greenpark` | 3,300 | 4,400 | **サイト単位。ソロでも定員1〜5名分の満額** |\n';

md += '\n## 全件に共通すること\n\n';
md += '- **座標なし。**全件 `lat/lng = 0` + `needsCoord: true`\n';
md += '- **`soloComment` は空。**実在と実態が確定してから書く\n';
md += '- `lastVerified: 2026-08-10`（検証した日。反映は 2026-08-11）\n';

fs.writeFileSync(NOTES_PATH, md);
console.log(`\n→ ${path.relative(path.join(__dirname, '..'), NOTES_PATH)}`);
