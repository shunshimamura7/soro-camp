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
 * 対象は `status` が **active か unverified** で、address と lat/lng の両方を持つもの。
 * **lastVerified や coordsVerified で絞らない**（引き継ぎ §6-1）。
 *
 * ## なぜ unverified も対象にするか（2026-08-13 に広げた）
 *
 * 以前は `active` だけだった。**いちばん検査したい層が対象外になっていた。**
 * `unverified` は「実在が確認できていない」という印で、住所が壊れている確率が最も高い。
 * 実際、`lv01Nm` の相対評価で唯一の当たりだった `mitsumata-camp`（山北町・9.03km）は
 * `unverified` なので、**active 縛りのままでは判定にも出力にも出てこなかった。**
 * §6-1（確認済みフラグで対象を絞ると、フラグの誤りを見逃す）と同じ構図が
 * `status` でも起きていた。
 *
 * **`closed` と `suspended` は入れない。**「もう行けない施設の住所が座標と合っているか」は
 * 行動につながらず、表が読みにくくなるだけ。実測でも相対評価の結果は変わらなかった。
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const OUT = path.join(__dirname, 'address-check-2026-08.md');
const COORD_REPORT = path.join(__dirname, 'coord-report.json');

/**
 * NO_LV01 を「その自治体では異常」と言うために必要な、同じ市区町村で大字が取れたレコード数。
 *
 * **絶対値（`−` かどうか）では判定できない。**道志村14件・鳴沢村1件は
 * そもそも大字を持たない自治体なので `−` が正常で、単独で異常扱いすると偽陽性15件になる。
 * 効くのは自治体内での相対 —「同じ市区町村の他は大字が取れているのに自分だけ `−`」。
 *
 * **3 にした理由。**「この自治体では GSI が大字を持っている」という主張を、
 * 独立した3件で裏付けてから `−` を異常と呼ぶため。
 * 掲載は1市町村あたり1〜2件が大半なので、1 にすると
 * **レコードが1件しかない27市町村で、隣接地点がたまたま `−` を返しただけで SUSPECT が立つ。**
 * 実測では山北町（大字あり11件）が当たりで、3 でも 11 でも同じ結果になる（引き継ぎ §17-4-2）。
 */
const LV01_REL_MIN_NAMED = 3;

/**
 * 検査対象の `status`。**`closed` と `suspended` は入れない**（冒頭のコメント参照）。
 * `unverified` を外すと、いちばん壊れている確率が高い層が検査から漏れる。
 */
const TARGET_STATUSES = ['active', 'unverified'];

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
//
// `classify-oaza-miss.js` と同じ処理を別々に持っていたので scripts/lib/jp-address.js に集約した。
// **抽出時に挙動は変えていない。**このスクリプトが使う normalize はダッシュを `-` に統一する
// 側（`normalizeDashUnified`）で、`classify-oaza-miss.js` の漢数字を統一する側とは別物。
// 違いと既知の不具合はモジュールの冒頭に書いてある。

const {
  normalizeDashUnified: normalize,
  isLv01Missing,
  oazaCandidates,
  cityCandidates,
  addressRemainder,
} = require('./lib/jp-address');
const { replaceHead, sectionSizes } = require('./lib/md-sections');

// ── 判定 ─────────────────────────────────────────────────────

const ORDER = ['CITY_MISS', 'OAZA_MISS', 'NO_LV01', 'NO_OAZA', 'UNRESOLVED', 'MATCH'];

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

  // GSI 側に大字が無い。**データ側の欠落（NO_OAZA）とは原因が正反対**なので箱を分ける。
  // ここが正常（大字を持たない自治体）か異常（その自治体では他が大字を返している）かは
  // 1件だけでは決まらない。全件を回したあとの第2パスで相対評価する
  if (isLv01Missing(geo.lv01Nm)) {
    return { verdict: 'NO_LV01', note: `逆ジオが大字を返さない（lv01Nm「${geo.lv01Nm ?? '（空）'}」）` };
  }
  if (!oazas.length) return { verdict: 'NO_LV01', note: 'lv01Nm が空' };
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

// ── NO_LV01 の相対評価（第2パス） ────────────────────────────

/**
 * `judge()` は1件で完結するので、自治体内での相対は見られない。全件を回し終えたあとに走らせる。
 *
 * 分母は **`coord-report.json`** から取る。`verify-coords-gsi.js` が
 * **全レコードぶんの `lv01Nm` を既に保存している**ので、追加のGSIリクエストが要らない。
 * このスクリプト自身の結果は `closed`・`suspended` を落としているので分母として足りない。
 * **測っているのは施設の状態ではなく「その自治体で GSI が大字を整備しているか」**なので、
 * 分母は `status` で絞ってはいけない（実測: 山北町は全12件中11件が大字を返す）。
 *
 * **借り物の分母なので、古ければ使わない。**黙って飛ばすと
 * 「相対評価をしたが何も出なかった」と区別が付かなくなるので、理由を md に出す。
 */
function loadLv01Denominator() {
  if (!fs.existsSync(COORD_REPORT)) {
    return { ok: false, reason: '`scripts/coord-report.json` が無い。先に `node scripts/verify-coords-gsi.js` を回すこと' };
  }

  const reportStat = fs.statSync(COORD_REPORT);
  const dataStat = fs.statSync(DATA);
  if (reportStat.mtimeMs < dataStat.mtimeMs) {
    return {
      ok: false,
      reason:
        `\`coord-report.json\` が \`data/campgrounds.json\` より古い` +
        `（レポート ${reportStat.mtime.toISOString()} / データ ${dataStat.mtime.toISOString()}）。` +
        'データが動いたあと逆ジオを回し直していないので、分母として使えない',
    };
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(COORD_REPORT, 'utf8'));
  } catch (e) {
    return { ok: false, reason: `\`coord-report.json\` を読めない（${e.message}）` };
  }

  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  if (!Array.isArray(report) || report.length !== data.length) {
    return {
      ok: false,
      reason:
        `\`coord-report.json\` の件数（${Array.isArray(report) ? report.length : '不明'}）が ` +
        `\`data/campgrounds.json\`（${data.length}件）と合わない。レコードの増減後に回し直していない`,
    };
  }

  // gsiCity ごとに「大字が取れたレコード数」を数える。これが分母
  const named = new Map();
  for (const r of report) {
    if (!r.gsiCity || isLv01Missing(r.lv01Nm)) continue;
    named.set(r.gsiCity, (named.get(r.gsiCity) || 0) + 1);
  }
  return { ok: true, named, count: report.length, mtime: reportStat.mtime };
}

/** NO_LV01 の各件に SUSPECT / UNKNOWN を付ける。判定できなければ理由を残す */
function applyLv01Relative(results) {
  const denom = loadLv01Denominator();
  const targets = results.filter((r) => r.verdict === 'NO_LV01');

  if (!denom.ok) {
    for (const r of targets) {
      r.lv01Rel = { verdict: 'UNKNOWN', namedCount: null, note: '相対評価をスキップした' };
    }
    return denom;
  }

  for (const r of targets) {
    const city = r.geo.city;
    const n = (city && denom.named.get(city)) || 0;
    r.lv01Rel =
      n >= LV01_REL_MIN_NAMED
        ? {
            verdict: 'SUSPECT',
            namedCount: n,
            note: `同じ「${city}」の他 ${n}件は大字が取れているのに、この1件だけ「−」`,
          }
        : {
            verdict: 'UNKNOWN',
            namedCount: n,
            note: `「${city}」で大字が取れたレコードは ${n}件しかない（${LV01_REL_MIN_NAMED}件未満なので判定しない）`,
          };
  }
  return denom;
}

// ── 本体 ─────────────────────────────────────────────────────

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  // ★ 確認済みフラグで絞らない（引き継ぎ §6-1）
  // --slug=a,b,c で単体・少数だけ検査できる。住所を直したあとの確認用
  const slugArg = process.argv.find((a) => a.startsWith('--slug='));
  const onlySlugs = slugArg ? slugArg.slice('--slug='.length).split(',').map((x) => x.trim()) : null;

  const usable = (c) => c.address && String(c.address).trim() && Number(c.lat) && Number(c.lng);
  const inScope = (c) => TARGET_STATUSES.includes(c.status);

  const targets = data.filter((c) => (onlySlugs ? onlySlugs.includes(c.slug) : inScope(c)) && usable(c));
  const skipped = data.filter((c) => inScope(c) && !usable(c));

  const scopeTotal = data.filter(inScope).length;
  const byStatus = (list) =>
    TARGET_STATUSES.map((s) => `${s} ${list.filter((c) => c.status === s).length}`).join(' / ');
  console.log(
    `verify-address-gsi: 対象 ${targets.length}件（${TARGET_STATUSES.join('+')} ${scopeTotal}件中／${byStatus(targets)}）`
  );
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

  // 全件を回し終えてから、NO_LV01 を自治体内の相対で仕分ける
  const denom = applyLv01Relative(results);
  const lv01Suspect = results.filter((r) => r.verdict === 'NO_LV01' && r.lv01Rel?.verdict === 'SUSPECT');
  const lv01Unknown = results.filter((r) => r.verdict === 'NO_LV01' && r.lv01Rel?.verdict !== 'SUSPECT');
  if (denom.ok) {
    console.log(`\nNO_LV01 の相対評価（同一市区町村で大字あり ${LV01_REL_MIN_NAMED}件以上）: SUSPECT ${lv01Suspect.length} / UNKNOWN ${lv01Unknown.length}`);
    for (const r of lv01Suspect) console.log(`  [SUSPECT] ${r.camp.slug} / ${r.camp.address} / ${r.lv01Rel.note}`);
  } else {
    console.log(`\n⚠ NO_LV01 の相対評価をスキップした: ${denom.reason}`);
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
          `| \`${r.camp.slug}\` | ${esc(r.camp.status)} | ${esc(r.camp.name)} | ${esc(r.camp.address)} | ${esc(r.geo.city ?? '—')} / ${esc(r.geo.lv01Nm ?? '—')} | ${km(r)} | ${esc(r.note)} |`
      )
      .join('\n');

  const HEAD =
    '| slug | status | 施設名 | address | 逆ジオ（市区町村 / 大字） | 距離の目安 | 備考 |\n|---|---|---|---|---|---|---|';
  const EMPTY = '| （なし） | | | | | | |';

  /** 判定ごとの status 内訳。closed を混ぜていないことと、どの層に偏っているかを見るため */
  const statusBreak = (verdict) => {
    const list = results.filter((r) => r.verdict === verdict);
    return TARGET_STATUSES.map((s) => `${s} ${list.filter((r) => r.camp.status === s).length}`).join(' / ');
  };

  const lv01Rows = (list) =>
    list
      .sort((a, b) => (b.distKm ?? -1) - (a.distKm ?? -1))
      .map(
        (r) =>
          `| \`${r.camp.slug}\` | ${esc(r.camp.status)} | ${esc(r.camp.name)} | ${esc(r.camp.address)} | ${esc(r.geo.city ?? '—')} | ${
            r.lv01Rel?.namedCount ?? '—'
          } | ${km(r)} | ${esc(r.lv01Rel?.note ?? '')} |`
      )
      .join('\n') || '| （なし） | | | | | | |';
  const LV01_HEAD =
    '| slug | 施設名 | address | 逆ジオの市区町村 | 同市区町村で大字が取れた件数 | 距離の目安 | 備考 |\n|---|---|---|---|---|---|---|';

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

対象: \`status\` が **active か unverified** で、address と lat/lng の両方を持つ **${targets.length}件**
（${byStatus(targets)}）。**\`coordsVerified\` や \`lastVerified\` で絞っていない**（引き継ぎ §6-1）。

**2026-08-13 に \`unverified\` を対象に加えた。**以前は \`active\` だけで、
**いちばん壊れている確率が高い層が検査から漏れていた。**
\`lv01Nm\` の相対評価で唯一の当たりだった \`mitsumata-camp\`（山北町・9.03km）は
\`unverified\` なので、**active 縛りのままでは判定にも出力にも出てこなかった。**
§6-1（確認済みフラグで対象を絞ると、フラグの誤りを見逃す）と同じ構図が \`status\` でも起きていた。
\`closed\`・\`suspended\` は入れていない（もう行けない施設の住所の整合は行動につながらない）。
GSI は公共APIなので、同時実行1・リクエスト間隔${REQUEST_GAP_MS}ms以上・1件ごとにさらに${RECORD_GAP_MS}ms待機で回している。

## 集計

| 判定 | 件数 | status 内訳 | 意味 |
|---|---|---|---|
| **CITY_MISS** | **${counts.CITY_MISS}** | ${statusBreak('CITY_MISS')} | 逆ジオの市区町村が address に見当たらない |
| **OAZA_MISS** | **${counts.OAZA_MISS}** | ${statusBreak('OAZA_MISS')} | 市区町村は一致するが**大字が address に見当たらない**（\`takizawaso\` 型） |
| **NO_LV01** | **${counts.NO_LV01}** | ${statusBreak('NO_LV01')} | **逆ジオが大字を返さない（\`lv01Nm\` が「−」）。GSI 側の欠落** |
| NO_OAZA | ${counts.NO_OAZA} | ${statusBreak('NO_OAZA')} | **address が市区町村までしか無い。データ側の欠落** |
| UNRESOLVED | ${counts.UNRESOLVED} | ${statusBreak('UNRESOLVED')} | 逆ジオが返らない（海上・国有林など） |
| MATCH | ${counts.MATCH} | ${statusBreak('MATCH')} | 市区町村も大字も一致 |

**\`NO_LV01\` と \`NO_OAZA\` は原因が正反対なので分けてある。**
前者は国土地理院に大字データが無い、後者はこちらの \`address\` が大字まで書けていない。
以前はどちらも \`NO_OAZA\` に入れていたうえ、**「−」を大字の候補として扱っていたため
address の番地のハイフンに当たって MATCH になっていた**（引き継ぎ §17-4-2）。

対象外（対象 status だが address か座標が無い）: ${skipped.length}件
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
${rows('CITY_MISS') || EMPTY}

## OAZA_MISS（${counts.OAZA_MISS}件）

距離の目安が大きい順。10km 以上は太字。

${HEAD}
${rows('OAZA_MISS') || EMPTY}

## NO_LV01（${counts.NO_LV01}件）— 自治体内での相対評価

**「−」を単独で異常扱いすると偽陽性になる。**
道志村・鳴沢村は**そもそも大字が存在しない自治体**なので「−」が正常で、
絶対値で判定すると実測15件が全部誤検出になる。

効くのは**自治体内での相対** —「同じ市区町村の他のレコードは大字が取れているのに、
自分だけ「−」」。分母は \`coord-report.json\`（全レコードの逆ジオ結果）から取っている。
**このスクリプトの対象は \`status === 'active'\` に絞られていて分母として足りない**
（山北町は全12件中11件が大字を返すが、active だけだと8件全部が大字ありになり、
当たりの \`mitsumata-camp\` は unverified なので対象にすら入らない）。

**判定: 同一市区町村で大字が取れたレコードが ${LV01_REL_MIN_NAMED}件以上あれば SUSPECT、満たなければ UNKNOWN。**
${LV01_REL_MIN_NAMED} は「この自治体では GSI が大字を持っている」を独立した${LV01_REL_MIN_NAMED}件で裏付けてから
「−」を異常と呼ぶための下限。掲載は1市町村あたり1〜2件が大半なので、
1 にすると**レコードが1件しかない市町村で、隣接地点がたまたま「−」を返しただけで SUSPECT が立つ。**

**⚠ この規則は「−」が多数派の自治体を想定していない。該当が出たら規則を見直すこと。**
（現状は該当0件。大字あり10件・「−」9件のような分布でも「−」全件が SUSPECT になる作りのまま）

${
  denom.ok
    ? `分母: \`coord-report.json\`（${denom.count}件 / ${denom.mtime.toISOString()}）`
    : `**⚠ 相対評価をスキップした。**理由: ${denom.reason}\n\n` +
      `**下の ${counts.NO_LV01}件は「判定していない」のであって「問題なし」ではない。**\n` +
      '`node scripts/verify-coords-gsi.js` を回して `coord-report.json` を更新してから、このスクリプトを回し直すこと。'
}

### SUSPECT（${lv01Suspect.length}件）

**同じ市区町村の他は大字が取れているのに、この地点だけ返ってこない。**
座標がその自治体の外れや別地点を指している疑い。

${LV01_HEAD}
${lv01Rows(lv01Suspect)}

### UNKNOWN（${lv01Unknown.length}件）

**大字を持たない自治体か、母数が足りず判定できないもの。**

${LV01_HEAD}
${lv01Rows(lv01Unknown)}

## NO_OAZA（${counts.NO_OAZA}件）

**address が市区町村までしか無い。**大字まで書けていないので、この検査では判定できない。
**住所を番地まで確定させる対象。**

${HEAD}
${rows('NO_OAZA') || EMPTY}

## UNRESOLVED（${counts.UNRESOLVED}件）

${HEAD}
${rows('UNRESOLVED') || EMPTY}

## MATCH（${counts.MATCH}件）

${HEAD}
${rows('MATCH') || EMPTY}
`;

  // --slug 指定は確認のための単発実行なので、全件の md を上書きしない
  if (onlySlugs) {
    console.log('\n--slug 指定のため md は書き換えない');
    for (const r of results) {
      const rel = r.lv01Rel ? ` → 相対評価 ${r.lv01Rel.verdict}（${r.lv01Rel.note}）` : '';
      console.log(
        `  ${r.camp.slug}: ${r.verdict} / ${r.note}${r.distKm != null ? ` / ${r.distKm.toFixed(2)}km` : ''}${rel}`
      );
    }
    return;
  }

  // ⚠ 以前は md 全体を作り直して上書きしていた。
  // **`classify-oaza-miss.js` が書く D-1.5 と、手書きの D-2・D-3 が毎回消えていた。**
  // このスクリプトが責任を持つのは冒頭〜`## MATCH` までで、
  // 追記された節（`---` ＋ `# 見出し`）はそのまま残す。
  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  const out = prev ? replaceHead(prev, md) : md;

  const kept = sectionSizes(out).sections;
  fs.writeFileSync(OUT, out, 'utf8');
  console.log(`\n${ORDER.map((v) => `${v} ${counts[v]}`).join(' / ')}`);
  if (kept.length) {
    console.log(`保持した節: ${kept.map((s) => `${s.heading}（${s.chars}字）`).join(' / ')}`);
  }
  console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
