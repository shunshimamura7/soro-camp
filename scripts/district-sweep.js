/**
 * 地区スイープ。**「実在するがデータに無いキャンプ場」を探す。**
 *
 * これまでの検査は全部「データにあるものが実在するか」しか見ていない。
 * 掲載漏れはレコードが無いので、レコードを起点にする検査には**原理的に一件も出ない**。
 * 牧野で起きていたのはその型で（引き継ぎ §6-17）、
 * 掲載2件が確認できず・実在2件が載っていない、という完全な入れ替わりだった。
 *
 * そこで**実在側を先に作って、データ側と双方向に突き合わせる。**
 *
 *   node scripts/district-sweep.js --district "相模原市緑区牧野"
 *   node scripts/district-sweep.js --all          # needsVerify 14件の所在地区をまとめて
 *   node scripts/district-sweep.js --district "..." --no-cache
 *   node scripts/district-sweep.js --list-districts
 *
 *   → scripts/sweep-<地区>.md（地区ごとに1本。既存があれば上書き）
 *
 * ## 絶対にしないこと
 *
 *   - **data/campgrounds.json を書き換えない。**このスクリプトに書き込み口は無い。
 *     反映は人が中身を見てから、別の apply-*.js で行う
 *   - **ORPHAN を根拠に status を変えない。**§6-7 のとおり
 *     「自治体の一覧に無い＝存在しない」は成り立たない。ソース不在は不在の証明ではない。
 *     反例が実際に2件あった（`sessokyo-camp` は2023年開業で町の一覧が追いついていない、
 *     `doshi-mori-cottage` は村役場の32件に無いが村観光協会に専用ページがある）
 *   - **Google Places API を使わない。**キャッシュ規約でデータに保存できない
 *   - **取得先に負荷をかけない。**同一オリジンへは1秒以上あける。robots.txt の
 *     Crawl-delay がそれより長ければそちらに従う（なっぷは 30 秒）。
 *     Disallow のパスは取りに行かず SKIPPED_ROBOTS として記録する
 *
 * ## 層（layer）— 何のために分けているか
 *
 *   L1  一次   自治体公式・観光協会・都道府県オープンデータ
 *   L2  予約   なっぷ / じゃらん / TAKIBI / hinata の市区町村ページ
 *   L3  集約   キャンプ場検索サイト
 *
 * **L3 同士は互いに転載しているので、何件重なっても独立性は上がらない。**
 * だから confidence は件数ではなく層で決める。
 *
 *   HIGH   L1 に1件でもある
 *   MID    L1 に無く、L2 が2件以上
 *   LOW    それ以外（L2 が1件だけ、または L3 のみ）
 *
 * ## 分類
 *
 *   MISSING   実在側にあるが data/campgrounds.json に無い（**この検査の目的**）
 *   ORPHAN    データにあるが、どのソースにも出てこない（**弱い手がかり。証拠ではない**）
 *   IN_DATA   両方にある
 *
 * ## この検査の限界（md にも同じものを書き出す）
 *
 *   - **OSM は使わない。**牧野周辺の bbox で camp_site は1件しか無く、
 *     本命の2件（亀見橋バカンス村・藤野芸術の家）はどちらも入っていなかった
 *   - **全ソースが同じ元ネタを写している可能性は消せない。**
 *     confidence は独立性の代理指標にすぎない。L1 だから独立、ではない
 *   - **住所を持たないソースがある**（なっぷ・じゃらんの一覧、ウォーカープラス）。
 *     名前しか出ないソースは「他ソースの施設を裏付ける」ことしかできず、
 *     単独で MISSING を立てられない。裏付けの取れない候補は住所を個別に取りに行くが、
 *     取得件数に上限があるので**打ち切った分は md に件数を書く**
 *   - **フラグが立たないことを根拠に使わない。**`check-official-urls.js` と同じ扱い。
 *     MISSING が0件でも「掲載漏れが無い」ことにはならない
 */
const fs = require('fs');
const path = require('path');
const { normalizeName, namesMatch } = require('./name-match');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'campgrounds.json');
const CACHE_DIR = path.join(__dirname, '.sweep-cache');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MIN_INTERVAL_MS = 1000;   // 同一オリジンへの最小間隔。robots の Crawl-delay が長ければそちら
const TIMEOUT_MS = 20000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DETAIL_LIMIT = 45; // 住所を取りに行く詳細ページの上限（1ソースあたり）

/* ---- 429（レート制限）の扱い ------------------------------------------------
 *
 * **429 と 404 を同じ「取れなかった」に潰さないこと。意味が逆。**
 *
 *   404          … そこに無い。再試行しても無駄
 *   429          … あとで取れる。**測っていないだけ**で、結果は不完全
 *
 * 2026-08-15 の全市町村スイープで、じゃらんへのリクエストが延べ1,000件を超えた結果
 * **後半の市町村（松田町・静岡市葵区）が1ページ目から 429 を食い、`UNREACHABLE` になった。**
 * `UNREACHABLE:0件` は「そのソースには無かった」と読めてしまうし、
 * **同じスクリプトを同じ日に走らせても、順番が違えば結果が変わる**（再現性が無い）。
 */
const RATE_LIMIT_MAX_ATTEMPTS = 3;      // 初回を含めた試行回数。3回とも429なら RATE_LIMITED
const RATE_LIMIT_BASE_BACKOFF_MS = 2000; // 指数バックオフの基準（2秒 → 4秒）
const RATE_LIMIT_MAX_BACKOFF_MS = 60000; // Retry-After が長すぎるときの上限
const ORIGIN_PENALTY_START_MS = 3000;    // 429 を1度食ったオリジンに足す間隔
const ORIGIN_PENALTY_MAX_MS = 30000;

const originPenalty = new Map();  // origin → 追加の間隔（429 を食うたびに倍にする）

/**
 * 429 対策（ソース単位の間隔延長・再試行・オリジンのペナルティ）を**切る**ためのスイッチ。
 *
 * **切れないと「429 が出なかった」の意味が確かめられない。**対策が効いたのか、
 * その日そもそも 429 が出ないのかを区別するには、**同じ条件で対策だけ外した1回**が要る
 * （静かな結果を「直った」と読むのが一番危ない。§18-3）。
 *
 * **robots.txt の Crawl-delay はこのスイッチでは切れない。**礼儀の下限であって対策ではない。
 */
let rateGuard = true;

/** テスト用に fetch を差し替える。**本体からは使わない**（`_internal.setFetchImpl`） */
let fetchImpl = (...a) => fetch(...a);

/* ============================================================================
 * 1. 取得層（robots.txt・オリジンごとの間隔・ディスクキャッシュ）
 * ========================================================================== */

const robotsCache = new Map();  // origin → { rules: [{allow, path}], crawlDelayMs }
const lastHit = new Map();      // origin → timestamp
const originChain = new Map();  // origin → Promise（オリジンごとに直列化する）

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * robots.txt の `User-agent: *` グループだけを読む。
 * Allow / Disallow は前方一致、`*` と `$` のみ対応（実運用ではこれで足りる）。
 */
function parseRobots(txt) {
  const rules = [];
  let crawlDelayMs = 0;
  let inStar = false;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') {
      inStar = val === '*';
      continue;
    }
    if (!inStar) continue;
    if (key === 'disallow' && val) rules.push({ allow: false, path: val });
    else if (key === 'allow' && val) rules.push({ allow: true, path: val });
    else if (key === 'crawl-delay') {
      const n = Number(val);
      if (Number.isFinite(n)) crawlDelayMs = n * 1000;
    }
  }
  return { rules, crawlDelayMs };
}

function robotsPathAllowed(rules, pathname) {
  // 最長一致のルールが勝つ（robots.txt の一般的な解釈）
  let best = null;
  for (const r of rules) {
    const re = new RegExp(
      '^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')
    );
    if (re.test(pathname) && (!best || r.path.length > best.path.length)) best = r;
  }
  return best ? best.allow : true;
}

async function getRobots(origin) {
  if (robotsCache.has(origin)) return robotsCache.get(origin);
  let parsed = { rules: [], crawlDelayMs: 0 };
  try {
    const res = await fetchImpl(origin + '/robots.txt', {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // robots.txt が無い（404）なら制限なしとして扱う
    if (res.ok) parsed = parseRobots(await res.text());
  } catch {
    // 取れないときは「制限なし」ではなく「間隔だけ厚めに」倒す
    parsed = { rules: [], crawlDelayMs: 2000 };
  }
  robotsCache.set(origin, parsed);
  return parsed;
}

function cachePath(url) {
  const key = Buffer.from(url).toString('base64url').slice(0, 120);
  return path.join(CACHE_DIR, key + '.json');
}

function readCache(url, useCache) {
  if (!useCache) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(url), 'utf8'));
    if (Date.now() - raw.ts > CACHE_TTL_MS) return null;
    return raw;
  } catch {
    return null;
  }
}

function writeCache(url, entry) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath(url), JSON.stringify(entry));
  } catch {
    /* キャッシュは書けなくても本体は動く */
  }
}

/**
 * 429 を1度食ったオリジンは、**そのソースの残りも自動で遅くする。**
 * 全市町村版で後半だけが 429 を食う（＝結果が実行順に依存する）のを減らすため。
 */
function bumpPenalty(origin) {
  const cur = originPenalty.get(origin) || 0;
  originPenalty.set(origin, Math.min(cur ? cur * 2 : ORIGIN_PENALTY_START_MS, ORIGIN_PENALTY_MAX_MS));
}

/**
 * 次の再試行までの待ち。**`Retry-After` があれば必ずそちらに従う**（秒数・HTTP-date の両方）。
 * 無ければ指数バックオフ（2秒 → 4秒）。サーバが極端に長い値を返したときのために上限を置く。
 */
function backoffMs(res, attempt) {
  const ra = res.headers && res.headers.get && res.headers.get('retry-after');
  if (ra) {
    const sec = Number(ra);
    if (Number.isFinite(sec) && sec >= 0) return Math.min(sec * 1000, RATE_LIMIT_MAX_BACKOFF_MS);
    const at = Date.parse(ra);
    if (!Number.isNaN(at)) return Math.min(Math.max(0, at - Date.now()), RATE_LIMIT_MAX_BACKOFF_MS);
  }
  return Math.min(RATE_LIMIT_BASE_BACKOFF_MS * 2 ** (attempt - 1), RATE_LIMIT_MAX_BACKOFF_MS);
}

/**
 * オリジンごとに直列化して取得する。戻りは { ok, status, body, url, note, attempts }。
 *
 * `note` は取れなかった理由を**分けて**持つ。
 *
 *   `''`             … 取れた
 *   `HTTP_404` ほか  … そこに無い（再試行しない）
 *   `RATE_LIMITED`   … 429 を最大 RATE_LIMIT_MAX_ATTEMPTS 回まで再試行しても取れなかった。
 *                      **「無い」ではなく「測れていない」。**結果は不完全
 *   `UNREACHABLE: …` … DNS・接続・タイムアウト
 *   `SKIPPED_ROBOTS` … robots.txt で止めた
 *
 * Shift_JIS のサイト（じゃらん）があるので Content-Type の charset を見る。
 */
async function fetchPage(url, opts = {}) {
  const { useCache = true, extraDelayMs = 0 } = opts;
  const cached = readCache(url, useCache);
  if (cached) return { ...cached, fromCache: true };

  const u = new URL(url);
  const origin = u.origin;
  const robots = await getRobots(origin);
  if (!robotsPathAllowed(robots.rules, u.pathname + u.search)) {
    const entry = { ok: false, status: 0, body: '', url, note: 'SKIPPED_ROBOTS', ts: Date.now() };
    return entry; // robots で止めたものはキャッシュしない（robots が変わることがある）
  }

  const prev = originChain.get(origin) || Promise.resolve();
  const task = prev.then(async () => {
    let last = null;
    const maxAttempts = rateGuard ? RATE_LIMIT_MAX_ATTEMPTS : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // **間隔は毎回計算し直す。**429 を食うとこのオリジンのペナルティが上がるので、
      // 同じソースの残りのリクエストが自動で遅くなる。robots の Crawl-delay があれば必ずそちらが優先。
      // `rateGuard` を切ると、ソース単位の上乗せとペナルティだけが外れる（Crawl-delay は残る）
      const interval = Math.max(
        MIN_INTERVAL_MS,
        robots.crawlDelayMs,
        rateGuard ? extraDelayMs : 0,
        rateGuard ? (originPenalty.get(origin) || 0) : 0
      );
      const wait = interval - (Date.now() - (lastHit.get(origin) || 0));
      if (wait > 0) await sleep(wait);
      lastHit.set(origin, Date.now());
      try {
        const res = await fetchImpl(url, {
          headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8' },
          redirect: 'follow',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const buf = await res.arrayBuffer();
        const ct = res.headers.get('content-type') || '';
        const cm = ct.match(/charset=([\w-]+)/i);
        let body;
        try {
          body = new TextDecoder(cm ? cm[1] : 'utf-8').decode(buf);
        } catch {
          body = Buffer.from(buf).toString('utf8');
        }
        const entry = {
          ok: res.ok,
          status: res.status,
          body,
          url: res.url || url,
          note: res.ok ? '' : (res.status === 429 ? 'RATE_LIMITED' : 'HTTP_' + res.status),
          attempts: attempt,
          ts: Date.now(),
        };
        if (res.ok) {
          writeCache(url, entry);
          return entry;
        }
        // **429 以外は再試行しない。**404 でバックオフを回しても遅くなるだけ
        if (res.status !== 429) return entry;

        if (rateGuard) bumpPenalty(origin);
        last = entry;
        if (attempt < maxAttempts) await sleep(backoffMs(res, attempt));
      } catch (e) {
        // DNS 不能・接続不能・タイムアウト。**取れなかったことを記録する**（無かったことにしない）
        return { ok: false, status: 0, body: '', url, note: 'UNREACHABLE: ' + e.message, attempts: attempt, ts: Date.now() };
      }
    }
    // 全部429。**UNREACHABLE と混ぜない。**「そこに無い」ではなく「測れていない」
    return { ...last, note: 'RATE_LIMITED', attempts: maxAttempts };
  });
  originChain.set(origin, task.then(() => {}, () => {}));
  return task;
}

/* ============================================================================
 * 2. HTML ユーティリティ
 * ========================================================================== */

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", yen: '¥',
};

function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z#0-9]+);/gi, (m, k) => (ENTITIES[k.toLowerCase()] ?? m));
}

/** ルビ（<rt>ふりがな</rt>）は住所の途中に読みを挟むので先に落とす。ミドナビが使っている。 */
function stripTags(html) {
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<rt>[\s\S]*?<\/rt>/gi, '')
      .replace(/<rp>[\s\S]*?<\/rp>/gi, '')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function cleanText(s) {
  return decodeEntities(String(s || '')).replace(/\s+/g, ' ').trim();
}

/**
 * 住所らしき文字列を整える。〒・末尾の注記を落とす。
 *
 * 日本語のあいだの空白も落とす。ミドナビは住所にルビを振っていて、
 * `<rt>` を外すと「相模原市緑区 牧野 4611-1」のように隙間が残る。
 * これを残すと番地の突き合わせが名前より弱くなる。
 */
function tidyAddress(s) {
  let a = cleanText(s).normalize('NFKC');
  a = a.replace(/^〒?\s*\d{3}-?\d{4}\s*/, '');
  a = a.replace(/\s*(?:TEL|Tel|電話|地図|MAP).*$/, '');
  a = a.replace(/(?<=[^\x00-\x7F\d])\s+(?=[^\x00-\x7F\d])/g, '');  // 和字どうしの空白
  a = a.replace(/(?<=[^\x00-\x7F])\s+(?=\d)/g, '');                // 「牧野 4611-1」
  return a.trim();
}

/** JSON-LD（application/ld+json）から LocalBusiness 系のノードを拾う。 */
function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let parsed;
    try {
      parsed = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const stack = Array.isArray(parsed) ? [...parsed] : [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node)) { stack.push(...node); continue; }
      if (node['@graph']) stack.push(node['@graph']);
      if (node.itemListElement) stack.push(node.itemListElement);
      if (node.item) stack.push(node.item);
      if (node.name && node['@type']) out.push(node);
    }
  }
  return out;
}

function jsonLdAddress(node) {
  const a = node.address;
  if (!a) return null;
  if (typeof a === 'string') return tidyAddress(a);
  const parts = [a.addressRegion, a.addressLocality, a.streetAddress].filter(Boolean);
  return parts.length ? tidyAddress(parts.join('')) : null;
}

/* ============================================================================
 * 3. 名寄せ
 *
 * 共通の normalizeName（name-match.js）が全角半角・カタカナひらがな・
 * 「オートキャンプ場/キャンプ場」の除去までやる。**そこは触らない**
 * （duplicate-check.js と audit-names.js が同じ関数に乗っているため）。
 * このスクリプトで足りない分だけ、ここで前後に足す。
 * ========================================================================== */

/** 法人格・肩書き。ソース側にだけ付いていることがある（「株式会社◯◯オートキャンプ場」）。 */
const CORP_WORDS = [
  '株式会社', '有限会社', '合同会社', '一般社団法人', '公益社団法人',
  '一般財団法人', '公益財団法人', '社会福祉法人', '農事組合法人', '協同組合',
  '(株)', '(有)', '（株）', '（有）',
];

/** normalizeName が落とさない一般語。「野営場」は §指示で明示された揺れ。 */
const EXTRA_GENERIC = ['野営', 'オートキャンピングパーク', 'アウトドアフィールド', 'アウトドアパーク'];

/**
 * 異体字・旧字体。**ソースごとに違う字を使う。**
 * 青根で「此の間沢渓流園」（観光協会）と「此の間沢溪流園」（じゃらん）が
 * 同じ番地（青根2510-3）なのに別施設として2件に割れた。
 *
 * 番地が同じでも施設が同じとは限らないので（若柳1634 に PICAさがみ湖 と
 * 相模湖プレジャーフォレストが両方ある）、**番地では寄せない。字で寄せる。**
 */
const VARIANT_CHARS = {
  溪: '渓', 澤: '沢', 瀧: '滝', 嶋: '島', 嶽: '岳', 舘: '館', 濱: '浜', 邊: '辺', 邉: '辺',
  龍: '竜', 圓: '円', 國: '国', 學: '学', 廣: '広', 眞: '真', 惠: '恵', 榮: '栄', 淸: '清',
  齋: '斎', 髙: '高', 﨑: '崎', 峯: '峰', 屋: '屋', 亙: '亘', 假: '仮', 縣: '県', 藏: '蔵',
};

/** 【市営】【公式】などの角括弧は normalizeName が落とすが、装飾記号は残るので落とす。 */
function sweepNormalizeName(s) {
  if (!s) return '';
  let t = String(s).normalize('NFKC').replace(/./gu, ch => VARIANT_CHARS[ch] || ch);
  for (const w of CORP_WORDS) t = t.split(w).join('');
  t = t.replace(/^[【\[(]?(?:市営|町営|村営|県営|国営|公式|PR)[】\])]?/g, '');
  t = normalizeName(t);
  for (const w of EXTRA_GENERIC) t = t.split(normalizeName(w)).join('');
  // 中黒・波ダッシュ・「＆」でつないだ副題は残す（切ると別施設に化ける）
  return t.replace(/[\s"'`]/g, '');
}

/* ============================================================================
 * 4. 住所と地区
 * ========================================================================== */

/**
 * 旧町名 → 現行表記。**アグリゲータほど旧町名で載っている。**
 * 実際 japancamp.jp は「相模原市津久井町青根」「相模原市藤野町名倉」で載せている。
 * これを直さないと、同じ施設が別の地区に落ちて突き合わせが成立しない。
 */
const OLD_MUNI_ALIASES = [
  // 2006-2007 相模原市編入（津久井郡4町村）→ 2010 政令市化で緑区
  [/(?:神奈川県)?津久井郡(?:津久井町|藤野町|相模湖町|城山町)/g, '神奈川県相模原市緑区'],
  [/相模原市(?:津久井町|藤野町|相模湖町|城山町)/g, '相模原市緑区'],
  // 2003 富士河口湖町（河口湖町・勝山村・足和田村）／2006 上九一色村北部
  [/南都留郡(?:河口湖町|勝山村|足和田村)/g, '南都留郡富士河口湖町'],
  // 2005 山梨市（牧丘町・三富村）
  [/東山梨郡牧丘町/g, '山梨市牧丘町'],
  [/東山梨郡三富村/g, '山梨市三富'],
  // 2005 川根本町（本川根町・中川根町）
  [/榛原郡(?:本川根町|中川根町)/g, '榛原郡川根本町'],
  // 2003 南部町（南部町・富沢町）
  [/南巨摩郡富沢町/g, '南巨摩郡南部町'],
  // 2005 牧之原市（榛原町・相良町）
  [/榛原郡(?:榛原町|相良町)/g, '牧之原市'],
  // **ソース側の「町」抜け。**富士河口湖町観光連盟が「南都留郡富士河口湖精進550-127」と
  // 書いていた（キャンプあかいけ）。市町村が取れないとその施設は
  // **どの地区にも載らず、掲載漏れの検査から丸ごと落ちる。**
  [/富士河口湖(?!町)/g, '富士河口湖町'],
];

function applyMuniAliases(addr) {
  let a = addr;
  for (const [re, to] of OLD_MUNI_ALIASES) a = a.replace(re, to);
  return a;
}

/**
 * 住所を 県 / 郡 / 市町村 / 区 / 大字 に割る。
 *
 * 大字は「数字の手前まで」。番地は突き合わせに使わない
 * （§6-16 のとおり番地は捏造されうるので、地区の同定には使えない）。
 */
function splitAddress(addr) {
  if (!addr) return null;
  // **異体字は住所にも当てる（2026-08-15）。**
  // `VARIANT_CHARS` は `sweepNormalizeName`（施設名）にしか当たっていなかったので、
  // **`北杜市武川町柳沢` と `北杜市武川町柳澤` が別の地区キーになっていた**（実測 9件 / 3件）。
  //
  // **当てる場所を `districtKey` ではなく `splitAddress` にした理由:**
  // `districtKey` だけ揃えてもキーの文字列が一致するだけで、`inDistrict` は
  // `splitAddress` が返す `oaza` 同士を比べるので**項目はその地区に入らない**。
  // 見た目だけ直って中身が直らないので、分解の時点で揃える。
  let a = String(addr).normalize('NFKC').replace(/\s+/g, '').replace(/./gu, ch => VARIANT_CHARS[ch] || ch);
  a = a.replace(/^〒?\d{3}-?\d{4}/, '');
  a = applyMuniAliases(a);
  // **都道府県が2回書かれた住所がある**（`山梨県山梨県南都留郡道志村5821-2` など実測5件）。
  // 1回しか剥がさないと、残った県名が郡や市区町村に食い込んで
  // `gun=山梨県南都留郡` `city=山梨県大月市` になり、**どの地区にも入らなくなる。**
  // 先頭から繰り返し剥がす。
  const PREF_RE = /^(北海道|東京都|京都府|大阪府|.{2,3}?県)/;
  let rest = a, pref = null, pm;
  while ((pm = PREF_RE.exec(rest))) {
    if (!pref) pref = pm[1];
    rest = rest.slice(pm[1].length);
  }
  const gun = (rest.match(/^(.{1,6}?郡)/) || [])[1] || null;
  if (gun) rest = rest.slice(gun.length);
  const city = (rest.match(/^(.{1,8}?[市町村])/) || [])[1] || null;
  if (city) rest = rest.slice(city.length);
  const ward = (rest.match(/^(.{1,6}?区)/) || [])[1] || null;
  if (ward) rest = rest.slice(ward.length);
  // 「中川字相馬沢」「中川字小塚」は大字が同じ中川。**字より下は落とす。**
  // 落とさないと同じ大字が別地区に割れて、同じ市町村を何度も取りに行くことになる
  // （白石オートキャンプ場と西丹沢中川ロッヂで実際に割れた）。
  const oaza = ((rest.match(/^([^\d]{1,14})/) || [])[1] || '')
    .replace(/[（(].*$/, '')
    .replace(/字.*$/, '')
    .replace(/(?:地内|地先|先|内)$/, '');
  return { pref, gun, city, ward, oaza, tail: rest, normalized: a };
}

/**
 * 大字＋番地の比較キー。「寄7138番」「寄7138」「寄4380番地1」を同じ形に寄せる。
 *
 * **地区の同定には使わない**（§6-16。番地は捏造されうる）。
 * 使うのは「名前では付かなかった実在側とデータ側を、最後に照合するとき」だけ。
 */
function banchiKey(addr) {
  const p = splitAddress(addr);
  if (!p) return null;
  let t = (p.tail || '').replace(/[（(].*$/, '');
  t = t.replace(/番地?|号|丁目/g, '-').replace(/-{2,}/g, '-');
  const m = t.match(/^([^\d]*)([\d-]+)/);
  if (!m || !m[2]) return null;
  return m[1] + m[2].replace(/-+$/, '');
}

/** 「相模原市緑区牧野」形式の地区キー。県名は付けない（指示の書式に合わせる）。 */
function districtKey(addr) {
  const p = splitAddress(addr);
  if (!p || !p.city) return null;
  return [p.gun || '', p.city, p.ward || '', p.oaza].join('');
}

/** 地区指定文字列を { gun, city, ward, oaza } に割る。県名が付いていても外す。 */
function parseDistrict(str) {
  const p = splitAddress(str);
  if (!p || !p.city) throw new Error(`地区の書式が読めない: ${str}（例: "相模原市緑区牧野"）`);
  return p;
}

/**
 * 住所がその地区に属するか。
 *
 * 市町村が一致し、大字が**どちらかの前方一致**であれば真。
 * 前方一致にしているのは「犬間」と「犬間長嶋公園敷地内」を同じ地区として扱うため。
 * 区は片方に無くても落とさない（旧町名の住所には区が付いていない）。
 */
function inDistrict(addr, d) {
  const p = splitAddress(addr);
  if (!p || !p.city || p.city !== d.city) return false;
  if (p.gun && d.gun && p.gun !== d.gun) return false;
  if (p.ward && d.ward && p.ward !== d.ward) return false;
  if (!d.oaza) return true;
  if (!p.oaza) return false;
  return p.oaza.startsWith(d.oaza) || d.oaza.startsWith(p.oaza);
}

/* ============================================================================
 * 5. ソース登録
 *
 * 層（layer）と取得先を**必ず対にして持つ**。どのソースの何層から来たかを
 * 最後まで落とさないのがこのスクリプトの肝。
 *
 * kind:
 *   'listDetail' 一覧から (名前, 詳細URL) を取り、詳細ページで住所を取る
 *   'listInline' 一覧に名前と住所が両方ある
 *   'nameOnly'   一覧に名前しか無い。裏付け専用（単独で MISSING を立てられない）
 * ========================================================================== */

/**
 * 宿泊施設の一覧に混ざったキャンプ場を、**詳細ページの本文で**見分ける。
 *
 * 最初は名前で切っていたが、それでは「亀見橋バカンス村」「藤野芸術の家」型
 * （名前にキャンプが入らないキャンプ場）が落ちる。実際に牧野の本命2件がこれで、
 * 富士河口湖町小立では L2/L3 に7件出ているのに L1 由来が0件だった。
 *
 * 採用前に実測した:
 *
 *   亀見橋バカンス村（e-sagamihara camp-627） … PASS（キャンプ・テント）
 *   藤野芸術の家（e-sagamihara camp-668）     … PASS（キャンプ・テント）
 *   四季の宿 富士山（fujisan.ne.jp）          … 空振り（正しく落ちる）
 *   富士緑の休暇村（fujisan.ne.jp）           … 空振り
 *
 * ナビゲーションの語を拾う心配があったが、この2サイトでは出なかった。
 * **サイトのヘッダに「キャンプ」リンクがあるサイトに使うと全件通ってしまう。**
 * 新しいソースに付けるときは必ずホテルのページで空振りするか確かめること。
 */
const CAMP_BODY_RE = /(キャンプ|テント|オートサイト|バンガロー|野営)/;

/* ---- 神奈川・相模原市 ------------------------------------------------- */

const SRC_SAGAMIHARA_KANKO = {
  id: 'e-sagamihara',
  layer: 'L1',
  kind: 'listDetail',
  label: '相模原市観光協会 キャンプ場一覧',
  pages: ['https://www.e-sagamihara.com/camp/'],
  list(html) {
    const out = [];
    // <a href=".../camp/camp-627/"> … <h3>バカンス村</h3>
    const chunks = html.split(/<a\s+href="(https:\/\/www\.e-sagamihara\.com\/camp\/camp-\d+\/)"/);
    for (let i = 1; i < chunks.length; i += 2) {
      const url = chunks[i];
      const m = chunks[i + 1].match(/<h3[^>]*>([^<]+)<\/h3>/);
      if (m) out.push({ name: cleanText(m[1]), url });
    }
    return out;
  },
  address(html) {
    const m = html.match(/<dt>\s*住所\s*<\/dt>\s*<dd>([\s\S]*?)<\/dd>/);
    return m ? tidyAddress(stripTags(m[1])) : null;
  },
};

const SRC_SAGAMIHARA_MIDORINAVI = {
  id: 'midori-navi',
  layer: 'L1',
  kind: 'listDetail',
  dropWithoutAddress: true,
  label: '相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ',
  pages: [
    'https://midori.city.sagamihara.kanagawa.jp/category/play/camp/',
    'https://midori.city.sagamihara.kanagawa.jp/category/play/camp/page/2/',
  ],
  list(html) {
    // 記事URLは /YYYY/MM/DD/slug/。サイドバーの新着記事も同じ形なので、
    // 詳細ページに「所在地」表が無いものは address() が null を返して落ちる。
    const urls = [...new Set(
      html.match(/https:\/\/midori\.city\.sagamihara\.kanagawa\.jp\/20\d\d\/\d\d\/\d\d\/[a-z0-9_%-]+\//g) || []
    )];
    return urls.map(url => ({ name: null, url }));
  },
  name(html) {
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    return m ? cleanText(stripTags(m[1])) : null;
  },
  address(html) {
    const m = html.match(/<strong>\s*所在地\s*<\/strong>\s*<\/td>\s*<td>([\s\S]*?)<\/td>/);
    return m ? tidyAddress(stripTags(m[1])) : null;
  },
};

/* ---- L2 予約サイト ----------------------------------------------------- */

/** なっぷ。robots に Crawl-delay: 30 があるので1ページに30秒かかる。一覧に住所は無い。 */
function napCamp(areaSlug, prefSlug) {
  return {
    id: 'nap-camp',
    layer: 'L2',
    kind: 'nameOnly',
    label: `なっぷ ${prefSlug}/${areaSlug}`,
    note: 'robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ',
    pages: [
      `https://www.nap-camp.com/${prefSlug}/${areaSlug}/list`,
      `https://www.nap-camp.com/${prefSlug}/${areaSlug}/list?page=2`,
    ],
    list(html) {
      const out = [];
      const re = /role="link"[^>]*aria-label="([^"]+)"/g;
      let m;
      while ((m = re.exec(html))) out.push({ name: cleanText(m[1]), url: null });
      return out;
    },
  };
}

/**
 * じゃらん観光ガイド。市区町村コードは JIS の5桁 + "0000"。
 * 一覧の JSON-LD に名前と詳細URLが入る（住所は詳細ページ側）。
 *
 * **必ずジャンル `g2_04`（キャンプ・バンガロー・コテージ）に絞る。**
 * 市区町村ページ全体を取ると観光スポットが全ジャンル混ざり、
 * 牧野では和竿美術館・ぶるべの樹・POROSAUNA（バカンス村内のサウナ）が
 * MISSING に並んだ。じゃらんの詳細ページには機械で読めるジャンル表示が無く、
 * 本文にキャンプの語があるかで切ると亀見橋バカンス村と藤野芸術の家を落とす
 * （どちらも本文に語が出ない）。**入口で絞るしかない。**
 *
 * 代償として、g2_04 に入っていないキャンプ場はじゃらんからは出てこない
 * （藤野芸術の家がまさにそれで、L1 でしか拾えていない）。
 */
function jalan(jisCode, label) {
  return {
    id: 'jalan',
    layer: 'L2',
    kind: 'listDetail',
    label: `じゃらん観光ガイド ${label}（cit_${jisCode}0000 / ジャンル キャンプ・バンガロー・コテージ）`,
    pages: [1, 2, 3].map(
      n => `https://www.jalan.net/kankou/cit_${jisCode}0000/g2_04/` + (n === 1 ? '' : `page_${n}/`)
    ),
    pageCapNote: 'ジャンル g2_04 のみ / 一覧は先頭3ページまで',
    // **じゃらんだけ間隔を厚くする（2026-08-15）。ただし効果は未実証。**
    //
    // 2026-08-15 の全市町村スイープで**松田町と静岡市葵区が1ページ目から 429 を食い、
    // `UNREACHABLE:0件` になった**（＝「そのソースには無かった」と読めてしまう）のがきっかけ。
    // **当初「実行順の後半に負荷が集中したせい」と考えたが、これは確かめていない。**
    // その実行の jalan への実リクエストは40数件で、あとから 233件（キャッシュ無し・同じ順）を
    // 流したときは 429 が1件も出ていない。**回数では説明が付いていない。**
    // robots.txt に Crawl-delay の指定があればそちらが優先される（`Math.max`）。
    // 切り分けは `_internal.setRateGuard(false)` で対策だけ外して比べること
    extraDelayMs: 3000,
    list(html) {
      return extractJsonLd(html)
        .filter(n => n.name && typeof n.url === 'string' && /\/kankou\/spt_/.test(n.url))
        .map(n => ({ name: cleanText(n.name), url: n.url.replace(/\\\//g, '/') }));
    },
    address(html) {
      // <th>所在地</th><td> 〒252-0186 神奈川県相模原市緑区牧野12822
      // ページ頭に「所在地を確認する」という別物があるので、表の見出しに限定する
      const m = html.match(
        /<th>\s*所在地\s*<\/th>\s*<td[^>]*>\s*(?:〒?\s*\d{3}-?\d{4}\s*)?((?:北海道|東京都|京都府|大阪府|[^\s<]{2,3}県)[^<\n]{3,50})/
      );
      if (m) return tidyAddress(m[1]);
      const nodes = extractJsonLd(html);
      for (const n of nodes) {
        const a = jsonLdAddress(n);
        if (a) return a;
      }
      return null;
    },
  };
}

/**
 * hinata スポット。詳細ページに「住所」見出しがあり、大字まで入る。
 * areaPath は `kanto/kanagawa/1906` のような地方/県/エリアID。
 * エリアIDは location_sitemap.xml.gz から拾って、各エリアの <title> で対応を取った。
 */
function hinataSpot(areaPath, label) {
  return {
    // id は同じ 'hinata-spot' のまま。1市町村が2エリアにまたがることがあるが
    // （伊東市＝伊東＋伊豆高原）、**同じサイトなので2ソースには数えない**（§6-15）
    id: 'hinata-spot',
    layer: 'L2',
    kind: 'listDetail',
    label: `hinata スポット ${label}（${areaPath}）`,
    pages: [1, 2, 3].map(
      n => `https://camp-spot.hinata.me/${areaPath}/list` + (n === 1 ? '' : `?page=${n}`)
    ),
    pageCapNote: '一覧は先頭3ページまで',
    // **既定45 → 60（2026-08-15）。既定の 45 に理由は書かれていなかった。**
    // 一覧3ページで1エリア最大60件出るので、45 だと**エリアの一覧を全部見ないまま終わる。**
    // 実測の打ち切り: 道志村15件（一覧60）/ 富士宮市13件（一覧58）。60 で両方収まる。
    // camp-spot.hinata.me の robots.txt に Crawl-delay は無いので 1秒間隔で踏む。
    detailLimit: 60,
    list(html) {
      const out = [];
      const re = /<a href="(\/spots\/[a-zA-Z0-9_-]+)"[^>]*>[\s\S]{0,400}?<h2[^>]*>([^<]+)<\/h2>/g;
      let m;
      while ((m = re.exec(html))) {
        out.push({ name: cleanText(m[2]), url: 'https://camp-spot.hinata.me' + m[1] });
      }
      return out;
    },
    address(html) {
      const m = html.match(/>住所<\/h3>[\s\S]{0,300}?<div class="text">([^<]+)<\/div>/);
      return m ? tidyAddress(m[1]) : null;
    },
  };
}

/**
 * TAKIBI。**この環境からは名前解決ができない。**
 * 取れなかったことを md に残すために、外さずに登録しておく
 * （黙って落とすと「そのソースには無かった」と読めてしまう）。
 */
// ⚠ SRC_TAKIBI は廃止した（2026-08-13 の check-muni-sources.js 初走で発覚）。
// `takibi-reservation.space` は DNS ごと消えており、運営自身が
// 「TAKIBI予約サイト サービス終了のお知らせ」を出している
// （https://www.takibi-reservation.style/media/news/138104）。
// もともと list() が空実装のプレースホルダで、sweep には何も寄与していなかった。
// 全 MUNI_SOURCES から外した。復活させるなら別サービスとして登録し直すこと。

/* ---- 神奈川・厚木市 --------------------------------------------------- */

const SRC_ATSUGI_KANKO = {
  id: 'atsugi-kankou',
  layer: 'L1',
  kind: 'listDetail',
  bodyFilter: CAMP_BODY_RE,
  // 一覧のリンクには「よくある質問」「会員紹介」などサイトのページも混ざる。
  // 住所欄が取れないものを落として施設だけにする
  dropWithoutAddress: true,
  label: '厚木市観光協会 あつぎ観光なび 泊まる',
  note: 'ホテル・旅館と同じ一覧。詳細ページの本文にキャンプ関連語があるかで選別している',
  pages: ['https://www.atsugi-kankou.jp/life/6/'],
  list(html) {
    const out = [];
    const re = /<a href="(\/soshiki\/atsugi-ta\/[a-z0-9_-]+\.html)"[^>]*>([^<]{2,40})<\/a>/g;
    let m;
    while ((m = re.exec(html))) {
      out.push({ name: cleanText(m[2]), url: 'https://www.atsugi-kankou.jp' + m[1] });
    }
    return out;
  },
  address(html) {
    // 「住所 〒243-0213 厚木市飯山4955-1」。県名が付かない
    const t = stripTags(html);
    const m = t.match(/住所\s*(?:〒?\s*\d{3}-?\d{4})?\s*([^\s]{2,10}[市町村][^\s]{1,25})/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/* ---- 神奈川・松田町 --------------------------------------------------- */

const SRC_MATSUDA_TOWN = {
  id: 'matsuda-town',
  layer: 'L1',
  kind: 'listDetail',
  label: '松田町公式 観光サイト キャンプ場',
  pages: ['https://town.matsuda.kanagawa.jp/site/kankou-sub/camp.html'],
  list(html) {
    const body = (html.match(/<div class="detail_free"[\s\S]*?<\/div>/) || [''])[0];
    const out = [];
    const re = /<a href="(\/site\/kankou-sub\/[a-z0-9_-]+\.html)"[^>]*>([^<]{2,40})<\/a>/g;
    let m;
    while ((m = re.exec(body))) {
      out.push({ name: cleanText(m[2]), url: 'https://town.matsuda.kanagawa.jp' + m[1] });
    }
    return out;
  },
  address(html) {
    const t = stripTags(html);
    const m = t.match(/住所\s*((?:[^\s]{2,3}県)?[^\s]{2,12}[市町村][^\s]{1,25})/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/* ---- 神奈川・山北町 --------------------------------------------------- */

const SRC_YAMAKITA_TOWN = {
  id: 'yamakita-town',
  layer: 'L1',
  kind: 'nameOnly',
  label: '山北町公式 キャンプ場の紹介',
  note: '施設名・電話・料金の表。**住所欄が無い**ので名前のみ',
  pages: ['https://www.town.yamakita.kanagawa.jp/0000000232.html'],
  list(html) {
    // 表の2列目が施設名のリンク。<td rowspan="6"><a href="...">名前</a></td>
    const out = [];
    const re = /<td rowspan="\d+"><a href="[^"]*"[^>]*>([^<]{2,30})<\/a><\/td>/g;
    let m;
    while ((m = re.exec(html))) out.push({ name: cleanText(m[1]), url: null });
    return out;
  },
};

const SRC_YAMAKITA_KANKO = {
  id: 'yamakita-kankou',
  layer: 'L1',
  kind: 'listDetail',
  label: '山北町観光協会 自然に泊まる',
  note: '町公式とは別ページ・別構造で、町公式は観光協会にリンクしていない。独立した2ソースとして数えている',
  pages: ['https://www.yamakita.net/stay/natural.php'],
  list(html) {
    const out = [];
    const re = /href="(detail\.php\?id=\d+&(?:amp;)?type=\d+)"/g;
    const seen = new Set();
    let m;
    while ((m = re.exec(html))) {
      const u = 'https://www.yamakita.net/stay/' + m[1].replace(/&amp;/g, '&');
      if (!seen.has(u)) { seen.add(u); out.push({ name: null, url: u }); }
    }
    return out;
  },
  name(html) {
    // ページ先頭の <h1> はロゴ画像なので中身が空になる。施設名は box_title の <h2>。
    // <span> にふりがなが入っているので落とす（「白石オートキャンプ場しらいし…」になる）
    const m = html.match(/<div class="box_title">\s*<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (!m) return null;
    return cleanText(stripTags(m[1].replace(/<span>[\s\S]*?<\/span>/g, '')));
  },
  address(html) {
    const m = html.match(/<th>\s*住所\s*<\/th>\s*<td>([\s\S]*?)<\/td>/);
    return m ? tidyAddress(stripTags(m[1])) : null;
  },
};

/* ---- 山梨・富士河口湖町 ----------------------------------------------- */

const SRC_FUJIKAWAGUCHIKO = {
  id: 'fujikawaguchiko-renmei',
  layer: 'L1',
  kind: 'listDetail',
  bodyFilter: CAMP_BODY_RE,
  // <h1> から「おすすめスポット」の手前まで。そこから先は他施設の紹介文
  bodyScope(html) {
    const s = html.indexOf('<h1');
    const e = html.indexOf('おすすめスポット');
    return stripTags(html.slice(s < 0 ? 0 : s, e > s ? e : undefined));
  },
  label: '富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる',
  note: 'ホテル・旅館と同じ一覧。詳細ページの本文にキャンプ関連語があるかで選別している。町公式サイトはこのサイトへ誘導しているだけなので1ソース扱い（§6-15）',
  // 1ページ10件で全25ページ（241件）。3ページで止めると町内のキャンプ場を
  // ほとんど取り逃がす（実際に小立で HIGH が1件も出なかった）。全ページ見る
  pages: Array.from({ length: 25 }, (_, i) =>
    'https://fujisan.ne.jp/sightseeing-category/stay/' + (i === 0 ? '' : `page/${i + 1}/`)
  ),
  // 本文で判定するので、宿泊施設241件すべての詳細を開く必要がある
  detailLimit: 250,
  list(html) {
    const out = [];
    const chunks = html.split(/<a[^>]+href="(https:\/\/fujisan\.ne\.jp\/sightseeing\/\d+\/)"/);
    for (let i = 1; i < chunks.length; i += 2) {
      const m = chunks[i + 1].match(/card-title">([^<]+)<\/p>/);
      if (m) out.push({ name: cleanText(m[1]), url: chunks[i] });
    }
    return out;
  },
  address(html) {
    const t = stripTags(html);
    const m = t.match(/住所\s*(?:〒?\s*\d{3}-?\d{4})?\s*(山梨県[^\s]{4,35})/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/* ---- 静岡・川根本町 --------------------------------------------------- */

const SRC_KAWANEHON = {
  id: 'kawanehon-town',
  layer: 'L1',
  kind: 'listDetail',
  label: '川根本町公式 キャンプ（詳細は川根本町観光協会 okuooi.gr.jp）',
  note:
    '**町公式の一覧は、全件が観光協会 okuooi.gr.jp の詳細ページへ直リンクしている。' +
    '独立した2ソースではないので1ソースとして登録した（§6-15）。**',
  // 観光協会側の住所は「奥泉761-2」のように大字だけなので、市町村を補う
  addressPrefix: '静岡県榛原郡川根本町',
  pages: ['https://www.town.kawanehon.shizuoka.jp/kanko_site/tanoshimu/camp/index.html'],
  list(html) {
    const out = [];
    const re = /<a href="(https:\/\/okuooi\.gr\.jp\/outdoor\/details\.php\?id=\d+)"[^>]*>([^<]{2,40})<\/a>/g;
    let m;
    while ((m = re.exec(html))) out.push({ name: cleanText(m[2]), url: m[1] });
    return out;
  },
  address(html) {
    const t = stripTags(html);
    const m = t.match(/住所[:：]?\s*([^\s]{2,30})/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/* ---- 静岡・富士宮市 --------------------------------------------------- */

/**
 * 富士宮市観光協会。**絞り込みはクエリ `?term=camp` で行う。**
 *
 * 旧 `/spot/` は404。移転先として `/play/camp/` が 200 を返すが、
 * **これは罠で、中身は `/guides/play/`（「遊ぶ」カテゴリ全体）と1バイトも違わない**
 * （どちらも `<h1>遊ぶ</h1>` で dt は同じ57件。実測で完全一致を確認した）。
 * パスに `camp` が入っているのにキャンプで絞られていないので、
 * これを登録するとゴルフ場・博物館・温泉・ハイキングコースが45件混ざる
 * ——`jalan()` の docコメントが「入口で絞るしかない」と書いているのと同じ穴。
 *
 * 実際に効く絞り込みはページ内のタブが使っている `?term=camp` のほうで、
 * こちらは12件に落ちる。**URL のパスではなくクエリを見ること。**
 *
 * 一覧に住所が無く、詳細ページ（/guide/NN/）も住所が定型でないので名前のみ。
 */
const SRC_FUJINOMIYA_KANKO = {
  id: 'fujinomiya-kankou',
  layer: 'L1',
  kind: 'nameOnly',
  label: '富士宮市観光協会 遊ぶ（?term=camp で絞り込み）',
  note: '一覧に住所が無いため名前のみ。`/play/camp/` はカテゴリ全体が返るので使わない',
  pages: ['https://fujinomiya.gr.jp/guides/play/?term=camp'],
  list(html) {
    const out = [];
    const re = /<dt>\s*<a [^>]*href="([^"]*\/guide\/\d+\/)"[^>]*>([^<]{2,60})<\/a>\s*<\/dt>/g;
    let m;
    while ((m = re.exec(html))) out.push({ name: cleanText(m[2]), url: m[1] });
    return out;
  },
};

/**
 * フジヤマNAVI（富士急行運営）。富士宮市 × キャンプの絞り込みが URL で効く。
 * 観光協会の12件に対してこちらは17件で、重なりは半分ほど。**補完として L2 に置く。**
 * コテージ・ホテルが2件混ざる（`伊豆高原コテッジ`・`コテージホテル 大いなる海`）。
 * 一覧に住所が無いので名前のみ。
 */
const SRC_FUJIYAMA_NAVI_FUJINOMIYA = {
  id: 'fujiyama-navi',
  layer: 'L2',
  kind: 'nameOnly',
  label: 'フジヤマNAVI 富士宮市 × キャンプ',
  note: '一覧に住所が無いため名前のみ。コテージ・ホテルが混ざる',
  pages: [
    'https://www.fujiyama-navi.jp/areas/%E5%AF%8C%E5%A3%AB%E5%AE%AE%E5%B8%82/categories/%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97',
  ],
  list(html) {
    const out = [];
    const re = /<a [^>]*ga-event-label="([^"]{2,60})"[^>]*href="(\/spots\/[A-Za-z0-9]+)"/g;
    let m;
    while ((m = re.exec(html))) {
      out.push({ name: cleanText(m[1]), url: 'https://www.fujiyama-navi.jp' + m[2] });
    }
    return out;
  },
};

/* ---- 山梨・道志村 ────────────────────────────────────────────────────
 * 村役場の観光情報サイト。**キャンプ場だけの一覧**で、詳細ページに住所がある。
 * 道志村には大字が無く住所が「道志村＋地番」で完結するので、
 * データ側の12件も全部「道志村」1地区に入る。地区単位の一致率は
 * 他の地区と同じ意味では読めない（md に明記する）。
 */
const SRC_DOSHI_VILLAGE = {
  id: 'doshi-kanko-jp',
  layer: 'L1',
  kind: 'listDetail',
  label: '道志村役場観光情報サイト キャンプ場紹介',
  note: '村内のキャンプ場は数十軒あり、データ側12件との差は大きく出る前提',
  pages: ['https://www.doshi-kanko.jp/camp/'],
  list(html) {
    const out = [];
    const re = /<a href="(?:\.\.\/)?camp\/([a-z0-9_-]+)\/"[^>]*>([^<]{2,30})<\/a>/g;
    const seen = new Set();
    let m;
    while ((m = re.exec(html))) {
      const url = 'https://www.doshi-kanko.jp/camp/' + m[1] + '/';
      if (seen.has(url)) continue;
      seen.add(url);
      out.push({ name: cleanText(m[2]), url });
    }
    return out;
  },
  address(html) {
    const t = stripTags(html);
    const m = t.match(/住所\s*(山梨県[^\s]{4,30})/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/* ---- 山梨・山中湖村 ──────────────────────────────────────────────────
 * 観光協会の「泊まる」一覧。ホテル・ペンションとキャンプ場が混ざるので本文で判定する。
 *
 * **最初は「キャンプ特集」(/feature/camp) を登録して 0/6 の網羅率0%になった。**
 * 原因はデータ側ではなくソース選定の誤りで、特集ページの HTML から取れる
 * リンク11件は全部「山中湖明神山パノラマ台」「石割神社」「遊覧船 白鳥の湖号」
 * といった**周辺の観光スポット**だった。キャンプ場（/reserve/…）は
 * このページの生 HTML には1件も出てこない。
 * **一覧に見えるページが一覧とは限らない。中身を数えて確かめること。**
 *
 * 判定範囲は `<h1>` から「住所」の手前まで。**ページ全体を見てはいけない。**
 * このサイトはナビゲーションに「キャンプ」の語があり、全ページが通ってしまう。
 * 実測: クラフトの里ダラスヴィレッジは落ち、村営山中湖キャンプ場と湖山荘キャンプ場は通った。
 */
const SRC_YAMANAKAKO = {
  id: 'lake-yamanakako',
  layer: 'L1',
  kind: 'listDetail',
  bodyFilter: CAMP_BODY_RE,
  bodyScope(html) {
    const s = html.indexOf('<h1');
    const t = stripTags(html.slice(s < 0 ? 0 : s));
    const e = t.indexOf('住所');
    return e > 0 ? t.slice(0, e) : t.slice(0, 1200);
  },
  dropWithoutAddress: true,
  label: '山中湖観光協会 泊まる',
  // **60 → 250（2026-08-15）。元の 60 に理由は書かれていなかった。**
  // 一覧は宿泊施設の混在一覧で、キャンプ場かどうかは `bodyFilter` が**詳細ページの本文**で
  // 決める。つまり**踏まなかった項目は campOk が付かず、そこで捨てられる**
  // （`uniq.filter(it => it.campOk)`）。b1-1 にも b1-2 にも残らず、どの集計にも出ない。
  // 実測: 詳細対象192件に対し上限60で **132件が未取得のまま消えていた。**
  // `fujikawaguchiko-renmei` が同じ理由で 250 にしてある（「本文で判定するので全件開く必要がある」）
  // のと同じ扱いに揃えた。**負荷は detailLimit ではなく MIN_INTERVAL_MS と robots で見ている**
  // （lake-yamanakako.com の robots.txt に Crawl-delay は無く、1秒間隔が効く）。
  detailLimit: 250,
  pages: [1, 2, 3, 4, 5].map(n => 'https://lake-yamanakako.com/reserve' + (n === 1 ? '' : `?page=${n}`)),
  pageCapNote: '一覧は先頭5ページまで',
  list(html) {
    const urls = [...new Set(html.match(/https:\/\/lake-yamanakako\.com\/(?:spot|reserve)\/\d+/g) || [])];
    return urls.map(url => ({ name: null, url }));
  },
  name(html) {
    const m = html.match(/<title>([^<|]+)/);
    return m ? cleanText(m[1]) : null;
  },
  address(html) {
    const t = stripTags(html);
    const m = t.match(/住所\s*(?:〒?\s*\d{3}-?\d{4})?\s*(山梨県[^\s]{4,30})/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/* ---- 山梨・大月市 ------------------------------------------------------ */

/**
 * 大月市公式「宿泊施設・レジャー施設等の紹介」。
 *
 * **キャンプ場だけの一覧ではない。**1ページに宿泊・キャンプ・釣り・体験の表が並ぶ。
 * キャンプ場の表は「キャンプ場・釣り場」という見出しで、**行の1列目が種別**になっている:
 *
 *   <td>キャンプ場</td><td>金の森山荘</td><td>大月市大月町真木6188</td><td>0554-23-1021</td>
 *   <td>釣り場</td>  <td>奈良子釣りセンター</td> …
 *
 * 1列目で絞らないと釣り場（奈良子釣りセンター）が混ざる。実HTMLで実測して3件。
 * 同じページの宿泊の表は列の並びが違う（名前・住所・電話・エリア）ので、
 * 「キャンプ場」で始まる行だけを見るこの形なら宿泊は拾わない。
 *
 * ## 名前が古い（2026-08-14 時点）
 *
 * 「KAGARIBI Camp Terrace」（賑岡町奥山1473）は **2026-07-01 に
 * `eureka camp village` へ改称してリニューアル済み**（`yamanashi-east-precheck-2026-08.md`）。
 * **市の一覧が追いついていない。**このソースからは旧名で出てくるので、
 * データに入れるときは新名称にして notes に旧名を残すこと。
 * 名寄せは変えない——旧名で出ること自体は誤りではなく、市の一覧の現在値がそうだというだけ。
 */
const SRC_OTSUKI_CITY = {
  id: 'otsuki-city',
  layer: 'L1',
  kind: 'listInline',
  label: '大月市公式 宿泊施設・レジャー施設等の紹介',
  pages: ['https://www.city.otsuki.yamanashi.jp/kanko/shukuhakusisetu.html'],
  list(html) {
    const out = [];
    // 1列目が「キャンプ場」の行だけ。2列目が施設名、3列目が住所
    const re = /<tr>\s*<td[^>]*>\s*キャンプ場\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g;
    let m;
    while ((m = re.exec(html))) {
      const name = cleanText(stripTags(m[1]));
      const address = tidyAddress(stripTags(m[2]));
      if (name) out.push({ name, address: address || null, url: null });
    }
    return out;
  },
};

/* ---- 山梨・上野原市 ---------------------------------------------------- */

/**
 * 上野原市公式「発見うえのはら」の**キャンプ**カテゴリ一覧。
 *
 * ## 見つけ方（次に同じことをする人へ）
 *
 * 入口は sweep の L3 ヒットが出典に出していた `1018585.html`（平野田休養村の詳細）。
 * **詳細ページの1枚上にカテゴリ一覧があった。**`list152-468.html` がそれで、
 * `list152.html`（Enjoy）の下位カテゴリ。市サイトの検索や観光トップからは辿れておらず、
 * 詳細ページのパンくずから上がって初めて見つかった。
 *
 * ## 中身（2026-08-14 実測・4件）
 *
 *   平野田休養村キャンプ場   上野原市西原7293
 *   緑と太陽の丘キャンプ場   上野原市秋山5030番地
 *   ミューの森               上野原市棡原13880
 *   CALM MOUNTAIN AKIYAMA（旧アオゲラの森キャンプ場）  上野原市秋山12003
 *
 * 4件とも詳細ページに「住所」の行があるので listDetail で住所まで取れる。
 * 一覧の `/site/kankou/\d+.html` リンクはこの4件だけで、ナビは別の形なので混ざらない。
 *
 * ## 「ミューの森」は L2/L3 に出てこなかった
 *
 * じゃらん・なっぷ・キャンナビ・ウォーカープラスのどれにも無く、**この L1 でしか出ない。**
 * L1 を持たない市町村で MISSING が薄く見えるのは、掲載漏れが無いからではないという実例。
 *
 * ### ただし「ミューの森」は投入しない（2026-08-14 判断）
 *
 * **グランピング専門でテント持込が無く、ソロキャンプDBの対象外。**
 * 市公式（`1018584.html`）が「エンターテインメント型**グランピング施設**」と明記していて、
 * テント持込の記載が無い（施設公式 https://www.fantasy.co.jp/mieuxforest/ ）。
 * **MISSING に出続けるが、これは掲載漏れではない。**
 * 次に見た人が候補として拾い直さないよう、ここに理由を書いておく
 * （§6-7 と同じで、MISSING は「入れるべき」の意味ではない）。
 *
 * ## 名前は市の一覧が正とは限らない（が、ここでは市が正しかった）
 *
 * 「CALM MOUNTAIN AKIYAMA」は**市の一覧の表記が正しい**。
 * sweep が `CARM MOUNTAIN AKIYAMA` と出していたのは**じゃらん側の誤記**
 * （`spt_guide000000199751`）で、市一覧の誤りではない。
 * 逆に大月市では市一覧のほうが古い（SRC_OTSUKI_CITY の注記参照）。
 * **どちらが正かはソースの種類では決まらない。施設側で確かめること。**
 */
const SRC_UENOHARA_CITY = {
  id: 'uenohara-city',
  layer: 'L1',
  kind: 'listDetail',
  label: '上野原市公式 発見うえのはら キャンプ',
  pages: ['https://www.city.uenohara.yamanashi.jp/site/kankou/list152-468.html'],
  list(html) {
    const seen = new Map();
    const re = /<a href="(\/site\/kankou\/\d+\.html)"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html))) {
      if (!seen.has(m[1])) seen.set(m[1], cleanText(m[2]));
    }
    return [...seen].map(([p, name]) => ({
      name,
      url: 'https://www.city.uenohara.yamanashi.jp' + p,
    }));
  },
  address(html) {
    const m = html.match(/<th[^>]*>\s*住所\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/**
 * やまなし観光推進機構「大月・都留エリアのおすすめキャンプ場」。
 *
 * ## ページ名を信じない（富士宮の教訓）
 *
 * **タイトルは「大月・都留」だが、中身は大月市 0件・上野原市 0件。**
 * 実HTMLで数えると 道志村20 / 都留市3 / 丹波山村1 の計24件で、
 * この「エリア」は道志村の一覧に大月・都留の名前が付いているだけだった
 * （なっぷも同じ括りで、あちらはエリア名が「大月・都留（道志村）」と正直に書いてある）。
 * **大月市・上野原市にとってこのソースは空。**登録はするが、
 * ここから両市の MISSING は出ないことを承知の上で持つ（0件と未登録は別物なので登録する）。
 *
 * ## nameOnly ではない
 *
 * 一覧に住所は無いが、**各スポットの詳細ページに「住所」の行がある**（実測: 都留市大幡5108）。
 * したがって listDetail として住所まで取れる。裏取り専用の nameOnly より強い。
 */
const SRC_YAMANASHI_KANKO_OTSUKI = {
  id: 'yamanashi-kankou-otsuki',
  layer: 'L2',
  kind: 'listDetail',
  label: 'やまなし観光推進機構 大月・都留エリアのキャンプ場',
  note: '実測の内訳は 道志村20 / 都留市3 / 丹波山村1。大月市・上野原市は0件',
  pages: ['https://www.yamanashi-kankou.jp/special/yamanashicamp/otsuki.html'],
  list(html) {
    const seen = new Map();
    const re = /<a href="(\/kankou\/spot\/p2_\d+\.html)"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html))) {
      if (!seen.has(m[1])) seen.set(m[1], cleanText(m[2]));
    }
    return [...seen].map(([p, name]) => ({ name, url: 'https://www.yamanashi-kankou.jp' + p }));
  },
  address(html) {
    const m = html.match(/<th[^>]*>\s*<p>\s*住所\s*<\/p>\s*<\/th>\s*<td[^>]*>\s*<p>([^<]+)<\/p>/);
    return m ? tidyAddress(m[1]) : null;
  },
};

/* ---- 神奈川・県央（県公式） -------------------------------------------- */

/**
 * 神奈川県公式「県央地域（宮ヶ瀬湖・相模原周辺）のバーベキュー・キャンプ」。
 *
 * **施設一覧ではなく、ほとんどがリンク集。**本文の表は他団体の一覧ページへの
 * リンク（相模原市観光協会＝こちらが既に L1 で持っている・津久井観光協会・
 * 藤野観光協会・大和市の財団）で、**施設として名前と詳細ページを持つのは冒頭の4件だけ**。
 *
 *   望地弁天キャンプ場（相模原市）/ 上大島キャンプ場（相模原市）
 *   ウエインズパーク海老名（海老名市）/ 県立愛川ふれあいの村（愛川町）
 *
 * つまり**相模原市には実質2件**しか効かない。
 * Manus の評価「愛川4件・清川4件の裏取りに効く」は実HTMLと合わない
 * （愛川町は1件、清川村は0件）。それでも県公式で住所まで取れるので L2 として持つ。
 * 詳細ページの住所は本文に「【所在地】相模原市中央区田名5835-16」の形で入っている。
 */
const SRC_KANAGAWA_KENOU = {
  id: 'pref-kanagawa-kenou',
  layer: 'L2',
  kind: 'listDetail',
  label: '神奈川県公式 県央地域のバーベキュー・キャンプ',
  note: '実測4件（相模原2 / 海老名1 / 愛川1）。本文の表は他団体の一覧へのリンク集で施設ではない',
  pages: ['https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/p12621.html'],
  list(html) {
    const seen = new Map();
    const re = /<a href="(\/docs\/u5r\/cnt\/f550\/tabi-\d+\.html)"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html))) {
      if (!seen.has(m[1])) seen.set(m[1], cleanText(m[2]));
    }
    return [...seen].map(([p, name]) => ({ name, url: 'https://www.pref.kanagawa.jp' + p }));
  },
  address(html) {
    const m = html.match(/【所在地】\s*([^<\n]+)/);
    return m ? tidyAddress(stripTags(m[1])) : null;
  },
};

/* ---- L3 集約サイト（県単位。市区町村ページが無いので県で取って住所で絞る） ---- */

function japanCamp(prefSlug, label) {
  return {
    id: 'japancamp',
    layer: 'L3',
    kind: 'listInline',
    label: `キャンナビ（japancamp.jp）${label}`,
    pages: Array.from({ length: 8 }, (_, i) =>
      `https://japancamp.jp/camp_area/${prefSlug}/` + (i === 0 ? '' : `page/${i + 1}/`)
    ),
    pageCapNote: '一覧は先頭8ページまで（無いページは404として記録される）',
    list(html) {
      const out = [];
      const re =
        /<h2 class="post-title[^"]*">([^<]+)<\/h2>\s*<div class="col-default">\s*<p class="mb-1">([^<]*)<\/p>/g;
      let m;
      while ((m = re.exec(html))) {
        out.push({ name: cleanText(m[1]), address: tidyAddress(m[2]), url: null });
      }
      return out;
    },
  };
}

function walkerPlus(areaCode, label) {
  return {
    id: 'walkerplus',
    layer: 'L3',
    kind: 'listInline',
    label: `ウォーカープラス ${label}`,
    note: 'robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで',
    extraDelayMs: 3000,
    pages: [`https://www.walkerplus.com/spot_list/${areaCode}/sg0112/`],
    list(html) {
      return extractJsonLd(html)
        .filter(n => n.name)
        .map(n => ({ name: cleanText(n.name), address: jsonLdAddress(n), url: n.url || null }));
    },
  };
}

/**
 * 都道府県オープンデータ。
 *
 * 神奈川は CKAN（catalog.opendata.pref.kanagawa.jp）にカタログがあるが、
 * **観光施設一覧に相当するデータセットは無かった**（`観光` で3件、
 * いずれも入込客数・消費動向の調査結果で施設一覧ではない）。
 * 静岡・山梨も同様に施設一覧の CSV は見つかっていない。
 *
 * 「探して無かった」ことを md に残すために、取得はせず結果だけ持つ。
 */
const OPENDATA_NOTE = {
  神奈川: '神奈川県オープンデータカタログ（catalog.opendata.pref.kanagawa.jp）に観光施設一覧のデータセット無し。「観光」で該当3件はいずれも調査統計',
  静岡: '静岡県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認',
  山梨: '山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認',
};

/* ---- 県ごとの L3 ------------------------------------------------------- */

const PREF_SOURCES = {
  // ウォーカープラスのエリアコードは「地方2桁 + 都道府県コード2桁」。
  // 県コードだけで組み立てると 404 になる（ar0322 / ar0319 で実際に踏んだ）。
  // 神奈川=関東03+14 / 山梨=甲信越04+19 / 静岡=東海06+22
  神奈川: [japanCamp('14-kanagawa', '神奈川県'), walkerPlus('ar0314', '神奈川県')],
  静岡: [japanCamp('22-shizuoka', '静岡県'), walkerPlus('ar0622', '静岡県')],
  山梨: [japanCamp('19-yamanashi', '山梨県'), walkerPlus('ar0419', '山梨県')],
};

/**
 * 市区町村ごとの L1 / L2。
 *
 * **登録が無い市区町村は「MISSING 0件」ではなく「ソース未登録」として出す。**
 * 0件と未登録を同じ見た目にすると、フラグが立たないことを根拠に使ってしまう。
 */
const MUNI_SOURCES = {
  相模原市: {
    pref: '神奈川',
    sources: [
      SRC_SAGAMIHARA_KANKO,
      SRC_SAGAMIHARA_MIDORINAVI,
      SRC_KANAGAWA_KENOU,
      napCamp('sagamihara', 'kanagawa'),
      jalan('14151', '相模原市緑区'),
      hinataSpot('kanto/kanagawa/1906', '相模原'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
  },

  厚木市: {
    pref: '神奈川',
    sources: [
      SRC_ATSUGI_KANKO,
      napCamp('atsugi_ebina', 'kanagawa'),
      jalan('14212', '厚木市'),
      hinataSpot('kanto/kanagawa/1905', '厚木・海老名'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '厚木市公式（市サイト）',
        reason: '観光・施設のページにキャンプ場の一覧が無い。市営キャンプ場が無いため個別ページも立っていない',
        checked: ['https://www.atsugi-kankou.jp/detailsearch/index.php'],
      },
    ],
  },

  松田町: {
    pref: '神奈川',
    sources: [
      SRC_MATSUDA_TOWN,
      napCamp('ashigara', 'kanagawa'),
      jalan('14363', '松田町'),
      hinataSpot('kanto/kanagawa/1909', '足柄'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '松田町観光協会',
        reason:
          '町公式の観光サイト（kankou-sub）が観光協会のページを兼ねていて、独立した協会サイトの施設一覧が無い（§6-15）',
        checked: ['https://town.matsuda.kanagawa.jp/site/kankou-sub/camp.html'],
      },
    ],
  },

  山北町: {
    pref: '神奈川',
    sources: [
      SRC_YAMAKITA_TOWN,
      SRC_YAMAKITA_KANKO,
      napCamp('ashigara', 'kanagawa'),
      jalan('14364', '山北町'),
      hinataSpot('kanto/kanagawa/1909', '足柄'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
  },

  伊東市: {
    pref: '静岡',
    sources: [
      napCamp('izu', 'shizuoka'),
      jalan('22208', '伊東市'),
      hinataSpot('tokai/shizuoka/2702', '伊東・宇佐美・川奈'),
      hinataSpot('tokai/shizuoka/2703', '伊豆高原'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '伊東市公式（市サイト）',
        reason: '観光行政ページにキャンプ場の記載が無い',
        checked: ['https://www.city.ito.shizuoka.jp/kanko/index.html'],
      },
      {
        label: '伊東観光協会（伊豆・伊東観光ガイド itospa.com）',
        reason:
          '宿泊施設一覧・観光体験一覧のどちらにもキャンプ場のカテゴリが無く、一覧中にキャンプ場が1件も出てこない',
        checked: ['https://itospa.com/stay/index.html', 'https://itospa.com/spot/index.html'],
      },
    ],
  },

  富士河口湖町: {
    pref: '山梨',
    sources: [
      SRC_FUJIKAWAGUCHIKO,
      napCamp('motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko', 'yamanashi'),
      jalan('19430', '富士河口湖町'),
      hinataSpot('koushinetsu/yamanashi/2005', '河口湖・西湖・富士吉田・精進湖・本栖湖'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
  },

  山梨市: {
    pref: '山梨',
    sources: [
      napCamp('isawa_katsunuma_enzan', 'yamanashi'),
      jalan('19205', '山梨市'),
      hinataSpot('koushinetsu/yamanashi/2001', '甲府・湯村・昇仙峡'),
      hinataSpot('koushinetsu/yamanashi/2002', '石和・勝沼・塩山'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '山梨市公式（観光課）',
        reason: '観光施設のページは温泉・道の駅・イベントのみで、キャンプ場が1件も無い',
        checked: ['https://www.city.yamanashi.yamanashi.jp/soshiki/17/'],
      },
      {
        label: '山梨市観光協会',
        reason: '観光施設・宿泊のどちらの一覧にもキャンプ場が無い',
        checked: [
          'https://www.yamanashishi-kankou.com/nature-facilities/',
          'https://www.yamanashishi-kankou.com/stay/',
        ],
      },
    ],
  },

  川根本町: {
    pref: '静岡',
    sources: [
      SRC_KAWANEHON,
      napCamp('oigawa_sumatakyo_kawane', 'shizuoka'),
      jalan('22429', '川根本町'),
      hinataSpot('tokai/shizuoka/2713', '大井川・寸又峡・川根'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '川根本町観光協会（okuooi.gr.jp）を独立ソースとして',
        reason:
          '町公式の一覧が観光協会の詳細ページへ全件直リンクしており、同じ元データ。独立した2ソースにならないので1ソースに畳んだ（§6-15）',
        checked: ['https://okuooi.gr.jp/outdoor/details.php?id=79'],
      },
    ],
  },

  /* ── 2026-08-10 追加（J-2 全地区スイープの上位6市町村） ───────────────── */

  道志村: {
    pref: '山梨',
    sources: [
      SRC_DOSHI_VILLAGE,
      napCamp('otsuki_turushi', 'yamanashi'),
      jalan('19422', '道志村'),
      hinataSpot('koushinetsu/yamanashi/2003', '大月・都留'),
      hinataSpot('koushinetsu/yamanashi/2004', '山中湖・忍野'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
  },

  山中湖村: {
    pref: '山梨',
    sources: [
      SRC_YAMANAKAKO,
      napCamp('yamanakako_oshino', 'yamanashi'),
      jalan('19425', '山中湖村'),
      hinataSpot('koushinetsu/yamanashi/2004', '山中湖・忍野'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
  },

  北杜市: {
    pref: '山梨',
    sources: [
      napCamp('yatsygatake_kobuchisawa_kiyosato_oizumi', 'yamanashi'),
      jalan('19209', '北杜市'),
      hinataSpot('koushinetsu/yamanashi/2008', '八ヶ岳・小淵沢・清里・大泉'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '北杜市観光協会（ほくとにいくと）',
        reason:
          '**施設の詳細ページに施設の住所が無く、載っているのは観光協会自身の所在地（北杜市高根町村山北割3261）。' +
          'ここから住所を取ると §6-16 の借用をこちらから作ることになる。**' +
          '引き継ぎが `flora-campsite` の注意として警告していたのと同じ住所。名前だけなら取れるが、' +
          '北杜市は大字が多く住所が無いと地区を決められないので L1 として登録しない',
        checked: ['https://www.hokuto-kanko.jp/spot/category/stay/', 'https://www.hokuto-kanko.jp/spot/campinngrandale/'],
      },
      {
        label: '北杜市公式（市サイト）',
        reason: 'キャンプ場の一覧が見つからない',
        checked: ['https://www.hokuto-kanko.jp/spot/'],
      },
    ],
  },

  伊豆市: {
    pref: '静岡',
    sources: [
      napCamp('izu', 'shizuoka'),
      jalan('22222', '伊豆市'),
      hinataSpot('tokai/shizuoka/2708', '中伊豆'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '伊豆市観光情報サイト（kanko.city.izu.shizuoka.jp）',
        reason:
          '施設一覧・詳細とも JavaScript でしか描画されず、HTML には施設名も住所も出てこない（378KB 取得して0件）',
        checked: ['https://kanko.city.izu.shizuoka.jp/form1.html?c1=4', 'https://kanko.city.izu.shizuoka.jp/form1.html?c1=4&pid=4917'],
      },
    ],
  },

  静岡市: {
    pref: '静岡',
    sources: [
      napCamp('shizuoka_shimizu', 'shizuoka'),
      jalan('22101', '静岡市葵区'),
      jalan('22103', '静岡市清水区'),
      hinataSpot('tokai/shizuoka/2711', '静岡・清水'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: 'しずおか観光ナビ（静岡市観光公式・visit-shizuoka.com）',
        reason: 'スポット一覧にキャンプのジャンル分けが無く、一覧ページにキャンプ場が1件も出てこない',
        checked: ['https://www.visit-shizuoka.com/spot/index.html', 'https://www.visit-shizuoka.com/spots/?genre=camp'],
      },
    ],
  },

  富士宮市: {
    pref: '静岡',
    sources: [
      SRC_FUJINOMIYA_KANKO,
      SRC_FUJIYAMA_NAVI_FUJINOMIYA,
      napCamp('gotenba_fuzi', 'shizuoka'),
      jalan('22207', '富士宮市'),
      hinataSpot('tokai/shizuoka/2710', '御殿場・富士'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '富士宮市公式（市サイト）',
        reason:
          '**2025年5月のリニューアルでキャンプ場一覧ごと消滅した。**旧URL（p001678 / p001688 / p001691 と FAQ）は全部404、' +
          '施設一覧の入口 /1025110000/ は403。新サイトに引き継がれた一覧は無く、' +
          '**観光ページ /kanko/ には「キャンプ」の語が1回も出てこない**（2026-08-13 実測）。' +
          '観光協会側（SRC_FUJINOMIYA_KANKO）で代替できているので、市公式は追わない',
        // 404 のURLは reason に書き残すだけにして、checked には**生きている**ページを置く。
        // check-muni-sources は checked を到達確認するので、404 を置くと毎回 DEAD が鳴り続ける
        checked: ['https://www.city.fujinomiya.lg.jp/kanko/'],
      },
    ],
  },

  南部町: {
    pref: '山梨',
    sources: [
      napCamp('shimobe_minobu_hayakawa', 'yamanashi'),
      jalan('19366', '南部町'),
      hinataSpot('koushinetsu/yamanashi/2006', '下部・身延・早川'),
      // SRC_TAKIBI は廃止（サービス終了。定義部の墓標コメント参照）
    ],
    l1NotFound: [
      {
        label: '南部町公式（観光ページ）',
        reason:
          '宿泊施設・レジャー・公園のどのページにもキャンプ場の記載が無い。公園一覧に佐野川河川公園も無い',
        checked: [
          'https://www.town.nanbu.yamanashi.jp/kankou/shukuhaku/index.html',
          'https://www.town.nanbu.yamanashi.jp/kankou/leisure/index.html',
          'https://www.town.nanbu.yamanashi.jp/kankou/park/index.html',
        ],
      },
      {
        label: '南部町観光協会',
        reason: '独立した観光協会サイトが見つからない（町公式の観光ページが兼ねている）',
        checked: ['https://www.town.nanbu.yamanashi.jp/kankou/index.html'],
      },
    ],
  },

  /* ── 2026-08-14 追加（山梨東部。データが 大月0 / 上野原0 / 都留2 の空白地帯） ──
   *
   * 3市とも **SELF_TEST が無い**。新地区なので「必ず出るはず」の答えを持っていない。
   * 結果が薄いときに疑うのは、まず抽出器のほう
   * （`node scripts/check-muni-sources.js --muni=大月市` の抽出件数を見る）。
   */

  大月市: {
    pref: '山梨',
    sources: [
      SRC_OTSUKI_CITY,
      SRC_YAMANASHI_KANKO_OTSUKI,
      napCamp('otsuki_turushi', 'yamanashi'),
      jalan('19206', '大月市'),
    ],
  },

  // 都留市は **L1 が無い**。市公式・観光協会の一覧を探していないだけで、
  // 「無いことを確かめた」わけではないので l1NotFound には書かない
  // （l1NotFound は不在の根拠であって、未調査の置き場所ではない）。
  // L1 を探すまで、この市の ORPHAN は判定として読めない。
  都留市: {
    pref: '山梨',
    sources: [
      SRC_YAMANASHI_KANKO_OTSUKI,
      napCamp('otsuki_turushi', 'yamanashi'),
      jalan('19204', '都留市'),
    ],
  },

  上野原市: {
    pref: '山梨',
    sources: [
      SRC_UENOHARA_CITY,
      SRC_YAMANASHI_KANKO_OTSUKI,
      napCamp('otsuki_turushi', 'yamanashi'),
      jalan('19212', '上野原市'),
    ],
  },
};

/* ============================================================================
 * 6. 収集
 * ========================================================================== */

/**
 * 1ソースぶんを取る。戻りは { source, status, items, fetched, notes, detailBudget }。
 * items は { name, address|null, url|null }。
 *
 * `detailBudget` は `detailLimit` の打ち切り実績。**打ち切りは長らく `notes` の
 * 日本語1行にしか残っておらず、集計に出せなかった。**消費側が人向けの文字列を
 * 解析するのは §18-3 そのものなので、構造化した値で返す。
 * `listDetail` 以外は詳細を踏まない実装なので `null`（0ではない。§18-3 の「出していない」）。
 */
async function collectSource(src, opts) {
  const items = [];
  const notes = [];
  const fetched = [];
  let listOk = 0;
  let detailBudget = null;

  for (const pageUrl of src.pages) {
    const res = await fetchPage(pageUrl, { useCache: opts.useCache, extraDelayMs: src.extraDelayMs || 0 });
    fetched.push({ url: pageUrl, status: res.status, note: res.note, fromCache: !!res.fromCache, attempts: res.attempts });
    if (!res.ok) {
      notes.push(`${pageUrl} → ${res.note || 'HTTP_' + res.status}` +
        (res.note === 'RATE_LIMITED' ? `（${res.attempts}回試行。**測れていない**。「無い」ではない）` : ''));
      continue;
    }
    listOk++;
    let got;
    try {
      got = src.list(res.body) || [];
    } catch (e) {
      notes.push(`${pageUrl} の解析に失敗: ${e.message}`);
      continue;
    }
    for (const it of got) {
      if (!it.name && !it.url) continue;
      items.push({ name: it.name, address: it.address || null, url: it.url || pageUrl });
    }
  }

  // 同一ソース内の重複（ページ間で同じ施設が出る）をURL/名前でまとめる
  const seen = new Map();
  for (const it of items) {
    const key = it.url && it.url.includes('/spt_') ? it.url : (it.url || '') + '|' + sweepNormalizeName(it.name || '');
    if (!seen.has(key)) seen.set(key, it);
    else if (!seen.get(key).address && it.address) seen.get(key).address = it.address;
  }
  let uniq = [...seen.values()];

  // 詳細ページで名前・住所を埋める
  if (src.kind === 'listDetail') {
    let targets = uniq.filter(it => !it.address && it.url);
    const limit = src.detailLimit || DEFAULT_DETAIL_LIMIT;
    detailBudget = {
      limit,
      targets: targets.length,                              // 打ち切る前の対象数
      fetched: Math.min(targets.length, limit),
      skipped: Math.max(0, targets.length - limit),
    };
    if (targets.length > limit) {
      notes.push(`住所を取りに行く詳細ページを ${limit} 件で打ち切った（対象 ${targets.length} 件）。**打ち切った分はこの検査に載らない**`);
      targets = targets.slice(0, limit);
    }
    for (const it of targets) {
      const res = await fetchPage(it.url, { useCache: opts.useCache, extraDelayMs: src.extraDelayMs || 0 });
      fetched.push({ url: it.url, status: res.status, note: res.note, fromCache: !!res.fromCache, detail: true, attempts: res.attempts });
      if (!res.ok) continue;
      if (!it.name && src.name) it.name = src.name(res.body);
      if (src.address) it.address = src.address(res.body);
      // 名前ではなく本文でキャンプ場かどうかを決める。
      // **判定範囲を施設本文に限ること。**ページ下部のレコメンド枠まで見ると、
      // 隣に出たキャンプ場の紹介文で旅館が通る（しかもこの枠は取得ごとに中身が変わるので、
      // 同じページが通ったり落ちたりする）。bodyScope で切る。
      if (src.bodyFilter) {
        const text = src.bodyScope ? src.bodyScope(res.body) : stripTags(res.body);
        it.campOk = src.bodyFilter.test(text);
      }
      // 「奥泉761-2」のように市町村が省かれたソースがある。その一覧は
      // 特定の市町村のものなので、市町村名を補って初めて地区が決まる
      if (it.address && src.addressPrefix && !/[市町村]/.test(it.address)) {
        it.address = src.addressPrefix + it.address;
      }
    }
    if (src.bodyFilter) {
      const before = uniq.length;
      uniq = uniq.filter(it => it.campOk);
      notes.push(`宿泊施設 ${before} 件のうち、本文にキャンプ関連語があった ${uniq.length} 件を残した（判定語: キャンプ/テント/オートサイト/バンガロー/野営）`);
    }
    // 名前も住所も取れなかったものは、そのソースの一覧ではなかった
    uniq = uniq.filter(it => it.name);
    // 一覧ページにサイドバーの新着記事が混ざるソース（ミドナビ）は、
    // 「所在地」表が無いものを落とす。施設の記事には必ず所在地がある
    if (src.dropWithoutAddress) uniq = uniq.filter(it => it.address);
  }

  // **429 は UNREACHABLE と混ぜない。**一覧が1ページも取れず、その理由が 429 なら
  // 「そこに無い」ではなく「測れていない」。`0件` と同じ扱いにすると、
  // 実行順によって同じソースが `UNREACHABLE:0件` になったり `OK:4件` になったりする
  const rateLimited = fetched.filter(f => f.note === 'RATE_LIMITED');
  const status =
    listOk === 0
      ? (fetched.some(f => f.note === 'SKIPPED_ROBOTS') ? 'SKIPPED_ROBOTS'
        : rateLimited.some(f => !f.detail) ? 'RATE_LIMITED' : 'UNREACHABLE')
      : 'OK';

  // 一覧が取れていても詳細が 429 で落ちていれば、そのソースの結果は不完全。
  // **status だけ見ると OK に見えるので、別に持って md に出す**
  return {
    source: src, status, items: uniq.filter(it => it.name), fetched, notes, detailBudget,
    rateLimited: rateLimited.map(f => ({ url: f.url, detail: !!f.detail, attempts: f.attempts })),
  };
}

/* ============================================================================
 * 7. 統合と突き合わせ
 * ========================================================================== */

/** 統合リストの1件。**どのソースの何層から来たかを持ち続ける。** */
function mergeItems(collected, district) {
  const merged = [];

  const addTo = (bucket, item, src) => {
    bucket.aliases.add(item.name);
    if (item.address && !bucket.addresses.includes(item.address)) bucket.addresses.push(item.address);
    bucket.hits.push({ sourceId: src.id, layer: src.layer, label: src.label, url: item.url, address: item.address || null });
  };

  for (const { source: src, items } of collected) {
    for (const item of items) {
      const norm = sweepNormalizeName(item.name);
      if (!norm) continue;
      // 大字が違うものは名前が同じでも別施設。
      //
      // 「湖畔荘」は宿の名前としてありふれていて、富士河口湖町の精進588-14 と
      // 小立1019 に別々に存在する。名前だけで寄せると片方の住所がもう片方に付き、
      // **実在しない組み合わせの MISSING** が出る。
      const oazaOf = a => {
        const p = splitAddress(a);
        return p && p.city ? p.city + (p.oaza || '') : null;
      };
      const myOaza = item.address ? oazaOf(item.address) : null;
      let bucket = merged.find(b => {
        if (![...b.norms].some(n => n === norm || namesMatch(n, norm))) return false;
        if (!myOaza) return true;
        const theirs = b.addresses.map(oazaOf).filter(Boolean);
        return theirs.length === 0 || theirs.includes(myOaza);
      });
      if (!bucket) {
        bucket = { norms: new Set(), aliases: new Set(), addresses: [], hits: [] };
        merged.push(bucket);
      }
      bucket.norms.add(norm);
      addTo(bucket, item, src);
    }
  }

  for (const b of merged) {
    // 表示名は「住所を持つソースの名前」を優先。無ければ最長の別名
    const withAddr = b.hits.find(h => h.address);
    const named = withAddr ? [...b.aliases].find(a => b.hits.some(h => h.address && h.url === withAddr.url)) : null;
    b.name = named || [...b.aliases].sort((x, y) => y.length - x.length)[0];
    b.layers = new Set(b.hits.map(h => h.layer));
    b.confidence = b.layers.has('L1')
      ? 'HIGH'
      : (new Set(b.hits.filter(h => h.layer === 'L2').map(h => h.sourceId)).size >= 2 ? 'MID' : 'LOW');
    b.inDistrict = b.addresses.some(a => inDistrict(a, district));
    b.addressKnown = b.addresses.length > 0;
  }
  return merged;
}

/** データ側のレコードと突き合わせる。 */
function classify(merged, records, district) {
  const inData = records.filter(r => r.address && inDistrict(r.address, district));
  const matchedIds = new Set();
  const results = [];

  const here = merged.filter(b => b.inDistrict);

  // 1段目: 名前で付ける
  const pending = [];
  for (const b of here) {
    const hit = inData.find(r => {
      if (matchedIds.has(r.id)) return false;
      const rn = sweepNormalizeName(r.name);
      return [...b.norms].some(n => n === rn || namesMatch(n, rn));
    });
    if (hit) {
      matchedIds.add(hit.id);
      results.push({ kind: 'IN_DATA', bucket: b, record: hit, matchedBy: '名前' });
    } else {
      pending.push(b);
    }
  }

  // 2段目: 名前で付かなかったものだけ番地で照合する。
  //
  // **順番が大事。**若柳1634 には PICAさがみ湖 と相模湖プレジャーフォレストが
  // 別々に建っていて、番地を先に見ると片方が落ちて誤った ORPHAN が出る。
  // 名前で付いたものを先に確定させてから、残りだけを番地で拾う。
  for (const b of pending) {
    const keys = new Set(b.addresses.map(banchiKey).filter(Boolean));
    const hit = keys.size
      ? inData.find(r => !matchedIds.has(r.id) && r.address && keys.has(banchiKey(r.address)))
      : null;
    if (hit) {
      matchedIds.add(hit.id);
      results.push({ kind: 'IN_DATA', bucket: b, record: hit, matchedBy: '番地（名前は不一致）' });
    } else {
      results.push({ kind: 'MISSING', bucket: b, record: null });
    }
  }

  for (const r of inData) {
    if (matchedIds.has(r.id)) continue;
    results.push({ kind: 'ORPHAN', bucket: null, record: r });
  }
  return { results, inData };
}

/* ============================================================================
 * 7-2. L1 の網羅率
 *
 * `tiny-camp-village`（料金まで確認済みの実在施設）が ORPHAN に落ちた。
 * 厚木市観光協会の一覧は会員施設しか載せていない疑いがある。
 * **一覧に載らない実在施設がある L1 は、ORPHAN の判定に使えない。**
 *
 * そこで「実在がほぼ確実な群」＝ `priceVerified: true` かつ `needsVerify` なし
 * のレコードのうち、その L1 に何%が載っているかを測る。
 * 7割を切る L1 しか無い市町村では、ORPHAN を判定として出さず参考値に落とす。
 *
 * **MISSING には影響しない。**網羅率が低くても「載っていた」という事実は使える。
 * 効かなくなるのは「載っていない」を根拠にする側だけ。
 * ========================================================================== */

const ORPHAN_TRUST_MIN = 0.7;

/**
 * `--l1-audit` の判定。**抽出結果を人が1件ずつ見て付けた。**
 * 自動判定にしていないのは、「キャンプ場かどうか」が名前から機械では決まらないため
 * （亀見橋バカンス村・藤野芸術の家は名前にキャンプが入らないキャンプ場）。
 * L1 を足したら、ここも更新すること。
 */
const L1_AUDIT_VERDICT = [
  { label: '相模原市 観光協会', total: 22, verdict: 'OK',
    bad: ['本田蘭灯商店（ランタン専門店・中央区淵野辺）', '「Twilight SAGAMIHARA」（イベント記事・住所なし）'] },
  { label: '相模原市 ミドナビ（市公式）', total: 17, verdict: 'OK',
    bad: ['藤野倶楽部（バーベキュー場）'] },
  { label: '厚木市 観光協会', total: 1, verdict: 'OK', bad: [] },
  { label: '松田町 公式', total: 1, verdict: 'OK', bad: [] },
  // 名前がロッジ・コテージ系のものは業態が名前から決まらない。
  // 一覧のページを1件ずつ開いて、テントサイトの記載があるかで判定し直した
  { label: '山北町 公式', total: 7, verdict: 'MIXED',
    bad: ['くろくら森の家（総木造2階建コテージ5棟・1棟1泊15,000円。テントサイトの記載なし）'] },
  { label: '山北町 観光協会', total: 9, verdict: 'MIXED',
    bad: ['世附川ロッジ（バンガローのみ。キャンプ場・テントの記載なし）'] },
  { label: '富士河口湖町 観光連盟', total: 17, verdict: 'OK', bad: [] },
  { label: '川根本町 公式', total: 5, verdict: 'OK', bad: [] },
  { label: '道志村 村公式', total: 31, verdict: 'OK', bad: ['貸し別荘 となり（貸別荘。村の一覧には入っている）'] },
  { label: '山中湖村 観光協会（差し替え後）', total: 9, verdict: 'MIXED',
    bad: ['東照館', 'the508', '三興荘', '小田急山中湖フォレストコテージ', '富月荘'] },
];

/** その市町村の「実在がほぼ確実」なレコード。 */
function groundTruthRecords(records, muniKey) {
  return records.filter(r => {
    if (r.priceVerified !== true || r.needsVerify || !r.address) return false;
    const p = splitAddress(r.address);
    return p && p.city === muniKey;
  });
}

function l1Coverage(collected, records, muniKey) {
  const truth = groundTruthRecords(records, muniKey);
  return collected
    .filter(c => c.source.layer === 'L1')
    .map(c => {
      const norms = c.items.map(i => sweepNormalizeName(i.name)).filter(Boolean);
      const keys = new Set(c.items.map(i => i.address && banchiKey(i.address)).filter(Boolean));
      const hit = truth.filter(r => {
        const rn = sweepNormalizeName(r.name);
        if (norms.some(n => n === rn || namesMatch(n, rn))) return true;
        const k = banchiKey(r.address);
        return !!k && keys.has(k);
      });
      return {
        label: c.source.label,
        status: c.status,
        items: c.items.length,
        total: truth.length,
        hit: hit.length,
        rate: truth.length ? hit.length / truth.length : null,
        missed: truth.filter(r => !hit.includes(r)).map(r => r.id),
      };
    });
}

/** ORPHAN を判定として使えるか。7割以上の L1 が1つでもあれば使える。 */
function orphanTrustable(coverage) {
  return coverage.some(c => c.rate !== null && c.rate >= ORPHAN_TRUST_MIN);
}

/* ============================================================================
 * 8. 必須検証（牧野）— 案B: 外の事実だけを焼き込む
 *
 * これが通らなければ名寄せかソース選定が間違っている。**先に進まない。**
 *
 * ## 何を焼き込み、何を焼き込まないか（§18・2026-08-14 の設計変更）
 *
 * 旧実装は「亀見橋が MISSING」「fujino-art-camp が IN_DATA」「かぶと虫の森と
 * 奥牧野が ORPHAN」という**データの状態**を焼き込んでいた。データの状態は
 * こちらの作業で正しく変わる（藤野芸術の家を掲載した瞬間、MISSING → IN_DATA に
 * なって FAIL した）。**状態を焼き込んだ検査は、作業が進むたびに腐る。**
 *
 * 案Bでは**外の世界の事実＝実在側の施設名だけ**を焼き込む。
 *
 *   real   … 一次情報で実在が確認できている施設。**ソース側（実在側）に出続けること**
 *            だけを検査する。データに載っているか（MISSING か IN_DATA か）は問わない
 *   absent … 一次情報を探しても予約・料金が出てこなかった名前（§6-4 を満たさない。
 *            2026-08-13 のWeb精査で確認）。**ソース側に「出ない」ことを検査する。**
 *            出たら実在の判断が変わったということなので、機械で通さず手で調べ直す
 *
 * これらは「その施設が現実に存在するか」という**データの外の事実**なので、
 * こちらの作業では変わらない。変わるとしたら世界側（閉業・新規掲載）で、
 * そのときに FAIL するのは検査として正しい挙動。
 * ========================================================================== */

const SELF_TEST = {
  '相模原市緑区牧野': {
    real: ['亀見橋バカンス村', '藤野芸術の家'],
    absent: ['かぶと虫の森キャンプ場', '奥牧野キャンプ場'],
  },
};

function runSelfTest(districtName, results) {
  const spec = SELF_TEST[districtName];
  if (!spec) return null;
  const checks = [];
  // ソース側（実在側）に出た名前 = MISSING か IN_DATA の bucket。ORPHAN はデータ側のみ
  const sourceSide = results.filter(r => r.bucket);
  const findByName = (name) => {
    const want = sweepNormalizeName(name);
    return sourceSide.find(
      r => [...r.bucket.norms].some(n => n === want || namesMatch(n, want))
    );
  };
  for (const name of spec.real || []) {
    const found = findByName(name);
    checks.push({
      label: `${name} が実在側（ソース側）に出ている`,
      pass: !!found,
      detail: found
        ? `${found.kind}・${found.bucket.confidence}${found.bucket.addresses.length ? ' / ' + found.bucket.addresses.join(' / ') : ''}`
        : '出ていない（ソースが落ちたか、名寄せが壊れたか、現実に閉業したか）',
    });
  }
  for (const name of spec.absent || []) {
    const found = findByName(name);
    checks.push({
      label: `${name} が実在側（ソース側）に出ない（一次情報で実在が確認できなかった名前）`,
      pass: !found,
      detail: found
        ? `出てしまった: ${found.kind}・${found.bucket.confidence}。実在の判断が変わった可能性。手で調べ直すこと`
        : '出ていない（期待どおり）',
    });
  }
  return { checks, pass: checks.every(c => c.pass) };
}

/* ============================================================================
 * 9. 出力
 * ========================================================================== */

const LIMITS_MD = `## この検査の限界

**フラグが立たないことを根拠に使わない。**\`check-official-urls.js\` と同じ扱い。
MISSING が0件でも「その地区に掲載漏れが無い」ことにはならない。

- **OSM は使わない。**牧野周辺の bbox で \`camp_site\` は1件しか無く、
  本命の2件（亀見橋バカンス村・藤野芸術の家）はどちらも入っていなかった。
  OSM を足しても、この地区で拾えたものは無い
- **全ソースが同じ元ネタを写している可能性は消せない。**
  confidence は独立性の代理指標にすぎない。L1 だから独立、ではない。
  自治体の一覧が予約サイトの記載を写していることもありうる
- **ORPHAN は不在の証明ではない**（§6-7）。実際に反例が2件出ている
  （\`sessokyo-camp\` は2023年開業で町の一覧が追いついていない、
  \`doshi-mori-cottage\` は村役場の32件に無いが村観光協会に専用ページがある）。
  **ORPHAN を根拠に status を変えてはいけない**
- **住所を持たないソースがある。**なっぷ・じゃらんの一覧・ウォーカープラスは
  名前しか出さない（または市区町村までしか出さない）。
  名前だけのソースは他ソースの施設を裏付けることしかできず、単独で MISSING を立てられない。
  **そのソースにしか無い施設は、この検査から漏れる**
- **番地は地区の同定に使っていない**（§6-16 のとおり番地は捏造されうる）。
  大字までの一致で地区を決めている
- **データ側の住所が空のレコードは、この検査の対象外**（地区が決まらないため）
`;

function mdEscape(s) {
  return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/* ----------------------------------------------------------------------------
 * 9-2. 出力に載らなかったソース側の項目の列挙
 *
 * `classify()` は `merged.filter(b => b.inDistrict)` しか見ない。
 * **落選したバケットは MISSING にも ORPHAN にも IN_DATA にも出ず、
 * ログにも md にも残らなかった。**ここはそれを数えるだけの節で、
 * **判定には一切使わない**（`results` を作り終えたあとに、別の入力から数える）。
 *
 * ## 3つに分ける理由（1つにまとめない）
 *
 *   b1  addressKnown === false           ソースが住所を持っていない
 *   b2  addressKnown && !inDistrict      住所はあるが地区外
 *   b3  住所なしの項目が地区内バケットに合流した（＝漏れていない）
 *
 * **b1 と b2 は対処が正反対。**b1 は**ソース側の仕様**（なっぷは一覧に住所が無い）で、
 * 抽出器を直しても取れない。b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、
 * 前者なら抽出器かソースの問題、後者は正常。混ぜると原因が特定できない。
 *
 * **b3 を必ず併記するのは、b1 の件数だけ見ると過大に見えるから。**
 * 名前しか無い項目でも、住所を持つ別ソースと名寄せで合流すれば出力に載っている。
 *
 * ## 正常な b2 が支配的であることを忘れない
 *
 * じゃらん等は**市単位**で取るが、地区は「北杜市高根町清里」のような**大字単位**。
 * したがって **b2 の大半は正常**（同じ市の別の大字）。
 * だから「同じ市区町村か」で分けて出す。異常を疑うのは市が一致するほうではなく、
 * **市区町村ごと違うもの**。
 * ========================================================================== */

/**
 * 詳細ページの取得に失敗した URL を、ソースごとに集める。
 *
 * **`fetchPage` は成功したものしかキャッシュしない**（222行）ので、
 * 失敗した詳細ページは毎回取りに行き、毎回住所が取れない。
 * **これは「ソースが住所を持っていない」とは別の原因。**
 * 前者は抽出器を直しても取れないが、こちらは**取得さえ通れば取れる**。
 * 実例: やまなし観光推進機構の 24件中6件が詳細を取れておらず、
 * うち2件は他ソースの住所でも救われず b1 に落ちていた。
 */
/**
 * この実行が**不完全かどうか**を1か所で決める。
 *
 * 429 は「そこに無い」ではなく「測れていない」なので、**1件でもあれば結果全体が不完全。**
 * 件数を表の中に埋めると「取得失敗 N件」に潰れて意味が消えるので、
 * **呼び出し側は md の先頭に出すこと。**
 *
 * 戻りは `null`（完全）か `{ list, detail, total, urls }`。
 */
function incompleteNote(collectedList) {
  const all = [];
  for (const c of collectedList) for (const r of c.rateLimited || []) all.push({ ...r, sourceId: c.source.id });
  if (!all.length) return null;
  return {
    total: all.length,
    list: all.filter(r => !r.detail).length,
    detail: all.filter(r => r.detail).length,
    urls: all,
  };
}

function failedDetailUrls(collected) {
  const per = new Map();
  for (const c of collected) {
    const bad = new Map();
    for (const f of c.fetched) {
      if (!f.detail) continue;
      const ok = f.status >= 200 && f.status < 300;
      if (!ok) bad.set(f.url, f.note || `HTTP_${f.status}`);
    }
    per.set(c.source.id, bad);
  }
  return per;
}

function analyzeDropped(merged, results, district) {
  const b1 = merged.filter(b => !b.addressKnown);
  const b2 = merged.filter(b => b.addressKnown && !b.inDistrict);
  const survived = merged.filter(b => b.inDistrict);

  // b2 をさらに「同じ市区町村か」で割る。市が違うものだけが疑う対象。
  const sameCity = a => {
    const p = splitAddress(a);
    return !!(p && p.city && p.city === district.city);
  };
  for (const b of b2) b.dropSameCity = b.addresses.some(sameCity);

  // b3: 住所を持たない hit が、地区内バケットに合流したもの（＝出力に載っている）
  const bucketKind = new Map();
  for (const r of results) if (r.bucket) bucketKind.set(r.bucket, r.kind);
  const b3 = [];
  for (const b of survived) {
    const noAddr = b.hits.filter(h => !h.address);
    if (noAddr.length) b3.push({ bucket: b, hits: noAddr, kind: bucketKind.get(b) || '(不明)' });
  }
  return { b1, b2, b3, survived };
}

/**
 * ソース別の行方。**`collected` の取得件数と突き合わせて、合わなければ md に警告を出す。**
 * 合計が合わないのは、どこかで黙って消えている項目があるということ。
 */
function droppedBySource(merged, collected) {
  const per = new Map();
  const row = id => {
    if (!per.has(id)) per.set(id, { id, label: '', items: 0, normDropped: 0, inDist: 0, b1: 0, b2: 0 });
    return per.get(id);
  };
  for (const c of collected) {
    const r = row(c.source.id);
    r.label = c.source.label;
    r.items += c.items.length;
    // mergeItems は名前が正規化できない項目を捨てる（バケットにも入らない）
    r.normDropped += c.items.filter(i => !sweepNormalizeName(i.name)).length;
  }
  for (const b of merged) {
    const where = b.inDistrict ? 'inDist' : (b.addressKnown ? 'b2' : 'b1');
    for (const h of b.hits) row(h.sourceId)[where]++;
  }
  for (const r of per.values()) {
    r.accounted = r.normDropped + r.inDist + r.b1 + r.b2;
    r.reconciles = r.accounted === r.items;
  }
  return [...per.values()];
}

function renderMd(ctx) {
  const { districtName, collected, results, inData, selfTest, startedAt, pref, muniKey, skippedRecords } = ctx;
  const L = [];
  const missing = results.filter(r => r.kind === 'MISSING');
  const orphan = results.filter(r => r.kind === 'ORPHAN');
  const inDataRes = results.filter(r => r.kind === 'IN_DATA');

  L.push(`# 地区スイープ: ${districtName}`);
  L.push('');
  L.push(`実行: ${startedAt}　/　\`node scripts/district-sweep.js --district "${districtName}"\``);
  L.push('');
  L.push('**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**');
  L.push('反映は人が中身を見てから別途行う。');
  L.push('');
  {
    // **この行はあとで突き合わせる側が読む。**下の数字が「いつのデータで出たか」が
    // 分からないと、データが動いただけの差分と判定のバグが同じ ❌ になる
    const ds = dataStamp();
    L.push(`データ: \`data/campgrounds.json\` ${ds.count}件 / 最終更新 ${ds.mtime}`);
    L.push('');
  }
  L.push(`| | 件数 |`);
  L.push(`|---|---|`);
  L.push(`| **MISSING**（実在側にあるがデータに無い） | **${missing.length}** |`);
  L.push(`| IN_DATA（両方にある） | ${inDataRes.length} |`);
  L.push(`| ORPHAN（データにあるがソースに無い） | ${orphan.length} |`);
  L.push(`| データ側のこの地区のレコード | ${inData.length} |`);
  L.push('');

  if (selfTest) {
    L.push('## 必須検証');
    L.push('');
    L.push(`この地区は既知の答え合わせがある。**${selfTest.pass ? 'PASS' : 'FAIL'}**`);
    L.push('');
    L.push('| 期待 | 結果 | 実際 |');
    L.push('|---|---|---|');
    for (const c of selfTest.checks) {
      L.push(`| ${mdEscape(c.label)} | ${c.pass ? '✅ PASS' : '❌ FAIL'} | ${mdEscape(c.detail)} |`);
    }
    L.push('');
    if (!selfTest.pass) {
      L.push('> **FAIL が残っている間は他の地区に進まない。**名寄せかソース選定が間違っている。');
      L.push('');
    }
  }

  L.push('## ソースの取得結果');
  L.push('');
  L.push('**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。');
  L.push('');
  L.push('| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |');
  L.push('|---|---|---|---|---|---|');
  for (const c of collected) {
    const here = c.items.filter(i => i.address && inDistrict(i.address, ctx.district)).length;
    const notes = [c.source.note, c.source.pageCapNote, ...c.notes].filter(Boolean).join(' / ');
    L.push(
      `| ${c.source.layer} | ${mdEscape(c.source.label)} | ${c.status} | ${c.items.length} | ${here} | ${mdEscape(notes)} |`
    );
  }
  for (const nf of ctx.l1NotFound) {
    L.push(`| L1 | ${mdEscape(nf.label)} | **L1_NOT_FOUND** | – | – | ${mdEscape(nf.reason)} |`);
  }
  L.push(`| L1 | 都道府県オープンデータ（${pref}） | **L1_NOT_FOUND** | – | – | ${mdEscape(OPENDATA_NOTE[pref] || '未調査')} |`);
  L.push('');
  if (ctx.l1NotFound.length) {
    L.push('**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。');
    L.push('次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。');
    L.push('');
    for (const nf of ctx.l1NotFound) {
      L.push(`- **${nf.label}** — ${nf.reason}`);
      for (const u of nf.checked || []) L.push(`  - 確認: ${u}`);
    }
    L.push('');
  }
  L.push('取得したページ:');
  L.push('');
  for (const c of collected) {
    const list = c.fetched.filter(f => !f.detail);
    for (const f of list) {
      L.push(`- \`${c.source.layer}\` ${f.url} → ${f.status || f.note}${f.fromCache ? '（キャッシュ）' : ''}`);
    }
    const details = c.fetched.filter(f => f.detail);
    if (details.length) L.push(`  - 詳細ページ ${details.length} 件（住所の取得のため）`);
  }
  L.push('');

  // 同じ番地に別名が並ぶことがある。同一施設の別表記かもしれないし、
  // 敷地内の別施設かもしれない（若柳1634 の PICAさがみ湖 と相模湖プレジャーフォレスト）。
  // **勝手に寄せずに、隣に何がいるかだけ出す。**
  const banchiOf = banchiKey;
  const banchiMap = new Map();
  for (const r of results) {
    const addrs = r.bucket ? r.bucket.addresses : (r.record.address ? [r.record.address] : []);
    const label = r.bucket ? r.bucket.name : `${r.record.id}（データ側）`;
    for (const key of new Set(addrs.map(banchiOf).filter(Boolean))) {
      if (!banchiMap.has(key)) banchiMap.set(key, new Set());
      banchiMap.get(key).add(label);
    }
  }

  const renderEntry = (r, i) => {
    const b = r.bucket;
    L.push(`### ${i + 1}. ${b.name}`);
    L.push('');
    L.push(`- **分類**: ${r.kind}`);
    L.push(`- **confidence**: ${b.confidence}（層: ${[...b.layers].sort().join(' + ')}）`);
    L.push(`- **住所**: ${b.addresses.length ? b.addresses.join(' / ') : '（このソース群からは取れていない）'}`);
    if (b.aliases.size > 1) L.push(`- **表記ゆれ**: ${[...b.aliases].join(' / ')}`);
    const neighbours = new Set();
    for (const key of new Set(b.addresses.map(banchiOf).filter(Boolean))) {
      for (const other of banchiMap.get(key) || []) if (other !== b.name) neighbours.add(other);
    }
    if (neighbours.size) {
      L.push(`- **同じ番地に別名**: ${[...neighbours].join(' / ')}（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）`);
    }
    if (r.record) L.push(`- **データ側**: \`${r.record.id}\` ${r.record.name}（${r.record.address || '住所なし'}）`);
    L.push(`- **出典**:`);
    for (const h of b.hits) {
      L.push(`  - \`${h.layer}\` ${h.label}${h.url ? ` — ${h.url}` : '（一覧ページのみ。個別URLなし）'}`);
    }
    L.push('');
  };

  L.push('## MISSING — 実在側にあるがデータに無い');
  L.push('');
  if (!missing.length) {
    L.push('この地区では出なかった。**ただし「掲載漏れが無い」という意味ではない**（上の限界を参照）。');
    L.push('');
  } else {
    const order = { HIGH: 0, MID: 1, LOW: 2 };
    missing.sort((a, b) => order[a.bucket.confidence] - order[b.bucket.confidence]);
    missing.forEach(renderEntry);
  }

  L.push('## L1 の網羅率（この市町村）');
  L.push('');
  L.push('`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、');
  L.push('その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**');
  L.push('');
  if (!ctx.coverage.length) {
    L.push('この市町村に L1 は無い（L1_NOT_FOUND）。**ORPHAN は判定として使えない。**');
    L.push('');
  } else {
    L.push('| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |');
    L.push('|---|---|---|---|---|---|');
    for (const c of ctx.coverage) {
      L.push(
        `| ${mdEscape(c.label)} | ${c.items} | ${c.total} | ${c.hit} | ${c.rate === null ? '–' : Math.round(c.rate * 100) + '%'} | ${mdEscape(c.missed.join(', ')) || '–'} |`
      );
    }
    L.push('');
  }

  L.push('## ORPHAN — データにあるが、どのソースにも出てこない');
  L.push('');
  if (ctx.orphanTrustable) {
    L.push(`網羅率 ${Math.round(ORPHAN_TRUST_MIN * 100)}% 以上の L1 があるので、**判定として読める**。`);
    L.push('ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。');
  } else {
    L.push('**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**');
    L.push(`網羅率 ${Math.round(ORPHAN_TRUST_MIN * 100)}% 以上の L1 が1つも無い。`);
    L.push('一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。');
  }
  L.push('');
  L.push('**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**');
  L.push('');
  if (!orphan.length) {
    L.push('なし。');
    L.push('');
  } else {
    L.push('| id | 名前 | 住所 | status | needsVerify |');
    L.push('|---|---|---|---|---|');
    for (const r of orphan) {
      L.push(
        `| \`${r.record.id}\` | ${mdEscape(r.record.name)} | ${mdEscape(r.record.address)} | ${r.record.status} | ${r.record.needsVerify ? 'true' : ''} |`
      );
    }
    L.push('');
  }

  L.push('## IN_DATA — 両方にある');
  L.push('');
  if (!inDataRes.length) {
    L.push('なし。');
    L.push('');
  } else {
    L.push('| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |');
    L.push('|---|---|---|---|---|');
    for (const r of inDataRes) {
      L.push(
        `| \`${r.record.id}\` ${mdEscape(r.record.name)} | ${mdEscape(r.bucket.name)} | ${r.matchedBy || '名前'} | ${r.bucket.confidence} | ${[...r.bucket.layers].sort().join('+')} |`
      );
    }
    L.push('');
  }

  /* ---- 出力に載らなかったソース側の項目 ------------------------------- */
  {
    const { b1, b2, b3 } = analyzeDropped(ctx.merged, results, ctx.district);
    const bySrc = droppedBySource(ctx.merged, collected);

    L.push('## 出力に載らなかったソース側の項目');
    L.push('');
    L.push('**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、');
    L.push('この節が何件になっても上の判定は1件も動かない。');
    L.push('');
    L.push('`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**');
    L.push('');
    L.push('| | 意味 | 件数 |');
    L.push('|---|---|---|');
    L.push(`| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **${b1.length}** |`);
    L.push(`| **b2** | 住所はあるが**地区外**。うち市区町村も違う ${b2.filter(b => !b.dropSameCity).length} 件 | **${b2.length}** |`);
    L.push(`| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | ${b3.length} |`);
    L.push('');
    L.push('**b1 と b2 は分けてある。対処が正反対だから。**');
    L.push('b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。');
    L.push('b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。');
    L.push('');
    L.push('**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、');
    L.push('同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**');
    L.push('');

    L.push('### ソース別の行方');
    L.push('');
    L.push('| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |');
    L.push('|---|---|---|---|---|---|---|');
    for (const r of bySrc) {
      L.push(
        `| ${mdEscape(r.label)} | ${r.items} | ${r.normDropped} | ${r.inDist} | ${r.b1} | ${r.b2} | ${r.reconciles ? 'OK' : `**⚠ ${r.accounted} ≠ ${r.items}**`} |`
      );
    }
    L.push('');
    if (bySrc.some(r => !r.reconciles)) {
      L.push('> **⚠ 突合が合わないソースがある。**取得件数と行方の合計が一致しない＝');
      L.push('> どこかでさらに黙って消えている。**この節の件数を信用する前に原因を特定すること。**');
      L.push('');
    }

    const renderDropped = (arr, title, note) => {
      L.push(`### ${title}`);
      L.push('');
      if (note) { L.push(note); L.push(''); }
      if (!arr.length) {
        L.push('なし。**0件が「本当に0件」か「数え方が壊れている」かは、');
        L.push('意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。');
        L.push('');
        return;
      }
      L.push('| 名前 | 住所 | 出典（層 / ソース） |');
      L.push('|---|---|---|');
      for (const b of arr) {
        const srcs = [...new Set(b.hits.map(h => `${h.layer} ${h.sourceId}`))].join(' / ');
        L.push(`| ${mdEscape(b.name)} | ${mdEscape(b.addresses.join(' / ')) || '（住所なし）'} | ${mdEscape(srcs)} |`);
      }
      L.push('');
    };

    /* b1 は原因が2つある。混ぜると対処が決まらないので分けて出す。 */
    const badDetail = failedDetailUrls(collected);
    const causeOf = b => {
      const fails = b.hits
        .map(h => (badDetail.get(h.sourceId) || new Map()).get(h.url))
        .filter(Boolean);
      return fails.length ? `**詳細ページの取得に失敗**（${[...new Set(fails)].join(' / ')}）` : '一覧に住所が無い';
    };
    const b1fetch = b1.filter(b => causeOf(b) !== '一覧に住所が無い');
    const b1spec = b1.filter(b => causeOf(b) === '一覧に住所が無い');

    L.push('### b1 — 住所が無く、他ソースとも合流できなかった');
    L.push('');
    L.push('**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**');
    L.push('これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。');
    L.push('');
    L.push(`**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）${b1spec.length} 件 / b1-2（取得失敗）${b1fetch.length} 件。`);
    L.push('**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**');
    L.push('');

    const b1Table = (arr, title, note) => {
      L.push(`#### ${title}`);
      L.push('');
      L.push(note);
      L.push('');
      if (!arr.length) {
        L.push('なし。**0件が「本当に0件」か「数え方が壊れている」かは、');
        L.push('意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。');
        L.push('');
        return;
      }
      L.push('| 名前 | 出典（層 / ソース） | 原因 | URL |');
      L.push('|---|---|---|---|');
      for (const b of arr) {
        const srcs = [...new Set(b.hits.map(h => `${h.layer} ${h.sourceId}`))].join(' / ');
        const url = b.hits.map(h => h.url).find(Boolean) || '–';
        L.push(`| ${mdEscape(b.name)} | ${mdEscape(srcs)} | ${causeOf(b)} | ${mdEscape(url)} |`);
      }
      L.push('');
    };

    b1Table(b1spec, 'b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）',
      '**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。');
    b1Table(b1fetch, 'b1-2 — 詳細ページの取得に失敗して住所が取れなかった',
      '**これは直せる可能性がある。**`fetchPage` は成功したものしかキャッシュしないので、\n' +
      '失敗した詳細ページは毎回取りに行って毎回失敗する。URL が生きているか確認すること。');

    const b2out = b2.filter(b => !b.dropSameCity);
    const b2in = b2.filter(b => b.dropSameCity);
    renderDropped(b2out, 'b2-a — 住所の市区町村が、この地区の市区町村と違う',
      '**ここだけが「住所が誤っている」疑いの対象。**ただし市単位のソースが\n' +
      '広域を含んでいるだけのこともある（じゃらんは市全体、キャンナビは県全体）。');
    renderDropped(b2in, 'b2-b — 市区町村は同じだが、大字が違う',
      '**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。');

    L.push('### b3 — 住所なしの項目が合流したもの（漏れていない）');
    L.push('');
    if (!b3.length) {
      L.push('なし。');
      L.push('');
    } else {
      L.push('| 合流先 | 分類 | 合流した住所なしの出典 |');
      L.push('|---|---|---|');
      for (const x of b3) {
        const srcs = [...new Set(x.hits.map(h => `${h.layer} ${h.sourceId}`))].join(' / ');
        L.push(`| ${mdEscape(x.bucket.name)} | ${x.kind} | ${mdEscape(srcs)} |`);
      }
      L.push('');
    }
  }

  if (skippedRecords.length) {
    L.push('## 住所が空で、どの地区のスイープにも載らないレコード（全データ横断）');
    L.push('');
    L.push('地区が決まらないので、この地区に限らず**どの地区の突き合わせにも出てこない**。');
    L.push('');
    for (const r of skippedRecords) L.push(`- \`${r.id}\` ${r.name}`);
    L.push('');
  }

  L.push('## confidence の決め方');
  L.push('');
  L.push('| | 条件 |');
  L.push('|---|---|');
  L.push('| HIGH | L1（自治体公式・観光協会・県オープンデータ）に1件でもある |');
  L.push('| MID | L1 に無く、L2（予約サイト）が**2ソース以上** |');
  L.push('| LOW | それ以外（L2 が1ソースだけ、または L3 のみ） |');
  L.push('');
  L.push('**L3 同士は互いに転載しているので、何件重なっても独立性は上がらない。**');
  L.push('だから件数ではなく層で決めている。');
  L.push('');
  L.push(LIMITS_MD);
  return L.join('\n');
}

/* ============================================================================
 * 10. --all の全体まとめ
 *
 * 地区ごとの md だけでは「地区単位で固まっているか」が見えない。
 * ここは**読み方の条件を先に固定してから**数字を出す。
 *
 *   - L1 のある地区と L1_NOT_FOUND の地区を混ぜて IN_DATA 率を比べない。
 *     混ぜると「汚染されている」のか「ソースが弱いだけ」のか区別がつかなくなる
 *   - 名前フィルタで絞っている L1（厚木市・富士河口湖町）の地区は
 *     MISSING が下振れしうる
 * ========================================================================== */

const SUMMARY_OUT = path.join(__dirname, 'sweep-summary-2026-08.md');

/** 宿泊施設の混在一覧を本文判定で絞っている L1 を持つ市町村。 */
const NAME_FILTERED_MUNI = ['厚木市', '富士河口湖町'];

function fieldsOf(r) {
  return {
    lastVerified: r.lastVerified || '(なし)',
    priceVerified: r.priceVerified === true ? 'true' : (r.priceVerified === false ? 'false' : '(なし)'),
    coordsVerified: r.coordsVerified === true ? 'true' : (r.coordsVerified === false ? 'false' : '(なし)'),
    officialUrl: r.officialUrl ? 'あり' : '(なし)',
    coordsGsiChecked: r.coordsGsiChecked === true ? 'true' : '(なし)',
  };
}

function distribution(records, key) {
  const m = new Map();
  for (const r of records) {
    const v = fieldsOf(r)[key];
    m.set(v, (m.get(v) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function renderSummaryMd(done, records, startedAt) {
  const L = [];
  const groupA = done.filter(s => s.l1Registered);
  const groupB = done.filter(s => !s.l1Registered);
  const tot = (arr, k) => arr.reduce((a, s) => a + s.counts[k], 0);

  L.push('# 地区スイープ 全体まとめ（needsVerify 14件の所在地区）');
  L.push('');
  L.push(`実行: ${startedAt}　/　\`node scripts/district-sweep.js --all\``);
  L.push('');
  L.push('**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**');
  L.push('');
  L.push('## 読み方の条件');
  L.push('');
  L.push('この表を読む前に、2つの条件を確認すること。');
  L.push('');
  L.push('### 条件1: L1 の有無で群を分ける');
  L.push('');
  L.push('**群Aと群Bを同じ表で比べてはいけない。**');
  L.push('群Bは L1（自治体公式・観光協会）が存在せず、MISSING が原理的に MID 止まりになる。');
  L.push('IN_DATA が少なくても、それが「掲載が実在と噛み合っていない」のか');
  L.push('「ソースが弱いだけ」なのか**区別がつかない**。群Bは判定不能として扱う。');
  L.push('');
  L.push(`- **群A（L1 が1つ以上）**: ${groupA.length}地区 — ${[...new Set(groupA.map(s => s.muniKey))].join('・')}`);
  L.push(`- **群B（L1_NOT_FOUND）**: ${groupB.length}地区 — ${[...new Set(groupB.map(s => s.muniKey))].join('・')}`);
  L.push('');
  L.push('### 条件2: 名前フィルタの穴');
  L.push('');
  L.push(`**${NAME_FILTERED_MUNI.join('・')}** の L1 は宿泊施設の一覧で、機械で読めるジャンル表示が無い。`);
  L.push('**詳細ページの本文にキャンプ関連語があるか**で選別している');
  L.push('（判定語: キャンプ / テント / オートサイト / バンガロー / 野営）。');
  L.push('亀見橋バカンス村・藤野芸術の家の両方が通ること、ホテル・旅館が空振りすることを実測して採用した。');
  L.push('それでも**本文にキャンプの語を一切書かないキャンプ場は漏れる**ので、');
  L.push('この2市町の MISSING は下振れしうる。多い方には振れない。');
  L.push('');

  // ---- 1. 群A の IN_DATA
  L.push('## 1. 群A — IN_DATA が低い地区');
  L.push('');
  // 一致率 = IN_DATA / データ内件数。**この指標だけが群間で比較できる。**
  const rate = c => (c.inData + c.orphan ? Math.round((c.inData / (c.inData + c.orphan)) * 100) + '%' : '–');
  L.push('| 地区 | データ内 | IN_DATA | ORPHAN | **一致率** | MISSING (H/M/L) | L1 の状態 |');
  L.push('|---|---|---|---|---|---|---|');
  const byInData = [...groupA].sort((a, b) => a.counts.inData - b.counts.inData);
  for (const s of byInData) {
    const c = s.counts;
    const l1 = s.l1Sources.map(x => `${x.label.split(' ')[0]}:${x.status}${x.count}件`).join(' / ');
    const mark = NAME_FILTERED_MUNI.includes(s.muniKey) ? '（名前フィルタ）' : '';
    L.push(
      `| ${s.districtStr}${mark} | ${c.inData + c.orphan} | **${c.inData}** | ${c.orphan} | ${rate(c)} | ${c.missing} (${c.high}/${c.mid}/${c.low}) | ${mdEscape(l1)} |`
    );
  }
  const aTot = groupA.reduce((a, s) => ({ inData: a.inData + s.counts.inData, orphan: a.orphan + s.counts.orphan }), { inData: 0, orphan: 0 });
  L.push(`| **群A 合計** | ${aTot.inData + aTot.orphan} | **${aTot.inData}** | ${aTot.orphan} | **${rate(aTot)}** | | |`);
  L.push('');
  L.push('**一致率 = IN_DATA ÷ その地区のデータ内件数。**群をまたいで比べられるのはこの数字だけ。');
  L.push('');
  const thin = groupA.filter(s => s.counts.inData <= 1);
  L.push(`**IN_DATA が0〜1件の地区: ${thin.length} / ${groupA.length}**`);
  L.push('');
  for (const s of thin) {
    L.push(
      `- **${s.districtStr}** — データ ${s.counts.inData + s.counts.orphan}件のうち一致 ${s.counts.inData}件、` +
      `ORPHAN ${s.counts.orphan}件、実在側の掲載漏れ ${s.counts.missing}件（HIGH ${s.counts.high}）`
    );
  }
  L.push('');
  L.push('群B（判定不能・比較対象外）:');
  L.push('');
  L.push('| 地区 | データ内 | IN_DATA | ORPHAN | MISSING (H/M/L) |');
  L.push('|---|---|---|---|---|');
  for (const s of groupB) {
    const c = s.counts;
    L.push(`| ${s.districtStr} | ${c.inData + c.orphan} | ${c.inData} | ${c.orphan} | ${c.missing} (${c.high}/${c.mid}/${c.low}) |`);
  }
  L.push('');
  L.push('**群Bの MISSING に HIGH が出ないのは仕様。**L1 が無いので構造上ありえない。');
  L.push('');

  // ---- 2. ORPHAN × needsVerify
  // 大字を持たない地区（`南巨摩郡南部町`）は市町村まるごとを指すので、
  // 同じ市町村の大字つき地区（`南巨摩郡南部町福士`）と**レコードが重なる**。
  // 地区別の表はそのまま出すが、ここから先の集計は id で一意にする。
  const orphanRes = [];
  const inDataRes = [];
  const seenOrphan = new Set();
  const seenInData = new Set();
  for (const s of done) {
    for (const r of s.results) {
      if (r.kind === 'ORPHAN' && !seenOrphan.has(r.record.id)) {
        seenOrphan.add(r.record.id);
        orphanRes.push({ ...r, district: s.districtStr, group: s.l1Registered ? 'A' : 'B' });
      }
      if (r.kind === 'IN_DATA' && !seenInData.has(r.record.id)) {
        seenInData.add(r.record.id);
        inDataRes.push({ ...r, district: s.districtStr });
      }
    }
  }
  const orphanFlagged = orphanRes.filter(r => r.record.needsVerify);
  const orphanUnflagged = orphanRes.filter(r => !r.record.needsVerify);
  const inDataFlagged = inDataRes.filter(r => r.record.needsVerify);

  L.push('## 2. ORPHAN と needsVerify の重なり');
  L.push('');
  L.push('`南巨摩郡南部町`（大字なし＝町まるごと）は `南巨摩郡南部町福士` とレコードが重なるため、');
  L.push('ここから先は施設 id で一意にして数えている。地区別の表（上）は重複したまま。');
  L.push('');
  L.push('| | 件数 | 読み |');
  L.push('|---|---|---|');
  L.push(`| needsVerify あり かつ ORPHAN | ${orphanFlagged.length} | 予想どおり |`);
  L.push(`| **needsVerify なし かつ ORPHAN** | **${orphanUnflagged.length}** | **フラグの外側。新しい発見** |`);
  L.push(`| needsVerify あり かつ IN_DATA | ${inDataFlagged.length} | フラグが過剰だった可能性 |`);
  L.push('');
  if (orphanUnflagged.length) {
    L.push('### needsVerify が立っていない ORPHAN');
    L.push('');
    L.push('**これまでどの検査にも引っかかっていない。**ただし ORPHAN は不在の証明ではない（§6-7）。');
    L.push('');
    L.push('| id | 名前 | 住所 | 地区 | 群 | status |');
    L.push('|---|---|---|---|---|---|');
    for (const r of orphanUnflagged) {
      L.push(
        `| \`${r.record.id}\` | ${mdEscape(r.record.name)} | ${mdEscape(r.record.address)} | ${r.district} | ${r.group} | ${r.record.status} |`
      );
    }
    L.push('');
  }
  if (inDataFlagged.length) {
    L.push('### needsVerify が立っているが実在側と一致した');
    L.push('');
    L.push('| id | 名前 | 一致の根拠 | confidence | 地区 |');
    L.push('|---|---|---|---|---|');
    for (const r of inDataFlagged) {
      L.push(`| \`${r.record.id}\` | ${mdEscape(r.record.name)} | ${r.matchedBy || '名前'} | ${r.bucket.confidence} | ${r.district} |`);
    }
    L.push('');
  }

  // ---- 3. MISSING HIGH
  L.push('## 3. MISSING の規模');
  L.push('');
  L.push(`- **MISSING 合計: ${tot(done, 'missing')}件**（群A ${tot(groupA, 'missing')} / 群B ${tot(groupB, 'missing')}）`);
  L.push(`- **うち confidence HIGH: ${tot(done, 'high')}件**（すべて群A。群Bは構造上 HIGH にならない）`);
  L.push(`- MID: ${tot(done, 'mid')}件 / LOW: ${tot(done, 'low')}件`);
  L.push('');
  L.push('HIGH の地区分布:');
  L.push('');
  L.push('| 地区 | MISSING HIGH | 施設 |');
  L.push('|---|---|---|');
  for (const s of done.filter(x => x.counts.high > 0)) {
    const names = s.results.filter(r => r.kind === 'MISSING' && r.bucket.confidence === 'HIGH').map(r => r.bucket.name);
    L.push(`| ${s.districtStr} | ${s.counts.high} | ${mdEscape(names.join(' / '))} |`);
  }
  L.push('');

  // ---- 4. 汚染バッチの検証
  L.push('## 4. 「バッチ単位で作られた」仮説の検証');
  L.push('');
  L.push('ORPHAN が同じ回に投入されたものなら、`lastVerified`・`priceVerified`・');
  L.push('`officialUrl` の有無・`coordsVerified` のパターンが揃うはず。');
  L.push('**揃っていなければこの仮説は捨てる。**無理に読み取らない。');
  L.push('');
  L.push('### ORPHAN 全件のフィールド');
  L.push('');
  L.push('| id | 地区 | needsVerify | lastVerified | priceVerified | coordsVerified | officialUrl |');
  L.push('|---|---|---|---|---|---|---|');
  for (const r of orphanRes) {
    const f = fieldsOf(r.record);
    L.push(
      `| \`${r.record.id}\` | ${r.district} | ${r.record.needsVerify ? 'true' : '–'} | ${f.lastVerified} | ${f.priceVerified} | ${f.coordsVerified} | ${f.officialUrl} |`
    );
  }
  L.push('');
  L.push('### 揃っているか（ORPHAN 全件 vs データ全件）');
  L.push('');
  const orphanRecords = orphanRes.map(r => r.record);
  const verdicts = [];
  // ORPHAN が1件も無い回がある（2026-08-14 の大月・都留・上野原。データ側が
  // 空白地帯だと ORPHAN の元になるレコードがそもそも無い）。
  // **分布を取る対象が空なので最頻値が存在しない。**表を書かずに理由を書く
  // （空の表を出すと「揃っていない」という判定に読めてしまう。判定不能とは違う）。
  if (!orphanRecords.length) {
    L.push('**ORPHAN が0件なので、この検証はできない。**');
    L.push('対象の地区にデータ側のレコードが無い（または全件がソースに載っている）ため、');
    L.push('分布を比べる材料が無い。仮説の成否は今回の結果からは何も言えない。');
    L.push('');
  } else {
  L.push('| フィールド | ORPHAN の分布 | データ全件の分布 | 最頻値の割合（ORPHAN → 全件） | 揃っているか |');
  L.push('|---|---|---|---|---|');
  for (const key of ['lastVerified', 'priceVerified', 'coordsVerified', 'officialUrl']) {
    const d1 = distribution(orphanRecords, key);
    const d2 = distribution(records, key);
    const top = d1[0];
    const share = orphanRecords.length ? top[1] / orphanRecords.length : 0;
    const baseTop = d2.find(x => x[0] === top[0]);
    const baseShare = baseTop ? baseTop[1] / records.length : 0;
    // ORPHAN の8割以上が同じ値で、かつ全件での割合より目立って高いときだけ「揃っている」
    const aligned = share >= 0.8 && share - baseShare >= 0.3;
    verdicts.push({ key, aligned, share, baseShare });
    const pct = x => (x * 100).toFixed(0) + '%';
    L.push(
      `| ${key} | ${mdEscape(d1.map(([v, n]) => `${v}:${n}`).join(' / '))} | ${mdEscape(d2.slice(0, 4).map(([v, n]) => `${v}:${n}`).join(' / '))} | ${mdEscape(top[0])} ${pct(share)} → ${pct(baseShare)}（差 ${((share - baseShare) * 100).toFixed(0)}pt） | ${aligned ? '**揃っている**' : '揃っていない'} |`
    );
  }
  L.push('');
  }
  const alignedCount = verdicts.filter(v => v.aligned).length;
  if (!orphanRecords.length) {
    // 判定基準も結論も書かない。**材料が無いことを「揃わなかった」と書くと嘘になる**
  } else {
  L.push('**判定基準**: ORPHAN の8割以上が同じ値を取り、かつその値の割合がデータ全件より30ポイント以上高いとき「揃っている」とした。');
  L.push('');
  if (alignedCount === 0) {
    L.push(`**結論: 揃わなかった（${alignedCount}/4 フィールド）。**`);
    L.push('ORPHAN のフィールドは、データ全体と比べて特別なパターンを示していない。');
    L.push('**「同じ回にバッチで投入された」という仮説は、この材料では支持されない。**');
    L.push('別の作られ方をしたか、複数回に分かれて入ったか、あるいは ORPHAN の一部が');
    L.push('単にソース側の取りこぼしである（§6-7）。');
  } else if (alignedCount < 3) {
    L.push(`**結論: 部分的にしか揃わなかった（${alignedCount}/4 フィールド）。**`);
    L.push('傍証としては弱い。**この程度の一致でバッチ投入と結論づけてはいけない。**');
  } else {
    L.push(`**結論: ${alignedCount}/4 のフィールドが揃った。**`);
    L.push('バッチ単位で投入された可能性を示す傍証にはなる。');
    L.push('ただしこれは**傍証であって証明ではない**。ORPHAN は不在の証明ではない（§6-7）。');
  }
  }
  L.push('');

  /* ── 今回回していない地区 ────────────────────────────────────────────
   * **これを書かないと「MISSING 0件」と「そもそも調べていない」が同じ見た目になる。**
   * データ全体の地区を数えて、この実行に含まれなかったものを全部出す。
   */
  const covered = new Set(done.map(s => s.districtStr));
  const allDistricts = new Map();
  for (const r of records) {
    if (!r.address) continue;
    const k = districtKey(r.address);
    if (!k) continue;
    if (!allDistricts.has(k)) allDistricts.set(k, []);
    allDistricts.get(k).push(r);
  }
  const notCovered = [...allDistricts.entries()]
    .filter(([k]) => !covered.has(k))
    .map(([k, rs]) => {
      const city = parseDistrict(k).city;
      const entry = MUNI_SOURCES[city];
      return {
        key: k, city, n: rs.length,
        state: !entry ? '**未登録**'
          : (fs.existsSync(path.join(__dirname, `sweep-${k}.md`)) ? '別の実行で済' : '未実施'),
      };
    });
  const unreg = notCovered.filter(x => x.state === '**未登録**');

  L.push('## 今回の対象範囲 — 回していない地区');
  L.push('');
  L.push(`**この実行で回したのは ${done.length} 地区。データ全体は ${allDistricts.size} 地区ある。**`);
  L.push('');
  L.push('**回していない地区は「MISSING 0件」ではない。調べていないだけ。**');
  L.push('この2つを同じ見た目にすると、フラグが立たないことを根拠に使ってしまう。');
  L.push('');
  if (unreg.length) {
    const byCity = new Map();
    for (const x of unreg) byCity.set(x.city, (byCity.get(x.city) || 0) + x.n);
    L.push(`### L1 も L2 も未登録で、**一度も調べていない**: ${unreg.length}地区 / ${byCity.size}市町村`);
    L.push('');
    L.push('| 市町村 | 地区 | レコード |');
    L.push('|---|---|---|');
    for (const [city, n] of [...byCity.entries()].sort((a, b) => b[1] - a[1])) {
      L.push(`| ${city} | ${unreg.filter(x => x.city === city).length} | ${n} |`);
    }
    L.push('');
    L.push('**この市町村のレコードについては、掲載漏れがあるかどうか何も分かっていない。**');
    L.push('`MUNI_SOURCES` に L1/L2 を登録するところから。');
    L.push('');
  }
  const other = notCovered.filter(x => x.state !== '**未登録**');
  if (other.length) {
    L.push(`ほかに ${other.length} 地区は別の実行で済んでいる（`);
    L.push(other.slice(0, 8).map(x => x.key).join(' / ') + (other.length > 8 ? ' ほか' : '') + '）。');
    L.push('');
  }

  L.push('## この検査の限界');
  L.push('');
  L.push('- **MISSING HIGH は「L1 に1件でもある」以上の意味を持たない。**');
  L.push('  2026-08-10 に22件を検証したら**17件が落ちた**（旅館・グランピングのみ・');
  L.push('  バーベキュー場・営業していない施設・既存との重複）。§6-22');
  L.push('- **同名バケットの分裂で MISSING が約9%水増しされる。**');
  L.push('  同じ施設が名前の違いで2つに割れると片方が MISSING に化ける（22件中2件で実測）。');
  L.push('  **候補にする前に大字＋番地で既存と突き合わせること**');
  L.push('- **ORPHAN を判定として読めるのは網羅率7割以上の L1 がある市町村だけ。**');
  L.push('  実測で該当するのは**相模原市（80%）と道志村（75%）の2つ**（`sweep-l1-coverage-2026-08.md`）。');
  L.push('  それ以外の地区の ORPHAN は参考値として出しているだけ');
  L.push('- **なっぷは各エリア10件しか取れていない**（`?page=2` が1ページ目と同じ内容を返す）。');
  L.push('  「なっぷに無い＝営業していない」とは言えない');
  L.push('- **ORPHAN を根拠に `status` を変えない**（§6-7）。ソース不在は不在の証明ではない');
  L.push('- **MISSING が0件でも掲載漏れが無いことにはならない。**フラグが立たないことを根拠に使わない');
  L.push('- 群Bの4項目はどれも判定不能。L1 を見つけるまで結論を出せない');
  L.push('- 各地区の詳細・出典URL・ソースごとの取得状況は `scripts/sweep-<地区>.md` にある');
  L.push('');
  return L.join('\n');
}

/* ============================================================================
 * 11. 本体
 * ========================================================================== */

function loadRecords() {
  // **読むだけ。**このスクリプトに data/ への書き込みは無い
  return JSON.parse(fs.readFileSync(DATA, 'utf8'));
}

/**
 * この md を作ったときの `campgrounds.json` の件数と最終更新。
 *
 * **数が合わない理由を2つに分けるために要る。**あとから突き合わせる側
 * （`dropped-buckets-all.js` の §5）は、これが現在値と違えば
 * 「データが変わった（再sweep要）」、同じなのに数が違えば「判定のバグ」と読める。
 * 記録が無いと**両方とも同じ ❌ になり、本物のバグが drift に埋もれる。**
 */
function dataStamp() {
  const st = fs.statSync(DATA);
  const count = JSON.parse(fs.readFileSync(DATA, 'utf8')).length;
  const t = new Date(st.mtimeMs - new Date().getTimezoneOffset() * 60000);
  return { count, mtime: t.toISOString().slice(0, 19).replace('T', ' ') };
}

function needsVerifyDistricts(records) {
  const out = [];
  for (const r of records.filter(x => x.needsVerify)) {
    const key = r.address ? districtKey(r.address) : null;
    if (!key) {
      out.push({ key: null, record: r });
      continue;
    }
    if (!out.some(o => o.key === key)) out.push({ key, record: r });
  }
  return out;
}

function sourcesFor(districtStr, records) {
  const d = parseDistrict(districtStr);
  const muniKey = d.city;
  const entry = MUNI_SOURCES[muniKey];
  // 県は、その地区のデータ側レコードから拾う。無ければ登録側の pref
  const rec = records.find(r => r.address && inDistrict(r.address, d));
  const pref = (rec && rec.prefecture) || (entry && entry.pref) || null;
  const sources = [];
  if (entry) sources.push(...entry.sources);
  if (pref && PREF_SOURCES[pref]) sources.push(...PREF_SOURCES[pref]);
  return {
    district: d, muniKey, pref, sources, registered: !!entry,
    l1NotFound: (entry && entry.l1NotFound) || [],
  };
}

async function sweepDistrict(districtStr, records, opts) {
  const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const { district, muniKey, pref, sources, registered, l1NotFound } = sourcesFor(districtStr, records);

  if (!registered) {
    console.log(`\n[${districtStr}] 市区町村ソース未登録: ${muniKey}`);
    console.log('  MUNI_SOURCES に L1/L2 を足すまで、この地区は調べたことにならない。');
    console.log('  （0件ではなく「未登録」。フラグが立たないことを根拠に使わない）');
    return { districtStr, skipped: true, muniKey };
  }

  console.log(`\n[${districtStr}] 市区町村=${muniKey} 県=${pref} ソース${sources.length}件`);
  const collected = [];
  for (const src of sources) {
    process.stdout.write(`  ${src.layer} ${src.label} ... `);
    const c = await collectSource(src, opts);
    collected.push(c);
    console.log(`${c.status} ${c.items.length}件`);
  }

  const merged = mergeItems(collected, district);
  const { results, inData } = classify(merged, records, district);
  const selfTest = runSelfTest(districtStr, results);
  const skippedRecords = records.filter(r => !r.address);

  const coverage = l1Coverage(collected, records, muniKey);
  const trustable = orphanTrustable(coverage);

  const md = renderMd({
    districtName: districtStr, district, collected, results, inData,
    selfTest, startedAt, pref, muniKey, skippedRecords, l1NotFound,
    coverage, orphanTrustable: trustable,
    merged,   // 落選分の列挙のため。判定には使わない（9-2）
  });
  const outPath = path.join(__dirname, `sweep-${districtStr}.md`);
  fs.writeFileSync(outPath, md, 'utf8');

  const n = k => results.filter(r => r.kind === k).length;
  const conf = c => results.filter(r => r.kind === 'MISSING' && r.bucket.confidence === c).length;
  const counts = {
    missing: n('MISSING'), high: conf('HIGH'), mid: conf('MID'), low: conf('LOW'),
    inData: n('IN_DATA'), orphan: n('ORPHAN'), l1NotFound: l1NotFound.length + 1, // +1 は県オープンデータ
  };
  console.log(
    `  → MISSING ${counts.missing}（HIGH ${counts.high} / MID ${counts.mid} / LOW ${counts.low}）` +
    ` / IN_DATA ${counts.inData} / ORPHAN ${counts.orphan} / L1_NOT_FOUND ${counts.l1NotFound}`
  );
  if (selfTest) console.log(`  → 必須検証: ${selfTest.pass ? 'PASS' : 'FAIL'}`);
  console.log(`  → ${path.relative(ROOT, outPath)}`);

  const l1Sources = collected
    .filter(c => c.source.layer === 'L1')
    .map(c => ({ label: c.source.label, status: c.status, count: c.items.length }));

  return {
    districtStr, skipped: false, results, selfTest, outPath, counts, muniKey,
    l1Sources, l1Registered: l1Sources.length > 0, coverage, orphanTrustable: trustable,
  };
}

/**
 * `--l1-coverage`。登録済みの全市町村について L1 だけを取り、網羅率を測る。
 * 地区を回さないので L1 のページしか取りに行かない。
 */
async function runL1Coverage(records, opts) {
  const rows = [];
  for (const [muniKey, entry] of Object.entries(MUNI_SOURCES)) {
    const l1 = entry.sources.filter(s => s.layer === 'L1');
    const truth = groundTruthRecords(records, muniKey);
    if (!l1.length) {
      rows.push({ muniKey, pref: entry.pref, coverage: [], truth: truth.length });
      console.log(`${muniKey}: L1 無し（実在確実 ${truth.length}件）`);
      continue;
    }
    const collected = [];
    for (const src of l1) {
      process.stdout.write(`  ${muniKey} ${src.label} ... `);
      const c = await collectSource(src, opts);
      collected.push(c);
      console.log(`${c.status} ${c.items.length}件`);
    }
    const coverage = l1Coverage(collected, records, muniKey);
    rows.push({ muniKey, pref: entry.pref, coverage, truth: truth.length });
    for (const c of coverage) {
      console.log(`    ${c.label} → ${c.hit}/${c.total}（${c.rate === null ? '–' : Math.round(c.rate * 100) + '%'}）`);
    }
  }

  const L = [];
  L.push('# L1 の網羅率（2026-08）');
  L.push('');
  L.push('`node scripts/district-sweep.js --l1-coverage`');
  L.push('');
  L.push('**測り方**: `priceVerified: true` かつ `needsVerify` なしのレコード＝実在がほぼ確実な群。');
  L.push('その市町村ぶんを取り出して、L1 の一覧に何件が載っているかを数えた（名前一致、または大字＋番地の一致）。');
  L.push('');
  L.push('**なぜ測るか**: `tiny-camp-village`（厚木市七沢1854・料金確認済み）が ORPHAN に落ちた。');
  L.push('一覧に載らない実在施設がある L1 では、「載っていない」ことに意味が無い。');
  L.push('');
  L.push(`**判定**: 網羅率 ${Math.round(ORPHAN_TRUST_MIN * 100)}% 以上の L1 が1つでもあれば、その市町村の ORPHAN は判定として読む。`);
  L.push('無ければ参考値に落とす（地区の md にも同じ判定が出る）。');
  L.push('');
  L.push('| 市町村 | L1 | 一覧件数 | 実在確実 | うち掲載 | 網羅率 | ORPHAN 判定 |');
  L.push('|---|---|---|---|---|---|---|');
  for (const r of rows) {
    if (!r.coverage.length) {
      L.push(`| ${r.muniKey} | （L1_NOT_FOUND） | – | ${r.truth} | – | – | **使えない** |`);
      continue;
    }
    const ok = orphanTrustable(r.coverage);
    r.coverage.forEach((c, i) => {
      L.push(
        `| ${i === 0 ? r.muniKey : ''} | ${mdEscape(c.label)} | ${c.items} | ${c.total} | ${c.hit} | ` +
        `${c.rate === null ? '–' : Math.round(c.rate * 100) + '%'} | ${i === 0 ? (ok ? '使える' : '**使えない**') : ''} |`
      );
    });
  }
  L.push('');
  L.push('## 落ちている施設');
  L.push('');
  L.push('実在がほぼ確実なのに L1 の一覧に無いもの。**この分だけ ORPHAN は誤検出する。**');
  L.push('');
  for (const r of rows) {
    for (const c of r.coverage) {
      if (!c.missed.length) continue;
      L.push(`- **${r.muniKey} / ${c.label}** — ${c.missed.map(x => '`' + x + '`').join(', ')}`);
    }
  }
  L.push('');
  L.push('## この測り方の限界');
  L.push('');
  L.push('- **母数が小さい市町村がある。**実在確実が1〜2件だと網羅率は0%か100%にしかならず、');
  L.push('  7割の線を引く意味が薄い。件数を必ず併せて見ること');
  L.push('- `priceVerified: true` は「料金を一次情報で確認した」であって実在の証明ではない。');
  L.push('  §6-13 のとおり**閉鎖した施設ほど料金付きの情報が残る**ので、');
  L.push('  この群にも実在しないものが混じりうる');
  L.push('- **網羅率は下限値。**名前一致は共通の `name-match.js` を使っているので、名寄せの穴が');
  L.push('  そのまま網羅率の穴になる。実例: `camp-akaike`（データ名「CAMP AKAIKE」）は');
  L.push('  富士河口湖町の一覧に「キャンプあかいけ」で載っているが、**ローマ字と かな は照合できず**落ちている。');
  L.push('  つまり実際の網羅率はここに出た数字より高い。');
  L.push('  **ORPHAN を「使えない」側に倒す誤差なので、安全側ではある**（§6-7）');
  L.push('');
  const out = path.join(__dirname, 'sweep-l1-coverage-2026-08.md');
  fs.writeFileSync(out, L.join('\n'), 'utf8');
  console.log(`\n→ ${path.relative(ROOT, out)}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = { useCache: !argv.includes('--no-cache') };
  const records = loadRecords();

  if (argv.includes('--l1-audit')) {
    // 登録済みの全 L1 について、**取れた件数ではなく中身**を出す。
    // 山中湖村で「キャンプ特集」を登録したら、取れた11件が全部
    // 観光スポット（パノラマ台・神社・遊覧船）でキャンプ場0件だった。
    // 件数だけ見ていると気づけない。名前を並べて人が見る。
    const L = [];
    L.push('# L1 の中身の点検（2026-08）');
    L.push('');
    L.push('`node scripts/district-sweep.js --l1-audit`');
    L.push('');
    L.push('**取れた件数ではなく、取れた施設名を全部出す。**');
    L.push('山中湖村で「一覧に見えるページ」を登録したら、取れた11件が全部');
    L.push('観光スポットでキャンプ場が0件だった（`yamanakako-hokuto-check-2026-08.md` K-1）。');
    L.push('件数だけでは気づけないので、名前を並べて目で見る。');
    L.push('');
    L.push('## 判定');
    L.push('');
    L.push('| 判定 | 意味 |');
    L.push('|---|---|');
    L.push('| **OK** | 抽出結果がキャンプ場中心（キャンプ場でないものの混入が1割未満） |');
    L.push('| **MIXED** | 宿泊施設等が混ざるが、キャンプ場も取れている |');
    L.push('| **WRONG_URL** | 入口が一覧ではない。山中湖村と同じ型 → 正しい一覧を探して差し替え |');
    L.push('');
    L.push('| L1 | 抽出 | キャンプ場でないもの | 混入率 | 判定 |');
    L.push('|---|---|---|---|---|');
    for (const v of L1_AUDIT_VERDICT) {
      L.push(`| ${v.label} | ${v.total} | ${v.bad.length ? v.bad.join(' / ') : '—'} | ${v.total ? Math.round(v.bad.length / v.total * 100) : 0}% | **${v.verdict}** |`);
    }
    L.push('');
    L.push('**WRONG_URL は0件。**山中湖村の1件は K-1 で差し替え済み');
    L.push('（`/feature/camp` → `/reserve`。差し替え前は抽出11件が全部観光スポットで、キャンプ場0件だった）。');
    L.push('');
    L.push('### 判定の付け方 — 名前で決めてはいけない');
    L.push('');
    L.push('**最初は施設名を見て判定を付け、山北町の2本を「混入0%」にしていた。誤りだった。**');
    L.push('ロッジ・コテージ系の名前は業態が名前から決まらないので、');
    L.push('一覧の各ページを開いて**テントサイトの記載があるか**で付け直した。');
    L.push('');
    L.push('| 施設 | 名前からの印象 | 実際 |');
    L.push('|---|---|---|');
    L.push('| 丹沢湖ロッヂ | ロッジ | キャンプ場・オートキャンプ・バンガロー → **キャンプ場** |');
    L.push('| ひだまりの里 | 宿 | キャンプ場・オートキャンプ・テント → **キャンプ場** |');
    L.push('| ハーブの里コテージ・オートキャンプ場 | コテージ | オートキャンプ → **キャンプ場** |');
    L.push('| 夢見る河口湖 コテージ戸沢センター | コテージ | オートキャンプ・キャンプサイト → **キャンプ場** |');
    L.push('| tourist base kawaguchiko | 不明 | テント → **キャンプ場** |');
    L.push('| **くろくら森の家** | 森の家 | **総木造2階建コテージ5棟・1棟1泊15,000円。テントサイトの記載なし** |');
    L.push('| **世附川ロッジ** | ロッジ | **バンガローのみ。キャンプ場・テントの記載なし** |');
    L.push('');
    L.push('**キャンプの語を含まない名前がキャンプ場だったのが5件、');
    L.push('キャンプ場に見えたのがキャンプ場でなかったのが2件。**');
    L.push('亀見橋バカンス村・藤野芸術の家と同じで、名前は業態の手がかりにならない。');
    L.push('');
    L.push('### 混入が MISSING に与える影響');
    L.push('');
    L.push('**混入した施設はそのまま MISSING に化ける。**');
    L.push('相模原市観光協会の「本田蘭灯商店」は中央区淵野辺のランタン専門店だが、');
    L.push('データに無いので MISSING として出る。**MISSING を候補にする前に業態を見ること**');
    L.push('（2026-08-10 の MISSING HIGH 22件では、業態違いで2件が落ちた）。');
    L.push('');
    L.push('山中湖村は混入56%と高い。観光協会の「泊まる」がホテル・旅館の一覧で、');
    L.push('本文判定を通り抜けたものが5件ある（旅館の紹介文にキャンプの語が入っていた）。');
    L.push('**この市町村の MISSING は半分以上が宿泊施設だと思って見ること。**');
    L.push('');
    L.push('## この点検で見つけた検査側の問題');
    L.push('');
    L.push('### 1. 富士河口湖町の L1 に「町」抜けの住所があり、地区判定から丸ごと落ちていた');
    L.push('');
    L.push('富士河口湖町観光連盟が「キャンプあかいけ」の住所を');
    L.push('**`南都留郡富士河口湖精進550-127`**（「町」が無い）と書いていた。');
    L.push('市町村が取れないと `districtKey` が null になり、**その施設はどの地区にも載らない。**');
    L.push('件数だけ見ていると「取れている17件」に含まれるので気づけない。');
    L.push('`OLD_MUNI_ALIASES` に `富士河口湖(?!町)` → `富士河口湖町` を足して直した。');
    L.push('');
    L.push('### 2. 直した結果、既知の水増しが1件見えた');
    L.push('');
    L.push('「町」を補ったことで「キャンプあかいけ」が精進の MISSING HIGH に出るようになったが、');
    L.push('**これは誤検出。**データには `camp-akaike`（CAMP AKAIKE）として既にあり、');
    L.push('同じ地区の IN_DATA にも出ている。同じ施設が');
    L.push('**ローマ字表記とかな表記で別バケットに割れた**ため（I-2 で見つけた名寄せの穴）。');
    L.push('md には「同じ番地に別名」として注記が出ている。');
    L.push('');
    L.push('**MISSING の約9%はこの型の水増し**という既知の見積もりが、ここでも実例で確認された。');
    L.push('');
    for (const [muniKey, entry] of Object.entries(MUNI_SOURCES)) {
      for (const src of entry.sources.filter(s => s.layer === 'L1')) {
        process.stdout.write(`  ${muniKey} ${src.label} ... `);
        const c = await collectSource(src, opts);
        console.log(`${c.status} ${c.items.length}件`);
        L.push(`## ${muniKey} — ${src.label}`);
        L.push('');
        L.push(`- 状態: ${c.status} / 抽出 ${c.items.length}件`);
        L.push(`- 入口: ${src.pages[0]}${src.pages.length > 1 ? ` ほか${src.pages.length - 1}ページ` : ''}`);
        if (src.bodyFilter) L.push('- 本文判定あり（宿泊施設の混在一覧）');
        L.push('');
        if (!c.items.length) {
          L.push('**抽出0件。**入口が一覧でない可能性がある（山中湖村と同じ型）。');
          L.push('');
          continue;
        }
        L.push('| # | 施設名 | 住所 |');
        L.push('|---|---|---|');
        c.items.forEach((it, i) => {
          L.push(`| ${i + 1} | ${mdEscape(it.name)} | ${mdEscape(it.address || '—')} |`);
        });
        L.push('');
      }
    }
    const out = path.join(__dirname, 'l1-audit-2026-08.md');
    fs.writeFileSync(out, L.join('\n'), 'utf8');
    console.log(`\n→ ${path.relative(ROOT, out)}`);
    return;
  }

  if (argv.includes('--l1-coverage')) {
    await runL1Coverage(records, opts);
    return;
  }

  if (argv.includes('--list-all-districts')) {
    // 全レコードの所在地区を列挙し、L1 の登録状況とスイープ済みかを出す。
    // `--all`（needsVerify の所在地区だけ）と違い、**データ全体を対象にする**
    const m = new Map();
    for (const r of records) {
      if (!r.address) continue;
      const k = districtKey(r.address);
      if (!k) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    const rows = [...m.entries()].map(([k, rs]) => {
      const city = parseDistrict(k).city;
      const entry = MUNI_SOURCES[city];
      const done = fs.existsSync(path.join(__dirname, `sweep-${k}.md`));
      return {
        key: k, city, n: rs.length, done,
        state: !entry ? '未登録'
          : (entry.sources.some(s => s.layer === 'L1') ? '登録済' : 'L1_NOT_FOUND'),
      };
    }).sort((a, b) => a.city.localeCompare(b.city, 'ja') || b.n - a.n);

    const count = f => rows.filter(f).length;
    console.log(`地区 ${rows.length} / 市町村 ${new Set(rows.map(r => r.city)).size}`);
    console.log(`  スイープ済み ${count(r => r.done)} / 未実施 ${count(r => !r.done)}`);
    console.log(`  L1 登録済 ${count(r => r.state === '登録済')} / L1_NOT_FOUND ${count(r => r.state === 'L1_NOT_FOUND')} / 未登録 ${count(r => r.state === '未登録')}`);
    console.log('');
    for (const r of rows) {
      console.log(`${r.done ? '済' : '  '} ${String(r.n).padStart(2)}件 ${r.key.padEnd(26)} ${r.state}`);
    }
    console.log('\n── 未登録の市町村（L1 の登録が要る） ──');
    const un = [...new Set(rows.filter(r => r.state === '未登録').map(r => r.city))];
    for (const c of un) {
      const ds = rows.filter(r => r.city === c);
      console.log(`  ${c.padEnd(10)} 地区${ds.length} / レコード${ds.reduce((a, x) => a + x.n, 0)}件`);
    }
    return;
  }

  if (argv.includes('--list-districts')) {
    for (const d of needsVerifyDistricts(records)) {
      console.log(
        `${(d.key || '(住所なし)').padEnd(24)} ${d.record.id}  ${MUNI_SOURCES[d.key ? parseDistrict(d.key).city : ''] ? '登録済' : 'ソース未登録'}`
      );
    }
    return;
  }

  // --summary-out で全体まとめの出力先を変えられる。
  // needsVerify 群と対照群を別ファイルに出して比べるため
  const so = argv.indexOf('--summary-out');
  const summaryOut = so >= 0 && argv[so + 1] ? path.resolve(argv[so + 1]) : SUMMARY_OUT;

  let districts;
  // --district は繰り返せる
  const named = argv.reduce((acc, a, i) => (a === '--district' && argv[i + 1] ? [...acc, argv[i + 1]] : acc), []);
  if (named.length) {
    districts = named;
  } else if (argv.includes('--all')) {
    districts = needsVerifyDistricts(records).filter(d => d.key).map(d => d.key);
    const noAddr = needsVerifyDistricts(records).filter(d => !d.key);
    for (const d of noAddr) {
      console.log(`住所が空で地区が決まらない: ${d.record.id} ${d.record.name} → この検査の対象外`);
    }
  } else {
    console.log('使い方:');
    console.log('  node scripts/district-sweep.js --district "相模原市緑区牧野"');
    console.log('  node scripts/district-sweep.js --all');
    console.log('  node scripts/district-sweep.js --list-districts');
    console.log('  （--no-cache で取得キャッシュを無視）');
    process.exitCode = 1;
    return;
  }

  const summary = [];
  for (const d of districts) summary.push(await sweepDistrict(d, records, opts));

  const done = summary.filter(s => !s.skipped);
  if (done.length > 1) {
    console.log('\n=== 地区別まとめ ===');
    console.log('地区'.padEnd(26) + 'MISSING(H/M/L)   IN_DATA  ORPHAN  L1_NOT_FOUND');
    for (const s of done) {
      const c = s.counts;
      console.log(
        s.districtStr.padEnd(26) +
        `${String(c.missing).padStart(3)}(${c.high}/${c.mid}/${c.low})`.padEnd(17) +
        String(c.inData).padStart(5) + String(c.orphan).padStart(8) + String(c.l1NotFound).padStart(11)
      );
    }
    const tot = k => done.reduce((a, s) => a + s.counts[k], 0);
    console.log(
      '合計'.padEnd(26) +
      `${String(tot('missing')).padStart(3)}(${tot('high')}/${tot('mid')}/${tot('low')})`.padEnd(17) +
      String(tot('inData')).padStart(5) + String(tot('orphan')).padStart(8)
    );
    // IN_DATA が 0〜1 の地区。牧野の型（掲載と実在の入れ替わり）が疑われる
    const thin = done.filter(s => s.counts.inData <= 1);
    if (thin.length) {
      console.log('\nIN_DATA が 0〜1 件の地区（掲載と実在が噛み合っていない可能性）:');
      for (const s of thin) {
        console.log(`  ${s.districtStr}  IN_DATA ${s.counts.inData} / MISSING ${s.counts.missing} / ORPHAN ${s.counts.orphan}`);
      }
    }
    // ORPHAN のうち needsVerify が立っていないもの。**フラグの外側にいる**
    const unflagged = [];
    for (const s of done) {
      for (const r of s.results.filter(x => x.kind === 'ORPHAN' && !x.record.needsVerify)) {
        unflagged.push(`${r.record.id}（${s.districtStr} / status=${r.record.status}）`);
      }
    }
    console.log(`\nORPHAN のうち needsVerify が立っていないもの: ${unflagged.length}件`);
    for (const u of unflagged) console.log('  ' + u);

    const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    fs.writeFileSync(summaryOut, renderSummaryMd(done, records, startedAt), 'utf8');
    console.log(`\n→ ${path.relative(ROOT, summaryOut)}`);
  }

  const failed = summary.filter(s => s.selfTest && !s.selfTest.pass);
  if (failed.length) {
    console.log('\n必須検証が FAIL。名寄せかソース選定が間違っている。直すまで先に進まない。');
    process.exitCode = 1;
  }
  const skipped = summary.filter(s => s.skipped);
  if (skipped.length) {
    console.log(`\nソース未登録で調べていない地区が ${skipped.length} 件ある:`);
    for (const s of skipped) console.log(`  ${s.districtStr}（${s.muniKey}）`);
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
}

// `check-muni-sources.js` が URL の死活を機械で回すために公開する。
// **ここに載る URL が死んでいると、その地区は「調べたつもりで何も見ていない」状態になる**
// （check-official-urls.js の DEAD と同じ型。ハードコードは必ず腐る。§18-3）
// SELF_TEST / runSelfTest はオフラインの検証用（sweep はネットが要るが、判定は要らない）
module.exports = { MUNI_SOURCES, PREF_SOURCES, SELF_TEST, runSelfTest, sweepNormalizeName };

// テスト専用。**本体からは使わない。**答えが分かっている入力を通して
// 判定が効いていることを確かめるため（§18-3）だけに公開している。
module.exports._internal = {
  mergeItems, classify, analyzeDropped, droppedBySource, inDistrict, parseDistrict,
  collectSource, sourcesFor, failedDetailUrls, loadRecords, dataStamp, fetchPage, incompleteNote,
  RATE_LIMIT_MAX_ATTEMPTS,
  // 住所の分解。**測定側で作り直さないために公開する**（同じ規則を2か所に書くと片方だけ直る。§18-3）
  splitAddress, banchiKey, districtKey,
  // 異体字表。**いまは名前（sweepNormalizeName）にしか当てていない。**住所には当てていないので
  // 「武川町柳沢」と「武川町柳澤」が別の地区キーになる（2026-08-15 実測）
  VARIANT_CHARS,
  // 429 は意図的に起こせないのでモックで検証する（`.mock-ratelimit-test.js`）。
  // **本体からは絶対に使わない。**
  setFetchImpl(fn) { fetchImpl = fn || ((...a) => fetch(...a)); },
  resetRateLimitState() { originPenalty.clear(); robotsCache.clear(); lastHit.clear(); originChain.clear(); },
  // 対策を切って走らせるためのスイッチ（切り分け用。robots の Crawl-delay は切れない）
  setRateGuard(on) { rateGuard = on !== false; },
  getRateGuard() { return rateGuard; },
  getOriginPenalty(origin) { return originPenalty.get(origin) || 0; },
};
