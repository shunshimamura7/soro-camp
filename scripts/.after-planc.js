/**
 * 案C実装後の集計。**基準線（`.baseline-before-planc.js`）と同じ読み方で18本を数える。**
 *
 * ネットを踏まない。`sweep-<市区町村>.md` 18本とキャッシュ済みのソースだけを見る。
 * **判定は持たない。数字を出して、基準線との差を並べるだけ。**
 *
 *   node scripts/.after-planc.js
 *
 * ## 数え方を基準線と揃えてあること
 *
 * `readSweep()` と `uniq` の作り方は `.baseline-before-planc.js` からそのまま持ってきた。
 * **別々に書くと、差が「実装で動いた」のか「数え方が違う」のか切り分けられない。**
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES, _internal: I, sweepNormalizeName } = require('./district-sweep.js');

const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, '.baseline-before-planc.json'), 'utf8'));
const MUNIS = Object.keys(MUNI_SOURCES);

/* ── 基準線と同じパーサ ────────────────────────────────────────────── */
function readSweep(file) {
  const body = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const sec = h => body.split('\n## ').find(x => x.startsWith(h));
  const missing = [...(sec('MISSING') || '').matchAll(/^### \d+\.\s*(.+)$/gm)].map(m => m[1].trim());
  const conf = [...(sec('MISSING') || '').matchAll(/\*\*confidence\*\*:\s*(HIGH|MID|LOW)/g)].map(m => m[1]);
  const orphan = [...(sec('ORPHAN') || '').matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(m => m[1]);
  const inData = [...(sec('IN_DATA') || '').matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(m => m[1]);
  // ★ 冒頭のサマリ表だけを見る。**本文全体を走査してはいけない。**
  // 案Cで足した「大字が取れないソース項目の行き先」の表に
  // `| MISSING | 52 |` `| IN_DATA | 29 |` という行があり、
  // 基準線の正規表現（本文全体を走査する）だと**そちらが最後に一致して上書きする。**
  // 道志村で実測: 全体スキャン MISSING 37 / IN_DATA 28、冒頭のみ 42 / 15（後者が正しい）。
  const sum = {};
  for (const [, k, v] of body.split('\n## ')[0].matchAll(/^\|\s*\*?\*?(MISSING|IN_DATA|ORPHAN)[^|]*\|\s*\*?\*?(\d+)/gm)) sum[k] = Number(v);
  // b1 / b2（「出力に載らなかったソース側の項目」の表）
  const drop = sec('出力に載らなかったソース側の項目') || '';
  const b1 = Number((drop.match(/\*\*b1\*\*[^|]*\|[^|]*\|\s*\*\*(\d+)\*\*/) || [])[1] || 0);
  const b2 = Number((drop.match(/\*\*b2\*\*[^|]*\|[^|]*\|\s*\*\*(\d+)\*\*/) || [])[1] || 0);
  const b2other = Number((drop.match(/うち市区町村も違う\s*(\d+)/) || [])[1] || 0);
  // 大字検査
  const oz = sec('大字検査') || '';
  const ozNum = re => Number((oz.match(re) || [])[1] || 0);
  const oza = {
    ng: ozNum(/不一致（誤突合の疑い）\*\*\s*\|\s*\*\*(\d+)/),
    contained: ozNum(/包含（粒度違い・無害）\s*\|\s*(\d+)/),
    same: ozNum(/\|\s*一致\s*\|\s*(\d+)/),
    skipped: ozNum(/検査対象外（どちらかの大字が取れない）\s*\|\s*(\d+)/),
  };
  // 大字が取れない項目（明細行）
  const noOazaSec = sec('大字が取れないソース項目の行き先') || '';
  const noOaza = [...noOazaSec.matchAll(/^\|\s*`([^`]+)`\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/gm)]
    .filter(m => m[1] !== 'ソース')
    .map(m => ({ sourceId: m[1], name: m[2], address: m[3], where: m[4] }));
  return { missing, conf, orphan, inData, sum, b1, b2, b2other, oza, noOaza };
}

const rows = MUNIS.map(d => ({ district: d, ...readSweep(`sweep-${d}.md`) }))
  .sort((a, b) => a.district.localeCompare(b.district, 'ja'));

const muniKeyOf = d => { try { const p = I.parseDistrict(d); return (p.gun || '') + p.city + (p.ward || ''); } catch { return null; } };

const totMissing = rows.reduce((a, r) => a + r.missing.length, 0);
const totIn = rows.reduce((a, r) => a + (r.sum.IN_DATA ?? r.inData.length), 0);
const totOrphan = rows.reduce((a, r) => a + (r.sum.ORPHAN ?? r.orphan.length), 0);
const confTot = rows.flatMap(r => r.conf).reduce((m, c) => (m[c] = (m[c] || 0) + 1, m), {});
const uniq = new Set(rows.flatMap(r => r.missing.map(n => muniKeyOf(r.district) + '|' + (sweepNormalizeName(n) || n))));

// 包含ペア（基準線と同じ計算）
const overlaps = [];
for (const a of rows) for (const b of rows) {
  const pa = (() => { try { return I.parseDistrict(a.district); } catch { return null; } })();
  const pb = (() => { try { return I.parseDistrict(b.district); } catch { return null; } })();
  if (a === b || !pa || !pb || muniKeyOf(a.district) !== muniKeyOf(b.district)) continue;
  const oa = pa.oaza || '', ob = pb.oaza || '';
  if (ob.startsWith(oa) && oa.length < ob.length) overlaps.push([a.district, b.district]);
}

const totB1 = rows.reduce((a, r) => a + r.b1, 0);
const totB2 = rows.reduce((a, r) => a + r.b2, 0);
const totB2other = rows.reduce((a, r) => a + r.b2other, 0);

const P = (...a) => console.log(...a);
const pct = (a, b) => (b ? (a / b * 100).toFixed(1) + '%' : '–');

P('='.repeat(78));
P('案C実装後 vs 基準線');
P('='.repeat(78));
P('');
P('指標'.padEnd(34) + '基準線(76地区)'.padStart(14) + '案C後(18地区)'.padStart(14) + '   差');
const line = (label, was, now, note) => P(
  label.padEnd(34) + String(was).padStart(14) + String(now).padStart(14) +
  '   ' + (typeof was === 'number' ? (now - was >= 0 ? '+' : '') + (now - was) : '') + (note ? '  ' + note : '')
);
line('地区数', SNAP.rows.length, rows.length);
line('MISSING（延べ）', SNAP.totMissing, totMissing);
line('MISSING（ユニーク）', SNAP.uniq, uniq.size);
line('IN_DATA', SNAP.totIn, totIn);
line('ORPHAN', SNAP.totOrphan, totOrphan);
line('confidence HIGH', SNAP.confTot.HIGH || 0, confTot.HIGH || 0);
line('confidence MID', SNAP.confTot.MID || 0, confTot.MID || 0);
line('confidence LOW', SNAP.confTot.LOW || 0, confTot.LOW || 0);
line('包含ペア', SNAP.overlaps.length, overlaps.length);
P('');
P(`b1（住所なし）延べ ${totB1} / b2（地区外）延べ ${totB2}（うち市区町村も違う ${totB2other}）`);
P(`  → **b2 のうち「市は同じで大字が違う」= ${totB2 - totB2other}件**（基準線 2,014件 → ここが案Cで効くはずの分）`);

/* ── 大字検査 ───────────────────────────────────────────────────── */
P('');
P('─ 大字検査 ' + '─'.repeat(66));
const oz = rows.reduce((a, r) => ({
  ng: a.ng + r.oza.ng, contained: a.contained + r.oza.contained,
  same: a.same + r.oza.same, skipped: a.skipped + r.oza.skipped,
}), { ng: 0, contained: 0, same: 0, skipped: 0 });
const compared = oz.ng + oz.contained + oz.same;
P(`不一致 ${oz.ng} / 包含 ${oz.contained} / 一致 ${oz.same} / 検査対象外 ${oz.skipped}`);
P(`比べられた突合 ${compared}件 / IN_DATA 全体 ${totIn}件 → **検査できたのは ${pct(compared, totIn)}**`);
P(`不一致の率（比べられた分に対して） ${pct(oz.ng, compared)}`);
for (const r of rows) if (r.oza.ng) P(`  ${r.district}: 不一致 ${r.oza.ng}`);

/* ── 大字が取れない項目（146件との対応）─────────────────────────── */
P('');
P('─ 大字が取れないソース項目 ' + '─'.repeat(51));
const allNo = rows.flatMap(r => r.noOaza.map(x => ({ ...x, district: r.district })));
const byWhere = {};
for (const x of allNo) byWhere[x.where] = (byWhere[x.where] || 0) + 1;
P(`延べ ${allNo.length}件`);
for (const [k, v] of Object.entries(byWhere).sort((a, b) => b[1] - a[1])) P(`  ${k.padEnd(24)} ${String(v).padStart(4)}`);
// ユニーク（名前×住所）。同じソースページを複数市町村で使うので延べは水増しされる
const uniqNo = new Map();
for (const x of allNo) {
  const k = x.name + '|' + x.address;
  if (!uniqNo.has(k)) uniqNo.set(k, { ...x, districts: new Set(), wheres: new Set() });
  uniqNo.get(k).districts.add(x.district);
  uniqNo.get(k).wheres.add(x.where);
}
P(`ユニーク（名前×住所） **${uniqNo.size}件** ← §19-5 の 146件と比べるのはこちら`);
const uw = {};
for (const v of uniqNo.values()) {
  // 1件が複数市町村で別の行き先になることがある。**強いほうを採る**（IN_DATA > MISSING > 落選）
  const w = v.wheres.has('IN_DATA') ? 'IN_DATA' : v.wheres.has('MISSING') ? 'MISSING' : [...v.wheres][0];
  uw[w] = (uw[w] || 0) + 1;
}
for (const [k, v] of Object.entries(uw).sort((a, b) => b[1] - a[1])) P(`  ${k.padEnd(24)} ${String(v).padStart(4)}`);
// ソース別（同じ一覧が何回数えられているか）
const bySrc = {};
for (const x of allNo) bySrc[x.sourceId] = (bySrc[x.sourceId] || 0) + 1;
P('  ソース別（延べ。同じ一覧を複数市町村で使うと重複する）:');
for (const [k, v] of Object.entries(bySrc).sort((a, b) => b[1] - a[1]).slice(0, 8)) P(`    ${k.padEnd(30)} ${String(v).padStart(4)}`);

/* ── 126件（どの地区にも入らない項目）────────────────────────────
 * **3つの範囲で数える。**
 *   a. 凍結76地区（基準線が想定していた範囲）
 *   b. 旧 --all が実際に回した地区（needsVerify の絞り込みつき）← §20-11
 *   c. 案C後の18市区町村
 */
(async () => {
  const records = I.loadRecords();
  const frozen76 = SNAP.rows.map(r => r.district);
  const oldAll = [...new Set(records.filter(x => x.needsVerify).map(r => r.address && I.districtKey(r.address)).filter(Boolean))];

  const parse = list => list.map(d => { try { return I.parseDistrict(d); } catch { return null; } }).filter(Boolean);
  const scopes = {
    'a. 凍結76地区（大字単位）': parse(frozen76),
    'b. 旧 --all が実際に回した地区（needsVerify で絞られた分）': parse(oldAll),
    'c. 案C後の18市区町村': parse(MUNIS),
  };

  const collectedByMuni = new Map();
  for (const m of MUNIS) {
    const { sources } = I.sourcesFor(m, records);
    const c = [];
    for (const s of sources) c.push(await I.collectSource(s, { useCache: true }));
    collectedByMuni.set(m, c);
  }

  P('');
  P('─ どの地区にも入らない項目（§19-5 の「126件」）' + '─'.repeat(30));
  P(`  b の地区数: ${oldAll.length}（**旧 --all が実際に回していた数。76ではない**）`);
  const outOf = {};
  for (const [label, ds] of Object.entries(scopes)) {
    const orphan = new Map();
    for (const [muni, collected] of collectedByMuni) {
      const muniD = I.parseDistrict(muni);
      for (const c of collected) for (const it of c.items) {
        if (!it.address) continue;
        if (!I.inDistrict(it.address, muniD)) continue;
        if (ds.some(p => I.inDistrict(it.address, p))) continue;
        orphan.set(it.name + '|' + it.address, { name: it.name, addr: it.address, muni });
      }
    }
    outOf[label] = [...orphan.values()];
    P(`  ${label.padEnd(52)} **${orphan.size}件**`);
  }

  /* a の126件が、案C後に判定として出てきたか */
  const missingNames = new Set(rows.flatMap(r => r.missing.map(n => sweepNormalizeName(n) || n)));
  const inDataNames = new Set(); // IN_DATA はデータ側の id しか md に無いので名前では追えない
  const a = outOf['a. 凍結76地区（大字単位）'] || [];
  const surfaced = a.filter(o => missingNames.has(sweepNormalizeName(o.name) || o.name));
  P('');
  P(`  ★ a の ${a.length}件のうち、案C後に **MISSING として出たのは ${surfaced.length}件**（${pct(surfaced.length, a.length)}）`);
  P(`     残り ${a.length - surfaced.length}件は IN_DATA に吸収されたか、名寄せで別バケットに入ったか、`);
  P('     b1/b2 に落ちている。**「出なかった＝穴が残った」ではない**ので、内訳を見ること。');

  fs.writeFileSync(path.join(__dirname, '.after-planc.json'), JSON.stringify({
    rows: rows.map(r => ({ district: r.district, missing: r.missing.length, inData: r.sum.IN_DATA ?? r.inData.length, orphan: r.sum.ORPHAN ?? r.orphan.length, b1: r.b1, b2: r.b2, b2other: r.b2other, oza: r.oza })),
    totMissing, uniq: uniq.size, totIn, totOrphan, confTot, overlaps, totB1, totB2, totB2other,
    oza: oz, noOazaTotal: allNo.length, noOazaUniq: uniqNo.size, noOazaByWhere: byWhere, noOazaUniqByWhere: uw,
    gap: Object.fromEntries(Object.entries(outOf).map(([k, v]) => [k, v.length])),
    gapSurfaced: surfaced.length,
    oldAllDistricts: oldAll.length,
  }, null, 1), 'utf8');
  P('');
  P('→ scripts/.after-planc.json');
})();
