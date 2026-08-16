# 地区スイープ: 富士宮市上井出

> ⛔ **案C以降このファイルは再生成されない。**
> 2026-08-16 時点の**大字単位**の記録として残してある（案Cで地区は市町村単位＝18本になる）。
> **消さない理由**: §5 の突合で使ったばかりで鮮度行も入っており、
> **消すと案C前後の比較ができなくなる**（`scripts/baseline-before-planc-2026-08-16.md` と対で読む）。
> 案C後の地区 md は `sweep-<市町村>.md` の18本。**こちらの数字を現況として引用しないこと。**


実行: 2026-08-15 11:45:10　/　`node scripts/district-sweep.js --district "富士宮市上井出"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-15 20:27:38

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **5** |
| IN_DATA（両方にある） | 0 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 1 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） | OK | 12 | 0 | 一覧に住所が無いため名前のみ。`/play/camp/` はカテゴリ全体が返るので使わない |
| L2 | フジヤマNAVI 富士宮市 × キャンプ | OK | 17 | 0 | 一覧に住所が無いため名前のみ。コテージ・ホテルが混ざる |
| L2 | なっぷ shizuoka/gotenba_fuzi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 12 | 1 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_222070000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_222070000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 御殿場・富士（tokai/shizuoka/2710） | OK | 58 | 4 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）静岡県 | OK | 600 | 8 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 静岡県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 富士宮市公式（市サイト） | **L1_NOT_FOUND** | – | – | **2025年5月のリニューアルでキャンプ場一覧ごと消滅した。**旧URL（p001678 / p001688 / p001691 と FAQ）は全部404、施設一覧の入口 /1025110000/ は403。新サイトに引き継がれた一覧は無く、**観光ページ /kanko/ には「キャンプ」の語が1回も出てこない**（2026-08-13 実測）。観光協会側（SRC_FUJINOMIYA_KANKO）で代替できているので、市公式は追わない |
| L1 | 都道府県オープンデータ（静岡） | **L1_NOT_FOUND** | – | – | 静岡県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **富士宮市公式（市サイト）** — **2025年5月のリニューアルでキャンプ場一覧ごと消滅した。**旧URL（p001678 / p001688 / p001691 と FAQ）は全部404、施設一覧の入口 /1025110000/ は403。新サイトに引き継がれた一覧は無く、**観光ページ /kanko/ には「キャンプ」の語が1回も出てこない**（2026-08-13 実測）。観光協会側（SRC_FUJINOMIYA_KANKO）で代替できているので、市公式は追わない
  - 確認: https://www.city.fujinomiya.lg.jp/kanko/

取得したページ:

- `L1` https://fujinomiya.gr.jp/guides/play/?term=camp → 200（キャッシュ）
- `L2` https://www.fujiyama-navi.jp/areas/%E5%AF%8C%E5%A3%AB%E5%AE%AE%E5%B8%82/categories/%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97 → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/gotenba_fuzi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/gotenba_fuzi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/page_3/ → 404
  - 詳細ページ 12 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list?page=3 → 200（キャッシュ）
  - 詳細ページ 58 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/2/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/3/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/4/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/5/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/6/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/7/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/8/ → 200（キャッシュ）
- `L3` https://www.walkerplus.com/spot_list/ar0622/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. 富士山ワイルドアドベンチャー（FWA）

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 静岡県富士宮市上井出2753-2
- **表記ゆれ**: 富士山ワイルドアドベンチャー（FWA） / 富士山ワイルドアドベンチャー
- **出典**:
  - `L1` 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） — https://fujinomiya.gr.jp/guide/4970/
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000220636/
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fujisan-wild-adventure

### 2. 表富士キャンピング場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県富士宮市上井出静1253-1
- **出典**:
  - `L2` フジヤマNAVI 富士宮市 × キャンプ — https://www.fujiyama-navi.jp/spots/7dZIo
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/omotefuji

### 3. 富士山キャンプランド

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市上井出3680富士ミルクランド内
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fuji-miruku-and

### 4. 富士桜モビランドキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市上井出2460
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fujisakura-mobiland

### 5. 表富士キャンピング場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 富士宮市上井出1253-1
- **出典**:
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/2/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/3/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/4/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/5/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/6/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/7/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/8/

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） | 12 | 11 | 4 | 36% | eichinomori, sorairo, houzan, fuji-ymca, asagiri-foodpark, fujisan-genshijin, granpapa-solo-bocchi |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `fujisan-genshijin` | 富士山オートキャンプ場GENSHIJIN | 静岡県富士宮市上井出2527番地の1 | active |  |

## IN_DATA — 両方にある

なし。

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **10** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 89 件 | **123** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 2 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） | 12 | 0 | 1 | 2 | 9 | OK |
| フジヤマNAVI 富士宮市 × キャンプ | 17 | 0 | 1 | 3 | 13 | OK |
| なっぷ shizuoka/gotenba_fuzi | 20 | 0 | 0 | 8 | 12 | OK |
| じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） | 12 | 0 | 1 | 0 | 11 | OK |
| hinata スポット 御殿場・富士（tokai/shizuoka/2710） | 58 | 0 | 4 | 0 | 54 | OK |
| キャンナビ（japancamp.jp）静岡県 | 600 | 0 | 8 | 8 | 584 | OK |
| ウォーカープラス 静岡県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）10 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| COW RESORT IDEBOK | L1 fujinomiya-kankou | 一覧に住所が無い | https://fujinomiya.gr.jp/guide/4438/ |
| 西富士オ－トキャンプ場 | L1 fujinomiya-kankou | 一覧に住所が無い | https://fujinomiya.gr.jp/guide/119/ |
| 表富士グリーンキャンプ場 | L2 fujiyama-navi | 一覧に住所が無い | https://www.fujiyama-navi.jp/spots/wqs0G |
| 伊豆高原コテッジ | L2 fujiyama-navi | 一覧に住所が無い | https://www.fujiyama-navi.jp/spots/pu670 |
| コテージホテル 大いなる海 | L2 fujiyama-navi | 一覧に住所が無い | https://www.fujiyama-navi.jp/spots/jY4dK |
| RECAMP 富士スピードウェイ | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |
| キャンプ場フィール | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |
| VOLCANO 白糸オートキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |
| FWA【富士山ワイルドアドベンチャー】 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |
| 富士山オートキャンプ場 GENSHIJIN | L3 japancamp | 一覧に住所が無い | https://japancamp.jp/camp_area/22-shizuoka/ |

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
| 乙女森林公園第２キャンプ場 | 静岡県御殿場市深沢2696-2 / 御殿場市深沢2696-2 | L2 nap-camp / L2 hinata-spot / L3 japancamp |
| 桃沢野外活動センター | 静岡県駿東郡長泉町元長窪895-108桃沢野外活動センター | L2 nap-camp / L2 hinata-spot |
| 乙女森林公園第1キャンプ場 | 静岡県御殿場市深沢2190 | L2 nap-camp / L2 hinata-spot |
| 富士見の丘オートキャンプ場 | 静岡県富士市大淵1297 | L2 hinata-spot |
| 長田山荘キャンプ場 | 静岡県御殿場市板妻511 | L2 hinata-spot |
| 大野路ファミリーキャンプ場 | 静岡県裾野市須山2934-3 / 裾野市須山2934-2 | L2 hinata-spot / L3 japancamp |
| やまぼうしオートキャンプ場 | 静岡県御殿場市板妻630 | L2 hinata-spot |
| 御殿場まるびオートキャンプ場 | 静岡県御殿場市印野1379-1 / 御殿場市印野1379-1 | L2 hinata-spot / L3 japancamp |
| 富士スピードウェイ アクティブパーク | 静岡県駿東郡小山町中日向694富士スピードウェイ | L2 hinata-spot |
| 富士すそ野ファミリーキャンプ場 | 静岡県裾野市須山字大野2653 | L2 hinata-spot |
| 泊まれる公園 INN THE PARK | 静岡県沼津市足高220-4 | L2 hinata-spot |
| ＧＬＡＭＰＩＮＧ藤乃煌富士御殿場 | 静岡県御殿場市東田中3373−25 | L2 hinata-spot |
| DogField合衆国 | 静岡県裾野市下和田572-1 | L2 hinata-spot |
| 御殿場高原リゾート時之栖OUTDOORHILLVILLAGE | 静岡県御殿場市神山719 | L2 hinata-spot |
| NELOgotemba | 静岡県駿東郡小山町新柴字道端672-1 | L2 hinata-spot |
| 丸火自然公園グリーンキャンプ場 | 静岡県富士市大淵10847番地の1 | L2 hinata-spot |
| カントリーベアーファミリーキャンプ場 | 静岡県裾野市須山字大野2646 | L2 hinata-spot |
| 野田山健康緑地公園 富士川キャンプ場 | 静岡県富士市中之郷4482-141 | L2 hinata-spot |
| 炭屋ベース | 静岡県静岡県裾野市下和田字堀向509 | L2 hinata-spot |
| 御殿場欅平ファミリーキャンプ場 | 静岡県御殿場市印野696-1 | L2 hinata-spot |
| みらくのキャンプ場 | 静岡県裾野市須山2956-7 / 裾野市須山2956の7 | L2 hinata-spot / L3 japancamp |
| 函南町立木立キャンプ場 | 静岡県田方郡函南町桑原1331-1 | L2 hinata-spot |
| PICA富士ぐりんぱ | 静岡県裾野市須山字藤原2427 | L2 hinata-spot |
| ながおねオートキャンプ場 | 静岡県裾野市須山3406-2 | L2 hinata-spot |
| 三島市立箱根の里 | 静岡県三島市山中新田4710-1 | L2 hinata-spot |
| 須津山休養林キャンプ場 | 静岡県富士市江尾1035 | L2 hinata-spot |
| 静岡県富士山こどもの国 | 静岡県富士市桑崎1015 / 富士市桑崎1015 | L2 hinata-spot / L3 japancamp |
| ストーンチェアキャンプ場 | 静岡県賀茂郡東伊豆町稲取字休石3204-1 | L3 japancamp |
| 雲見オートキャンプ場 | 賀茂郡松崎町雲見40-1 | L3 japancamp |
| 戸田はかま滝オートキャンプ場 | 沼津市戸田3908-13 | L3 japancamp |
| 浜松市渚園キャンプ場 | 浜松市西区舞阪町弁天島5005-1 | L3 japancamp |
| 伊豆松崎あそび島 | 静岡県賀茂郡松崎町松崎507 | L3 japancamp |
| 宇久須キャンプ場 | 賀茂郡西伊豆町宇久須2102-13 | L3 japancamp |
| ならここの里キャンプ場 | 静岡県掛川市居尻179番地 | L3 japancamp |
| オートキャンプ銀河 | 賀茂郡西伊豆町一色八の段1986-1 | L3 japancamp |
| はるの川音の郷 | 浜松市天竜区春野町宮川2098-1 | L3 japancamp |
| 河津オートキャンプ場 | 賀茂郡河津町川津筏場555 | L3 japancamp |
| モビリティーパーク | 伊豆の国市長者原1445-481 | L3 japancamp |
| 三保ハーバルキャンプ場 | 静岡市清水区三保2738 | L3 japancamp |
| 河津七滝オートキャンプ場 | 賀茂郡河津町梨本470-1 | L3 japancamp |
| 竜洋海洋公園オートキャンプ場 | 磐田市駒場字西瀬6866-10 | L3 japancamp |
| CampFantasea（キャンプファンタジア） | 賀茂郡南伊豆町伊浜2733-3 | L3 japancamp |
| 西伊豆オートキャンプ場 | 賀茂郡西伊豆町大沢里424 | L3 japancamp |
| Cabin hagoromo in ose | 静岡県沼津市西浦江梨大瀬崎325-2 | L3 japancamp |
| おきつがわオートキャンプ場 | 静岡市清水区茂野島1100 | L3 japancamp |
| 富士すそ野ファミリーキャンプ場 | 裾野市須山大野2653 | L3 japancamp |
| 南伊豆キャンピングテラス | 静岡県賀茂郡南伊豆町子浦1349-6 | L3 japancamp |
| 不動の滝オートキャンプ場 | 榛原郡川根本町下泉1122 | L3 japancamp |
| オートキャンピング村アドベンチャーファミリー | 賀茂郡河津町上佐ヶ野字大休場383-3 | L3 japancamp |
| 入間キャンプ村 | 賀茂郡南伊豆町入間 | L3 japancamp |
| 南伊豆 夕日ヶ丘キャンプ場 | 賀茂郡南伊豆町伊浜2222 | L3 japancamp |
| ワンダーフォレストTERRA | 賀茂郡南伊豆町下賀茂899 | L3 japancamp |
| キャンプ黄金崎 | 賀茂郡西伊豆町西伊豆町宇久須2182−1 | L3 japancamp |
| 泊まれる公園「INN THE PARK」 | 沼津市足高220−4 | L3 japancamp |
| だるま山高原キャンプ場 | 伊豆市大沢1018-1 | L3 japancamp |
| 雲見 夕陽と潮騒の岬オートキャンプ場 | 賀茂郡松崎町雲見字塩谷83-1 | L3 japancamp |
| 石廊崎オートキャンプ場 | 賀茂郡南伊豆町石廊崎199-4 | L3 japancamp |
| 星降るみさくぼキャンプ場よつばの杜 | 浜松市天竜区水窪町奥領家4192-2 | L3 japancamp |
| オートキャンプ花沢 | 賀茂郡松崎町雲見字花沢 | L3 japancamp |
| 伊豆今井浜オートキャンプ場 | 賀茂郡河津町今井浜見高1237-1 | L3 japancamp |
| もちこし来楽歩 | 伊豆市持越692 | L3 japancamp |
| 火剣山キャンプ場 | 菊川市富田3126-6 | L3 japancamp |
| てんてんゴーしぶ川 | 浜松市北区引佐町渋川237-1 | L3 japancamp |
| くのわき親水公園キャンプ場 | 榛原郡川根本町久野脇280 | L3 japancamp |
| 三ツ星オートキャンプ場 | 榛原郡川根本町上長尾1141-1 | L3 japancamp |
| 静波キャンプグランド | 牧之原市静波2220-89 | L3 japancamp |
| サザ波キャンプ場 | 伊豆市土肥2906-3 | L3 japancamp |
| 南アルプス井川オートキャンプ場 | 静岡市葵区田代449-2 | L3 japancamp |
| おれっぷ大久保キャンプ場 | 藤枝市瀬戸ノ谷11029 | L3 japancamp |
| 大池キャンプ場 | 賀茂郡河津町見高2358-2 | L3 japancamp |
| ４Ｈオートキャンピングパーク | 伊東市富戸1233-20 | L3 japancamp |
| やまぼうしオートキャンプ場 | 御殿場市板妻高塚630 | L3 japancamp |
| ＡＣＮ伊豆キャンパーズヴィレッジ | 賀茂郡河津町川津筏場滝の田1403- | L3 japancamp |
| 佐ヶ野オートキャンプ場 | 賀茂郡河津町上佐ヶ野1585-6 | L3 japancamp |
| 【閉鎖中】ＰＩＥＲ１０１伊豆松崎マリンオートキャンプ場 | 賀茂郡松崎町松崎507 | L3 japancamp |
| 土肥オートキャンプ場 | 伊豆市小土肥2021-35 | L3 japancamp |
| 伊豆自然村キャンプフィールド | 伊豆市徳永1097 | L3 japancamp |
| 御殿場欅平ファミリーキャンプ場 | 御殿場市印野ケヤキ平696 | L3 japancamp |
| キャンピカ富士ぐりんぱ | 裾野市須山藤原2427 | L3 japancamp |
| カントリーベアーファミリーキャンプ場 | 裾野市須山大野2646 | L3 japancamp |
| オートキャンプはがちざき | 賀茂郡南伊豆町伊浜1512 | L3 japancamp |
| キャンプ山の家 | 賀茂郡南伊豆町蛇石676-7 | L3 japancamp |
| 市民の森(沼津市) | 静岡県沼津市 | L3 walkerplus |
| おれっぷ大久保キャンプ場 | 静岡県藤枝市 | L3 walkerplus |
| 御殿場欅平ファミリーキャンプ場 | 静岡県御殿場市 | L3 walkerplus |
| 富士山こどもの国オートキャンプ場 | 静岡県富士市 | L3 walkerplus |
| 南伊豆夕日ヶ丘キャンプ場 | 静岡県賀茂郡南伊豆町 | L3 walkerplus |
| 竜洋海洋公園オートキャンプ場 | 静岡県磐田市 | L3 walkerplus |
| PICA富士ぐりんぱ | 静岡県裾野市 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| Field Dogs Garden | 静岡県富士宮市猪之頭人穴道1816-9 / 富士宮市猪之頭人穴道1816-9 | L1 fujinomiya-kankou / L2 fujiyama-navi / L2 hinata-spot / L3 japancamp |
| PICA表富士（富士山2合目） | 静岡県富士宮市粟倉2745 | L1 fujinomiya-kankou / L2 jalan / L2 hinata-spot / L3 japancamp |
| ふもとっぱら | 静岡県富士宮市麓156 | L1 fujinomiya-kankou / L2 fujiyama-navi / L2 hinata-spot |
| ペンギン村オートキャンプ場 | 静岡県富士宮市猪之頭2351 / 静岡県富士宮市猪之頭2071 / 静岡県富士宮市猪之頭1114-1 / 富士宮市猪之頭2071 | L1 fujinomiya-kankou / L2 fujiyama-navi / L2 jalan / L2 hinata-spot / L3 japancamp |
| 天子の森オートキャンプ場 | 静岡県富士宮市佐折631 / 富士宮市佐折631 | L1 fujinomiya-kankou / L2 fujiyama-navi / L2 jalan / L2 hinata-spot / L3 japancamp |
| 富士オートキャンプ場ふもと村 | 静岡県富士宮市麓174-1 / 富士宮市麓174-1 | L1 fujinomiya-kankou / L2 fujiyama-navi / L2 jalan / L2 hinata-spot / L3 japancamp |
| 朝霧ジャンボリーオートキャンプ場 | 静岡県富士宮市猪之頭1162-3 朝霧ヴィーナスガーデンゴルフコース宛 / 富士宮市猪之頭1162-3 | L1 fujinomiya-kankou / L2 fujiyama-navi / L2 hinata-spot / L3 japancamp |
| 田貫湖（たぬきこ） | 静岡県富士宮市猪之頭2929-10 | L1 fujinomiya-kankou / L2 fujiyama-navi / L2 jalan |
| 新富士オートキャンプ場 | 静岡県富士宮市北山7430-421 / 富士宮市北山字鞍骨7430 | L2 fujiyama-navi / L2 jalan / L3 japancamp |
| 白糸オートキャンプ場 | 静岡県富士宮市内野字中野坂1892-1 / 静岡県富士宮市内野1892-1 | L2 fujiyama-navi / L2 jalan / L2 hinata-spot |
| ＡＣＮ西富士オートキャンプ場 | 富士宮市内野1687 | L2 fujiyama-navi / L3 japancamp |
| 猪の頭オートキャンプ場 | 静岡県富士宮市猪之頭2350 | L2 fujiyama-navi / L2 hinata-spot |
| アーバンキャンピング朝霧宝山 | 静岡県富士宮市根原371-5 | L2 nap-camp / L2 hinata-spot |
| Foresters Village Kobitto あさぎりキャンプフィールド | 静岡県富士宮市猪之頭2350 / 富士宮市猪之頭2350 | L2 nap-camp / L2 hinata-spot / L3 japancamp |
| 西富士オートキャンプ場 | 静岡県富士宮市内野1687 | L2 nap-camp / L2 jalan / L2 hinata-spot |
| foothills キャンプ場 | 静岡県富士宮市北山7429-2 | L2 jalan |
| 桂の森 CAMPERS FIELD | 静岡県富士宮市大中里1884-5 | L2 jalan |
| 田貫湖キャンプ場 | 静岡県富士宮市佐折634-1 / 富士宮市佐折634-1 | L2 hinata-spot / L3 japancamp |
| 村山ジャンボキャンプ場 | 静岡県富士宮市村山1071-2 | L2 hinata-spot |
| 朝霧CampBaseそらいろ | 静岡県富士宮市麓朝霧610番地朝霧Camp Base そらいろ | L2 hinata-spot |
| 富士山YMCAグローバル・エコ・ヴィレッジ | 静岡県富士宮市原1423 | L2 hinata-spot |
| あさぎりフードパーク（スタイルキャビンあさぎり） | 静岡県富士宮市根原449-11 | L2 hinata-spot |
| グランパパ -大人の隠れ場- キャンプ場 | 静岡県富士宮市猪之頭26−1 | L2 hinata-spot |
| Mt.FUJISATOYAMAVACATION | 静岡県富士宮市狩宿8-2 | L2 hinata-spot |
| 朝霧高原英知の杜キャンプ場 | 静岡県富士宮市根原71-3 | L2 hinata-spot |
| FUJIYAMA 泉の森キャンピングフィールド | 静岡県富士宮市猪之頭2131−4 / 静岡県富士宮市猪之頭2227−1 | L2 hinata-spot |
| 新富士オートキャンプ場 | 静岡県富士宮市北山鞍骨7430 | L2 hinata-spot |
| アサギリ高原パラグライダーキャンプ場 | 静岡県富士宮市根原282-1 | L2 hinata-spot |
| スタイルキャビンあさぎり | 静岡県富士宮市根原449-11 | L2 hinata-spot |
| ラ・フォンテーヌ・バカンス田貫橋 | 富士宮市猪之頭2131-4 | L3 japancamp |
| 【閉鎖中】朝霧高原ふもとオートキャンプ場 | 富士宮市麓浅野397 | L3 japancamp |
| GRAN REGALO ASAGIRI (グランレガロあさぎり) | 静岡県富士宮市 | L3 walkerplus |
| 朝霧高原オートキャンプ場 | 静岡県富士宮市 | L3 walkerplus |
| MT. FUJI SATOYAMA VACATION (マウントフジ里山バケーション) | 静岡県富士宮市 | L3 walkerplus |

### b3 — 住所なしの項目が合流したもの（漏れていない）

| 合流先 | 分類 | 合流した住所なしの出典 |
|---|---|---|
| 富士山ワイルドアドベンチャー（FWA） | MISSING | L1 fujinomiya-kankou |
| 表富士キャンピング場 | MISSING | L2 fujiyama-navi |

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
