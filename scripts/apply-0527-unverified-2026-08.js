/**
 * 2026-05-27 バッチの `needsVerify` 5件（active）を `unverified` にする（2026-08-11）。
 * 記録は scripts/batch-2026-05-27-needsverify-check.md。
 *
 * 前回7件（`apply-batch-unverified-2026-08.js`）と同じ扱い。
 * **削除はしない。**実在が確認できたら `active` に戻す（§12 の可逆運用）。
 *
 * - `needsVerify` / `needsVerifyNote` は維持する（今回の所見が出典URL付きで入っている）
 * - `soloComment` / `priceNote` / `priceVerified` は**触らない。**
 *   前回7件は不良バッチの点検で裏の取れない本文を落としてあったが、
 *   この5件は本文の点検をしていない。**落とすなら別途1件ずつ読んでから**
 *
 * ## 2件だけ note に追記する
 *
 * **`yadoriki-camp`** … 松田町公式で「水源林一帯は火気使用禁止」が確認できている。
 * 他の4件は「実在が確認できない」だけだが、**これは行ってはいけない側の情報**。
 * 実在が確認できたとしても `bonfire: true` の通常のキャンプ場としては戻せない。
 * **将来ナイーブに active へ戻さないための歯止めを note に書く。**
 *
 * **`kawaguchiko-hamanoya-camp`** … 借用元の「河口湖オートキャンプ場」は実在するのに
 * 当サイトに未登録。**掲載候補として note に残す**（実際の掲載は別タスク・人の判断）。
 *
 * 使い方: node scripts/apply-0527-unverified-2026-08.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const TARGETS = [
  'mikagi-camp',               // 相模原市観光協会13件・津久井地域観光協会7件のどちらにも無し
  'yadoriki-camp',             // 寄3048 が実在施設のどれとも不一致＋松田町公式が火気使用禁止
  'mushizawa-camp',            // 山北町公式・観光協会に無し（ただし L1 網羅率7割未満で格は低い）
  'makioka-fruits-camp',       // 牧平3041 に該当なし。「フルーツ村」は千葉県君津市の別施設
  'kawaguchiko-hamanoya-camp', // 住所・電話とも実在する「河口湖オートキャンプ場」のもの
];

/** unverified にする前に note へ足しておくこと */
const NOTE_ADD = {
  'yadoriki-camp':
    ' **⚠ 2026-08-11 unverified 化にあたっての歯止め: この1件は他の4件と性質が違う。**' +
    '「実在が確認できない」だけでなく、**松田町公式で「水源林一帯での焚火やBBQなど火気の使用は禁止」が確認できている**' +
    ' https://town.matsuda.kanagawa.jp/site/kankou-sub/yadoriki-bbq.html 。' +
    '**施設の実在が後から確認できたとしても、`bonfire: true` の通常のキャンプ場としては active に戻せない。**' +
    '火気禁止は「行ってはいけない側」の情報で、`sanogawa-camp`（南部町が公園内のキャンプ・火気を不可としている）と同じ型。' +
    '戻すときは必ず火気の可否を一次情報で取り直し、禁止のままなら `closed` / `closedReason: prohibited` を検討すること。',
  'kawaguchiko-hamanoya-camp':
    ' **2026-08-11 掲載候補として記録: 借用元の「河口湖オートキャンプ場」は実在するが当サイトに未登録。**' +
    '富士河口湖町小立5404 / 0555-72-4411 / 入場料770円（小学生以上）＋オート1区画3,630円〜 / 営業3月中旬〜11月。' +
    '町観光連盟に施設ページあり https://fujisan.ne.jp/sightseeing/3951/ 。' +
    '**この記録を落とすと小立地区の掲載が空になるので、掲載の判断は本件と一緒に決めること**（§6-17 の「本物が載っていない」型）。',
};

let changed = 0;
for (const id of TARGETS) {
  const c = camps.find((x) => x.id === id);
  if (!c) throw new Error(`${id} が見つからない`);
  if (c.status !== 'active') throw new Error(`${id} の status が active ではない（${c.status}）`);
  if (c.needsVerify !== true || !c.needsVerifyNote) {
    throw new Error(`${id} に needsVerify / needsVerifyNote が無い。判断根拠なしで unverified にしない`);
  }
  const add = NOTE_ADD[id];
  if (add && !c.needsVerifyNote.includes('2026-08-11 unverified 化') && !c.needsVerifyNote.includes('2026-08-11 掲載候補')) {
    c.needsVerifyNote = c.needsVerifyNote.trimEnd() + add;
  }
  c.status = 'unverified';
  changed++;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');

const count = camps.reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
console.log(`apply-0527-unverified: ${changed}件を unverified にした`);
console.log('  ' + Object.entries(count).map(([k, v]) => `${k} ${v}件`).join(' / '));
