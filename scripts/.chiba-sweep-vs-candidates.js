/**
 * 千葉のスイープ結果と候補一覧を突き合わせる。**ネットを踏まない。**
 *
 * 見たいのは3つ:
 *
 *   1. **候補が MISSING に出てきたか**（出なければソースが薄いか、名寄せが効いていない）
 *   2. **候補に無い施設が MISSING に出てきたか** ← **これが本当の掲載漏れ候補**
 *   3. **L1 の網羅率**
 *
 * ## ★ 3 は既存のやり方では測れない
 *
 * `l1Coverage()` は「実在がほぼ確実な群」＝`priceVerified:true` かつ `needsVerify` なしの
 * **レコード**を母数にする。**千葉のレコードは0件**なので母数が空で、
 * 網羅率は `null` にしかならない。**0% ではない。測れない。**
 *
 * 代わりに**候補側を母数にする。**verify A/B は一次情報で実在を確認済みなので、
 * 「実在がほぼ確実な群」として同じ役目を果たせる。
 * **ただしレコードと違って母数が候補の集め方に依存する**（Manus と君津市L1由来）ので、
 * **既存3県の網羅率と直接は比べられない。**
 *
 * 実行: `node scripts/.chiba-sweep-vs-candidates.js`
 */
const fs = require('fs');
const path = require('path');
const { _internal: I, sweepNormalizeName: N } = require('./district-sweep.js');
const { chibaMuniSources } = require('./chiba-sources.js');
const { namesMatch } = require('./name-match.js');

const MUNIS = Object.keys(chibaMuniSources());

/* ── 候補（roster のソースをそのまま読む。二重管理をしない）───────────── */
const rosterSrc = fs.readFileSync(path.join(__dirname, '.chiba-candidates-roster.js'), 'utf8');
const CAND = [...rosterSrc.matchAll(/^ {2}\['(.+?)', '(.+?)', '([ABCX])', '(.+?)', '(.+?)'\],$/gm)]
  .map(m => ({ name: m[1], address: m[2], verify: m[3], src: m[4], note: m[5] }));

/* ── スイープ結果 ─────────────────────────────────────────────── */
function readSweep(m) {
  const p = path.join(__dirname, `sweep-${m}.md`);
  if (!fs.existsSync(p)) return null;
  const body = fs.readFileSync(p, 'utf8');
  const sec = h => body.split('\n## ').find(x => x.startsWith(h)) || '';
  const ms = sec('MISSING');
  const items = [];
  for (const blk of ms.split(/^### \d+\.\s*/m).slice(1)) {
    const name = blk.split('\n')[0].trim();
    const addr = (blk.match(/^- \*\*住所\*\*:\s*(.+)$/m) || [])[1] || null;
    const conf = (blk.match(/\*\*confidence\*\*:\s*(HIGH|MID|LOW)/) || [])[1] || '?';
    const srcs = [...blk.matchAll(/^\s+- `(L[123])` (.+?) —/gm)].map(x => x[2]);
    items.push({ name, addr, conf, srcs, muni: m });
  }
  // ソース表（取得件数）
  const st = sec('ソースの取得結果');
  const sources = [...st.matchAll(/^\|\s*(L[123])\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/gm)]
    .filter(x => !/L1_NOT_FOUND/.test(x[3]))
    .map(x => ({ layer: x[1], label: x[2].replace(/\\/g, ''), status: x[3], got: x[4] }));
  return { muni: m, items, sources };
}

const sweeps = MUNIS.map(readSweep).filter(Boolean);
const allMissing = sweeps.flatMap(s => s.items);

const muniOf = a => { const p = a && I.splitAddress(a); return p ? p.city : null; };
const same = (a, b) => {
  const x = N(a), y = N(b);
  if (!x || !y) return false;
  return x === y || namesMatch(x, y) || x.includes(y) || y.includes(x);
};
const bk = a => { try { return a ? I.banchiKey(a) : null; } catch { return null; } };

const pad = (s, n) => String(s).padEnd(n);
console.log('='.repeat(78));
console.log(`千葉 スイープ結果 vs 候補（MISSING 延べ ${allMissing.length}件 / 候補 ${CAND.length}件）`);
console.log('='.repeat(78));

/* ── 1. 候補が MISSING に出てきたか ─────────────────────────────── */
console.log('\n【1】候補が MISSING に出てきたか（対象8市町のぶんだけ）\n');
const in8 = CAND.filter(c => MUNIS.includes(muniOf(c.address)));
const out8 = CAND.filter(c => !MUNIS.includes(muniOf(c.address)));
const hitOf = c => allMissing.find(mi =>
  mi.muni === muniOf(c.address) && (same(mi.name, c.name) || (bk(c.address) && bk(mi.addr) && bk(c.address) === bk(mi.addr))));

const byVerify = {};
for (const c of in8) {
  const h = hitOf(c);
  const k = c.verify;
  (byVerify[k] = byVerify[k] || { hit: [], miss: [] })[h ? 'hit' : 'miss'].push({ c, h });
}
console.log('verify  候補  MISSINGに出た  出なかった');
for (const k of ['A', 'B', 'C', 'X']) {
  const v = byVerify[k]; if (!v) continue;
  console.log(`  ${k}   ${pad(v.hit.length + v.miss.length, 6)}${pad(v.hit.length, 14)}${v.miss.length}`);
}
console.log(`\n対象8市町の候補 ${in8.length}件 / 対象外 ${out8.length}件（このスイープには構造上出ない）`);

const misses = Object.values(byVerify).flatMap(v => v.miss);
if (misses.length) {
  console.log('\n★ MISSING に出てこなかった候補 — **「無い」ではなく「ソースが載せていない」**');
  for (const { c } of misses) console.log(`  [${c.verify}] ${pad(c.name, 34)} ${c.address}`);
}

/* ── 2. 候補に無い MISSING ＝ 本当の掲載漏れ候補 ────────────────── */
console.log('\n【2】★ 候補に無いのに MISSING に出た施設 ＝ **Manus も君津市L1も拾えていない掲載漏れ候補**\n');
const novel = allMissing.filter(mi => !CAND.some(c => muniOf(c.address) === mi.muni && (same(mi.name, c.name) || (bk(c.address) && bk(mi.addr) && bk(c.address) === bk(mi.addr)))));
console.log(`${novel.length}件（MISSING 延べ ${allMissing.length} のうち）\n`);
for (const m of ['HIGH', 'MID', 'LOW']) {
  const g = novel.filter(x => x.conf === m);
  if (!g.length) continue;
  console.log(`── confidence ${m}（${g.length}件）`);
  for (const x of g) console.log(`  ${pad(x.muni, 7)} ${pad(x.name, 34)} ${x.addr || '（住所なし）'}  [${x.srcs.join(' / ')}]`);
  console.log('');
}

/* ── 3. 網羅率（母数は候補側）────────────────────────────────────
 *
 * ★ md からではなく **ソースの項目を直接** 見る（2026-08-17 に直した）。
 *
 * md 経由で測ったら2か所で壊れた:
 *
 *   1. MISSING の出典欄は**市町村ごとにラベルが違う**（「ちば観光ナビ…木更津市…」）。
 *      ソースをまとめるためにラベルを正規化したら、突き合わせる相手と合わなくなり
 *      **全ソースが 0% になった**
 *   2. **候補がレコードになると MISSING から消える。**大多喜県民の森は県台帳に
 *      載っているのに、投入した瞬間 IN_DATA へ移り「載っていない」に数えられた
 *
 * どちらも「測りたいもの（ソースに載っているか）」を
 * 「判定の出力（MISSING に出ているか）」で代用したのが原因。
 * **`l1Coverage()` と同じく、収集した items を直接見る。**
 */
(async () => {
  const records = I.loadRecords();
  console.log('【3】網羅率 — ★ 母数はレコードではなく候補（理由はファイル冒頭）');
  console.log('');
  console.log('  千葉のレコードは4件しかないので `l1Coverage()` の母数が作れない。');
  console.log('  代わりに verify A/B（一次情報で実在を確認済み）を母数にする。');
  console.log('  **ソースの items を直接見る。**MISSING に出ているかでは代用しない');
  console.log('');

  const truth = in8.filter(c => c.verify === 'A' || c.verify === 'B');
  const per = new Map();
  for (const muni of MUNIS) {
    const { sources } = I.sourcesFor(muni, records);
    for (const src of sources) {
      const c = await I.collectSource(src, { useCache: true });
      const e = per.get(src.id) || { layer: src.layer, label: src.label.replace(/（.*/, ''), munis: new Set(), items: [], got: 0 };
      e.munis.add(muni);
      e.items.push(...c.items);
      e.got += c.items.length;
      per.set(src.id, e);
    }
  }

  console.log('| 層 | ソース | 取得(延べ) | 実在確実(A/B) | うち載っている | 網羅率 |');
  console.log('|---|---|---:|---:|---:|---:|');
  const rows = [];
  for (const [id, e] of per) {
    const scope = truth.filter(c => e.munis.has(muniOf(c.address)));
    const keys = new Set(e.items.map(i => i.address && bk(i.address)).filter(Boolean));
    const hit = scope.filter(c => {
      const n = N(c.name);
      if (e.items.some(i => { const x = N(i.name); return x && (x === n || namesMatch(x, n)); })) return true;
      const k = bk(c.address);
      return !!k && keys.has(k);
    });
    const rate = scope.length ? hit.length / scope.length : null;
    rows.push({ id, e, scope, hit, rate });
    const shown = rate === null ? '–（母数0）' : Math.round(rate * 100) + '%';
    console.log(`| ${e.layer} | \`${id}\` ${e.label.slice(0, 28)} | ${e.got} | ${scope.length} | ${hit.length} | **${shown}** |`);
  }

  console.log('');
  console.log('── 載っていない候補（ソース別）');
  for (const r of rows) {
    const missed = r.scope.filter(c => !r.hit.includes(c));
    if (missed.length) console.log(`  ${r.id}: ${missed.map(c => c.name).join(' / ')}`);
  }

  console.log('');
  console.log('── ★ L1 に上げてよいか（7割が線。相模原市80% / 道志村75% が前例）');
  const navi = rows.find(r => r.id === 'chiba-kanko-navi');
  if (navi) {
    const shown = navi.rate === null ? '測れない' : Math.round(navi.rate * 100) + '%';
    console.log(`  ちば観光ナビ: ${navi.hit.length}/${navi.scope.length} = ${shown}`);
    const ok = navi.rate !== null && navi.rate >= 0.7;
    console.log(`  → ${ok ? '**7割を超えている。L1 に上げる判断ができる**' : '**7割に届かない。L2 のまま**'}`);
  }

  console.log('');
  console.log('★ 読み方の注意');
  console.log('  - 母数が候補なので、**候補の集め方の偏りがそのまま網羅率に乗る。**');
  console.log('    既存3県（母数=レコード）の網羅率と直接は比べられない');
  console.log('  - 県台帳は**公営しか載らない**台帳。民間が載っていないのは仕様であって漏れではない');
  console.log('  - 千葉には PREF_SOURCES（キャンナビ・ウォーカープラス）が無い。');
  console.log('    **既存3県より層が1段薄い**ことを忘れない');
})();
