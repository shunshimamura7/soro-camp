/**
 * 429（レート制限）の扱いの検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * 429 は狙って起こせないので `fetch` をモックする。検証するのは4つ。
 *
 *   (a) 3回とも429   → `RATE_LIMITED` として記録され、`UNREACHABLE` でも `HTTP_404` でもない
 *   (b) 2回目で200   → 取得でき、**再試行したことが記録に残る**（attempts=2）
 *   (c) 404          → **再試行しない**（リクエストは1回だけ）
 *   (d) 429が1件ある実行 → md の**先頭**に「この実行は不完全」が出る
 *
 * **消さないこと。**429 の扱いを変えたときに、ここが落ちれば気づける。
 * 実行: `node scripts/.mock-ratelimit-test.js`
 */
const { _internal: I } = require('./district-sweep.js');
const { headLines } = require('./dropped-buckets-all.js');

let calls = [];

/** Response もどき。body は空でよい（見るのは status と note と回数） */
function res(status, { body = '<html></html>', retryAfter = null } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: '',
    headers: { get: k => (k.toLowerCase() === 'retry-after' ? retryAfter : (k.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null)) },
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    text: async () => body,
  };
}

/** URL ごとに「何回目に何を返すか」を決めるモック */
function mock(plan) {
  calls = [];
  I.resetRateLimitState();
  I.setFetchImpl(async url => {
    calls.push(url);
    if (url.endsWith('/robots.txt')) return res(200, { body: '' });   // 制限なし
    const seq = plan[url];
    if (!seq) return res(404);
    const n = calls.filter(u => u === url).length;
    return seq[Math.min(n - 1, seq.length - 1)]();
  });
}

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok, detail });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

const U = 'https://mock.example/list';

(async () => {
  /* ---- (a) 3回とも429 ---- */
  console.log(`\n■ (a) 3回とも 429（最大試行 ${I.RATE_LIMIT_MAX_ATTEMPTS}回）`);
  mock({ [U]: [() => res(429)] });
  let r = await I.fetchPage(U, { useCache: false });
  const nA = calls.filter(u => u === U).length;
  check('note が RATE_LIMITED', r.note === 'RATE_LIMITED', `note=${r.note}`);
  check('UNREACHABLE ではない', !/^UNREACHABLE/.test(r.note || ''), `note=${r.note}`);
  check('HTTP_404 ではない', r.note !== 'HTTP_404', `status=${r.status}`);
  check(`${I.RATE_LIMIT_MAX_ATTEMPTS}回試行した`, nA === I.RATE_LIMIT_MAX_ATTEMPTS, `実リクエスト${nA}回 / attempts=${r.attempts}`);
  check('429 を食ったオリジンの間隔が伸びた', I.getOriginPenalty('https://mock.example') > 0,
    `penalty=${I.getOriginPenalty('https://mock.example')}ms`);

  /* ---- (b) 2回目で200 ---- */
  console.log('\n■ (b) 1回目 429 → 2回目 200');
  mock({ [U]: [() => res(429, { retryAfter: '1' }), () => res(200, { body: '<html>ok</html>' })] });
  r = await I.fetchPage(U, { useCache: false });
  const nB = calls.filter(u => u === U).length;
  check('取得できた', r.ok === true && r.status === 200, `ok=${r.ok} status=${r.status}`);
  check('再試行したことが記録に残る（attempts=2）', r.attempts === 2, `attempts=${r.attempts}`);
  check('リクエストは2回', nB === 2, `実リクエスト${nB}回`);
  check('本文が取れている', /ok/.test(r.body || ''), `body=${(r.body || '').slice(0, 20)}`);

  /* ---- (c) 404 は再試行しない ---- */
  console.log('\n■ (c) 404');
  mock({ [U]: [() => res(404)] });
  r = await I.fetchPage(U, { useCache: false });
  const nC = calls.filter(u => u === U).length;
  check('note が HTTP_404', r.note === 'HTTP_404', `note=${r.note}`);
  check('**再試行していない**（リクエスト1回）', nC === 1, `実リクエスト${nC}回 / attempts=${r.attempts}`);
  check('RATE_LIMITED ではない', r.note !== 'RATE_LIMITED', `note=${r.note}`);

  /* ---- (d) 429 が1件ある実行 → md 先頭に「不完全」 ---- */
  console.log('\n■ (d) 一覧が 429 のソースを collectSource に通し、md の先頭を作る');
  mock({ [U]: [() => res(429)] });
  const src = { id: 'mock-src', layer: 'L1', kind: 'listDetail', label: 'モック', pages: [U], list: () => [] };
  const c = await I.collectSource(src, { useCache: false });
  check('collectSource の status が RATE_LIMITED', c.status === 'RATE_LIMITED', `status=${c.status}`);
  check('UNREACHABLE に潰れていない', c.status !== 'UNREACHABLE', `status=${c.status}`);
  check('rateLimited に1件記録されている', (c.rateLimited || []).length === 1, `${(c.rateLimited || []).length}件`);

  const inc = I.incompleteNote([c]);
  check('incompleteNote が不完全を返す', !!inc && inc.total === 1, inc ? `total=${inc.total} 一覧=${inc.list} 詳細=${inc.detail}` : 'null');

  const head = headLines({
    scopeTitle: '全市町村', muniDone: ['モック村'], districts: 1, allMuniCount: 1, allDistricts: 1,
    isPartial: false, stamp: '2026-08-15 00:00:00', cmd: 'node scripts/dropped-buckets-all.js',
    outName: 'dropped-buckets-all-2026-08.md', incomplete: inc,
  });
  const bannerAt = head.findIndex(l => l.includes('この実行は不完全'));
  console.log('    md 先頭3行:');
  head.slice(0, 3).forEach((l, i) => console.log(`      [${i}] ${l.slice(0, 78)}`));
  check('md の先頭（H1 の直後）に「この実行は不完全」が出る', bannerAt === 2, `${bannerAt}行目（H1=0 / 空行=1）`);

  // 対照: 429 が無ければバナーは出ない
  const head2 = headLines({
    scopeTitle: '全市町村', muniDone: ['モック村'], districts: 1, allMuniCount: 1, allDistricts: 1,
    isPartial: false, stamp: '2026-08-15 00:00:00', cmd: 'node scripts/dropped-buckets-all.js',
    outName: 'dropped-buckets-all-2026-08.md', incomplete: null,
  });
  check('対照: 429 が0件ならバナーは出ない', !head2.some(l => l.includes('この実行は不完全')));

  I.setFetchImpl(null);
  const bad = results.filter(x => !x.ok);
  console.log(`\n${bad.length ? `❌ ${bad.length}/${results.length} 失敗` : `✅ 全${results.length}件 PASS`}`);
  process.exit(bad.length ? 1 : 0);
})();
