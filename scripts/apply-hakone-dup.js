/**
 * hakone-kojiri-camp（箱根湖尻キャンプ場）の削除と、ashinoko-camp-mura の料金修正。
 *
 * 2件は同一施設だった。決め手は**電話番号の完全一致**（0460-84-8279）と番地の一致（164）。
 *
 *   ashinoko-camp-mura … 芦ノ湖キャンプ村。箱根町元箱根164、0460-84-8279、campmura.com
 *   hakone-kojiri-camp … 「箱根湖尻キャンプ場」。箱根町箱根164、**電話が同一**、公式URLなし
 *
 * 「箱根湖尻キャンプ場」という施設はなっぷの箱根一覧にも存在しない。
 * soloComment の「芦ノ湖南端に位置する」も誤り（湖尻は芦ノ湖の北端）。
 *
 * 出典: https://campmura.com/ ／ 箱根町観光協会 https://www.hakone.or.jp/254
 *       マピオン電話帳（県立芦ノ湖キャンプ村）https://www.mapion.co.jp/phonebook/M04011/14382/21431068244/
 *       なっぷ 箱根一覧 https://www.nap-camp.com/kanagawa/hakone/list
 *
 * 使い方: node scripts/apply-hakone-dup.js
 */
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
let camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const before = camps.length;

// ── 重複の削除 ──────────────────────────────────────────────────────────────
const i = camps.findIndex((c) => c.slug === 'hakone-kojiri-camp');
if (i === -1) throw new Error('hakone-kojiri-camp が見つからない');
const removed = camps[i];
camps.splice(i, 1);

// ── 残す側の料金を公式・予約サイトの現行値に直す ────────────────────────────
const c = camps.find((x) => x.slug === 'ashinoko-camp-mura');
if (!c) throw new Error('ashinoko-camp-mura が見つからない');
const prev = { priceMin: c.priceMin, priceMax: c.priceMax, priceNote: c.priceNote };

// 公式の料金ページは日付別のPDFカレンダーで金額を出しておらず、
// 区画料金制であることと「ゴミ処理協力費 1人200円/泊」だけが読めた。
// 金額はなっぷ掲載のレンジを採る（予約サイト＝次点の出典）。
c.priceMin = 5700;  // オートサイト1区画5,500円 ＋ ゴミ処理協力費200円
c.priceMax = 11700; // 同 11,500円 ＋ 200円
c.priceNote =
  'サイト単位課金。オートサイト1区画5,500〜11,500円/泊（利用日により変動）＋ゴミ処理協力費1人200円/泊 → ' +
  'ソロ1名1泊5,700円〜。ケビン（独立棟）31,500〜43,500円、（連立棟）25,500〜37,500円。テントサイトは約4.5m×4.5m';
c.lastVerified = '2026-08-07';

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log('削除:');
console.log(`  ${removed.slug}（${removed.name}）`);
console.log(`    住所 ${removed.address} / 電話 ${removed.tel}`);
console.log(`    → ashinoko-camp-mura と電話番号が完全一致。同一施設の二重登録\n`);
console.log('ashinoko-camp-mura の料金を修正:');
console.log(`  priceMin: ${prev.priceMin} → ${c.priceMin}`);
console.log(`  priceMax: ${prev.priceMax} → ${c.priceMax}`);
console.log(`  priceNote: "${prev.priceNote}"`);
console.log(`          → "${c.priceNote.slice(0, 60)}..."`);
console.log(`\n件数: ${before} → ${camps.length}`);
