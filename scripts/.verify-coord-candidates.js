/**
 * 座標「候補」を、当てる前に国土地理院で検証する（読み取り専用）。
 *
 * **推定で座標を埋めないための道具。**候補は一次情報（施設公式・自治体公式・
 * 県観光協会のマーカー）からしか作らず、ここでは**逆ジオが address と一致するか**だけを見る。
 *
 * ## 判定は `verify-coords-gsi.js` と同じ規則
 *
 * 県 → 市区町村 の順で、`lib/jp-address` の `normalizePref` / `cityCandidates` を**同じように**使う。
 * **規則を2か所に書いているので、片方だけ直すと食い違う**（§18-6）。
 * そのため**当てたあとに必ず本物の `verify-coords-gsi.js` を全件実走して、
 * こちらの判定と一致することを確かめる。**最終的な合否は向こうが決める。
 *
 * ## 閾値を甘くしない
 *
 * **一致とは「逆ジオの市区町村が address に現れること」。**距離では判定しない（§6-15）。
 * ここを緩めると、住所が捏造されているレコードでも座標が「検証済み」になり、
 * **捏造検出そのものが死ぬ。**不一致・判定不能は採用しないで人に戻す。
 *
 *   node scripts/.verify-coord-candidates.js
 */
'use strict';

const { normalizePref, cityCandidates } = require('./lib/jp-address');

const MUNI_URL = 'https://maps.gsi.go.jp/js/muni.js';
const REVERSE_URL = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';
const UA = 'soro-camp-coord-verifier/1.0';

/**
 * 候補。**`source` は「どこから取った数字か」を必ず書く。**
 * `kind` は 'marker'（施設・スポットのピン）か 'viewport'（地図の表示中心）。
 * **viewport は §7-A のとおりピンとは違う。**採用の可否はここで分ける。
 */
const CANDIDATES = [
  {
    slug: 'hadano-togawa-camp',
    lat: 35.404724, lng: 139.169517,
    kind: 'marker',
    source: '神奈川県観光協会「観光かながわNOW」spot/1270 の markerData（"神奈川県立秦野戸川公園【秦野市】"）',
    corroboration: '秦野市観光協会の埋め込み中心 35.40497/139.16730 と約190m差',
  },
  {
    slug: 'wadanagahama-kaigan',
    lat: 35.1897461, lng: 139.6166147,
    kind: 'marker',
    source: '神奈川県観光協会「観光かながわNOW」spot/7159 の markerData（"【三浦市】和田海水浴場"）',
    corroboration: '同ページの Google マップ q= も同値',
  },
  {
    slug: 'mobility-park-izu',
    lat: 35.00833988035657, lng: 139.02138851545863,
    kind: 'viewport',
    source: '施設公式 mobility-park.jp トップの Google マップ埋め込み pb の !3d/!2d',
    corroboration: 'なし（伊豆の国市観光協会・なっぷとも座標を持っていない）',
  },
];

/** 候補が作れなかったもの。**「取れなかった」を空欄にしない** */
const NO_CANDIDATE = [
  ['kabutomushi-mori-camp',
   '一次情報がゼロ。相模原市観光協会の一覧24施設に無く、なっぷ・じゃらんにも該当なし。' +
   '**座標を出している一次情報が存在しない**（ghost-verdict-2026-08.md §11）'],
  ['makioka-fruits-camp',
   '同上。県内に同名施設が無く、完全一致で返るのは千葉県君津市の別施設。' +
   '**山梨市牧丘町牧平3041 を指す一次情報が無い**（同 §10）'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadMuniMap() {
  const res = await fetch(MUNI_URL, { headers: { 'User-Agent': UA } });
  const js = await res.text();
  const map = new Map();
  for (const m of js.matchAll(/GSI\.MUNI_ARRAY\["(\d+)"\]\s*=\s*'([^']*)'/g)) {
    const parts = m[2].split(',');
    map.set(m[1], { pref: parts[1], city: parts[3] });
  }
  return map;
}

async function reverse(lat, lng) {
  const res = await fetch(`${REVERSE_URL}?lat=${lat}&lon=${lng}`, { headers: { 'User-Agent': UA } });
  const j = await res.json();
  return j && j.results ? j.results : null;
}

(async () => {
  const data = require('../data/campgrounds.json');
  const muni = await loadMuniMap();
  console.log('候補の検証（読み取り専用。データは書き換えない）\n');

  const adopt = [];
  const back = [];

  for (const c of CANDIDATES) {
    const rec = data.find((x) => x.slug === c.slug);
    const geo = await reverse(c.lat, c.lng);
    await sleep(500);

    console.log(`■ ${c.slug}`);
    console.log(`   候補   : ${c.lat}, ${c.lng}  [${c.kind}]`);
    console.log(`   出典   : ${c.source}`);
    console.log(`   裏付け : ${c.corroboration}`);
    console.log(`   address: ${rec.address}`);

    if (!geo) {
      console.log('   逆ジオ : 返らない（海上の疑い）→ **戻す**\n');
      back.push([c.slug, '逆ジオが返らない（海上）']);
      continue;
    }
    const m = muni.get(String(geo.muniCd));
    const gsiPref = m ? m.pref : null;
    const gsiCity = m ? m.city : null;
    const oaza = geo.lv01Nm ?? null;
    console.log(`   逆ジオ : ${gsiPref} / ${gsiCity} / ${oaza ?? '—'}`);

    const prefOk = normalizePref(gsiPref) === normalizePref(rec.prefecture);
    const cityOk = prefOk && cityCandidates(gsiCity).some((cand) => (rec.address || '').includes(cand));
    const oazaIn = oaza && oaza !== '−' && (rec.address || '').includes(oaza);

    console.log(`   県一致 : ${prefOk ? 'OK' : '**NG**'} / 市区町村一致: ${cityOk ? 'OK' : '**NG**'}`
      + ` / 大字: ${oaza === '−' || !oaza ? '—' : (oazaIn ? '一致' : '不一致')}`);

    if (!prefOk) { back.push([c.slug, `逆ジオの県（${gsiPref}）が address と違う`]); console.log('   → **戻す**\n'); continue; }
    if (!cityOk) { back.push([c.slug, `逆ジオの市区町村（${gsiCity}）が address に見当たらない`]); console.log('   → **戻す**\n'); continue; }
    if (c.kind !== 'marker') {
      // ★ 検証は通っても、候補が「表示中心」なら採らない。§7-A のとおりピンとは違う数字
      back.push([c.slug, `検証は通るが、候補が地図の**表示中心**でピンではない（${gsiCity}${oaza && oaza !== '−' ? '/' + oaza : ''} まで一致）`]);
      console.log('   → 検証は通ったが **viewport なので採らない。戻す**\n');
      continue;
    }
    adopt.push({ ...c, gsiPref, gsiCity, oaza });
    console.log('   → **採用**\n');
  }

  console.log('── 候補が作れなかったもの ──');
  for (const [slug, why] of NO_CANDIDATE) { console.log(`  ${slug}\n     ${why}`); back.push([slug, '一次情報に座標が無く、候補を作れない']); }

  console.log(`\n採用 ${adopt.length}件 / しゅんに戻す ${back.length}件`);
  for (const a of adopt) console.log(`  採用: ${a.slug}  ${a.lat}, ${a.lng}`);
  for (const [s, w] of back) console.log(`  戻す: ${s} … ${w}`);
})().catch((e) => { console.error('致命的エラー:', e.message); process.exit(1); });
