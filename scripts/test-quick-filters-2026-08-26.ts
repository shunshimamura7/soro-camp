import { activeCampgrounds, filterAndSort, countMatching, DEFAULT_FILTERS } from "../lib/camp";

/**
 * こだわり条件の回帰テスト（型チェック用。`npx tsc --noEmit` で通す）。
 *
 * 条件の集合そのものの検査は `scripts/test-filters.js`（`npm test` で走る）にある。
 * こちらはデータに対する結果を見る。
 */
const base = DEFAULT_FILTERS;

const fishing = filterAndSort(activeCampgrounds, { ...base, fishing: true }, "soloScore");
const shops = filterAndSort(activeCampgrounds, { ...base, shop: true }, "soloScore");
const expectedFishing = ["kannogawa", "yataro-camp", "kananomori-sanso"];
const actualFishing = fishing.map((camp) => camp.id).sort();
if (JSON.stringify(actualFishing) !== JSON.stringify([...expectedFishing].sort())) {
  throw new Error(`釣り可フィルタの結果が想定と異なります: ${actualFishing.join(", ")}`);
}
if (shops.length === 0 || shops.some((camp) => camp.features.shop !== true)) {
  throw new Error("売店ありフィルタに不正な施設が含まれるか、結果が空です");
}

/**
 * ピルに出す件数と、実際に絞り込んだ件数がずれないこと。
 * 数字を見て押した利用者が「言われた件数と違う」と感じるのが一番効く裏切りなので、
 * 表示と絞り込みが同じ判定（matchesFilters）を通っていることをここで押さえる。
 */
const predicted = countMatching(activeCampgrounds, base, { bath: true });
const actual = filterAndSort(activeCampgrounds, { ...base, bath: true }, "soloScore").length;
if (predicted !== actual) {
  throw new Error(`件数表示と絞り込み結果が一致しません: 表示 ${predicted} / 実際 ${actual}`);
}

console.log(`quick-filter-test=OK fishing=${fishing.length} shop=${shops.length} bath=${actual}`);
