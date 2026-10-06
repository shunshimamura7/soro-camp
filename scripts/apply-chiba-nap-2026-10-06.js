/**
 * 千葉・なっぷ未掲載から、掲載の門を通った施設を追加する（2026-10-06・フェーズ4 第1バッチ）。
 *
 * ## 母集団
 *
 * `scripts/.nap-harvest/chiba.json`（収穫完了 342/342・ID集合一致）から
 * 茨城混入1件と既掲載15件を除いた **326件が未掲載**。うち施設名に閉鎖表記のある26件を外し、
 * **門の対象は300件**。本バッチで**実際に調べたのは先頭13件**で、**通ったのは4件**。
 * 残りは `data/chiba-nap-triage-2026-10-06.json` に UNMEASURED として残してある。
 *
 * ## このバッチで分かった落とし穴
 *
 * ### 1. 検索が出す「公式サイト」が**別の県の別施設**だったことがある
 *
 * `柿山田オートキャンプガーデン`（君津市東粟倉542）を調べると `kakiyamada.jp` が
 * 公式として出てくるが、**開くと岡山県津山市の「チコロ・オートキャンプガーデン」**だった。
 * 住所も電話も岡山。**ドメイン名が施設名に似ているだけ。**
 * そのまま採っていたら、千葉のレコードに岡山の料金と電話が入っていた。
 * **門1（施設名と住所の一致）は、検索結果ではなく開いたページで確かめること。**
 *
 * ### 2. 「公式が見つかる」と「公式に料金か予約がある」は別
 *
 * `根本マリンキャンプ場` は南房総市の公式ページ（指定管理者の告示）が見つかるが、
 * **そのページに料金も予約方法も無い。**料金を載せているのは観光協会・じゃらん・なっぷだけ。
 * 門2 で落とした。URLがあることと、裏が取れることは違う。
 *
 * ### 3. なっぷの千葉342件は**ソロ向けキャンプ場ばかりではない**
 *
 * 門の対象300件のうち、名前にグランピング・コテージ・古民家・リゾート等を含むものが49件。
 * `NEO GRAND`（2名15,400円〜）のような宿泊施設も「キャンプ場」として並んでいる。
 * **このサイトはソロ前提なので、そもそも方針の確認が要る。**本バッチでは追加していない。
 *
 * ### 4. ファミリー専用の施設がある
 *
 * `柿山田オートキャンプガーデン` は君津市公式が「**ファミリー専用**のオートキャンプ場」と
 * 書いている。単独利用を受けていない施設をソロのサイトに載せると、行って断られる。
 * 門とは別に落とした（理由は triage に記録）。
 *
 * ## 座標・スコア・料金の扱いは フェーズ3 と同じ
 *
 * - 座標は公式の埋め込み地図のピンが取れたものだけ。**4件とも取れず `needsCoord: true`**
 * - `scores` は中立の3＋`scoresVerified: false`（**採点ではなく未評価の置き字**）
 * - 料金は公式で取れたものだけ `priceVerified: true`。取れなければ `needsPrice: true` で金額0
 *
 * ## 安全装置（フェーズ3と同じ）
 *
 *   node scripts/apply-chiba-nap-2026-10-06.js                  # dry run
 *   node scripts/apply-chiba-nap-2026-10-06.js --write --force  # 実際に書く
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
    id: 'taibusamisaki-camp',
    slug: 'taibusamisaki-camp',
    name: '大房岬自然公園キャンプ場',
    area: '南房総・富浦',
    address: '千葉県南房総市富浦町多田良1212-29',
    priceMin: 630,
    priceMax: 630,
    priceVerified: true,
    priceNote:
      'テント・タープ単位の課金。**テント（3m×4mまで）1泊1張630円**、タープも同額。' +
      '3m×4mを超えると2張分（1,260円〜）。**入場料は無い**のでソロ1名はテント1張の630円。デイキャンプは設営しなければ無料',
    features: {
      reservation: '要',
      reservationNote: '電話のみ（0470-33-4551）。利用月の1年前の1日9:00から受付',
    },
    season: '通年（12/29〜1/3を除く）。毎週月曜日は休業',
    soloComment:
      '南房総の大房岬にある自然公園のキャンプ場。料金はテント1張630円で、入場料はかからない。通年利用できるが毎週月曜と年末年始は休み。予約は電話のみで、利用月の1年前から受け付けている。',
    officialUrl: 'https://taibusa-misaki.jp/mp/goriyouhouhou_ryokinhyo',
    tel: '0470-33-4551',
    cautions: [
      '**毎週月曜日と12/29〜1/3は休業**と公式に明記されている',
      '予約は電話のみ。**繁忙期はデイキャンプの受付を止める**と公式に記載',
      '運営はNPO法人 千葉自然学校（大房岬ビジターセンター）',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://taibusa-misaki.jp/mp/goriyouhouhou_ryokinhyo'],
  }),

  base({
    id: 'kazusa-autocamp',
    slug: 'kazusa-autocamp',
    name: 'かずさオートキャンプ場',
    area: '君津・久留里',
    address: '千葉県君津市向郷766-1',
    priceMin: 4400,
    priceMax: 5500,
    priceVerified: true,
    priceNote:
      'サイト単位課金＋ソロ割引。**普通サイト5,000円（税抜）から「ソロキャンプについては、1,000円引き」**で' +
      '4,000円（税抜）＝**税込4,400円**。ハイシーズンは6,000円（税抜）から1,000円引きで5,000円（税抜）＝税込5,500円。' +
      '電源サイトはいずれも＋1,000円（税抜）。サイト料は5名までで、6人目から1人1,500円追加',
    features: {
      carIn: true,
      carInNote: 'オートサイト',
      reservation: '要',
      reservationNote: '公式サイトの予約ページから。電話は0439-27-2020',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '久留里の名水の里にあるオートキャンプ場。公式の料金表に「ソロキャンプについては、1,000円引き」と明記があり、ソロ1名は税込4,400円から。サイト料は5名まで同額。',
    officialUrl: 'https://www.kazusa-autocamp.com/k-ryoukinn2020.htm',
    tel: '0439-27-2020',
    cautions: [
      '**公式の料金表示は税抜。**上記の税込額は10%で換算したもので、請求額は現地で確認すること',
      '**ソロ割引（1,000円引き）は公式の料金表に明記されている**数少ない施設',
      '公式サイトはフレーム構成で、料金は k-ryoukinn2020.htm に分かれている',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.kazusa-autocamp.com/k-ryoukinn2020.htm', 'https://www.kazusa-autocamp.com/index3.htm'],
  }),

  base({
    id: 'nanasatogawa-autocamp',
    slug: 'nanasatogawa-autocamp',
    name: 'オートキャンプ七里川',
    area: '君津・清和',
    address: '千葉県君津市黄和田畑969-1',
    // 君津市公式に「料金等、詳細はキャンプ場にお問い合わせください」とあり、**公式に金額が無い**。
    // 金額を載せているのは hinata・なっぷ等の第三者だけなので採らない。
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      carIn: true,
      carInNote: 'オートキャンプサイト35区画',
      reservation: '要',
      reservationNote: '君津市公式に「利用の際は事前にご予約下さい」。電話 0439-39-3335 / 090-7728-6441',
    },
    season: '不定休（君津市公式の記載。営業期間の明記は無い）',
    soloComment:
      '君津市黄和田畑のオートキャンプ場で、サイトは35区画。君津市の観光情報ページに掲載されている。宿泊はチェックイン13時・チェックアウト翌11時、デイキャンプは10時〜16時。',
    officialUrl: 'https://www.city.kimitsu.lg.jp/site/kanko/10224.html',
    tel: '0439-39-3335',
    cautions: [
      '**料金が公式に出ていない。**君津市公式は「料金等、詳細はキャンプ場にお問い合わせください」と案内している。' +
        '第三者サイトには金額が載っているが、裏が取れないのでここには書かない',
      '定休日は不定休。訪問前に電話で確認すること',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.city.kimitsu.lg.jp/site/kanko/10224.html'],
  }),

  base({
    id: 'miyoshi-family-camp',
    slug: 'miyoshi-family-camp',
    name: 'みよしファミリーキャンプ場',
    area: '南房総・千倉',
    address: '千葉県南房総市千代4',
    // 公式サイトは「詳しくは事務局までお問合せください」で金額を出していない
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      reservation: '要',
      reservationNote: '電話 0470-36-1185（平日9時〜17時）またはメール miyoshi.1185@gmail.com',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '南房総市千代にある地域運営のキャンプ場。運営は地域づくり協議会「みよし」。問い合わせは平日9時から17時の電話またはメールで受け付けている。',
    officialUrl: 'https://miyoshi1185.wixsite.com/miyoshi-family-camp',
    tel: '0470-36-1185',
    cautions: [
      '**料金が公式に出ていない。**公式は「詳しくは事務局までお問合せください」とだけ案内している',
      '運営は地域づくり協議会「みよし」（南房総市谷向100）',
      '**営業期間が公式に書かれていない。**第三者サイトは夏季のみと書いているが裏が取れていない。必ず事前に確認すること',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://miyoshi1185.wixsite.com/miyoshi-family-camp'],
  }),
];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);

if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない。整形が想定と違う');
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
    if (!Number.isInteger(v) || v < 1 || v > 5) errors.push(`${r.slug}: scores.${k} が1〜5の整数でない（${v}）`);
  }
  if (r.scoresVerified !== false) errors.push(`${r.slug}: scoresVerified を false 以外にしない`);
  if (r.needsCoord !== true || r.lat !== 0 || r.lng !== 0) errors.push(`${r.slug}: needsCoord:true / lat:0 / lng:0 でなければならない`);
  // priceMax は型が必須。欠けると詳細ページの build が落ちる（フェーズ3で実際に落ちた）
  if (typeof r.priceMin !== 'number' || typeof r.priceMax !== 'number') {
    errors.push(`${r.slug}: priceMin/priceMax は必須の数値`);
  } else if (r.priceMax < r.priceMin) {
    errors.push(`${r.slug}: priceMax が priceMin を下回っている`);
  }
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
  console.error(`中止: ガードに ${errors.length} 件ひっかかった。1バイトも書いていない\n  ` + errors.join('\n  '));
  process.exit(1);
}

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(24)} ${r.name} / ${muni(r.address)}`);
  console.log(`      priceVerified=${r.priceVerified === true} needsPrice=${r.needsPrice === true} priceMin=${r.priceMin} needsCoord=${r.needsCoord}`);
  console.log(`      根拠: ${r.officialUrl}`);
}

if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
