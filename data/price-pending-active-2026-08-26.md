# 料金要確認（通常掲載）— 2026-08-26 起票 / 2026-08-27 再生成

`node scripts/list-price-pending-2026-08-26.js` の出力を台帳化したもの。
`status: "active"` かつ `needsPrice: true` の施設。**金額は画面に出していない。**

公式（施設公式・自治体公式・公式予約先）で確認できたものだけ `priceVerified: true` にして金額を戻す。
**予約サイト単独では立てない。** `priceMin` はソロ1名が実際に払う総額（入場料・駐車料・管理費込み）。

| # | slug | 名称 | 公式URL | 状態 |
|---:|---|---|---|---|
| 1 | `tanukiko` | 田貫湖キャンプ場 | https://tanukiko.com/ |  |
| 2 | `aonohara-auto` | 青野原オートキャンプ場 | https://www.aonohara-acl.jp/index.html |  |
| 3 | `miyagase-village` | 宮ヶ瀬ヴィレッジキャンプ場 | https://miyagase-village.com/ |  |
| 4 | `yataro-camp` | 谷太郎キャンプ場清川リバーランド | https://k-riverland.jp/ |  |
| 5 | `pica-sagamiko` | PICAさがみ湖 | https://www.sagamiko-resort.jp/camp/ |  |
| 6 | `usami-shiroyama` | 宇佐美城山公園キャンプ場 | https://www.nap-camp.com/shizuoka/14344 | 予約サイトのみ。一次情報として使えない |
| 7 | `folkwood-yatsugatake` | FOLKWOOD VILLAGE 八ヶ岳 | https://folkwood-camp.com/ |  |
| 8 | `kuragari-camp` | 丹沢湖キャンプサイト | https://tanzawa-camp.sakura.ne.jp/ |  |
| 9 | `kokono-shizuoka` | キャンプ場此処野静岡 | — | 公式URL未特定。まず公式を探す |
| 10 | `sessokyo-camp` | 接岨YANBY OUTDOOR FIELD | — | 公式URL未特定。まず公式を探す |
| 11 | `akiyamagawa-camp` | 秋山川キャンプ場 | http://www.akikawaya.co.jp/ |  |
| 12 | `shizunami-beach-camp` | 静波海岸キャンプサイト | — | 公式URL未特定。まず公式を探す |

計 12件。

## 進め方

1. 1件ずつ、根拠URLと引用箇所を先に示してから書き込む
2. `priceNote` の先頭に課金方式（人数課金 / サイト単位課金 / 区画+人数）を書く
3. 確認できなかったものは `needsPrice: true` のまま。推測で金額を戻さない
4. 料金を直したら `soloComment` も読み直して矛盾を潰す
