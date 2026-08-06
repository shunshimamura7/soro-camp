const fs = require('fs');
const path = require('path');
const { isOutOfBounds, describeBounds } = require(path.join(__dirname, 'prefecture-bounds.js'));

const camps = JSON.parse(fs.readFileSync('data/campgrounds.json', 'utf-8'));

// 座標未設定（lat/lng が 0）— 範囲外チェックとは分けて集計する
const zeros = camps.filter(c => c.lat === 0 || c.lng === 0);

const issues = [];
camps.forEach(c => {
  if (c.lat === 0 || c.lng === 0) return; // 未設定は下でまとめて報告
  if (isOutOfBounds(c.prefecture, c.lat, c.lng)) {
    issues.push(`[${c.prefecture}] ${c.name} / lat:${c.lat} lng:${c.lng} / slug:${c.slug}`);
    issues.push(`    想定範囲: ${describeBounds(c.prefecture)}`);
  }
});

if (issues.length === 0) {
  console.log('範囲外なし');
} else {
  console.log(`範囲外 ${issues.length / 2}件:`);
  issues.forEach(i => console.log(' ' + i));
}

if (zeros.length === 0) {
  console.log('座標未設定なし');
} else {
  console.log(`座標未設定（lat/lng = 0） ${zeros.length}件:`);
  zeros.forEach(c => console.log(` ${c.slug} / ${c.name}`));
}
