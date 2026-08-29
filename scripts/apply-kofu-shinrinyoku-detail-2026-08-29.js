/**
 * 甲府市 森林浴広場の記述を施設カルテの実測に合わせる（2026-08-29・第2弾）。
 *
 * 一次情報: 甲府市 施設カルテ 3-10（基準日 令和7年3月31日）
 * https://www.city.kofu.yamanashi.jp/file_summary/shisetu_karte/3-10.pdf
 *
 * 直すもの:
 *
 * 1. source[] にカルテURLを追加。officialUrl は空のままにする。
 *    これは市の施設案内ページではなく資産管理台帳なので、officialUrl に置くと
 *    「公式の利用案内がある」と誤読される。source[] が正しい置き場所。
 * 2. soloComment の「利用者は年間ゼロが続く」は取り違え。
 *    カルテで 0 なのは職員数・人件費・歳入・歳出で、年間利用者数は令和4〜6年度とも 30人。
 * 3. cautions の「機能しておらず」は出典が無かった。台帳で確認できる事実と、
 *    カルテの「調理設備：なし」「光熱水費0円」という傍証に置き換え、判断は現地に委ねる。
 * 4. 「落石・倒木の恐れ」の断定を弱める。出典が無く、区域指定の話とも混ざっていた。
 *    カルテの二次評価（浸水想定区域・土砂災害警戒区域・液状化はいずれも該当無し）を
 *    事実として足したうえで、**区域指定が無いことは落石・倒木が起きない意味ではない**と明記する。
 *
 * ## 安全装置
 *
 * - `--write --force` の二重ガード。既定は dry run
 * - 照合ガード。差し替え対象の現在値が from と完全一致しなければ中止
 * - 整形ガード。無変更の往復が原本と一致しなければ中止
 * - 触るのは source / soloComment / cautions / lastVerified だけ
 *
 *   node scripts/apply-kofu-shinrinyoku-detail-2026-08-29.js                  # dry run
 *   node scripts/apply-kofu-shinrinyoku-detail-2026-08-29.js --write --force  # 書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const SLUG = 'kofu-shinrinyoku-hiroba';
const TODAY = '2026-08-29';

const KARTE =
  '甲府市 施設カルテ 3-10（基準日 令和7年3月31日） https://www.city.kofu.yamanashi.jp/file_summary/shisetu_karte/3-10.pdf';

const SOLO_FROM =
  '甲府市が無料開放する林間の広場。市街から林道を1時間、黒平集落のさらに奥で携帯も圏外。市の施設記録でも利用者は年間ゼロが続く無人の静けさ。トイレも水道もなく（水は沢頼み）、熊の気配もある、装備と経験が前提の上級者向け。';
const SOLO_TO =
  '甲府市が無料開放する林間の広場。市街から林道を1時間、黒平集落のさらに奥で携帯も圏外。市の施設カルテでは年間利用者数30人（令和4〜6年度）で、ほぼ人に会わない静けさ。トイレも水道もなく（水は沢頼み）、熊の気配もある、装備と経験が前提の上級者向け。';

/** [差し替え前, 差し替え後] */
const CAUTION_EDITS = [
  [
    'トイレなし。炊事棟・簡易水道は市の台帳上あるが機能しておらず、水は沢頼み（要浄水）',
    'トイレなし。水は沢頼み（要浄水）。炊事棟（9.72㎡・平成元年建築）と簡易水道滅菌処理施設が市の施設台帳にある。ただし施設カルテの設備等情報は「調理設備：なし」、光熱水費は0円。実際に使える状態かは現地で確認すること',
  ],
  [
    '熊の出没注意。落石・倒木の恐れもあり、悪天時は入山を避ける',
    '熊の出没注意。林道奥の山中で管理者が常駐しないため、落石・倒木は自己判断。悪天時は入山を避ける',
  ],
];

/** 末尾に足す1行 */
const CAUTION_ADD =
  '浸水想定区域・土砂災害警戒区域・液状化のいずれも該当なし（甲府市施設カルテ）。ただし区域指定が無いことは、落石・倒木が起きないことを意味しない';

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
  if (c.soloComment !== SOLO_FROM) errors.push('soloComment が想定と違う。既に誰かが直している');
  if (Array.isArray(c.source) && c.source.some((s) => s.includes('shisetu_karte/3-10'))) {
    errors.push('source[] に既にカルテURLがある');
  }
  for (const [from] of CAUTION_EDITS) {
    if (!c.cautions.includes(from)) errors.push(`cautions に該当行が無い: ${from.slice(0, 30)}…`);
  }
  if (c.cautions.includes(CAUTION_ADD)) errors.push('追加する cautions が既にある');
}
if (errors.length) { console.error('中止:\n  ' + errors.join('\n  ')); process.exit(1); }

const before = { source: c.source, soloComment: c.soloComment, cautions: [...c.cautions], lastVerified: c.lastVerified };

console.log(`${WRITE ? '書込' : 'dry'} ${SLUG}\n`);
console.log('【source】');
console.log(`  before: ${before.source === undefined ? '(キー自体が無い)' : JSON.stringify(before.source)}`);
console.log(`  after : ["${KARTE}"]\n`);
console.log('【soloComment】');
console.log(`  before: ${SOLO_FROM}`);
console.log(`  after : ${SOLO_TO}\n`);
console.log('【cautions】');
for (const [from, to] of CAUTION_EDITS) {
  console.log(`  before: ${from}`);
  console.log(`  after : ${to}\n`);
}
console.log(`  追加  : ${CAUTION_ADD}\n`);
console.log('【lastVerified】');
console.log(`  before: ${before.lastVerified}`);
console.log(`  after : ${TODAY}`);

if (WRITE) {
  c.source = [...(c.source ?? []), KARTE];
  c.soloComment = SOLO_TO;
  for (const [from, to] of CAUTION_EDITS) c.cautions[c.cautions.indexOf(from)] = to;
  c.cautions.push(CAUTION_ADD);
  c.lastVerified = TODAY;
  fs.writeFileSync(DATA, JSON.stringify(list, null, 2) + '\n');
  console.log('\n書き込んだ');
} else {
  console.log('\ndry run。書くには --write --force');
}
