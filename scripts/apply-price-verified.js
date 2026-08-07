/**
 * priceVerified を初期設定する。
 *
 * scripts/ghost-candidates.md で分かったとおり、priceNote（料金の内訳）を持たない
 * 76件と、住所が空の76件は完全に同一集合だった。同じ一括投入バッチで入った記録で、
 * 料金の値は持つのに内訳を持たない。料金を実際に調べた人は内訳を必ず書けるので、
 * 内訳の有無を「一次情報に当たったか」の判定基準として使う。
 *
 * priceNote があるものに priceVerified: true を立てるだけ。
 * scores.value やその他の値には一切触らない。
 *
 * 使い方: node scripts/apply-price-verified.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const isEmpty = (v) => v == null || String(v).trim() === '';

let added = 0;
let skipped = 0;

for (const c of camps) {
  if (!isEmpty(c.priceNote)) {
    if (c.priceVerified !== true) {
      c.priceVerified = true;
      added++;
    }
  } else {
    // 未確認側はフィールドを付けない。「未設定＝未確認」で読む
    if ('priceVerified' in c) delete c.priceVerified;
    skipped++;
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

const verified = camps.filter((c) => c.priceVerified === true);
const unverified = camps.filter((c) => c.priceVerified !== true);

console.log(`priceVerified を設定: ${added}件に true`);
console.log(`  確認済み : ${verified.length}件`);
console.log(`  未確認   : ${unverified.length}件（${skipped}件が priceNote なし）`);
console.log();
console.log('未確認76件の内訳:');
console.log(`  status active           : ${unverified.filter((c) => c.status === 'active').length}件`);
console.log(`  priceMin > 0（金額あり） : ${unverified.filter((c) => c.priceMin > 0).length}件`);
console.log(`  type wild               : ${unverified.filter((c) => c.type === 'wild').length}件`);
console.log(`  officialUrl か tel あり  : ${unverified.filter((c) => !isEmpty(c.officialUrl) || !isEmpty(c.tel)).length}件`);
console.log(`  どちらも無い             : ${unverified.filter((c) => isEmpty(c.officialUrl) && isEmpty(c.tel)).length}件`);
const v = {};
unverified.forEach((c) => (v[c.scores.value] = (v[c.scores.value] || 0) + 1));
console.log(`  scores.value の分布      : ${[5, 4, 3, 2, 1].filter((k) => v[k]).map((k) => `${k}→${v[k]}件`).join(' / ')}`);
