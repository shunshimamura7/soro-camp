# IN_DATA なのに突合相手と番地が違うもの — 2026-08

> **⚠ この検査は半分が無害。全部人が見る前提。**
> **素の一覧7件のうち4件は表記ゆれで同一施設だった（誤検出率 4/7 ≒ 57%・2026-08-15 実測）。**
> 無害の型が分かったので下に分けてあるが、**寄せる規則自体が間違っている可能性があるので消していない。**
>
> **さらに、残った3件を人が当たったら1件（`朝霧CampBaseそらいろ`）も誤検出だった。**
> 公式サイト（sorairo-camp.jp）の住所は `麓624-7` でレコードと一致し、**ソース側（hinata）の
> `麓朝霧610` が誤り**だった。電話番号は一致。**通しの誤検出率は 5/7。**
> **この検査は「別施設だ」と言っていない。「番地が食い違っている」としか言っていない。**

実行: 2026-08-15 10:06:37　/　`node scripts/banchi-mismatch-check.js`
対象: 76地区 / 18市町村

**これは判定ではない。**`status` も `IN_DATA`/`MISSING` も1件も変えていない。
`district-sweep.js` の `ORPHAN` と同じ扱いで、**単独で判断材料にしない。**
ここに出たから別施設、出ないから同一施設、のどちらでもない。

**大字は同じで番地だけ違う型が本命。**§19-6 の `ペンギン村` はこれで、
大字（猪之頭）で比べると0件になる。**番地まで見て初めて出る。**

| | 件数 |
|---|---:|
| 素の一覧 | 7 |
| **人が見る（無害の型に当てはまらない）** | **3** |
| 無害に寄せた（表記ゆれ・枝番） | 4 |

## 1. 大字が違う（人が見る）

**大字が違うほうが疑わしい。**ただし実測では、大字違いでも `道志村` 対 `道志村長又` のように**ソース側が大字を書いていないだけ**のことがある。番地で無害と判定できたものは §3 に寄せてある。

| 地区 | バケット | 突合したレコード | レコードの番地 | ソース側の番地 | 大字 |
|---|---|---|---|---|---|
| 富士宮市麓 | 朝霧CampBaseそらいろ | `sorairo` 朝霧Camp Base そらいろ | 麓624-7 | 麓朝霧610 | **違う** |

- **朝霧CampBaseそらいろ** — バケットの別名: 朝霧CampBaseそらいろ
  - hinata-spot https://camp-spot.hinata.me/spots/asagiri-camp-bese-sorairo

## 2. 大字は同じで番地が違う（人が見る）

**§19-6 の型はここ。**同じ大字の中の別施設が名前で突合している可能性がある。

| 地区 | バケット | 突合したレコード | レコードの番地 | ソース側の番地 | 大字 |
|---|---|---|---|---|---|
| 伊東市池 | 伊豆高原テントリゾート | `izukogen-auto` 伊豆高原オートキャンプ場 | 池672 | 池614-171 / 池614-168 | 同じ |
| 富士宮市猪之頭 | ペンギン村オートキャンプ場 | `asagiri-greenpark-camp` 朝霧高原グリーンパーク | 猪之頭1050 | 猪之頭2351 / 猪之頭2071 / 猪之頭1114-1 | 同じ |

- **伊豆高原テントリゾート** — バケットの別名: 伊豆高原テントリゾート
  - jalan https://www.jalan.net/kankou/spt_guide000000218739/
  - hinata-spot https://camp-spot.hinata.me/spots/izukogen-tentresort
- **ペンギン村オートキャンプ場** — バケットの別名: ペンギン村オートキャンプ場 / 朝霧高原ペンギン村オートキャンプ場 / 朝霧高原オートキャンプ場 / 朝霧高原もちやキャンプ場
  - fujinomiya-kankou https://fujinomiya.gr.jp/guide/223/
  - fujiyama-navi https://www.fujiyama-navi.jp/spots/AlmtQ
  - fujiyama-navi https://www.fujiyama-navi.jp/spots/G2qn2
  - fujiyama-navi https://www.fujiyama-navi.jp/spots/aBwyE
  - jalan https://www.jalan.net/kankou/spt_guide000000198771/
  - jalan https://www.jalan.net/kankou/spt_22207ca3430054727/
  - hinata-spot https://camp-spot.hinata.me/spots/penguin-mura
  - hinata-spot https://camp-spot.hinata.me/spots/asagirikogen
  - hinata-spot https://camp-spot.hinata.me/spots/mochiya
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/page/2/
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/page/3/
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/page/4/
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/page/5/
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/page/6/
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/page/7/
  - japancamp https://japancamp.jp/camp_area/22-shizuoka/page/8/

## 3. 無害に寄せたもの（消していない）

**同一施設でよく出る2つの型だけを無害とした。**

| 型 | 例 |
|---|---|
| 番地が完全一致（大字の表記だけ違う） | `平久保2124` と `平久保山2124` |
| ハイフン境界の包含（枝番の有無） | `8813` と `8813-2` / `807` と `807-2` |

**「近い数字」は無害にしない。**`624-7` と `610`、`672` と `614-171` は別の番地。

| 地区 | バケット | 突合したレコード | レコードの番地 | ソース側の番地 |
|---|---|---|---|---|
| 南都留郡道志村 | とやの沢キャンプ場 | `toyanosawa` とやの沢キャンプ場 | 長又12704 | 12704 / 12433 |
| 北杜市白州町上教来石平久保 | ヴィレッヂ白州 | `village-hakushu` ヴィレッヂ白州 | 白州町上教来石平久保2124 | 白州町上教来石平久保山2124 |
| 相模原市緑区青根 | 青根キャンプ場 | `aone` 青根キャンプ場 | 青根807 | 青根807-2 |
| 北杜市白州町白須 | FLORA Campsite in the Natural Garden | `flora-campsite` 白州・尾白 FLORA Campsite in the Natural Garden | 白州町白須8813-2 | 白州町白須8813 |

## 4. 自己診断（答えが分かっている入力）

**両方向で見る。**片側だけだと、規則が効きすぎても効かなすぎても気づけない（§18-3）。

| 期待 | 結果 |
|---|---|
| ペンギン村（猪之頭2351等 vs 1050）が**疑わしい側**に出る | ✅ PASS |
| ペンギン村が無害側に落ちていない | ✅ PASS |
| 青根（807 vs 807-2）が**無害側**に寄っている | ✅ PASS |
| 青根が疑わしい側に残っていない | ✅ PASS |

> ✅ 両方向とも通った。
