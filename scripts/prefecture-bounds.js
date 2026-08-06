/**
 * 県ごとの座標 bounds（唯一の定義）。
 *
 * check-coords.js と audit-names.js で別々に持っていた値が食い違い、
 * 一方だけが富士宮市北部（朝霧高原, 約 lat 35.43）を範囲外と判定していたため
 * ここに統一した。静岡は南アルプス（静岡市葵区の北端, 約 lat 35.65）まで、
 * 山梨は北杜市の北端（約 lat 35.97）まで含む。
 *
 * 値を変える場合はここだけを直せば両方に反映される。
 */
const PREFECTURE_BOUNDS = {
  '神奈川': { latMin: 35.10, latMax: 35.68, lngMin: 138.90, lngMax: 139.80 },
  // lngMax は 139.15 だと道志村東端（WOODSMAN CAMP, lng 139.1536）を
  // 範囲外にしてしまうため 139.17 に緩和。山梨県の東端は上野原市の約 139.16。
  '山梨':   { latMin: 35.16, latMax: 35.97, lngMin: 138.20, lngMax: 139.17 },
  '静岡':   { latMin: 34.58, latMax: 35.65, lngMin: 137.45, lngMax: 139.18 },
};

/** 座標が県の想定範囲を外れていれば true。県が未知なら false（判定しない）。 */
function isOutOfBounds(prefecture, lat, lng) {
  const b = PREFECTURE_BOUNDS[prefecture];
  if (!b) return false;
  return lat < b.latMin || lat > b.latMax || lng < b.lngMin || lng > b.lngMax;
}

/** 「lat 35.10〜35.68 / lng 138.90〜139.80」形式の説明文字列。 */
function describeBounds(prefecture) {
  const b = PREFECTURE_BOUNDS[prefecture];
  if (!b) return '(範囲未定義)';
  return `lat ${b.latMin}〜${b.latMax} / lng ${b.lngMin}〜${b.lngMax}`;
}

module.exports = { PREFECTURE_BOUNDS, isOutOfBounds, describeBounds };
