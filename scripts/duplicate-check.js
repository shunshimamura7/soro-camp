/**
 * 全件を総当たりで比較し、
 * 二重登録の疑いがあるペアを scripts/duplicate-suspects.md に列挙する。
 *
 * データは読むだけで変更しない。
 * 使い方: node scripts/duplicate-check.js
 */
const fs = require('fs');
const path = require('path');

const { normalizeName, similarity } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH   = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'duplicate-suspects.md');
const RESULT_PATH = path.join(__dirname, 'auto-coords-result.json');

const NEAR_KM = 1.0;    // 名前が違ってもこの距離なら同一地点の疑い
const SAME_AREA_KM = 20; // 共通語＋この距離以内なら疑わしい

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 2つの文字列の最長共通部分文字列の長さ */
function longestCommonSubstr(a, b) {
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + best + 1; j <= a.length; j++) {
      if (b.includes(a.slice(i, j))) best = Math.max(best, j - i);
      else break;
    }
  }
  return best;
}

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// auto で解決済みのものは手動スキップ分ではないので除く
let autoSlugs = new Set();
if (fs.existsSync(RESULT_PATH)) {
  try {
    const r = JSON.parse(fs.readFileSync(RESULT_PATH, 'utf-8'));
    autoSlugs = new Set((r.auto || []).map(a => a.slug));
  } catch {}
}

// 以前は coordsVerified !== true のものだけを見ていたが、その縛りのせいで
// nakatsugawa-kasenjiki と nakatsugawa-camp（座標が完全に一致）のペアが
// 検出対象から外れていた。確認済みフラグが検証をすり抜けさせる構図は
// 海上・湖面の7件でも起きているので（scripts/sea-coord-check.md）、全件を総当たりする。
const targets = camps.filter(c => !autoSlugs.has(c.slug));

const pairs = [];
for (let i = 0; i < targets.length; i++) {
  for (let j = i + 1; j < targets.length; j++) {
    const a = targets[i], b = targets[j];
    const na = normalizeName(a.name), nb = normalizeName(b.name);
    const reasons = [];

    const sim = similarity(na, nb);
    if (sim) reasons.push(`名称${sim.kind}（編集距離${sim.distance}）`);

    const common = longestCommonSubstr(na, nb);
    const hasCoords = a.lat && a.lng && b.lat && b.lng;
    const dist = hasCoords ? haversineKm(a.lat, a.lng, b.lat, b.lng) : null;

    if (common >= 3 && (dist == null || dist <= SAME_AREA_KM)) {
      reasons.push(`名前に共通部分「${na.slice(na.indexOf(longestCommonPart(na, nb)), na.indexOf(longestCommonPart(na, nb)) + common)}」（${common}文字）`);
    }
    if (dist != null && dist <= NEAR_KM) {
      reasons.push(`座標が近接（${dist.toFixed(2)}km）`);
    }
    // 同じ山・湖などの地名がエリアをまたいで現れるケース
    if (common >= 2 && a.prefecture !== b.prefecture && dist != null && dist <= SAME_AREA_KM) {
      reasons.push(`県をまたぐが${dist.toFixed(2)}kmしか離れていない（県の割り当て誤りの疑い）`);
    }

    if (reasons.length) {
      pairs.push({ a, b, dist, reasons, score: reasons.length * 10 + common });
    }
  }
}

function longestCommonPart(a, b) {
  let best = '';
  for (let i = 0; i < a.length; i++) {
    for (let j = i + best.length + 1; j <= a.length; j++) {
      const s = a.slice(i, j);
      if (b.includes(s)) { if (s.length > best.length) best = s; }
      else break;
    }
  }
  return best;
}

pairs.sort((x, y) => y.score - x.score);

const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

let md = '';
md += '# 二重登録の疑いがあるペア\n\n';
md += `対象: **${targets.length}件**（auto で候補が出た分は除外）。`;
md += '以前は coordsVerified !== true のものだけを見ていたが、確認済みフラグが検証を'
   + 'すり抜けさせていたため全件を対象にした\n\n';
md += `総当たり ${(targets.length * (targets.length - 1)) / 2} ペアを比較し、**${pairs.length}ペア**を抽出。\n\n`;
md += '判定基準: 名称の類似（正規化＋編集距離） / 名前の共通部分3文字以上かつ20km以内 / 座標が1km以内 / 県をまたぐのに近接\n\n';
md += '※ 判定のみ。data/campgrounds.json は変更していない。\n\n';

if (pairs.length) {
  md += '| # | A | B | 距離 | 疑いの根拠 |\n| --- | --- | --- | --- | --- |\n';
  pairs.forEach((p, i) => {
    const av = `\`${p.a.slug}\`<br>${esc(p.a.name)}<br>${p.a.prefecture}・${esc(p.a.area)}`;
    const bv = `\`${p.b.slug}\`<br>${esc(p.b.name)}<br>${p.b.prefecture}・${esc(p.b.area)}`;
    const d = p.dist == null ? '—' : `${p.dist.toFixed(2)}km`;
    md += `| ${i + 1} | ${av} | ${bv} | ${d} | ${p.reasons.map(esc).join('<br>')} |\n`;
  });
} else {
  md += '該当なし。\n';
}

// ── 大野山ペアの全フィールド比較 ────────────────────────────────────────────
const A = camps.find(c => c.slug === 'oyama-camp-gotemba');
const B = camps.find(c => c.slug === 'oyama-kogen-camp');
if (A && B) {
  md += '\n---\n\n## 個別検証: 大野山の2件\n\n';
  md += '大野山は神奈川県足柄上郡山北町の山（標高723m）。同一施設の二重登録の疑いを検証する。\n\n';
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => k !== 'features' && k !== 'scores');
  const fmt = v => (v === undefined ? '(フィールドなし)' : typeof v === 'object' ? JSON.stringify(v) : String(v) === '' ? '(空)' : String(v));
  md += '| フィールド | `oyama-camp-gotemba` | `oyama-kogen-camp` | |\n| --- | --- | --- | --- |\n';
  for (const k of keys) {
    const x = fmt(A[k]), y = fmt(B[k]);
    md += `| ${k} | ${esc(x)} | ${esc(y)} | ${x === y ? '一致' : '**差分**'} |\n`;
  }
  md += '\n**scores**\n\n';
  md += '| | 静けさ | 絶景 | コスパ | アクセス | 設備 |\n| --- | --- | --- | --- | --- | --- |\n';
  md += `| gotemba | ${A.scores.quietness} | ${A.scores.scenery} | ${A.scores.value} | ${A.scores.access} | ${A.scores.facility} |\n`;
  md += `| kogen | ${B.scores.quietness} | ${B.scores.scenery} | ${B.scores.value} | ${B.scores.access} | ${B.scores.facility} |\n`;
  const dist = haversineKm(A.lat, A.lng, B.lat, B.lng);
  md += `\n2点間の距離: **${dist.toFixed(2)}km**\n`;
}

fs.writeFileSync(REPORT_PATH, md);

console.log(`対象 ${targets.length}件 / 総当たり ${(targets.length * (targets.length - 1)) / 2} ペア`);
console.log(`疑わしいペア: ${pairs.length}件`);
pairs.slice(0, 10).forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.a.slug} × ${p.b.slug}  ${p.dist == null ? '' : p.dist.toFixed(2) + 'km'}  [${p.reasons.join(' / ')}]`);
});
console.log(`出力: ${path.relative(process.cwd(), REPORT_PATH)}`);
