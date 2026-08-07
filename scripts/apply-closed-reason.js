/**
 * closed 4件に closedReason / closedNote を付ける。
 *
 * 経緯は scripts/price24-check.md の「残った宿題」を見ること。
 * 詳細ページは closed 全件に「この場所は現在キャンプが禁止されています。訪問しないでください」を
 * 出していたが、これが正しいのは自治体がキャンプを禁じた `sanogawa-camp` だけだった。
 *
 * あわせて **soloComment の現役前提の記述も直す**（引き継ぎ §6-10）。
 * 警告だけ直して本文を放置すると、本文のほうが読まれるので意味がない。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const patches = {
  // 自治体がキャンプを禁じた。場所（佐野川河川公園）自体は在る。
  // soloComment は既に「現在キャンプは禁止されています」で始まっていて矛盾がないので触らない。
  'sanogawa-camp': {
    closedReason: 'prohibited',
    closedNote:
      '南部町が河川公園として管理しており、公園内でのキャンプ・火気の使用は認められていない。' +
      'かつて無料の野営地として知られていた場所だが、現在は利用できない',
  },

  // 公共施設の用途廃止。跡地は三井住友銀行が取得した「SMBCの森」に含まれる。
  'hinata-camp': {
    closedReason: 'abolished',
    closedNote:
      '伊勢原市が令和6年3月に用途を廃止。跡地を含む森林は三井住友銀行が「SMBCの森」として取得し、' +
      '「伊勢原自然塾」として利用されている https://www.city.isehara.kanagawa.jp/docs/2024112800066/',
    // 旧: 「大山日向薬師の麓、伊勢原の渓流沿い。アクセス抜群で平日ソロにも最適。」
    // 廃止された施設を現役として勧めている文面だった
    soloComment:
      '大山日向薬師の麓、伊勢原の渓流沿いにあった市営キャンプ場。' +
      '夏の約6週間だけ開設し、市内在住者の申込が先に始まる形だったが、令和6年3月に廃止された。' +
      '跡地は「SMBCの森」として森林保全と研修の場になっており、キャンプ場としては再開しない。',
    // 廃止済みなので開設期間を書き続けない
    season: '廃止（令和6年3月まで 7月20日〜8月31日のみ開設）',
  },

  // 民間の営業終了。公式ドメインが失効し、なっぷも予約不可。
  'sports-train-aokigahara': {
    closedReason: 'closed_business',
    closedNote:
      '営業を終了している。公式サイト（sportstraincamp.com）はドメインの接続が切れており、' +
      'なっぷの施設名も「【閉鎖】SPORTS TRAIN in Forest CAMP」で予約不可になっている ' +
      'https://www.nap-camp.com/yamanashi/14549',
    // 旧: 「青木ヶ原樹海の中の異世界キャンプ場。アウトドアセレクトショップ運営、洗練された空間。」
    soloComment:
      '青木ヶ原樹海の中にあった1日11組限定の小さなキャンプ場で、' +
      'アウトドアセレクトショップが運営していたが、現在は閉業している。' +
      '湖や富士山は見えないかわりに、森だけを眺めて過ごせる場所だった。' +
      'モンベルのフレンドショップ検索や旅行サイトには今も料金付きで残っているので注意。',
    season: '閉業（旧: 通年／1月・2月は冬季休業）',
  },

  // 民間の営業終了。soloComment は既に「現在は閉業している」と書いてあるので触らない。
  'fujigane-kogen': {
    closedReason: 'closed_business',
    closedNote:
      '2020年6月開業、現在は閉業。所在地は静岡県富士宮市ではなく山梨県富士河口湖町富士ヶ嶺 ' +
      'https://camp-quests.com/39367/',
    season: '閉業（旧: 通年）',
  },
};

let changed = 0;
for (const [slug, patch] of Object.entries(patches)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  Object.assign(c, patch);
  c.lastVerified = DATE;
  changed++;
  console.log(`${slug} -> closedReason: ${c.closedReason}`);
}

// closed なのに漏れがないか、その場で確かめる
const missing = data.filter((c) => c.status === 'closed' && !c.closedReason);
if (missing.length) throw new Error(`closedReason 未設定: ${missing.map((c) => c.slug).join(', ')}`);

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${changed}件を更新した。`);
