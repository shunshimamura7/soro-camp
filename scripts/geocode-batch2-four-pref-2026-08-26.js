const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const candidates = JSON.parse(fs.readFileSync(path.join(root, 'data', 'candidate-batch2-four-pref-2026-08-26.json'), 'utf8'));
const out = [];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocode(candidate) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', `${candidate.name} ${candidate.address}`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '3');
  const res = await fetch(url, {headers: {'User-Agent': 'soro-camp-quality-audit/1.0 (public data verification)'}});
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const options = await res.json();
  return {
    id: candidate.id,
    name: candidate.name,
    prefecture: candidate.prefecture,
    address: candidate.address,
    options: options.map(x => ({display_name: x.display_name, lat: Number(x.lat), lng: Number(x.lon), type: x.type, class: x.class}))
  };
}

(async () => {
  for (const c of candidates) {
    try {
      out.push(await geocode(c));
      console.log(`ok ${c.id}`);
    } catch (e) {
      out.push({id:c.id, name:c.name, prefecture:c.prefecture, address:c.address, options:[], error:String(e)});
      console.log(`fail ${c.id}: ${e}`);
    }
    await sleep(1100);
  }
  const outPath = path.join(root, 'data', 'candidate-batch2-geocode-proposals-2026-08-26.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(outPath);
})();
