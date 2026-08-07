/**
 * address と座標が同じ場所を指しているかを、国土地理院の逆ジオで**大字レベル**まで突き合わせる。
 *
 * ## なぜ verify-coords-gsi.js と別にするか
 *
 * 目的が違う。
 *
 * - `verify-coords-gsi.js` … **座標が妥当か**（海上・湖面でないか、`prefecture` と矛盾しないか）
 * - このスクリプト        … **address と座標が同じ場所を指しているか**
 *
 * 既存の検査は市区町村までしか見ない。`takizawaso` は address が「秦野市堀山下1513」で
 * 実際は「秦野市戸川1445」だったが、**どちらも同じ秦野市なので素通りした。**
 * 逆ジオの `lv01Nm` は大字・町丁目まで返るので、そこまで突き合わせれば拾える。
 *
 * ## 判定は「候補出し」までで、どちらが誤りかは決めない
 *
 * **OAZA_MISS は「住所が誤り」の証拠ではない。**次のどれでも起きる。
 *
 * - 座標がサイト内の別地点（入口・駐車場・管理棟）を指している
 * - 施設が隣接する大字にまたがっている
 * - address に通称地名や旧地名を書いている
 * - 逆ジオの `lv01Nm` の表記ゆれ（大字の有無、丁目の書き方）
 *
 * **data/campgrounds.json は絶対に書き換えない。**
 *
 * ## 負荷
 *
 * **GSI は公共APIなので、同時実行1・リクエスト間隔1秒以上を絶対に緩めない。**
 * 1件あたり逆ジオ1回＋住所検索1回の2リクエストを投げるので、実測で1件2秒強かかる。
 *
 *   node scripts/verify-address-gsi.js
 *   → scripts/address-check-2026-08.md
 *
 * 対象は `status === 'active'` かつ address と lat/lng の両方を持つもの。
 * **lastVerified や coordsVerified で絞らない**（引き継ぎ §6-1）。
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const OUT = path.join(__dirname, 'address-check-2026-08.md');

const MUNI_URL = 'https://maps.gsi.go.jp/js/muni.js';
const REVERSE_URL = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';
const SEARCH_URL = 'https://msearch.gsi.go.jp/address-search/AddressSearch';

const REQUEST_GAP_MS = 1000; // どのリクエストの間も最低1秒
const RECORD_GAP_MS = 1000; // さらに1件ごとにも1秒
const TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastRequestAt = 0;
async function get(url) {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'soro-camp-address-verifier/1.0' },
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

/** address を GSI の住所検索にかけて座標を得る。距離の目安を出すためだけに使う */
async function forwardGeocode(address) {
  try {
    const json = await (await get(`${SEARCH_URL}?q=${encodeURIComponent(address)}`)).json();
    const top = Array.isArray(json) ? json[0] : null;
    const c = top?.geometry?.coordinates;
    if (!Array.isArray(c) || c.length < 2) return null;
    return { lat: Number(c[1]), lng: Number(c[0]), title: top?.properties?.title ?? '' };
  } catch {
    return null;
  }
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// ── 文字列の突き合わせ ──────────────────────────────────────

const KANJI_NUM = { 〇: '0', 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9' };

/** 全角・大字/字・空白などを落として比較しやすくする */
function normalize(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFKC')
    .replace(/[‐‑‒–—―ー−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/大字|字(?=[^\d])/g, '');
}

/**
 * lv01Nm から比較用の候補を作る。
 * 「戸川」はそのまま、「元町一丁目」は「元町1丁目」「元町」も候補にする。
 * 丁目の表記は address 側が「元町1-2-3」のように書くことが多く、そのままでは当たらない。
 */
function oazaCandidates(lv01Nm) {
  const base = normalize(lv01Nm);
  if (!base) return [];
  const set = new Set([base]);
  const arabic = base.replace(/[〇一二三四五六七八九]/g, (c) => KANJI_NUM[c] ?? c);
  set.add(arabic);
  for (const v of [base, arabic]) {
    const stripped = v.replace(/[0-9]+丁目$/, '').replace(/[〇一二三四五六七八九十]+丁目$/, '');
    if (stripped && stripped !== v) set.add(stripped);
  }
  return [...set].filter(Boolean);
}

/** 市区町村名の候補。muni マスタは「南都留郡道志村」のように郡付きで返ることがある */
function cityCandidates(city) {
  const c = normalize(city);
  if (!c) return [];
  const set = new Set([c]);
  const afterGun = c.split('郡').pop();
  if (afterGun && afterGun !== c) set.add(afterGun);
  return [...set].filter(Boolean);
}

/** address から都道府県・市区町村を取り除いた残り（＝大字以降）を返す */
function addressRemainder(address, cityList) {
  let rest = normalize(address).replace(/^(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/, '');
  for (const c of cityList) {
    const i = rest.indexOf(c);
    if (i >= 0) {
      rest = rest.slice(i + c.length);
      break;
    }
  }
  return rest;
}

// ── 判定 ─────────────────────────────────────────────────────

const ORDER = ['CITY_MISS', 'OAZA_MISS', 'NO_OAZA', 'UNRESOLVED', 'MATCH'];

function judge(camp, geo) {
  const address = String(camp.address);
  if (!geo.city) return { verdict: 'UNRESOLVED', note: '逆ジオが市区町村を返さない（海上・国有林など）' };

  const cities = cityCandidates(geo.city);
  const normAddr = normalize(address);
  const cityHit = cities.some((c) => normAddr.includes(c));
  if (!cityHit) {
    return {
      verdict: 'CITY_MISS',
      note: `逆ジオは「${geo.city}」だが address に見当たらない`,
    };
  }

  const rest = addressRemainder(address, cities);
  const oazas = oazaCandidates(geo.lv01Nm);

  if (!oazas.length) return { verdict: 'NO_OAZA', note: 'lv01Nm が空' };
  // 市区町村より後ろに日本語が無い＝番地だけ、または市区町村止まり
  if (!/[぀-ヿ一-鿿]/.test(rest)) {
    return { verdict: 'NO_OAZA', note: `address が市区町村までしか無い（残り「${rest || '（なし）'}」）` };
  }

  const hit = oazas.find((o) => rest.includes(o) || normAddr.includes(o));
  if (hit) return { verdict: 'MATCH', note: `大字「${hit}」が一致` };

  return {
    verdict: 'OAZA_MISS',
    note: `逆ジオの大字「${geo.lv01Nm}」が address の「${rest}」に見当たらない`,
  };
}

// ── 本体 ─────────────────────────────────────────────────────

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  // ★ 確認済みフラグで絞らない（引き継ぎ §6-1）
  // --slug=a,b,c で単体・少数だけ検査できる。住所を直したあとの確認用
  const slugArg = process.argv.find((a) => a.startsWith('--slug='));
  const onlySlugs = slugArg ? slugArg.slice('--slug='.length).split(',').map((x) => x.trim()) : null;

  const targets = data.filter(
    (c) =>
      (onlySlugs ? onlySlugs.includes(c.slug) : c.status === 'active') &&
      c.address &&
      String(c.address).trim() &&
      Number(c.lat) &&
      Number(c.lng)
  );
  const skipped = data.filter(
    (c) =>
      c.status === 'active' &&
      !(c.address && String(c.address).trim() && Number(c.lat) && Number(c.lng))
  );

  console.log(`verify-address-gsi: 対象 ${targets.length}件（active ${data.filter((c) => c.status === 'active').length}件中）`);
  console.log(`同時実行1 / リクエスト間隔 ${REQUEST_GAP_MS}ms 以上 / 1件ごとにさらに ${RECORD_GAP_MS}ms`);
  console.log(`1件あたり 逆ジオ1回＋住所検索1回。所要はおよそ ${Math.ceil((targets.length * 2 * REQUEST_GAP_MS + targets.length * RECORD_GAP_MS) / 60000)} 分\n`);

  const muni = await loadMuniMap();
  const results = [];

  for (const [i, camp] of targets.entries()) {
    const lat = Number(camp.lat);
    const lng = Number(camp.lng);
    let geo;
    try {
      geo = await reverse(lat, lng, muni);
    } catch (e) {
      results.push({
        camp, geo: { pref: null, city: null, lv01Nm: null },
        verdict: 'UNRESOLVED', note: `逆ジオに失敗（${e.message}）`, distKm: null, geocoded: null,
      });
      await sleep(RECORD_GAP_MS);
      continue;
    }

    const { verdict, note } = judge(camp, geo);
    const geocoded = await forwardGeocode(String(camp.address));
    const distKm = geocoded ? haversineKm({ lat, lng }, geocoded) : null;

    results.push({ camp, geo, verdict, note, distKm, geocoded });

    if (verdict !== 'MATCH') {
      console.log(
        `  [${verdict}] ${camp.slug} / ${camp.address} / 逆ジオ ${geo.city ?? '-'} ${geo.lv01Nm ?? '-'}` +
          `${distKm != null ? ` / ${distKm.toFixed(2)}km` : ''}`
      );
    }
    if ((i + 1) % 25 === 0) console.log(`  … ${i + 1}/${targets.length}`);
    await sleep(RECORD_GAP_MS);
  }

  const counts = Object.fromEntries(ORDER.map((v) => [v, 0]));
  results.forEach((r) => counts[r.verdict]++);

  const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const km = (r) =>
    r.distKm == null ? '—' : r.distKm < 10 ? `${r.distKm.toFixed(2)}km` : `**${r.distKm.toFixed(1)}km**`;

  const rows = (verdict) =>
    results
      .filter((r) => r.verdict === verdict)
      .sort((a, b) => (b.distKm ?? -1) - (a.distKm ?? -1))
      .map(
        (r) =>
          `| \`${r.camp.slug}\` | ${esc(r.camp.name)} | ${esc(r.camp.address)} | ${esc(r.geo.city ?? '—')} / ${esc(r.geo.lv01Nm ?? '—')} | ${km(r)} | ${esc(r.note)} |`
      )
      .join('\n');

  const HEAD = '| slug | 施設名 | address | 逆ジオ（市区町村 / 大字） | 距離の目安 | 備考 |\n|---|---|---|---|---|---|';

  const md = `# address × 座標 の整合チェック（2026-08）

\`node scripts/verify-address-gsi.js\` の出力。**このスクリプトはデータを書き換えない。**

## 何を見ているか

既存の \`verify-coords-gsi.js\` は**市区町村までしか**突き合わせていない。
\`takizawaso\` は address が「秦野市**堀山下**1513」で実際は「秦野市**戸川**1445」だったが、
**どちらも同じ秦野市なので素通りした。**

国土地理院の逆ジオ（\`LonLatToAddress\`）は \`lv01Nm\` で**大字・町丁目**まで返す。
座標から引いた大字が \`address\` の文字列に含まれるかを見る。

「距離の目安」は、**\`address\` を国土地理院の住所検索にかけて得た座標**と、
データの \`lat\`/\`lng\` との直線距離。**住所と座標がどれだけ離れているかの目安**であって、
施設の位置の正しさではない。住所検索が町の中心を返すこともあるので、数百m〜1km台は誤差の範囲。

対象: \`status === 'active'\` かつ address と lat/lng の両方を持つ **${targets.length}件**。
**\`coordsVerified\` や \`lastVerified\` で絞っていない**（引き継ぎ §6-1）。
GSI は公共APIなので、同時実行1・リクエスト間隔${REQUEST_GAP_MS}ms以上・1件ごとにさらに${RECORD_GAP_MS}ms待機で回している。

## 集計

| 判定 | 件数 | 意味 |
|---|---|---|
| **CITY_MISS** | **${counts.CITY_MISS}** | 逆ジオの市区町村が address に見当たらない |
| **OAZA_MISS** | **${counts.OAZA_MISS}** | 市区町村は一致するが**大字が address に見当たらない**（\`takizawaso\` 型） |
| NO_OAZA | ${counts.NO_OAZA} | \`lv01Nm\` が空、または address が市区町村までしか無い |
| UNRESOLVED | ${counts.UNRESOLVED} | 逆ジオが返らない（海上・国有林など） |
| MATCH | ${counts.MATCH} | 市区町村も大字も一致 |

対象外（active だが address か座標が無い）: ${skipped.length}件
${skipped.map((c) => `\`${c.slug}\``).join('、') || 'なし'}

## OAZA_MISS を「住所が誤り」と読まないこと

**この判定は候補出しでしかない。**大字が食い違う理由は住所の誤りだけではない。

- 座標が**サイト内の別地点**（入口・駐車場・管理棟）を指している
- 施設が**隣接する大字にまたがっている**
- address に**通称地名や旧地名**を書いている
- \`lv01Nm\` の**表記ゆれ**（大字の有無、丁目の書き方、旧字体）

**どちらが誤っているかは、このスクリプトでは決められない。**
判断には第3の独立ソース（施設公式の住所表記、自治体の施設一覧）が要る。

## CITY_MISS（${counts.CITY_MISS}件）

${HEAD}
${rows('CITY_MISS') || '| （なし） | | | | | |'}

## OAZA_MISS（${counts.OAZA_MISS}件）

距離の目安が大きい順。10km 以上は太字。

${HEAD}
${rows('OAZA_MISS') || '| （なし） | | | | | |'}

## NO_OAZA（${counts.NO_OAZA}件）

大字まで書けていないので、この検査では判定できない。**住所を番地まで確定させる対象。**

${HEAD}
${rows('NO_OAZA') || '| （なし） | | | | | |'}

## UNRESOLVED（${counts.UNRESOLVED}件）

${HEAD}
${rows('UNRESOLVED') || '| （なし） | | | | | |'}

## MATCH（${counts.MATCH}件）

${HEAD}
${rows('MATCH') || '| （なし） | | | | | |'}
`;

  // --slug 指定は確認のための単発実行なので、全件の md を上書きしない
  if (onlySlugs) {
    console.log('\n--slug 指定のため md は書き換えない');
    for (const r of results) {
      console.log(
        `  ${r.camp.slug}: ${r.verdict} / ${r.note}${r.distKm != null ? ` / ${r.distKm.toFixed(2)}km` : ''}`
      );
    }
    return;
  }

  fs.writeFileSync(OUT, md, 'utf8');
  console.log(`\n${ORDER.map((v) => `${v} ${counts[v]}`).join(' / ')}`);
  console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
