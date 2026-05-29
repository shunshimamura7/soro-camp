const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getCoords(name) {
  const query = `[out:json];node["tourism"="camp_site"]["name"="${name}"];out;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'soro-camp/1.0' } });
    const data = await res.json();
    if (data.elements && data.elements.length > 0) {
      return { lat: data.elements[0].lat, lng: data.elements[0].lon };
    }
  } catch(e) {}
  return null;
}

function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

(async () => {
  const data = JSON.parse(fs.readFileSync('data/campgrounds.json', 'utf-8'));
  const fixed = [];
  const notFound = [];

  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    process.stdout.write(`\r${i+1}/${data.length} ${c.name}            `);
    const result = await getCoords(c.name);
    await sleep(1500);
    if (!result) { notFound.push(c.name); continue; }
    const dist = distance(c.lat, c.lng, result.lat, result.lng);
    if (dist > 3 && dist < 200) {
      fixed.push(`[${dist.toFixed(1)}km修正] ${c.name}: (${c.lat},${c.lng}) → (${result.lat},${result.lng})`);
      c.lat = result.lat;
      c.lng = result.lng;
    }
  }

  fs.writeFileSync('data/campgrounds.json', JSON.stringify(data, null, 2));
  console.log(`\n\n=== 修正済み ${fixed.length}件 ===`);
  fixed.forEach(f => console.log(f));
  console.log(`\n=== OSM未登録 ${notFound.length}件 ===`);

  if (fixed.length > 0) {
    const { execSync } = require('child_process');
    execSync('git add data/campgrounds.json && git commit -m "fix: auto-fix coordinates via overpass api" && git push');
    console.log('push完了');
  }
})();
