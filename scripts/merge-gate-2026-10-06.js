/**
 * 門にかけたサブエージェントの結果を台帳に反映する（2026-10-06）。
 *
 *   node scripts/merge-gate-2026-10-06.js <束のJSON> [...]           # dry run
 *   node scripts/merge-gate-2026-10-06.js --write <束のJSON> [...]   # 台帳を書く
 *
 * ## 何をするか
 *
 *   1. 千葉・山梨の仕分け台帳（data/*-nap-triage-2026-10-06.json）の該当行の
 *      `verdict` / `reason` / `officialUrl` を更新する
 *   2. `verdict: "追加"` のものだけを `scripts/gate-additions-2026-10-06.json` に積む
 *      （ここから人が soloComment と cautions を書いて apply スクリプトにする）
 *
 * ## ここで捨てる（本体側の照合）
 *
 * サブエージェントの出力をそのまま信じない。**黙って捨てずに理由を記録する。**
 *
 *   - `napId` が台帳に無い
 *   - `verdict` が決められた語彙に無い
 *   - 「追加」なのに **officialUrl も reservationUrl も無い**（門落ち3の見落とし）
 *   - 「追加」なのに **priceMin / priceMax が整数でない**
 *      … priceMax は非必須フィールドではないので、欠けていると詳細ページのビルドが落ちる
 *   - 「追加」なのに **priceNote（料金の根拠）が無い**
 *   - 「追加」なのに **公式の住所に台帳の市町村名が含まれていない**
 *      … 別の都道府県の同名施設を拾う事故が実際に起きている
 *   - `suspiciousContent` があれば**従っていないことを記録に残す**
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const LEDGERS = {
  千葉: path.join(ROOT, 'data', 'chiba-nap-triage-2026-10-06.json'),
  山梨: path.join(ROOT, 'data', 'yamanashi-nap-triage-2026-10-06.json'),
  静岡: path.join(ROOT, 'data', 'shizuoka-nap-triage-2026-10-10.json'),
  神奈川: path.join(ROOT, 'data', 'kanagawa-nap-triage-2026-10-10.json'),
};
const ADDITIONS = path.join(__dirname, 'gate-additions-2026-10-06.json');

const VERDICTS = new Set([
  '追加',
  '門落ち(単独利用不可)',
  '門落ち(宿泊不可)',
  '門落ち(公式なし)',
  '門落ち(料金も予約も公式に無し)',
  '門落ち(住所を照合できない)',
  '門落ち(既存レコードと重複)',
  '宿泊系のため対象外',
  '閉鎖疑い',
  'UNMEASURED',
]);

if (files.length === 0) {
  console.error('使い方: node scripts/merge-gate-2026-10-06.js [--write] <束のJSON> [...]');
  process.exit(1);
}

/** 施設名・住所の突合用。NFKC に寄せて ヶ/ケ を畳む（過去に3件取りこぼした） */
const norm = (s) => String(s || '').normalize('NFKC').replace(/ヶ/g, 'ケ').replace(/\s+/g, '');

const loaded = {};
const rowOf = new Map(); // napId -> {pref, row}
for (const [pref, p] of Object.entries(LEDGERS)) {
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  loaded[pref] = j;
  for (const r of j.rows || []) {
    const id = String(r.napId);
    // なっぷの施設IDは県をまたいで一意なはずだが、取り違えると県違いの行に書き込むので止める
    if (rowOf.has(id)) {
      console.error(`中止: napId ${id} が ${rowOf.get(id).pref} と ${pref} の台帳に重複している`);
      process.exit(1);
    }
    rowOf.set(id, { pref, row: r });
  }
}

let additions = [];
if (fs.existsSync(ADDITIONS)) {
  try { additions = JSON.parse(fs.readFileSync(ADDITIONS, 'utf8')); } catch { additions = []; }
}
const addById = new Map(additions.map((a) => [String(a.napId), a]));

const rejected = [];
const applied = [];
const suspicious = [];

for (const file of files) {
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const r of rows) {
    const id = String(r.napId ?? '');
    const hit = rowOf.get(id);
    if (!hit) { rejected.push({ napId: id, name: r.name, why: '台帳に無い napId' }); continue; }
    const { pref, row } = hit;

    if (!VERDICTS.has(r.verdict)) {
      rejected.push({ napId: id, name: r.name, why: `verdict が語彙に無い（${r.verdict}）` });
      continue;
    }
    if (r.suspiciousContent) {
      suspicious.push({ napId: id, name: r.name, note: String(r.suspiciousContent).slice(0, 200) });
    }

    if (r.verdict === '追加') {
      const url = r.officialUrl || r.reservationUrl;
      if (!url) { rejected.push({ napId: id, name: r.name, why: '追加なのに公式URLも予約URLも無い' }); continue; }
      if (!Number.isInteger(r.priceMin) || !Number.isInteger(r.priceMax)) {
        rejected.push({ napId: id, name: r.name, why: `追加なのに料金が整数でない（min=${r.priceMin} max=${r.priceMax}）` });
        continue;
      }
      if (!String(r.priceNote || '').trim()) {
        rejected.push({ napId: id, name: r.name, why: '追加なのに料金の根拠（priceNote）が無い' });
        continue;
      }
      // 公式の住所に台帳の市町村名が入っているか。
      // **台帳の muni が「(不明)」のようなプレースホルダのときは市町村では照合できない**ので、
      // 県名の一致だけを見る（ここで弾くと正当な追加まで落ちる。実際に落ちた）。
      const muniUsable = row.muni && !/^\(|不明|^[-－]$/.test(row.muni);
      if (muniUsable && !norm(r.address).includes(norm(row.muni))) {
        rejected.push({ napId: id, name: r.name, why: `公式住所に市町村名「${row.muni}」が無い（${r.address}）` });
        continue;
      }
      if (!muniUsable && pref && !norm(r.address).includes(norm(pref))) {
        rejected.push({ napId: id, name: r.name, why: `台帳の市町村が「${row.muni}」で照合できず、公式住所にも県名「${pref}」が無い（${r.address}）` });
        continue;
      }
      addById.set(id, { ...r, pref, muni: row.muni, napUrl: row.napUrl, napName: row.name });
    }

    applied.push({ napId: id, pref, name: row.name, from: row.verdict, to: r.verdict });
    if (WRITE) {
      row.verdict = r.verdict;
      row.reason = String(r.reason || '').trim() || row.reason || null;
      if (r.officialUrl) row.officialUrl = r.officialUrl;
    }
  }
}

// ── 集計を出す ──────────────────────────────────────────────────────────────
const byVerdict = {};
for (const a of applied) byVerdict[a.to] = (byVerdict[a.to] || 0) + 1;
console.log(`${WRITE ? '書込' : 'dry '} 門の結果を台帳へ: ${applied.length} 件`);
for (const [k, v] of Object.entries(byVerdict).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)} 件  ${k}`);
console.log(`\n追加候補の累計: ${addById.size} 件`);
for (const a of addById.values()) console.log(`  + ${a.pref} ${a.name}  ${a.priceMin}〜${a.priceMax}円  ${a.officialUrl || a.reservationUrl}`);

if (rejected.length) {
  console.log(`\n⚠ 本体側で捨てた: ${rejected.length} 件`);
  for (const x of rejected) console.log(`  ✗ ${x.napId} ${x.name} — ${x.why}`);
}
if (suspicious.length) {
  console.log(`\n⚠ ページ内にエージェント宛ての指示（従わず記録のみ）: ${suspicious.length} 件`);
  for (const x of suspicious) console.log(`  ! ${x.name} — ${x.note}`);
}

if (!WRITE) { console.log('\ndry run。台帳を書くには --write'); process.exit(0); }

// ── 台帳を書く（改行コードを保つ） ──────────────────────────────────────────
for (const [pref, p] of Object.entries(LEDGERS)) {
  const j = loaded[pref];
  const counts = {};
  for (const r of j.rows || []) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  // asOf は固定値にしない。静岡の台帳（2026-10-10 生成）に 10-06 を書き戻していた
  // toISOString は UTC。JST の未明に回すと前日になるのでローカル日付で組む
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  j.progress = { ...(j.progress || {}), asOf: today, 内訳: counts };
  const raw = fs.readFileSync(p, 'utf8');
  const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(p, (JSON.stringify(j, null, 1) + '\n').replace(/\n/g, EOL));
}
const rawAdd = fs.existsSync(ADDITIONS) ? fs.readFileSync(ADDITIONS, 'utf8') : '\r\n';
const EOLA = rawAdd.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(ADDITIONS, (JSON.stringify([...addById.values()], null, 1) + '\n').replace(/\n/g, EOLA));
console.log('\n台帳と追加候補を書きました。');
