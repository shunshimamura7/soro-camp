/**
 * 2026-08-16 の承認済み差分を当てる。
 *
 * **承認された範囲だけを書く。**承認されていないものは
 * 下の `PENDING` に理由つきで残してあり、このスクリプトは触らない。
 *
 * 整形は `JSON.stringify(data, null, 2) + '\n'`。
 * **無変更で往復して sha256 が一致することを確認済み**（元ファイルと同じ整形になる）。
 *
 *   node scripts/apply-fixes-2026-08-16.js --dry    # 差分を出すだけ（既定）
 *   node scripts/apply-fixes-2026-08-16.js --write  # 実際に書く
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write');

/** 承認されていないので**当てない**もの。次に見る人が探さずに済むように残す */
const PENDING = [
  ['akiyamagawa-camp', 'soloComment',
    'アクセス記述の誤り（「JR藤野駅から徒歩20分」→ 実際はバス乗車＋名倉入口下車から徒歩20分）。' +
    '相模原市観光協会の記載で裏は取れているが、2026-08-16 の承認リストに入っていないため保留'],
  ['akiyamagawa-camp', 'features.reservation',
    '"不要" のまま。観光協会22件の対照で【予約方法】欄は要否と相関しないと分かったため変更しない（§下）'],
  ['doshi-no-mori', 'priceMin/priceNote',
    '800円 vs Manus の1,000円。施設公式が403で未確定のため保留'],
  ['granpapa-solo-bocchi', 'name/priceMin',
    '施設公式が403、自治体公式の層が空のため保留'],
];

const EDITS = [
  {
    id: 'takizawaso',
    why: '公式FAQ の総額2,600円。DB の「フリーサイト1,100円」は 2,600-1,200-300 の逆算値と一致していた',
    set: {
      priceMin: 2600,
      // **基準が違う数字を並べない。**旧 3300 が何基準か不明なので落とす
      priceMax: null,
      priceNote:
        '公式FAQ の総額。車1台1人でテント泊 2,600円（内訳: フリーサイト1,200円 + 宿泊施設費300円 + 駐車料）。' +
        '**駐車料は公式に単独表示が無いため、内訳から逆算しない。** 上限は未確認（旧 priceMax 3300 は基準不明のため削除）。' +
        '出典: takizawaen.com 公式FAQ（Manus 経由 2026-08-16。当方は施設公式が403で未読）。旧値 priceMin 1400 / 「施設利用料300円+フリーサイト1,100円〜」',
      priceVerified: false,
      lastVerified: '2026-08-16',
      soloComment:
        '秦野市街から車15分の水無川沿いキャンプ場。フリーサイトは予約不要で思い立ったら行ける手軽さが魅力。' +
        '車1台1人でテント泊2,600円で、場内の露天風呂まで込みなのは悪くない。' +
        '夜の露天風呂から星を眺めながら一人時間を満喫できる。' +
        'フリーサイトへは水無川の一本橋を渡るので、荷物が多いソロは往復の回数を減らす工夫が要る。',
    },
  },
  {
    id: 'doshi-no-mori',
    why: '道志村公式（自治体公式）と電話が食い違う。**tel は変えない**（電話は施設公式が上・§20-3）',
    set: {
      telNote:
        '現地携帯 080-4444-2440 もある。**要確認**: 道志村役場 観光情報サイト（自治体公式）は ' +
        '0554-52-2440 と掲載（2026-08-16 実測）。施設公式 doshinomori.jp が403で三点目を取れていない。' +
        '電話は「施設公式 > 自治体公式」の順で見るため、村公式1本では書き換えない',
    },
  },
  {
    id: 'akiyamagawa-camp',
    why: '料金は MAPPLE（2次情報）。reservation は変えず、要否が未確認であることだけ残す',
    set: {
      priceMin: 2270,
      priceMax: 2270,
      priceNote:
        '区画課金＋人数課金。入場料1,100円＋清掃料60円/人＋駐車料 普通車550円＋サイト使用料1区画560円 ' +
        '→ ソロ1名1泊2,270円（車利用時）。' +
        '**出典: MAPPLE 掲載（2026年1月時点）。一次情報ではない。**' +
        '施設公式 akikawaya.co.jp は403（料金ページ autocamp.html は404）、' +
        '相模原市観光協会・ぐるっと緑区ミドナビとも料金の記載なし（2026-08-16 実測）。' +
        '旧値 2,170円（入場1,050+清掃60+駐車530+サイト530）。' +
        'バンガロー3,900〜29,500円、レイクハウス43,000〜47,300円は旧値のまま未検証',
      priceVerified: false,
      lastVerified: '2026-08-16',
    },
    // features の中に足す
    setFeatures: {
      reservationNote:
        '観光協会は電話予約と記載（相模原市観光協会 042-687-2030 受付9:00〜20:00 / FAX）。' +
        '**テントサイト（12）の要否は未確認。**同協会の22施設を対照したところ【予約方法】欄があるのは3施設だけで、' +
        'DB が「要」の8施設は全て記載なし。**この欄は連絡手段であって要否の根拠にならない**（2026-08-16 実測）',
    },
  },
];

const orig = fs.readFileSync(DATA, 'utf8');
const h = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
console.log(`原本 sha256=${h(orig)} bytes=${orig.length}`);

// **書き換える前に、無変更の往復が同一になることを確かめる**（整形を壊さない保証）
const data = JSON.parse(orig);
const roundtrip = JSON.stringify(data, null, 2) + '\n';
if (roundtrip !== orig) {
  console.error('❌ 無変更の往復で差が出た。整形が保てないので中止する');
  process.exit(1);
}
console.log('往復チェック: ✅ 無変更なら完全一致\n');

let changed = 0;
for (const e of EDITS) {
  const r = data.find(x => x.id === e.id);
  if (!r) { console.error(`❌ ${e.id} が見つからない`); process.exit(1); }
  console.log(`■ ${e.id} — ${e.why}`);
  for (const [k, v] of Object.entries(e.set)) {
    const before = r[k];
    if (JSON.stringify(before) === JSON.stringify(v)) { console.log(`   = ${k}（変化なし）`); continue; }
    console.log(`   - ${k}: ${JSON.stringify(before)}`);
    console.log(`   + ${k}: ${JSON.stringify(v)}`);
    r[k] = v;
    changed++;
  }
  for (const [k, v] of Object.entries(e.setFeatures || {})) {
    const before = r.features ? r.features[k] : undefined;
    if (JSON.stringify(before) === JSON.stringify(v)) { console.log(`   = features.${k}（変化なし）`); continue; }
    console.log(`   - features.${k}: ${JSON.stringify(before)}`);
    console.log(`   + features.${k}: ${JSON.stringify(v)}`);
    r.features[k] = v;
    changed++;
  }
  console.log('');
}

console.log(`変更フィールド ${changed}件\n`);
console.log('— 承認されていないので当てないもの —');
for (const [id, field, why] of PENDING) console.log(`   ${id} / ${field}\n      ${why}`);

const out = JSON.stringify(data, null, 2) + '\n';
console.log(`\n書き込み後 sha256=${h(out)} bytes=${out.length}`);

if (!WRITE) {
  console.log('\n（--dry。**書いていない**。当てるなら --write）');
  process.exit(0);
}
fs.writeFileSync(DATA, out, 'utf8');
console.log('\n✅ 書き込んだ');
