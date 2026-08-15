/**
 * Manus 第2弾9件 + 第1弾7件 = 計16件を、L1・既存レコード・候補どうしで照合する。
 * **ネットを踏まない。**保存済みの L1 HTML を使う（--html=）。
 * 投入はしない。
 */
const fs = require('fs');
const path = require('path');
const { _internal, sweepNormalizeName } = require('./district-sweep.js');
const { SRC_CHIBA_PREF_SPORTS, SRC_MINAMIBOSO_KANKO, MUNI_SOURCES_CHIBA } = require('./chiba-sources.js');
const { splitAddress, banchiKey, districtKey } = _internal;

const HTML_DIR = (process.argv.find(a => a.startsWith('--html=')) || '').slice(7);

const WAVE1 = [
  { n: '野宮農園オレンジ村オートキャンプ場', a: '千葉県南房総市千倉町久保1494', t: '0470-44-0780' },
  { n: '大多喜SABO', a: '千葉県夷隅郡大多喜町堀之内595', t: '050-1301-3014' },
  { n: '千葉県立内浦山県民の森', a: '千葉県鴨川市内浦3228', t: '04-7095-2821' },
  { n: 'オートキャンプ場 マリンサイド', a: '千葉県館山市大賀85-1', t: '0470-23-1212' },
  { n: 'キャンプマナビス', a: '千葉県館山市布良886', t: '0470-28-1655' },
  { n: 'イレブンオートキャンプパーク', a: '千葉県君津市栗坪300', t: '0439-27-2711' },
  { n: 'キャンピングヒルズ鴨川', a: '千葉県鴨川市宮2015-62', t: '0470-92-9979' },
];

const WAVE2 = [
  { n: '千葉県立清和県民の森キャンプ場', a: '千葉県君津市豊英660', t: '0439-38-2222' },
  { n: '千石台オートキャンプ場', a: '千葉県君津市黄和田畑2245-16', t: '0439-39-2743' },
  { n: 'CAMP さくらの丘', a: '千葉県君津市向郷1670', t: '0439-27-2211' },
  { n: '奥米・木村農園キャンプ場', a: '千葉県君津市奥米143', t: '090-6124-0254' },
  { n: '富津公園キャンプ場', a: '千葉県富津市富津2280', t: '0439-87-9339' },
  { n: '富津市民の森キャンプ場', a: '千葉県富津市', t: '0439-68-1800' },
  { n: 'きさらづCAMP ORGANIC FIELD in みたて', a: '千葉県木更津市中島4416', t: '0438-38-5575' },
  { n: '佐久間ダム湖親水公園キャンプ場', a: '千葉県安房郡鋸南町大崩39', t: '0470-55-4805' },
  { n: '千葉県立大多喜県民の森キャンプ場', a: '千葉県夷隅郡大多喜町大多喜486-21', t: '0470-82-3110' },
];

const EXCLUDED = [
  { n: '長南町営キャンプ場', a: '千葉県長生郡長南町', why: 'デイキャンプのみ・宿泊不可（町公式）' },
  { n: '鋸南ほしふるキャンプ場', a: '千葉県安房郡鋸南町', why: 'なっぷに「R/月閉鎖」表示' },
];

function loadL1() {
  const out = [];
  for (const [src, f] of [[SRC_CHIBA_PREF_SPORTS, 'page-pref-chiba-camp.html'],
                          [SRC_MINAMIBOSO_KANKO, 'page-cm-boso-camp.html']]) {
    const p = path.join(HTML_DIR, f);
    if (!fs.existsSync(p)) { console.log(`⚠ ${f} が無い。このソースは飛ばす`); continue; }
    for (const it of src.list(fs.readFileSync(p, 'utf8'))) out.push({ ...it, srcId: src.id });
  }
  return out;
}

function nameRel(a, b) {
  const x = sweepNormalizeName(a) || '', y = sweepNormalizeName(b) || '';
  if (!x || !y) return null;
  if (x === y) return '完全一致';
  if (x.includes(y) || y.includes(x)) return '包含';
  return null;
}

const l1 = loadL1();
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
const recs = Array.isArray(raw) ? raw : (raw.campgrounds || Object.values(raw)[0]);
const ALL = [...WAVE1.map(c => ({ ...c, wave: 1 })), ...WAVE2.map(c => ({ ...c, wave: 2 }))];

/* ---- 1. 第2弾の L1 照合と、県台帳との食い違い ---- */
console.log('='.repeat(96));
console.log('## 第2弾9件 — L1 照合と番地の食い違い\n');
for (const c of WAVE2) {
  const bk = banchiKey(c.a);
  console.log(`■ ${c.n}`);
  console.log(`  Manus 住所 ${c.a}  → 地区 ${districtKey(c.a) || '✗'} / 番地キー ${bk || '—'}`);
  // 番地一致 or 名前一致 で L1 を引く
  const hits = l1.filter(i =>
    (i.address && bk && banchiKey(i.address) === bk) || nameRel(i.name, c.n));
  // 同じ大字（番地違い）も拾う ← 食い違い検出
  const near = l1.filter(i => !hits.includes(i) && i.address &&
    districtKey(i.address) && districtKey(i.address) === districtKey(c.a));
  if (hits.length) {
    hits.forEach(h => console.log(`  L1 ● ${h.name} / ${h.address} [${h.srcId}] ` +
      `(${nameRel(h.name, c.n) ? '名前' + nameRel(h.name, c.n) : ''}${bk && banchiKey(h.address) === bk ? ' 番地一致' : ''})`));
  }
  if (near.length) {
    near.forEach(h => console.log(`  L1 ▲ **同じ大字だが番地が違う**: ${h.name} / ${h.address} [${h.srcId}]`));
  }
  if (!hits.length && !near.length) console.log('  L1: 載っていない');
  console.log('');
}

/* ---- 2. 重複（既存188件 / 候補どうし） ---- */
console.log('='.repeat(96));
console.log('## 重複チェック\n');
let dupRec = 0;
for (const c of ALL) {
  const bk = banchiKey(c.a);
  const hit = recs.filter(r =>
    nameRel(r.name, c.n) ||
    (r.address && bk && banchiKey(r.address) === bk) ||
    (c.t && (r.tel || r.phone || '').replace(/\D/g, '') === c.t.replace(/\D/g, '')));
  if (hit.length) { dupRec++; console.log(`  既存と重複: ${c.n} ↔ ${hit.map(r => r.id).join(',')}`); }
}
console.log(`  既存188件との重複: ${dupRec}件`);

const seen = new Map();
let dupCand = 0;
for (const c of ALL) {
  const bk = banchiKey(c.a);
  for (const [k, o] of seen) {
    if (nameRel(o.n, c.n) || (bk && k === bk)) {
      dupCand++;
      console.log(`  候補どうし: 第${o.wave}弾「${o.n}」 ↔ 第${c.wave}弾「${c.n}」`);
    }
  }
  if (bk) seen.set(bk, c); else seen.set('x' + c.n, c);
}
console.log(`  候補16件どうしの重複: ${dupCand}件`);

/* ---- 3. 市町村別集計 vs 対象8市町 ---- */
console.log('\n' + '='.repeat(96));
console.log('## 市町村別集計 — 候補16件 vs chiba-sources.js の対象8市町\n');
const targets = new Set(Object.keys(MUNI_SOURCES_CHIBA));
const tally = new Map();
for (const c of ALL) {
  const p = splitAddress(c.a);
  const k = p && p.city ? (p.gun && !/市$/.test(p.city) ? p.gun + p.city : p.city) : '(住所不明)';
  if (!tally.has(k)) tally.set(k, { w1: 0, w2: 0, names: [] });
  const e = tally.get(k);
  e['w' + c.wave]++; e.names.push(c.n);
}
console.log('市町村'.padEnd(14) + '第1弾 第2弾 計  対象?  L1');
for (const [k, v] of [...tally].sort((a, b) => (b[1].w1 + b[1].w2) - (a[1].w1 + a[1].w2))) {
  const bare = k.replace(/^.+郡/, '');
  const isT = targets.has(bare);
  const ent = MUNI_SOURCES_CHIBA[bare];
  const l1n = ent ? ent.sources.filter(s => s.layer === 'L1').map(s => s.id).join('+') : '—';
  const nf = ent && ent.l1NotFound ? ' (l1NotFound記録あり)' : '';
  console.log(k.padEnd(14) + String(v.w1).padStart(3) + String(v.w2).padStart(6) +
    String(v.w1 + v.w2).padStart(5) + (isT ? '   ●' : '   ✗未登録') + '  ' + l1n + nf);
}
console.log('\n対象8市町のうち候補が1件も無い市町村:');
for (const t of targets) if (![...tally.keys()].some(k => k.replace(/^.+郡/, '') === t)) console.log('  - ' + t);

/* ---- 4. 「内」バグの該当スキャン ---- */
console.log('\n' + '='.repeat(96));
console.log('## 地区キーの末尾除去（/(?:地内|地先|先|内)$/）に当たる千葉の地名\n');
const RE = /(?:地内|地先|先|内)$/;
const pool = [
  ...ALL.map(c => ({ src: '候補', n: c.n, a: c.a })),
  ...EXCLUDED.map(c => ({ src: '除外候補', n: c.n, a: c.a })),
  ...l1.filter(i => i.address).map(i => ({ src: 'L1:' + i.srcId, n: i.name, a: i.address })),
];
let n = 0;
for (const x of pool) {
  const a = String(x.a).normalize('NFKC').replace(/\s+/g, '');
  const m = a.match(/^(?:.{2,3}?県)?(?:.{1,6}?郡)?(?:.{1,8}?[市町村])(?:.{1,6}?区)?([^\d]{1,14})/);
  const before = m ? m[1].replace(/[（(].*$/, '').replace(/字.*$/, '') : null;
  const after = splitAddress(x.a);
  if (before && RE.test(before) && after && before !== after.oaza) {
    n++;
    console.log(`  [${x.src}] ${x.n}`);
    console.log(`      ${x.a}  →  大字 "${before}" が "${after.oaza}" に削られる（地区キー ${districtKey(x.a)}）`);
  }
}
console.log(`  該当: ${n}件`);
