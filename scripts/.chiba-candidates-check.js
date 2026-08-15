/**
 * Manus の千葉候補7件を、chiba-sources.js の L1 抽出結果と既存レコードに照合する。
 * **ネットを踏まない。**保存済みの L1 HTML を使う（--html でディレクトリを渡す）。
 * 投入はしない。並べるだけ。
 */
const fs = require('fs');
const path = require('path');
const { _internal, sweepNormalizeName } = require('./district-sweep.js');
const { SRC_CHIBA_PREF_SPORTS, SRC_MINAMIBOSO_KANKO } = require('./chiba-sources.js');
const { splitAddress, banchiKey, districtKey } = _internal;

const HTML_DIR = (process.argv.find(a => a.startsWith('--html=')) || '').slice(7);

const CANDIDATES = [
  { n: '野宮農園オレンジ村オートキャンプ場', a: '千葉県南房総市千倉町久保1494', t: '0470-44-0780', grade: '確実' },
  { n: '大多喜SABOキャンプ場', a: '千葉県夷隅郡大多喜町堀之内595', t: '050-1301-3014', grade: '確実' },
  { n: '千葉県立内浦山県民の森', a: '千葉県鴨川市内浦3228', t: '04-7095-2821', grade: '確実' },
  { n: '人魚の湯 オートキャンプ場 マリンサイド', a: '千葉県館山市大賀85-1', t: '0470-23-1212', grade: '不明' },
  { n: 'キャンプマナビス', a: '千葉県館山市布良886', t: null, grade: '不明' },
  { n: 'イレブンオートキャンプパーク', a: '千葉県君津市栗坪300', t: '0439-27-2711', grade: '不明' },
  { n: 'キャンピングヒルズ鴨川', a: '千葉県鴨川市宮2015-62', t: '0470-92-9979', grade: '不明' },
];

function loadL1() {
  const out = [];
  const files = [
    [SRC_CHIBA_PREF_SPORTS, 'page-pref-chiba-camp.html'],
    [SRC_MINAMIBOSO_KANKO, 'page-cm-boso-camp.html'],
  ];
  for (const [src, f] of files) {
    const p = path.join(HTML_DIR, f);
    if (!fs.existsSync(p)) {
      console.log(`⚠ ${f} が無い。L1 照合はこのソースを飛ばす（"載っていない" と読まないこと）`);
      continue;
    }
    for (const it of src.list(fs.readFileSync(p, 'utf8'))) {
      out.push({ ...it, srcLabel: src.label, srcId: src.id });
    }
  }
  return out;
}

/** 名前が寄るか。sweepNormalizeName どうしの一致と、片方がもう片方を含むか。 */
function nameRel(a, b) {
  const x = sweepNormalizeName(a) || '';
  const y = sweepNormalizeName(b) || '';
  if (!x || !y) return null;
  if (x === y) return '完全一致';
  if (x.includes(y) || y.includes(x)) return '包含';
  return null;
}

const l1 = loadL1();
const records = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
const recs = Array.isArray(records) ? records : (records.campgrounds || Object.values(records)[0]);

console.log(`L1 抽出 ${l1.length}件 / 既存レコード ${recs.length}件\n`);
console.log('='.repeat(100));

for (const c of CANDIDATES) {
  const p = splitAddress(c.a);
  const bk = banchiKey(c.a);
  console.log(`\n■ ${c.n}  [${c.grade}]`);
  console.log(`  住所 ${c.a}`);
  console.log(`  地区キー ${districtKey(c.a) || '✗パース不可'} / 番地キー ${bk || '—'} / 市町村 ${p ? p.city : '—'}`);

  // --- L1 照合 ---
  const byBanchi = l1.filter(i => i.address && bk && banchiKey(i.address) === bk);
  const byName = l1.filter(i => nameRel(i.name, c.n));
  const hits = [...new Set([...byBanchi, ...byName])];
  if (!hits.length) {
    console.log('  L1: **載っていない**');
  } else {
    for (const h of hits) {
      const how = [];
      if (byBanchi.includes(h)) how.push('番地一致');
      if (byName.includes(h)) how.push('名前' + nameRel(h.name, c.n));
      console.log(`  L1: ● ${h.name}`);
      console.log(`        住所 ${h.address}`);
      console.log(`        ソース ${h.srcId} / 一致 ${how.join('+')}${h.category ? ` / 業態 ${h.category}` : ''}`);
      if (!byName.includes(h)) {
        console.log('        ⚠ **番地では当たるが名前が寄らない**（別バケットに割れる型）');
      }
    }
  }

  // --- 既存レコード照合 ---
  const dupN = recs.filter(r => nameRel(r.name, c.n));
  const dupA = recs.filter(r => r.address && bk && banchiKey(r.address) === bk);
  const dupT = c.t ? recs.filter(r => (r.tel || r.phone || '').replace(/[^\d]/g, '') === c.t.replace(/[^\d]/g, '')) : [];
  const dup = [...new Set([...dupN, ...dupA, ...dupT])];
  console.log(`  既存188件との重複: ${dup.length ? dup.map(r => r.id + ' ' + r.name).join(' / ') : 'なし'}`);
}

console.log('\n' + '='.repeat(100));
console.log('\n## L1 側から見た逆引き（L1 にあって候補に無いもの＝Manus が拾えていない公営）\n');
const candBanchi = new Set(CANDIDATES.map(c => banchiKey(c.a)).filter(Boolean));
for (const i of l1) {
  if (!i.address) continue;
  const hit = candBanchi.has(banchiKey(i.address)) ||
    CANDIDATES.some(c => nameRel(i.name, c.n));
  if (!hit) console.log(`  - ${i.name}  (${i.address})  [${i.srcId}]`);
}
