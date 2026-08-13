/**
 * ⚠ **実行済みの適用スクリプト。再実行しないこと。**
 *
 * 野営地バッチ（2回目）の一括投入。
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

const fs = require('fs');
const path = require('path');

const { normalizeName } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH  = path.join(__dirname, '../data/campgrounds.json');
const BATCH_PATH = path.join(__dirname, 'batch-wild2.json');

const existing = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const batch = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf-8'));

const existingSlugs = new Set(existing.map(c => c.slug));
const toAdd = batch.filter(c => !existingSlugs.has(c.slug));
const skipped = batch.filter(c => existingSlugs.has(c.slug));

// 名前の重複は slug が違っても起きうる（削除した朝霧・大野山がその例）。
// 見つかった場合はマージせず中止する。
const byNormName = new Map();
for (const c of existing) {
  const n = normalizeName(c.name);
  if (!byNormName.has(n)) byNormName.set(n, []);
  byNormName.get(n).push(c);
}

const nameClashes = [];
for (const c of toAdd) {
  const hit = byNormName.get(normalizeName(c.name));
  if (hit && hit.length) {
    nameClashes.push({ incoming: c, existing: hit });
  }
}

if (nameClashes.length) {
  console.error(`エラー: 既存データと名前が重複しています（${nameClashes.length}件）。マージを中止します。`);
  for (const { incoming, existing: hits } of nameClashes) {
    console.error(`  追加しようとした: ${incoming.name}（${incoming.slug}）`);
    for (const h of hits) {
      console.error(`    既存: ${h.name}（${h.slug} / ${h.prefecture}・${h.area}）`);
    }
  }
  console.error('別施設であることが確認できたら、名前を区別できる形に直してから再実行してください。');
  process.exit(1);
}

console.log(`既存: ${existing.length}件`);
console.log(`追加: ${toAdd.length}件`);
console.log(`slug重複スキップ: ${skipped.map(c => c.name).join(', ') || 'なし'}`);
console.log('名前重複: なし');

const merged = [...existing, ...toAdd];
fs.writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2));

const wild = merged.filter(c => c.type === 'wild').length;
console.log(`完了: 合計${merged.length}件（うち野営地${wild}件）`);
