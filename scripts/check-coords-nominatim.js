const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function geocode(name) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&countrycodes=jp`;
  const res = await fetch(url, { headers: { 'User-Agent': 'soro-camp-coord-checker/1.0' } });
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

(async () => {
  const camps = JSON.parse(fs.readFileSync('data/campgrounds.json', 'utf-8'));
  const issues = [];
  const notFound = [];

  for (let i = 0; i < camps.length; i++) {
    const c = camps[i];
    process.stdout.write(`\r${i+1}/${camps.length} ${c.name}`);
    const result = await geocode(c.name);
    await sleep(1100);
    if (!result) {
      notFound.push(c.name);
      continue;
    }
    const dist = distance(c.lat, c.lng, result.lat, result.lng);
    if (dist > 5) {
      issues.push(`[${dist.toFixed(1)}km ズレ] ${c.name}\n  現在: ${c.lat},${c.lng}\n  取得: ${result.lat},${result.lng}\n  slug: ${c.slug}`);
    }
  }

  console.log('\n\n=== 5km以上ズレ ===');
  issues.forEach(i => console.log(i));
  console.log(`\n=== 取得できず(${notFound.length}件) ===`);
  notFound.forEach(n => console.log(' ' + n));
})();
