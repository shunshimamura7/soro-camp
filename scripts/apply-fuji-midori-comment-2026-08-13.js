/**
 * `fuji-midori-kyuka-auto` の soloComment 修正（2026-08-13）。
 *
 *   node scripts/apply-fuji-midori-comment-2026-08-13.js
 *
 * ## なぜ直すか（§6-10）
 *
 * 座標を実ピンに差し替えた（`apply-fuji-midori-coord-2026-08-13.js`）ので、本文を読み直した。
 *
 * 旧: 「**西湖・精進湖の穴場エリア**で富士山眺望抜群」
 *
 * **これは誤っていた旧座標（逆ジオが富士河口湖町 西湖を返していた）に寄った表現。**
 * 施設は鳴沢村で、公式のアクセスも「河口湖IC から**本栖湖方面**へ約10分」。
 * `area`（鳴沢村）とも `address` とも新座標とも噛み合っていなかった。
 * §6-15 の `fujikawa-camp`（誤った住所に合わせて本文が書かれていた）と同じ形。
 *
 * ## 書ける根拠しか書かない
 *
 * | 記述 | 根拠 |
 * |---|---|
 * | 鳴沢村 | 施設公式の住所 https://www.kyukamura.jp/access |
 * | 標高約1,000m | **GSI 実測 992m**（実ピンの逆ジオ）。独立ソース |
 * | 全16区画・キャンピングカー可 | 公式リリース https://www.fujikanko.co.jp/newsrelease/2569 |
 * | ゆらりが隣接 | **ゆらりの住所が「鳴沢村8532-5」で当施設と同一番地** |
 *
 * ## 「徒歩5分」は書かない
 *
 * 下書きでは「ゆらりまで徒歩5分」としていたが、**施設公式にその記載は無い。**
 * Web検索の要約から拾った未確認の表現だった。
 * **ゆらりの独立した座標は一次情報に無く、距離を実測できない**ので、
 * 検証できない距離表記は落として「隣接」だけにした。
 * 同一番地という事実のほうが強く、測らずに裏が取れる。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const SLUG = 'fuji-midori-kyuka-auto';

const NEXT =
  '富士五湖エリアの高規格キャンプ場、温泉あり。鳴沢村の富士山北麓・標高約1,000mに位置し、' +
  '富士山眺望抜群。全16区画のオートサイトで、キャンピングカーも乗り入れできる。' +
  '日帰り温泉「富士眺望の湯ゆらり」が隣接。';

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const c = data.find((x) => x.slug === SLUG);
if (!c) throw new Error(`${SLUG} が見つからない`);

const before = c.soloComment;
if (!before.includes('西湖・精進湖')) {
  console.log('「西湖・精進湖」が本文に無い。すでに適用済みか手で直された可能性がある。中止する。');
  process.exit(0);
}

c.soloComment = NEXT;
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

console.log(`${SLUG} の soloComment を更新`);
console.log(`  旧: ${before}`);
console.log(`  新: ${c.soloComment}`);
