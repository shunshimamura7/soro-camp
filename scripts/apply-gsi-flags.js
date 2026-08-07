/**
 * coord-report.json の判定を coordsGsiChecked に写す。
 *
 * coordsVerified（人が目視した）と coordsGsiChecked（機械検証を通過した）を分けたので、
 * 機械側のフラグを実際の検証結果から埋める。
 * verdict === 'OK' のものだけ true にし、それ以外はフィールドを付けない
 * （未設定＝通過していない、と読む）。
 *
 * coordsVerified には一切触らない。人の目視の記録を機械の判定で上書きしないため。
 *
 * 前提: 先に node scripts/verify-coords-gsi.js を走らせて coord-report.json を最新にしておくこと。
 * 使い方: node scripts/apply-gsi-flags.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'coord-report.json');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
const verdictBySlug = new Map(report.map((r) => [r.slug, r.verdict]));

let added = 0;
let removed = 0;
let missing = 0;

for (const c of camps) {
  const verdict = verdictBySlug.get(c.slug);
  if (verdict === undefined) {
    missing++;
    continue;
  }
  if (verdict === 'OK') {
    if (c.coordsGsiChecked !== true) {
      c.coordsGsiChecked = true;
      added++;
    }
  } else if ('coordsGsiChecked' in c) {
    delete c.coordsGsiChecked;
    removed++;
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

const counts = report.reduce((acc, r) => ((acc[r.verdict] = (acc[r.verdict] || 0) + 1), acc), {});
console.log('coordsGsiChecked を反映');
console.log(`  coord-report.json の判定: ${JSON.stringify(counts)}`);
console.log(`  true を付けた           : ${added}件`);
console.log(`  外した                  : ${removed}件`);
if (missing) console.log(`  レポートに無く据え置き  : ${missing}件`);

const verified = camps.filter((c) => c.coordsVerified === true).length;
const checked = camps.filter((c) => c.coordsGsiChecked === true).length;
const both = camps.filter((c) => c.coordsVerified === true && c.coordsGsiChecked === true).length;
console.log();
console.log(`  coordsVerified: true   ${verified}件（人が目視）`);
console.log(`  coordsGsiChecked: true ${checked}件（機械検証を通過）`);
console.log(`  両方立っている         ${both}件`);
console.log(`  どちらも立っていない   ${camps.filter((c) => c.coordsVerified !== true && c.coordsGsiChecked !== true).length}件`);
