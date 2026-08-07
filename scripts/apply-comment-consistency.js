/**
 * soloComment とフィールドの矛盾、および priceMin の意味の不統一を直す。
 *
 * 今日フィールドを更新した177件のうち、soloComment を据え置いた52件を
 * 「予約期限・金額・営業期間・地名」の観点で突き合わせて出てきたもの。
 *
 * あわせて priceMin の意味を統一する。batch76 の反映で
 * 「priceMin = ソロ1名が実際に払う総額（宿泊）」に決めたが、
 * それ以前に触った施設や対象外だった施設に**デイキャンプ料金や部分料金**が
 * 残っていた。価格順ソートが同じ意味の数字で並ばなくなるので直す。
 *
 * 使い方: node scripts/apply-comment-consistency.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const changes = [];
function set(slug, field, next, reason) {
  const c = camps.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug "${slug}" が見つからない`);
  const keys = field.split('.');
  let obj = c;
  for (const k of keys.slice(0, -1)) obj = obj[k];
  const last = keys[keys.length - 1];
  const prev = obj[last];
  obj[last] = next;
  changes.push({ slug, field, prev, next, reason });
}

// ── A. soloComment が古い内容のまま矛盾していたもの ─────────────────────────

// フェーズ3で reservationNote を「1週間前 → 3日前」に直したが、本文が据え置きだった。
// 出典: 沼津市 市民の森 https://www.city.numazu.shizuoka.jp/kurashi/shisetsu/shiminnomori/
set(
  'numazu-shimin-no-mori',
  'soloComment',
  '無料なのに炊事棟もトイレも整い、かまど用の薪まで只でもらえる。展望台からは富士山と駿河湾。' +
    '3日前までの予約を忘れずに。園内の水は飲料に適さないので飲み水は持参する。',
  'reservationNote を3日前に直したのに本文が1週間前のままだった。あわせて飲料水の注意も本文に入れた',
);

// area を「湯河原・海沿い」→「小田原市・根府川」に直したが、本文が湯河原のままだった。
// 出典: じゃらん なみのこ村 https://www.jalan.net/kankou/spt_guide000000162746/
set(
  'naminokomura',
  'soloComment',
  '小田原市根府川、JR根府川駅から徒歩10分の海沿いオートキャンプ場。目の前に相模湾が広がる稀少な海キャンプ。',
  'area を小田原市・根府川に直したのに本文が「湯河原の海岸沿い」のままだった',
);

// area/address を清水区に直した際、コメントの「管理棟も受付もない」を据え置いていた。
// 出典: 旅んちゅや 土村キャンプ適地（2024年8月時点の二次情報）
//       https://camp.tabinchuya.com/shizuoka/domura.html
set(
  'tsuchimura',
  'soloComment',
  '興津川沿いの無料の適地。水洗トイレと屋根付きの炊事場があり、夏季は管理棟で簡単な受付がある。' +
    '薪も売店もなく全て持参、路面次第では四駆でないと入れない区画もある。',
  '「管理棟も受付もない放任スタイル」が調査結果と矛盾（水洗トイレ・炊事場あり、夏季は管理棟で受付）。※出典は二次情報',
);

// area を小山町に直したが、本文の「御殿場IC」だけだと所在地を誤認させる。
// アクセス説明としては正しいので、所在地を1語足すにとどめる。
set(
  'nelo-gotemba',
  'soloComment',
  '小山町にある高規格キャンプ場。御殿場ICから10分、足柄スマートICから5分。富士山ビューと整った設備。',
  'area を小山町に直したが、本文が「御殿場IC」のみで所在地を誤認させうる',
);

// 同上。ここの中津川は酒匂川水系で、愛川町を流れる相模川水系の中津川とは別。
set(
  'hachibanaen-miroku',
  'soloComment',
  '松田町寄の中津川沿い、1日10組限定の予約制プライベートキャンプ場。ペットゾーンあり。' +
    '料金は1人あたりなので、ソロなら人数分だけで済む。',
  'area を松田町・寄に直したが、本文が「中津川沿い」のみで厚木の中津川と混同されうる',
);

// ── B. priceMin の意味が統一されていなかったもの ────────────────────────────
// batch76 の方針「priceMin = ソロ1名が実際に払う総額（宿泊）」に合わせる。

// priceNote に「テント1,000円+車2,000円=3,000円〜」とあり、soloComment も3,000円と書いている。
// priceMin だけがテント代のみの1,000円だった。
set('shojiko-camping', 'priceMin', 3000, 'priceNote の合計3,000円・soloComment の記述と食い違っていた（テント代のみが入っていた）');

// フェーズ1で priceMin にデイキャンプ料金（1,100円）を入れていたが、
// その後 batch76 で「宿泊のソロ総額」に方針を決めたので合わせる。
// 出典: 大柳川渓流キャンプ場 料金 https://ooyanagawa-camp.com/
set('ogayanagawa-keikoku', 'priceMin', 1800, 'デイキャンプ料金が入っていた。テント泊は大人1,800円');

// 同じくデイキャンプ料金が入っていた。宿泊1泊2日は1〜10人2,000円。
set('kamioshima-camp', 'priceMin', 2000, 'デイキャンプ料金が入っていた。宿泊1泊2日は1〜10人2,000円');

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`${changes.length}件を修正\n`);
for (const ch of changes) {
  console.log(`── ${ch.slug}  ${ch.field}`);
  console.log(`   理由: ${ch.reason}`);
  const fmt = (v) => (typeof v === 'string' ? `"${v}"` : String(v));
  console.log(`   - ${fmt(ch.prev)}`);
  console.log(`   + ${fmt(ch.next)}`);
  console.log();
}
