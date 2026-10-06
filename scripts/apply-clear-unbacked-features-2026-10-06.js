/**
 * 根拠の無い `false` を未指定に戻す（2026-10-06・こだわり検索の実態合わせ 第1段）。
 *
 * ## 何が起きていたか
 *
 * しゅんの指摘「お風呂付きのキャンプ場はもっとある」を数えたところ、
 * **キャンプ場 187件のうち `bath: true` は37件しかなく、`bath: false` が109件**あった。
 * そのうち **107件は `bathNote` が空**、つまり**「風呂なし」と書いてあるだけで根拠が無い。**
 *
 * | 条件 | true | false(note有) | **false(note無)** | 未指定 |
 * |---|---:|---:|---:|---:|
 * | bath     |  37 |  2 | **107** | 41 |
 * | shower   | 119 |  1 |  **33** | 34 |
 * | firewood | 109 |  0 |  **38** | 40 |
 * | shop     |  92 |  0 |  **52** | 43 |
 * | pet      |  79 | 14 |  **57** | 37 |
 *
 * `lib/types.ts` の `features` は冒頭でこう決めている。
 *
 * > boolean の未指定は「未確認」。false は、公式情報で「なし・不可・禁止」と
 * > 確認できた場合だけ使う。
 *
 * **note の無い false は、この取り決めに反して置かれた値。**
 * 画面には「風呂 なし」「薪 なし」と断定が出るのに、誰も確認していない。
 * `features.soloPlan` で同じことが起きて 2026-08-30 に `soloPlanLabel()` を入れた
 * （根拠の無い false を「確認できず」と表示する）のと、まったく同じ構図。
 *
 * ## この段でやること
 *
 * **note の無い `false` を `undefined`（未指定）に戻すだけ。**調べ直しは次の段。
 *
 *   - `true` は触らない（「あり」と言えている根拠は壊さない）
 *   - **note のある `false` は残す**（公式で「なし」を確認した記録なので正しい値）
 *   - フィルタは `=== true` 判定なので、**絞り込み結果は1件も変わらない。**
 *     変わるのは詳細ページと一覧の表示で、**嘘の「なし」が「確認できず」になる**
 *
 * ## `shop` には note のフィールドが無かった
 *
 * `bathNote` / `showerNote` / `firewoodNote` / `petNote` はあるのに `shopNote` が無く、
 * **`shop: false` は根拠を書く場所そのものが無かった。**`lib/types.ts` に `shopNote` を足す
 * （このスクリプトは型には触らない。型の追加は別コミットで行う）。
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード**
 * - **true を書き換えないガード。**処理対象は `false` かつ note が空のものだけ
 * - **件数ガード。**書き換え後に `true` の件数が1件でも変わっていたら中止
 * - **整形ガード**
 *
 *   node scripts/apply-clear-unbacked-features-2026-10-06.js                  # dry run
 *   node scripts/apply-clear-unbacked-features-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');

/** [フラグ, 根拠を書くフィールド]。`shop` は note が無いので null */
const TARGETS = [
  ['bath', 'bathNote'],
  ['shower', 'showerNote'],
  ['firewood', 'firewoodNote'],
  ['shop', null],
  ['pet', 'petNote'],
];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);

if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない');
  process.exit(1);
}

const hasNote = (f, nk) => nk != null && String(f[nk] || '').trim() !== '';
const countTrue = (l, k) => l.filter((c) => (c.features || {})[k] === true).length;

// 書き換え前の true 件数を控える（あとで1件も動いていないことを確かめる）
const before = Object.fromEntries(TARGETS.map(([k]) => [k, countTrue(list, k)]));

const changes = [];
for (const c of list) {
  const f = c.features;
  if (!f) continue;
  for (const [k, nk] of TARGETS) {
    if (f[k] !== false) continue;        // true と未指定は触らない
    if (hasNote(f, nk)) continue;        // 根拠つきの false は正しい値なので残す
    changes.push({ slug: c.slug, name: c.name, status: c.status, key: k });
    if (WRITE) delete f[k];              // undefined = 未確認 に戻す
  }
}

// ── 件数ガード ──────────────────────────────────────────────────────────────
if (WRITE) {
  const after = Object.fromEntries(TARGETS.map(([k]) => [k, countTrue(list, k)]));
  const moved = TARGETS.filter(([k]) => before[k] !== after[k]);
  if (moved.length) {
    console.error('中止: true の件数が変わった（このスクリプトは false だけを触る）');
    for (const [k] of moved) console.error(`  ${k}: ${before[k]} → ${after[k]}`);
    process.exit(1);
  }
}

// ── 出力 ────────────────────────────────────────────────────────────────────
const byKey = {};
for (const ch of changes) (byKey[ch.key] ||= []).push(ch);

console.log(`${WRITE ? '書込' : 'dry '} 根拠の無い false を未指定に戻す\n`);
for (const [k] of TARGETS) {
  const rows = byKey[k] || [];
  const act = rows.filter((r) => r.status === 'active').length;
  console.log(`  ${k.padEnd(9)} ${String(rows.length).padStart(3)}件（うち active ${act}件） true は ${before[k]}件のまま`);
}
console.log(`\n  合計 ${changes.length} 箇所`);
console.log('  ※フィルタは === true 判定なので、**絞り込み結果は変わらない**。');
console.log('    変わるのは「なし」と断定していた表示が「確認できず」になる点だけ。');

if (WRITE) {
  fs.writeFileSync(DATA, serialize(list));
  console.log(`\n書き込んだ: ${changes.length} 箇所`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
