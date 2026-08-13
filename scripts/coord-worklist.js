/**
 * 座標の目視取得タスク（引き継ぎ §7 の A）の作業リストを作る。
 *
 *   node scripts/coord-worklist.js
 *   → scripts/coord-worklist-2026-08.md
 *
 * **data/campgrounds.json は読むだけ。**
 *
 * ## 対象は slug のハードコードではなく、現在のデータから毎回計算する
 *
 * **⚠ 2026-08-13 に作り直した。それまでは slug の一覧を焼き込んでいた。**
 *
 * 旧実装は `COORD_FIXED`（`address-check-2026-08.md` D-2 節の候補15件）・`DOSHI`・
 * `DONE`・`EXCLUDED` の**4本のハードコード一覧**で対象を決めていた。
 * **座標を直しても一覧から消さない限り候補として出続ける**ので、実測で次の状態になっていた。
 *
 *   「残り15件」のうち **13件は取得済み**（全部 verdict OK / coordsVerified true）。精度 13%
 *   逆に **8件が漏れていた**（PREF_MISMATCH・SEA・CITY_MISMATCH・座標なし を含む）
 *   `EXCLUDED` の `murokubo-greenpark` は「閉業のため対象外」のままだったが、
 *   §17-8 で `unverified` に戻っていて座標が 0,0 のまま残っていた
 *
 * 引き継ぎ §18-3 と同じ型（**消費側が古い前提を持ったまま黙って壊れる**）。
 * 判定は `data/campgrounds.json` と `scripts/coord-report.json` の**現在値だけ**から出す。
 *
 * ## 取るべきの条件（どれかに当たれば対象）
 *
 *   1. 座標なし        `needsCoord: true`、または lat/lng が 0・欠落
 *   2. 機械検証で落ちた  verdict が NO_COORD / SEA / PREF_MISMATCH / CITY_MISMATCH /
 *                      SUSPECT / UNKNOWN_MUNI / ERROR
 *   3. 粒度が粗い      coarse（小数2桁以下）かつ coordsVerified が未設定
 *   4. 検査できない     verdict が NO_ADDRESS（address が空）→ **保留。住所の確定が先**
 *
 *   除外: `status` が closed / suspended（もう行けない施設の座標を直しても意味がない）
 *
 * ## 「未目視（機械検証は通過）」は別枠にする。**件数からは消さない**
 *
 * `coordsVerified` が未設定なだけで上の1〜4に当たらないものが22件ある。
 * **全部を「取るべき」に入れると32件に膨らみ、機械検証を通っているものまで開くことになる。**
 * かといって一覧から落とすと「検査していない」と「問題なし」の区別が付かなくなる（§18-3）。
 * **低優先の別セクションに、件数付きで必ず出す。**
 *
 * ## 並び順
 *
 * **地域ごとにまとめる。**近い施設を続けて開けたほうが作業が速い。
 * 市区町村でグループにして、残り件数が多いグループを先頭に。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'coord-report.json');
const OUT = path.join(__dirname, 'coord-worklist-2026-08.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
let report = [];
try {
  report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
} catch {
  console.warn('警告: coord-report.json を読めなかった。GSI の判定欄は空になる');
}
// ⚠ `coord-report.json` は **slug** で引く。`id` ではない。
// データには `id !== slug` のレコードが8件ある（`ootaki` / `kouan` など）。
// 旧実装は `verdictOf(c.id)` で引いていて、その8件は逆ジオの判定を取り落としていた。
const verdictOf = slug => report.find(r => r.slug === slug) || null;

/**
 * 座標を取る前に**別のことを確定させる必要があるもの**。ここだけは人の判断なので手で持つ。
 *
 * **ただし腐らせない。**下の自己診断で、条件を満たさなくなった保留に警告を出す。
 * 「この保留はもう要らない」が出たら消すこと。
 */
const HOLD = {
  'sankoso-auto':
    '**⚠ 要調査・保留。施設名の誤りの疑い。**Googleマップで「三光荘オートキャンプ場 道志村5347」も' +
    '「三光荘 道志村」もヒットしない。かわりに「山光荘オートキャンプ」が' +
    ' 35.4875176, 138.9678346 にあるが、**これは道志村ではない**（道志村の経度は139.0〜139.1）。' +
    '`takizawaso`（滝沢園→滝沢荘）や `komeidoso-auto`（湖明荘→古明地荘）と同じ型。' +
    '**座標を取る前に、実在と正式名称の確定が要る**',
  'saiko-tsuhara-camp':
    '**⚠ 住所が確定していない。**出典により西湖351（町観光連盟）と西湖2299（じゃらん）で割れている。' +
    '**座標より先に住所を決めること。**割れたまま座標を取ると、どちらに合わせた座標か分からなくなる',
};

/** 座標が「取れているが誤っている」ことを示す verdict */
const BAD_VERDICTS = [
  'NO_COORD', 'SEA', 'PREF_MISMATCH', 'CITY_MISMATCH', 'SUSPECT', 'UNKNOWN_MUNI', 'ERROR',
];

/**
 * **座標が別の市区町村や海上を指している**ことを示す verdict。
 * `status: unverified` と組み合わさったときだけ意味を持つ（下の `existenceFirst`）。
 */
const FAR_OFF = ['SEA', 'PREF_MISMATCH', 'CITY_MISMATCH', 'UNKNOWN_MUNI'];

const hasCoord = (c) => !!(Number(c.lat) && Number(c.lng));

/**
 * **実在の決着が先。**`unverified`（実在が確認できていない）でありながら、
 * 座標が別の市区町村や海上を指している組み合わせ。
 *
 * **実ピンを引いても、そもそも施設が存在しなければ意味がない。**
 * 座標が大きく外れていること自体が「レコードが作られたものである」疑いの材料になる（§6-16）。
 * しゅんが Googleマップを開く前に気づけるよう、行に注記を出す。
 *
 * 座標を持っていない（0,0）ものは対象外。**外れている証拠が無い**ので、この判定には使えない。
 */
function existenceFirst(c, r) {
  return c.status === 'unverified' && hasCoord(c) && r && FAR_OFF.includes(r.verdict);
}

/**
 * 1件を仕分ける。**判定元は campgrounds.json と coord-report.json の現在値だけ。**
 *
 *   need   … 座標を取る対象
 *   hold   … 座標より先に決めることがある
 *   unseen … 未目視だが機械検証は通過（低優先。件数からは消さない）
 *   skip   … closed / suspended
 *   done   … 対象外（目視済みで機械検証も通過）
 */
function classify(c, r) {
  if (c.status === 'closed' || c.status === 'suspended') {
    return { kind: 'skip', label: `status: ${c.status}` };
  }
  if (!r) {
    return {
      kind: 'need',
      label: '**⚠ レポートに無い**',
      why: '`coord-report.json` にこの slug が無い。`verify-coords-gsi.js` を回し直すこと',
    };
  }
  if (c.needsCoord === true || !hasCoord(c)) {
    return { kind: 'need', label: '**座標なし**', why: '`lat`/`lng` が 0 か欠落。推測で埋めないこと（§2-6）' };
  }
  if (r.verdict === 'NO_ADDRESS') {
    return {
      kind: 'hold',
      label: '**⚠ address が空で検査できない**',
      why: '座標の妥当性を照合する相手が無い。**住所の確定が先**（§7-9）',
    };
  }
  if (BAD_VERDICTS.includes(r.verdict)) {
    const where = [r.gsiPref, r.gsiCity].filter(Boolean).join(' ').replace(/\s+/g, ' ');
    return {
      kind: 'need',
      label: `**機械検証NG（${r.verdict}）**`,
      why: r.verdict === 'SEA' ? '逆ジオが市区町村を返さない（海上・湖面）' : `逆ジオは「${where}」を指している`,
    };
  }
  if (r.coarse && c.coordsVerified !== true) {
    return { kind: 'need', label: '粒度が粗い', why: '小数2桁以下（約1km の粒度）で、人の目視も入っていない' };
  }
  if (c.coordsVerified !== true) {
    return { kind: 'unseen', label: '未目視（機械検証は通過）' };
  }
  return { kind: 'done' };
}

/** 市区町村。並び順のグループに使う */
function muni(address) {
  if (!address) return '(住所なし)';
  const a = String(address).normalize('NFKC').replace(/\s+/g, '').replace(/^.{2,3}[都道府県]/, '');
  const m = a.match(/^(.{1,6}?郡)?(.{1,8}?[市町村])(.{1,6}?区)?/);
  return m ? (m[2] + (m[3] || '')) : a.slice(0, 6);
}

/**
 * Googleマップの検索窓に貼る文字列。
 * 住所があれば「施設名 住所」、無ければ「施設名 市町村名」。
 * 施設名の括弧書き（別名の併記）は検索の邪魔になるので落とす。
 */
function query(c) {
  const name = String(c.name).replace(/[（(][^）)]*[）)]/g, '').trim();
  if (c.address) return `${name} ${c.address}`;
  return `${name} ${c.prefecture}県${c.area}`;
}

const rows = [];
const unseen = [];
const skipped = [];
for (const c of camps) {
  const r = verdictOf(c.slug);
  const k = classify(c, r);
  if (k.kind === 'done') continue;
  if (k.kind === 'skip') { skipped.push({ id: c.slug, name: c.name, label: k.label }); continue; }

  const coord = hasCoord(c)
    ? `${c.lat}, ${c.lng}${r ? `<br><sub>${r.verdict}${r.gsiCity ? ` / 逆ジオ: ${r.gsiCity.replace(/\s+/g, '')}${r.lv01Nm || ''}` : ''}${r.coarse ? ' / **粒度が粗い**' : ''}</sub>` : ''}`
    : '**なし**';

  if (k.kind === 'unseen') {
    unseen.push({ id: c.slug, name: c.name, address: c.address || '(住所なし)', coord, muni: muni(c.address), status: c.status });
    continue;
  }

  // 住所そのものが確定していないレコードがある。**座標を取る前に住所を決める必要がある**
  // ので、行に警告を出す（`saiko-tsuhara-camp` は出典により番地が割れている）。
  const addrWarn = (c.cautions || []).filter(x => /住所|出典/.test(x));
  rows.push({
    id: c.slug, name: c.name, address: c.address || '(住所なし)', coord,
    st: k.label, why: k.why || '', kind: k.kind,
    q: query(c), muni: muni(c.address), status: c.status, addrWarn,
    hold: HOLD[c.slug] || null,
    existenceFirst: existenceFirst(c, r),
  });
}

/**
 * 保留の自己診断。**条件を満たさなくなった保留に警告を出す。**
 * 手で持っている一覧が腐るのを防ぐ仕掛け（これが無いと旧 `EXCLUDED` と同じことになる）。
 */
const staleHolds = Object.keys(HOLD).filter((id) => !rows.some((r) => r.id === id));

// 地域ごとにまとめる。件数の多い市町村を先に、同数なら市町村名順
const byMuni = new Map();
for (const r of rows) {
  if (!byMuni.has(r.muni)) byMuni.set(r.muni, []);
  byMuni.get(r.muni).push(r);
}
/**
 * **次にやる塊を先頭に置く。**
 * 残り件数（取得済み・対象外・保留を除いた数）が多い市区町村から並べる。
 * 道志村は取得済みが多いので自動的に後ろに下がる。
 */
const remain = list => list.filter(r => r.kind === 'need' && !r.hold).length;
const groups = [...byMuni.entries()]
  .sort((a, b) => remain(b[1]) - remain(a[1]) || b[1].length - a[1].length || a[0].localeCompare(b[0], 'ja'));
for (const [, list] of groups) {
  // グループ内は 取るべき → 保留 の順
  const rank = r => (r.hold || r.kind === 'hold' ? 1 : 0);
  list.sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
}

const L = [];
L.push('# 座標の目視取得 作業リスト（2026-08）');
L.push('');
L.push('`node scripts/coord-worklist.js` で再生成できる。**データは読むだけ。**');
L.push('');
L.push(`**対象 ${rows.length}件。**引き継ぎ §7 の A（しゅん本人がやる必要があるもの）。`);
L.push('');
L.push('**⚠ 2026-08-13 に判定を作り直した。**それまでは slug の一覧を焼き込んでいて、');
L.push('**「残り15件」のうち13件が取得済み（精度13%）、逆に8件が漏れていた。**');
L.push('いまは `data/campgrounds.json` と `scripts/coord-report.json` の**現在値だけ**から毎回計算する。');
L.push('引き継ぎ §18-3 と同じ型だったので、同じ直し方をした。');
L.push('');
const nHold = rows.filter(r => r.hold || r.kind === 'hold').length;
const nNeed = rows.length - nHold;
L.push('## 進捗');
L.push('');
L.push('| | 件数 | |');
L.push('|---|---|---|');
L.push(`| **取るべき** | **${nNeed}** | 座標なし・機械検証NG・粒度が粗い |`);
L.push(`| ⚠ 保留 | ${nHold} | 座標より先に決めることがある |`);
L.push(`| 未目視（機械検証は通過） | ${unseen.length} | **低優先。下に一覧を出す。件数から消さない** |`);
L.push(`| 対象外（closed / suspended） | ${skipped.length} | もう行けない施設の座標を直しても意味がない |`);
L.push('');
if (staleHolds.length) {
  L.push('### ⚠ この保留はもう要らない');
  L.push('');
  L.push('**下の slug は保留の条件を満たさなくなっている**（座標が入った・機械検証を通った等）。');
  L.push('`coord-worklist.js` の `HOLD` から消すこと。**残すと旧 `EXCLUDED` と同じように腐る。**');
  L.push('');
  for (const id of staleHolds) L.push(`- \`${id}\``);
  L.push('');
}
const nextGroups = groups.filter(([, l]) => remain(l) > 0).slice(0, 3)
  .map(([m, l]) => `**${m}${remain(l)}件**`);
if (nextGroups.length) {
  L.push(`次にやる塊: ${nextGroups.join(' → ')}。近い施設を続けて開けたほうが速い。`);
  L.push('');
}
L.push('**並び順は市区町村ごとで、残り件数が多いところが先頭。**');
L.push('グループ内は 未取得 → 保留 → 取得済み・対象外 の順。');
L.push('');

L.push('## 手順');
L.push('');
L.push('1. Googleマップで**検索用文字列**を貼って検索する');
L.push('2. **施設のピンを確認する。**施設名が一致しているか、');
L.push('   近隣の別施設を掴んでいないかを見る');
L.push('   （§6-18 のとおり、名前が似ていると別施設の情報が紐づくことがある）');
L.push('3. URLの `data=` の末尾にある **`!8m2!3d緯度!4d経度`** から座標を読む');
L.push('   ```');
L.push('   .../data=!4m6!3m5!1s0x6019.../!8m2!3d35.5694332!4d139.1992778');
L.push('                                          ^^^^^^^^^ 緯度  ^^^^^^^^^^ 経度');
L.push('   ```');
L.push('   **`@緯度,経度` は使わない。**あれは地図の表示中心で、');
L.push('   ピンの位置とは違う（実測で約200m西にずれる）');
L.push('4. slug と座標を控える');
L.push('');
L.push('**ピンが見つからない施設は、座標を書かずに「見つからず」と残すこと。**');
L.push('近そうな場所を当てて書くと §6-16 の捏造になる。');
L.push('');
const warned = rows.filter(r => r.addrWarn.length);
if (warned.length) {
  L.push('### ⚠ 住所が確定していないもの');
  L.push('');
  L.push('**座標より先に住所を決める必要がある。**住所が割れたまま座標を取ると、');
  L.push('どちらの住所に合わせた座標なのか分からなくなる。');
  L.push('');
  for (const r of warned) L.push(`- \`${r.id}\` … ${r.addrWarn.join(' / ')}`);
  L.push('');
}

L.push('## 作業リスト');
L.push('');
for (const [m, list] of groups) {
  L.push(`### ${m}（${list.length}件）`);
  L.push('');
  L.push('| # | slug | 施設名 | 住所 | 現在の座標 | 状態 | Googleマップ検索用の文字列 |');
  L.push('|---|---|---|---|---|---|---|');
  list.forEach((r, i) => {
    const addr = r.address + (r.addrWarn.length ? `<br><sub>⚠ ${r.addrWarn.join(' / ')}</sub>` : '');
    let st = r.st + (r.why ? `<br><sub>${r.why}</sub>` : '');
    let q = '`' + r.q + '`';
    if (r.hold) st = r.hold;
    // **実在の決着が先。**実ピンを引いても施設が存在しなければ意味がない
    if (r.existenceFirst) {
      st =
        '**🛑 実在確認が先（座標取得ではない）**<br><sub>`status: unverified`（実在が確認できていない）なのに、' +
        `座標が別の場所を指している（${r.st.replace(/\*/g, '')}）。**Googleマップを開く前に、施設が実在するかを決めること。**` +
        '存在しない施設の実ピンは引けない（§6-4・§6-16）</sub>';
      q = '—（先に実在確認）';
    }
    L.push(`| ${i + 1} | \`${r.id}\` | ${r.name}${r.status !== 'active' ? `<br><sub>status: ${r.status}</sub>` : ''} | ${addr} | ${r.coord} | ${st} | ${q} |`);
  });
  L.push('');
}

L.push(`## 未目視（機械検証は通過）— ${unseen.length}件`);
L.push('');
L.push('**低優先。**`coordsVerified` が立っていないだけで、逆ジオは address と矛盾していない。');
L.push('**「取るべき」には入れていないが、件数からも消さない。**');
L.push('消すと「検査していない」と「問題なし」の区別が付かなくなる（§18-3）。');
L.push('');
L.push('| slug | 施設名 | 住所 | 現在の座標 |');
L.push('|---|---|---|---|');
for (const u of [...unseen].sort((a, b) => a.muni.localeCompare(b.muni, 'ja') || a.id.localeCompare(b.id))) {
  L.push(`| \`${u.id}\` | ${u.name}${u.status !== 'active' ? `<br><sub>status: ${u.status}</sub>` : ''} | ${u.address} | ${u.coord} |`);
}
L.push('');

L.push('## 取得した座標の入力フォーマット');
L.push('');
L.push('**このまま埋めて渡してもらえれば、`apply-coords.js` 型のスクリプトで流し込む。**');
L.push('slug と座標だけあればよい。順番は問わない。');
L.push('');
L.push('```');
L.push('slug                      lat         lng');
for (const [, list] of groups) {
  for (const r of list) if (r.kind === 'need' && !r.hold && !r.existenceFirst) L.push(`${r.id.padEnd(26)}`);
}
L.push('```');
L.push('');
L.push('JSON で渡す場合はこの形。');
L.push('');
L.push('```json');
L.push('{');
L.push('  "取得日": "2026-08-__",');
L.push('  "coords": {');
L.push('    "norolodge": { "lat": 35.5694332, "lng": 139.1992778 },');
L.push('    "見つからなかったもの": null');
L.push('  }');
L.push('}');
L.push('```');
L.push('');
L.push('## 流し込んだあとにやること');
L.push('');
L.push('- `node scripts/verify-address-gsi.js --slug=<slug>` で **MATCH になるか確認**');
L.push('  - **道志村・鳴沢村の施設は `NO_LV01` が正常。**大字を持たない自治体なので MATCH は出ない');
L.push('    （2026-08-13 に `NO_OAZA` から `NO_LV01` に分けた。§18-4）');
L.push('- `needsCoord` を外す（座標が入ったレコードに `needsCoord: true` が');
L.push('  残っていると「まだ取得すべき対象」という誤ったシグナルになる）');
L.push('- `coordsVerified: true` を立てる（人の目視で確認した、の意味。§2-5）');
L.push('- `node scripts/validate-data.js`');
L.push('');
L.push('## この作業がなぜ人手なのか');
L.push('');
L.push('**推測で書けないのは座標だけで、だから座標が検査の軸になっている**（§6-15）。');
L.push('Google Places API はキャッシュ規約でデータに保存できないので使えない。');
L.push('OSM は牧野周辺の bbox で `camp_site` が1件しか無く、本命2件とも不在だった。');
L.push('**機械で埋める手段が無い。**');

fs.writeFileSync(OUT, L.join('\n'), 'utf8');
console.log(`取るべき ${rows.length - nHold}件 / 保留 ${nHold}件 / 未目視 ${unseen.length}件 / 対象外 ${skipped.length}件`);
if (staleHolds.length) console.log(`⚠ もう要らない保留: ${staleHolds.join(', ')}`);
const ef = rows.filter((r) => r.existenceFirst);
if (ef.length) console.log(`🛑 実在確認が先: ${ef.map((r) => r.id).join(', ')}`);
for (const [m, list] of groups) console.log(`  ${m.padEnd(14)} ${list.length}件`);
console.log(`\n→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
