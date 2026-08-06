/**
 * Overpass API で座標を自動照合し、手動確認の対象を減らすためのスクリプト。
 *
 * 対象: data/campgrounds.json のうち coordsVerified !== true のもの
 *
 * ■ クエリのバッチ化
 *   1件1リクエスト（74回）ではなく、県ごとに1回だけ
 *   「県内の camp_site を全件取得」して scripts/osm-campsites-cache.json に保存する。
 *   照合はキャッシュに対してオフラインで行うのでリクエストは3回で済む。
 *   キャッシュがあれば再取得しない（--refresh 指定時のみ取り直す）。
 *
 * ■ notFound と fetchFailed は混ぜない
 *   notFound    = OSM に照合できる候補が本当になかったもの
 *   fetchFailed = Overpass から取得できず照合自体ができなかったもの
 *   後者は node scripts/auto-coords.js --retry-failed で取り直せる。
 *
 * campgrounds.json は一切変更しない。採用は目視レビュー後に
 * review-auto-coords.js → apply-coords.js で行う。
 *
 * 使い方:
 *   node scripts/auto-coords.js                 通常実行（キャッシュがあれば使う）
 *   node scripts/auto-coords.js --refresh       OSM キャッシュを取り直す
 *   node scripts/auto-coords.js --retry-failed  fetchFailed のものだけ再照合してマージ
 */
const fs = require('fs');
const path = require('path');

const { normalizeName, namesMatch } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH   = path.join(__dirname, '../data/campgrounds.json');
const RESULT_PATH = path.join(__dirname, 'auto-coords-result.json');
const OSM_CACHE   = path.join(__dirname, 'osm-campsites-cache.json');

// 429/504 が単一サーバに集中しないよう順に回す。
// 応答しないサーバは連続失敗で「死亡」扱いにし、以降スキップする
// （このネットワークからは kumi.systems / private.coffee が到達不能なため、
//   毎回タイムアウトを待つと1ラウンドで2分無駄になる）。
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const UA = 'soro-camp-coord-check/1.0 (personal campsite site; contact via github)';
const FETCH_TIMEOUT_MS = 180000;      // 県全体クエリは重い
const PROBE_TIMEOUT_MS = 25000;       // 死亡判定用の短いタイムアウト
const BACKOFF_SEC = [3, 9, 27];       // 全エンドポイント全滅時の指数バックオフ
const MAX_ROUNDS = BACKOFF_SEC.length + 1;
const DEAD_AFTER = 2;                 // 連続ネットワーク失敗でスキップ対象に

const RADIUS_KM   = 5;   // 現在座標まわりの候補探索半径
const AUTO_MAX_KM = 10;  // auto に分類する現在座標からのズレの上限

const PREF_FULL = { '神奈川': '神奈川県', '静岡': '静岡県', '山梨': '山梨県' };

const argv = process.argv.slice(2);
const REFRESH      = argv.includes('--refresh');
const RETRY_FAILED = argv.includes('--retry-failed');

// ── 統計 ────────────────────────────────────────────────────────────────────
const stats = {
  requests: 0, success: 0,
  http429: 0, http504: 0, otherHttp: 0,
  timeouts: 0, networkErrors: 0,
  exhausted: 0,            // 全ラウンド全滅（＝そのクエリを諦めた回数）
  cacheHits: 0,            // ネットワークを使わずキャッシュで済んだ県の数
  byEndpoint: {},
};
for (const ep of ENDPOINTS) {
  stats.byEndpoint[new URL(ep).host] = { tried: 0, ok: 0, http429: 0, http504: 0, otherHttp: 0, timeout: 0, networkError: 0 };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Overpass（エンドポイントローテーション） ────────────────────────────────
const consecutiveNetFail = {};
const dead = new Set();

function parseElements(json) {
  const elements = Array.isArray(json.elements) ? json.elements : [];
  return elements
    .map(el => {
      const lat = el.lat != null ? el.lat : el.center && el.center.lat;
      const lng = el.lon != null ? el.lon : el.center && el.center.lon;
      const tags = el.tags || {};
      const name = tags.name || tags['name:ja'] || '';
      if (lat == null || lng == null || !name) return null;
      return { osmId: el.type + '/' + el.id, osmName: name, lat, lng };
    })
    .filter(Boolean);
}

/**
 * 429/504 なら次のエンドポイントへ。全滅したら指数バックオフして次ラウンド。
 * 成功で配列、全ラウンド全滅で null。
 */
async function overpassRotate(query, label) {
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    for (const ep of ENDPOINTS) {
      if (dead.has(ep)) continue;
      const host = new URL(ep).host;
      const es = stats.byEndpoint[host];
      const timeoutMs = consecutiveNetFail[ep] ? PROBE_TIMEOUT_MS : FETCH_TIMEOUT_MS;

      stats.requests++; es.tried++;
      const t0 = Date.now();
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (res.status === 429) {
          stats.http429++; es.http429++;
          console.log(`    ! ${host} 429（混雑）→ 次のサーバへ`);
          continue;
        }
        if (res.status === 504 || res.status === 503) {
          stats.http504++; es.http504++;
          console.log(`    ! ${host} ${res.status}（過負荷）→ 次のサーバへ`);
          continue;
        }
        if (!res.ok) {
          stats.otherHttp++; es.otherHttp++;
          console.log(`    ! ${host} HTTP ${res.status} → 次のサーバへ`);
          continue;
        }

        const json = await res.json();
        const out = parseElements(json);
        stats.success++; es.ok++;
        consecutiveNetFail[ep] = 0;
        console.log(`    ✓ ${host} から ${out.length}件 取得（${((Date.now() - t0) / 1000).toFixed(1)}秒）`);
        return out;
      } catch (e) {
        const isTimeout = /abort|timeout/i.test(e.message);
        if (isTimeout) { stats.timeouts++; es.timeout++; }
        else { stats.networkErrors++; es.networkError++; }
        consecutiveNetFail[ep] = (consecutiveNetFail[ep] || 0) + 1;
        console.log(`    ! ${host} ${isTimeout ? 'タイムアウト' : 'ネットワークエラー'}: ${e.message} → 次のサーバへ`);
        if (consecutiveNetFail[ep] >= DEAD_AFTER) {
          dead.add(ep);
          console.log(`    → ${host} は到達不能と判断し、以降スキップします`);
        }
      }
    }

    if (round <= BACKOFF_SEC.length) {
      const wait = BACKOFF_SEC[round - 1];
      console.log(`    全サーバ失敗（${label}）。${wait}秒待って再試行（ラウンド ${round + 1}/${MAX_ROUNDS}）`);
      await sleep(wait * 1000);
    }
  }
  stats.exhausted++;
  return null;
}

// ── OSM キャッシュ ──────────────────────────────────────────────────────────
function prefectureQuery(prefFull) {
  return `[out:json][timeout:180];
area["name"="${prefFull}"]["admin_level"="4"]->.a;
(
  nwr["tourism"="camp_site"](area.a);
  nwr["leisure"="camp_site"](area.a);
);
out center tags;`;
}

function loadOsmCache() {
  if (!fs.existsSync(OSM_CACHE)) return { generatedAt: null, prefectures: {} };
  try {
    const c = JSON.parse(fs.readFileSync(OSM_CACHE, 'utf-8'));
    if (c && c.prefectures) return c;
  } catch {}
  return { generatedAt: null, prefectures: {} };
}

/** 必要な県の camp_site 一覧を揃える。取得できなかった県は failed に入れて返す。 */
async function ensureOsmCache(neededPrefs) {
  const cache = REFRESH ? { generatedAt: null, prefectures: {} } : loadOsmCache();
  const failed = new Set();

  for (const pref of neededPrefs) {
    const prefFull = PREF_FULL[pref];
    if (!prefFull) { failed.add(pref); continue; }

    if (cache.prefectures[prefFull] && !REFRESH) {
      stats.cacheHits++;
      console.log(`${prefFull}: キャッシュ使用（${cache.prefectures[prefFull].length}件）`);
      continue;
    }

    console.log(`${prefFull}: Overpass から取得中…`);
    const list = await overpassRotate(prefectureQuery(prefFull), prefFull);
    if (!list) {
      console.log(`${prefFull}: 取得失敗`);
      failed.add(pref);
      continue;
    }
    cache.prefectures[prefFull] = list;
    cache.generatedAt = new Date().toISOString();
    fs.writeFileSync(OSM_CACHE, JSON.stringify(cache, null, 2));
  }

  return { cache, failed };
}

// ── 照合 ────────────────────────────────────────────────────────────────────
function classify(camp, cache) {
  const hasCoords = camp.lat !== 0 && camp.lng !== 0;

  // 県境をまたぐ施設もあるため、座標があるときは3県すべてを対象に半径で絞る。
  // 座標がないときは所属県の一覧から名前で探す。
  let pool;
  if (hasCoords) {
    pool = Object.values(cache.prefectures).flat()
      .filter(o => haversineKm(camp.lat, camp.lng, o.lat, o.lng) <= RADIUS_KM);
  } else {
    pool = cache.prefectures[PREF_FULL[camp.prefecture]] || [];
  }

  const target = normalizeName(camp.name);
  const matched = pool
    .filter(o => namesMatch(target, normalizeName(o.osmName)))
    .map(o => ({
      osmId: o.osmId,
      osmName: o.osmName,
      lat: o.lat,
      lng: o.lng,
      distanceKm: hasCoords ? Number(haversineKm(camp.lat, camp.lng, o.lat, o.lng).toFixed(3)) : null,
    }));

  const seen = new Set();
  const candidates = matched.filter(x => {
    const k = x.osmName + '@' + x.lat.toFixed(4) + ',' + x.lng.toFixed(4);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (candidates.length === 0) return { kind: 'notFound' };
  if (candidates.length === 1) {
    const m = candidates[0];
    if (!hasCoords || m.distanceKm <= AUTO_MAX_KM) return { kind: 'auto', match: m };
  }
  return { kind: 'ambiguous', candidates };
}

// ── メイン ──────────────────────────────────────────────────────────────────
async function main() {
  const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  let targets = camps.filter(c => c.coordsVerified !== true);

  let previous = null;
  if (RETRY_FAILED) {
    if (!fs.existsSync(RESULT_PATH)) {
      console.error('エラー: --retry-failed には scripts/auto-coords-result.json が必要です。');
      process.exit(1);
    }
    previous = JSON.parse(fs.readFileSync(RESULT_PATH, 'utf-8'));
    const failedSlugs = new Set((previous.fetchFailed || []).map(f => (typeof f === 'string' ? f : f.slug)));
    targets = targets.filter(c => failedSlugs.has(c.slug));
    console.log(`--retry-failed: 前回 fetchFailed の ${targets.length}件だけを再照合します\n`);
    if (targets.length === 0) {
      console.log('再照合すべきものはありません。');
      return;
    }
  }

  const withCoords = targets.filter(c => c.lat !== 0 && c.lng !== 0).length;
  console.log(`対象 ${targets.length}件（座標あり ${withCoords} / 座標0 ${targets.length - withCoords}）`);
  console.log(`エンドポイント: ${ENDPOINTS.length}個をローテーション、バックオフ ${BACKOFF_SEC.join('→')}秒\n`);

  // ── 県ごとに1回だけ取得 ──
  const neededPrefs = [...new Set(targets.map(c => c.prefecture))];
  const { cache, failed } = await ensureOsmCache(neededPrefs);
  const total = Object.values(cache.prefectures).reduce((n, l) => n + l.length, 0);
  console.log(`\nOSM camp_site: 合計 ${total}件をローカルに保持（リクエスト ${stats.requests}回）\n`);

  // ── 照合はオフライン ──
  const result = {
    generatedAt: new Date().toISOString(),
    auto: [], ambiguous: [], notFound: [], fetchFailed: [],
  };

  targets.forEach((c, i) => {
    console.log(`${i + 1}/${targets.length} 処理中: ${c.name}`);

    if (failed.has(c.prefecture)) {
      console.log('    → fetchFailed（県の一覧を取得できず照合不能。--retry-failed で再実行可）');
      result.fetchFailed.push({ slug: c.slug, name: c.name, prefecture: c.prefecture });
      return;
    }

    const r = classify(c, cache);
    if (r.kind === 'auto') {
      const m = r.match;
      console.log(`    → auto: ${m.osmName}${m.distanceKm != null ? ` (${m.distanceKm}km)` : ' (座標未設定・県内一致)'}`);
      result.auto.push({
        slug: c.slug, name: c.name,
        prefecture: c.prefecture, area: c.area,
        lat: m.lat, lng: m.lng,
        osmName: m.osmName, osmId: m.osmId,
        distanceKm: m.distanceKm,
        currentLat: c.lat, currentLng: c.lng,
      });
    } else if (r.kind === 'ambiguous') {
      console.log(`    → ambiguous: 候補${r.candidates.length}件`);
      result.ambiguous.push({
        slug: c.slug, name: c.name,
        prefecture: c.prefecture, area: c.area,
        currentLat: c.lat, currentLng: c.lng,
        candidates: r.candidates,
      });
    } else {
      console.log('    → notFound: OSM に一致する camp_site なし');
      result.notFound.push({ slug: c.slug, name: c.name });
    }
  });

  // --retry-failed のときは前回結果にマージする
  if (RETRY_FAILED && previous) {
    const redone = new Set(targets.map(c => c.slug));
    const keep = arr => (arr || []).filter(x => !redone.has(typeof x === 'string' ? x : x.slug));
    result.auto      = [...keep(previous.auto), ...result.auto];
    result.ambiguous = [...keep(previous.ambiguous), ...result.ambiguous];
    result.notFound  = [...keep(previous.notFound), ...result.notFound];
    // fetchFailed は今回も失敗したものだけが残る
  }

  result.requestStats = stats;
  fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2));

  // ── 集計 ──
  console.log('\n── リクエスト統計 ─────────────────────────');
  console.log(`総リクエスト数: ${stats.requests}`);
  console.log(`  成功:            ${stats.success}`);
  console.log(`  429 (混雑):      ${stats.http429}`);
  console.log(`  504/503 (過負荷): ${stats.http504}`);
  console.log(`  その他HTTPエラー: ${stats.otherHttp}`);
  console.log(`  タイムアウト:     ${stats.timeouts}`);
  console.log(`  ネットワーク不通: ${stats.networkErrors}`);
  console.log(`全ラウンド全滅（諦めたクエリ）: ${stats.exhausted}`);
  console.log(`キャッシュで済んだ県: ${stats.cacheHits}`);
  console.log('エンドポイント別:');
  for (const [host, s] of Object.entries(stats.byEndpoint)) {
    if (!s.tried) { console.log(`  ${host}: 未使用`); continue; }
    console.log(`  ${host}: 試行${s.tried} 成功${s.ok} 429:${s.http429} 504:${s.http504} timeout:${s.timeout} netErr:${s.networkError}`);
  }

  console.log('\n── 照合結果 ───────────────────────────────');
  console.log(`auto:        ${result.auto.length}件`);
  console.log(`ambiguous:   ${result.ambiguous.length}件`);
  console.log(`notFound:    ${result.notFound.length}件（OSM に本当に候補がない）`);
  console.log(`fetchFailed: ${result.fetchFailed.length}件（取得できず照合不能・再実行可）`);

  if (result.auto.length) {
    console.log('\n── auto 一覧 ──────────────────────────────');
    result.auto.forEach((a, i) => {
      const d = a.distanceKm != null ? `${a.distanceKm}km` : '座標未設定';
      console.log(`${String(i + 1).padStart(2)}. ${a.slug}`);
      console.log(`    データ名: ${a.name}`);
      console.log(`    OSM名   : ${a.osmName}`);
      console.log(`    距離    : ${d}   → ${a.lat}, ${a.lng}`);
    });
  }

  console.log(`\n出力: ${path.relative(process.cwd(), RESULT_PATH)}`);
  console.log('※ campgrounds.json は変更していません。');
  if (result.fetchFailed.length) {
    console.log('※ node scripts/auto-coords.js --retry-failed で fetchFailed のみ再実行できます。');
  }
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1); });
