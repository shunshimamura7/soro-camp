/**
 * **L1 が指す外部リンクの腐食を測る。**
 *
 * ## なぜ要るか
 *
 * 君津市公式のキャンプ場一覧14件のうち **3件でリンク先が壊れていた**（2026-08-15 実測）:
 *
 *   フォレストパーティー峰山 … `forestpartymineyama.com` が失効・売却中（現公式は `.jp`）
 *   ホウリーウッズ久留里     … `holywoodscamp.jimdo.com` が TLS 失敗（現公式は `jimdofree.com`）
 *   柿山田               … `...hello-net.info` のサブドメインが DNS 消滅
 *
 * どれも**自治体公式が古いURLを貼りっぱなし**にしていたのが原因。
 * `check-muni-sources.js` が L1 の**入口**URLを見ているのと同じ理屈で、
 * **L1 が中で指している外部リンクの死活も測る。**
 *
 * これは「**L1 に載っているから正しい**」を疑う検査。
 * リンク切れ率が高い L1 は、名前や住所も古い可能性がある。
 *
 * ## 403 の扱い
 *
 * `district-sweep` に入れた `FORBIDDEN` の理屈を**このスキャン自身にも当てる。**
 * 403 は「リンク切れ」ではなく「**測れず**」。生存率の分母から外す。
 * **UA は ClaudeBot。**（`district-sweep` は Chrome を名乗る。下の注記を読むこと）
 *
 *   node scripts/l1-link-rot.js                 # 登録済み全市町村の L1
 *   node scripts/l1-link-rot.js --muni=君津市    # 1市町村だけ
 *   node scripts/l1-link-rot.js --detail=8      # 詳細ページを踏む上限（既定6）
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
const { MUNI_SOURCES } = require('./district-sweep.js');
const { _internal: I } = require('./district-sweep.js');

const argv = process.argv.slice(2);
const only = (argv.find(a => a.startsWith('--muni=')) || '').slice(7);
const DETAIL_CAP = Number((argv.find(a => a.startsWith('--detail=')) || '').slice(9)) || 6;
const OUT = path.join(__dirname, 'l1-link-rot-2026-08.md');

const UA = 'ClaudeBot';   // ← 上の注記を参照
const { assertOriginAllowed } = require('./robots-guard.js');
const TIMEOUT_MS = 12000;
const SPACING_MS = 1200;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * 施設の公式サイトらしい外部リンクだけを残す。
 * 地図・SNS・行政ポータル・予約サイトは「L1 が指す施設公式」ではないので除く
 * （予約サイトは L2 として別に持っているので、ここで数えると二重になる）。
 */
const EXCLUDE_HOST = /(google|goo\.gl|yahoo|facebook|twitter|x\.com|instagram|youtube|line\.me|tiktok|note\.com|ameblo|wikipedia|adobe|jalan\.net|nap-camp|rurubu|jtb|rakuten|ikyu|asoview|hinata|tabelog|navitime|mapion|mapfan|openstreetmap|logoform|graffer|shinsei|e-shokokai|jorudan|ekitan)/i;
const EXCLUDE_PATH = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4|mov|ics)(\?|#|$)/i;
// **行政ポータルはナビの飾りで、施設の公式ではない。**
// `city.sagamihara.kanagawa.jp` のように lg.jp で終わらない自治体ドメインがあるので
// ホスト名の頭でも見る（これを入れないと相模原の集計が市役所リンクで薄まった）
const EXCLUDE_GOV = /(^|\.)(city|town|vill|pref|metro)\.[^.]+\.(jp|lg\.jp)$|(lg|go)\.jp$/i;

/**
 * **旅行代理店・予約導線は「L1 が指す施設公式」ではない。**
 *
 * 山中湖村観光協会のページには ANA旅作 / ANAスカイホリデー / びゅうトラベル /
 * JAL / HIS へのリンクが並んでいて、初回の集計ではこれが `DEAD`（タイムアウト）として
 * **山中湖村の腐食率を33%に押し上げていた。**施設の公式が切れているわけではないので、
 * 分けて数える（除外はせず、別枠で出す）。
 */
const AGENCY_HOST = /(ana\.co\.jp|jal\.co\.jp|his-j\.com|eki-net|v-travels|jtb|stores\.jp|jorudan|ekitan|rurubu)/i;

function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } }

/** ページから外部リンクを拾う。base と同じホストは内部リンクなので捨てる */
function externalLinks(html, baseUrl) {
  const base = hostOf(baseUrl);
  const out = new Map();
  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
    let abs;
    try { abs = new URL(m[1], baseUrl).href; } catch { continue; }
    if (!/^https?:/i.test(abs)) continue;
    const h = hostOf(abs);
    if (!h || h === base) continue;
    if (EXCLUDE_HOST.test(h) || EXCLUDE_GOV.test(h) || EXCLUDE_PATH.test(abs)) continue;
    const label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!out.has(abs)) out.set(abs, label);
  }
  return out;
}

/** 1URLの死活。403 は DEAD と分ける */
async function probe(url) {
  // **robots.txt を403で断っているオリジンは踏まない**（robots-guard.js）
  const guard = await assertOriginAllowed(url);
  if (!guard.allowed) {
    return { verdict: 'FORBIDDEN', status: guard.status, note: 'robots.txt が403。踏まない（測れず）' };
  }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8' },
      redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 403) return { verdict: 'FORBIDDEN', status: 403, note: 'この UA を拒否（測れず）' };
    if (res.status === 429) return { verdict: 'FORBIDDEN', status: 429, note: 'レート制限（測れず）' };
    if (!res.ok) return { verdict: 'DEAD', status: res.status, note: `HTTP ${res.status}` };
    const buf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || '';
    const cm = ct.match(/charset=([\w-]+)/i);
    let body;
    try { body = new TextDecoder(cm ? cm[1] : 'utf-8').decode(buf); }
    catch { body = Buffer.from(buf).toString('utf8'); }
    const { classifyParked, toPlainText } = require('./check-official-urls.js');
    const parked = classifyParked(toPlainText(body));
    if (parked) return { verdict: 'PARKED', status: res.status, note: `${parked.why}「${parked.hit}」`, finalUrl: res.url };
    return { verdict: 'ALIVE', status: res.status, note: '', finalUrl: res.url };
  } catch (e) {
    const code = e.cause?.code || e.name || e.message;
    return { verdict: 'DEAD', status: 0, note: 'UNREACHABLE: ' + String(code).slice(0, 48) };
  }
}

async function get(url) {
  const r = await I.fetchPage(url, { useCache: true });
  return r;
}

(async () => {
  const entries = Object.entries(MUNI_SOURCES).filter(([k]) => !only || k === only);
  let rows = [];

  // **保存済みの結果から md だけ作り直す。**集計の規則を変えたときに再取得しないで済む
  if (argv.includes('--rerender')) {
    rows = JSON.parse(fs.readFileSync(path.join(__dirname, '.l1-link-rot.json'), 'utf8'));
    console.log(`保存済み ${rows.length}件から md を作り直す（取得しない）`);
    return render(rows);
  }

  for (const [muni, entry] of entries) {
    for (const src of entry.sources.filter(s => s.layer === 'L1')) {
      process.stdout.write(`\n■ ${muni} / ${src.label}\n`);
      const links = new Map();

      // 一覧ページ
      for (const p of src.pages) {
        const res = await get(p);
        if (!res.ok) { console.log(`   一覧 ${p} → ${res.note || res.status}`); continue; }
        for (const [u, l] of externalLinks(res.body, p)) links.set(u, l);
      }

      // 詳細ページ（listDetail のときだけ。上限あり）
      if (src.kind === 'listDetail') {
        let items = [];
        for (const p of src.pages) {
          const res = await get(p);
          if (res.ok) { try { items.push(...(src.list(res.body) || [])); } catch { /* noop */ } }
        }
        const urls = [...new Set(items.map(i => i.url).filter(Boolean))].slice(0, DETAIL_CAP);
        if (items.length > urls.length) {
          console.log(`   詳細を ${urls.length}/${items.length} 件で打ち切り（--detail= で変えられる）`);
        }
        for (const u of urls) {
          const res = await get(u);
          if (!res.ok) continue;
          for (const [x, l] of externalLinks(res.body, u)) links.set(x, l);
        }
      }

      console.log(`   外部リンク ${links.size}件`);
      for (const [u, label] of links) {
        const r = await probe(u);
        rows.push({ muni, source: src.label, sourceId: src.id, url: u, label, ...r });
        const mark = { ALIVE: '  ', DEAD: '✗ ', PARKED: '★ ', FORBIDDEN: '? ' }[r.verdict];
        console.log(`   ${mark}${r.verdict.padEnd(9)} ${u}${r.note ? '  — ' + r.note : ''}`);
        await sleep(SPACING_MS);
      }
    }
  }

  return render(rows);
})();

/* ── 集計と md ─────────────────────────────────────────── */
function render(all) {
  // **施設公式と旅行代理店を分ける。**混ぜると山中湖村が33%に見えた（実際は0%）
  const rows = all.filter(r => !AGENCY_HOST.test(r.url));
  const agency = all.filter(r => AGENCY_HOST.test(r.url));

  const bySource = new Map();
  for (const r of rows) {
    const k = r.muni + '|' + r.source;
    if (!bySource.has(k)) bySource.set(k, []);
    bySource.get(k).push(r);
  }

  const L = [];
  L.push('# L1 が指す外部リンクの腐食 — 2026-08-15');
  L.push('');
  L.push('**「L1 に載っているから正しい」を疑う検査。**');
  L.push('自治体公式・観光協会が施設の公式サイトへ貼っているリンクを叩いて、生きているかを見る。');
  L.push('');
  L.push('> **403 は「リンク切れ」ではない。**先方がこの UA を拒否しているだけで、サイトは生きていることが多い。');
  L.push('> `district-sweep` の `FORBIDDEN` と同じ理屈で、**生存率の分母から外す**（測れていない）。');
  L.push('> **UA は ClaudeBot。偽装しない。**');
  L.push('');
  L.push(`対象は登録済み L1 のうち外部リンクを持つもの。詳細ページは1ソース ${DETAIL_CAP} 件で打ち切っている。`);
  L.push('');
  L.push('> **旅行代理店・予約導線は別枠にしてある**（ANA旅作・JAL・びゅうトラベル等）。');
  L.push('> 施設公式ではないので腐食率の分母に入れない。**混ぜると山中湖村が33%に見えたが、実際は0%だった。**');
  L.push('');
  L.push('## ソース別の生存率');
  L.push('');
  L.push('| 市町村 | L1 | 外部リンク | 生存 | 切れ | 売却/停止 | 測れず(403) | **腐食率** |');
  L.push('|---|---|---|---|---|---|---|---|');
  const sorted = [...bySource].sort((a, b) => {
    const rot = g => {
      const d = g.filter(r => r.verdict === 'DEAD' || r.verdict === 'PARKED').length;
      const m = g.filter(r => r.verdict !== 'FORBIDDEN').length;
      return m ? d / m : -1;
    };
    return rot(b[1]) - rot(a[1]);
  });
  for (const [k, g] of sorted) {
    const [muni, label] = k.split('|');
    const alive = g.filter(r => r.verdict === 'ALIVE').length;
    const dead = g.filter(r => r.verdict === 'DEAD').length;
    const parked = g.filter(r => r.verdict === 'PARKED').length;
    const forb = g.filter(r => r.verdict === 'FORBIDDEN').length;
    const measured = g.length - forb;
    const rot = measured ? Math.round(((dead + parked) / measured) * 100) : null;
    L.push(`| ${muni} | ${label} | ${g.length} | ${alive} | ${dead} | ${parked} | ${forb} | ` +
      `${rot === null ? '**測れず**' : `**${rot}%**`}（${dead + parked}/${measured}） |`);
  }
  L.push('');
  L.push('## 切れているリンク（DEAD / PARKED）');
  L.push('');
  const bad = rows.filter(r => r.verdict === 'DEAD' || r.verdict === 'PARKED');
  if (!bad.length) L.push('（なし）');
  else {
    L.push('| 市町村 | L1 | 判定 | リンク文言 | URL | 理由 |');
    L.push('|---|---|---|---|---|---|');
    for (const r of bad) {
      L.push(`| ${r.muni} | ${r.sourceId} | **${r.verdict}** | ${r.label.slice(0, 24)} | ${r.url} | ${r.note} |`);
    }
  }
  L.push('');
  L.push('## 測れなかったリンク（403 / 429）');
  L.push('');
  const forb = rows.filter(r => r.verdict === 'FORBIDDEN');
  if (!forb.length) L.push('（なし）');
  else {
    L.push('**これらは「切れている」ではない。**この収集器から見えないだけ。');
    L.push('');
    L.push('| 市町村 | L1 | URL | 理由 |');
    L.push('|---|---|---|---|');
    for (const r of forb) L.push(`| ${r.muni} | ${r.sourceId} | ${r.url} | ${r.note} |`);
  }
  L.push('');
  L.push('## 旅行代理店・予約導線（腐食率の分母に入れない）');
  L.push('');
  if (!agency.length) L.push('（なし）');
  else {
    L.push('| 市町村 | L1 | 判定 | リンク文言 | URL |');
    L.push('|---|---|---|---|---|');
    for (const r of agency) L.push(`| ${r.muni} | ${r.sourceId} | ${r.verdict} | ${r.label.slice(0, 20)} | ${r.url} |`);
  }
  L.push('');
  const dead = rows.filter(r => r.verdict === 'DEAD').length;
  const parked = rows.filter(r => r.verdict === 'PARKED').length;
  const measured = rows.filter(r => r.verdict !== 'FORBIDDEN').length;
  L.push(`**合計 ${rows.length}リンク: 生存 ${rows.filter(r => r.verdict === 'ALIVE').length} / ` +
    `切れ ${dead} / 売却・停止 ${parked} / 測れず ${rows.length - measured}。` +
    `腐食率 ${measured ? Math.round(((dead + parked) / measured) * 100) : 0}%（${dead + parked}/${measured}）**`);

  fs.writeFileSync(OUT, L.join('\n'), 'utf8');
  fs.writeFileSync(path.join(__dirname, '.l1-link-rot.json'), JSON.stringify(rows, null, 1));
  console.log(`\n合計 ${rows.length}リンク / 切れ ${dead} / 売却・停止 ${parked} / 測れず ${rows.length - measured}`);
  console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
}
