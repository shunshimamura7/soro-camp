/**
 * ⚠ **実行済みの適用スクリプト。再実行しないこと。**
 *
 * `batch6.json` の一括投入。**再実行すると当時のレコードが再び混ざる。**
 *
 * 実行時期: 2026-05（初出コミット）
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
const existing = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/campgrounds.json'), 'utf-8'));
const batch6 = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch6.json'), 'utf-8'));
const existingSlugs = new Set(existing.map(c => c.slug));
const toAdd = batch6.filter(c => !existingSlugs.has(c.slug));
const skipped = batch6.filter(c => existingSlugs.has(c.slug));
console.log(`既存: ${existing.length}件`);
console.log(`追加: ${toAdd.length}件`);
console.log(`重複スキップ: ${skipped.map(c => c.name).join(', ') || 'なし'}`);
const merged = [...existing, ...toAdd];
fs.writeFileSync(path.join(__dirname, '../data/campgrounds.json'), JSON.stringify(merged, null, 2));
console.log(`完了: 合計${merged.length}件`);
