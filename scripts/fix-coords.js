const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/campgrounds.json', 'utf-8'));

const fixes = {
  'narakoko':               { lat: 34.8759, lng: 138.0172 },
  'wellcamp-nishitanzawa':  { lat: 35.4721, lng: 139.0644 },
  'nishitanzawa-ootaki':    { lat: 35.4544, lng: 139.0523 },
  'pica-fuji-greenpa':      { lat: 35.2938, lng: 138.7808 },
  'osezaki-camp':           { lat: 35.0285, lng: 138.8590 },
  'hottarakashi-camp':      { lat: 35.7085, lng: 138.6485 },
  'kumomi-auto':            { lat: 34.7121, lng: 138.7455 },
  'kawazu-nanadaru':        { lat: 34.7996, lng: 138.9270 },
  'hikenkayama':            { lat: 34.8024, lng: 138.1034 },
  'fumotoppara':            { lat: 35.3985, lng: 138.5659 },
  'toyanosawa':             { lat: 35.4763, lng: 138.9547 },
  'fujikawa-camp':          { lat: 35.1482, lng: 138.5976 },
  'onoji-family':           { lat: 35.2588, lng: 138.8626 },
  'okudoshi-auto':          { lat: 35.4700, lng: 138.9440 },
  'doshi-no-mori':          { lat: 35.4913, lng: 138.9945 },
  'pica-fujiyama-camp':     { lat: 35.4559, lng: 138.7554 },
  'shindo':                 { lat: 35.5672, lng: 139.2025 },
  'karasawa-miyagase':      { lat: 35.4880, lng: 139.2221 },
  'fujinomori-yamanakako':  { lat: 35.4300, lng: 138.9165 },
};

let count = 0;
data.forEach(c => {
  if (fixes[c.slug]) {
    console.log(`修正: ${c.name} (${c.lat},${c.lng}) → (${fixes[c.slug].lat},${fixes[c.slug].lng})`);
    c.lat = fixes[c.slug].lat;
    c.lng = fixes[c.slug].lng;
    count++;
  }
});

fs.writeFileSync('data/campgrounds.json', JSON.stringify(data, null, 2));
console.log(`\n${count}件修正完了`);
