/**
 * 名称割れ4件の決着を当てる（2026-08-18・引き継ぎ §7 の持ち越し）。
 *
 * 判定と出典の全文は `scripts/name-split-2026-08-18.md`。
 * 優先順は **自治体公式 > 施設公式 > 予約サイト**（§20-3。名称・住所はこの向き）。
 * ただし **「自治体の一覧が正」ではない**（大月＝旧名のまま / 上野原＝市が正でじゃらんが誤記）
 * ので、4件とも施設側にも当たってから決めている。
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード。**既定は dry run で1バイトも書かない
 * - **照合ガード。**各フィールドの現在値が `from` と完全一致しなければ **その場で中止**。
 *   別のセッションが先に直していたら、黙って上書きせず止まる
 * - **整形ガード。**無変更の往復（parse → stringify）が原本と一致しなければ中止
 * - **書くフィールドは `set` に列挙したものだけ。**status・lat・lng・address・needsCoord は触らない
 *
 *   node scripts/apply-name-fixes-2026-08-18.js                  # dry run（既定）
 *   node scripts/apply-name-fixes-2026-08-18.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');

/** 当てない。理由つきで残す（次に見る人が探し直さずに済むように） */
const PENDING = [
  ['aonohara-auto', 'name',
    '**割れていない。**相模原市観光協会（自治体公式）が「青野原オートキャンプ場」＝DB と一致。' +
    '施設公式の「青野原オートキャンプ場組合」は運営主体名。' +
    'ただし district-sweep が組合名を別バケットで拾って MISSING を水増しする件は未解決（§4-2）'],
  ['camp-baird', 'priceMin/priceVerified',
    '区画使用料が未取得のまま `priceVerified: true` が立っている（§17-3 と同型）。' +
    '施設公式は料金をなっぷに委譲しており、なっぷ側は JS 描画で取れない。' +
    '**電話 0558-73-1225 でしか確定しない。**今回は触らない'],
  ['nagomino-sato-tsuru', 'address',
    '住所3説（DB 戸沢1126 / 都留市観光協会 会員一覧 戸沢874 / 同 L1 詳細 戸沢874-1）。' +
    'ステップ1の副産物。判断待ちなので触らない'],
  ['darumayama-kogen', 'address',
    '大沢1018-1 のままで正しいと決着（ghost-verdict-2026-08.md 末尾）。**変更不要**'],
];

const EDITS = [
  {
    id: 'yataro-camp',
    why: '清川村公式（自治体公式・更新 2026-05-07）の表記に寄せる。施設公式は「清川リバーランド」だが格が下',
    src: 'https://www.town.kiyokawa.kanagawa.jp/soshiki/sangyokanko/sisetu/3837.html',
    set: {
      name: { from: '谷太郎キャンプ場', to: '谷太郎キャンプ場清川リバーランド' },
    },
  },
  {
    id: 'richland-kiyokawa',
    why: '清川村公式（自治体公式・更新 2026-05-07）の表記に寄せる。施設公式は「リッチランド」単独で「法論堂」を使わない',
    src: 'https://www.town.kiyokawa.kanagawa.jp/soshiki/sangyokanko/sisetu/3837.html',
    set: {
      name: { from: 'リッチランドキャンプ場', to: '法論堂キャンプ場リッチランド' },
      // ★ 名称の裏取り中に施設公式が見つかった。住所・電話とも一致するので埋める（§7-17 の手順どおり
      //   「URLを見つけただけで終わらせず開いて施設名と突き合わせた」: 煤ヶ谷4513-1 / 046-288-1031）
      officialUrl: { from: '', to: 'https://www.richland-kiyokawa-camp.com/' },
    },
  },
  {
    id: 'hidamari-yamakita',
    why: '山北町公式（自治体公式）が2ページとも「ひだまりの里」。「オートキャンプ場」は町観光協会・予約サイト側の付加',
    src: 'https://www.town.yamakita.kanagawa.jp/0000000068.html',
    set: {
      name: { from: 'ひだまりの里キャンプ場', to: 'ひだまりの里' },
      // soloComment の「ミカン畑」は**どの一次情報にも無い**。町公式・町観光協会とも料金表の区画名は
      // 「茶畑サイト」。裏の取れない描写を、裏の取れる描写に置き換える（§6-10）
      soloComment: {
        from: '山北町の静かな山間キャンプ場。ミカン畑に囲まれた独特のロケーションで春は花、秋は実りを楽しめる。丹沢湖への入口にあたりトレッキングと組み合わせたソロ旅に最適。静かな渓流沿いで鳥の声が心地よい。',
        to: '山北町の静かな山間キャンプ場。区画は電源サイト・茶畑サイト・芝サイトに分かれ、茶畑越しの眺めが独特。丹沢湖への入口にあたりトレッキングと組み合わせたソロ旅に最適。テニスコートや多目的ホール「ひだまり館」を併設した町の複合施設で、キャンプ場はその一部。町民料金と町外料金があり、町外はやや高い。',
      },
    },
  },
  {
    id: 'yamanakako-misaki',
    why: '自治体公式に該当なし（山中湖観光協会の「泊まる」に無い）ため、次順の施設公式の表記を採る',
    src: 'https://camp.sotosotodays.com/yamanakako-misaki/',
    set: {
      name: { from: 'sotosotodays 山中湖みさき', to: 'sotosotodays CAMPGROUNDS 山中湖みさき' },
      // ★ 名称確認のついでに soloComment の位置表記が誤りだと分かった。
      //   平野2431-2 は山中湖の**北東**（湖で唯一の岬状の地形）。「南岸」は誤り（§6-10・§18-10）
      soloComment: {
        from: 'ゆるキャン△聖地・山中湖南岸の高規格キャンプ場。富士山と山中湖のコラボビューとソロ専用サイトが魅力。ウォシュレット・温水シャワーと設備は充実。ソロ6,000円〜と価格は高めだが都心から約90分のアクセスと湖畔ロケーションで納得感がある。ペダルカヤックレンタルも楽しい。',
        to: 'ゆるキャン△聖地・山中湖北東岸の高規格キャンプ場。山中湖で唯一の岬状の地形にあり、サイトの両側が湖に面している。富士山と山中湖のコラボビューとソロ専用サイトが魅力。ウォシュレット・温水シャワーと設備は充実。ソロ6,000円〜と価格は高めだが都心から約90分のアクセスと湖畔ロケーションで納得感がある。ペダルカヤックレンタルも楽しい。',
      },
    },
  },
];

const orig = fs.readFileSync(DATA, 'utf8');
const h = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
console.log(`原本 sha256=${h(orig)} bytes=${orig.length}\n`);

const data = JSON.parse(orig);

// 整形ガード
if (JSON.stringify(data, null, 2) + '\n' !== orig) {
  console.error('❌ 無変更の往復で差が出た。整形が保てないので中止する');
  process.exit(1);
}
console.log('整形ガード: ✅ 無変更なら完全一致');

// 照合ガード（全件を先に検査してから、1件も書かずに中止できるようにする）
let bad = 0;
for (const e of EDITS) {
  const r = data.find(x => x.id === e.id);
  if (!r) { console.error(`❌ ${e.id} が見つからない`); bad++; continue; }
  for (const [k, v] of Object.entries(e.set)) {
    const cur = r[k] === undefined ? '' : r[k];
    if (cur !== v.from) {
      console.error(`❌ ${e.id}.${k} の現在値が想定と違う`);
      console.error(`   想定: ${JSON.stringify(v.from)}`);
      console.error(`   実際: ${JSON.stringify(cur)}`);
      bad++;
    }
  }
}
if (bad) {
  console.error(`\n照合ガード: ❌ ${bad}件が不一致。**1件も書かずに中止する**`);
  console.error('（別のセッションが先に直した可能性がある。中身を見てから from を直すこと）');
  process.exit(1);
}
console.log('照合ガード: ✅ 全フィールドが想定の現在値と一致\n');

let changed = 0;
for (const e of EDITS) {
  const r = data.find(x => x.id === e.id);
  console.log(`■ ${e.id} — ${e.why}`);
  console.log(`   出典: ${e.src}`);
  for (const [k, v] of Object.entries(e.set)) {
    console.log(`   - ${k}: ${JSON.stringify(v.from)}`);
    console.log(`   + ${k}: ${JSON.stringify(v.to)}`);
    r[k] = v.to;
    changed++;
  }
  console.log('');
}

console.log(`変更フィールド ${changed}件（レコード ${EDITS.length}件）\n`);
console.log('— 当てないもの —');
for (const [id, field, why] of PENDING) console.log(`   ${id} / ${field}\n      ${why}`);

const out = JSON.stringify(data, null, 2) + '\n';
console.log(`\n書き込み後 sha256=${h(out)} bytes=${out.length}`);

if (!WRITE) {
  console.log(ASKED_WRITE
    ? '\n（--force が無い。**書いていない**。当てるなら --write --force）'
    : '\n（dry run。**書いていない**。当てるなら --write --force）');
  process.exit(0);
}
fs.writeFileSync(DATA, out, 'utf8');
console.log('\n✅ 書き込んだ');
