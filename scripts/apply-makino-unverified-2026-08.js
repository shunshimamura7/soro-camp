/**
 * 牧野の未確認2件を `unverified` にする（2026-08-11）。
 *
 * 対象: `kabutomushi-mori-camp`（牧野4015）／`okumakino-camp`（牧野2108）
 *
 * 使い方: node scripts/apply-makino-unverified-2026-08.js
 *
 * ## なぜ削除ではなく unverified か
 *
 * §4 のとおり「そもそも存在しなかったもの」はレコードごと削除する運用がある。
 * 今回それを選ばなかった理由は3つ。
 *
 * 1. **ORPHAN の誤検出率は17%（対照群の active 24件中4件）。**
 *    §6-20 のとおり6件に1件は実在する施設を撃つ。**削除は取り返しがつかない。**
 * 2. **unverified なら一覧から外れるので実害はゼロ。**
 *    `lib/camp.ts` の `activeCampgrounds` が status !== 'active' を落とし、
 *    詳細ページには「営業状況が確認できていません」の警告が出る。
 *    **実在が分かれば active に戻せる。**削除するとレコードごと消えて戻せない。
 * 3. **2件は同じ地区で同じ作られ方をしている**（実在する大字＋それらしい名前＋
 *    どこの施設のものでもない番地＝§6-4 の型B・§6-16 の捏造）。
 *    **扱いを分ける理由がない。**片方だけ消して片方を残すほうが不自然。
 *
 * **unverified は最終判断ではない。**実在が確認できたら active に戻す。
 *
 * ## soloComment を空にする
 *
 * 2件とも「夏はカブトムシ・クワガタが採れる昆虫の楽園」「夜の星空の暗さは格別」
 * のような**施設固有の断定描写**が入っていた。実在が確認できていない施設について
 * こう書けるはずがなく、§6-16 の捏造そのもの。**空にする。**
 *
 * `validate-data.js` の必須フィールドに `soloComment` は入っていないので空で通る
 * （2026-08-10 に追加した5件も空のまま通っている）。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'makino-unverified-2026-08.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

/** 今回の判断根拠。**出典URLを必ず付ける**（次の人が同じ調査を繰り返さないため） */
const JUDGEMENT =
  ' 2026-08-11 判断: district-sweep.js で相模原市の全 L1・L2・L3 に一致せず（ORPHAN）' +
  ' https://www.e-sagamihara.com/camp/ ／ https://midori.city.sagamihara.kanagawa.jp/category/play/camp/ 。' +
  '相模原市は L1 網羅率80%で、ORPHAN を判定として読める2市町村の1つ' +
  '（もう1つは道志村75%。scripts/sweep-l1-coverage-2026-08.md）。' +
  '番地はどこの実在施設のものでもない（捏造型・§6-16）。' +
  '**ただし ORPHAN の誤検出率は17%あるため、削除ではなく unverified とした。' +
  '実在が確認できたら active に戻すこと。**' +
  '地区の突き合わせは scripts/sweep-相模原市緑区牧野.md';

const TARGETS = ['kabutomushi-mori-camp', 'okumakino-camp'];

const changed = [];
for (const id of TARGETS) {
  const c = camps.find(x => x.id === id);
  if (!c) {
    console.warn(`警告: ${id} が見つかりません`);
    continue;
  }
  const before = {
    status: c.status,
    soloCommentLen: (c.soloComment || '').length,
    noteLen: (c.needsVerifyNote || '').length,
  };

  c.status = 'unverified';
  c.needsVerify = true;                       // 維持
  c.needsVerifyNote = (c.needsVerifyNote || '') + JUDGEMENT;
  c.soloComment = '';                         // 施設固有の断定描写を削除（§6-16）

  changed.push({ id, name: c.name, address: c.address, before, after: c });
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

console.log('── 変更 ──────────────────────────────');
for (const ch of changed) {
  console.log(`  ${ch.id}（${ch.name}）`);
  console.log(`    status          ${ch.before.status} → ${ch.after.status}`);
  console.log(`    soloComment     ${ch.before.soloCommentLen}文字 → ${(ch.after.soloComment || '').length}文字`);
  console.log(`    needsVerifyNote ${ch.before.noteLen}文字 → ${ch.after.needsVerifyNote.length}文字`);
  console.log(`    needsVerify     ${ch.after.needsVerify}（維持）`);
}
const counts = k => camps.filter(k).length;
console.log('\n── 反映後の件数 ──────────────────────');
console.log(`  total ${camps.length} / active ${counts(c => c.status === 'active')} / unverified ${counts(c => c.status === 'unverified')}`);

/* ── ノート ───────────────────────────────────────────────────────── */
let md = '# 牧野の未確認2件を unverified にした（2026-08-11）\n\n';
md += '§7 の C（牧野の未確認2件の扱いの決定）。**削除ではなく `unverified` を選んだ。**\n\n';
md += '| id | 名前 | 住所 | status |\n| --- | --- | --- | --- |\n';
for (const ch of changed) {
  md += `| \`${ch.id}\` | ${ch.name} | ${ch.address} | ${ch.before.status} → **unverified** |\n`;
}
md += '\n## なぜ削除ではないか\n\n';
md += '§4 のとおり「そもそも存在しなかったもの」はレコードごと削除する運用がある。\n';
md += '今回それを選ばなかった理由は3つ。\n\n';
md += '1. **ORPHAN の誤検出率は17%**（対照群の active 24件中4件。§6-20）。\n';
md += '   6件に1件は実在する施設を撃つ。**削除は取り返しがつかない**\n';
md += '2. **`unverified` なら一覧から外れるので実害はゼロ。**\n';
md += '   `activeCampgrounds` が status !== \'active\' を落とし、詳細ページには\n';
md += '   「営業状況が確認できていません」の警告が出る。**実在が分かれば戻せる**\n';
md += '3. **2件は同じ地区で同じ作られ方をしている**（実在する大字＋それらしい名前＋\n';
md += '   どこの施設のものでもない番地＝§6-4 の型B・§6-16 の捏造）。\n';
md += '   **扱いを分ける理由がない**\n\n';
md += '## 判断の根拠\n\n';
md += '- `district-sweep.js` で**相模原市の全 L1・L2・L3 に一致しなかった**（ORPHAN）\n';
md += '- 相模原市は **L1 網羅率80%**で、ORPHAN を判定として読める2市町村の1つ\n';
md += '  （もう1つは道志村75%）。§6-20 のとおり、網羅率が低い市町村の ORPHAN は\n';
md += '  そもそも判定として読めないが、**相模原市はその条件を満たしている**\n';
md += '- 番地はどこの実在施設のものでもない（捏造型・§6-16）\n';
md += '- 牧野の実在側は 亀見橋バカンス村（12822）／藤野芸術の家（4819・掲載済み）／\n';
md += '  里楽巣FUJINO（4611-1）／藤野倶楽部（同）で、**この2件の番地はどれとも一致しない**\n\n';
md += '## soloComment を空にした\n\n';
md += '2件とも施設固有の断定描写が入っていた。\n\n';
for (const ch of changed) {
  md += `- \`${ch.id}\`: ${ch.before.soloCommentLen}文字 → 0文字\n`;
}
md += '\n実在が確認できていない施設について、こう書けるはずがない（§6-16）。\n';
md += '`validate-data.js` の必須フィールドに `soloComment` は入っていないので空で通る。\n\n';
md += '## これは最終判断ではない\n\n';
md += '**実在が確認できたら `active` に戻す。**\n';
md += '`needsVerify: true` は維持してあり、`needsVerifyNote` に\n';
md += '「何を探して何が無かったか」と今回の判断根拠が出典URL付きで入っている。\n';
md += '**同じ調査を繰り返さないこと。**\n\n';
md += '次に当たるべき経路は §6-7 のとおり、ふるさと納税の返礼品・観光協会の個別ページ・電話。\n';

fs.writeFileSync(NOTES_PATH, md);
console.log(`\n→ ${path.relative(path.join(__dirname, '..'), NOTES_PATH)}`);
