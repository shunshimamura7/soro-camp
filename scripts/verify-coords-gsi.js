/**
 * 国土地理院APIで data/campgrounds.json の座標を一括検証する。
 *
 * 検出とレポート出力のみ。data/campgrounds.json は絶対に書き換えない。
 * 書き込み先は scripts/coord-report.json だけ。
 *
 * 使い方: node scripts/verify-coords-gsi.js
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'coord-report.json');

const MUNI_URL = 'https://maps.gsi.go.jp/js/muni.js';
const REVERSE_URL = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';
const ELEVATION_URL = 'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php';

const INTERVAL_MS = 400;
const TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'soro-camp-coord-verifier/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

/**
 * 市区町村マスタを取得する。
 * 中身の例: GSI.MUNI_ARRAY["14401"] = '14,神奈川県,14401,相模原市 緑区';
 * キーの先頭ゼロが落ちている行があるので、5桁ゼロ埋めしたキーでも引けるよう両方登録する。
 */
async function loadMuniMap() {
  const res = await fetchWithTimeout(MUNI_URL);
  const text = await res.text();

  const map = new Map();
  const re = /GSI\.MUNI_ARRAY\[\s*["']?(\d+)["']?\s*\]\s*=\s*["']([^"']*)["']/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const rawKey = m[1];
    const parts = m[2].split(',');
    if (parts.length < 4) continue;
    // [都道府県コード, 都道府県名, 市区町村コード, 市区町村名]
    const entry = { pref: parts[1].trim(), city: parts[3].trim() };
    const padded = rawKey.padStart(5, '0');
    if (!map.has(rawKey)) map.set(rawKey, entry);
    if (!map.has(padded)) map.set(padded, entry);
  }

  if (map.size === 0) {
    throw new Error('市区町村マスタのパース結果が0件。muni.js の形式が変わった可能性あり。');
  }
  return map;
}

function lookupMuni(muniMap, muniCd) {
  const key = String(muniCd).trim();
  return muniMap.get(key) || muniMap.get(key.padStart(5, '0')) || null;
}

/** 「神奈川県」「東京都」「大阪府」→「神奈川」「東京」「大阪」 */
function normalizePref(name) {
  return String(name || '').trim().replace(/[県都府]$/, '');
}

function decimalPlaces(n) {
  const s = String(n);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function isValidCoord(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

async function reverseGeocode(lat, lng) {
  const res = await fetchWithTimeout(`${REVERSE_URL}?lat=${lat}&lon=${lng}`);
  const json = await res.json();
  const results = json && json.results;
  if (!results || typeof results !== 'object' || Array.isArray(results)) return null;
  const muniCd = results.muniCd;
  if (muniCd === undefined || muniCd === null || String(muniCd).trim() === '') return null;
  return { muniCd: String(muniCd).trim(), lv01Nm: results.lv01Nm || null };
}

async function getElevation(lat, lng) {
  const res = await fetchWithTimeout(`${ELEVATION_URL}?lon=${lng}&lat=${lat}&outtype=JSON`);
  const json = await res.json();
  const raw = json && json.elevation;
  if (raw === undefined || raw === null || raw === '-----') return null;
  const num = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(num) ? num : null;
}

async function verifyOne(camp, muniMap) {
  const row = {
    slug: camp.slug ?? null,
    name: camp.name ?? null,
    prefecture: camp.prefecture ?? null,
    area: camp.area ?? null,
    type: camp.type ?? null,
    lat: camp.lat ?? null,
    lng: camp.lng ?? null,
    verdict: 'OK',
    coarse: false,
    gsiPref: null,
    gsiCity: null,
    lv01Nm: null,
    elevation: null,
    noElevation: false,
  };

  // 3. 形式チェック（APIを叩く前）
  if (!isValidCoord(camp.lat) || !isValidCoord(camp.lng)) {
    row.verdict = 'NO_COORD';
    return row;
  }
  if (decimalPlaces(camp.lat) <= 2 || decimalPlaces(camp.lng) <= 2) {
    row.coarse = true;
  }

  // 4. 逆ジオコーディング
  try {
    const geo = await reverseGeocode(camp.lat, camp.lng);
    if (!geo) {
      row.verdict = 'SEA';
    } else {
      row.lv01Nm = geo.lv01Nm;
      const muni = lookupMuni(muniMap, geo.muniCd);
      if (!muni) {
        row.verdict = 'UNKNOWN_MUNI';
        row.error = `muniCd ${geo.muniCd} がマスタに無い`;
      } else {
        row.gsiPref = muni.pref;
        row.gsiCity = muni.city;
        row.verdict =
          normalizePref(muni.pref) === normalizePref(camp.prefecture) ? 'OK' : 'PREF_MISMATCH';
      }
    }
  } catch (e) {
    row.verdict = 'ERROR';
    row.error = `逆ジオコーディング失敗: ${e.message}`;
    return row;
  }

  await sleep(INTERVAL_MS);

  // 5. 標高
  try {
    const elev = await getElevation(camp.lat, camp.lng);
    if (elev === null) {
      row.noElevation = true;
      // 標高が取れないのは海上・国土外の裏付けになる
      if (row.verdict === 'OK') row.verdict = 'SUSPECT';
    } else {
      row.elevation = elev;
    }
  } catch (e) {
    row.verdict = 'ERROR';
    row.error = `標高取得失敗: ${e.message}`;
  }

  return row;
}

function printSummary(rows) {
  const ORDER = ['OK', 'SUSPECT', 'PREF_MISMATCH', 'SEA', 'UNKNOWN_MUNI', 'NO_COORD', 'ERROR'];
  const counts = {};
  for (const r of rows) counts[r.verdict] = (counts[r.verdict] || 0) + 1;

  console.log('\n' + '='.repeat(60));
  console.log('サマリ');
  console.log('='.repeat(60));
  console.log(`検証件数: ${rows.length}件\n`);

  for (const v of ORDER) {
    if (counts[v]) console.log(`  ${v.padEnd(14)} ${String(counts[v]).padStart(4)}件`);
  }
  for (const v of Object.keys(counts)) {
    if (!ORDER.includes(v)) console.log(`  ${v.padEnd(14)} ${String(counts[v]).padStart(4)}件`);
  }

  const coarse = rows.filter((r) => r.coarse);
  console.log(`\n  coarse(小数2桁以下) ${String(coarse.length).padStart(4)}件`);

  // OK以外を県ごとにグループ化して一覧表示
  const problems = rows.filter((r) => r.verdict !== 'OK');
  if (problems.length > 0) {
    const byPref = new Map();
    for (const r of problems) {
      const k = r.prefecture || '(県不明)';
      if (!byPref.has(k)) byPref.set(k, []);
      byPref.get(k).push(r);
    }

    console.log('\n' + '='.repeat(60));
    console.log('OK以外の全件');
    console.log('='.repeat(60));

    for (const [pref, list] of byPref) {
      console.log(`\n■ ${pref}（${list.length}件）`);
      for (const r of list) {
        console.log(`\n[${r.verdict}] ${r.name}（${r.prefecture}/${r.area}）`);
        const coord =
          r.lat === null || r.lng === null ? '(座標なし)' : `${r.lat}, ${r.lng}`;
        console.log(`  データ: ${coord}${r.coarse ? '  ※小数2桁以下' : ''}`);

        if (r.verdict === 'ERROR' || r.verdict === 'NO_COORD') {
          if (r.error) console.log(`  理由: ${r.error}`);
        } else {
          const place = [r.gsiPref, r.gsiCity, r.lv01Nm].filter(Boolean).join(' ') || '(取得できず)';
          const elev = r.elevation !== null ? `標高 ${r.elevation}m` : '標高 取得できず';
          console.log(`  国土地理院: ${place} / ${elev}`);
          if (r.error) console.log(`  理由: ${r.error}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`修正が必要そうな件数: ${problems.length}件`);
  console.log('='.repeat(60));
}

(async () => {
  console.log('市区町村マスタを取得中...');
  const muniMap = await loadMuniMap();
  console.log(`市区町村マスタ: ${muniMap.size}件（ゼロ埋め別名込み）\n`);

  const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  console.log(`検証対象: ${camps.length}件\n`);

  const rows = [];
  for (let i = 0; i < camps.length; i++) {
    const camp = camps[i];
    const row = await verifyOne(camp, muniMap);
    rows.push(row);

    const tag = `[${i + 1}/${camps.length}]`;
    const extra = row.coarse ? ' (coarse)' : '';
    console.log(`${tag} ${row.name} ... ${row.verdict}${extra}`);

    if (i < camps.length - 1) await sleep(INTERVAL_MS);
  }

  // 書き込むのは coord-report.json のみ。data/campgrounds.json は触らない。
  fs.writeFileSync(REPORT_PATH, JSON.stringify(rows, null, 2) + '\n', 'utf-8');
  console.log(`\nレポート出力: ${path.relative(process.cwd(), REPORT_PATH)}`);

  printSummary(rows);
})().catch((e) => {
  console.error('\n致命的エラー:', e.message);
  process.exit(1);
});
