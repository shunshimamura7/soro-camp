/**
 * 山梨・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ5 山梨 第1バッチ）。
 *
 * ## 収穫が完了した県から入る
 *
 * `check-nap-harvest.js` の**2条件が揃った**ので山梨に着手した。
 *
 *   状態: COMPLETE   progress: [yamanashi] 完了 291/291
 *   レコード 291 / 200 で取得 291 / 取得率 100.0%
 *   残り0 / 余り0 / HTTP は全件 200
 *
 * 291件 − 既掲載55件 = **未掲載236件**。うち施設名に閉鎖表記13件・宿泊系29件を外して
 * **門の対象は194件**。判定は `data/yamanashi-nap-triage-2026-10-06.json` に全件入れてある。
 * 本バッチは**キャンプ場系94件の先頭から4件を調べ、3件が通った。**
 *
 * ## 「オートキャンプ不可」を公式が明記している施設がある
 *
 * `笛吹小屋キャンプ場` は公式の料金ページに
 * **「場内は、車の近くにテントを張るオートキャンプや車中泊は出来ません。」**とある。
 * `features.carIn` を **false** にして根拠を `carInNote` に残す（未指定の「未確認」とは別物）。
 * 直火も「直火禁止ですので、薪や炭を使用する際には場内に設置されている囲炉裏か、
 * または必ず市販品の焚き火台やグリルなどを使用してください」と明記されているので
 * `bonfire: true` ＋ 条件を note に書く。
 *
 * ## 早着が有料の施設
 *
 * `一の瀬高原キャンプ場` は**午前中（9時〜）のチェックインが有料**
 * （プラス大人500円・車500円・バイク300円）。通常は14時着で、17時まで自動延長。
 * ソロの最安は 大人1,000円＋車500円＝**1,500円**（バイクなら1,300円）。
 *
 *   node scripts/apply-yamanashi-nap-b1-2026-10-06.js                  # dry run
 *   node scripts/apply-yamanashi-nap-b1-2026-10-06.js --write --force  # 実際に書く
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
  prefecture: '山梨',
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
    id: 'ichinose-kogen-camp',
    slug: 'ichinose-kogen-camp',
    name: '一の瀬高原キャンプ場',
    area: '甲州・一之瀬',
    address: '山梨県甲州市塩山一之瀬高橋560',
    priceMin: 1300,
    priceMax: 1500,
    priceNote:
      '人数課金＋車両課金の合算。**大人1人1,000円＋普通車1台500円でソロ1名1,500円、バイク（300円）なら1,300円。**' +
      '小学生500円、幼児300円。**チェックインを午前中（9時〜）にする場合は加算**（大人＋500円・車＋500円・バイク＋300円、' +
      '小学生＋250円・幼児＋150円）。薪は1,000円',
    features: {
      carIn: true,
      carInNote: '車1台500円・バイク1台300円の駐車料がかかる',
      firewood: true,
      firewoodNote: '薪を1,000円で販売',
      reservation: '要',
      reservationNote: '電話 0553-34-2125 またはメール',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '甲州市の一之瀬高原にあるキャンプ場。公式が「こちらの気温は町中より7度から10度低いと思われます」と書くほど標高が高い。通常のチェックインは午後2時、チェックアウトは午前11時で、午後5時まで自動延長して使える。',
    officialUrl: 'https://www.cosmo.ne.jp/camp/',
    tel: '0553-34-2125',
    cautions: [
      '**周辺に店が無い**と公式が明記している。買い出しは事前に済ませること',
      '**町中より7〜10度低い**と公式が案内。装備は気温差を見込むこと',
      '**午前中のチェックインは追加料金**（大人＋500円・車＋500円・バイク＋300円）',
      '一ノ瀬林道が2年半ぶりに開通したとの告知が公式にある。道の状況は事前に確認を',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.cosmo.ne.jp/camp/'],
  }),

  base({
    id: 'autocamp-suzuran',
    slug: 'autocamp-suzuran',
    name: 'オートキャンプすずらん',
    area: '笛吹・芦川',
    address: '山梨県笛吹市芦川町上芦川1808',
    priceMin: 5500,
    priceMax: 6050,
    priceNote:
      'サイト単位課金（1サイト5名まで）。**オートサイト1区画5,500円、電源付きサイト6,050円。**' +
      '人数割ではないのでソロ1名も同額。人数追加は1名880円。デイキャンプは4,400円。' +
      '**温水シャワーとサイトの駐車料は無料。上記の料金に別途消費税がかかる**と公式に記載',
    features: {
      carIn: true,
      carInNote: 'オートサイト。サイトの駐車料は無料',
      shower: true,
      showerNote: '温水シャワーは無料と公式に記載',
      reservation: '要',
      reservationNote: '電話 090-2402-9150 / 055-298-2021、FAX、メールで受付',
    },
    season: '4月中旬〜11月中旬',
    soloComment:
      '笛吹市芦川町のオートキャンプ場。オートサイトは1区画5,500円で5名まで同額。温水シャワーとサイトの駐車料が無料。一宮・御坂インターから20分で、バードウォッチングや渓流釣り、川遊びができる。',
    officialUrl: 'http://park15.wakwak.com/~suzuran/ryoukin/index.htm',
    tel: '090-2402-9150',
    cautions: [
      '**営業は4月中旬〜11月中旬**。冬季は営業していない',
      '**表示価格に消費税は含まれていない**と公式に明記',
      'キャンセル料は当日が全額、1週間以内が1サイト2,000円',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://park15.wakwak.com/~suzuran/ryoukin/index.htm'],
  }),

  base({
    id: 'fuefukigoya-camp',
    slug: 'fuefukigoya-camp',
    name: '笛吹小屋キャンプ場',
    area: '山梨市・三富',
    address: '山梨県山梨市三富川浦1820',
    priceMin: 2600,
    priceMax: 3100,
    priceNote:
      '人数課金＋テント課金＋車両課金の合算。**入場料 大人600円＋テント持ち込み1張2,000円が土台で、徒歩なら2,600円。' +
      'これに駐車料がバイク200円／普通車500円で加わり、ソロ1名はバイク2,800円・普通車3,100円。**' +
      '子供の入場料は300円。デイキャンプ（バーベキュー）は1区画1,000円で入場料は大人300円・子供150円。' +
      '薪1袋700円、炭1箱（約3kg）700円。バンガローは4.5畳6,500円・12畳16,000円・24畳26,000円（入場料込・ペット同伴不可）',
    features: {
      bonfire: true,
      bonfireNote:
        '**直火禁止。**場内の囲炉裏か市販の焚き火台・グリルを使う（レンタルあり）。' +
        '場内外の枯れ葉や落ちた木を拾って燃やすことも禁止。持ち込みの薪は太い建築廃材や釘付きの木材が不可',
      carIn: false,
      carInNote: '**公式に「場内は、車の近くにテントを張るオートキャンプや車中泊は出来ません。」と明記**',
      firewood: true,
      firewoodNote: '薪1袋700円、炭1箱（約3kg）700円',
      pet: true,
      petNote: '同伴希望は電話時に申告が必要。**バンガローはペット同伴不可**',
      reservation: '要',
      reservationNote: '予約制。電話 0553-39-2829。休業日は事前に問い合わせること',
    },
    season: '要確認（予約制。休業日は事前に問い合わせと公式に記載）',
    soloComment:
      '山梨市三富、西沢渓谷の近くにあるキャンプ場。**オートキャンプと車中泊はできず**、車は駐車場に置いてテントは別の場所に張る。直火は禁止で、場内の囲炉裏か市販の焚き火台を使う。午後10時に消灯。',
    officialUrl: 'http://www.fuefukigoya.com/ryoukin.html',
    tel: '0553-39-2829',
    cautions: [
      '**オートキャンプ・車中泊はできない。**公式が「場内は、車の近くにテントを張るオートキャンプや車中泊は出来ません。」と明記している',
      '**直火禁止。**薪や炭は場内の囲炉裏か市販の焚き火台・グリルで使う',
      '**場内外の枯れ葉・落ちた木を拾って燃やす行為は禁止。**薪は販売品か、太さ・長さの条件を満たす持ち込みのみ',
      '大きいテントやタープは張れない場合があるため事前相談が必要（混雑時は不可）',
      'ハンモックは要相談。幹の保護材を巻き、夜間は撤収すること',
      '**午後10時消灯。**日中も大声や大音量の音響機器は注意の対象',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://www.fuefukigoya.com/ryoukin.html'],
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
