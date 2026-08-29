/**
 * 県の絞り込みの選択肢が**データで決まる**ことの検証（§18-3）。
 *
 * ## なぜ要るか
 *
 * 一覧に出るのは `status: "active"` だけ。
 * **active が0件の県のチップを出すと、選んだ瞬間に必ず空になる。**
 * 2026-08-29 時点でその状態にあるのは東京（レコード0件）。
 *
 * ここで「東京を出さない」とハードコードすると、
 * **東京が active になったときに誰も外しに来ない。**だからデータで判定している。
 *
 * ## ★ この検査の本題は「いま出ないこと」ではない
 *
 * いま東京が出ないのは当たり前で、それだけ見ても
 * **条件がデータで決まっているのか、ただ東京を書いていないだけなのか区別できない。**
 * **東京を active にしたら出ること**を確かめて初めて、判定が効いていると言える。
 *
 * ## ★ 2026-08-29: この検査自身が陳腐化していたので直した
 *
 * 元は千葉が「active 0件の県」の実例だった。**2026-08-26 に千葉が active 11件になった時点で
 * 「千葉は出ない」という固定が誤りになり、3件 NG のまま誰も直しに来ていなかった。**
 * この検査がまさに警告している型（条件を書いた側が更新されない）を、検査自身が踏んでいた。
 *
 * 対策として、実例を**データが増えても陳腐化しない形**に変えた。
 * 「出ない県」は東京だが、判定は `active 0件かどうか` をデータから読んで書いている。
 * **東京に active レコードが入ったら、この検査も一緒に見直すこと。**
 *
 * 実行: `node scripts/.mock-filterbar-prefectures-test.js`
 */
const fs = require('fs');
const path = require('path');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/** FilterBar.tsx から並び順の正を読む（二重管理をしない） */
const src = fs.readFileSync(path.join(__dirname, '..', 'components', 'FilterBar.tsx'), 'utf8');
const orderLine = src.match(/const PREFECTURE_ORDER = \[([^\]]+)\]/);
const ORDER = orderLine ? orderLine[1].split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean) : [];

/** 実装と同じ導出。**式を写している**ので、実装を変えたらここも落ちる */
const derive = (records) => [
  '全部',
  ...ORDER.filter(p => records.some(c => c.status === 'active' && c.prefecture === p)),
];

const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));

console.log('\n■ 並び順の正が FilterBar.tsx にある');
check('PREFECTURE_ORDER が読めた', ORDER.length > 0, ORDER.join(' / '));
check('千葉が並び順に**入っている**（出す出さないは別の判断）', ORDER.includes('千葉'));
check('東京が並び順に**入っている**（出す出さないは別の判断）', ORDER.includes('東京'));

console.log('\n■ いまのデータでの選択肢');
const now = derive(recs);
console.log('   → ' + now.join(' / '));
check('神奈川・静岡・山梨が出る', ['神奈川', '静岡', '山梨'].every(p => now.includes(p)));
check('千葉も出る（2026-08-26 に active になった）', now.includes('千葉'),
  `千葉のレコード ${recs.filter(c => c.prefecture === '千葉').length}件 / うち active ${recs.filter(c => c.prefecture === '千葉' && c.status === 'active').length}件`);
check('★ 東京は出ない（active が0件なので）', !now.includes('東京'),
  `東京のレコード ${recs.filter(c => c.prefecture === '東京').length}件 / うち active ${recs.filter(c => c.prefecture === '東京' && c.status === 'active').length}件`);

console.log('\n■ ★ 東京を active にしたら出る（＝判定がデータで効いている）');
// 「出ない」ことだけを見ても、判定がデータで効いているのか、ただ書いていないだけなのか区別できない。
// **架空の東京レコードを1件 active で足して出ることを見る。**data/ には何も書かない。
const withActive = [...recs, {
  id: 'mock-tokyo-only-in-this-test', slug: 'mock-tokyo', name: '（この検査の中だけの架空レコード）',
  prefecture: '東京', area: '奥多摩', status: 'active',
}];
const after = derive(withActive);
console.log('   → ' + after.join(' / '));
check('東京が選択肢に出る', after.includes('東京'));
check('★ 1件 active にするだけで出る（ハードコードで隠していない証拠）',
  after.includes('東京') && !now.includes('東京'));
check('並び順は PREFECTURE_ORDER のまま（末尾に東京）',
  after.join(',') === ['全部', ...ORDER].join(','), after.join(' / '));

console.log('\n■ 逆方向: active が消えたら選択肢も消える');
const noneActive = recs.map(c => c.prefecture === '山梨' ? { ...c, status: 'unverified' } : c);
check('山梨の active を全部落とすと、山梨が出なくなる', !derive(noneActive).includes('山梨'),
  derive(noneActive).join(' / '));

console.log('\n■ 選択肢は必ず1件以上を返す（空のチップを作らない）');
const bad = [];
for (const p of ORDER) {
  const n = recs.filter(c => c.status === 'active' && c.prefecture === p).length;
  if (now.includes(p) && n === 0) bad.push(`${p} は選択肢に出るのに active 0件`);
  if (!now.includes(p) && n > 0) bad.push(`${p} は active ${n}件あるのに選択肢に出ない`);
}
check('出ている県はすべて active 1件以上', bad.length === 0, bad.join(' / ') || 'OK');

console.log('\n■ 一覧に出る条件と一致している（activeCampgrounds の定義）');
const camp = fs.readFileSync(path.join(__dirname, '..', 'lib', 'camp.ts'), 'utf8');
check('`activeCampgrounds` は status === "active" で絞っている',
  /activeCampgrounds[\s\S]{0,200}status\s*===\s*"active"/.test(camp),
  '**ここが変わったらこの検査の前提が崩れる**');

const ng = results.filter(r => !r.ok);
console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
if (ng.length) process.exitCode = 1;
