const fs = require('fs');
const path = require('path');
const camps = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
const rows = camps
  .filter((c) => c.status === 'active' && c.type !== 'wild' && c.priceVerified !== true)
  .map((c) => ({ id: c.id, name: c.name, prefecture: c.prefecture, officialUrl: c.officialUrl || '', reservationUrl: c.reservationUrl || '', tel: c.tel || '' }));
fs.writeFileSync(path.join(__dirname, '..', 'data', 'price-pending-recheck-2026-08-26.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(rows.map((r) => `${r.id}\t${r.name}\t${r.officialUrl || r.reservationUrl || '(URLなし)'}`).join('\n'));
console.error(`count=${rows.length}`);
