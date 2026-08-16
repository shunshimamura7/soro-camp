/**
 * robots.txt を 403 で返すオリジンを洗い出す。
 *
 * **robots.txt 自体を拒否しているのは、明示的な「見せない」の意思表示。**
 * Chrome を名乗れば取れるとしても踏まない、という方針の対象を数えるため。
 *
 * **UA は ClaudeBot。**こちらの正体で聞いて断られたかどうかを見るのが趣旨なので、
 * ここで Chrome を名乗ると測定の意味が消える。
 */
const fs = require('fs');
const path = require('path');

const UA = 'ClaudeBot';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 調べる対象のオリジンを、データと登録ソースの両方から集める */
function collectOrigins() {
  const out = new Set();
  const add = u => { try { out.add(new URL(u).origin); } catch { } };

  const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
  for (const r of recs) {
    if (r.officialUrl) add(r.officialUrl);
    if (r.reservationUrl) add(r.reservationUrl);
  }

  const { MUNI_SOURCES, PREF_SOURCES } = require('./district-sweep.js');
  const walk = src => (src.pages || []).forEach(add);
  for (const e of Object.values(MUNI_SOURCES)) {
    e.sources.forEach(walk);
    (e.l1NotFound || []).forEach(nf => (nf.checked || []).forEach(add));
  }
  for (const list of Object.values(PREF_SOURCES)) list.forEach(walk);

  try {
    const { MUNI_SOURCES_CHIBA } = require('./chiba-sources.js');
    for (const e of Object.values(MUNI_SOURCES_CHIBA)) {
      e.sources.forEach(walk);
      (e.l1NotFound || []).forEach(nf => (nf.checked || []).forEach(add));
    }
  } catch { /* 千葉が無くても続ける */ }

  return [...out].sort();
}

(async () => {
  const origins = collectOrigins();
  console.log(`オリジン ${origins.length}件を UA=${UA} で robots.txt に当たる\n`);
  const rows = [];
  for (const o of origins) {
    let status = 0, note = '';
    try {
      const r = await fetch(o + '/robots.txt', {
        headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(12000),
      });
      status = r.status;
    } catch (e) { note = String(e.cause?.code || e.name).slice(0, 30); }
    rows.push({ origin: o, status, note });
    if (status === 403 || status === 429) console.log(`  ★ ${String(status)} ${o}`);
    await sleep(700);
  }
  fs.writeFileSync(path.join(__dirname, '.robots403-scan.json'), JSON.stringify(rows, null, 1));

  const t = rows.reduce((m, r) => (m[r.status || r.note || '?'] = (m[r.status || r.note || '?'] || 0) + 1, m), {});
  console.log('\n===== 集計 =====');
  console.log(JSON.stringify(t, null, 1));
  const bad = rows.filter(r => r.status === 403 || r.status === 429);
  console.log(`\n**robots.txt を 403/429 で断っているオリジン: ${bad.length}件**`);
  bad.forEach(r => console.log('  - ' + r.origin + '  (' + r.status + ')'));
})();
