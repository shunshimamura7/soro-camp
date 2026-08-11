/**
 * 2026-05-27 バッチのうち、**値を変えなかったが一次情報で確認した**レコードの
 * `lastVerified` を 2026-08-11 に更新する（2026-08-11）。
 *
 * 目的は**再調査の防止**。`lastVerified` は「情報を最後に確認した日」であって
 * 「値を変えた日」ではない（`lib/types.ts`）。確認したのに 2026-05-27 のまま置くと、
 * §13-4 の「投入回を軸に洗い出す」を次に回したとき**同じ調査をもう一度やることになる。**
 *
 * ## 2群あり、扱いを分けている
 *
 * **群1（2件）… 照合のみで変更なし。**`status: active` かつ `needsVerify` なし。
 * `batch-2026-05-27-check.md` §3 の2件で、一次情報と data が一致した。
 *
 * **群2（8件）… `needsVerify` 群。**`batch-2026-05-27-needsverify-check.md` で
 * 2026-08-11 に追調査し、`needsVerifyNote` に所見を出典URL付きで書き足してある。
 * **「確認した結果、確認できなかった」も確認である。**
 * 前段で `unverified` にした15件は `apply-0527-unverified-b.js` で既に 2026-08-11 に
 * 更新済みなので、**この8件だけ 05-27 で残ると同じ群の中で日付が割れる。**
 *
 * ⚠ `richland-kiyokawa`（名称割れ）と `camp-baird`（区画使用料が未確定）には残課題があるが、
 * **レコード自体は一次情報に当たっているので `lastVerified` は更新してよい。**
 * 残課題は `needsVerifyNote` ではなく `batch-2026-05-27-check.md` 側で管理する。
 *
 * 使い方: node scripts/apply-0527-lastverified.js
 */
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const D = '2026-08-11';

const stale = camps.filter((c) => c.lastVerified === '2026-05-27');

// 群1: 照合のみで変更なし
const g1 = stale.filter((c) => c.status === 'active' && !c.needsVerify);
// 群2: needsVerify 群のうち、**2026-08-11 に追調査した記録が note にあるものだけ**。
//
// ⚠ このガードが実際に1件を止めた。`ito-marine-town-camp` は今回の追調査の対象外だった
//    （8件のうち既に unverified だった3件は見送り、active 5件に絞ったため）。
//    **確認していないものを「確認済み」にしてはいけない**ので、あえて残す。
//    その結果 lastVerified=2026-05-27 は0件にならないが、**0にすることが目的ではない。**
const g2 = stale.filter((c) => c.needsVerify === true && /2026-08-11/.test(c.needsVerifyNote || ''));
const skipped = stale.filter((c) => !g1.includes(c) && !g2.includes(c));

for (const c of [...g1, ...g2]) c.lastVerified = D;

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
console.log(`apply-0527-lastverified: ${g1.length + g2.length}件の lastVerified を ${D} にした`);
console.log(`  群1 照合のみで変更なし（${g1.length}件）: ${g1.map((c) => c.id).join(', ')}`);
console.log(`  群2 needsVerify 群（${g2.length}件）    : ${g2.map((c) => c.id).join(', ')}`);
if (skipped.length) {
  console.log(`  ⚠ 見送り（今回の追調査の対象外・note に 2026-08-11 の記録が無い）: ${skipped.map((c) => c.id).join(', ')}`);
}
console.log(`  残る lastVerified=2026-05-27: ${camps.filter((c) => c.lastVerified === '2026-05-27').length}件`);
