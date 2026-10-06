/**
 * 千葉・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ4 第7バッチ）。
 *
 * ## 「団体のみ」を公式で2件はじいた
 *
 * 単独利用不可の門に、**団体人数の下限**という型が加わった。
 *
 *   佐倉草ぶえの丘 … 公式が「**キャンプ場（20名様以上の団体のみ ※個人利用受付不可）**」と見出しに明記
 *   千葉県立君津亀山青少年自然の家 … 公式が「**成人の引率者がいる15名以上の団体がご利用いただけます**」
 *
 * どちらも**ソロでは予約の土俵に乗らない。**既存の「ファミリー専用」「子連れ必須」
 * 「1名可は女性専用サイトのみ」と同じ枠（門落ち：単独利用不可）に入れる。
 *
 * ## 年齢の下限がある施設は掲載する（ただし cautions に書く）
 *
 * `印旛沼サンセットヒルズ` は佐倉市公式に
 * **「18歳未満もしくは高校生以下の方だけでのご宿泊およびデイキャンプはお断りしております」**とある。
 * これは**成人のソロなら使える**ので単独利用不可には当たらない。掲載したうえで注記する。
 *
 *   node scripts/apply-chiba-nap-b7-2026-10-06.js                  # dry run
 *   node scripts/apply-chiba-nap-b7-2026-10-06.js --write --force  # 実際に書く
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
    id: 'campgarden-inzai',
    slug: 'campgarden-inzai',
    name: 'キャンプガーデン印西',
    area: '印西',
    address: '千葉県印西市',
    priceMin: 4400,
    priceMax: 5500,
    priceNote:
      'サイト課金＋人数課金の合算。**オートサイト（全15区画・砂利敷き約100㎡）はサイト料3,300円＋利用料 大人1,100円で、ソロ1名4,400円。**' +
      '金・土・日・祝前日・祝日はサイト料が＋1,100円（ソロ1名5,500円）。子ども（未就学児を除く）の利用料は550円。' +
      '**ソロ用テントなら2張りまで**使える',
    features: {
      carIn: true,
      carInNote: 'オートサイト。テント1張り・タープ1張り・車1台まで（ソロ用テントなら2張りまで）',
      pet: false,
      petNote: 'オートサイトはペット不可と公式に明記（ドッグフリーサイトは別区分）',
      reservation: '要',
      reservationNote: '公式サイトのキャンプ（宿泊）予約ページから。デイキャンプは別ページ',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '印西市のオートキャンプ場。全15区画で砂利敷き約100㎡、定員は最大6名。**ソロ用テントなら2張りまで**使えると公式が明記している。サイト料と1人あたりの利用料の合算で、ソロは平日4,400円。',
    officialUrl: 'https://campg-inzai.com/price/',
    tel: null,
    cautions: [
      '**利用料が人数分かかる。**サイト料3,300円だけでは泊まれず、大人1人1,100円が加算される',
      '**オートサイトはペット不可。**ペット同伴はドッグフリーサイト（別料金）',
      '金・土・日・祝前日・祝日はサイト料が1,100円上がる',
      '**住所の番地が公式ページに無い。**市町村（印西市）までは確認できているが、番地は訪問前に公式で確かめること',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://campg-inzai.com/price/'],
  }),

  base({
    id: 'inbanuma-sunset-hills',
    slug: 'inbanuma-sunset-hills',
    name: '印旛沼サンセットヒルズ',
    area: '佐倉',
    address: '千葉県佐倉市飯野町27',
    priceMin: 4180,
    priceMax: 4180,
    priceNote:
      'サイト単位課金。**オートキャンプ場の宿泊使用料は11:00〜翌10:30で4,180円。**' +
      'デイキャンプ（11:00〜18:00）は2,090円。1区画は約7m×8m四方で**AC電源は無い**',
    features: {
      carIn: true,
      carInNote: 'オートキャンプ場。1区画 約7m×8m',
      reservation: '要',
      reservationNote:
        '**ちば施設予約システム**（ネット）または電話 043-484-1011。' +
        '利用日が属する月の1ヶ月前の4日 8:30から受付。ネット予約には利用者登録が必要',
    },
    season: '通年（12月29日〜1月3日の年末年始を除き無休）',
    soloComment:
      '印旛沼を見下ろす高台にある佐倉市のオートキャンプ場。空気の澄んだ夕暮れ時には富士山やスカイツリーが見えることがある。1区画は約7m×8mでAC電源は無い。チェックインは11:00〜15:00。',
    officialUrl: 'https://www.city.sakura.lg.jp/soshiki/sakuranomiryoku/1/3883.html',
    tel: '043-484-1011',
    cautions: [
      '**18歳未満もしくは高校生以下の方だけでの宿泊・デイキャンプは断られる**と佐倉市公式に明記。成人の単独利用は可',
      '**AC電源が無い**',
      '予約は利用日が属する月の1ヶ月前の4日8:30から。**月初は電話が繋がりにくい**と市公式が案内している',
      '沼側のウッドデッキは有料サイトになったため、休憩所としては使えなくなったと市公式に告知あり',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.city.sakura.lg.jp/soshiki/sakuranomiryoku/1/3883.html'],
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
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(24)} ${r.name} / ${muni(r.address)}  priceMin=${r.priceMin}`);
}
if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
