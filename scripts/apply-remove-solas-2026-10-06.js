/**
 * `solas-no-mori`（ソラスの森キャンプ場）を掲載から外す（2026-10-06・しゅんの判断）。
 *
 * ## なぜ status ではなくレコード削除なのか
 *
 * `status` が取れる値は `active / closed / unverified / suspended` の4つだけで、
 * **どれも「営業しているが当サイトの対象ではない」を表せない。**
 *
 *   - `closed`    … 閉鎖・利用禁止が確認できたもの。**営業中の施設に付けると事実と違う**
 *   - `unverified` … 営業状況が確認できていないもの。**公式で確認できているので違う**
 *   - `suspended`  … 再開予定のある休業。**休業していないので違う**
 *
 * 他に除外用のフィールド（`excluded` 等）も無い。
 * **嘘の status を付けるより、レコードごと落とすほうが正しい。**
 * 判定と理由は `data/chiba-nap-triage-2026-10-06.json` に「門落ち（単独利用が実質不可）」
 * として残すので、次に千葉を掃くときに同じ施設を調べ直すことにはならない。
 *
 * ## 外す理由
 *
 * 2026-10-06 に追加したが、**ソロ向けサイトの対象ではない**としゅんが判断した。
 *
 *   - **1名で予約できるのは「女性専用サイト」だけ。**フリーサイトと電源付きRVサイトは2名から
 *   - **料金が1名12,000円〜。**他の掲載施設（600〜5,500円程度）と水準が違う
 *
 * ## 門の追加（以後これで落とす）
 *
 * > **1名で予約できるのが性別・年齢などで限定されたサイトのみの施設は「単独利用不可」で門落ち。**
 *
 * 既存の「単独利用不可」（`柿山田オートキャンプガーデン`＝ファミリー専用、
 * `リスッコ・ファミリーキャンプ場`＝子連れ必須）と同じ枠に入る。
 * **「1名で予約できる区画が1つでもあれば可」ではなく、その区画に属性の限定が付いていれば不可。**
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード**
 * - **照合ガード。**slug・施設名・住所・officialUrl が想定どおりかを確認してから落とす。
 *   1つでも違えば中止（別のレコードを消さないため）
 * - **件数ガード。**削除後の件数が「元 − 1」でなければ中止
 * - **整形ガード**
 *
 *   node scripts/apply-remove-solas-2026-10-06.js                  # dry run
 *   node scripts/apply-remove-solas-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');

const TARGET = {
  slug: 'solas-no-mori',
  name: 'ソラスの森キャンプ場',
  address: '千葉県いすみ市釈迦谷1610-1',
  officialUrl: 'https://solas-glamping.jp/camp/',
};

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);

if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない');
  process.exit(1);
}

const hits = list.filter((c) => c.slug === TARGET.slug);
const errors = [];
if (hits.length !== 1) errors.push(`slug "${TARGET.slug}" が ${hits.length} 件。1件でなければ落とさない`);
if (hits.length === 1) {
  const c = hits[0];
  if (c.name !== TARGET.name) errors.push(`施設名が違う（データ「${c.name}」/ 期待「${TARGET.name}」）`);
  if (c.address !== TARGET.address) errors.push(`住所が違う（データ「${c.address}」/ 期待「${TARGET.address}」）`);
  if (c.officialUrl !== TARGET.officialUrl) errors.push(`officialUrl が違う（データ「${c.officialUrl}」）`);
}
if (errors.length) {
  console.error(`中止: 照合ガードに ${errors.length} 件ひっかかった。1バイトも書いていない\n  ` + errors.join('\n  '));
  process.exit(1);
}

const next = list.filter((c) => c.slug !== TARGET.slug);
if (next.length !== list.length - 1) {
  console.error(`中止: 削除後の件数が想定外（${list.length} → ${next.length}）`);
  process.exit(1);
}

console.log(`${WRITE ? '削除' : 'dry '} ${TARGET.slug}  ${TARGET.name} / ${TARGET.address}`);
console.log(`      理由: 1名で予約できるのが女性専用サイトのみ（フリー・RVは2名から）。料金も1名12,000円〜`);
console.log(`      件数: ${list.length} → ${next.length}`);

if (WRITE) {
  fs.writeFileSync(DATA, serialize(next));
  console.log('\n削除した: 1件');
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
