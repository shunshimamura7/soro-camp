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

/* ── 3. L1 の網羅率（母数は候補側）──────────────────────────────── */
console.log('【3】L1 の網羅率 — ★ 母数はレコードではなく候補（理由はファイル冒頭）\n');
console.log('  千葉のレコードは0件なので `l1Coverage()` の母数は空。**0% ではなく測れない。**');
console.log('  代わりに verify A/B（一次情報で実在を確認済み）を母数にする。\n');
const truth = in8.filter(c => c.verify === 'A' || c.verify === 'B');
const L1S = {};
for (const s of sweeps) for (const src of s.sources.filter(x => x.layer === 'L1')) {
  (L1S[src.label] = L1S[src.label] || { munis: [], got: 0 }).munis.push(s.muni);
  L1S[src.label].got += Number(String(src.got).replace(/[^\d]/g, '')) || 0;
}
console.log('| L1 | 取得(延べ) | 実在確実(A/B) | うち載っている | 網羅率 |');
console.log('|---|---:|---:|---:|---:|');
for (const [label, info] of Object.entries(L1S)) {
  const scope = truth.filter(c => info.munis.includes(muniOf(c.address)));
  const hit = scope.filter(c => {
    const mi = hitOf(c);
    return mi && mi.srcs.some(l => l.replace(/\\/g, '') === label);
  });
  const rate = scope.length ? Math.round(hit.length / scope.length * 100) + '%' : '–（母数0）';
  console.log(`| ${label.slice(0, 44)} | ${info.got} | ${scope.length} | ${hit.length} | **${rate}** |`);
  const missed = scope.filter(c => !hit.includes(c));
  if (missed.length) console.log(`|   └ 載っていない | | | | ${missed.map(c => c.name).join(' / ')} |`);
}

console.log('\n★ 読み方の注意');
console.log('  - 母数が候補なので、**候補の集め方の偏りがそのまま網羅率に乗る。**');
console.log('    既存3県（母数=レコード）の網羅率と直接は比べられない');
console.log('  - 県台帳は**公営しか載らない**台帳。民間が載っていないのは仕様であって漏れではない');
console.log('  - 千葉には PREF_SOURCES（キャンナビ・ウォーカープラス）が無い。');
console.log('    **既存3県より層が1段薄い状態での MISSING 64件**であることを忘れない');
