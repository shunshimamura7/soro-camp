/**
 * 門を通った千葉の候補を掲載する（2026-10-06・並列調査の第1弾）。
 *
 *   node scripts/apply-gate-additions-2026-10-06.js                  # dry run
 *   node scripts/apply-gate-additions-2026-10-06.js --write --force  # 実際に書く
 *
 * ## 機械が持ってきた分と人が書く分を分ける
 *
 * 施設名・住所・料金・設備・URL・座標は `scripts/gate-additions-2026-10-06.json`（台帳）から取る。
 * **台帳の値は公式の引用と根拠URLが付いたものだけ**で、merge-gate が照合して残したもの。
 *
 * ここで人が書くのは `EDIT` の 4 つだけ。
 *
 *   slug  … URL になる識別子
 *   area  … 一覧の地域ラベル（既存の千葉の area 表記に合わせる）
 *   soloComment … ソロ目線の紹介文。**台帳の根拠から逸脱しないこと**
 *   cautions … 予約前に知っておくべき落とし穴。料金の内訳・別途費用・座標未取得などを書く
 *
 * ## ガード（1つでも引っかかったら書かずに止まる）
 *
 *   1. `--write` と `--force` の両方が必要
 *   2. EDIT の napId が台帳に無い／台帳に EDIT の無い napId がある
 *   3. slug が既存レコードと衝突する
 *   4. `priceMin` / `priceMax` が整数でない
 *      … `priceMax` は非必須フィールドではないので、欠けると詳細ページのビルドが落ちる（実際に落ちた）
 *   5. 公式の住所に台帳の市町村名が入っていない
 *      … 他県の同名施設を拾う事故が実際に起きている
 *   6. 無変更の往復が原本と一致しない（改行コードを含む整形のずれ）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'campgrounds.json');
const LEDGER = path.join(__dirname, 'gate-additions-2026-10-06.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');
const TODAY = '2026-10-06';
const NEUTRAL = { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 };

/** 人が書く分。キーは napId */
/** 人が書く分（slug / area / soloComment / cautions）。キーは napId。**JSON に分離してある** */
const EDIT = JSON.parse(fs.readFileSync(path.join(__dirname, 'gate-edit-2026-10-06.json'), 'utf8'));;

// ── ここから下は機械処理 ────────────────────────────────────────────────────
const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const byId = new Map(ledger.map((r) => [String(r.napId), r]));

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);
if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない（整形が想定と違う）');
  process.exit(1);
}
const existingSlugs = new Set(list.map((c) => c.slug));

const norm = (s) => String(s || '').normalize('NFKC').replace(/ヶ/g, 'ケ').replace(/\s+/g, '');
const stop = (msg) => { console.error('中止: ' + msg); process.exit(1); };

// 台帳は束が返るたびに増えるので、**まだ掲載していない分だけ** EDIT を求める。
// 既に掲載済みかどうかは施設名で見る（slug は EDIT 側にしか無いため）。
const existingNames = new Set(list.map((c) => c.name));
const pending = [...byId.keys()].filter((id) => !existingNames.has(byId.get(id).name));
for (const id of pending) if (!EDIT[id]) stop(`台帳の napId ${id}（${byId.get(id).name}）に EDIT が無い`);
for (const id of Object.keys(EDIT)) if (!byId.has(id)) stop(`EDIT の napId ${id} が台帳に無い`);
const skipped = [...byId.keys()].filter((id) => existingNames.has(byId.get(id).name));
if (skipped.length) console.log(`既に掲載済みとして飛ばす: ${skipped.length} 件
`);

const FEATURE_NOTE = {
  bath: 'bathNote', shower: 'showerNote', firewood: 'firewoodNote',
  shop: 'shopNote', pet: 'petNote',
};

const added = [];
for (const [id, edit] of Object.entries(EDIT)) {
  const r = byId.get(id);
  if (existingNames.has(r.name)) continue;   // もう掲載してある

  if (existingSlugs.has(edit.slug)) stop(`slug が既存と衝突: ${edit.slug}`);
  if (!Number.isInteger(r.priceMin) || !Number.isInteger(r.priceMax)) {
    stop(`料金が整数でない: ${r.name}（min=${r.priceMin} max=${r.priceMax}）`);
  }
  if (r.priceMax < r.priceMin) stop(`priceMax < priceMin: ${r.name}`);
  if (r.muni && !norm(r.address).includes(norm(r.muni))) {
    stop(`公式住所に市町村名「${r.muni}」が無い: ${r.name} / ${r.address}`);
  }

  // 設備。台帳にある（＝引用と根拠URLが付いた）ものだけを入れる
  const features = { reservation: '要' };
  for (const [k, noteKey] of Object.entries(FEATURE_NOTE)) {
    const v = (r.features || {})[k];
    if (!v || (v.value !== true && v.value !== false)) continue;
    features[k] = v.value;
    features[noteKey] = `${v.quote}（${v.evidenceUrl}）`;
  }
  const on = (r.features || {}).nearbyOnsen;
  if (on && typeof on.value === 'string' && on.value.trim()) {
    features.nearbyOnsen = `${on.value.trim()}（${on.evidenceUrl}）`;
  }
  if (r.reservationUrl) features.reservationNote = `公式が案内する予約先: ${r.reservationUrl}`;

  const coord = r.coordsFromOfficialMap;
  const rec = {
    id: edit.slug,
    slug: edit.slug,
    name: r.name,
    prefecture: '千葉',
    area: edit.area,
    status: 'active',
    address: r.address,
    type: 'campground',
    lat: coord ? Number(coord.lat) : 0,
    lng: coord ? Number(coord.lng) : 0,
    ...(coord ? {} : { needsCoord: true }),
    priceMin: r.priceMin,
    priceMax: r.priceMax,
    priceNote: r.priceNote,
    features,
    scores: { ...NEUTRAL },
    scoresVerified: false,
    season: '要確認（公式に営業期間の記載を確認できていない）',
    soloComment: edit.soloComment,
    tel: null,
    telNote: null,
    lastVerified: TODAY,
    priceVerified: true,
    officialUrl: r.officialUrl || null,
    reservationUrl: r.reservationUrl || null,
    cautions: [
      ...edit.cautions,
      ...(coord ? [] : []),
    ],
    source: [r.officialUrl, r.reservationUrl].filter(Boolean),
  };
  // 座標が公式地図から取れたものは coordsVerified を立てない（機械検証は別途）
  if (coord) rec.coordsVerified = false;

  added.push(rec);
}

console.log(`${WRITE ? '書込' : 'dry '} 門を通った千葉の候補を掲載\n`);
for (const r of added) {
  console.log(`  + ${r.slug.padEnd(26)} ${r.name}`);
  console.log(`      ${r.area} / ${r.priceMin}〜${r.priceMax}円 / 座標${r.needsCoord ? '未取得' : `${r.lat.toFixed(5)},${r.lng.toFixed(5)}`} / 注意${r.cautions.length}件`);
}
const withCoord = added.filter((r) => !r.needsCoord).length;
console.log(`\n  ${added.length} 件（座標あり ${withCoord} / 未取得 ${added.length - withCoord}）`);
console.log(`  千葉の active キャンプ場: ${list.filter((c) => c.prefecture === '千葉' && c.status === 'active' && c.type !== 'wild').length} → ${list.filter((c) => c.prefecture === '千葉' && c.status === 'active' && c.type !== 'wild').length + added.length}`);

if (!WRITE) {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
  process.exit(0);
}

list.push(...added);
fs.writeFileSync(DATA, serialize(list));
console.log(`\n書き込んだ: ${added.length} 件`);
