const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'campgrounds.json');
const camps = JSON.parse(fs.readFileSync(file, 'utf8'));
let changed = 0;
for (const camp of camps) {
  if (camp.status === 'active' && camp.scoresVerified !== true) {
    if (camp.scoresVerified !== false) changed += 1;
    camp.scoresVerified = false;
  }
}
fs.writeFileSync(file, JSON.stringify(camps, null, 2) + '\n');
console.log(JSON.stringify({ activeScoreVerificationSetToFalse: changed }, null, 2));
