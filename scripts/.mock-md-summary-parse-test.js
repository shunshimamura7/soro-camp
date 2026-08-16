/**
 * 地区 md の**冒頭サマリ表**と、本文中の**内訳表**を取り違えないことの検証（§18-3）。
 *
 * ## なぜ要るか — 同じ型を踏むのは2回目
 *
 * 集計側は md を正規表現で読む。
 *
 *     /^\|\s*\*?\*?(MISSING|IN_DATA|ORPHAN)[^|]*\|\s*\*?\*?(\d+)/gm
 *
 * これは**本文全体**を走査して、**最後に一致したものが勝つ。**
 * 案Cで足した「大字が取れないソース項目の行き先」の表を素の
 * `| MISSING | 52 |` で書いたため、**冒頭のサマリを後ろの内訳が上書きした。**
 *
 * 実測（道志村）: 全体スキャン `MISSING 37 / IN_DATA 28`、正しくは `42 / 15`。
 *
 * **1回目は §5 のパーサ**で、引用ブロック内の手書き表を本物の表として拾った。
 * **「md を正規表現で読む」設計は、後から節を足すたびに壊れうる。**
 *
 * ## 直し方を2重にしてある（片方だけでは足りない）
 *
 *   読む側 … 冒頭のサマリ表**だけ**を見る（`body.split('\n## ')[0]`）
 *   書く側 … 内訳表の分類名を**バックティックで囲む**（`| \`MISSING\` | 52 |`）
 *
 * 読む側だけ直すと、**次に別のスクリプトが素朴な正規表現で読んだときに同じ穴が開く。**
 * 書く側だけ直すと、**次に誰かがバックティックを外したときに静かに壊れる。**
 *
 * 実行: `node scripts/.mock-md-summary-parse-test.js`
 */
const fs = require('fs');
const path = require('path');
const { MUNI_SOURCES } = require('./district-sweep.js');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

const RE = /^\|\s*\*?\*?(MISSING|IN_DATA|ORPHAN)[^|]*\|\s*\*?\*?(\d+)/gm;
const scan = text => {
  const sum = {};
  for (const [, k, v] of text.matchAll(new RegExp(RE.source, 'gm'))) sum[k] = Number(v);
  return sum;
};
const headerOnly = body => scan(body.split('\n## ')[0]);

/** 冒頭サマリ表 42/15/0 を持つ地区 md の骨格 */
const HEAD = [
  '# 道志村 の地区スイープ', '',
  '| 分類 | 件数 |', '|---|---:|',
  '| **MISSING** | **42** |',
  '| IN_DATA | 15 |',
  '| ORPHAN | 0 |', '',
].join('\n');

const TAIL_BAD = [
  '## 大字が取れないソース項目の行き先', '',
  '| 落ちた先 | 件数 | 意味 |', '|---|---:|---|',
  '| MISSING | 52 | 実在するがデータに無い |',
  '| IN_DATA | 29 | データにあった |', '',
].join('\n');

const TAIL_GOOD = TAIL_BAD.replace(/\| (MISSING|IN_DATA) \|/g, '| `$1` |');

(async () => {
  /* -------------------------------------------------------------- */
  console.log('\n■ 壊れ方を先に固定する（直す前がどうだったか）');
  const bad = scan(HEAD + '\n' + TAIL_BAD);
  check('素の内訳表があると、本文全体スキャンは後ろの値で上書きされる',
    bad.MISSING === 52 && bad.IN_DATA === 29, JSON.stringify(bad));
  check('★ これが 42/15 を 52/29 に見せていた正体', bad.MISSING !== 42 && bad.IN_DATA !== 15);

  console.log('\n■ 読む側の対処: 冒頭のサマリ表だけを見る');
  check('素の内訳表があっても正しい値を返す',
    headerOnly(HEAD + '\n' + TAIL_BAD).MISSING === 42 && headerOnly(HEAD + '\n' + TAIL_BAD).IN_DATA === 15,
    JSON.stringify(headerOnly(HEAD + '\n' + TAIL_BAD)));

  console.log('\n■ 書く側の対処: バックティックで囲むと、本文全体スキャンでも当たらない');
  const good = scan(HEAD + '\n' + TAIL_GOOD);
  check('本文全体スキャンでも 42/15 のまま', good.MISSING === 42 && good.IN_DATA === 15, JSON.stringify(good));
  check('★ 素朴な正規表現で読む別のスクリプトが来ても壊れない', good.MISSING === 42);

  console.log('\n■ 内訳の数字そのものは md に残っている（隠していない）');
  check('52 と 29 は本文に書かれたまま',
    TAIL_GOOD.includes('52') && TAIL_GOOD.includes('29'));

  /* -------------------------------------------------------------- */
  console.log('\n■ ★ 実際に生成された地区 md が両方を満たすこと');
  const files = Object.keys(MUNI_SOURCES)
    .map(m => ({ m, p: path.join(__dirname, `sweep-${m}.md`) }))
    .filter(x => fs.existsSync(x.p));
  // 登録済み市区町村のうち、**スイープ済みのぶんだけ**を見る。
  // 千葉を接続すると登録は26になるが、走らせるまで md は無い。
  // **「md が無い＝壊れている」ではない**ので、件数ではなく「1本以上あること」を見る。
  check(`スイープ済みの md を対象にする（${files.length}/${Object.keys(MUNI_SOURCES).length} 市区町村）`,
    files.length > 0, files.map(x => x.m).join(' '));

  const mismatched = [];
  for (const { m, p } of files) {
    const body = fs.readFileSync(p, 'utf8');
    const whole = scan(body), head = headerOnly(body);
    for (const k of ['MISSING', 'IN_DATA', 'ORPHAN']) {
      if (head[k] !== undefined && whole[k] !== head[k]) mismatched.push(`${m} ${k}: 冒頭 ${head[k]} / 全体 ${whole[k]}`);
    }
  }
  check('★ どの md も、本文全体スキャンと冒頭スキャンが一致する',
    mismatched.length === 0, mismatched.slice(0, 4).join(' / ') || '全一致');

  const bare = [];
  for (const { m, p } of files) {
    const body = fs.readFileSync(p, 'utf8');
    const sec = body.split('\n## ').find(x => x.startsWith('大字が取れないソース項目')) || '';
    for (const l of sec.split('\n')) {
      if (/^\|\s*\*?\*?(MISSING|IN_DATA|ORPHAN)\s*\|/.test(l)) bare.push(`${m}: ${l.trim().slice(0, 40)}`);
    }
  }
  check('★ 内訳表の分類名が素で書かれていない（バックティックがある）',
    bare.length === 0, bare.slice(0, 3).join(' / ') || 'なし');

  const ng = results.filter(r => !r.ok);
  console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
  if (ng.length) process.exitCode = 1;
})();
