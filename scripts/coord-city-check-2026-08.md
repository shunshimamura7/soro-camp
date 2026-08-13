# 座標 × address の市区町村チェック（2026-08-13）

`node scripts/verify-coords-gsi.js` の出力。**このスクリプトは data/campgrounds.json を書き換えない。**

## 何が変わったか

`verify-coords-gsi.js` は**都道府県しか比較していなかった**（引き継ぎ §6-11・§17-4-1）。

```js
// 変更前 — これ1行が判定のすべてだった
row.verdict = normalizePref(muni.pref) === normalizePref(camp.prefecture) ? 'OK' : 'PREF_MISMATCH';
```

そのため `yadoriki-camp` は address が「足柄上郡**松田町**寄3048」、逆ジオが「**山北町**」で
市町村が違うのに、**どちらも神奈川県なので OK** を返していた。
`kabutomushi-mori-camp`（神奈川 vs 東京都八王子市）が `PREF_MISMATCH` で拾えていたのは、
**たまたま県境をまたいでいたから**にすぎない。

`lookupMuni()` は市区町村名を**以前から取得して `row.gsiCity` に入れていた。**
判定に使っていなかっただけなので、**追加のAPIリクエストは発生していない。**

## 判定の優先順位

| 判定 | 意味 | `coordsGsiChecked` への影響 |
|---|---|---|
| `PREF_MISMATCH` | 県が違う。**市区町村は見ない** | 外れる（従来どおり） |
| **`CITY_MISMATCH`** | **県は一致するが市区町村が address に見当たらない** | **外れる（今回の変更点）** |
| **`NO_ADDRESS`** | **address が空で、市区町村を照合していない** | **外れる（今回の変更点）** |
| `WARD_MISMATCH` | 政令市の**市は一致し区だけ違う** | **外れない。verdict は OK のまま** |

**`NO_ADDRESS` を OK に含めない理由。**
照合していないものに「機械検証を通過した」フラグが立つのは、
**今回直した穴（県しか見ずに OK を返していた）と同じ構造**になる。
検査が成立しなかったことは、成立して一致したことと区別できなければ意味がない。

**`WARD_MISMATCH` を `CITY_MISMATCH` と同格にしていない理由。**
区の再編が起きると一斉に発生する。実例として `nakatajima-sakyuu-camp` は
2024年の浜松市の区再編で「南区」→「中央区」に変わっている。
再編のたびに `coordsGsiChecked` が大量に落ちるのは、
**座標の正しさが変わっていないのにフラグだけ動く**ということで、検査として意味がない。
区の食い違いは人が見る材料として出すにとどめる。

比較元は **`address` だけ**。`area` は「道志川」「朝霧高原」のような通称なので使えず、
`prefecture` は address と同じ人が同じ推測から書くので突き合わせても意味がない（§6-15）。

## 集計（全 184件）

| 判定 | 件数 |
|---|---|
| `OK` | 173 |
| `CITY_MISMATCH` | 5 |
| `NO_ADDRESS` | 1 |
| `PREF_MISMATCH` | 1 |
| `SEA` | 4 |

うち `WARD_MISMATCH`（OK 扱い）: **0件** ／ address が無く比較できず: **1件**

## CITY_MISMATCH（5件）

**逆ジオが返した市区町村が address のどこにも現れないもの。**
どちらが誤っているか（address か座標か）は**このスクリプトでは決められない。**
`verify-address-gsi.js` の CITY_MISS と同じ性質の候補出し。

| slug | status | address | 逆ジオ（県 / 市区町村 / 大字） | 標高 | `coordsGsiChecked` |
|---|---|---|---|---|---|
| `hadano-togawa-camp` | active | 神奈川県秦野市堀山下1513 | 神奈川県 / **松田町** / 寄 | 424.6m | — |
| `yadoriki-camp` | closed | 神奈川県足柄上郡松田町寄3048 | 神奈川県 / **山北町** / 山北 | 402.4m | — |
| `mobility-park-izu` | active | 静岡県伊豆の国市長者原1445-481 | 静岡県 / **函南町** / 日守 | 163.2m | — |
| `makioka-fruits-camp` | unverified | 山梨県山梨市牧丘町牧平3041 | 山梨県 / **甲州市** / 塩山中萩原 | 1176.7m | — |
| `wadanagahama-kaigan` | active | 神奈川県三浦市初声町和田 | 神奈川県 / **横須賀市** / 長井二丁目 | 1.2m | — |

## WARD_MISMATCH（0件・verdict は OK のまま）

**0件。**区を持つレコードは address 側も区まで正しく書けている。

**この節は0件でも必ず出す。**節ごと消えると「区を検査していない」と区別が付かなくなる。

| slug | status | address | 逆ジオ（県 / 市区町村 / 大字） | 標高 | `coordsGsiChecked` |
|---|---|---|---|---|---|
| （なし） | | | | | |

## NO_ADDRESS（1件）

**address が空で、市区町村の照合そのものが成立しなかったもの。**
**「一致した」ではない。**座標が海上でないことと県が合っていることまでは確認できている。

| slug | status | address | 逆ジオ（県 / 市区町村 / 大字） | 標高 | `coordsGsiChecked` |
|---|---|---|---|---|---|
| `shizunami-beach-camp` | active | （空） | 静岡県 / **牧之原市** / 片浜 | 3.4m | — |

## PREF_MISMATCH（1件・市区町村は見ていない）

| slug | status | address | 逆ジオ（県 / 市区町村 / 大字） | 標高 | `coordsGsiChecked` |
|---|---|---|---|---|---|
| `kabutomushi-mori-camp` | unverified | 神奈川県相模原市緑区牧野4015 | 東京都 / **八王子市** / 南浅川町 | 253.9m | — |

## `apply-gsi-flags.js` を再実行するとどうなるか

**⚠ このレポートの生成時点では実行していない。**`data/campgrounds.json` は変更されていない。

`apply-gsi-flags.js` は `verdict === 'OK'` のものだけに `coordsGsiChecked: true` を立て、
それ以外からはフィールドを削除する。今回 `CITY_MISMATCH` と `NO_ADDRESS` が増えたので、
**再実行すると次の 0件から `coordsGsiChecked` が外れる。**

（該当なし）

**外すかどうかの判断はしていない。**フラグを外すと「機械検証を通っていない」という
シグナルが立つので、先に address と座標のどちらが誤りかを決めるほうが筋が通る場合がある。

あわせて `lib/types.ts` の `coordsGsiChecked` の説明（引き継ぎ §2-5）は
「返ってきた市区町村が `prefecture` と矛盾せず」と書いてあるが、
**実際には市区町村を見ていなかった。**この変更で記述と実装が揃う。
