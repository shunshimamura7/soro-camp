const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "campgrounds.json");
const camps = JSON.parse(fs.readFileSync(file, "utf8"));

const precisePins = {
  "orange-mura-auto": [34.9946091, 139.9580305],
  "otaki-kenminnomori": [35.2819895, 140.2317832],
  "otaki-sabo": [35.2570229, 140.2642325],
  "kisarazu-camp-organic": [35.4313203, 139.9036903],
  "morimaki-auto": [35.3911251, 140.0695655],
  "narita-yume-bokujo": [35.8742461, 140.3989986],
  "sengokudai-auto": [35.1920953, 140.1382105],
  "uchiurayama-kenminnomori": [35.1611612, 140.1987883],
  "shimizu-koen-auto": [35.9618567, 139.8491234],
  "futtsu-shiminnomori": [35.1770596, 139.9608903],
  "ohara-kamifuse-auto": [35.2205841, 140.3536048],
  "tachibana-fureai-camp": [35.8125844, 140.5877049],
};

const targetIds = new Set(Object.keys(precisePins));
let updated = 0;

for (const camp of camps) {
  const pin = precisePins[camp.id];
  if (!pin) continue;

  camp.lat = pin[0];
  camp.lng = pin[1];
  delete camp.needsCoord;
  camp.lastVerified = "2026-08-26";

  if (camp.id === "sengokudai-auto") {
    camp.address = "千葉県君津市蔵玉2245-16";
  }

  updated += 1;
}

if (updated !== targetIds.size) {
  throw new Error(`更新件数が一致しません: ${updated}/${targetIds.size}`);
}

const remainingNeedsCoord = camps
  .filter((camp) => camp.prefecture === "千葉" && camp.needsCoord === true)
  .map((camp) => camp.id);

fs.writeFileSync(file, `${JSON.stringify(camps, null, 2)}\n`, "utf8");
console.log(`千葉県の実ピンを${updated}件更新しました。`);
console.log(`千葉県で needsCoord が残るレコード: ${remainingNeedsCoord.length ? remainingNeedsCoord.join(", ") : "なし"}`);
