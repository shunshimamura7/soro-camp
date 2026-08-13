/**
 * ⚠ **実行済みの適用スクリプト。再実行しないこと。**
 *
 * 実在未確認の施設から裏付けのない断定描写を削る（2026-08-06）。本文をベタ書きで持っている。
 *
 * 実行時期: 2026-08（初出コミット）
 *
 * **ここのベタ書きは「何をどう変えたか」の記録なので、動的判定に書き換えない。**
 * 腐るのは「データの現在の状態を写した一覧」であって、適用の記録ではない（引き継ぎ §18-3）。
 * ただし**再実行すると記録どおりにデータを巻き戻す**ので、事故を防ぐガードを付けてある。
 *
 * 意図して再実行する場合のみ `--force` を付ける。
 */
if (!process.argv.includes('--force')) {
  console.error('[実行済み] ' + require('path').basename(__filename) + ' は一度きりの適用スクリプト。');
  console.error('再実行するとデータを当時の値に巻き戻す。意図する場合のみ --force を付けること。');
  process.exit(1);
}

/**
 * 実在が未確認の施設から、裏付けのない断定描写を削る（2026-08-06）。
 *
 * 地名や周辺施設の事実（堂ヶ島のトンボロ現象、大井川鐡道のSL など）が
 * 正しくても、その施設がそこにある裏付けがなければ結びつけて書かない。
 *
 * あわせて kannogawa の priceNote を並べ替え、テントサイト料金を先頭、
 * バンガロー料金を末尾にまとめる。
 *
 * 使い方: node scripts/strip-unverified-claims.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// slug → 残す文（断り書きのみ）
const STRIP = {
  'minobe-camp': '※施設名・所在地を確認中です。',
  'kawanehon-camp': '※家山は島田市川根町であり川根本町ではない。施設名・所在地を確認中です。',
  // prefecture を山梨・道志村に直したのに説明文が神奈川県側のままで矛盾していた
  'doshi-fureainomori': '※施設名・所在地を確認中です。',
  // 堂ヶ島のトンボロ現象は事実だが、そこにこの施設がある裏付けがない
  'nishiizu-dogashima-camp': '※この施設の実在・正式名称を確認中です。',
};

console.log('── 断定描写の削除 ──────────────────────');
let n = 0;
for (const [slug, keep] of Object.entries(STRIP)) {
  const c = camps.find(x => x.slug === slug);
  if (!c) { console.warn(`警告: slug "${slug}" が見つかりません`); continue; }
  console.log(`■ ${slug}（${c.name}）`);
  console.log(`   変更前: ${c.soloComment}`);
  console.log(`   変更後: ${keep}`);
  c.soloComment = keep;
  n++;
}

// ── priceNote の並べ替え ────────────────────────────────────────────────────
// テントサイト料金 → 改定日 → バンガロー料金 の順にする
const k = camps.find(x => x.slug === 'kannogawa');
if (k) {
  const before = k.priceNote;
  k.priceNote =
    '区画サイト宿泊。日帰り2,000円。2026年4月1日改定。バンガロー6畳8,250円／高床式16,500円／12畳19,800円';
  console.log('\n── priceNote の並べ替え ────────────────');
  console.log(`   変更前: ${before}`);
  console.log(`   変更後: ${k.priceNote}`);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));
console.log(`\n${n}件の soloComment を断り書きのみにしました。`);
