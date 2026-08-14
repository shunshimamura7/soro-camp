/**
 * 山梨東部（大月市・都留市・上野原市）第1陣5件の投入（2026-08-14）。
 *
 *   node scripts/apply-yamanashi-east-2026-08-14.js
 *   node scripts/apply-yamanashi-east-2026-08-14.js --force   # ガードを押し切る
 *
 * ## 出どころ
 *
 * `sweep-大月市.md` / `sweep-上野原市.md` / `sweep-都留市.md` の MISSING を
 * `yamanashi-east-precheck-2026-08.md` で一次情報にあたって選別した5件。
 * precheck で保留・対象外にした3件（月尾根＝電話待ち / さがざわ＝追わない /
 * CALM MOUNTAIN AKIYAMA＝貸切専用でソロ不可）は**入れない。**
 *
 * ## 座標は入れない
 *
 * **5件とも lat/lng = 0 + needsCoord: true。**実ピンは人が地図で取る。
 * ここで住所から機械的に座標を作ると、`coordsVerified` を巡って過去に何度も
 * やった「推定値が確認済みの顔をする」を繰り返すことになる。
 *
 * ## 料金の裏取りで、下書きから2点変わった
 *
 * **1. 緑と太陽の丘は 3,300円ではなく 2,200円。**
 * 公式料金表に「駐車場代 ・テント１張につき１台無料」とある。
 * 下書き（と precheck）は入場550＋テント半額1,650＋駐車1,100＝3,300円としていたが、
 * **テント泊のソロに駐車料はかからない**ので平日ソロは 550+1,650=2,200円。
 * 利用例の「テント２張りなので２台まで無料」でも裏が取れる。
 *
 * **2. 平野田はテント持込料が取れたので priceVerified: true。**
 * 市公式 1018585.html に「平野田休養村キャンプ場利用料金一覧表（2026年8月～）」があり、
 * 入村料500円・テント1張2,000円・駐車200円まで全部載っていた。
 * precheck の「市詳細ページの接続障害で未取得」は解消（ローカルからは読める）。
 * → 入村料500+テント2,000+駐車200 = ソロ2,700円。
 *
 * ## 鹿留オートだけ料金を入れない
 *
 * **`deer1989.com` は DNS が解決しない**（2026-08-14・ローカル回線で ENOTFOUND。
 * クラウド側の遮断ではなかった）。公式が読めない以上、PORTA の2,600円は使わない指示どおり
 * `priceMin: 0` / `priceVerified: false` / `needsPrice: true` で入れる。
 * **officialUrl も入れない**——引けない URL を入れると `check-official-urls.js` が
 * 毎回 DEAD を鳴らし続けるだけで、根拠にはならない。事情は cautions に残す。
 *
 * ## value は帯基準（validate-data.js の VALUE_BANDS）
 *
 *   金の森山荘 7,500円 → 3 ／ 緑と太陽の丘 2,200円 → 4 ／ 平野田 2,700円 → 4
 *   eureka 4,500円 → 3 ／ 鹿留オート 料金未確認 → 3（表示側も中立3で扱う）
 *
 * 他のスコアは根拠のあるものだけ動かし、無ければ中立3のままにする。
 *
 * ## ガード
 *
 * - 投入前の件数が EXPECT_BEFORE と違えば中止（別の投入と衝突している）
 * - 5件のうち1件でも既に居れば中止（二重投入）
 * - `--force` で両方を押し切れる。**押し切る前に何が起きているか見ること**
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const TODAY = '2026-08-14';
const EXPECT_BEFORE = 184;
const force = process.argv.includes('--force');

/** 全件共通。座標は人が入れる（このスクリプトでは作らない） */
const COMMON = {
  prefecture: '山梨',
  type: 'campground',
  lat: 0,
  lng: 0,
  needsCoord: true,
  lastVerified: TODAY,
};

const RECORDS = [
  {
    id: 'kananomori-sanso',
    slug: 'kananomori-sanso',
    name: '金の森山荘',
    area: '大月市',
    status: 'active',
    address: '山梨県大月市大月町真木6188',
    priceMin: 7500,
    priceMax: 8300,
    priceVerified: true,
    priceNote:
      '区画+人数+車両課金。利用者料金2,000円+テントサイト4,500円+駐車1,000円=平日ソロ7,500円。' +
      '入浴は別途850円。休前日は2,300円+5,000円+1,000円=8,300円。' +
      'テント・タープの貸出しは無く、区画利用料金のみ',
    scores: { quietness: 3, scenery: 3, value: 3, access: 4, facility: 4 },
    features: {
      bath: true,
      shower: true,
      wifi: false,
      carIn: true,
      soloPlan: false,
      reservation: '要',
      reservationNote: '電話予約',
      shop: false,
      firewood: true,
      firewoodNote: '薪1箱1,800円',
      ice: false,
      alcohol: false,
      bonfire: false,
      bonfireNote: '可否は要確認。公式は12月〜3月について「焚火をしながらBBQも楽しめます」と書くが、テントサイトでの焚き火の可否は明記が無い',
      pet: false,
      petNote: '可否は要確認',
      toilet: '不明',
      toiletNote: '要確認',
      convenience: false,
      garbage: '',
      nearbySupermarket: '',
      nearbyShop: '',
    },
    season: '通年',
    soloComment:
      '旅館の金の森山荘が併設するテントサイト。テント泊でも850円で山荘の風呂とシャワーを使えるのが個性。' +
      '大月ICから国道20号経由で約5km、真木の渓流沿いで渓流釣りと川遊びができる。' +
      'テント・タープのレンタルは無いので装備は持参すること。',
    tel: '0554-23-1021',
    officialUrl: 'https://kananomori.com/',
  },

  {
    id: 'midori-taiyo-oka',
    slug: 'midori-taiyo-oka',
    name: '緑と太陽の丘キャンプ場',
    area: '上野原市',
    status: 'active',
    address: '山梨県上野原市秋山5030',
    priceMin: 2200,
    priceMax: 3850,
    priceVerified: true,
    priceNote:
      '人数+テント課金。入場料550円（宿泊日数分）+持込テント3,300円（5人まで・追加1人550円）。' +
      '**駐車場代1,100円はテント1張につき1台無料**なので、テント泊のソロには駐車料がかからない。' +
      '平日限定でソロテントは半額になり、平日ソロの総額は550円+1,650円=2,200円。土日祝は550円+3,300円=3,850円',
    scores: { quietness: 4, scenery: 3, value: 4, access: 4, facility: 3 },
    features: {
      bath: false,
      shower: true,
      showerNote: '大人220円',
      wifi: false,
      carIn: true,
      soloPlan: true,
      soloPlanNote: '公式料金表に「平日限定ソロテントは半額」の記載',
      reservation: '要',
      reservationNote: '電話のみ（9時〜19時）',
      shop: false,
      firewood: false,
      ice: false,
      alcohol: false,
      bonfire: false,
      bonfireNote: '可否は要確認（公式に焚き火の可否の明記が無い）',
      pet: false,
      petNote: '可否は要確認',
      toilet: '不明',
      toiletNote: '要確認',
      convenience: false,
      garbage: '有料',
      garbageNote: '燃えるゴミ45L袋330円・90L袋550円、缶220円、ビン10本まで220円',
      nearbySupermarket: '',
      nearbyShop: '',
    },
    season: '通年（火曜定休）',
    closedDays: '火曜（希望すれば応相談）',
    soloComment:
      '公式の料金表に「平日限定ソロテントは半額」と明記している、ソロを名指しで歓迎する上野原のキャンプ場。' +
      '区画が無く、静かに過ごしたい人向けのエリアもある。上野原ICの近くにコンビニ・スーパー・ホームセンターが揃うので買い出しがしやすい。',
    tel: '080-7493-0268',
    officialUrl: 'https://midoritotaiyounooka.com/',
  },

  {
    id: 'hiranoda-kyuyoson',
    slug: 'hiranoda-kyuyoson',
    name: '平野田休養村キャンプ場',
    area: '上野原市',
    status: 'active',
    address: '山梨県上野原市西原7293',
    priceMin: 2700,
    priceMax: 2700,
    priceVerified: true,
    priceNote:
      '人数+テント+車両課金。入村料500円（中学生以上・1人1泊）+テント1張2,000円+駐車200円=ソロ2,700円。' +
      '駐車のみの場合は車500円・バイク200円。BBQ/デイキャンプのサイト使用料は1箇所1,300円。' +
      '薪は針葉樹550円（訳あり350円）・広葉樹750円。市公式に「2026年8月〜」の利用料金一覧表',
    scores: { quietness: 4, scenery: 3, value: 4, access: 3, facility: 3 },
    features: {
      bath: false,
      shower: false,
      wifi: false,
      carIn: true,
      soloPlan: false,
      reservation: '要',
      reservationNote: '管理事務所へ電話予約',
      shop: true,
      shopNote: '薪・炭・レンタル用品',
      firewood: true,
      firewoodNote: '針葉樹550円・広葉樹750円',
      ice: false,
      alcohol: false,
      bonfire: false,
      bonfireNote:
        '可否は要確認。市公式は「川遊び無料エリア」についてのみ直火禁止・コンロ使用のBBQ可と書いており、キャンプサイトの焚き火の可否は明記が無い。薪は販売している',
      pet: false,
      petNote: '可否は要確認',
      toilet: '洋式',
      convenience: false,
      garbage: '',
      nearbySupermarket: '',
      nearbyShop: '',
    },
    season: '4月〜10月（毎日）、11月は土日祝のみ。12月〜3月は休業',
    soloComment:
      '上野原市公式が案内する西原の休養村キャンプ場。入村料+テント+駐車で2,700円に収まる。' +
      '4月〜10月は毎日、11月は土日祝のみの営業で、12月〜3月は休業する。' +
      'JR上野原駅から富士急バス「阿寺沢」下車、徒歩20分で公共交通でも行ける。' +
      '場内は電波がつながりにくい場所があると市が案内している。',
    tel: '0554-68-2931',
    officialUrl: 'https://www.city.uenohara.yamanashi.jp/site/kankou/1018585.html',
  },

  {
    id: 'shishidome-auto',
    slug: 'shishidome-auto',
    name: '鹿留オートキャンプ場',
    area: '都留市',
    status: 'active',
    address: '山梨県都留市鹿留1180',
    priceMin: 0,
    priceMax: 0,
    priceVerified: false,
    needsPrice: true,
    scores: { quietness: 4, scenery: 3, value: 3, access: 3, facility: 3 },
    features: {
      bath: false,
      shower: false,
      wifi: false,
      carIn: true,
      soloPlan: false,
      reservation: '要',
      shop: false,
      firewood: false,
      ice: false,
      alcohol: false,
      bonfire: false,
      bonfireNote: '可否は要確認',
      pet: false,
      petNote: '可否は要確認',
      toilet: '不明',
      toiletNote: '要確認',
      convenience: false,
      garbage: '',
      nearbySupermarket: '',
      nearbyShop: '',
    },
    season: '要確認',
    soloComment:
      '都留ICから車で約15分、鹿留川沿いの自然林に広がるフリーサイト中心のキャンプ場。' +
      '同じ鹿留にある釣り場「FISH-ON!鹿留」とは別運営の独立した施設で、名前が似ているため混同されやすい。' +
      '料金の一次情報がまだ取れていないので、行く前に電話で確認すること。',
    tel: '080-2232-0722',
    cautions: [
      'FISH-ON!鹿留（ベリーパーク in FISH-ON!鹿留・釣り場）とは別運営の独立した施設。同じ鹿留にあり名前も似ているため混同しやすい',
      '施設公式とされる deer1989.com は 2026-08-14 時点で DNS が解決しない（ENOTFOUND。回線側の遮断ではなくローカルからも同じ）。料金の一次情報が取れていないため priceMin/priceMax は 0 のまま',
    ],
  },

  {
    id: 'eureka-camp-village',
    slug: 'eureka-camp-village',
    name: 'eureka camp village',
    area: '大月市',
    status: 'active',
    address: '山梨県大月市賑岡町奥山1473',
    priceMin: 4500,
    priceMax: 8000,
    priceVerified: true,
    priceNote:
      'サイト単位課金。最安は林間サイト（2区画・1〜4名・車の乗り入れ不可）で平日4,500円・土日祝6,000円・ハイシーズン8,000円。' +
      'ソロでも区画料金は同額（2名から1人増えるごとに+2,500円）。' +
      'オートサイトは平日・土日祝10,000円、ハイシーズン15,000円。' +
      '旧称 KAGARIBI Camp Terrace で、2026年7月にリニューアルOPEN',
    scores: { quietness: 4, scenery: 4, value: 3, access: 3, facility: 4 },
    features: {
      bath: false,
      shower: true,
      showerNote: 'ドライヤー・シャンプー等完備。チェックイン後に先着順で予約',
      wifi: true,
      carIn: true,
      carInNote: 'オートサイトは車1〜2台可。最安の林間サイトは車の乗り入れ不可（荷物の搬入は管理人が手伝う）',
      soloPlan: false,
      reservation: '要',
      shop: false,
      firewood: true,
      firewoodNote: 'テントサウナは薪一束付き、追加1束1,000円',
      ice: false,
      alcohol: false,
      bonfire: true,
      bonfireNote: '焚き火台のレンタルあり',
      pet: true,
      toilet: '洋式',
      toiletNote: 'ウォシュレット付き。新設',
      convenience: false,
      garbage: '',
      nearbySupermarket: '',
      nearbyShop: '',
    },
    season: '通年',
    closedDays: 'なし',
    soloComment:
      '2026年7月に KAGARIBI Camp Terrace から改称・リニューアルした大月市賑岡町のキャンプ場。' +
      'ソロが取りやすいのは1人から使える林間サイトで、車を乗り入れられない代わりに平日4,500円と場内で最も安い。' +
      'ウォシュレット付きのトイレとシャワーが新設され、炊事場はお湯が出る。',
    tel: '070-4477-4165',
    reservationUrl: 'https://www.nap-camp.com/yamanashi/14539',
    cautions: [
      '2026-07 に KAGARIBI Camp Terrace から eureka camp village へ改称してリニューアルした。大月市公式の一覧は旧名 KAGARIBI Camp Terrace のまま（2026-08-14 時点）',
      '料金の出典は予約サイト「なっぷ」 https://www.nap-camp.com/yamanashi/14539 （施設公式サイトは未取得）',
    ],
  },
];

// ── 実行 ─────────────────────────────────────────────────────
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

if (data.length !== EXPECT_BEFORE && !force) {
  throw new Error(
    `投入前の件数が ${EXPECT_BEFORE} でなく ${data.length}。別の投入と衝突している疑い。中止する（--force で押し切れる）`
  );
}

const already = RECORDS.filter((r) => data.some((x) => x.id === r.id || x.slug === r.slug));
if (already.length && !force) {
  throw new Error(`既に投入済み: ${already.map((r) => r.id).join(', ')}。中止する（--force で押し切れる）`);
}

// 住所の市町村が area と噛み合っているかの照合（取り違え防止）
for (const r of RECORDS) {
  if (!r.address.includes(r.area)) {
    throw new Error(`${r.id}: address「${r.address}」に area「${r.area}」が含まれない。取り違えの疑い`);
  }
}

const added = [];
for (const r of RECORDS) {
  if (data.some((x) => x.id === r.id)) {
    console.log(`${r.id}: 既に居る。飛ばす`);
    continue;
  }
  data.push({ ...COMMON, ...r });
  added.push(r);
}

if (!added.length) {
  console.log('変更なし（適用済み）');
  process.exit(0);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

console.log(`投入 ${added.length}件（${EXPECT_BEFORE} → ${data.length}）`);
for (const r of added) {
  console.log(
    `  ${r.id.padEnd(22)} ${r.name}（${r.area}） priceMin ${r.priceMin} / value ${r.scores.value} / priceVerified ${r.priceVerified}`
  );
}
console.log('\n座標は全件 0,0 + needsCoord: true。実ピンは人が取ること');
