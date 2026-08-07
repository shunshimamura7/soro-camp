/**
 * 料金未確認23件の再調査 バッチ4（19〜23件目・最終）の反映。
 * 記録と出典URLは scripts/price24-check.md のバッチ4を見ること。
 *
 * PRICED 3 / UNPRICED 1 / CLOSED 1
 *
 * CLOSED は `sports-train-aokigahara`。公式ドメインが Wix の
 * 「ConnectYourDomain Error」になっていて、なっぷの施設名も「【閉鎖】SPORTS TRAIN in Forest CAMP」、
 * ページに「なっぷ予約不可」と出ている。バッチ2の `hinata-camp` に続く2件目。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const priced = {
  // 施設公式サイトのテントサイトページ。サイト単位課金で、基本料金に2名分と車1台が含まれる。
  // ソロ専用サイト（定員1名）があるのでソロでも割高にならない。
  'fujimangan-village': {
    priceMin: 4070,
    priceMax: 7590,
    priceNote:
      'サイト単位課金。ソロ専用サイト（定員1名）レギュラー4,070円で、これがソロ1名1泊の総額。' +
      '基本料金に2名分と駐車1台が含まれる（2輪は2台まで無料）ため、ソロ・デュオサイトを取っても同額4,070円。' +
      'シーズンでオン4,620円・ハイ5,170円・トップ6,270円。電源付のソロ・デュオDは5,390〜7,590円で電源使用料込み。' +
      'ゴミ袋（可燃45L 1枚）と焚き火台が付く',
  },
  // 施設公式サイトのテントサイトページ。1日4組限定のフリーサイトで、入場料・施設利用料はない。
  'takaranoyama-fureai': {
    priceMin: 2660,
    priceMax: 2660,
    priceNote:
      'サイト単位課金。フリーサイト1張1泊2,660円（税込）のみで、入場料・施設利用料は別途かからない。' +
      'ソロ1名でも同額。1日4組限定（1組あたりテント1張）、駐車は共有スペースに1組1台が基準で無料。' +
      'AC電源なし、ペット不可、支払いは現金のみ。IN 13:00 / OUT 10:00',
  },
  // 道志村観光協会サイト内の施設料金ページ。テントサイトにソロ料金が明記されている。
  'doshi-mori-cottage': {
    priceMin: 2500,
    priceMax: 2500,
    priceNote:
      'サイト単位課金だがソロ料金あり。テントサイト使用（1張・1泊・駐車場代1台・5名まで）4,500円のところ、' +
      'ソロは2,500円。よってソロ1名1泊は2,500円で、駐車1台込み。' +
      '2台目からは1,000円/台（バイク500円）。6名以上はDayキャンプ料金（中学生以上800円・3歳〜小学生500円）が加算。' +
      'シャワーは17〜22時が無料。生ゴミ以外は持ち帰り',
    officialUrl: 'https://doshi-kanko.com/moricote/moricote_ryokin/moricote_ryokin.html',
  },
};

// 施設の同定ができないので料金以前の問題。price24-check.md のバッチ4を見ること。
const unpriced = ['shizunami-beach-camp'];

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

// 「静波海岸キャンプサイト」という名称の施設は存在せず、静波海岸には別名の施設が3つ実在する。
// どれを指しているか決まらないので、料金以前に同定が要る。§6-6 のとおり needsVerify は精度が高い。
{
  const c = data.find((x) => x.slug === 'shizunami-beach-camp');
  c.needsVerify = true;
  console.log('FLAG     shizunami-beach-camp -> needsVerify: true（施設の同定ができていない）');
}

// なっぷの施設名が「【閉鎖】SPORTS TRAIN in Forest CAMP」で予約不可。
// 公式ドメインは Wix の ConnectYourDomain Error（ドメイン接続が切れている）。
{
  const c = data.find((x) => x.slug === 'sports-train-aokigahara');
  if (!c) throw new Error('slug not found: sports-train-aokigahara');
  c.status = 'closed';
  c.priceMin = 0;
  c.priceMax = 0;
  // 生きていないURLを詳細ページからリンクさせない
  c.officialUrl = '';
  c.lastVerified = DATE;
  changed++;
  console.log('CLOSED   sports-train-aokigahara -> status: closed（公式ドメイン失効・なっぷ予約不可）');
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${changed}件を更新した。`);
