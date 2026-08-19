/**
 * STEP A — 千葉「複数ソースで裏が取れた46件」の詳細を取る（2026-08-19）。
 *
 *   node scripts/nap-detail46.js --selftest
 *   node scripts/nap-detail46.js --list                # 対象46件を出すだけ（取得なし）
 *   node scripts/nap-detail46.js --harvest             # 取得（レジューム対応）
 *
 * 出力: `scripts/.nap-harvest/chiba-detail46.json`（`.gitignore` 済み）
 *
 * ## ★ 料金は原文のまま持つ。**この時点で解釈しない**
 *
 * `chargeInfo` は施設が書いた HTML の表そのもの。**数値を1つに丸めない。**
 * ソロ1名の総額を決めるのは STEP B（公式での裏取り）の仕事で、ここは素材を運ぶだけ。
 * 丸めた瞬間に「内訳から単価を逆算した」跡が残る（§20-1）。
 *
 * ## 取得元 — 詳細ページの2か所から取る
 *
 * 1. **JSON-LD（`@type: Campground`）** … telephone / priceRange / geo / aggregateRating
 * 2. **RSC ペイロード（`self.__next_f`）の `campsite` オブジェクト** … 本体のほぼ全部
 *
 * 実測した `campsite` 直下のキー（2026-08-19 / `/chiba/11950`）:
 *
 *   accessInfo, parkingInfo, chargeInfo, siteInfo, ruleInfo, rentalInfo,
 *   seasonInfo, holidayInfo, checkinInfo, checkoutInfo, cardFlg,
 *   masterList{activities, nearFacilities, availableVehicle, locationEnvironment,
 *              ground, usefulServices, equipment, usageTypes, facilities},
 *   favoriteNum, alreadyWentNum, status, affiliateSiteUrl, fromCampsite
 *
 * ## ★ 取れないと分かっているもの（**推定で埋めない**）
 *
 * | 欲しかったもの | 実際 |
 * |---|---|
 * | **区画数・サイト数** | **構造化されていない。**`chargeInfo` / `siteInfo` の自由文に「1区画あたり」のように出るだけで、総数は書いていない施設が多い |
 * | **標高** | **キーが無い。**なっぷは持っていない |
 * | **施設公式サイトURL** | `hpUrl` はあるが**空文字のことがある**（11950 が実測で空）。空は「無い」ではなく「なっぷに登録されていない」 |
 * | **masterList の意味** | 数値コードのみ。**コード→ラベルの辞書がページ内に無い。**コードを意味に読み替えない |
 *
 * ## Crawl-delay
 *
 * robots.txt は `Crawl-delay: 30`。**リクエスト開始時刻から30秒**の間隔を自分で保証する
 * （`fetchPage` 側のガードとは別に、ここでも待つ）。46件で約23分。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { _internal } = require('./district-sweep.js');
const { fetchPage } = _internal;

const CRAWL_DELAY_MS = 30000;
const OUT = path.join(__dirname, '.nap-harvest', 'chiba-detail46.json');
const PROGRESS = path.join(__dirname, '.nap-harvest', 'chiba-detail46.progress.txt');
const MERGED = path.join(__dirname, 'chiba-merged-2026-08-19.json');
const NAP = path.join(__dirname, '.nap-harvest', 'chiba.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================================================================
 * 1. 対象46件の決定
 *
 * **母数は `chiba-merged-2026-08-19.json` の「複数ソースで裏が取れた」グループ。**
 * ここで条件を作り直さない（作り直すと md の46件と食い違う。§22-5）。
 * ========================================================================== */
/* ★ `chiba-merged-*.json` の名前は**実体参照をデコードした後**の値、
 * `.nap-harvest/chiba.json` は**生**（`Ocean&#x27;s`）。**素直に突き合わせると引けない。**
 * 実際に `白浜フラワーパークOcean's` が NO_NAP_URL に落ちた（2026-08-19 実測）。
 * デコード規則はマージ側と同じものをここにも置く（本体の取得層は直さない方針のため）。 */
const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decodeEntities = (s) => (typeof s !== 'string' ? s : s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&([a-zA-Z]+);/g, (m, n) => (NAMED_ENTITIES[n.toLowerCase()] !== undefined ? NAMED_ENTITIES[n.toLowerCase()] : m)));

function targets() {
  const merged = JSON.parse(fs.readFileSync(MERGED, 'utf8'));
  const nap = JSON.parse(fs.readFileSync(NAP, 'utf8'));
  // **生とデコード後の両方を引けるようにする。**片方だけだと静かに1件落ちる
  const byName = new Map();
  nap.forEach((r) => {
    byName.set(r.name, r);
    const d = decodeEntities(r.name);
    if (d !== r.name && !byName.has(d)) byName.set(d, r);
  });

  const multi = merged.groups.filter((g) => g.srcs.length >= 2);
  const out = multi.map((g, i) => {
    // なっぷ名は `names` に `nap:<name>` の形で入っている
    const napName = g.names.filter((n) => n.indexOf('nap:') === 0).map((n) => n.slice(4))[0] || null;
    const rec = napName ? byName.get(napName) : null;
    return {
      seq: i + 1,
      name: g.name,
      city: g.city,
      srcs: g.srcs,
      napClosedMarker: g.napClosedMarker,
      napName,
      napId: rec ? String(rec.id) : null,
      napUrl: rec ? rec.url : null,
      address: rec ? rec.address : null,
      // なっぷに無い1件は、詳細を取りに行く先がこのソースには無い。**黙って落とさない**
      state: rec ? 'HAS_NAP_URL' : 'NO_NAP_URL',
    };
  });
  return out;
}

/* ============================================================================
 * 2. 抽出
 * ========================================================================== */

/** JSON-LD の `@type: Campground` を返す */
function jsonLdCampground(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      if (j && j['@type'] === 'Campground') return j;
    } catch { /* 壊れた ld+json は飛ばす。**握り潰さず null で返る** */ }
  }
  return null;
}

/**
 * RSC ペイロード（`self.__next_f.push([1,"…"])`）を1本につないで復号する。
 *
 * **`JSON.parse` が通らないことがある**（`\ ` のような JSON では不正なエスケープが混ざる）。
 * 通らなければ手で戻す。**失敗を握り潰して空文字を返さない**（空だと「項目が無い」に見える）。
 */
function decodePayload(html) {
  let buf = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)) buf += m[1];
  if (!buf) return { text: '', note: 'PAYLOAD_NOT_FOUND' };
  try {
    return { text: JSON.parse('"' + buf + '"'), note: null };
  } catch (e) {
    const text = buf
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, x) => String.fromCharCode(parseInt(x, 16)))
      .replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
      .replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return { text, note: 'MANUAL_UNESCAPE(' + e.message.slice(0, 40) + ')' };
  }
}

/** ペイロードから `"key":"…"` の文字列値を取る。**HTML はそのまま返す（解釈しない）** */
function strField(s, key) {
  const i = s.indexOf('"' + key + '":');
  if (i < 0) return undefined;
  const rest = s.slice(i + key.length + 3);
  if (rest.indexOf('null') === 0) return null;
  if (rest[0] !== '"') return undefined;
  // エスケープを見ながら閉じ引用符まで
  let out = '', esc = false;
  for (let k = 1; k < rest.length; k++) {
    const c = rest[k];
    if (esc) { out += (c === 'n' ? '\n' : c === 'r' ? '\r' : c === 't' ? '\t' : c); esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') return out;
    out += c;
  }
  return undefined;
}

function numField(s, key) {
  const m = s.match(new RegExp('"' + key + '":(-?\\d+(?:\\.\\d+)?)'));
  return m ? Number(m[1]) : undefined;
}

function arrField(s, key) {
  const m = s.match(new RegExp('"' + key + '":\\[([0-9,\\s]*)\\]'));
  if (!m) return undefined;
  return m[1].split(',').map((x) => x.trim()).filter(Boolean).map(Number);
}

/** 詳細ページ1枚 → 取得項目。**原文を原文のまま持つ** */
function parseDetail46(html) {
  const ld = jsonLdCampground(html);
  const p = decodePayload(html);
  const s = p.text;

  const out = {
    payloadNote: p.note,
    // --- JSON-LD 由来 ---
    ldName: ld ? ld.name || null : null,
    telephone: ld ? ld.telephone || null : null,
    priceRange: ld ? ld.priceRange || null : null,   // 「3300-52800」。**施設全体の幅。ソロの値ではない**
    ratingValue: ld && ld.aggregateRating ? ld.aggregateRating.ratingValue : null,
    ratingCount: ld && ld.aggregateRating ? ld.aggregateRating.ratingCount : null,
    // --- ペイロード由来（原文 HTML のまま） ---
    chargeInfo: strField(s, 'chargeInfo') ?? null,     // ★ 料金。**解釈しない**
    siteInfo: strField(s, 'siteInfo') ?? null,         // 設備一覧
    accessInfo: strField(s, 'accessInfo') ?? null,
    parkingInfo: strField(s, 'parkingInfo') ?? null,
    ruleInfo: strField(s, 'ruleInfo') ?? null,
    rentalInfo: strField(s, 'rentalInfo') ?? null,
    seasonInfo: strField(s, 'seasonInfo') ?? null,
    holidayInfo: strField(s, 'holidayInfo') ?? null,
    checkinInfo: strField(s, 'checkinInfo') ?? null,
    checkoutInfo: strField(s, 'checkoutInfo') ?? null,
    hpUrl: strField(s, 'hpUrl') ?? null,               // **空文字のことがある。空＝無いではない**
    affiliateSiteUrl: strField(s, 'affiliateSiteUrl') ?? null,
    cityName: strField(s, 'cityName') ?? null,
    favoriteNum: numField(s, 'favoriteNum') ?? null,
    alreadyWentNum: numField(s, 'alreadyWentNum') ?? null,
    cardFlg: numField(s, 'cardFlg') ?? null,
    // ★ masterList は**数値コードのまま**持つ。辞書がページに無いので意味に読み替えない
    masterList: {
      activities: arrField(s, 'activities') ?? null,
      nearFacilities: arrField(s, 'nearFacilities') ?? null,
      availableVehicle: arrField(s, 'availableVehicle') ?? null,
      locationEnvironment: arrField(s, 'locationEnvironment') ?? null,
      ground: arrField(s, 'ground') ?? null,
      usefulServices: arrField(s, 'usefulServices') ?? null,
      equipment: arrField(s, 'equipment') ?? null,
      usageTypes: arrField(s, 'usageTypes') ?? null,
      facilities: arrField(s, 'facilities') ?? null,
    },
  };
  return out;
}

/* ============================================================================
 * 3. SELF_TEST — **外の事実だけ焼き込む。件数は焼き込まない**
 * ========================================================================== */
async function selfTest() {
  console.log('SELF_TEST: 詳細ページから料金・設備・チェックインが取れること\n');
  const url = 'https://www.nap-camp.com/chiba/11950';   // イレブンオートキャンプパーク
  const res = await fetchPage(url, { useCache: false });
  if (!res.ok) { console.error('❌ 取得できない: ' + res.status + ' ' + (res.note || '')); process.exit(1); }
  const d = parseDetail46(res.body);

  const fails = [];
  // **外の事実**: このページには料金表があり、テントサイトの行がある
  if (!d.chargeInfo || d.chargeInfo.indexOf('テントサイト') < 0) fails.push('chargeInfo にテントサイトの行が無い');
  else console.log('  ✅ chargeInfo 取得（' + d.chargeInfo.length + '字）');
  // **外の事実**: チェックインは時刻の形で書かれている
  if (!d.checkinInfo || !/\d{1,2}:\d{2}/.test(d.checkinInfo)) fails.push('checkinInfo が時刻の形でない: ' + d.checkinInfo);
  else console.log('  ✅ checkinInfo = ' + d.checkinInfo);
  // **外の事実**: 設備の記述に炊事場がある
  if (!d.siteInfo || d.siteInfo.indexOf('炊事場') < 0) fails.push('siteInfo に炊事場が無い');
  else console.log('  ✅ siteInfo 取得（' + d.siteInfo.length + '字）');
  // **外の事実**: JSON-LD に電話と priceRange がある
  if (!d.telephone) fails.push('telephone が取れない');
  else console.log('  ✅ telephone = ' + d.telephone);
  if (!d.priceRange) fails.push('priceRange が取れない');
  else console.log('  ✅ priceRange = ' + d.priceRange);
  if (!d.masterList.equipment || !d.masterList.equipment.length) fails.push('masterList.equipment が取れない');
  else console.log('  ✅ masterList.equipment = [' + d.masterList.equipment.join(',') + ']（**コードのまま。意味に読み替えない**）');
  // **偽ゼロ検出**: 空の HTML を通したら全部 null になり、成功判定にならないこと
  const blank = parseDetail46('<html></html>');
  if (blank.chargeInfo !== null || blank.checkinInfo !== null) fails.push('空の入力で null にならない（偽の成功が出る）');
  else console.log('  ✅ 空入力では全部 null（偽の成功が出ない）');

  if (fails.length) { console.error('\n❌ SELF_TEST 失敗'); fails.forEach((f) => console.error('   - ' + f)); process.exit(1); }
  console.log('\n✅ SELF_TEST 成功');
}

/* ============================================================================
 * 4. 収穫
 * ========================================================================== */
async function harvest() {
  const list = targets();
  const note = (s) => { console.error(s); fs.writeFileSync(PROGRESS, s + '\n', 'utf8'); };

  let out = [];
  if (fs.existsSync(OUT)) { try { out = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { out = []; } }
  const done = new Set(out.filter((r) => r.status === 200).map((r) => String(r.napId)));

  const fetchable = list.filter((t) => t.state === 'HAS_NAP_URL');
  const skipped = list.filter((t) => t.state !== 'HAS_NAP_URL');
  const todo = fetchable.filter((t) => !done.has(t.napId));

  note('[detail46] 対象' + list.length + '件 / なっぷURLあり' + fetchable.length
    + ' / URL無し' + skipped.length + ' / 取得済み' + done.size + ' / 残り' + todo.length
    + ' … 約' + Math.round(todo.length * CRAWL_DELAY_MS / 60000) + '分');

  // URL の無いものも**レコードとして残す**（黙って落とすと46件が45件になる）
  for (const t of skipped) {
    if (out.some((r) => r.seq === t.seq)) continue;
    out.push(Object.assign({}, t, { status: null, fetchedAt: null, detail: null, note: 'なっぷに項目が無い（jalan+pref のみ）。詳細はこのソースからは取れない' }));
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

  let n = 0;
  for (const t of todo) {
    const started = Date.now();
    const res = await fetchPage(t.napUrl, { useCache: false });
    const detail = res.ok ? parseDetail46(res.body) : null;
    out = out.filter((r) => r.seq !== t.seq);
    out.push(Object.assign({}, t, {
      status: res.status,
      fetchedAt: new Date(started).toISOString(),
      detail,
      note: res.ok ? null : (res.note || 'HTTP_' + res.status),
    }));
    n++;
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
    note('[detail46] ' + (done.size + n) + '/' + fetchable.length + '  ' + t.napId + ' ' + res.status
      + '  ' + t.name + ' / 料金' + (detail && detail.chargeInfo ? detail.chargeInfo.length + '字' : 'なし')
      + ' / hpUrl' + (detail && detail.hpUrl ? '=' + detail.hpUrl : 'なし'));
    // ★ リクエスト開始時刻から30秒。**応答時間を差し引く**
    const wait = CRAWL_DELAY_MS - (Date.now() - started);
    if (wait > 0 && n < todo.length) await sleep(wait);
  }
  note('[detail46] 完了 ' + out.filter((r) => r.status === 200).length + '/' + fetchable.length
    + '（URL無し' + skipped.length + '件は対象外として別に保持）');
}

async function main() {
  if (process.argv.indexOf('--selftest') >= 0) return selfTest();
  if (process.argv.indexOf('--list') >= 0) {
    const list = targets();
    list.forEach((t) => console.log(String(t.seq).padStart(2) + ' ' + t.state.padEnd(12) + ' ' + (t.napId || '----').padEnd(6) + ' ' + (t.city || '—') + ' ' + t.name));
    console.log('\n対象 ' + list.length + '件 / なっぷURLあり ' + list.filter((t) => t.state === 'HAS_NAP_URL').length
      + ' / URL無し ' + list.filter((t) => t.state !== 'HAS_NAP_URL').length);
    return;
  }
  if (process.argv.indexOf('--harvest') >= 0) return harvest();
  console.log('使い方: --selftest | --list | --harvest');
}

module.exports = { parseDetail46, targets, CRAWL_DELAY_MS };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
