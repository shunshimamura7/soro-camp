/**
 * Overpass API で座標を自動照合し、手動確認の対象を減らすためのスクリプト。
 *
 * 対象: data/campgrounds.json のうち coordsVerified !== true のもの
 *
 *   - lat/lng が 0 でない → 現在座標から半径5km以内の camp_site を取得
 *   - lat/lng が 0        → 県全体の camp_site 一覧から名前で部分一致検索
 *     （県ごとに1回だけ問い合わせて使い回す。9件それぞれで県全体を引くと
 *       Overpass に同じ重いクエリを何度も投げることになるため）
 *
 * 名前の正規化・一致判定は audit-names.js と共通（scripts/name-match.js）。
 *
 * 判定は scripts/auto-coords-result.json に書き出すだけで、
 * campgrounds.json は一切変更しない。採用は目視レビュー後に
 * review-auto-coords.js → apply-coords.js で行う。
 *
 * 使い方: node scripts/auto-coords.js
 */
const fs = require('fs');
const path = require('path');

const { normalizeName, namesMatch } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH   = path.join(__dirname, '../data/campgrounds.json');
const RESULT_PATH = path.join(__dirname, 'auto-coords-result.json');
const CACHE_PATH  = path.join(__dirname, '.overpass-cache.json');

// ミラー（kumi.systems / private.coffee / osm.ch）も試したが、
// 前2つはこの回線から接続できず、osm.ch は日本のデータを持っていなかった。
// 実用になるのは本家だけなので、切り替えずに同じサーバへリトライする。
const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const UA = 'soro-camp-coord-check/1.0 (personal campsite site; contact via github)';

const FETCH_TIMEOUT_MS      = 90000;   // 半径5kmクエリ用
const FETCH_TIMEOUT_AREA_MS = 180000;  // 県全体クエリは重いので長め

const SLEEP_MS    = 1500;  // Overpass への礼儀。1リクエストごと
const MAX_RETRY   = 3;
const RADIUS_M    = 5000;  // 現在座標まわりの検索半径
const AUTO_MAX_KM = 10;    // auto に分類する現在座標からのズレの上限

const PREF_FULL = { '神奈川': '神奈川県', '静岡': '静岡県', '山梨': '山梨県' };

// ── ユーティリティ ───────────────────────────────────────────────────────────
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

// ── Overpass ────────────────────────────────────────────────────────────────
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')); } catch { cache = {}; }
}
function saveCache() {
  try { fs.writeFileSync(CACHE_PATH, JSON.stringify(cache)); } catch {}
}

/** Overpass に問い合わせて camp_site の候補配列を返す。失敗時は null。 */
async function overpass(query, cacheKey, timeoutMs = FETCH_TIMEOUT_MS) {
  if (cacheKey && cache[cacheKey]) return cache[cacheKey];

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      await sleep(SLEEP_MS);
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const elements = Array.isArray(json.elements) ? json.elements : [];
      const out = elements
        .map(el => {
          const lat = el.lat != null ? el.lat : el.center && el.center.lat;
          const lng = el.lon != null ? el.lon : el.center && el.center.lon;
          const tags = el.tags || {};
          const name = tags.name || tags['name:ja'] || '';
          if (lat == null || lng == null || !name) return null;
          return { osmId: el.type + '/' + el.id, osmName: name, lat, lng };
        })
        .filter(Boolean);
      if (cacheKey) { cache[cacheKey] = out; saveCache(); }
      return out;
    } catch (e) {
      const last = attempt === MAX_RETRY;
      const busy = /HTTP (429|503|504)/.test(e.message);
      const waitMs = busy ? 15000 * attempt : SLEEP_MS * attempt * 2;
      console.log(
        `    ! Overpass エラー (${attempt}/${MAX_RETRY}): ${e.message}` +
        (last ? ' — 諦めます' : ` — ${Math.round(waitMs / 1000)}秒待って再試行`)
      );
      if (last) return null;
      await sleep(waitMs);
    }
  }
  return null;
}

function radiusQuery(lat, lng) {
  return `[out:json][timeout:120];
(
  nwr["tourism"="camp_site"](around:${RADIUS_M},${lat},${lng});
  nwr["leisure"="camp_site"](around:${RADIUS_M},${lat},${lng});
);
out center tags;`;
}

function prefectureQuery(prefFull) {
  return `[out:json][timeout:180];
area["name"="${prefFull}"]["admin_level"="4"]->.a;
(
  nwr["tourism"="camp_site"](area.a);
  nwr["leisure"="camp_site"](area.a);
);
out center tags;`;
}

// ── メイン ──────────────────────────────────────────────────────────────────
async function main() {
  const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const targets = camps.filter(c => c.coordsVerified !== true);

  const withCoords = targets.filter(c => c.lat !== 0 && c.lng !== 0).length;
  console.log(`対象 ${targets.length}件（座標あり ${withCoords} / 座標0 ${targets.length - withCoords}）`);
  console.log(`Overpass: ${ENDPOINT}（1件ごとに ${SLEEP_MS}ms 待機）\n`);

  const prefCache = {};   // 県全体の一覧（座標0のもの用）
  // fetchFailed は notFound にも含める（候補なしと同じ扱い）が、
  // 「本当に候補がない」のか「Overpass から取れなかった」のかを区別できるよう
  // 別配列にも残す。再実行すれば取得済みはキャッシュから即返るので、
  // fetchFailed だけを取り直せる。
  const result = {
    generatedAt: new Date().toISOString(),
    auto: [], ambiguous: [], notFound: [], fetchFailed: [],
  };

  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    const hasCoords = c.lat !== 0 && c.lng !== 0;
    console.log(`${i + 1}/${targets.length} 処理中: ${c.name}`);

    let pool;
    if (hasCoords) {
      pool = await overpass(radiusQuery(c.lat, c.lng), 'r:' + c.slug);
    } else {
      const prefFull = PREF_FULL[c.prefecture];
      if (!prefFull) {
        console.log('    → 県名が不明。notFound 扱い');
        result.notFound.push({ slug: c.slug, name: c.name });
        continue;
      }
      if (!prefCache[prefFull]) {
        console.log(`    (${prefFull} 全体の camp_site を取得)`);
        prefCache[prefFull] = await overpass(prefectureQuery(prefFull), 'p:' + prefFull, FETCH_TIMEOUT_AREA_MS);
      }
      pool = prefCache[prefFull];
    }

    if (!pool) {                       // リトライしきって失敗
      console.log('    → 取得失敗。notFound 扱い（再実行で取り直せます）');
      result.notFound.push({ slug: c.slug, name: c.name });
      result.fetchFailed.push(c.slug);
      continue;
    }

    const target = normalizeName(c.name);
    const matched = pool
      .filter(o => namesMatch(target, normalizeName(o.osmName)))
      .map(o => ({
        osmId: o.osmId,
        osmName: o.osmName,
        lat: o.lat,
        lng: o.lng,
        distanceKm: hasCoords ? Number(haversineKm(c.lat, c.lng, o.lat, o.lng).toFixed(3)) : null,
      }));

    // 同一地点の重複（node と way の二重登録など）をまとめる
    const seen = new Set();
    const candidates = matched.filter(x => {
      const k = x.osmName + '@' + x.lat.toFixed(4) + ',' + x.lng.toFixed(4);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (candidates.length === 0) {
      console.log('    → 候補なし');
      result.notFound.push({ slug: c.slug, name: c.name });
    } else if (candidates.length === 1) {
      const m = candidates[0];
      // 座標0のものは距離を測れない。県内の名前一致を根拠に auto へ入れるが、
      // 採用は auto-review.html での目視確認が前提（自動反映はしない）。
      const withinRange = !hasCoords || m.distanceKm <= AUTO_MAX_KM;
      if (withinRange) {
        console.log(`    → auto: ${m.osmName}${hasCoords ? ` (${m.distanceKm}km)` : ' (座標未設定・県内一致)'}`);
        result.auto.push({
          slug: c.slug, name: c.name,
          prefecture: c.prefecture, area: c.area,
          lat: m.lat, lng: m.lng,
          osmName: m.osmName, osmId: m.osmId,
          distanceKm: m.distanceKm,
          currentLat: c.lat, currentLng: c.lng,
        });
      } else {
        console.log(`    → ambiguous: 1件だが ${m.distanceKm}km 離れている`);
        result.ambiguous.push({
          slug: c.slug, name: c.name,
          prefecture: c.prefecture, area: c.area,
          currentLat: c.lat, currentLng: c.lng,
          candidates,
        });
      }
    } else {
      console.log(`    → ambiguous: 候補${candidates.length}件`);
      result.ambiguous.push({
        slug: c.slug, name: c.name,
        prefecture: c.prefecture, area: c.area,
        currentLat: c.lat, currentLng: c.lng,
        candidates,
      });
    }
  }

  fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2));

  console.log('\n── 集計 ───────────────────────────────────');
  console.log(`auto:      ${result.auto.length}件`);
  console.log(`ambiguous: ${result.ambiguous.length}件`);
  console.log(`notFound:  ${result.notFound.length}件`);
  if (result.fetchFailed.length) {
    console.log(`  └ うち Overpass 取得失敗: ${result.fetchFailed.length}件（再実行で取り直し可）`);
  }
  console.log(`合計: ${result.auto.length + result.ambiguous.length + result.notFound.length} / ${targets.length}`);
  console.log(`\n出力: ${path.relative(process.cwd(), RESULT_PATH)}`);
  console.log('※ campgrounds.json は変更していません。');
  console.log('次: node scripts/review-auto-coords.js で目視レビュー用HTMLを生成');
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1); });
