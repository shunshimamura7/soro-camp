/**
 * 座標を1件ずつ国土地理院APIで逆ジオコーディングして確かめる。
 *
 * verify-coords-gsi.js は全件を回すので、調査中に1点だけ試したいときに使う。
 * データは読まないし書かない。引数の座標を問い合わせるだけ。
 *
 * 使い方:
 *   node scripts/check-one-coord.js 35.1397,139.1487
 *   node scripts/check-one-coord.js 35.1397,139.1487 34.9762,139.1021 ...
 *   node scripts/check-one-coord.js "真鶴:35.1462,139.1352" "伊東:34.9668,139.1032"
 */
const MUNI_URL = 'https://maps.gsi.go.jp/js/muni.js';
const REVERSE_URL = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';
const ELEVATION_URL = 'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php';

const INTERVAL_MS = 400;
const TIMEOUT_MS = 30000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'soro-camp-coord-verifier/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function loadMuniMap() {
  const text = await (await get(MUNI_URL)).text();
  const map = new Map();
  const re = /GSI\.MUNI_ARRAY\[\s*["']?(\d+)["']?\s*\]\s*=\s*["']([^"']*)["']/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const parts = m[2].split(',');
    if (parts.length < 4) continue;
    const entry = { pref: parts[1].trim(), city: parts[3].trim() };
    if (!map.has(m[1])) map.set(m[1], entry);
    const padded = m[1].padStart(5, '0');
    if (!map.has(padded)) map.set(padded, entry);
  }
  if (map.size === 0) throw new Error('市区町村マスタのパースが0件');
  return map;
}

async function reverse(lat, lng, muni) {
  const json = await (await get(`${REVERSE_URL}?lat=${lat}&lon=${lng}`)).json();
  const code = json?.results?.muniCd;
  const lv01Nm = json?.results?.lv01Nm ?? null;
  if (!code) return { pref: null, city: null, lv01Nm };
  const hit = muni.get(String(code)) || muni.get(String(code).padStart(5, '0'));
  return { pref: hit?.pref ?? null, city: hit?.city ?? null, lv01Nm };
}

async function elevation(lat, lng) {
  const json = await (await get(`${ELEVATION_URL}?lon=${lng}&lat=${lat}&outtype=JSON`)).json();
  const v = json?.elevation;
  return typeof v === 'number' ? v : null;
}

(async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('座標を指定してください。例: node scripts/check-one-coord.js 35.1397,139.1487');
    process.exit(1);
  }

  const muni = await loadMuniMap();

  for (const arg of args) {
    const [labelPart, coordPart] = arg.includes(':') ? arg.split(':') : [null, arg];
    const [latStr, lngStr] = coordPart.split(',');
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.log(`${arg}: 座標として読めない`);
      continue;
    }

    const [addr, elev] = await Promise.all([reverse(lat, lng, muni), elevation(lat, lng)]);
    // 市区町村が引けず標高も取れない＝陸地の外。海上判定
    const verdict = !addr.city && elev === null ? 'SEA（市区町村・標高とも取れず）'
      : !addr.city ? `水面の可能性（市区町村が引けない／標高 ${elev}m）`
      : 'OK';

    console.log(`${labelPart ? labelPart + '  ' : ''}${lat}, ${lng}`);
    console.log(`  逆ジオ: ${addr.pref ?? '(なし)'} / ${addr.city ?? '(なし)'} / ${addr.lv01Nm ?? '(なし)'}`);
    console.log(`  標高  : ${elev === null ? '(取得できず)' : elev + 'm'}`);
    console.log(`  判定  : ${verdict}`);
    console.log();
    await sleep(INTERVAL_MS);
  }
})();
