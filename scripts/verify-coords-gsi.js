/**
 * 国土地理院APIで data/campgrounds.json の座標を一括検証する。
 *
 * 検出とレポート出力のみ。data/campgrounds.json は絶対に書き換えない。
 * 書き込み先は scripts/coord-report.json と scripts/coord-city-check-2026-08.md だけ。
 *
 * ## 市区町村まで比較する（2026-08-13 追加）
 *
 * **以前は都道府県しか比較していなかった。**そのため `yadoriki-camp` は
 * address が「足柄上郡**松田町**寄3048」で逆ジオが「**山北町**」を返すのに、
 * **どちらも神奈川県なので OK を返し、`coordsGsiChecked: true` が立ったまま表示まで通っていた**
 * （引き継ぎ §6-11・§17-4）。
 *
 * `lookupMuni()` は市区町村名を**最初から取得していて `row.gsiCity` に入れてもいた**。
 * 判定に使っていなかっただけなので、追加のAPIリクエストは発生しない。
 *
 * 判定の優先順位は 県 → 市区町村 → 区。
 *
 * - `PREF_MISMATCH` … 県が違う。**この場合 市区町村は見ない**（県が違えば市区町村も当然違う）
 * - `CITY_MISMATCH` … 県は一致するが、逆ジオの市区町村が address に見当たらない
 * - `WARD_MISMATCH` … 政令市の**市までは一致するが区が違う**。
 *   **verdict は OK のまま**にして `wardMismatch: true` を立てるだけにしてある。
 *   区の再編（浜松市の南区→中央区、2024年）が起きると全レコードが一斉に外れ、
 *   `coordsGsiChecked` が大量に落ちる。区の食い違いは人が見る材料であって、
 *   機械検証の合否を分ける材料ではない。
 *
 * 比較元は `address` だけ。`area` は「道志川」「朝霧高原」のような通称なので使えず、
 * `prefecture` は address と同じ人が同じ推測から書くので突き合わせても意味がない（§6-15）。
 *
 * 使い方:
 *   node scripts/verify-coords-gsi.js
 *   node scripts/verify-coords-gsi.js --slug=yadoriki-camp   # 単体確認。ファイルは書かない
 */

const fs = require('fs');
const path = require('path');
const {
  normalizeDashUnified,
  cityCandidates,
  normalizePref,
} = require('./lib/jp-address');

const DATA_PATH = path.join(__dirname, '..', 'data', 'campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'coord-report.json');
const CITY_MD_PATH = path.join(__dirname, 'coord-city-check-2026-08.md');

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

/**
 * 逆ジオが返した市区町村が address に含まれるかを見る。
 *
 * 一致の判定は「address 文字列に市区町村名が現れるか」。address 側は
 * 「山梨県南都留郡道志村2438」のように郡付きで書くことも、郡を省くこともあるので、
 * `cityCandidates()` が郡を落とした候補も作る。
 * 政令市は muni マスタが「相模原市　緑区」と全角空白入りで返すが、
 * 正規化で「相模原市緑区」になり address の表記と揃う。
 */
function compareCity(address, gsiCity) {
  const addr = normalizeDashUnified(address);
  if (!addr) return { result: 'NO_ADDRESS', note: 'address が空で比較できない' };

  const cands = cityCandidates(gsiCity);
  if (!cands.length) return { result: 'NO_CITY', note: '逆ジオが市区町村名を返さない' };

  const hit = cands.find((c) => addr.includes(c));
  if (hit) return { result: 'MATCH', note: `市区町村「${hit}」が一致` };

  // 市までは合っていて区だけ違う場合を切り分ける。区の再編で起きうるので同格にしない
  for (const c of cands) {
    const m = /^(.+?市)(.+区)$/.exec(c);
    if (m && addr.includes(m[1])) {
      return {
        result: 'WARD_MISMATCH',
        note: `市「${m[1]}」は一致するが区が違う（逆ジオは「${m[2]}」）`,
      };
    }
  }

  return { result: 'CITY_MISMATCH', note: `逆ジオは「${gsiCity}」だが address に見当たらない` };
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
    // 市区町村の突き合わせと、md での見え方のために持つ。判定には status を使わない（§6-1）
    status: camp.status ?? null,
    address: camp.address ?? null,
    coordsGsiChecked: camp.coordsGsiChecked === true,
    lat: camp.lat ?? null,
    lng: camp.lng ?? null,
    verdict: 'OK',
    coarse: false,
    gsiPref: null,
    gsiCity: null,
    lv01Nm: null,
    cityCheck: null,
    cityNote: null,
    wardMismatch: false,
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

        if (normalizePref(muni.pref) !== normalizePref(camp.prefecture)) {
          // 県が違う時点で市区町村も違う。二重に数えても情報が増えないので見ない
          row.verdict = 'PREF_MISMATCH';
          row.cityCheck = 'SKIPPED';
          row.cityNote = '県が違うので市区町村は見ていない';
        } else {
          const cc = compareCity(camp.address, muni.city);
          row.cityCheck = cc.result;
          row.cityNote = cc.note;
          if (cc.result === 'CITY_MISMATCH') {
            row.verdict = 'CITY_MISMATCH';
          } else if (cc.result === 'NO_ADDRESS' || cc.result === 'NO_CITY') {
            // 検査そのものが成立していない。OK にすると「照合して一致した」と読めてしまう
            row.verdict = cc.result;
          } else if (cc.result === 'WARD_MISMATCH') {
            // verdict は OK のまま。区の再編で一斉に外れるのを避ける（冒頭のコメント参照）
            row.wardMismatch = true;
          }
        }
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

const ORDER = [
  'OK', 'SUSPECT', 'CITY_MISMATCH', 'NO_ADDRESS', 'NO_CITY',
  'PREF_MISMATCH', 'SEA', 'UNKNOWN_MUNI', 'NO_COORD', 'ERROR',
];

function printSummary(rows) {
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

  // WARD_MISMATCH は verdict を OK のままにしているので、ここで別に出さないと見えない
  const ward = rows.filter((r) => r.wardMismatch);
  console.log(`  WARD_MISMATCH(区違い・OK扱い) ${String(ward.length).padStart(4)}件`);
  for (const r of ward) console.log(`      ${r.slug} / ${r.address} / 逆ジオ ${r.gsiCity}`);

  const noAddr = rows.filter((r) => r.verdict === 'NO_ADDRESS');
  if (noAddr.length) {
    console.log(`  address が無く市区町村を比較できず ${String(noAddr.length).padStart(4)}件`);
    for (const r of noAddr) console.log(`      ${r.slug}`);
  }

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
          if (r.address) console.log(`  address: ${r.address}`);
          if (r.cityNote) console.log(`  市区町村: ${r.cityNote}`);
          if (r.error) console.log(`  理由: ${r.error}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`修正が必要そうな件数: ${problems.length}件`);
  console.log('='.repeat(60));
}

/** 市区町村の突き合わせ結果だけをまとめた md を書く */
function buildCityMd(rows) {
  const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const counts = {};
  for (const r of rows) counts[r.verdict] = (counts[r.verdict] || 0) + 1;

  const cityMiss = rows.filter((r) => r.verdict === 'CITY_MISMATCH');
  const ward = rows.filter((r) => r.wardMismatch);
  const noAddr = rows.filter((r) => r.verdict === 'NO_ADDRESS');
  const prefMiss = rows.filter((r) => r.verdict === 'PREF_MISMATCH');

  const HEAD =
    '| slug | status | address | 逆ジオ（県 / 市区町村 / 大字） | 標高 | `coordsGsiChecked` |\n|---|---|---|---|---|---|';
  const table = (list) =>
    list
      .map(
        (r) =>
          `| \`${r.slug}\` | ${esc(r.status)} | ${esc(r.address ?? '（空）')} | ${esc(r.gsiPref)} / **${esc(r.gsiCity)}** / ${esc(r.lv01Nm ?? '—')} | ${
            r.elevation !== null ? `${r.elevation}m` : '—'
          } | ${r.coordsGsiChecked ? '**true**' : '—'} |`
      )
      .join('\n') || '| （なし） | | | | | |';

  // apply-gsi-flags.js は verdict === 'OK' 以外からフィールドを消すので、
  // 「OK でない」かつ「今フラグが立っている」ものが対象になる
  const wouldLose = rows.filter((r) => r.verdict !== 'OK' && r.coordsGsiChecked);

  return `# 座標 × address の市区町村チェック（2026-08-13）

\`node scripts/verify-coords-gsi.js\` の出力。**このスクリプトは data/campgrounds.json を書き換えない。**

## 何が変わったか

\`verify-coords-gsi.js\` は**都道府県しか比較していなかった**（引き継ぎ §6-11・§17-4-1）。

\`\`\`js
// 変更前 — これ1行が判定のすべてだった
row.verdict = normalizePref(muni.pref) === normalizePref(camp.prefecture) ? 'OK' : 'PREF_MISMATCH';
\`\`\`

そのため \`yadoriki-camp\` は address が「足柄上郡**松田町**寄3048」、逆ジオが「**山北町**」で
市町村が違うのに、**どちらも神奈川県なので OK** を返していた。
\`kabutomushi-mori-camp\`（神奈川 vs 東京都八王子市）が \`PREF_MISMATCH\` で拾えていたのは、
**たまたま県境をまたいでいたから**にすぎない。

\`lookupMuni()\` は市区町村名を**以前から取得して \`row.gsiCity\` に入れていた。**
判定に使っていなかっただけなので、**追加のAPIリクエストは発生していない。**

## 判定の優先順位

| 判定 | 意味 | \`coordsGsiChecked\` への影響 |
|---|---|---|
| \`PREF_MISMATCH\` | 県が違う。**市区町村は見ない** | 外れる（従来どおり） |
| **\`CITY_MISMATCH\`** | **県は一致するが市区町村が address に見当たらない** | **外れる（今回の変更点）** |
| **\`NO_ADDRESS\`** | **address が空で、市区町村を照合していない** | **外れる（今回の変更点）** |
| \`WARD_MISMATCH\` | 政令市の**市は一致し区だけ違う** | **外れない。verdict は OK のまま** |

**\`NO_ADDRESS\` を OK に含めない理由。**
照合していないものに「機械検証を通過した」フラグが立つのは、
**今回直した穴（県しか見ずに OK を返していた）と同じ構造**になる。
検査が成立しなかったことは、成立して一致したことと区別できなければ意味がない。

**\`WARD_MISMATCH\` を \`CITY_MISMATCH\` と同格にしていない理由。**
区の再編が起きると一斉に発生する。実例として \`nakatajima-sakyuu-camp\` は
2024年の浜松市の区再編で「南区」→「中央区」に変わっている。
再編のたびに \`coordsGsiChecked\` が大量に落ちるのは、
**座標の正しさが変わっていないのにフラグだけ動く**ということで、検査として意味がない。
区の食い違いは人が見る材料として出すにとどめる。

比較元は **\`address\` だけ**。\`area\` は「道志川」「朝霧高原」のような通称なので使えず、
\`prefecture\` は address と同じ人が同じ推測から書くので突き合わせても意味がない（§6-15）。

## 集計（全 ${rows.length}件）

| 判定 | 件数 |
|---|---|
${ORDER.filter((v) => counts[v])
  .map((v) => `| \`${v}\` | ${counts[v]} |`)
  .join('\n')}

うち \`WARD_MISMATCH\`（OK 扱い）: **${ward.length}件** ／ address が無く比較できず: **${noAddr.length}件**

## CITY_MISMATCH（${cityMiss.length}件）

**逆ジオが返した市区町村が address のどこにも現れないもの。**
どちらが誤っているか（address か座標か）は**このスクリプトでは決められない。**
\`verify-address-gsi.js\` の CITY_MISS と同じ性質の候補出し。

${HEAD}
${table(cityMiss)}

## WARD_MISMATCH（${ward.length}件・verdict は OK のまま）

${
  ward.length === 0
    ? '**0件。**区を持つレコードは address 側も区まで正しく書けている。\n\n' +
      '**この節は0件でも必ず出す。**節ごと消えると「区を検査していない」と区別が付かなくなる。'
    : '**市までは一致していて区だけが違うもの。**`coordsGsiChecked` は外れない。'
}

${HEAD}
${table(ward)}

## NO_ADDRESS（${noAddr.length}件）

**address が空で、市区町村の照合そのものが成立しなかったもの。**
**「一致した」ではない。**座標が海上でないことと県が合っていることまでは確認できている。

${HEAD}
${table(noAddr)}

## PREF_MISMATCH（${prefMiss.length}件・市区町村は見ていない）

${HEAD}
${table(prefMiss)}

## \`apply-gsi-flags.js\` を再実行するとどうなるか

**⚠ このレポートの生成時点では実行していない。**\`data/campgrounds.json\` は変更されていない。

\`apply-gsi-flags.js\` は \`verdict === 'OK'\` のものだけに \`coordsGsiChecked: true\` を立て、
それ以外からはフィールドを削除する。今回 \`CITY_MISMATCH\` と \`NO_ADDRESS\` が増えたので、
**再実行すると次の ${wouldLose.length}件から \`coordsGsiChecked\` が外れる。**

${
  wouldLose.length
    ? wouldLose
        .map(
          (r) =>
            `- \`${r.slug}\`（${r.status} / **${r.verdict}**）… address ${r.address ?? '（空）'} / 逆ジオ ${r.gsiCity}`
        )
        .join('\n')
    : '（該当なし）'
}

**外すかどうかの判断はしていない。**フラグを外すと「機械検証を通っていない」という
シグナルが立つので、先に address と座標のどちらが誤りかを決めるほうが筋が通る場合がある。

あわせて \`lib/types.ts\` の \`coordsGsiChecked\` の説明（引き継ぎ §2-5）は
「返ってきた市区町村が \`prefecture\` と矛盾せず」と書いてあるが、
**実際には市区町村を見ていなかった。**この変更で記述と実装が揃う。
`;
}

(async () => {
  // --slug=a,b,c で単体確認。**ファイルは一切書かない**（検算用）
  const slugArg = process.argv.find((a) => a.startsWith('--slug='));
  const onlySlugs = slugArg ? slugArg.slice('--slug='.length).split(',').map((s) => s.trim()) : null;

  console.log('市区町村マスタを取得中...');
  const muniMap = await loadMuniMap();
  console.log(`市区町村マスタ: ${muniMap.size}件（ゼロ埋め別名込み）\n`);

  const all = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const camps = onlySlugs ? all.filter((c) => onlySlugs.includes(c.slug)) : all;
  if (onlySlugs && camps.length !== onlySlugs.length) {
    const found = new Set(camps.map((c) => c.slug));
    throw new Error(`--slug に無い slug がある: ${onlySlugs.filter((s) => !found.has(s)).join(', ')}`);
  }
  console.log(`検証対象: ${camps.length}件${onlySlugs ? '（--slug 指定）' : ''}\n`);

  const rows = [];
  for (let i = 0; i < camps.length; i++) {
    const camp = camps[i];
    const row = await verifyOne(camp, muniMap);
    rows.push(row);

    const tag = `[${i + 1}/${camps.length}]`;
    const extra = row.coarse ? ' (coarse)' : '';
    const ward = row.wardMismatch ? ' (WARD_MISMATCH)' : '';
    console.log(`${tag} ${row.name} ... ${row.verdict}${extra}${ward}`);

    if (i < camps.length - 1) await sleep(INTERVAL_MS);
  }

  if (onlySlugs) {
    // 検算のための単発実行なので、全件ぶんのレポートを部分的な結果で上書きしない
    console.log('\n--slug 指定のためファイルは書かない');
    for (const r of rows) {
      console.log(`\n  ${r.slug}: ${r.verdict}${r.wardMismatch ? ' + WARD_MISMATCH' : ''}`);
      console.log(`    address : ${r.address}`);
      console.log(`    逆ジオ  : ${r.gsiPref} / ${r.gsiCity} / ${r.lv01Nm ?? '—'}`);
      console.log(`    市区町村: ${r.cityCheck} — ${r.cityNote}`);
    }
    return;
  }

  // 書き込むのは coord-report.json と市区町村チェックの md のみ。data/campgrounds.json は触らない。
  fs.writeFileSync(REPORT_PATH, JSON.stringify(rows, null, 2) + '\n', 'utf-8');
  console.log(`\nレポート出力: ${path.relative(process.cwd(), REPORT_PATH)}`);

  fs.writeFileSync(CITY_MD_PATH, buildCityMd(rows), 'utf-8');
  console.log(`市区町村チェック: ${path.relative(process.cwd(), CITY_MD_PATH)}`);

  printSummary(rows);
})().catch((e) => {
  console.error('\n致命的エラー:', e.message);
  process.exit(1);
});
