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
 *   node scripts/build-coord-tool.js
 *   → scripts/coord-tool.html をブラウザで開く
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH     = path.join(__dirname, '../data/campgrounds.json');
const TEMPLATE_PATH = path.join(__dirname, 'coord-tool.template.html');
const OUT_PATH      = path.join(__dirname, 'coord-tool.html');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const targets = camps.filter(
  c => c.lat === 0 || c.lng === 0 || c.coordsVerified !== true
);

// ツールが必要とするフィールドだけに絞って埋め込む
const payload = targets.map(c => ({
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
console.log(`全${camps.length}件 → 要確認 ${payload.length}件`);
console.log(`  うち座標未設定（lat/lng = 0）: ${zero}件`);
console.log(`  うち未検証（coordsVerified !== true）: ${payload.length - zero}件`);
console.log(`生成: ${path.relative(process.cwd(), OUT_PATH)}`);
