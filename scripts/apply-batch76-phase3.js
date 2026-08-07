/**
 * batch76-check.md の反映 フェーズ3 — PARTIAL 24件。
 *
 * 取れた情報だけを反映する。**料金が取れていないものは priceVerified を立てない**
 * （「料金 要確認」の表示のまま残す）。
 * 住所・電話・officialUrl・営業期間・eligibility など、確認できたものだけ埋める。
 *
 * 使い方: node scripts/apply-batch76-phase3.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const VERIFIED_DATE = '2026-08-07';

const RECORDS = [
  {
    slug: 'pica-sagamiko',
    fields: { closedDays: '毎週木曜（祝日や春・夏・冬休みは営業）' },
    note: '番地と料金が公式ページから取れず',
  },
  {
    slug: 'usami-shiroyama',
    fields: {
      address: '静岡県伊東市宇佐美1721-5',
      tel: '0557-48-6688',
    },
    note: 'サイト使用料が取れず（施設利用料 1人1泊 大人600円のみ判明）',
  },
  {
    slug: 'folkwood-yatsugatake',
    fields: {
      address: '山梨県北杜市小淵沢町3900-2',
      officialUrl: 'https://folkwood-camp.com/',
    },
    note: '料金の内訳が取れず（「平日4,000円〜」のみ）',
  },
  {
    slug: 'fujinomori-yamanakako',
    fields: {
      address: '山梨県南都留郡山中湖村平野1134-3',
      tel: '0555-28-7092',
      season: 'シーズン営業（具体的な期間は未確認）',
      closedDays: 'なし',
    },
    note: 'サイト使用料が取れず。検索で出る金額はレンタル品の料金と読める',
  },
  {
    slug: 'yatsugatake-oizumi',
    fields: {
      name: '八ヶ岳オートキャンプ場',
      address: '山梨県北杜市小淵沢町上笹尾3332-1936',
      tel: '0551-36-4228',
      officialUrl: 'https://www.yatsugatake-autocamp.com/',
      season: '4月〜10月中旬',
    },
    note: '料金が取れず。名称の「大泉」は実在せず、所在地も大泉町ではなく小淵沢町',
  },
  {
    slug: 'doshigawa-kanko-noen',
    fields: {
      name: '道志川観光農園オートキャンプ場',
    },
    note: '住所・電話が取れず。料金はオートキャンプ大人700円＋車1,000円＝ソロ1,700円だが住所未確定のため保留',
  },
  {
    slug: 'tiny-camp-village',
    fields: {
      address: '神奈川県厚木市七沢1854',
      tel: '070-3366-7738',
      officialUrl: 'https://www.tiny-camp-village.com/',
    },
    features: { reservationNote: '1日5組限定の完全予約制。3ヶ月先（貸切は5ヶ月先）まで予約可。受付9:00〜18:00' },
    cautions: ['駐車料金が別途必要（車1日550円／1泊2日1,100円、バイク1日330円／1泊2日660円）'],
    note: 'サイト使用料が取れず（公式サイトに料金表がない）',
  },
  {
    slug: 'hinata-camp',
    fields: {
      name: 'ふれあいの森日向キャンプ場',
      address: '神奈川県伊勢原市日向2190-2',
      tel: '0463-96-0303',
      season: '7月20日〜8月31日のみ（約6週間）',
      eligibility: {
        type: 'priority',
        label: '伊勢原市民の申込が先に始まる',
        note: '市内居住者は4月初旬から、その他は4月下旬から受付。夏の6週間しか開設しないため、受付開始の差が実質的な優先枠になる',
        source: '観光かながわNow ふれあいの森日向キャンプ場 http://www.kanagawa-kankou.or.jp/stay/camp/ohyama/camp-309.html',
      },
    },
    note: '料金が取れず。営業が夏の6週間しかない点は season に反映済み',
  },
  {
    slug: 'sessokyo-camp',
    fields: {
      address: '静岡県榛原郡川根本町犬間 長嶋公園敷地内',
    },
    note: '料金の帰属先（接岨か崎平か）が確定できず。同名の施設が2拠点ある',
  },
  {
    slug: 'doshi-mori-cottage',
    fields: {
      name: '道志森のコテージ',
      tel: '090-7265-7981',
      officialUrl: 'https://doshi-kanko.com/moricote/',
      eligibility: {
        type: 'discount',
        label: '18歳以下の横浜市民を含むと割引',
        note: '「道志村キャンプ場における横浜市民優待サービス」。18歳以下の横浜市民（在住・在学・在勤）を含むグループ・団体・学校が対象。道志村は横浜市の水源林があるための施策',
        source: '道志村観光協会 道志森のコテージ https://doshi-kanko.com/moricote/',
      },
    },
    cautions: [
      'ソロキャンプは2,500円（2026年改定）。区分別の料金は未確認',
      '電話予約のみ（090-7265-7981）',
      '夜9時以降は飲酒制限。宴会・飲み会目的の利用は不可',
    ],
    note: '住所（番地）が取れず。ソロ2,500円は明記されているが区分別の内訳がない',
  },
  {
    slug: 'recamp-fuji-speedway',
    fields: {
      address: '静岡県駿東郡小山町中日向694 富士スピードウェイ内',
      area: '小山町',
    },
    note: '料金が一次・二次情報から取れず。レース開催日は料金が変わる可能性',
  },
  {
    slug: 'kokono-shizuoka',
    fields: {
      address: '静岡県静岡市葵区新間2082',
      season: '通年',
      closedDays: 'なし',
    },
    note: '料金がどこにも出ていない。1日4組限定',
  },
  {
    slug: 'naminokomura',
    fields: {
      area: '小田原市・根府川',
      season: '通年',
      closedDays: '水・木曜（夏休みは無休、11〜翌3月は月〜金曜。祝日は営業）',
    },
    note: '番地と入村料が取れず。所在地は湯河原町ではなく小田原市',
  },
  {
    slug: 'kuragari-camp',
    fields: {
      address: '神奈川県足柄上郡山北町玄倉490-2',
      tel: '0465-78-3242',
      officialUrl: 'https://tanzawa-camp.sakura.ne.jp/',
      season: '4月〜11月末',
    },
    cautions: ['近隣に丹沢湖ロッヂ（玄倉514）など名前の似た施設が複数ある。玄倉490-2 が当施設'],
    note: '料金が取れず（電話予約のみで掲載なし）',
  },
  {
    slug: 'bushcraft-shonan',
    fields: {
      address: '神奈川県平塚市土屋2588-85',
      officialUrl: 'https://bush-craft.biz/',
      eligibility: {
        type: 'membership',
        label: '会員制',
        note: '会員制のシェアリングスペース。初回の予約に限りモニター利用が無料。飛び込みでは利用できない',
        source: 'ブッシュクラフト湘南 公式 https://bush-craft.biz/',
      },
    },
    features: { bonfireNote: '湘南で唯一「直火も可能」と明記されている' },
    note: '料金が公式に掲載されていない',
  },
  {
    slug: 'shizunami-beach-camp',
    fields: {},
    cautions: [
      '「静波海岸キャンプサイト」という名称の施設は確認できず。静波海岸には静波リゾートキャンプサイト（牧之原市静波2228-43）と静波キャンプ（同2220-515）の2施設が実在する',
    ],
    note: 'どちらの施設を指すか確定できないため住所を入れない',
  },
  {
    slug: 'camp-akaike',
    fields: {
      name: 'CAMP AKAIKE',
      officialUrl: 'https://www.camp-akaike.jp/',
      season: '春〜秋（冬季クローズ）。2026年は4月18日〜11月23日',
    },
    note: '住所と現行料金が取れず',
  },
  {
    slug: 'village-hakushu',
    fields: {
      address: '山梨県北杜市白州町上教来石平久保2124',
      tel: '0551-35-4120',
      season: '4月中旬〜11月上旬',
    },
    note: '宿泊料金が取れず',
  },
  {
    slug: 'flora-campsite',
    fields: {
      name: '白州・尾白 FLORA Campsite in the Natural Garden',
      officialUrl: 'https://www.floracampsite.com/',
    },
    cautions: [
      'グランピングエリア（1日5組限定）とひなたの森キャンピングエリア（1日13組限定）の2エリア構成',
    ],
    note: '住所が確定できず。検索で出る「北杜市高根町村山北割3261」は北杜市観光協会の所在地の疑いがある',
  },
  {
    slug: 'shimobe-yurucamp-sato',
    fields: {
      address: '山梨県南巨摩郡身延町古関4321',
    },
    cautions: ['全18区画。定員6名までのA・Bサイトと、ソロ向けのCサイトがある'],
    note: '料金が予約サイト経由でないと出ない',
  },
  {
    slug: 'takaranoyama-fureai',
    fields: {
      address: '山梨県都留市大幡5108',
      tel: '0554-45-6222',
      officialUrl: 'https://takaranoyama.camp/',
    },
    cautions: ['テントサイトは1日4組限定のフリーサイト', '予約は電話のみ（0554-45-6222）'],
    note: 'テントサイトの料金が取れず（判明したのはコテージのみ）',
  },
  {
    slug: 'sports-train-aokigahara',
    fields: {
      name: 'SPORTS TRAIN in Forest CAMP',
      address: '山梨県南都留郡富士河口湖町西湖2169-1',
      tel: '090-7988-3152',
      officialUrl: 'https://www.sportstraincamp.com/',
      season: '通年（1月・2月は冬季休業）',
    },
    cautions: ['青木ヶ原樹海の中にある全8サイトの施設'],
    note: '宿泊料金が取れず。検索で出る4,400円は体験メニューの料金',
  },
  {
    slug: 'fujimangan-village',
    fields: {
      address: '山梨県南都留郡鳴沢村5163-1',
      tel: '0555-28-6005',
      officialUrl: 'https://fuji-manganvillage.com/',
    },
    note: '料金が取れず',
  },
  {
    slug: 'hayakawa-camp',
    fields: {
      address: '山梨県南巨摩郡早川町保1751番地先',
      tel: '0556-20-5055',
      officialUrl: 'https://www.town.hayakawa.yamanashi.jp/tour/spot/camp/car-camping.html',
      season: '（休業前）4月1日〜11月下旬',
    },
    note: 'status は phase1 で suspended に変更済み。料金は休業前のものなので入れない',
  },
];

const changes = [];
for (const rec of RECORDS) {
  const c = camps.find((x) => x.slug === rec.slug);
  if (!c) throw new Error(`slug "${rec.slug}" が見つからない`);

  for (const [k, v] of Object.entries(rec.fields)) {
    if (JSON.stringify(c[k]) !== JSON.stringify(v)) changes.push({ slug: rec.slug, field: k });
    c[k] = v;
  }
  if (rec.features) {
    for (const [k, v] of Object.entries(rec.features)) {
      if (c.features[k] !== v) changes.push({ slug: rec.slug, field: `features.${k}` });
      c.features[k] = v;
    }
  }
  if (rec.cautions) {
    c.cautions = c.cautions || [];
    for (const t of rec.cautions) {
      if (!c.cautions.includes(t)) {
        c.cautions.push(t);
        changes.push({ slug: rec.slug, field: 'cautions[追加]' });
      }
    }
  }

  // 料金は取れていないので priceVerified は立てない。
  // ただし住所や営業期間は確認したので lastVerified は更新する。
  if (c.priceVerified === true) throw new Error(`${rec.slug}: PARTIAL なのに priceVerified が立っている`);
  c.lastVerified = VERIFIED_DATE;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`PARTIAL ${RECORDS.length}件を反映（${changes.length}フィールドを変更）\n`);
console.log('■ 反映内容と、取れなかったもの');
for (const rec of RECORDS) {
  const keys = Object.keys(rec.fields).concat(rec.features ? Object.keys(rec.features).map((k) => `features.${k}`) : []);
  if (rec.cautions) keys.push(`cautions+${rec.cautions.length}`);
  console.log(`  ${rec.slug.padEnd(26)} ${keys.join(', ') || '(フィールド変更なし)'}`);
  console.log(`    未取得: ${rec.note}`);
}

const verified = camps.filter((c) => c.priceVerified === true).length;
console.log(`\npriceVerified: true  ${verified}件 / 未確認 ${camps.length - verified}件`);
console.log(`eligibility を持つ: ${camps.filter((c) => c.eligibility).map((c) => `${c.slug}(${c.eligibility.type})`).join(', ')}`);
