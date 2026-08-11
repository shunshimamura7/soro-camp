/**
 * 2026-05-27 バッチの needsVerify 5件（active）に、今回の追調査の所見を追記する。
 * 記録は scripts/batch-2026-05-27-needsverify-check.md。
 *
 * **status は動かさない。**実在が確認できないだけで、存在しない証明ではない（§6-7）。
 * 判断はしゅんに残す。ここでやるのは `needsVerifyNote` の追記だけで、
 * **次に見た人が同じ調査を繰り返さないようにする**のが目的（§2 の needsVerifyNote の趣旨）。
 *
 * 使い方: node scripts/apply-0527-needsverify-notes.js
 */
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const ADD = {
  'mikagi-camp':
    ' 2026-08-11 追調査: **津久井地域観光協会のキャンプ場一覧7件にも該当名なし** https://www.tsukui.ne.jp/kankou/camp.html （青野原オートキャンプ場組合/新戸/緑の休暇村青根/神之川キャンプマス釣り場/このまさわ/うらたんざわ渓流釣場/此の間沢渓流園）。検索で「三ヶ木」が出るのは新戸キャンプ場への路線バスの行き先としてだけ。相模原市は L1 網羅率80%で ORPHAN を判定として読める2市町村の1つ（§6-20）。',
  'yadoriki-camp':
    ' 2026-08-11 追調査: **松田町公式が「水源林一帯での焚火やBBQなど火気の使用は禁止されています」と明記** https://town.matsuda.kanagawa.jp/site/kankou-sub/yadoriki-bbq.html 。同ページはBBQをするなら寄地区の別施設を使うよう案内している。**データは焚き火可・1,000円・4月〜11月営業のキャンプ場として掲載しており、一次情報と正面から矛盾する。**`sanogawa-camp`（自治体が公園内のキャンプ・火気を不可としている）と同型。status の扱いに判断が要る。',
  'mushizawa-camp':
    ' 2026-08-11 追調査: 山北町観光協会の「自然に泊まる」一覧にも該当名なし https://www.yamakita.net/stay/natural.php 。**ただし山北町の L1 網羅率は63%（観光協会）/38%（町公式）で、ORPHAN を判定として読める7割の水準に達していない**（§6-20）。「一覧に無い」以上の根拠が取れていない。5件の中でいちばん判定の格が低い。',
  'kawaguchiko-hamanoya-camp':
    ' 2026-08-11 追調査: **住所も電話も実在する「河口湖オートキャンプ場」のものだと確定した**（富士河口湖町小立5404 / 0555-72-4411）。富士河口湖町観光連盟 https://fujisan.ne.jp/sightseeing/3951/ ／ なっぷ https://www.nap-camp.com/yamanashi/11308 。実在側の料金は入場料770円＋オート1区画3,630円〜、営業は3月中旬〜11月で、データの6,000円〜・通年とも合わない。**「浜の湯」の名は一次情報のどこにも出ない**（「浜の家キャンプ場」は西湖東側の別施設）。**なお借用元の「河口湖オートキャンプ場」は当サイトに未登録＝掲載漏れの候補。**',
  'makioka-fruits-camp':
    ' 2026-08-11 追調査: 山梨市牧丘町の実在キャンプ場は琴川キャンプ場（杣口2050-1）・乙女高原グリーンロッジ（北原4143-1）・7inch CAMP（北原1786）の3件で、**牧平3041 に該当なし**。名前の近い2件も別物だった —「牧丘フルーツセンター」は果樹園（山梨市牧丘町窪平358）、**「オートキャンプ・フルーツ村」は千葉県君津市旅名96 / 0439-38-2255** https://fruitsvillage.com/ 。',
};

let n = 0;
for (const [id, add] of Object.entries(ADD)) {
  const c = camps.find((x) => x.id === id);
  if (!c) throw new Error(`${id} が見つからない`);
  if (c.status !== 'active') throw new Error(`${id} は active ではない（${c.status}）`);
  if (!c.needsVerifyNote) throw new Error(`${id} に needsVerifyNote が無い`);
  if (c.needsVerifyNote.includes('2026-08-11 追調査')) {
    console.log(`  ${id}: 追記済みなのでスキップ`);
    continue;
  }
  c.needsVerifyNote = c.needsVerifyNote.trimEnd() + add;
  n++;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
console.log(`apply-0527-needsverify-notes: ${n}件の needsVerifyNote に追記した（status は動かしていない）`);
