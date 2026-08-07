/**
 * D-2 の精査結果のうち **ADDR_FIXED だけ**を反映する。
 * 記録は scripts/address-check-2026-08.md の「D-2」節。
 *
 * **座標には一切触らない。**座標の反映は目視が要るので別タスク（§7-3 と同じ扱い）。
 * COORD_FIXED / COORD_POINT / BOTH_OK / UNCLEAR はデータを変更しない。
 *
 * 出典は「自治体公式 > 施設公式 > 予約サイト」の順で採った。
 * **アグリゲータ（NAVITIME・タウンページ等）しか出典が無いものは反映していない**
 * （`okumakino-camp` がそれ。UNCLEAR に落とした）。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const fixes = {
  // 神奈川県公式・（公財）神奈川県公園協会。パークセンターの住所は「秦野市堀山下1513」。
  // TEL 0463-87-9020 はデータと一致していた。
  //
  // ★ この1件で takizawaso の誤りの出所が判明した。
  //   takizawaso に入っていた誤住所「堀山下1513」は、**この施設の住所**だった。
  //   §6-4 の借用パターンが住所で起きていて、しかも借用元のほうも別の誤住所を持っていた。
  'hadano-togawa-camp': {
    address: '神奈川県秦野市堀山下1513',
    note: '堀山下777 → 堀山下1513（神奈川県公式・県公園協会）',
  },

  // 富士市公式および施設公式（fujikawa-camp.jp）。正式名称は「野田山健康緑地公園 富士川キャンプ場」。
  // **逆ジオが返していた「中之郷」が正解だった。**address 側が誤っていた takizawaso 型。
  'fujikawa-camp': {
    address: '静岡県富士市中之郷4482-141',
    note: '岩本225-1 → 中之郷4482-141（富士市公式・施設公式）。逆ジオの「中之郷」と一致する',
  },

  // 磐田市観光協会。枝番だけの誤り。
  'ryuyo-marine': {
    address: '静岡県磐田市駒場6866-10',
    note: '駒場6866-1 → 6866-10（磐田市観光協会）',
  },

  // 北杜市公式（明野ふれあいの里）。現在の運営名は「PICA八ヶ岳明野」。
  'akeno-fureai-camp': {
    address: '山梨県北杜市明野町浅尾5260-5',
    note: '明野町浅尾2888 → 浅尾5260-5（北杜市公式）',
  },

  // 浜松市は2024年1月に7区→3区へ再編し、**南区は廃止**されて中央区になった。
  // 区の名前が古いままだと、住所として現在は存在しない表記になる。
  'nakatajima-sakyuu-camp': {
    address: '静岡県浜松市中央区中田島町1313-2',
    note: '南区 → 中央区（2024年1月の区再編で南区は廃止）',
  },

  // 運営（富士観光開発）の公式表記は「鳴沢村字ジラゴンノ8532-5」。
  // 番地は合っていたが大字が抜けており、この検査では NO_OAZA 相当になっていた。
  'fuji-midori-kyuka-auto': {
    address: '山梨県南都留郡鳴沢村字ジラゴンノ8532-5',
    note: '鳴沢村8532-5 → 字ジラゴンノ8532-5（富士観光開発 公式）',
  },
};

let changed = 0;
for (const [slug, { address, note }] of Object.entries(fixes)) {
  const c = data.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug not found: ${slug}`);
  console.log(`ADDR_FIXED  ${slug}`);
  console.log(`            ${c.address}`);
  console.log(`         →  ${address}   （${note}）`);
  c.address = address;
  c.lastVerified = DATE;
  changed++;
}

// soloComment のアクセス記述との矛盾を確認した結果、書き換えが要ったのは1件だけ。
// 他の5件は本文が地名を断定していないか、変更後の住所と矛盾しない。
{
  // 旧: 「日本三大砂丘の一つ・中田島砂丘に隣接したキャンプ場。…浜松からのアクセスが良く…」
  // 区の再編には触れていないので本文の書き換えは不要。ただし**施設の実在に疑いがある**ので
  // 断定を弱める、といった操作はしない（実在の判定は別タスク）。
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${changed}件の address を更新した。座標は1件も触っていない。`);
