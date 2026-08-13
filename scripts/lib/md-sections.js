/**
 * 再生成されるレポート md の中で、**手で書き足した節を壊さずに残す**ための小物。
 *
 * ## なぜ要るか
 *
 * `address-check-2026-08.md` は3つの出所が混ざっている。
 *
 * | 範囲 | 誰が書くか |
 * |---|---|
 * | 冒頭〜`## MATCH` | `verify-address-gsi.js` が毎回作り直す |
 * | `# D-1.5.` | `classify-oaza-miss.js` が毎回作り直す |
 * | `# D-2.` `# D-3.` | **人が手で書いた。再生成の対象ではない** |
 *
 * ところが両スクリプトとも「自分が作る範囲より後ろ」を考慮していなかった。
 *
 * - `classify-oaza-miss.js` … `md.split(/# D-1\.5\./)[0] + 新しい節` と書き戻していたので、
 *   **D-1.5 より後ろにある D-2・D-3 が丸ごと消えていた**（実測 15,115字）
 * - `verify-address-gsi.js` … md 全体を作り直していたので、
 *   **D-1.5・D-2・D-3 がまとめて消えていた**
 *
 * どちらも実行するまで気づけない。**再生成するスクリプトは、
 * 自分の担当範囲だけを差し替えて、それ以外は1文字も触らないこと。**
 *
 * ## 節の切れ目
 *
 * 追記された節は必ず `---` の行＋空行＋`# ` の見出しで始まる、という書式に依存する。
 * 既存の md がその書式なので、md 側にマーカーを足さずに済ませられる。
 * （`coord-cluster-check.js` などが使う `<!-- 手で書いた所感 ここから -->` と同じ意図の仕組みだが、
 *  こちらは既存ファイルを書き換えずに後付けできる。）
 */

/** `---` 行＋空行＋`# 見出し` を節の始まりとみなす */
const SECTION_START = /^---[ \t]*\r?\n\r?\n(?=# )/m;

/**
 * md を「先頭の生成部」と「追記された節の配列」に分ける。
 * 各節のテキストは先頭の `---` から次の節の直前までを含む。
 */
function splitSections(md) {
  const text = String(md);
  const starts = [];
  const re = new RegExp(SECTION_START.source, 'gm');
  let m;
  while ((m = re.exec(text)) !== null) {
    starts.push(m.index);
    re.lastIndex = m.index + 1; // 直後から探し直す（ゼロ幅先読みで止まらないように）
  }

  if (!starts.length) return { head: text, sections: [] };

  const head = text.slice(0, starts[0]);
  const sections = starts.map((s, i) => {
    const body = text.slice(s, i + 1 < starts.length ? starts[i + 1] : text.length);
    // 見出しは `# ` を含めた行そのものを持つ。呼び出し側が `'# D-1.5.'` で照合するため
    const h = /^# .*$/m.exec(body);
    return { heading: h ? h[0].trim() : '', text: body };
  });
  return { head, sections };
}

/** md の先頭の生成部だけを差し替える。追記された節はそのまま残す */
function replaceHead(md, newHead) {
  const { sections } = splitSections(md);
  const tail = sections.map((s) => s.text).join('');
  // 生成部の末尾は改行1つに揃える。節側が先頭に区切りを持っている
  return String(newHead).replace(/\s*$/, '\n') + tail;
}

/**
 * 見出しが `headingPrefix` で始まる節だけを差し替える。前後の節は触らない。
 * 該当が無ければ末尾に足す。`newSection` は `---` 行から始まる文字列。
 */
function replaceSection(md, headingPrefix, newSection) {
  const { head, sections } = splitSections(md);
  const idx = sections.findIndex((s) => s.heading.startsWith(headingPrefix));
  const body = String(newSection).replace(/^\s*/, '').replace(/\s*$/, '\n');

  if (idx === -1) {
    const tail = sections.map((s) => s.text).join('');
    return head.replace(/\s*$/, '\n') + tail.replace(/\s*$/, '\n') + '\n' + body;
  }

  const next = sections.map((s, i) => (i === idx ? body : s.text));
  // 差し替えた節の後ろに節が続くなら、間に空行を1つ入れて区切りを保つ
  const joined = next
    .map((t, i) => (i === idx && i + 1 < next.length ? t.replace(/\s*$/, '\n') + '\n' : t))
    .join('');
  return head + joined;
}

/** 節ごとの字数。壊れていないかを数で確かめるために使う */
function sectionSizes(md) {
  const { head, sections } = splitSections(md);
  return {
    total: String(md).length,
    head: head.length,
    sections: sections.map((s) => ({ heading: s.heading, chars: s.text.length })),
  };
}

module.exports = { splitSections, replaceHead, replaceSection, sectionSizes };
