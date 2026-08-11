/**
 * `okudoshi-auto`（奥道志オートキャンプ場）の修正。
 * 記録は sankoso-saiko-check-2026-08.md の「追記 — okudoshi-auto」節。
 *
 * `sankoso-auto` と同じ型（同じ一括投入回・lastVerified 2026-05-26）の住所誤りとして
 * 前日の調査で見つかっていたもの。一次情報から引き直したところ、
 * **住所以外にも sankoso-auto と同じ誤り（予約 不要／直火OK／料金に人数課金が抜けている）が揃っていた。**
 *
 * - address 9246 → 12637（村公式と施設公式が一致。旧値はどの施設のものでもない＝§6-16 の捏造）
 * - tel なし → 0554-52-2027（村公式・施設公式トップが一致）
 * - officialUrl なし → https://www.okudoshi.net
 * - season 通年（冬季は要確認）→ 4月中旬〜11月中旬。**厳寒期は営業していない**
 * - reservation 不要 → 要（電話。3か月前から受付）
 * - bonfireNote 直火OK → 直火不可（焚き火台＋焚き火シートが要る）
 * - 料金 2,000円 → 3,000円（サイト料2,000＋大人1,000。人数課金が抜けていた）
 * - coordsVerified を外す。小数2桁（粒度およそ1km）は人が地図のピンを読んだ値ではない
 * - soloComment を全文差し替え（「設備は最低限」「秘境」「直火OK・予約不要・2,000円〜」が
 *   いずれも一次情報と矛盾。§6-16）
 *
 * 使い方: node scripts/apply-okudoshi-2026-08.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const VERIFIED_DATE = '2026-08-11';

const c = camps.find((x) => x.id === 'okudoshi-auto');
if (!c) throw new Error('okudoshi-auto が見つからない');

// 名前は村公式の表記（奥道志オートキャンプ場）のまま。施設公式のタイトルは
// 「奥道志キャンプ場」だが、§6-18 の優先順で自治体公式を採る。
c.address = '山梨県南都留郡道志村12637';
c.tel = '0554-52-2027';
// 施設公式のアクセスページには 0554-52-2176 も出るが、村公式・施設公式トップが
// そろって 0554-52-2027 を「予約先」としているのでこちらを採る。
c.telNote = '予約先。携帯 090-8817-5035 もある。受付は9:00〜19:00';
c.officialUrl = 'https://www.okudoshi.net';
c.season = '4月中旬〜11月中旬';

// 座標: 逆ジオは道志村を返して OK だが、値が 35.47 / 138.944 と小数2〜3桁しかない。
// 地図のピンを読めば小数6〜7桁になるので、これは人の目視の記録ではない（§2-5）。
// 粒度およそ1km は folkwood-yatsugatake について §7-6 で既に問題と判定している水準。
// coordsGsiChecked（機械検証を通った事実）はそのまま残す。
delete c.coordsVerified;
c.needsCoord = true;

// 料金: 施設公式の料金表がそのまま読める（HTMLに数字がある）。
// ソロ1名の総額 = サイト料2,000円（車代込）+ 大人1,000円。
c.priceMin = 3000;
c.priceMax = 3000;
c.priceNote =
  '区画課金＋人数課金の併用。サイト料2,000円（車代込）＋大人1,000円で、ソロ1名の総額は3,000円。' +
  '子供600円。旧データの2,000円はサイト料だけで人数課金が抜けていた。' +
  'BBQハウスは1泊2,000円（車1台込）、バンガローはA・B棟7,000円／C棟17,000円（寝具持参・車1台込）。' +
  '温水シャワーは5分200円、薪は針葉樹1束600円で別料金';
c.priceVerified = true;

Object.assign(c.features, {
  // 焚き火そのものは可。直火だけが不可（施設公式「焚火台＋シート持参の事」）
  bonfire: true,
  bonfireNote: '直火不可。焚き火台と焚き火シートの持参が必要（レンタルあり・焚き火台1,500円）',
  // 一次情報に記載が無い。true の根拠が見つからないので、根拠のない主張を残さない
  pet: false,
  petNote: '要確認（村公式・施設公式とも記載なし）',
  shower: true,
  showerNote: '温水シャワー 5分200円',
  bath: false,
  bathNote: '場内に風呂は無いが、管理棟で道志の湯・紅椿の湯・石割の湯の優待券を配布している',
  toilet: 'ウォシュレット',
  toiletNote: '3箇所（男女別）。洋式13で全てウォシュレット付',
  // 電話予約。「不要」のままだと予約せず行って利用できないことになる
  reservation: '要',
  reservationNote: '電話予約（0554-52-2027／受付9:00〜19:00）。3か月前から受け付ける。サイトの指定は希望のみ',
  firewood: true,
  firewoodNote: '針葉樹1束600円。場内や山の枯れ木を採って燃やすのは禁止',
  garbage: '生ゴミ以外はすべて持ち帰り（道志地区の取り決め）',
});

// 旧本文は「設備は最低限」「秘境」「直火OK・予約不要・2,000円〜という三拍子」が
// すべて一次情報と矛盾し、「電波が届かない」「天の川が肉眼で見える」は出典が無い（§6-16）。
c.soloComment =
  '道志川沿いの区画オートキャンプ場。ムササビを近くで観察できることを施設公式が売りにしていて、' +
  '場内はホタルの生息地でもある。トイレは3箇所とも全てウォシュレット付きで、コインランドリーと売店があり、' +
  '電源付きサイトも6区画ある。直火は不可なので焚き火台と焚き火シートを持参する（レンタルもある）。' +
  '温水シャワーは5分200円。管理棟で道志の湯・紅椿の湯・石割の湯の優待券がもらえる。' +
  '予約は電話で、営業は4月中旬から11月中旬まで。';

c.cautions = [
  '川遊びだけの利用はできない https://www.okudoshi.net/ryo/ryoukin.html',
];

c.lastVerified = VERIFIED_DATE;

// 既存ファイルは末尾に改行を持たない。差分を最小にするため揃える
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
console.log('apply-okudoshi: okudoshi-auto を更新した');
console.log('  住所 9246 → 12637 / 予約 不要 → 要 / 直火OK → 直火不可 / 料金 2,000 → 3,000 / 営業 通年 → 4月中旬〜11月中旬');
