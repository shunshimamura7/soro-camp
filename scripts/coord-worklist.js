/**
 * 座標の目視取得タスク（引き継ぎ §7 の A）の作業リストを作る。
 *
 *   node scripts/coord-worklist.js
 *   → scripts/coord-worklist-2026-08.md
 *
 * **data/campgrounds.json は読むだけ。**
 *
 * ## 対象
 *
 *   needsCoord: true        座標を持っていない（lat/lng = 0）
 *   COORD_FIXED候補         address は一次情報と一致し、座標側が疑わしいと判定したもの
 *                           （`address-check-2026-08.md` D-2 節）
 *   道志川流域(PREF_MISMATCH) 山梨の住所なのに座標が神奈川県側に落ちている
 *
 * ## 並び順
 *
 * **地域ごとにまとめる。**近い施設を続けて開けたほうが作業が速い。
 * 市区町村でグループにして、グループ内は slug 順。
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
const verdictOf = slug => report.find(r => r.slug === slug) || null;

/** `address-check-2026-08.md` D-2 節の COORD_FIXED 候補15件 */
const COORD_FIXED = [
  // 純粋な候補10件
  'westriver-auto-camp', 'folkwood-yatsugatake', 'mobility-park-izu',
  'hamanako-garden-camp', 'darumayama-kogen', 'retreat-camp-mahoroba',
  'camp-baird', 'hidamari-yamakita', 'shosenkyo-auto-camp', 'komeidoso-auto',
  // 住所を直しても不整合が残った5件
  'hadano-togawa-camp', 'ryuyo-marine', 'akeno-fureai-camp',
  'nakatajima-sakyuu-camp', 'fuji-midori-kyuka-auto',
];

/** 道志川流域の PREF_MISMATCH 4件。山梨の住所なのに座標が神奈川県側に落ちている */
const DOSHI = ['tsubakiso-auto', 'sankoso-auto', 'doshi-keikoku', 'woodsman-camp'];

const state = new Map();
for (const c of camps) if (c.needsCoord) state.set(c.id, 'needsCoord');
for (const id of COORD_FIXED) if (!state.has(id)) state.set(id, 'COORD_FIXED候補');
for (const id of DOSHI) if (!state.has(id)) state.set(id, '道志川流域(PREF_MISMATCH)');

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
for (const [id, st] of state) {
  const c = camps.find(x => x.id === id);
  if (!c) { console.warn(`警告: ${id} がデータに無い`); continue; }
  const r = verdictOf(id);
  const hasCoord = !!(c.lat && c.lng);
  const coord = hasCoord
    ? `${c.lat}, ${c.lng}${r ? `<br><sub>${r.verdict}${r.gsiCity ? ` / 逆ジオ: ${r.gsiCity.replace(/\s+/g, '')}${r.lv01Nm || ''}` : ''}${r.coarse ? ' / **粒度が粗い**' : ''}</sub>` : ''}`
    : '**なし**';
  // 住所そのものが確定していないレコードがある。**座標を取る前に住所を決める必要がある**
  // ので、行に警告を出す（`saiko-tsuhara-camp` は出典により番地が割れている）。
  const addrWarn = (c.cautions || []).filter(x => /住所|出典/.test(x));
  rows.push({
    id, name: c.name, address: c.address || '(住所なし)', coord, st,
    q: query(c), muni: muni(c.address), status: c.status, addrWarn,
  });
}

// 地域ごとにまとめる。件数の多い市町村を先に、同数なら市町村名順
const byMuni = new Map();
for (const r of rows) {
  if (!byMuni.has(r.muni)) byMuni.set(r.muni, []);
  byMuni.get(r.muni).push(r);
}
const groups = [...byMuni.entries()]
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'ja'));
for (const [, list] of groups) list.sort((a, b) => a.id.localeCompare(b.id));

const L = [];
L.push('# 座標の目視取得 作業リスト（2026-08）');
L.push('');
L.push('`node scripts/coord-worklist.js` で再生成できる。**データは読むだけ。**');
L.push('');
L.push(`**対象 ${rows.length}件。**引き継ぎ §7 の A（しゅん本人がやる必要があるもの）。`);
L.push('');
const cnt = s => rows.filter(r => r.st === s).length;
L.push(`- \`needsCoord\`（座標を持っていない）… ${cnt('needsCoord')}件`);
L.push(`- COORD_FIXED候補（address は正しく座標が疑わしい）… ${cnt('COORD_FIXED候補')}件`);
L.push(`- 道志川流域 PREF_MISMATCH（山梨の住所なのに座標が神奈川側）… ${cnt('道志川流域(PREF_MISMATCH)')}件`);
L.push('');
L.push('**並び順は市区町村ごと。**近い施設を続けて開けたほうが速いため。');
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
    L.push(`| ${i + 1} | \`${r.id}\` | ${r.name}${r.status !== 'active' ? `<br><sub>status: ${r.status}</sub>` : ''} | ${addr} | ${r.coord} | ${r.st} | \`${r.q}\` |`);
  });
  L.push('');
}

L.push('## 取得した座標の入力フォーマット');
L.push('');
L.push('**このまま埋めて渡してもらえれば、`apply-coords.js` 型のスクリプトで流し込む。**');
L.push('slug と座標だけあればよい。順番は問わない。');
L.push('');
L.push('```');
L.push('slug                      lat         lng');
for (const [, list] of groups) {
  for (const r of list) L.push(`${r.id.padEnd(26)}`);
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
L.push('  - **道志村の施設は NO_OAZA が正常。**大字を持たないので MATCH は出ない');
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
console.log(`対象 ${rows.length}件 / ${groups.length}市区町村`);
for (const [m, list] of groups) console.log(`  ${m.padEnd(14)} ${list.length}件`);
console.log(`\n→ ${path.relative(path.join(__dirname, '..'), OUT)}`);
