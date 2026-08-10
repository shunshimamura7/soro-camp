/**
 * 座標の反映（2026-08-11）。しゅんの目視で取得した5件。
 *
 *   node scripts/apply-coords-2026-08-11.js
 *
 * 全件 GoogleマップURL の `!8m2!3d緯度!4d経度`（実ピン）から取得。
 * ピン名が施設名と一致することも確認済み。
 * **`@緯度,経度`（表示中心・約200m西にずれる）ではない。**
 *
 * ## 内訳
 *
 *   needsCoord だった2件      ryokokubashi-camp / new-tashiro-auto-camp
 *   道志川流域 PREF_MISMATCH  tsubakiso-auto / doshi-keikoku / woodsman-camp
 *
 * ## PREF_MISMATCH の3件について
 *
 * **3件とも `coordsVerified: true` が立ったまま、座標が神奈川県側に落ちていた。**
 * §6-1（確認済みフラグが検証をすり抜けさせた）と同じ構図がここにもある。
 * フラグが立っていることは、値が正しいことを意味しない。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'coords-applied-2026-08-11.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

/** slug → 実ピンの座標。取得日 2026-08-11 */
const COORDS = {
  'ryokokubashi-camp':     { lat: 35.5386414, lng: 139.1137342 },
  'new-tashiro-auto-camp': { lat: 35.526241,  lng: 139.037629 },
  'tsubakiso-auto':        { lat: 35.5316707, lng: 139.0581356 },
  'doshi-keikoku':         { lat: 35.539544,  lng: 139.111221 },
  'woodsman-camp':         { lat: 35.5278004, lng: 139.0386523 },
};

const changed = [];
for (const [slug, co] of Object.entries(COORDS)) {
  const c = camps.find(x => x.slug === slug);
  if (!c) { console.warn(`警告: ${slug} が見つかりません`); continue; }
  const before = { lat: c.lat, lng: c.lng, needsCoord: !!c.needsCoord, coordsVerified: c.coordsVerified === true, lastVerified: c.lastVerified };

  c.lat = co.lat;
  c.lng = co.lng;
  // 座標が入ったレコードに needsCoord が残っていると
  // 「まだ取得すべき対象」という誤ったシグナルになる
  delete c.needsCoord;
  c.coordsVerified = true;   // 人の目視（§2-5）
  c.lastVerified = '2026-08-11';

  // 座標を差し替えたので、機械検証（GSI）の結果は取り直しになる。
  // 古い判定を残すと「検証済み」に見えるので落とす
  delete c.coordsGsiChecked;

  changed.push({ slug, name: c.name, address: c.address, before, after: { lat: c.lat, lng: c.lng } });
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

const moved = (a, b) => {
  if (!a.lat || !a.lng) return null;
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const la = a.lat * r, lb = b.lat * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};

console.log('── 反映 ──────────────────────────────');
for (const ch of changed) {
  const d = moved(ch.before, ch.after);
  console.log(`  ${ch.slug}（${ch.name}）`);
  console.log(`    ${ch.before.lat}, ${ch.before.lng} → ${ch.after.lat}, ${ch.after.lng}` + (d !== null ? `　（${d >= 1000 ? (d / 1000).toFixed(1) + 'km' : d + 'm'} 移動）` : '　（新規）'));
  console.log(`    needsCoord ${ch.before.needsCoord} → false / coordsVerified ${ch.before.coordsVerified} → true / lastVerified ${ch.before.lastVerified} → 2026-08-11`);
}
const n = k => camps.filter(k).length;
console.log(`\n  needsCoord 残り ${n(c => c.needsCoord)}件 / coordsVerified ${n(c => c.coordsVerified === true)}件 / coordsGsiChecked ${n(c => c.coordsGsiChecked === true)}件`);

/* ── ノート ───────────────────────────────────────────────────────── */
let md = '# 座標の反映（2026-08-11）\n\n';
md += 'しゅんの目視で取得した5件。全件 GoogleマップURL の `!8m2!3d緯度!4d経度`（実ピン）から取得し、\n';
md += 'ピン名が施設名と一致することも確認済み。**`@緯度,経度`（表示中心）は使っていない。**\n\n';
md += '| slug | 施設名 | 変更前 | 変更後 | 移動距離 |\n| --- | --- | --- | --- | --- |\n';
for (const ch of changed) {
  const d = moved(ch.before, ch.after);
  md += `| \`${ch.slug}\` | ${ch.name} | ${ch.before.lat || '**なし**'}, ${ch.before.lng || ''} | ${ch.after.lat}, ${ch.after.lng} | ${d !== null ? (d >= 1000 ? (d / 1000).toFixed(1) + 'km' : d + 'm') : '新規'} |\n`;
}
md += '\n全件 `needsCoord` を外し、`coordsVerified: true` を立て、`lastVerified` を 2026-08-11 にした。\n';
md += '**`coordsGsiChecked` は落とした。**座標を差し替えたので機械検証は取り直しになる。\n';
md += '古い判定を残すと「検証済み」に見えてしまう（§6-1）。\n\n';
md += '## PREF_MISMATCH 3件について\n\n';
md += '`tsubakiso-auto` / `doshi-keikoku` / `woodsman-camp` は、\n';
md += '**3件とも `coordsVerified: true` が立ったまま、座標が神奈川県側に落ちていた。**\n';
md += '§6-1（確認済みフラグが検証をすり抜けさせた）と同じ構図。\n';
md += '**フラグが立っていることは、値が正しいことを意味しない。**\n\n';
md += '移動距離が大きいのもこの3件で、`woodsman-camp` は **10.6km**、\n';
md += '`tsubakiso-auto` は 6.3km、`doshi-keikoku` は 3.7km ずれていた。\n\n';

/* verify-address-gsi.js --slug=<slug> の結果（2026-08-11 実行）。
 * **道志村は大字が無いので NO_OAZA が正常。**MATCH は構造上出ない。 */
const GSI = [
  { slug: 'ryokokubashi-camp',     verdict: 'NO_OAZA', gsi: '道志村', dist: '7.36km' },
  { slug: 'new-tashiro-auto-camp', verdict: 'NO_OAZA', gsi: '道志村', dist: '0.43km' },
  { slug: 'tsubakiso-auto',        verdict: 'NO_OAZA', gsi: '道志村', dist: '2.27km' },
  { slug: 'doshi-keikoku',         verdict: 'NO_OAZA', gsi: '道志村', dist: '7.16km' },
  { slug: 'woodsman-camp',         verdict: 'NO_OAZA', gsi: '道志村', dist: '0.47km' },
];
md += '## 反映後の GSI 検証（`verify-address-gsi.js --slug=`）\n\n';
md += '| slug | 判定 | 逆ジオの市区町村 | 住所検索との距離 |\n| --- | --- | --- | --- |\n';
for (const g of GSI) md += `| \`${g.slug}\` | ${g.verdict} | ${g.gsi} | ${g.dist} |\n`;
md += '\n**5件とも NO_OAZA。道志村は大字を持たないので、これが正常。**\n';
md += 'MATCH は構造上出ない。\n\n';
md += '**懸念していた CITY_MISS は出なかった。**\n';
md += '`doshi-keikoku`（経度139.1112）と `ryokokubashi-camp`（139.1137）は\n';
md += '道志村の東端で県境から数百mしかなく、逆ジオが相模原市側を返す可能性があったが、\n';
md += '**5件とも「道志村」を返した。**座標は山梨県側に収まっている。\n\n';
md += '**距離の欄は判定に使えない。**7.36km / 7.16km と大きく出ているのは、\n';
md += '道志村に大字が無く、住所検索が「道志村49」の地番を解決できずに\n';
md += '村の代表点を返すため。**村の全長がおよそ15kmあるので、この程度の差は当然出る。**\n';
md += '§6-15 のとおり、独立に生成された値どうしでないと検査にならない。\n\n';

fs.writeFileSync(NOTES_PATH, md);
console.log(`\n→ ${path.relative(path.join(__dirname, '..'), NOTES_PATH)}`);
