/**
 * `mobility-park-izu` の座標を地図から下ろす（2026-08-18）。
 *
 * ## ★ この変更の理由（1行）
 *
 * **誤りと確定した座標は、正しい値が無くても残さない。**
 * **正しい値が無いことより、間違った値が出ていることのほうが害が大きい。**
 *
 * 現在値 35.0641 / 138.9267 は逆ジオが**静岡県函南町/日守**を返し、
 * address「静岡県伊豆の国市長者原1445-481」と **10.6km** ずれている（`coord-report.json`）。
 * **誤りであることは確定していて、正しい値だけが未確定。**
 * それでも `status: active` なので**一覧地図にピンが立ち、周辺施設リンクも誤った土地を指していた。**
 *
 * ## なぜ lat/lng を null / 0 にしないか
 *
 * - **null は型が許さない。**`lib/types.ts` は `lat: number` / `lng: number`。
 *   `validate-data.js` も「lat/lng が数値でない」をエラーにする
 * - **0,0 にもしない。**`lib/types.ts` の `needsCoord` が明記しているとおり、
 *   0 で潰すと「**未取得**」と「**誤りと判明**」が区別できなくなる。
 *   実際いま `needsCoord: true` の5件は全部 0,0 の「未取得」で、意味が混ざる
 *
 * **したがってデータは誤った値を保持したまま、表示側で出さない。**
 * 判定は `lib/camp.ts` の `hasUsableCoord()` に一本化し、
 * ピン・周辺施設リンク・JSON-LD の `geo` の4箇所すべてがそこを通るようにした。
 *
 * ## 安全装置
 *
 *   node scripts/apply-mobility-park-needscoord-2026-08-18.js                  # dry run
 *   node scripts/apply-mobility-park-needscoord-2026-08-18.js --write --force
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');

const TARGET = 'mobility-park-izu';
/** 照合ガード。**現在値がこの通りでなければ1件も書かずに中止する** */
const EXPECT = { lat: 35.0641, lng: 138.9267, needsCoord: undefined, status: 'active' };

const orig = fs.readFileSync(DATA, 'utf8');
const h = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
console.log(`原本 sha256=${h(orig)} bytes=${orig.length}\n`);

const data = JSON.parse(orig);
if (JSON.stringify(data, null, 2) + '\n' !== orig) {
  console.error('❌ 無変更の往復で差が出た。整形が保てないので中止する');
  process.exit(1);
}
console.log('整形ガード: ✅ 無変更なら完全一致');

const r = data.find((x) => x.id === TARGET);
if (!r) { console.error(`❌ ${TARGET} が見つからない`); process.exit(1); }

let bad = 0;
for (const [k, v] of Object.entries(EXPECT)) {
  if (r[k] !== v) { console.error(`❌ ${TARGET}.${k} 現在値が想定と違う（想定 ${JSON.stringify(v)} / 実際 ${JSON.stringify(r[k])}）`); bad++; }
}
if (bad) { console.error(`\n照合ガード: ❌ ${bad}件が不一致。**書かずに中止する**`); process.exit(1); }
console.log('照合ガード: ✅ 現在値が想定どおり\n');

console.log(`■ ${TARGET}`);
console.log('   - needsCoord: (未設定)');
console.log('   + needsCoord: true');
console.log(`   = lat/lng: ${r.lat}, ${r.lng} … **変えない**（誤りと分かっている値を保持する。0 にすると「未取得」と混ざる）`);
console.log(`   = status  : ${r.status} … 変えない（実在は確認済み。誤っているのは座標だけ）`);
console.log('   → 表示側は lib/camp.ts の hasUsableCoord() が false を返すので、');
console.log('     ピン・周辺施設リンク・JSON-LD の geo が出なくなる');
r.needsCoord = true;

const out = JSON.stringify(data, null, 2) + '\n';
console.log(`\n書き込み後 sha256=${h(out)} bytes=${out.length}`);

if (!WRITE) { console.log('\n（dry run。**書いていない**。当てるなら --write --force）'); process.exit(0); }
fs.writeFileSync(DATA, out, 'utf8');
console.log('\n✅ 書き込んだ');
