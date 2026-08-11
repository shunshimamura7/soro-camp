/**
 * `nekumasanso-auto` の座標を確定する（2026-08-11）。
 * 記録は scripts/nekumasanso-check-2026-08.md。
 *
 * Googleマップ上で施設が2つに割れていた。
 *   候補A 福士川オートキャンプ場 35.2211908, 138.4768309
 *   候補B 根熊山荘             35.2188515, 138.4770251
 *
 * **候補Aは別施設だった。** 山梨県公式観光ネットが
 * 「福士川根熊山荘ファミリーオートキャンプ場」と「福士川オートキャンプ場」を
 * 別項目として列挙しており、後者は 南部町福士15691-1 / 0556-66-2272 で
 * データの 15854 / 0556-66-3241 と住所も電話も違う。
 *
 * 施設公式は「**民宿福士川根熊山荘の敷地内にあり**」と明記していて、
 * 民宿とキャンプ場は同一敷地・同一連絡先。よって**候補B（民宿のピン）が施設本体**。
 *
 * 候補Aを採ると、名前が似ている別施設の座標を取り込むことになる（§6-18 の型）。
 *
 * 使い方: node scripts/apply-nekumasanso-coord-2026-08.js
 */
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const c = camps.find((x) => x.id === 'nekumasanso-auto');
if (!c) throw new Error('nekumasanso-auto が見つからない');

c.lat = 35.2188515;
c.lng = 138.4770251;
delete c.needsCoord;
c.coordsVerified = true;
// coordsGsiChecked は触らない（apply-gsi-flags.js が入れる）
c.telNote = '予約・お問合せは 070-4168-0207。0556-66-3241 は代表・FAX';

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
const nc = camps.filter((x) => x.needsCoord);
console.log('nekumasanso-auto: 0,0 → 35.2188515,138.4770251（候補B＝根熊山荘。候補Aは別施設）');
console.log(`  needsCoord 残り ${nc.length}件: ${nc.map((x) => x.id).join(', ') || '（なし）'}`);
