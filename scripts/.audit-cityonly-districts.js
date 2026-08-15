/**
 * 【2】市町村どまりの地区キーが地区リストに混ざっている問題の実測。
 *
 * `inDistrict` は `d.oaza` が空なら**その市区町村の住所を全部通す**ので、
 * `南都留郡道志村` のような大字なしキーが地区として登録されていると、
 * **同じ市の大字地区（長又・馬場）を全部飲み込む。**
 *
 * **判定は持たない。実装も変えない。数字を出すだけ。**
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
  const cityOnly = parsed.filter(x => !x.p.oaza);
  const withOaza = parsed.filter(x => x.p.oaza);

  console.log('='.repeat(78));
  console.log(`【2】76地区のうち、市町村どまりのキー: **${cityOnly.length}本**`);
  console.log('='.repeat(78));

  for (const c of cityOnly) {
    const swallowed = withOaza.filter(x => x.muni === c.muni && I.inDistrict(x.key, c.p));
    // なぜ生まれたか: そのキーを作ったレコード（住所に大字が無い）
    const src = records.filter(r => r.address && I.districtKey(r.address) === c.key);
    console.log(`\n■ ${c.key}`);
    console.log(`   飲み込んでいる大字地区: ${swallowed.length}本${swallowed.length ? ' — ' + swallowed.map(x => x.key).join(' / ') : ''}`);
    console.log(`   このキーを作ったレコード: ${src.length}件`);
    for (const r of src) console.log(`     \`${r.id}\` ${r.name}  ${r.address}  status=${r.status}`);
    if (!src.length) console.log('     （**該当レコードなし。**いま campgrounds.json からは再生成されないキー）');
  }

  /* ---- 外したらどう動くか ---- */
  console.log('\n' + '='.repeat(78));
  console.log('市町村どまりの地区を外したらどう動くか');
  console.log('='.repeat(78));

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

  const run = set => {
    let missing = 0, inData = 0, orphan = 0, b2 = 0;
    for (const x of set) {
      const merged = I.mergeItems(collectedByMuni.get(x.muni), x.p);
      const { results } = I.classify(merged, records, x.p);
      const dr = I.analyzeDropped(merged, results, x.p);
      b2 += dr.b2.length;
      for (const r of results) {
        if (r.kind === 'MISSING') missing++;
        else if (r.kind === 'IN_DATA') inData++;
        else if (r.kind === 'ORPHAN') orphan++;
      }
    }
    return { missing, inData, orphan, b2, n: set.length };
  };

  const before = run(parsed);
  const after = run(withOaza);
  console.log(`\n${pad('', 22)} 地区数  MISSING  IN_DATA  ORPHAN     b2`);
  console.log(`${pad('現状（76地区）', 22)} ${String(before.n).padStart(5)} ${String(before.missing).padStart(8)} ${String(before.inData).padStart(8)} ${String(before.orphan).padStart(7)} ${String(before.b2).padStart(6)}`);
  console.log(`${pad('市町村どまりを外す', 22)} ${String(after.n).padStart(5)} ${String(after.missing).padStart(8)} ${String(after.inData).padStart(8)} ${String(after.orphan).padStart(7)} ${String(after.b2).padStart(6)}`);
  console.log(`${pad('差', 22)} ${String(after.n - before.n).padStart(5)} ${String(after.missing - before.missing).padStart(8)} ${String(after.inData - before.inData).padStart(8)} ${String(after.orphan - before.orphan).padStart(7)} ${String(after.b2 - before.b2).padStart(6)}`);

  /* ---- 飲み込まれていた項目はどこへ行くか ---- */
  console.log('\n--- 市町村どまりの地区でしか拾われていなかった項目 ---');
  console.log('（外すと**どの地区にも入らなくなる**＝「地区外」に移る）');
  let orphaned = 0;
  for (const c of cityOnly) {
    const merged = I.mergeItems(collectedByMuni.get(c.muni), c.p);
    const only = merged.filter(b => b.inDistrict && !withOaza.some(x => x.muni === c.muni && b.addresses.some(a => I.inDistrict(a, x.p))));
    orphaned += only.length;
    console.log(`  ${pad(c.key, 24)} ${String(only.length).padStart(3)}件`);
    for (const b of only.slice(0, 6)) console.log(`      ${b.name}（${b.addresses[0] || '住所なし'}）`);
    if (only.length > 6) console.log(`      … ほか ${only.length - 6}件`);
  }
  console.log(`\n  合計 **${orphaned}件** が「地区外」に移る（＝地区外リストがその分増える）`);
})();
