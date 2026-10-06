/**
 * こだわり検索の見え方を実寸で撮る（2026-10-06）。
 *
 * **Android 実機想定の幅 360px** と、PC の 1280px の2つ。
 * 撮るだけでなく、**文字切れとはみ出しを機械で測る。**
 * 目視だけだと「なんとなく入っている」で通してしまうので、次の2つを数値で見る。
 *
 *   1. 横スクロールが出ていないか（`documentElement.scrollWidth` > ビューポート幅）
 *   2. 各ボタンの中身が切れていないか（`scrollWidth` > `clientWidth` ＝ 省略記号が出る状態）
 *   3. タップ領域が 44px 以上あるか
 *
 * `out/` を静的に配信して撮る（`next start` は不要）。
 *
 *   node scripts/shot-filters-2026-10-06.js
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'out');
const OUT_DIR = path.join(__dirname, 'shots-2026-10-06');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

/** out/ をそのまま配る小さなサーバ。Pages と同じく拡張子なしは .html を足す */
function serve(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      let file = path.join(ROOT, p);
      if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

/** 文字切れ・はみ出し・タップ領域を測る */
async function measure(page, width) {
  return page.evaluate((vw) => {
    const docW = document.documentElement.scrollWidth;
    const overflow = docW > vw + 1 ? docW - vw : 0;

    const buttons = [...document.querySelectorAll('button')];
    const clipped = [];
    const small = [];
    for (const b of buttons) {
      const r = b.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;          // 非表示は見ない
      // 中身が器より広い＝省略記号が出る（＝文字切れ）
      for (const el of [b, ...b.querySelectorAll('span')]) {
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          clipped.push((b.textContent || '').trim().slice(0, 24));
          break;
        }
      }
      // タップ領域。44px はモバイルの下限
      if (r.height < 44 - 0.5) small.push(`${(b.textContent || '').trim().slice(0, 16)} h=${r.height.toFixed(1)}`);
      // 画面の外へ出ていないか
      if (r.right > vw + 1) clipped.push(`[はみ出し] ${(b.textContent || '').trim().slice(0, 20)}`);
    }
    return { docW, overflow, clipped: [...new Set(clipped)], small: [...new Set(small)], buttons: buttons.length };
  }, width);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const PORT = 4321;
  const server = await serve(PORT);
  const browser = await chromium.launch();
  const problems = [];

  for (const [name, width, height] of [['360', 360, 800], ['1280', 1280, 900]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // (1) キャンプ場タブ（既定）
    const f1 = path.join(OUT_DIR, `filters-${name}-campground.png`);
    await page.screenshot({ path: f1, fullPage: false });
    const m1 = await measure(page, width);
    console.log(`\n[${name}px / キャンプ場タブ] ボタン${m1.buttons}個`);
    console.log(`  横はみ出し: ${m1.overflow}px（0なら無し。doc幅 ${m1.docW}）`);
    console.log(`  文字切れ  : ${m1.clipped.length ? m1.clipped.join(' / ') : 'なし'}`);
    console.log(`  44px未満  : ${m1.small.length ? m1.small.join(' / ') : 'なし'}`);
    if (m1.overflow > 0) problems.push(`${name}px キャンプ場タブ: 横に ${m1.overflow}px はみ出し`);
    if (m1.clipped.length) problems.push(`${name}px キャンプ場タブ: 文字切れ ${m1.clipped.join(', ')}`);
    if (m1.small.length) problems.push(`${name}px キャンプ場タブ: タップ領域44px未満 ${m1.small.join(', ')}`);

    // (2) 条件を2つ選んだ状態（「選択中」の行が出る）
    await page.getByRole('button', { name: /風呂あり/ }).first().click().catch(() => {});
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /薪を買える/ }).first().click().catch(() => {});
    await page.waitForTimeout(400);
    const f2 = path.join(OUT_DIR, `filters-${name}-selected.png`);
    await page.screenshot({ path: f2, fullPage: false });
    const m2 = await measure(page, width);
    console.log(`[${name}px / 条件2つ選択] はみ出し ${m2.overflow}px / 文字切れ ${m2.clipped.length ? m2.clipped.join(' / ') : 'なし'}`);
    if (m2.overflow > 0) problems.push(`${name}px 選択中: 横に ${m2.overflow}px はみ出し`);
    if (m2.clipped.length) problems.push(`${name}px 選択中: 文字切れ ${m2.clipped.join(', ')}`);

    // (3) 野営地タブ（こだわり検索と予算が消え、前提説明が出る）
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: /野営地/ }).click();
    await page.waitForTimeout(500);
    const f3 = path.join(OUT_DIR, `wild-${name}.png`);
    await page.screenshot({ path: f3, fullPage: false });
    const m3 = await measure(page, width);
    const hasNote = await page.getByText('この場所について').count();
    const hasFilter = await page.getByText('希望の条件で探す').count();
    console.log(`[${name}px / 野営地タブ] 「この場所について」${hasNote}個 / 「希望の条件で探す」${hasFilter}個（0であるべき）`);
    console.log(`  はみ出し ${m3.overflow}px / 文字切れ ${m3.clipped.length ? m3.clipped.join(' / ') : 'なし'}`);
    if (hasNote === 0) problems.push(`${name}px 野営地タブ: 前提説明「この場所について」が出ていない`);
    if (hasFilter > 0) problems.push(`${name}px 野営地タブ: こだわり検索が残っている`);
    if (m3.overflow > 0) problems.push(`${name}px 野営地タブ: 横に ${m3.overflow}px はみ出し`);

    await ctx.close();
  }

  await browser.close();
  server.close();

  console.log(`\n保存先: ${OUT_DIR}`);
  for (const f of fs.readdirSync(OUT_DIR)) console.log('  ' + f);
  if (problems.length) {
    console.error('\n❌ 問題あり');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('\n✅ 横はみ出し・文字切れ・タップ領域44px未満 いずれも無し');
})();
