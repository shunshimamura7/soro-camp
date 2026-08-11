/**
 * 2026-05-27 バッチ 残り29件の点検結果を反映する。
 * 記録は scripts/batch-2026-05-27-check.md（1件ずつ出典URL付き）。
 *
 * **実在が確認できなかった14件は status を動かさない**（所見のみ。判断は人）。
 * **名称が公式間で割れている2件も直さない。**
 * 座標も触らない。
 *
 * 使い方: node scripts/apply-batch-2026-05-27.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const D = '2026-08-11';

const get = (id) => {
  const c = camps.find((x) => x.id === id);
  if (!c) throw new Error(`${id} が見つからない`);
  return c;
};
let n = 0;
const touch = (id, fn) => { const c = get(id); fn(c); c.lastVerified = D; n++; };

/* ── 山北町公式。町民/町外の料金差があった（§2-3 の discount 型） ───── */
touch('hidamari-yamakita', (c) => {
  c.officialUrl = 'https://www.town.yamakita.kanagawa.jp/0000000068.html';
  c.season = '4月〜11月（12月〜3月は金・土・日・祝のみ営業。年末年始休業）';
  // §2-3 のとおり discount 型は priceMin に町外料金を入れる
  c.priceMin = 6000;
  c.priceMax = 9000;
  c.priceNote = 'オートキャンプ（宿泊）は町民4,000円〜／町外6,000円〜のサイト単位課金。デイキャンプは町民1,000円〜／町外2,000円〜。シャワー100円';
  c.eligibility = {
    type: 'discount',
    label: '町外は割高',
    note: '山北町民はオートキャンプ4,000円〜、町外は6,000円〜。デイキャンプも町民1,000円／町外2,000円',
    source: '山北町公式 https://www.town.yamakita.kanagawa.jp/0000000068.html',
  };
  c.features.reservationNote = 'メール予約（hidamarinosato@marble.ocn.ne.jp）。利用日の4か月前から受付';
});

/* ── 施設公式。通年・無休だった（data は 4月〜11月） ─────────────── */
touch('shosenkyo-auto-camp', (c) => {
  c.officialUrl = 'https://syosenkyo-camp.com/';
  c.season = '通年';
  c.closedDays = 'なし';
  c.priceMin = 5000;
  c.priceMax = 8000;
  c.priceNote = '区画課金＋人数課金の併用。入場料 大人1,000円（3歳〜小学生500円・ペット2匹まで500円）＋オート1区画4,000円〜で、ソロ1名の総額は5,000円。全28区画がAC電源付き';
  c.features.reservationNote = 'WEB予約（なっぷ）または電話 055-287-8778（9:00〜17:00）';
});

/* ── 施設公式。address の枝番が大きく違い、営業期間も1か月ずつずれていた ── */
touch('hakushu-ojiro-camp', (c) => {
  c.address = '山梨県北杜市白州町白須8093-9';
  c.officialUrl = 'https://www.verga.info/';
  c.season = '4月〜11月';
  c.closedDays = '毎週水曜（GW・7月中旬〜8月下旬は無休）';
  c.priceMin = 4100;
  c.priceMax = 24500;
  c.priceNote = 'サイト単位課金。フリーサイト1泊1区画4,100円〜、区画オートサイト4,500〜24,500円。バンガロー7,860円〜。名水公園べるが内';
});

/* ── 住所が大字ごと違い、直火の可否も逆だった ───────────────── */
touch('hamaoka-sakyuu-camp', (c) => {
  c.address = '静岡県御前崎市池新田9122-1';
  c.tel = '0537-85-2418';
  c.priceMin = 2000;
  c.priceMax = 4000;
  c.priceNote = '人数課金。サイト利用料 大人1名2,000円／中学生以下1,000円。電源は有料';
  c.features.bonfire = true;
  c.features.bonfireNote = '直火OK';
  c.features.reservationNote = 'ネット予約。当日予約も受け付けている';
  c.cautions = ['住所は御前崎市池新田9122-1。旧データの「白羽3870-1」は誤り https://www.omaezaki.gr.jp/contents/detail.html?s=1090'];
});

/* ── 南アルプス市公式・県公式とも「直火可」。data は「焚き火台必須」だった ── */
touch('westriver-auto-camp', (c) => {
  c.officialUrl = 'https://westriver-camp.com/';
  c.features.bonfireNote = '直火可';
});

/* ── 伊豆の国市観光協会・施設公式とも「直火に対応」 ─────────────── */
touch('mobility-park-izu', (c) => {
  c.officialUrl = 'https://mobility-park.jp/';
  c.features.bonfireNote = '直火可';
  c.priceMin = 5500;
  c.priceMax = 12000;
  c.priceNote = 'ソロ（大人1名）5,500円、ファミリー（大人2＋小学生2）7,700円が1泊の目安。テントサイト約100区画は全区画AC電源付き';
});

/* ── ソロ専用サイトがあり、data の priceMin はオートサイトの値だった ──── */
touch('retreat-camp-mahoroba', (c) => {
  c.officialUrl = 'https://retreatcamp-mahoroba.net/';
  c.tel = '090-4128-6066';
  c.priceMin = 3000;
  c.priceMax = 14000;
  c.priceNote = 'ソロキャンプサイト3,000円〜、テントサイト1区画4,000円〜、オートサイト1区画9,000円〜（利用日・タイプで変動）';
  c.closedDays = 'なし';
  c.features.soloPlan = true;
  c.features.soloPlanNote = 'ソロキャンプサイトが3,000円〜で用意されている';
});

/* ── 住所の枝番と電話が両方違っていた ──────────────────────── */
touch('pica-fujiyama-camp', (c) => {
  c.address = '山梨県南都留郡富士河口湖町船津6662-10';
  c.tel = '0555-28-6303';
});

touch('hottarakashi-camp', (c) => {
  c.tel = '080-9677-1010';
  c.telNote = '受付 9:00〜18:00';
});

touch('izu-kakure-auto', (c) => {
  c.officialUrl = 'https://kakure-camp.corpkj.com/';
  c.features.reservationNote = '事前予約のほか、予約なしの当日利用・現地決済にも対応している';
});

touch('karasawa-miyagase', (c) => {
  c.officialUrl = 'https://karasawa-camp.sakura.ne.jp/';
  c.telNote = '携帯 080-4355-1318 もある';
  c.features.reservationNote = '宿泊は要予約。デイキャンプは事前予約ができず当日先着順';
});

/* ── 清川村公式に休業告知。§2-1 の suspended ─────────────────
 * 施設は実在し、村公式の一覧に掲載されたまま「休業中」と書かれている。
 * 廃止でも閉業でもなく「今は行けない」なので suspended が定義に合う。
 * ⚠ ただし「当面の間」で再開時期が示されておらず、§2-1 の
 *   「再開予定のある休業」の条件を満たしきってはいない。
 *   村公式が一覧から消すか「廃止」と書いたら closed / abolished に移すこと。 */
touch('chojayashiki-camp', (c) => {
  c.address = '神奈川県愛甲郡清川村宮ヶ瀬1644';
  c.tel = '046-241-6999';
  c.telNote = '清川村公式が予約先として掲載している番号。旧データの 046-288-1743 は一次情報に出てこない';
  c.status = 'suspended';
  c.suspendedNote =
    '清川村公式のキャンプ場一覧に「令和8年5月1日より当面の間、休業中です」と掲載されている ' +
    'https://www.town.kiyokawa.kanagawa.jp/soshiki/sangyokanko/sisetu/3837.html 。' +
    '再開時期は示されていない。村公式が一覧から削除するか「廃止」と書いた場合は closed / abolished に移すこと';
});

/* ── 住所を直したら座標が合わなくなった2件（§2-6 の用途2）─────────
 *
 * 住所修正後に `verify-address-gsi.js` を回したら、どちらも大きく外れた。
 *
 *   hakushu-ojiro-camp  逆ジオ「長坂町**中丸**」 vs address「白州町白須」  8.50km
 *   hamaoka-sakyuu-camp 逆ジオ「**白羽**」        vs address「池新田」      6.22km
 *
 * `hakushu-ojiro-camp` は**町から違う**（長坂町 / 白州町）。
 * `hamaoka-sakyuu-camp` は**座標が旧住所（白羽）を指したまま**で、
 * 誤った住所に合わせて座標が置かれていたことが分かる（§6-15 の型）。
 *
 * どちらも `coordsVerified: true` が立っていた（§6-1）。外して needsCoord を立て、
 * **誤りと分かっている座標は 0 で潰さずそのまま残す**（§2-6 の用途2）。
 * `coordsGsiChecked` は触らない（GSI の判定自体は OK のまま＝県も市も矛盾しない）。
 *
 * ※ 住所を直した残る2件（`pica-fujiyama-camp` / `chojayashiki-camp`）は MATCH だった。 */
for (const id of ['hakushu-ojiro-camp', 'hamaoka-sakyuu-camp']) {
  const c = get(id);
  delete c.coordsVerified;
  c.needsCoord = true;
}
console.log('  座標: hakushu-ojiro-camp / hamaoka-sakyuu-camp の coordsVerified を外し needsCoord を立てた');

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
const g = camps.reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
console.log(`apply-batch-2026-05-27: ${n}件を更新した（うち1件を suspended に）`);
console.log('  ' + Object.entries(g).map(([k, v]) => `${k} ${v}件`).join(' / '));
