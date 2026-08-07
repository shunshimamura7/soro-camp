/**
 * E-2c（BORROW_SUSPECT 5グループの精査）と E-3（表記のずれ）の反映。
 * 記録は scripts/address-borrow-2026-08.md の「E-2c」節。
 *
 * **status は1件も変えていない。座標も触っていない。**
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// ── E-2c: 精査で分かったことを needsVerifyNote に足す ──────────
// 5グループとも BORROWED（隣の施設の住所をそのまま使っている）ではなかった。
// **疑わしい側の住所は、隣の施設のものとも、他のどの施設のものとも一致しない。**
// 借用ではなく「どこの住所でもない番地」だった、というのが今回の結論。
{
  const c = data.find((x) => x.slug === 'okumakino-camp');
  c.needsVerifyNote =
    '2026-08-07 調査。相模原市観光協会のキャンプ場一覧に該当名なし https://www.e-sagamihara.com/camp/ 。' +
    '**「奥牧野キャンプ場」の名で NAVITIME・タウンページに出る「牧野12822 / 042-787-0242」は、' +
    '実在する別施設「亀見橋バカンス村」のものだった** https://www.e-sagamihara.com/camp/camp-627/ 。' +
    'データの住所（牧野2108）は、牧野地区の実在施設（バカンス村12822・藤野芸術の家4819）のどれとも一致しない';
  console.log('NOTE  okumakino-camp  「牧野12822/042-787-0242」の正体（バカンス村）を追記');
}
{
  const c = data.find((x) => x.slug === 'kabutomushi-mori-camp');
  c.needsVerifyNote +=
    '。2026-08-07 追調査: データの住所（牧野4015）は牧野地区の実在施設' +
    '（亀見橋バカンス村12822・藤野芸術の家4819）のどれとも一致せず、借用元が特定できない';
  console.log('NOTE  kabutomushi-mori-camp  借用元が特定できないことを追記');
}
{
  const c = data.find((x) => x.slug === 'nanasawa-camp');
  c.needsVerifyNote +=
    '。2026-08-07 追調査: 七沢657 は七沢温泉郷の実在施設（七沢荘・福元館ほか）のどの番地とも一致せず、' +
    '同じ大字の tiny-camp-village（七沢1854）からの借用でもない';
  console.log('NOTE  nanasawa-camp  借用ではないことを追記');
}
{
  const c = data.find((x) => x.slug === 'yadoriki-camp');
  c.needsVerifyNote +=
    '。2026-08-07 追調査: 寄3048 は寄地区の実在施設（やどりきテラス 寄3415・松田町寄自然休養村 寄4380-1・' +
    '蜂花苑ミロク 寄7138）のどの番地とも一致せず、借用元が特定できない';
  console.log('NOTE  yadoriki-camp  借用元が特定できないことを追記');
}

// ── E-3: 表記のずれ ────────────────────────────────────────
{
  // D-2 で正式名称が「野田山健康緑地公園 富士川キャンプ場」と判明していた。
  const c = data.find((x) => x.slug === 'fujikawa-camp');
  c.name = '野田山健康緑地公園 富士川キャンプ場';

  // ⚠ soloComment が丸ごと成り立たなくなっていた。
  //   旧: 「**富士川河川敷**のキャンプ場。…富士川の大きな流れを眼前に…**河川敷の解放感**が
  //         ソロキャンプの醍醐味。」
  //   D-2 で address を 岩本225-1（富士川沿い）→ 中之郷4482-141 に直したが、
  //   **保存されている座標の標高は 496.9m**（国土地理院）で、河川敷ではなく野田山の高台。
  //   公式もサイト種別に「高台オートサイト」「展望オートサイト」を持ち、
  //   「日本一高い山と日本一深い海の間のキャンプ場」を掲げている。
  //   **soloComment は誤った旧住所のほうに合わせて書かれていた。**
  c.soloComment =
    '富士川西岸・野田山の高台にある富士市の公園内キャンプ場で、標高は約500m。' +
    '「日本一高い山と日本一深い海の間」を掲げるとおり、富士山と駿河湾の両方を見渡せる。' +
    '全サイトで焚き火ができ、展望オートサイトからの眺めが目当てになる。' +
    '2025年9月に区画が約1.5倍へ拡張された。無料Wi-Fiあり。';
  c.lastVerified = DATE;
  console.log('NAME  fujikawa-camp  → 野田山健康緑地公園 富士川キャンプ場（soloComment の「河川敷」も訂正）');
}

// komeidoso-auto は name が既に「湖明荘オートキャンプ場」で正しかった。
// ずれているのは **slug のほう**（komeidoso ＝「古明地荘」の読み）。
// slug を変えると URL が変わって既存リンクが切れるので変えない。
{
  const c = data.find((x) => x.slug === 'komeidoso-auto');
  if (c.name !== '湖明荘オートキャンプ場') throw new Error('前提が変わっている');
  console.log('SKIP  komeidoso-auto  name は既に正しい（ずれているのは slug。URL維持のため変えない）');
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('\n反映完了。status も座標も変更していない。');
