# 地区スイープ: 南都留郡山中湖村山中

> ⛔ **案C以降このファイルは再生成されない。**
> 2026-08-16 時点の**大字単位**の記録として残してある（案Cで地区は市町村単位＝18本になる）。
> **消さない理由**: §5 の突合で使ったばかりで鮮度行も入っており、
> **消すと案C前後の比較ができなくなる**（`scripts/baseline-before-planc-2026-08-16.md` と対で読む）。
> 案C後の地区 md は `sweep-<市町村>.md` の18本。**こちらの数字を現況として引用しないこと。**


実行: 2026-08-15 11:44:20　/　`node scripts/district-sweep.js --district "南都留郡山中湖村山中"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-15 20:27:38

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **6** |
| IN_DATA（両方にある） | 0 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 1 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 山中湖観光協会 泊まる | OK | 17 | 5 | 一覧は先頭5ページまで / 宿泊施設 192 件のうち、本文にキャンプ関連語があった 18 件を残した（判定語: キャンプ/テント/オートサイト/バンガロー/野営） |
| L2 | なっぷ yamanashi/yamanakako_oshino | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 6 | 0 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194250000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194250000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | OK | 18 | 1 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L1` https://lake-yamanakako.com/reserve → 200（キャッシュ）
- `L1` https://lake-yamanakako.com/reserve?page=2 → 200（キャッシュ）
- `L1` https://lake-yamanakako.com/reserve?page=3 → 200（キャッシュ）
- `L1` https://lake-yamanakako.com/reserve?page=4 → 200（キャッシュ）
- `L1` https://lake-yamanakako.com/reserve?page=5 → 200（キャッシュ）
  - 詳細ページ 192 件（住所の取得のため）
- `L2` https://www.nap-camp.com/yamanashi/yamanakako_oshino/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194250000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194250000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_194250000/g2_04/page_3/ → 404
  - 詳細ページ 6 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2004/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2004/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2004/list?page=3 → 200（キャッシュ）
  - 詳細ページ 18 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/2/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/3/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/4/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/5/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/6/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/7/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/8/ → 200（キャッシュ）
- `L3` https://www.walkerplus.com/spot_list/ar0419/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. キャンプ・アンド・キャビンズ山中湖

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村山中287-1
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10531

### 2. 富士見荘キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村山中339-3
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10276

### 3. ヴィヒタ山中湖

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村山中236-17
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10576

### 4. GRAMERCY VILLAGE山中湖GLAMPING&SAUNA

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村山中379-1
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10543

### 5. ザデイ・ポストジェネラルグランピングビィレッジ山中湖

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村山中217-1
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10564

### 6. moss camp field

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡山中湖村山中1300-1
- **出典**:
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/moss_camp_field

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 山中湖観光協会 泊まる | 17 | 4 | 2 | 50% | komeidoso-auto, fujinomori-yamanakako |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `komeidoso-auto` | 湖明荘オートキャンプ場 | 山梨県南都留郡山中湖村山中285-15 | active |  |

## IN_DATA — 両方にある

なし。

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **2** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 80 件 | **112** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 1 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 山中湖観光協会 泊まる | 17 | 0 | 5 | 0 | 12 | OK |
| なっぷ yamanashi/yamanakako_oshino | 20 | 0 | 2 | 2 | 16 | OK |
| じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） | 6 | 0 | 0 | 0 | 6 | OK |
| hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | 18 | 0 | 1 | 0 | 17 | OK |
| キャンナビ（japancamp.jp）山梨県 | 608 | 0 | 0 | 8 | 600 | OK |
| ウォーカープラス 山梨県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）2 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 石割オートキャンプ | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/yamanakako_oshino/list |
| モモンガの森 | L3 japancamp | 一覧に住所が無い | https://japancamp.jp/camp_area/19-yamanashi/ |

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
| ウエストリバーオートキャンプ場 | 南アルプス市須沢131 | L3 japancamp |
| 御坂路さくら公園オートキャンプ場 | 笛吹市御坂町上黒駒5421 | L3 japancamp |
| 富士満願ビレッジファミリーキャンプ場 | 南都留郡鳴沢村5163-1 | L3 japancamp |
| 昇仙峡オートキャンプ場 | 甲府市平瀬町3157 | L3 japancamp |
| 篠沢大滝キャンプ場 | 北杜市白州町大坊1181 | L3 japancamp |
| Foresters Village Kobitto | 北杜市武川町柳澤3802 | L3 japancamp |
| 黒坂オートキャンプ場 | 笛吹市境川町大黒坂1070 | L3 japancamp |
| 芦川オートキャンプ場 | 笛吹市芦川町中芦川入沢1393番地 | L3 japancamp |
| 大武川河川公園フレンドパークむかわ | 北杜市武川町柳澤3506-1 | L3 japancamp |
| ACNオートリゾートパークビッグランド | 北杜市白州町大坊1131 | L3 japancamp |
| 清里丘の公園オートキャンプ場 | 北杜市高根町清里3545-5 | L3 japancamp |
| 清里中央オートキャンプ場 | 北杜市高根町浅川水頭152番地1 | L3 japancamp |
| 東部森林公園ほうれん坊の森キャンプ場 | 北都留郡小菅村東部2402-2 | L3 japancamp |
| 平山キャンプ場 | 北都留郡小菅村3974 | L3 japancamp |
| PICA富士西湖 | 南都留郡富士河口湖町西湖2068-1 | L3 japancamp |
| 都留星と風キャンプフィールド | 都留市大幡5119番地 | L3 japancamp |
| 山梨MTBベースオートキャンプ場 | 甲府市下曽根町996-1 | L3 japancamp |
| キャンピングリゾートＷＡＮ | 南都留郡富士河口湖町西湖1006 | L3 japancamp |
| 芦安キャンプサイトNo2 | 南アルプス市芦安芦倉1551-1 | L3 japancamp |
| AIRSTREAM RESORT®︎ HAKUSHU BASE | 山梨県北杜市白州町白須8292-3 | L3 japancamp |
| THE FOREST | 都留市戸沢1068 | L3 japancamp |
| 大自然に抱かれたキャンプ場ウッドペッカー | 北杜市須玉町上津金2449-5 | L3 japancamp |
| センタービレッジキャンプ場 | 南都留郡道志村12311 | L3 japancamp |
| 玉川キャンプ村 | 北都留郡小菅村2202 | L3 japancamp |
| 山伏オートキャンプ場 | 南都留郡道志村山伏峠 | L3 japancamp |
| 椿荘オートキャンプ場 | 南都留郡道志村大椿4219 | L3 japancamp |
| ネイチャーランド・オム | 南都留郡道志村5964 | L3 japancamp |
| オートキャンプ長又 | 南都留郡道志村長又 | L3 japancamp |
| 福士川オートキャンプ場 | 南巨摩郡南部町福士19867 | L3 japancamp |
| オートキャンプしろいだいら | 南都留郡道志村白井平 | L3 japancamp |
| ラビットオートキャンプ場 | 南都留郡道志村下善之木10179 | L3 japancamp |
| 笛吹小屋キャンプ場 | 山梨市三富川浦1820 | L3 japancamp |
| PICA 八ヶ岳明野 | 北杜市明野町浅尾5260-5 | L3 japancamp |
| 大人のキャンプ場 | 北杜市須玉町江草字西沢原18004番地 | L3 japancamp |
| 根熊山荘フェミリーオートキャンプ場 | 南巨摩郡南部町福士15854 | L3 japancamp |
| 【閉鎖中】ＳＫ落合キャンプ場 | 甲州市塩山一之瀬高橋4783 | L3 japancamp |
| 一の瀬高原キャンプ場 | 甲州市塩山一之瀬高橋560 | L3 japancamp |
| オートキャンプすずらん | 笛吹市芦川町上芦川1808 | L3 japancamp |
| みずがき山グリーンロッジ | 北杜市須玉町小尾8861 | L3 japancamp |
| 清里ブレーメンリゾートクラブ | 北杜市高根町清里3545 | L3 japancamp |
| ＦＩＳＨ・ＯＮ！鹿留 | 都留市鹿留1543 | L3 japancamp |
| 浩庵キャンプ場 | 南巨摩郡身延町中ノ倉2926 | L3 japancamp |
| 滝原オートキャンプ場 | 南都留郡道志村川原畑 | L3 japancamp |
| 水之元オートキャンプ場 | 南都留郡道志村10220 | L3 japancamp |
| 谷相郷キャンプ場 | 南都留郡道志村谷相7910 | L3 japancamp |
| オートキャンプせせらぎ | 南都留郡道志村善之木10202 | L3 japancamp |
| 大沢オートキャンプ場 | 都留市鹿留1089 | L3 japancamp |
| 道志渓谷キャンプ場 | 南都留郡道志村43 | L3 japancamp |
| 鹿留オートキャンプ場 | 都留市鹿留1281 | L3 japancamp |
| ウッドランド武川キャンプ場 | 北杜市武川町柳沢 | L3 japancamp |
| 南清里レジャーセンター | 北杜市須玉町若神子下和田5048 | L3 japancamp |
| 河口湖オートキャンプ場 | 南都留郡富士河口湖町小立5404 | L3 japancamp |
| 創造の森オートキャンプ場 | 南都留郡富士河口湖町船津6603 | L3 japancamp |
| 本栖湖キャンプ場 | 南都留郡富士河口湖町本栖218 | L3 japancamp |
| 道志の森キャンプ場 | 南都留郡道志村三ヶ瀬10041 | L3 japancamp |
| 森の隠れ家ビッグホーンオートキャンプ場 | 甲斐市上芦沢1159 | L3 japancamp |
| ノースランドキャンパーズビレッジ | 甲斐市上芦沢1352 | L3 japancamp |
| 本栖レークサイドキャンプ場 | 南都留郡富士河口湖町本栖 | L3 japancamp |
| 西湖自由キャンプ場 | 南都留郡富士河口湖町西湖1003-2 | L3 japancamp |
| ハーブの里オートキャンプ場 | 南都留郡富士河口湖町河口534 | L3 japancamp |
| 南アルプス三景園オートキャンプ場 | 北杜市武川町柳沢3601-1 | L3 japancamp |
| オートキャンプ牧場チロル | 北杜市武川町柳沢3274-14 | L3 japancamp |
| オートキャンプｉｎむじな | 南都留郡道志村9707 | L3 japancamp |
| べるが尾白の森キャンプ場 | 北杜市白州町白須8093 | L3 japancamp |
| ニューブリッヂキャンプ場 | 南都留郡富士河口湖町小立島原1200 | L3 japancamp |
| ＰｌＣＡ富士吉田 | 富士吉田市上吉田4959-4 | L3 japancamp |
| スカイバレーキャンプ場 | 南都留郡道志村白井平11754-1 | L3 japancamp |
| 西の海オートキャンプ場 | 南都留郡富士河口湖町西湖2403 | L3 japancamp |
| 花の森オートキャンピア | 南都留郡道志村9709-1 | L3 japancamp |
| みずがき山森の農園キャンプ場 | 北杜市須玉町小尾字松平8862-1 | L3 japancamp |
| 西湖キャンプ・ビレッジノーム | 南都留郡富士河口湖町西湖1030 | L3 japancamp |
| せせらぎ荘キャンプ場 | 山梨県都留市 | L3 walkerplus |
| フレンドパークむかわ キャンプ場 | 山梨県北杜市 | L3 walkerplus |
| 平野田休養村キャンプ場 | 山梨県上野原市 | L3 walkerplus |
| 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | L3 walkerplus |
| 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | L3 walkerplus |
| ノースランドキャンパーズビレッジ | 山梨県甲斐市 | L3 walkerplus |
| BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | L3 walkerplus |
| 道志の森キャンプ場 | 山梨県南都留郡道志村 | L3 walkerplus |
| 大人のキャンプ場 | 山梨県北杜市 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| 村営山中湖キャンプ場 | 山梨県南都留郡山中湖村平野506-296(グリーンパーク) / 山梨県南都留郡山中湖村平野506-296 | L1 lake-yamanakako / L2 nap-camp / L2 hinata-spot |
| PICA山中湖ヴィレッジ | 山梨県南都留郡山中湖村平野506-296 | L1 lake-yamanakako / L2 hinata-spot |
| 東照館 | 山梨県南都留郡山中湖村平野210 | L1 lake-yamanakako |
| the508 | 山梨県南都留郡山中湖村平野508-114 / 山梨県南都留郡山中湖村平野508-113 | L1 lake-yamanakako / L2 nap-camp / L2 hinata-spot |
| 小田急山中湖フォレストコテージ | 山梨県南都留郡山中湖村平野491 | L1 lake-yamanakako / L2 hinata-spot |
| 三興荘 | 山梨県南都留郡山中湖村平野118 | L1 lake-yamanakako |
| 富月荘 | 山梨県南都留郡山中湖村平野1903 | L1 lake-yamanakako |
| sotosotodays CAMPGROUNDS 山中湖みさき | 山梨県南都留郡山中湖村平野2431-2 | L1 lake-yamanakako / L2 hinata-spot |
| 湖山荘キャンプ場 | 山梨県南都留郡山中湖村平野508 / 山梨県南都留郡山中湖村平野508-123 / 南都留郡山中湖村平野508 | L1 lake-yamanakako / L2 hinata-spot / L3 japancamp |
| コテージ上機嫌 | 山梨県南都留郡山中湖村平野3189-3 | L1 lake-yamanakako |
| LAKE LODGE YAMANAKA | 山梨県南都留郡山中湖村平野479 | L1 lake-yamanakako / L2 nap-camp / L2 hinata-spot |
| グリーンヒルズニューみなみ | 山梨県南都留郡山中湖村平野520-45 | L1 lake-yamanakako |
| LScamp山中湖 | 山梨県南都留郡山中湖村 | L2 nap-camp / L3 walkerplus |
| VIASSO（ビアッソ） | 山梨県南都留郡山中湖村平野1536 | L2 nap-camp / L2 hinata-spot |
| MaukaResortAZMY | 山梨県南都留郡山中湖村平野1289 | L2 nap-camp / L2 hinata-spot |
| 山中湖みなみオートキャンプ場 | 山梨県南都留郡山中湖村平野520-45 | L2 nap-camp / L2 hinata-spot |
| 東照館 オートキャンプ山中湖 | 山梨県南都留郡山中湖村平野1430 | L2 nap-camp / L2 hinata-spot |
| コンテナワークスin山中湖 | 山梨県南都留郡山中湖村平野1286 | L2 jalan |
| ニュー福寿荘 | 山梨県南都留郡山中湖村平野140 | L2 jalan |
| LOTUS FUJI | 山梨県南都留郡山中湖村平野648-27 | L2 jalan |
| 地球元気村｢山中湖キャンプ場｣ | 山梨県南都留郡山中湖村平野506-296 文学の森公園 | L2 jalan |
| ビアッソ | 山梨県南都留郡山中湖村平野1536 | L2 jalan |
| 山中湖ハウス | 山梨県南都留郡山中湖村平野508-72 | L2 jalan |
| 山中湖ふじのもりオートキャンプ場 | 山梨県南都留郡山中湖村平野1134-3 | L2 hinata-spot |
| プライベートハウス・バイロン | 山梨県南都留郡山中湖村平野508-28 | L2 hinata-spot |
| ペンション 飛遊人 | 山梨県南都留郡山中湖村平野508-687 | L2 hinata-spot |
| ペンション茂里 | 山梨県南都留郡山中湖村中山865-111 | L2 hinata-spot |
| 山中野営場 | 山梨県南都留郡山中湖村旭日丘 | L2 hinata-spot |
| 飛遊人キャンプ場 | 山梨県南都留郡山中湖村平野508-42 | L2 hinata-spot |
| みさきキャンプ場 | 南都留郡山中湖村平野2431-2 | L3 japancamp |
| 小田急山中湖フォレストコテージ | 南都留郡山中湖村平野切詰491 | L3 japancamp |
| 山中湖オートキャンプ場 | 南都留郡山中湖村梨が原1212-52 | L3 japancamp |

### b3 — 住所なしの項目が合流したもの（漏れていない）

| 合流先 | 分類 | 合流した住所なしの出典 |
|---|---|---|
| moss camp field | MISSING | L2 nap-camp |

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
