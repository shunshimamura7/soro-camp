/**
 * auto-coords-result.json の auto 配列から、
 * 一括目視レビュー用HTML（scripts/auto-review.html）を生成する。
 *
 * coord-tool と同じく file:// で開く前提なので fetch は使わずデータを直書きする。
 * 地図は MapLibre ではなくラスタタイルを img で並べる方式
 * （候補が数十件並ぶと WebGL コンテキスト上限に当たるため）。
 *
 * 使い方:
 *   node scripts/review-auto-coords.js
 *   → scripts/auto-review.html をブラウザで開き、違うものだけチェックを外す
 *   → 「JSONでダウンロード」→ scripts/coords-fixed.json として保存
 *   → node scripts/apply-coords.js
 */
const fs = require('fs');
const path = require('path');

const RESULT_PATH   = path.join(__dirname, 'auto-coords-result.json');
const TEMPLATE_PATH = path.join(__dirname, 'auto-review.template.html');
const OUT_PATH      = path.join(__dirname, 'auto-review.html');

if (!fs.existsSync(RESULT_PATH)) {
  console.error('エラー: scripts/auto-coords-result.json がありません。');
  console.error('先に node scripts/auto-coords.js を実行してください。');
  process.exit(1);
}

const result = JSON.parse(fs.readFileSync(RESULT_PATH, 'utf-8'));
const auto = Array.isArray(result.auto) ? result.auto : [];

const payload = auto.map(a => ({
  slug: a.slug,
  name: a.name,
  prefecture: a.prefecture,
  area: a.area,
  lat: a.lat,
  lng: a.lng,
  osmName: a.osmName,
  distanceKm: a.distanceKm,
}));

const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
if (!template.includes('__ITEMS_JSON__')) {
  console.error('エラー: テンプレートに __ITEMS_JSON__ が見つかりません。');
  process.exit(1);
}

const json = JSON.stringify(payload, null, 2).replace(/<\//g, '<\\/');
const banner =
  '<!-- 自動生成ファイル。編集は auto-review.template.html を変更して\n' +
  '     node scripts/review-auto-coords.js を再実行してください。 -->\n';

fs.writeFileSync(OUT_PATH, banner + template.replace('__ITEMS_JSON__', json));

const far = payload.filter(p => p.distanceKm != null && p.distanceKm >= 2).length;
const noCoords = payload.filter(p => p.distanceKm == null).length;

console.log(`自動採用候補: ${payload.length}件`);
if (far)      console.log(`  うち 2km以上ズレ（要注意）: ${far}件`);
if (noCoords) console.log(`  うち 座標未設定からの推定: ${noCoords}件`);
console.log(`要判断 (ambiguous): ${(result.ambiguous || []).length}件`);
console.log(`候補なし (notFound): ${(result.notFound || []).length}件`);
console.log(`\n生成: ${path.relative(process.cwd(), OUT_PATH)}`);
