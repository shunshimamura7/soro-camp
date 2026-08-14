# Manus 第3弾（出力2＝一覧ソースURL集）の評価（2026-08-13）

原本: しゅん経由の PDF（camp_sources_only_round3.pdf）。batch1/2 の記録は同名 md 参照。
**district-sweep の MUNI_SOURCES に登録する候補の選別**が目的。データは変更していない。

## ★最大の発見：山梨東部（大月・都留・上野原）がうちの空白地帯

- データ実績: **大月市 0件 / 上野原市 0件 / 都留市 2件**
- Manus の持ち込み: やまなし観光推進機構「大月・都留エリアのおすすめキャンプ場」**21件**
  `https://www.yamanashi-kankou.jp/special/yamanashicamp/otsuki.html`（住所なし・名前のみ）
  ＋ 大月市公式「宿泊施設・レジャー施設等の紹介」`city.otsuki.yamanashi.jp/kanko/shukuhakusisetu.html`
  （3キャンプ場・住所あり・2025-05-07更新）
- **21件の一覧 vs 実績2件**。district-sweep をこのエリアで回せば MISSING が大量に出るはず。
  牧野でやったのと同じ型で、今回は「掲載漏れの鉱脈」の可能性が高い

## 受領URLの選別

### MUNI_SOURCES に登録する価値あり（新規）

| エリア | URL | 判定 |
|---|---|---|
| 大月市 | city.otsuki.yamanashi.jp/kanko/shukuhakusisetu.html | **L1**（市公式・住所あり・2025-05更新） |
| 大月・都留・上野原 | yamanashi-kankou.jp/special/yamanashicamp/otsuki.html | **L2 nameOnly**（機構・21件・名前のみ） |
| 相模原・愛川・清川 | pref.kanagawa.jp/docs/u5r/cnt/f550/p12621.html | **L2**（県公式・県央BBQ/キャンプ・2026-05-14。愛川4件・清川4件の裏取りに効く） |
| 千葉全域 | pref.chiba.lg.jp/shousupo/sports-shisetsu/r5/11campjo.html | 千葉GO時の**L1**（公営22前後・住所あり・R6-06更新） |
| 千葉全域 | maruchiba.jp/feature/detail_176.html | 千葉GO時の L2（県観光・約20件・住所あり） |
| 南房総市 | cm-boso.com/camp.html | 千葉GO時の **L1**（8件・住所あり） |

### 登録済み or 不要

- e-sagamihara CAMP / 山北町 0000000232 / doshi-kanko.com camp_01 → **既に MUNI_SOURCES にある**
  （Manus が独立に同じ結論に到達＝ソース選定の相互検証になった）
- yamanashicamp/index.html（主要4件+エリアリンク）→ otsuki.html 等の入口ページ。単体登録は不要
- hellonavi「おすすめ15選」→ 編集記事。一覧性はあるが「おすすめ」系は網羅性なし。参考まで
- cm-boso camp2018.html → **2017年のページ**。登録しない（腐ったソースを最初から入れない）
- 静岡: 収穫ゼロだが、**うちは既に静岡の L1 を持っている**（静岡市オクシズ・伊豆市観光ほか）。
  Manus は既存 MUNI_SOURCES を知らないので重複調査になっただけ。実害なし

## 千葉54市町村の確認表について

- **「一覧ページが無い」ことを市町村単位で正直に出してきた**（推測補完なし）。この規律は合格
- 確認できた市町村レベルの一覧は**南房総市だけ**。千葉は「市町村公式の一覧」文化が薄い
- → 千葉GOの場合の設計: L1=県公営一覧+南房総、**残りは jalan（JISコード）/なっぷ（エリア）の
  L2 を市町村ごとに機械生成**する現行パターンで面をカバーするのが現実的
- 母集団ページ: pref.chiba.lg.jp/kouhou/ichiran.html（54市町村・R7-04-15）

## 次のアクション

1. **Claude Code**: MUNI_SOURCES に 大月市（L1+L2）・上野原市/都留市（otsuki.html を共有L2 +
   jalan/なっぷを追加）・県央神奈川の p12621 を登録 → **district-sweep を大月・都留・上野原で実走**
   → MISSING を出す（21件リストとの突き合わせ）。抽出器は実HTMLを見て書く（富士宮の教訓：
   パスやページ名を信じず中身で確認）
2. sweep の MISSING が出たら、候補の実在検証は従来ルート（予約・料金の一次情報）
3. 千葉GOなら上記設計で MUNI_SOURCES-chiba を組む（判断待ち）

## Manus 運用の現在地

- 3回の依頼で: 施設候補34件（新規21）・既存検証11件（修正2）・ソースURL集（今回）
- 規律は回を追って向上（更新日ルール順守・「無い」の明示・推測ゼロ）
- 弱点は不変: 古いページを出典にする / こちらの既存資産を知らない。**選別は必ずこちらでやる**
