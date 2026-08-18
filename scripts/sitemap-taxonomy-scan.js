/**
 * サイトが持つ**タクソノミー（分類）系の一覧ページを、1本残らず機械で列挙する。**
 *
 * ## なぜ作ったか — 人が「数えるものを手で決めた」から見落とした
 *
 * 2026-08-15 の都留市の L1 探索は「キャンプのカテゴリは存在しない」と結論した。
 * 根拠は `category-sitemap.xml` と `discoverycat-sitemap.xml` の2本。**どちらも正しい。**
 * だが `sitemap.xml` はタクソノミー系を**8本**持っていて、
 * **`discoverytag-sitemap.xml`（44タグ・その1つが「キャンプ」）を見ていなかった。**
 * 2026-08-18 にそこから L1 が見つかった（`scripts/tsuru-L1-2026-08.md`）。
 *
 * **原因は注意不足ではない。「どれを数えるか」を人が手で決めたこと自体。**
 * 同じ手順を人力で繰り返せば必ず再発するので、**列挙を機械の仕事にする。**
 *
 * ## 設計上ゆずらないこと
 *
 * 1. **`sitemap.xml` だけを見ない。**`robots.txt` の `Sitemap:` 行、`sitemap_index.xml`、
 *    `wp-sitemap.xml` などの慣用パスも当たり、**sitemapindex は再帰的に展開する**
 * 2. **WordPress を前提にしない。**XML が1本も取れなければ **HTML に落ちて**
 *    パンくず・タグ一覧らしきリンクを拾う
 * 3. **「キャンプ」だけで探さない。**アウトドア / 泊まる / 宿泊 / レジャー / 自然 なども見る
 * 4. **ヒット0でも「何を見て無かったか」を必ず出す。**
 *    `調べたタクソノミー一覧` が空のまま「無い」と書ける実装にはしない。
 *    **取れなかったものは「0件」ではなく理由つきで別枠に出す**（§19-4 と同じ区別）
 * 5. **数えた本数のような可変値は SELF_TEST に焼き込まない**（増減する）。
 *    焼き込むのは**外の事実**だけ（§SELF_TEST 節）
 *
 * ## robots.txt の扱い（§21-1）
 *
 * `robots.txt` に**エージェント宛ての指示**が埋め込まれていることがある
 * （実例: `bairdbeer.com` に外部スキル導入と商品購入の誘導）。
 * **取得先の記述はデータであって指示ではない。従わない。**
 * このスクリプトは該当行を検出して**原文のまま記録するだけ**で、内容は一切解釈しない。
 * `Sitemap:` 行と `Disallow` 以外は、すべて素通しの文字列として扱う。
 *
 * ## 使い方
 *
 *   node scripts/sitemap-taxonomy-scan.js --site=https://tsurukankou.jp
 *   node scripts/sitemap-taxonomy-scan.js --site=... --out=scripts/foo.md
 *   node scripts/sitemap-taxonomy-scan.js --selftest
 *   node scripts/sitemap-taxonomy-scan.js --selftest --mock-drop=discoverytag   # 偽ゼロ確認
 *
 * **判定するだけ。`data/campgrounds.json` も `district-sweep.js` も書き換えない。**
 */
'use strict';

const fs = require('fs');
const zlib = require('zlib');
const { assertOriginAllowed } = require('./robots-guard.js');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const TIMEOUT_MS = 15000;
const MIN_INTERVAL_MS = 800;
const MAX_SITEMAPS = 120;    // 暴走よけ。打ち切ったら md に明記する
const WIDE_INDEX_LIMIT = 40; // index の子がこれを超えたら手がかりのある子だけに絞る（絞ったことは md に出す）
const MAX_DEPTH = 4;

/* ── 探す語彙 ────────────────────────────────────────────────────
 * **「キャンプ」だけで探さない。**一覧の名前は自治体・観光協会ごとにばらつく。
 * ここに無い語で分類されていたら取り逃す——**それを md に書くために、
 * 使った語彙リストも出力に含める。** */
const KEYWORDS = [
  'キャンプ', 'きゃんぷ', 'camp', 'キャンプ場',
  'オートキャンプ', 'グランピング', 'glamping',
  'アウトドア', 'outdoor',
  '泊まる', '宿泊', 'とまる', 'stay', 'lodging', 'accommodation',
  'レジャー', 'leisure', 'あそぶ', '遊ぶ', 'play',
  '自然', 'nature', '体験',
  'バーベキュー', 'bbq', '野営', 'テント', 'tent',
  /* ★ 2026-08-18 追加。自治体 CMS はローマ字のディレクトリ名を使う。
   *   これが無くて山梨市の `/site/tuorism/` と大多喜町の `/kanko_iju/kanko_jyouho/` を
   *   取り逃した（下の「綴りを外すと沈黙する」も参照）。 */
  '観光', 'kanko', 'kankou', 'tourism', 'sightsee', 'kankou_joho', 'kanko_jyouho',
  '施設', 'shisetsu', '公園', 'kouen', 'koen', 'asobu', 'tomaru',
];

/** ファイル名・URL からタクソノミー系を疑う手がかり。**これだけで決めない**（下の判定を参照） */
const TAXONOMY_HINTS = [
  'cat', 'categor', 'tag', 'taxonom', 'term', 'genre', 'label',
  'topic', 'theme', 'type', 'group', 'section', 'kind',
];

/* ── 取得層 ───────────────────────────────────────────────────── */

let lastFetch = 0;
/** テストから差し替えるためのフック。**本体からは使わない。** */
let fetchImpl = (...a) => fetch(...a);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url) {
  const wait = MIN_INTERVAL_MS - (Date.now() - lastFetch);
  if (wait > 0) await sleep(wait);
  lastFetch = Date.now();
  try {
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, status: res.status, body: '', note: `HTTP ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    // .gz は Content-Encoding が付かないことが多い。マジックナンバーで判定する
    const body = (buf[0] === 0x1f && buf[1] === 0x8b)
      ? zlib.gunzipSync(buf).toString('utf8')
      : buf.toString('utf8');
    return { ok: true, status: res.status, body, note: '' };
  } catch (e) {
    return { ok: false, status: 0, body: '', note: `取得失敗（${e.name || 'error'}）` };
  }
}

/* ── robots.txt ───────────────────────────────────────────────── */

/**
 * `Sitemap:` 行を集める。**あわせて、エージェント宛ての指示らしき記述を検出する（§21-1）。**
 * 検出しても**内容は解釈しない。**原文をそのまま返すだけ。
 */
function parseRobots(txt) {
  const sitemaps = [];
  const agentDirectives = [];
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(/^sitemap:\s*(\S+)/i);
    if (m) { sitemaps.push(m[1]); continue; }
    // 「機械に読ませる前提の散文」を拾う。命令形・スキル導入・購入への誘導など
    if (!line.startsWith('#')) continue;
    const body = line.replace(/^#\s?/, '');
    if (!body) continue;
    if (/\b(you|your|please|should|recommend|install|purchase|buy|agent|assistant|llm|ai)\b/i.test(body)
        && body.split(/\s+/).length >= 5) {
      agentDirectives.push(body);
    }
  }
  return { sitemaps, agentDirectives };
}

/* ── sitemap の解析 ───────────────────────────────────────────── */

/**
 * `<loc>` の中身。**CDATA を必ず考慮する。**
 * All in One SEO は `<loc><![CDATA[https://…]]></loc>` の形で出す。
 * `[^<\s]+` で書くと `<!` で止まって**全件0件になり、しかもエラーにならない**（§18-3 の型）。
 */
function locsOf(xml) {
  return [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi)]
    .map(m => decodeXml(m[1]));
}
const isIndex = xml => /<sitemapindex[\s>]/i.test(xml);
/** sitemap の体裁をしているか。**302 でトップに飛ばされた HTML を sitemap と数えないため** */
const looksLikeSitemap = xml => /<(sitemapindex|urlset)[\s>]/i.test(xml);

function decodeXml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** URL の末尾セグメントを人が読める語に戻す（%E3%82%AD… → キャンプ） */
function termOf(url) {
  try {
    const p = new URL(url).pathname.replace(/\/+$/, '');
    const seg = p.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(seg);
  } catch { return ''; }
}

/**
 * その sitemap がタクソノミー系か。**ファイル名だけで決めない。**
 * ファイル名の手がかり **または** 収録 URL の形（/category/ /tag/ /genre/ …）で判定し、
 * **どちらで判定したかを理由として残す。**
 */
function classify(sitemapUrl, urls) {
  const name = sitemapUrl.toLowerCase();
  const byName = TAXONOMY_HINTS.find(h => name.includes(h));
  const pathHint = /\/(category|categories|tag|tags|genre|taxonomy|term|label|topic|type|cat)\//i;
  const hitPath = urls.filter(u => pathHint.test(u)).length;
  const byPath = urls.length > 0 && hitPath / urls.length >= 0.5;
  if (byName && byPath) return { taxonomy: true, why: `ファイル名に "${byName}" / 収録URLの${hitPath}/${urls.length}件が分類パス` };
  if (byName) return { taxonomy: true, why: `ファイル名に "${byName}"` };
  if (byPath) return { taxonomy: true, why: `収録URLの${hitPath}/${urls.length}件が分類パス` };
  return { taxonomy: false, why: '' };
}

const matchedKeywords = term => KEYWORDS.filter(k => term.toLowerCase().includes(k.toLowerCase()));

/* ── HTML フォールバック ──────────────────────────────────────── */

/**
 * XML が1本も取れないサイト向け。**WordPress 前提にしないための経路。**
 * トップの HTML から、分類アーカイブらしきリンクを拾う。
 * **これは補助であって、XML と同じ網羅性は無い。**md にもそう書く。
 */
function taxonomyLinksFromHtml(html, baseUrl) {
  const out = new Map();
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi;
  const pathHint = /\/(category|categories|cat|tag|tags|genre|taxonomy|term|label|topic|list\d*|c\d+)[-/]/i;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1];
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue;
    let abs;
    try { abs = new URL(href, baseUrl).toString(); } catch { continue; }
    try { if (new URL(abs).host !== new URL(baseUrl).host) continue; } catch { continue; }
    const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!pathHint.test(abs) && !matchedKeywords(text).length) continue;
    if (!out.has(abs)) out.set(abs, text);
  }
  return [...out].map(([url, text]) => ({ url, text }));
}

/* ── 本体 ─────────────────────────────────────────────────────── */

async function scan(siteUrl, opts = {}) {
  const mockDrop = opts.mockDrop || null;   // 偽ゼロ確認用の故障注入
  const origin = new URL(siteUrl).origin;
  const r = {
    site: origin,
    robots: { fetched: false, note: '', sitemapLines: [], agentDirectives: [] },
    seeds: [],
    sitemaps: [],        // { url, ok, note, kind, taxonomy, why, terms:[], hits:[] }
    unreachable: [],     // 取れなかったもの（**0件と読まない**）
    urlKeywordHits: [],  // 分類ではないが URL にキーワードが出たもの
    pathTrees: new Map(), // ディレクトリ構成（語彙に頼らない列挙）
    htmlFallback: null,
    truncated: false,
    keywords: KEYWORDS,
  };

  // 0. robots ガード（§robots-guard）
  const guard = await assertOriginAllowed(origin);
  if (!guard.allowed) {
    r.robots.note = `${guard.note}（robots.txt 自体が ${guard.status}。**踏んでいない。0件ではない**）`;
    return r;
  }

  // 1. robots.txt
  const rob = await get(origin + '/robots.txt');
  if (rob.ok) {
    r.robots.fetched = true;
    const p = parseRobots(rob.body);
    r.robots.sitemapLines = p.sitemaps;
    r.robots.agentDirectives = p.agentDirectives;   // ★ 記録するだけ。従わない（§21-1）
  } else {
    r.robots.note = rob.note;
  }

  // 2. 種を作る。**robots の Sitemap: 行 + 慣用パス。片方だけにしない**
  const conventional = [
    '/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml', '/sitemapindex.xml',
    '/wp-sitemap.xml', '/sitemap.xml.gz', '/sitemap/sitemap.xml', '/sitemap.rss',
  ].map(p => origin + p);
  const seen = new Set();
  const seenBody = new Set();   // 同一実体の重複計上よけ
  const queue = [];
  for (const u of [...r.robots.sitemapLines, ...conventional]) {
    if (seen.has(u)) continue;
    seen.add(u);
    queue.push({ url: u, depth: 0 });
    r.seeds.push(u);
  }

  // 3. 幅優先で展開。sitemapindex は再帰的に開く
  while (queue.length) {
    if (r.sitemaps.length >= MAX_SITEMAPS) { r.truncated = true; break; }
    const { url, depth } = queue.shift();
    const res = await get(url);
    if (!res.ok) {
      // 慣用パスの 404 は「無い」なので静かに落とす。それ以外は理由つきで残す
      const conventional404 = res.status === 404 && !r.robots.sitemapLines.includes(url);
      if (!conventional404) r.unreachable.push({ url, note: res.note });
      continue;
    }
    // **302 でトップへ飛ばすサイトがある。**HTML を sitemap として数えない
    if (!looksLikeSitemap(res.body)) {
      if (r.robots.sitemapLines.includes(url)) {
        r.unreachable.push({ url, note: 'sitemap の体裁ではない（リダイレクト先が HTML の疑い）' });
      }
      continue;
    }
    // **中身が同一のものを別本として数えない**（慣用パスが同じ実体に解決されることがある）
    const fp = res.body.length + ':' + res.body.slice(0, 200);
    if (seenBody.has(fp)) continue;
    seenBody.add(fp);
    if (isIndex(res.body)) {
      const kids = locsOf(res.body);
      const entry = { url, ok: true, kind: 'index', children: kids.length, taxonomy: false, why: '', terms: [], hits: [] };
      r.sitemaps.push(entry);
      if (depth >= MAX_DEPTH) continue;
      /* ★ ディレクトリ型 CMS（Joruri 等）は「ディレクトリごとに sitemap.dir.xml」を出し、
       *   子が数百本になる。全部踏むと MAX_SITEMAPS に当たって**黙って打ち切られる。**
       *   子が多いときは**キーワード／分類の手がかりを含む子だけ**に絞り、
       *   **絞ったこと自体を md に出す**（§「無い」と「見ていない」を混同しない）。 */
      /* ★ ディレクトリ型 CMS では**子サイトマップの URL 自体がディレクトリ台帳**。
       *   絞り込みで踏まなかった子も、構成としては数えておく（踏むこととは別）。 */
      for (const k of kids) {
        try {
          const segs = new URL(k).pathname.split('/').filter(Boolean);
          if (segs.length < 2) continue;
          const key = '/' + segs.slice(0, segs.length - 1).join('/') + '/';
          r.pathTrees.set(key, (r.pathTrees.get(key) || 0) + 1);
        } catch { /* URL でないものは数えない */ }
      }
      let take = kids;
      if (kids.length > WIDE_INDEX_LIMIT) {
        take = kids.filter(k => {
          const s = decodeURIComponent(k).toLowerCase();
          return matchedKeywords(s).length || TAXONOMY_HINTS.some(h => s.includes(h));
        });
        entry.filtered = { total: kids.length, kept: take.length };
      }
      for (const k of take) {
        if (seen.has(k)) continue;
        seen.add(k);
        queue.push({ url: k, depth: depth + 1 });
      }
      continue;
    }
    const urls = locsOf(res.body);
    // ★ 故障注入（偽ゼロ確認専用）。**通常実行では絶対に通らない**
    if (mockDrop && url.includes(mockDrop)) continue;
    const c = classify(url, urls);
    const terms = c.taxonomy ? [...new Set(urls.map(termOf).filter(Boolean))] : [];
    const hits = terms.filter(t => matchedKeywords(t).length)
      .map(t => ({ term: t, url: urls.find(u => termOf(u) === t), kw: matchedKeywords(t) }));
    /* ★ タクソノミーを持たないサイト（ディレクトリ型の自治体 CMS）でも、
     *   **URL 自体にキーワードが出る**ことがある（/kanko/camp/ 等）。
     *   これは「分類」ではないので taxonomy とは別枠で出す。**混ぜない。** */
    const urlHits = urls.filter(u => matchedKeywords(decodeURIComponent(u)).length);
    for (const u of urlHits) if (!r.urlKeywordHits.some(x => x.url === u)) r.urlKeywordHits.push({ url: u, from: url });
    /* ★ キーワード一致は**綴りを外すと沈黙する。**実例: 山梨市は観光ツリーを
     *   `/site/tuorism/`（tourism の綴り誤り）に置いていて、'tourism' を足しても当たらない。
     *   そこで**語彙に頼らずディレクトリ構成そのものを列挙する。**
     *   人が目で見て「ここが観光だ」と判断できる材料を必ず出す。 */
    for (const u of urls) {
      try {
        const segs = new URL(u).pathname.split('/').filter(Boolean);
        if (!segs.length) continue;
        const key = '/' + segs.slice(0, Math.min(2, segs.length - 1 || 1)).join('/') + '/';
        r.pathTrees.set(key, (r.pathTrees.get(key) || 0) + 1);
      } catch { /* URL でないものは数えない */ }
    }
    r.sitemaps.push({ url, ok: true, kind: 'urlset', count: urls.length, taxonomy: c.taxonomy, why: c.why, terms, hits });
  }

  // 4. XML でタクソノミーが1本も取れなければ HTML に落ちる（WordPress 前提にしない）
  if (!r.sitemaps.some(s => s.taxonomy)) {
    const top = await get(origin + '/');
    if (top.ok) {
      const links = taxonomyLinksFromHtml(top.body, origin + '/');
      r.htmlFallback = {
        tried: origin + '/',
        links,
        hits: links.filter(l => matchedKeywords(l.text).length || matchedKeywords(termOf(l.url)).length),
      };
    } else {
      r.htmlFallback = { tried: origin + '/', note: top.note, links: [], hits: [] };
    }
  }

  return r;
}

/* ── 出力 ─────────────────────────────────────────────────────── */

function render(r, label) {
  const L = [];
  L.push(`## ${label || r.site}`);
  L.push('');
  if (r.robots.note) L.push(`- robots: **${r.robots.note}**`);
  L.push(`- robots.txt の \`Sitemap:\` 行: ${r.robots.sitemapLines.length ? r.robots.sitemapLines.map(s => `\`${s}\``).join(' / ') : '**なし**'}`);
  L.push(`- 当たった種: ${r.seeds.length}本（robots ${r.robots.sitemapLines.length} + 慣用パス ${r.seeds.length - r.robots.sitemapLines.length}）`);
  if (r.truncated) L.push(`- ⚠ **${MAX_SITEMAPS}本で打ち切った。**全部は見ていない`);
  L.push('');

  // ★ ここが必須。ヒット0でも「何を見たか」が残る
  const tax = r.sitemaps.filter(s => s.taxonomy);
  L.push(`### 調べたタクソノミー一覧（${tax.length}本）`);
  L.push('');
  if (!tax.length) {
    L.push('**0本。**XML sitemap の中に分類系と判定できるものが無かった。');
  } else {
    L.push('| サイトマップ | 語彙数 | 判定の根拠 | キーワードに当たった語彙 |');
    L.push('|---|---:|---|---|');
    for (const s of tax) {
      const hit = s.hits.length ? s.hits.map(h => `**${h.term}**`).join(' / ') : '—';
      L.push(`| \`${s.url}\` | ${s.terms.length} | ${s.why} | ${hit} |`);
    }
    L.push('');
    for (const s of tax) {
      L.push(`<details><summary><code>${s.url}</code> の語彙 ${s.terms.length}件</summary>`);
      L.push('');
      L.push(s.terms.join(' / ') || '（0件）');
      L.push('');
      L.push('</details>');
      L.push('');
    }
  }
  L.push('');

  L.push(`### 見たが分類系ではなかったサイトマップ（${r.sitemaps.filter(s => !s.taxonomy).length}本）`);
  L.push('');
  const non = r.sitemaps.filter(s => !s.taxonomy);
  if (!non.length) L.push('なし。');
  else {
    L.push('| サイトマップ | 種別 | 収録 |');
    L.push('|---|---|---:|');
    for (const s of non) L.push(`| \`${s.url}\` | ${s.kind} | ${s.kind === 'index' ? `子 ${s.children}本${s.filtered ? ` → **手がかりのある ${s.filtered.kept}本だけ展開**` : ''}` : `${s.count} URL`} |`);
  }
  L.push('');

  if (r.pathTrees.size) {
    const trees = [...r.pathTrees].sort((a, b) => b[1] - a[1]).slice(0, 30);
    L.push(`### ディレクトリ構成（上位${trees.length}／全${r.pathTrees.size}）— **語彙に頼らない列挙**`);
    L.push('');
    L.push('キーワード一致は**綴りを外すと沈黙する**（実例: 山梨市の観光ツリーは `/site/tuorism/`）。');
    L.push('**ここは語彙を使わず、URL のディレクトリを数えただけ。**目で見て当たりを付けるための材料。');
    L.push('');
    L.push('| ディレクトリ | URL数 |');
    L.push('|---|---:|');
    for (const [k, v] of trees) L.push(`| \`${k}\` | ${v} |`);
    L.push('');
  }

  if (r.urlKeywordHits.length) {
    L.push(`### URL にキーワードが出たページ（${r.urlKeywordHits.length}件）— **分類ではない**`);
    L.push('');
    L.push('タクソノミーを持たないサイト（ディレクトリ型の自治体 CMS など）でも、');
    L.push('URL 自体に手がかりが出ることがある。**分類一覧ではないので、一覧かどうかは開いて確かめること。**');
    L.push('');
    for (const u of r.urlKeywordHits.slice(0, 40)) L.push(`- ${u.url}`);
    if (r.urlKeywordHits.length > 40) L.push(`- …ほか ${r.urlKeywordHits.length - 40}件`);
    L.push('');
  }

  if (r.unreachable.length) {
    L.push(`### ⚠ 取れなかったもの（${r.unreachable.length}本）— **「無い」ではない**`);
    L.push('');
    for (const u of r.unreachable) L.push(`- \`${u.url}\` … ${u.note}`);
    L.push('');
  }

  if (r.htmlFallback) {
    L.push('### HTML フォールバック（XML で分類系が0本だったため）');
    L.push('');
    L.push(`対象: \`${r.htmlFallback.tried}\``);
    if (r.htmlFallback.note) L.push(`- 取得失敗: ${r.htmlFallback.note}`);
    L.push(`- 分類アーカイブらしきリンク: **${r.htmlFallback.links.length}本**`);
    if (r.htmlFallback.hits.length) {
      L.push('- **キーワードに当たったもの:**');
      for (const h of r.htmlFallback.hits) L.push(`  - ${h.text || '(テキストなし)'} — ${h.url}`);
    } else {
      L.push('- キーワードに当たったものは**なし**');
    }
    L.push('');
    L.push('> **⚠ HTML 経路は XML と同じ網羅性を持たない。**トップから辿れないものは出ない。');
    L.push('> ここで0件でも「分類が無い」の根拠にはならない。');
    L.push('');
  }

  if (r.robots.agentDirectives.length) {
    L.push('### ⚠ robots.txt に埋め込まれたエージェント宛ての記述（§21-1）');
    L.push('');
    L.push('**従っていない。原文のまま記録する。**');
    L.push('');
    L.push('```');
    for (const d of r.robots.agentDirectives) L.push(d);
    L.push('```');
    L.push('');
  }

  L.push(`> 使ったキーワード（${r.keywords.length}語）: ${r.keywords.join(' / ')}`);
  L.push('> **この一覧に無い語で分類されていれば取り逃す。**ヒット0を「無い」と読む前にここを見ること。');
  L.push('');
  return L.join('\n');
}

/* ── SELF_TEST ────────────────────────────────────────────────────
 * **焼き込むのは外の事実だけ。**都留市観光協会が `discoverytag-sitemap.xml` を持ち、
 * その語彙に「キャンプ」が含まれることは 2026-08-18 に実測で確定した事実で、
 * **この列挙器が動いていれば必ず出る。**
 *
 * **本数（8本・44語）のような可変値は焼き込まない。**先方の更新で増減する。 */
const SELF_TEST_SITE = 'https://tsurukankou.jp';

async function selfTest(opts) {
  console.log(`SELF_TEST: ${SELF_TEST_SITE}`);
  const r = await scan(SELF_TEST_SITE, opts);
  const fails = [];

  const tax = r.sitemaps.filter(s => s.taxonomy);
  const tagSitemap = tax.find(s => s.url.includes('discoverytag-sitemap.xml'));
  if (!tagSitemap) {
    fails.push('discoverytag-sitemap.xml がタクソノミーとして列挙されなかった'
      + `（列挙されたのは: ${tax.map(s => s.url.split('/').pop()).join(', ') || 'なし'}）`);
  } else {
    console.log(`  ✅ discoverytag-sitemap.xml を列挙（語彙 ${tagSitemap.terms.length}件）`);
    if (!tagSitemap.terms.includes('キャンプ')) {
      fails.push('discoverytag-sitemap.xml の語彙に「キャンプ」が無い');
    } else {
      console.log('  ✅ その語彙に「キャンプ」が含まれる');
    }
    const hit = tagSitemap.hits.find(h => h.term === 'キャンプ');
    if (!hit) fails.push('「キャンプ」がキーワード一致として拾われなかった');
    else console.log(`  ✅ キーワード一致として検出: ${hit.url}`);
  }
  // 列挙そのものが死んでいないこと（**本数は見ない。0でないことだけ**）
  if (!r.sitemaps.length) fails.push('サイトマップを1本も列挙できなかった');

  if (fails.length) {
    console.error('\n❌ SELF_TEST 失敗');
    for (const f of fails) console.error('   - ' + f);
    process.exit(1);
  }
  console.log('\n✅ SELF_TEST 成功');
}

/* ── CLI ──────────────────────────────────────────────────────── */

async function main() {
  const arg = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
  const mockDrop = arg('mock-drop') || null;
  if (mockDrop) console.log(`⚠ 故障注入: "${mockDrop}" を含むサイトマップを落とす（偽ゼロ確認）\n`);

  if (process.argv.includes('--selftest')) return selfTest({ mockDrop });

  const sites = (arg('site') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!sites.length) {
    console.error('使い方: node scripts/sitemap-taxonomy-scan.js --site=https://example.jp [--out=scripts/foo.md]');
    process.exit(2);
  }
  const labels = (arg('label') || '').split(',');
  const out = [];
  for (const [i, s] of sites.entries()) {
    console.error(`scan: ${s}`);
    const r = await scan(s, { mockDrop });
    const md = render(r, labels[i] || null);
    out.push(md);
    console.log(md);
  }
  const dest = arg('out');
  if (dest) {
    fs.writeFileSync(dest, out.join('\n---\n\n'), 'utf8');
    console.error(`→ ${dest}`);
  }
}

module.exports = {
  scan, render, parseRobots, classify, termOf, matchedKeywords, taxonomyLinksFromHtml,
  KEYWORDS,
  _internal: { setFetchImpl(fn) { fetchImpl = fn || ((...a) => fetch(...a)); } },
};

if (require.main === module) main();
