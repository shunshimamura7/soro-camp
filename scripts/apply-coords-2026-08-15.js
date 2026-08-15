/**
 * 座標の反映（2026-08-15）。しゅんの目視で取得した山梨東部4件。
 *
 *   node scripts/apply-coords-2026-08-15.js
 *
 * 全件 GoogleマップURL の `!8m2!3d緯度!4d経度`（実ピン）から取得。
 * **`@緯度,経度`（表示中心・約200m西にずれる）ではない。**
 *
 * ## 反映前に確認したこと
 *
 * - **GSI 逆ジオで4件とも市区町村・大字が address と一致**
 *   （大月町真木 / 秋山 / 西原 / 賑岡町奥山）。不一致ゼロ
 * - 3km 以内に既存レコードなし（重複・座標誤りの疑いなし）
 * - `soloComment` に高度の記述は無いので標高のクロスチェックは省略
 *
 * ## 渡された5件目（鹿留オートキャンプ場）は反映しない
 *
 * **`shishidome-auto` は 2026-08-15 に削除済みで、反映先のレコードが無い。**
 * 復元条件（電話で予約と料金が取れること）は満たされていないので据え置き。
 * **座標は `deleted-records-2026-08.md` に書き残した**ので、復元する日が来たら使える。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'coords-applied-2026-08-15.md');

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

/** slug → 実ピンの座標。取得日 2026-08-15 */
const COORDS = {
  'kananomori-sanso':    { lat: 35.6272737, lng: 138.899017 },
  'midori-taiyo-oka':    { lat: 35.5762244, lng: 139.0993435 },
  'hiranoda-kyuyoson':   { lat: 35.6929287, lng: 139.0264078 },
  'eureka-camp-village': { lat: 35.6401008, lng: 138.9193386 },
};

/** 反映前に GSI 逆ジオで確認した結果（記録用。ここでは通信しない） */
const GSI = {
  'kananomori-sanso':    { city: '大月市',   oaza: '大月町真木',  elev: 581.3 },
  'midori-taiyo-oka':    { city: '上野原市', oaza: '秋山',        elev: 331.2 },
  'hiranoda-kyuyoson':   { city: '上野原市', oaza: '西原',        elev: 510.4 },
  'eureka-camp-village': { city: '大月市',   oaza: '賑岡町奥山',  elev: 528.4 },
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
  c.lastVerified = '2026-08-15';

  // 座標を入れたので、機械検証（GSI）は取り直し。**手では立てない。**
  // このあと verify-coords-gsi.js → apply-gsi-flags.js の順で締める
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
  console.log(`    needsCoord ${ch.before.needsCoord} → false / coordsVerified ${ch.before.coordsVerified} → true / lastVerified ${ch.before.lastVerified} → 2026-08-15`);
}
const n = k => camps.filter(k).length;
console.log(`\n  needsCoord 残り ${n(c => c.needsCoord)}件 / coordsVerified ${n(c => c.coordsVerified === true)}件 / coordsGsiChecked ${n(c => c.coordsGsiChecked === true)}件`);
console.log('  **coordsGsiChecked はこのあと verify-coords-gsi.js → apply-gsi-flags.js で付ける。手では立てない。**');

/* ── ノート ───────────────────────────────────────────────────────── */
let md = '# 座標の反映（2026-08-15）\n\n';
md += 'しゅんの目視で取得した山梨東部4件。全件 GoogleマップURL の `!8m2!3d緯度!4d経度`（実ピン）から取得。\n';
md += '**`@緯度,経度`（表示中心）は使っていない。**\n\n';
md += '| slug | 施設名 | 変更前 | 変更後 | 移動距離 |\n| --- | --- | --- | --- | --- |\n';
for (const ch of changed) {
  const d = moved(ch.before, ch.after);
  md += `| \`${ch.slug}\` | ${ch.name} | ${ch.before.lat || '**なし（0,0）**'} | ${ch.after.lat}, ${ch.after.lng} | ${d !== null ? (d >= 1000 ? (d / 1000).toFixed(1) + 'km' : d + 'm') : '新規' } |\n`;
}
md += '\n全件 `needsCoord` を外し、`coordsVerified: true` を立て、`lastVerified` を 2026-08-15 にした。\n';
md += '**`coordsGsiChecked` は落としてある。**このあと `verify-coords-gsi.js` を全件実走し、\n';
md += '`apply-gsi-flags.js` で立て直す。**手では立てない**（機械検証を通っていないものに\n';
md += '「検証済み」が立つのが §18-1 で塞いだ穴そのもの）。\n\n';
md += '## 反映前の確認 — GSI 逆ジオは4件とも大字まで一致\n\n';
md += '| slug | 逆ジオ（市区町村 / 大字） | address | 判定 | 標高 |\n| --- | --- | --- | --- | --- |\n';
for (const ch of changed) {
  const g = GSI[ch.slug];
  md += `| \`${ch.slug}\` | ${g.city} / ${g.oaza} | ${ch.address} | ✅ 一致 | ${g.elev} m |\n`;
}
md += '\n**市区町村だけでなく大字まで一致した**ので、座標と住所のどちらを疑うかという判断は不要だった。\n';
md += '3km 以内に既存レコードは無く、重複・座標誤りの疑いも無い。\n';
md += '`soloComment` に高度の記述が無いので標高のクロスチェックは省略した。\n\n';
md += '## 渡された5件目（鹿留オートキャンプ場）は反映していない\n\n';
md += '`shishidome-auto` は **2026-08-15 に削除済み**で、反映先のレコードが無い。\n';
md += '**復元条件（電話 080-2232-0722 で予約と料金が取れること）は満たされていない**ので据え置き。\n';
md += '座標 `35.51773 / 138.882193`（逆ジオ 都留市鹿留・標高585m で整合）は\n';
md += '`deleted-records-2026-08.md` に書き残した。復元する日が来たらそのまま使える。\n';

fs.writeFileSync(NOTES_PATH, md);
console.log(`\n→ ${NOTES_PATH}`);
