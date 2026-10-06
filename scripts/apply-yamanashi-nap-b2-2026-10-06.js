/**
 * 山梨・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ5 山梨 第2バッチ）。
 *
 * ## このバッチで落ちたもの（いずれも門4）
 *
 *   芦川オートキャンプ場 … 料金を載せているのは `fuefuki-kanko.jp`＝**「ふえふき観光ナビ」**
 *                          （フッター "Copyright(c) 2026 ふえふき観光ナビ Inc."）。
 *                          **笛吹市の公式サイトではなく、施設公式でもない。**門4で落とす
 *   SK落合キャンプ場     … 施設公式が見当たらない（なっぷ・Yahoo!ロコ・hinata のみ）
 *   せせらぎ荘キャンプ場 … 同上。都留市観光協会（tsuru-kankou.com）しか無い
 *
 * **「市の観光サイト」と「市の公式サイト」は別物。**ドメインとフッターの著作権表示で見分ける。
 * 前に `doshi-kanko.jp`（道志村役場の直営・© DOSHI VILLAGE）を自治体公式として採ったが、
 * あれは村役場が自分で出していることを村の公式サイト側の告知で確認できたから。
 * 今回の「ふえふき観光ナビ」は民間法人名義なので採らない。
 *
 * ## `kurosaka` は料金ページが取得できなかった
 *
 * 公式トップで**施設名・住所（山梨県笛吹市境川町大黒）・予約導線**までは確認できたが、
 * 料金ページ `/user-guide` が本文を返さない（JavaScript で描画していると見られる）。
 * 門2は予約方法で満たすので掲載し、`needsPrice: true` で金額は持たせない。
 *
 *   node scripts/apply-yamanashi-nap-b2-2026-10-06.js                  # dry run
 *   node scripts/apply-yamanashi-nap-b2-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');
const TODAY = '2026-10-06';
const NEUTRAL = { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 };

const ADD = [
  {
    type: 'campground',
    status: 'active',
    prefecture: '山梨',
    id: 'kurosaka-autocamp',
    slug: 'kurosaka-autocamp',
    name: '黒坂オートキャンプ場',
    area: '笛吹・境川',
    address: '山梨県笛吹市境川町大黒坂',
    lat: 0,
    lng: 0,
    needsCoord: true,
    scores: { ...NEUTRAL },
    scoresVerified: false,
    needsPrice: true,
    priceMin: 0,
    priceMax: 0,
    features: {
      carIn: true,
      carInNote: 'オートキャンプ場',
      reservation: '要',
      reservationNote: '公式サイトの「予約はこちら」から',
    },
    season: '要確認（公式に営業期間の記載なし。臨時休業は公式のお知らせで告知される）',
    soloComment:
      '笛吹市境川町の山の地形を生かした林間のオートキャンプ場。甲府盆地の夜景を見下ろせる。公式が「東京から90分の好立地」と案内し、場内にカフェがある。',
    officialUrl: 'https://www.kurosaka.net/',
    tel: '090-7186-8931',
    cautions: [
      '**料金が取得できなかった。**公式の料金ページ（/user-guide）が本文を返さず、金額を確認できていない。予約前に公式で確かめること',
      '**台風接近時はキャンセル料を無料にする告知**が公式のお知らせに出ることがある。荒天時は公式を確認',
      '場内は山の地形に沿っていて**場所ごとにサイトの形状が違う**と公式に記載',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.kurosaka.net/'],
    lastVerified: TODAY,
  },
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
  if (r.needsPrice === true) {
    if (r.priceVerified === true) errors.push(`${r.slug}: needsPrice と priceVerified は同時に立たない`);
    if (r.priceMin !== 0 || r.priceMax !== 0) errors.push(`${r.slug}: needsPrice なら priceMin/priceMax は 0`);
  }
  if (bySlug.has(r.slug)) errors.push(`${r.slug}: 同じ slug が既にある`);
  const m = muni(r.address);
  const dup = list.find((c) => c.name === r.name && muni(c.address) === m);
  if (dup) errors.push(`${r.slug}: 施設名＋市町村が既存の ${dup.slug} と一致`);
}
if (errors.length) { console.error(`中止: ガードに ${errors.length} 件\n  ` + errors.join('\n  ')); process.exit(1); }

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(22)} ${r.name} / ${muni(r.address)}  needsPrice=${r.needsPrice === true}`);
}
if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
