/**
 * 不良バッチ（`lastVerified: 2026-05-26`）の点検で実在が確認できなかった7件を
 * `unverified` にする（2026-08-11）。記録は scripts/batch-2026-05-26-check.md の §2。
 *
 * ## なぜ削除ではなく unverified か
 *
 * §4 の3件・§9 の GHOST 25件は**レコードごと削除**した。今回それを選ばない理由は
 * `apply-makino-unverified-2026-08.js` と同じ。
 *
 * 1. **「一覧に無い＝存在しない」は成り立たない**（§6-7）。今回の7件のうち
 *    `okooigawa-lake` は川根本町、`izukogen-auto` は伊東市で、どちらも
 *    ORPHAN を判定として読める市町村ではない（読めるのは相模原市80%・道志村75%だけ。§6-20）
 * 2. **unverified なら一覧から外れるので実害はゼロ。**`lib/camp.ts` の
 *    `activeCampgrounds` が status !== 'active' を落とし、詳細ページには
 *    「営業状況が確認できていません」の警告が出る。**実在が分かれば active に戻せる。**
 *    削除するとレコードごと消えて戻せない
 * 3. **7件とも電話番号を持っていない**（5件が `tel: null`、残る2件も施設の番号か不明）。
 *    §12 の murokubo-greenpark のとおり、Web で取れる情報の鮮度には下限があり、
 *    最終的には現地か電話でしか埋まらない。**その手段が残っていない段階で消さない**
 *
 * **unverified は最終判断ではない。実在が確認できたら active に戻す。**
 *
 * ## 触らないもの
 *
 * - `needsVerify` / `needsVerifyNote` … 今回の判断根拠が出典URL付きで入っている。維持する
 * - `soloComment` / `priceNote` / `priceVerified` … 裏の取れない分は
 *   `apply-batch-2026-05-26.js` で既に落としてある
 * - 座標 … 実在が決まる前に取ると、どこの座標か分からなくなる
 *
 * 使い方: node scripts/apply-batch-unverified-2026-08.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const TARGETS = [
  'oiso-longbeach',      // 大磯ロングビーチ＝プール施設。住所も大磯町国府本郷546 で別（型C）
  'nanasawa-camp',       // 七沢657 はどの実在施設のものでもない（捏造・§6-16 で既出）
  'yamakita-camp',       // 山北町公式の13施設に無い。湯触にあるのは河内川ふれあいビレッジ
  'okooigawa-lake',      // 川根本町観光協会のキャンプ場ガイドに無い（型B）
  'izukogen-auto',       // 伊東市池の実在は伊豆高原テントリゾート（池614-168）（型A）
  'amagi-kogen',         // 実在は伊豆天城高原オート＝東伊豆町1458-5。市町村から違う（型A）
  'kawaguchiko-hanto',   // 大石2585 は町の大石公園の住所（型B＋借用）
];

let changed = 0;
for (const id of TARGETS) {
  const c = camps.find((x) => x.id === id);
  if (!c) throw new Error(`${id} が見つからない`);
  if (c.status !== 'active') throw new Error(`${id} の status が active ではない（${c.status}）`);
  if (c.needsVerify !== true || !c.needsVerifyNote) {
    throw new Error(`${id} に needsVerify / needsVerifyNote が無い。判断根拠なしで unverified にしない`);
  }
  c.status = 'unverified';
  changed++;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');

const count = camps.reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
console.log(`apply-batch-unverified: ${changed}件を unverified にした`);
console.log('  ' + Object.entries(count).map(([k, v]) => `${k} ${v}件`).join(' / '));
