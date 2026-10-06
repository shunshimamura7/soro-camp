/**
 * 千葉・なっぷ未掲載から門を通った施設を追加する（2026-10-06・フェーズ4 第5バッチ）。
 *
 * ## 閉鎖疑い27件の抜き取り検査（4件）— **4件とも閉鎖・休業が裏付けられた**
 *
 * なっぷの施設名に付いている閉鎖表記が当てになるかを、公式で確かめた。
 *
 *   原岡海岸キャンプ場（R1/8閉鎖）        … 再開の告知が見当たらない。閉鎖のまま
 *   コーラル＊館山（R2/7閉鎖）            … **南房総市白浜町へ移転。**館山の施設は営業していない
 *   鋸南ほしふるキャンプ場（R8/5閉鎖）    … **公式に「5月25日をもって休業いたします」**
 *   東京ドイツ村 芝生広場（R7閉鎖）       … **常設のキャンプ場は閉鎖。**今はイベント開催時のみ
 *                                           （2026/10/17〜18「秋のお花とわくわく体験キャンプ」1組15,000円）
 *
 * **4件とも裏が取れたので、残り23件も同じ扱いにする。**個別の公式確認はしていないので、
 * 台帳にはその旨を書いてある（「抜き取り4件が全件裏付けられたため同様と推定」）。
 *
 * ## 移転先は別レコードとして生きている
 *
 * `コーラル南房総オートキャンプ場`（移転先）は**なっぷでは別IDで、通年営業・定休日なし**。
 * ただし公式ドメイン `coral-minamiboso-camp.com` が**応答しない（接続失敗）**ため、
 * 門1の照合ができず UNMEASURED のまま。閉鎖した館山側とは別物として台帳に残す。
 *
 * ## このバッチで追加するのは1件
 *
 * `我孫子市ふれあいキャンプ場` は我孫子市公式に**住所・使用料・利用期間・予約方法が全部ある**。
 * 市外料金が 2,400円（午後2時〜翌10時）／3,000円（午前10時〜翌10時）で、
 * **`lib/types.ts` の `EligibilityType: "discount"` にあたる**（市内1,200円／1,500円）。
 * 読者は市外から来る前提なので **`priceMin` には市外料金を入れる。**
 *
 *   node scripts/apply-chiba-nap-b5-2026-10-06.js                  # dry run
 *   node scripts/apply-chiba-nap-b5-2026-10-06.js --write --force  # 実際に書く
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
    prefecture: '千葉',
    id: 'abiko-fureai-camp',
    slug: 'abiko-fureai-camp',
    name: '我孫子市ふれあいキャンプ場',
    area: '我孫子',
    address: '千葉県我孫子市岡発戸1395',
    lat: 0,
    lng: 0,
    needsCoord: true,
    scores: { ...NEUTRAL },
    scoresVerified: false,
    priceMin: 2400,
    priceMax: 3000,
    priceVerified: true,
    priceNote:
      'サイト単位課金（1サイト1〜10名）。**市外の人は宿泊キャンプ 午後2時〜翌午前10時が2,400円、' +
      '午前10時〜翌午前10時が3,000円。**市内に在住・在勤・在学の人はそれぞれ1,200円／1,500円。' +
      'デイキャンプ（午前10時〜午後5時）は市外1,000円・市内500円。' +
      '利用者の半数以上が障がい者／市内在住の中学生以下／市内在住の65歳以上で構成される団体は減免がある',
    features: {
      reservation: '要',
      reservationNote:
        '事前の申請（予約）が必須。令和6年4月1日利用分からLINE申請が使える（LINEはオンライン決済のみ）。' +
        '現金払いは窓口申請。返金・キャンセルは利用日の7日前まで',
    },
    eligibility: {
      type: 'discount',
      label: '市外は割高',
      note: '我孫子市に在住・在勤・在学なら半額（宿泊1,200円／1,500円）。市外は2,400円／3,000円',
      source: 'https://www.city.abiko.chiba.jp/event/shisetsu/fureaicamp/shiyouryou.html',
    },
    season: '宿泊キャンプは通年（12月29日から1月4日は利用不可）',
    soloComment:
      '我孫子市が運営する市営キャンプ場。1サイトは1〜10名の単位で、市外からでも宿泊2,400円から使える。定員90人、テントサイトは5人用30張り分、駐車場は普通車40台。令和7年11月1日から冬季の宿泊キャンプも利用できるようになった。',
    officialUrl: 'https://www.city.abiko.chiba.jp/event/shisetsu/fureaicamp/about.html',
    tel: '04-7185-1604',
    cautions: [
      '**市外の人は料金が倍。**市内在住・在勤・在学は宿泊1,200円／1,500円、市外は2,400円／3,000円',
      '**宿泊は原則2泊まで**と市公式に明記',
      '**12月29日から1月4日は利用不可**',
      '予約は事前申請が必須。LINE申請はオンライン決済のみで、現金払いは窓口へ行く必要がある',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: [
      'https://www.city.abiko.chiba.jp/event/shisetsu/fureaicamp/about.html',
      'https://www.city.abiko.chiba.jp/event/shisetsu/fureaicamp/shiyouryou.html',
    ],
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
  if (typeof r.priceMin !== 'number' || typeof r.priceMax !== 'number') errors.push(`${r.slug}: priceMin/priceMax は必須の数値`);
  else if (r.priceMax < r.priceMin) errors.push(`${r.slug}: priceMax が priceMin を下回っている`);
  if (r.priceVerified === true && !String(r.priceNote || '').trim()) errors.push(`${r.slug}: priceNote が空`);
  // eligibility は type / label / source が要る（validate-data.js と同じ条件を先に見る）
  if (r.eligibility) {
    for (const k of ['type', 'label', 'source']) {
      if (!String(r.eligibility[k] || '').trim()) errors.push(`${r.slug}: eligibility.${k} が空`);
    }
    if (!['exclusive', 'discount', 'priority', 'membership'].includes(r.eligibility.type)) {
      errors.push(`${r.slug}: eligibility.type が想定外（${r.eligibility.type}）`);
    }
  }
  if (bySlug.has(r.slug)) errors.push(`${r.slug}: 同じ slug が既にある`);
  const m = muni(r.address);
  const dup = list.find((c) => c.name === r.name && muni(c.address) === m);
  if (dup) errors.push(`${r.slug}: 施設名＋市町村が既存の ${dup.slug} と一致`);
}
if (errors.length) { console.error(`中止: ガードに ${errors.length} 件\n  ` + errors.join('\n  ')); process.exit(1); }

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(22)} ${r.name} / ${muni(r.address)}  priceMin=${r.priceMin}（市外料金）`);
}
if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
