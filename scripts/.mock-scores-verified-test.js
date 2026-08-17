/**
 * `scoresVerified` が **明示的に false のときだけ** value 帯検査を飛ばすことの検証（§18-3）。
 *
 * ## なぜ要るか
 *
 * 千葉のレコードは料金だけ一次情報で確定していて、**scores は1軸も評価していない。**
 * 全軸3は「中庸」ではなく**「まだ測っていない」**の置き値なので、
 * 帯（value 3 は 2,500円以上）と噛み合わないのは当たり前
 * （大多喜県民の森は 630円）。
 *
 * **警告を消すために value を価格から逆算するのは順序が逆。**
 * 逆算した value は価格から作った数字でしかなく、評価したことにはならない。
 * だから値ではなく**状態のほうを明示する。**
 *
 * ## ★ この検査の本題 — 「未指定」を「評価済み」と推定しないこと
 *
 * 抑止フラグは**必ず甘くなる方向に腐る。**この repo は2回それで焼かれている:
 *
 *   - `priceVerified` … 9fd15e3 が **priceNote の有無から機械的に**付けた。
 *     人が確認した記録ではないフラグが 5件残り、いまも警告に出続けている
 *   - `coordsVerified` … apply-mark-verified が「batch6/7 由来でなければ確認済み」と
 *     **推定して**付けた。実際には住所と 17.3km ずれたピンが「確認済み」になっていた
 *
 * だから `scoresVerified` は**未指定を「不明」のまま扱う。**
 * 「フィールドが無い＝評価済みだから検査しなくていい」にしない。
 *
 * 実行: `node scripts/.mock-scores-verified-test.js`
 */
const fs = require('fs');
const path = require('path');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/* validate-data.js の判定式をそのまま読む。**写経すると片方だけ直る**（§18-3） */
const src = fs.readFileSync(path.join(__dirname, 'validate-data.js'), 'utf8');
const guard = src.match(/const scoresUnrated = ([^;]+);/);
console.log('\n■ 判定式が validate-data.js にある');
check('scoresUnrated の式が読めた', !!guard, guard ? guard[1].trim() : '見つからない');
check('★ `=== false` で見ている（truthy 判定にしていない）',
  !!guard && guard[1].includes('=== false'),
  '`!c.scoresVerified` だと**未指定も抑止されてしまう**');

const VALUE_BANDS = { 5: { min: 0, max: 2500 }, 4: { min: 1500, max: 4000 }, 3: { min: 2500, max: Infinity } };
/** 実装と同じ順序で判定する */
const mismatches = (recs) => recs.filter(c => {
  const priceNoteChecked = c.status === 'active' || c.status === 'unverified';
  const scoresUnrated = c.scoresVerified === false;
  if (!(priceNoteChecked && !scoresUnrated && c.priceVerified === true && Number(c.priceMin) > 0 && c.scores)) return false;
  const band = VALUE_BANDS[c.scores.value];
  return band && (Number(c.priceMin) < band.min || Number(c.priceMin) > band.max);
}).map(c => c.id);

const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));

console.log('\n■ いまのデータ');
check('帯違反は0件', mismatches(recs).length === 0, mismatches(recs).join(' / ') || 'なし');
// ★ 件数を直書きしない。**千葉が増えるたびにテストを直すことになり、
// そのとき「数を合わせる」だけの修正をして意図が消える。**
// 見たいのは「未評価と分かっているものにだけ付いていること」なので、
// **付いている集合と、付いていて当然の集合が一致するか**を見る。
const flagged = recs.filter(c => c.scoresVerified === false).map(c => c.id).sort();
const chiba = recs.filter(c => c.prefecture === '千葉').map(c => c.id).sort();
check(`scoresVerified:false は千葉のレコードだけ（${flagged.length}件）`,
  flagged.join(',') === chiba.join(','),
  flagged.join(' / ') + (flagged.join(',') === chiba.join(',') ? '' : ` ／ 千葉は ${chiba.join(' / ')}`));
const has = recs.filter(c => 'scoresVerified' in c);
check('★ 既存3県には1件も付いていない（推定で付けていない）',
  has.every(c => c.prefecture === '千葉'),
  `フィールドを持つ ${has.length}件 / うち千葉以外 ${has.filter(c => c.prefecture !== '千葉').length}件`);

console.log('\n■ ★ フラグを外すと帯違反が戻る（＝抑止が効いている証拠）');
const withoutFlag = recs.map(c => { const x = { ...c }; delete x.scoresVerified; return x; });
const back = mismatches(withoutFlag);
check('otaki-kenminnomori が帯違反として出る', back.includes('otaki-kenminnomori'),
  back.join(' / ') || '出ない');
check('★ 抑止しなければ出るものを抑止している（何も無いのを隠していない）', back.length > 0);

console.log('\n■ ★ 未指定は抑止されない（ここが本題）');
const fake = [{
  id: 'FAKE-未指定', status: 'unverified', priceVerified: true, priceMin: 630,
  scores: { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 },
}];
check('scoresVerified が無いレコードは帯検査を受ける', mismatches(fake).length === 1,
  '**「未指定＝評価済み」と推定しない**');

console.log('\n■ 明示 true は抑止されない');
const t = [{ ...fake[0], id: 'FAKE-true', scoresVerified: true }];
check('scoresVerified:true は帯検査を受ける', mismatches(t).length === 1,
  '`true` は「評価した」の意味。評価したなら帯と合うはず');

console.log('\n■ 明示 false だけ抑止される');
const f = [{ ...fake[0], id: 'FAKE-false', scoresVerified: false }];
check('scoresVerified:false は帯検査を飛ばす', mismatches(f).length === 0);

console.log('\n■ ★ false は「低い」ではなく「未評価」— 表示に使っていない');
const uiFiles = ['components/CampCard.tsx', 'app/camp/[slug]/page.tsx', 'lib/camp.ts'];
const used = uiFiles.filter(f => {
  const p = path.join(__dirname, '..', f);
  return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('scoresVerified');
});
check('表示側・並び替え側が scoresVerified を読んでいない', used.length === 0,
  used.join(' / ') || '未使用（scores の値そのものは今までどおり使われる）');

const ng = results.filter(r => !r.ok);
console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
if (ng.length) process.exitCode = 1;
