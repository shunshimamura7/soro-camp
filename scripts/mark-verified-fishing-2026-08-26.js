const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'campgrounds.json');
const camps = JSON.parse(fs.readFileSync(file, 'utf8'));
const details = {
  kannogawa: '場内のマス・ヤマメ・イワナ釣り／つかみ取り（施設公式）',
  'yataro-camp': '場内の魚釣り・つかみ取り（施設公式。天候・営業日は要確認）',
  'kananomori-sanso': '隣接する真木川での渓流釣り（施設公式。遊漁・季節条件は要確認）',
};
for (const camp of camps) {
  if (!Object.hasOwn(details, camp.id)) continue;
  camp.features.fishing = true;
  camp.features.fishingNote = details[camp.id];
  camp.lastVerified = '2026-08-26';
}
fs.writeFileSync(file, JSON.stringify(camps, null, 2) + '\n');
console.log(JSON.stringify({ updated: Object.keys(details) }, null, 2));
