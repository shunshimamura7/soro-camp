/**
 * fujigane-kogen（富士ヶ嶺高原キャンプ場）の修正。
 *
 * 実体は「STAR MEADOWS 富士ケ嶺高原キャンプ場」（2020年6月開業・現在は閉業）。
 * データは県・住所・座標・掲載状態のすべてが誤っていた。
 *
 *   prefecture … 静岡。実際は山梨（出典が「『山梨県』のキャンプ場です」と明記）
 *   address    … 静岡県富士宮市富士ヶ嶺1345。**富士ヶ嶺は山梨県富士河口湖町の地名**で
 *                静岡県富士宮市に同名の大字は存在しない
 *   lat/lng    … 35.3883,138.5625 は静岡県富士宮市「麓」。ふもとっぱらから1.1km
 *   status     … active。実際は閉業
 *
 * GSI検証を通っていたのは、verify-coords-gsi.js が
 * 「逆ジオの都道府県が prefecture と一致するか」しか見ていないため。
 * prefecture が誤って「静岡」だったので、静岡県を指す誤った座標と一致してしまった。
 * 住所の大字（富士ヶ嶺）と逆ジオの大字（麓）の食い違いは検査していない。
 *
 * 出典: https://camp-quests.com/39367/ （【閉業】と明記、「山梨県のキャンプ場」とも）
 *       https://star-meadows.business.site/
 *
 * 使い方: node scripts/apply-fujigane-fix.js
 */
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const c = camps.find((x) => x.slug === 'fujigane-kogen');
if (!c) throw new Error('fujigane-kogen が見つからない');

const before = JSON.parse(JSON.stringify(c));

c.name = 'STAR MEADOWS 富士ケ嶺高原キャンプ場';
c.prefecture = '山梨';
c.area = '富士河口湖町富士ヶ嶺';
c.address = '山梨県南都留郡富士河口湖町富士ヶ嶺';
c.status = 'closed';
// 閉業した施設に座標を持たせる意味はなく、入っていた値は県違いの誤りだった。
// sanogawa-camp と同じく 0,0 に落とす（validate は closed を needsCoord の対象外にしている）。
c.lat = 0;
c.lng = 0;
delete c.coordsVerified;
delete c.coordsGsiChecked;
c.lastVerified = '2026-08-07';
c.soloComment =
  '2020年6月に朝霧高原北部の富士ヶ嶺高原に開業したフリーサイトのキャンプ場だったが、現在は閉業している。' +
  'ふもとっぱらより標高が高く富士山に近い牧草地で、開けた眺めが売りだった。';
c.cautions = ['閉業済み。利用できない'];

// 閉業した施設に「利用できる」を示す true を残さない（validate-data.js のルール）
for (const k of ['bonfire', 'pet', 'shower', 'bath', 'carIn', 'soloPlan', 'convenience', 'shop', 'wifi', 'firewood', 'ice', 'alcohol']) {
  if (c.features[k] === true) c.features[k] = false;
}

console.log('fujigane-kogen を修正\n');
for (const k of ['name', 'prefecture', 'area', 'address', 'status', 'lat', 'lng', 'lastVerified']) {
  console.log(`  ${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(c[k])}`);
}
console.log(`  coordsVerified: ${before.coordsVerified} → (削除)`);
console.log(`  soloComment: 閉業を明記した内容に差し替え`);

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');
