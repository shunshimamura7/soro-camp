/**
 * STEP C の材料 — 46件で**どの項目が実際に埋まっているか**を数える。読み取り専用。
 *
 *   node scripts/field-availability-chiba46.js
 *
 * **スコアの式を書く前に、母数のうち何件でその項目が取れているかを見る。**
 * 取れていない項目に式を当てても「算出不能」が量産されるだけで、
 * **中立値3で埋めたくなる圧力になる**（それが禁止事項なので、先に潰す）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { helpers } = require('./district-sweep.js');
const { stripTags } = helpers;

const IN = path.join(__dirname, '.nap-harvest', 'chiba-detail46.json');
const recs = JSON.parse(fs.readFileSync(IN, 'utf8')).sort((a, b) => a.seq - b.seq);

const has = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const hasText = (v) => has(v) && stripTags(String(v)).trim().length > 0;

const FIELDS = [
  ['chargeInfo', '料金の原文', (d) => hasText(d.chargeInfo)],
  ['priceRange', '料金レンジ(JSON-LD)', (d) => has(d.priceRange)],
  ['siteInfo', '設備の原文', (d) => hasText(d.siteInfo)],
  ['accessInfo', 'アクセスの原文', (d) => hasText(d.accessInfo)],
  ['parkingInfo', '駐車場の原文', (d) => hasText(d.parkingInfo)],
  ['ruleInfo', '場内ルールの原文', (d) => hasText(d.ruleInfo)],
  ['rentalInfo', 'レンタルの原文', (d) => hasText(d.rentalInfo)],
  ['seasonInfo', '営業期間の原文', (d) => hasText(d.seasonInfo)],
  ['holidayInfo', '定休日の原文', (d) => hasText(d.holidayInfo)],
  ['checkinInfo', 'チェックイン時刻', (d) => has(d.checkinInfo)],
  ['checkoutInfo', 'チェックアウト時刻', (d) => has(d.checkoutInfo)],
  ['hpUrl', '施設公式URL', (d) => has(d.hpUrl)],
  ['telephone', '電話', (d) => has(d.telephone)],
  ['ratingValue', '口コミ評価', (d) => d.ratingValue !== null && d.ratingValue !== undefined],
  ['ratingCount', '口コミ件数', (d) => d.ratingCount !== null && d.ratingCount !== undefined],
  ['favoriteNum', 'お気に入り数', (d) => d.favoriteNum !== null && d.favoriteNum !== undefined],
  ['masterList.equipment', '設備コード', (d) => !!(d.masterList && d.masterList.equipment && d.masterList.equipment.length)],
  ['masterList.locationEnvironment', '立地コード', (d) => !!(d.masterList && d.masterList.locationEnvironment && d.masterList.locationEnvironment.length)],
  ['masterList.ground', '地面コード', (d) => !!(d.masterList && d.masterList.ground && d.masterList.ground.length)],
  ['masterList.nearFacilities', '周辺施設コード', (d) => !!(d.masterList && d.masterList.nearFacilities && d.masterList.nearFacilities.length)],
];

const fetched = recs.filter((r) => r.detail);
console.log('レコード ' + recs.length + ' 件 / 詳細が取れた ' + fetched.length + ' 件 / 取れていない ' + (recs.length - fetched.length) + ' 件');
recs.filter((r) => !r.detail).forEach((r) => console.log('  詳細なし: ' + r.name + ' … ' + (r.note || r.state)));
console.log('');
console.log('項目'.padEnd(34) + '説明'.padEnd(22) + '埋まっている / ' + recs.length);
console.log('-'.repeat(78));
for (const f of FIELDS) {
  const n = fetched.filter((r) => f[2](r.detail)).length;
  console.log(f[0].padEnd(34) + f[1].padEnd(22) + String(n).padStart(3) + ' / ' + recs.length
    + '   (' + Math.round(n / recs.length * 100) + '%)');
}

/* ── 追加で見たいもの ───────────────────────────────────── */
console.log('');
// アクセスの原文から「IC から○分/○km」が取れるか
const ACCESS_RE = /(?:IC|インター|イン ?ター)[^。\n]{0,20}?(?:約\s*)?([0-9０-９]+(?:\.[0-9]+)?)\s*(km|キロ|分)/;
const accessParsable = fetched.filter((r) => r.detail.accessInfo && ACCESS_RE.test(stripTags(r.detail.accessInfo)));
console.log('accessInfo から「ICから○km / ○分」が読める: ' + accessParsable.length + ' / ' + recs.length);

// 静粛・消灯のルール明記
const QUIET_RE = /消灯|静粛|夜間[^。]{0,10}(静|音)|22:00以降|21:00以降|クワイエット|騒音/;
const quiet = fetched.filter((r) => r.detail.ruleInfo && QUIET_RE.test(stripTags(r.detail.ruleInfo)));
console.log('ruleInfo に 消灯/静粛時間の明記がある: ' + quiet.length + ' / ' + recs.length);

// 設備キーワード
const EQ = ['トイレ', 'シャワー', '炊事', '売店', 'ランドリー', '洗濯', '電源', '風呂', '温泉', '自販機', 'Wi-Fi', 'ゴミ'];
console.log('');
console.log('siteInfo の設備キーワード出現（原文に書いてあるかどうかだけ）:');
EQ.forEach((w) => {
  const n = fetched.filter((r) => r.detail.siteInfo && stripTags(r.detail.siteInfo).indexOf(w) >= 0).length;
  console.log('  ' + w.padEnd(10) + String(n).padStart(3) + ' / ' + recs.length);
});

// 区画数・標高が原文に出るか
console.log('');
const SITECOUNT_RE = /全\s*[0-9０-９]{1,4}\s*(区画|サイト|張)|[0-9０-９]{1,4}\s*(区画|サイト)\s*(あり|完備|用意)/;
const sc = fetched.filter((r) => {
  const t = stripTags((r.detail.siteInfo || '') + (r.detail.chargeInfo || '') + (r.detail.accessInfo || ''));
  return SITECOUNT_RE.test(t);
});
console.log('区画数の総数が原文から読める: ' + sc.length + ' / ' + recs.length);
const alt = fetched.filter((r) => /標高/.test(stripTags((r.detail.siteInfo || '') + (r.detail.accessInfo || ''))));
console.log('標高の記述がある: ' + alt.length + ' / ' + recs.length);
