/**
 * 千葉・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ4 第6バッチ）。
 *
 * **優先6市のキャンプ場系を一通り当たり終えたので、ここから残りの市町村に入る。**
 * 本バッチは旭市・印西市・鋸南町の3件。いずれも公式を開いて施設名と市町村を照合済み。
 *
 * ## 市内／市外で料金が違う公営施設は `eligibility: "discount"` を付ける
 *
 * `旭市海上キャンプ場` はテントサイトが**市内1,000円／市外1,500円**。
 * `lib/types.ts` の方針どおり、**読者は市外から来る前提なので `priceMin` には市外料金**を入れ、
 * `eligibility` に差があることを出す。前バッチの `我孫子市ふれあいキャンプ場` と同じ形。
 *
 * ## 名前が変わっている施設に注意
 *
 * `Camp field MARC WEST`（なっぷの表記）は、公式では
 * **「キャンプフィールド マークウエスト（Campfield Marc West）」**。
 * さらに公式が「**旧オートキャンプユニオンは、2026年3月より…として新たにオープンしました**」と
 * 書いている。同じ場所の改称なので、**レコード名は公式の表記に合わせた。**
 *
 * ## 定員の上限が小さい施設がある
 *
 * マークウエストの**サイレントサイトは最大2名で増員不可**。ソロで静かに泊まるには向くが、
 * 人数が増えると使えない。`cautions` に書いてある。
 *
 *   node scripts/apply-chiba-nap-b6-2026-10-06.js                  # dry run
 *   node scripts/apply-chiba-nap-b6-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');
const TODAY = '2026-10-06';
const NEUTRAL = { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 };

const base = (o) => ({
  type: 'campground',
  status: 'active',
  prefecture: '千葉',
  lat: 0,
  lng: 0,
  needsCoord: true,
  scores: { ...NEUTRAL },
  scoresVerified: false,
  priceVerified: true,
  lastVerified: TODAY,
  ...o,
});

const ADD = [
  base({
    id: 'asahi-unakami-camp',
    slug: 'asahi-unakami-camp',
    name: '旭市海上キャンプ場',
    area: '旭・海上',
    address: '千葉県旭市岩井1000',
    priceMin: 1500,
    priceMax: 1500,
    priceNote:
      'サイト単位課金。**テントサイトは1区画1泊で市内1,000円／市外1,500円。**' +
      'バンガローは6人用1棟1泊 市内3,000円・市外4,500円、10人用 市内5,000円・市外7,500円。' +
      'デイキャンプは1人1回 市内300円・市外450円',
    features: {
      reservation: '要',
      reservationNote: '旭市公式の「予約・空き情報」ページから。問い合わせは海上公民館 0479-55-2566',
    },
    eligibility: {
      type: 'discount',
      label: '市外は割高',
      note: '旭市内なら テントサイト1,000円。市外は1,500円（1.5倍）',
      source: 'https://www.city.asahi.lg.jp/soshiki/29/24010.html',
    },
    season: '通年（毎週月曜日と12月29日〜1月3日は休場）',
    soloComment:
      '旭市が運営するキャンプ場で、「龍福寺の森」「滝のさと自然公園」に隣接している。テントサイトは14張分で、市外からでも1区画1,500円。炊事棟・実習棟・管理棟・体育館・キャンプファイヤーサークルを備える。',
    officialUrl: 'https://www.city.asahi.lg.jp/soshiki/29/24010.html',
    tel: '0479-55-5250',
    cautions: [
      '**毎週月曜日と年末年始（12月29日〜1月3日）は休場**',
      '**市外の人は料金が1.5倍**（テントサイト 市内1,000円／市外1,500円）',
      '入場は午後1時〜午後3時、退場は午前9時〜午前11時と時間が決まっている',
      '青少年の健全育成・研修・交歓の場としての施設でもあると旭市公式に記載',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.city.asahi.lg.jp/soshiki/29/24010.html'],
  }),

  base({
    id: 'campfield-marc-west',
    slug: 'campfield-marc-west',
    name: 'キャンプフィールド マークウエスト',
    area: '印西',
    address: '千葉県印西市平賀2719',
    priceMin: 3300,
    priceMax: 7700,
    priceNote:
      'サイト単位課金。**レギュラー（日〜金）はメインサイト3,300円／サイレントサイト3,300円／' +
      '電源サイト4,400円（電源込）。**曜日・イベント加算が1サイトあたり ミドル（土曜・祝前日）+1,100円、' +
      'ハイシーズン（連休・行楽シーズン）+2,200円、トップシーズン（年末年始）+3,300円。' +
      '**決済は現金のみ**（クレジットカード・電子マネー不可）',
    features: {
      carIn: true,
      carInNote: '公式に「車横付けOK」と記載',
      pet: true,
      petNote: 'リード着用で一緒に宿泊できると公式に記載',
      reservation: '要',
      reservationNote: '公式サイトの予約ページから。電話は090-9815-3838（受付10:00〜18:00）',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '印西市平賀のキャンプ場。2026年3月に旧オートキャンプユニオンから改称して新たにオープンした。**サイレントサイト（定員2名）**があり、静かに過ごしたいときに選べる。チェックイン13:00、チェックアウト翌10:00。',
    officialUrl: 'https://www.camp-inba.com/guidance',
    tel: '090-9815-3838',
    cautions: [
      '**決済は現金のみ。**公式が「決済手数料等のコストを抑えることで、できる限り低価格でのご提供を実現しております」と説明している',
      '**サイレントサイトは最大2名で増員不可。**メインサイト・電源サイトも最大4名まで（増員不可）',
      'なっぷでの表記は「Camp field MARC WEST」。**公式の表記は「キャンプフィールド マークウエスト」**で、旧名はオートキャンプユニオン',
      'アーリーチェックイン／レイトチェックアウトは1時間ごと+1,100円。**前日までの連絡が必須**',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.camp-inba.com/guidance', 'https://www.camp-inba.com/'],
  }),

  base({
    id: 'nightvista-camp',
    slug: 'nightvista-camp',
    name: 'ナイトビスタキャンプ場',
    area: '鋸南',
    address: '千葉県安房郡鋸南町下佐久間2311-5',
    priceMin: 3500,
    priceMax: 7000,
    priceNote:
      'サイト単位課金（全10区画）。**平日3,500円/1区画、土日・祝日・休前日6,000円、' +
      '特別期間7,000円**（GW 5/2〜5/6、夏休み 8/1〜8/31、年末年始 12/27〜1/4）。' +
      '駐車は1台/1区画で、2台目以降は+1,000円/台。薪使い放題1,200円、氷使い放題300円、両方で1,300円。シャワーは1人1回15分300円',
    features: {
      carIn: true,
      carInNote: '区画サイト（オートキャンプ）。乗用車・トレーラー・キャンピングカー・バイクが乗り入れ可',
      toilet: 'ウォシュレット',
      toiletNote: '男女別の水洗・ウォシュレット',
      shower: true,
      showerNote: '1人1回15分300円',
      pet: true,
      petNote: 'ペットOKは3区画（東エリア1段目）。ペット不可が7区画',
      reservation: '要',
      reservationNote: '公式サイトの予約ページから。**現地でのカード決済は不可**',
    },
    season: '通年（定休日なし）',
    soloComment:
      '鋸南町の小高い山の中腹にあり、東京湾を見渡せる全10区画のオートキャンプ場。全サイトにAC電源（1500Wまで）が無料で付き、洗い場はお湯が出る。製氷機・冷蔵庫・冷凍庫・ピザ窯がある。富津館山道路の鋸南ICから車で約5分。',
    officialUrl: 'https://nightvista3.com/',
    tel: '090-5513-4219',
    cautions: [
      '**駐車場が無い。**車は区画に1台で、2台目以降は+1,000円/台',
      '**3段目は急勾配のため四駆やSUVなどに限定**と公式に記載。区画の割り当ては施設側が決める',
      '**現地でのカード決済は不可**',
      'ペットOKは3区画のみ（東エリア1段目）。2〜3段目は条件付き',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://nightvista3.com/'],
  }),
];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);
if (serialize(list) !== raw) { console.error('中止: 整形が想定と違う'); process.exit(1); }

const muni = (a) => {
  const s = String(a || '').replace(/^.{2,3}[都道府県]/, '');
  const m = s.match(/^(.+?郡)?(.+?[市町村])/);
  if (!m) return null;
  const ku = s.slice(m[0].length).match(/^(.+?区)/);
  return m[2] + (ku ? ku[1] : '');
};
const bySlug = new Map(list.map((c) => [c.slug, c]));
const errors = [];
for (const r of ADD) {
  for (const k of ['id', 'slug', 'name', 'prefecture', 'area', 'scores']) {
    if (r[k] === undefined || r[k] === null || r[k] === '') errors.push(`${r.slug}: 必須フィールド "${k}" が無い`);
  }
  for (const [k, v] of Object.entries(r.scores || {})) {
    if (!Number.isInteger(v) || v < 1 || v > 5) errors.push(`${r.slug}: scores.${k} が1〜5の整数でない`);
  }
  if (r.scoresVerified !== false) errors.push(`${r.slug}: scoresVerified を false 以外にしない`);
  if (r.needsCoord !== true || r.lat !== 0 || r.lng !== 0) errors.push(`${r.slug}: needsCoord:true / lat:0 / lng:0 が要る`);
  if (typeof r.priceMin !== 'number' || typeof r.priceMax !== 'number') errors.push(`${r.slug}: priceMin/priceMax は必須の数値`);
  else if (r.priceMax < r.priceMin) errors.push(`${r.slug}: priceMax が priceMin を下回っている`);
  if (r.priceVerified === true && !String(r.priceNote || '').trim()) errors.push(`${r.slug}: priceNote が空`);
  if (r.eligibility) {
    for (const k of ['type', 'label', 'source']) {
      if (!String(r.eligibility[k] || '').trim()) errors.push(`${r.slug}: eligibility.${k} が空`);
    }
    if (!['exclusive', 'discount', 'priority', 'membership'].includes(r.eligibility.type)) {
      errors.push(`${r.slug}: eligibility.type が想定外`);
    }
  }
  if (bySlug.has(r.slug)) errors.push(`${r.slug}: 同じ slug が既にある`);
  const m = muni(r.address);
  const dup = list.find((c) => c.name === r.name && muni(c.address) === m);
  if (dup) errors.push(`${r.slug}: 施設名＋市町村が既存の ${dup.slug} と一致`);
}
if (errors.length) { console.error(`中止: ガードに ${errors.length} 件\n  ` + errors.join('\n  ')); process.exit(1); }

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(22)} ${r.name} / ${muni(r.address)}  priceMin=${r.priceMin}`);
}
if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
