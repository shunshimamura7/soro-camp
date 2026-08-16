/**
 * 基準線の凍結が**ファイル名の衝突に耐えるか**の検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * ## なぜ要るか
 *
 * 2026-08-16、案Cの `--all` が凍結76本のうち3本を**同じファイル名で上書きした。**
 * `上野原市` / `大月市` / `都留市` は大字を持たないので、地区名＝市町村名だったため。
 *
 * 凍結は「**新しく増える** md を無視する」設計で、**既存の名前を奪われる場合を守れていなかった。**
 * さらに悪いことに、上野原市・大月市は数字がたまたま一致していて**鳴らなかった。**
 * **鳴らなかったほうを「無事」と読んではいけない。**
 *
 * ## 直したあとの約束
 *
 *   1. 基準はスナップショット（`.baseline-before-planc.json`）。**md は基準ではない**
 *   2. **ハッシュが一致する md しか読まない。**名前を奪われたファイルは読まれない
 *   3. md が1本も無くても、スナップショットの値だけで比較が成立する
 *   4. 鳴るのは**スナップショット自身の辻褄が合わないとき**だけ
 *
 * ## ★ 偽ゼロ検証の作り
 *
 * 「上書きしても数字が動かない」を確かめるには、**実際に上書きしてみるしかない。**
 * 本物のファイルを一時的に壊して、必ず戻す（`process.on('exit')` でも戻す）。
 * 壊れたまま終わっても `git checkout` で戻せるファイルしか触らない。
 *
 * 実行: `node scripts/.mock-baseline-freeze-test.js`
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SNAP = path.join(__dirname, '.baseline-before-planc.json');
const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/** 触ったファイルは必ず戻す。**途中で死んでも戻す。** */
const backups = new Map();
function stash(p) { if (!backups.has(p)) backups.set(p, fs.existsSync(p) ? fs.readFileSync(p) : null); }
function restoreAll() {
  for (const [p, buf] of backups) {
    if (buf === null) { if (fs.existsSync(p)) fs.unlinkSync(p); }
    else fs.writeFileSync(p, buf);
  }
  backups.clear();
}
process.on('exit', restoreAll);

/** 基準線を走らせて、出力と終了コードを返す */
function runBaseline(args = []) {
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, '.baseline-before-planc.js'), ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}
const nums = out => {
  const m = out.match(/地区 (\d+) \/ MISSING 延べ (\d+) \/ ユニーク (\d+) \/ IN_DATA (\d+) \/ ORPHAN (\d+)/);
  return m ? { districts: +m[1], missing: +m[2], uniq: +m[3], inData: +m[4], orphan: +m[5] } : null;
};

const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
const base = runBaseline();
const B = nums(base.out);

try {
  /* ------------------------------------------------------------------ */
  console.log('\n■ 前提: いまの状態で通ること');
  check('exit 0', base.code === 0, `code=${base.code}`);
  check('凍結値が読めている', !!B && B.districts === snap.rows.length && B.missing === snap.totMissing,
    B ? JSON.stringify(B) : '読めない');
  check('検証モードではスナップショットを書かない',
    fs.readFileSync(SNAP, 'utf8') === JSON.stringify(snap, null, 1));

  /* ------------------------------------------------------------------
   * ★ 本題1: 凍結対象と同じ名前で md を書いても、新しい内容を読まない
   * ------------------------------------------------------------------ */
  console.log('\n■ ★ 凍結対象と同名のファイルを新しく書いても、基準線が読まない');
  // 「そのまま」で読まれている地区を選ぶ（退避が無いほう＝いちばん危ない側）
  const plain = snap.rows.find(r => {
    const p = path.join(__dirname, `sweep-${r.district}.md`);
    return !fs.existsSync(path.join(__dirname, `sweep-${r.district}.before-planc.md`)) && fs.existsSync(p);
  });
  const target = path.join(__dirname, `sweep-${plain.district}.md`);
  stash(target);
  fs.writeFileSync(target, [
    `# ${plain.district} — 案Cが同じ名前で書いた別物`, '',
    '| | 件数 |', '|---|---:|',
    '| MISSING | 999 |', '| IN_DATA | 999 |', '| ORPHAN | 999 |', '',
    '## MISSING — 実在側にあるがデータに無い', '',
    '### 1. でっちあげキャンプ場', '', '- **confidence**: HIGH（層: L1）', '',
  ].join('\n'), 'utf8');

  const after = runBaseline();
  const A = nums(after.out);
  check('数字が1つも動かない',
    A && A.districts === B.districts && A.missing === B.missing && A.uniq === B.uniq &&
    A.inData === B.inData && A.orphan === B.orphan,
    A ? JSON.stringify(A) : '読めない');
  check('exit 0 のまま（名前を奪われるのは案C後の正常な状態）', after.code === 0, `code=${after.code}`);
  check('★ 黙って無視せず「名前を奪われた」と出す',
    after.out.includes('名前を奪われた') && after.out.includes(plain.district),
    (after.out.match(/★[^\n]*/) || [''])[0].slice(0, 60));
  check('でっちあげの数字(999)がどこにも出てこない', !after.out.includes('999'));
  restoreAll();

  /* ------------------------------------------------------------------
   * ★ 本題2: ファイルが存在しなくても比較できる
   * ------------------------------------------------------------------ */
  console.log('\n■ ★ 凍結 md が消えても、スナップショットの値で比較が続く');
  stash(target);
  fs.unlinkSync(target);
  const del = runBaseline();
  const D = nums(del.out);
  check('数字が1つも動かない',
    D && D.districts === B.districts && D.missing === B.missing && D.uniq === B.uniq &&
    D.inData === B.inData && D.orphan === B.orphan,
    D ? JSON.stringify(D) : '読めない');
  check('exit 0（消えたことはドリフトではない。値は手元にある）', del.code === 0, `code=${del.code}`);
  check('「ファイルが無い」と明示する', del.out.includes('ファイルが無い') && del.out.includes(plain.district));
  restoreAll();

  /* ------------------------------------------------------------------
   * ★ 本題3: では何なら鳴るのか — スナップショット自身が壊れたとき
   * ------------------------------------------------------------------ */
  console.log('\n■ ★ 鳴るのはスナップショット自身の辻褄が合わないときだけ');
  stash(SNAP);
  const broken = JSON.parse(JSON.stringify(snap));
  broken.rows[0].missing = broken.rows[0].missing + 5;   // 行の合計が totMissing と合わなくなる
  fs.writeFileSync(SNAP, JSON.stringify(broken, null, 1), 'utf8');
  const bad = runBaseline();
  check('exit 1 で鳴る', bad.code === 1, `code=${bad.code}`);
  check('どこが合わないか出す', /MISSING 延べ: 記録 \d+ \/ 行の合計 \d+/.test(bad.out),
    (bad.out.match(/MISSING 延べ:[^\n]*/) || [''])[0]);
  restoreAll();

  console.log('\n■ 名前の衝突が起きうる地区が分かるようになっている');
  const { MUNI_SOURCES } = require('./district-sweep.js');
  const collide = snap.rows.filter(r => Object.keys(MUNI_SOURCES).includes(r.district));
  check('市町村名と同名の凍結地区は3本（上野原市 / 大月市 / 都留市）',
    collide.length === 3, collide.map(r => r.district).join(' / '));
  check('その3本は退避が用意されている',
    collide.every(r => fs.existsSync(path.join(__dirname, `sweep-${r.district}.before-planc.md`))));
  check('全76本にハッシュが記録されている',
    snap.rows.every(r => r.sha256), `${snap.rows.filter(r => r.sha256).length}/${snap.rows.length}`);

} finally {
  restoreAll();
}

const ng = results.filter(r => !r.ok);
console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
if (ng.length) process.exitCode = 1;
