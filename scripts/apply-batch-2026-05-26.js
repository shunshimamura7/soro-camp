/**
 * 不良バッチ `lastVerified: 2026-05-26` 35件の点検結果を反映する。
 * 記録は scripts/batch-2026-05-26-check.md（1件ずつ出典URL付き）。
 *
 * `sankoso-auto` / `okudoshi-auto` と同じ5つの誤りシグネチャを全件で点検した。
 *   ① address の捏造  ② tel の欠落・誤り  ③ reservation 不要→要
 *   ④ 直火OK→実は禁止  ⑤ season 通年→実は季節営業／料金の人数課金の欠け
 *
 * 座標は入れない（人が目視で取る）。
 * 実在が確認できなかった7件は **status を変えず** needsVerify に留める（§6-7・§12）。
 *
 * 使い方: node scripts/apply-batch-2026-05-26.js
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
let fixed = 0;
const touch = (id, fn) => { const c = get(id); fn(c); c.lastVerified = D; fixed++; };

/* ── 実在が確認できなかった7件 ────────────────────────────────
 * status は動かさない。「一覧に無い＝存在しない」は成り立たない（§6-7）。
 * 断定描写の soloComment は落とす（§6-16。実態が裏取りできていない本文は捏造）。
 * 料金の裏も取れていないので priceVerified を外す（表示は「料金 要確認」になる）。 */
const UNVERIFIED = [
  {
    id: 'oiso-longbeach',
    note: '2026-08-11 調査。大磯ロングビーチは大磯プリンスホテル併設の**プール施設**で、住所は大磯町国府本郷546（データは大磯町大磯546-1）。公式のテントは「プールサイドのテントエリア／フリースペース」で日中のみ、宿泊のキャンプサイトは見つからない https://www.princehotels.co.jp/pool/oiso/ 。§9 型C（実在するがキャンプ場ではない）の疑い',
  },
  {
    id: 'nanasawa-camp',
    note: '2026-08-11 調査。厚木市七沢で実在が確認できるのは TINY CAMP VILLAGE（七沢1854）と厚木市七沢弁天の森キャンプ場（七沢2891）の2件で、「七沢キャンプ場 七沢657」は予約・料金のどこにも出てこない。§6-16 で既に捏造住所として挙げられていた1件 https://www.city.atsugi.kanagawa.jp/soshiki/bunkashogaigakushuka/20/51735.html',
  },
  {
    id: 'yamakita-camp',
    note: '2026-08-11 調査。山北町公式のキャンプ場一覧13施設に「山北キャンプ場」は無い https://www.town.yamakita.kanagawa.jp/0000000232.html 。湯触にあるのは河内川ふれあいビレッジ（湯触322-1）で、令和元年台風19号の土砂流入により当分クローズ https://www.town.yamakita.kanagawa.jp/0000000061.html 。「湯触353」に該当する施設が見つからない',
  },
  {
    id: 'okooigawa-lake',
    note: '2026-08-11 調査。川根本町まちづくり観光協会の奥大井キャンプ場ガイドに「奥大井湖上キャンプ場」は無い http://www.okuooi.gr.jp/wordpress/camp/ 。周辺の実在施設はアプトいちしろキャンプ場・くのわき親水公園キャンプ場など。予約・料金の情報が出てこない',
  },
  {
    id: 'izukogen-auto',
    note: '2026-08-11 調査。伊東市池で実在が確認できるのは伊豆高原テントリゾート（池614-168）。「伊豆高原オートキャンプ場 池672」は予約・料金のどこにも出てこない。名前の近い伊豆天城高原オートキャンプ場は賀茂郡東伊豆町1458-5 の別施設 https://www.izu-camp.jp/',
  },
  {
    id: 'amagi-kogen',
    note: '2026-08-11 調査。実在するのは伊豆天城高原オートキャンプ場（賀茂郡東伊豆町1458-5・0557-52-3250）https://www.izu-camp.jp/ で、データの「天城高原キャンプ場 伊豆市湯ヶ島1918」とは市町村から違う。湯ヶ島1918 に該当する施設が見つからない',
  },
  {
    id: 'kawaguchiko-hanto',
    note: '2026-08-11 調査。富士河口湖町大石2585 は町の**大石公園**（入園無料・駐車無料）の住所 https://www.town.fujikawaguchiko.lg.jp/ka/info.php?if_id=2346 。「河口湖畔キャンプ場」という名称のキャンプ場は予約・料金のどこにも出てこない',
  },
];
for (const u of UNVERIFIED) {
  touch(u.id, (c) => {
    c.needsVerify = true;
    c.needsVerifyNote = u.note;
    delete c.priceVerified;
    // priceNote も不良バッチが書いたもの。裏が取れていない内訳を残すと
    // 次に見た人が「調べた形跡がある」と誤読する
    delete c.priceNote;
    c.soloComment = ''; // 実態が裏取りできていない断定描写は残さない
  });
}

/* ── 実在は確認できたが中身が誤っていたもの ───────────────────── */

// 相模原市観光協会（L1・網羅率80%）と施設公式で住所・電話は一致。
// 施設公式に「冬季（12月下旬〜3月初旬）は年末年始を除く土曜・日曜・祝祭日の営業」。
// 料金表は施設公式に無く（宿泊は日帰りの2倍という記載のみ）、data の1,500円の裏が取れない。
touch('aonohara-auto', (c) => {
  c.officialUrl = 'https://www.aonohara-acl.jp/index.html';
  c.season = '通年（冬季12月下旬〜3月初旬は年末年始を除く土日祝のみ。年末年始休業）';
  c.features.bonfireNote = '直火OK';
  delete c.priceVerified;
  c.priceNote =
    '施設公式に料金表が無く、金額の裏が取れていない。公式にあるのは「宿泊利用は日帰り料金の2倍」（バイク入場料 日帰り500円→宿泊1,000円）という記載のみ。入場料・駐車料・サイト使用料の3本立てなので、ソロでも3種類の合計になる';
  c.soloComment =
    '道志川沿いの予約不要のオートキャンプ場（小屋付きサイトのみ要予約）。入場料・駐車料・サイト使用料の3本立てで、宿泊は日帰り料金の2倍になる。平日の朝から到着すれば川沿いの好ポジションを確保できる。冬季（12月下旬〜3月初旬）は年末年始を除く土日祝のみの営業で、水道凍結のためシャワーも使えない。夜間入場は禁止。';
});

// 施設公式・山北町公式で住所・電話・通年営業を確認。直火は禁止だった。
touch('nishitanzawa-mountbridge', (c) => {
  c.officialUrl = 'https://mount-bridge.com/';
  c.telNote = '携帯 090-7738-1407 もある';
  c.features.bonfireNote = '直火禁止。焚き火台の使用が必要';
});

// 相模原市観光協会（L1）で住所・営業期間・電話を確認。電話が季節で変わる。
// 直火の可否は施設公式が無く確定できない。
touch('sagamiko-kyuyomura', (c) => {
  c.telNote = 'ハイシーズンは 042-685-1371、オフシーズン（冬季）は 042-685-0141。予約受付は8:00〜17:00';
  c.features.bonfireNote = '直火の可否は要確認（施設公式サイトが無く一次情報で確定できていない）';
});

// 施設公式で住所・電話・定休日を確認。料金は公式（場所貸し 大人2名・車1台込み6,200円〜）と
// 予約サイト（ソロ専用サイト1,500円〜）で桁が違い、data の2,500円の裏が取れない。
touch('miyagase-village', (c) => {
  c.officialUrl = 'https://miyagase-village.com/';
  c.closedDays = '火曜';
  c.telNote = '070-9022-3477 はカフェ。オフィスは 03-5430-3462';
  delete c.priceVerified;
  c.priceNote =
    '施設公式は「場所貸しプラン（大人2名・車1台込み）6,200〜8,200円、人数・車1台増ごとに+1,000円」というサイト単位課金。予約サイトには「芝生テントサイトE3【ソロ専用】1,500円〜」があり、ソロ1名の総額がどちらになるか確定できていない';
});

// 清川村公式で住所・電話を確認。12月〜2月は休業期間で「通年」は誤り。
// 施設公式・予約サイトともテントサイトの料金が無く、テント泊できるかも確定できない。
touch('yataro-camp', (c) => {
  c.officialUrl = 'https://k-riverland.jp/';
  c.season = '3月〜11月（12月〜2月は休業期間）';
  c.closedDays = '毎週木曜・第1第3水曜（11月は毎週水木）';
  c.features.bonfireNote = '直火禁止。施設が指定する場所で脚付きのコンロなどを使用する';
  delete c.priceVerified;
  c.priceNote =
    '施設公式の料金ページにあるのは管理料金（大人600円・子供500円）と持ち込みバーベキュー1,100円で、テントサイトの宿泊料金が無い。駐車場代はかからないと明記されており、data の「大人1,000円+車1,000円」は一次情報と合わない';
  c.needsVerify = true;
  c.needsVerifyNote =
    '2026-08-11 調査。施設は実在する（清川村公式に掲載 https://www.town.kiyokawa.kanagawa.jp/soshiki/sangyokanko/sisetu/3837.html ）が、**テント泊ができるかが確認できない。** 施設公式 https://k-riverland.jp/price/ の料金はBBQ・コテージ・バンガロー・レンタルのみで、予約サイトの施設タイプも「バンガロー / ロッジ・ログハウス・コテージ」だけ。§6-25 の業態確認が要る';
  c.soloComment =
    '清川村・谷太郎川沿いの施設。釣りと魚のつかみ取り、屋根付きバーベキュー、コテージとバンガローでの宿泊ができる。直火は禁止で、施設が指定する場所で脚付きのコンロを使う。12月から2月は休業期間で、営業期間中も木曜と第1第3水曜が定休。';
});

// 施設公式で住所・電話・通年営業・定休日なしを確認。直火は禁止。
touch('kawazu-nanadaru', (c) => {
  c.officialUrl = 'https://www.nanatakiauto.com/';
  c.closedDays = 'なし';
  c.features.bonfireNote = '直火禁止。焚き火台の使用が必要';
});

// 施設公式 kumomi-sunset.com で住所・料金が data と一致した。URLだけが欠けていた。
// ⚠ 別サイト yuuhi-shiosai.com（雲見274-1 / 0558-45-0500）は名前の似た別施設。
touch('kumomi-auto', (c) => {
  c.officialUrl = 'https://www.kumomi-sunset.com/';
  c.priceNote =
    'ソロキャンプ（大人1名・施設使用料込み）3,500円、ソロバイクキャンプ3,200円。オートキャンプは1区画3,850円＋施設使用料1,100円/人＋駐車1,000円/台。AC電源1,100円。ハイシーズンの割増は無く、ペット料金も無料';
  c.features.pet = true;
  c.features.petNote = 'ペット料金は無料';
});

// 施設公式で住所の枝番違い・定休日を確認。ソロ専用サイトには営業条件が付く。
touch('onoji-family', (c) => {
  c.address = '静岡県裾野市須山2934-2';
  c.officialUrl = 'https://oonoji.co.jp/camp/';
  c.closedDays = '火曜・水曜';
  c.season = '通年（冬期は限定サイトのみ営業）';
  c.priceNote =
    'ソロ専用サイト（定員1名）はオフシーズン2,200円／レギュラー2,750円／ハイシーズン3,300円。ただし**土曜日とハイシーズンのみ営業**で、それ以外の日は普通サイト（5,000〜6,000円・定員5名のサイト単位課金）になる';
  c.soloComment =
    '富士山東麓・裾野市の日本で最初のオートキャンプ場。定員1名のソロ専用サイトが2,750円から使えるが、**土曜日とハイシーズンしか営業していない**ので日程が合わないと普通サイト（5,000円〜のサイト単位課金）になる。ソロ専用区画はトイレと炊事場から1〜2分離れていて、富士山の眺望は無い。火曜と水曜が定休。';
});

// 伊豆市観光情報サイト（自治体公式）の住所が data と食い違っていた。
touch('darumayama-kogen', (c) => {
  c.address = '静岡県伊豆市大沢1021-19';
  c.officialUrl = 'https://kanko.city.izu.shizuoka.jp/sightseeing/darumayamacamp/';
  c.season = '3月第3土曜〜11月下旬（12月1日〜3月第3金曜は冬期休業）';
  c.features.bonfireNote = '直火禁止。焚き火台の使用が必要';
  c.features.reservationNote = '電話予約。利用月を含めて6か月前の10:00から受付（4〜9月は17:00まで、10〜3月は16:30まで）';
  c.priceNote = 'フリーサイト1泊1サイト2,500円／オートサイト3,500円（いずれも税込）。駐車場は無料。デイキャンプは大人500円・子ども300円';
  c.soloComment =
    '標高900mの高原から駿河湾と富士山を一望できる高原キャンプ場。フリーサイト8区画・オートサイト12区画の小規模で、コインシャワーとコインランドリーがある。駐車場は無料。直火は禁止で焚き火台が要る。3月第3土曜から11月下旬までの営業で、12月から3月中旬は冬期休業。';
});

// 山中湖観光協会（L1）で住所・電話・営業期間を確認。直火は禁止だった。
touch('muraei-yamanakako', (c) => {
  c.officialUrl = 'https://www.nap-camp.com/yamanashi/11265';
  c.telNote = '080-3347-2038 もある';
  c.features.bonfireNote = '直火禁止。焚き火台の使用が必要';
  c.features.reservationNote = '予約サイト「なっぷ」から受付。利用月の2か月前から';
});

// 施設公式で住所の枝番・電話・料金が data と食い違っていた。
touch('norolodge', (c) => {
  c.address = '神奈川県相模原市緑区青野原931-1';
  c.tel = '090-4825-5111';
  c.priceMin = 2000;
  c.priceMax = 4500;
  c.priceNote = 'ツーリング（バイクソロ）2,000円、車ソロ2,500円。デュオは別料金';
  c.features.reservationNote = '駐車場とキャンプスペースに限りがあり、予約した人が優先で案内される';
  c.soloComment =
    '道志川沿いのキャンプ場。直火での焚き火ができ、川遊びもできる。Wi-Fi完備。ツーリング2,000円・車ソロ2,500円とソロ向けの料金が整理されていて初心者でも入りやすい。駐車場とキャンプスペースに限りがあるので、予約しておくと優先して案内される。';
});

// 施設公式で番地・電話が判明。data の電話は施設公式・山北町公式のどちらとも違っていた。
touch('ootaki', (c) => {
  c.address = '神奈川県足柄上郡山北町中川879-4';
  c.tel = '0465-78-3422';
  c.priceMin = 1500;
  c.priceNote = 'バイク＋大人1名1,500円。オートキャンプは車1台＋4名まで5,000円、以降1名1,000円';
  c.features.reservationNote = '予約はバンガロー・ログハウスのみ。オートキャンプとデイキャンプはフリーサイトで予約を取っていない';
});

// キャンプ場事務局は富士宮市観光協会。data の 0544-52-0155 は E-BIKE レンタル予約の番号だった。
// 2026年4月1日から料金改定が入っており、data の金額の裏が取れない。
touch('tanukiko', (c) => {
  c.tel = '0544-27-5240';
  c.telNote = '田貫湖キャンプ場事務局（富士宮市観光協会）。施設直通ではない。0544-52-0155 は E-BIKE レンタル予約の番号';
  c.features.bonfireNote = '焚き火台必須。キャンプファイヤーは禁止';
  delete c.priceVerified;
  c.priceNote =
    '2026年4月1日利用分から料金改定が入っており、data の金額（1サイト4,000円〜）の裏が取れない。改定後はテント1張3,500円＋サイト使用料200円/名、土曜・GW・夏季・連休はトップシーズン料1,000円/張が加算という情報があるが、施設公式の料金ページで確認できていない';
});

// 施設公式で番地と電話が判明（data は市区町村までで電話が空だった）。
touch('sorairo', (c) => {
  c.address = '静岡県富士宮市麓624-7';
  c.tel = '0544-21-3955';
  c.telNote = '受付時間 9:15〜17:00';
});

// 施設公式の電話が data と違っていた（data の 0545- は富士市の市外局番）。
touch('houzan', (c) => {
  c.tel = '0544-66-5070';
  c.telNote = '受付営業時間 8:30〜20:00';
  c.closedDays = '火曜';
});

// 施設公式に「地面での直火は禁止」。定休日も判明。
touch('eichinomori', (c) => {
  c.features.bonfireNote = '直火禁止（焚き火台・コロを使用）。小さな火なら時間無制限';
  c.closedDays = '月曜（祝日・連休時は変更になる場合あり）';
});

// officialUrl が予約サイトのままだった。施設公式がある。
touch('shindo', (c) => {
  c.officialUrl = 'https://shindocamp.com/';
  c.features.bonfireNote = '直火は全面禁止。焚き火台の持参が必要';
});

// 施設公式の料金表と data が合わなかった（テントサイト使用料が10年単位で古い）。
touch('aone', (c) => {
  c.priceMin = 4800;
  c.priceMax = 6000;
  c.priceNote =
    '区画課金＋人数課金の併用。入場料（宿泊）大人900円＋テントサイト使用料2,700円（電源なし。電源ありは3,800円）＋駐車料 小型1,200円で、ソロ1名の総額は4,800円。単車なら駐車500円で4,100円';
  c.features.reservationNote = 'WEB予約。受付は4〜11月 8:00〜17:00／12〜3月 8:00〜16:30';
});

// 2020年1月1日に直火が全面禁止になっている。data は「直火OK」のままだった。
touch('doshi-no-mori', (c) => {
  c.features.bonfireNote = '直火禁止（2020年1月1日から全面禁止）。焚き火台の使用が必要';
  c.telNote = '現地携帯 080-4444-2440 もある';
  c.soloComment =
    '道志川の支流・三ヶ瀬川沿い約2kmに広がる大型フリーサイト。予約不要・先着順で、入場料800円+駐車1,000円のソロ計1,800円。直火は2020年1月1日に全面禁止になったので焚き火台が要る。夏週末は1,000張超えの激混みになるので平日専用と割り切るべき。上流エリアの木立に囲まれた場所を早朝から押さえるのがソロ攻略の鍵。';
});

// 施設公式で「直火OK」を確認できなかった。焚き火可のサイトがある、までしか書かれていない。
touch('pica-omotefuji', (c) => {
  c.features.bonfireNote = '焚き火可のサイトがある。直火の可否は施設公式で確認できていない';
  c.soloComment =
    '富士山2合目・標高1,200mの広葉樹林の中の野営サイト。無料シャワー付きで1,500円/人という料金が稀有。登山者のベースにも使われ、深い森に囲まれた静寂が格別。月〜木定休・4〜10月限定営業のため日程調整が必要。焚き火はサイトによって条件が違うので、直火にするつもりなら事前に確認すること。';
});

// 施設公式が無かっただけで、住所・電話・料金は一次情報と一致した。
touch('fuji-ymca', (c) => {
  c.officialUrl = 'https://www.yokohamaymca.org/fujisan-global/';
  c.priceNote = 'テントサイト 1泊1名 平日2,700円／休日3,100円 ＋ 駐車料 車500円（バイク300円）。平日ソロで計3,200円。ゴミ捨て場が無く全て持ち帰り（焚き火の灰のみ灰捨て場あり）';
});

// 施設公式が無かっただけ。コールセンターの番号を控えておく。
touch('wellcamp-nishitanzawa', (c) => {
  c.telNote = '現地 0465-78-3181 のほかコールセンター 0465-20-7065（9:00〜17:30）';
});

// 実在と料金を一次情報で確認できた（§7 の電話タスクBから外せる）。
touch('komeidoso-auto', (c) => {
  c.priceNote = 'ソロ（1名・車1台）3,000円、1泊（4名・車1台）5,000円。デイキャンプは中学生以上1,000円・小学生以下500円';
  c.telNote = 'ショートメッセージでの予約も受け付けている';
});

// 施設公式で定休日を確認。
touch('picafuji-saiko', (c) => {
  c.closedDays = '水曜午後・木曜（変動する場合あり）';
});

/* ── 照合のみで変更なし4件 ─────────────────────────────────
 * 施設公式と突き合わせて data と一致した。値は変えないが、
 * 今日一次情報に当たった事実は残す（`lastVerified` はそのための欄）。
 * 日付を 2026-05-26 のまま置くと、次に投入回で洗い出したとき同じ調査をやり直すことになる。 */
for (const id of ['fumotoppara', 'asagiri-jamboree', 'saiko-jiyu', 'yamanakako-misaki']) {
  touch(id, () => {});
}
// yamanakako-misaki だけは施設公式に住所と料金が載っておらず、
// 確認できたのは電話番号と予約必須の2点だけ。
get('yamanakako-misaki').needsVerify = true;
get('yamanakako-misaki').needsVerifyNote =
  '2026-08-11 調査。施設公式 https://camp.sotosotodays.com/yamanakako-misaki/ に**住所と料金の記載が無く**、電話（0555-65-7981）と予約必須しか確認できなかった。address「山中湖村平野2431-2」と priceMin 6,000 の裏が取れていない。正式名称も施設公式は「sotosotodays CAMPGROUNDS 山中湖みさき」で data と割れている';

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
console.log(`apply-batch-2026-05-26: ${fixed}件を更新した（うち実在未確認 ${UNVERIFIED.length}件は status を動かさず needsVerify）`);
