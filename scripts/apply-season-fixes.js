/**
 * season が実態と違う2件（scripts/price24-check.md の「残った宿題」）。
 *
 * 調べた結果、**2件のうち1件は season の問題ではなかった。**
 * `takaranoyama-fureai` は 2026年3月末（令和7年度末）で閉館していた。
 * 直前のセッションでこの施設に priceVerified: true と priceMin 2,660 を付けたが、
 * **その時点で既に閉館済みだった。**公式サイトも都留市のページも料金を載せたまま残っている。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// validate-data.js の USABLE_FEATURES と同じ並び
const USABLE_FEATURES = [
  'bonfire', 'pet', 'shower', 'bath', 'carIn', 'soloPlan',
  'convenience', 'shop', 'wifi', 'firewood', 'ice', 'alcohol',
];

// ── 1. 接岨YANBY OUTDOOR FIELD ── season の修正
// なっぷの施設ページに施設自身が書いている:
//   「2026/8/1 予約開始しました！！ 今年の営業は、9/19〜12/5です」
//   「3カ月限定で公園がキャンプ場に！？」「期間限定OPEN !!」「シーズン営業」
// 前シーズンは2025年10月11日〜2026年1月12日の週末営業（ZAZAmag）。
// 年で期間が動くので restrictions（MM-DD 固定）では表せない。season の文字列で持つ。
{
  const c = data.find((x) => x.slug === 'sessokyo-camp');
  if (!c) throw new Error('slug not found: sessokyo-camp');
  c.season = '秋〜初冬の期間限定（年により変動・要確認）。2026年は9月19日〜12月5日';
  // soloComment に「通年」の記述は無かったが、期間限定であること自体が
  // 行けるか行けないかを決める情報なので本文にも入れる。
  // 利用者が読むのは本文のほう（引き継ぎ §6-10）。
  c.soloComment =
    '長島公園が年に3か月だけキャンプ場になる期間限定の施設。' +
    '接岨峡は大井川上流の山あいにあり、空が暗く星がよく見える。' +
    '奥大井湖上駅へのシャトルバスがあり、八橋小道ラブロマンスロード（1周約1時間）も近い。' +
    '星を眺めて過ごす夜向きだが、開設期間が年によって動くので予約前に必ず確認すること。';
  c.lastVerified = DATE;
  console.log(`sessokyo-camp -> season: ${c.season}`);
}

// ── 2. 宝の山ふれあいの里キャンプ場 ── season ではなく閉館だった
// 施設公式「宝の山ふれあいの里 閉館のお知らせ」（2026年2月2日）:
//   「当施設の立地が土砂災害特別警戒区域に指定されていることから安全性を考慮し、
//     令和7年度をもって閉館することとなりました」
// 都留市公式:「令和8年3月末をもって閉館」「コテージ等の施設の立地が
//   土砂災害特別警戒区域（レッドゾーン）に指定されていることから、安全性を考慮し」
// 令和7年度末＝令和8年3月末＝2026年3月31日。**今日（2026-08-07）時点で閉館済み。**
{
  const c = data.find((x) => x.slug === 'takaranoyama-fureai');
  if (!c) throw new Error('slug not found: takaranoyama-fureai');

  c.status = 'closed';
  c.closedReason = 'abolished';
  c.closedNote =
    '施設の立地が土砂災害特別警戒区域（レッドゾーン）に指定されたため、' +
    '安全性を考慮して令和7年度末（2026年3月末）で閉館。都留市の施設で、再開の予定はない ' +
    'https://www.city.tsuru.yamanashi.jp/soshiki/sangyo/shoko_t/3/1365.html';
  c.season = '閉館（旧: 4月1日〜11月30日）';

  // 直前のセッションで入れた料金を落とす。閉館した施設に金額を出さない。
  // 記録は scripts/price24-check.md に残してある（フリーサイト1張1泊2,660円）
  c.priceMin = 0;
  c.priceMax = 0;
  delete c.priceVerified;
  delete c.priceNote;
  delete c.needsPrice;

  // 旧: 「都留市の山上、1日4組限定のフリーサイト。富士山湧水の自然環境、夜の星空が抜群。」
  c.soloComment =
    '都留市の山上にあった市の施設で、1日4組限定のフリーサイトとコテージ6棟があった。' +
    '敷地が土砂災害特別警戒区域に指定されたため、令和7年度末（2026年3月末）で閉館した。' +
    '公式サイトも都留市のページも料金表を載せたまま残っているので、営業中と誤解しないこと。';

  // validate-data.js は closed に利用可能な features が true で残っているとエラーにする
  const dropped = USABLE_FEATURES.filter((k) => c.features[k] === true);
  dropped.forEach((k) => {
    c.features[k] = false;
  });

  c.lastVerified = DATE;
  console.log(
    `takaranoyama-fureai -> status: closed / closedReason: abolished（features ${dropped.length}件を false に）`
  );
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('\n2件を更新した。');
