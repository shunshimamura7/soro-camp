/**
 * 2026-05-27 バッチで「実在が確認できず」とした15件を `unverified` にする（2026-08-11）。
 * 記録は scripts/batch-2026-05-27-check.md の §4。
 *
 * **削除はゼロ。**A（重複疑い2件）はどちらも**100%重複と確定できなかった**ので、
 * 指示どおり C と同じ扱いにした。B（`nishi-amagi-kogen`）も確定できず C に落ちた。
 *
 * - `status` → `unverified`
 * - `needsVerify: true` ＋ `needsVerifyNote`（出典URL付き）を**新規に立てる**
 * - `soloComment` は削除（§6-16。実在が確認できない施設の断定描写は捏造）
 * - `priceVerified` / `priceNote` は削除（裏が取れていない値を残すと、
 *   次に見た人が「調べた形跡がある」と誤読する）
 * - 座標は触らない
 *
 * 使い方: node scripts/apply-0527-unverified-b.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const SRC = 'scripts/batch-2026-05-27-check.md';

/** slug → needsVerifyNote（何を探して何が無かったか。出典URL必須） */
const NOTES = {
  /* ── A: 重複疑いだったが確定できなかった2件 ───────────────── */
  'kobuchizawa-auto-camp':
    `2026-08-11 調査（${SRC}）。北杜市小淵沢町上笹尾で実在が確認できるオートキャンプ場は` +
    '**八ヶ岳オートキャンプ場（上笹尾3332-1936 / 0551-36-4228）**だけで、これは既存レコード `yatsugatake-oizumi`。' +
    '**当初この2件を重複と見たが、確定できなかった。** データの「上笹尾**3181**」は' +
    '**株式会社ミヨシ（花卉の育種・生産販売）の所在地**（上笹尾3181-10）で、キャンプ場ではない。' +
    'つまり番地は `yatsugatake-oizumi` のものですらなく、**重複ではなく単に実在しない**という形。' +
    'このレコードは `tel` も `officialUrl` も持たないので、§4 の `tanzawako` のような突き合わせができない。' +
    '**100%重複と確定できないので削除せず unverified にした。** ' +
    '出典: 八ヶ岳オートキャンプ場 https://www.yatsugatake-autocamp.com/ ／ 上笹尾3181 の所在 https://www.kobuchisawa.com/sonota/miyoshi.html',
  'sagamiko-pleasure-camp':
    `2026-08-11 調査（${SRC}）。住所「相模原市緑区若柳1634」は既存レコード \`pica-sagamiko\`（PICAさがみ湖）と**完全一致**。` +
    'さがみ湖リゾート（現「さがみ湖MORI MORI」）内のキャンプ場は PICAさがみ湖で、' +
    '「相模湖プレジャーフォレストキャンプ場」という別のキャンプ場は一次情報に出てこない https://www.sagamiko-resort.jp/ 。' +
    '**ただし電話が一致しない。** データの **042-684-7711 はどの一次情報にも出てこず**、' +
    'リゾートの代表番号は **042-685-1111**、PICAさがみ湖のフロントは 042-685-0917、' +
    '`pica-sagamiko` が持つ 0555-30-4580 は PICA の予約センター（§6-12）。' +
    '座標も両レコードで約3.5km離れている。**§10-4 の決め手（電話の完全一致）を満たさず、' +
    '100%重複と確定できないので削除せず unverified にした。**',

  /* ── B: 実在するが業態と住所が確定できなかった1件 ─────────── */
  'nishi-amagi-kogen':
    `2026-08-11 調査（${SRC}）。データの「伊豆市上船原1519」に該当する施設が無い。` +
    '名前の近い**西天城高原「牧場の家」は賀茂郡西伊豆町**の施設で、市町村から違う。' +
    '**同一施設として住所を直そうとしたが、2つの理由で確定できなかった。** ' +
    '(1) **住所が公式間で割れている** — 西伊豆町役場公式は「西伊豆町**宇久須3609番地1**」' +
    'https://www.town.nishiizu.shizuoka.jp/kakuka/sangyou/kankou/yado_shisetsu/makibanoie.html 、' +
    '観光系の記載は「西伊豆町**仁科2910-2**」（§14 の「自治体公式は1枚岩ではない」型）。' +
    '(2) **テント泊できるかが確認できない** — 町公式にも観光協会にもテントサイトの記載が無く、' +
    'あるのはレストラン・コテージ（5人用12,500円〜／8人用16,000円〜）・大型休憩施設・バーベキュー棟だけ。' +
    '予約サイトのプランもコテージのみ（§6-25 の業態確認）。' +
    'なお同施設は**冬期（12月〜3月）は凍結のため利用できない**ので、`season: 通年` も誤り。',

  /* ── C: 型B/型C（実在する地名・施設名＋どこの施設のものでもない番地） ── */
  'doshi-no-yu-camp':
    `2026-08-11 調査（${SRC}）。「道志の湯」は**道志村の村営温泉**で、データの「相模原市緑区長者原40-1」とは市町村が違う。` +
    '相模原市観光協会13件 https://www.e-sagamihara.com/camp/ ・津久井地域観光協会7件 https://www.tsukui.ne.jp/kankou/camp.html のどちらにも該当名なし。' +
    '相模原市は L1 網羅率80%で ORPHAN を判定として読める2市町村の1つ（§6-20）。',
  'mitsumata-camp':
    `2026-08-11 調査（${SRC}）。山北町公式のキャンプ場一覧13件に該当名なし https://www.town.yamakita.kanagawa.jp/0000000232.html 。` +
    '中川で実在が確認できるのは大滝キャンプ場（中川879-4）・西丹沢マウントブリッジ（中川867-7）・ウェルキャンプ西丹沢（中川868）で、' +
    '**中川896 はどれとも一致しない**。予約・料金の一次情報も出てこない（§6-4）。' +
    '**ただし山北町の L1 網羅率は63%/38%で、ORPHAN を判定として読める7割の水準に無い**（§6-20）。',
  'hamanako-garden-camp':
    `2026-08-11 調査（${SRC}）。**浜名湖ガーデンパークは静岡県営の公園**（浜名湖花博の跡地）で、キャンプ場ではない。` +
    '浜松市中央区村櫛町で実在が確認できるキャンプ場は**タリカーナ ムラクシビーチ（村櫛町5747-1）** https://www.nap-camp.com/shizuoka/hamamatsu_hamanako/list 。' +
    '**データの「5475-1」と実在の「5747-1」は数字の入れ替えになっている。**',
  'shuzenji-nijinokuni-camp':
    `2026-08-11 調査（${SRC}）。**修善寺虹の郷は伊豆市のテーマパーク**（イギリス村・カナダ村・日本庭園）で、` +
    'キャンプ場ではない https://www.city.izu.shizuoka.jp/soshiki/1004/2/1/1293.html 。テント泊・宿泊の記載が無い。',
  'sumatakyo-camp':
    `2026-08-11 調査（${SRC}）。川根本町公式のキャンプ場一覧に「寸又峡温泉キャンプ場」は無い https://www.town.kawanehon.shizuoka.jp/shisetsu/5/1/1321.html 。` +
    '町内の実在は池の谷ファミリーキャンプ場（千頭528-5）・くのわき親水公園・八木・三ツ星オート・不動の滝自然広場オート・アプトいちしろ。' +
    '**千頭1225 に該当する施設が出てこない。**',
  'nekokodake-camp':
    `2026-08-11 調査（${SRC}）。**猫越岳は伊豆市のトレッキングコースの山**（仁科峠〜猫越岳〜猫越峠）で、その名のキャンプ場の予約・料金が出てこない。` +
    '湯ヶ島で実在が確認できるのはファーマーズヒル（旧かたつむり）など https://f-hill.jp/wordpress/camp/ 。**湯ヶ島1638 に該当なし。**',
  'oshino-hakkai-camp':
    `2026-08-11 調査（${SRC}）。**忍野八海は湧水池の観光地**。忍野村観光協会 https://oshino-navi.com/ にキャンプ場の掲載が無く、` +
    '忍草地区にあるのは民営駐車場。「忍野八海オートキャンプ場」の予約・料金がどこにも出てこない。',
  'fujigoko-auto-camp':
    `2026-08-11 調査（${SRC}）。山中湖村平野で実在が確認できるのは湖山荘キャンプ場（平野508）・村営山中湖キャンプ場（平野506-296）・` +
    '小田急山中湖フォレストコテージなど https://lake-yamanakako.com/reserve/10109 。**「富士五湖オートキャンプ場」という名の施設が出てこない**（平野2563-1 も該当なし）。' +
    '**ただし山中湖村の L1 網羅率は17%で、ORPHAN を判定として読めない**（§6-20）。',
  'takegawa-kyo-camp':
    `2026-08-11 調査（${SRC}）。北杜市武川町で実在が確認できるのはアグリーブルむかわ（武川町山高3567-212）・` +
    'フレンドパークむかわ・ウッドランド武川キャンプ場。**「武川郷キャンプ場」（山高3012）は出てこない。** ' +
    '出典: フレンドパークむかわ https://www.fp-mukawa-kaikoma.com/camp/ ／ ウッドランド武川 https://www.nap-camp.com/yamanashi/11353',
  'horaibashi-camp':
    `2026-08-11 調査（${SRC}）。**蓬莱橋は大井川に架かる木造歩道橋**（全長897.4m・ギネス認定・島田市の観光地）` +
    'https://www.city.shimada.shizuoka.jp/kanko-docs/houraibasi.html 。' +
    '**河川敷にキャンプ場がある一次情報が無い。**島田市内の実在はグリーンビレッジ川根・山村都市交流センターささまなど。',
  'asagiri-greenpark-camp':
    `2026-08-11 調査（${SRC}）。富士宮市猪之頭で実在するのは**朝霧高原オートキャンプ場（猪之頭2071）**` +
    'https://www.city.fujinomiya.lg.jp/1025110000/p001691.html 。' +
    '**「朝霧高原グリーンパーク」という名称の施設は出てこず、番地（猪之頭1050）も一致しない。**',
  'osezaki-camp':
    `2026-08-11 調査（${SRC}）。沼津市西浦江梨で実在するのは**大瀬テント村（西浦江梨977 / 055-942-3177 / テントサイト800円〜 / 予約不要）** https://www.nap-camp.com/shizuoka/11805 。` +
    '**データの「大瀬崎キャンプ場 西浦江梨329」は名称も番地も一致しない。**' +
    '料金3,500円・予約要という記載も、実在側（800円〜・予約不要）と合わない。',
};

let n = 0;
for (const [id, note] of Object.entries(NOTES)) {
  const c = camps.find((x) => x.id === id);
  if (!c) throw new Error(`${id} が見つからない`);
  if (c.status !== 'active') throw new Error(`${id} の status が active ではない（${c.status}）`);
  c.status = 'unverified';
  c.needsVerify = true;
  c.needsVerifyNote = note;
  // 実在が確認できていない施設の断定描写は残さない（§6-16）
  c.soloComment = '';
  // 裏が取れていない値を「調べた形跡」として残さない
  delete c.priceVerified;
  delete c.priceNote;
  c.lastVerified = '2026-08-11';
  n++;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
const g = camps.reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
console.log(`apply-0527-unverified-b: ${n}件を unverified にした（削除はゼロ）`);
console.log('  ' + Object.entries(g).map(([k, v]) => `${k} ${v}件`).join(' / ') + ` / 合計 ${camps.length}件`);
