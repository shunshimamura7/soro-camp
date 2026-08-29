/**
 * 愛川町の3河川敷に、直火禁止の出典を付ける（2026-08-29）。
 *
 * 一次情報: 愛川町 商工観光課 観光振興班「河川敷利用のマナーを守ろう！」
 * https://www.town.aikawa.kanagawa.jp/soshiki/kankyou_keizai/syoko/kanko/info/1629185895426.html
 *
 * このページは「愛川町内を流れる中津川は…」と書き出し、地点や区間を限定していない。
 * **町内の中津川河川敷すべてが対象**なので、3件に同じ出典が効く。
 * 各地点が中津川であることは町公式で個別に確認した:
 *   - 八菅橋 … 八菅橋令和の広場推進協議会「中津川の八菅橋周辺を拠点とした場所の河川敷」
 *   - 角田   … 中津川仙台下クラブ「主な活動場所：中津川仙台下地域（愛川町角田）」
 *   - 田代   … 新規の一次情報は取れず。レコードの記述と上記の町内全域という範囲設定による
 *
 * ★ wildStatus は3件とも "不明" のまま。町はキャンプ利用の実態を記述して
 *   マナーを求めているだけで、河川管理者（神奈川県厚木土木事務所）は
 *   キャンプ・野営に一切言及していない。「禁止されていない」ことは確認できたが、
 *   「管理していることを一次情報で確認できる」には到達していない。
 *
 * ★ 増水リスクの cautions は触らない。裏が取れていない。
 * ★ 車両乗り入れ制限の解除も書かない。該当ページが404で一次情報として読めていない。
 *
 * ## 安全装置
 *
 * - `--write --force` の二重ガード。既定は dry run
 * - 照合ガード。cautions[0] が from と完全一致しなければ中止。source に既に同URLがあれば中止
 * - 整形ガード。無変更の往復が原本と一致しなければ中止
 * - 触るのは source / cautions[0] / lastVerified だけ。wildStatus は書かない
 *
 *   node scripts/apply-aikawa-bonfire-source-2026-08-29.js                  # dry run
 *   node scripts/apply-aikawa-bonfire-source-2026-08-29.js --write --force  # 書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const TODAY = '2026-08-29';

const SLUGS = ['nakatsugawa-kasenjiki', 'sumida-ohashi-kasenjiki', 'hasugebashi-kasenjiki'];
const SRC =
  '愛川町 商工観光課「河川敷利用のマナーを守ろう！」 https://www.town.aikawa.kanagawa.jp/soshiki/kankyou_keizai/syoko/kanko/info/1629185895426.html';
const FROM = '直火禁止（焚き火台必須）';
const TO =
  '直火禁止（焚火台・バーベキューコンロを使用）。愛川町商工観光課が河川敷利用のルールとして明記';

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
if (JSON.stringify(list, null, 2) + '\n' !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない');
  process.exit(1);
}

const bySlug = new Map(list.map((c) => [c.slug, c]));
const errors = [];
for (const s of SLUGS) {
  const c = bySlug.get(s);
  if (!c) { errors.push(`${s}: レコードが無い`); continue; }
  if (c.type !== 'wild') errors.push(`${s}: type が "wild" ではない`);
  if (c.cautions[0] !== FROM) errors.push(`${s}: cautions[0] が想定と違う（"${c.cautions[0]}"）`);
  if ((c.source ?? []).some((x) => x.includes('1629185895426'))) errors.push(`${s}: source に既に同URLがある`);
}
if (errors.length) { console.error('中止:\n  ' + errors.join('\n  ')); process.exit(1); }

for (const s of SLUGS) {
  const c = bySlug.get(s);
  console.log(`${WRITE ? '書込' : 'dry'} ${s}  （${c.name}）`);
  console.log(`  source       before: ${c.source === undefined ? '(キー自体が無い)' : JSON.stringify(c.source)}`);
  console.log(`               after : ["${SRC}"]`);
  console.log(`  cautions[0]  before: ${c.cautions[0]}`);
  console.log(`               after : ${TO}`);
  console.log(`  lastVerified before: ${c.lastVerified}  ->  after: ${TODAY}`);
  console.log(`  wildStatus         : "${c.wildStatus}"（変更しない）`);
  console.log();
  if (WRITE) {
    c.source = [...(c.source ?? []), SRC];
    c.cautions[0] = TO;
    c.lastVerified = TODAY;
  }
}

if (WRITE) {
  fs.writeFileSync(DATA, JSON.stringify(list, null, 2) + '\n');
  console.log(`書き込んだ: ${SLUGS.length}件`);
} else {
  console.log('dry run。書くには --write --force');
}
