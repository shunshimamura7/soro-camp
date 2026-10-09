#!/usr/bin/env node
/**
 * 門の台帳の UNMEASURED 行（まだ公式を見ていない行）を10件ずつの束に割り、
 * サブエージェントに渡す入力ファイルを書く。
 *
 *   node scripts/split-gate-batches-2026-10-10.js shizuoka sz          # dry run
 *   node scripts/split-gate-batches-2026-10-10.js shizuoka sz --write
 *
 * 第2引数は束ファイルの接頭辞（scripts/.gate-raw/<prefix>-in-NN.json）。
 * **既に reason が入っている UNMEASURED 行（＝調査済みの判断待ち）は束に入れない。**
 * 一度門を通した行をもう一度サブエージェントに回さないため。
 */
const fs = require('fs');
const path = require('path');

const key = process.argv[2];
const prefix = process.argv[3];
const WRITE = process.argv.includes('--write');
const PREF_NAME = { shizuoka: '静岡', kanagawa: '神奈川', chiba: '千葉', yamanashi: '山梨' };
if (!key || !PREF_NAME[key] || !prefix || prefix.startsWith('--')) {
  console.error('使い方: node scripts/split-gate-batches-2026-10-10.js <pref-key> <prefix> [--write] [--size N]');
  process.exit(1);
}
const sizeIdx = process.argv.indexOf('--size');
const SIZE = sizeIdx > -1 ? Number(process.argv[sizeIdx + 1]) : 10;
if (!Number.isInteger(SIZE) || SIZE < 1 || SIZE > 20) {
  console.error('中止: --size は1〜20の整数');
  process.exit(1);
}

const ledgerPath = ['2026-10-10', '2026-10-06']
  .map((d) => path.join('data', `${key}-nap-triage-${d}.json`))
  .find((p) => fs.existsSync(p));
if (!ledgerPath) {
  console.error(`中止: ${key} の台帳が見つからない`);
  process.exit(1);
}
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const todo = ledger.rows.filter((r) => r.verdict === 'UNMEASURED' && !r.reason);

const batches = [];
for (let i = 0; i < todo.length; i += SIZE) batches.push(todo.slice(i, i + SIZE));

console.log(`台帳 ${ledgerPath}`);
console.log(`  未着手の UNMEASURED ${todo.length} 件 → ${batches.length} 束（1束 ${SIZE} 件、最後は ${batches.at(-1)?.length ?? 0} 件）`);
const judged = ledger.rows.filter((r) => r.verdict === 'UNMEASURED' && r.reason).length;
if (judged) console.log(`  調査済みの判断待ち ${judged} 件は束に入れない`);

if (!WRITE) {
  console.log('\ndry run。書くには --write');
  process.exit(0);
}
const dir = path.join('scripts', '.gate-raw');
fs.mkdirSync(dir, { recursive: true });
batches.forEach((b, i) => {
  const n = String(i + 1).padStart(2, '0');
  const rows = b.map((r) => ({
    napId: r.napId,
    name: r.name,
    pref: PREF_NAME[key],
    muni: r.muni,
    address: r.address,
    napUrl: r.napUrl,
    hpUrl: r.hpUrl || null,
  }));
  fs.writeFileSync(path.join(dir, `${prefix}-in-${n}.json`), `${JSON.stringify(rows, null, 1)}\n`);
});
console.log(`\n書いた: scripts/.gate-raw/${prefix}-in-01..${String(batches.length).padStart(2, '0')}.json`);
