/**
 * `IN_DATA` になっているのに、突合相手のレコードと**番地が違う**ものを並べる検査。
 *
 * ## これは判定ではない
 *
 * **`status` も `IN_DATA`/`MISSING` も1件も変えない。人が見るリストを出すだけ。**
 * `district-sweep.js` の `ORPHAN` と同じ扱いで、**単独で判断材料にしない**。
 * ここに出たから別施設、出ないから同一施設、のどちらでもない。
 *
 * ## なぜ要るか（§19-6）
 *
 * 富士宮市猪之頭で `ペンギン村オートキャンプ場` が `朝霧高原グリーンパーク`（猪之頭1050）に
 * 名前で突合し、**IN_DATA＝掲載済みに化けていた。**別施設で、しかも同じバケットに
 * `朝霧高原もちや`（1114-1）と `朝霧高原オート`（2071）まで吸われていた。
 * **大字は全部「猪之頭」で同じなので、大字で比べても0件。番地まで見て初めて出る。**
 *
 * ## 誤検出率は実測してある（§6-20）
 *
 * **素の一覧7件のうち4件は無害な表記ゆれだった（誤検出率 4/7 ≒ 57%）。**
 * 無害の型が分かったので**別セクションに寄せる**が、**消さない**
 * （寄せる規則自体が間違っている可能性があるので、人が両方見る）。
 *
 * 実行: `node scripts/banchi-mismatch-check.js`（キャッシュのみ。`data/` への書き込みなし）
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES, _internal: I } = require('./district-sweep.js');

const OUT = path.join(__dirname, 'banchi-mismatch-2026-08.md');
const SKIP = /^(all-districts|summary|control|control-vs-needsverify|l1-coverage|yamanashi-east|tsuru)/;

const districts = fs.readdirSync(__dirname)
  .map(f => (f.match(/^sweep-(.+)\.md$/) || [])[1]).filter(Boolean).filter(d => !SKIP.test(d)).sort();
const muniOf = n => Object.keys(MUNI_SOURCES).find(m => n.startsWith(m) || n.includes(m));
const oazaOf = a => { const p = I.splitAddress(a); return p && p.city ? p.city + (p.oaza || '') : null; };
const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** 番地キーから数字部分だけ取り出す（`白州町白須8813-2` → `8813-2`） */
const digitsOf = k => { const m = /([\d-]+)$/.exec(String(k || '')); return m ? m[1].replace(/-+$/, '') : null; };

/**
 * 2つの番地が「無害な差」か。**同一施設でよく出る2つの型だけを無害とする。**
 *
 *   完全一致            `2124` と `2124`（大字の表記だけ違う。平久保 / 平久保山）
 *   ハイフン境界の包含   `8813` と `8813-2`、`807` と `807-2`（枝番の有無）
 *
 * **「近い数字」は無害にしない。**`624-7` と `610`、`672` と `614-171` は別の番地。
 */
function harmlessBanchi(a, b) {
  const x = digitsOf(a), y = digitsOf(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [s, l] = x.length <= y.length ? [x, y] : [y, x];
  return l.startsWith(s + '-');
}

/** 大字の差が「片方が他方を含むだけ」か（`道志村` と `道志村長又`、`平久保` と `平久保山`） */
function harmlessOaza(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.startsWith(b) || b.startsWith(a);
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

  const rows = [];
  for (const d of districts) {
    const muni = muniOf(d);
    if (!muni) continue;
    const { district } = I.sourcesFor(d, records);
    const merged = I.mergeItems(collectedByMuni.get(muni), district);
    const { results } = I.classify(merged, records, district);

    for (const r of results) {
      if (r.kind !== 'IN_DATA' || r.matchedBy !== '名前') continue;
      if (!r.record || !r.record.address || !r.bucket || !r.bucket.addresses.length) continue;

      const recOaza = oazaOf(r.record.address), recBan = I.banchiKey(r.record.address);
      const bOazas = [...new Set(r.bucket.addresses.map(oazaOf).filter(Boolean))];
      const bBans = [...new Set(r.bucket.addresses.map(I.banchiKey).filter(Boolean))];
      if (!recBan || !bBans.length) continue;              // 片方欠けは対象外
      if (bBans.includes(recBan)) continue;                // 一致しているものは出さない

      const oazaDiff = !!(recOaza && bOazas.length && !bOazas.includes(recOaza));
      // **無害の判定は番地でする。**大字だけ包含関係でも、番地が別なら別施設でありうる
      const harmless = bBans.some(b => harmlessBanchi(recBan, b));
      rows.push({
        d, muni, bucket: r.bucket.name, rec: r.record,
        recOaza, recBan, bOazas, bBans, oazaDiff, harmless,
        oazaHarmless: bOazas.some(o => harmlessOaza(recOaza, o)),
        aliases: [...r.bucket.aliases],
        urls: [...new Map(r.bucket.hits.filter(h => h.url).map(h => [h.url, h])).values()]
          .map(h => `${h.sourceId} ${h.url}`),
      });
    }
  }

  const uniq = [...new Map(rows.map(x => [x.muni + '|' + x.bucket + '|' + x.rec.id, x])).values()]
    .sort((a, b) => Number(b.oazaDiff) - Number(a.oazaDiff) || a.muni.localeCompare(b.muni));
  const suspect = uniq.filter(x => !x.harmless);
  const benign = uniq.filter(x => x.harmless);

  /* ---- 偽ゼロ検証（両方向）。**md にも出す** ---- */
  const selfTest = [
    { label: 'ペンギン村（猪之頭2351等 vs 1050）が**疑わしい側**に出る',
      ok: suspect.some(x => /ペンギン村/.test(x.bucket)) },
    { label: 'ペンギン村が無害側に落ちていない',
      ok: !benign.some(x => /ペンギン村/.test(x.bucket)) },
    { label: '青根（807 vs 807-2）が**無害側**に寄っている',
      ok: benign.some(x => /青根/.test(x.bucket)) },
    { label: '青根が疑わしい側に残っていない',
      ok: !suspect.some(x => /青根/.test(x.bucket)) },
  ];
  const failed = selfTest.filter(t => !t.ok);

  const L = [];
  L.push('# IN_DATA なのに突合相手と番地が違うもの — 2026-08');
  L.push('');
  if (failed.length) {
    L.push(`> **❌ 自己診断が ${failed.length}件 落ちている。この一覧を読む前に検査を直すこと。**`);
    L.push('');
  }
  L.push('> **⚠ この検査は半分が無害。全部人が見る前提。**');
  L.push('> **素の一覧7件のうち4件は表記ゆれで同一施設だった（誤検出率 4/7 ≒ 57%・2026-08-15 実測）。**');
  L.push('> 無害の型が分かったので下に分けてあるが、**寄せる規則自体が間違っている可能性があるので消していない。**');
  L.push('>');
  L.push('> **さらに、残った3件を人が当たったら1件（`朝霧CampBaseそらいろ`）も誤検出だった。**');
  L.push('> 公式サイト（sorairo-camp.jp）の住所は `麓624-7` でレコードと一致し、**ソース側（hinata）の');
  L.push('> `麓朝霧610` が誤り**だった。電話番号は一致。**通しの誤検出率は 5/7。**');
  L.push('> **この検査は「別施設だ」と言っていない。「番地が食い違っている」としか言っていない。**');
  L.push('');
  L.push(`実行: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}　/　\`node scripts/banchi-mismatch-check.js\``);
  L.push(`対象: ${districts.length}地区 / ${collectedByMuni.size}市町村`);
  L.push('');
  L.push('**これは判定ではない。**`status` も `IN_DATA`/`MISSING` も1件も変えていない。');
  L.push('`district-sweep.js` の `ORPHAN` と同じ扱いで、**単独で判断材料にしない。**');
  L.push('ここに出たから別施設、出ないから同一施設、のどちらでもない。');
  L.push('');
  L.push('**大字は同じで番地だけ違う型が本命。**§19-6 の `ペンギン村` はこれで、');
  L.push('大字（猪之頭）で比べると0件になる。**番地まで見て初めて出る。**');
  L.push('');
  L.push(`| | 件数 |`);
  L.push(`|---|---:|`);
  L.push(`| 素の一覧 | ${uniq.length} |`);
  L.push(`| **人が見る（無害の型に当てはまらない）** | **${suspect.length}** |`);
  L.push(`| 無害に寄せた（表記ゆれ・枝番） | ${benign.length} |`);
  L.push('');

  const table = (list, title, note) => {
    L.push(`## ${title}`);
    L.push('');
    if (note) { L.push(note); L.push(''); }
    if (!list.length) { L.push('なし。'); L.push(''); return; }
    L.push('| 地区 | バケット | 突合したレコード | レコードの番地 | ソース側の番地 | 大字 |');
    L.push('|---|---|---|---|---|---|');
    for (const x of list) {
      L.push(`| ${esc(x.d)} | ${esc(x.bucket)} | \`${esc(x.rec.id)}\` ${esc(x.rec.name)} | ${esc(x.recBan)} | ${esc(x.bBans.join(' / '))} | ${x.oazaDiff ? '**違う**' : '同じ'} |`);
    }
    L.push('');
    for (const x of list) {
      L.push(`- **${esc(x.bucket)}** — バケットの別名: ${esc(x.aliases.join(' / '))}`);
      for (const u of x.urls) L.push(`  - ${esc(u)}`);
    }
    L.push('');
  };

  table(suspect.filter(x => x.oazaDiff), '1. 大字が違う（人が見る）',
    '**大字が違うほうが疑わしい。**ただし実測では、大字違いでも `道志村` 対 `道志村長又` のように' +
    '**ソース側が大字を書いていないだけ**のことがある。番地で無害と判定できたものは §3 に寄せてある。');
  table(suspect.filter(x => !x.oazaDiff), '2. 大字は同じで番地が違う（人が見る）',
    '**§19-6 の型はここ。**同じ大字の中の別施設が名前で突合している可能性がある。');

  L.push('## 3. 無害に寄せたもの（消していない）');
  L.push('');
  L.push('**同一施設でよく出る2つの型だけを無害とした。**');
  L.push('');
  L.push('| 型 | 例 |');
  L.push('|---|---|');
  L.push('| 番地が完全一致（大字の表記だけ違う） | `平久保2124` と `平久保山2124` |');
  L.push('| ハイフン境界の包含（枝番の有無） | `8813` と `8813-2` / `807` と `807-2` |');
  L.push('');
  L.push('**「近い数字」は無害にしない。**`624-7` と `610`、`672` と `614-171` は別の番地。');
  L.push('');
  if (!benign.length) L.push('なし。');
  else {
    L.push('| 地区 | バケット | 突合したレコード | レコードの番地 | ソース側の番地 |');
    L.push('|---|---|---|---|---|');
    for (const x of benign) {
      L.push(`| ${esc(x.d)} | ${esc(x.bucket)} | \`${esc(x.rec.id)}\` ${esc(x.rec.name)} | ${esc(x.recBan)} | ${esc(x.bBans.join(' / '))} |`);
    }
  }
  L.push('');

  L.push('## 4. 自己診断（答えが分かっている入力）');
  L.push('');
  L.push('**両方向で見る。**片側だけだと、規則が効きすぎても効かなすぎても気づけない（§18-3）。');
  L.push('');
  L.push('| 期待 | 結果 |');
  L.push('|---|---|');
  for (const t of selfTest) L.push(`| ${t.label} | ${t.ok ? '✅ PASS' : '**❌ FAIL**'} |`);
  L.push('');
  L.push(failed.length
    ? '> **❌ FAIL がある。**規則が効きすぎている（本物を無害に寄せた）か、効いていない（無害を残した）。'
    : '> ✅ 両方向とも通った。');
  L.push('');

  fs.writeFileSync(OUT, L.join('\n'), 'utf8');
  console.log(`→ ${OUT}`);
  console.log(`素の一覧 ${uniq.length} / 人が見る ${suspect.length} / 無害に寄せた ${benign.length}`);
  for (const t of selfTest) console.log(`  ${t.ok ? '✅' : '❌'} ${t.label.replace(/\*\*/g, '')}`);
  if (failed.length) process.exitCode = 1;
})();
