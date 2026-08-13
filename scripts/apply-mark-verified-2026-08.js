/**
 * ⚠ **実行済みの適用スクリプト。再実行しないこと。**
 *
 * `coordsVerified: true` を114件へ一括付与した張本人（§18-11 / `cc751ab`）。
 *   判定基準は「**batch6/batch7 由来でなく、座標が 0 でない**」＝確認済みと見なす、というもので、
 *   **人が目視した記録ではない。**再実行すると、その後の調査で外した分まで立て直してしまう。
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
 * 既存の座標確認済みデータに coordsVerified: true を一括付与する。
 *
 * 除外（＝未検証のまま残す）：
 *   - batch6 / batch7 由来の slug（座標が機械生成のまま未検証）
 *   - lat または lng が 0 のもの（座標未設定。野営地9件）
 *
 * 一度実行すれば済む想定。再実行しても結果は変わらない（冪等）。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const batch6 = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch6.json'), 'utf-8'));
const batch7 = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch7.json'), 'utf-8'));

const unverifiedSlugs = new Set([...batch6, ...batch7].map(c => c.slug));

/** lng の直後に coordsVerified を差し込む（キー順を保って差分を読みやすく保つ） */
function withVerified(camp, value) {
  const out = {};
  for (const [k, v] of Object.entries(camp)) {
    if (k === 'coordsVerified') continue;
    out[k] = v;
    if (k === 'lng') out.coordsVerified = value;
  }
  if (!('coordsVerified' in out)) out.coordsVerified = value;
  return out;
}

let marked = 0;
const skippedBatch = [];
const skippedZero = [];

const updated = camps.map(c => {
  if (c.lat === 0 || c.lng === 0) {
    skippedZero.push(c.slug);
    return c;
  }
  if (unverifiedSlugs.has(c.slug)) {
    skippedBatch.push(c.slug);
    return c;
  }
  if (c.coordsVerified === true) return c;
  marked++;
  return withVerified(c, true);
});

fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));

console.log(`全${camps.length}件`);
console.log(`coordsVerified: true を付与: ${marked}件`);
console.log(`除外（batch6/batch7 由来）: ${skippedBatch.length}件`);
console.log(`除外（lat/lng = 0）: ${skippedZero.length}件`);
console.log(`残る未検証: ${updated.filter(c => c.coordsVerified !== true).length}件`);
