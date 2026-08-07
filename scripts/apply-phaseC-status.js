/**
 * フェーズC: status フィールドの新設と、佐野川（キャンプ禁止）の掲載内容の是正。
 *
 * - 全件に status を付与（既定 'active'）
 * - sanogawa-camp  … 'closed'      キャンプ禁止が確認できた
 * - lumberjack-nanbu … 'unverified' 営業状況が確認できない
 * - sanogawa-camp の soloComment から利用を促す記述を外す
 * - あわせて sanogawa-camp の「焚き火可」表示と設営前提の cautions も是正する
 *   （soloComment だけ直しても詳細ページに「焚き火OK」バッジと設営助言が残るため）
 *
 * status は分類フィールドなので type の直後に置く。
 *
 * 使い方: node scripts/apply-phaseC-status.js [--dry]
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DRY = process.argv.includes('--dry');

const STATUS_OVERRIDES = {
  'sanogawa-camp': 'closed',
  'lumberjack-nanbu': 'unverified',
};

/** 閉鎖が確認できた施設の、利用を促す記述の是正 */
const SANOGAWA = {
  slug: 'sanogawa-camp',
  soloComment: {
    expect:
      '※詳細を確認中です。無料で焚き火ができる野営地としてソロキャンパーに知られる場所。設備は期待せず、増水と落石に備えて設営位置を選びたい。',
    value:
      '現在キャンプは禁止されています。かつて無料の野営地として知られていましたが、佐野川河川公園として管理される現在は利用できません。',
  },
  bonfire: { expect: true, value: false },
  bonfireNote: { expect: '焚き火可。直火の可否は要確認', value: 'キャンプ禁止のため不可' },
  cautions: {
    expect: [
      '山側は落石が多い。設営位置に注意',
      '上流に日本軽金属の自家発電用ダムがあり、放流による増水の可能性',
      '無料野営地は閉鎖・有料化のリスクがある。現況は要確認',
      'トイレ・水場の有無は要確認',
      'ゴミ完全持ち帰り',
    ],
    value: ['現在キャンプは禁止されている。佐野川河川公園として管理されており、宿泊・野営はできない'],
  },
};

/** status を type の直後（type が無ければ area の直後）に差し込んで順序を整える */
function withStatus(camp, status) {
  const out = {};
  let inserted = false;
  for (const [k, v] of Object.entries(camp)) {
    if (k === 'status') continue; // 既存があっても入れ直す
    out[k] = v;
    if (!inserted && (k === 'type' || k === 'area')) {
      // type があるならそちらを優先したいので、area で入れるのは type が無い場合だけ
      if (k === 'type' || !('type' in camp)) {
        out.status = status;
        inserted = true;
      }
    }
  }
  if (!inserted) out.status = status;
  return out;
}

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const problems = [];

// --- 佐野川の是正内容を検証 ---
const sano = camps.find((c) => c.slug === SANOGAWA.slug);
if (!sano) {
  problems.push('sanogawa-camp が見つからない');
} else {
  const checks = [
    ['soloComment', sano.soloComment, SANOGAWA.soloComment.expect],
    ['features.bonfire', sano.features.bonfire, SANOGAWA.bonfire.expect],
    ['features.bonfireNote', sano.features.bonfireNote, SANOGAWA.bonfireNote.expect],
    ['cautions', sano.cautions, SANOGAWA.cautions.expect],
  ];
  for (const [label, actual, expect] of checks) {
    if (JSON.stringify(actual) !== JSON.stringify(expect)) {
      problems.push(
        `sanogawa-camp.${label} の現在値が想定と違う:\n    実際=${JSON.stringify(actual)}\n    想定=${JSON.stringify(expect)}`
      );
    }
  }
}

for (const slug of Object.keys(STATUS_OVERRIDES)) {
  if (!camps.some((c) => c.slug === slug)) problems.push(`slug が見つからない: ${slug}`);
}

if (problems.length) {
  console.error('!! 想定と食い違う。1件も書き込まずに中断する !!');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}

// --- 適用 ---
const next = camps.map((c) => withStatus(c, STATUS_OVERRIDES[c.slug] || 'active'));

const s = next.find((c) => c.slug === SANOGAWA.slug);
s.soloComment = SANOGAWA.soloComment.value;
s.features.bonfire = SANOGAWA.bonfire.value;
s.features.bonfireNote = SANOGAWA.bonfireNote.value;
s.cautions = SANOGAWA.cautions.value;

const counts = next.reduce((acc, c) => ((acc[c.status] = (acc[c.status] || 0) + 1), acc), {});

console.log('=== フェーズC: status の新設と佐野川の是正 ===\n');
console.log('status の内訳:');
for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(12)} ${String(v).padStart(4)}件`);
console.log(`  ${'合計'.padEnd(11)} ${String(next.length).padStart(4)}件`);

console.log('\nactive 以外:');
for (const c of next.filter((c) => c.status !== 'active')) {
  console.log(`  ${c.status.padEnd(11)} ${c.slug}  (${c.name})`);
}

console.log('\n佐野川の是正:');
console.log(`  soloComment: ${JSON.stringify(SANOGAWA.soloComment.value)}`);
console.log(`  features.bonfire: ${SANOGAWA.bonfire.expect} -> ${SANOGAWA.bonfire.value}`);
console.log(`  features.bonfireNote: ${JSON.stringify(SANOGAWA.bonfireNote.value)}`);
console.log(`  cautions: ${SANOGAWA.cautions.expect.length}件 -> ${JSON.stringify(SANOGAWA.cautions.value)}`);

const forbidden = ['焚き火', '直火', '泊まれ'];
const hit = forbidden.filter((w) => SANOGAWA.soloComment.value.includes(w));
console.log(`\n新 soloComment の禁止語チェック: ${hit.length ? '!! ' + hit.join(',') : 'なし（OK）'}`);

if (DRY) {
  console.log('\n--dry のため書き込みなし。');
  process.exit(0);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(next, null, 2));
console.log('\ndata/campgrounds.json に書き込んだ。');
