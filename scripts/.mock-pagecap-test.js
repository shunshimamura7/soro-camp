/**
 * `collectSource()` のページ送り判定（§22 の `pageCap`）をモックで検証する。
 *
 * **実サイトでは MORE / SAME / END を意図的に起こせない**ので、取得層を差し替えて作る
 * （`.mock-ratelimit-test.js` と同じ立て方）。
 *
 * 見るのは4つ。**どれも「取れたか」ではなく「違う集合が返ったか」で決まる。**
 *
 *   MORE       N+1 に新しい項目がある＝**打ち切っている**（母数が過小）
 *   END_EMPTY  N+1 が0件＝終端。打ち切りではない
 *   SAME       N+1 が既出と同じ集合＝**ページ送りが効いていない**（§21-5 なっぷ型）
 *   duplicatePages 宣言ページの中で前ページと同じ集合しか返さなかった数
 *
 *   node scripts/.mock-pagecap-test.js
 */
'use strict';

const sweep = require('./district-sweep.js');
const { collectSource, setFetchImpl } = sweep._internal;

/** ページごとに返す名前を決めたモック。**HTTP は常に 200**（取得は成功している） */
function mockFetch(pagesByUrl) {
  return async (url) => ({
    ok: pagesByUrl[url] !== undefined,
    status: pagesByUrl[url] !== undefined ? 200 : 404,
    headers: { get: () => 'text/html; charset=utf-8' },
    arrayBuffer: async () => Buffer.from(pagesByUrl[url] || '', 'utf8'),
    text: async () => pagesByUrl[url] || '',
  });
}

/** 本文は「名前をカンマ区切りで並べただけ」。`list()` がそれを項目にする */
const src = (count) => ({
  id: 'mock', layer: 'L2', kind: 'listInline', label: 'モック',
  ...sweep.helpers.paged(n => `https://mock.test/list?p=${n}`, count),
  list(html) {
    return html.split(',').filter(Boolean).map(n => ({ name: n.trim(), url: null }));
  },
});

const CASES = [
  {
    name: 'MORE — N+1 に新しい項目がある（打ち切っている）',
    pages: { 'https://mock.test/list?p=1': 'a,b', 'https://mock.test/list?p=2': 'c,d' },
    count: 1,
    expect: { verdict: 'MORE', newItemsOnProbe: 2, duplicatePages: 0, items: 4 },
  },
  {
    name: 'END_EMPTY — N+1 が0件（終端）',
    pages: { 'https://mock.test/list?p=1': 'a,b', 'https://mock.test/list?p=2': '' },
    count: 1,
    expect: { verdict: 'END_EMPTY', newItemsOnProbe: 0, duplicatePages: 0, items: 2 },
  },
  {
    name: 'SAME — N+1 が既出と同じ集合（ページ送りが効いていない・なっぷ型）',
    pages: { 'https://mock.test/list?p=1': 'a,b', 'https://mock.test/list?p=2': 'a,b' },
    count: 1,
    expect: { verdict: 'SAME', newItemsOnProbe: 0, duplicatePages: 0, items: 2 },
  },
  {
    name: 'END_404 — N+1 が404（終端）',
    pages: { 'https://mock.test/list?p=1': 'a,b' },
    count: 1,
    expect: { verdict: 'END_404', newItemsOnProbe: 0, duplicatePages: 0, items: 2 },
  },
  {
    name: 'duplicatePages — 宣言ページの2枚目が1枚目と同一（10件問題そのもの）',
    pages: {
      'https://mock.test/list?p=1': 'a,b',
      'https://mock.test/list?p=2': 'a,b',
      'https://mock.test/list?p=3': '',
    },
    count: 2,
    expect: { verdict: 'END_EMPTY', newItemsOnProbe: 0, duplicatePages: 1, items: 2 },
  },
];

(async () => {
  let fail = 0;
  for (const c of CASES) {
    setFetchImpl(mockFetch(c.pages));
    const r = await collectSource(src(c.count), { useCache: false });
    setFetchImpl(null);
    const got = {
      verdict: r.pageCap && r.pageCap.verdict,
      newItemsOnProbe: r.pageCap && r.pageCap.newItemsOnProbe,
      duplicatePages: r.pageCap && r.pageCap.duplicatePages,
      items: r.items.length,
    };
    const ok = Object.entries(c.expect).every(([k, v]) => got[k] === v);
    console.log(`${ok ? '  ✅' : '  ❌'} ${c.name}`);
    if (!ok) {
      fail++;
      console.log(`      期待: ${JSON.stringify(c.expect)}`);
      console.log(`      実際: ${JSON.stringify(got)}`);
    }
  }
  if (fail) { console.error(`\n❌ ${fail}件失敗`); process.exit(1); }
  console.log('\n✅ pageCap の判定は5件すべて期待どおり');
})();
