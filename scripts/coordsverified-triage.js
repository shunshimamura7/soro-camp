/**
 * `coordsVerified: true` の引き直し候補（validate-data の②③）を、
 * **Web検索なしで**仕分けて実数を出す。
 *
 * ## 背景（§18-10 の 0-B / §18-11）
 *
 * `coordsVerified` は cc751ab で114件に**推定で**一括付与されていた。
 * validate-data は現在値だけから4段階に分ける:
 *
 *   ① 機械検証を通っていない … 位置の誤りが確定。coord-worklist の「取るべき」に出る
 *   ② 小数3桁以下            … 一括投入の粒度のまま。位置が特定できていない
 *   ③ 住所と2km以上          … **距離だけでは判定できない**（§6-15。寸又峡 12.9km でも正常）
 *   ④ 妥当                   … 触らない
 *
 * ③47件をそのまま作業リストに入れると誤検出に埋もれる（`classify-oaza-miss.js` と同じ問題）。
 * このスクリプトは I5/I7/I8 と同系の**性質ベースの規則**で③を仕分けて、
 * 「実ピンを引き直すべき実数」を出す。
 *
 * ## 仕分けの規則（slug は焼き込まない。現在値だけから判定する）
 *
 *   T1 MUNI_NO_LV01 … その自治体の全レコードで逆ジオが大字を返さない（道志村・鳴沢村型）。
 *                     GSI の住所検索は代表点しか返せず、**距離は「町の中心からの距離」でしかない**
 *   T2 OAZA_MATCH   … 逆ジオの大字が address の大字と一致する。座標は**正しい大字の中に居る**。
 *                     山間部の大字は数km四方あるので、大字中心との距離は誤りの証拠にならない
 *   T3 WIDE_SNAP    … 同じ lv01Nm（または同じ旧町名接頭辞）が③の複数件に返っている。
 *                     GSI が広域の代表大字にスナップしている（I5/I7 と同じ観測）
 *   T4 RECHECK      … 上のどれでも説明がつかない。**ここが引き直しの実数**
 *
 * ②12件は仕分けの対象にしない。**小数3桁は一括投入の値の特徴そのもの**なので、
 * 距離の説明がついても「人が目視した座標」ではありえない。全件引き直し側に出す。
 *
 * ## この検査の限界
 *
 *   - T1〜T3 は「距離が誤りの証拠にならない」であって「座標が正しい」ではない。
 *     **無罪の証明はしない**（check-official-urls.js の OK と同じ扱い）
 *   - T4 も「誤り」の証明ではない。実ピンと突き合わせて初めて決まる。
 *     **実ピンはしゅんが Google マップから取る。ここでは推定しない**
 *
 * 判定するだけで **data/campgrounds.json は書き換えない。**
 *
 *   node scripts/coordsverified-triage.js
 *   → scripts/coordsverified-triage-2026-08.md（上書き。作業リストなので追記にしない）
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const REPORT = path.join(__dirname, 'coord-report.json');
const OUT = path.join(__dirname, 'coordsverified-triage-2026-08.md');

const {
  isLv01Missing,
  remainder,
  chouPrefix,
  addressOaza,
  longestCommonSubstring,
  normalizeNumUnified,
} = require('./lib/jp-address');
const { readDistances } = require('./lib/address-check-md');

/**
 * coord-worklist.js と同じ市区町村の切り出し。
 * 県名の剥がしは**非貪欲**にすること。貪欲だと「山梨県**都**留市」の「都」まで
 * 県名扱いになり muni が「留市」になる（2026-08-13 のレビューで発覚）。
 */
function muni(address) {
  if (!address) return '(住所なし)';
  const a = String(address).normalize('NFKC').replace(/\s+/g, '').replace(/^.{2,3}?[都道府県]/, '');
  const m = a.match(/^(.{1,6}?郡)?(.{1,8}?[市町村])(.{1,6}?区)?/);
  return m ? (m[2] + (m[3] || '')) : a.slice(0, 6);
}

const decimals = (n) => {
  const s = String(n);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/**
 * camps / report / distOf から仕分け器を組み立てる。
 * selftest が合成データを注入できるよう、ファイル読み込みと分離してある。
 */
function buildTriager(camps, report, distOf) {
  const reportOf = new Map(report.map((r) => [r.slug, r]));

  // ── validate-data と同じ4段階を再現して ②③ を取り出す ────────────────────
  const coarse = [];
  const far = [];
  const unmeasured = []; // 距離が md に無い。「測っていない」を「距離0」と同一視しない
  for (const c of camps) {
    if (c.coordsVerified !== true) continue;
    const r = reportOf.get(c.slug);
    if (!r || r.verdict !== 'OK') continue; // ① は coord-worklist 側。ここでは扱わない
    if (Math.min(decimals(c.lat), decimals(c.lng)) <= 3) coarse.push({ c, r });
    else if (!distOf.has(c.slug)) unmeasured.push({ c, r });
    else if (distOf.get(c.slug) >= 2) far.push({ c, r });
  }

  // ── T1: 自治体ぐるみで lv01 が無い（道志村・鳴沢村型） ────────────────────
  // 判定は「その自治体のレコードが2件以上あり、**全件**で lv01Nm が欠落」。
  // 1件しか無い自治体は「自治体の性質」か「その1件の異常」か区別できないので T1 にしない
  // （mitsumata-camp を I1 で揉み消した事故と同じ轍を踏まない。§18-4）
  const lv01ByMuni = new Map();
  for (const r of report) {
    const m = muni(r.address);
    if (!lv01ByMuni.has(m)) lv01ByMuni.set(m, { total: 0, missing: 0 });
    const e = lv01ByMuni.get(m);
    e.total++;
    if (isLv01Missing(r.lv01Nm)) e.missing++;
  }
  const muniNoLv01 = (m) => {
    const e = lv01ByMuni.get(m);
    return e && e.total >= 2 && e.missing === e.total;
  };

  // ── T3 の頻度: 母集団は③ではなく**全レコード** ────────────────────────────
  //
  // ③の中だけで数えると母集団が小さすぎて頻度が立たない
  // （`asagiri-greenpark-camp` の教訓と同じ: 頻度判定は母集団に依存する。§18-7）。
  // classify-oaza-miss の I5/I7/I8 が OAZA_MISS 全体で数えているのに合わせ、
  // I5/I7 は「lv01Nm が address と食い違っている全レコード」、
  // I8 は**全レコード**を母集団にする。
  const lv01Freq = new Map(); // I5: 同じ市区町村で同じ lv01Nm が複数の住所に返る
  const chouFreq = new Map(); // I7: 合併市の旧町名スナップ
  const oazaGroups = new Map(); // I8: 同じ address 大字なのに lv01Nm が割れる
  for (const r of report) {
    const m = muni(r.address);
    const oaza = normalizeNumUnified(r.lv01Nm || '');
    const rest = normalizeNumUnified(remainder(r.address, m) || '');
    const mismatch = oaza && rest && longestCommonSubstring(oaza, rest) < 2;
    if (mismatch) {
      const key = `${m}|${oaza}`;
      lv01Freq.set(key, (lv01Freq.get(key) || 0) + 1);
      const cp = chouPrefix(r.lv01Nm || '');
      if (cp) chouFreq.set(cp, (chouFreq.get(cp) || 0) + 1);
    }
    const ao = addressOaza(r.address, m);
    if (ao) {
      const gk = `${m}|${ao}`;
      if (!oazaGroups.has(gk)) oazaGroups.set(gk, { count: 0, lv01Set: new Set() });
      const g = oazaGroups.get(gk);
      g.count++;
      if (oaza) g.lv01Set.add(oaza);
    }
  }

  function triage({ c, r }) {
    const m = muni(c.address);
    const km = distOf.get(c.slug);
    if (muniNoLv01(m)) {
      return {
        tier: 'T1',
        reason: `${m} は全${lv01ByMuni.get(m).total}件で lv01 が欠落。距離 ${km}km は町の代表点からの距離でしかない`,
      };
    }
    const rest = remainder(c.address, m);
    const oaza = normalizeNumUnified(r.lv01Nm || '');
    if (oaza && rest) {
      // 既知の限界: LCS≥2 は1文字の大字（富士宮市「麓」等）を構造的に拾えない。
      // その場合は T4 に落ちる＝引き直し候補側に倒れるので、安全方向の取りこぼし
      const lcs = longestCommonSubstring(oaza, normalizeNumUnified(rest));
      if (lcs >= 2) {
        return {
          tier: 'T2',
          reason: `逆ジオの大字「${r.lv01Nm}」が address と${lcs}文字一致。座標は正しい大字の中（大字中心との距離 ${km}km は証拠にならない）`,
        };
      }
    }
    const key = `${m}|${oaza}`;
    if ((lv01Freq.get(key) || 0) >= 2) {
      return {
        tier: 'T3',
        reason: `lv01Nm「${r.lv01Nm}」が食い違い全体で${lv01Freq.get(key)}件に返っている（広域スナップ先。I5型）`,
      };
    }
    const cp = chouPrefix(r.lv01Nm || '');
    if (cp && (chouFreq.get(cp) || 0) >= 2) {
      return {
        tier: 'T3',
        reason: `旧町名「${cp}」が食い違い全体で${chouFreq.get(cp)}件に返っている（合併市の旧町名スナップ。I7型）`,
      };
    }
    const ao = addressOaza(c.address, m);
    const g = ao ? oazaGroups.get(`${m}|${ao}`) : null;
    if (g && g.count >= 2 && g.lv01Set.size >= 2) {
      return {
        tier: 'T3',
        reason: `大字「${ao}」を名乗る施設が${g.count}件あり lv01Nm が${g.lv01Set.size}種類に割れている（大字が広い。I8型）`,
      };
    }
    return {
      tier: 'T4',
      reason: rest
        ? `距離 ${km}km に説明がつかない（大字は一致せず、スナップの痕跡も無い）`
        : `距離 ${km}km に説明がつかない（address が市区町村までで、大字の突き合わせ自体ができない）`,
    };
  }

  return { coarse, far, unmeasured, triage };
}

/**
 * 必須の検証。**合成データ**で T1〜T4 の各規則が1つずつ効くことを確かめる。
 * 実データの slug は焼き込まない（データの状態を焼き込んだ検査は作業のたびに腐る。
 * district-sweep.js の SELF_TEST 案B と同じ方針）。
 */
function selftest() {
  const mk = (slug, address, lat, lng) => ({ slug, address, lat, lng, coordsVerified: true, status: 'active' });
  const rep = (slug, address, lv01Nm, extra = {}) => ({ slug, address, lv01Nm, verdict: 'OK', ...extra });
  // T1: 自治体ぐるみで lv01 欠落（2件とも「−」）
  // T2: lv01 が address の大字と一致
  // T3: 同じ lv01 が2件の別住所に返る（I5）
  // T4: どれにも当たらない
  const camps = [
    mk('t1-a', '山梨県架空村1000', 35.500001, 138.500001),
    mk('t2-a', '山梨県架空市大豆生田100', 35.600001, 138.600001),
    mk('t3-a', '山梨県架空町甲1', 35.700001, 138.700001),
    mk('t3-b', '山梨県架空町乙2', 35.710001, 138.710001),
    mk('t4-a', '山梨県架空市丙3', 35.800001, 138.800001),
    mk('coarse-a', '山梨県架空市丁4', 35.9, 138.9), // 小数1桁 → ②
    mk('unm-a', '山梨県架空市戊5', 35.850001, 138.850001), // dist に無い → 距離未計測
  ];
  const report = [
    rep('t1-a', '山梨県架空村1000', '−'),
    rep('t1-x', '山梨県架空村2000', '−'), // T1 の相方（自治体ぐるみの判定に要る）
    rep('t2-a', '山梨県架空市大豆生田100', '大豆生田'),
    rep('t3-a', '山梨県架空町甲1', '遠くの大字'),
    rep('t3-b', '山梨県架空町乙2', '遠くの大字'),
    rep('t4-a', '山梨県架空市丙3', '無関係'),
    rep('coarse-a', '山梨県架空市丁4', '丁'),
    rep('unm-a', '山梨県架空市戊5', '戊'),
  ];
  const dist = new Map([
    ['t1-a', 5], ['t2-a', 4], ['t3-a', 6], ['t3-b', 7], ['t4-a', 8], ['coarse-a', 3],
  ]);
  const { coarse, far, unmeasured, triage } = buildTriager(camps, report, dist);
  const got = Object.fromEntries(far.map((x) => [x.c.slug, triage(x).tier]));
  const checks = [
    ['t1-a が T1', got['t1-a'] === 'T1'],
    ['t2-a が T2', got['t2-a'] === 'T2'],
    ['t3-a が T3', got['t3-a'] === 'T3'],
    ['t3-b が T3', got['t3-b'] === 'T3'],
    ['t4-a が T4', got['t4-a'] === 'T4'],
    ['coarse-a が ②', coarse.some((x) => x.c.slug === 'coarse-a')],
    ['②は③に混ざらない', !far.some((x) => x.c.slug === 'coarse-a')],
    ['距離の無い unm-a は「未計測」（③にも④にも化けない）', unmeasured.some((x) => x.c.slug === 'unm-a') && !far.some((x) => x.c.slug === 'unm-a')],
  ];
  let ok = true;
  console.log('[selftest] 合成データで T1〜T4 の規則を1つずつ確認');
  for (const [label, pass] of checks) {
    if (!pass) ok = false;
    console.log(`  ${pass ? 'OK' : '❌'} ${label}${pass ? '' : `（実際: ${JSON.stringify(got)}）`}`);
  }
  return ok;
}

// ── 実行 ────────────────────────────────────────────────────────────────────
if (!selftest()) {
  console.error('\n検証データを正しく仕分けられない。規則か正規化が壊れている。中止する。');
  process.exit(1);
}

const camps = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const distRead = readDistances();
if (distRead.note) {
  console.error(`中止: ${distRead.note}`);
  process.exit(1);
}
const distOf = distRead.distances;
const { coarse, far, unmeasured, triage } = buildTriager(camps, report, distOf);

const triaged = far.map((x) => ({ ...x, ...triage(x) }));
const byTier = (t) => triaged.filter((x) => x.tier === t);

// ── 出力 ────────────────────────────────────────────────────────────────────
const stamp = new Date().toISOString().slice(0, 10);
const L = [];
L.push('# coordsVerified 引き直し候補の仕分け');
L.push('');
L.push(`生成: ${stamp} / \`node scripts/coordsverified-triage.js\`（このファイルは毎回上書き）`);
L.push('');
L.push('**①（機械検証を通っていない）はここに出ない。**`coord-worklist.js` の「取るべき」が正。');
L.push('T1〜T3 は「距離が誤りの証拠にならない」であって「座標が正しい」ではない（無罪の証明はしない）。');
L.push('');
L.push('| 仕分け | 件数 | 扱い |');
L.push('|---|---|---|');
L.push(`| ② 小数3桁以下 | ${coarse.length} | **全件引き直し**（一括投入の粒度のまま。目視の座標ではありえない） |`);
L.push(`| ③-T1 自治体ぐるみで lv01 欠落 | ${byTier('T1').length} | 低優先（距離は代表点まで） |`);
L.push(`| ③-T2 大字が一致 | ${byTier('T2').length} | 低優先(座標は正しい大字の中) |`);
L.push(`| ③-T3 広域スナップ | ${byTier('T3').length} | 低優先（GSI 側の粒度） |`);
L.push(`| ③-T4 説明がつかない | **${byTier('T4').length}** | **引き直し候補**（実ピンと突き合わせて決める） |`);
L.push(`| 距離未計測 | ${unmeasured.length} | 仕分け不能。\`verify-address-gsi.js\` を回し直してから再仕分け |`);
L.push('');

L.push('## ② 小数3桁以下 — 全件引き直し');
L.push('');
L.push('| slug | status | 座標 | 距離 |');
L.push('|---|---|---|---|');
for (const { c } of coarse) {
  L.push(`| \`${c.slug}\` | ${c.status} | ${c.lat}, ${c.lng} | ${distOf.get(c.slug) ?? '−'}km |`);
}
L.push('');

for (const [tier, title] of [
  ['T4', '③-T4 説明がつかない — 引き直し候補（ここから着手）'],
  ['T1', '③-T1 自治体ぐるみで lv01 欠落 — 低優先'],
  ['T2', '③-T2 大字が一致 — 低優先'],
  ['T3', '③-T3 広域スナップ — 低優先'],
]) {
  const rows = byTier(tier);
  L.push(`## ${title}`);
  L.push('');
  if (!rows.length) {
    L.push('該当なし');
    L.push('');
    continue;
  }
  L.push('| slug | status | 市区町村 | lv01Nm | 距離 | 理由 |');
  L.push('|---|---|---|---|---|---|');
  for (const { c, r, reason } of rows) {
    L.push(
      `| \`${c.slug}\` | ${c.status} | ${muni(c.address)} | ${r.lv01Nm || '−'} | ${distOf.get(c.slug)}km | ${reason.replace(/\|/g, '\\|')} |`
    );
  }
  L.push('');
}

if (unmeasured.length) {
  L.push('## 距離未計測 — 仕分け不能（測っていないことを「妥当」と混同しない）');
  L.push('');
  L.push('検証後に入った・座標が動いたレコード。`node scripts/verify-address-gsi.js` を回し直すこと。');
  L.push('');
  L.push('| slug | status | 市区町村 |');
  L.push('|---|---|---|');
  for (const { c } of unmeasured) {
    L.push(`| \`${c.slug}\` | ${c.status} | ${muni(c.address)} |`);
  }
  L.push('');
}

fs.writeFileSync(OUT, L.join('\n'), 'utf8');

console.log(`coordsverified-triage: ② ${coarse.length}件 / ③ ${far.length}件 / 距離未計測 ${unmeasured.length}件`);
console.log(`  T1 自治体ぐるみで lv01 欠落  ${String(byTier('T1').length).padStart(3)}件（低優先）`);
console.log(`  T2 大字が一致                ${String(byTier('T2').length).padStart(3)}件（低優先）`);
console.log(`  T3 広域スナップ              ${String(byTier('T3').length).padStart(3)}件（低優先）`);
console.log(`  T4 説明がつかない            ${String(byTier('T4').length).padStart(3)}件 ← ③の引き直しの実数`);
console.log(`  引き直しの実数: ②${coarse.length} + T4 ${byTier('T4').length} = ${coarse.length + byTier('T4').length}件`);
console.log(`→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
