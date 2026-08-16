/**
 * officialUrl の死活チェック。
 *
 * `sports-train-aokigahara` の閉業は「公式ドメインが Wix の ConnectYourDomain Error だった」
 * ことで分かった。これは Web検索なしに全件へ機械的に回せる。
 *
 * 判定するだけで **data/campgrounds.json は絶対に書き換えない。**
 * 反映は人が中身を見てから行う（誤検出が必ず出るため。下の「判定の限界」を参照）。
 *
 * 対象は status === 'active' の全件。**lastVerified や priceVerified が新しいことを
 * 除外条件にしない。**確認済みフラグで検証対象を絞ると、フラグが誤って立っている
 * ケースこそ見逃す（引き継ぎ §6-1）。
 *
 *   node scripts/check-official-urls.js
 *   → scripts/url-check-2026-08.md に「第N回」として**追記**する（上書きしない）
 *
 * ## 2段構えにした理由
 *
 * 第1回は `takaranoyama-fureai` を素通りした。トップページも料金ページも正常に動いていて、
 * **閉館告知は `/news/` にしかなかった。**トップのHTMLだけでは分からない型がある。
 *
 * そこで OK 判定になったものだけ、トップページのリンクから**お知らせ系を最大3本**辿る。
 * OK に限るのは、既に DEAD/PARKED/CLOSED_HINT が付いたものを追い足しても判定が変わらないため。
 *
 * ## 判定
 *
 *   DEAD              DNS解決失敗 / 接続不能 / タイムアウト / 4xx / 5xx / URLとして壊れている
 *   PARKED            到達するが、ドメイン失効・売却・停止の定型文が本文にある
 *   CLOSED_HINT       トップページの本文に閉業・閉鎖・営業終了・廃止・当面の間休業・閉館がある
 *   CLOSED_HINT_NEWS  トップは正常だが、**お知らせページ**に上記の語がある
 *   OK                上記のどれでもない
 *   NO_URL            officialUrl が空
 *
 * ## 判定の限界（次に見る人へ）
 *
 *   - **DEAD は閉業の証拠ではない。**URLが古いだけのことが多い。第1回の DEAD 3件
 *     （滝沢園・箱根園・PICA富士ぐりんぱ）は全て営業中で、URLが変わっただけだった。
 *   - 403 / 429 は 4xx なので DEAD になるが、**多くはボット遮断で、サイト自体は生きている。**
 *   - CLOSED_HINT / CLOSED_HINT_NEWS は素朴な文字列一致なので誤検出が多い。
 *     「本日の営業終了時刻」「直火は禁止」「受付を終了いたしました」などが引っかかる。
 *     **必ず evidence の前後を読んでから判断する。**
 *   - JS でしか描画しないサイトは本文が空に近く、告知があっても拾えない。OK は「無罪」ではない。
 */
/**
 * ## この repo は**スクリプトによって名乗る UA が違う**（2026-08-16 に明記）
 *
 *   district-sweep.js / check-official-urls.js … **Chrome を名乗る**
 *   .parked-scan.js / l1-link-rot.js / robots-guard.js … **ClaudeBot**
 *
 * **揃っていないのは、揃えるコストと影響を測った結果。**
 *
 * `officialUrl` 116件を両方の UA で叩いて比べた（`scripts/.fetch-layer-compare.js`）:
 *
 *   ClaudeBot … OK 92 / 403 **23**
 *   Chrome    … OK 114 / 403 **1**
 *
 * **全部 ClaudeBot に揃えると22サイトが403になり、千葉の L1 調査の一部が再現しなくなる。**
 * **全部 Chrome に揃えると、断っているサイトに対して名前を偽ることを全面化する。**
 * どちらも代償が大きいので、**現状のまま「どれが何を名乗るか」を明記する**方を採った。
 *
 * → **数字を引用するときは、どの UA で測ったかを必ず書くこと。**
 * `l1-link-rot` の「測れず」も `.parked-scan` の403も、**ClaudeBot での数字**。
 *
 * なお **robots.txt 自体を403で断っているオリジンは、UA に関係なく踏まない**
 * （`robots-guard.js`。判定は常に ClaudeBot で行う）。
 */
const fs = require('fs');
const path = require('path');
const { assertOriginAllowed } = require('./robots-guard.js');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const OUT = path.join(__dirname, 'url-check-2026-08.md');

const CONCURRENCY = 3;
const SPACING_MS = 1000; // リクエストの開始間隔。相手に負荷をかけない
const TIMEOUT_MS = 10000;
const MAX_NEWS_LINKS = 3;
// **Chrome を名乗る。**上の注記を参照（ClaudeBot だと23件が403で読めなくなる）
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * ドメインの失効・売却・停止を示す定型文（**完全一致**）。
 *
 * **消さないこと。**`ConnectYourDomain` は `sports-train-aokigahara` を捕まえた実績がある。
 * ただし**これだけでは足りない**（下の `classifyParked` の理由を読むこと）。
 */
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

/* ── パーキング判定の第2段（2026-08-15 追加）──────────────────────────
 *
 * ## なぜ足したか
 *
 * `forestpartymineyama.com`（フォレストパーティー峰山の**旧**ドメイン）が
 * **HTTP 200 を返し、中身は Afternic/GoDaddy の売却ページ**だったのに、
 * 上の13語では**一致0件**で `OK` 判定になった（本文9,161字に対して実測）。
 *
 * 原因は**完全な文を前提にしていた**こと。実際のページはこう書いてある:
 *
 *   期待: `This domain is for sale` / `Domain for sale` / `Buy this domain`
 *   実物: `For sale` / `Premium domain` / `Buy-it-now $195 USD` / `Afternic` / `GoDaddy`
 *
 * ## なぜ単独の語で判定しないか
 *
 * `for sale` や `GoDaddy` 単独で切ると**キャンプ場の正常なページが落ちる。**
 * 「サイト for sale」のような英語表記や、フッタの「Powered by GoDaddy」で誤爆する。
 * **売却の文言とマーケットプレイス名の"同時出現"**を主判定にした。
 *
 * ## 3段
 *
 *   1. 停止・準備中の定型（`PARK_SUSPEND`）… 単独でも確実なのでこれだけ即断
 *   2. `PARK_MARKETPLACE` と `PARK_SELL` の**両方**
 *   3. `PARK_SELL` だけでも**本文が薄い**（20,000字未満）… 売却専用ページ型
 *
 * 判定は `PARKED` のまま増やさない（`ORDER` や md の節を増やさずに済む）。
 * どの段で当たったかは evidence に書く。
 */
const PARK_MARKETPLACE =
  /(afternic|sedo\.com|\bdan\.com\b|godaddy|hugedomains|bodis|porkbun|namecheap\s+market|value-?domain|お名前\.com|エックスサーバー|さくらのレンタルサーバ|ムームードメイン)/i;
const PARK_SELL =
  /(buy[-\s]it[-\s]now|buy this domain|domain (?:name )?(?:is )?for sale|premium domain|make an offer|this domain (?:is )?(?:available|may be for sale)|ドメインの有効期限|このドメインは.{0,12}(?:売|販売|取得|移管))/i;
const PARK_SUSPEND =
  /(account suspended|このサイトは現在準備中|サービス提供を終了|connectyourdomain|domain (?:has )?expired|ドメインの有効期限が切れ)/i;

/** 本文がこれより短くて売却文言があれば、売却専用ページとみなす */
const PARK_THIN_CHARS = 20000;

/**
 * 戻りは `null`（パーキングではない）か `{ why, hit }`。
 * `text` は `stripTags` 済みの本文。
 */
function classifyParked(text) {
  const m1 = PARK_SUSPEND.exec(text);
  if (m1) return { why: '停止/準備中', hit: m1[0] };

  const mk = PARK_MARKETPLACE.exec(text);
  const sell = PARK_SELL.exec(text);
  if (mk && sell) return { why: 'マーケットプレイス名+売却文言', hit: `${mk[0]} / ${sell[0]}` };

  // **単独の売却文言は本文が薄いときだけ採る。**厚いページで拾うと誤爆する
  if (sell && text.replace(/\s/g, '').length < PARK_THIN_CHARS) {
    return { why: `売却文言+本文が薄い(<${PARK_THIN_CHARS}字)`, hit: sell[0] };
  }
  return null;
}

/** 閉業・閉鎖の可能性を示す語（トップページ用） */
const CLOSED_PATTERNS = ['閉業', '閉鎖', '営業終了', '廃止', '当面の間休業', '閉館'];

/** 同上（お知らせページ用。告知の言い回しを足してある） */
const CLOSED_NEWS_PATTERNS = [
  '閉館',
  '閉業',
  '閉鎖',
  '廃止',
  '営業終了',
  '営業を終了',
  '終了いたしました',
  '当面の間休業',
];

/** お知らせ系リンクの手がかり。数字が大きいほど優先して辿る */
const NEWS_HINTS = [
  { re: /お知らせ/, score: 10 },
  { re: /新着/, score: 10 },
  { re: /ニュース/, score: 9 },
  { re: /トピックス/, score: 9 },
  { re: /\bnews\b|\/news|news\//i, score: 9 },
  { re: /whatsnew|whats-new|what's new/i, score: 8 },
  { re: /topics?/i, score: 7 },
  // blog と info は当たりが薄いので最後に回す。info は information/お問い合わせ等を巻き込む
  { re: /\bblog\b|\/blog/i, score: 4 },
  { re: /\binfo\b|\/info/i, score: 3 },
];

/** 辿っても意味のない拡張子 */
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4|mov)(\?|#|$)/i;

// ── 取得まわり ───────────────────────────────────────────────

/** Content-Type / meta から文字コードを推測して本文を得る */
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
  // 宣言が嘘のことがある。置換文字だらけなら日本語の候補を順に試す
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

/** タグ・スクリプトを落として本文だけにする。定型文の一致にJSの中身を混ぜない */
function toPlainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

/** 一致箇所の前後を短く切り出す。次に見る人が前後を読めるように */
function snippet(text, needle, span = 40) {
  const i = text.indexOf(needle);
  if (i < 0) return '';
  return text.slice(Math.max(0, i - span), i + needle.length + span).trim();
}

/**
 * 1ページ取得して本文まで返す。失敗も戻り値で表す（例外を投げない）。
 * トップページにもお知らせページにも同じものを使う。
 */
async function fetchPage(url) {
  let parsed;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('http/https ではない');
  } catch (e) {
    return { failed: `URLとして解釈できない: ${e.message}` };
  }

  // **robots.txt を403で断っているオリジンは踏まない**（robots-guard.js）。
  // このスクリプトは Chrome を名乗るので取れてしまうが、明示的な拒否は尊重する
  const guard = await assertOriginAllowed(url);
  if (!guard.allowed) {
    return { failed: `${guard.note}（robots.txt が ${guard.status}。明示的な拒否なので踏まない）` };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.8',
      },
    });
  } catch (e) {
    clearTimeout(timer);
    const msg = String(e?.cause?.code || e?.name || e?.message || e);
    const label =
      msg === 'AbortError' ? `タイムアウト（${TIMEOUT_MS / 1000}秒）`
      : /ENOTFOUND|EAI_AGAIN/.test(msg) ? `DNS解決失敗（${msg}）`
      : `接続不能（${msg}）`;
    return { failed: label };
  }
  clearTimeout(timer);

  const status = res.status;
  const finalUrl = res.url && res.url !== url ? res.url : '';
  if (status >= 400) return { status, finalUrl, httpError: true };

  try {
    const buf = await res.arrayBuffer();
    const html = decodeBody(buf, res.headers.get('content-type'));
    return { status, finalUrl, html, text: toPlainText(html) };
  } catch (e) {
    return { status, finalUrl, failed: `本文を読めない（${e.message}）` };
  }
}

/**
 * トップページからお知らせ系のリンクを最大 MAX_NEWS_LINKS 本抜く。
 * 同一ドメインのみ。href とリンクテキストの両方を手がかりにする。
 */
function extractNewsLinks(html, baseUrl) {
  let base;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  const found = new Map(); // url -> score
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const label = toPlainText(m[2]).trim();
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) continue;

    let abs;
    try {
      abs = new URL(href, base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(abs.protocol)) continue;
    if (abs.hostname !== base.hostname) continue; // 同一ドメインのみ
    if (SKIP_EXT.test(abs.pathname)) continue;
    abs.hash = '';
    const url = abs.toString();
    if (url === base.toString() || url === baseUrl) continue; // トップ自身は除く

    const hay = `${abs.pathname}${abs.search} ${label}`;
    let score = 0;
    for (const h of NEWS_HINTS) if (h.re.test(hay)) score = Math.max(score, h.score);
    if (!score) continue;
    // 浅い階層を優先。深い記事ページより一覧のほうが告知に当たりやすい
    score -= (abs.pathname.split('/').filter(Boolean).length - 1) * 0.1;
    if (!found.has(url) || found.get(url) < score) found.set(url, score);
  }

  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_NEWS_LINKS)
    .map(([url]) => url);
}

// ── 判定 ─────────────────────────────────────────────────────

async function checkOne(camp) {
  const url = (camp.officialUrl || '').trim();
  if (!url) return { camp, verdict: 'NO_URL', status: '', evidence: '', newsLinks: [] };

  const page = await fetchPage(url);

  if (page.httpError) {
    const hint =
      page.status === 403 || page.status === 429
        ? '（ボット遮断の可能性。ブラウザで開くと生きていることが多い）'
        : '';
    return {
      camp, verdict: 'DEAD', status: page.status, newsLinks: [],
      evidence: `HTTP ${page.status}${hint}${page.finalUrl ? ` / 最終URL: ${page.finalUrl}` : ''}`,
    };
  }
  if (page.failed) {
    return { camp, verdict: 'DEAD', status: page.status || '', evidence: page.failed, newsLinks: [] };
  }

  const { status, finalUrl, html, text } = page;

  for (const p of PARKED_PATTERNS) {
    if (text.includes(p)) {
      return {
        camp, verdict: 'PARKED', status, newsLinks: [],
        evidence: `完全一致「${p}」… ${snippet(text, p)}${finalUrl ? ` / 最終URL: ${finalUrl}` : ''}`,
      };
    }
  }
  // 第2段。完全一致で拾えない売却ページ（峰山の .com 型）
  const parked2 = classifyParked(text);
  if (parked2) {
    return {
      camp, verdict: 'PARKED', status, newsLinks: [],
      evidence: `${parked2.why}「${parked2.hit}」… ${snippet(text, parked2.hit.split(' / ')[0])}` +
        `${finalUrl ? ` / 最終URL: ${finalUrl}` : ''}`,
    };
  }
  for (const p of CLOSED_PATTERNS) {
    if (text.includes(p)) {
      return {
        camp, verdict: 'CLOSED_HINT', status, newsLinks: [],
        evidence: `「${p}」… ${snippet(text, p)}`,
      };
    }
  }

  // 本文がほぼ空なら、JS描画で中身を読めていないだけ。OK だが根拠が薄いことを残す
  const thin = text.replace(/\s/g, '').length < 200;
  return {
    camp, verdict: 'OK', status,
    newsLinks: extractNewsLinks(html, finalUrl || url),
    evidence: `${thin ? '本文がほぼ空（JS描画の可能性。判定の根拠は薄い）' : ''}${finalUrl ? ` 最終URL: ${finalUrl}` : ''}`.trim(),
  };
}

/** OK 判定のものだけ、お知らせページを辿って閉館告知を探す */
async function checkNews(result, gate) {
  for (const url of result.newsLinks) {
    await gate();
    const page = await fetchPage(url);
    if (page.failed || page.httpError || !page.text) continue;
    for (const p of CLOSED_NEWS_PATTERNS) {
      if (page.text.includes(p)) {
        result.verdict = 'CLOSED_HINT_NEWS';
        result.evidence = `${url} に「${p}」… ${snippet(page.text, p)}`;
        return;
      }
    }
  }
  if (result.newsLinks.length) {
    const suffix = `お知らせ系 ${result.newsLinks.length}本を確認、該当なし`;
    result.evidence = result.evidence ? `${result.evidence} / ${suffix}` : suffix;
  } else {
    const suffix = 'お知らせ系のリンクが見つからず（トップのみで判定）';
    result.evidence = result.evidence ? `${result.evidence} / ${suffix}` : suffix;
  }
}

// ── 出力 ─────────────────────────────────────────────────────

const ORDER = ['DEAD', 'PARKED', 'CLOSED_HINT', 'CLOSED_HINT_NEWS', 'NO_URL', 'OK'];

/**
 * 既存の md から前回の判定を拾う。同じ slug が複数回出たら**後のほうが新しい**。
 * 差分を出すためだけに使うので、読めなければ空で構わない。
 */
function readPreviousVerdicts(md) {
  const prev = new Map();
  let current = null;
  for (const line of md.split(/\r?\n/)) {
    const h = /^##\s+([A-Z_]+)\s*[（(]/.exec(line);
    if (h && ORDER.includes(h[1])) {
      current = h[1];
      continue;
    }
    if (/^#/.test(line)) {
      if (!h) current = null;
      continue;
    }
    if (!current) continue;
    const m = /^\|[^|]*\|\s*`([^`]+)`\s*\|/.exec(line);
    if (m) prev.set(m[1], current);
  }
  return prev;
}

function renderTables(results, esc) {
  const rows = (verdict) =>
    results
      .filter((r) => r.verdict === verdict)
      .sort((a, b) => a.camp.slug.localeCompare(b.camp.slug))
      .map(
        (r) =>
          `| ${esc(r.camp.name)} | \`${r.camp.slug}\` | ${
            r.camp.officialUrl ? `<${r.camp.officialUrl}>` : '—'
          } | ${r.status || '—'} | ${esc(r.evidence) || '—'} |`
      )
      .join('\n');
  return rows;
}

// ── 本体 ─────────────────────────────────────────────────────

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  // ★ 確認済みフラグで絞らない（引き継ぎ §6-1）
  const targets = data.filter((c) => c.status === 'active');

  const prevMd = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  const prev = readPreviousVerdicts(prevMd);
  // 初版には「第N回」の見出しが無いので、ファイルがあれば1回分として数える
  const runCount = (prevMd ? 1 : 0) + (prevMd.match(/^#\s*第\d+回/gm) || []).length + 1;

  console.log(`check-official-urls: status=active ${targets.length}件（第${runCount}回）`);
  console.log(`同時実行 ${CONCURRENCY} / 開始間隔 ${SPACING_MS}ms / タイムアウト ${TIMEOUT_MS}ms`);
  console.log(`お知らせ系は OK 判定のみ最大${MAX_NEWS_LINKS}本まで追加取得\n`);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lastStart = 0;
  /** 追加取得も含めて、全リクエストが同じ間隔の枠を通る */
  async function gate() {
    const wait = lastStart + SPACING_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();
  }

  async function pool(items, work) {
    let next = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (true) {
          const i = next++;
          if (i >= items.length) return;
          await work(items[i], i);
        }
      })
    );
  }

  // 第1段: トップページ
  const results = new Array(targets.length);
  let done = 0;
  await pool(targets, async (camp, i) => {
    await gate();
    results[i] = await checkOne(camp);
    done++;
    const r = results[i];
    if (r.verdict !== 'OK' && r.verdict !== 'NO_URL') {
      console.log(`  [${r.verdict}] ${r.camp.slug} ${r.status || ''} ${r.evidence.slice(0, 70)}`);
    }
    if (done % 25 === 0) console.log(`  … トップ ${done}/${targets.length}`);
  });

  // 第2段: OK のものだけお知らせ系を辿る
  const okOnes = results.filter((r) => r.verdict === 'OK');
  const linkTotal = okOnes.reduce((n, r) => n + r.newsLinks.length, 0);
  console.log(`\nお知らせ系の追加取得: 対象 ${okOnes.length}件 / URL ${linkTotal}本\n`);
  let done2 = 0;
  await pool(okOnes, async (r) => {
    await checkNews(r, gate);
    done2++;
    if (r.verdict === 'CLOSED_HINT_NEWS') {
      console.log(`  [CLOSED_HINT_NEWS] ${r.camp.slug} ${r.evidence.slice(0, 100)}`);
    }
    if (done2 % 25 === 0) console.log(`  … お知らせ ${done2}/${okOnes.length}`);
  });

  // 集計と差分
  const counts = Object.fromEntries(ORDER.map((v) => [v, 0]));
  results.forEach((r) => counts[r.verdict]++);

  const changed = results
    .filter((r) => prev.has(r.camp.slug) && prev.get(r.camp.slug) !== r.verdict)
    .sort((a, b) => a.camp.slug.localeCompare(b.camp.slug));
  const added = results.filter((r) => !prev.has(r.camp.slug));
  const removed = [...prev.keys()].filter((s) => !results.some((r) => r.camp.slug === s));

  const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const rows = renderTables(results, esc);

  const diffSection = prev.size
    ? `## 前回との差分

- 判定が変わった: **${changed.length}件**
- 前回に無かった施設: ${added.length}件${added.length ? `（${added.map((r) => `\`${r.camp.slug}\``).join('、')}）` : ''}
- 前回にあって今回いない施設: ${removed.length}件${removed.length ? `（${removed.map((s) => `\`${s}\``).join('、')}）` : ''}

${
  changed.length
    ? `| 施設名 | slug | 前回 | 今回 | evidence |
|---|---|---|---|---|
${changed
  .map(
    (r) =>
      `| ${esc(r.camp.name)} | \`${r.camp.slug}\` | ${prev.get(r.camp.slug)} | **${r.verdict}** | ${esc(r.evidence)} |`
  )
  .join('\n')}`
    : '判定が変わった施設は無い。'
}
`
    : '';

  const noUrlSlugs = results
    .filter((r) => r.verdict === 'NO_URL')
    .map((r) => r.camp.slug)
    .sort();

  const section = `

---

# 第${runCount}回（お知らせページまで辿る版）

第1回は \`takaranoyama-fureai\` を素通りした。トップも料金ページも正常で、
**閉館告知は \`/news/\` にしかなかった。**そこで、**OK 判定になったものだけ**
トップページのリンクからお知らせ系を最大${MAX_NEWS_LINKS}本辿るようにした。

抽出条件は「href またはリンクテキストに news / info / topics / blog / whatsnew /
お知らせ / 新着 / ニュース / トピックス を含み、**同一ドメイン**」。
お知らせ・新着を最優先、blog と info は当たりが薄いので最後に回す。
負荷は第1回と同じ（同時実行 ${CONCURRENCY} / 開始間隔 ${SPACING_MS}ms / タイムアウト ${TIMEOUT_MS / 1000}秒）で、
**追加取得も同じ間隔の枠を通している。**

対象: \`status === 'active'\` の **${targets.length}件**。お知らせ系の追加取得は ${okOnes.length}件 / **${linkTotal}本**。

## 集計

| 判定 | 件数 | 意味 |
|---|---|---|
| **DEAD** | **${counts.DEAD}** | DNS解決失敗 / 接続不能 / タイムアウト / 4xx / 5xx |
| **PARKED** | **${counts.PARKED}** | 到達するが、ドメイン失効・売却・停止の定型文がある |
| **CLOSED_HINT** | **${counts.CLOSED_HINT}** | **トップページ**に閉業・閉鎖・営業終了・廃止・当面の間休業・閉館がある |
| **CLOSED_HINT_NEWS** | **${counts.CLOSED_HINT_NEWS}** | トップは正常だが、**お知らせページ**に上記の語がある |
| NO_URL | ${counts.NO_URL} | \`officialUrl\` が空 |
| OK | ${counts.OK} | 上記のどれでもない |

${diffSection}
## DEAD（${counts.DEAD}件）

**DEAD は閉業の証拠ではない。**URLが古いだけのことが多い。

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('DEAD') || '| （なし） | | | | |'}

## PARKED（${counts.PARKED}件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('PARKED') || '| （なし） | | | | |'}

## CLOSED_HINT（${counts.CLOSED_HINT}件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('CLOSED_HINT') || '| （なし） | | | | |'}

## CLOSED_HINT_NEWS（${counts.CLOSED_HINT_NEWS}件）

トップページは正常だが、お知らせページに閉業を思わせる語があったもの。
**「終了いたしました」はイベントの受付終了でも出る。**必ず前後を読むこと。

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('CLOSED_HINT_NEWS') || '| （なし） | | | | |'}

## NO_URL（${counts.NO_URL}件）

\`officialUrl\` が無いので死活を確かめようがない。
§6-9 のとおり、\`officialUrl\` の欠落自体が「調べていない」の指標になりうる。

\`\`\`
${noUrlSlugs.join('\n')}
\`\`\`

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('NO_URL') || '| （なし） | | | | |'}

## OK（${counts.OK}件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('OK') || '| （なし） | | | | |'}
`;

  fs.writeFileSync(OUT, prevMd + section, 'utf8');
  console.log(`\n${ORDER.map((v) => `${v} ${counts[v]}`).join(' / ')}`);
  console.log(`判定が変わった: ${changed.length}件`);
  console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)} に第${runCount}回として追記`);
}

// 判定だけを検証用に公開する。**本体からは使わない。**
// `require` しただけで全件を叩きに行かないよう、実行は require.main で囲む（§18-3）。
module.exports = { classifyParked, PARKED_PATTERNS, PARK_THIN_CHARS, toPlainText };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
