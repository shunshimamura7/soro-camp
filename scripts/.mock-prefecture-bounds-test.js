/**
 * 県の座標 bounds の検証。**答えが分かっている入力を通す**（§18-3）。
 *
 * ## なぜ要るか — 「足さなくてもエラーにならない」のが罠
 *
 * `isOutOfBounds(prefecture, lat, lng)` は
 *
 *     const b = PREFECTURE_BOUNDS[prefecture];
 *     if (!b) return false;          // ← 県が未知なら「範囲内」を返す
 *
 * となっている。**千葉を足さないまま千葉のレコードを入れても、validate は通る。**
 * 通るが**座標の検査は1件も走っていない。**
 * 落ちないぶん質が悪い（§19-4「取れなかったを0件と読まない」と同じ型）。
 *
 * だから「足した」だけでは足りず、**足したことで検査が実際に動く**ことを見る。
 *
 * ## 偽ゼロ検証の作り
 *
 *   1. 追加前の挙動（未知の県 → 常に false）を**再現して固定する**
 *   2. 千葉県内の座標が **in bounds**
 *   3. 千葉県外の座標が **out of bounds** ← ここが「検査が動いている」証拠
 *   4. 既存3県の判定が**1つも変わっていない**
 *
 * 実行: `node scripts/.mock-prefecture-bounds-test.js`
 */
const { PREFECTURE_BOUNDS, isOutOfBounds, describeBounds } = require('./prefecture-bounds.js');

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/* ---------------------------------------------------------------------
 * 1. 追加前がどうだったか（未知の県は素通り）
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 未知の県は「範囲内」を返す — 足さないと検査が沈黙する');
// ★ 2026-08-29: ここの実例は元々「東京」だった。東京を PREFECTURE_BOUNDS に足した時点で
// 東京は**既知の県**になり、この検査は必ず落ちる。落ちるのは正しい（もう未知ではない）ので、
// 実例を、足す予定のない県名に差し替えた。**ここに、いま扱っている県を書かないこと。**
check('未知の県（埼玉）は、どんな座標でも false',
  isOutOfBounds('埼玉', 0, 0) === false && isOutOfBounds('埼玉', 90, 180) === false,
  '北緯90度・東経180度でも false');
check('★ 千葉・東京を足す前はこれと同じ状態だった（エラーにならないので気づけない）',
  isOutOfBounds('存在しない県', 34.9, 140.1) === false);
check('★ 東京は**もう未知ではない**（足したので検査が動く）',
  isOutOfBounds('東京', 90, 180) === true,
  '足す前は false（範囲内扱い）を返していた。true になったことが「検査が動いた」証拠');

/* ---------------------------------------------------------------------
 * 2. 千葉県内 — in bounds
 * ------------------------------------------------------------------- */
console.log('\n■ 千葉県内の座標は範囲内');
const INSIDE = [
  ['南房総市千倉町（オレンジ村の大字）', 34.95, 139.95],
  ['夷隅郡大多喜町（大多喜県民の森の大字）', 35.28, 140.25],
  ['富津市豊岡（市民の森）', 35.25, 139.85],
  ['木更津市中島（きさらづCAMP）', 35.42, 139.90],
  ['館山市（県の南西端に近い）', 34.99, 139.87],
  ['銚子市犬吠埼（県の東端）', 35.71, 140.86],
  ['野田市関宿（県の北端）', 36.10, 139.80],
  ['南房総市野島崎（県の南端）', 34.90, 139.89],
];
for (const [label, lat, lng] of INSIDE) {
  check(`${label} (${lat}, ${lng})`, isOutOfBounds('千葉', lat, lng) === false);
}

/* ---------------------------------------------------------------------
 * 3. ★ 千葉県外 — out of bounds（検査が動いている証拠）
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 千葉県外の座標は範囲外になる（＝検査が動いている）');
const OUTSIDE = [
  ['神奈川県厚木市（西に外れる）', 35.44, 139.36],
  ['山梨県富士吉田市（県台帳に混ざっていた県外施設）', 35.48, 138.80],
  ['静岡県富士宮市', 35.36, 138.62],
  ['茨城県水戸市（北に外れる）', 36.37, 140.47],
  ['沖縄県那覇市（南に大きく外れる）', 26.21, 127.68],
];
for (const [label, lat, lng] of OUTSIDE) {
  check(`${label} (${lat}, ${lng})`, isOutOfBounds('千葉', lat, lng) === true);
}

/* ---------------------------------------------------------------------
 * ★ この検査で捕まらないもの — 矩形の限界を先に書いておく
 *
 * bounds は緯度経度の**矩形**なので、県の形には沿わない。
 * 千葉を囲む矩形は**東京都・埼玉県・茨城県の一部を必ず含む。**
 * これは千葉に限った話ではなく、既存3県も同じ（神奈川の矩形は東京都を含む）。
 *
 * **「範囲内だから千葉県内」ではない。**捕まえられるのは
 * **遠くの県を取り違えた型**（県台帳に混ざっていた山梨県富士吉田市など）だけ。
 * 隣県との境界は捕まらないので、そこは住所側（`splitAddress` の県名）で見ること。
 *
 * ★ 2026-08-29: 東京を足して、この限界が**東京では他県より一段深い**ことが分かった。
 * 下の重なり実測を参照。東京の矩形は約7割が他県の矩形と重なるので、
 * 東京については隣接県の取り違えがほぼ捕まらない。住所側への依存度が上がる。
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 矩形なので隣県は捕まらない（限界を固定しておく）');
const B = PREFECTURE_BOUNDS['千葉'];
check('東京都千代田区 (35.69, 139.75) は**千葉の範囲内と判定される**',
  isOutOfBounds('千葉', 35.69, 139.75) === false,
  `千葉の矩形 lng ${B.lngMin}〜${B.lngMax} に 139.75 が入るため。**バグではなく矩形の限界**`);
check('既存県も同じ性質（神奈川の矩形に東京都町田市が入る）',
  isOutOfBounds('神奈川', 35.55, 139.44) === false,
  '**千葉だけの問題ではない**ので、千葉の bounds を狭めて解決しようとしないこと');
check('★ 逆向きも同じ（東京の矩形に神奈川県川崎市が入る）',
  isOutOfBounds('東京', 35.53, 139.70) === false,
  '**東京の bounds を狭めて解決しようとしないこと。**狭めると本土の正しい座標を弾き始める');
check('★ 山梨との境界も捕まらない（東京の矩形に山梨県上野原市が入る）',
  isOutOfBounds('東京', 35.63, 139.10) === false,
  '山梨の lngMax 139.17 のすぐ東が西多摩。**奥多摩・檜原はこの境界に落ちる**');

/* ---------------------------------------------------------------------
 * ★ 東京の矩形が他県とどれだけ重なるか — 数字で固定しておく
 *
 * 「隣県は捕まらない」は既存県にも言えるが、**東京は程度が違う。**
 * 狭めて直したくなる誘惑が強いので、重なりの大きさを実測して固定する。
 * ここが動いたら、誰かが bounds を触ったということ。
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 東京の矩形と他県の矩形の重なり（大きいのは仕様）');
const TOKYO = PREFECTURE_BOUNDS['東京'];
const boxArea = (b) => (b.latMax - b.latMin) * (b.lngMax - b.lngMin);
const overlapRatio = (a, b) => {
  const la = Math.max(0, Math.min(a.latMax, b.latMax) - Math.max(a.latMin, b.latMin));
  const ln = Math.max(0, Math.min(a.lngMax, b.lngMax) - Math.max(a.lngMin, b.lngMin));
  return (la * ln) / boxArea(a);
};
const EXPECTED_OVERLAP = { '神奈川': 39, '山梨': 24, '千葉': 20, '静岡': 10 };
for (const [pref, expected] of Object.entries(EXPECTED_OVERLAP)) {
  const pct = overlapRatio(TOKYO, PREFECTURE_BOUNDS[pref]) * 100;
  check(`東京 ∩ ${pref} = 約${expected}%`, Math.round(pct) === expected, `実測 ${pct.toFixed(1)}%`);
}
// 和集合はグリッドで数える（矩形どうしなので細かく刻めば十分正確）
const GRID = 500;
let covered = 0;
for (let i = 0; i < GRID; i++) {
  for (let j = 0; j < GRID; j++) {
    const lat = TOKYO.latMin + (i + 0.5) * (TOKYO.latMax - TOKYO.latMin) / GRID;
    const lng = TOKYO.lngMin + (j + 0.5) * (TOKYO.lngMax - TOKYO.lngMin) / GRID;
    if (['神奈川', '山梨', '千葉', '静岡'].some((p) => !isOutOfBounds(p, lat, lng))) covered++;
  }
}
const unionPct = covered / (GRID * GRID) * 100;
check('★ 東京の矩形の約7割が、いずれかの県の矩形と重なる', Math.round(unionPct) === 69,
  `実測 ${unionPct.toFixed(1)}%。**東京では隣接県の取り違えが原理的に捕まらない。** ` +
  '住所側（splitAddress の県名／verify-coords-gsi.js の PREF_MISMATCH）で見ること');

/* ---------------------------------------------------------------------
 * ★ 東京は本土のみ — 島嶼部は意図的に対象外
 *
 * 都の四至を素直に取ると沖ノ鳥島（lat 20.4）・南鳥島（lng 153.9）まで含み、
 * 矩形が太平洋を覆って**検査が実質無効になる。**だから本土だけにしてある。
 * 島嶼が範囲外になるのは設計どおりで、バグではない。
 * ------------------------------------------------------------------- */
console.log('\n■ ★ 東京は本土のみ（島嶼は意図的に対象外）');
check('本土：奥多摩町 (35.81, 139.10) は範囲内', isOutOfBounds('東京', 35.81, 139.10) === false);
check('本土：檜原村 (35.73, 139.15) は範囲内', isOutOfBounds('東京', 35.73, 139.15) === false);
check('★ 島嶼：大島町 (34.75, 139.36) は**範囲外**（設計どおり）',
  isOutOfBounds('東京', 34.75, 139.36) === true,
  '島嶼を入れるなら別レンジを持つこと。**本土の矩形を広げて解決しない**');
check('★ 島嶼：小笠原村父島 (27.09, 142.19) は**範囲外**（設計どおり）',
  isOutOfBounds('東京', 27.09, 142.19) === true);
check('★ 四至を素直に取っていたら那覇も範囲内になっていた（＝検査が死ぬ）',
  isOutOfBounds('東京', 26.21, 127.68) === true,
  '沖ノ鳥島・南鳥島まで含む矩形なら false になる。本土に限ったので true のまま');

/* ---------------------------------------------------------------------
 * ★ isIsland — 島嶼だけ矩形検査を外す（2026-08-29 追加）
 *
 * 島嶼の3件（大島・新島・八丈）を入れるにあたって決めた方式。
 * **検査を止めるフラグなので、黙って素通りする方向に壊れる。**だから両方向を固定する。
 *
 *   1. isIsland を渡すと、島の座標が範囲外にならない（＝スキップが効いている）
 *   2. **isIsland を渡さないと範囲外に戻る**（＝フラグを外したら検査が復活する）
 *   3. 本土の座標に付けても矩形の内側のまま（validate 側の矛盾検査に回る）
 *
 * 2 が本題。1 だけ見ても「スキップが効いている」のか
 * 「もともと範囲内だった」のか区別できない。
 * ------------------------------------------------------------------- */
console.log('\n■ ★ isIsland で島嶼だけ矩形検査を外す');
const ISLANDS = [
  ['トウシキ（大島町差木地）', 34.68, 139.40],
  ['羽伏浦（新島村）', 34.37, 139.28],
  ['底土（八丈町）', 33.12, 139.80],
  ['小笠原村父島', 27.09, 142.19],
];
for (const [label, lat, lng] of ISLANDS) {
  check(`${label} は isIsland:true なら範囲外にならない`,
    isOutOfBounds('東京', lat, lng, true) === false);
}
console.log('  ── ★ ここが本題: フラグを外すと検査が戻る ──');
for (const [label, lat, lng] of ISLANDS) {
  check(`★ ${label} は isIsland を渡さないと**範囲外**`,
    isOutOfBounds('東京', lat, lng) === true,
    'フラグを消したら落ちる＝スキップが効いていた証拠');
}
check('★ 本土の座標に isIsland を付けても矩形の内側のまま（奥多摩町）',
  isOutOfBounds('東京', 35.81, 139.10, true) === false &&
  isOutOfBounds('東京', 35.81, 139.10) === false,
  '**この組み合わせは矩形では捕まらない。**validate-data.js が ' +
  '「isIsland が true なのに本土矩形の内側」を警告して拾う');
check('isIsland に true 以外を渡しても検査は止まらない（誤った真値で素通りさせない）',
  isOutOfBounds('東京', 34.68, 139.40, 'true') === true &&
  isOutOfBounds('東京', 34.68, 139.40, 1) === true,
  '文字列 "true" や 1 では止まらない。厳密に true のときだけ');

console.log('\n■ 実データ: 島嶼レコードに isIsland が付いているか');
// 下の section 4 でも同じファイルを読むが、あちらは const recs でこの時点ではまだ宣言前。
const allRecs = require('../data/campgrounds.json');
const islandRecs = allRecs.filter(r => r.prefecture === '東京' && /大島町|新島村|八丈町|青ヶ島村|三宅村|御蔵島村|利島村|神津島村|小笠原村/.test(String(r.address || '')));
check('東京の島嶼レコードはすべて isIsland: true', islandRecs.every(r => r.isIsland === true),
  islandRecs.map(r => `${r.slug}=${r.isIsland}`).join(' / ') || '該当なし');
check('★ 島嶼レコードは座標未取得のまま（実ピンは人が取る）',
  islandRecs.every(r => r.lat === 0 && r.lng === 0 && r.needsCoord === true),
  islandRecs.map(r => `${r.slug} lat${r.lat}/needsCoord=${r.needsCoord}`).join(' / ') || '該当なし');
check('★ 遠くの県の取り違えは捕まる（これがこの検査の役目）',
  isOutOfBounds('千葉', 35.48, 138.80) === true,
  '山梨県富士吉田市＝県台帳に実際に混ざっていた県外施設');

/* ---------------------------------------------------------------------
 * 4. 既存3県の判定が変わっていない
 * ------------------------------------------------------------------- */
console.log('\n■ 既存3県の判定は1つも変わらない');
const WAS = {
  '神奈川': { latMin: 35.10, latMax: 35.68, lngMin: 138.90, lngMax: 139.80 },
  '山梨': { latMin: 35.16, latMax: 35.97, lngMin: 138.20, lngMax: 139.17 },
  '静岡': { latMin: 34.58, latMax: 35.65, lngMin: 137.45, lngMax: 139.18 },
};
for (const [pref, b] of Object.entries(WAS)) {
  check(`${pref} の bounds が変わっていない`,
    JSON.stringify(PREFECTURE_BOUNDS[pref]) === JSON.stringify(b),
    describeBounds(pref));
}
// 実データ全件で out of bounds が0件のままか
const recs = require('../data/campgrounds.json');
const out = recs.filter(r => r.lat && r.lng && isOutOfBounds(r.prefecture, r.lat, r.lng, r.isIsland));
check('既存レコードで範囲外になるものは0件', out.length === 0,
  out.map(r => `${r.id}(${r.prefecture} ${r.lat},${r.lng})`).join(' / ') || `${recs.length}件を検査`);

/* ---------------------------------------------------------------------
 * 5. lat/lng が 0 のレコードは検査対象外（validate-data.js の扱いに合わせる）
 * ------------------------------------------------------------------- */
console.log('\n■ lat/lng が 0 は「未設定」で、範囲外ではない');
console.log('  （`validate-data.js` は 0 を unsetCoords として別集計し、エラーにしない）');
check('0,0 は isOutOfBounds では true になる（＝validate 側で先に弾く必要がある）',
  isOutOfBounds('千葉', 0, 0) === true,
  '**この順序に依存している。**validate-data.js の 0 チェックを bounds より先に置くこと');

const ng = results.filter(r => !r.ok);
console.log(`\n${ng.length ? `❌ ${ng.length}件 NG` : `✅ 全${results.length}件 OK`}`);
if (ng.length) process.exitCode = 1;
