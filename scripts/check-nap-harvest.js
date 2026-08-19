/**
 * なっぷ収穫（`nap-camp-sitemap.js --harvest`）の**完了判定と健全性検査。**読み取り専用。
 *
 *   node scripts/check-nap-harvest.js                 # 4県ぜんぶ
 *   node scripts/check-nap-harvest.js --pref=yamanashi
 *   node scripts/check-nap-harvest.js --totals        # sitemap の総数だけ（収穫ファイル不要）
 *
 * ## ★ 完了判定は2つ揃って初めて「完了」
 *
 *   1. progress ファイルが `完了 N/N` になっている
 *   2. **収穫ファイルの ID 集合が sitemap の ID 集合と一致する**（残り0 かつ 余り0）
 *
 * **1 だけでは足りない。**進捗の分母は実行開始時に数えた値で、
 * その後に sitemap が増えていれば `N/N` でも取りこぼす。
 * 逆に 2 だけでも足りない（途中終了でも偶然一致することは無いが、
 * **走っている最中に測ると「まだ残りがある」だけで異常と区別が付かない**）。
 *
 * ## 検査項目（千葉 2026-08-19 で効いたものをそのまま持ってきた）
 *
 *   - ID 集合の一致（残り / 余り / 取得率）
 *   - HTTP ステータスの分布（非200 は「取れていない」。0件と読まない）
 *   - name の 空 / 文字化け（U+FFFD）/ **HTML 実体参照が残っているもの**
 *   - address の 空 / 郵便番号の形式 / 緯度経度の欠け
 *   - 完全重複（同一 url / 同一 id）
 *   - **住所の市町村が、その県の市町村一覧に在るか**
 *     （千葉で `CAMPieceかすみがうら`＝茨城の施設が1件混ざっていた。
 *      **県名だけの照合では見つからない**——なっぷは県名を「千葉県」と書いたうえで
 *      茨城の市町村を続けていた）
 *
 * **距離・座標ベースの判定は入れない。**住所の文字列だけで見る。
 *
 * ## ⚠ 市町村一覧はハードコード。**合併があれば腐る**
 *
 * 不一致が出たら「なっぷが間違い」と決めつけず、**まず一覧の鮮度を疑う**こと。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { listIds } = require('./nap-camp-sitemap.js');
const { _internal } = require('./district-sweep.js');
const { splitAddress } = _internal;

const HARVEST_DIR = path.join(__dirname, '.nap-harvest');

/** 表記ゆれの寄せ（**集計側のローカル処理。`VARIANT_CHARS` は触らない**） */
const MUNI_ALIAS = {
  '袖ヶ浦市': '袖ケ浦市', '鎌ヶ谷市': '鎌ケ谷市',   // 千葉
  '茅ケ崎市': '茅ヶ崎市',                          // 神奈川
};
const canonMuni = (m) => (m ? (MUNI_ALIAS[m] || m) : m);

/** 県ごとの市町村一覧（外の事実）。**件数もここから数える。別に書かない**（§18-3） */
const PREF_MUNI = {
  chiba: [
    '千葉市', '銚子市', '市川市', '船橋市', '館山市', '木更津市', '松戸市', '野田市', '茂原市',
    '成田市', '佐倉市', '東金市', '旭市', '習志野市', '柏市', '勝浦市', '市原市', '流山市',
    '八千代市', '我孫子市', '鴨川市', '鎌ケ谷市', '君津市', '富津市', '浦安市', '四街道市',
    '袖ケ浦市', '八街市', '印西市', '白井市', '富里市', '南房総市', '匝瑳市', '香取市',
    '山武市', 'いすみ市', '大網白里市',
    '酒々井町', '栄町', '神崎町', '多古町', '東庄町', '九十九里町', '芝山町', '横芝光町',
    '一宮町', '睦沢町', '長生村', '白子町', '長柄町', '長南町', '大多喜町', '御宿町', '鋸南町',
  ],
  yamanashi: [
    '甲府市', '富士吉田市', '都留市', '山梨市', '大月市', '韮崎市', '南アルプス市', '北杜市',
    '甲斐市', '笛吹市', '上野原市', '甲州市', '中央市',
    '市川三郷町', '早川町', '身延町', '南部町', '富士川町', '昭和町', '西桂町', '富士河口湖町',
    '道志村', '忍野村', '山中湖村', '鳴沢村', '小菅村', '丹波山村',
  ],
  shizuoka: [
    '静岡市', '浜松市', '沼津市', '熱海市', '三島市', '富士宮市', '伊東市', '島田市', '富士市',
    '磐田市', '焼津市', '掛川市', '藤枝市', '御殿場市', '袋井市', '下田市', '裾野市', '湖西市',
    '伊豆市', '御前崎市', '菊川市', '伊豆の国市', '牧之原市',
    '東伊豆町', '河津町', '南伊豆町', '松崎町', '西伊豆町', '函南町', '清水町', '長泉町',
    '小山町', '吉田町', '川根本町', '森町',
  ],
  kanagawa: [
    '横浜市', '川崎市', '相模原市', '横須賀市', '平塚市', '鎌倉市', '藤沢市', '小田原市',
    '茅ヶ崎市', '逗子市', '三浦市', '秦野市', '厚木市', '大和市', '伊勢原市', '海老名市',
    '座間市', '南足柄市', '綾瀬市',
    '葉山町', '寒川町', '大磯町', '二宮町', '中井町', '大井町', '松田町', '山北町', '開成町',
    '箱根町', '真鶴町', '湯河原町', '愛川町', '清川村',
  ],
};
const PREF_LABEL = { chiba: '千葉', yamanashi: '山梨', shizuoka: '静岡', kanagawa: '神奈川' };

const empty = (v) => v === undefined || v === null || String(v).trim() === '';

function inspect(pref, ids) {
  const file = path.join(HARVEST_DIR, pref + '.json');
  const progFile = path.join(HARVEST_DIR, pref + '.progress.txt');
  const all = [...ids].map(String);
  const out = { pref, label: PREF_LABEL[pref] || pref, sitemapTotal: all.length, file };

  if (!fs.existsSync(file)) {
    out.state = 'NOT_STARTED';
    out.progress = fs.existsSync(progFile) ? fs.readFileSync(progFile, 'utf8').trim() : null;
    return out;
  }
  let arr;
  try { arr = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { out.state = 'UNREADABLE'; out.error = e.message; return out; }

  out.progress = fs.existsSync(progFile) ? fs.readFileSync(progFile, 'utf8').trim() : null;
  out.records = arr.length;

  const status = {};
  arr.forEach((r) => { status[r.status] = (status[r.status] || 0) + 1; });
  out.httpStatus = status;

  const ok = arr.filter((r) => r.status === 200);
  const got = new Set(ok.map((r) => String(r.id)));
  out.fetched = got.size;
  out.missing = all.filter((i) => !got.has(i));
  out.extra = [...got].filter((i) => all.indexOf(i) < 0);
  out.rate = all.length ? (got.size / all.length * 100).toFixed(1) + '%' : '—';

  // ★ 完了判定は progress の N/N と ID 集合一致の**両方**
  const progDone = !!(out.progress && /完了\s+(\d+)\/(\d+)/.test(out.progress));
  const idsMatch = out.missing.length === 0 && out.extra.length === 0;
  out.state = progDone && idsMatch ? 'COMPLETE'
    : (!progDone && idsMatch) ? 'IDS_MATCH_BUT_NO_DONE_MARK'
      : (progDone && !idsMatch) ? 'DONE_MARK_BUT_IDS_DIFFER'
        : 'RUNNING_OR_INCOMPLETE';

  out.nameEmpty = ok.filter((r) => empty(r.name)).map((r) => r.id);
  out.nameMojibake = ok.filter((r) => /�/.test(r.name || '')).map((r) => r.id + ':' + r.name);
  out.nameEntity = ok.filter((r) => /&#?\w+;/.test(r.name || '') || /&#?\w+;/.test(r.address || ''))
    .map((r) => r.id + ':' + r.name);
  out.addressEmpty = ok.filter((r) => empty(r.address)).map((r) => r.id);
  out.postalEmpty = ok.filter((r) => empty(r.postalCode)).map((r) => r.id);
  out.postalBadForm = ok.filter((r) => !empty(r.postalCode) && !/^\d{3}-\d{4}$/.test(r.postalCode)).map((r) => r.id + ':' + r.postalCode);
  out.coordBoth = ok.filter((r) => !empty(r.latCandidate) && !empty(r.lngCandidate)).length;
  out.coordHalf = ok.filter((r) => empty(r.latCandidate) !== empty(r.lngCandidate)).map((r) => r.id);
  out.coordNone = ok.filter((r) => empty(r.latCandidate) && empty(r.lngCandidate)).map((r) => r.id + ':' + r.name);

  const byUrl = {}, byId = {};
  ok.forEach((r) => { (byUrl[r.url] = byUrl[r.url] || []).push(r); (byId[r.id] = byId[r.id] || []).push(r); });
  out.dupUrl = Object.keys(byUrl).filter((k) => byUrl[k].length > 1);
  out.dupId = Object.keys(byId).filter((k) => byId[k].length > 1);

  // ★ 県分類の機械照合。軸①=県名 / 軸②=市町村名。**距離も座標も使わない**
  const label = PREF_LABEL[pref];
  out.prefNameMismatch = ok.filter((r) => !empty(r.address) && String(r.address).indexOf(label + '県') !== 0)
    .map((r) => r.id + ' ' + r.name + ' … ' + r.address);
  const list = new Set(PREF_MUNI[pref] || []);
  out.muniTotal = list.size;
  const muniCount = {};
  out.muniMismatch = [];
  ok.forEach((r) => {
    if (empty(r.address)) return;
    const p = splitAddress(r.address);
    const city = p && p.city ? canonMuni(p.city) : null;
    if (!city) { out.muniMismatch.push(r.id + ' ' + r.name + ' … 市町村が取れない: ' + r.address); return; }
    muniCount[city] = (muniCount[city] || 0) + 1;
    if (!list.has(city)) out.muniMismatch.push(r.id + ' ' + r.name + ' … ' + r.address + ' → PREF_MISMATCH');
  });
  out.muniSeen = Object.keys(muniCount).length;
  out.muniCount = muniCount;
  return out;
}

function report(r) {
  const line = (s) => console.log(s);
  line('');
  line('=== ' + r.label + '（' + r.pref + '） ===');
  line('  sitemap 総数: ' + r.sitemapTotal);
  if (r.state === 'NOT_STARTED') { line('  状態: **未着手**（収穫ファイルが無い）'); return; }
  if (r.state === 'UNREADABLE') { line('  状態: **読めない** — ' + r.error); return; }
  line('  状態: ' + r.state + (r.progress ? '   progress: ' + r.progress : ''));
  line('  レコード ' + r.records + ' / 200 で取得 ' + r.fetched + ' / 取得率 ' + r.rate);
  line('  HTTP: ' + JSON.stringify(r.httpStatus));
  line('  残り(sitemapにあって未取得) ' + r.missing.length + ' / 余り(sitemapに無い) ' + r.extra.length);
  if (r.missing.length) line('    残りID(先頭10): ' + r.missing.slice(0, 10).join(','));
  if (r.extra.length) line('    余りID(先頭10): ' + r.extra.slice(0, 10).join(','));
  line('  name 空 ' + r.nameEmpty.length + ' / 文字化け ' + r.nameMojibake.length + ' / 実体参照 ' + r.nameEntity.length);
  if (r.nameMojibake.length) r.nameMojibake.slice(0, 5).forEach((s) => line('    文字化け: ' + s));
  if (r.nameEntity.length) r.nameEntity.slice(0, 5).forEach((s) => line('    実体参照: ' + s));
  line('  address 空 ' + r.addressEmpty.length + ' / 郵便番号 空 ' + r.postalEmpty.length + ' 形式外 ' + r.postalBadForm.length);
  line('  座標 そろい ' + r.coordBoth + ' / 片方だけ ' + r.coordHalf.length + ' / 無し ' + r.coordNone.length);
  line('  重複 同一url ' + r.dupUrl.length + ' / 同一id ' + r.dupId.length);
  line('  県分類 軸①(県名) 不一致 ' + r.prefNameMismatch.length + ' 件');
  r.prefNameMismatch.slice(0, 10).forEach((s) => line('    ' + s));
  line('  県分類 軸②(市町村名 / 一覧 ' + r.muniTotal + ' 市区町村) 不一致 ' + r.muniMismatch.length + ' 件'
    + '   ※出現した市町村 ' + r.muniSeen);
  r.muniMismatch.forEach((s) => line('    ' + s));
}

async function main() {
  const arg = (k) => {
    const a = process.argv.filter((x) => x.indexOf('--' + k + '=') === 0)[0];
    return a ? a.split('=')[1] : null;
  };
  const only = arg('pref');
  const byPref = await listIds();
  const prefs = only ? [only] : ['chiba', 'yamanashi', 'shizuoka', 'kanagawa'];

  console.log('sitemap の県別総数（1リクエストで全国を列挙。列挙できた都道府県 ' + byPref.size + '）');
  for (const p of prefs) console.log('  ' + (PREF_LABEL[p] || p) + '(' + p + '): ' + (byPref.get(p) || new Set()).size);

  if (process.argv.indexOf('--totals') >= 0) return;
  for (const p of prefs) report(inspect(p, byPref.get(p) || new Set()));
}

main().catch((e) => { console.error(e); process.exit(1); });
