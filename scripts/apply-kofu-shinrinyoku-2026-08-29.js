/**
 * 甲府市 森林浴広場の wildStatus を「公認」に確定し、留保を cautions に残す（2026-08-29）。
 *
 * 一次情報は甲府市 施設カルテ 3-10（基準日 令和7年3月31日）。
 * https://www.city.kofu.yamanashi.jp/file_summary/shisetu_karte/3-10.pdf
 * 索引: https://www.city.kofu.yamanashi.jp/sisankatuyou/images/03sports.html
 *
 * カルテの記載: 所在地「甲府市御岳町字赤松平3289番地1」/ 所管「産業部 農林振興室 林政課」/
 * 施設小分類「キャンプ場」/ 運営形態「直営」/ 土地「市有」建物「市所有」/
 * 利用対象者「甲府市民」/ 使用料等の体系「なし」。
 *
 * wildStatus が答えるのは「そこにいて禁止されないか」であって「情報が得やすいか」ではない。
 * 市有・直営・台帳の小分類が「キャンプ場」であることが前者に答えている。
 * **利用案内ページが無いことは判定を下げる理由にせず、cautions に書いて伝える。**
 *
 * ## 安全装置
 *
 * - `--write --force` の二重ガード。既定は dry run で1バイトも書かない
 * - 照合ガード。現在値が想定と違えばその場で中止（wildStatus が "不明" でなければ止まる）
 * - 整形ガード。無変更の往復が原本と一致しなければ中止
 * - 書くのは wildStatus と cautions の追加1件だけ。他のフィールドは触らない
 *
 *   node scripts/apply-kofu-shinrinyoku-2026-08-29.js                  # dry run（既定）
 *   node scripts/apply-kofu-shinrinyoku-2026-08-29.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const SLUG = 'kofu-shinrinyoku-hiroba';

const NOTE =
  '甲府市林政課の直営施設。市の施設台帳では小分類「キャンプ場」、利用対象者は甲府市民。' +
  'ただし市は一般向けの利用案内を出しておらず、市のアウトドア特集ページにも掲載がない' +
  '（マウントピア黒平・創作の森おびな等は掲載）。予約先・問い合わせ先の案内も無い。' +
  '市の施設カルテには設置根拠が「不明」と記載されている（条例・要綱が特定できていない' +
  'という意味で、市有・直営であること自体は台帳で確認できる）';

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
if (JSON.stringify(list, null, 2) + '\n' !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない');
  process.exit(1);
}

const c = list.find((x) => x.slug === SLUG);
const errors = [];
if (!c) errors.push(`${SLUG}: レコードが無い`);
else {
  if (c.type !== 'wild') errors.push(`${SLUG}: type が "wild" ではない`);
  if (c.wildStatus !== '不明') errors.push(`${SLUG}: wildStatus が "不明" ではない（現在 "${c.wildStatus}"）。別の誰かが先に確定させている`);
  if (!Array.isArray(c.cautions)) errors.push(`${SLUG}: cautions が配列でない`);
  else if (c.cautions.some((s) => s.includes('林政課の直営施設'))) errors.push(`${SLUG}: 同趣旨の cautions が既にある`);
}
if (errors.length) { console.error('中止:\n  ' + errors.join('\n  ')); process.exit(1); }

console.log(`${WRITE ? '書込' : 'dry'} ${SLUG}`);
console.log(`  wildStatus: "${c.wildStatus}" -> "公認"`);
console.log(`  cautions に1件追加（${c.cautions.length} -> ${c.cautions.length + 1}件）:`);
console.log(`    ${NOTE}`);

if (WRITE) {
  c.wildStatus = '公認';
  c.cautions.push(NOTE);
  fs.writeFileSync(DATA, JSON.stringify(list, null, 2) + '\n');
  console.log('\n書き込んだ');
} else {
  console.log('\ndry run。書くには --write --force');
}
