/**
 * 案C（突合は市町村単位・大字は判定に使わず検査として別に出す）の試算と、
 * 地区キーの正規化（異体字・包含関係）の効果、住所のパース失敗の種類別集計。
 *
 * **判定は持たない。実装も変えない。`data/` への書き込みも無い。数字を出すだけ。**
 * 実行: `node scripts/.audit-plan-c.js`（キャッシュのみ）
 */
const fs = require('fs');
const { MUNI_SOURCES, _internal: I } = require('./district-sweep.js');

const SKIP = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;
const districts = fs.readdirSync(__dirname)
  .map(f => (f.match(/^sweep-(.+)\.md$/) || [])[1]).filter(Boolean).filter(d => !SKIP.test(d)).sort();
const muniOf = n => Object.keys(MUNI_SOURCES).find(m => n.startsWith(m) || n.includes(m));
const pad = (s, n) => String(s).padEnd(n);

/** 異体字＋NFKC＋「ヶ/ケ/ヵ」を揃える。**district-sweep の VARIANT_CHARS をそのまま使う** */
const V = I.VARIANT_CHARS;
const normOaza = s => String(s || '').normalize('NFKC')
  .replace(/./gu, ch => V[ch] || ch)
  .replace(/[ヶヵケ]/g, 'ケ')
  .replace(/[ノヽ]/g, 'ノ');

/** 同じ市の中で、片方が他方の前方一致なら1つに畳む */
function collapse(keys) {
  const out = [];
  for (const k of [...keys].sort((a, b) => a.length - b.length)) {
    if (!out.some(o => k.startsWith(o) || o.startsWith(k))) out.push(k);
  }
  return out;
}

(async () => {
  const records = I.loadRecords();
  const collectedByMuni = new Map();
  for (const d of districts) {
    const m = muniOf(d);
    if (!m || collectedByMuni.has(m)) continue;
    const { sources } = I.sourcesFor(d, records);
    const c = [];
    for (const s of sources) c.push(await I.collectSource(s, { useCache: true }));
    collectedByMuni.set(m, c);
    process.stdout.write('.');
  }
  console.log('');

  const oazaOf = a => { const p = I.splitAddress(a); return p ? (p.oaza || '') : ''; };

  /* ================= 案C ================= */
  console.log('='.repeat(80));
  console.log('案C: 突合は市町村単位。大字は判定に使わず、別の検査として出す');
  console.log('='.repeat(80));

  let missing = 0, inData = 0, orphan = 0, b2 = 0;
  const oazaCheck = [];
  for (const muni of collectedByMuni.keys()) {
    const d = I.parseDistrict(muni);
    const merged = I.mergeItems(collectedByMuni.get(muni), d);
    const { results } = I.classify(merged, records, d);
    const dr = I.analyzeDropped(merged, results, d);
    b2 += dr.b2.length;
    for (const r of results) {
      if (r.kind === 'MISSING') missing++;
      if (r.kind === 'ORPHAN') orphan++;
      if (r.kind !== 'IN_DATA') continue;
      inData++;
      // ---- 大字の検査（**判定には使わない**）----
      if (!r.record || !r.record.address || !r.bucket) continue;
      const recO = oazaOf(r.record.address);
      const bOs = [...new Set(r.bucket.addresses.map(oazaOf).filter(Boolean))];
      if (!recO || !bOs.length || bOs.includes(recO)) continue;
      const variantSame = bOs.some(o => normOaza(o) === normOaza(recO));
      const contained = bOs.some(o => {
        const [x, y] = [normOaza(o), normOaza(recO)];
        return x.startsWith(y) || y.startsWith(x);
      });
      oazaCheck.push({ muni, bucket: r.bucket.name, rec: r.record, recO, bOs, variantSame, contained,
        matchedBy: r.matchedBy });
    }
  }
  console.log(`\n判定（市町村単位）: MISSING ${missing} / IN_DATA ${inData} / ORPHAN ${orphan} / b2 ${b2}`);
  console.log('  → **案B と同じ数字になるはず。**判定の規則を1つも変えていないので');

  const harmless = oazaCheck.filter(x => x.variantSame || x.contained);
  const real = oazaCheck.filter(x => !(x.variantSame || x.contained));
  console.log(`\n大字の検査（人が見るリスト。判定には使わない）: **${oazaCheck.length}件**`);
  console.log(`  うち異体字で同じ: ${oazaCheck.filter(x => x.variantSame).length}`);
  console.log(`  うち包含関係:     ${oazaCheck.filter(x => x.contained && !x.variantSame).length}`);
  console.log(`  **無害に寄せられる合計: ${harmless.length}（${(harmless.length / (oazaCheck.length || 1) * 100).toFixed(0)}%）**`);
  console.log(`  **残る（人が見る）: ${real.length}**`);
  console.log('');
  for (const x of real) {
    console.log(`  [${x.muni}] 「${x.bucket}」 ソース側大字=${x.bOs.join(',')} / レコード \`${x.rec.id}\` ${x.rec.name} 大字=${x.recO}（${x.rec.address}）`);
  }
  if (harmless.length) {
    console.log('\n  --- 無害に寄せたもの ---');
    for (const x of harmless) {
      console.log(`  [${x.muni}] 「${x.bucket}」 ${x.bOs.join(',')} vs ${x.recO}  （${x.variantSame ? '異体字' : '包含'}）`);
    }
  }

  /* ================= 正規化の効果 ================= */
  console.log('\n' + '='.repeat(80));
  console.log('地区キーの正規化（異体字・包含関係）— 案の比較とは別に、現状でも効く');
  console.log('='.repeat(80));

  // 地区外の項目から出てくる新しいキー（前回の測定と同じ手順）
  const parsed = districts.map(d => ({ key: d, p: I.parseDistrict(d) }));
  const newKeys = new Set();
  for (const [muni, collected] of collectedByMuni) {
    const md = I.parseDistrict(muni);
    for (const c of collected) for (const it of c.items) {
      if (!it.address || !I.inDistrict(it.address, md)) continue;
      if (parsed.some(x => I.inDistrict(it.address, x.p))) continue;
      const k = I.districtKey(it.address);
      if (k) newKeys.add(k);
    }
  }

  const report = (label, keys) => {
    // **大字が無いキー（市区町村どまり）を親にして畳むと、その市の大字が全部消える。**
    // それは「同じ場所」ではないので、畳む対象から外して数える
    const all = [...new Set(keys)];
    const cityOnly = all.filter(k => !I.parseDistrict(k).oaza);
    const raw = all.filter(k => I.parseDistrict(k).oaza);
    if (cityOnly.length) console.log(`\n（${label}: 大字なしキー ${cityOnly.length}種は畳む対象から除外 — ${cityOnly.join(' / ')}）`);
    const variant = [...new Set(raw.map(normOaza))];
    // 包含は市（＝数字より前の共通部分）ごとに畳む必要があるが、
    // キーは 郡+市+区+大字 の連結なので前方一致でそのまま畳める
    const both = collapse(variant);
    console.log(`\n${label}`);
    console.log(`  そのまま         : ${raw.length}`);
    console.log(`  異体字を揃える   : ${variant.length}（-${raw.length - variant.length}）`);
    console.log(`  ＋包含関係を畳む : **${both.length}**（-${raw.length - both.length}）`);
    return { raw, variant, both };
  };
  const cur = report('現状の76地区', districts);
  const nw = report('地区外から出てくる新キー', [...newKeys]);
  report('両方あわせて', [...districts, ...newKeys]);

  console.log('\n--- 76地区のうち、正規化で畳まれる組 ---');
  const byNorm = new Map();
  for (const k of districts) {
    const n = normOaza(k);
    if (!byNorm.has(n)) byNorm.set(n, []);
    byNorm.get(n).push(k);
  }
  let pairs = 0;
  for (const [n, ks] of byNorm) if (ks.length > 1) { console.log(`  異体字: ${ks.join(' / ')}`); pairs++; }
  const col = collapse([...byNorm.keys()]);
  for (const n of byNorm.keys()) {
    if (col.includes(n)) continue;
    const parent = col.find(o => n.startsWith(o) || o.startsWith(n));
    console.log(`  包含  : ${n} → ${parent}`);
    pairs++;
  }
  if (!pairs) console.log('  なし');

  /* ================= 住所のパース失敗 ================= */
  console.log('\n' + '='.repeat(80));
  console.log('住所のパース失敗（種類別）— 「1件しか見えない」のは検出していないだけかもしれない');
  console.log('='.repeat(80));

  const kinds = new Map();
  const bump = (k, ex) => {
    if (!kinds.has(k)) kinds.set(k, { n: 0, ex: [] });
    const e = kinds.get(k);
    e.n++;
    if (e.ex.length < 4) e.ex.push(ex);
  };
  const seen = new Set();
  const check = (addr, where) => {
    if (!addr) return;
    const key = where + '|' + addr;
    if (seen.has(key)) return;
    seen.add(key);
    const p = I.splitAddress(addr);
    const a = String(addr).normalize('NFKC').replace(/\s+/g, '');
    const label = `${where}: ${addr}`;
    if (!p) { bump('splitAddress が null', label); return; }
    if ((a.match(/[都道府県]/g) || []).length && (a.match(/(北海道|東京都|京都府|大阪府|..県)/g) || []).length >= 2) bump('★ 都道府県が2回出る', label);
    // **「北都留郡」「南都留郡」の「都」に当たる誤検出をしないこと。**
    // 都道府県名そのものが郡や市区町村に食い込んでいる場合だけを拾う
    const PREF_RE = /(北海道|東京都|京都府|大阪府|(?:青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)県)/;
    if (p.gun && PREF_RE.test(p.gun)) bump('★ 郡に都道府県が食い込んでいる', label);
    if (p.city && PREF_RE.test(p.city)) bump('★ 市区町村に都道府県が食い込んでいる', label);
    if (p.city && /郡/.test(p.city)) bump('★ 市区町村に郡が食い込んでいる', label);
    if ((a.match(/郡/g) || []).length >= 2) bump('郡が2回出る', label);
    if (!p.city) bump('市区町村が取れない', label);
    if (p.city && !p.oaza) bump('大字が取れない（市区町村どまり）', label);
    if (!p.pref) bump('都道府県が無い', label);
    if (/郡/.test(a) && !p.gun) bump('郡があるのに取れていない', label);
    if (p.city && p.oaza && /^[0-9-]/.test(p.oaza)) bump('大字が数字で始まる', label);
  };

  for (const [muni, collected] of collectedByMuni) {
    for (const c of collected) for (const it of c.items) check(it.address, `${c.source.id}「${it.name}」`);
  }
  for (const r of records) check(r.address, `data \`${r.id}\``);

  console.log('');
  for (const [k, e] of [...kinds].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`${pad(k, 34)} ${String(e.n).padStart(4)}件`);
    for (const x of e.ex) console.log(`    ${x}`);
  }
  if (!kinds.size) console.log('  検出なし');

  // 都道府県が2回出る住所が、実際に地区判定を壊しているか
  console.log('\n--- 都道府県が2回出る住所は、実際に地区キーが壊れているか ---');
  const dup = (kinds.get('★ 都道府県が2回出る') || { ex: [] });
  const dupAll = [];
  for (const [muni, collected] of collectedByMuni) {
    for (const c of collected) for (const it of c.items) {
      if (!it.address) continue;
      const a = String(it.address).normalize('NFKC').replace(/\s+/g, '');
      if ((a.match(/(北海道|東京都|京都府|大阪府|..県)/g) || []).length < 2) continue;
      if (dupAll.some(x => x.addr === it.address)) continue;
      const p = I.splitAddress(it.address);
      dupAll.push({ addr: it.address, name: it.name, src: c.source.id, key: I.districtKey(it.address), gun: p && p.gun, city: p && p.city });
    }
  }
  for (const x of dupAll) {
    console.log(`  ${x.src}「${x.name}」`);
    console.log(`     ${x.addr}`);
    console.log(`     → gun=${x.gun} city=${x.city} districtKey=${x.key}`);
  }
  console.log(`  合計 ${dupAll.length}件`);
})();
