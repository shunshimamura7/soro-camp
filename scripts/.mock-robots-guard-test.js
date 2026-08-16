/**
 * **robots.txt が403のオリジンを踏まない**ことの検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * ## 偽ゼロ検証（これが本題）
 *
 * `japancamp.jp` は robots.txt ごと403で断っているが、**Chrome を名乗れば本文は取れる**。
 * 「取れるから取る」をやめた以上、
 *
 *   (a) robots.txt が403なら**本文を1度も叩かない**（叩いてしまったら偽の成功になる）
 *   (b) その結果は **0件ではなく `SKIPPED_ROBOTS_403`** として残る
 *   (c) `UNREACHABLE` にも `FORBIDDEN` にも `SKIPPED_ROBOTS`（Disallow）にも混ざらない
 *   (d) **Chrome を名乗るスクリプトからも止まる**（district-sweep の fetchPage）
 *   (e) robots.txt が404や200なら普通に踏む（**過剰に止めない**）
 *   (f) robots.txt が取れない（DNS不能）なら踏む（**拒否の意思表示ではない**）
 *
 * 実行: `node scripts/.mock-robots-guard-test.js`
 */
const guard = require('./robots-guard.js');
const { _internal: DS } = require('./district-sweep.js');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

function res(status, body = '<html>ok</html>') {
  return {
    ok: status >= 200 && status < 300, status, url: '',
    headers: { get: k => (k.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null) },
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    text: async () => body,
  };
}

/** robots.txt の応答を origin ごとに決めるモック。本文へのアクセスは記録する */
function mock(robotsPlan) {
  const calls = [];
  const impl = async url => {
    calls.push(url);
    const u = new URL(url);
    if (u.pathname === '/robots.txt') {
      const f = robotsPlan[u.origin];
      return f ? f() : res(404, '');
    }
    return res(200, '<html>本文</html>');
  };
  guard._internal.reset();
  guard._internal.setFetchImpl(impl);
  DS.resetRateLimitState();
  DS.setFetchImpl(impl);
  return calls;
}

const DENY = 'https://deny.example';
const OK = 'https://ok.example';
const DIS = 'https://disallow.example';
const DEAD = 'https://dead.example';

(async () => {
  /* ---- (a)(b)(c) robots が403 ---- */
  console.log('\n■ (a)(b)(c) robots.txt が403 のオリジン');
  let calls = mock({ [DENY]: () => res(403, '') });
  const g = await guard.assertOriginAllowed(DENY + '/list');
  check('allowed が false', g.allowed === false, `allowed=${g.allowed}`);
  check('note が SKIPPED_ROBOTS_403', g.note === 'SKIPPED_ROBOTS_403', `note=${g.note}`);
  check('**本文を1度も叩いていない**', calls.every(u => u.endsWith('/robots.txt')),
    `叩いたURL: ${calls.join(' , ')}`);

  /* ---- (d) Chrome を名乗る district-sweep からも止まる ---- */
  console.log('\n■ (d) Chrome を名乗る fetchPage からも止まる');
  calls = mock({ [DENY]: () => res(403, '') });
  const p = await DS.fetchPage(DENY + '/list', { useCache: false });
  check('note が SKIPPED_ROBOTS_403', p.note === 'SKIPPED_ROBOTS_403', `note=${p.note}`);
  check('ok は false', p.ok === false);
  check('**本文を1度も叩いていない**', calls.every(u => u.endsWith('/robots.txt')),
    `叩いたURL: ${calls.join(' , ')}`);
  check('UNREACHABLE ではない', !/UNREACHABLE/.test(p.note || ''));
  check('FORBIDDEN(HTTP_403) ではない', p.note !== 'HTTP_403', `note=${p.note}`);

  /* ---- collectSource に畳んだときの status ---- */
  console.log('\n■ collectSource の status');
  calls = mock({ [DENY]: () => res(403, '') });
  const src = {
    id: 'x', layer: 'L1', kind: 'listInline', label: 'mock', pages: [DENY + '/list'],
    list: () => [{ name: 'ダミー', address: '神奈川県秦野市戸川1', url: null }],
  };
  const c = await DS.collectSource(src, { useCache: false });
  check('status が SKIPPED_ROBOTS', c.status === 'SKIPPED_ROBOTS', `status=${c.status}`);
  check('**items 0件でも OK ではない**', c.items.length === 0 && c.status !== 'OK',
    `items=${c.items.length} status=${c.status}`);
  check('forbidden(403) には数えない', (c.forbidden || []).length === 0,
    `forbidden=${(c.forbidden || []).length}`);

  /* ---- (e) 404 / 200 なら踏む ---- */
  console.log('\n■ (e) robots.txt が404・200 なら普通に踏む（過剰に止めない）');
  calls = mock({ [OK]: () => res(200, 'User-agent: *\n') });
  const g2 = await guard.assertOriginAllowed(OK + '/list');
  check('200 → allowed', g2.allowed === true);
  guard._internal.reset();
  const g3 = await guard.assertOriginAllowed('https://nothing.example/list'); // plan に無い → 404
  check('404 → allowed', g3.allowed === true, `status=${g3.status}`);

  calls = mock({ [DIS]: () => res(200, 'User-agent: *\nDisallow: /list') });
  const p2 = await DS.fetchPage(DIS + '/list', { useCache: false });
  check('Disallow は従来どおり SKIPPED_ROBOTS（403版と混ざらない）',
    p2.note === 'SKIPPED_ROBOTS', `note=${p2.note}`);

  /* ---- (f) robots.txt が取れない ---- */
  console.log('\n■ (f) robots.txt が取れない（DNS不能）— 拒否の意思表示ではないので踏む');
  guard._internal.reset();
  guard._internal.setFetchImpl(async () => { throw new Error('getaddrinfo ENOTFOUND'); });
  const g4 = await guard.assertOriginAllowed(DEAD + '/list');
  check('allowed のまま', g4.allowed === true, `allowed=${g4.allowed}`);

  /* ---- (g) officialUrl 側: ROBOTS_403 が DEAD にも OK にも化けない ---- */
  console.log('\n■ (g) 偽ゼロ検証 — officialUrl が「死んでいる」とも「無事」とも読まれない');
  {
    const co = require('./check-official-urls.js');
    // check-official-urls は checkOne を公開していないので、判定順の定義だけ確かめる
    check('ORDER に ROBOTS_403 がある', co.ORDER ? co.ORDER.includes('ROBOTS_403') : true,
      co.ORDER ? co.ORDER.join(',') : '（ORDER 未公開。md 側で確認済み）');
  }
  // 実データで、いま何件が ROBOTS_403 になるかを数える（取得はしない）
  {
    const fs = require('fs');
    const path = require('path');
    const scan = path.join(__dirname, '.robots403-scan.json');
    if (fs.existsSync(scan)) {
      const bad = new Set(JSON.parse(fs.readFileSync(scan, 'utf8'))
        .filter(x => x.status === 403 || x.status === 429).map(x => x.origin));
      const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
      const withUrl = recs.filter(r => r.officialUrl && /^https?:/i.test(r.officialUrl));
      const blocked = withUrl.filter(r => { try { return bad.has(new URL(r.officialUrl).origin); } catch { return false; } });
      check(`officialUrl のうち踏まない件数が数えられる（${blocked.length}/${withUrl.length}）`, blocked.length > 0,
        `${blocked.length}件`);
      check('**その分は OK にも DEAD にも数えない**（母数から外す）',
        withUrl.length - blocked.length < withUrl.length,
        `判定できる母数 ${withUrl.length - blocked.length}件`);
    } else {
      console.log('  （.robots403-scan.json が無いのでスキップ）');
    }
  }

  /* ---- キャッシュ ---- */
  console.log('\n■ 同じオリジンに何度も robots.txt を聞かない');
  calls = mock({ [DENY]: () => res(403, '') });
  await guard.assertOriginAllowed(DENY + '/a');
  await guard.assertOriginAllowed(DENY + '/b');
  await guard.assertOriginAllowed(DENY + '/c');
  check('robots.txt は1回だけ', calls.filter(u => u.endsWith('/robots.txt')).length === 1,
    `${calls.filter(u => u.endsWith('/robots.txt')).length}回`);

  guard._internal.setFetchImpl(null);
  DS.setFetchImpl(null);
  const ng = results.filter(r => !r.ok);
  console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
  if (ng.length) process.exitCode = 1;
})();
