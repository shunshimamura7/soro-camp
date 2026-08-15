/**
 * 403（先方がこの UA を拒否）の扱いの検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * `.mock-ratelimit-test.js` の 403 版。403 も狙って起こせないので `fetch` をモックする。
 *
 * ## 偽ゼロ検証（これが本題）
 *
 * 千葉で `japancamp.jp` `seiwanomori.jp` `1059dai.com` `kazusa-autocamp.com` が
 * そろって ClaudeBot に 403 を返していた。**サイトは生きていて人間には見える。**
 * これが `UNREACHABLE:0件` に見えると「そのソースには無かった」と読める＝**偽のゼロ**。
 *
 *   (a) 一覧が403        → `FORBIDDEN`。**`UNREACHABLE` でも `RATE_LIMITED` でもない**
 *   (b) 403 は再試行しない → リクエストは1回だけ（429と違って待っても変わらない）
 *   (c) 403 と DNS 死が混ざらない → 別ソースが UNREACHABLE でも 403 側は FORBIDDEN のまま
 *   (d) 判定順             → SKIPPED_ROBOTS > FORBIDDEN > RATE_LIMITED > UNREACHABLE
 *   (e) items は 0 だが「0件」ではない → incompleteNote が 403 を数える
 *   (f) robots.txt が200で本体が403  → robots を見ただけでは分からない（1059dai.com 型）
 *
 * **消さないこと。**403 の扱いを変えたときに、ここが落ちれば気づける。
 * 実行: `node scripts/.mock-forbidden-test.js`
 */
const { _internal: I } = require('./district-sweep.js');

let calls = [];

function res(status, { body = '<html></html>' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: '',
    headers: { get: k => (k.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null) },
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    text: async () => body,
  };
}

/** plan: url -> () => res(...) 。robots は robotsPlan で別に指定できる */
function mock(plan, robotsPlan = {}) {
  calls = [];
  I.resetRateLimitState();
  I.setFetchImpl(async url => {
    calls.push(url);
    if (url.endsWith('/robots.txt')) {
      const f = robotsPlan[url];
      return f ? f() : res(200, { body: '' });
    }
    const f = plan[url];
    return f ? f() : res(404);
  });
}

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/** 一覧1ページだけの最小ソース */
function src(id, url) {
  return {
    id, layer: 'L1', kind: 'listInline', label: `mock ${id}`, pages: [url],
    list: () => [{ name: 'ダミーキャンプ場', address: '千葉県君津市豊英1-1', url: null }],
  };
}

const U403 = 'https://forbidden.example/list';
const UDNS = 'https://dead.example/list';
const UOK = 'https://ok.example/list';
const U429 = 'https://limited.example/list';

(async () => {
  /* ---- (a)(b) 一覧が403 ---- */
  console.log('\n■ (a)(b) 一覧が 403');
  mock({ [U403]: () => res(403) });
  let c = await I.collectSource(src('f', U403), { useCache: false });
  const nA = calls.filter(u => u === U403).length;
  check('status が FORBIDDEN', c.status === 'FORBIDDEN', `status=${c.status}`);
  check('UNREACHABLE ではない', c.status !== 'UNREACHABLE', `status=${c.status}`);
  check('RATE_LIMITED ではない', c.status !== 'RATE_LIMITED', `status=${c.status}`);
  check('403 は再試行しない（1回だけ）', nA === 1, `${nA}回`);
  check('forbidden に記録が残る', (c.forbidden || []).length === 1, `${(c.forbidden || []).length}件`);
  check('items は空', c.items.length === 0, `${c.items.length}件`);

  /* ---- (c) 403 と DNS 死が混ざらない ---- */
  console.log('\n■ (c) 403 と DNS 死（UNREACHABLE）が混ざらない');
  mock({ [UDNS]: () => { throw new Error('getaddrinfo ENOTFOUND dead.example'); } });
  const cDns = await I.collectSource(src('d', UDNS), { useCache: false });
  check('DNS 死は UNREACHABLE のまま', cDns.status === 'UNREACHABLE', `status=${cDns.status}`);
  check('DNS 死に forbidden は付かない', (cDns.forbidden || []).length === 0);

  /* ---- (d) 判定順: FORBIDDEN > RATE_LIMITED ---- */
  console.log('\n■ (d) 同じソースに 403 と 429 が混ざったとき');
  mock({ [U403]: () => res(403), [U429]: () => res(429) });
  const two = { ...src('m', U403), pages: [U403, U429] };
  const cTwo = await I.collectSource(two, { useCache: false });
  check('FORBIDDEN が優先される', cTwo.status === 'FORBIDDEN', `status=${cTwo.status}`);
  check('429 も rateLimited に残る', (cTwo.rateLimited || []).length >= 1, `${(cTwo.rateLimited || []).length}件`);

  /* ---- (d2) 判定順: SKIPPED_ROBOTS > FORBIDDEN ---- */
  console.log('\n■ (d2) robots で止めたものが最優先');
  mock({ [U403]: () => res(403) },
    { 'https://forbidden.example/robots.txt': () => res(200, { body: 'User-agent: *\nDisallow: /list' }) });
  const cRob = await I.collectSource(src('r', U403), { useCache: false });
  check('SKIPPED_ROBOTS が優先される', cRob.status === 'SKIPPED_ROBOTS', `status=${cRob.status}`);

  /* ---- (e) 偽ゼロ: incompleteNote が 403 を数える ---- */
  console.log('\n■ (e) 偽ゼロ検証 — 403 のソースが「0件」に潰れない');
  mock({ [U403]: () => res(403), [UOK]: () => res(200) });
  const cF = await I.collectSource(src('f2', U403), { useCache: false });
  const cO = await I.collectSource(src('o', UOK), { useCache: false });
  const note = I.incompleteNote([cF, cO]);
  check('incompleteNote が null にならない', note !== null);
  check('forbidden として数える', note && note.byReason.forbidden.total === 1,
    note ? `forbidden=${note.byReason.forbidden.total}` : '-');
  check('rateLimited は0', note && note.byReason.rateLimited.total === 0,
    note ? `rateLimited=${note.byReason.rateLimited.total}` : '-');
  check('取れたソースは OK のまま', cO.status === 'OK', `status=${cO.status}`);
  check('**items 0件でも status が OK ではない**', cF.items.length === 0 && cF.status !== 'OK',
    `items=${cF.items.length} status=${cF.status}`);

  /* ---- (f) robots.txt が200で本体が403（1059dai.com 型） ---- */
  console.log('\n■ (f) robots.txt は 200・Crawl-delay ありなのに本体が 403');
  mock({ [U403]: () => res(403) },
    { 'https://forbidden.example/robots.txt': () => res(200, { body: 'User-agent: *\nCrawl-delay: 5' }) });
  const cMix = await I.collectSource(src('x', U403), { useCache: false });
  check('robots が通っても本体403なら FORBIDDEN', cMix.status === 'FORBIDDEN', `status=${cMix.status}`);
  check('SKIPPED_ROBOTS にはならない', cMix.status !== 'SKIPPED_ROBOTS');

  I.setFetchImpl(null);
  const ng = results.filter(r => !r.ok);
  console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
  if (ng.length) process.exitCode = 1;
})();
