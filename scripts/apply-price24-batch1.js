/**
 * 料金未確認23件の再調査 バッチ1（1〜6件目）の反映。
 * 記録と出典URLは scripts/price24-check.md のバッチ1を見ること。
 *
 * PRICED 3件 … priceMin/priceNote を更新し priceVerified を立てる
 * UNPRICED 3件 … needsPrice を立てる。priceVerified は false のまま。
 *                 「調べていない」ではなく「調べたが公開されていない」の印。
 *
 * UNPRICED は priceMin/priceMax も 0 に落とす。
 * 根拠のない数字を残すと、priceVerified を立て直した瞬間にその数字が表に出る。
 * 0/0 は既存の「価格未調査」の表現（CampCard の priceUnknown）と同じ形。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const priced = {
  // 施設公式（道志村観光協会サイト内の施設料金ページ）。
  // batch76 のなっぷ・じゃらん由来の「大人700円＋車1,000円＝1,700円」は
  // 大人料金が古く、さらにテントサイト料1,000円が抜けていた。
  'doshigawa-kanko-noen': {
    priceMin: 2800,
    priceNote:
      '区画+人数課金。テントサイト料1,000円＋大人1名800円＋車1台1,000円で、ソロ1名1泊2,800円（バイクで行けば2,300円）。' +
      '入園料（釣り堀含む）500円は日帰り向けの別項目で、宿泊者に必須の記載はない。タープは別途500円。ゴミは持ち帰り',
  },
  // 施設公式サイトの「宿泊施設紹介」。表示が税抜なので実際に払うのは税込4,400円。
  'yatsugatake-oizumi': {
    priceMin: 4400,
    priceNote:
      'サイト単位課金。テントサイト（18区画）は「4名＋車1台 4,000円（税抜）」で定員4名と駐車1台が込みのため、' +
      'ソロ1名でも同額の4,000円（税込4,400円）。人数割にならない。AC電源は別料金',
  },
  // なっぷ施設ページの料金欄（施設が入稿したもの）。
  // batch76 は「見出しのみで金額なし」としていたが、それはレンダリング結果を見ていたため。
  // HTML を直接読むと全文が入っている。
  'fujinomori-yamanakako': {
    priceMin: 3300,
    priceNote:
      '区画+人数課金。スタンダードサイト（区画）2,500円〜＋施設利用料 大人800円で、ソロ1名1泊3,300円〜（4〜6月・10〜11月の平日）。' +
      '駐車場代1台分は込みで2台目以降1,000円/日。祝休前日と7〜9月はサイトが3,500円〜になり4,300円〜。' +
      'コーナーサイトは3,500円〜、タープ・ハンモックは各1,000円',
    // データの officialUrl は なっぷ 14594 を指していたが、それは
    // 「木曽ふれあいの郷キャンプ場」（長野県木曽郡大桑村）のページ。正しくは 14555。
    officialUrl: 'https://www.nap-camp.com/yamanashi/14555',
  },
};

// 全ソースを当たっても料金が出なかったもの。理由は price24-check.md に1件ずつ書いてある。
// pica-sagamiko は「非公開」ではなく変動料金体系で固定料金が存在しない。
const unpriced = ['pica-sagamiko', 'usami-shiroyama', 'folkwood-yatsugatake'];

let changed = 0;

for (const [slug, patch] of Object.entries(priced)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  Object.assign(c, patch);
  c.priceVerified = true;
  c.lastVerified = DATE;
  delete c.needsPrice;
  changed++;
  console.log(`PRICED   ${slug} -> ${c.priceMin}円`);
}

for (const slug of unpriced) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  c.needsPrice = true;
  c.priceMin = 0;
  c.priceMax = 0;
  c.lastVerified = DATE;
  changed++;
  console.log(`UNPRICED ${slug} -> needsPrice: true, priceMin/Max: 0 (priceVerified は false のまま)`);
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${changed}件を更新した。`);
