/**
 * MISSING HIGH の掲載追加（2026-08-10）。
 *
 * `district-sweep.js` が出した MISSING HIGH 22件を1件ずつ検証し、
 * 3条件（キャンプ場か／ソロで泊まれるか／今も営業しているか）を満たした5件を追加する。
 * 判定の全記録は `missing-high-2026-08.md`、候補の元データは
 * `candidates-missing-high.json`。
 *
 * 使い方: node scripts/apply-missing-high-2026-08.js
 *
 * ## この5件に共通する注意
 *
 * - **座標を1件も入れていない。**Google Places を使わない方針で取得しておらず、
 *   推測で入れると §6-16 の捏造になる。全件 `lat/lng = 0` + `needsCoord: true`
 * - **`soloComment` を全件空にしてある。**実在と実態が確定してから書く。
 *   §6-16 のとおり、空欄を埋めるために推測で書いてはいけない。
 *   `validate-data.js` の必須フィールドに `soloComment` は入っていないので空で通る
 * - `scores` は必須フィールドなので入れる。**軸ごとの根拠は md に書き出し、
 *   根拠が無い軸は「根拠なし」と明記する**（`apply-nanbu-2026-08-06.js` と同じ作法）
 *
 * ## 営業根拠の強さで扱いを分けた
 *
 * `nishitanzawa-nakagawa-lodge` だけ **`needsVerify: true`** を立てている。
 * 営業の根拠が「町観光協会サイトが更新されている」だけで、施設公式でも
 * 予約サイトでもない。§6-20 のとおり L1 の掲載は営業の証明にならない。
 */
const fs = require('fs');
const path = require('path');

const { normalizeName } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'added-missing-high-2026-08.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

/** 情報が取れていない項目は断定しない。要確認の注記を残す。 */
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

const base = (slug, name, prefecture, area, scores, extra = {}) => ({
  id: slug,
  slug,
  name,
  prefecture,
  area,
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
  soloComment: '',   // **空のまま。実在と実態が確定してから書く**
  tel: null,
  lastVerified: '2026-08-10',
  ...extra,
});

const NEW = [];

/* ── a) 藤野芸術の家キャンプ場 ────────────────────────────────────────────
 * 名前は相模原市観光協会の表記どおり「藤野芸術の家キャンプ場」。
 * 宿泊研修施設本体（藤野芸術の家）とは「キャンプ場」の有無で区別できる。
 * 施設公式 https://fujino-art.jp/camp/ にテント持込の料金表がある。
 */
{
  const c = base('fujino-art-camp', '藤野芸術の家キャンプ場', '神奈川', '相模原・秋山',
    { quietness: 4, scenery: 3, value: 3, access: 4, facility: 4 });
  c.address = '神奈川県相模原市緑区牧野4819';
  c.tel = '042-689-3030';
  c.season = '4月〜10月';
  c.priceMin = 3000;
  c.priceMax = 3000;
  c.priceNote =
    'テント持込 1張り1泊3,000円。駐車場は無料（普通車20台程度）で入場料の記載なし。' +
    '1張り単位で最少人数の条件が無いため、ソロ1名でも3,000円';
  c.priceVerified = true;
  c.officialUrl = 'https://fujino-art.jp/';
  Object.assign(c.features, {
    shower: true,
    toilet: '有',
    toiletNote: '相模原市観光協会の記載',
    carIn: false,
    carInNote: '駐車場は無料（普通車20台程度）。サイトへの乗り入れ可否は要確認',
    reservation: '要',
    reservationNote: '電話予約（9:00〜21:00）。7・8月のハイシーズンは抽選',
  });
  c.cautions = ['7・8月のハイシーズンは抽選', '11月〜3月は閉鎖'];
  NEW.push(c);
}

/* ── b) 西湖湖畔キャンプ場 ──────────────────────────────────────────────── */
{
  const c = base('saiko-kohan-camp', '西湖湖畔キャンプ場', '山梨', '西湖',
    { quietness: 3, scenery: 4, value: 4, access: 3, facility: 3 });
  c.address = '山梨県南都留郡富士河口湖町西湖207-7';
  c.tel = '0555-82-2858';
  c.season = '通年';
  c.priceMin = 1500;
  c.priceMax = 2500;
  c.priceNote =
    '大人1,500円／1泊／1名。車は別途1台1,000円、バイク500円。' +
    '徒歩ソロ1,500円／バイクソロ2,000円／車ソロ2,500円。' +
    'フリーサイトは予約不可・先着順、バンガローは予約制';
  c.priceVerified = true;
  c.officialUrl = 'http://www.saikohan.com/';
  Object.assign(c.features, {
    carIn: true,
    carInNote: 'オートキャンプ（テント）あり。車1台1,000円',
    reservation: '不要',
    reservationNote: 'フリーサイトは予約不可・先着順。バンガローのみ予約制',
  });
  NEW.push(c);
}

/* ── c) 西湖津原キャンプ場 ──────────────────────────────────────────────── */
{
  const c = base('saiko-tsuhara-camp', '西湖津原キャンプ場', '山梨', '西湖',
    { quietness: 3, scenery: 4, value: 4, access: 3, facility: 3 });
  c.address = '山梨県南都留郡富士河口湖町西湖351';
  c.season = '4月〜11月';
  c.priceMin = 1500;
  c.priceMax = 1500;
  c.priceNote =
    'オートキャンプ（1名）大人1,500円。施設公式の料金表に駐車料の別立ては無い。' +
    'デイキャンプは大人1,000円';
  c.priceVerified = true;
  c.officialUrl = 'http://tsuhara-camp.jp/';
  Object.assign(c.features, {
    carIn: true,
    carInNote: 'オートキャンプ。林間サイト・湖畔サイト・広場サイトがある',
    reservation: '要',
    reservationNote: '公式サイトで空室状況と営業日カレンダーを公開',
  });
  c.cautions = [
    '住所は出典により西湖351（町観光連盟）と西湖2299（じゃらん）で割れている。要確認',
  ];
  NEW.push(c);
}

/* ── d) 白石オートキャンプ場 ─────────────────────────────────────────────
 * **車両単位課金。**ソロでも二輪4,000円・車7,000円の満額で、1名分に割り引かれない。
 * §10-2 の priceMin の意味の統一に関わるので priceNote の先頭に明記する。
 */
{
  const c = base('shiraishi-auto-camp', '白石オートキャンプ場', '神奈川', '西丹沢',
    { quietness: 4, scenery: 4, value: 2, access: 2, facility: 3 });
  c.address = '神奈川県足柄上郡山北町中川字相馬沢870-3';
  c.season = '通年';
  c.priceMin = 4000;
  c.priceMax = 7000;
  c.priceNote =
    '**車両単位の課金。ソロでも二輪1台4,000円／車1台7,000円の満額で、1名分に割り引かれない。**' +
    '二輪車1台2名まで1日4,000円、車1台4名まで7,000円（増員は小学生以上1人500円）。' +
    'デイキャンプは車1台4名まで3,000円';
  c.priceVerified = true;
  c.officialUrl = 'https://www.shiraishiautocamp.com/';
  Object.assign(c.features, {
    carIn: true,
    carInNote: 'オートキャンプ場。料金は車両単位',
    reservation: '要',
    reservationNote: 'キャンセル料は10日前から100%',
  });
  c.cautions = ['キャンセル料が10日前から100%'];
  NEW.push(c);
}

/* ── e) 西丹沢中川ロッヂ ────────────────────────────────────────────────
 * **条件付きで反映する。**営業の根拠が町観光協会サイトの更新だけで、
 * 施設公式でも予約サイトでもない。§6-20 のとおり L1 の掲載は営業の証明にならない。
 */
{
  const c = base('nishitanzawa-nakagawa-lodge', '西丹沢中川ロッヂ', '神奈川', '西丹沢',
    { quietness: 4, scenery: 3, value: 3, access: 2, facility: 4 });
  c.address = '神奈川県足柄上郡山北町中川字小塚897-111';
  c.tel = '0465-78-3780';
  c.priceMin = 3000;
  c.priceMax = 3500;
  c.priceNote =
    'キャンプサイト3,000円〜／名。駐車料は別で普通車500円／台、バイク200円／台。' +
    '徒歩ソロ3,000円／バイクソロ3,200円／車ソロ3,500円。バンガローは6,000円〜／名';
  c.priceVerified = true;
  Object.assign(c.features, {
    carIn: true,
    carInNote: '駐車場あり（普通車500円／台、バイク200円／台）',
    reservation: '要',
    reservationNote: '予約専用携帯 090-7715-8522（8:00〜18:00）',
  });
  c.needsVerify = true;
  c.needsVerifyNote =
    '営業根拠が町観光協会（山北町観光協会）の更新のみで、施設公式・予約枠が未確認。' +
    '施設公式サイトが見つからず、なっぷ・じゃらんの掲載も確認できていない。' +
    '掲載ページ自体の更新日も不明。出典: https://www.yamakita.net/stay/detail.php?id=11&type=2 ' +
    '（同サイトは 2026/07/07 のお知らせを掲載しており、サイト全体は更新されている）。' +
    '次にやること: 予約専用携帯 090-7715-8522 で営業とソロ利用の可否を確認する。';
  NEW.push(c);
}

/* ── 重複チェック（slug と正規化した名前の両方） ───────────────────────── */
const bySlug = new Map(camps.map(c => [c.slug, c]));
const byName = new Map();
for (const c of camps) {
  const k = normalizeName(c.name);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(c);
}
/** 大字＋番地。名前が違っても同一施設を捕まえる（§I-2 の重複チェックで効いた） */
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

const toAdd = [];
const dupes = [];
for (const c of NEW) {
  const slugHit = bySlug.get(c.slug);
  const nameHit = byName.get(normalizeName(c.name)) || [];
  const banchiHit = byBanchi.get(banchi(c.address)) || [];
  if (slugHit || nameHit.length || banchiHit.length) dupes.push({ c, slugHit, nameHit, banchiHit });
  else toAdd.push(c);
}

console.log('── 重複チェック ──────────────────────────');
console.log(`追加候補 ${NEW.length}件 → 追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件`);
for (const d of dupes) {
  console.log(`  スキップ: ${d.c.name}（${d.c.slug}）`);
  if (d.slugHit) console.log('    理由: slug が既存と重複');
  d.nameHit.forEach(h => console.log(`    理由: 名前が既存と重複 → ${h.slug} / ${h.name}`));
  d.banchiHit.forEach(h => console.log(`    理由: 大字＋番地が既存と一致 → ${h.slug} / ${h.name} / ${h.address}`));
}

camps.push(...toAdd);
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

console.log('\n── 追加した施設 ────────────────────────');
for (const c of toAdd) {
  console.log(`  ${c.slug.padEnd(30)} ${c.name}`);
  console.log(`    ${c.address} / priceMin ${c.priceMin} / needsCoord ${c.needsCoord} / soloComment 空=${c.soloComment === ''}` +
    (c.needsVerify ? ' / **needsVerify**' : ''));
}

/* ── ノート ───────────────────────────────────────────────────────────── */
const EVIDENCE = {
  'fujino-art-camp': {
    quietness: null, scenery: null, value: 'テント持込1張り3,000円・駐車無料',
    access: 'JR藤野駅からバス5分＋徒歩1分／相模湖ICから約5分', facility: 'シャワー・トイレ完備、体験工房併設',
  },
  'saiko-kohan-camp': {
    quietness: null, scenery: '西湖の湖畔', value: '大人1,500円／1名',
    access: null, facility: null,
  },
  'saiko-tsuhara-camp': {
    quietness: null, scenery: '西湖の湖畔（林間サイト・湖畔サイト）', value: 'オートキャンプ1名1,500円',
    access: null, facility: null,
  },
  'shiraishi-auto-camp': {
    quietness: '西丹沢キャンプ場群の最上流', scenery: '中川川の渓流沿い', value: '車両単位で二輪4,000円・車7,000円',
    access: '丹沢湖からさらに上流', facility: null,
  },
  'nishitanzawa-nakagawa-lodge': {
    quietness: null, scenery: null, value: 'キャンプサイト3,000円〜／名',
    access: null, facility: 'キャンプサイト全33区画・レンタル品・隣接の交流の里',
  },
};
const AXES = ['quietness', 'scenery', 'value', 'access', 'facility'];
const LABEL = { quietness: '静けさ', scenery: '絶景', value: 'コスパ', access: 'アクセス', facility: '設備' };

let md = '# MISSING HIGH からの掲載追加（2026-08-10）\n\n';
md += `追加候補 ${NEW.length}件 → **追加 ${toAdd.length}件 / 重複スキップ ${dupes.length}件**\n\n`;
md += '`district-sweep.js` の MISSING HIGH 22件を1件ずつ検証し、3条件\n';
md += '（キャンプ場か／ソロで泊まれるか／今も営業しているか）を満たした5件。\n';
md += '判定の全記録は `missing-high-2026-08.md`。\n\n';
md += '重複チェックは slug・正規化した施設名・**大字＋番地**の3通りで実施した。\n';
md += '番地を見ないと、名前の違いで同一施設を新規投入してしまう（22件中2件がそれだった）。\n\n';

md += '## 全件に共通すること\n\n';
md += '- **座標なし。**全件 `lat/lng = 0` + `needsCoord: true`。\n';
md += '  Google Places を使わない方針で取得しておらず、推測で入れると §6-16 の捏造になる\n';
md += '- **`soloComment` は全件空。**実在と実態が確定してから書く。\n';
md += '  `validate-data.js` の必須フィールドに `soloComment` は入っていないので空で通る\n';
md += '- `lastVerified: 2026-08-10` / `status: active`\n\n';

md += '## scores の根拠\n\n';
md += '**根拠が無い軸は「根拠なし」と書いてある。**そこは推測値なので、';
md += '現地または一次情報で確認したら直すこと。\n\n';
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

md += '\n## 料金\n\n';
md += '`priceMin` は**ソロ1名が実際に払う総額**（入場料・駐車料・管理費込み）。\n\n';
md += '| slug | priceMin | priceMax | 課金方式 |\n| --- | --- | --- | --- |\n';
for (const c of toAdd) {
  const kind = c.slug === 'shiraishi-auto-camp' ? '**車両単位**（ソロでも満額）'
    : (c.slug === 'saiko-kohan-camp' || c.slug === 'nishitanzawa-nakagawa-lodge') ? '人数単位＋駐車料が別'
    : '人数単位／区画単位';
  md += `| \`${c.slug}\` | ${c.priceMin} | ${c.priceMax} | ${kind} |\n`;
}

md += '\n## needsVerify を立てたもの\n\n';
const nv = toAdd.filter(c => c.needsVerify);
if (!nv.length) md += 'なし\n';
else {
  md += '| slug | 理由 |\n| --- | --- |\n';
  for (const c of nv) md += `| \`${c.slug}\` | ${c.needsVerifyNote} |\n`;
}

md += '\n## 営業根拠の強さ\n\n';
md += '| slug | 営業の根拠 | 強さ |\n| --- | --- | --- |\n';
md += '| `saiko-tsuhara-camp` | 施設公式が**当日のサイト空き状況**と営業日カレンダーを掲載 | 強 |\n';
md += '| `fujino-art-camp` | 施設公式に2026年の表記とオープン期間 | 中 |\n';
md += '| `saiko-kohan-camp` | 施設公式に2026年の表記 | 中 |\n';
md += '| `shiraishi-auto-camp` | 施設公式に2026年の表記 | 中 |\n';
md += '| `nishitanzawa-nakagawa-lodge` | 町観光協会サイトの更新のみ | **弱（needsVerify）** |\n';

fs.writeFileSync(NOTES_PATH, md);
console.log(`\n→ ${path.relative(path.join(__dirname, '..'), NOTES_PATH)}`);
