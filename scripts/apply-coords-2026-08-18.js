/**
 * 一次情報から取り、国土地理院で検証が通った座標だけを当てる（2026-08-18）。
 *
 * 検証の全文は `scripts/.verify-coord-candidates.js` の実行結果と
 * `scripts/coord-candidates-2026-08-18.md`。
 *
 * ## 推定はしていない
 *
 * 座標は**神奈川県観光協会「観光かながわNOW」のスポット markerData** から取った値そのまま。
 * **地図の表示中心（`@` / 埋め込みの `!2d!3d`）は使っていない**（§7-A。ピンとは約200m違う）。
 * 逆ジオが県・市区町村・**大字**まで address と一致したものだけを当てる。
 *
 * ## ★ `coordsVerified` は立てない
 *
 * `coordsVerified` は「**人が地図上で目視確認した**」（`lib/types.ts`）。
 * ここでやったのは**機械検証**なので、意味が違う（§2-5）。
 * `coordsGsiChecked` も**このスクリプトでは立てない** —— 既存の手順どおり
 * **`verify-coords-gsi.js` → `apply-gsi-flags.js`** で機械的に付ける。
 * **手で立てると「検証済みフラグを人が書いた」ことになり、§17-3 / §18-11 の轍を踏む。**
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード。**既定は dry run
 * - **照合ガード。**現在値が `from` と完全一致しなければ**1件も書かずに中止**
 * - **整形ガード。**無変更の往復が原本と一致しなければ中止
 * - 書くのは `lat` / `lng` だけ。`status`・`address`・`coordsVerified` は触らない
 *
 *   node scripts/apply-coords-2026-08-18.js                  # dry run
 *   node scripts/apply-coords-2026-08-18.js --write --force  # 実際に書く
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');

/** 当てない。理由つきで残す */
const PENDING = [
  ['mobility-park-izu',
   '候補は取れて、逆ジオも 静岡県/伊豆の国市/長者原 まで address と一致した。' +
   '**だが候補が施設公式の地図埋め込みの「表示中心」で、ピンではない**（§7-A）。' +
   '**表示中心はピンと約200mずれる。**マーカー座標を出している一次情報が他に無いので、実ピンはしゅんが取る'],
  ['kabutomushi-mori-camp',
   '**座標を出している一次情報が存在しない。**相模原市観光協会の24施設一覧に無く、なっぷ・じゃらんにも該当なし'],
  ['makioka-fruits-camp',
   '同上。県内に同名施設が無く、完全一致で返るのは千葉県君津市の別施設'],
];

const EDITS = [
  {
    id: 'hadano-togawa-camp',
    why: '逆ジオ 神奈川県/秦野市/堀山下 が address「神奈川県秦野市堀山下1513」と大字まで一致',
    src: 'https://www.kanagawa-kankou.or.jp/spot/1270 の markerData（神奈川県観光協会・2026-08-18 取得）',
    set: {
      lat: { from: 35.4028, to: 35.404724 },
      lng: { from: 139.1465, to: 139.169517 },
    },
  },
  {
    id: 'wadanagahama-kaigan',
    why: '逆ジオ 神奈川県/三浦市/初声町和田 が address「神奈川県三浦市初声町和田」と大字まで一致（従来は横須賀側を指していた）',
    src: 'https://www.kanagawa-kankou.or.jp/spot/7159 の markerData（神奈川県観光協会・2026-08-18 取得）',
    set: {
      lat: { from: 35.1906528, to: 35.1897461 },
      lng: { from: 139.6148426, to: 139.6166147 },
    },
  },
];

const orig = fs.readFileSync(DATA, 'utf8');
const h = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
console.log(`原本 sha256=${h(orig)} bytes=${orig.length}\n`);

const data = JSON.parse(orig);
if (JSON.stringify(data, null, 2) + '\n' !== orig) {
  console.error('❌ 無変更の往復で差が出た。整形が保てないので中止する');
  process.exit(1);
}
console.log('整形ガード: ✅ 無変更なら完全一致');

let bad = 0;
for (const e of EDITS) {
  const r = data.find((x) => x.id === e.id);
  if (!r) { console.error(`❌ ${e.id} が見つからない`); bad++; continue; }
  for (const [k, v] of Object.entries(e.set)) {
    if (r[k] !== v.from) {
      console.error(`❌ ${e.id}.${k} の現在値が想定と違う（想定 ${v.from} / 実際 ${r[k]}）`);
      bad++;
    }
  }
}
if (bad) {
  console.error(`\n照合ガード: ❌ ${bad}件が不一致。**1件も書かずに中止する**`);
  process.exit(1);
}
console.log('照合ガード: ✅ 全フィールドが想定の現在値と一致\n');

let changed = 0;
for (const e of EDITS) {
  const r = data.find((x) => x.id === e.id);
  console.log(`■ ${e.id} — ${e.why}`);
  console.log(`   出典: ${e.src}`);
  for (const [k, v] of Object.entries(e.set)) {
    console.log(`   - ${k}: ${v.from}`);
    console.log(`   + ${k}: ${v.to}`);
    r[k] = v.to;
    changed++;
  }
  console.log(`   coordsVerified: ${r.coordsVerified === true ? 'true のまま（触らない。人の目視の記録なので機械で足さない）' : '未設定のまま'}`);
  console.log('');
}

console.log(`変更フィールド ${changed}件（レコード ${EDITS.length}件）\n`);
console.log('— 当てないもの —');
for (const [id, why] of PENDING) console.log(`   ${id}\n      ${why}`);

const out = JSON.stringify(data, null, 2) + '\n';
console.log(`\n書き込み後 sha256=${h(out)} bytes=${out.length}`);

if (!WRITE) {
  console.log('\n（dry run。**書いていない**。当てるなら --write --force）');
  process.exit(0);
}
fs.writeFileSync(DATA, out, 'utf8');
console.log('\n✅ 書き込んだ');
console.log('  次: node scripts/verify-coords-gsi.js → node scripts/apply-gsi-flags.js（coordsGsiChecked はそこで付ける）');
