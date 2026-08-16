/**
 * 全市町村を回す前の見積もり。**ネットワークには一切触らない。**
 *
 * `fetchPage` は成功したものしかキャッシュしない（district-sweep.js:222）。
 * よって「一覧に出てくる詳細URL のうち、キャッシュに無いもの」＝
 * **前回の実行で失敗し、次回も必ず取りに行って失敗する URL**。それを数える。
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES } = require('./district-sweep.js');

const CACHE = path.join(__dirname, '.sweep-cache');
const key = u => Buffer.from(u).toString('base64url').slice(0, 120);
const cachedBody = u => {
  const p = path.join(CACHE, key(u) + '.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
};
const isCached = u => fs.existsSync(path.join(CACHE, key(u) + '.json'));
const DEFAULT_DETAIL_LIMIT = 45;

// 地区 md から、市町村ごとの地区数を数える（--all は地区単位で回る）
const districtCount = new Map();
for (const f of fs.readdirSync(__dirname)) {
  const m = f.match(/^sweep-(.+)\.md$/);
  if (!m) continue;
  const name = m[1];
  if (/^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)-?/.test(name)) continue;
  for (const muni of Object.keys(MUNI_SOURCES)) {
    if (name.includes(muni.replace(/市$/, '市')) || name.startsWith(muni)) {
      districtCount.set(muni, (districtCount.get(muni) || 0) + 1);
      break;
    }
  }
}

const rows = [];
let totalFail = 0, totalOkCached = 0, totalListMissing = 0;
const failByOrigin = new Map();

for (const [muni, entry] of Object.entries(MUNI_SOURCES)) {
  for (const src of entry.sources) {
    if (src.kind !== 'listDetail') continue;
    const items = [];
    let listMissing = 0;
    for (const pageUrl of src.pages) {
      const c = cachedBody(pageUrl);
      if (!c || !c.body) { listMissing++; continue; }
      let got = [];
      try { got = src.list(c.body) || []; } catch (e) { got = []; }
      for (const it of got) if (it.name || it.url) items.push({ ...it, url: it.url || pageUrl });
    }
    // collectSource と同じ重複除去
    const seen = new Map();
    for (const it of items) {
      const k = it.url && it.url.includes('/spt_') ? it.url : (it.url || '') + '|' + (it.name || '');
      if (!seen.has(k)) seen.set(k, it);
      else if (!seen.get(k).address && it.address) seen.get(k).address = it.address;
    }
    let targets = [...seen.values()].filter(it => !it.address && it.url);
    const limit = src.detailLimit || DEFAULT_DETAIL_LIMIT;
    const capped = targets.length > limit ? targets.length - limit : 0;
    targets = targets.slice(0, limit);

    const fail = targets.filter(t => !isCached(t.url));
    const ok = targets.length - fail.length;
    totalFail += fail.length; totalOkCached += ok; totalListMissing += listMissing;
    for (const f of fail) {
      const o = new URL(f.url).origin;
      failByOrigin.set(o, (failByOrigin.get(o) || 0) + 1);
    }
    rows.push({ muni, src: src.id, label: src.label, targets: targets.length, ok, fail: fail.length, capped, listMissing,
      names: fail.map(f => f.name) });
  }
}

console.log('=== listDetail ソースごとの詳細ページ（キャッシュから推定・ネットワーク未使用） ===');
console.log('市町村 / ソース / 詳細対象 / キャッシュ有(=成功) / **キャッシュ無(=毎回失敗)** / 打切り / 一覧未取得');
for (const r of rows.sort((a, b) => b.fail - a.fail)) {
  console.log(`  ${r.muni.padEnd(8)} ${r.src.padEnd(24)} 対象${String(r.targets).padStart(3)}  成功${String(r.ok).padStart(3)}  失敗${String(r.fail).padStart(3)}  打切${r.capped}  一覧未取得${r.listMissing}`);
  if (r.fail) console.log(`      失敗する見込み: ${r.names.join(' / ')}`);
}

console.log(`\n詳細ページの対象合計: ${totalOkCached + totalFail}`);
console.log(`  うちキャッシュ有（=ネットワーク不要）: ${totalOkCached}`);
console.log(`  うちキャッシュ無（=毎回取りに行って毎回失敗）: ${totalFail}`);
console.log(`  一覧ページ自体がキャッシュに無いソース: ${totalListMissing}`);

console.log('\n=== 失敗リクエストのオリジン別（Crawl-delay の効き方が変わる） ===');
for (const [o, n] of [...failByOrigin].sort((a, b) => b[1] - a[1])) console.log(`  ${o.padEnd(40)} ${n}件`);

console.log('\n=== 実行単位ごとのコスト ===');
const munis = Object.keys(MUNI_SOURCES).length;
let districtTotal = 0;
for (const [muni] of Object.entries(MUNI_SOURCES)) districtTotal += (districtCount.get(muni) || 1);
const failPerMuni = new Map();
for (const r of rows) failPerMuni.set(r.muni, (failPerMuni.get(r.muni) || 0) + r.fail);
let districtWeighted = 0;
for (const [muni, n] of failPerMuni) districtWeighted += n * (districtCount.get(muni) || 1);
console.log(`  A. 市町村単位で1回ずつ（${munis}回）      … 失敗リクエスト ${totalFail} 回`);
console.log(`  B. 既存の地区単位で全部（${districtTotal}回） … 失敗リクエスト ${districtWeighted} 回`);
console.log('\n  市町村別の地区数と失敗回数（B の内訳）:');
for (const [muni, n] of [...failPerMuni].filter(x => x[1]).sort((a, b) => b[1] * (districtCount.get(b[0]) || 1) - a[1] * (districtCount.get(a[0]) || 1))) {
  console.log(`    ${muni.padEnd(8)} 地区${String(districtCount.get(muni) || 1).padStart(2)} × 失敗${String(n).padStart(2)} = ${(districtCount.get(muni) || 1) * n}`);
}
