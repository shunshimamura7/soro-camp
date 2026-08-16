/**
 * **robots.txt 自体を 403 で断っているオリジンは、どの UA でも踏まない。**
 *
 * ## なぜ要るか
 *
 * `japancamp.jp` は robots.txt ごと 403 を返す。**Chrome を名乗れば本文は取れる**ことも
 * 実測で分かっているが（2026-08-16）、**robots.txt を見せないのは明示的な拒否**なので尊重する。
 *
 * RFC 9309 は 4xx を「制限なし」と読んでよいとしているが、**それは「robots.txt が無い」場合の話。**
 * 403 は「無い」ではなく「**あなたには見せない**」なので、こちらは踏まない側に倒す。
 *
 * ## ★ 判定は必ず ClaudeBot で行う
 *
 * このリポジトリは**スクリプトによって名乗る UA が違う**（`README` 的な整理は各スクリプト先頭）。
 *
 *   district-sweep.js / check-official-urls.js … Chrome を名乗る
 *   .parked-scan.js / l1-link-rot.js           … ClaudeBot
 *
 * **ガードの判定を Chrome でやると意味が消える。**「こちらの正体で聞いて断られたか」を
 * 見たいので、**robots.txt は常に ClaudeBot で取りに行く。**
 * ここで断られたオリジンは、**Chrome を名乗るスクリプトからも踏まない。**
 *
 * ## 使い方
 *
 *   const { assertOriginAllowed } = require('./robots-guard.js');
 *   const g = await assertOriginAllowed(url);
 *   if (!g.allowed) { …踏まずに g.note を記録… }
 *
 * `note` は `SKIPPED_ROBOTS_403` / `SKIPPED_ROBOTS_429`。
 * **`SKIPPED_ROBOTS`（Disallow で止めた）とは別の値**にしてある。
 * 前者は「先方がこちらを拒否している」、後者は「robots の記述に従った」で意味が違う。
 */
'use strict';

const GUARD_UA = 'ClaudeBot';
const TIMEOUT_MS = 10000;

/** origin -> { allowed, status, note } */
const cache = new Map();

/** テストから差し替えるためのフック。**本体からは使わない。** */
let fetchImpl = (...a) => fetch(...a);

/**
 * オリジンが踏んでよいか。**結果はプロセス内でキャッシュする**（同じオリジンを何度も聞かない）。
 * robots.txt が取れない（DNS 不能など）場合は **allowed: true**（拒否の意思表示ではないため）。
 */
async function assertOriginAllowed(url) {
  let origin;
  try { origin = new URL(url).origin; } catch { return { allowed: true, status: 0, note: '' }; }
  if (cache.has(origin)) return cache.get(origin);

  let out = { allowed: true, status: 0, note: '' };
  try {
    const res = await fetchImpl(origin + '/robots.txt', {
      headers: { 'User-Agent': GUARD_UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 403) out = { allowed: false, status: 403, note: 'SKIPPED_ROBOTS_403' };
    else if (res.status === 429) out = { allowed: false, status: 429, note: 'SKIPPED_ROBOTS_429' };
    else out = { allowed: true, status: res.status, note: '' };
  } catch {
    // 取れない＝拒否ではない。DNS 不能・タイムアウトはここに来る
    out = { allowed: true, status: 0, note: '' };
  }
  cache.set(origin, out);
  return out;
}

module.exports = {
  assertOriginAllowed,
  GUARD_UA,
  /** テスト専用。**本体からは使わない。** */
  _internal: {
    setFetchImpl(fn) { fetchImpl = fn || ((...a) => fetch(...a)); },
    reset() { cache.clear(); },
    peek(origin) { return cache.get(origin); },
  },
};
