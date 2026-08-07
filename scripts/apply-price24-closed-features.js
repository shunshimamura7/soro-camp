/**
 * 料金未確認23件の再調査で closed にした2件の features を落とす。
 *
 * `validate-data.js` は「status が closed なのに features に利用可能を示す true が残っている」を
 * エラーにする。閉鎖した施設の設備を「利用できる」と書いたままにしないための規則
 * （`sanogawa-camp` や `fujigane-kogen` も全て false になっている）。
 *
 * 対象は `hinata-camp`（伊勢原市が令和6年3月に廃止）と
 * `sports-train-aokigahara`（公式ドメイン失効・なっぷ予約不可）。詳細は scripts/price24-check.md。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// validate-data.js の USABLE_FEATURES と同じ並び
const USABLE_FEATURES = [
  'bonfire', 'pet', 'shower', 'bath', 'carIn', 'soloPlan',
  'convenience', 'shop', 'wifi', 'firewood', 'ice', 'alcohol',
];

const targets = {
  'hinata-camp': '伊勢原市が令和6年3月に廃止。跡地は「SMBCの森」に含まれる',
  'sports-train-aokigahara': '閉鎖。公式ドメインが失効し、なっぷも予約不可',
};

for (const [slug, reason] of Object.entries(targets)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  const dropped = USABLE_FEATURES.filter((k) => c.features[k] === true);
  dropped.forEach((k) => {
    c.features[k] = false;
  });
  // 注記も「できる」と読める内容は残さない
  if (c.features.bonfireNote) c.features.bonfireNote = `${reason}のため不可`;
  console.log(`${slug}: ${dropped.length ? dropped.join(', ') : '（true なし）'} を false にした`);
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('\n完了。');
