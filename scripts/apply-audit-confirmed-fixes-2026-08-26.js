const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'data', 'campgrounds.json');
const camps = JSON.parse(fs.readFileSync(file, 'utf8'));
const byId = new Map(camps.map((camp) => [camp.id, camp]));

function requireCamp(id) {
  const camp = byId.get(id);
  if (!camp) throw new Error(`対象施設が見つかりません: ${id}`);
  return camp;
}
function addSource(camp, source) {
  camp.source = Array.isArray(camp.source) ? camp.source : [];
  if (!camp.source.includes(source)) camp.source.push(source);
}

// 2026年度の公式料金：大人テントサイト3,245円＋普通車550円。
const ymca = requireCamp('fuji-ymca');
ymca.priceMin = 3795;
ymca.priceMax = 3960;
ymca.priceNote = '2026年4月1日以降の一般大人テントサイト3,245円＋普通車駐車料金550円。繁忙期は3,410円＋550円（車利用ソロの通常期総額3,795円〜）';
ymca.priceVerified = true;
ymca.needsPrice = false;
ymca.lastVerified = '2026-08-26';
addSource(ymca, '2026年度料金 https://www.yokohamaymca.org/fujisan-global/charge/');
addSource(ymca, '公式サイト https://www.yokohamaymca.org/fujisan-global/');

// 公式サイトのGoogle Mapsリンクが示す施設実ピン。
const mobility = requireCamp('mobility-park-izu');
mobility.lat = 35.0092752;
mobility.lng = 139.0229702;
mobility.coordsVerified = true;
mobility.needsCoord = false;
mobility.lastVerified = '2026-08-26';
addSource(mobility, '公式サイト・地図リンク https://mobility-park.jp/');

// 公式FAQが「車1台1人でテント泊2,600円」と明示。
const takizawa = requireCamp('takizawaso');
takizawa.priceMin = 2600;
takizawa.priceMax = 2600;
takizawa.priceNote = '車1台・1人でテント泊2,600円（施設公式FAQ）。フリーサイトは当日受付のみ';
takizawa.priceVerified = true;
takizawa.needsPrice = false;
takizawa.lastVerified = '2026-08-26';
addSource(takizawa, '公式FAQ（料金・予約・設備） https://takizawaen.com/');

// 一般区画料金は公式から金額を確定できない。公式で明示された期間限定ソロ割のみを表示。
const sankoso = requireCamp('sankoso-auto');
sankoso.priceMin = 3100;
sankoso.priceMax = 3100;
sankoso.priceNote = '空きがある場合、前々日から予約できる「ソロキャン直前割」3,100円（入場料込み）。通常の区画料金は公式確認中';
sankoso.priceVerified = true;
sankoso.needsPrice = false;
sankoso.lastVerified = '2026-08-26';
addSource(sankoso, '公式料金・設備案内 https://www.sanko2400.com/');

fs.writeFileSync(file, JSON.stringify(camps, null, 2) + '\n');
console.log(JSON.stringify({ updated: ['fuji-ymca','mobility-park-izu','takizawaso','sankoso-auto'] }, null, 2));
