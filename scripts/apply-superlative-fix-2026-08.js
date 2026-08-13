/**
 * ⚠ **実行済みの適用スクリプト。再実行しないこと。**
 *
 * 最上級表現の置換。上と同じ理由で再実行すると本文が戻る。
 *
 * 実行時期: 2026-08（初出コミット）
 *
 * **ここのベタ書きは「何をどう変えたか」の記録なので、動的判定に書き換えない。**
 * 腐るのは「データの現在の状態を写した一覧」であって、適用の記録ではない（引き継ぎ §18-3）。
 * ただし**再実行すると記録どおりにデータを巻き戻す**ので、事故を防ぐガードを付けてある。
 *
 * 意図して再実行する場合のみ `--force` を付ける。
 */
if (!process.argv.includes('--force')) {
  console.error('[実行済み] ' + require('path').basename(__filename) + ' は一度きりの適用スクリプト。');
  console.error('再実行するとデータを当時の値に巻き戻す。意図する場合のみ --force を付けること。');
  process.exit(1);
}

/**
 * 出典不明の最上級表現を、観測できる事実の記述に置き換える。
 *
 * 方針: soloComment に順位・ランクの主張を書かない。
 *       帰属が明示できるもの（ギネス記録、自治体の公称、「〜と言われる」「〜と称される」）は残す。
 *
 * 使い方: node scripts/fix-superlatives.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const REWRITE = {
  // 「国内最高峰クラスの絶景」→ 何が見えるかの記述に置き換える
  fumotoppara:
    '遮るものが何もない広大な草原の正面に富士山が立つ。区画なしフリーサイトで3,000円/ソロ。人気で週末は大混雑なので平日か早朝チェックイン必須。冬は強風と極寒が容赦ないため防寒装備が勝負。笠雲がかかった富士山を独り占めできる瞬間は忘れられない。',

  // needsVerify の施設。断定的な描写を削り、確認中である旨を主にする
  'nishiizu-seto':
    '※この施設の実在・正式名称を確認中です。西伊豆の海岸沿いにあるとされ、駿河湾に沈む夕陽が見込めますが、現時点で内容の裏付けが取れていません。訪問前に公式情報をご確認ください。',

  // 「山梨ソロキャンプ最高峰の一つ」→ 標高・眺望・価格の事実で締める
  'kiyosato-oka':
    '標高1,400mの清里高原から八ヶ岳と南アルプスを一望できる。2,820円〜という公営ならではの価格でウォシュレット・温水シャワーが揃う。晴れた日の朝は360度の山岳パノラマが広がる。',
};

let n = 0;
for (const [slug, text] of Object.entries(REWRITE)) {
  const c = camps.find(x => x.slug === slug);
  if (!c) { console.warn(`警告: slug "${slug}" が見つかりません`); continue; }
  console.log(`■ ${slug}（${c.name}）`);
  console.log(`  変更前: ${c.soloComment}`);
  console.log(`  変更後: ${text}`);
  console.log('');
  c.soloComment = text;
  n++;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));
console.log(`${n}件を書き換えました。`);
