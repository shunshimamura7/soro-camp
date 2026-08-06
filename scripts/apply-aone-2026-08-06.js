/**
 * 青根エリア2施設の情報補完（2026-08-06）と、未同定施設の記述整理。
 *
 * ■ 神之川キャンプ・マス釣り場
 *   名前の正規化では既存と一致しなかったが、officialUrl が既存 `kannogawa` と
 *   同一（https://kannogawa.jp/）のため同一施設と判断し、新規追加せず補完する。
 *   既存 priceNote に改定前の「オートサイト2,860円〜」が入っていたため価格を更新。
 *
 * ■ このまさわキャンプ場
 *   名前が完全一致（konomasawa-camp）。補完のみ。
 *   予約要否が「不要」→「要」に変わるため、soloComment の
 *   「予約不要で思い立ったら行ける」も併せて直さないと矛盾する。
 *
 * ■ 丸太村キャンプ場
 *   実在未確認のため、断定的な描写をすべて削除する。
 *
 * 使い方: node scripts/apply-aone-2026-08-06.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const find = slug => {
  const c = camps.find(x => x.slug === slug);
  if (!c) console.warn(`警告: slug "${slug}" が見つかりません`);
  return c;
};

// ── a) 神之川キャンプ・マス釣り場 ──────────────────────────────────────────
const k = find('kannogawa');
if (k) {
  console.log('■ 神之川キャンプ・マス釣り場（既存 kannogawa に補完）');
  console.log(`   名前: "${k.name}" → "神之川キャンプ・マス釣り場"`);
  console.log(`   価格: ¥${k.priceMin}〜¥${k.priceMax}（${k.priceNote}）`);
  k.name = '神之川キャンプ・マス釣り場';
  k.address = '神奈川県相模原市緑区青根3685';
  k.officialUrl = 'https://kannogawa.jp/';
  k.priceMin = 3080;
  k.priceMax = 3080;
  // バンガロー料金は専用フィールドがないため priceNote に含めて保持する
  k.priceNote = '区画サイト宿泊。日帰り2,000円。バンガロー6畳8,250円／高床式16,500円／12畳19,800円。2026年4月1日改定';
  k.features.reservation = '要';
  k.cautions = ['予約日から1週間以上前の場合は往復はがきでの受付'];
  k.lastVerified = '2026-08-06';
  k.soloComment =
    'キャンプと管理釣り場が一体の渓流サイト。全区画が神之川沿いの河原にあり、場内でマス釣りやつかみ取りができる。温水シャワーと家族風呂が揃い入浴も困らない。';
  console.log(`        → ¥${k.priceMin}（${k.priceNote}）`);
  console.log(`   予約: ${k.features.reservation} / cautions ${k.cautions.length}項目`);
}

// ── b) このまさわキャンプ場 ────────────────────────────────────────────────
const n = find('konomasawa-camp');
if (n) {
  console.log('\n■ このまさわキャンプ場（既存 konomasawa-camp に補完）');
  const beforeRes = n.features.reservation;
  n.address = '神奈川県相模原市緑区青根2745';
  n.tel = '042-787-2735';
  n.officialUrl = 'https://konomasawacamp.co.jp/';
  Object.assign(n.features, {
    shower: true,
    shop: true,
    carIn: true,
    carInNote: 'オートサイト約50区画',
    reservation: '要',
  });
  n.lastVerified = '2026-08-06';
  // 予約が「不要」→「要」に変わるため、soloComment の「予約不要」表記も直す
  n.soloComment =
    '道志川と支流の此の間沢が流れる渓流サイト。オート約50区画で車を横付けでき、シャワー・売店・ランドリーも揃う。予約制なので事前に押さえてから向かいたい。';
  console.log(`   予約: ${beforeRes} → ${n.features.reservation}（soloComment の「予約不要」表記も修正）`);
  console.log(`   officialUrl: ${n.officialUrl}`);
}

// ── 2) 丸太村キャンプ場 ────────────────────────────────────────────────────
const m = find('marutamura-camp');
if (m) {
  console.log('\n■ 丸太村キャンプ場（marutamura-camp）');
  console.log(`   変更前: ${m.soloComment}`);
  m.needsVerify = true;
  m.soloComment =
    '※この施設は実在を確認できていません。閉鎖済みか、正式名称が異なる可能性があります。訪問前に必ずご確認ください。';
  console.log(`   変更後: ${m.soloComment}`);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));
console.log(`\n合計 ${camps.length}件（新規追加なし）`);
console.log(`needsVerify: ${camps.filter(c => c.needsVerify).length}件`);
