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
 *   → scripts/url-check-2026-08.md
 *
 * 判定
 *   DEAD        DNS解決失敗 / 接続不能 / タイムアウト / 4xx / 5xx / URLとして壊れている
 *   PARKED      到達するが、ドメイン失効・売却・停止の定型文が本文にある
 *   CLOSED_HINT 本文に閉業・閉鎖・営業終了・廃止・当面の間休業がある
 *   OK          上記のどれでもない
 *   NO_URL      officialUrl が空
 *
 * 判定の限界（次に見る人へ）
 *   - 403 / 429 は 4xx なので DEAD になるが、**多くはボット遮断で、サイト自体は生きている。**
 *     evidence 列にその旨を出しているので、まず疑うこと。
 *   - CLOSED_HINT は素朴な文字列一致なので誤検出が多い。「本日の営業終了時刻」「直火は禁止」
 *     「旧町名を廃止」などが引っかかる。**必ず evidence の前後を読んでから判断する。**
 *   - JS でしか描画しないサイトは本文が空に近く、CLOSED_HINT を取りこぼす。OK は「無罪」ではない。
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const OUT = path.join(__dirname, 'url-check-2026-08.md');

const CONCURRENCY = 3;
const SPACING_MS = 1000; // リクエストの開始間隔。相手に負荷をかけない
const TIMEOUT_MS = 10000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** ドメインの失効・売却・停止を示す定型文 */
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

/** 閉業・閉鎖の可能性を示す語 */
const CLOSED_PATTERNS = ['閉業', '閉鎖', '営業終了', '廃止', '当面の間休業', '閉館'];

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

async function checkOne(camp) {
  const url = (camp.officialUrl || '').trim();
  if (!url) return { camp, verdict: 'NO_URL', status: '', evidence: '' };

  let parsed;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('http/https ではない');
  } catch (e) {
    return { camp, verdict: 'DEAD', status: '', evidence: `URLとして解釈できない: ${e.message}` };
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
    return { camp, verdict: 'DEAD', status: '', evidence: label };
  }
  clearTimeout(timer);

  const status = res.status;
  const finalUrl = res.url && res.url !== url ? res.url : '';

  if (status >= 400) {
    const hint =
      status === 403 || status === 429
        ? '（ボット遮断の可能性。ブラウザで開くと生きていることが多い）'
        : '';
    return {
      camp,
      verdict: 'DEAD',
      status,
      evidence: `HTTP ${status}${hint}${finalUrl ? ` / 最終URL: ${finalUrl}` : ''}`,
    };
  }

  let text = '';
  try {
    const buf = await res.arrayBuffer();
    text = toPlainText(decodeBody(buf, res.headers.get('content-type')));
  } catch (e) {
    return { camp, verdict: 'DEAD', status, evidence: `本文を読めない（${e.message}）` };
  }

  for (const p of PARKED_PATTERNS) {
    if (text.includes(p)) {
      return {
        camp, verdict: 'PARKED', status,
        evidence: `「${p}」… ${snippet(text, p)}${finalUrl ? ` / 最終URL: ${finalUrl}` : ''}`,
      };
    }
  }
  for (const p of CLOSED_PATTERNS) {
    if (text.includes(p)) {
      return {
        camp, verdict: 'CLOSED_HINT', status,
        evidence: `「${p}」… ${snippet(text, p)}`,
      };
    }
  }
  // 本文がほぼ空なら、JS描画で中身を読めていないだけ。OK だが根拠が薄いことを残す
  const thin = text.replace(/\s/g, '').length < 200;
  return {
    camp, verdict: 'OK', status,
    evidence: `${thin ? '本文がほぼ空（JS描画の可能性。判定の根拠は薄い）' : ''}${finalUrl ? ` 最終URL: ${finalUrl}` : ''}`.trim(),
  };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  // ★ 確認済みフラグで絞らない（引き継ぎ §6-1）
  const targets = data.filter((c) => c.status === 'active');

  console.log(`check-official-urls: status=active ${targets.length}件`);
  console.log(`同時実行 ${CONCURRENCY} / 開始間隔 ${SPACING_MS}ms / タイムアウト ${TIMEOUT_MS}ms\n`);

  const results = new Array(targets.length);
  let next = 0;
  let lastStart = 0;
  let done = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= targets.length) return;
      // 開始間隔を全体で守る
      const wait = lastStart + SPACING_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastStart = Date.now();

      results[i] = await checkOne(targets[i]);
      done++;
      const r = results[i];
      if (r.verdict !== 'OK' && r.verdict !== 'NO_URL') {
        console.log(`  [${r.verdict}] ${r.camp.slug} ${r.status || ''} ${r.evidence.slice(0, 70)}`);
      }
      if (done % 20 === 0) console.log(`  … ${done}/${targets.length}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const ORDER = ['DEAD', 'PARKED', 'CLOSED_HINT', 'NO_URL', 'OK'];
  const counts = Object.fromEntries(ORDER.map((v) => [v, 0]));
  results.forEach((r) => counts[r.verdict]++);

  const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
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

  const md = `# officialUrl 死活チェック（2026-08）

\`node scripts/check-official-urls.js\` の出力。**このスクリプトはデータを書き換えない。**
中身の精査と \`campgrounds.json\` への反映は人がやる。

対象: \`status === 'active'\` の **${targets.length}件**。
**\`lastVerified\` や \`priceVerified\` が新しいことを除外条件にしていない**（引き継ぎ §6-1）。

同時実行 ${CONCURRENCY} / リクエストの開始間隔 ${SPACING_MS}ms / タイムアウト ${TIMEOUT_MS / 1000}秒 / リダイレクト追跡あり。

## 集計

| 判定 | 件数 | 意味 |
|---|---|---|
| **DEAD** | **${counts.DEAD}** | DNS解決失敗 / 接続不能 / タイムアウト / 4xx / 5xx |
| **PARKED** | **${counts.PARKED}** | 到達するが、ドメイン失効・売却・停止の定型文がある |
| **CLOSED_HINT** | **${counts.CLOSED_HINT}** | 本文に閉業・閉鎖・営業終了・廃止・当面の間休業・閉館がある |
| NO_URL | ${counts.NO_URL} | \`officialUrl\` が空 |
| OK | ${counts.OK} | 上記のどれでもない |

## 読むときの注意

- **403 / 429 は 4xx なので DEAD になるが、多くはボット遮断でサイト自体は生きている。**
  evidence 列にその旨を出してある。まずそこを疑うこと。
- **CLOSED_HINT は素朴な文字列一致なので誤検出が多い。**
  「本日の営業終了時刻」「直火は禁止」「旧町名を廃止」などが引っかかる。
  **必ず evidence の前後を読んでから判断する。**
- **OK は「営業している」の証明ではない。** JS でしか描画しないサイトは本文が空に近く、
  閉業の告知があっても拾えない。そういう行は evidence に「本文がほぼ空」と出してある。
- **\`takaranoyama-fureai\` は、この検査では見つけられなかった型。**
  公式サイトは生きていて料金ページも通常どおりだが、\`/news/\` に閉館告知があった。
  **トップページだけでは分からない。**

## DEAD（${counts.DEAD}件）

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

## NO_URL（${counts.NO_URL}件）

\`officialUrl\` が無いので死活を確かめようがない。
§6-9 のとおり、\`officialUrl\` の欠落自体が「調べていない」の指標になりうる。

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('NO_URL') || '| （なし） | | | | |'}

## OK（${counts.OK}件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
${rows('OK') || '| （なし） | | | | |'}
`;

  fs.writeFileSync(OUT, md, 'utf8');
  console.log(`\n${ORDER.map((v) => `${v} ${counts[v]}`).join(' / ')}`);
  console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
