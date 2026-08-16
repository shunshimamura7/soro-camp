/**
 * 大字検査（案C ステップ2）の検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * ## なぜ要るか
 *
 * 案Cで地区が市町村単位になると、大字の制約が外れて
 * **名前だけで市内のどのレコードにも当たれるようになる。**
 * §19-5 の実測では、新しく出た誤突合5件のうち3件が案C自身が作った/残したものだった。
 *
 * その誤突合を後から拾うのが `oazaCheck()`。
 * **検査が空を返しても「誤突合が無い」ではなく「検査が動いていない」場合がある**ので、
 * **既に答えが分かっている2件が必ず出ること**を固定する。
 *
 *   - ペンギン村（富士宮市猪之頭）→ `eichinomori`（富士宮市根原71-3）
 *   - K's CAMP伊豆高原グランピング（伊東市富戸）→ `izukogen-auto`（伊東市池672）
 *
 * ## 逆方向も測る（これが本題）
 *
 * 「不一致だけ出る」検査は使えない。**正しい突合を不一致と言わないこと**も要る。
 *
 *   - 田貫湖（ソース: 猪之頭）↔ `tanukiko`（データ: 佐折634-1）は**同一施設**。
 *     ソース側の住所が古い型なので、**出たうえで人が読む**もの（自動で外さない）
 *   - `麓` と `麓朝霧` のような前方一致は **包含**として無害側に分ける
 *   - 大字が同じものは**1件も出さない**
 *   - `nameOnly` のソースで当たった突合は **検査対象外**（0件ではない）
 *
 * 実行: `node scripts/.mock-oaza-check-test.js`
 */
const { _internal: I } = require('./district-sweep.js');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/** IN_DATA の突合1組を作る。bucket は oazaCheck が見る分だけ持たせる */
function pair(recordId, recordName, recordAddr, sourceName, sourceAddrs, matchedBy) {
  return {
    kind: 'IN_DATA',
    record: { id: recordId, name: recordName, address: recordAddr },
    bucket: { name: sourceName, addresses: sourceAddrs },
    matchedBy: matchedBy || '名前',
  };
}

(async () => {
  /* ---------------------------------------------------------------------
   * 1. ★ 既知の誤突合2件が出ること
   * ------------------------------------------------------------------- */
  console.log('\n■ ★ 案Cが作る誤突合（答えが分かっている2件）が検査に出る');

  const known = [
    pair('eichinomori', '朝霧高原 english/叡智の森', '静岡県富士宮市根原71-3',
      'ペンギン村オートキャンプ場', ['静岡県富士宮市猪之頭2544-1'], '番地（名前は不一致）'),
    pair('izukogen-auto', '伊豆高原オートキャンプ場', '静岡県伊東市池672',
      "K's CAMP伊豆高原グランピング", ['静岡県伊東市富戸1317-4321'], '名前'),
  ];
  const kr = I.oazaCheck(known);
  const ng = kr.filter(r => r.verdict === '不一致');

  check('ペンギン村 → eichinomori が不一致で出る',
    ng.some(r => r.id === 'eichinomori'),
    ng.filter(r => r.id === 'eichinomori').map(r => `${r.recOaza} ↔ ${r.srcOazas.join('/')}`).join('') || '出なかった');
  check("K's CAMP伊豆高原 → izukogen-auto が不一致で出る",
    ng.some(r => r.id === 'izukogen-auto'),
    ng.filter(r => r.id === 'izukogen-auto').map(r => `${r.recOaza} ↔ ${r.srcOazas.join('/')}`).join('') || '出なかった');
  check('この2件だけで、余計なものが出ていない', kr.length === 2, `${kr.length}件`);
  check('一致の根拠が残る（番地で当たったのか名前で当たったのか）',
    ng.every(r => !!r.matchedBy),
    ng.map(r => r.matchedBy).join(' / '));

  /* ---------------------------------------------------------------------
   * 2. 大字が同じなら1件も出さない（★ 偽陽性の逆方向）
   * ------------------------------------------------------------------- */
  console.log('\n■ 大字が同じ突合は出さない');
  const same = [
    pair('doshi-a', 'キャンプA', '山梨県南都留郡道志村的様9745', 'キャンプA', ['山梨県南都留郡道志村的様9745']),
    // 番地が違っても大字が同じなら出さない。この検査は番地を見ない
    pair('doshi-b', 'キャンプB', '山梨県南都留郡道志村和出村1200', 'キャンプB', ['山梨県南都留郡道志村和出村5500']),
  ];
  check('大字一致は0件', I.oazaCheck(same).length === 0, `${I.oazaCheck(same).length}件`);

  /* ---------------------------------------------------------------------
   * 3. 前方一致は「包含」に分ける（不一致にしない）
   * ------------------------------------------------------------------- */
  console.log('\n■ 前方一致は包含（無害）として分ける');
  const inc = [
    pair('sorairo', '朝霧CampBaseそらいろ', '静岡県富士宮市麓450',
      '朝霧CampBaseそらいろ', ['静岡県富士宮市麓朝霧450']),
    pair('hakushu-v', 'ヴィレッヂ白州', '山梨県北杜市白州町大坊1131',
      'ヴィレッヂ白州', ['山梨県北杜市白州町1131']),
  ];
  const ir = I.oazaCheck(inc);
  check('2件とも包含に分類される',
    ir.length === 2 && ir.every(r => r.verdict === '包含'),
    ir.map(r => `${r.id}:${r.verdict}`).join(' '));
  check('包含は不一致に混ざらない', ir.filter(r => r.verdict === '不一致').length === 0);

  /* ---------------------------------------------------------------------
   * 4. 正しい突合でも大字が違えば出る（田貫湖の型）
   * ------------------------------------------------------------------- */
  console.log('\n■ 同一施設でもソース側の住所が古ければ出る（自動で外さないための型）');
  const tanuki = [
    pair('tanukiko', '田貫湖キャンプ場', '静岡県富士宮市佐折634-1',
      '田貫湖キャンプ場', ['静岡県富士宮市猪之頭2929-3']),
  ];
  const tr = I.oazaCheck(tanuki);
  check('田貫湖も不一致として出る（＝人が読む一覧に載る）',
    tr.length === 1 && tr[0].verdict === '不一致',
    tr.map(r => `${r.recOaza} ↔ ${r.srcOazas.join('/')}`).join(''));
  check('★ 検査の出力は判定を持たない（record を外す・status を変える等の情報を含まない）',
    tr[0] && !('drop' in tr[0]) && !('status' in tr[0]));

  /* ---------------------------------------------------------------------
   * 5. ★ 検査対象外を「0件」と混ぜない
   * ------------------------------------------------------------------- */
  console.log('\n■ ★ どちらかの大字が取れない突合は「検査対象外」（一致ではない）');
  const skip = [
    // nameOnly のソース: 住所を1件も持たない
    pair('nameonly-1', 'なんとかキャンプ場', '静岡県富士宮市猪之頭1', 'なんとかキャンプ場', []),
    // ソース側は市区町村どまり（案Cで入ってくる146件の型）
    pair('nooaza-1', 'どこかキャンプ場', '山梨県南都留郡道志村950', 'どこかキャンプ場', ['山梨県南都留郡道志村950']),
    // データ側の住所が空
    pair('noaddr-1', '住所なしレコード', null, '住所なしレコード', ['静岡県富士宮市麓1']),
  ];
  const sr = I.oazaCheck(skip);
  check('3件とも検査対象外', sr.length === 3 && sr.every(r => r.verdict === '検査対象外'),
    sr.map(r => `${r.id}:${r.verdict}`).join(' '));
  check('検査対象外は不一致にも包含にも数えられない',
    sr.filter(r => r.verdict !== '検査対象外').length === 0);

  /* ---------------------------------------------------------------------
   * 6. MISSING / ORPHAN は検査しない（比べる相手がいない）
   * ------------------------------------------------------------------- */
  console.log('\n■ MISSING / ORPHAN は対象外（組になっていない）');
  const other = [
    { kind: 'MISSING', bucket: { name: 'X', addresses: ['静岡県富士宮市猪之頭1'] }, record: null },
    { kind: 'ORPHAN', bucket: null, record: { id: 'y', name: 'Y', address: '静岡県富士宮市麓1' } },
  ];
  check('0件', I.oazaCheck(other).length === 0);

  /* ---------------------------------------------------------------------
   * 7. 大字が取れない項目の内訳（案C ステップ1）
   * ------------------------------------------------------------------- */
  console.log('\n■ 大字が取れないソース項目の行き先が分かれる');
  const bIn = { name: 'IN側', aliases: new Set(['IN側']), addresses: ['山梨県南都留郡道志村950'],
    addressKnown: true, inDistrict: true, noOaza: [{ name: '月夜野キャンプ場', address: '山梨県南都留郡道志村950', sourceId: 'src-a' }] };
  const bMiss = { name: 'MISS側', aliases: new Set(['MISS側']), addresses: ['山梨県南都留郡道志村1388'],
    addressKnown: true, inDistrict: true, noOaza: [{ name: '奥秋キャンプ場', address: '山梨県北都留郡丹波山村1388', sourceId: 'src-a' }] };
  const bOut = { name: 'OUT側', aliases: new Set(['OUT側']), addresses: ['神奈川県厚木市1'],
    addressKnown: true, inDistrict: false, noOaza: [{ name: '別の市', address: '神奈川県厚木市1', sourceId: 'src-b' }] };
  const bNoAddr = { name: '住所なし', aliases: new Set(['住所なし']), addresses: [],
    addressKnown: false, inDistrict: false, noOaza: [{ name: '住所なし', address: '山梨県南都留郡道志村1', sourceId: 'src-c' }] };
  const bPlain = { name: '大字あり', aliases: new Set(['大字あり']), addresses: ['山梨県南都留郡道志村的様9745'],
    addressKnown: true, inDistrict: true, noOaza: [] };
  const merged = [bIn, bMiss, bOut, bNoAddr, bPlain];
  const res = [
    { kind: 'IN_DATA', bucket: bIn, record: { id: 'r1', name: 'r1', address: '山梨県南都留郡道志村950' } },
    { kind: 'MISSING', bucket: bMiss, record: null },
    { kind: 'IN_DATA', bucket: bPlain, record: { id: 'r2', name: 'r2', address: '山梨県南都留郡道志村的様9745' } },
  ];
  const nb = I.noOazaBreakdown(merged, res);
  check('大字が取れる項目は数に入らない（合計4件）', nb.total === 4, `${nb.total}件`);
  check('IN_DATA に落ちた分が数えられる', nb.counts['IN_DATA'] === 1, JSON.stringify(nb.counts));
  check('MISSING に落ちた分が数えられる', nb.counts['MISSING'] === 1);
  check('地区外は b2 に分かれる', nb.counts['b2（地区外）'] === 1);
  check('住所なしバケットは b1 に分かれる', nb.counts['b1（バケットに住所なし）'] === 1);
  check('★ 行き先の合計 = 総数（どこにも数えられない項目が無い）',
    Object.values(nb.counts).reduce((a, b) => a + b, 0) === nb.total);
  check('項目ごとの内訳が残る（ソースIDと住所つき）',
    nb.rows.length === 4 && nb.rows.every(r => r.sourceId && r.address && r.where));

  const bad = results.filter(r => !r.ok);
  console.log(`\n${bad.length ? `❌ ${bad.length}件 NG` : `✅ 全${results.length}件 OK`}`);
  if (bad.length) process.exitCode = 1;
})();
