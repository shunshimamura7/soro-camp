/**
 * 郡の抽出が**市・区をまたがない**ことの検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * ## なぜ要るか — 「内」バグと同じ family
 *
 * `splitAddress` の郡の抽出が
 *
 *     .match(/^(.{1,6}?郡)/)
 *
 * で、**「千葉県木更津市下郡1886」の `木更津市下郡` を郡名として食っていた。**
 * 大字が「下郡（しもごおり）」なので、市名ごと郡に飲まれる。
 * 結果 `city` が null になり、**地区外（b2）に静かに落ちる。**
 *
 * **`堀之内` → `堀之` と同じ型。**地名の一部を、区切りとして書いた正規表現が食う。
 * 違うのは落ち方で、
 *
 *   「内」バグ … 大字が1文字削れる。**似た大字と誤って一致しうる**
 *   郡バグ    … 市区町村ごと消える。**どの地区にも入らず、判定に出てこない**
 *
 * **後者のほうが見つけにくい。**エラーにならず、件数が1件減るだけ。
 * 今回は**予告した MISSING の件数と1件ずれた**ことで見つかった
 * （予告 木更津市5件 / 実測4件）。**予告を先に書いていなければ気づけなかった。**
 *
 * ## `町`・`村` を除外しない理由
 *
 * **郡名そのものに村が入る実例がある**（田村郡・北村山郡・東村山郡）。
 * 除外文字に足すと、今度はそちらの郡が取れなくなる。
 * 郡は住所で必ず市区町村より前に来るので、**除外するのは `市` と `区` だけで足りる。**
 *
 * 実行: `node scripts/.mock-gun-boundary-test.js`
 */
const fs = require('fs');
const path = require('path');
const { _internal: I } = require('./district-sweep.js');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}
const p = a => I.splitAddress(a) || {};

/* ---------------------------------------------------------------------
 * 1. ★ 大字が「郡」で終わる住所
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 大字が「郡」で終わっても市が消えない');
const etowa = '千葉県木更津市下郡1886';
check('木更津市下郡1886 → city=木更津市', p(etowa).city === '木更津市', `city=${p(etowa).city}`);
check('郡は取れない（下郡は大字）', p(etowa).gun === null, `gun=${JSON.stringify(p(etowa).gun)}`);
check('大字が 下郡 になる', p(etowa).oaza === '下郡', `oaza=${p(etowa).oaza}`);
check('★ 地区キーが出る（旧実装では null だった）',
  I.districtKey(etowa) === '木更津市下郡', I.districtKey(etowa));
check('★ 木更津市の地区に入る（旧実装では地区外に落ちていた）',
  I.inDistrict(etowa, I.parseDistrict('木更津市')) === true);

/* ---------------------------------------------------------------------
 * 2. 本物の郡は今までどおり取れる
 * ------------------------------------------------------------------- */
console.log('\n■ 本物の郡は今までどおり取れる');
const GUN = [
  ['千葉県夷隅郡大多喜町堀之内595', '夷隅郡', '大多喜町'],
  ['千葉県安房郡鋸南町大崩39', '安房郡', '鋸南町'],
  ['山梨県南都留郡道志村的様9745', '南都留郡', '道志村'],
  ['山梨県北都留郡丹波山村1388', '北都留郡', '丹波山村'],
  ['山梨県南巨摩郡南部町福士1', '南巨摩郡', '南部町'],
  ['神奈川県足柄上郡山北町中川1', '足柄上郡', '山北町'],
  ['神奈川県愛甲郡清川村宮ヶ瀬1700', '愛甲郡', '清川村'],
  ['静岡県榛原郡川根本町犬間1', '榛原郡', '川根本町'],
  ['千葉県長生郡長南町蔵持1869-1', '長生郡', '長南町'],
];
for (const [a, gun, city] of GUN) {
  check(`${a} → ${gun} / ${city}`, p(a).gun === gun && p(a).city === city,
    `gun=${p(a).gun} city=${p(a).city}`);
}

/* ---------------------------------------------------------------------
 * 3. ★ 郡名に「村」が入る郡を壊していない（除外文字を広げすぎない）
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 郡名そのものに「村」が入る郡（除外文字を広げすぎない確認）');
check('福島県田村郡三春町1 → 田村郡 / 三春町',
  p('福島県田村郡三春町1').gun === '田村郡' && p('福島県田村郡三春町1').city === '三春町',
  `gun=${p('福島県田村郡三春町1').gun} city=${p('福島県田村郡三春町1').city}`);
check('山形県北村山郡大石田町1 → 北村山郡 / 大石田町',
  p('山形県北村山郡大石田町1').gun === '北村山郡' && p('山形県北村山郡大石田町1').city === '大石田町',
  `gun=${p('山形県北村山郡大石田町1').gun} city=${p('山形県北村山郡大石田町1').city}`);
console.log('    ※ この2県は対象外だが、**除外文字に `村` を足すと壊れる**ことを固定しておく');

/* ---------------------------------------------------------------------
 * 4. ★ 既存データで判定が1件も変わらない
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 既存データで判定が1件も変わらない');
const V = I.VARIANT_CHARS;
function oldSplit(addr) {
  let a = String(addr).normalize('NFKC').replace(/\s+/g, '').replace(/./gu, ch => V[ch] || ch)
    .replace(/^〒?\d{3}-?\d{4}/, '');
  const PREF = /^(北海道|東京都|京都府|大阪府|.{2,3}?県)/;
  let rest = a, pm;
  while ((pm = PREF.exec(rest))) rest = rest.slice(pm[1].length);
  const gun = (rest.match(/^(.{1,6}?郡)/) || [])[1] || null;   // 旧実装
  if (gun) rest = rest.slice(gun.length);
  const city = (rest.match(/^(.{1,8}?[市町村])/) || [])[1] || null;
  return { gun, city };
}
const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
const changed = recs.filter(r => {
  if (!r.address) return false;
  const o = oldSplit(r.address), n = p(r.address);
  return o.gun !== (n.gun || null) || o.city !== (n.city || null);
});
check(`既存${recs.length}件で郡・市の判定が変わるのは0件`, changed.length === 0,
  changed.map(r => `${r.id}(${r.address})`).join(' / ') || `${recs.length}件を検査`);

/* ---------------------------------------------------------------------
 * 5. 旧実装がどう壊れていたかを固定する
 * ------------------------------------------------------------------- */
console.log('\n■ 旧実装の壊れ方を記録として固定する');
const o = oldSplit(etowa);
check('旧実装は 木更津市下郡 を郡として食っていた', o.gun === '木更津市下郡', `gun=${o.gun}`);
check('★ その結果 city が null になっていた', o.city === null, `city=${JSON.stringify(o.city)}`);
console.log('    → districtKey が null になり、**どの地区にも入らず b2 に落ちる。**');
console.log('      エラーにならず件数が1件減るだけなので、**予告と比べなければ気づけない**');

const ng = results.filter(r => !r.ok);
console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
if (ng.length) process.exitCode = 1;
