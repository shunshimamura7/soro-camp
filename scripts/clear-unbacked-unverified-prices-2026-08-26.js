const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'campgrounds.json');
const camps = JSON.parse(fs.readFileSync(file, 'utf8'));
const ids = ['kabutomushi-mori-camp', 'okumakino-camp', 'mikagi-camp', 'mushizawa-camp', 'makioka-fruits-camp'];
for (const camp of camps) {
  if (!ids.includes(camp.id)) continue;
  camp.priceMin = 0;
  camp.priceMax = 0;
  camp.priceVerified = false;
  camp.needsPrice = true;
  camp.priceNote = `${camp.priceNote ? `${camp.priceNote}／` : ''}一次情報の料金根拠を確認できないため要確認。`;
}
fs.writeFileSync(file, JSON.stringify(camps, null, 2) + '\n');
console.log(JSON.stringify({ updated: ids }, null, 2));
