/**
 * 千葉の母数マージ（2026-08-19）。**読み取り専用。**
 *
 * `data/campgrounds.json` には一切書かない。出力は md と、同名の JSON だけ。
 * 投入・status 変更・座標採用はこのスクリプトの仕事ではない。
 *
 * ## 対象4ソース（指示で明示されたものだけ）
 *
 *   1. なっぷ千葉   `scripts/.nap-harvest/chiba.json`（sitemap 由来）
 *   2. じゃらん     登録8市町村ぶん（`chiba-sources.js` の `jalan(...)`）
 *   3. 県台帳       千葉県公立社会体育施設一覧・キャンプ場（`SRC_CHIBA_PREF_SPORTS`）
 *   4. 既存DB       `data/campgrounds.json` の千葉レコード
 *
 * **ちば観光ナビ(L2) / 南房総市観光協会 / 君津市公式 / 木更津市公式は入れていない。**
 * 指示された母数がこの4本だからで、「千葉の全部」ではない。**総数をそう読まないこと。**
 *
 * ## §22 — 列挙しきった証拠を出す
 *
 * ソースごとに status / 一覧ページの取得結果 / `pageCap`（N+1 探査の判定）/
 * `detailBudget`（打ち切り）/ notes を**全部** md に出す。サイレントな切り捨てはしない。
 * 取得は本体の `collectSource` / `fetchPage` を呼ぶ（§22-5。測定側で書き直さない）。
 *
 * ## 今日やらないこと（コード本体は触らない）
 *
 * `normalizeName` の複数形バグ / `VARIANT_CHARS` / `splitAddress` は**直さない。**
 * 直すと26市町村のバケットが動いて差分が読めなくなる（§18-6）。
 * 袖ケ浦／袖ヶ浦の寄せと、住所末尾の施設名剥がしは**このファイル内のローカル処理**として持つ。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sweep = require('./district-sweep.js');
const { chibaMuniSources } = require('./chiba-sources.js');

const { collectSource, splitAddress, banchiKey } = sweep._internal;
const { sweepNormalizeName } = sweep;

const ROOT = path.join(__dirname, '..');
const NAP_JSON = path.join(__dirname, '.nap-harvest', 'chiba.json');
const DB_JSON = path.join(ROOT, 'data', 'campgrounds.json');

const BT = String.fromCharCode(96); // md のバッククォート。テンプレートリテラルに直接書けない

/* ============================================================================
 * 1. 千葉県の市町村（外の事実。**合併があれば腐る**）
 *
 * 県名だけの照合では `CAMPieceかすみがうら`（住所が「千葉県かすみがうら市」）を拾えない。
 * なっぷが県名を千葉と書いたうえで茨城の市町村を続けているため。
 * **距離・座標は使わない。市町村名の文字列照合だけ。**
 * ========================================================================== */
const CHIBA_MUNI = new Set([
  '千葉市', '銚子市', '市川市', '船橋市', '館山市', '木更津市', '松戸市', '野田市', '茂原市',
  '成田市', '佐倉市', '東金市', '旭市', '習志野市', '柏市', '勝浦市', '市原市', '流山市',
  '八千代市', '我孫子市', '鴨川市', '鎌ケ谷市', '君津市', '富津市', '浦安市', '四街道市',
  '袖ケ浦市', '八街市', '印西市', '白井市', '富里市', '南房総市', '匝瑳市', '香取市',
  '山武市', 'いすみ市', '大網白里市',
  '酒々井町', '栄町', '神崎町', '多古町', '東庄町', '九十九里町', '芝山町', '横芝光町',
  '一宮町', '睦沢町', '長生村', '白子町', '長柄町', '長南町', '大多喜町', '御宿町', '鋸南町',
]);

/** 表記ゆれの寄せ（**集計側のローカル処理。`VARIANT_CHARS` は触らない**） */
const MUNI_ALIAS = { '袖ヶ浦市': '袖ケ浦市', '鎌ヶ谷市': '鎌ケ谷市' };
const canonMuni = (m) => (m ? (MUNI_ALIAS[m] || m) : m);

/* ============================================================================
 * 2. ソースの読み込み
 * ========================================================================== */

function loadNap() {
  const arr = JSON.parse(fs.readFileSync(NAP_JSON, 'utf8'));
  return arr.map((r) => ({
    src: 'nap',
    id: String(r.id),
    name: r.name || null,
    address: r.address || null,
    url: r.url,
    ownUrl: true,                       // sitemap 由来。1件1URL が保証されている
    lat: r.latCandidate || null,
    lng: r.lngCandidate || null,
    // なっぷの名称に付く閉鎖表記。**メタとして持つだけで status には反映しない**
    napClosedMarker: /閉鎖|閉場|閉業/.test(r.name || ''),
    httpStatus: r.status,
  }));
}

function loadDb() {
  const all = JSON.parse(fs.readFileSync(DB_JSON, 'utf8'));
  return all
    .filter((r) => r.prefecture === '千葉県' || /^千葉県/.test(r.address || ''))
    .map((r) => ({
      src: 'db',
      id: r.id || r.slug,
      name: r.name,
      address: r.address || null,
      url: r.officialUrl || null,
      ownUrl: !!r.officialUrl,
      // **0,0 は座標ではない。**「入っている」と数えないために null に倒す
      lat: r.lat ? String(r.lat) : null,
      lng: r.lng ? String(r.lng) : null,
      dbStatus: r.status,
      priceVerified: !!r.priceVerified,
      scores: r.scores || null,
    }));
}

/** じゃらん8本＋県台帳1本を、**本体の collectSource で**取る */
async function collectRemote(useCache) {
  const muni = chibaMuniSources();
  const jalanSrcs = [];
  let prefSrc = null;
  for (const [name, def] of Object.entries(muni)) {
    for (const s of def.sources) {
      if (s.id === 'jalan') jalanSrcs.push({ muni: name, src: s });
      if (s.id === 'pref-chiba-sports' && !prefSrc) prefSrc = s;
    }
  }
  const results = [];
  for (const j of jalanSrcs) {
    const r = await collectSource(j.src, { useCache });
    results.push({ kind: 'jalan', muni: j.muni, r });
    console.error('  じゃらん ' + j.muni + ': ' + r.status + ' ' + r.items.length + '件');
  }
  const pr = await collectSource(prefSrc, { useCache });
  results.push({ kind: 'pref', muni: '(県台帳)', r: pr });
  console.error('  県台帳: ' + pr.status + ' ' + pr.items.length + '件');
  return results;
}

/* ============================================================================
 * 2-b. HTML 実体参照のデコード（**このファイル内のローカル処理。測定であって修正ではない**）
 *
 * なっぷの `parseDetail()` は `<title>` から名前を取るが実体参照を復号しない。
 * `CAMP&amp;SAUNA` と `CAMP&SAUNA` が別のキーになるので**名寄せが割れる。**
 *
 * **本体（`nap-camp-sitemap.js`）は直さない。**直すのは単独コミットの話。
 * ここでやるのは「直したら統合後ユニークが何件になるか」を**測る**ことだけ。
 * ========================================================================== */
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};
function decodeEntities(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (NAMED_ENTITIES[n.toLowerCase()] !== undefined ? NAMED_ENTITIES[n.toLowerCase()] : m));
}
const decodeRecord = (r) => Object.assign({}, r, {
  name: decodeEntities(r.name),
  address: decodeEntities(r.address),
});

/* ============================================================================
 * 3. 住所のキー
 * ========================================================================== */

/* ★ 住所キーは**番地が取れているものだけ**に作る。
 *
 * 番地の無い住所（`千葉県南房総市富浦町多田良`）でキーを作ると、
 * **同じ大字にある別施設が全部1件に潰れる**（多田良北浜海岸 と 大房岬 が寄った。§19-6 の過剰合流）。
 * 大字までしか無いものは、住所では寄せない。 */
const hasBanchi = (address) => !!address && /[0-9０-９]/.test(address);

/** 素の住所キー（末尾の施設名まで含んだまま） */
function rawKey(address) {
  if (!hasBanchi(address)) return null;
  const p = splitAddress(address);
  if (!p || !p.city) return null;
  const norm = String(p.normalized || address).replace(/\s+/g, '');
  if (!norm) return null;
  return canonMuni(p.city) + '|' + norm;
}

/** 施設名を剥がした住所キー。**`banchiKey` が番地で切るので、末尾の施設名は落ちる** */
function bareKey(address) {
  if (!hasBanchi(address)) return null;
  const p = splitAddress(address);
  if (!p || !p.city) return null;
  const b = banchiKey(address);
  if (!b || !/[0-9０-９]/.test(b)) return null;
  return canonMuni(p.city) + '|' + b;
}

/** 住所の末尾に施設名等が連結しているか（剥がしで値が変わるか） */
function hasDirtyTail(address) {
  if (!address) return false;
  const p = splitAddress(address);
  const b = banchiKey(address);
  if (!p || !p.tail || !b) return false;
  return p.tail.replace(/\s+/g, '') !== b.replace(/\s+/g, '');
}

/* ============================================================================
 * 4. マージ（Union-Find。**寄せた根拠を全部残す**）
 * ========================================================================== */

function mergeAll(records) {
  const parent = records.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const links = [];
  const union = (a, b, reason, detail) => {
    const ra = find(a), rb = find(b);
    links.push({ a, b, reason, detail, alreadySame: ra === rb });
    if (ra !== rb) parent[rb] = ra;
  };

  const bucket = (keyFn, reason) => {
    const map = new Map();
    records.forEach((r, i) => {
      const k = keyFn(r);
      if (!k) return;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(i);
    });
    for (const entry of map) {
      const k = entry[0], idxs = entry[1];
      if (idxs.length < 2) continue;
      for (let j = 1; j < idxs.length; j++) union(idxs[0], idxs[j], reason, k);
    }
  };

  /* ★ ownUrl を尊重する（§22-6）。**自分の URL を持たない項目の url は
   * 一覧ページの URL なので、同一性の判定に使わない。**使うと二重計上・過剰合流の両方が起きる
   *
   * ★★ キーが空になったら null を返すこと。**接頭辞だけの `'B|'` を返すと、
   * キーが作れなかったレコードが全部1つのバケットに集まって寄る**（初版で実際に起きた。
   * 長南町野営場・根本マリン・原岡海岸・多田良北浜・CIMA・紅葉の家・多田良海岸 の7件が
   * 「施設名剥がし後に一致」で1件に潰れていた）。§22-5 そのもの。 */
  const key = (prefix, v) => (v ? prefix + v : null);
  bucket((r) => (r.ownUrl && r.url ? 'U|' + r.url : null), 'url一致');
  bucket((r) => key('N|', r.name ? sweepNormalizeName(r.name) : null), '名称一致');
  bucket((r) => key('A|', r.address ? rawKey(r.address) : null), '住所+番地一致');
  bucket((r) => key('B|', r.address ? bareKey(r.address) : null), '施設名剥がし後に一致');

  const groups = new Map();
  records.forEach((_, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  });
  return { groups: [...groups.values()], links };
}

/* ============================================================================
 * 5. 実行
 * ========================================================================== */

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|');

async function main() {
  const useCache = !process.argv.includes('--no-cache');
  const outArg = process.argv.find((a) => a.indexOf('--out=') === 0);
  const out = outArg ? outArg.split('=')[1] : path.join(__dirname, 'chiba-merged-2026-08-19.md');

  const L = [];
  const say = (s) => L.push(s === undefined ? '' : s);

  /* ── 5-1. なっぷ ─────────────────────────────────────────── */
  const napAll = loadNap();
  // 県分類の機械照合。**県名だけの軸と、市町村名の軸を分けて出す**
  const prefNameMismatch = napAll.filter((r) => !/^千葉県/.test(r.address || ''));
  const muniMismatch = napAll.filter((r) => {
    const p = r.address ? splitAddress(r.address) : null;
    const city = p && p.city ? canonMuni(p.city) : null;
    return city && !CHIBA_MUNI.has(city);
  });
  const excludedIds = new Set(muniMismatch.map((r) => r.id));
  const napKept = napAll.filter((r) => !excludedIds.has(r.id));
  const excluded = muniMismatch.map((r) => Object.assign({}, r, { excludedReason: 'PREF_MISMATCH' }));

  /* ── 5-2. じゃらん・県台帳 ───────────────────────────────── */
  const remote = await collectRemote(useCache);
  const jalanRecs = [];
  const prefRecs = [];
  for (const g of remote) {
    for (const it of g.r.items) {
      const rec = {
        src: g.kind, muni: g.muni, name: it.name, address: it.address || null,
        url: it.url || null, ownUrl: !!it.ownUrl, lat: null, lng: null,
        sourceLabel: g.r.source.label,
      };
      (g.kind === 'jalan' ? jalanRecs : prefRecs).push(rec);
    }
  }
  // 県台帳は8市町村に同じ定義が配られている。**同じ表を8回読んでいるので1本に畳む**
  const prefUniq = [];
  const prefSeen = new Set();
  for (const r of prefRecs) {
    const k = (sweepNormalizeName(r.name) || r.name) + '|' + (r.address || '');
    if (prefSeen.has(k)) continue;
    prefSeen.add(k);
    prefUniq.push(r);
  }
  const dbRecs = loadDb();

  const recordsRaw = []
    .concat(napKept)
    .concat(jalanRecs)
    .concat(prefUniq)
    .concat(dbRecs);

  /* ★ 判断2（2026-08-19）。**実体参照をローカルにデコードした版を本線にする。**
   * 生の版も同時に走らせて、差分を §1-3 に出す（「過大の可能性」を数字で確定させるため）。 */
  const records = recordsRaw.map(decodeRecord);

  const mergedRaw = mergeAll(recordsRaw);
  const merged = mergeAll(records);
  const groups = merged.groups, links = merged.links;

  // 生の版のグループ ID（配列の並びは両版で同じなので index で突き合わせられる）
  const rawGroupOf = new Array(recordsRaw.length);
  mergedRaw.groups.forEach((idxs, gi) => idxs.forEach((i) => { rawGroupOf[i] = gi; }));
  // デコードで初めて寄った組 = 1つのデコード後グループが、生では複数グループに分かれていたもの
  const newlyMerged = groups
    .map((idxs) => ({ idxs, rawIds: new Set(idxs.map((i) => rawGroupOf[i])) }))
    .filter((g) => g.rawIds.size >= 2);

  /* ── 5-3. 集計 ───────────────────────────────────────────── */
  const groupInfo = groups.map((idxs) => {
    const rs = idxs.map((i) => records[i]);
    const srcs = new Set(rs.map((r) => r.src));
    const withAddr = rs.filter((r) => r.address)[0];
    const p = withAddr ? splitAddress(withAddr.address) : null;
    const city = p && p.city ? canonMuni(p.city) : null;
    const hasCoord = rs.some((r) => r.lat && r.lng);
    const pick = rs.filter((r) => r.src === 'db')[0] || rs.filter((r) => r.src === 'pref')[0] || rs[0];
    return {
      idxs, rs, srcs, city, name: pick.name,
      hasCoord, hasAddr: !!withAddr,
      napClosedMarker: rs.some((r) => r.napClosedMarker),
      names: rs.map((r) => r.src + ':' + r.name),
    };
  });

  const byMuni = {};
  for (const g of groupInfo) {
    const k = g.city || '(市町村不明)';
    byMuni[k] = (byMuni[k] || 0) + 1;
  }

  const only = (s) => groupInfo.filter((g) => g.srcs.size === 1 && g.srcs.has(s)).length;
  const multi = groupInfo.filter((g) => g.srcs.size >= 2);

  /* ── 5-4. md ─────────────────────────────────────────────── */
  const stamp = fs.statSync(NAP_JSON).mtime.toISOString();
  say('# 千葉 母数マージ — 2026-08-19');
  say();
  say('**読み取り専用の集計。`data/campgrounds.json` には1バイトも書いていない。**');
  say('投入・status 変更・座標採用・国土地理院検証は**していない**（母数の確定まで）。');
  say();
  say('| | |');
  say('|---|---|');
  say('| 生成 | ' + BT + 'node scripts/merge-chiba-2026-08-19.js' + BT + (useCache ? '（取得は既存キャッシュ優先）' : '（--no-cache）') + ' |');
  say('| なっぷ収穫ファイル | ' + BT + 'scripts/.nap-harvest/chiba.json' + BT + '（最終更新 ' + stamp + '） |');
  say('| 対象ソース | なっぷ千葉 / じゃらん（登録8市町村）/ 県台帳 / 既存DB |');
  say('| **入れていないソース** | ちば観光ナビ(L2)・南房総市観光協会・君津市公式・木更津市公式。**この総数は「千葉の全部」ではない** |');
  say();

  say('## 1. 段階ごとの件数推移');
  say();
  say('| 段階 | 件数 |');
  say('|---|---:|');
  say('| なっぷ 素 | ' + napAll.length + ' |');
  say('| なっぷ PREF_MISMATCH 除外後 | **' + napKept.length + '**（−' + excluded.length + '） |');
  say('| じゃらん 素（8市町村の合計・市町村間の重複はそのまま） | ' + jalanRecs.length + ' |');
  say('| 県台帳 素（8市町村に同じ表を配っているので延べ） | ' + prefRecs.length + ' |');
  say('| 県台帳 畳んだ後（実体） | **' + prefUniq.length + '** |');
  say('| 既存DB 千葉 | ' + dbRecs.length + ' |');
  say('| **統合前 合計（単純足し算）** | **' + records.length + '** |');
  say('| **統合後ユニーク** | **' + groupInfo.length + '** |');
  say('| 名寄せで消えた件数 | ' + (records.length - groupInfo.length) + ' |');
  say();

  say('## 1-2. ⚠ 件数が飛んでいる箇所 — **じゃらんが 47 件で、指示の 88 件と合わない**');
  say();
  say('指示は「じゃらん88」だったが、**実測は ' + jalanRecs.length + '件。**勝手に埋めずに残す。');
  say();
  say('**取りこぼしではないことは §4 の証拠で示している**（8ソースとも 1ページ目 200 →');
  say('2・3ページ目 404、N+1 探査は **END_404 で新規0件**、詳細ページの打ち切りも **0件**）。');
  say('つまり登録8市町村のじゃらんは**列挙しきったうえで47件。**');
  say();
  say('**88 という数字の出どころを追った。**リポジトリ全体で「88件」は');
  say('`引き継ぎ_2026-08-07.md` の**1か所にしか出てこない**（§22-5）:');
  say();
  say('> 3件とも、出た数字は**それらしく見えた**（52市町村・31件ずつ／88件／UNREACHABLE 28件）。');
  say();
  say('**これは §22-5 が「捨てた測定」として並べている3つの数字のうちの1つ**');
  say('（②＝施設名が全部文字化けした走査）。**採用された測定の値ではない。**');
  say();
  say('考えられる読み替えは2つある。**どちらも今日は確かめていない。**');
  say();
  say('1. **88 は捨てた測定の残骸**で、正しい値は 47。この場合やることは無い');
  say('2. **88 は「千葉全54市町村ぶんのじゃらん」**で、47 は「登録8市町村ぶん」。');
  say('   **母集団が違うだけで、どちらも間違いではない**（§18-7）。');
  say('   ただし全54市町村を測るには**未登録46市町村の JIS コード表が要る**（いま無い）。');
  say('   ソースを46本足す話なので、**今日の集計の中で黙って広げない。**');
  say();
  say('**この md の数字は 47 のほうで通している。**88 に寄せていない。');
  say();
  say('**追記（2026-08-19・判断1）— 「母集団が違うだけ」説は決着不能。47 を採用する。**');
  say('捨てた走査のスクリプトもログも残っていない（`scripts/` に痕跡なし）。');
  say('ただし**独立な測定が1本ある**: `scripts/.audit-jalan-scan.js` が既存 sweep の md 表から');
  say('じゃらん行を引くと、千葉8市町村は 君津15 / 南房総13 / 館山9 / 富津5 / 木更津3 / 鋸南2 / 大多喜0 / 鴨川0 = **47**。');
  say('**今回の実測と一致する。**全54市町村を走査した形跡はどこにも無い。');
  say('**未登録46市町村への拡張は今日やらない**（ソースを46本足す話）。');
  say();

  /* ── 1-3. 実体参照デコードの影響（判断2）─────────────────── */
  const entRaw = recordsRaw.filter((r) => /&#?\w+;/.test(r.name || '') || /&#?\w+;/.test(r.address || ''));
  say('## 1-3. HTML 実体参照のデコードで、統合後ユニークが何件動いたか（判断2）');
  say();
  say('**取得層（`nap-camp-sitemap.js` の `parseDetail()`）は直していない。**');
  say('このマージスクリプトの中だけで実体参照をデコードして、**影響を測った。**');
  say('修正ではなく測定なので、単独コミットの要件には当たらない。');
  say();
  say('| | 統合後ユニーク |');
  say('|---|---:|');
  say('| デコードなし（前回の値） | ' + mergedRaw.groups.length + ' |');
  say('| **デコードあり（この md の本線）** | **' + groups.length + '** |');
  say('| 差 | ' + (mergedRaw.groups.length - groups.length) + ' |');
  say();
  say('実体参照が残っていたレコードは **' + entRaw.length + '件**。');
  if (mergedRaw.groups.length === groups.length) {
    say('**デコードしても統合後ユニークは動かなかった。**');
    say('つまり「' + mergedRaw.groups.length + ' は過大の可能性がある」は**否定された。**');
    // **「相手がいなかった」を言い切る前に数える。**1件でも複数ソースに寄っていれば書き方が変わる
    const entIdx = recordsRaw.map((r, i) => i).filter((i) => /&#?\w+;/.test(recordsRaw[i].name || '') || /&#?\w+;/.test(recordsRaw[i].address || ''));
    const groupOfDec = new Array(records.length);
    groups.forEach((idxs, gi) => idxs.forEach((i) => { groupOfDec[i] = gi; }));
    const entMulti = entIdx.filter((i) => new Set(groups[groupOfDec[i]].map((j) => records[j].src)).size >= 2);
    say('内訳: **' + (entIdx.length - entMulti.length) + '件はなっぷ単独**で、実体参照の有無に関係なく寄せる相手がいない。');
    if (entMulti.length) {
      say('残る **' + entMulti.length + '件**は複数ソースに寄っているが、**寄った根拠は名称ではなく住所+番地**なので');
      say('デコードの有無で結果が変わらない:');
      entMulti.forEach((i) => say('- ' + esc(records[i].name) + ' … `' + esc(records[i].address) + '`'));
    }
    say('**可能性のままにせず数字で潰した。**');
  } else {
    say('**デコードで ' + (mergedRaw.groups.length - groups.length) + ' 件ぶん寄った。**');
    say('前回の「' + mergedRaw.groups.length + ' は過大の可能性がある」は**そのとおりだった**（過大分がこの差）。');
  }
  say();
  say('### デコードで初めて同一になった組 … **' + newlyMerged.length + '件**');
  say();
  if (!newlyMerged.length) say('0件。');
  newlyMerged.forEach((g) => {
    say('- **' + esc(records[g.idxs[0]].name) + '**');
    g.idxs.forEach((i) => say('  - ' + recordsRaw[i].src + ': 生 `' + esc(recordsRaw[i].name) + '` → デコード後 `' + esc(records[i].name) + '`'));
  });
  say();
  say('**本体の `parseDetail()` の修正は据え置き**（単独コミット）。上の差は「直したらこうなる」という測定値。');
  say();

  say('## 2. 県分類の機械照合（なっぷ ' + napAll.length + '件・全件）');
  say();
  say('**sitemap 上の県（' + BT + '/chiba/' + BT + ' 配下＝全件）と、住所の県名を照合した。**');
  say('距離・座標は使っていない。住所の文字列だけ。');
  say();
  say('- **軸①「住所が 千葉県 で始まらない」… 不一致 ' + prefNameMismatch.length + '件。**');
  if (!prefNameMismatch.length) {
    say('  - **0件だった**（照合したこと自体を残す）。');
    say('  - ⚠ **この軸には死角がある。**`CAMPieceかすみがうら` は住所が `千葉県かすみがうら市…` で、');
    say('    **県名は千葉と書いてある。**県名だけ見る限り一致してしまう。だから軸②を足した。');
  } else {
    prefNameMismatch.forEach((r) => say('  - ' + r.id + ' ' + esc(r.name) + ' … ' + esc(r.address)));
  }
  say();
  say('- **軸②「住所の市町村が千葉県の市町村一覧に無い」… 不一致 ' + muniMismatch.length + '件。**');
  if (!muniMismatch.length) say('  - 0件だった。');
  muniMismatch.forEach((r) => say('  - `' + r.id + '` ' + esc(r.name) + ' … ' + esc(r.address) + ' → **PREF_MISMATCH**'));
  say();
  say('市町村一覧は千葉県の54市町村を焼き込んだもの（外の事実）。**合併があれば腐る**ので、');
  say('不一致が出たときは「なっぷが間違い」と決めつけず、まず一覧の鮮度を疑うこと。');
  say();

  say('## 3. 除外したレコード（削除はしていない）');
  say();
  if (!excluded.length) say('なし。');
  else {
    say('| id | 名称 | 住所 | url | excludedReason |');
    say('|---|---|---|---|---|');
    excluded.forEach((r) => say('| ' + r.id + ' | ' + esc(r.name) + ' | ' + esc(r.address) + ' | ' + r.url + ' | `PREF_MISMATCH` |'));
    say();
    say('**レコードは `scripts/.nap-harvest/chiba.json` にそのまま残っている。**');
    say('外したのは千葉の母数からだけで、施設の実在を否定していない。');
  }
  say();

  say('## 4. 取得の証拠（§22-3 — 列挙しきったか）');
  say();
  say('| ソース | status | 一覧ページ | pageCap 判定 | 詳細の打ち切り | 取得件数 |');
  say('|---|---|---|---|---|---:|');
  for (const g of remote) {
    const r = g.r;
    const pages = r.fetched.filter((f) => !f.detail && !f.probe);
    const pc = r.pageCap
      ? r.pageCap.verdict + '（宣言' + r.pageCap.declared + 'p / N+1で新規' + r.pageCap.newItemsOnProbe + '件 / 同集合ページ' + r.pageCap.duplicatePages + '）'
      : '—';
    const db = r.detailBudget
      ? '対象' + r.detailBudget.targets + ' / 取得' + r.detailBudget.fetched + ' / **打ち切り' + r.detailBudget.skipped + '**'
      : '—';
    const label = g.kind === 'jalan' ? 'じゃらん ' + g.muni : '県台帳';
    say('| ' + label + ' | ' + r.status + ' | ' + pages.map((p) => p.status + (p.fromCache ? '(cache)' : '')).join(' ') + ' | ' + pc + ' | ' + db + ' | ' + r.items.length + ' |');
  }
  say();
  const allNotes = [];
  remote.forEach((g) => g.r.notes.forEach((n) => allNotes.push('- **' + (g.kind === 'jalan' ? 'じゃらん ' + g.muni : '県台帳') + '**: ' + n)));
  if (allNotes.length) {
    say('### notes（全部出す。要約しない）');
    say();
    allNotes.forEach((n) => say(n));
    say();
  }
  const allFetched = [].concat.apply([], remote.map((g) => g.r.fetched));
  const nonCache = allFetched.filter((f) => !f.fromCache);
  say('実ネットワーク取得 ' + nonCache.length + ' 本 / キャッシュ ' + (allFetched.length - nonCache.length) + ' 本。');
  say();
  say('なっぷ側の証拠は STEP 1 で取った: sitemap の千葉 **342件**と収穫 **342件**が ID 集合で完全一致');
  say('（残り0・余り0・取得率100.0%・HTTP は全件 200）。`listIds()` を本体から呼んで実測。');
  say();

  say('## 5. 名寄せで同一と見なした組（全部出す）');
  say();
  const realLinks = links.filter((l) => !l.alreadySame);
  say('寄せた回数 **' + realLinks.length + '**（すでに同一グループだった重複判定 ' + (links.length - realLinks.length) + ' 回は除く）。');
  say();
  const bareOnly = realLinks.filter((l) => l.reason === '施設名剥がし後に一致');
  say('| # | 根拠 | A | B | キー |');
  say('|---:|---|---|---|---|');
  realLinks.forEach((l, i) => {
    const A = records[l.a], B = records[l.b];
    say('| ' + (i + 1) + ' | ' + l.reason + ' | ' + A.src + ': ' + esc(A.name) + ' | ' + B.src + ': ' + esc(B.name) + ' | ' + esc(String(l.detail).slice(0, 90)) + ' |');
  });
  say();
  say('### うち「施設名を剥がして初めて一致した」組 … **' + bareOnly.length + '件**');
  say();
  say('**住所末尾に施設名が連結している汚れのせいで、素の住所キーでは割れていた組。**');
  if (!bareOnly.length) say('0件。');
  bareOnly.forEach((l) => {
    const A = records[l.a], B = records[l.b];
    say('- ' + A.src + ': ' + esc(A.name) + ' `' + esc(A.address) + '` ／ ' + B.src + ': ' + esc(B.name) + ' `' + esc(B.address) + '`');
  });
  say();
  /* ★ 名前が違うのに住所で寄った組。**過剰合流はここに出る**（§19-6） */
  const nameDisagree = groupInfo.filter((g) => {
    const norms = new Set(g.rs.map((r) => sweepNormalizeName(r.name) || r.name));
    return g.rs.length >= 2 && norms.size >= 2;
  });
  say('### ★ 名前が一致していないのに住所で寄った組 … **' + nameDisagree.length + '件**（要確認）');
  say();
  say('**同じ番地に別の施設が2つある場合と、施設が代替わりした場合が、ここでは区別できない。**');
  say('自動では決まらないので**人が1件ずつ見る**。今日は寄せたまま出している（黙って落としても、黙って割っても嘘になる）。');
  say();
  nameDisagree.forEach((g) => {
    say('- **' + esc(g.name) + '** （' + (g.city || '—') + '）');
    g.rs.forEach((r) => say('  - ' + r.src + ': ' + esc(r.name) + ' … `' + esc(r.address) + '`'));
  });
  say();

  const dirty = records.filter((r) => hasDirtyTail(r.address));
  say('住所末尾に施設名等が連結しているレコードは全体で **' + dirty.length + '件**（うち なっぷ ' + dirty.filter((r) => r.src === 'nap').length + '件）。');
  say('**`splitAddress` は今日は直さない。**剥がしはこの集計スクリプト内のローカル処理。');
  say();

  /* ★ なっぷの name/address に HTML 実体参照がそのまま残っている（本体の欠陥。今日は直さない） */
  say('### ★ HTML 実体参照が復号されずに残っているレコード … **' + entRaw.length + '件**');
  say();
  say('`nap-camp-sitemap.js` の `parseDetail()` は `<title>` から名前を取るが、**実体参照を復号していない。**');
  say('`&amp;` と `&` が別文字になるので、**名寄せのキーが割れうる**（`CAMP&amp;SAUNA` と `CAMP&SAUNA`）。');
  say('**本体は今日直さない**（取得層の変更になるので単独コミット）。');
  say('**このマージではローカルにデコードして本線にしてある**（影響の実測は §1-3）。');
  say();
  entRaw.forEach((r) => say('- `' + r.id + '` 生 `' + esc(r.name) + '` … `' + esc(r.address) + '`'));
  say();

  say('## 6. 市町村別の件数（統合後・多い順）');
  say();
  say('| 市町村 | 件数 |');
  say('|---|---:|');
  Object.keys(byMuni).map((k) => [k, byMuni[k]]).sort((a, b) => b[1] - a[1]).forEach((e) => say('| ' + e[0] + ' | ' + e[1] + ' |'));
  say();
  say('**注記: 袖ケ浦市／袖ヶ浦市 は同一バケットとして数えた**（`袖ケ浦市` に寄せた）。');
  say('寄せは**この集計スクリプト内のローカル処理**で、`VARIANT_CHARS` も `normalizeName` も触っていない。');
  const sode = records.filter((r) => /袖[ケヶ]浦市/.test(r.address || ''));
  sode.forEach((r) => say('- ' + r.src + ': ' + esc(r.name) + ' … `' + esc(r.address) + '`'));
  say();

  say('## 7. 座標・住所の充足（統合後）');
  say();
  const coordN = groupInfo.filter((g) => g.hasCoord).length;
  const addrOnly = groupInfo.filter((g) => !g.hasCoord && g.hasAddr).length;
  const neither = groupInfo.filter((g) => !g.hasCoord && !g.hasAddr);
  say('| | 件数 |');
  say('|---|---:|');
  say('| 座標候補が取れた | ' + coordN + ' |');
  say('| 住所だけ（座標候補なし） | ' + addrOnly + ' |');
  say('| どちらも無い | ' + neither.length + ' |');
  say();
  say('**⚠ 座標は全部「なっぷ（予約サイト）の候補値」。採用値ではない。**');
  say('国土地理院の検証を通ったものだけ当てる。今日は検証していない（母数の確定が先）。');
  if (neither.length) {
    say();
    say('どちらも無いもの:');
    neither.forEach((g) => say('- ' + [...g.srcs].join('+') + ': ' + esc(g.name)));
  }
  say();

  say('## 8. ソース別の内訳（統合後）');
  say();
  say('| 区分 | 件数 |');
  say('|---|---:|');
  say('| なっぷのみ | ' + only('nap') + ' |');
  say('| じゃらんのみ | ' + only('jalan') + ' |');
  say('| 県台帳のみ | ' + only('pref') + ' |');
  say('| 既存DBのみ | ' + only('db') + ' |');
  say('| **複数ソースで裏が取れた** | **' + multi.length + '** |');
  say();
  const comboCount = {};
  multi.forEach((g) => {
    const k = [...g.srcs].sort().join('+');
    comboCount[k] = (comboCount[k] || 0) + 1;
  });
  say('複数ソースの組み合わせ内訳:');
  say();
  say('| 組み合わせ | 件数 |');
  say('|---|---:|');
  Object.keys(comboCount).map((k) => [k, comboCount[k]]).sort((a, b) => b[1] - a[1]).forEach((e) => say('| ' + e[0] + ' | ' + e[1] + ' |'));
  say();
  say('### 複数ソースで裏が取れたもの（全件）');
  say();
  say('| 名称 | ソース | 市町村 |');
  say('|---|---|---|');
  multi.forEach((g) => say('| ' + esc(g.name) + ' | ' + [...g.srcs].sort().join('+') + ' | ' + (g.city || '—') + ' |'));
  say();

  say('## 9. なっぷの閉鎖表記（メタのみ）');
  say();
  const closed = groupInfo.filter((g) => g.napClosedMarker);
  say('`napClosedMarker: true` … **' + closed.length + '件。**');
  say('**これは closed 判定の根拠ではない。**なっぷの一覧上の表記であって一次情報ではない。');
  say('`status` には一切反映していない。');
  say();
  closed.forEach((g) => say('- ' + esc(g.name)));
  say();

  /* ── 10. active の見立て ───────────────────────────────────
   * **外挿であって予測ではない。**標本は36件で、しかも無作為抽出ではない。 */
  const RATE = { A: 0.19, B: 0.44, C: 0.31, X: 0.06 };
  const SAMPLE_N = 36;
  const SAMPLE = { A: 7, B: 16, C: 11, X: 2 };   // 36 に率を当てた実数（合計36）
  const live = groupInfo.filter((g) => !g.napClosedMarker && !g.srcs.has('db'));
  const liveMulti = live.filter((g) => g.srcs.size >= 2);
  const bases = [
    ['統合後ユニーク（全部）', groupInfo.length],
    ['閉鎖表記なし・未投入', live.length],
    ['同 かつ複数ソースで裏が取れた', liveMulti.length],
  ];

  say('## 10. active の見立て（★ 外挿であって予測ではない）');
  say();
  say('既存 precheck **' + SAMPLE_N + '件**の実績 A ' + (RATE.A * 100) + '% / B ' + (RATE.B * 100) + '% / C ' + (RATE.C * 100) + '% / X ' + (RATE.X * 100) + '%');
  say('（実数に直すと A' + SAMPLE.A + ' / B' + SAMPLE.B + ' / C' + SAMPLE.C + ' / X' + SAMPLE.X + '）を、新しい母数に当てた。');
  say();
  say('| 当てる母数 | 件数 | A相当 | B相当 | C相当 | X相当 | **A + Bの料金を全部埋めた場合** |');
  say('|---|---:|---:|---:|---:|---:|---:|');
  bases.forEach((b) => {
    const n = b[1];
    say('| ' + b[0] + ' | ' + n + ' | ' + (n * RATE.A).toFixed(0) + ' | ' + (n * RATE.B).toFixed(0)
      + ' | ' + (n * RATE.C).toFixed(0) + ' | ' + (n * RATE.X).toFixed(0)
      + ' | **' + (n * (RATE.A + RATE.B)).toFixed(0) + '** |');
  });
  say();
  say('### ★ この率をそのまま当ててよいか — **当ててよくない。3つ理由がある**');
  say();
  say('**1. 標本が無作為抽出ではない。**' + SAMPLE_N + '件は Manus 由来の候補一覧と precheck を通ったもので、');
  say('**「実在しそうで料金が出そうなもの」に人が絞り込んだ後の集合。**');
  say('いま当てている母数は**なっぷの sitemap 全件**で、絞り込みが1回も入っていない。');
  say('**選択バイアスは A を過大に見積もる方向に効く。**上の表の A 相当は上限側の数字と読むこと。');
  say();
  // Wilson の95%信頼区間。**丸めた率を書き写さず、標本の実数から毎回計算する**
  const wilson = (k, n) => {
    const z = 1.959964, p = k / n, d = 1 + (z * z) / n;
    const c = (p + (z * z) / (2 * n)) / d;
    const h = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [Math.max(0, c - h), Math.min(1, c + h)];
  };
  const ciA = wilson(SAMPLE.A, SAMPLE_N), ciB = wilson(SAMPLE.B, SAMPLE_N);
  const pct = (x) => (x * 100).toFixed(1) + '%';
  say('**2. 標本が小さい。**A は ' + SAMPLE.A + '/' + SAMPLE_N + ' 件。二項の95%信頼区間（Wilson）は **'
    + pct(ciA[0]) + ' 〜 ' + pct(ciA[1]) + '**。');
  say('閉鎖表記なし・未投入 ' + live.length + '件に当てると **A相当は '
    + Math.round(live.length * ciA[0]) + '件 〜 ' + Math.round(live.length * ciA[1]) + '件**の幅になる。');
  say('B（' + SAMPLE.B + '/' + SAMPLE_N + '）も **' + pct(ciB[0]) + ' 〜 ' + pct(ciB[1]) + '** で、'
    + live.length + '件なら **' + Math.round(live.length * ciB[0]) + '件 〜 ' + Math.round(live.length * ciB[1]) + '件**。');
  say('**点推定の1つの数字を計画の前提にできる精度ではない。**');
  say();
  say('**3. 母数の性格が違う。**' + SAMPLE_N + '件は8市町村ぶんの候補で、');
  say('いまの母数は**47市町村にまたがる県全域**。じゃらん・県台帳が見ていない市町村が大半で、');
  say('**裏を取る手段そのものが薄い**（なっぷのみ ' + only('nap') + '件）。');
  say('C（料金も実在も追えない）の比率は**上がる方向**に効くはず。');
  say();
  say('### 率が比較的当てやすい唯一の部分集合');
  say();
  say('**複数ソースで裏が取れた ' + liveMulti.length + '件**（閉鎖表記なし・未投入）。');
  say('性格が precheck の候補一覧にいちばん近い。ここに当てると **A相当 ' + (liveMulti.length * RATE.A).toFixed(0)
    + '件 / A+B ' + (liveMulti.length * (RATE.A + RATE.B)).toFixed(0) + '件**。');
  say('**偶然だが標本36件とほぼ同じ規模なので、率を当てても情報がほとんど増えない。**');
  say('つまり「母数が3倍以上になったから active 30件が見えてきた」とは、この数字からは言えない。');
  say();
  say('### active 30件に届くか — **今日の時点では届かない**');
  say();
  const dbPv = dbRecs.filter((r) => r.priceVerified).length;
  const dbActive = dbRecs.filter((r) => r.dbStatus === 'active').length;
  say('active の条件は変えていない: **実在確認 + priceVerified + スコア5軸に根拠。**');
  say('暫定値（全軸3）のままの昇格は禁止。');
  say();
  say('| | 件数 |');
  say('|---|---:|');
  say('| 千葉の既存レコード | ' + dbRecs.length + ' |');
  say('| うち `status: active` | **' + dbActive + '** |');
  say('| うち `priceVerified: true` | ' + dbPv + ' |');
  say('| 今回の母数のうち、料金の一次情報を取ったもの | **0**（このスクリプトは料金を1件も見ていない） |');
  say('| 今回の母数のうち、スコア5軸に根拠があるもの | **0**（同上） |');
  say();
  say('**母数が ' + groupInfo.length + '件になったことは、active が増えたことを意味しない。**');
  say('増えたのは「これから実在と料金を確かめる対象の数」であって、確かめ終わった数ではない。');
  say('上の A相当・B相当は**作業量の見積もり**として使える数字で、**active の予定数ではない。**');
  say('**届かなければ「まだ出さない」でいい。**');
  say();

  fs.writeFileSync(out, L.join('\n') + '\n', 'utf8');
  console.log('書き出し: ' + out);
  console.log('統合後ユニーク ' + groupInfo.length + ' 件 / 統合前 ' + records.length + ' 件 / 除外 ' + excluded.length + ' 件');

  fs.writeFileSync(out.replace(/\.md$/, '.json'), JSON.stringify({
    stages: {
      napRaw: napAll.length, napKept: napKept.length, excluded: excluded.length,
      jalanRaw: jalanRecs.length, prefRaw: prefRecs.length, prefUniq: prefUniq.length,
      db: dbRecs.length, sumBefore: records.length, uniqAfter: groupInfo.length,
    },
    byMuni,
    sourceOnly: { nap: only('nap'), jalan: only('jalan'), pref: only('pref'), db: only('db'), multi: multi.length },
    coords: { has: coordN, addrOnly, neither: neither.length },
    groups: groupInfo.map((g) => ({
      name: g.name, city: g.city, srcs: [...g.srcs].sort(),
      hasCoord: g.hasCoord, hasAddr: g.hasAddr, napClosedMarker: g.napClosedMarker, names: g.names,
    })),
    excluded: excluded.map((r) => ({ id: r.id, name: r.name, address: r.address, url: r.url, excludedReason: 'PREF_MISMATCH' })),
  }, null, 2), 'utf8');
}

main().catch((e) => { console.error(e); process.exit(1); });
