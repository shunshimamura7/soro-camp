/**
 * `address-check-2026-08.md`（`verify-address-gsi.js` の出力）から
 * **住所と座標の距離（km）**を読む共通パーサ。
 *
 * ## なぜ共通化するか
 *
 * この距離は md にしか無く、`validate-data.js` と `coordsverified-triage.js` の
 * 両方が読む。**md を機械可読の受け渡しに使うと、生成側の書式変更が消費側を
 * 黙って壊す**（§18-3。手書き7,604字が毎回消えた事故と同根）。
 * パーサを2か所に書くと、書式変更のとき片方だけ直して片方が黙って0件になる。
 *
 * ## 列位置を固定しない（2026-08-13 のレビューで出た欠陥の修正）
 *
 * 旧実装は「slug の後ろ4列スキップ→6列目が距離」と**列位置を焼き込んでいた**。
 * ところが md には列数の違うテーブルが複数あり（ANOMALY/UNKNOWN の表は8列で
 * 距離が7列目）、**距離を持つ16行を黙って取り落としていた**
 * （道志村の一群・`mitsumata-camp` 9.03km などが validate の④「位置は妥当」に化けていた）。
 *
 * このパーサは**ヘッダ行から「距離」を含む列の位置を探して**、その列を読む。
 * テーブルごとにヘッダを読み直すので、列数が違うテーブルが混ざっていても正しく追従する。
 * ヘッダに「距離」が無いテーブルは対象外（読まない）。
 *
 * ## 返り値
 *
 *   { distances: Map<slug, km>, note: string|null }
 *
 * md が無い / 1件も読めない場合は distances が空 Map になり、note に理由が入る。
 * **呼び出し側は note を黙って握りつぶさず、出力に書くこと**（validate-data の流儀）。
 * 部分的な取り落としは列位置ではなく行の書式が原因になるので、
 * 「`km` を含むのに読めなかった行」を数えて note に出す。
 */
const fs = require('fs');
const path = require('path');

const MD = path.join(__dirname, '..', 'address-check-2026-08.md');

/** `| a | b | c |` → ['a','b','c']。テーブル行でなければ null */
function cells(line) {
  const t = line.trim();
  if (!t.startsWith('|')) return null;
  const parts = t.split('|').map((s) => s.trim());
  // 先頭と末尾の空要素（両端のパイプ由来）を落とす
  if (parts.length && parts[0] === '') parts.shift();
  if (parts.length && parts[parts.length - 1] === '') parts.pop();
  return parts.length ? parts : null;
}

function readDistances(mdPath = MD) {
  const distances = new Map();
  let text;
  try {
    text = fs.readFileSync(mdPath, 'utf-8');
  } catch {
    return {
      distances,
      note: '`address-check-2026-08.md` が読めないので住所との距離は測っていない',
    };
  }
  // 追記された過去回を巻き込まないよう、先頭の1回分だけを見る（validate-data と同じ切り方）
  const first = text.split(/^---\r?\n\r?\n# /m)[0];

  let distCol = -1; // 現在のテーブルで「距離」を含む列の位置。-1 = 対象外のテーブル
  let slugCol = -1;
  let unparsed = 0; // km を含むのに読めなかった行（書式変更の検出用）
  for (const line of first.split(/\r?\n/)) {
    const cs = cells(line);
    if (!cs) continue;
    // 区切り行（|---|---|）は読み飛ばす
    if (cs.every((c) => /^:?-+:?$/.test(c))) continue;
    // ヘッダ行 = バッククォート付き slug を持たない行。
    // 「距離」列があればその位置を覚え、**無ければ必ずリセットする**
    // （リセットしないと、距離の無い後続テーブルに前のテーブルの列位置を
    // 持ち越して誤読する。2026-08-13 のレビュー2巡目で発覚）
    if (!cs.some((c) => c.includes('`'))) {
      const d = cs.findIndex((c) => c.includes('距離'));
      distCol = d;
      const s = cs.findIndex((c) => c.replace(/\s/g, '').toLowerCase() === 'slug');
      slugCol = s >= 0 ? s : 0;
      continue;
    }
    if (distCol < 0) continue;
    const slug = /`([^`]+)`/.exec(cs[slugCol] || '');
    if (!slug) continue;
    const km = /([\d.]+)\s*km/.exec(cs[distCol] || '');
    if (km) {
      // 同じ slug が複数のテーブルに出たら先勝ち（先頭のテーブルほど判定が強い）
      if (!distances.has(slug[1])) distances.set(slug[1], Number(km[1]));
    } else if (cs.some((c) => /[\d.]+\s*km/.test(c))) {
      unparsed++; // 距離らしき値が別の列にある＝列の対応がずれている
    }
  }
  if (!distances.size) {
    return {
      distances,
      note: '`address-check-2026-08.md` はあるが距離を1件も読めなかった。**書式が変わった疑い**（§18-3）。`node scripts/verify-address-gsi.js` を回すか、このパーサ（scripts/lib/address-check-md.js）を直すこと',
    };
  }
  return {
    distances,
    note: unparsed
      ? `\`address-check-2026-08.md\` で距離らしき値を持つ ${unparsed}行が読めなかった。書式が変わった疑い（scripts/lib/address-check-md.js を直すこと）`
      : null,
  };
}

module.exports = { readDistances };
