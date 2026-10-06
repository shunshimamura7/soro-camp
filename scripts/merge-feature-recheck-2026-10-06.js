/**
 * サブエージェントが返した設備の再調査結果を台帳に貯める（2026-10-06）。
 *
 *   node scripts/merge-feature-recheck-2026-10-06.js <束のJSONファイル> [...]
 *
 * ## なぜ貯めるのか
 *
 * 187件を10件ずつ18束に分けて並列で調べている。**途中で落ちても続きから再開できる**よう、
 * 束が返るたびに `scripts/feature-recheck-2026-10-06.json` へ追記していく。
 * 同じ slug が再送されたら**後から来たほうで上書き**する（調べ直しのやり直しを許す）。
 *
 * ## ここで捨てる（本体側の照合）
 *
 * サブエージェントの出力をそのまま信じない。次のものは**その場で捨てて理由を記録**する。
 *
 *   1. **引用（quote）の無い true / false** … 根拠が検算できない。`"記載なし"` に落とす
 *   2. **引用が短すぎる**（4文字未満）… 「あり」だけのような、文脈の無い断片
 *   3. **evidenceUrl が無い true / false** … どのページを見たのか追えない
 *   4. **pageMismatch が立っている束** … 別施設のページを読んでいる。全項目を捨てる
 *   5. **担当外の slug** … `data/campgrounds.json` に無い、または active なキャンプ場でない
 *   6. **evidenceUrl のホストが、そのレコードの officialUrl / reservationUrl と違う**
 *      … 別サイトから判定している。`allowExternalHost` を付けない限り捨てる
 *      （自治体公式など、レコードの URL と同じホストでない正当な例外はログに出して人が見る）
 *
 * 捨てた分は `rejected` に理由つきで残す。**黙って捨てない。**
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'campgrounds.json');
const LEDGER = path.join(__dirname, 'feature-recheck-2026-10-06.json');

const FIELDS = ['bath', 'shower', 'firewood', 'shop', 'pet', 'nearbyOnsen'];
const MIN_QUOTE = 4;

const camps = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const bySlug = new Map(camps.map((c) => [c.slug, c]));

const host = (u) => {
  try { return new URL(String(u)).host.replace(/^www\./, ''); } catch { return null; }
};

/** そのレコードが「自分のサイト」と認めるホスト */
const ownHosts = (c) =>
  [c.officialUrl, c.reservationUrl, ...(c.source || [])]
    .map(host)
    .filter(Boolean);

let ledger = { generatedAt: '2026-10-06', accepted: {}, rejected: [], unmeasured: [] };
if (fs.existsSync(LEDGER)) {
  try { ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')); } catch { /* 壊れていたら作り直す */ }
}
ledger.accepted ||= {};
ledger.rejected ||= [];
ledger.unmeasured ||= [];

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('使い方: node scripts/merge-feature-recheck-2026-10-06.js <束のJSON> [...]');
  process.exit(1);
}

const reject = (slug, field, why, extra) =>
  ledger.rejected.push({ slug, field, why, ...(extra || {}) });

let seen = 0;
for (const file of files) {
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const row of rows) {
    seen++;
    const slug = row.slug;
    const c = bySlug.get(slug);

    if (!c) { reject(slug, '*', 'campgrounds.json に無い slug'); continue; }
    if (c.status !== 'active' || c.type === 'wild') {
      reject(slug, '*', `対象外（status=${c.status} type=${c.type ?? 'campground'}）`); continue;
    }
    if (row.pageMismatch) {
      reject(slug, '*', '別施設のページを読んでいる（pageMismatch）', { seenName: row.seenName ?? null });
      ledger.unmeasured.push({ slug, reason: 'pageMismatch: ' + (row.seenName ?? '施設名不一致') });
      continue;
    }
    if (row.fetchError) {
      ledger.unmeasured.push({ slug, reason: 'fetchError: ' + row.fetchError });
      continue;
    }
    if (row.suspiciousContent) {
      // ページ内にエージェント宛ての指示があった。**従っていないことを記録に残す**
      ledger.rejected.push({ slug, field: '*', why: 'ページ内にエージェント宛ての指示あり（従わず記録のみ）', note: String(row.suspiciousContent).slice(0, 200) });
    }

    const allowed = ownHosts(c);
    const kept = {};
    for (const f of FIELDS) {
      const v = row[f];
      if (!v || v.value === undefined || v.value === null || v.value === '記載なし') continue;

      // nearbyOnsen は値そのものが公式の記述の写し。引用が別立てで無いことがあるので、
      // **値を引用の代わりに使う**（他の5項目は boolean なので、必ず別の引用が要る）
      const q = String(v.quote || (f === 'nearbyOnsen' ? v.value : '') || '').trim();
      let eu = String(v.evidenceUrl || '').trim();

      // nearbyOnsen だけは、根拠URLが抜けていても**そのレコード自身のホストで実際に開いたページ**が
      // あればそれを根拠として採る（値＝公式の記述の写しなので、残すほうが利用者の役に立つ）。
      // 推定したことは台帳に evidenceUrlInferred で必ず残す。**黙って埋めない。**
      let inferred = false;
      if (!eu && f === 'nearbyOnsen') {
        const own = (row.checkedUrls || []).find((u) => allowed.includes(host(u)));
        if (own) { eu = own; inferred = true; }
      }

      if (!eu) { reject(slug, f, 'evidenceUrl が無い'); continue; }
      if (!q) { reject(slug, f, '引用が無い'); continue; }
      if (q.length < MIN_QUOTE) { reject(slug, f, `引用が短すぎる（${q.length}字）`, { quote: q }); continue; }

      const eh = host(eu);
      if (eh && allowed.length && !allowed.includes(eh) && !v.allowExternalHost) {
        reject(slug, f, `evidenceUrl のホストがレコードのURLと違う（${eh} / 許可 ${allowed.join(',')}）`, { evidenceUrl: eu });
        continue;
      }

      kept[f] = { value: v.value, evidenceUrl: eu, quote: q, ...(inferred ? { evidenceUrlInferred: true } : {}) };
    }

    ledger.accepted[slug] = {
      name: c.name,
      checkedUrls: row.checkedUrls || [],
      ...kept,
    };
  }
}

fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2).replace(/\n/g, '\r\n') + '\r\n');

const n = Object.keys(ledger.accepted).length;
const counts = Object.fromEntries(
  FIELDS.map((f) => [f, Object.values(ledger.accepted).filter((a) => a[f]).length])
);
console.log(`受け取り ${seen} 件 → 台帳の施設 ${n} 件`);
console.log('採用できた判定の数:', JSON.stringify(counts));
console.log(`捨てた判定: ${ledger.rejected.length} 件 / 取得できず: ${ledger.unmeasured.length} 件`);
for (const r of ledger.rejected.slice(-8)) console.log(`  ✗ ${r.slug}.${r.field} — ${r.why}`);
