/**
 * public/restrictions.js の日付ロジックのテスト。
 *
 * 実際に閲覧時に走るファイルをそのまま require して検査する。
 * package.json の prebuild に登録してあるので、build / deploy の前に必ず走る。
 *
 * 使い方: node scripts/test-restrictions.js
 */
const path = require('path');
const { isActive, isValidMD, todayMD, formatMD, parseSource } =
  require(path.join(__dirname, '../public/restrictions.js'));

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  else failures.push(`${name}\n      期待: ${JSON.stringify(expected)}\n      実際: ${JSON.stringify(actual)}`);
}

// ── 同一年内の期間（和田長浜海岸: 海水浴場開設期間 07-03〜08-31） ──────────────
const summer = { type: 'bonfire', from: '07-03', to: '08-31', reason: 'x', source: 'y' };

check('同年内: 期間の前日は対象外',      isActive(summer, '07-02'), false);
check('同年内: from 当日は対象【境界】', isActive(summer, '07-03'), true);
check('同年内: 期間の中日',              isActive(summer, '08-07'), true);
check('同年内: to 当日は対象【境界】',   isActive(summer, '08-31'), true);
check('同年内: 期間の翌日は対象外',      isActive(summer, '09-01'), false);
check('同年内: 真冬は対象外',            isActive(summer, '01-01'), false);
check('同年内: 大晦日は対象外',          isActive(summer, '12-31'), false);

// ── 年をまたぐ期間（甲府市 森林浴広場: 冬期林道通行止 12-10〜04-25） ──────────
const winter = { type: 'access', from: '12-10', to: '04-25', reason: 'x', source: 'y' };

check('年またぎ: 期間の前日は対象外',       isActive(winter, '12-09'), false);
check('年またぎ: from 当日は対象【境界】',  isActive(winter, '12-10'), true);
check('年またぎ: 12-31 は対象【年またぎ】', isActive(winter, '12-31'), true);
check('年またぎ: 01-01 は対象【年またぎ】', isActive(winter, '01-01'), true);
check('年またぎ: 年明けの中日',             isActive(winter, '02-14'), true);
check('年またぎ: 閏日 02-29 も対象',        isActive(winter, '02-29'), true);
check('年またぎ: to 当日は対象【境界】',    isActive(winter, '04-25'), true);
check('年またぎ: 期間の翌日は対象外',       isActive(winter, '04-26'), false);
check('年またぎ: 夏は対象外',               isActive(winter, '08-07'), false);

// ── 1日だけの期間（from === to） ────────────────────────────────────────────
const oneDay = { type: 'camping', from: '05-04', to: '05-04', reason: 'x', source: 'y' };
check('1日のみ: 当日は対象',   isActive(oneDay, '05-04'), true);
check('1日のみ: 前日は対象外', isActive(oneDay, '05-03'), false);
check('1日のみ: 翌日は対象外', isActive(oneDay, '05-05'), false);

// ── 通年（01-01〜12-31） ───────────────────────────────────────────────────
const allYear = { type: 'access', from: '01-01', to: '12-31', reason: 'x', source: 'y' };
check('通年: 元日',   isActive(allYear, '01-01'), true);
check('通年: 大晦日', isActive(allYear, '12-31'), true);
check('通年: 中日',   isActive(allYear, '06-15'), true);

// ── 壊れた入力は「制限なし」ではなく false を返し、静的HTMLの要確認を残す ─────
check('不正な from は false', isActive({ from: '7-3',   to: '08-31' }, '08-07'), false);
check('不正な to は false',   isActive({ from: '07-03', to: '08-32' }, '08-07'), false);
check('不正な md は false',   isActive(summer, '2026-08-07'), false);
check('null は false',        isActive(null, '08-07'), false);

// ── isValidMD ──────────────────────────────────────────────────────────────
check('isValidMD: 07-03',  isValidMD('07-03'), true);
check('isValidMD: 01-01',  isValidMD('01-01'), true);
check('isValidMD: 12-31',  isValidMD('12-31'), true);
check('isValidMD: 02-29（閏日は許可）', isValidMD('02-29'), true);
check('isValidMD: 02-30',  isValidMD('02-30'), false);
check('isValidMD: 04-31',  isValidMD('04-31'), false);
check('isValidMD: 13-01',  isValidMD('13-01'), false);
check('isValidMD: 00-10',  isValidMD('00-10'), false);
check('isValidMD: 7-3（ゼロ埋めなし）', isValidMD('7-3'), false);
check('isValidMD: 空文字', isValidMD(''), false);
check('isValidMD: 数値',   isValidMD(703), false);

// ── todayMD ────────────────────────────────────────────────────────────────
check('todayMD: 1月1日はゼロ埋め', todayMD(new Date(2026, 0, 1)),  '01-01');
check('todayMD: 12月31日',         todayMD(new Date(2026, 11, 31)), '12-31');
check('todayMD: 8月7日',           todayMD(new Date(2026, 7, 7)),  '08-07');
check('todayMD: 閏日',             todayMD(new Date(2024, 1, 29)), '02-29');
// ローカル日付を使うこと。UTC だと日本時間の午前が前日にずれる
check('todayMD: ローカル深夜0時台', todayMD(new Date(2026, 7, 7, 0, 30)), '08-07');

// ── 表示ヘルパ ─────────────────────────────────────────────────────────────
check('formatMD: 07-03 → 7/3',   formatMD('07-03'), '7/3');
check('formatMD: 12-10 → 12/10', formatMD('12-10'), '12/10');
check('parseSource: URLあり', parseSource('三浦市海水浴場ルール第25条 https://example.jp/a.pdf'), {
  label: '三浦市海水浴場ルール第25条',
  url: 'https://example.jp/a.pdf',
});
check('parseSource: URLなし', parseSource('甲府市 施設カルテ 3-10'), {
  label: '甲府市 施設カルテ 3-10',
  url: null,
});

// ── 実データとの突き合わせ ─────────────────────────────────────────────────
// 型が通っていても期間が意図とずれていたら気づけないので、実際の値を固定する
const camps = require(path.join(__dirname, '../data/campgrounds.json'));
const withRestrictions = camps.filter((c) => Array.isArray(c.restrictions) && c.restrictions.length);

check(
  '実データ: restrictions を持つのは2件',
  withRestrictions.map((c) => c.slug).sort(),
  ['kofu-shinrinyoku-hiroba', 'wadanagahama-kaigan'],
);

const wada = camps.find((c) => c.slug === 'wadanagahama-kaigan');
if (wada && wada.restrictions) {
  check('実データ: 和田長浜は 8/7 時点で制限中', isActive(wada.restrictions[0], '08-07'), true);
  check('実データ: 和田長浜は 9/1 時点で制限外', isActive(wada.restrictions[0], '09-01'), false);
}

const kofu = camps.find((c) => c.slug === 'kofu-shinrinyoku-hiroba');
if (kofu && kofu.restrictions) {
  check('実データ: 甲府は 1/1 時点で制限中',  isActive(kofu.restrictions[0], '01-01'), true);
  check('実データ: 甲府は 12/31 時点で制限中', isActive(kofu.restrictions[0], '12-31'), true);
  check('実データ: 甲府は 8/7 時点で制限外',  isActive(kofu.restrictions[0], '08-07'), false);
}

// ── 結果 ───────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`test-restrictions: ${passed}件成功 / ${failures.length}件失敗\n`);
  failures.forEach((f) => console.error(`  x ${f}`));
  console.error('\nビルドを中止します。');
  process.exit(1);
}

console.log(`test-restrictions: ${passed}件すべて成功`);
