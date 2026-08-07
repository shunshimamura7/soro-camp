/**
 * E-1: D-2 の UNCLEAR 9件に needsVerify を立て、既存5件も含めて needsVerifyNote を書く。
 * 記録は scripts/address-check-2026-08.md の「E-1」節。
 *
 * D-2 の UNCLEAR 9件は「address が不明」ではなく
 * **「その名前の施設が一次情報で確認できない」**だった。§6-4 の型。
 * md に書いただけではどの検証ツールにも引っかからないので、データに載せる。
 *
 * **`status` は変えない。**一覧に無いことは存在しないことの証明ではない（§6-7）。
 * 実際 `sessokyo-camp` は町の一覧に無かったが実在した。
 *
 * Note には「YYYY-MM-DD 調査。◯◯に該当名なし URL」の形で書く。
 * **「まだ調べていない」ではなく「調べたが確認できなかった」と読めることが要件。**
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const SAGAMIHARA_LIST = 'https://www.e-sagamihara.com/camp/';

// D-2 の UNCLEAR 9件
const newFlags = {
  'makioka-fruits-camp':
    '2026-08-07 調査。「牧丘フルーツ村キャンプ場」の名で山梨市公式・富士の国やまなし（県公式）に該当なし。' +
    '検索で出る「牧丘フルーツセンター」は山梨市牧丘町窪平358の果樹園で別施設 ' +
    'https://www.city.yamanashi.yamanashi.jp/soshiki/5/2246.html 。' +
    '座標は甲州市塩山中萩原を指し、address（山梨市牧丘町牧平3041）と17.3km離れている',

  'kabutomushi-mori-camp':
    '2026-08-07 調査。相模原市観光協会のキャンプ場一覧13件に該当名なし ' + SAGAMIHARA_LIST + ' 。' +
    '同名の「カブト虫の森」は和歌山県日高川町の施設で閉館済み。' +
    '座標は八王子市南浅川町を指し、address（相模原市緑区牧野4015）と9.8km離れている',

  'yadoriki-camp':
    '2026-08-07 調査。松田町公式の「やどりき水源林」ページにキャンプ場の記載なし ' +
    'https://town.matsuda.kanagawa.jp/site/kankou-sub/yadoriki-suigenrin.html 。' +
    '寄地区のキャンプ場は寄4380-1 と蜂花苑ミロク（別レコード hachibanaen-miroku）。' +
    'やどりき水源林は529haの森林で、キャンプ場としての施設名は確認できない',

  'mikagi-camp':
    '2026-08-07 調査。相模原市観光協会のキャンプ場一覧13件に該当名なし ' + SAGAMIHARA_LIST + ' 。' +
    '「三ヶ木」は相模原市緑区の実在の地名だが、その名のキャンプ場の一次情報が出ない',

  'mushizawa-camp':
    '2026-08-07 調査。山北町公式の「キャンプ場の紹介」に該当名なし ' +
    'https://www.town.yamakita.kanagawa.jp/0000000232.html 。' +
    '「虫沢」は山北町の実在の地名だが、その名のキャンプ場の一次情報が出ない',

  'nanasawa-camp':
    '2026-08-07 調査。厚木市七沢657 に該当施設なし。七沢のキャンプ場は ' +
    'TINY CAMP VILLAGE（七沢1854・別レコード tiny-camp-village）と ' +
    '厚木市七沢弁天の森キャンプ場（七沢2891）で、後者は H28/11 時点で閉鎖 ' +
    'https://www.nap-camp.com/kanagawa/11637',

  'kawaguchiko-hamanoya-camp':
    '2026-08-07 調査。「浜の家キャンプ場」は西湖東側の施設で、河口湖ではない。' +
    'データの住所「富士河口湖町小立5404」は河口湖オートキャンプ場のもの ' +
    'https://www.nap-camp.com/yamanashi/11308 。**住所の借用が疑われる**',

  'izukogen-auto':
    '2026-08-07 調査。伊東市池672 に該当施設なし。同じ「池」地区にある「伊豆高原テントリゾート」' +
    '（伊東市池614-168 https://tentresort-izu.com/ ）が近いが名称が違う。' +
    '「伊豆高原オートキャンプ場」名義の一次情報が出ない',

  'okumakino-camp':
    '2026-08-07 調査。相模原市観光協会のキャンプ場一覧13件に該当名なし ' + SAGAMIHARA_LIST + ' 。' +
    'NAVITIME・タウンページには「相模原市緑区牧野12822」で載るが、' +
    '**自治体公式・施設公式の裏付けが無い**ためデータの住所（牧野2108）を直していない',
};

// 既に needsVerify が立っていた5件。Note が無いままだと新しい検査に引っかかるので、
// **今分かっている範囲で**書く。分かっていないものは「分かっていない」と書く。
const existingFlags = {
  'ito-marine-town-camp':
    '道の駅伊東マリンタウンは実在するが、そこにキャンプ場は無い。' +
    '施設名・住所・キャンプ場紹介ページを道の駅から借りて作られた記録と見られる（引き継ぎ §6-4）。' +
    '予約・料金の一次情報がどこにも出ないため status を unverified にしてある ' +
    'https://ito-marinetown.co.jp/',

  'sessokyo-camp':
    '実在と2026年の営業（9/19〜12/5の期間限定）は確認済み https://www.nap-camp.com/shizuoka/16796 。' +
    '残る未確定は**同名2拠点の切り分け**で、「接岨」と「崎平」の YANBY OUTDOOR FIELD が別に登録されており、' +
    '料金・電話がどちらに属するか決められていない（scripts/price24-check.md バッチ2）。' +
    '実在を疑うフラグではなく、同定を詰める必要があるという意味',

  'nekumasanso-auto':
    '**このフラグの由来が記録に残っていない。**座標が 0,0 で needsCoord も立っており、' +
    '地図上で所在を確かめられていない状態。address（山梨県南巨摩郡南部町福士15854）の一次情報も未確認。' +
    '引き継ぎ §7-5「残る needsVerify 4件の確認」の対象 https://www.town.nanbu.yamanashi.jp/',

  'sanogawa-camp':
    '佐野川河川公園として実在するが、**キャンプ場としての実態が無い。**' +
    '南部町が公園として管理していて公園内でのキャンプ・火気の使用は認められていない（引き継ぎ §6-4）。' +
    'status は closed / closedReason は prohibited にしてある https://www.town.nanbu.yamanashi.jp/',

  'shizunami-beach-camp':
    '2026-08-07 調査。「静波海岸キャンプサイト」という名称の施設は存在しない。' +
    '静波海岸には静波リゾートキャンプサイト（牧之原市静波2228-43 https://www.nap-camp.com/shizuoka/15655 ）／' +
    '静波キャンプ（静波2220-515）／オートキャンプ静波 の3施設が実在し、' +
    '静波キャンプグランドは2020年1月31日に閉業している。soloComment の「リゾート内・全面芝生」は' +
    '静波リゾートキャンプサイトと一致するが、名称・住所が確定するまで address は埋めていない',
};

let flagged = 0;
let noted = 0;

for (const [slug, note] of Object.entries(newFlags)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  const before = c.status;
  c.needsVerify = true;
  c.needsVerifyNote = note;
  // ★ status は変えない。一覧に無いことは存在しないことの証明ではない（§6-7）
  if (c.status !== before) throw new Error('status を変えてはいけない');
  flagged++;
  console.log(`FLAG  ${slug}  needsVerify: true（status は ${c.status} のまま）`);
}

for (const [slug, note] of Object.entries(existingFlags)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  if (c.needsVerify !== true) throw new Error(`${slug}: needsVerify が立っていない`);
  c.needsVerifyNote = note;
  noted++;
  console.log(`NOTE  ${slug}  needsVerifyNote を追記（既存フラグ）`);
}

const total = data.filter((x) => x.needsVerify === true).length;
const missing = data.filter((x) => x.needsVerify === true && !x.needsVerifyNote);
if (missing.length) throw new Error(`Note 未記入: ${missing.map((c) => c.slug).join(', ')}`);

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n新規 ${flagged}件 / 既存 ${noted}件。needsVerify は計 ${total}件、全件に Note がある。`);
