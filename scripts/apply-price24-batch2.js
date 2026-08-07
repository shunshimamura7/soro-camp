/**
 * 料金未確認23件の再調査 バッチ2（7〜12件目）の反映。
 * 記録と出典URLは scripts/price24-check.md のバッチ2を見ること。
 *
 * PRICED 2 / UNPRICED 3 / CLOSED 1
 *
 * CLOSED 1件は料金の話ではない。`hinata-camp`（ふれあいの森日向キャンプ場）は
 * **伊勢原市が令和6年3月に用途を廃止していた**。跡地は三井住友銀行が取得した「SMBCの森」に含まれる。
 * 料金を探しに行って施設そのものが無いと分かった形で、§6-4 と同じ構図。
 * 存在しないものに needsPrice を立てる意味はないので status を closed にするだけにした。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const priced = {
  // 施設公式サイトの Q&A ページ（/general-5）に料金表があった。
  // batch76 は「公式に料金表が無い」としていたが、トップではなく Q&A に置かれていた。
  // なお batch76 が「必須実費」として拾っていた駐車料金550円は **2台目以降** の額で、
  // 1台目はサイト料金に含まれている。必須実費ではなかった。
  'tiny-camp-village': {
    priceMin: 3300,
    priceMax: 4950,
    priceNote:
      '区画+人数課金。サイト料金1,650円/日（車1台の駐車料込み）＋施設利用料1,650円/人・泊で、ソロ1名1泊3,300円。' +
      '追加1名ごと1,650円、2台目以降の車は1日550円、追加サイトは1,650円。4歳以上は施設利用料がかかり、3歳未満とペットは無料。デイキャンプは1,650円＋1,100円',
  },
  // 施設公式サイトの料金表ページ（/price.html、2025年7月1日改定）。
  // batch76 は「入村料の額が取れない」で止まっていたが、公式に明記されていた。
  'naminokomura': {
    priceMin: 5600,
    priceMax: 6600,
    priceNote:
      '区画+人数課金。オートキャンプ1泊1台4,800円（駐車料・温水シャワー込み）＋入村料 大人1名800円で、ソロ1名1泊5,600円。' +
      '2泊目以降の入村料は1泊500円。ACコンセントは別途1,000円。ログキャビンは1棟12,000円＋入村料',
  },
};

// 全ソースを当たっても料金が出なかったもの。理由は price24-check.md に1件ずつ書いてある。
const unpriced = ['kuragari-camp', 'kokono-shizuoka', 'sessokyo-camp'];

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

// 伊勢原市公式:「令和6年3月に用途を廃止した旧『市営ふれあいの森日向キャンプ場』」
// https://www.city.isehara.kanagawa.jp/docs/2024112800066/
// なっぷの施設ページも施設名が「【R3/4現在閉鎖中】ふれあいの森日向キャンプ場」になっている。
// §2-1 のとおり closed は「閉鎖を確認した」という積極的な主張で、これは要件を満たす。
{
  const c = data.find((x) => x.slug === 'hinata-camp');
  if (!c) throw new Error('slug not found: hinata-camp');
  c.status = 'closed';
  c.priceMin = 0;
  c.priceMax = 0;
  c.lastVerified = DATE;
  // 市民先行受付の eligibility は廃止で意味を失うので落とす。
  // closed の赤い警告より弱い情報が並ぶと、まだ申し込めるように読める
  delete c.eligibility;
  changed++;
  console.log('CLOSED   hinata-camp -> status: closed（伊勢原市が令和6年3月に廃止）');
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${changed}件を更新した。`);
