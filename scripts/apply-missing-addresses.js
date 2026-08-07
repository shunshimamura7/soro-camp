/**
 * D-3: address が空だった7件のうち6件を埋める（引き継ぎ §7-2）。
 * 記録は scripts/address-check-2026-08.md の「D-3」節。
 *
 * **`shizunami-beach-camp` は埋めない。**`needsVerify: true` が立っていて、
 * 「静波海岸キャンプサイト」という名称の施設が実在しない（静波海岸には別名の施設が3つある）。
 * **実在と正式名称が決まっていない記録に住所を入れると、どれかの施設の住所を借りることになる。**
 * `takizawaso` ← `hadano-togawa-camp` の借用（D-2）と同じ事故を、こちらから作ることになる。
 *
 * 出典は「自治体公式 > 施設公式 > 予約サイト」の順。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const fills = {
  // 道志村観光協会サイト内の施設ページ（料金ページの下部）。前セッションで取得済み。
  'doshigawa-kanko-noen': {
    address: '山梨県南都留郡道志村9240',
    tel: '0554-52-2365',
    src: '道志村観光協会 施設ページ',
  },

  // 山梨県公式観光情報（富士の国やまなし）／道志村役場観光情報サイト。
  'doshi-mori-cottage': {
    address: '山梨県南都留郡道志村7895',
    src: '富士の国やまなし（山梨県公式）／道志村役場観光情報サイト',
  },

  // 施設公式サイトのフッター。
  'camp-akaike': {
    address: '山梨県南都留郡富士河口湖町精進550-127',
    tel: '0555-87-2885',
    src: '施設公式 camp-akaike.jp',
  },

  // 北杜市観光協会。
  // ⚠ 引き継ぎ §7-2 の注意「検索で出る『北杜市高根町村山北割3261』は
  //   北杜市観光協会の所在地の疑い」に該当しないことを確認した。こちらは白州町白須。
  'flora-campsite': {
    address: '山梨県北杜市白州町白須8813-2',
    tel: '0551-45-9164',
    src: '北杜市観光協会',
  },

  // 施設公式サイト（naminokomura.jp）。
  'naminokomura': {
    address: '神奈川県小田原市根府川161',
    tel: '0465-29-0841',
    src: '施設公式 naminokomura.jp',
  },

  // PICA公式のアクセスページ／相模原市観光協会。
  // ⚠ `sagamiko-pleasure-camp` と同じ「若柳1634」になるが、これは借用ではない。
  //   PICAさがみ湖は**さがみ湖MORI MORI（旧プレジャーフォレスト）の敷地内**にあり、
  //   同じ地番を共有している。D-2 で見つけた住所の借用と混同しないこと。
  //   `tel` は触らない。データの 0555-30-4580 は §6-12 で PICA の予約センター番号と
  //   分かっており、差し替え候補（042-685-0917）の出典が地図サービスしか無いため。
  'pica-sagamiko': {
    address: '神奈川県相模原市緑区若柳1634',
    src: 'PICA公式アクセスページ／相模原市観光協会',
  },
};

let changed = 0;
for (const [slug, { address, tel, src }] of Object.entries(fills)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  c.address = address;
  if (tel && !String(c.tel || '').trim()) c.tel = tel;
  c.lastVerified = DATE;
  changed++;
  console.log(`FILLED  ${slug}  ${address}${tel ? ` / ${tel}` : ''}   （${src}）`);
}

{
  const c = data.find((x) => x.slug === 'shizunami-beach-camp');
  console.log(
    `SKIP    shizunami-beach-camp  needsVerify=${c.needsVerify} のため埋めない（実在と正式名称が未確定）`
  );
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${changed}件の address を埋めた。`);
