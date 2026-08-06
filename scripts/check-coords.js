const fs = require('fs');
const camps = JSON.parse(fs.readFileSync('data/campgrounds.json', 'utf-8'));
const bounds = {
  '神奈川': { latMin: 35.1, latMax: 35.7, lngMin: 138.9, lngMax: 139.8 },
  '静岡':   { latMin: 34.5, latMax: 35.5, lngMin: 137.6, lngMax: 139.2 },
  '山梨':   { latMin: 35.2, latMax: 36.0, lngMin: 138.1, lngMax: 139.3 },
};

// 座標未設定（lat/lng が 0）— 範囲外チェックとは分けて集計する
const zeros = camps.filter(c => c.lat === 0 || c.lng === 0);

const issues = [];
camps.forEach(c => {
  if (c.lat === 0 || c.lng === 0) return; // 未設定は下でまとめて報告
  const b = bounds[c.prefecture];
  if (!b) return;
  if (c.lat < b.latMin || c.lat > b.latMax || c.lng < b.lngMin || c.lng > b.lngMax) {
    issues.push(`[${c.prefecture}] ${c.name} / lat:${c.lat} lng:${c.lng} / slug:${c.slug}`);
  }
});

if (issues.length === 0) {
  console.log('範囲外なし');
} else {
  console.log(`範囲外 ${issues.length}件:`);
  issues.forEach(i => console.log(' ' + i));
}

if (zeros.length === 0) {
  console.log('座標未設定なし');
} else {
  console.log(`座標未設定（lat/lng = 0） ${zeros.length}件:`);
  zeros.forEach(c => console.log(` ${c.slug} / ${c.name}`));
}
