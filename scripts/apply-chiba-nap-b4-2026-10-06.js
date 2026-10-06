/**
 * 千葉・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ4 第4バッチ）。
 *
 * ## このバッチの肝 — **WebFetch で開けなかったサイトを curl で開き直した**
 *
 * 前バッチで「HTTPS 証明書がホスト名と一致しない」「403」で取得できず UNMEASURED に
 * 積んでいた施設が6件あった。**共用ホスティングの既定証明書が返るだけで、
 * サイト自体は生きている。**`curl -sk`（証明書検証を外す）＋ Python での文字コード判定
 * （UTF-8 / CP932 / EUC-JP を順に試す）で、6件中5件の本文が読めた。
 *
 *   取得できた … まんぼう / ワイルドキッズ岬 / 宮原 / 勝浦つるんつるん / 富崎館
 *   取れなかった … ホウリーウッズ久留里（jimdo.com が本文を返さない）→ UNMEASURED 継続
 *
 * `wildkids.jp` は**トップが実サイトへのリンクだけ**で、本体は
 * `wild-kids-misaki-auto-camping-ground.jimdosite.com` にあった。こちらで住所と電話を確認した。
 *
 * ## 「料金が公式に無い」が多いので needsPrice が5件
 *
 * 千葉のキャンプ場は**公式に予約導線だけ置いて、金額はなっぷ側に持たせている**ものが多い。
 * 門2は「料金**か**予約方法」なので通るが、`priceMin` は作れない。
 * **第三者サイトに載っている金額は使わない**ので `needsPrice: true` にしてある。
 *
 * `romannomori`（ロマンの森共和国）は少し特殊で、**入場料（宿泊者500円）は公式にあるが
 * オートサイトのサイト料が公式のどこにも無い。**ソロ1名の総額が作れないので同じ扱いにし、
 * 分かっている入場料は cautions に書いた。
 *
 * ## 門の追加（2026-10-06・しゅんの判断）
 *
 * > 1名で予約できるのが**性別・年齢などで限定されたサイトのみ**の施設は「単独利用不可」で門落ち。
 *
 * これにより `solas-no-mori`（1名可は女性専用サイトのみ）を掲載から外した。
 * 本バッチの8件は、いずれも**属性の限定が付かないサイトで1名が予約できる**ことを確認している。
 *
 *   node scripts/apply-chiba-nap-b4-2026-10-06.js                  # dry run
 *   node scripts/apply-chiba-nap-b4-2026-10-06.js --write --force  # 実際に書く
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
  lastVerified: TODAY,
  ...o,
});

const ADD = [
  base({
    id: 'miyahara-autocamp',
    slug: 'miyahara-autocamp',
    name: '宮原オートキャンプ場',
    area: 'いすみ・大野',
    address: '千葉県いすみ市大野2843',
    priceMin: 5000,
    priceMax: 5000,
    priceVerified: true,
    priceNote:
      'サイト単位課金。**テントサイト1区画1泊5,000円**（4人・車1台・テントとタープ各1張まで）で、' +
      '人数割ではないのでソロ1名も同額。バンガローは1棟8,000円（4〜5人）。シャワー1回200円。' +
      'レンタルはテント1,000円・タープ500円・寝袋300円・バーベキューセット500円',
    features: {
      carIn: true,
      carInNote: 'オートサイト（1区画に車1台）',
      shower: true,
      showerNote: '1回200円',
      reservation: '要',
      reservationNote: '**電話またはFAXのみ**（0470-86-3916 は電話・FAX共通／携帯 090-2313-5412）',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      'いすみ市大野のオートキャンプ場。テントサイトは1区画5,000円で人数割がなく、ソロでも同額。シャワーは1回200円。予約は電話かFAXで受け付けている。',
    officialUrl: 'http://www.camp-miyahara.com/rate',
    tel: '0470-86-3916',
    cautions: [
      '**フリーサイト（1泊4,000円）は公式に「現在ご利用いただけません」と記載。**使えるのはテントサイトとバンガロー',
      '予約は電話かFAXのみ。オンライン予約の案内は公式に無い',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://www.camp-miyahara.com/rate'],
  }),

  base({
    id: 'katsuura-tsuruntsurun',
    slug: 'katsuura-tsuruntsurun',
    name: '勝浦つるんつるん温泉直営オートキャンプ場',
    area: '勝浦',
    address: '千葉県勝浦市松野1126-2',
    priceMin: 5000,
    priceMax: 7000,
    priceVerified: true,
    priceNote:
      'サイト単位課金。**1サイト（7m×7m程度）5,000円で「人数ではなくサイト料金」と公式が明記**。' +
      'AC電源付は6,000円。GW期間中と夏休み期間はテントサイト・ログキャビンが1,000円割増、ロッジは2,000円割増。' +
      'ログキャビン14,000円、ロッジ18,000円〜',
    features: {
      carIn: true,
      carInNote: 'オートサイト',
      bath: true,
      bathNote: '場内の勝浦温泉を大人850円→**キャンプ利用者は500円**、小人450円で利用できる',
      reservation: '要',
      reservationNote: '電話 0470-77-1777',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '勝浦温泉が場内にあるオートキャンプ場。**料金は人数ではなくサイト単位**と公式が明記しているので、ソロ1名でも5,000円。温泉はキャンプ利用者だと大人500円になる。チェックイン13時〜16時。',
    officialUrl: 'http://katuuraonsen.com/camp/camp.html',
    tel: '0470-77-1777',
    cautions: [
      '**GW期間中と夏休み期間はテントサイトが1,000円割増**',
      'チェックインは13:00〜16:00。16時以降になる場合は電話連絡が要ると公式に記載',
      '公式サイトはHTTPSの証明書がホスト名と一致しないため、ブラウザによっては警告が出る',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://katuuraonsen.com/camp/camp.html'],
  }),

  base({
    id: 'tomisakikan-camp',
    slug: 'tomisakikan-camp',
    name: '富崎館キャンプ場',
    area: '館山・布良',
    address: '千葉県館山市布良303-1',
    priceMin: 3300,
    priceMax: 5500,
    priceVerified: true,
    priceNote:
      'サイト単位課金（1サイト5名定員）。**「浪路」7.5m×5.5m 3,300円／「新島」10m×7.5m 3,300円／' +
      '「ROQ RUN」3,300円（車の乗り入れ可・犬同伴可）／「大島」7.5m×7.5m 5,500円／「富士」12.5m×5.5m 5,500円。**' +
      '人数割ではないのでソロ1名は3,300円から。レンタルはテント（NORDISK 5名定員）8,800円、BBQセット2,200円',
    features: {
      shower: true,
      showerNote: 'シャワーブースあり',
      reservation: '要',
      reservationNote: '公式サイトの予約導線から。貸切の予約も受け付けていると公式に記載',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '館山市布良の漁村の高台にある全5サイトの小さなキャンプ場。太平洋を見渡せ、「大島」からは伊豆大島、「富士」からは富士山が見える。元は旅館で、各サイトに当時の部屋名が付いている。営業時間中は併設の富崎館食堂も使える。',
    officialUrl: 'https://www.tomisakikan.net/%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9/%E5%AF%8C%E5%B4%8E%E9%A4%A8%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97%E5%A0%B4',
    tel: '090-3910-9946',
    cautions: [
      '**全5サイトのみ。**貸切予約も受け付けているため、空きが少ない可能性がある',
      '車を乗り入れられるのは「ROQ RUN」サイト。他サイトの車両条件は公式に明記されていない',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: [
      'https://www.tomisakikan.net/%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9/%E5%AF%8C%E5%B4%8E%E9%A4%A8%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97%E5%A0%B4',
      'https://www.tomisakikan.net/',
    ],
  }),

  base({
    id: 'wildkids-misaki',
    slug: 'wildkids-misaki',
    name: 'ワイルドキッズ岬オートキャンプ場',
    area: 'いすみ・岬町',
    address: '千葉県いすみ市岬町和泉687',
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      carIn: true,
      carInNote: 'オートキャンプ場',
      reservation: '要',
      reservationNote: '公式サイトの予約導線から',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      'いすみ市岬町の太平洋を望むオートキャンプ場。九十九里浜の最南部にあたる。公式サイトから予約できる。',
    officialUrl: 'https://wild-kids-misaki-auto-camping-ground.jimdosite.com/',
    tel: '0470-87-7141',
    cautions: [
      '**料金が公式サイトに出ていない。**予約導線はあるが金額の記載が無い',
      '旧URLの wildkids.jp は実サイト（jimdosite.com）へのリンクだけを置いている。' +
        'さらにHTTPSの証明書がホスト名と一致しないため、旧URLはブラウザで警告が出る',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://wild-kids-misaki-auto-camping-ground.jimdosite.com/'],
  }),

  base({
    id: 'acn-katsuura-manbow',
    slug: 'acn-katsuura-manbow',
    name: 'ACNオートキャンプin勝浦まんぼう',
    area: '勝浦',
    address: '千葉県勝浦市松部1910',
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      carIn: true,
      carInNote: 'オートキャンプ場',
      reservation: '要',
      reservationNote: '公式サイトの予約フォームと予約TELから。予約金（前金）の入金案内がある',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '勝浦市松部の海沿いにある小さなオートキャンプ場。シーカヤックなどの海のアクティビティを併設している。予約は公式の予約フォームか電話で、予約金の入金で確定する方式。',
    officialUrl: 'http://www.manbow-camp.jp/reserve/index.html',
    tel: null,
    cautions: [
      '**料金が公式サイトに出ていない。**予約方法とキャンセル規定は公式にあるが、金額は見当たらない',
      '**予約金（前金）の入金で予約が確定する方式。**キャンセル規定が公式にあるので事前に確認すること',
      '公式サイトはHTTPSの証明書がホスト名と一致しないため、ブラウザによっては警告が出る',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://www.manbow-camp.jp/reserve/index.html', 'http://www.manbow-camp.jp/'],
  }),

  base({
    id: 'shiosai-campfield',
    slug: 'shiosai-campfield',
    name: 'しおさいキャンプフィールド',
    area: '南房総・白子',
    address: '千葉県南房総市白子2792',
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      pet: true,
      petNote: 'ローズマリー公園側・ハナレ・ハナレフリー・RVサイトは3頭まで可。ホテル棟側・木もれ陽・なか庭は不可',
      reservation: '要',
      reservationNote: '**キャンプ泊は電話予約を受け付けていない**（当日予約のみ電話可）。オンライン予約から',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '道の駅ローズマリー公園の隣にあるキャンプ場。区画は定員5〜6名でホテル棟側・ローズマリー公園側・木もれ陽・なか庭・ハナレ・ハナレフリー・RVサイトに分かれ、電源の有無とペット可否がサイトごとに違う。',
    officialUrl: 'https://shiosai-minamiboso.com/',
    reservationUrl: 'https://camprsv.com/14215/rsv_list/',
    tel: '0470-46-4633',
    cautions: [
      '**料金が公式サイトに出ていない。**サイトの一覧表（定員・広さ・電源・ペット可否）はあるが金額が無い',
      '**キャンプ泊の電話予約は不可。**当日予約だけ電話を受け付けると公式に明記',
      '**ソロ（1名）可否の明記が公式に無い。**区画は定員5〜6名の上限表記で、下限の条件は書かれていない。予約前に確認すること',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://shiosai-minamiboso.com/'],
  }),

  base({
    id: 'eleven-autocamp',
    slug: 'eleven-autocamp',
    name: 'イレブンオートキャンプパーク',
    area: '君津・栗坪',
    address: '千葉県君津市栗坪300',
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      carIn: true,
      carInNote: 'オートキャンプ場',
      reservation: '要',
      reservationNote: 'Camp-net ほか複数の予約先を公式が案内している',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '君津市栗坪のオートキャンプ場。管理棟・売店・炊事棟・温水シャワー・釣り堀などを備える。予約は公式が案内する Camp-net から。',
    officialUrl: 'https://www.eleven-camp.com/',
    tel: '0439-27-2711',
    cautions: [
      '**料金ページを特定できなかった。**公式トップに料金表が無く、/price /ryokin /guide /charge /info はいずれも404',
      '公式に「停電の影響により営業を休止しておりましたが復旧しましたので、営業を再開致します」の告知がある（**休止中ではない**）',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.eleven-camp.com/'],
  }),

  base({
    id: 'romannomori-camp',
    slug: 'romannomori-camp',
    name: 'ロマンの森共和国キャンプ場',
    area: '君津・豊英',
    address: '千葉県君津市豊英659-1',
    // 入場料は公式にあるが、オートサイトのサイト料が公式のどこにも無く、ソロ1名の総額を作れない
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      carIn: true,
      carInNote: 'オートキャンプ場',
      reservation: '要',
      reservationNote: '公式サイトの予約導線から。前日までの予約で入園が割引になると公式に記載',
    },
    season: '要確認（休園日は公式の「休園日・施設情報」ページを見ること）',
    soloComment:
      '君津市豊英にあるレジャー施設「ロマンの森共和国」の中のキャンプ場。コテージやキャンピングロッジも併設している。宿泊者の入場料は500円。',
    officialUrl: 'https://www.romannomori.co.jp/price/',
    tel: null,
    cautions: [
      '**入場料は公式にある（キャンプ場宿泊者500円／一般1,000円／障がい者500円）が、' +
        'オートサイトのサイト料が公式のどこにも出ていない。**ソロ1名の総額を公式だけでは作れないので金額を持たせていない',
      '休園日が設定されている。公式の「休園日・施設情報」で確認すること',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.romannomori.co.jp/price/'],
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
  if (r.needsPrice === true) {
    if (r.priceVerified === true) errors.push(`${r.slug}: needsPrice と priceVerified は同時に立たない`);
    if (r.priceMin !== 0 || r.priceMax !== 0) errors.push(`${r.slug}: needsPrice なら priceMin/priceMax は 0`);
  } else if (r.priceVerified === true && !String(r.priceNote || '').trim()) {
    errors.push(`${r.slug}: priceVerified が true なのに priceNote が空`);
  }
  if (bySlug.has(r.slug)) errors.push(`${r.slug}: 同じ slug が既にある`);
  const m = muni(r.address);
  const dup = list.find((c) => c.name === r.name && muni(c.address) === m);
  if (dup) errors.push(`${r.slug}: 施設名＋市町村が既存の ${dup.slug} と一致`);
}
if (errors.length) { console.error(`中止: ガードに ${errors.length} 件\n  ` + errors.join('\n  ')); process.exit(1); }

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(24)} ${r.name} / ${muni(r.address)}  priceMin=${r.priceMin} needsPrice=${r.needsPrice === true}`);
}
if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
