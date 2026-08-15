/**
 * パーキング／売却ページ判定の検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * ## なぜ要るか
 *
 * `forestpartymineyama.com`（峰山の**旧**ドメイン）が HTTP 200 で
 * Afternic/GoDaddy の売却ページを返していたのに、
 * 旧 `PARKED_PATTERNS`（完全一致13語）は**一致0件**で `OK` 判定になった。
 *
 * ## 両方向で見る
 *
 *   陽性 … 売却・停止ページが PARKED として立つこと
 *   陰性 … **正常なキャンプ場の公式が PARKED にならないこと**（こちらが本番で効く）
 *
 * 陰性側は実測した本物の文面を使う。誤爆すると
 * **生きている施設を「閉業」と誤判定してデータを壊す**ので、陽性より重い。
 *
 * 実行: `node scripts/.mock-parked-test.js`
 */
const { classifyParked, PARKED_PATTERNS, PARK_THIN_CHARS, toPlainText } = require('./check-official-urls.js');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/** 旧判定（完全一致13語）。**新旧の差を見るために残す** */
const oldVerdict = t => PARKED_PATTERNS.some(p => t.includes(p));

/* ── 陽性: 実測した売却ページの文面 ───────────────────────────────
 * forestpartymineyama.com（2026-08-15 実測）から要点を抜いたもの。
 * 本文は約9,000字あったが、判定に効く語だけを残してある。 */
const FIX_GODADDY = toPlainText(`
<html><body>
<h1>forestpartymineyama.com — 4 referring domains</h1>
<p>ED.com Listing ID · ForestPartyMineyama.com Home .com</p>
<p>ForestPartyMineyama.com <b>Premium domain</b> · <b>For sale</b></p>
<p>Forest Party Mineyama .com Descriptive .com domain 19 characters · 2 years old</p>
<p>A short, memorable, established domain ready to power your brand.</p>
<p><b>Buy-it-now $195 USD</b></p>
<p>Buy ForestPartyMineyama.com — <b>Afternic</b> GoDaddy checkout</p>
<p>Not interested in buying this domain? Browse relevant content instead</p>
<p>What happens after you buy: 1 Pay Secure checkout on GoDaddy 2 Verify Ownership confirmed 3 Push Delivered within 24h</p>
<p>GoDaddy-protected checkout · ForestPartyMineyama.com Available — Premium domain</p>
</body></html>`);

const FIX_SEDO_JA = toPlainText(`
<html><body><h1>このドメインは売却対象です</h1>
<p>ドメインの有効期限が切れています。</p></body></html>`);

const FIX_SUSPENDED = toPlainText('<html><body><h1>Account Suspended</h1></body></html>');

const FIX_THIN_SELL = toPlainText(`
<html><body><p>This domain may be for sale. Make an offer.</p></body></html>`);

/* ── 陰性: 実測した「生きているキャンプ場」の文面 ─────────────────── */

// 稲ヶ崎オートキャンプ（inagasaki.world.coocan.jp / 2026-08-15 実測）
const FIX_INAGASAKI = toPlainText(`
<html><body>
<h1>稲ヶ崎オートキャンプ＆長崎デイキャンプ場 | 水と緑の体験ゾーン</h1>
<p>湖に囲まれるようなスペースのフリーキャンプサイト、1区画がゆったりしたスペースのオートキャンプサイト。</p>
<p>電源の貸出のお知らせ 令和6年2月10日からオートサイト23番から26番サイトで電源の貸出を致します。
ご利用の方はサイト料に1泊プラス1,100円でご利用いただけます。</p>
<p>お電話でご予約できます 稲ヶ崎キャンプ場 TEL0439-39-3390</p>
<p>じゃらんでも予約できるようになりました！</p>
</body></html>`);

// オートキャンプ・フルーツ村（fruitsvillage.com / 2026-08-15 実測）
const FIX_FRUITS = toPlainText(`
<html><body>
<h1>オートキャンプ・フルーツ村</h1>
<p>ファミリー対象で静かでのんびりとできる自然体験重視型のオートキャンプ場です</p>
<p>TEL. 0439-38-2255 〒292-1178 千葉県君津市旅名９６</p>
<p>施設料金 レンタル用品 アウトドア体験 インターネット予約 場内ルール</p>
<p>平日限定 ソロキャンプ割引 キャンペーン</p>
</body></html>`);

/** ★ 誤爆しやすい形をわざと作る（単独の語で切ると落ちるもの） */
const FIX_TRAP_GODADDY_FOOTER = toPlainText(`
<html><body>
<h1>○○オートキャンプ場</h1>
<p>${'当キャンプ場は房総の自然に囲まれた静かなキャンプ場です。'.repeat(40)}</p>
<p>ご予約はお電話またはメールで承ります。TEL 0470-00-0000</p>
<footer>Powered by GoDaddy Website Builder</footer>
</body></html>`);

const FIX_TRAP_FOR_SALE_WORD = toPlainText(`
<html><body>
<h1>○○キャンプ場 売店のご案内</h1>
<p>${'薪や炭、飲み物を売店で販売しています。Items for sale at our shop.'.repeat(40)}</p>
<p>キャンプサイトのご予約はこちら</p>
</body></html>`);

(async () => {
  console.log('\n■ 陽性（PARKED として立つべき）');
  const g = classifyParked(FIX_GODADDY);
  check('峰山の .com（GoDaddy/Afternic）が PARKED', !!g, g ? g.why : 'null');
  check('  ★ 旧判定（完全一致13語）は素通りしていた', oldVerdict(FIX_GODADDY) === false,
    `旧=${oldVerdict(FIX_GODADDY) ? 'PARKED' : '素通り'}`);
  check('  段は「マーケットプレイス名+売却文言」', g && /マーケットプレイス/.test(g.why), g ? g.why : '-');

  const s = classifyParked(FIX_SEDO_JA);
  check('日本語の売却ページが PARKED', !!s, s ? s.why : 'null');

  const su = classifyParked(FIX_SUSPENDED);
  check('Account Suspended が PARKED', !!su, su ? su.why : 'null');
  check('  段は「停止/準備中」', su && su.why === '停止/準備中', su ? su.why : '-');

  const th = classifyParked(FIX_THIN_SELL);
  check('売却文言だけでも本文が薄ければ PARKED', !!th, th ? th.why : 'null');
  check('  段は「本文が薄い」', th && /薄い/.test(th.why), th ? th.why : '-');

  console.log('\n■ 陰性（PARKED にしてはいけない）— **誤爆はデータを壊すので陽性より重い**');
  for (const [label, fx] of [
    ['稲ヶ崎オートキャンプ（実測）', FIX_INAGASAKI],
    ['オートキャンプ・フルーツ村（実測）', FIX_FRUITS],
  ]) {
    const r = classifyParked(fx);
    check(`${label} が PARKED にならない`, r === null, r ? `**誤爆** ${r.why}「${r.hit}」` : 'null');
  }

  console.log('\n■ 陰性の罠（単独の語で判定していたら落ちるもの）');
  const t1 = classifyParked(FIX_TRAP_GODADDY_FOOTER);
  check('フッタが「Powered by GoDaddy」でも PARKED にならない', t1 === null,
    t1 ? `**誤爆** ${t1.why}「${t1.hit}」` : 'null');
  const t2 = classifyParked(FIX_TRAP_FOR_SALE_WORD);
  check('本文に「for sale」があっても厚いページなら PARKED にならない', t2 === null,
    t2 ? `**誤爆** ${t2.why}「${t2.hit}」` : 'null');
  check(`  （閾値は ${PARK_THIN_CHARS}字。上の罠は ${FIX_TRAP_FOR_SALE_WORD.replace(/\s/g, '').length}字）`, true);

  console.log('\n■ 実ファイルがあれば本物でも確認（scratchpad にある場合のみ）');
  const fs = require('fs');
  const real = 'C:/Users/admin/AppData/Local/Temp/claude/C--Users-admin/20ebc60c-d1d2-4619-8fec-0831d5f1366b/scratchpad/w3-off-峰山.html';
  if (fs.existsSync(real)) {
    const t = toPlainText(fs.readFileSync(real, 'utf8'));
    const r = classifyParked(t);
    check(`実物の forestpartymineyama.com（${t.replace(/\s/g, '').length}字）が PARKED`, !!r, r ? r.why : 'null');
    check('  旧判定は素通り', oldVerdict(t) === false);
  } else {
    console.log('  （実ファイルなし。スキップ）');
  }

  const ng = results.filter(r => !r.ok);
  console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
  if (ng.length) process.exitCode = 1;
})();
