const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'campgrounds.json');
const camps = JSON.parse(fs.readFileSync(file, 'utf8'));
const byId = new Map(camps.map((camp) => [camp.id, camp]));
const source = (camp, text) => {
  camp.source = Array.isArray(camp.source) ? camp.source : [];
  if (!camp.source.includes(text)) camp.source.push(text);
};
const get = (id) => {
  const camp = byId.get(id);
  if (!camp) throw new Error(`対象施設なし: ${id}`);
  return camp;
};

const akeno = get('akeno-fureai-camp');
akeno.priceMin = 1000;
akeno.priceMax = 1000;
akeno.priceNote = 'PICA八ヶ岳明野「ソロデュオサイト」1泊1サイト1,000円〜。日付・プランにより変動するため予約画面で要確認';
akeno.priceVerified = true;
akeno.needsPrice = false;
akeno.lastVerified = '2026-08-26';
source(akeno, '公式宿泊一覧（料金） https://www.pica-resort.jp/en/akeno/stay/site/index.html');

const hakushu = get('village-hakushu');
hakushu.priceMin = 3500;
hakushu.priceMax = 3500;
hakushu.priceNote = 'キャンプサイト1張り1泊3,500円。連泊時3,000円、日帰り2,000円（施設公式STAY）';
hakushu.priceVerified = true;
hakushu.needsPrice = false;
hakushu.lastVerified = '2026-08-26';
source(hakushu, '公式STAY（料金） https://www.village-hakushu.com/stay');

const unresolved = [
  'tanukiko', 'aonohara-auto', 'miyagase-village', 'yataro-camp',
  'pica-sagamiko', 'usami-shiroyama', 'folkwood-yatsugatake',
  'kuragari-camp', 'kokono-shizuoka', 'sessokyo-camp',
  'akiyamagawa-camp', 'shizunami-beach-camp',
];
for (const id of unresolved) {
  const camp = get(id);
  camp.priceMin = 0;
  camp.priceMax = 0;
  camp.priceVerified = false;
  camp.needsPrice = true;
  camp.priceNote = `${camp.priceNote ? `${camp.priceNote}／` : ''}2026-08-26 再確認。固定のソロ料金を一次情報で確定できないため、公式サイト・予約ページまたは電話で要確認。`;
  camp.lastVerified = '2026-08-26';
}

fs.writeFileSync(file, JSON.stringify(camps, null, 2) + '\n');
console.log(JSON.stringify({ verified: ['akeno-fureai-camp', 'village-hakushu'], needsPrice: unresolved }, null, 2));
