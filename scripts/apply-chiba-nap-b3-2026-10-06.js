/**
 * 千葉・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ4 第3バッチ）。
 *
 * ## 第3バッチで調べた12件のうち、通ったのは2件
 *
 * ### もう一度「別施設の公式サイト」を踏みかけた
 *
 * `うちべんけい茶屋キャンプ場`（富津市小久保1692-2）を調べると `kubo-camp.jp` が出てくるが、
 * **開くと「KUBO CAMP FIELD（道志村久保キャンプ場）／山梨県南都留郡道志村久保2447」**だった。
 * 「小久保」と「久保」でドメインが引っ掛かっただけ。**柿山田（岡山）に続いて2件目。**
 * 開いて住所を見るまで公式と認めない運用が、現に効いている。
 *
 * ### 単独利用を受けていない施設を2件はじいた
 *
 *   - `リスッコ・ファミリーキャンプ場` … 公式が「**お子様のいないご家族でのご宿泊はできかねます。**」
 *     と明記。1サイトの定員も「大人2名 こども4名」で、ソロは予約できない
 *   - `長崎キャンプ場` … **デイキャンプ専用で宿泊できない**（公式サイトの名称が
 *     「稲ヶ崎オートキャンプ＆長崎デイキャンプ場」）。泊まれない場所はこのサイトに載せない
 *
 * ## `solas-no-mori` は門を通ったが、**ソロの条件が特殊**
 *
 * いすみグランピングリゾート＆スパ ソラスに併設されたキャンプ場。
 * 名前にグランピング等を含まず、**公式が「テントを張ることができます」と書いていて
 * 持ち込みテントが可能**なので、2026-10-06 の「宿泊系は載せない」方針の対象外ではない。
 *
 * ただし **1名で予約できるのは女性専用サイトだけ**で、フリーサイトとRVサイトは2名から。
 * 料金も12,000円/名〜と、このサイトの他の施設（600〜5,500円）とは桁が違う。
 * **落とす根拠が門に無いので載せるが、cautions で両方とも明示する。**
 *
 *   node scripts/apply-chiba-nap-b3-2026-10-06.js                  # dry run
 *   node scripts/apply-chiba-nap-b3-2026-10-06.js --write --force  # 実際に書く
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
    id: 'okugome-kimura-nouen',
    slug: 'okugome-kimura-nouen',
    name: '奥米・木村農園キャンプ場',
    area: '君津・奥米',
    address: '千葉県君津市奥米143',
    priceMin: 2000,
    priceMax: 3000,
    priceVerified: true,
    priceNote:
      '人数課金。**通常は1泊2,000円/人**（4歳〜小学生は半額）。' +
      '連休・お盆・年末年始は3,000円/人（4歳〜小学生1,500円/人）。年間パスポート5,000円があり、' +
      '60分以上の農作業で半額になる仕組みも公式に記載',
    features: {
      reservation: '要',
      reservationNote: '要予約。電話 090-6124-0254（7時〜17時）または公式サイトの予約ページから',
    },
    season: '通年（君津市公式に定休日の記載なし）',
    soloComment:
      '君津市奥米の農園が開いているキャンプ場。料金は1人2,000円の人数課金。農業体験や滝の見学も受け付けている。君津市の観光情報ページにも掲載されている。',
    officialUrl: 'https://okugomekimuranouen.wixsite.com/site',
    tel: '090-6124-0254',
    cautions: [
      '**料金は人数課金。**サイト単位ではなく1人あたり2,000円',
      '公式サイトが**Jimdoの偽サイトへの注意喚起**を出している。予約前にドメインを確認すること',
      '君津市公式（経済振興課観光振興係）にも「奥米・木村農園」として掲載がある',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: [
      'https://okugomekimuranouen.wixsite.com/site',
      'https://www.city.kimitsu.lg.jp/site/kanko/46104.html',
    ],
  }),

  base({
    id: 'solas-no-mori',
    slug: 'solas-no-mori',
    name: 'ソラスの森キャンプ場',
    area: 'いすみ・釈迦谷',
    address: '千葉県いすみ市釈迦谷1610-1',
    priceMin: 12000,
    priceMax: 15000,
    priceVerified: true,
    priceNote:
      '**人数課金（1名あたり）。**フリーサイト12,000円/名〜（2名から・最大6名）、' +
      '**女性専用サイト12,000円/名〜（1名から）**、電源付きRVサイト15,000円/名〜（2名から）。' +
      '大浴場は別料金で大人1,650円・子供825円・3歳以下無料',
    features: {
      bath: true,
      bathNote: 'リゾート本館の大浴場を有料で利用できる（15:00〜23:00 / 6:30〜9:00）',
      reservation: '要',
      reservationNote: '公式サイトの RESERVATION から',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      'いすみグランピングリゾート＆スパ ソラスに併設されたキャンプ場。フリーサイト・女性専用サイト・RVサイトのいずれもテントを張れる。宿泊者は本館の大浴場を有料で使える。',
    officialUrl: 'https://solas-glamping.jp/camp/',
    tel: '0470-62-5151',
    cautions: [
      '**1名で予約できるのは「女性専用サイト」だけ。**フリーサイトと電源付きRVサイトは' +
        '**2名から**なので、男性のソロや1名での利用は女性専用サイトを使えない限りできない',
      '**料金が1名あたり12,000円〜**と、このサイトに載っている他の施設（600〜5,500円程度）とは水準が違う。' +
        'グランピングリゾート併設のキャンプ場であることを踏まえて選ぶこと',
      '持ち込みテントは公式が「テントを張ることができます」と明記している',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://solas-glamping.jp/camp/'],
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
  if (r.priceVerified === true && !String(r.priceNote || '').trim()) errors.push(`${r.slug}: priceVerified が true なのに priceNote が空`);
  if (bySlug.has(r.slug)) errors.push(`${r.slug}: 同じ slug が既にある`);
  const m = muni(r.address);
  const dup = list.find((c) => c.name === r.name && muni(c.address) === m);
  if (dup) errors.push(`${r.slug}: 施設名＋市町村が既存の ${dup.slug} と一致`);
}
if (errors.length) { console.error(`中止: ガードに ${errors.length} 件\n  ` + errors.join('\n  ')); process.exit(1); }

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(24)} ${r.name} / ${muni(r.address)}  priceMin=${r.priceMin}`);
  console.log(`      根拠: ${r.officialUrl}`);
}
if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
