/**
 * `sweep-{地区}.md`（`district-sweep.js` の出力）の冒頭の集計表から
 * **MISSING / IN_DATA / ORPHAN / データ側のレコード数**を読む共通パーサ。
 *
 * ## なぜ共通化するか — §18-3 の3回目
 *
 * `dropped-buckets-all.js` の §5 はこの4つを**アンカーの無い正規表現**で読んでいた。
 *
 * ```js
 * md.match(/\|\s*IN_DATA[^|]*\|\s*(\d+)\s*\|/)   // ← ファイル内で最初に当たった表を採る
 * ```
 *
 * `sweep-都留市.md` に人が**引用ブロックで手書きの差分表**を足した。
 * 本物の集計表（58行目 `| IN_DATA（両方にある） | 2 |`）より前に
 * 28行目 `> | IN_DATA | 3 | **2** |` があるので、**先に 3 を拾った。**
 * 結果、実際は一致しているのに **❌ 不一致**が出た。
 *
 * **MISSING が正しく取れていたのは偶然。**旧実装はラベルに太字（アスタリスク2つ）を
 * 要求していて、手書き表の `| MISSING | 8 | 9 |` はラベルが太字でなかったので
 * たまたま当たらなかっただけ。**書式の偶然に頼っていた**ので、ここでは太字依存をやめて
 * 3つとも同じ規則で読む。
 *
 * ## 規則
 *
 * 1. `## 見出し` で節に切る（`md-sections.js`）。**行頭 `>` の引用ブロックは除外。**
 * 2. MISSING・IN_DATA・ORPHAN の3ラベルを**すべて**持つ表だけを候補にする。
 * 3. **候補が0個 or 2個以上なら数字を返さず `PARSE_ERROR` で落とす。**
 *    黙って1つ目を採るのが今回の事故そのもの。
 * 4. 値の列は**ヘッダ行のラベル**（`件数`）から決める。列位置は焼き込まない
 *    （`lib/address-check-md.js` と同じ型）。
 * 5. ラベルも値も `**` を剥がしてから見る。
 *
 * ## 返り値
 *
 *   { ok: true,  values: {MISSING, IN_DATA, ORPHAN, RECORDS}, at: {...}, dataStamp }
 *   { ok: false, error: 'PARSE_ERROR', reason, at: {...} }
 *
 * `at` は**どこを読んだか**（節名・表の開始行・各値の行番号）。
 * **出力に必ず書くこと。**読んだ場所が出ていないと、正しい表を読んだのか
 * デコイを読んだのかを人が検証できない（今回それができなかった）。
 */
const fs = require('fs');
const { splitH2Sections, dropBlockquotes, tablesIn } = require('./md-sections');

const LABELS = { MISSING: 'MISSING', IN_DATA: 'IN_DATA', ORPHAN: 'ORPHAN' };
const RECORD_LABEL = 'データ側のこの地区のレコード';

/** `**MISSING**（実在側にあるがデータに無い）` → `MISSING` */
const unbold = s => String(s == null ? '' : s).replace(/\*\*/g, '').trim();

function labelOf(cell) {
  const t = unbold(cell);
  for (const k of Object.keys(LABELS)) if (t.startsWith(k)) return k;
  if (t.startsWith(RECORD_LABEL)) return 'RECORDS';
  return null;
}

/** `**9**` → 9。数字でなければ null */
function numOf(cell) {
  const m = /^(\d+)$/.exec(unbold(cell));
  return m ? Number(m[1]) : null;
}

function readSummary(mdPath) {
  let text;
  try {
    text = fs.readFileSync(mdPath, 'utf8');
  } catch (e) {
    return { ok: false, error: 'PARSE_ERROR', reason: `md が読めない: ${e.message}`, at: null };
  }

  // 候補の表を全節から集める。**1つに絞れなければ落とす**ので、先に全部数える
  const candidates = [];
  for (const sec of splitH2Sections(text)) {
    for (const t of tablesIn(dropBlockquotes(sec.lines))) {
      const found = new Map();
      for (const r of t.rows) {
        const k = labelOf(r.cells[0]);
        if (k && !found.has(k)) found.set(k, r);
      }
      if (['MISSING', 'IN_DATA', 'ORPHAN'].every(k => found.has(k))) {
        candidates.push({ section: sec.heading, level: sec.level, sectionStart: sec.startLine, table: t, found });
      }
    }
  }

  // 見出しは**直近のもの**（レベルは問わない）。`###` で切れた節に表があることもあるので、
  // 「`##` の節名」と言い切らずに、実際に手前にあった見出しをそのまま出す
  const nameOf = c => (c.section === null ? '(冒頭・見出しより前)' : `${'#'.repeat(c.level)} ${c.section}`);
  const where = candidates.map(c => `${nameOf(c)} の ${c.table.startLine}行目`);
  if (candidates.length === 0) {
    return { ok: false, error: 'PARSE_ERROR', at: null,
      reason: 'MISSING / IN_DATA / ORPHAN を揃って持つ表が引用ブロックの外に1つも無い。**書式が変わった疑い**（§18-3）' };
  }
  if (candidates.length > 1) {
    return { ok: false, error: 'PARSE_ERROR', at: { candidates: where },
      reason: `候補の表が ${candidates.length}個ある（${where.join(' / ')}）。**どれが集計表か決められないので数字を返さない。**` +
        '黙って1つ目を採るのが §18-3 の事故そのもの' };
  }

  const c = candidates[0];
  const sectionName = nameOf(c);

  // 値の列はヘッダ行のラベルから決める。ヘッダ = ラベル列が空 or `件数` を含む行
  const header = c.table.rows.find(r => r.cells.some(x => unbold(x).includes('件数')));
  if (!header) {
    return { ok: false, error: 'PARSE_ERROR', at: { section: sectionName, table: c.table.startLine },
      reason: `${sectionName} の ${c.table.startLine}行目の表に「件数」列が無い。列位置は焼き込まないので、ヘッダが変わったら読まない` };
  }
  const col = header.cells.findIndex(x => unbold(x).includes('件数'));

  const values = {};
  const at = { section: sectionName, table: c.table.startLine, header: header.n, rows: {} };
  for (const [k, row] of c.found) {
    const v = numOf(row.cells[col]);
    if (v === null) {
      return { ok: false, error: 'PARSE_ERROR', at,
        reason: `${sectionName} の ${row.n}行目 ${k} の「件数」列が数字でない（\`${row.cells[col]}\`）` };
    }
    values[k] = v;
    at.rows[k] = row.n;
  }

  return { ok: true, values, at, dataStamp: readDataStamp(text) };
}

/**
 * `district-sweep.js` が書く**データ鮮度の記録**を読む。
 *
 * 数が合わない理由は2つあって、**混ぜると本物のバグが drift に埋もれる。**
 *
 *   - データが変わった（この md を作ったあとに campgrounds.json が動いた）→ 再sweepすれば直る
 *   - 判定が変わった（同じデータなのに数が違う）→ **バグ**
 *
 * 記録が無い古い md（この行を入れる前に生成したもの）は `null` を返す。
 * **その場合は「一致しない＝バグ」と断定できない。**呼び出し側は ❌ ではなく
 * 「判定不能」として扱うこと。
 */
function readDataStamp(text) {
  for (const sec of splitH2Sections(text)) {
    for (const l of dropBlockquotes(sec.lines)) {
      const m = /データ:\s*`data\/campgrounds\.json`\s*(\d+)件\s*\/\s*最終更新\s*([0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9:]+)/.exec(l.text);
      if (m) return { count: Number(m[1]), mtime: m[2].replace('T', ' '), line: l.n };
    }
  }
  return null;
}

module.exports = { readSummary, readDataStamp };
