/**
 * 料金未確認23件の再調査 バッチ3（13〜18件目）の反映。
 * 記録と出典URLは scripts/price24-check.md のバッチ3を見ること。
 *
 * PRICED 5 / UNPRICED 1
 *
 * priceMax の決め方を統一した。**同じ施設でソロが実際に選べるテント泊サイトの最高額（総額）。**
 * グランピング・トレーラー・コテージなど別カテゴリの宿泊は含めない。
 * 価格順ソートの意味が施設ごとにぶれるため（引き継ぎ §10-2 と同じ論点）。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const priced = {
  // 施設公式サイトのトップページ内 #price セクション。ソロ専用区画「ソロブッシュ」がある。
  'camp-akaike': {
    priceMin: 2500,
    priceMax: 6500,
    priceNote:
      '区画+人数課金。入場料 大人（中学生以上）1,500円＋ソロ専用の「ソロブッシュ」1,000円〜で、ソロ1名1泊2,500円〜。' +
      'ソロブッシュはアーリー＆レイト込みで最長32時間滞在でき、テント・タープ計2張まで（直径3m超のテント不可、ハンモック泊推奨）。' +
      'バイクのフリーサイトも1,000円〜。車で乗り入れるならオートサイトA・C 2,000円〜（総額3,500円〜）、最上位のYサイトは5,000円〜（総額6,500円〜）',
  },
  // 施設公式サイトの BOOKING ページ。キャンプサイトは人数課金で、駐車場15台は無料。
  'flora-campsite': {
    priceMin: 3500,
    priceMax: 3500,
    priceNote:
      '人数課金。キャンプサイトのテント泊プラン1名3,500円〜で、ソロ1名1泊3,500円〜。駐車場15台は無料。' +
      '13張のフリーサイト。デイキャンププランは1名1,800円〜。ゴミ処理は30ℓ300円（持ち帰りなら無料）、シャワーは20分500円。' +
      '同じ敷地のグランピングテントは別カテゴリで1泊1名 平日8,800円〜・土日9,900円〜',
    officialUrl: 'https://www.floracampsite.com/',
  },
  // 道の駅しもべ［下部農村文化公園］の公式サイト内キャンプページ。
  'shimobe-yurucamp-sato': {
    priceMin: 2750,
    priceMax: 2750,
    priceNote:
      '区画+人数課金。テントサイト1区画2,200円〜（普通車1台まで）＋施設利用基本料 大人（中学生以上）550円で、ソロ1名1泊2,750円〜。' +
      '2泊目以降の施設利用基本料は1泊330円。小学生は330円（2泊目以降165円）、小学生未満は無料。' +
      'バイク・ソロ向け（定員1〜2名）が7サイト、ファミリー（定員1〜6名）が10サイト',
    officialUrl: 'https://www.michinoeki-shimobe.jp/camp/',
  },
  // 施設公式サイトの Q&A ページ。完全会員制で、初回に入会金／年会費が必ずかかる。
  'bushcraft-shonan': {
    priceMin: 3200,
    priceMax: 3700,
    priceNote:
      '人数課金（全年齢1名ごと）＋初回のみ会費。完全会員制で、初回に入会金／年会費 合計2,000円（税別＝2,200円）が必須。' +
      '利用料の定価は駐車場＋区画で 月〜木1,000円／金〜日1,300円／ハイシーズン1,500円、' +
      '区画のみ（バイク・自転車・徒歩）は 月〜木・金〜日750円／ハイシーズン1,000円。' +
      'よって初回ソロ1名1泊は最安3,200円（会費2,200円＋月〜木1,000円）、2回目以降は1,000円。' +
      '駐車場は「駐車場利用予約」をした人専用で1区画1台・場内合計2台まで。現在20%割引キャンペーン中で利用料は800〜1,200円',
  },
  // Walkerplus の取材記事となっぷのプラン一覧。サイト単位課金で入場は無料。
  'recamp-fuji-speedway': {
    priceMin: 4300,
    priceMax: 4300,
    priceNote:
      'サイト単位課金。オートキャンプサイト1泊4,300円〜で、約100㎡・定員6名・駐車スペース込み・AC電源ありのため、' +
      'ソロ1名でも同額（人数割にならない）。サーキットへの入場は無料（レース・イベント時を除く）。' +
      'ドッグオートキャンプサイトは7,800円〜、トレーラーコテージ以上は27,000円〜',
    officialUrl: 'https://www.recamp.co.jp/fujispeedway',
  },
};

const unpriced = ['village-hakushu'];

let changed = 0;

for (const [slug, patch] of Object.entries(priced)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  Object.assign(c, patch);
  c.priceVerified = true;
  c.lastVerified = DATE;
  delete c.needsPrice;
  changed++;
  console.log(`PRICED   ${slug} -> ${c.priceMin}〜${c.priceMax}円`);
}

for (const slug of unpriced) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  c.needsPrice = true;
  c.priceMin = 0;
  c.priceMax = 0;
  c.lastVerified = DATE;
  changed++;
  console.log(`UNPRICED ${slug} -> needsPrice: true, priceMin/Max: 0`);
}

// 公式サイトが見つかったので入れておく（料金の出典そのもの）。
{
  const c = data.find((x) => x.slug === 'village-hakushu');
  c.officialUrl = 'https://www.village-hakushu.com/';
}

// eligibility の note が新しい priceNote と食い違うので直す。
// 「初回はモニター利用が無料」だけを書いていると、初回に会費2,200円が要ることが伝わらない。
// 引き継ぎ §6-10（フィールドだけ直して本文を放置すると矛盾が残る）と同じ問題。
{
  const c = data.find((x) => x.slug === 'bushcraft-shonan');
  c.eligibility.note =
    '完全会員制。初回の予約時に入会金／年会費 合計2,000円（税別）の支払いが必要で、飛び込みでは利用できない。' +
    'ただし初回1泊に限り、利用後に写真を送ると会費不要・利用料返金となる「モニター利用」を選べる';
  c.eligibility.source = 'ブッシュクラフト湘南 公式 よくある質問 https://bush-craft.biz/qa/';
  console.log('FIXED    bushcraft-shonan eligibility.note（会費の記載を追加）');
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${changed}件を更新した。`);
