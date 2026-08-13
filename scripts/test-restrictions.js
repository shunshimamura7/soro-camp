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

// ── 同一年内の期間 ─────────────────────────────────────────────────────────
// 値は架空の固定値（出どころは和田長浜の海水浴場開設期間だが、実データとの一致は
// ここでは検査しない。実データは下の「実データとの突き合わせ（動的）」が全件見る）
const summer = { type: 'bonfire', from: '07-03', to: '08-31', reason: 'x', source: 'y' };

check('同年内: 期間の前日は対象外',      isActive(summer, '07-02'), false);
check('同年内: from 当日は対象【境界】', isActive(summer, '07-03'), true);
check('同年内: 期間の中日',              isActive(summer, '08-07'), true);
check('同年内: to 当日は対象【境界】',   isActive(summer, '08-31'), true);
check('同年内: 期間の翌日は対象外',      isActive(summer, '09-01'), false);
check('同年内: 真冬は対象外',            isActive(summer, '01-01'), false);
check('同年内: 大晦日は対象外',          isActive(summer, '12-31'), false);

// ── 年をまたぐ期間 ─────────────────────────────────────────────────────────
// 値は架空の固定値（出どころは甲府市森林浴広場の冬期林道通行止。同上）
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

// ── 実データとの突き合わせ（動的） ─────────────────────────────────────────
//
// 旧実装は「restrictions を持つのは2件」と slug を焼き込んでいた。
// **3件目を足した瞬間に必ず FAIL する検査**で、しかも FAIL の内容は
// 「データが増えた」であって「ロジックが壊れた」ではない（§18-3 のハードコードの腐り）。
//
// かわりに、**データに何件あっても全件を同じ性質で検査する。**
//   1. スキーマ: from/to が MM-DD として妥当、reason / source が空でない
//   2. 差分検査: isActive を素朴な別実装（オラクル）と 366日ぶんの全日付で突き合わせる。
//      年またぎ（from > to）の扱いが本実装とオラクルで一致することを確認する
//   3. 境界: from 当日・to 当日は必ず対象。期間の前日・翌日は、期間がその日を
//      覆っていない限り対象外（覆っているかはオラクルで判定する）
//
// **検査した件数を必ず出力する。**0件なら0件と出る（黙って素通りしない）。
const camps = require(path.join(__dirname, '../data/campgrounds.json'));

/** 閏年の全366日を MM-DD で列挙 */
const ALL_DAYS = [];
{
  const dim = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= dim[m - 1]; d++) {
      ALL_DAYS.push(`${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }
}

/** オラクル: isActive の素朴な別実装。MM-DD のゼロ埋め文字列は辞書順で日付順になる */
function oracleActive(r, md) {
  if (!r || !isValidMD(r.from) || !isValidMD(r.to) || !isValidMD(md)) return false;
  return r.from <= r.to ? r.from <= md && md <= r.to : md >= r.from || md <= r.to;
}

let checkedRestrictions = 0;
for (const c of camps) {
  if (!Array.isArray(c.restrictions)) continue;
  c.restrictions.forEach((r, i) => {
    checkedRestrictions++;
    const tag = `実データ ${c.slug}[${i}]`;
    // 1. スキーマ
    check(`${tag}: from が妥当な MM-DD`, isValidMD(r.from), true);
    check(`${tag}: to が妥当な MM-DD`,   isValidMD(r.to), true);
    check(`${tag}: reason がある`, typeof r.reason === 'string' && r.reason.length > 0, true);
    check(`${tag}: source がある`, typeof r.source === 'string' && r.source.length > 0, true);
    // 2. 全日付の差分検査（不一致の日だけ列挙する）
    const diff = ALL_DAYS.filter((md) => isActive(r, md) !== oracleActive(r, md));
    check(`${tag}: isActive がオラクルと366日すべて一致`, diff.slice(0, 5), []);
    // 3. 境界
    if (isValidMD(r.from) && isValidMD(r.to)) {
      check(`${tag}: from 当日（${r.from}）は対象`, isActive(r, r.from), true);
      check(`${tag}: to 当日（${r.to}）は対象`,     isActive(r, r.to), true);
      const idx = (md) => ALL_DAYS.indexOf(md);
      const prev = ALL_DAYS[(idx(r.from) + ALL_DAYS.length - 1) % ALL_DAYS.length];
      const next = ALL_DAYS[(idx(r.to) + 1) % ALL_DAYS.length];
      check(`${tag}: 期間前日（${prev}）の判定がオラクルと一致`, isActive(r, prev), oracleActive(r, prev));
      check(`${tag}: 期間翌日（${next}）の判定がオラクルと一致`, isActive(r, next), oracleActive(r, next));
    }
  });
}
console.log(`test-restrictions: 実データの restrictions ${checkedRestrictions}件を検査（0件なら要注意）`);

// ── 結果 ───────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`test-restrictions: ${passed}件成功 / ${failures.length}件失敗\n`);
  failures.forEach((f) => console.error(`  x ${f}`));
  console.error('\nビルドを中止します。');
  process.exit(1);
}

console.log(`test-restrictions: ${passed}件すべて成功`);
