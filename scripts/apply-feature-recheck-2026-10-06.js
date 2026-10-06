/**
 * 設備の再調査結果を campgrounds.json に反映する（2026-10-06）。
 *
 * 入力は `scripts/feature-recheck-2026-10-06.json`（`merge-feature-recheck-2026-10-06.js` が作る台帳）。
 * **台帳に残っているのは、引用つき・ホスト照合済みの判定だけ。**ここではもう一度ガードをかけて書く。
 *
 * ## 書くもの
 *
 *   bath / shower / firewood / shop / pet … true または false。**根拠は必ず ...Note に残す**
 *   nearbyOnsen                            … 公式が案内する近隣温泉の文字列
 *
 * `...Note` には「引用 + 出典URL」を入れる。**あとから誰でも検算できる形にする。**
 * `shopNote` は 2026-10-06 に新設したフィールド（それまで shop だけ根拠を書く場所が無かった）。
 *
 * ## 上書きの方針
 *
 *   - **note つきの既存 false は上書きしない。**公式で「なし」を確認した記録なので、
 *     新しい調査が true と言ってきたら**食い違いとして報告だけ**して、データは触らない
 *     （どちらが正しいかは人が見る。黙って上書きすると、確認済みの記録が消える）
 *   - 既存 true を false に落とすのも同じ理由で**報告のみ**
 *   - それ以外（未指定）は書く
 *
 * ## 安全装置
 *
 * - `--write --force` の二重ガード
 * - **slug 照合ガード。**台帳の施設名と `campgrounds.json` の `name` が一致しなければ中止
 * - **引用ガード。**書き込む直前にもう一度、引用が空でないことを確かめる
 * - 整形ガード（改行は原本に合わせる）
 *
 *   node scripts/apply-feature-recheck-2026-10-06.js                  # dry run
 *   node scripts/apply-feature-recheck-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const LEDGER = path.join(__dirname, 'feature-recheck-2026-10-06.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');
/** `--resolve slug.key,slug.key` で名指しされた「既存の確認済みを上書きしてよい」組み合わせ */
const RESOLVE = new Set(
  (process.argv[process.argv.indexOf('--resolve') + 1] || '')
    .split(',').map((x) => x.trim()).filter((x) => process.argv.includes('--resolve') && x)
);

/** [フラグ, 根拠を書くフィールド] */
const BOOL_FIELDS = [
  ['bath', 'bathNote'],
  ['shower', 'showerNote'],
  ['firewood', 'firewoodNote'],
  ['shop', 'shopNote'],
  ['pet', 'petNote'],
];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);
if (serialize(list) !== raw) { console.error('中止: 整形が想定と違う'); process.exit(1); }

if (!fs.existsSync(LEDGER)) {
  console.error(`中止: 台帳が無い（${LEDGER}）。先に merge-feature-recheck を走らせること`);
  process.exit(1);
}
const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const bySlug = new Map(list.map((c) => [c.slug, c]));

// ── 照合ガード ──────────────────────────────────────────────────────────────
const errors = [];
for (const [slug, a] of Object.entries(ledger.accepted || {})) {
  const c = bySlug.get(slug);
  if (!c) { errors.push(`${slug}: campgrounds.json に無い`); continue; }
  if (a.name && c.name !== a.name) {
    errors.push(`${slug}: 施設名が違う（データ「${c.name}」/ 台帳「${a.name}」）`);
  }
  if (c.status !== 'active' || c.type === 'wild') {
    errors.push(`${slug}: 対象外（status=${c.status} type=${c.type ?? 'campground'}）`);
  }
}
if (errors.length) {
  console.error(`中止: 照合ガードに ${errors.length} 件ひっかかった\n  ` + errors.join('\n  '));
  process.exit(1);
}

const changes = [];
const conflicts = [];
const before = {};
for (const [k] of BOOL_FIELDS) {
  before[k] = list.filter((c) => c.status === 'active' && c.type !== 'wild' && (c.features || {})[k] === true).length;
}
before.nearbyOnsen = list.filter((c) => String((c.features || {}).nearbyOnsen || '').trim()).length;

for (const [slug, a] of Object.entries(ledger.accepted || {})) {
  const c = bySlug.get(slug);
  const f = (c.features ||= {});

  for (const [key, noteKey] of BOOL_FIELDS) {
    const got = a[key];
    if (!got) continue;
    const val = got.value;
    if (val !== true && val !== false) continue;

    const quote = String(got.quote || '').trim();
    if (!quote) continue;                       // 引用ガード（台帳で弾いているが念のため）

    const cur = f[key];
    const curNote = String(f[noteKey] || '').trim();

    // 確認済みの記録（note つきの明示値）は黙って潰さない。
    // 上書きしたい場合だけ `--resolve slug.key` で**1件ずつ名指しする**（まとめて潰すフラグは作らない）。
    if (cur !== undefined && curNote && cur !== val && !RESOLVE.has(`${slug}.${key}`)) {
      conflicts.push({ slug, name: c.name, key, 既存: cur, 既存の根拠: curNote.slice(0, 60), 新: val, 新の根拠: quote.slice(0, 60), url: got.evidenceUrl });
      continue;
    }
    if (cur === val && curNote) continue;        // 同じ値で根拠もある。触らない

    const note = `${quote}（${got.evidenceUrl}）`;
    changes.push({ slug, name: c.name, key, from: cur === undefined ? '未指定' : String(cur), to: String(val), quote, url: got.evidenceUrl });
    if (WRITE) { f[key] = val; f[noteKey] = note; }
  }

  // nearbyOnsen（文字列）
  const on = a.nearbyOnsen;
  if (on && typeof on.value === 'string' && on.value.trim()) {
    const cur = String(f.nearbyOnsen || '').trim();
    if (!cur) {
      const text = `${on.value.trim()}（${on.evidenceUrl}）`;
      changes.push({ slug, name: c.name, key: 'nearbyOnsen', from: '未指定', to: on.value.trim(), quote: String(on.quote || ''), url: on.evidenceUrl });
      if (WRITE) f.nearbyOnsen = text;
    }
  }
}

// ── 出力 ────────────────────────────────────────────────────────────────────
/** dry run では list を書き換えていないので「後」は before と同じ値になる（それが正しい） */
const actives = () => list.filter((c) => c.status === 'active' && c.type !== 'wild');
const countTrue = (k) => actives().filter((c) => (c.features || {})[k] === true).length;
const countOnsen = () => actives().filter((c) => String((c.features || {}).nearbyOnsen || '').trim()).length;

console.log(`${WRITE ? '書込' : 'dry '} 設備の再調査を反映\n`);
const byKey = {};
for (const ch of changes) (byKey[ch.key] ||= []).push(ch);
for (const key of [...BOOL_FIELDS.map(([k]) => k), 'nearbyOnsen']) {
  const rows = byKey[key] || [];
  const t = rows.filter((r) => r.to === 'true').length;
  const fa = rows.filter((r) => r.to === 'false').length;
  // 「後」は数え直す。before + →true だと true→false になった分が引かれず多く出る
  const after = key === 'nearbyOnsen'
    ? countOnsen()
    : countTrue(key);
  console.log(`  ${key.padEnd(12)} 変更 ${String(rows.length).padStart(3)}件（→true ${t} / →false ${fa}）  true: ${before[key]} → ${after}`);
}
console.log(`\n  合計 ${changes.length} 箇所`);

if (conflicts.length) {
  console.log(`\n⚠ 既存の「確認済み」と食い違うので触らなかったもの: ${conflicts.length}件`);
  for (const c of conflicts) {
    console.log(`  ${c.slug}.${c.key}  既存=${c.既存}「${c.既存の根拠}」 / 新=${c.新}「${c.新の根拠}」`);
  }
}

if (process.argv.includes('--list')) {
  console.log('\n── 変更一覧 ──');
  for (const ch of changes) {
    console.log(`  ${ch.slug.padEnd(28)} ${ch.key.padEnd(12)} ${ch.from} → ${ch.to}`);
    console.log(`      「${ch.quote}」 ${ch.url}`);
  }
}

if (WRITE) {
  fs.writeFileSync(DATA, serialize(list));
  console.log(`\n書き込んだ: ${changes.length} 箇所`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
