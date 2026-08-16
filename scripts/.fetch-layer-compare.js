/**
 * **取得層の差を測る。**
 *
 * `motosulakeside.com` は `district-sweep` の `fetchPage` 経由だと 200 で取れるのに、
 * `.parked-scan.js` の素の `fetch` では 403 だった。**UA は両方 ClaudeBot。**
 *
 * 403 は「測っていない」として扱う設計にした（FORBIDDEN）。
 * つまり**取得層のせいで403に見えていた分は、本当は測れていた**ことになる。
 * どれだけあるかを数える。
 *
 * 素の fetch と `fetchPage` の違い（district-sweep.js）:
 *   - `Accept-Language: ja,en;q=0.8` を送る
 *   - `redirect: 'follow'`（素の側も同じ）
 *   - robots.txt を見る（Disallow なら SKIPPED_ROBOTS）
 *   - オリジンごとに1秒以上あける（robots の Crawl-delay があればそちら）
 *   - 429 を最大3回まで再試行する
 *   - ディスクキャッシュを持つ ← **これが効いている可能性がある。--no-cache で切り分ける**
 *
 *   node scripts/.fetch-layer-compare.js            # キャッシュあり
 *   node scripts/.fetch-layer-compare.js --no-cache # キャッシュを使わない（純粋な取得層の差）
 */
const fs = require('fs');
const path = require('path');
const { _internal: I } = require('./district-sweep.js');

const USE_CACHE = !process.argv.includes('--no-cache');
const UA = 'ClaudeBot';
const TIMEOUT_MS = 12000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** `.parked-scan.js` と同じ素の fetch */
async function rawFetch(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8' },
      redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: res.status, ok: res.ok, note: res.ok ? '' : (res.status === 403 ? 'FORBIDDEN' : res.status === 429 ? 'RATE_LIMITED' : 'HTTP_' + res.status) };
  } catch (e) {
    return { status: 0, ok: false, note: 'UNREACHABLE: ' + String(e.cause?.code || e.name).slice(0, 30) };
  }
}

function classify(r) {
  if (r.ok) return 'OK';
  if (/^FORBIDDEN/.test(r.note)) return 'FORBIDDEN';
  if (/^RATE_LIMITED/.test(r.note)) return 'RATE_LIMITED';
  if (/^SKIPPED_ROBOTS/.test(r.note)) return 'SKIPPED_ROBOTS';
  if (/^UNREACHABLE/.test(r.note)) return 'UNREACHABLE';
  return r.note || ('HTTP_' + r.status);
}

(async () => {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
  const recs = raw.filter(r => r.officialUrl && /^https?:/i.test(r.officialUrl));
  console.log(`officialUrl ${recs.length}件を、素の fetch と fetchPage の両方で叩く`);
  console.log(`UA は両方 ${UA} / fetchPage のキャッシュ: ${USE_CACHE ? 'あり' : '**なし**'}\n`);

  const rows = [];
  for (const r of recs) {
    const a = await rawFetch(r.officialUrl);
    await sleep(300);
    const b = await I.fetchPage(r.officialUrl, { useCache: USE_CACHE });
    const ca = classify(a);
    const cb = classify({ ok: b.ok, note: b.note, status: b.status });
    rows.push({ id: r.id, url: r.officialUrl, raw: ca, page: cb, rawStatus: a.status, pageStatus: b.status, fromCache: !!b.fromCache });
    if (ca !== cb) {
      console.log(`  ★ ${r.id.padEnd(26)} 素=${ca.padEnd(13)} fetchPage=${cb.padEnd(13)}${b.fromCache ? ' (cache)' : ''}`);
    }
    await sleep(400);
  }

  fs.writeFileSync(path.join(__dirname, '.fetch-layer-compare.json'), JSON.stringify(rows, null, 1));

  const n = f => rows.filter(f).length;
  const tally = k => rows.reduce((m, r) => (m[r[k]] = (m[r[k]] || 0) + 1, m), {});
  console.log('\n===== 集計 =====');
  console.log('素の fetch  :', JSON.stringify(tally('raw')));
  console.log('fetchPage   :', JSON.stringify(tally('page')));
  console.log('\n判定が違う  :', n(r => r.raw !== r.page), '件');
  console.log('  素403 → fetchPage OK :', n(r => r.raw === 'FORBIDDEN' && r.page === 'OK'), '件  ← **取得層のせいで403に見えていた**');
  console.log('  素OK  → fetchPage 403:', n(r => r.raw === 'OK' && r.page === 'FORBIDDEN'), '件');
  console.log('  その他の相違          :', n(r => r.raw !== r.page && !(r.raw === 'FORBIDDEN' && r.page === 'OK') && !(r.raw === 'OK' && r.page === 'FORBIDDEN')), '件');
  console.log('\n  うち fetchPage がキャッシュ由来:', n(r => r.raw !== r.page && r.fromCache), '件');
  console.log('    （キャッシュ由来なら「取得層の差」ではなく「過去に取れていた」）');
})();
