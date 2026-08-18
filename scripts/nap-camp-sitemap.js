/**
 * なっぷの施設を **sitemap から列挙する。**一覧ページは使わない。
 *
 * ## なぜ作ったか — 一覧が先頭10件で止まっていた（2026-08-18 実測）
 *
 * `napCamp()`（`district-sweep.js`）は `/{pref}/{area}/list` と `?page=2` を叩いて
 * `aria-label` を拾っていた。**この2本が返すのは同じ10件で、page=2 は page=1 と完全に同一集合。**
 *
 * | 実測（2026-08-18） | |
 * |---|---|
 * | `yamanashi/otsuki_turushi/list` | 10件。ページ内の表示は「キャンプ場**72件**」 |
 * | 同 `?page=2` | 10件。**page1 と同一集合** |
 * | `chiba/list` | 10件。meta は「千葉のキャンプ場**346件**」 |
 *
 * **つまり なっぷ由来の MISSING は、全エリアで先頭10件しか見ていなかった。**
 * 既存3県（山梨・静岡・神奈川）の掲載漏れ検出も、ずっとこのぶん過小だった。
 *
 * ## 原因 — クロールできるページ2が存在しない
 *
 * 一覧は Next.js App Router の RSC ペイロード（`self.__next_f`）で配られていて、
 * **SSR されるのは先頭10件だけ。**ペイロードには
 * `"currentPageId":"1","currentCount":"10","totalCount":346,"totalPage":35` があり、
 * **サーバは「35ページある」と知っているのに、2ページ目を URL で出していない。**
 *
 * 試したが全部 page1 が返る（`currentPageId` は 1 のまま）:
 *
 *   ?page=2  /  ?pageId=2  /  ?currentPageId=2  /  /list/2
 *
 * **`sitemap-dynamic-search.xml`（57,050 URL）にもページ送りの URL は1本も無い。**
 * ページ送りはクライアント側だけの操作で、**クロール可能なページ2は存在しない。**
 * `/api/` `/ajax/` は robots.txt が Disallow なので**踏まない。**
 *
 * ## 直し方 — 一覧を捨てて sitemap から引く
 *
 * `https://www.nap-camp.com/sitemap.xml`
 *   → `sitemap-dynamic-campsite.xml`（41,104 URL）に**全施設の詳細ページ**が入っている。
 *
 * **1リクエストで全国5,872施設が列挙できる。**ページ送りの問題が消える。
 *
 * | 県 | sitemap の施設数 | 旧実装が見えていた数 |
 * |---|---:|---:|
 * | 千葉 | **342** | 10（エリアごと） |
 * | 山梨 | **291** | 10 |
 * | 静岡 | **282** | 10 |
 * | 神奈川 | **105** | 10 |
 *
 * ## 詳細ページに必要なものが全部ある（実測: `/chiba/11930`）
 *
 *   name        大原上布施オートキャンプ場
 *   address     千葉県いすみ市上布施593
 *   postalCode  298-0018
 *   latitude    35.2208988   ← **予約サイトの座標。候補であって採用値ではない**
 *   longitude   140.3536113
 *
 * **市町村の割り当てが初めて機械でできる。**一覧には `areaName`（「松戸・柏・野田」）しか無く、
 * 市町村に落とせなかった。
 *
 * ## ⚠ 代償 — 詳細ページは施設数ぶん叩く必要がある
 *
 * robots.txt は `Crawl-delay: 30`。**千葉342件で約2時間50分**、既存3県を足すと約8時間半。
 * **一覧のように1〜2リクエストでは済まない。**回すときは時間を見込むこと。
 *
 *   node scripts/nap-camp-sitemap.js --selftest
 *   node scripts/nap-camp-sitemap.js --pref=chiba --ids        # ID を列挙するだけ（1リクエスト）
 *   node scripts/nap-camp-sitemap.js --pref=chiba --harvest --limit=20 --out=...
 */
'use strict';

const fs = require('fs');
const { assertOriginAllowed } = require('./robots-guard.js');

const SITEMAP_INDEX = 'https://www.nap-camp.com/sitemap.xml';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
/** robots.txt の Crawl-delay。**詳細ページを叩くときは必ずこれを守る** */
const CRAWL_DELAY_MS = 30000;
const TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastFetch = 0;

async function get(url, { delay = 0 } = {}) {
  const wait = delay - (Date.now() - lastFetch);
  if (wait > 0) await sleep(wait);
  lastFetch = Date.now();
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return { ok: false, status: res.status, body: '' };
  return { ok: true, status: res.status, body: await res.text() };
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)/gi)].map((m) => m[1]);

/**
 * 県ごとの施設 ID を列挙する。**sitemap の1〜2リクエストで済む。**
 * 施設ページは `/{pref}/{id}` の形だけを取る（`/images` `/plans` 等の下位は捨てる）。
 */
async function listIds() {
  const idx = await get(SITEMAP_INDEX);
  if (!idx.ok) throw new Error(`sitemap index が取れない: HTTP ${idx.status}`);
  const child = locs(idx.body).find((u) => u.includes('campsite'));
  if (!child) throw new Error('campsite の sitemap が index に無い');
  const sm = await get(child);
  if (!sm.ok) throw new Error(`campsite sitemap が取れない: HTTP ${sm.status}`);

  const byPref = new Map();
  for (const u of locs(sm.body)) {
    const m = u.match(/^https:\/\/www\.nap-camp\.com\/([a-z_]+)\/(\d+)\/?$/);
    if (!m) continue;
    if (!byPref.has(m[1])) byPref.set(m[1], new Set());
    byPref.get(m[1]).add(m[2]);
  }
  return byPref;
}

/** 詳細ページから施設情報を取る。**RSC ペイロードのキーを直接読む** */
function parseDetail(html) {
  const pick = (key) => {
    for (const esc of ['\\\\"', '"']) {
      const re = new RegExp(esc + key + esc + '\\s*:\\s*' + esc + '?([^",\\\\]{2,80})');
      const m = html.match(re);
      if (m) return m[1].trim();
    }
    return null;
  };
  const title = (html.match(/<title>(.*?)<\/title>/s) || [])[1] || '';
  return {
    name: (title.split('の口コミ')[0] || '').trim() || pick('name'),
    address: pick('address'),
    postalCode: pick('postalCode'),
    // **予約サイトの座標。候補であって採用値ではない。**採るなら国土地理院で検証してから
    latCandidate: pick('latitude'),
    lngCandidate: pick('longitude'),
  };
}

/* ── SELF_TEST ────────────────────────────────────────────────────
 * **焼き込むのは外の事実だけ。**「10件で止まらないこと」を見る。
 * **件数そのものは焼き込まない**（施設は増減する）。 */
async function selfTest() {
  console.log('SELF_TEST: なっぷの列挙が先頭10件で止まらないこと\n');
  const guard = await assertOriginAllowed('https://www.nap-camp.com/');
  if (!guard.allowed) { console.error(`❌ robots で踏めない（${guard.note}）`); process.exit(1); }

  const byPref = await listIds();
  const fails = [];
  // 旧実装が返していた上限。**ここを超えることが直った証拠**
  const OLD_CAP = 10;
  for (const pref of ['chiba', 'yamanashi', 'shizuoka', 'kanagawa']) {
    const n = (byPref.get(pref) || new Set()).size;
    if (n <= OLD_CAP) fails.push(`${pref} が ${n}件 — 旧実装の上限 ${OLD_CAP} を超えていない`);
    else console.log(`  ✅ ${pref}: ${n}件（> ${OLD_CAP}）`);
  }
  // 県が1つしか出ないなら、URL の形が変わって取りこぼしている
  if (byPref.size < 40) fails.push(`都道府県が ${byPref.size} しか出ない（47前後のはず）`);
  else console.log(`  ✅ 都道府県 ${byPref.size} 件ぶん列挙`);

  if (fails.length) {
    console.error('\n❌ SELF_TEST 失敗');
    for (const f of fails) console.error('   - ' + f);
    process.exit(1);
  }
  console.log('\n✅ SELF_TEST 成功');
}

async function main() {
  const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1];
  if (process.argv.includes('--selftest')) return selfTest();

  const pref = arg('pref');
  const byPref = await listIds();
  if (!pref) {
    for (const [p, s] of [...byPref].sort((a, b) => b[1].size - a[1].size)) console.log(`${p}\t${s.size}`);
    return;
  }
  const ids = [...(byPref.get(pref) || new Set())];
  console.log(`${pref}: ${ids.length}件`);
  if (process.argv.includes('--ids')) { console.log(ids.join('\n')); return; }
  if (!process.argv.includes('--harvest')) return;

  const limit = Number(arg('limit') || ids.length);
  const out = [];
  console.error(`詳細を取得: ${Math.min(limit, ids.length)}件 × ${CRAWL_DELAY_MS / 1000}秒 = 約${Math.round(Math.min(limit, ids.length) * CRAWL_DELAY_MS / 60000)}分`);
  for (const id of ids.slice(0, limit)) {
    const r = await get(`https://www.nap-camp.com/${pref}/${id}`, { delay: CRAWL_DELAY_MS });
    const d = r.ok ? parseDetail(r.body) : { name: null, address: null };
    out.push({ id, status: r.status, ...d });
    console.error(`  ${id} ${r.status} ${d.name || ''} / ${d.address || '住所なし'}`);
    const dest = arg('out');
    if (dest) fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
  }
}

module.exports = { listIds, parseDetail, CRAWL_DELAY_MS };
if (require.main === module) main().catch((e) => { console.error('致命的エラー:', e.message); process.exit(1); });
