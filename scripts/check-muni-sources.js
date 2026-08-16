/**
 * `district-sweep.js` の `MUNI_SOURCES` に登録した URL の死活チェック。
 *
 * ## なぜ要るか
 *
 * MUNI_SOURCES は手で登録した URL の一覧＝**ハードコードなので必ず腐る**（§18-3）。
 * ここの URL が死ぬと、その地区は「調べたつもりで何も見ていない」状態になる。
 * `check-official-urls.js` が officialUrl にやっているのと同じことを、
 * 検査ツール自身のソース一覧にも機械で回す。
 *
 * ## 液性検査だけでは足りない
 *
 * HTTP 200 が返っても、**ページの構造が変わって抽出器（`list()`）が0件になる**壊れ方がある
 * （md の書式変更が消費側を黙って壊したのと同じ型。§18-3）。
 * そこで到達確認に加えて、**各ソースの `list()` を実際に走らせて抽出件数を数える。**
 *
 * ## 判定
 *
 *   DEAD     DNS解決失敗 / 接続不能 / タイムアウト / 4xx / 5xx
 *            （403 / 429 はボット遮断の可能性が高いので BLOCKED として分ける）
 *   BLOCKED  403 / 429。サイト自体は生きていることが多い。ブラウザで開いて確認
 *   ROBOTS_403  **robots.txt 自体が403のオリジン。踏んでいない**（`robots-guard.js`）。
 *            「取れなかった」ではなく「取らないと決めた」。**0件と読まない。**
 *            403 は変わりうるので、**定期実行でここを見ていれば解けたときに気づける**
 *   PARKED   到達するが、ドメイン失効・売却・停止の定型文が本文にある
 *   EMPTY    HTTP は正常だが `list()` の抽出が0件。**構造変更で抽出器が腐った疑い**
 *   OK       抽出できた（件数を出す）
 *
 * `l1NotFound[].checked` の URL は「見た結果、一覧が無かった」という**不在の根拠**なので
 * 抽出器を持たない。到達確認だけ行い、死んでいたら NOTFOUND_URL_DEAD として出す
 * （根拠のURLが死ぬと「無かった」という主張ごと検証不能になる）。
 *
 * ## 判定の限界
 *
 *   - DEAD は登録抹消の指示ではない。URL が変わっただけのことが多い。**必ず中身を見てから直す**
 *   - EMPTY はページが JS 描画に変わった場合にも出る。抽出器の修理か、ソースの差し替えかは人が決める
 *   - OK は「一覧が正しい」ことを意味しない。抽出できているというだけ
 *
 * 判定するだけで **`district-sweep.js` も data も書き換えない。**
 *
 *   node scripts/check-muni-sources.js             # 全件
 *   node scripts/check-muni-sources.js --muni=山北町  # 1自治体だけ
 *   node scripts/check-muni-sources.js --list       # 対象URLを数えるだけ（取得しない）
 *   → scripts/muni-sources-check-2026-08.md に「第N回」として追記する
 *
 * robots.txt の Crawl-delay を守る（なっぷは 30 秒）。全件は時間がかかるが仕様。
 *
 * ⚠ **データセンター・プロキシ環境から回さないこと。**2026-08-13 の初走（クラウド環境）は
 * 184/185 が 403 BLOCKED になった。これはサイト側の死活ではなく回線側の遮断。
 * **BLOCKED が大半を占めたら、結果を信用せず自宅回線で回し直すこと**
 * （検査結果が「きれいすぎる」ときと同じで、まず検査自体を疑う）。
 */
const fs = require('fs');
const { assertOriginAllowed } = require('./robots-guard.js');
const path = require('path');

const { MUNI_SOURCES, PREF_SOURCES } = require('./district-sweep.js');

const OUT = path.join(__dirname, 'muni-sources-check-2026-08.md');
const TIMEOUT_MS = 15000;
const DEFAULT_DELAY_MS = 1000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** ドメインの失効・売却・停止を示す定型文（check-official-urls.js と同じ一覧） */
const PARKED_PATTERNS = [
  'ConnectYourDomain',
  'このドメインは',
  'このドメインをお探しですか',
  'お名前.com',
  'ドメインの有効期限',
  'Sorry, this shop is currently unavailable',
  'This domain is for sale',
  'Domain for sale',
  'Buy this domain',
  'さくらのレンタルサーバ',
  'このサイトは現在準備中です',
  'Account Suspended',
  'サービス提供を終了',
];

// ── 対象の収集 ───────────────────────────────────────────────

/**
 * MUNI_SOURCES と PREF_SOURCES を歩いて検査対象を列挙する。
 * 同じソース（なっぷの ashigara など）は複数の自治体で共有されるので URL で束ねる。
 *
 * PREF_SOURCES も検査対象にする。`sourcesFor` が毎地区に足している**実働のソース**で、
 * ここが死んでいても「調べたつもりで何も見ていない」は同じように起きる
 * （walkerPlus は過去に一度 404 を踏んでいる。district-sweep.js のコメント参照）。
 *
 * 同じ URL が source の pages と l1NotFound.checked の両方に載ることがある
 * （松田町の camp.html が実例）。**source を優先する**——抽出検査つきの判定のほうが強く、
 * 先勝ちにすると登録順で判定の強さが変わってしまう。
 */
function collectTargets(muniFilter) {
  const byUrl = new Map(); // url → { url, kind, source|null, group, munis: Set, labels: Set }
  const add = (url, kind, source, muni, label, group) => {
    if (!byUrl.has(url)) {
      byUrl.set(url, { url, kind, source, group, munis: new Set(), labels: new Set() });
    }
    const t = byUrl.get(url);
    // notFound として登録済みの URL が source としても登録されたら、source 側に格上げする
    if (t.kind === 'notFound' && kind === 'source') {
      t.kind = 'source';
      t.source = source;
      t.group = group;
    }
    t.munis.add(muni);
    if (label) t.labels.add(label);
  };
  for (const [muni, entry] of Object.entries(MUNI_SOURCES)) {
    if (muniFilter && muni !== muniFilter) continue;
    for (const src of entry.sources || []) {
      for (const page of src.pages || []) add(page, 'source', src, muni, src.label, `${src.id}|${src.label}`);
    }
    for (const nf of entry.l1NotFound || []) {
      for (const url of nf.checked || []) add(url, 'notFound', null, muni, nf.label, null);
    }
  }
  if (!muniFilter) {
    for (const [pref, srcs] of Object.entries(PREF_SOURCES || {})) {
      for (const src of srcs) {
        for (const page of src.pages || []) {
          add(page, 'source', src, `県共通（${pref}）`, src.label, `${src.id}|${src.label}`);
        }
      }
    }
  }
  return [...byUrl.values()];
}

// ── 取得まわり ───────────────────────────────────────────────

function decodeBody(buf, contentType) {
  const head = Buffer.from(buf).toString('latin1').slice(0, 4096);
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType || '');
  const fromMeta = /charset=["']?([\w-]+)/i.exec(head);
  const raw = (fromHeader?.[1] || fromMeta?.[1] || 'utf-8').toLowerCase();
  const alias = {
    'shift_jis': 'shift_jis', 'shift-jis': 'shift_jis', sjis: 'shift_jis',
    'x-sjis': 'shift_jis', 'windows-31j': 'shift_jis', cp932: 'shift_jis',
    'euc-jp': 'euc-jp', eucjp: 'euc-jp',
  };
  const enc = alias[raw] || 'utf-8';
  const tryDecode = (e) => {
    try {
      return new TextDecoder(e, { fatal: false }).decode(buf);
    } catch {
      return null;
    }
  };
  let text = tryDecode(enc);
  const broken = (s) => !s || (s.match(/�/g) || []).length > s.length / 200;
  if (broken(text)) {
    for (const e of ['utf-8', 'shift_jis', 'euc-jp']) {
      const t = tryDecode(e);
      if (!broken(t)) {
        text = t;
        break;
      }
    }
  }
  return text || '';
}

async function fetchPage(url) {
  // **robots.txt を403で断っているオリジンは踏まない**（robots-guard.js）。
  // **ここで止まったことが記録に残るのが肝。**403 は変わりうるので、
  // 定期実行でこの判定を見ていれば「解けた」ことに気づける（§20-9）
  const guard = await assertOriginAllowed(url);
  if (!guard.allowed) {
    return { status: guard.status, robotsBlocked: true, body: '' };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'text/html,*/*' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, body: decodeBody(buf, res.headers.get('content-type')) };
  } catch (e) {
    return { status: 0, error: e?.cause?.code || e?.name || String(e) };
  } finally {
    clearTimeout(timer);
  }
}

/** robots.txt の Crawl-delay（User-agent: * の節）。無ければ既定の間隔 */
const delayCache = new Map();
async function crawlDelayMs(host) {
  if (delayCache.has(host)) return delayCache.get(host);
  let ms = DEFAULT_DELAY_MS;
  const r = await fetchPage(`https://${host}/robots.txt`);
  if (r.body) {
    let inStar = false;
    for (const line of r.body.split(/\r?\n/)) {
      const ua = /^user-agent:\s*(.+)/i.exec(line.trim());
      if (ua) inStar = ua[1].trim() === '*';
      const cd = /^crawl-delay:\s*(\d+)/i.exec(line.trim());
      if (inStar && cd) ms = Math.max(ms, Number(cd[1]) * 1000);
    }
  }
  delayCache.set(host, ms);
  return ms;
}

// ── 判定 ─────────────────────────────────────────────────────

/**
 * 1URL分の1次判定。抽出0件はここでは白黒つけない（`extracted: 0` を返すだけ）。
 *
 * **EMPTY の判定はソース単位で行う**（`finalizeEmpties`）。
 * なっぷ・hinata は「3ページ固定で登録し、掲載が少なければ後ろのページは空」という
 * 作りなので、**ページ単位で EMPTY を出すと正常なページ送りの終端が大量に鳴る**
 * （初版をキャッシュHTMLで再生したら23ページが誤検出になった）。
 * 「全ページ合算で0件」のときだけ、抽出器が腐った疑いとして EMPTY を出す。
 *
 * **404 の判定も同じ理由でソース単位に送る**（`finalizeDeadPages`）。
 * ここでは素直に DEAD を返しておいて、あとからソース単位で救済する。
 */
function judge(target, res) {
  if (res.robotsBlocked) {
    return {
      status: res.status, verdict: 'ROBOTS_403',
      note: `robots.txt が HTTP ${res.status}。**明示的な拒否なので踏んでいない**（0件ではない）`,
    };
  }
  if (res.status === 0) return { status: 0, verdict: 'DEAD', note: res.error || '接続できない' };
  if (res.status === 403 || res.status === 429) {
    return { status: res.status, verdict: 'BLOCKED', note: `HTTP ${res.status}（ボット遮断の可能性。ブラウザで確認）` };
  }
  if (res.status >= 400) return { status: res.status, verdict: 'DEAD', note: `HTTP ${res.status}` };
  const hit = PARKED_PATTERNS.find((p) => res.body.includes(p));
  if (hit) return { status: res.status, verdict: 'PARKED', note: `定型文「${hit}」` };
  if (target.kind === 'notFound') return { status: res.status, verdict: 'OK', note: '到達のみ確認（不在の根拠URL）' };
  let names = null;
  try {
    names = target.source.list(res.body) || [];
  } catch (e) {
    return { status: res.status, verdict: 'EMPTY', note: `list() が例外: ${e.message}` };
  }
  return { status: res.status, verdict: 'OK', note: `${names.length}件抽出`, extracted: names.length };
}

/**
 * ソース単位の集計で、全ページ0件のソースのページを EMPTY に格下げする。
 * ページ単位で見るとページ送りの終端が誤検出になるため（`judge` のdocコメント参照）。
 */
function finalizeEmpties(results) {
  const byGroup = new Map();
  for (const r of results) {
    if (r.kind !== 'source' || !r.group || r.extracted == null) continue;
    if (!byGroup.has(r.group)) byGroup.set(r.group, 0);
    byGroup.set(r.group, byGroup.get(r.group) + r.extracted);
  }
  for (const r of results) {
    if (r.kind !== 'source' || r.extracted == null) continue;
    const total = byGroup.get(r.group) ?? r.extracted;
    if (total === 0) {
      r.verdict = 'EMPTY';
      r.note = 'HTTP は正常だがソース全ページで抽出0件。構造変更で抽出器が腐った疑い';
    } else if (r.extracted === 0) {
      r.note = `0件（同ソース全体で${total}件。ページ送りの終端）`;
    }
  }
}

/**
 * ソース単位の集計で、ページ送りの終端の 404 を DEAD から OK に戻す。
 *
 * `page_2` / `page_3` を機械的に生やしているソースは、掲載が少ない自治体で
 * 後ろのページが 404 を返す。これは**リンク切れではなく単にページが無いだけ**で、
 * 同じソースの別ページが中身を返しているなら死活としては生きている
 * （初版では jalan 16自治体・japancamp 神奈川の計38件がこれで DEAD に鳴った）。
 *
 * 救済するのは **404 だけ**。403 / 429 は `judge` が BLOCKED として分けており、
 * 500 番台はサーバ側の障害でページの不在ではないので DEAD のままにする。
 * グループの全ページが 404 か接続不能なら、救済の根拠が無いので DEAD のまま。
 */
function finalizeDeadPages(results) {
  const alive = new Map(); // group → 生きているページの抽出合計
  for (const r of results) {
    if (r.kind !== 'source' || !r.group) continue;
    if (r.verdict !== 'OK' || !(r.extracted > 0)) continue;
    alive.set(r.group, (alive.get(r.group) ?? 0) + r.extracted);
  }
  for (const r of results) {
    if (r.kind !== 'source' || !r.group) continue;
    if (r.verdict !== 'DEAD' || r.status !== 404) continue;
    const total = alive.get(r.group);
    if (!total) continue; // 同ソースに生きているページが無い＝本当に死んでいる
    r.verdict = 'OK';
    r.note = `HTTP 404（ページ送りの終端。同ソース全体で${total}件）`;
  }
}

// ── 実行 ─────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const muniFilter = (process.argv.find((a) => a.startsWith('--muni=')) || '').slice(7) || null;
  const listOnly = process.argv.includes('--list');

  const targets = collectTargets(muniFilter);
  console.log(`check-muni-sources: 対象URL ${targets.length}件${muniFilter ? `（${muniFilter}）` : ''}`);
  if (listOnly) {
    for (const t of targets) console.log(`  [${t.kind}] ${t.url}  ← ${[...t.munis].join(', ')}`);
    return;
  }

  // ホストごとに直列（Crawl-delay を守る）。ホスト間は並行
  const byHost = new Map();
  for (const t of targets) {
    const host = new URL(t.url).host;
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push(t);
  }
  const results = [];
  await Promise.all(
    [...byHost.entries()].map(async ([host, list]) => {
      const delay = await crawlDelayMs(host);
      for (let i = 0; i < list.length; i++) {
        if (i > 0) await sleep(delay);
        const t = list[i];
        const res = await fetchPage(t.url);
        const j = judge(t, res);
        results.push({ ...t, ...j });
        console.log(`  ${j.verdict.padEnd(7)} ${t.url}  ${j.note}`);
      }
    })
  );

  // ソース単位の集計で EMPTY と 404 を確定させる（ページ単位では判定しない。judge の docコメント参照）
  finalizeEmpties(results);
  finalizeDeadPages(results);

  // 集計と出力
  const bad = results.filter((r) => r.verdict !== 'OK');
  const order = { DEAD: 0, PARKED: 1, EMPTY: 2, BLOCKED: 3, ROBOTS_403: 4, OK: 5 };
  results.sort((a, b) => order[a.verdict] - order[b.verdict] || a.url.localeCompare(b.url));

  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '# MUNI_SOURCES の死活チェック\n';
  const nth = (prev.match(/^## 第\d+回/gm) || []).length + 1;
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const L = [];
  L.push(`\n## 第${nth}回（${stamp} UTC）${muniFilter ? ` — ${muniFilter} のみ` : ''}`);
  L.push('');
  const robots403 = results.filter((r) => r.verdict === 'ROBOTS_403');
  L.push(`対象 ${results.length}件 / 問題 ${bad.length}件`);
  L.push('');
  if (robots403.length) {
    const origins = [...new Set(robots403.map((r) => { try { return new URL(r.url).origin; } catch { return r.url; } }))];
    L.push(`> **⚠ ${robots403.length}件は測っていない（\`ROBOTS_403\`）。**`);
    L.push('> robots.txt 自体が403のオリジンなので、`robots-guard.js` で踏んでいない。');
    L.push('> **「取れなかった」でも「0件」でもなく、「取らないと決めた」。**');
    L.push(`> 対象オリジン: ${origins.join(' / ')}`);
    L.push('> **403 は変わりうる。**解ければ次の実行で自動的に取れるようになるので、');
    L.push('> ここの件数が減ったら、その自治体の L1 が復活したということ。');
    L.push('');
  }
  L.push('| 判定 | URL | 使っている自治体 | 備考 |');
  L.push('|---|---|---|---|');
  for (const r of results) {
    L.push(`| ${r.verdict} | ${r.url} | ${[...r.munis].join('、')} | ${r.note.replace(/\|/g, '\\|')} |`);
  }
  fs.writeFileSync(OUT, prev + L.join('\n') + '\n', 'utf8');

  console.log(`\n問題 ${bad.length}件（DEAD ${results.filter((r) => r.verdict === 'DEAD').length} / ` +
    `PARKED ${results.filter((r) => r.verdict === 'PARKED').length} / ` +
    `EMPTY ${results.filter((r) => r.verdict === 'EMPTY').length} / ` +
    `BLOCKED ${results.filter((r) => r.verdict === 'BLOCKED').length}）`);
  console.log(`ROBOTS_403 ${robots403.length}件（踏んでいない。0件ではない）`);
  const blocked = results.filter((r) => r.verdict === 'BLOCKED').length;
  if (blocked > results.length / 2) {
    console.log('\n⚠ 過半数が BLOCKED。**サイト側ではなく回線側（データセンター・プロキシ）の遮断の疑い。**');
    console.log('  この結果は信用せず、自宅回線から回し直すこと（ヘッダの注意書き参照）。');
  }
  console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
  if (bad.some((r) => r.verdict === 'DEAD' || r.verdict === 'PARKED' || r.verdict === 'EMPTY')) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}

// オフライン検証用（scripts/.sweep-cache の実HTMLで judge / finalizeEmpties を再生できる）
module.exports = { collectTargets, judge, finalizeEmpties, finalizeDeadPages };
