# 地区スイープ: 相模原市中央区水郷田名

> ⛔ **案C以降このファイルは再生成されない。**
> 2026-08-16 時点の**大字単位**の記録として残してある（案Cで地区は市町村単位＝18本になる）。
> **消さない理由**: §5 の突合で使ったばかりで鮮度行も入っており、
> **消すと案C前後の比較ができなくなる**（`scripts/baseline-before-planc-2026-08-16.md` と対で読む）。
> 案C後の地区 md は `sweep-<市町村>.md` の18本。**こちらの数字を現況として引用しないこと。**


実行: 2026-08-15 11:48:22　/　`node scripts/district-sweep.js --district "相模原市中央区水郷田名"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-15 20:27:38

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **0** |
| IN_DATA（両方にある） | 0 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 1 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 相模原市観光協会 キャンプ場一覧 | OK | 22 | 0 |  |
| L1 | 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | OK | 17 | 0 |  |
| L2 | 神奈川県公式 県央地域のバーベキュー・キャンプ | OK | 4 | 0 | 実測4件（相模原2 / 海老名1 / 愛川1）。本文の表は他団体の一覧へのリンク集で施設ではない |
| L2 | なっぷ kanagawa/sagamihara | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 18 | 0 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_141510000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_141510000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 相模原（kanto/kanagawa/1906） | OK | 29 | 0 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）神奈川県 | OK | 69 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/14-kanagawa/page/4/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/5/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/6/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/7/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/8/ → HTTP_404 |
| L3 | ウォーカープラス 神奈川県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（神奈川） | **L1_NOT_FOUND** | – | – | 神奈川県オープンデータカタログ（catalog.opendata.pref.kanagawa.jp）に観光施設一覧のデータセット無し。「観光」で該当3件はいずれも調査統計 |

取得したページ:

- `L1` https://www.e-sagamihara.com/camp/ → 200（キャッシュ）
  - 詳細ページ 22 件（住所の取得のため）
- `L1` https://midori.city.sagamihara.kanagawa.jp/category/play/camp/ → 200（キャッシュ）
- `L1` https://midori.city.sagamihara.kanagawa.jp/category/play/camp/page/2/ → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
- `L2` https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/p12621.html → 200（キャッシュ）
  - 詳細ページ 4 件（住所の取得のため）
- `L2` https://www.nap-camp.com/kanagawa/sagamihara/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/kanagawa/sagamihara/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/page_3/ → 404
  - 詳細ページ 18 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list?page=3 → 200（キャッシュ）
  - 詳細ページ 29 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/2/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/3/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/4/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/5/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/6/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/7/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/8/ → 404
- `L3` https://www.walkerplus.com/spot_list/ar0314/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

この地区では出なかった。**ただし「掲載漏れが無い」という意味ではない**（上の限界を参照）。

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 相模原市観光協会 キャンプ場一覧 | 22 | 12 | 10 | 83% | ogurabashi-kasenjiki, takadabashi-kasenjiki |
| 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | 17 | 12 | 8 | 67% | aone, ogurabashi-kasenjiki, takadabashi-kasenjiki, fujino-art-camp |

## ORPHAN — データにあるが、どのソースにも出てこない

網羅率 70% 以上の L1 があるので、**判定として読める**。
ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `takadabashi-kasenjiki` | 高田橋多目的広場 | 神奈川県相模原市中央区水郷田名4-11-23 | active |  |

## IN_DATA — 両方にある

なし。

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **6** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 25 件 | **61** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 0 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 相模原市観光協会 キャンプ場一覧 | 22 | 0 | 0 | 1 | 21 | OK |
| 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | 17 | 0 | 0 | 0 | 17 | OK |
| 神奈川県公式 県央地域のバーベキュー・キャンプ | 4 | 0 | 0 | 2 | 2 | OK |
| なっぷ kanagawa/sagamihara | 20 | 0 | 0 | 6 | 14 | OK |
| じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） | 18 | 0 | 0 | 0 | 18 | OK |
| hinata スポット 相模原（kanto/kanagawa/1906） | 29 | 0 | 0 | 0 | 29 | OK |
| キャンナビ（japancamp.jp）神奈川県 | 69 | 0 | 0 | 0 | 69 | OK |
| ウォーカープラス 神奈川県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）6 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 夕暮れ迫る黄昏の時間を楽しむ “Twilight SAGAMIHARA” | L1 e-sagamihara | 一覧に住所が無い | https://www.e-sagamihara.com/camp/camp-2897/ |
| ウエインズパーク海老名 | L2 pref-kanagawa-kenou | 一覧に住所が無い | https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/tabi-172.html |
| 県立愛川ふれあいの村 | L2 pref-kanagawa-kenou | 一覧に住所が無い | https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/tabi-104.html |
| MAMURO CAMP BASE | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/sagamihara/list |
| 宮ヶ瀬ヴィレッジ【Miyagase Village】 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/sagamihara/list |
| 里楽巣 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/sagamihara/list |

#### b1-2 — 詳細ページの取得に失敗して住所が取れなかった

**これは直せる可能性がある。**`fetchPage` は成功したものしかキャッシュしないので、
失敗した詳細ページは毎回取りに行って毎回失敗する。URL が生きているか確認すること。

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b2-a — 住所の市区町村が、この地区の市区町村と違う

**ここだけが「住所が誤っている」疑いの対象。**ただし市単位のソースが
広域を含んでいるだけのこともある（じゃらんは市全体、キャンナビは県全体）。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| 清川リバーランド | 神奈川県愛甲郡清川村煤ヶ谷2450 | L2 nap-camp / L2 hinata-spot |
| リッチランド | 神奈川県愛甲郡清川村煤ヶ谷4513-1 | L2 hinata-spot |
| 服部牧場 | 神奈川県愛甲郡愛川町半原6087 | L2 hinata-spot |
| 田代運動公園 | 神奈川県愛甲郡愛川町田代339 | L2 hinata-spot |
| 唐沢キャンプ場 | 神奈川県愛甲郡清川村宮ヶ瀬1700 | L2 hinata-spot |
| 長者屋敷キャンプ場 | 神奈川県愛甲郡清川村宮ケ瀬1644-1 | L2 hinata-spot |
| ウェルキャンプ西丹沢 | 足柄上郡山北町中川868 | L3 japancamp |
| BOSCO Auto Camp Base | 秦野市丹沢寺山75 | L3 japancamp |
| BIOTOPIA autocamp | 神奈川県足柄上郡大井町山田300 | L3 japancamp |
| Fun Space芦ノ湖キャンプ村レイクサイドヴィラ | 足柄下郡箱根町元箱根164 | L3 japancamp |
| 西丹沢 大滝キャンプ場 | 神奈川県足柄上郡山北町中川879−4 | L3 japancamp |
| 西丹沢マウントブリッジキャンプ場 | 足柄上郡山北町中川867-7 | L3 japancamp |
| 滝沢園キャンプ場 | 秦野市戸川1445 | L3 japancamp |
| 【閉鎖中】ウッディハウス玄倉 | 足柄上郡山北町玄倉492-1 | L3 japancamp |
| 奥箒沢山の家 | 足柄上郡山北町中川825-1 | L3 japancamp |
| 西丹沢中川ロッヂ | 足柄上郡山北町中川897-111 | L3 japancamp |
| ひだまりの里オートキャンプ場 | 足柄上郡山北町神縄438 | L3 japancamp |
| 山北町立河内川ふれあいビレッジ | 足柄上郡山北町湯触322-1 | L3 japancamp |
| リッチランド | 愛甲郡清川村煤ケ谷4513-1 | L3 japancamp |
| ひだまりの里オートキャンプ場 | 神奈川県足柄上郡山北町 | L3 walkerplus |
| なみのこ村 | 神奈川県小田原市 | L3 walkerplus |
| 清川リバーランド | 神奈川県愛甲郡清川村 | L3 walkerplus |
| 滝沢園キャンプ場 | 神奈川県秦野市 | L3 walkerplus |
| キャンプ＆スパ 山の音 | 神奈川県足柄下郡箱根町 | L3 walkerplus |
| 長井海の手公園 ソレイユの丘・キャンプ場 The CLIFF CAMP&BBQ | 神奈川県横須賀市 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| 【市営】上大島キャンプ場 | 神奈川県相模原市緑区大島3657 / 相模原市緑区大島3657 / 相模原市緑区大島3657番地 / 神奈川県相模原市緑区大島3657付近 | L1 e-sagamihara / L1 midori-navi / L2 pref-kanagawa-kenou / L2 jalan / L2 hinata-spot |
| 【市営】望地弁天キャンプ場 | 神奈川県相模原市中央区田名5835-16 / 相模原市中央区田名5835-16 | L1 e-sagamihara / L2 pref-kanagawa-kenou / L2 hinata-spot |
| 青野原オートキャンプ場 | 神奈川県相模原市緑区青野原918-1 / 神奈川県相模原市緑区青野原918-2 / 相模原市津久井町青野原918-2 | L1 e-sagamihara / L2 jalan / L2 hinata-spot / L3 japancamp |
| 青野原 野呂ロッジキャンプ場 | 神奈川県相模原市緑区青野原931-1 / 相模原市緑区青野原931 / 神奈川県相模原市緑区青野原931 | L1 e-sagamihara / L1 midori-navi / L2 nap-camp / L2 jalan / L3 japancamp |
| 秋山川キャンプ場 | 神奈川県相模原市緑区名倉25 / 相模原市緑区名倉25 / 相模原市藤野町名倉25 | L1 e-sagamihara / L1 midori-navi / L2 nap-camp / L2 jalan / L2 hinata-spot / L3 japancamp |
| 音久和キャンプ場 | 神奈川県相模原市緑区青根2861-2 / 相模原市緑区青根2861-2 | L1 e-sagamihara / L1 midori-navi / L2 jalan / L2 hinata-spot |
| 神之川キャンプ・マス釣り場 | 神奈川県相模原市緑区青根3685 / 相模原市緑区青根3685 | L1 e-sagamihara / L1 midori-navi |
| このまさわキャンプ場 | 神奈川県相模原市緑区青根2745 / 相模原市緑区青根2745 / 相模原市津久井町青根2745 | L1 e-sagamihara / L1 midori-navi / L2 nap-camp / L2 jalan / L2 hinata-spot / L3 japancamp |
| 此の間沢渓流園 | 神奈川県相模原市緑区青根2510-3 / 相模原市緑区青根2510-3 / 神奈川県相模原市緑区青根2510 | L1 e-sagamihara / L1 midori-navi / L2 jalan / L2 hinata-spot |
| 相模湖休養村キャンプ場 | 神奈川県相模原市緑区寸沢嵐3574 / 相模原市緑区寸沢嵐3574 / 神奈川県相模原市相模湖町寸沢嵐3574 / 相模原市相模湖町寸沢嵐3574 | L1 e-sagamihara / L1 midori-navi / L2 nap-camp / L2 jalan / L2 hinata-spot / L3 japancamp |
| 相模湖 日相園 | 神奈川県相模原市緑区日連754 | L1 e-sagamihara |
| 新戸キャンプ場 | 神奈川県相模原市緑区寸沢嵐2362 / 相模原市緑区寸沢嵐2362 / 相模原市相模湖町寸沢嵐2362 | L1 e-sagamihara / L1 midori-navi / L2 jalan / L2 hinata-spot / L3 japancamp |
| 高瀬野キャンプ場 | 相模原市緑区青根3297 / 神奈川県相模原市緑区青根3297 | L1 e-sagamihara / L2 hinata-spot |
| 桐花園 | 神奈川県相模原市緑区佐野川1822 / 相模原市緑区佐野川1822 / 相模原市藤野町佐野川1822 | L1 e-sagamihara / L1 midori-navi / L2 nap-camp / L2 jalan / L2 hinata-spot / L3 japancamp |
| バカンス村 | 神奈川県相模原市緑区牧野12822 / 相模原市緑区牧野12822 | L1 e-sagamihara / L1 midori-navi / L2 jalan / L2 hinata-spot |
| PICAさがみ湖 | 神奈川県相模原市緑区若柳1634 (相模湖MORIMORI内) / 神奈川県相模原市緑区若柳1634番地 / 神奈川県相模原市緑区若柳1634 / 相模原市緑区若柳1634番地相模湖リゾートプレジャーフォレスト内 | L1 e-sagamihara / L2 jalan / L2 hinata-spot / L3 japancamp |
| 日比谷花壇のSTAY「里楽巣FUJINO」 | 神奈川県相模原市緑区牧野4611-1 | L1 e-sagamihara / L2 hinata-spot |
| 藤野芸術の家キャンプ場 | 神奈川県相模原市緑区牧野4819 | L1 e-sagamihara / L2 hinata-spot |
| 緑の休暇村 青根キャンプ場 | 神奈川県相模原市緑区青根807 / 相模原市緑区青根807-2 | L1 e-sagamihara / L1 midori-navi / L2 nap-camp / L2 jalan / L2 hinata-spot |
| みの石滝キャンプ場 | 神奈川県相模原市相模湖町若柳1628 / 相模原市緑区若柳1628 / 神奈川県相模原市緑区若柳1628 | L1 e-sagamihara / L1 midori-navi / L2 jalan / L2 hinata-spot |
| 本田蘭灯商店 | 相模原市中央区淵野辺3-16-6 | L1 e-sagamihara |
| 藤野倶楽部 | 相模原市緑区牧野4611-1 | L1 midori-navi |
| コテージ日相園 | 相模原市緑区日連754 | L1 midori-navi |
| 夫婦園キャンプ場 | 相模原市緑区青根98 / 神奈川県相模原市緑区青根98 | L1 midori-navi / L2 jalan / L2 hinata-spot |
| 青野原オートキャンプ場組合 | 相模原市緑区青野原918-1 | L1 midori-navi |
| 神之川キャンプ場 | 神奈川県相模原市緑区青根3685 / 相模原市津久井町青根3685 | L2 jalan / L2 hinata-spot / L3 japancamp |
| 日相園 | 神奈川県相模原市緑区日連754 / 神奈川県相模原市緑区日連754−1 | L2 jalan / L2 hinata-spot |
| 遊魚園 | 神奈川県相模原市緑区名倉3231 | L2 jalan |
| 青野原野呂ロッジキャンプ場 | 神奈川県相模原市緑区津久井町青野原931 | L2 hinata-spot |
| いやしの湯・青根緑の休暇村センター | 神奈川県相模原市津久井町青根844 | L2 hinata-spot |
| 北丹沢山岳センター 蛭ヶ岳山荘 | 神奈川県相模原市緑区小渕1545-1 | L2 hinata-spot |
| 青根キャンプ場 | 相模原市津久井町青根807-2 | L3 japancamp |
| このまさわキャンプ場 | 神奈川県相模原市緑区 | L3 walkerplus |
| PICAさがみ湖 | 神奈川県相模原市緑区 | L3 walkerplus |
| 緑の休暇村 青根キャンプ場 | 神奈川県相模原市緑区 | L3 walkerplus |
| 神之川キャンプ場・マス釣り場 | 神奈川県相模原市緑区 | L3 walkerplus |

### b3 — 住所なしの項目が合流したもの（漏れていない）

なし。

## 住所が空で、どの地区のスイープにも載らないレコード（全データ横断）

地区が決まらないので、この地区に限らず**どの地区の突き合わせにも出てこない**。

- `shizunami-beach-camp` 静波海岸キャンプサイト

## confidence の決め方

| | 条件 |
|---|---|
| HIGH | L1（自治体公式・観光協会・県オープンデータ）に1件でもある |
| MID | L1 に無く、L2（予約サイト）が**2ソース以上** |
| LOW | それ以外（L2 が1ソースだけ、または L3 のみ） |

**L3 同士は互いに転載しているので、何件重なっても独立性は上がらない。**
だから件数ではなく層で決めている。

## この検査の限界

**フラグが立たないことを根拠に使わない。**`check-official-urls.js` と同じ扱い。
MISSING が0件でも「その地区に掲載漏れが無い」ことにはならない。

- **OSM は使わない。**牧野周辺の bbox で `camp_site` は1件しか無く、
  本命の2件（亀見橋バカンス村・藤野芸術の家）はどちらも入っていなかった。
  OSM を足しても、この地区で拾えたものは無い
- **全ソースが同じ元ネタを写している可能性は消せない。**
  confidence は独立性の代理指標にすぎない。L1 だから独立、ではない。
  自治体の一覧が予約サイトの記載を写していることもありうる
- **ORPHAN は不在の証明ではない**（§6-7）。実際に反例が2件出ている
  （`sessokyo-camp` は2023年開業で町の一覧が追いついていない、
  `doshi-mori-cottage` は村役場の32件に無いが村観光協会に専用ページがある）。
  **ORPHAN を根拠に status を変えてはいけない**
- **住所を持たないソースがある。**なっぷ・じゃらんの一覧・ウォーカープラスは
  名前しか出さない（または市区町村までしか出さない）。
  名前だけのソースは他ソースの施設を裏付けることしかできず、単独で MISSING を立てられない。
  **そのソースにしか無い施設は、この検査から漏れる**
- **番地は地区の同定に使っていない**（§6-16 のとおり番地は捏造されうる）。
  大字までの一致で地区を決めている
- **データ側の住所が空のレコードは、この検査の対象外**（地区が決まらないため）
