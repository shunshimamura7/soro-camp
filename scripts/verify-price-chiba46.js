/**
 * STEP B — 千葉46件の料金を**一次情報で裏取り**する（2026-08-19）。読み取り専用。
 *
 *   node scripts/verify-price-chiba46.js --selftest
 *   node scripts/verify-price-chiba46.js --run
 *
 * 入力: `scripts/.nap-harvest/chiba-detail46.json`（STEP A の出力）
 * 出力: `scripts/chiba-price-verify-2026-08-19.md` と 同名 `.json`
 *
 * ## ★ 一次情報の定義（2026-08-19 に広げた）
 *
 * 初版は「施設公式のみ」と狭く取っていた。**それは誤り。**元のルールは
 * **自治体公式 > 施設公式 > 予約サイト**の優先順で、**自治体公式も一次情報**。
 *
 * 一次情報として認めるもの:
 *
 *   - **自治体公式**（市町村・県のページ。**設置者側**）
 *   - **県民の森・公園などの公式サイト**（公の施設の運営主体）
 *   - **施設公式サイト**
 *
 * 認めないもの: **なっぷ・じゃらん等の予約サイト単独**（従来どおり）。
 *
 * **★ `hpUrl` が空＝公式が無い、ではない。**なっぷに登録されていないだけ。
 * 空の施設は他の経路（既存DBの `officialUrl` / `MUNI_SOURCES` の自治体公式）を当たる。
 * **それでも見つからなければ `PRICE_NO_PRIMARY` のまま。埋めない。探した記録は残す。**
 *
 * ## 分類（**6つ。3分類に潰さない**）
 *
 * | 分類 | 意味 | priceVerified |
 * |---|---|---|
 * | `PRICE_MATCH` | 一次情報に金額があり、**なっぷの金額と重なる** | **立てられる** |
 * | `PRICE_PRIMARY_ONLY` | 一次情報に金額があるが、**なっぷ側に料金の原文が無い**（比較相手がいない） | **立てられる**（一次情報で確認できている） |
 * | `PRICE_MISMATCH` | 双方に金額はあるが**1つも重ならない** | 立てない（**どちらが正しいか人が見る**） |
 * | `PRICE_NOT_ON_OFFICIAL` | 一次情報は取れたが、**ページに金額表記が無い** | 立てない |
 * | `PRICE_NO_PRIMARY` | **一次情報の URL が見つからない** | 立てない（**測れていない**） |
 * | `PRICE_UNREACHABLE` | URL はあるが**取れなかった**（403 / 404 / robots / タイムアウト） | 立てない（**測れていない**） |
 *
 * **★ 下2つは「一致しない」ではない。「測れていない」。**
 * 3分類（一致/不一致/記載なし）に押し込むと、**測れなかったものが「記載なし」に化ける**
 * （§19-4 / §21-4 と同じ穴）。だから6つに分けて持つ。
 *
 * ## ★ ソロ1名の総額は、このスクリプトでは決めない
 *
 * 指示の `priceMin` は「ソロ1名が実際に払う総額（入場料・駐車料・渡船料・管理費込み）」。
 * **原文に書かれていない項目を 0 円と見なすと、内訳から総額を作ったことになる**（§20-1）。
 * ここでやるのは:
 *
 *   1. 課金方式の判定（**施設自身の言葉から**。「1区画あたり」「大人」等）
 *   2. 原文に現れる金額の一覧（なっぷ側・公式側の両方）
 *   3. **ソロ総額が原文だけで決まるかどうかの可否判定**
 *
 * 決まらないものは `SOLO_UNDECIDABLE` として残す。**埋めない。**
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { _internal, helpers } = require('./district-sweep.js');
const { fetchPage, collectSource } = _internal;
const { stripTags } = helpers;

const IN = path.join(__dirname, '.nap-harvest', 'chiba-detail46.json');
const DB = path.join(__dirname, '..', 'data', 'campgrounds.json');
const OUT_MD = path.join(__dirname, 'chiba-price-verify-2026-08-19.md');
const OUT_JSON = path.join(__dirname, 'chiba-price-verify-2026-08-19.json');

/* ============================================================================
 * 1. 金額の取り出し
 * ========================================================================== */

/** 全角を半角に寄せる（**表示の違いであって値の違いではない**） */
const toHalf = (s) => String(s).replace(/[０-９，]/g, (c) => '0123456789,'['０１２３４５６７８９，'.indexOf(c)]);

/**
 * テキストから金額を拾う。**円 か ¥ が付いているものだけ。**
 *
 * 裸の数字は拾わない（電話番号・郵便番号・区画数・平米が全部混ざる）。
 * 上限を置く（1,000,000円超は料金表ではない）。
 */
function money(text) {
  if (!text) return [];
  const t = toHalf(stripTags(String(text)));
  const out = new Set();
  for (const m of t.matchAll(/([0-9][0-9,]{0,9})\s*円/g)) {
    const n = Number(m[1].replace(/,/g, ''));
    if (n >= 100 && n <= 1000000) out.add(n);
  }
  for (const m of t.matchAll(/[¥￥]\s*([0-9][0-9,]{0,9})/g)) {
    const n = Number(m[1].replace(/,/g, ''));
    if (n >= 100 && n <= 1000000) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

/** 料金の周辺だけを原文で切り出す（**要約しない。原文のまま**） */
function priceExcerpts(html, max) {
  const t = stripTags(String(html || '')).replace(/[ \t　]+/g, ' ').replace(/\n{2,}/g, '\n');
  const out = [];
  const re = /[0-9０-９][0-9０-９,，]{0,9}\s*円|[¥￥]\s*[0-9０-９]/g;
  let m;
  while ((m = re.exec(t)) && out.length < (max || 12)) {
    const a = Math.max(0, m.index - 60), b = Math.min(t.length, m.index + 80);
    const seg = t.slice(a, b).trim();
    if (!out.some((x) => x === seg)) out.push(seg);
    re.lastIndex = b;
  }
  return out;
}

/* ============================================================================
 * 2. 課金方式（**施設自身の言葉から。推測しない**）
 * ========================================================================== */
const PER_SITE_RE = /1\s*区画|一区画|1\s*サイト|サイト単位|1\s*張|1\s*棟|区画あたり|サイトあたり/;
const PER_PERSON_RE = /大人|中学生|小学生|小人|こども|子供|1\s*名|一名|1\s*人|一人|人数分|お一人/;

function chargeModel(text) {
  const t = stripTags(String(text || ''));
  if (!t.trim()) return { model: 'UNKNOWN', why: '原文が空' };
  const site = PER_SITE_RE.test(t), person = PER_PERSON_RE.test(t);
  if (site && person) return { model: 'SITE_PLUS_PERSON', why: '「区画/サイト単位」と「人数」の両方の記述がある' };
  if (site) return { model: 'PER_SITE', why: '「区画/サイト単位」の記述がある' };
  if (person) return { model: 'PER_PERSON', why: '「大人/1名」等の人数の記述がある' };
  return { model: 'UNKNOWN', why: '課金の単位を示す語が原文に無い' };
}

/** 総額に足すべき別建ての費目が原文に出ているか（**出ていない＝0円ではない**） */
const EXTRA_RE = {
  入場料: /入場料|入園料|施設利用料|環境協力金|入村料/,
  駐車料: /駐車料|駐車場料金|駐車場代|車両[^。]{0,6}円/,
  管理費: /管理費|清掃費|維持費/,
  渡船料: /渡船|船賃|乗船/,
};
function extraFees(text) {
  const t = stripTags(String(text || ''));
  const hit = [];
  for (const k of Object.keys(EXTRA_RE)) if (EXTRA_RE[k].test(t)) hit.push(k);
  return hit;
}

/* ============================================================================
 * 3. 公式サイトの URL をどこから取るか
 *
 * 順序は §20-3（料金は施設公式が上）。**推測で URL を作らない。**
 * ========================================================================== */
/**
 * `MUNI_SOURCES` の千葉8市町村から、**自治体公式の施設ページ**を集める。
 *
 * 対象は `layer: 'L1'` で、**自治体ドメインのもの**だけ（`*.lg.jp` / `city.*.jp` / `pref.*.jp` /
 * `town.*.jp`）。観光協会（`cm-boso` 等）は運営が協会なので**設置者ではない**ため入れない
 * （§21-2「ドメインで格を決めない。運営主体で決める」の裏返しで、ここは運営主体で選んでいる）。
 *
 * **県台帳（`pref-chiba-sports`）はページに料金が無い**（列は 名称・所在地・規模・連絡先・電話）
 * ので、URL を持っていても料金の裏取りには使えない。集めるが用途を分けて記録する。
 */
const MUNI_HOST_RE = /(^|\.)((city|town|pref)\.[a-z0-9-]+\.[a-z.]+|[a-z0-9-]+\.lg\.jp)$/i;

async function collectMunicipalPages() {
  const { chibaMuniSources } = require('./chiba-sources.js');
  const muni = chibaMuniSources();
  const seenSrc = new Set();
  const pages = [];   // { name, url, sourceId, label }
  for (const key of Object.keys(muni)) {
    for (const src of muni[key].sources) {
      if (src.layer !== 'L1') continue;
      if (seenSrc.has(src.id)) continue;
      let host = '';
      try { host = new URL(src.pages[0]).hostname; } catch { /* URL でなければ飛ばす */ }
      if (!MUNI_HOST_RE.test(host)) continue;
      seenSrc.add(src.id);
      const r = await collectSource(src, { useCache: true });
      console.error('  自治体公式 ' + src.id + ' … ' + r.status + ' ' + r.items.length + '件');
      for (const it of r.items) {
        if (it.url && it.ownUrl) pages.push({ name: it.name, url: it.url, sourceId: src.id, label: src.label, city: key });
      }
    }
  }
  return pages;
}

/**
 * 一次情報の URL を決める。**優先順は 施設公式 → 自治体公式 → 既存DB。**
 *
 * 料金は §20-3 のとおり施設公式が上。ただし**公営施設は設置者＝自治体**なので、
 * 施設公式が無ければ自治体公式が一次情報になる。**予約サイトは入れない。**
 */
/* ★ 一次情報として認めないホスト。
 * **予約サイトは従来どおり不可。**加えて観光協会・DMO は「設置者でも施設でもない第三者」なので
 * 料金の一次情報にしない（§20-15 で きさらづDMO を L1 にしない判断が既にある）。 */
const NOT_PRIMARY_HOST_RE = /(nap-camp\.com|jalan\.net|rakuten|jtb|asoview|maruchiba\.jp|-dmo\.jp|dmo-|kanko|kankou)/i;
const notPrimaryReason = (u) => {
  try { return NOT_PRIMARY_HOST_RE.test(new URL(u).hostname) ? new URL(u).hostname : null; }
  catch { return null; }
};

const isHttpUrl = (u) => {
  if (!u) return false;
  try { const x = new URL(String(u).trim()); return x.protocol === 'http:' || x.protocol === 'https:'; }
  catch { return false; }
};

/* ★ 施設名＋所在地で人手（検索）で探した一次情報の URL。
 * `scripts/.nap-harvest/official-candidates.json` に seq をキーに置く。
 * **検索結果ページの記述は信じない。**ここに入るのは URL だけで、
 * 本文は下の `validateOfficialPage()` が実際に取得してから照合する。 */
const CANDIDATES = (() => {
  const f = path.join(__dirname, '.nap-harvest', 'official-candidates.json');
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; }
})();

/**
 * ★ 掴んだページが**本当にその施設のものか**を本文で照合する。
 *
 * 木更津市立と千葉県立の少年自然の家を取り違えかけた事故（2026-08-19）と同じ型を、
 * 検索経由でも繰り返さないための関門。**名前と市町村の両方**が本文に出ることを求める。
 * 施設名は表記ゆれがあるので、**正規化した名前の中の連続する2文字以上の塊**で見る。
 */
function validateOfficialPage(text, rec, normName) {
  const t = String(text || '');
  if (!t) return { ok: false, why: '本文が空' };
  const city = rec.city || '';
  const cityOk = !city || t.indexOf(city) >= 0 || t.indexOf(city.replace(/[市町村]$/, '')) >= 0;

  /* 名前の照合は**4文字の窓**で見る。
   * 完全一致だけだと、正しいページでも落ちる（実測: 我孫子市公式の使用料ページは
   * 見出しが「ふれあいキャンプ場」で「我孫子市」が名前側に付かない／
   * 千葉県公式の清和県民の森は「千葉県立」を冠さない）。
   * **窓を短くしすぎない**こと——2文字だと別施設でも当たる。 */
  const cands = [normName(rec.name) || '', String(rec.name || '').replace(/^【[^】]*】/, ''),
    String(rec.napName || '').replace(/^【[^】]*】/, '')].filter(Boolean);
  const low = t.toLowerCase();
  let nameOk = false, hitBy = null;
  for (const c of cands) {
    const cc = c.replace(/[\s　]/g, '');
    if (cc.length < 4) { if (cc && low.indexOf(cc.toLowerCase()) >= 0) { nameOk = true; hitBy = cc; break; } continue; }
    for (let i = 0; i + 4 <= cc.length; i++) {
      const w = cc.slice(i, i + 4).toLowerCase();
      if (low.indexOf(w) >= 0) { nameOk = true; hitBy = w; break; }
    }
    if (nameOk) break;
  }
  if (!nameOk) return { ok: false, why: '本文に施設名の断片（4文字）が1つも出てこない' };
  if (!cityOk) return { ok: false, why: '本文に市町村名（' + city + '）が出てこない' };
  return { ok: true, why: '施設名の断片「' + hitBy + '」と市町村「' + city + '」が本文に出る' };
}

function officialUrlFor(rec, dbByName, muniPages, normName) {
  const d = rec.detail || {};
  const tried = [];
  const pick = (url, from) => ({ url, from, tried });

  // ① 施設名＋所在地で探した一次情報（自治体公式 / 公園・県民の森公式 / 施設公式）
  const cand = CANDIDATES[String(rec.seq)];
  if (cand && cand.url && isHttpUrl(cand.url) && !notPrimaryReason(cand.url)) {
    return pick(cand.url, (cand.kind || '検索で特定') + '〈検索: ' + (cand.q || '') + '〉');
  }
  if (cand && !cand.url) tried.push('施設名＋所在地で検索 … ' + (cand.note || '一次情報のホストに到達できず') + '〈検索: ' + (cand.q || '') + '〉');

  /* ★ `hpUrl` は URL とは限らない。**メールアドレスが入っていた**
   * （`大多喜SABO` = `info@otaki-sabo.info`、2026-08-19 実測）。
   * 空でないことを URL であることの証拠にしない。 */
  const hp = String(d.hpUrl || '').trim();
  if (isHttpUrl(hp) && !notPrimaryReason(hp)) return pick(hp, '施設公式（なっぷの hpUrl）');
  if (isHttpUrl(hp) && notPrimaryReason(hp)) tried.push('なっぷの hpUrl … **一次情報として認めないホスト**（' + notPrimaryReason(hp) + '）');
  tried.push('なっぷの hpUrl … ' + (hp ? '**URL ではない値が入っている**（' + hp + '）' : '空'));

  const db = dbByName.get(rec.name) || (rec.napName ? dbByName.get(rec.napName) : null);
  if (db && isHttpUrl(db.officialUrl)) {
    const np = notPrimaryReason(db.officialUrl);
    if (!np) return pick(db.officialUrl, '既存DBの officialUrl');
    tried.push('既存DBの officialUrl … **一次情報として認めないホスト**（' + np + '。観光協会/DMO/予約サイトは設置者でも施設でもない）');
  } else {
    tried.push('既存DBの officialUrl … ' + (db ? '空' : 'DBに該当レコードなし'));
  }

  /* 自治体公式の施設ページを名前で当てる。
   *
   * ★★ **部分一致で当てない。**初版は「片方がもう片方を含む」も採っていて、
   * **木更津市立「少年自然の家キャンプ場」を 千葉県立「君津亀山少年自然の家」に当てていた**
   * （2026-08-19 実測）。正規化後の `少年自然の家` が部分文字列として一致しただけで、
   * **市も設置者も違う別施設。**そのまま通っていたら
   * **他人の施設の料金ページで priceVerified が立っていた。**
   * → 完全一致のみ。さらに**市町村の一致も要求する。** */
  const key = normName(rec.name);
  const sameCity = (p) => !rec.city || !p.city || p.city === rec.city;
  const hit = muniPages.filter((p) => key && normName(p.name) === key && sameCity(p))[0];
  if (hit) return pick(hit.url, '自治体公式（' + hit.sourceId + '）');
  tried.push('MUNI_SOURCES の自治体公式 ' + muniPages.length + 'ページ … 正規化名の完全一致なし（**部分一致は採らない**）');

  return pick(null, null);
}

/* ============================================================================
 * 3-b. ★ トップページだけで「金額が無い」と結論しない
 *
 * 初版はトップページ1枚だけを叩いて、金額が無ければ `PRICE_NOT_ON_OFFICIAL` にしていた。
 * **これは §22 そのもの** — 取得は成功しているが、見ているのはサイトの一部。
 * 実測で `otakikenminnomori.jp` も君津市公式の施設ページも、
 * **料金は別ページにあってトップには無かった。**
 *
 * 対策: トップから**料金らしいリンクを1階層だけ**辿る。同一ホストのみ、最大3ページ。
 * **辿った URL は全部記録する**（どこを見て「無い」と言ったかが残らないと再現できない）。
 * ========================================================================== */
const PRICE_LINK_RE = /料金|利用案内|利用料|使用料|価格|ご利用|プラン|price|ryokin|riyou|charge|fee|guide/i;

function priceLinks(html, baseUrl, max) {
  let base;
  try { base = new URL(baseUrl); } catch { return []; }
  const out = [];
  for (const m of String(html).matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
    const href = m[1], text = stripTags(m[2]);
    if (!PRICE_LINK_RE.test(href) && !PRICE_LINK_RE.test(text)) continue;
    let u;
    try { u = new URL(href, base); } catch { continue; }
    if (u.hostname !== base.hostname) continue;           // 外部サイトへは出ない
    if (!/^https?:$/.test(u.protocol)) continue;
    u.hash = '';
    const s2 = u.toString();
    if (s2 === baseUrl) continue;
    if (out.indexOf(s2) < 0) out.push(s2);
    if (out.length >= (max || 3)) break;
  }
  return out;
}

/* ============================================================================
 * 4. SELF_TEST — **答えが分かっている入力を通す**
 * ========================================================================== */
function selfTest() {
  console.log('SELF_TEST: 金額の拾い方と課金方式の判定\n');
  const fails = [];
  const t = (cond, label) => { if (cond) console.log('  ✅ ' + label); else fails.push(label); };

  // 金額。**円が付いたものだけ拾い、電話番号や平米を拾わない**
  const sample = '<p>テントサイト 3,000円(3,300円）／電話 0439-27-2711／1区画約120㎡／入場料 500円</p>';
  const m = money(sample);
  t(m.indexOf(3000) >= 0 && m.indexOf(3300) >= 0 && m.indexOf(500) >= 0, '円付きの金額を拾う: [' + m.join(',') + ']');
  t(m.indexOf(120) < 0, '平米（120㎡）を金額として拾わない');
  t(m.every((x) => x !== 4392772711), '電話番号を金額として拾わない');
  // 全角
  t(money('１，２００円').indexOf(1200) >= 0, '全角の「１，２００円」を拾う');
  // 上限
  t(money('2000000円').length === 0, '桁外れ（2,000,000円）は料金表ではないので落とす');

  // 課金方式
  t(chargeModel('1区画あたり 3,000円').model === 'PER_SITE', '「1区画あたり」→ PER_SITE');
  t(chargeModel('大人 1,000円 小人 500円').model === 'PER_PERSON', '「大人/小人」→ PER_PERSON');
  t(chargeModel('1区画 2,000円＋大人 500円').model === 'SITE_PLUS_PERSON', '両方 → SITE_PLUS_PERSON');
  t(chargeModel('お問い合わせください').model === 'UNKNOWN', '単位の語が無ければ UNKNOWN（推測しない）');
  t(chargeModel('').model === 'UNKNOWN', '空文字は UNKNOWN');

  // 別建ての費目
  const ex = extraFees('入場料 500円 駐車料 1,000円');
  t(ex.indexOf('入場料') >= 0 && ex.indexOf('駐車料') >= 0, '別建ての費目を拾う: ' + ex.join('/'));
  t(extraFees('テントサイト 3,000円').length === 0, '書かれていない費目は拾わない（**0円と見なさない**）');

  // 偽の成功が出ないこと
  t(money('').length === 0 && priceExcerpts('').length === 0, '空入力で空を返す（偽の成功が出ない）');

  if (fails.length) { console.error('\n❌ SELF_TEST 失敗'); fails.forEach((f) => console.error('   - ' + f)); process.exit(1); }
  console.log('\n✅ SELF_TEST 成功');
}

/* ============================================================================
 * 5. 実行
 * ========================================================================== */
const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

async function run() {
  const recs = JSON.parse(fs.readFileSync(IN, 'utf8')).sort((a, b) => a.seq - b.seq);
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const dbByName = new Map(db.map((r) => [r.name, r]));

  const { sweepNormalizeName } = require('./district-sweep.js');
  const normName = (s) => (s ? sweepNormalizeName(s) || '' : '');
  console.error('自治体公式の施設ページを集める …');
  const muniPages = await collectMunicipalPages();
  console.error('  合計 ' + muniPages.length + 'ページ\n');

  const results = [];
  for (const rec of recs) {
    const d = rec.detail || {};
    const napNums = money(d.chargeInfo);
    const model = chargeModel(d.chargeInfo);
    const extras = extraFees(d.chargeInfo);
    const o = officialUrlFor(rec, dbByName, muniPages, normName);

    const r = {
      seq: rec.seq, name: rec.name, city: rec.city, srcs: rec.srcs,
      napClosedMarker: rec.napClosedMarker,
      napId: rec.napId, napStatus: rec.status,
      napChargeInfo: d.chargeInfo || null,
      napPriceRange: d.priceRange || null,
      napNums, chargeModel: model.model, chargeModelWhy: model.why, extraFees: extras,
      officialUrl: o.url, officialUrlFrom: o.from, urlSearchTrail: o.tried,
      officialStatus: null, officialNote: null,
      officialNums: [], officialExcerpts: [],
      verdict: null, overlap: [],
    };

    // ★ `chargeInfo` は空でも 66 文字前後の HTML の殻が入っている。**長さで判定しない**
    r.napHasCharge = !!(d.chargeInfo && stripTags(String(d.chargeInfo)).trim());
    if (!r.napHasCharge) r.napChargeNote = 'なっぷ側に料金の原文が無い（HTML の殻だけ）';

    if (!o.url) {
      r.verdict = 'PRICE_NO_PRIMARY';
      r.officialNote = '一次情報の URL が見つからない。探した経路: ' + o.tried.join(' / ') + '。**推測で URL を作らない**';
      results.push(r);
      console.error('[' + r.seq + '/' + recs.length + '] ' + r.name + ' … PRICE_NO_PRIMARY');
      continue;
    }

    let res;
    try { res = await fetchPage(o.url, { useCache: false }); }
    catch (e) { res = { ok: false, status: 0, note: 'THROWN:' + e.message.slice(0, 40) }; }
    r.officialStatus = res.status;
    if (!res.ok) {
      r.verdict = 'PRICE_UNREACHABLE';
      r.officialNote = res.note || ('HTTP_' + res.status);
      results.push(r);
      console.error('[' + r.seq + '/' + recs.length + '] ' + r.name + ' … PRICE_UNREACHABLE (' + r.officialNote + ')');
      continue;
    }
    /* ★ 本文も残す。**STEP C の採点材料になる**（2026-08-19 決定1・決定2）。
     * 景観の記述は公式の紹介文にしか無いので、料金の抜粋だけでは足りない。
     * タグを剥がしたテキストを保存する（**要約しない。原文のまま**）。 */
    const pageText = (html) => stripTags(String(html || '')).replace(/\s+/g, ' ').trim().slice(0, 8000);
    /* ★ 掴んだページが本当にその施設か、本文で照合する。**通らなければ採らない。** */
    const v = validateOfficialPage(pageText(res.body), rec, normName);
    r.pageValidation = v;
    if (!v.ok) {
      r.verdict = 'PRICE_NO_PRIMARY';
      r.officialNote = '掴んだページを**本文照合で棄却**（' + o.url + ' … ' + v.why + '）。'
        + '**同名・類似名の別施設を掴まないための関門。**探した経路: ' + o.tried.join(' / ');
      r.officialUrl = null;
      results.push(r);
      console.error('[' + r.seq + '/' + recs.length + '] ' + r.name + ' … 本文照合で棄却 (' + v.why + ')');
      continue;
    }
    r.officialPagesFetched = [{ url: o.url, status: res.status }];
    r.officialText = [{ url: o.url, text: pageText(res.body) }];
    let nums = money(res.body);
    let excerpts = priceExcerpts(res.body, 10);

    // ★ トップに金額が無ければ、料金らしいページを1階層だけ辿る（**辿った先は全部記録**）
    if (!nums.length) {
      const links = priceLinks(res.body, o.url, 3);
      r.priceLinksFound = links;
      for (const lu of links) {
        let lr;
        try { lr = await fetchPage(lu, { useCache: false }); }
        catch (e) { lr = { ok: false, status: 0, note: 'THROWN:' + e.message.slice(0, 40) }; }
        r.officialPagesFetched.push({ url: lu, status: lr.status, note: lr.note || null });
        if (!lr.ok) continue;
        r.officialText.push({ url: lu, text: pageText(lr.body) });
        const n2 = money(lr.body);
        if (n2.length) {
          nums = nums.concat(n2.filter((x) => nums.indexOf(x) < 0));
          excerpts = excerpts.concat(priceExcerpts(lr.body, 8));
          r.priceFoundOn = lu;
          break;
        }
      }
    }
    r.officialNums = nums.sort((a, b) => a - b);
    r.officialExcerpts = excerpts.slice(0, 12);
    r.overlap = napNums.filter((n) => r.officialNums.indexOf(n) >= 0);

    /* ★ 分岐は「なっぷに**金額があるか**」で見る。「原文があるか」ではない。
     * なっぷは「※総額表示対応により料金は非表示となっております」という文を
     * chargeInfo に入れている施設がある（君津亀山・きさらづCAMP で実測）。
     * **原文はあるが金額は1つも無い。**これを MISMATCH に落とすと、
     * 「食い違っている」ではなく「比較相手がいない」ものが不一致として数えられる。 */
    if (!r.officialNums.length) {
      r.verdict = 'PRICE_NOT_ON_OFFICIAL';
      r.officialNote = '見たページ: ' + r.officialPagesFetched.map((x) => x.url + '(' + x.status + ')').join(' , ');
    }
    else if (!napNums.length) r.verdict = 'PRICE_PRIMARY_ONLY';   // 一次情報にはある。比較相手がいないだけ
    else if (r.overlap.length) r.verdict = 'PRICE_MATCH';
    else r.verdict = 'PRICE_MISMATCH';

    // priceVerified を立てられるのは「一次情報で金額が確認できた」2分類だけ
    r.priceVerifiable = (r.verdict === 'PRICE_MATCH' || r.verdict === 'PRICE_PRIMARY_ONLY');
    // ソロ総額が原文だけで決まるか
    r.soloDecidable = (r.priceVerifiable && r.chargeModel !== 'UNKNOWN' && r.extraFees.length === 0)
      ? 'MAYBE' : 'SOLO_UNDECIDABLE';

    results.push(r);
    console.error('[' + r.seq + '/' + recs.length + '] ' + r.name + ' … ' + r.verdict
      + ' (なっぷ' + napNums.length + '件 / 公式' + r.officialNums.length + '件 / 重なり' + r.overlap.length + ')');
  }

  /* ── md ─────────────────────────────────────────────────── */
  const L = [];
  const say = (s) => L.push(s === undefined ? '' : s);
  const count = (v) => results.filter((x) => x.verdict === v).length;

  say('# 千葉46件 — 料金の公式裏取り（STEP B・2026-08-19）');
  say();
  say('**読み取り専用。`data/campgrounds.json` には書いていない。**`priceVerified` も立てていない');
  say('（立てられるのはどれかを出しただけ）。');
  say();
  say('## 1. 結果の分布');
  say();
  say('| 分類 | 件数 | 意味 | priceVerified |');
  say('|---|---:|---|---|');
  say('| `PRICE_MATCH` | ' + count('PRICE_MATCH') + ' | 一次情報に金額があり、なっぷの金額と重なる | **可** |');
  say('| `PRICE_PRIMARY_ONLY` | ' + count('PRICE_PRIMARY_ONLY') + ' | 一次情報に金額があり、なっぷ側に料金の原文が無い | **可** |');
  say('| `PRICE_MISMATCH` | ' + count('PRICE_MISMATCH') + ' | 双方に金額はあるが1つも重ならない | 不可（人が見る） |');
  say('| `PRICE_NOT_ON_OFFICIAL` | ' + count('PRICE_NOT_ON_OFFICIAL') + ' | 一次情報は取れたが金額表記が無い | 不可 |');
  say('| `PRICE_NO_PRIMARY` | ' + count('PRICE_NO_PRIMARY') + ' | **一次情報の URL が見つからない**（測れていない） | 不可 |');
  say('| `PRICE_UNREACHABLE` | ' + count('PRICE_UNREACHABLE') + ' | URL はあるが取れなかった（**測れていない**） | 不可 |');
  say('| 合計 | ' + results.length + ' | | **' + results.filter((x) => x.priceVerifiable).length + ' 件が priceVerified 可** |');
  say();
  say('**★ 下2つを「記載なし」に混ぜない。**「調べたが無かった」と「調べられていない」は違う（§19-4 / §21-4）。');
  say();

  say('## 2. 全件（' + results.length + '件）');
  say();
  say('| # | 施設 | 市町村 | 判定 | 公式URLの出所 | なっぷ金額 | 公式金額 | 重なり | 課金方式 |');
  say('|---:|---|---|---|---|---|---|---|---|');
  results.forEach((r) => {
    say('| ' + r.seq + ' | ' + esc(r.name) + ' | ' + (r.city || '—') + ' | `' + r.verdict + '` | '
      + (r.officialUrlFrom || '—') + ' | ' + (r.napNums.length ? r.napNums.slice(0, 5).join(' / ') + (r.napNums.length > 5 ? ' …' : '') : '—')
      + ' | ' + (r.officialNums.length ? r.officialNums.slice(0, 5).join(' / ') + (r.officialNums.length > 5 ? ' …' : '') : '—')
      + ' | ' + (r.overlap.length ? r.overlap.join(' / ') : '—') + ' | ' + r.chargeModel + ' |');
  });
  say();

  say('## 3. `priceVerified` を立てられるものの詳細（原文を残す）');
  say();
  results.filter((r) => r.priceVerifiable).forEach((r) => {
    say('### ' + r.seq + '. ' + r.name + '（' + (r.city || '—') + '）');
    say();
    say('- 判定: `' + r.verdict + '`');
    say('- 一次情報: ' + r.officialUrl + '（' + r.officialUrlFrom + ' / HTTP ' + r.officialStatus + '）');
    say('- 課金方式: **' + r.chargeModel + '** — ' + r.chargeModelWhy);
    say('- 別建ての費目（原文に出ているもの）: ' + (r.extraFees.length ? r.extraFees.join(' / ') : 'なし'));
    say('- 重なった金額: ' + (r.overlap.length ? r.overlap.join(' / ') : '—（なっぷ側に料金の原文が無いので比較していない）'));
    say('- ソロ1名の総額: **' + (r.soloDecidable === 'MAYBE' ? '原文だけで決まる可能性あり（要確認）' : 'SOLO_UNDECIDABLE') + '**');
    say();
    say('公式ページの料金まわり（**原文のまま**）:');
    say();
    r.officialExcerpts.slice(0, 6).forEach((x) => say('> ' + x));
    say();
  });

  say('## 4. 測れていないもの（埋めない）');
  say();
  results.filter((r) => r.verdict === 'PRICE_NO_PRIMARY' || r.verdict === 'PRICE_UNREACHABLE').forEach((r) => {
    say('- **' + esc(r.name) + '** … `' + r.verdict + '`'
      + (r.officialUrl ? ' / ' + r.officialUrl : '') + (r.officialNote ? ' / ' + esc(r.officialNote) : ''));
  });
  say();
  say('探した経路も残す（**「無い」ではなく「この経路では見つからなかった」**）:');
  say();
  results.filter((r) => r.verdict === 'PRICE_NO_PRIMARY').forEach((r) => {
    say('- **' + esc(r.name) + '**');
    (r.urlSearchTrail || []).forEach((t) => say('  - ' + esc(t)));
  });
  say();
  say('**次に何をすれば測れるか**（§21-4）: `PRICE_NO_PRIMARY` は施設名＋所在地で公式ページを人が探す。');
  say('`PRICE_UNREACHABLE` は 403 なら UA / robots の確認、404 なら URL の腐り（なっぷの登録が古い）。');
  say();

  say('## 5. ★ ソロ1名の総額をこのスクリプトで決めなかった理由');
  say();
  say('指示の `priceMin` は「入場料・駐車料・渡船料・管理費込みの総額」。');
  say('**原文に書かれていない費目を 0 円と見なすと、内訳から総額を作ったことになる**（§20-1）。');
  say('ここでは 課金方式 と 別建ての費目の有無 までを原文から出し、');
  say('**決まらないものは `SOLO_UNDECIDABLE` として残した。**');
  say();
  const soloMaybe = results.filter((r) => r.soloDecidable === 'MAYBE');
  say('原文だけで決まる可能性があるのは **' + soloMaybe.length + '件**（それでも人が原文を見て確定させる）:');
  say();
  soloMaybe.forEach((r) => say('- ' + esc(r.name) + ' … ' + r.chargeModel + ' / 重なり ' + r.overlap.join(' / ')));
  say();

  fs.writeFileSync(OUT_MD, L.join('\n') + '\n', 'utf8');
  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2), 'utf8');
  console.log('書き出し: ' + OUT_MD);
  console.log('PRICE_MATCH ' + count('PRICE_MATCH') + ' / MISMATCH ' + count('PRICE_MISMATCH')
    + ' / NOT_ON_OFFICIAL ' + count('PRICE_NOT_ON_OFFICIAL')
    + ' / NO_PRIMARY ' + count('PRICE_NO_PRIMARY') + ' / UNREACHABLE ' + count('PRICE_UNREACHABLE'));
}

if (process.argv.indexOf('--selftest') >= 0) selfTest();
else if (process.argv.indexOf('--run') >= 0) run().catch((e) => { console.error(e); process.exit(1); });
else console.log('使い方: --selftest | --run');

module.exports = { money, chargeModel, extraFees, priceExcerpts };
