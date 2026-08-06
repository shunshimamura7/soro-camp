/**
 * 施設名の正規化と一致判定（唯一の定義）。
 *
 * audit-names.js と auto-coords.js が別々に持っていると必ず食い違うので
 * ここに集約する（prefecture-bounds.js と同じ理由）。
 */

/** カタカナ→ひらがな。表記ゆれ（ロッジ/ろっじ 等）を吸収する。 */
function kataToHira(s) {
  return s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/**
 * NFKC で全角半角を統一 → 括弧内を除去
 * → 「オートキャンプ場」「キャンプ場」「場」を除去
 * → スペース・中黒を除去 → ひらがな化 → 小文字化
 */
function normalizeName(s) {
  if (!s) return '';
  let t = String(s).normalize('NFKC');
  t = t.replace(/\([^)]*\)/g, '');      // 括弧内（NFKC 後は半角）
  t = t.replace(/\[[^\]]*\]/g, '');
  t = t.replace(/【[^】]*】/g, '');
  t = t.replace(/オートキャンプ場/g, '');
  t = t.replace(/キャンプ場/g, '');
  t = t.replace(/オートキャンプ/g, '');
  t = t.replace(/キャンプ/g, '');
  t = t.replace(/場/g, '');
  t = t.replace(/[\s・･]/g, '');
  t = kataToHira(t);
  return t.toLowerCase();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * 重複・別名の疑い（監査用）。近ければ { kind, distance }、そうでなければ null。
 *
 * 日本語の短い名前では編集距離1が「全く別の施設」を意味することが多い
 * （井川 / 早川 / 黒川、大野山 / 大室山）。漢字1文字の情報量が大きいため、
 * 3文字以下は完全一致のみを疑い、長い名前ほど距離を許容する。
 */
function similarity(a, b) {
  if (!a || !b) return null;
  if (a.length < 2 || b.length < 2) return null;
  const d = levenshtein(a, b);
  if (d === 0) return { kind: '完全一致', distance: 0 };
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 3) return null;            // 短い名前は完全一致のみ
  if (maxLen <= 6) return d <= 1 ? { kind: '類似', distance: d } : null;
  return d <= 2 ? { kind: '類似', distance: d } : null;
}

/**
 * OSM 名との照合（auto-coords 用）。
 * 完全一致、または一方が他方を含めば真。
 * ただし正規化後3文字以下になったものは完全一致のみ
 * （「森」だけが残った名前が無関係な候補を大量に拾うのを防ぐ）。
 */
function namesMatch(a, b) {
  if (!a || !b) return false;
  if (a.length < 2 || b.length < 2) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer  = a.length <= b.length ? b : a;
  if (shorter.length <= 3) return false;   // 3文字以下は完全一致のみ
  return longer.includes(shorter);
}

module.exports = { kataToHira, normalizeName, levenshtein, similarity, namesMatch };
