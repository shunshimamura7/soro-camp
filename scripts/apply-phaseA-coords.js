/**
 * フェーズA: zero-coord-check.md の座標を data/campgrounds.json に反映する。
 *
 * 座標は「再計算・補正しない」ため、コード内に数値を書き写さず
 * scripts/zero-coord-check.md から直接パースして使う（転記ミスを構造的に防ぐ）。
 *
 * - CONFIRMED 16件 + 判定保留(ランバージャック) 1件 … lat/lng を反映し lastVerified を更新
 * - NEEDS_COORD(根熊山荘) … 座標は触らず needsCoord: true を付ける
 * - CLOSED(佐野川) … 座標記載が無いので対象外（扱いはフェーズC）
 *
 * 使い方: node scripts/apply-phaseA-coords.js [--dry]
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'campgrounds.json');
const REPORT_MD = path.join(__dirname, 'zero-coord-check.md');
const VERIFIED_DATE = '2026-08-07';
const DRY = process.argv.includes('--dry');

/** md の各 "### 見出し" ブロックから slug と座標を拾う */
function parseReport(md) {
  const blocks = md.split(/^### /m).slice(1);
  const entries = [];
  for (const b of blocks) {
    const title = b.split('\n')[0].trim();
    const slug = (b.match(/^- slug: `([^`]+)`/m) || [])[1];
    if (!slug) continue;
    const coordLine = (b.match(/^- 座標: (.+)$/m) || [])[1] || '';
    const m = coordLine.match(/^\*{0,2}(-?\d+\.\d+)\*{0,2},\s*\*{0,2}(-?\d+\.\d+)\*{0,2}/);
    entries.push({
      title,
      slug,
      lat: m ? Number(m[1]) : null,
      lng: m ? Number(m[2]) : null,
      rawCoord: coordLine.trim(),
    });
  }
  return entries;
}

const md = fs.readFileSync(REPORT_MD, 'utf-8');
const entries = parseReport(md);

if (entries.length !== 19) {
  console.error(`レポートから読めた件数が ${entries.length} 件（19件のはず）。中断する。`);
  process.exit(1);
}

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const bySlug = new Map(camps.map((c) => [c.slug, c]));

const applied = [];
const flagged = [];
const skipped = [];
const errors = [];

for (const e of entries) {
  const camp = bySlug.get(e.slug);
  if (!camp) {
    errors.push(`slug が見つからない: ${e.slug}（${e.title}）`);
    continue;
  }

  if (e.lat === null || e.lng === null) {
    // 座標が取れなかったもの
    if (e.slug === 'nekumasanso-auto') {
      camp.needsCoord = true; // 0,0 のまま残し、未取得であることを明示する
      flagged.push({ slug: e.slug, name: camp.name, raw: e.rawCoord });
    } else {
      skipped.push({ slug: e.slug, name: camp.name, raw: e.rawCoord });
    }
    continue;
  }

  // 座標が 0,0 のものだけを対象にする（既に値が入っているものを上書きしない）
  if (camp.lat !== 0 || camp.lng !== 0) {
    errors.push(`${e.slug} は既に座標を持っている (${camp.lat}, ${camp.lng}) ため上書きしない`);
    continue;
  }

  const before = { lat: camp.lat, lng: camp.lng, lastVerified: camp.lastVerified };
  camp.lat = e.lat;
  camp.lng = e.lng;
  camp.lastVerified = VERIFIED_DATE;
  applied.push({ slug: e.slug, name: camp.name, before, after: { lat: e.lat, lng: e.lng } });
}

console.log('=== フェーズA: 座標の反映 ===\n');
console.log(`反映 ${applied.length}件:`);
for (const a of applied) {
  console.log(`  ${a.slug.padEnd(24)} 0,0 -> ${a.after.lat}, ${a.after.lng}   ${a.name}`);
}
console.log(`\nneedsCoord を付与 ${flagged.length}件:`);
for (const f of flagged) console.log(`  ${f.slug.padEnd(24)} 座標は 0,0 のまま（${f.raw}）  ${f.name}`);
console.log(`\n座標を触らない ${skipped.length}件:`);
for (const s of skipped) console.log(`  ${s.slug.padEnd(24)} ${s.raw}  ${s.name}`);

if (errors.length) {
  console.error('\n!! エラー !!');
  for (const e of errors) console.error('  ' + e);
  console.error('\n書き込まずに中断する。');
  process.exit(1);
}

if (DRY) {
  console.log('\n--dry のため書き込みなし。');
  process.exit(0);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));
console.log(`\ndata/campgrounds.json に書き込んだ。`);
