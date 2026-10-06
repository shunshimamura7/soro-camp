/**
 * 千葉・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ4 第2バッチ）。
 *
 * ## このバッチの範囲
 *
 * 優先6市（南房総・館山・君津・いすみ・富津・勝浦）かつ**施設名がキャンプ場系**の未処理分を
 * 上から順に当たった。**調べたのは21件、通ったのは8件。**
 * 全件の判定は `data/chiba-nap-triage-2026-10-06.json` にある。
 *
 * ## 門1の確認を「開いて」やった結果、落ちたものが多い
 *
 * 前バッチで `kakiyamada.jp` が岡山県の別施設だった件を受けて、
 * **検索が公式として出した URL は必ず開き、施設名と市町村を突き合わせた。**その結果：
 *
 *   - `サンビレッジ金谷キャンプ場` … 公式サイトはあり、ソロサイト2,500円〜も載っているが、
 *     **トップにも施設案内にも住所が書かれていない。**市町村を照合できないので入れない
 *   - `オートキャンプ場志駒` … 「公式」として出てくるのは `maruchiba.jp`（千葉県観光物産協会の
 *     ちば観光ナビ）で、施設自身のサイトではない。門4で落とす
 *   - `勝浦チロリン村オートキャンプ場` … 公式で施設名と住所は一致したが、
 *     **料金も予約方法もページに無い。**門2で止める（再訪が要る）
 *
 * ## HTTPS の証明書不一致で開けない公式が4件あった
 *
 * `manbow-camp.jp` / `wildkids.jp` / `futtsu-kankou.jp` / `camp-miyahara.com` は
 * いずれも証明書がホスト名と一致せず取得できなかった（共用ホスティングの既定証明書が返る）。
 * **開けない以上、門1の照合ができない。**推測で通さず UNMEASURED にしてある。
 *
 * ## 料金が公式に無いものは needsPrice（掲載はする）
 *
 * `富津公園キャンプ場`・`RECAMP館山`・`人魚の湯 オートキャンプ場 マリンサイド` の3件は、
 * 公式に施設名・住所・予約方法まではあるが**金額が無い**（予約先のなっぷ側にある）。
 * 門1〜3は満たすので掲載し、`needsPrice: true` で金額は持たせない。
 *
 * ## 座標・スコアの扱いは前バッチと同じ（`needsCoord: true` / 中立3＋`scoresVerified: false`）
 *
 *   node scripts/apply-chiba-nap-b2-2026-10-06.js                  # dry run
 *   node scripts/apply-chiba-nap-b2-2026-10-06.js --write --force  # 実際に書く
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
    id: 'kameyamako-autocamp',
    slug: 'kameyamako-autocamp',
    name: '亀山湖オートキャンプ場',
    area: '君津・亀山湖',
    address: '千葉県君津市折木沢湯の川1306',
    priceMin: 4000,
    priceMax: 5000,
    priceVerified: true,
    priceNote:
      'サイト課金＋人数課金の合算。**下段北側・上段西側・下段南側の区画3,000円＋入場料 大人1,000円で、ソロ1名4,000円。**' +
      '上段東側（AC電源付き）は4,000円＋入場料で5,000円。子供（3歳〜小学生）の入場料は500円。' +
      'アーリーチェックイン／レイトチェックアウトは各1時間500円',
    features: {
      carIn: true,
      carInNote: '区画オートサイト',
      reservation: '要',
      reservationNote: '公式サイトのサイト別予約フォームから',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '亀山湖に面したオートキャンプ場。料金はサイト料と入場料の合算で、電源なしの区画ならソロ1名4,000円。売店は10時から17時、レンタル品の受付は16時まで。',
    officialUrl: 'https://www.kameyamacamp.com/%E6%96%BD%E8%A8%AD%E3%83%BB%E6%96%99%E9%87%91%E6%A1%88%E5%86%85/',
    tel: null,
    cautions: [
      '**入場料が人数分かかる。**サイト料だけでは泊まれない',
      '予約はサイトごとに専用フォームが分かれている',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.kameyamacamp.com/%E6%96%BD%E8%A8%AD%E3%83%BB%E6%96%99%E9%87%91%E6%A1%88%E5%86%85/'],
  }),

  base({
    id: 'inagasaki-camp',
    slug: 'inagasaki-camp',
    name: '稲ヶ崎キャンプ場',
    area: '君津・亀山湖',
    address: '千葉県君津市草川原866',
    priceMin: 1100,
    priceMax: 3300,
    priceVerified: true,
    priceNote:
      'サイト単位課金。**フリーキャンプサイトはテント1張1,100円**で、入場料の設定が無いのでソロ1名1,100円。' +
      'オートキャンプサイトは1区画1泊3,300円。23〜26番の電源貸出は＋1,100円。コインシャワー3分100円',
    features: {
      carIn: true,
      carInNote: 'オートキャンプサイトあり。フリーサイトは別区分',
      shower: true,
      showerNote: 'コインシャワー 3分100円（15:00〜21:00）',
      reservation: '要',
      reservationNote: '君津市公共施設予約システム（k6.p-kashikan.jp/kimitsu-city/）または電話 0439-39-3390',
    },
    season: '通年営業（12/29〜1/3は休業）',
    soloComment:
      '亀山湖畔のキャンプ場。フリーサイトはテント1張1,100円と安く、オートサイトは1区画3,300円。予約は君津市の公共施設予約システムか電話。通年営業で年末年始だけ休む。',
    officialUrl: 'https://inagasaki.world.coocan.jp/facilities.html',
    tel: '0439-39-3390',
    cautions: [
      '**予約は君津市の公共施設予約システム経由。**市の施設として運用されている',
      '公式での名称は「稲ヶ崎オートキャンプ＆長崎デイキャンプ場」。なっぷ側の表記と異なる',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://inagasaki.world.coocan.jp/facilities.html'],
  }),

  base({
    id: 'lakeside-kameyama',
    slug: 'lakeside-kameyama',
    name: 'レイクサイド亀山キャンプ場',
    area: '君津・亀山湖',
    address: '千葉県君津市川俣旧押込68-3',
    priceMin: 4500,
    priceMax: 4500,
    priceVerified: true,
    priceNote:
      'サイト課金＋人数課金の合算。**君津市公式の表示は「4,500円〜」**（サイト料3,000円＋入場料 大人1,500円の組み合わせに相当）。' +
      '上限は公式に出ていないので下限と同値を置いている',
    features: {
      reservation: '要',
      reservationNote: '**電話予約は受け付けていない。**予約と最新情報はなっぷから',
    },
    season: '定休日は月曜・火曜（君津市公式の記載）',
    soloComment:
      '亀山湖の湖畔にあるキャンプ場。君津市の観光情報ページに「4,500円〜」と掲載されている。電話予約は受け付けておらず、予約はなっぷから。月曜と火曜が定休日。',
    officialUrl: 'https://www.city.kimitsu.lg.jp/site/kanko/77120.html',
    reservationUrl: 'https://www.nap-camp.com/chiba/15852',
    tel: '0439-29-6233',
    cautions: [
      '**電話予約は不可。**君津市公式が「電話予約は受け付けておりません」と明記している',
      '**月曜・火曜が定休日**',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.city.kimitsu.lg.jp/site/kanko/77120.html'],
  }),

  base({
    id: 'ohara-sotobou',
    slug: 'ohara-sotobou',
    name: '大原オートキャンプインそとぼう',
    area: 'いすみ・大原',
    address: '千葉県いすみ市深堀1831',
    priceMin: 5000,
    priceMax: 7000,
    priceVerified: true,
    priceNote:
      'サイト課金＋人数課金の合算（2023年4月1日改訂）。**電源なしのC〜Eサイト4,000円＋利用料 大人1,000円でソロ1名5,000円。**' +
      '電源付きのA・Bサイトは5,000円。繁忙期（連休・8月第1〜3土曜日・年末年始）は各サイト＋1,000円。子供の利用料は500円',
    features: {
      carIn: true,
      carInNote: 'オートサイト',
      reservation: '要',
      reservationNote: '公式サイトの予約ページから',
    },
    season: '要確認（公式に営業期間の記載なし。通年だが繁忙期以外は週末中心との情報あり）',
    soloComment:
      'いすみ市深堀のオートキャンプ場。サイトはA〜Eの5種で、電源なしのC〜Eなら4,000円。これに大人1人1,000円の利用料が加わる。チェックイン13時〜17時、チェックアウト8時〜11時。',
    officialUrl: 'https://oohara-ac-inn.jimdofree.com/%E3%82%B5%E3%82%A4%E3%83%88%E3%81%AE%E3%81%94%E6%A1%88%E5%86%85-%E6%96%99%E9%87%91',
    tel: '0470-62-8277',
    cautions: [
      '**利用料が人数分かかる。**サイト料だけでは泊まれない',
      '繁忙期（連休・8月第1〜3土曜日・年末年始）はサイト料が1,000円上がる',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://oohara-ac-inn.jimdofree.com/%E3%82%B5%E3%82%A4%E3%83%88%E3%81%AE%E3%81%94%E6%A1%88%E5%86%85-%E6%96%99%E9%87%91'],
  }),

  base({
    id: 'futtsu-kanaya-hills',
    slug: 'futtsu-kanaya-hills',
    name: '富津金谷オートキャンプヒルズ',
    area: '富津・金谷',
    address: '千葉県富津市金谷894-1',
    priceMin: 3500,
    priceMax: 7700,
    priceVerified: true,
    priceNote:
      'サイト単位課金で**入場料なし**。**Eソロサイト（人数1人・車1台乗り入れ可・電源なし・全3サイト）**が' +
      'オフ4,400円／レギュラー5,500円／ハイ7,700円、2026年4月以降は夏季3,500円。' +
      '人数追加は2人まで可（中学生以上2,000円／小学生以上1,000円／乳幼児無料）',
    features: {
      carIn: true,
      carInNote: 'ソロサイトも車1台の乗り入れ可',
      reservation: '要',
      reservationNote: '予約開始は3か月前の1日9:00。毎月1日は電話での予約受付をしていない',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '富津市金谷の高台にあるオートキャンプ場。**1人専用のEソロサイトが3区画あり**、車1台を乗り入れできる。入場料は無く、サイト料だけで泊まれる。チェックイン13時〜17時。',
    officialUrl: 'http://www.autocamphills.com/charge.html',
    tel: '0439-32-1115',
    cautions: [
      '**Eソロサイトは全3区画と少ない。**定員1人で電源なし・ペット不可',
      '予約開始は3か月前の1日9:00。**毎月1日は電話予約を受け付けていない**',
      '台風時などは前日午前中までに開催可否を判断し、ホームページ・なっぷ・SNSで告知すると公式に記載',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://www.autocamphills.com/charge.html', 'http://www.autocamphills.com/'],
  }),

  base({
    id: 'futtsu-koen-camp',
    slug: 'futtsu-koen-camp',
    name: '富津公園キャンプ場',
    area: '富津',
    address: '千葉県富津市富津2280',
    // 県立富津公園の公式（指定管理者サイト）に「利用時間、利用料金等のお問い合わせは
    // 富津市観光協会富津支部へ」とあり、**公式に金額が無い**。観光協会のページは門4で使えない
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      reservation: '要',
      reservationNote: 'キャンプ場の運営は富津市観光協会。問い合わせ・予約は同協会富津支部へ',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '千葉県立富津公園の中にあるキャンプ場。公園全体の指定管理とは別に、キャンプ場は富津市観光協会が運営している。東京湾に面した明治百年記念展望塔のある公園内にある。',
    officialUrl: 'https://www.cue-net.or.jp/kouen/futtsu/annai/camp.html',
    tel: '0439-87-8887',
    cautions: [
      '**料金が公式に出ていない。**県立富津公園の公式は「利用時間、利用料金等のお問い合わせは富津市観光協会富津支部へ」とだけ案内している',
      'キャンプ場の運営は**富津市観光協会**（公園全体の指定管理者とは別）',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.cue-net.or.jp/kouen/futtsu/annai/camp.html'],
  }),

  base({
    id: 'recamp-tateyama',
    slug: 'recamp-tateyama',
    name: 'RECAMP館山',
    area: '館山',
    address: '千葉県館山市布沼1210',
    // 公式（株式会社Recamp）に施設名・住所・予約導線はあるが、金額はなっぷ側にしかない
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      reservation: '要',
      reservationNote: '公式が指定する予約先はなっぷ',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '館山ファミリーパークを引き継いだキャンプ場。運営は株式会社Recamp。富津館山道路・富浦ICから車で約25分。予約は公式が案内するなっぷから。',
    officialUrl: 'https://www.recamp.co.jp/recamptateyama',
    reservationUrl: 'https://www.nap-camp.com/chiba/14639',
    tel: null,
    cautions: [
      '**料金が公式サイトに出ていない。**公式は予約先としてなっぷを案内しており、金額はそちらにある',
      '旧称は「館山ファミリーパークキャンプ場」',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.recamp.co.jp/recamptateyama'],
  }),

  base({
    id: 'ningyonoyu-marineside',
    slug: 'ningyonoyu-marineside',
    name: '人魚の湯 オートキャンプ場 マリンサイド',
    area: '館山',
    address: '千葉県館山市大賀85-1',
    // 公式（海紅豆）に施設名・住所・予約導線はあるが、キャンプ料金はなっぷ側
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      carIn: true,
      carInNote: 'オートサイト',
      bath: true,
      bathNote: '本館の温泉を利用できる（入浴料 大人800円・子供600円・3歳以下無料）',
      reservation: '要',
      reservationNote: '公式が指定する予約先はなっぷ',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '館山の温泉旅館「海紅豆」が運営するオートキャンプ場。本館の温泉に入れる（入浴料は大人800円・子供600円）。予約は公式が案内するなっぷから。',
    officialUrl: 'http://kaikouzu.com/camp.html',
    reservationUrl: 'https://www.nap-camp.com/chiba/11947',
    tel: '0470-23-1212',
    cautions: [
      '**キャンプ料金が公式サイトに出ていない。**公式は予約先としてなっぷを案内しており、金額はそちらにある',
      '運営は温泉旅館「海紅豆」。**2026年3月19日から宿泊予約システムを変更**と公式に告知がある',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://kaikouzu.com/camp.html', 'http://kaikouzu.com/'],
  }),
];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);

if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない');
  process.exit(1);
}

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
  if (r.needsCoord !== true || r.lat !== 0 || r.lng !== 0) errors.push(`${r.slug}: needsCoord:true / lat:0 / lng:0 でなければならない`);
  if (typeof r.priceMin !== 'number' || typeof r.priceMax !== 'number') errors.push(`${r.slug}: priceMin/priceMax は必須の数値`);
  else if (r.priceMax < r.priceMin) errors.push(`${r.slug}: priceMax が priceMin を下回っている`);
  if (r.needsPrice === true) {
    if (r.priceVerified === true) errors.push(`${r.slug}: needsPrice と priceVerified は同時に立たない`);
    if (r.priceMin !== 0 || r.priceMax !== 0) errors.push(`${r.slug}: needsPrice なら priceMin/priceMax は 0`);
  } else if (r.priceVerified === true && !String(r.priceNote || '').trim()) {
    errors.push(`${r.slug}: priceVerified が true なのに priceNote が空`);
  }
  if (bySlug.has(r.slug)) errors.push(`${r.slug}: 同じ slug が既にある（${bySlug.get(r.slug).name}）`);
  const m = muni(r.address);
  const dup = list.find((c) => c.name === r.name && muni(c.address) === m);
  if (dup) errors.push(`${r.slug}: 施設名「${r.name}」＋市町村「${m}」が既存の ${dup.slug} と一致`);
}
const slugs = ADD.map((r) => r.slug);
if (new Set(slugs).size !== slugs.length) errors.push('追加リスト内で slug が重複している');

if (errors.length) {
  console.error(`中止: ガードに ${errors.length} 件ひっかかった\n  ` + errors.join('\n  '));
  process.exit(1);
}

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(24)} ${r.name} / ${muni(r.address)}`);
  console.log(`      priceVerified=${r.priceVerified === true} needsPrice=${r.needsPrice === true} priceMin=${r.priceMin}`);
  console.log(`      根拠: ${r.officialUrl}`);
}

if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
