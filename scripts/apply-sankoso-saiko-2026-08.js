/**
 * sankoso-saiko-check-2026-08.md の反映（引き継ぎ §7-3 / §7-4）。
 *
 * 座標は入れない。**目視作業の前提（実在・正式名称・住所）を確定させるだけ。**
 *
 * `sankoso-auto`
 *   実在は村公式（網羅率75%）と施設公式の2ソースで確認できた。誤っていたのは中身。
 *   - address 5347 → 11777（村公式・施設公式が一致。5347 はどの施設のものでもない＝§6-16 の捏造）
 *   - tel 0554-52-2346 → 090-3059-1777（旧番号は村公式32件のどこにも無い）
 *   - name 「山光荘オートキャンプ場」→「山光荘オートキャンプ」（村公式・施設公式の表記）
 *   - reservation 不要 → 要（電話予約のみ）。**予約せず行くと利用できない誤りだった**
 *   - bonfireNote 「直火OK」→ 直火禁止（施設公式FAQ）。**規約違反になる誤りだった**
 *   - coordsVerified を外して needsCoord を立てる（§2-6 の用途2。誤った座標は残す）
 *   - priceVerified を外す。課金方式は施設公式で取れたが、**区画サイト料の金額が
 *     JS 描画で取得できない**（§6-24 と同型）。第三者ブログの数字では立てない
 *   - soloComment を全文差し替え（「老舗」「予約不要」「直火OK」が一次情報と矛盾。§6-16）
 *
 * `saiko-tsuhara-camp`
 *   割れていた住所を施設公式で確定。**電話番号も同時に割れており**、
 *   町観光連盟だけが両方で外れていた（＝古いレコード）。
 *   - address 西湖351 → 西湖2299（施設公式・県公式・河口湖商工会が一致）
 *   - tel null → 070-1312-0133
 *   - cautions（住所が割れている旨）を削除
 *   座標は 0,0・needsCoord: true のまま。
 *
 * 使い方: node scripts/apply-sankoso-saiko-2026-08.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const VERIFIED_DATE = '2026-08-11';

let changed = 0;

// ── §7-3 sankoso-auto ─────────────────────────────────────────────
const sankoso = camps.find((c) => c.id === 'sankoso-auto');
if (!sankoso) throw new Error('sankoso-auto が見つからない');

sankoso.name = '山光荘オートキャンプ';
sankoso.address = '山梨県南都留郡道志村11777';
sankoso.tel = '090-3059-1777';
sankoso.officialUrl = 'https://www.sanko2400.com/';
sankoso.season = '通年';
sankoso.closedDays = '水曜日';

// 座標: 逆ジオが神奈川県相模原市緑区牧野を返す（PREF_MISMATCH）。
// 住所が 11777 で確定した以上この座標は誤りなので、目視確認の記録である
// coordsVerified を外す（§6-1）。値は 0 で潰さず残す（§2-6 の用途2）。
delete sankoso.coordsVerified;
sankoso.needsCoord = true;

// 料金: 「区画サイト料 + 入場料600円/人」までは施設公式で確定。
// 区画サイト料の金額は施設公式の料金表が JS 描画で取れず、第三者ブログにしか無い。
// 一次情報ではないので priceVerified は立てない（サイト上は「料金 要確認」のまま）。
sankoso.priceMin = 3400;
sankoso.priceMax = 4400;
sankoso.priceNote =
  '区画課金＋人数課金の併用。ソロ1名の総額は「区画サイト料＋入場料600円」。' +
  '入場料600円（5歳以上）・電源使用時+1,100円・車追加1台800円・アーリーチェックイン+1,000円は施設公式で確認済み。' +
  '区画サイト料の金額だけが施設公式の料金表（JS描画）から取得できず未確定で、' +
  '第三者ブログでは平日2,800〜3,300円／土日祝・夏季3,300〜3,800円。priceMin/priceMax はこれに入場料を足した推定値。' +
  '施設公式には「ソロキャン直前割 3,100円（入場料込・空きがあれば前々日から）」の記載がある。支払いは現金のみ';
delete sankoso.priceVerified;

Object.assign(sankoso.features, {
  // 焚き火そのものは可。直火だけが禁止（施設公式FAQ）
  bonfire: true,
  bonfireNote: '直火禁止。焚き火台の使用が必要',
  // 一次情報に記載が無い。true の根拠が見つからないので、根拠のない主張を残さない
  pet: false,
  petNote: '要確認（村公式・施設公式とも記載なし）',
  shower: true,
  showerNote: 'コインシャワー2台。12月から春までは使用できない',
  toilet: '洋式',
  toiletNote: '換気システム付き。女性用洋式3・洗面台2／男性用洋式2・小2・洗面台2',
  // 電話予約のみ。「不要」のままだと予約せず行って利用できないことになる
  reservation: '要',
  reservationNote:
    '電話予約のみ（090-3059-1777／受付10:00〜19:00・水曜定休）。3か月先まで可、当日予約も受け付ける',
  soloPlan: true,
  soloPlanNote: 'ソロキャン直前割 3,100円（入場料込）。空きがあれば前々日から予約可能',
  // 薪の販売あり（施設公式FAQ）。レンタル用品は無いと明記されている
  firewood: true,
  firewoodNote: '針葉樹の間伐材を販売。数に限りがある。レンタル用品は置いていない',
  shop: false,
  garbage: '生ゴミ・灰・炭以外は持ち帰り',
});

sankoso.cautions = [
  '通年営業だが、積雪・地盤凍結により閉場する場合がある。12月から春はシャワーが使えない https://www.sanko2400.com/',
];

// 旧本文の「老舗」「直火OK」「予約不要」は一次情報と矛盾しており、
// 「朝の川霧」「川遊び」は出典が無い（§6-16）。確認できた事実だけで書き直す。
sankoso.soloComment =
  // 「No.1〜15」と書くと validate-data の最上級表現チェックが「No.1」を拾うので言い換える
  '道志川沿いの区画オートキャンプ場で全25サイト。うち15区画には個別の水道流し台が付き、' +
  '一部のサイトは電源が使える。直火は禁止なので焚き火台を持参する。' +
  'トイレは換気システム付きの洋式で、コインシャワーもある（12月から春は使用不可）。' +
  '予約は電話のみ、水曜は定休で、支払いは現金のみ。空きがあれば前々日からソロキャン直前割が使える。';

sankoso.lastVerified = VERIFIED_DATE;
changed++;

// ── §7-4 saiko-tsuhara-camp ───────────────────────────────────────
const tsuhara = camps.find((c) => c.id === 'saiko-tsuhara-camp');
if (!tsuhara) throw new Error('saiko-tsuhara-camp が見つからない');

// 施設公式 https://tsuhara-camp.jp/access ／県公式観光ネット／河口湖商工会が
// いずれも 2299 と 070-1312-0133。町観光連盟だけが 351 と 0555-82-2234 で、
// 住所と電話の両方が同時に外れている（＝レコードごと古い）。
tsuhara.address = '山梨県南都留郡富士河口湖町西湖2299';
tsuhara.tel = '070-1312-0133';
tsuhara.officialUrl = 'https://tsuhara-camp.jp/';
// 住所が確定したので「割れている」注意書きは役目を終えた
delete tsuhara.cautions;
tsuhara.lastVerified = VERIFIED_DATE;
// 座標は入れない。lat/lng は 0,0・needsCoord: true のまま（人が目視で取る）
changed++;

// 既存ファイルは末尾に改行を持たない。差分を最小にするため揃える
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
console.log(`apply-sankoso-saiko: ${changed}件を更新した`);
console.log(`  sankoso-auto        住所 5347 → 11777 / 予約 不要 → 要 / 直火OK → 直火禁止 / coordsVerified 解除`);
console.log(`  saiko-tsuhara-camp  住所 西湖351 → 西湖2299（施設公式で確定）`);
