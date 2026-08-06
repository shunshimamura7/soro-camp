/**
 * 座標確認ツール（scripts/coord-tool.html）を生成する。
 *
 * data/campgrounds.json から座標が要確認のものを抽出し、
 * coord-tool.template.html の __CAMPS_JSON__ に直書きして書き出す。
 * 生成物は file:// で開く前提のため fetch は使わず、データを埋め込む。
 *
 * 対象:
 *   - lat === 0 || lng === 0        （座標未設定）
 *   - coordsVerified !== true       （未検証）
 *
 * 使い方:
 *   node scripts/build-coord-tool.js              全対象（既定）
 *   node scripts/build-coord-tool.js --pending    auto-coords が解決できなかったものだけ
 *                                                 （notFound + ambiguous）
 *   node scripts/build-coord-tool.js --slugs a,b  指定 slug だけ
 *   → scripts/coord-tool.html をブラウザで開く
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH     = path.join(__dirname, '../data/campgrounds.json');
const TEMPLATE_PATH = path.join(__dirname, 'coord-tool.template.html');
const OUT_PATH      = path.join(__dirname, 'coord-tool.html');
const AUTO_RESULT   = path.join(__dirname, 'auto-coords-result.json');

const argv = process.argv.slice(2);
const usePending = argv.includes('--pending');
const slugsArg = (() => {
  const i = argv.indexOf('--slugs');
  return i >= 0 && argv[i + 1] ? argv[i + 1].split(',').map(s => s.trim()).filter(Boolean) : null;
})();

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

let targets = camps.filter(
  c => c.lat === 0 || c.lng === 0 || c.coordsVerified !== true
);

// --pending: 自動照合で決まらなかった slug（notFound + ambiguous）に絞る
let filterLabel = '全対象';
if (usePending) {
  if (!fs.existsSync(AUTO_RESULT)) {
    console.error('エラー: --pending には scripts/auto-coords-result.json が必要です。');
    console.error('先に node scripts/auto-coords.js を実行してください。');
    process.exit(1);
  }
  const result = JSON.parse(fs.readFileSync(AUTO_RESULT, 'utf-8'));
  const pending = new Set([
    ...(result.notFound || []),
    ...(result.ambiguous || []).map(a => (typeof a === 'string' ? a : a.slug)),
  ]);
  targets = targets.filter(c => pending.has(c.slug));
  filterLabel = `--pending（notFound ${(result.notFound || []).length} + ambiguous ${(result.ambiguous || []).length}）`;
} else if (slugsArg) {
  const want = new Set(slugsArg);
  const missing = slugsArg.filter(s => !camps.some(c => c.slug === s));
  missing.forEach(s => console.log(`警告: slug が見つかりません: ${s}`));
  targets = targets.filter(c => want.has(c.slug));
  filterLabel = `--slugs（${slugsArg.length}件指定）`;
}

if (targets.length === 0) {
  console.log(`対象が0件です（${filterLabel}）。手動確認は不要です。`);
}

// needsVerify: true（施設の同定そのものが怪しいもの）を先頭に持ってくる
targets = [
  ...targets.filter(c => c.needsVerify === true),
  ...targets.filter(c => c.needsVerify !== true),
];

// ツールが必要とするフィールドだけに絞って埋め込む
const payload = targets.map(c => ({
  needsVerify: c.needsVerify === true,
  slug: c.slug,
  name: c.name,
  prefecture: c.prefecture,
  area: c.area,
  lat: c.lat,
  lng: c.lng,
}));

const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
if (!template.includes('__CAMPS_JSON__')) {
  console.error('エラー: テンプレートに __CAMPS_JSON__ が見つかりません。');
  process.exit(1);
}

// </script> がデータ中に現れると HTML が壊れるのでエスケープする
const json = JSON.stringify(payload, null, 2).replace(/<\//g, '<\\/');

const banner =
  '<!-- 自動生成ファイル。編集は coord-tool.template.html を変更して\n' +
  '     node scripts/build-coord-tool.js を再実行してください。 -->\n';

fs.writeFileSync(OUT_PATH, banner + template.replace('__CAMPS_JSON__', json));

const zero = payload.filter(c => c.lat === 0 || c.lng === 0).length;
const needsVerifyCount = payload.filter(c => c.needsVerify).length;
console.log(`絞り込み: ${filterLabel}`);
console.log(`全${camps.length}件 → 要確認 ${payload.length}件`);
if (needsVerifyCount) console.log(`  うち needsVerify（優先・先頭に配置）: ${needsVerifyCount}件`);
console.log(`  うち座標未設定（lat/lng = 0）: ${zero}件`);
console.log(`  うち未検証（coordsVerified !== true）: ${payload.length - zero}件`);
console.log(`生成: ${path.relative(process.cwd(), OUT_PATH)}`);
