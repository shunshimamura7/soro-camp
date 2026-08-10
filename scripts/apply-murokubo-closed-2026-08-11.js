/**
 * `murokubo-greenpark`（室久保グリーンパーク／THE Do-c Camp）を closed にする（2026-08-11）。
 *
 *   node scripts/apply-murokubo-closed-2026-08-11.js
 *
 * ## 経緯 — 追加した翌日に閉業が判明した
 *
 * 2026-08-10 の道志村22件の検証で、**3条件を全部満たした候補**として追加した。
 *
 *   キャンプ場か       … 村公式の「サイト／バンガロー」欄が「サイト 26」
 *   ソロで泊まれるか   … サイト料金が「定員1〜5名程度」で下限が1名
 *   今も営業しているか … 施設公式に2026年の表記があり、予約サイトから事前決済が可能
 *
 * **その翌日、座標の目視取得作業中に閉業が判明した。**
 *
 * ## 根拠が目視だけであること
 *
 * **Web 上の一次情報には閉業の告知が無い。**2026-08-11 に実測した結果:
 *
 *   施設公式 https://the-do-c.com                                → 200・閉業語なし・2026年の表記あり
 *   施設公式 https://the-do-c.com/space-price/                   → 200・料金表と事前決済が生きている
 *   村公式   https://www.doshi-kanko.jp/camp/murokubo-greenpark/ → 200・閉業語なし
 *
 * つまり **`check-official-urls.js` を回しても OK 判定になる**（§6-13 の
 * `takaranoyama-fureai` と同じ型）。閉業を検出できたのは目視だけだった。
 *
 * **`closedNote` に入れた URL は「閉業の出典」ではなく「閉業の告知が無いことの記録」。**
 * 直接の出典（Googleマップの閉業表示など）が手に入ったら差し替えること。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const c = camps.find(x => x.slug === 'murokubo-greenpark');
if (!c) {
  console.error('murokubo-greenpark が見つかりません');
  process.exit(1);
}

const before = { status: c.status, needsCoord: !!c.needsCoord, lastVerified: c.lastVerified };

c.status = 'closed';
c.closedReason = 'closed_business';
c.closedNote =
  '**Googleマップで閉業表示を確認（2026-08-11・しゅんの目視、座標の取得作業中）。** ' +
  'Web上の一次情報には閉業の告知が無く、施設公式 https://the-do-c.com は2026年の表記と' +
  '料金表・予約サイトの事前決済が生きたまま、村公式 ' +
  'https://www.doshi-kanko.jp/camp/murokubo-greenpark/ にも記載が無かった（同日実測）。' +
  '**以下のURLは閉業の出典ではなく、告知が無かったことの記録。**' +
  '直接の出典が手に入ったら差し替えること。' +
  'なお 2026-08-10 に「村公式の一覧＋施設公式の2026年表記＋予約サイトの事前決済」の3つが' +
  '揃った候補として追加した翌日の判明で、この3点が揃っても営業の証明にならない実例（§6-22）。';

// 閉鎖施設に needsCoord を付けると「今後座標を取得すべき対象」という
// 誤ったシグナルになる（validate-data.js のコメント参照）
delete c.needsCoord;
c.lastVerified = '2026-08-11';

// **閉鎖施設の features に「利用できる」を示す true を残さない。**
// validate-data.js がエラーにする。行けない施設について
// 「ペット可」「車の乗り入れ可」と書いてあるのは誤った案内になる
const disabled = [];
for (const k of ['pet', 'carIn', 'bonfire', 'shower', 'bath', 'soloPlan', 'convenience', 'shop', 'wifi', 'firewood', 'ice', 'alcohol']) {
  if (c.features[k] === true) { c.features[k] = false; disabled.push(k); }
}
if (disabled.length) console.log(`    features の true を落とした: ${disabled.join(', ')}`);

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

const n = k => camps.filter(k).length;
console.log('── 変更 ──────────────────────────────');
console.log(`  murokubo-greenpark（${c.name}）`);
console.log(`    status       ${before.status} → ${c.status}`);
console.log(`    closedReason （なし） → ${c.closedReason}`);
console.log(`    needsCoord   ${before.needsCoord} → false（閉鎖施設に付けない）`);
console.log(`    lastVerified ${before.lastVerified} → ${c.lastVerified}`);
console.log('\n── 反映後の件数 ──────────────────────');
console.log(`  total ${camps.length} / active ${n(x => x.status === 'active')} / unverified ${n(x => x.status === 'unverified')} / suspended ${n(x => x.status === 'suspended')} / closed ${n(x => x.status === 'closed')}`);
console.log(`  needsCoord ${n(x => x.needsCoord)}件`);
