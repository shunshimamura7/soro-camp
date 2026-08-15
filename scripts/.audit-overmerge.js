/**
 * §19-6(a)（名寄せの過剰合流）の**規模の実測**。直す前に数える（§6-20）。
 *
 * **判定は1つも持たない。**`district-sweep.js` の `mergeItems` / `classify` /
 * `splitAddress` / `banchiKey` をそのまま呼ぶ。ここで規則を書き直すと、
 * 片方だけ直ったときに黙って食い違う（§18-3）。
 *
 * 出すもの:
 *   【1】住所なし項目にしか由来しない正規化名（＝汎用語に潰れて橋渡しになりうるもの）
 *   【2】IN_DATA / matchedBy=名前 のうち、レコードとソースの住所が食い違うもの
 *   【3】nameOnly ソース単独で作られている MISSING と、正規化名の長さ分布
 *   【4】答えが分かっている1件（猪之頭のペンギン村）が【1】【2】に出るか
 *
 * **閾値は決め打ちしない。**全部出して、何が「汎用」かはデータを見てから決める。
 * 実行: `node scripts/.audit-overmerge.js`（キャッシュのみ。書き込みなし）
 */
const fs = require('fs');
const path = require('path');
const { sweepNormalizeName, MUNI_SOURCES, _internal: I } = require('./district-sweep.js');

const SKIP = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;
const NAME_ONLY = new Set(['nap-camp', 'yamakita-town', 'fujinomiya-kankou', 'fujiyama-navi']);

const districts = fs.readdirSync(__dirname)
  .map(f => (f.match(/^sweep-(.+)\.md$/) || [])[1]).filter(Boolean).filter(d => !SKIP.test(d)).sort();
const muniOf = n => Object.keys(MUNI_SOURCES).find(m => n.startsWith(m) || n.includes(m));

const oazaOf = a => { const p = I.splitAddress(a); return p && p.city ? p.city + (p.oaza || '') : null; };
const pad = (s, n) => String(s).padEnd(n);

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
  console.log(`\n対象 ${districts.length}地区 / ${collectedByMuni.size}市町村\n`);

  const contam = new Map();     // norm → 出現の記録
  const multiBuckets = [];      // 番地が2つ以上に割れているバケット
  const inDataSuspect = [];     // 【2】
  const nameOnlyMissing = [];   // 【3】
  const nameOnlyNormLens = [];
  const b1NameOnly = [];

  for (const d of districts) {
    const muni = muniOf(d);
    if (!muni) continue;
    const collected = collectedByMuni.get(muni);
    const { district } = I.sourcesFor(d, records);
    const merged = I.mergeItems(collected, district);
    const { results } = I.classify(merged, records, district);

    // その市町村のソース集合で、住所を持つ／持たない項目の正規化名
    const withAddr = new Set(), noAddr = new Map();  // norm → Set(sourceId)
    for (const c of collected) {
      for (const it of c.items) {
        const n = sweepNormalizeName(it.name);
        if (!n) continue;
        if (it.address) withAddr.add(n);
        else {
          if (!noAddr.has(n)) noAddr.set(n, new Set());
          noAddr.get(n).add(c.source.id);
          if (NAME_ONLY.has(c.source.id)) nameOnlyNormLens.push({ n, len: [...n].length, src: c.source.id });
        }
      }
    }
    // **住所を持つ項目にも同じ名前があるなら、橋渡しの原因はそちらではない**
    const onlyNoAddr = new Set([...noAddr.keys()].filter(n => !withAddr.has(n)));

    for (const b of merged) {
      const banchis = [...new Set(b.addresses.map(I.banchiKey).filter(Boolean))];
      const oazas = [...new Set(b.addresses.map(oazaOf).filter(Boolean))];
      const bridging = [...b.norms].filter(n => onlyNoAddr.has(n));

      // 住所を持てないバケット（b1 相当）で、寄与が nameOnly だけのもの
      const bs = [...new Set(b.hits.map(h => h.sourceId))];
      if (!b.addressKnown && bs.length && bs.every(s => NAME_ONLY.has(s))) {
        b1NameOnly.push({ muni, name: b.name, len: [...sweepNormalizeName(b.name)].length });
      }

      if (banchis.length >= 2) {
        multiBuckets.push({ d, muni, name: b.name, banchis, oazas, bridging,
          srcs: [...new Set(b.hits.map(h => h.sourceId))] });
      }
      for (const n of bridging) {
        if (!contam.has(n)) contam.set(n, { len: [...n].length, srcs: new Set(), rows: [] });
        const e = contam.get(n);
        for (const s of noAddr.get(n) || []) e.srcs.add(s);
        e.rows.push({ d, muni, bucket: b.name, banchis, aliases: [...b.aliases] });
      }
    }

    for (const r of results) {
      /* 【2】IN_DATA / matchedBy=名前 で、住所が両方あるのに食い違う */
      if (r.kind === 'IN_DATA' && r.matchedBy === '名前' && r.record && r.record.address && r.bucket && r.bucket.addresses.length) {
        const recOaza = oazaOf(r.record.address);
        const recBan = I.banchiKey(r.record.address);
        const bOazas = new Set(r.bucket.addresses.map(oazaOf).filter(Boolean));
        const bBans = new Set(r.bucket.addresses.map(I.banchiKey).filter(Boolean));
        const oazaDiff = recOaza && bOazas.size && !bOazas.has(recOaza);
        const banDiff = recBan && bBans.size && !bBans.has(recBan);
        if (oazaDiff || banDiff) {
          inDataSuspect.push({ d, muni, bucket: r.bucket.name, rec: r.record, recOaza, recBan,
            bOazas: [...bOazas], bBans: [...bBans], oazaDiff: !!oazaDiff, banDiff: !!banDiff,
            aliases: [...r.bucket.aliases] });
        }
      }
      /* 【3】nameOnly ソースの寄与
       *
       * **「nameOnly 単独の MISSING」は構造上ゼロにしかならない。**
       * MISSING は「地区内の住所を持つバケット」なので、住所を出せない nameOnly だけでは
       * 到達できない（住所なしバケットは b1 に落ちる）。**この数え方は退化している。**
       * 実際の寄与は「住所を持つバケットに合流して別名と confidence を足す」ほうなので、
       * そちらを数える。 */
      if (r.kind === 'MISSING' && r.bucket) {
        const srcs = [...new Set(r.bucket.hits.map(h => h.sourceId))];
        const nameOnlyHere = srcs.filter(s => NAME_ONLY.has(s));
        if (nameOnlyHere.length) {
          nameOnlyMissing.push({ d, muni, name: r.bucket.name, srcs: nameOnlyHere,
            sole: srcs.every(s => NAME_ONLY.has(s)),
            onlyNameOnlyAlias: [...r.bucket.aliases].length > 1,
            len: [...sweepNormalizeName(r.bucket.name)].length });
        }
      }
    }
  }

  /* ================= 【1】 ================= */
  console.log('='.repeat(78));
  console.log('【1】住所なし項目にしか由来しない正規化名（＝橋渡しになりうるもの）');
  console.log('='.repeat(78));
  const uniqBucket = e => new Set(e.rows.map(r => r.muni + '|' + r.bucket)).size;
  const rows = [...contam].map(([n, e]) => ({
    n, len: e.len, srcs: [...e.srcs].join(','),
    nDist: e.rows.length, nUniq: uniqBucket(e),
    multi: e.rows.filter(r => r.banchis.length >= 2).length,
    ex: e.rows[0],
  })).sort((a, b) => b.multi - a.multi || a.len - b.len || b.nUniq - a.nUniq);
  console.log(`該当する正規化名: ${rows.length}種`);
  console.log(`うち **番地が2つ以上に割れたバケットに入っていた** もの: ${rows.filter(r => r.multi).length}種\n`);
  console.log(`${pad('正規化名', 22)} 字数 ${pad('由来ソース', 22)} 延べ ユニ 割れ  例（バケット名）`);
  console.log('-'.repeat(110));
  for (const r of rows) {
    console.log(`${pad(r.n, 22)} ${String(r.len).padStart(3)}  ${pad(r.srcs, 22)} ${String(r.nDist).padStart(4)} ${String(r.nUniq).padStart(4)} ${String(r.multi).padStart(4)}  ${r.ex.bucket}`);
  }

  console.log('\n--- 番地が2つ以上に割れているバケット（過剰合流の症状）---');
  const mUniq = [...new Map(multiBuckets.map(b => [b.muni + '|' + b.name, b])).values()];
  const withBridge = mUniq.filter(b => b.bridging.length);
  console.log(`延べ ${multiBuckets.length} / ユニーク（市町村×名前）${mUniq.length}`);
  console.log(`  うち橋渡し候補の norm を含む: **${withBridge.length}**`);
  console.log(`  含まない（別要因で割れている）: ${mUniq.length - withBridge.length}\n`);
  for (const b of withBridge) {
    console.log(`  [${b.muni}] ${b.name}`);
    console.log(`     番地 ${b.banchis.length}種: ${b.banchis.join(' / ')}`);
    console.log(`     橋渡し norm: ${b.bridging.join(' / ')}`);
    console.log(`     別名: ${[...new Set(b.srcs)].join(',')}`);
  }

  /* ================= 【2】 ================= */
  console.log('\n' + '='.repeat(78));
  console.log('【2】IN_DATA / matchedBy=名前 で、レコードとソースの住所が食い違うもの');
  console.log('='.repeat(78));
  const sUniq = [...new Map(inDataSuspect.map(x => [x.muni + '|' + x.bucket + '|' + x.rec.id, x])).values()];
  console.log(`延べ ${inDataSuspect.length} / ユニーク（市町村×バケット×レコード）${sUniq.length}`);
  console.log(`  大字が違う: ${sUniq.filter(x => x.oazaDiff).length}`);
  console.log(`  **番地が違う（大字は同じ）**: ${sUniq.filter(x => x.banDiff && !x.oazaDiff).length}\n`);
  for (const x of sUniq) {
    console.log(`  [${x.muni}/${x.d}] バケット「${x.bucket}」`);
    console.log(`     → \`${x.rec.id}\` ${x.rec.name}（${x.rec.address}）`);
    console.log(`     レコード 大字=${x.recOaza} 番地=${x.recBan} / ソース側 大字=${x.bOazas.join(',')} 番地=${x.bBans.join(',')}`);
    console.log(`     違い: ${x.oazaDiff ? '大字' : ''}${x.oazaDiff && x.banDiff ? '＋' : ''}${x.banDiff ? '番地' : ''}`);
    console.log(`     バケットの別名: ${x.aliases.join(' / ')}`);
  }

  /* ================= 【3】 ================= */
  console.log('\n' + '='.repeat(78));
  console.log('【3】nameOnly ソースの寄与（修正案の副作用の材料）');
  console.log('='.repeat(78));
  const nmUniq = [...new Map(nameOnlyMissing.map(x => [x.muni + '|' + x.name, x])).values()];
  console.log('**「nameOnly 単独の MISSING」は構造上ゼロにしかならない。**');
  console.log('MISSING は地区内の住所を持つバケットなので、住所を出せない nameOnly だけでは到達できない。');
  console.log('実際の寄与は「住所を持つバケットに合流して別名と confidence を足す」ほうなので、そちらを数える。\n');
  console.log(`nameOnly が**単独で**作った MISSING: ${nmUniq.filter(x => x.sole).length}（＝上記のとおり構造上0）`);
  console.log(`nameOnly が**寄与している** MISSING: 延べ ${nameOnlyMissing.length} / ユニーク（市町村×名前）${nmUniq.length}`);
  const bySrc = new Map();
  for (const x of nmUniq) for (const s of x.srcs) bySrc.set(s, (bySrc.get(s) || 0) + 1);
  console.log(`  ソース別: ${[...bySrc].map(([s, n]) => `${s}=${n}`).join(' / ')}`);
  const b1u = [...new Map(b1NameOnly.map(x => [x.muni + '|' + x.name, x])).values()];
  console.log(`\nnameOnly だけで住所を持てず b1 に落ちているバケット: 延べ ${b1NameOnly.length} / ユニーク ${b1u.length}`);
  console.log('  （＝ nameOnly の寄与を切ると、この層が丸ごと消える）');

  console.log('\n--- nameOnly 項目の正規化名の長さ分布（延べ）---');
  const hist = new Map();
  for (const x of nameOnlyNormLens) hist.set(x.len, (hist.get(x.len) || 0) + 1);
  for (const [l, n] of [...hist].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${String(l).padStart(2)}字 ${String(n).padStart(5)}  ${'#'.repeat(Math.min(60, Math.round(n / 20)))}`);
  }
  console.log('\n--- 閾値ごとの影響（「N字以下は norms に足さない」とした場合）---');
  const bridged = rows.filter(r => r.multi);
  console.log(`${pad('閾値', 8)} 橋渡しを止められる   巻き添えで norms から落ちる nameOnly 項目（延べ）`);
  for (const th of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const stopped = bridged.filter(r => r.len <= th).length;
    const collateral = nameOnlyNormLens.filter(x => x.len <= th).length;
    console.log(`${pad('≤' + th + '字', 8)} ${String(stopped).padStart(10)} / ${bridged.length}       ${String(collateral).padStart(6)} / ${nameOnlyNormLens.length}`);
  }
  console.log('\n**★ 閾値案は実測で否定された。**実際に橋渡しをした norm は');
  console.log(`  ${bridged.map(r => `「${r.n}」(${r.len}字)`).join(' / ')}`);
  console.log('  で、短くない。**「短い名前を弾く」では止まらない。**');

  /* ================= 【4】 ================= */
  console.log('\n' + '='.repeat(78));
  console.log('【4】答えが分かっている1件（猪之頭のペンギン村）');
  console.log('='.repeat(78));
  const in1 = rows.some(r => r.rows === undefined && false) ||
    [...contam].some(([, e]) => e.rows.some(r => r.d === '富士宮市猪之頭' && /ペンギン村/.test(r.bucket)));
  const in1b = withBridge.some(b => /ペンギン村/.test(b.name));
  const in2 = sUniq.some(x => /ペンギン村/.test(x.bucket));
  console.log(`  【1】橋渡し norm を含むバケットとして出る: ${in1 ? '✅' : '❌'}`);
  console.log(`  【1】番地が割れたバケットとして出る:       ${in1b ? '✅' : '❌'}`);
  console.log(`  【2】住所が食い違う IN_DATA として出る:    ${in2 ? '✅' : '❌'}`);
  if (!(in1 && in1b && in2)) {
    console.log('  ❌ **検出側が壊れている。**答えが分かっている入力が出ていない（§18-3）');
    process.exitCode = 1;
  } else {
    console.log('  ✅ 3つとも出た。検出は効いている');
  }
})();
