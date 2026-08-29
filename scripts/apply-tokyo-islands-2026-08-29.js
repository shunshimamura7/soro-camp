/**
 * 東京都・島嶼の3件を追加する（2026-08-29）。
 *
 *   node scripts/apply-tokyo-islands-2026-08-29.js            # 何もしない（差分の確認だけ）
 *   node scripts/apply-tokyo-islands-2026-08-29.js --write --force
 *
 * ## 何を入れるか
 *
 * トウシキキャンプ場（大島町）/ 都立羽伏浦野営場（新島村）/ 底土野営場（八丈町）。
 * いずれも**自治体・都の管理する施設**で、受付（予約または当日届出）と公式ページがある。
 * したがって `type` は `"wild"` ではなく **`"campground"`**。
 * 当初は野営地候補として上がったが、一次情報を読むと管理者・受付・設備が揃っていた。
 * 野営地タブは「公認なし」を知らせるための棚なので、予約必須の自治体施設を混ぜない。
 *
 * 青ヶ島キャンプ場は今回入れない（別途判断）。
 * 羽村市の多摩川一般河川敷は、区域であって実ピンが立たないため見送り。
 *
 * ## 座標を入れていない理由
 *
 * `lat/lng` は 0 で `needsCoord: true`。**実ピンはしゅん本人が目視で取る。**
 * 住所ジオコーディングの推測値を施設座標として登録しない（§既定の方針）。
 *
 * ## isIsland
 *
 * 3件とも `isIsland: true`。東京の `PREFECTURE_BOUNDS` は本土だけの矩形なので、
 * 島嶼の実ピンを入れると範囲外エラーになる。フラグで矩形検査を外し、
 * 代わりに `verify-coords-gsi.js` の逆ジオで市区町村一致を見る運用にした。
 * 詳細は `scripts/prefecture-bounds.js` の東京のコメント。
 *
 * ## ガード
 *
 * 1. `--write` と `--force` の両方が無ければ書かない
 * 2. slug / id が既存と衝突したら中止（上書き事故の防止）
 * 3. 入れる値そのものを検査（prefecture / type / isIsland / needsCoord / scores / cautions数）
 * 4. 書いたあとに読み直し、**既存201件が1バイトも変わっていない**ことと、
 *    整形が `JSON.stringify(x, null, 2) + '\n'` のままであることを確認する
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const write = process.argv.includes('--write');
const force = process.argv.includes('--force');

/** 追加する3件。根拠URLは officialUrl と cautions に入れてある。 */
const RECORDS = [
  {
    id: 'toshiki-camp',
    slug: 'toshiki-camp',
    name: 'トウシキキャンプ場',
    prefecture: '東京',
    area: '伊豆大島',
    address: '東京都大島町差木地字クダッチ',
    type: 'campground',
    isIsland: true,
    status: 'active',
    cautions: [
      '常駐する管理人はいない。大島町観光課 施設管理係が管理 https://www.town.oshima.tokyo.jp/soshiki/kankou/toshiki-camp.html',
      '事前予約が必須。原則Web予約のみで、会員登録（無料）が必要 https://toshikicamp-nakanoharabbq.com',
      '施設は洗い場・かまど2基・トイレ（シャワー付）・休憩舎・ゴミ集積場所。トイレの様式は公式ページに記載がない',
      '直火の可否は公式ページに記載がない。かまどが2基設置されている',
      '送迎は実施していない。元町港からバス約25分「海洋国際高校前」下車、徒歩約5分',
      '離島のため、船・航空機の欠航で予定どおり帰れないことがある',
    ],
    lat: 0,
    lng: 0,
    needsCoord: true,
    priceMin: 0,
    priceMax: 0,
    priceNote: '無料',
    priceVerified: true,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      shower: true,
      toilet: '不明',
      reservation: '要',
      reservationNote: '事前予約が必須。原則Web予約のみ・会員登録が必要',
      garbage: 'ゴミ集積場所あり',
    },
    tel: '04992-2-1446',
    telNote: '大島町 観光課 施設管理係',
    lastVerified: '2026-08-29',
    officialUrl: 'https://www.town.oshima.tokyo.jp/soshiki/kankou/toshiki-camp.html',
    reservationUrl: 'https://toshikicamp-nakanoharabbq.com',
  },
  {
    id: 'hafusaura-yaeijo',
    slug: 'hafusaura-yaeijo',
    name: '都立羽伏浦野営場',
    prefecture: '東京',
    area: '新島',
    address: '東京都新島村羽伏浦',
    type: 'campground',
    isIsland: true,
    status: 'active',
    cautions: [
      '予約不要で通年利用できるが、当日受付が必要。新島村スポーツ広場クラブハウスで「羽伏浦野営場キャンプ届」を9:00〜16:00に提出する https://www.niijima.com/soshiki/sangyoukankouka/news/2023-1026-1806-101.html',
      '毎週木曜はクラブハウスが休業。利用開始日が木曜の場合は翌日9:00〜16:00に届を提出する',
      '新島・式根島とも島内での野宿は禁止。式根島地区の野営場は継続閉場中',
      '1日あたり100名まで、連続利用は5泊6日まで。当日受付は先着順',
      '設備は共用トイレ・共用炊事場・野外炉・シャワー（水のみで温水は出ない）。貸テント・食材・炭の販売と電源はない',
      '野外炉は破損している場所が複数ある。焚き火台やバーベキュー台の用意があると安心と案内されている',
      '20名以上の団体は事前に新島村産業観光課へ連絡が必要（定員超過で利用できない場合がある）',
      '離島のため、船・航空機の欠航で予定どおり帰れないことがある',
    ],
    lat: 0,
    lng: 0,
    needsCoord: true,
    priceMin: 0,
    priceMax: 0,
    priceNote: '無料',
    priceVerified: true,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      shower: true,
      showerNote: '水のみ・温水なし',
      toilet: '不明',
      reservation: '不要',
      reservationNote: '予約不要だが当日受付（キャンプ届の提出）が必要',
      bonfire: true,
      bonfireNote: '野外炉あり。破損箇所が複数あり焚き火台の用意が案内されている',
    },
    season: '通年',
    tel: '04992-5-0284',
    telNote: '新島村役場 産業観光課 観光係',
    lastVerified: '2026-08-29',
    officialUrl: 'https://www.niijima.com/soshiki/sangyoukankouka/news/2023-1026-1806-101.html',
  },
  {
    id: 'sokodo-yaeijo',
    slug: 'sokodo-yaeijo',
    name: '底土野営場',
    prefecture: '東京',
    area: '八丈島',
    address: '東京都八丈町底土',
    type: 'campground',
    isIsland: true,
    status: 'active',
    cautions: [
      '東京都八丈支庁 土木課が所管する園地施設。野営には予約（先着順）が必要 https://www.soumu.metro.tokyo.lg.jp/09hatijou/kakuka_top/c-doboku/naturalpark',
      'たき火は禁止されている（除外は大潟浦園地の窪地での手持ち花火とキャンプファイヤーのみ）。花火も禁止',
      'バーベキュー施設以外の場所での火の使用は遠慮するよう案内されている。バーベキュー施設は大潟浦園地・南原園地で、底土野営場は含まれない',
      'ゴミは所定の場所に捨てる（他の園地は各自持ち帰り。底土野営場だけの例外）',
      '野営場以外の場所での宿泊（野営）は断られている。野営場以外での個人用テントは日よけ目的の固定しない小型簡易テントのみ',
      '利用料金は公式ページに記載がない。予約時に八丈支庁土木課へ確認すること',
      '離島のため、船・航空機の欠航で予定どおり帰れないことがある',
    ],
    lat: 0,
    lng: 0,
    needsCoord: true,
    priceMin: 0,
    priceMax: 0,
    needsPrice: true,
    priceVerified: false,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      bonfire: false,
      bonfireNote: 'たき火・花火は禁止事項に明記',
      reservation: '要',
      reservationNote: '野営は予約（先着順）が必要',
      garbage: '所定の場所に捨てる',
    },
    lastVerified: '2026-08-29',
    officialUrl: 'https://www.soumu.metro.tokyo.lg.jp/09hatijou/kakuka_top/c-doboku/naturalpark',
  },
];

const raw = fs.readFileSync(DATA_PATH, 'utf8');
const before = JSON.parse(raw);

/* ── ガード2: 衝突 ───────────────────────────────────────────── */
const collisions = [];
for (const r of RECORDS) {
  for (const c of before) {
    if (c.slug === r.slug || c.id === r.id) collisions.push(`${r.slug}: 既存の ${c.slug} と衝突`);
    if (c.name === r.name) collisions.push(`${r.slug}: 名称「${r.name}」が既存の ${c.slug} と同じ`);
  }
}
if (collisions.length) {
  console.error('中止: 既存レコードと衝突している');
  collisions.forEach((x) => console.error('  ' + x));
  process.exit(1);
}

/* ── ガード3: 入れる値の検査 ─────────────────────────────────── */
const bad = [];
for (const r of RECORDS) {
  if (r.prefecture !== '東京') bad.push(`${r.slug}: prefecture が東京でない`);
  if (r.type !== 'campground') bad.push(`${r.slug}: type が campground でない`);
  if (r.isIsland !== true) bad.push(`${r.slug}: isIsland が true でない`);
  if (r.lat !== 0 || r.lng !== 0) bad.push(`${r.slug}: 座標を入れてはいけない（実ピンは人が取る）`);
  if (r.needsCoord !== true) bad.push(`${r.slug}: needsCoord が true でない`);
  if (r.scoresVerified !== false) bad.push(`${r.slug}: scoresVerified を立ててはいけない`);
  if (r.soloComment) bad.push(`${r.slug}: soloComment は根拠が薄いうちは書かない`);
  if (!r.officialUrl) bad.push(`${r.slug}: officialUrl が無い`);
  if (!Array.isArray(r.cautions) || r.cautions.length < 3) bad.push(`${r.slug}: cautions が3件未満`);
  if (!r.cautions.some((x) => /https?:\/\//.test(x))) bad.push(`${r.slug}: cautions に根拠URLが1つも無い`);
}
if (bad.length) {
  console.error('中止: 入れようとしている値が方針に反している');
  bad.forEach((x) => console.error('  ' + x));
  process.exit(1);
}

console.log(`追加する ${RECORDS.length}件:`);
for (const r of RECORDS) {
  console.log(`  ${r.slug.padEnd(18)} ${r.name}（${r.area}）cautions ${r.cautions.length}件 / ${r.officialUrl}`);
}
console.log(`\nレコード数: ${before.length} -> ${before.length + RECORDS.length}`);
const activeBefore = before.filter((c) => c.status === 'active').length;
console.log(`active: ${activeBefore} -> ${activeBefore + RECORDS.length}`);

if (!write || !force) {
  console.log('\n書き込んでいない。実行するには --write --force の両方を付けること。');
  process.exit(0);
}

/* ── 書き込み ────────────────────────────────────────────────── */
const after = before.concat(RECORDS);
fs.writeFileSync(DATA_PATH, JSON.stringify(after, null, 2) + '\n');

/* ── ガード4: 書いたあとの照合 ───────────────────────────────── */
const reread = fs.readFileSync(DATA_PATH, 'utf8');
const parsed = JSON.parse(reread);
const problems = [];
if (parsed.length !== before.length + RECORDS.length) problems.push('件数が合わない');
if (JSON.stringify(parsed, null, 2) + '\n' !== reread) problems.push('整形が崩れた');
for (let i = 0; i < before.length; i++) {
  if (JSON.stringify(parsed[i]) !== JSON.stringify(before[i])) {
    problems.push(`既存レコードが変わった: ${before[i].slug}`);
  }
}
if (problems.length) {
  console.error('\n書き込み後の照合に失敗した。手で戻すこと（git checkout data/campgrounds.json）');
  problems.forEach((x) => console.error('  ' + x));
  process.exit(1);
}
console.log('\n書き込み完了。既存レコードは1件も変わっていない。');
