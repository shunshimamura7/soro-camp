const fs = require('fs');
const path = require('path');

const targets = [
  ['orange-mura-auto', '野宮農園 オレンジ村オートキャンプ場', '千葉県南房総市千倉町久保1494'],
  ['otaki-kenminnomori', '千葉県立大多喜県民の森 キャンプ場', '千葉県夷隅郡大多喜町大多喜486-21'],
  ['otaki-sabo', '大多喜SABO', '千葉県夷隅郡大多喜町堀之内595'],
  ['morimaki-auto', '森のまきばオートキャンプ場', '千葉県袖ケ浦市林562-1-3'],
  ['narita-yume-bokujo', '成田ゆめ牧場オートキャンプ場', '千葉県成田市名木730-3'],
  ['sengokudai-auto', '千石台オートキャンプ場', '千葉県君津市黄和田畑2245-16'],
  ['uchiurayama-kenminnomori', '千葉県立内浦山県民の森 キャンプ場', '千葉県鴨川市内浦3228'],
  ['shimizu-koen-auto', '清水公園オートキャンプ場', '千葉県野田市清水906'],
  ['futtsu-shiminnomori', '富津市民の森キャンプ場', '千葉県富津市豊岡2785-1'],
  ['ohara-kamifuse-auto', '大原上布施オートキャンプ場', '千葉県いすみ市上布施593'],
  ['tachibana-fureai-camp', '橘ふれあい公園キャンプ場', '千葉県香取市長岡1828-1'],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocode(address) {
  const url = new URL('https://msearch.gsi.go.jp/address-search/AddressSearch');
  url.searchParams.set('q', address);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

(async () => {
  const rows = [];
  for (const [slug, name, address] of targets) {
    try {
      const results = await geocode(address);
      rows.push({
        slug,
        name,
        address,
        results: results.slice(0, 3).map((r) => ({
          display_name: r.properties?.title,
          lng: Number(r.geometry?.coordinates?.[0]),
          lat: Number(r.geometry?.coordinates?.[1]),
        })),
      });
    } catch (error) {
      rows.push({ slug, name, address, error: String(error) });
    }
    await sleep(1100);
  }
  const output = path.join(__dirname, 'chiba-geocode-proposals-2026-08-26.json');
  fs.writeFileSync(output, JSON.stringify(rows, null, 2) + '\n', 'utf8');
  console.log(output);
})();
