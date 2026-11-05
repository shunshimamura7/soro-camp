/**
 * こだわり検索の画面検証（2026-10-30）。数値で出す。
 *   node scripts/verify-filterbar-2026-10-30.js <baseURL> <shotDir>
 * 例: npx serve out → node scripts/verify-filterbar-2026-10-30.js http://localhost:3000 shots
 *
 * 「重なり」は2種類出す。
 *   geom    … バーとカードの矩形の交差面積。sticky バーの下をカードが通過するので、
 *             スクロール中は0にならないのが正常（カードはバーの「下」にある）
 *   visible … バーの領域を1pxずつ elementFromPoint で引き、バー以外（カード等）が
 *             最前面に出ている画素数。**これが「被る・透ける」の実測値で、0 が合格**
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const base = process.argv[2] || "http://localhost:3000";
const shotDir = process.argv[3] || "shots";
fs.mkdirSync(shotDir, { recursive: true });

const results = { checks: [], fail: [] };
const ok = (name, pass, detail) => {
  results.checks.push({ name, pass, detail });
  if (!pass) results.fail.push(name);
  console.log(`${pass ? "OK " : "NG "} ${name} ${JSON.stringify(detail)}`);
};

// ブラウザ内で使う関数
const inPage = {
  measure: () => {
    const bar = document.querySelector('[data-testid="filter-bar"]');
    const r = bar.getBoundingClientRect();
    const cards = [...document.querySelectorAll("article")];
    let geom = 0, cardsUnderBar = 0;
    for (const c of cards) {
      const b = c.getBoundingClientRect();
      const w = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left));
      const h = Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top));
      if (w * h > 0) { geom += w * h; cardsUnderBar++; }
    }
    let visible = 0, visibleCard = 0, sampled = 0, outside = 0;
    const x0 = Math.max(0, Math.ceil(r.left)), x1 = Math.min(innerWidth, Math.floor(r.right));
    const y0 = Math.max(0, Math.ceil(r.top)), y1 = Math.min(innerHeight, Math.floor(r.bottom));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      sampled++;
      const el = document.elementFromPoint(x + 0.5, y + 0.5);
      if (!el) { outside++; continue; }   // ビューポート外（右端1列など）。何も描かれていない
      if (!bar.contains(el)) { visible++; if (el.closest("article")) visibleCard++; }
    }
    return { scrollY, barTop: r.top, barHeight: r.height, cards: cards.length, cardsUnderBar,
             geomOverlapPx: Math.round(geom), visibleOverlapPx: visible, visibleCardPx: visibleCard, sampledPx: sampled, nullPx: outside };
  },
  bg: (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, opacity: cs.opacity, backdrop: cs.backdropFilter || cs.webkitBackdropFilter || "none" };
  },
  contrasts: (rootSel) => {
    const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
    const root = document.querySelector(rootSel);
    if (!root) return [];
    const out = [];
    for (const el of root.querySelectorAll("[data-count], [data-testid=result-count]")) {
      const btn = el.closest("button");
      const fg = parse(getComputedStyle(el).color), bg = bgOf(el);
      const L1 = lum(fg), L2 = lum(bg);
      out.push({ text: el.textContent.trim(), label: (btn ? btn.getAttribute("aria-label") : el.parentElement.textContent.trim()).slice(0, 24),
                 disabled: !!(btn && btn.disabled), selected: btn ? btn.getAttribute("aria-pressed") === "true" : false,
                 ratio: +((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2), fg: getComputedStyle(el).color, bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})` });
    }
    return out;
  },
};
const alphaOf = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return p.length > 3 ? p[3] : 1; };

async function run(width, height) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="filter-bar"]');
  const tag = `w${width}`;

  await page.screenshot({ path: path.join(shotDir, `${tag}-before.png`) });
  const bar0 = await page.evaluate(inPage.measure);
  ok(`${tag} バーの高さ ≤ 56px`, bar0.barHeight <= 56, { barHeight: bar0.barHeight });

  // 3画面分、1画面ずつスクロールして各位置で測る
  const steps = [];
  for (let i = 1; i <= 3; i++) {
    await page.evaluate((h) => window.scrollTo(0, h), height * i);
    await page.waitForTimeout(250);
    steps.push(await page.evaluate(inPage.measure));
  }
  await page.screenshot({ path: path.join(shotDir, `${tag}-after-scroll.png`) });
  for (const s of steps) {
    ok(`${tag} scrollY=${s.scrollY} バー領域にカードが出ている画素 = 0`, s.visibleOverlapPx === 0 && s.barTop === 0,
       { barTop: s.barTop, visibleOverlapPx: s.visibleOverlapPx, visibleCardPx: s.visibleCardPx, sampledPx: s.sampledPx, nullPx: s.nullPx, geomOverlapPx: s.geomOverlapPx, cardsUnderBar: s.cardsUnderBar, cards: s.cards });
  }

  const barBg = await page.evaluate(inPage.bg, '[data-testid="filter-bar"]');
  ok(`${tag} バー背景のアルファ = 1`, alphaOf(barBg.bg) === 1 && barBg.opacity === "1" && barBg.backdrop === "none", barBg);
  const barContrast = await page.evaluate(inPage.contrasts, '[data-testid="filter-bar"]');
  for (const c of barContrast) ok(`${tag} バー件数のコントラスト ≥ 4.5`, c.ratio >= 4.5, c);

  if (width >= 768) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const panelBg = await page.evaluate(inPage.bg, '[data-testid="filter-panel"]');
    ok(`${tag} パネル背景のアルファ = 1`, panelBg && alphaOf(panelBg.bg) === 1, panelBg);
    const pos = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="filter-panel"]')).position);
    ok(`${tag} パネルは sticky でない`, pos !== "sticky" && pos !== "fixed", { position: pos });
    const cs = await page.evaluate(inPage.contrasts, '[data-testid="filter-panel"]');
    const enabled = cs.filter((c) => !c.disabled);
    const minR = Math.min(...enabled.map((c) => c.ratio));
    ok(`${tag} パネル件数のコントラスト最小値 ≥ 4.5（押せる ${enabled.length}個）`, minR >= 4.5, { min: minR, worst: enabled.sort((a, b) => a.ratio - b.ratio)[0] });
    // 0件を実際に作る：押せる条件を順に足していき、0件のピルが出るまで進める
    for (const key of ["fishing", "wifi", "noReservation", "bath", "pet", "shop"]) {
      const btn = page.locator(`[data-testid="filter-panel"] [data-feature="${key}"]`);
      if (await btn.isEnabled()) await btn.click();
      await page.waitForTimeout(80);
    }
    const zero = await page.evaluate(() => [...document.querySelectorAll('[data-testid="filter-panel"] [data-feature]')].map((b) => ({
      key: b.dataset.feature, pressed: b.getAttribute("aria-pressed") === "true", disabled: b.disabled, label: b.getAttribute("aria-label") })));
    const zeroUnpressed = zero.filter((z) => !z.pressed && / 0件$/.test(z.label));
    const pressed = zero.filter((z) => z.pressed);
    ok(`${tag} 0件の条件は押せない／選択中は0件でも押せる`,
       zeroUnpressed.length > 0 && zeroUnpressed.every((z) => z.disabled) && pressed.every((z) => !z.disabled),
       { zeroDisabled: zeroUnpressed.map((z) => z.key), pressed: pressed.map((z) => `${z.key}(${z.label.split(" ").pop()})`) });
    await page.screenshot({ path: path.join(shotDir, `${tag}-panel-zero.png`) });
    const csZero = await page.evaluate(inPage.contrasts, '[data-testid="filter-panel"]');
    const enabledZ = csZero.filter((c) => !c.disabled);
    ok(`${tag} 選択中ピルを含む件数のコントラスト最小値 ≥ 4.5`, Math.min(...enabledZ.map((c) => c.ratio)) >= 4.5,
       { min: Math.min(...enabledZ.map((c) => c.ratio)), disabledRatio: csZero.filter((c) => c.disabled).map((c) => c.ratio) });
    await page.click('[data-testid="filter-panel"] button:has-text("条件をリセット")');
    await page.waitForTimeout(100);
    await page.locator('[data-testid="filter-panel"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shotDir, `${tag}-panel.png`), fullPage: false });
  } else {
    // スマホ：シート
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);
    await page.click('[data-testid="filter-open"]');
    await page.waitForSelector('[data-testid="filter-sheet"]');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(shotDir, `${tag}-sheet-open.png`) });

    const sheetBg = await page.evaluate(inPage.bg, '[data-testid="filter-sheet"]');
    ok(`${tag} シート背景のアルファ = 1`, alphaOf(sheetBg.bg) === 1 && sheetBg.opacity === "1" && sheetBg.backdrop === "none", sheetBg);
    const cs = await page.evaluate(inPage.contrasts, '[data-testid="filter-sheet"]');
    const enabled = cs.filter((c) => !c.disabled);
    const minR = Math.min(...enabled.map((c) => c.ratio));
    ok(`${tag} シート件数のコントラスト最小値 ≥ 4.5（押せる ${enabled.length}個）`, minR >= 4.5, { min: minR, worst: enabled.sort((a, b) => a.ratio - b.ratio)[0] });
    const disabledShown = cs.filter((c) => c.disabled).map((c) => c.label);
    ok(`${tag} 0件の条件は押せない`, cs.filter((c) => c.disabled).every((c) => /\b0件$/.test(c.label) || c.text === "0件"), { disabled: disabledShown });

    // タップ領域
    const small = await page.evaluate(() => [...document.querySelectorAll('[data-testid="filter-sheet"] button')]
      .map((b) => ({ t: (b.getAttribute("aria-label") || b.textContent).trim().slice(0, 20), h: b.getBoundingClientRect().height }))
      .filter((b) => b.h < 44));
    ok(`${tag} シート内のボタンはすべて高さ 44px 以上`, small.length === 0, { small });
    const cols = await page.evaluate(() => {
      const g = document.querySelector('[data-testid="filter-sheet"] [data-feature]').parentElement;
      return getComputedStyle(g).gridTemplateColumns.split(" ").length;
    });
    ok(`${tag} 条件グリッドは2列`, cols === 2, { cols });
    const headings = await page.evaluate(() => [...document.querySelectorAll('[data-testid="filter-sheet"] p')].map((p) => p.textContent.trim()).filter((t) => ["設備", "買える", "その他"].includes(t)));
    ok(`${tag} グループ見出し 設備／買える／その他`, headings.join("/") === "設備/買える/その他", { headings });

    // 背面スクロールが止まっているか。**利用者の指の操作だけで測る**（scrollTo などのプログラム操作は対象外）。
    // CDP の synthesizeScrollGesture はこの環境では空振りした（シートなしでもページが動かなかった）ので、
    // touchStart/Move/End を直接送る。効いていることは「シートなしで動く」対照で先に確かめる。
    const cdp = await ctx.newCDPSession(page);
    const swipe = async (x, y, dy) => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= 20; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + (dy * i) / 20 }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(300);
    };
    const inner = () => page.evaluate(() => document.querySelector('[data-testid="filter-sheet"] .overflow-y-auto').scrollTop);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
    const c0 = await page.evaluate(() => scrollY);
    await swipe(195, 700, -300);
    const c1 = await page.evaluate(() => scrollY);
    ok(`${tag} 対照：シートなしなら同じスワイプでページが動く`, c1 !== c0, { before: c0, after: c1 });
    await page.click('[data-testid="filter-open"]');
    await page.waitForSelector('[data-testid="filter-sheet"]');
    // body を fixed で固定するので scrollY は使えない。**一覧の先頭カードの画面上の位置**で測る
    const cardTop = () => page.evaluate(() => Math.round(document.querySelector("article").getBoundingClientRect().top));
    const y0 = await cardTop();
    await swipe(195, 40, 120);    // 暗幕を下へなでる
    await swipe(195, 160, -120);  // 暗幕を上へなでる
    await swipe(195, 700, -400);  // シートの中身を上へ（中身だけ動くこと）
    const innerTop = await inner();
    await swipe(195, 700, -2000); // 中身の下端を越えて押し込む（背面へ連鎖しないこと）
    const y1 = await cardTop();
    const ovf = await page.evaluate(() => [getComputedStyle(document.documentElement).overflow, getComputedStyle(document.body).overflow, getComputedStyle(document.body).position]);
    ok(`${tag} シート表示中は背面がスクロールしない（先頭カードの画面上の位置が不変）`, y0 === y1 && innerTop > 0,
       { cardTopBefore: y0, cardTopAfter: y1, sheetInnerScrolled: innerTop, lock: ovf });
    await page.click('[data-testid="filter-sheet-close"]');
    await page.waitForTimeout(250);
    const yBack = await cardTop();
    ok(`${tag} 閉じると開く前の位置に戻る`, yBack === y0, { cardTopBefore: y0, cardTopAfterClose: yBack });
    await page.click('[data-testid="filter-open"]');
    await page.waitForSelector('[data-testid="filter-sheet"]');
    await page.evaluate(() => document.querySelector('[data-testid="filter-sheet"] .overflow-y-auto').scrollTo(0, 0));

    // 条件を足して「◯件を表示」と閉じた後の件数を比べる
    await page.click('[data-testid="filter-sheet"] [data-feature="bath"]');
    await page.waitForTimeout(150);
    const applyText = (await page.textContent('[data-testid="filter-sheet-apply"]')).trim();
    await page.screenshot({ path: path.join(shotDir, `${tag}-sheet-bath.png`) });
    await page.click('[data-testid="filter-sheet-apply"]');
    await page.waitForTimeout(250);
    const closed = (await page.$('[data-testid="filter-sheet"]')) === null;
    const barCount = (await page.textContent('[data-testid="result-count"]')).trim();
    // 2026-11-05：一覧は40件ずつ描く。描いた枚数＋「もっと見る（残りN件）」の N が件数と一致すればよい
    const cardCount = await page.evaluate(() => {
      const shown = document.querySelectorAll("article").length;
      const m = Array.from(document.querySelectorAll("button")).map((b) => b.textContent || "").join(" ").match(/もっと見る（残り(\d+)件）/);
      return shown + (m ? Number(m[1]) : 0);
    });
    const n = Number(applyText.replace(/件を表示/, ""));
    ok(`${tag} 「◯件を表示」= バーの件数 = 一覧のカード数（描画済み＋残り）`, closed && barCount === `${n}件` && cardCount === n, { applyText, barCount, cardCount });
    const ovf2 = await page.evaluate(() => [document.documentElement.style.overflow, document.body.style.overflow, document.body.style.position]);
    ok(`${tag} 閉じたらロックが外れる`, ovf2.every((o) => o === ""), { inline: ovf2 });

    // 背景タップで閉じる / × で閉じる / Esc で閉じる
    await page.click('[data-testid="filter-open"]');
    await page.waitForSelector('[data-testid="filter-sheet"]');
    await page.mouse.click(195, 20);
    await page.waitForTimeout(150);
    ok(`${tag} 背景タップで閉じる`, (await page.$('[data-testid="filter-sheet"]')) === null, {});
    await page.click('[data-testid="filter-open"]');
    await page.click('[data-testid="filter-sheet-close"]');
    await page.waitForTimeout(150);
    ok(`${tag} × で閉じる`, (await page.$('[data-testid="filter-sheet"]')) === null, {});
    await page.click('[data-testid="filter-open"]');
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
    ok(`${tag} Esc で閉じる`, (await page.$('[data-testid="filter-sheet"]')) === null, {});
  }

  // 野営地タブにはバーもこだわり検索も出さない
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('button[aria-pressed]:has-text("野営地")');
  await page.waitForTimeout(200);
  const wildBar = await page.$('[data-testid="filter-bar"]');
  const budget = await page.$('input[type="range"]');
  ok(`${tag} 野営地タブにこだわり検索・予算が出ない`, !wildBar && !budget, {});
  await page.screenshot({ path: path.join(shotDir, `${tag}-wild.png`) });

  await browser.close();
}

(async () => {
  await run(390, 844);
  await run(1280, 900);
  fs.writeFileSync(path.join(shotDir, "result.json"), JSON.stringify(results, null, 2));
  console.log(results.fail.length ? `NG ${results.fail.length}件` : `すべて合格（${results.checks.length}項目）`);
  process.exit(results.fail.length ? 1 : 0);
})();
