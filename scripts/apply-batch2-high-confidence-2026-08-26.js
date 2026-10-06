const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'campgrounds.json');
const camps = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const sourceDate = '2026-08-26';

/**
 * 追加の公開ゲート:
 * - 公式URL・料金根拠・ソロ利用根拠・運用情報がある
 * - Google Mapsの施設実ピンを人が確認済み
 * - 未確認の設備は false にせずキーを省略する
 * - 5軸評価は根拠が揃うまで scoresVerified:false（中立置き値）
 */
const additions = [
  {
    id: 'fujino-art-camp',
    slug: 'fujino-art-camp',
    name: '藤野芸術の家キャンプ場',
    prefecture: '神奈川',
    area: '相模湖・藤野',
    status: 'active',
    address: '神奈川県相模原市緑区牧野4819',
    lat: 35.5948938,
    lng: 139.1521269,
    coordsVerified: true,
    priceMin: 3000,
    priceMax: 3000,
    priceNote: 'テント持込1張1泊3,000円。駐車無料。',
    priceVerified: true,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      bonfire: false,
      bonfireNote: '直火不可。焚き火台の利用可否は施設へ要確認。',
      shower: true,
      showerNote: '温水シャワーあり。',
      toilet: '不明',
      toiletNote: '水洗トイレあり（様式は公式ページで未確認）。',
      carIn: false,
      carInNote: 'オートキャンプ不可。荷下ろしは可能。',
      reservation: '要',
      reservationNote: '電話で申込み。',
      garbage: '持ち帰り'
    },
    season: '4月〜10月',
    soloComment: 'テント1張単位の料金で、少人数でも利用しやすいアート施設併設のキャンプ場。温水シャワー・水洗トイレ・屋根付き炊事場が確認できる。オートキャンプ不可のため、荷下ろし後は車を移動する。',
    officialUrl: 'https://fujino-art.jp/camp/',
    tel: null,
    lastVerified: sourceDate,
    source: [
      '藤野芸術の家 公式キャンプ場案内 https://fujino-art.jp/camp/'
    ]
  },
  {
    id: 'shiraishi-auto-camp',
    slug: 'shiraishi-auto-camp',
    name: '白石オートキャンプ場',
    prefecture: '神奈川',
    area: '丹沢湖',
    status: 'active',
    address: '神奈川県足柄上郡山北町中川字相馬沢870-3',
    lat: 35.484174,
    lng: 139.063771,
    coordsVerified: true,
    priceMin: 4000,
    priceMax: 7000,
    priceNote: '二輪1台2名まで4,000円、車1台4名まで7,000円。車両単位料金。',
    priceVerified: true,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      toilet: '不明',
      reservation: undefined,
      garbage: '要確認'
    },
    season: '通年（利用前に公式サイトで要確認）',
    soloComment: '西丹沢の渓流エリアにあるオートキャンプ場。二輪なら1台2名まで4,000円、車なら1台4名まで7,000円の車両単位料金で、ソロ専用割引ではない。設備・予約方法は公式サイトで事前に確認する。',
    officialUrl: 'https://www.shiraishiautocamp.com/price',
    tel: '0465-81-2236',
    lastVerified: sourceDate,
    source: [
      '白石オートキャンプ場 公式料金案内 https://www.shiraishiautocamp.com/price'
    ]
  },
  {
    id: 'saiko-kohan-camp',
    slug: 'saiko-kohan-camp',
    name: '西湖湖畔キャンプ場',
    prefecture: '山梨',
    area: '富士五湖',
    status: 'active',
    address: '山梨県南都留郡富士河口湖町西湖207-7',
    lat: 35.5048412,
    lng: 138.6997185,
    coordsVerified: true,
    priceMin: 1500,
    priceMax: 2500,
    priceNote: '大人1泊1,500円。車は別途1,000円、バイクは500円。徒歩ソロは1,500円、車ソロは2,500円。',
    priceVerified: true,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      shower: true,
      showerNote: '温水シャワー450円。',
      toilet: '不明',
      reservation: '不要',
      reservationNote: 'フリーサイト・オートキャンプとも先着順で予約不可。',
      garbage: '要確認'
    },
    season: '営業日・利用条件は公式サイトで要確認',
    soloComment: '西湖畔のフリーサイト／オートキャンプ場。徒歩なら大人1名1,500円から、車ソロは2,500円から利用できる。予約不可・先着順のため、繁忙期は早めの到着を検討する。',
    officialUrl: 'https://saikohan.com/price/',
    tel: '0555-82-2858',
    lastVerified: sourceDate,
    source: [
      '西湖湖畔キャンプ場 公式料金案内 https://saikohan.com/price/'
    ]
  },
  {
    id: 'saiko-tsuhara-camp',
    slug: 'saiko-tsuhara-camp',
    name: '西湖津原キャンプ場',
    prefecture: '山梨',
    area: '富士五湖',
    status: 'active',
    address: '山梨県南都留郡富士河口湖町西湖351',
    lat: 35.498973,
    lng: 138.698817,
    coordsVerified: true,
    priceMin: 1500,
    priceMax: 1500,
    priceNote: 'オートキャンプ大人1名1,500円。',
    priceVerified: true,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      pet: true,
      carIn: true,
      reservation: '不要',
      reservationNote: 'テントサイトは予約不要。営業日は公式カレンダーを確認。',
      garbage: '要確認'
    },
    season: '公式営業日カレンダーで要確認',
    soloComment: '西湖周辺で、テントサイトは予約不要・車両乗り入れ可能と案内されているキャンプ場。オートキャンプは大人1名1,500円。営業日は公式カレンダーで確認してから向かう。',
    officialUrl: 'https://tsuhara-camp.jp/price',
    tel: '070-1312-0133',
    lastVerified: sourceDate,
    source: [
      '西湖津原キャンプ場 公式料金案内 https://tsuhara-camp.jp/price'
    ]
  },
  {
    id: 'umegashima-camp',
    slug: 'umegashima-camp',
    name: '梅ケ島キャンプ場',
    prefecture: '静岡',
    area: 'オクシズ・梅ケ島',
    status: 'active',
    address: '静岡県静岡市葵区梅ケ島3198番地地先',
    lat: 35.2582502,
    lng: 138.3249873,
    coordsVerified: true,
    priceMin: 670,
    priceMax: 670,
    priceNote: '持込テント・タープ1張1泊670円。',
    priceVerified: true,
    scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
    scoresVerified: false,
    features: {
      bonfire: false,
      bonfireNote: '直火不可。焚き火台使用の可否は予約時に確認。',
      shower: false,
      showerNote: 'シャワーなし。',
      toilet: '不明',
      carIn: false,
      carInNote: '車両はテントサイトへ入れない。リアカーで搬送。',
      reservation: '要',
      reservationNote: '利用日の3日前までに事前予約。',
      garbage: '持ち帰り'
    },
    season: '通年（年末年始を除く）',
    cautions: [
      '山間・河川沿いの施設。天候、河川状況、野生動物に関する注意事項は静岡市公式の案内を確認する。 https://www.city.shizuoka.lg.jp/shisetsu/s0000087.html'
    ],
    soloComment: '静岡市が案内する梅ケ島のキャンプ場。テント1張670円で、利用は3日前までの事前予約制。車はサイトへ入れずリアカー搬送となる。シャワーなし・直火不可のため、装備と天候を確認して向かう。',
    officialUrl: 'https://www.city.shizuoka.lg.jp/shisetsu/s0000087.html',
    tel: '054-269-2459',
    lastVerified: sourceDate,
    source: [
      '静岡市公式 梅ケ島キャンプ場 https://www.city.shizuoka.lg.jp/shisetsu/s0000087.html'
    ]
  }
];

const byId = new Map(camps.map((camp, index) => [camp.id, index]));
for (const addition of additions) {
  const index = byId.get(addition.id);
  if (index === undefined) {
    camps.push(addition);
  } else {
    // 既存の候補レコードを丸ごと置換する。過去データに入っていた
    // 「要確認」を false としていた設備情報や、根拠のない5軸評価を残さないため。
    camps[index] = { ...addition, type: 'campground' };
  }
}

fs.writeFileSync(dataPath, JSON.stringify(camps, null, 2) + '\n');
console.log(`upserted ${additions.length}; total ${camps.length}`);
