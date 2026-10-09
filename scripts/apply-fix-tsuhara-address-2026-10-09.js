/**
 * 西湖津原キャンプ場の住所を公式表記に直す（2026-10-09）。
 *
 *   node scripts/apply-fix-tsuhara-address-2026-10-09.js                  # dry run
 *   node scripts/apply-fix-tsuhara-address-2026-10-09.js --write --force  # 実際に書く
 *
 * ## なぜ直すのか
 *
 * 山梨の候補を門にかけている途中で、なっぷ側の「西湖 津原キャンプ場」が既存の
 * `saiko-tsuhara-camp` と同一施設だと分かった。重複追加は正規化比較のガードで止まったが、
 * **既存レコードの住所「西湖351」が公式と食い違っている**ことが分かった。
 *
 *   公式（https://tsuhara-camp.jp/access）… 「山梨県南都留郡富士河口湖町西湖2299」
 *   既存レコード                        … 「山梨県南都留郡富士河口湖町西湖351」
 *
 * 公式を自分で取得して 2299 を確認した（Shift_JIS のため cp932 でデコード）。
 *
 * ## 座標は動かさない
 *
 * 既存の座標 (35.498973, 138.698817) は
 *
 *   西湖2299 の住所座標から **0.57km**
 *   西湖351  の住所座標から **0.84km**
 *
 * で、正しい住所のほうに近い。実ピンとして妥当な範囲なので `coordsVerified` も触らない。
 *
 * ## ガード
 *
 *   1. `--write` と `--force` の両方が必要
 *   2. slug と施設名の両方が一致しないと書かない
 *   3. 現在の住所が「西湖351」でなければ（既に誰かが直していたら）止まる
 *   4. 無変更の往復が原本と一致しない（改行コードを含む整形のずれ）
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');

const SLUG = 'saiko-tsuhara-camp';
const NAME = '西湖津原キャンプ場';
const FROM = '山梨県南都留郡富士河口湖町西湖351';
const TO = '山梨県南都留郡富士河口湖町西湖2299';

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);
if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない（整形が想定と違う）');
  process.exit(1);
}

const rec = list.find((c) => c.slug === SLUG);
if (!rec) { console.error(`中止: slug ${SLUG} が見つからない`); process.exit(1); }
if (rec.name !== NAME) { console.error(`中止: 施設名が違う（${rec.name}）`); process.exit(1); }
if (rec.address !== FROM) {
  console.error(`中止: 現在の住所が想定と違う（${rec.address}）。既に直っているなら何もしない`);
  process.exit(1);
}

console.log(`${WRITE ? '書込' : 'dry '} ${SLUG} の住所を公式表記に直す\n`);
console.log(`  前: ${rec.address}`);
console.log(`  後: ${TO}`);
console.log(`  根拠: https://tsuhara-camp.jp/access （公式アクセスページ・Shift_JIS）`);
console.log(`  座標 (${rec.lat}, ${rec.lng}) は新住所から 0.57km で妥当なため触らない`);

if (!WRITE) {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
  process.exit(0);
}

rec.address = TO;
fs.writeFileSync(DATA, serialize(list));
console.log('\n書き込んだ: 1 箇所');
