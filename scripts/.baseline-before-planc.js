/**
 * **案C実装前の基準線。**実装後にこれと比べる。
 *
 * **ネットを踏まない。**`sweep-*.md` と `data/campgrounds.json` と
 * 既存の監査 md から数字を集めるだけ。判定も実装も変えない。
 *
 *   node scripts/.baseline-before-planc.js            # 検証（既定）
 *   node scripts/.baseline-before-planc.js --freeze   # 凍結し直す（**明示的にのみ**）
 *
 * ## ★ 対象は「凍結した76本」に固定してある（2026-08-16）
 *
 * 以前は `sweep-*.md` を**その場のディレクトリから全部拾って**いた。
 * これだと**新しい地区 md が1本増えるだけで基準線が動く。**実際に踏んだ:
 * 「内」バグの確認で `--district` を1回走らせたら
 * `sweep-榛原郡川根本町犬間長島公園.md` ができて **77地区・ORPHAN 48→49** になった。
 *
 * **案Cは 18本の `sweep-<市町村>.md` を新しく作る。**拾い方が「全部」のままだと、
 * **実装した瞬間に基準線が案C後の数字に置き換わり、比較する相手が消える。**
 *
 * そこで **`.baseline-before-planc.json` に入っている76本の地区名を対象リストとして使う。**
 * このファイルが**凍結の実体**で、スクリプトは既定ではそれを**読むだけ**。
 * 増えた md は**無視する**（ドリフトにしない）。
 * 凍結し直すのは `--freeze` を付けたときだけ。
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES, _internal: I, sweepNormalizeName } = require('./district-sweep.js');

const SKIP = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;
const OUT = path.join(__dirname, 'baseline-before-planc-2026-08-16.md');
const SNAP = path.join(__dirname, '.baseline-before-planc.json');
const FREEZE = process.argv.includes('--freeze');

/** sweep md から MISSING/IN_DATA/ORPHAN を読む */
function readSweep(file) {
  const body = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const sec = h => body.split('\n## ').find(x => x.startsWith(h));
  const missing = [...(sec('MISSING') || '').matchAll(/^### \d+\.\s*(.+)$/gm)].map(m => m[1].trim());
  const conf = [...(sec('MISSING') || '').matchAll(/\*\*confidence\*\*:\s*(HIGH|MID|LOW)/g)].map(m => m[1]);
  const orphan = [...(sec('ORPHAN') || '').matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(m => m[1]);
  const inData = [...(sec('IN_DATA') || '').matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(m => m[1]);
  // 冒頭のサマリ表からも拾う（節の書式が違う版があるため）
  const sum = {};
  for (const [, k, v] of body.matchAll(/^\|\s*\*?\*?(MISSING|IN_DATA|ORPHAN)[^|]*\|\s*\*?\*?(\d+)/gm)) sum[k] = Number(v);
  return { missing, conf, orphan, inData, sum };
}

/** 凍結スナップショット（あれば）。**これが対象リストの実体。** */
const snap = fs.existsSync(SNAP) ? JSON.parse(fs.readFileSync(SNAP, 'utf8')) : null;

/**
 * 対象の地区名を決める。
 *
 * - 凍結済み（既定） … スナップショットの76本**だけ**を見る。**増えた md は無視する**
 * - `--freeze`      … いまディレクトリにある sweep-*.md から**作り直す**
 */
let districtNames;
if (snap && !FREEZE) {
  districtNames = snap.rows.map(r => r.district);
} else {
  districtNames = fs.readdirSync(__dirname)
    .filter(f => /^sweep-.+\.md$/.test(f) && !SKIP.test(f.replace(/^sweep-|\.md$/g, '')))
    .map(f => f.replace(/^sweep-|\.md$/g, ''));
}

/** 凍結対象なのにファイルが消えている＝これはドリフト（無視しない） */
const gone = districtNames.filter(d => !fs.existsSync(path.join(__dirname, `sweep-${d}.md`)));

const rows = districtNames
  .filter(d => !gone.includes(d))
  .map(d => ({ district: d, ...readSweep(`sweep-${d}.md`) }))
  .sort((a, b) => a.district.localeCompare(b.district, 'ja'));

const totMissing = rows.reduce((a, r) => a + r.missing.length, 0);
const totOrphan = rows.reduce((a, r) => a + (r.sum.ORPHAN ?? r.orphan.length), 0);
const totIn = rows.reduce((a, r) => a + (r.sum.IN_DATA ?? r.inData.length), 0);
const confTot = rows.flatMap(r => r.conf).reduce((m, c) => (m[c] = (m[c] || 0) + 1, m), {});

/** 地区キーの構造 */
const parsed = new Map();
for (const r of rows) { try { parsed.set(r.district, I.parseDistrict(r.district)); } catch { } }
const muniKeyOf = d => { const p = parsed.get(d); return p ? (p.gun || '') + p.city + (p.ward || '') : null; };
const overlaps = [];
for (const a of rows) for (const b of rows) {
  const pa = parsed.get(a.district), pb = parsed.get(b.district);
  if (a === b || !pa || !pb || muniKeyOf(a.district) !== muniKeyOf(b.district)) continue;
  const oa = pa.oaza || '', ob = pb.oaza || '';
  if (ob.startsWith(oa) && oa.length < ob.length) overlaps.push([a.district, b.district]);
}

/** ユニーク（市区町村 × 正規化名） */
const flat = rows.flatMap(r => r.missing.map(n => ({ d: r.district, key: muniKeyOf(r.district) + '|' + (sweepNormalizeName(n) || n) })));
const uniq = new Set(flat.map(x => x.key));

/** データ側 */
const recs = I.loadRecords();
const byStatus = recs.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});

/** 既存の監査 md から数字を引く（あれば） */
/** dropped-buckets-all の §4 の地区表だけを合計する（§4-1 のソース表を巻き込まない） */
function sumB2() {
  const p = path.join(__dirname, 'dropped-buckets-all-2026-08.md');
  if (!fs.existsSync(p)) return { tot: '?', other: '?', same: '?' };
  const sec = (fs.readFileSync(p, 'utf8').split('\n## ').find(x => x.startsWith('4. b2')) || '').split('\n### 4-1')[0];
  let tot = 0, other = 0, same = 0;
  for (const m of sec.matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|/gm)) {
    tot += +m[2]; other += +m[3]; same += +m[4];
  }
  return { tot, other, same };
}

function grab(file, re) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, 'utf8').match(re);
  return m ? m[1] : null;
}

const L = [];
L.push('# 案C実装前の基準線 — 2026-08-16');
L.push('');
L.push('**実装後にこれと比べる。**ネットを踏まずに、既存の `sweep-*.md` と `data/campgrounds.json` から集めた。');
L.push('');
L.push('生成: `node scripts/.baseline-before-planc.js`');
L.push('');
L.push('## 1. 全体');
L.push('');
L.push('| | 値 |');
L.push('|---|---:|');
L.push(`| 地区数（sweep md） | **${rows.length}** |`);
L.push(`| MUNI_SOURCES のキー数 | **${Object.keys(MUNI_SOURCES).length}** |`);
L.push(`| 地区キーを市区町村に畳んだ数（区を分ける） | **${new Set(rows.map(r => muniKeyOf(r.district)).filter(Boolean)).size}** |`);
L.push(`| **MISSING（延べ）** | **${totMissing}** |`);
L.push(`| MISSING（ユニーク: 市区町村×正規化名） | **${uniq.size}** |`);
L.push(`| 差（重複） | ${totMissing - uniq.size} |`);
L.push(`| IN_DATA | ${totIn} |`);
L.push(`| ORPHAN | ${totOrphan} |`);
L.push(`| confidence HIGH / MID / LOW | ${confTot.HIGH || 0} / ${confTot.MID || 0} / ${confTot.LOW || 0} |`);
L.push(`| 包含関係のある地区ペア | **${overlaps.length}** 組 |`);
L.push('');
L.push('### データ側');
L.push('');
L.push(`レコード ${recs.length}件 — ` + Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(' / '));
L.push('');
L.push('## 2. 他の監査からの基準値');
L.push('');
L.push('| 指標 | 値 | 出典 |');
L.push('|---|---:|---|');
const b2 = sumB2();
L.push(`| **b2（地区外の項目・延べ）** | **${b2.tot}** | dropped-buckets-all-2026-08.md §4 |`);
L.push(`| うち市区町村も違う | ${b2.other} | 同上 |`);
L.push(`| **うち市は同じで大字が違う**（案Cで効く分） | **${b2.same}** | 同上 |`);
L.push('| **126件**（どの登録地区にも入らない住所） | 126 | §19-5 / `.audit-district-gap.js` |');
L.push(`| banchi-mismatch 素の一覧 | ${grab('banchi-mismatch-2026-08.md', /素の一覧 \| (\d+)/) || '?'} | banchi-mismatch-2026-08.md |`);
L.push(`| うち人が見る（無害でない） | ${grab('banchi-mismatch-2026-08.md', /人が見る[^|]*\| \*\*(\d+)/) || '?'} | 同上 |`);
L.push('');
L.push('> **b2 と banchi-mismatch は md からの抽出。**書式が変わっていたら再計算すること。');
L.push('> 126件は §19-5 の実測値（`.audit-district-gap.js` を再実行すれば出る）。');
L.push('');
L.push('## 3. 包含関係のある地区ペア（案Cで消える）');
L.push('');
L.push('| 広い地区 | 狭い地区 |');
L.push('|---|---|');
overlaps.forEach(([a, b]) => L.push(`| ${a} | ${b} |`));
L.push('');
L.push('## 4. 地区別（全' + rows.length + '地区）');
L.push('');
L.push('| 地区 | MISSING | IN_DATA | ORPHAN |');
L.push('|---|---:|---:|---:|');
for (const r of rows) {
  L.push(`| ${r.district} | ${r.missing.length} | ${r.sum.IN_DATA ?? r.inData.length} | ${r.sum.ORPHAN ?? r.orphan.length} |`);
}
L.push('');
L.push('## 5. 実装後に確かめること');
L.push('');
L.push('- 地区数が **' + rows.length + ' → 18**（MUNI_SOURCES のキー単位）になる');
L.push('- **包含ペアが ' + overlaps.length + ' → 0**');
L.push('- MISSING のユニークが **' + uniq.size + ' から大きく減らない**（減ったら検出力が落ちている）');
L.push('- **126件**が0に近づく（地区がレコード由来でなくなるため）');
L.push('- 大字検査が**5件前後**出る（§19-5。判定には使わない）');

const nextSnap = {
  rows: rows.map(r => ({ district: r.district, missing: r.missing.length, names: r.missing, inData: r.sum.IN_DATA ?? r.inData.length, orphan: r.sum.ORPHAN ?? r.orphan.length })),
  totMissing, uniq: uniq.size, totIn, totOrphan, confTot, overlaps,
};

// **md とスナップショットを書き換えるのは `--freeze` のときだけ。**
// 既定は読むだけ。案C実装後にうっかり走らせても、比較する相手が消えない
if (FREEZE || !snap) {
  fs.writeFileSync(OUT, L.join('\n') + '\n', 'utf8');
  fs.writeFileSync(SNAP, JSON.stringify(nextSnap, null, 1), 'utf8');
  console.log(snap ? '**凍結し直した**（--freeze）' : '初回なので凍結した');
}

console.log(`地区 ${rows.length} / MISSING 延べ ${totMissing} / ユニーク ${uniq.size} / IN_DATA ${totIn} / ORPHAN ${totOrphan}`);
console.log(`包含ペア ${overlaps.length} 組 / confidence HIGH ${confTot.HIGH || 0} MID ${confTot.MID || 0} LOW ${confTot.LOW || 0}`);
if (FREEZE || !snap) console.log('→ ' + path.relative(path.join(__dirname, '..'), OUT) + ' を書いた');
else console.log('（検証モード。**md もスナップショットも書いていない**）');
/* ── ドリフト検出 ──────────────────────────────────────
 *
 * **鳴らしたいもの**: 凍結した76本の**中身が変わった** / **消えた**
 * **鳴らしたくないもの**: 案Cが作る18本のような**新しい md が増えただけ**
 *
 * 前者は比較の土台が壊れたということ。後者は正常な前進。
 */
if (snap && !FREEZE) {
  const drift = [];
  if (gone.length) drift.push(`凍結した地区 md が消えている: ${gone.join(' / ')}`);

  const was = new Map(snap.rows.map(r => [r.district, r]));
  for (const r of rows) {
    const w = was.get(r.district);
    if (!w) continue;
    const now = { missing: r.missing.length, inData: r.sum.IN_DATA ?? r.inData.length, orphan: r.sum.ORPHAN ?? r.orphan.length };
    for (const k of ['missing', 'inData', 'orphan']) {
      if (w[k] !== now[k]) drift.push(`${r.district} の ${k}: 凍結 ${w[k]} / 実際 ${now[k]}`);
    }
  }
  for (const [k, label] of [['totMissing', 'MISSING 延べ'], ['totIn', 'IN_DATA'], ['totOrphan', 'ORPHAN']]) {
    const now = { totMissing, totIn, totOrphan }[k];
    if (snap[k] !== now) drift.push(`${label}: 凍結 ${snap[k]} / 実際 ${now}`);
  }
  if (snap.uniq !== uniq.size) drift.push(`ユニーク: 凍結 ${snap.uniq} / 実際 ${uniq.size}`);
  if (snap.overlaps.length !== overlaps.length) drift.push(`包含ペア: 凍結 ${snap.overlaps.length} / 実際 ${overlaps.length}`);

  if (drift.length) {
    console.error('\n⚠ **基準線がずれている。**案C実装前の凍結値と中身が違う:');
    drift.forEach(d => console.error('   ' + d));
    console.error('\n   **凍結76本のどれかが書き換わっている。**案Cの比較の土台が壊れているので、');
    console.error('   直してから進むこと。意図して凍結し直すなら --freeze。');
    process.exitCode = 1;
  } else {
    console.log(`凍結76本と一致（新しく増えた sweep md は無視した）`);
  }
}
