#!/usr/bin/env node
/**
 * なっぷ収穫データ（scripts/.nap-harvest/<pref>.json）から「門」の台帳を組む。
 *
 * 千葉・山梨の台帳は手作業で組んだので再現できなかった。静岡・神奈川のために手順を固定する。
 *
 *   node scripts/build-nap-triage-2026-10-10.js shizuoka            # dry run
 *   node scripts/build-nap-triage-2026-10-10.js shizuoka --write
 *
 * 仕分けは3段。**どれも機械的に決まるものだけ**で、公式を見ないと決まらないものは全部
 * `UNMEASURED`（＝門の対象）にしてサブエージェントに回す。
 *
 *   1. 県分類で弾かれた行（PREF_MISMATCH）を除外       … check-nap-harvest.js と同じ判定
 *   2. 既に data/campgrounds.json にある施設を除外       … 名前 OR 住所（収穫に公式URLは無い）
 *   3. 施設名に【…閉鎖】【…休業】【…休止】がある行      … `閉鎖疑い`
 *   残り                                              … `UNMEASURED`（reason は null）
 *
 * **山梨で使った「施設名にグランピング等が含まれたら宿泊系として除外」は、ここでは採らない。**
 * 「城ヶ尾 ブナの森キャンプ ＆コテージ」のようにテントサイトを持つ施設まで名前だけで落ちていた。
 * 宿泊系かどうかは公式を開いて決める（門の中で `宿泊系のため対象外` が付く）。
 */

const fs = require('fs');
const path = require('path');

const PREFS = {
  shizuoka: '静岡',
  kanagawa: '神奈川',
  chiba: '千葉',
  yamanashi: '山梨',
};

const key = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!PREFS[key]) {
  console.error(`使い方: node scripts/build-nap-triage-2026-10-10.js <${Object.keys(PREFS).join('|')}> [--write]`);
  process.exit(1);
}
const pref = PREFS[key];

const stop = (msg) => {
  console.error(`中止: ${msg}`);
  process.exit(1);
};

const harvestPath = path.join('scripts', '.nap-harvest', `${key}.json`);
const outPath = path.join('data', `${key}-nap-triage-2026-10-10.json`);
if (!fs.existsSync(harvestPath)) stop(`収穫データが無い: ${harvestPath}`);
if (fs.existsSync(outPath) && !process.argv.includes('--overwrite')) {
  stop(`${outPath} が既にある。上書きするなら --overwrite（門の進捗が消えるので普段は使わない）`);
}

const harvest = JSON.parse(fs.readFileSync(harvestPath, 'utf8'));
const rows = Array.isArray(harvest) ? harvest : harvest.rows || harvest.records;
if (!Array.isArray(rows) || rows.length === 0) stop('収穫データの形が読めない');

/** 収穫が途中なら台帳を組まない。check-nap-harvest.js の2条件を自分でも確かめる */
const progPath = path.join('scripts', '.nap-harvest', `${key}.progress.txt`);
if (fs.existsSync(progPath)) {
  const prog = fs.readFileSync(progPath, 'utf8').trim();
  if (!/完了/.test(prog)) stop(`収穫が途中（${prog.slice(0, 120)}）。完了してから組む`);
}
const notOk = rows.filter((r) => r.status !== 200);
if (notOk.length) stop(`status が 200 でない行が ${notOk.length} 件ある（${notOk.slice(0, 3).map((r) => r.id).join(',')}）`);

const norm = (s) => String(s || '').normalize('NFKC').replace(/ヶ/g, 'ケ').replace(/[\s　]/g, '');
/** 住所から市区町村を取る。郡を挟む場合は郡の次を市町村として読む */
const muniOf = (addr) => {
  const a = String(addr || '').replace(/^静岡県|^神奈川県|^千葉県|^山梨県/, '');
  const m = a.match(/^(.+?郡)?(.+?[市区町村])/);
  return m ? m[2] : null;
};

/** 市町村名は check-nap-harvest.js の一覧を使う（§18-3 で「別に書かない」と決めている） */
const { PREF_MUNI, canonMuni } = require('./check-nap-harvest.js');
const realMuni = new Set(PREF_MUNI[key] || []);

const list = JSON.parse(fs.readFileSync(path.join('data', 'campgrounds.json'), 'utf8'));
const existingNames = new Set(list.map((c) => norm(c.name)).filter(Boolean));
const existingAddrs = new Set(list.map((c) => norm(c.address)).filter(Boolean));

const CLOSED_IN_NAME = /【[^】]*(閉鎖|閉業|休業|休止|営業終了)[^】]*】|【[^】]*現在[^】]*(閉鎖|休業|休止)/;

const out = [];
const stats = {
  napTotal: rows.length,
  prefMismatchExcluded: 0,
  alreadyListed: 0,
  closedByName: 0,
  addressMissing: 0,
  gateCandidates: 0,
};
const prefMismatch = [];
const badMuni = [];

for (const r of rows) {
  // 住所が空なのと「別の県の住所」は別物。空は落とさず門に回す（収穫が住所を取れなかっただけ）
  if (r.address && !String(r.address).startsWith(`${pref}県`)) {
    stats.prefMismatchExcluded += 1;
    prefMismatch.push({ napId: r.id, name: r.name, address: r.address, why: 'PREF_MISMATCH' });
    continue;
  }
  if (!r.address) stats.addressMissing += 1;
  if (
    existingNames.has(norm(r.name)) ||
    (r.address && existingAddrs.has(norm(r.address)))
  ) {
    stats.alreadyListed += 1;
    continue;
  }
  /* なっぷの住所には誤字がある（実測: 「神奈川県模原市緑区牧野」＝相模原市の「相」落ち）。
   * 実在しない市町村名をそのまま門に渡すと、公式の住所と照合できず全部弾かれる。
   * 一覧に無ければ `(不明)` にして、門では県名で照合させる。 */
  const m0 = canonMuni(muniOf(r.address));
  // 政令市の区名（「千葉市若葉区」）は一覧に無いが照合に使える。市名が頭に付いていれば通す
  const usable = !!m0 && (realMuni.has(m0) || [...realMuni].some((x) => m0.startsWith(x)));
  const muni = usable ? m0 : '(不明)';
  if (m0 && !usable) badMuni.push({ napId: String(r.id), name: r.name, address: r.address, extracted: m0 });
  const row = {
    napId: String(r.id),
    name: r.name,
    muni,
    address: r.address,
    napUrl: r.url,
    latCandidate: r.latCandidate || null,
    lngCandidate: r.lngCandidate || null,
    officialUrl: null,
    verdict: 'UNMEASURED',
    reason: null,
  };
  if (CLOSED_IN_NAME.test(r.name)) {
    row.verdict = '閉鎖疑い';
    row.reason = 'なっぷの施設名に閉鎖・休業の表記がある';
    stats.closedByName += 1;
  } else {
    stats.gateCandidates += 1;
  }
  out.push(row);
}

const ledger = {
  generatedAt: '2026-10-10',
  source: `${harvestPath}（check-nap-harvest.js の2条件 COMPLETE / 残り0・余り0・取得率100%）`,
  builtBy: 'scripts/build-nap-triage-2026-10-10.js',
  totals: { ...stats, rows: out.length },
  prefMismatch,
  badMuni,
  rows: out,
  progress: {
    asOf: '2026-10-10',
    門の対象: stats.gateCandidates,
    内訳: out.reduce((a, r) => ((a[r.verdict] = (a[r.verdict] || 0) + 1), a), {}),
    備考:
      '施設名によるグランピング除外はしていない（山梨ではテントサイト持ちの施設まで落ちていた）。宿泊系かどうかは門の中で公式を見て決める',
  },
};

console.log(`${pref}（${key}）`);
console.log(`  なっぷ総数            ${stats.napTotal}`);
console.log(`  県分類で除外          ${stats.prefMismatchExcluded}`);
console.log(`  既に掲載済みで除外    ${stats.alreadyListed}`);
console.log(`  台帳の行数            ${out.length}`);
console.log(`    うち 閉鎖疑い(名前) ${stats.closedByName}`);
console.log(`    うち 門の対象       ${stats.gateCandidates}`);
if (prefMismatch.length) {
  console.log('  県分類で除外した行:');
  for (const p of prefMismatch.slice(0, 10)) console.log(`    ${p.napId} ${p.name} … ${p.address}`);
  if (prefMismatch.length > 10) console.log(`    …ほか ${prefMismatch.length - 10} 件`);
}
if (stats.addressMissing) console.log(`    うち 住所が空        ${stats.addressMissing}（門では県名で照合する）`);
if (badMuni.length) {
  console.log(`  市町村名が一覧に無い行 ${badMuni.length} 件（なっぷ側の誤字 or 合併前の旧町村名。(不明) にした）:`);
  for (const b of badMuni) console.log(`    ${b.napId} ${b.name} … ${b.address} → 「${b.extracted}」`);
}
const unknownMuni = out.filter((r) => r.muni === '(不明)');
if (unknownMuni.length) {
  console.log(`  市町村が取れなかった行 ${unknownMuni.length} 件（門では県名で照合する）:`);
  for (const r of unknownMuni.slice(0, 10)) console.log(`    ${r.napId} ${r.name} … ${r.address}`);
}

if (!WRITE) {
  console.log('\ndry run。台帳を書くには --write');
  process.exit(0);
}
fs.writeFileSync(outPath, `${JSON.stringify(ledger, null, 1)}\n`);
console.log(`\n書いた: ${outPath}`);
