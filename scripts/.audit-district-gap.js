/**
 * §19-5 の実測。**地区リストを `campgrounds.json` から作っていることの穴**を数える。
 *
 * 地区は `districtKey(r.address)` ＝ **既存レコードの住所**から作られている。
 * レコードが1件も無い大字は地区にならず、**スイープの対象にすらならない。**
 * 掲載漏れを探す範囲を、すでに掲載しているものから作っている（§6-19 が地区の単位で起きている）。
 *
 * **判定は持たない。**`district-sweep.js` の関数をそのまま呼ぶ。
 * **`data/` への書き込みは無い。実装も変えない。数字を出すだけ。**
 *
 * 実行: `node scripts/.audit-district-gap.js`（キャッシュのみ）
 */
const fs = require('fs');
const { MUNI_SOURCES, _internal: I } = require('./district-sweep.js');

const SKIP = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;
const districts = fs.readdirSync(__dirname)
  .map(f => (f.match(/^sweep-(.+)\.md$/) || [])[1]).filter(Boolean).filter(d => !SKIP.test(d)).sort();
const muniOf = n => Object.keys(MUNI_SOURCES).find(m => n.startsWith(m) || n.includes(m));
const pad = (s, n) => String(s).padEnd(n);

(async () => {
  const records = I.loadRecords();
  const parsed = districts.map(d => ({ key: d, p: I.parseDistrict(d), muni: muniOf(d) }));
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

  /* ---- 【1】どの登録地区にも入らない項目 ---- */
  // 定義: **住所があり、その市区町村は MUNI_SOURCES に登録されているのに、
  // 76地区のどれにも入らない**もの。ユニークは 名前×住所。
  const orphan = new Map();
  for (const [muni, collected] of collectedByMuni) {
    const muniD = I.parseDistrict(muni);
    for (const c of collected) {
      for (const it of c.items) {
        if (!it.address) continue;
        if (!I.inDistrict(it.address, muniD)) continue;          // その市町村の外は対象外
        if (parsed.some(x => I.inDistrict(it.address, x.p))) continue;  // どこかの地区に入る
        const k = it.name + '|' + it.address;
        if (!orphan.has(k)) {
          orphan.set(k, { name: it.name, addr: it.address, muni, key: I.districtKey(it.address), srcs: new Set() });
        }
        orphan.get(k).srcs.add(c.source.id);
      }
    }
  }
  const list = [...orphan.values()];
  console.log('='.repeat(80));
  console.log(`【1】どの登録地区にも入らない項目: **${list.length}件**（名前×住所でユニーク）`);
  console.log('='.repeat(80));

  // 市町村別・大字別
  const byMuni = new Map();
  for (const o of list) {
    if (!byMuni.has(o.muni)) byMuni.set(o.muni, new Map());
    const m = byMuni.get(o.muni);
    if (!m.has(o.key)) m.set(o.key, []);
    m.get(o.key).push(o);
  }
  // その大字に既存レコードが本当に0件か
  const recByKey = new Map();
  for (const r of records) {
    if (!r.address) continue;
    const k = I.districtKey(r.address);
    if (!k) continue;
    if (!recByKey.has(k)) recByKey.set(k, []);
    recByKey.get(k).push(r);
  }

  console.log(`\n${pad('市町村', 12)} 件数  大字数`);
  for (const [m, keys] of [...byMuni].sort((a, b) => [...b[1].values()].flat().length - [...a[1].values()].flat().length)) {
    console.log(`${pad(m, 12)} ${String([...keys.values()].flat().length).padStart(4)}  ${String(keys.size).padStart(4)}`);
  }

  console.log('\n--- 大字別（★ = その大字に既存レコードがあるのに地区になっていない＝別の原因）---');
  const anomalous = [];
  for (const [m, keys] of [...byMuni].sort()) {
    for (const [k, items] of [...keys].sort((a, b) => b[1].length - a[1].length)) {
      const recs = recByKey.get(k) || [];
      const mark = recs.length ? '★' : ' ';
      if (recs.length) anomalous.push({ key: k, recs, items });
      console.log(`${mark} ${pad(k, 34)} ${String(items.length).padStart(3)}件  既存レコード ${recs.length}件${recs.length ? ' → ' + recs.map(r => r.id).join(',') : ''}`);
    }
  }
  console.log(`\n既存レコードが0件の大字: ${[...byMuni.values()].flatMap(x => [...x.keys()]).filter(k => !(recByKey.get(k) || []).length).length}`);
  console.log(`★（レコードがあるのに地区になっていない）: ${anomalous.length}`);

  console.log('\n--- 施設名（全件。名前から業態は判定できないので選別しない）---');
  for (const [m, keys] of [...byMuni].sort()) {
    console.log(`\n[${m}]`);
    for (const [k, items] of [...keys].sort()) {
      for (const o of items) console.log(`  ${pad(k, 30)} ${o.name}  （${o.addr}） [${[...o.srcs].join(',')}]`);
    }
  }

  /* ---- 【2】試算 ---- */
  console.log('\n' + '='.repeat(80));
  console.log('【2】地区の作り方を変えたらどうなるか（試算。実装はしない）');
  console.log('='.repeat(80));

  const b2Of = (muni, d) => {
    const merged = I.mergeItems(collectedByMuni.get(muni), d);
    const { results } = I.classify(merged, records, d);
    const dr = I.analyzeDropped(merged, results, d);
    return {
      b2: dr.b2.length,
      b2b: dr.b2.filter(x => x.dropSameCity).length,
      inDist: merged.filter(x => x.inDistrict).length,
      missing: results.filter(r => r.kind === 'MISSING').length,
    };
  };

  let cur = { b2: 0, b2b: 0, inDist: 0, missing: 0 };
  const missingByMuni = new Map();
  for (const x of parsed) {
    const r = b2Of(x.muni, x.p);
    cur.b2 += r.b2; cur.b2b += r.b2b; cur.inDist += r.inDist; cur.missing += r.missing;
    missingByMuni.set(x.muni, (missingByMuni.get(x.muni) || 0) + r.missing);
  }
  console.log(`\n現状（76地区）: b2 ${cur.b2} / うち市が同じ（§4-2）${cur.b2b} / MISSING ${cur.missing}`);

  // 案A: 地区外の住所から地区を足す
  const newKeys = [...new Set(list.map(o => o.key))];
  // **大字が取れない住所（市区町村どまり）は、市全体を覆う地区になってしまう。**
  // 既存の76地区と全部重なるので、これを地区として足すと二重計上になる
  const cityOnly = newKeys.filter(k => !I.parseDistrict(k).oaza);
  console.log(`\n（内訳）新しい地区キー ${newKeys.length}種 / うち**大字が取れず市区町村どまり** ${cityOnly.length}種: ${cityOnly.join(' / ')}`);
  const usableKeys = newKeys.filter(k => I.parseDistrict(k).oaza);
  let a = { b2: 0, b2b: 0, missing: 0 };
  for (const k of usableKeys) {
    const p = I.parseDistrict(k);
    const muni = [...collectedByMuni.keys()].find(m => I.inDistrict(k, I.parseDistrict(m)));
    if (!muni) { console.log(`  ?? 市町村が決まらない地区: ${k}`); continue; }
    const r = b2Of(muni, p);
    a.b2 += r.b2; a.b2b += r.b2b; a.missing += r.missing;
  }
  console.log(`\n案A（レコード0件の大字も地区にする。**市区町村どまりの ${cityOnly.length}種は除外**）`);
  console.log(`  対象地区数: 76 → **${76 + usableKeys.length}**（+${usableKeys.length}）`);
  console.log(`  ソース収集: 市町村単位なので **変わらない**（18市町村ぶんのまま）`);
  console.log(`  分析（mergeItems+classify）の回数: 76 → ${76 + usableKeys.length} 回`);
  console.log(`  b2: ${cur.b2} → **${cur.b2 + a.b2}**（+${a.b2}）  ※地区が増えるぶん b2 も増える`);
  console.log(`  §4-2（市が同じで大字違い）: ${cur.b2b} → **${cur.b2b + a.b2b}**（+${a.b2b}）`);
  console.log(`  新地区で出る MISSING: **${a.missing}**`);

  // 案B: 市町村単位で突合
  let b = { b2: 0, b2b: 0, inDist: 0, missing: 0 };
  for (const muni of collectedByMuni.keys()) {
    const r = b2Of(muni, I.parseDistrict(muni));
    b.b2 += r.b2; b.b2b += r.b2b; b.inDist += r.inDist; b.missing += r.missing;
  }
  console.log(`\n案B（市町村単位で突合する）`);
  console.log(`  対象地区数: 76 → **${collectedByMuni.size}**（市町村の数）`);
  console.log(`  ソース収集: **変わらない**`);
  console.log(`  分析の回数: 76 → ${collectedByMuni.size} 回`);
  console.log(`  b2: ${cur.b2} → **${b.b2}**（市の外に出たものだけ）`);
  console.log(`  §4-2（市が同じで大字違い）: ${cur.b2b} → **${b.b2b}**（定義上0になる）`);
  console.log(`  MISSING: ${cur.missing} → **${b.missing}**`);

  /* ---- 【3】既存の MISSING との比較 ---- */
  console.log('\n' + '='.repeat(80));
  console.log('【3】この穴で見逃していた分と、既存 MISSING の比');
  console.log('='.repeat(80));
  console.log(`\n${pad('市町村', 12)} 地区外(未測定) 既存MISSING(76地区)  比`);
  const rows3 = [...byMuni].map(([m, keys]) => ({
    m, n: [...keys.values()].flat().length, miss: missingByMuni.get(m) || 0,
  })).sort((x, y) => y.n - x.n);
  for (const r of rows3) {
    const ratio = r.miss ? (r.n / r.miss * 100).toFixed(0) + '%' : '—';
    console.log(`${pad(r.m, 12)} ${String(r.n).padStart(9)} ${String(r.miss).padStart(14)}  ${ratio.padStart(6)}`);
  }
  const tot = rows3.reduce((s, r) => s + r.n, 0), totM = rows3.reduce((s, r) => s + r.miss, 0);
  console.log(`${pad('合計', 12)} ${String(tot).padStart(9)} ${String(totM).padStart(14)}  ${(tot / totM * 100).toFixed(0)}%`);

  /* ---- 【4】偽ゼロ検証 ---- */
  console.log('\n' + '='.repeat(80));
  console.log('【4】案Aで地区を足したとき、全件どこかの地区に入るか');
  console.log('='.repeat(80));
  const allD = [...parsed.map(x => x.p), ...usableKeys.map(k => I.parseDistrict(k)), ...cityOnly.map(k => I.parseDistrict(k))];
  const stillOut = list.filter(o => !allD.some(d => I.inDistrict(o.addr, d)));
  console.log(`  対象 ${list.length}件 / 入らなかった **${stillOut.length}件**`);
  if (stillOut.length) {
    console.log('  ❌ **地区の作り方以外にも原因がある。**');
    for (const o of stillOut) console.log(`     ${o.name}（${o.addr}） key=${o.key}`);
    process.exitCode = 1;
  } else {
    console.log('  ✅ 全件入った。原因は地区リストの作り方だけ');
  }
})();
