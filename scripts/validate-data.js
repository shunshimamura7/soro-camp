/**
 * データの整合性検査。エラーが1件でもあれば exit 1 でビルドを止める。
 *
 * package.json の prebuild に登録してあるので、npm run build / deploy の前に必ず走る。
 * 使い方: node scripts/validate-data.js
 */
const fs = require('fs');
const path = require('path');

const { PREFECTURE_BOUNDS, isOutOfBounds, describeBounds } = require(path.join(__dirname, 'prefecture-bounds.js'));

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const REQUIRED = ['id', 'slug', 'name', 'prefecture', 'area', 'scores'];
const SCORE_KEYS = ['quietness', 'scenery', 'value', 'access', 'facility'];
const PREFECTURES = Object.keys(PREFECTURE_BOUNDS);

/** lib/camp.ts の calcSoloScore と同じ式（静けさ・絶景を2倍） */
function calcSoloScore(s) {
  return Math.round(((s.quietness * 2 + s.scenery * 2 + s.value + s.access + s.facility) / 7) * 10) / 10;
}

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// batch 一括投入時のプレースホルダ。実際の確認日ではないので未確認として数える
const PLACEHOLDER_DATE = '2025-01-01';

// soloComment に順位・ランクの主張を書かない方針の検出用。
// 帰属が明示されているもの（ギネス記録、自治体の公称、「〜と言われる」等）は許容する。
const SUPERLATIVE = /日本一|全国一|国内一|世界一|最高峰|最強|随一|No\.?1|ナンバーワン|全国第?\d+位|日本随一|屈指/;
const ATTRIBUTED  = /と言われ|と言われる|と称され|と呼ばれ|公称|ギネス|認定|指定/;

/** 最上級表現を含み、かつ同じ文に帰属表現がない文を返す */
function unsourcedSuperlatives(text) {
  if (!text) return [];
  return String(text)
    .split(/(?<=。)/)
    .filter(sentence => SUPERLATIVE.test(sentence) && !ATTRIBUTED.test(sentence))
    .map(s => s.trim());
}

const errors = [];
const warnings = [];
let unsetCoords = 0;
let placeholderVerified = 0;
let emptyVerified = 0;
const superlativeHits = [];

// ── slug の重複 ─────────────────────────────────────────────────────────────
const seen = new Map();
for (const c of camps) {
  if (!c.slug) continue;
  if (seen.has(c.slug)) errors.push(`slug 重複: "${c.slug}"（${seen.get(c.slug)} と ${c.name}）`);
  else seen.set(c.slug, c.name);
}

for (const c of camps) {
  const id = c.slug || c.id || c.name || '(識別子なし)';

  // ── 必須フィールド ──
  for (const key of REQUIRED) {
    const v = c[key];
    if (v == null || (typeof v === 'string' && v.trim() === '')) {
      errors.push(`${id}: 必須フィールド "${key}" が欠損`);
    }
  }

  // ── scores ──
  if (c.scores && typeof c.scores === 'object') {
    for (const k of SCORE_KEYS) {
      const v = c.scores[k];
      if (!Number.isInteger(v) || v < 1 || v > 5) {
        errors.push(`${id}: scores.${k} が1〜5の整数でない（${JSON.stringify(v)}）`);
      }
    }
  }

  // ── soloScore は派生値。JSON に残っていたら計算値と突き合わせる ──
  if ('soloScore' in c && c.scores) {
    const expected = calcSoloScore(c.scores);
    if (Math.abs(c.soloScore - expected) > 0.05) {
      warnings.push(`${id}: soloScore ${c.soloScore} は計算値 ${expected} と一致しない（再計算した値を使用）`);
    } else {
      warnings.push(`${id}: soloScore は派生値。JSON から削除してよい`);
    }
  }

  // ── prefecture ──
  if (c.prefecture && !PREFECTURES.includes(c.prefecture)) {
    errors.push(`${id}: prefecture "${c.prefecture}" は ${PREFECTURES.join('/')} のいずれでもない`);
  }

  // ── soloComment の最上級表現（エラーにはしない） ──
  const sup = unsourcedSuperlatives(c.soloComment);
  if (sup.length) superlativeHits.push({ slug: c.slug || id, sentences: sup });

  // ── lastVerified の鮮度（エラーにはしない） ──
  if (c.lastVerified === PLACEHOLDER_DATE) placeholderVerified++;
  else if (c.lastVerified == null || String(c.lastVerified).trim() === '') emptyVerified++;

  // ── lat/lng ──
  const latOk = typeof c.lat === 'number' && Number.isFinite(c.lat);
  const lngOk = typeof c.lng === 'number' && Number.isFinite(c.lng);
  if (!latOk || !lngOk) {
    errors.push(`${id}: lat/lng が数値でない（lat=${JSON.stringify(c.lat)} lng=${JSON.stringify(c.lng)}）`);
  } else if (c.lat === 0 || c.lng === 0) {
    unsetCoords++;   // 未設定は別集計。エラーにしない
  } else if (isOutOfBounds(c.prefecture, c.lat, c.lng)) {
    errors.push(`${id}: 座標が${c.prefecture}の範囲外 lat ${c.lat} / lng ${c.lng}（想定 ${describeBounds(c.prefecture)}）`);
  }
}

// ── 結果 ────────────────────────────────────────────────────────────────────
console.log(`validate-data: ${camps.length}件を検査`);
console.log(`  座標未設定（lat/lng = 0）: ${unsetCoords}件`);
console.log(`  lastVerified が ${PLACEHOLDER_DATE}（一括投入時のプレースホルダ＝未確認）: ${placeholderVerified}件`);
console.log(`  lastVerified が空: ${emptyVerified}件`);
if (placeholderVerified || emptyVerified) {
  console.log(`  → 未確認 計${placeholderVerified + emptyVerified}件。詳細は node scripts/unverified-list.js`);
}

if (superlativeHits.length) {
  console.log(`
警告: soloComment に出典不明の最上級表現 ${superlativeHits.length}件`);
  console.log('  （順位・ランクの主張は使わない方針。帰属が明示できる場合は「〜と言われる」等を添えること）');
  superlativeHits.forEach(h => {
    console.log(`  ! ${h.slug}`);
    h.sentences.forEach(t => console.log(`      ${t}`));
  });
}

if (warnings.length) {
  console.log(`\n警告 ${warnings.length}件:`);
  warnings.slice(0, 20).forEach(w => console.log(`  ! ${w}`));
  if (warnings.length > 20) console.log(`  … 他 ${warnings.length - 20}件`);
}

if (errors.length) {
  console.error(`\nエラー ${errors.length}件:`);
  errors.forEach(e => console.error(`  x ${e}`));
  console.error('\nビルドを中止します。');
  process.exit(1);
}

console.log('\n検証OK');
