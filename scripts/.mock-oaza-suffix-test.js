/**
 * 大字の末尾除去の検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * ## なぜ要るか
 *
 * `splitAddress` の大字抽出に
 *
 *     .replace(/(?:地内|地先|先|内)$/, '')
 *
 * があり、**裸の「内」まで食っていた。**`堀之内` が `堀之` になる
 * （2026-08-16 に大多喜SABO の住所で踏んだ。`市原市堀之内` でも同じ）。
 *
 * 意図は「敷地内」「地先」のような**位置を表す接尾語**を落とすことで、
 * **大字の最後の1文字を削ることではない。**
 *
 * ## 偽ゼロ検証（これが本題）
 *
 * 直すと `sessokyo-camp` の地区キーが `犬間長島公園敷` → `犬間長島公園` に変わる。
 * **変わるのがこの1件だけであること**と、
 * **`inDistrict` の突き合わせが変わらないこと**を、実データで固定する。
 *
 * 実行: `node scripts/.mock-oaza-suffix-test.js`
 */
const fs = require('fs');
const path = require('path');
const { _internal: I } = require('./district-sweep.js');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

const oaza = a => (I.splitAddress(a) || {}).oaza;

(async () => {
  /* ---- 削ってはいけないもの ---- */
  console.log('\n■ 大字の一部である「内」を削らない');
  check('夷隅郡大多喜町堀之内595 → 堀之内', oaza('千葉県夷隅郡大多喜町堀之内595') === '堀之内', oaza('千葉県夷隅郡大多喜町堀之内595'));
  check('市原市堀之内1 → 堀之内', oaza('千葉県市原市堀之内1') === '堀之内', oaza('千葉県市原市堀之内1'));
  check('鴨川市内浦3228 → 内浦（先頭の内は元から無事）', oaza('千葉県鴨川市内浦3228') === '内浦', oaza('千葉県鴨川市内浦3228'));
  check('山北町玄倉514 → 玄倉', oaza('神奈川県足柄上郡山北町玄倉514') === '玄倉', oaza('神奈川県足柄上郡山北町玄倉514'));
  // 「先」も同じ型。大字が「先」で終わる例（竹之下・川入 などと同種の作り）
  check('御殿場市川島田 → 川島田', oaza('静岡県御殿場市川島田1') === '川島田', oaza('静岡県御殿場市川島田1'));

  /* ---- 削るべきもの ---- */
  console.log('\n■ 位置を表す接尾語は削る');
  check('…犬間長嶋公園敷地内 → 敷地内が落ちる',
    oaza('静岡県榛原郡川根本町犬間 長嶋公園敷地内') === '犬間長島公園',
    oaza('静岡県榛原郡川根本町犬間 長嶋公園敷地内'));
  check('…白浜町根本1624番地1地先 → 番地の前で切れる',
    oaza('千葉県南房総市白浜町根本1624番地1地先') === '白浜町根本',
    oaza('千葉県南房総市白浜町根本1624番地1地先'));
  check('数字が無く「地先」で終わる → 地先が落ちる',
    oaza('静岡県島田市川根町地先') === '川根町',
    oaza('静岡県島田市川根町地先'));

  /* ---- ★ 突き合わせが変わらないこと ---- */
  console.log('\n■ ★ inDistrict の判定が変わらない（前方一致なので影響しない）');
  const d = I.parseDistrict('榛原郡川根本町犬間');
  check('犬間の地区に「犬間長嶋公園敷地内」が入る',
    I.inDistrict('静岡県榛原郡川根本町犬間 長嶋公園敷地内', d) === true);
  const d2 = I.parseDistrict('夷隅郡大多喜町堀之内');
  check('堀之内の地区に「堀之内595」が入る',
    I.inDistrict('千葉県夷隅郡大多喜町堀之内595', d2) === true);
  check('堀之内の地区に「堀之丸1」は入らない（別の大字）',
    I.inDistrict('千葉県夷隅郡大多喜町堀之丸1', d2) === false,
    '※ 削れていた頃は「堀之」同士で一致してしまう型');

  /* ---- ★ 既存データで変わるのが1件だけ ---- */
  console.log('\n■ ★ 既存データで地区キーが変わるのは想定の2件だけ');
  const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
  // 旧実装を再現して比べる
  const V = I.VARIANT_CHARS;
  const OLD = /(?:地内|地先|先|内)$/;
  function oldOaza(addr) {
    let a = String(addr).normalize('NFKC').replace(/\s+/g, '').replace(/./gu, ch => V[ch] || ch)
      .replace(/^〒?\d{3}-?\d{4}/, '');
    const PREF = /^(北海道|東京都|京都府|大阪府|.{2,3}?県)/;
    let rest = a, pm;
    while ((pm = PREF.exec(rest))) rest = rest.slice(pm[1].length);
    const gun = (rest.match(/^(.{1,6}?郡)/) || [])[1] || null; if (gun) rest = rest.slice(gun.length);
    const city = (rest.match(/^(.{1,8}?[市町村])/) || [])[1] || null; if (city) rest = rest.slice(city.length);
    const ward = (rest.match(/^(.{1,6}?区)/) || [])[1] || null; if (ward) rest = rest.slice(ward.length);
    return ((rest.match(/^([^\d]{1,14})/) || [])[1] || '')
      .replace(/[（(].*$/, '').replace(/字.*$/, '').replace(OLD, '');
  }
  // ★ 2026-08-17 に1件から2件になった。**緩めたのではなく、当事者が増えた。**
  //
  // 千葉の `otaki-sabo`（夷隅郡大多喜町堀之内595）を投入したため。
  // **このバグを見つけたきっかけの住所そのもの**が、いまデータ側にも入った。
  // 旧実装なら `堀之内` → `堀之` に削れる。**修正の生きた証人が2件目**。
  //
  // ここは件数だけでなく **id を名指しで固定する。**
  // 件数だけだと、別のレコードが増減したときに素通りする。
  const EXPECTED = {
    'sessokyo-camp': ['犬間長島公園敷', '犬間長島公園'],   // 「敷地内」の「内」を食っていた
    'otaki-sabo': ['堀之', '堀之内'],                       // 大字の最後の1文字を削っていた
  };
  const changed = recs.filter(r => r.address && oldOaza(r.address) !== oaza(r.address));
  const ids = changed.map(r => r.id).sort();
  check(`変わるレコードは ${Object.keys(EXPECTED).length}件`, changed.length === Object.keys(EXPECTED).length,
    ids.join(',') || '0件');
  check('その id が想定どおり', ids.join(',') === Object.keys(EXPECTED).sort().join(','),
    ids.join(',') || '-');
  for (const r of changed) {
    const want = EXPECTED[r.id];
    const got = [oldOaza(r.address), oaza(r.address)];
    check(`  ${r.id}: 旧「${got[0]}」→ 新「${got[1]}」`,
      !!want && want[0] === got[0] && want[1] === got[1],
      want ? '' : '**想定に無いレコードが変わった**');
    console.log(`      ${r.address}`);
  }
  // ★ 堀之内は「案Cで地区が市町村単位になったから関係ない」ではない。
  // 大字は突合後の**大字検査**で使うので、削れたままだと検査が別の大字と一致してしまう
  const sabo = recs.find(r => r.id === 'otaki-sabo');
  if (sabo) {
    check('★ 堀之内の地区キーが削れていない', I.districtKey(sabo.address) === '夷隅郡大多喜町堀之内',
      I.districtKey(sabo.address));
    check('★ 番地キーも保たれる', I.banchiKey(sabo.address) === '堀之内595', I.banchiKey(sabo.address));
  }

  const ng = results.filter(r => !r.ok);
  console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
  if (ng.length) process.exitCode = 1;
})();
