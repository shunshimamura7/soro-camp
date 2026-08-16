# 地区スイープ: 南都留郡道志村馬場

> ⛔ **案C以降このファイルは再生成されない。**
> 2026-08-16 時点の**大字単位**の記録として残してある（案Cで地区は市町村単位＝18本になる）。
> **消さない理由**: §5 の突合で使ったばかりで鮮度行も入っており、
> **消すと案C前後の比較ができなくなる**（`scripts/baseline-before-planc-2026-08-16.md` と対で読む）。
> 案C後の地区 md は `sweep-<市町村>.md` の18本。**こちらの数字を現況として引用しないこと。**


実行: 2026-08-15 11:44:44　/　`node scripts/district-sweep.js --district "南都留郡道志村馬場"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-15 20:27:38

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **0** |
| IN_DATA（両方にある） | 1 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 2 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 道志村役場観光情報サイト キャンプ場紹介 | OK | 31 | 0 | 村内のキャンプ場は数十軒あり、データ側12件との差は大きく出る前提 |
| L2 | なっぷ yamanashi/otsuki_turushi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 28 | 0 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194220000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194220000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 大月・都留（koushinetsu/yamanashi/2003） | OK | 60 | 1 | 一覧は先頭3ページまで |
| L2 | hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | OK | 18 | 0 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L1` https://www.doshi-kanko.jp/camp/ → 200（キャッシュ）
  - 詳細ページ 31 件（住所の取得のため）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194220000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194220000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_194220000/g2_04/page_3/ → 404
  - 詳細ページ 28 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2003/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2003/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2003/list?page=3 → 200（キャッシュ）
  - 詳細ページ 60 件（住所の取得のため）
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

この地区では出なかった。**ただし「掲載漏れが無い」という意味ではない**（上の限界を参照）。

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 道志村役場観光情報サイト キャンプ場紹介 | 31 | 13 | 10 | 77% | woodsman-camp, suigennnomori, doshi-mori-cottage |

## ORPHAN — データにあるが、どのソースにも出てこない

網羅率 70% 以上の L1 があるので、**判定として読める**。
ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `suigennnomori` | 水源の森 キャンプ・ランド | 山梨県南都留郡道志村馬場5821-2 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `woodsman-camp` WOODSMAN CAMPGROUND | WOODSMAN CAMP GROUND | 名前 | LOW | L2 |

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **4** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 106 件 | **171** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 0 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 道志村役場観光情報サイト キャンプ場紹介 | 31 | 0 | 0 | 0 | 31 | OK |
| なっぷ yamanashi/otsuki_turushi | 20 | 0 | 0 | 8 | 12 | OK |
| じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） | 28 | 0 | 0 | 0 | 28 | OK |
| hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | 78 | 0 | 1 | 0 | 77 | OK |
| キャンナビ（japancamp.jp）山梨県 | 608 | 0 | 0 | 0 | 608 | OK |
| ウォーカープラス 山梨県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）4 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 水源の森 キャンプ·ランド | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| 猿橋リバーサイドベースキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| SNUG CAMP HOUSE | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| CAMP＆SAUNA 3set（キャンプ＆サウナ サンセット） | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |

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
| ほうれん坊の森キャンプ場 | 山梨県北都留郡小菅村2402-2ほうれん坊の森キャンプ場(東部森林公園) | L2 nap-camp / L2 hinata-spot |
| 原始村キャンプ場 | 山梨県北都留郡小菅村1970番地 | L2 nap-camp / L2 hinata-spot |
| 山の中の天然温泉 和みの里キャンプ場 | 山梨県都留市戸沢1126 | L2 nap-camp / L2 hinata-spot |
| 平山キャンプ場 | 北都留郡小菅村3974 | L2 nap-camp / L3 japancamp |
| CALM MOUNTAIN AKIYAMA | 山梨県上野原市秋山12003 | L2 hinata-spot |
| 三ツ峠グリーンセンター | 山梨県南都留郡西桂町下暮地1900 | L2 hinata-spot |
| 富士満願ビレッジファミリーキャンプ場 | 山梨県南都留郡鳴沢村5163-1 / 南都留郡鳴沢村5163-1 | L2 hinata-spot / L3 japancamp |
| せせらぎ荘キャンプ場 | 山梨県都留市戸沢896-1 | L2 hinata-spot |
| hotel norm. Fuji | 山梨県南都留郡富士河口湖町長浜2109-1 | L2 hinata-spot |
| THE FOREST | 山梨県都留市戸沢1068 / 都留市戸沢1068 | L2 hinata-spot / L3 japancamp |
| KAGARIBI Camp Terrace | 山梨県山梨県大月市賑岡町奥山1473「森屋荘」内 | L2 hinata-spot |
| FOREST GATE | 山梨県都留市大野2881-5 | L2 hinata-spot |
| SPORTS TRAIN in Forest camp (スポーツトレイン) | 山梨県南都留郡富士河口湖町西湖2169-1 | L2 hinata-spot |
| 奥秋キャンプ場 | 山梨県北都留郡丹波山村奥秋1388 | L2 hinata-spot |
| 風車キャンプ場 | 山梨県都留市鹿留3064 | L2 hinata-spot |
| 近ヶ坂キャンプ場 | 山梨県都留市中津森55−6 | L2 hinata-spot |
| 緑と太陽の丘キャンプ場 | 山梨県上野原市秋山5030 | L2 hinata-spot |
| 甲武キャンプ村 | 山梨県北都留郡丹波山村400 | L2 hinata-spot |
| グリーンリバーかめやキャンプ場 | 山梨県北都留郡丹波山村966 | L2 hinata-spot |
| CAMP INNFUJI | 山梨県南都留郡忍野村忍草3235 | L2 hinata-spot |
| BerryPark in FISH ON！鹿留 | 山梨県都留市鹿留1543 / 都留市鹿留1543 | L2 hinata-spot / L3 japancamp |
| キャンプインフジ | 山梨県南都留郡忍野村忍草3236-2 | L2 hinata-spot |
| 月尾根自然の森 | 山梨県大月市梁川町立野106 | L2 hinata-spot |
| 鹿留オートキャンプ場 | 山梨県都留市鹿留1180 / 都留市鹿留1281 | L2 hinata-spot / L3 japancamp |
| 大沢オートキャンプ場 | 山梨県都留市鹿留1089 / 都留市鹿留1089 | L2 hinata-spot / L3 japancamp |
| 宝の山ふれあいの里 | 山梨県都留市大幡5108 | L2 hinata-spot |
| 平野田休養村 | 山梨県上野原市西原7293 | L2 hinata-spot |
| moss camp field | 山梨県南都留郡山中湖村山中1300-1 | L2 hinata-spot |
| VIASSO（ビアッソ） | 山梨県南都留郡山中湖村平野1536 | L2 hinata-spot |
| 山中湖ふじのもりオートキャンプ場 | 山梨県南都留郡山中湖村平野1134-3 | L2 hinata-spot |
| 東照館オートキャンプ山中湖 | 山梨県南都留郡山中湖村平野1430 | L2 hinata-spot |
| Lake Lodge YAMANAKA | 山梨県南都留郡山中湖村平野479 | L2 hinata-spot |
| Mauka Resort AZMY | 山梨県南都留郡山中湖村平野1289 | L2 hinata-spot |
| the 508 | 山梨県南都留郡山中湖村平野508-113 | L2 hinata-spot |
| sotosotodays CAMPGROUNDS 山中湖みさき（旧みさきキャンプ場） | 山梨県南都留郡山中湖村平野2431-2 | L2 hinata-spot |
| 湖山荘キャンプ場 | 山梨県南都留郡山中湖村平野508-123 / 南都留郡山中湖村平野508 | L2 hinata-spot / L3 japancamp |
| 小田急山中湖フォレストコテージ | 山梨県南都留郡山中湖村平野491 | L2 hinata-spot |
| 山中湖みなみオートキャンプ場 | 山梨県南都留郡山中湖村平野520-45 | L2 hinata-spot |
| PICA山中湖 | 山梨県南都留郡山中湖村平野506-296 | L2 hinata-spot |
| 村営山中湖キャンプ場 | 山梨県南都留郡山中湖村平野506-296 | L2 hinata-spot |
| プライベートハウス・バイロン | 山梨県南都留郡山中湖村平野508-28 | L2 hinata-spot |
| ペンション 飛遊人 | 山梨県南都留郡山中湖村平野508-687 | L2 hinata-spot |
| ペンション茂里 | 山梨県南都留郡山中湖村中山865-111 | L2 hinata-spot |
| 山中野営場 | 山梨県南都留郡山中湖村旭日丘 | L2 hinata-spot |
| 飛遊人キャンプ場 | 山梨県南都留郡山中湖村平野508-42 | L2 hinata-spot |
| ウエストリバーオートキャンプ場 | 南アルプス市須沢131 | L3 japancamp |
| 御坂路さくら公園オートキャンプ場 | 笛吹市御坂町上黒駒5421 | L3 japancamp |
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
| PICA富士西湖 | 南都留郡富士河口湖町西湖2068-1 | L3 japancamp |
| 都留星と風キャンプフィールド | 都留市大幡5119番地 | L3 japancamp |
| 山梨MTBベースオートキャンプ場 | 甲府市下曽根町996-1 | L3 japancamp |
| キャンピングリゾートＷＡＮ | 南都留郡富士河口湖町西湖1006 | L3 japancamp |
| 芦安キャンプサイトNo2 | 南アルプス市芦安芦倉1551-1 | L3 japancamp |
| AIRSTREAM RESORT®︎ HAKUSHU BASE | 山梨県北杜市白州町白須8292-3 | L3 japancamp |
| 大自然に抱かれたキャンプ場ウッドペッカー | 北杜市須玉町上津金2449-5 | L3 japancamp |
| みさきキャンプ場 | 南都留郡山中湖村平野2431-2 | L3 japancamp |
| 玉川キャンプ村 | 北都留郡小菅村2202 | L3 japancamp |
| 小田急山中湖フォレストコテージ | 南都留郡山中湖村平野切詰491 | L3 japancamp |
| 福士川オートキャンプ場 | 南巨摩郡南部町福士19867 | L3 japancamp |
| 笛吹小屋キャンプ場 | 山梨市三富川浦1820 | L3 japancamp |
| PICA 八ヶ岳明野 | 北杜市明野町浅尾5260-5 | L3 japancamp |
| 大人のキャンプ場 | 北杜市須玉町江草字西沢原18004番地 | L3 japancamp |
| 根熊山荘フェミリーオートキャンプ場 | 南巨摩郡南部町福士15854 | L3 japancamp |
| 【閉鎖中】ＳＫ落合キャンプ場 | 甲州市塩山一之瀬高橋4783 | L3 japancamp |
| 一の瀬高原キャンプ場 | 甲州市塩山一之瀬高橋560 | L3 japancamp |
| オートキャンプすずらん | 笛吹市芦川町上芦川1808 | L3 japancamp |
| みずがき山グリーンロッジ | 北杜市須玉町小尾8861 | L3 japancamp |
| 清里ブレーメンリゾートクラブ | 北杜市高根町清里3545 | L3 japancamp |
| 浩庵キャンプ場 | 南巨摩郡身延町中ノ倉2926 | L3 japancamp |
| ウッドランド武川キャンプ場 | 北杜市武川町柳沢 | L3 japancamp |
| 南清里レジャーセンター | 北杜市須玉町若神子下和田5048 | L3 japancamp |
| 河口湖オートキャンプ場 | 南都留郡富士河口湖町小立5404 | L3 japancamp |
| 創造の森オートキャンプ場 | 南都留郡富士河口湖町船津6603 | L3 japancamp |
| 本栖湖キャンプ場 | 南都留郡富士河口湖町本栖218 | L3 japancamp |
| 森の隠れ家ビッグホーンオートキャンプ場 | 甲斐市上芦沢1159 | L3 japancamp |
| ノースランドキャンパーズビレッジ | 甲斐市上芦沢1352 | L3 japancamp |
| 本栖レークサイドキャンプ場 | 南都留郡富士河口湖町本栖 | L3 japancamp |
| 西湖自由キャンプ場 | 南都留郡富士河口湖町西湖1003-2 | L3 japancamp |
| ハーブの里オートキャンプ場 | 南都留郡富士河口湖町河口534 | L3 japancamp |
| 南アルプス三景園オートキャンプ場 | 北杜市武川町柳沢3601-1 | L3 japancamp |
| オートキャンプ牧場チロル | 北杜市武川町柳沢3274-14 | L3 japancamp |
| 山中湖オートキャンプ場 | 南都留郡山中湖村梨が原1212-52 | L3 japancamp |
| べるが尾白の森キャンプ場 | 北杜市白州町白須8093 | L3 japancamp |
| ニューブリッヂキャンプ場 | 南都留郡富士河口湖町小立島原1200 | L3 japancamp |
| ＰｌＣＡ富士吉田 | 富士吉田市上吉田4959-4 | L3 japancamp |
| 西の海オートキャンプ場 | 南都留郡富士河口湖町西湖2403 | L3 japancamp |
| みずがき山森の農園キャンプ場 | 北杜市須玉町小尾字松平8862-1 | L3 japancamp |
| 西湖キャンプ・ビレッジノーム | 南都留郡富士河口湖町西湖1030 | L3 japancamp |
| せせらぎ荘キャンプ場 | 山梨県都留市 | L3 walkerplus |
| フレンドパークむかわ キャンプ場 | 山梨県北杜市 | L3 walkerplus |
| 平野田休養村キャンプ場 | 山梨県上野原市 | L3 walkerplus |
| 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | L3 walkerplus |
| 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | L3 walkerplus |
| ノースランドキャンパーズビレッジ | 山梨県甲斐市 | L3 walkerplus |
| BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | L3 walkerplus |
| 大人のキャンプ場 | 山梨県北杜市 | L3 walkerplus |
| LScamp山中湖 | 山梨県南都留郡山中湖村 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| 両国橋キャンプ場 | 山梨県南都留郡道志村49 | L1 doshi-kanko-jp |
| 道志渓谷キャンプ場 | 山梨県南都留郡道志村43 / 南都留郡道志村43 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot / L3 japancamp |
| 月夜野キャンプ場 | 山梨県南都留郡道志村950 | L1 doshi-kanko-jp / L2 nap-camp |
| 川端オートキャンプ場 | 山梨県南都留郡道志村3074 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot |
| 椿荘オートキャンプ場 | 山梨県南都留郡道志村4150 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot |
| 椿キャンプ場 | 山梨県南都留郡道志村4387 | L1 doshi-kanko-jp |
| 大栗オートキャンプ場 | 山梨県南都留郡道志村5334 | L1 doshi-kanko-jp / L2 jalan |
| ネイチャーランドオム | 山梨県南都留郡道志村5964 / 南都留郡道志村5964 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot / L3 japancamp |
| ニュー田代オートキャンプ場 | 山梨県南都留郡道志村5910 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot |
| オートキャンプINむじな | 山梨県南都留郡道志村9707 / 南都留郡道志村9707 | L1 doshi-kanko-jp / L3 japancamp |
| 花の森オートキャンピア | 山梨県南都留郡道志村9709-1 / 南都留郡道志村9709-1 | L1 doshi-kanko-jp / L2 jalan / L3 japancamp |
| オートキャンプせせらぎ | 山梨県南都留郡道志村10201 | L1 doshi-kanko-jp |
| ラビットオートキャンプ場 | 山梨県南都留郡道志村10176 / 山梨県南都留郡道志村10611 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot |
| 水の元オートキャンプ場 | 山梨県南都留郡道志村10220 | L1 doshi-kanko-jp |
| オートキャンプしろいだいら | 山梨県南都留郡道志村12272-1 / 山梨県南都留郡道志村11674 | L1 doshi-kanko-jp / L2 hinata-spot |
| リバーサイドマイシーン | 山梨県南都留郡道志村12344 | L1 doshi-kanko-jp |
| センタービレッジキャンプ場 | 山梨県南都留郡道志村12311 / 南都留郡道志村12311 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot / L3 japancamp |
| スカイバレーキャンプ場 | 山梨県南都留郡道志村11754-1 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot |
| とやの沢キャンプ場 | 山梨県南都留郡道志村12704 / 山梨県南都留郡道志村12433 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot |
| オートキャンプ長又 | 山梨県南都留郡道志村12697-2 | L1 doshi-kanko-jp |
| 山伏オートキャンプ場 | 山梨県南都留郡道志村12753-3 | L1 doshi-kanko-jp / L2 hinata-spot |
| 奥道志オートキャンプ場 | 山梨県南都留郡道志村12637 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot |
| 道志の森キャンプ場 | 山梨県南都留郡道志村10041 / 山梨県南都留郡道志村10701 / 山梨県南都留郡道志村 | L1 doshi-kanko-jp / L2 jalan / L2 hinata-spot / L3 walkerplus |
| 観光農園オートキャンプ場 | 山梨県南都留郡道志村9240 | L1 doshi-kanko-jp |
| やぐら沢キャンプ場 | 山梨県南都留郡道志村6735 | L1 doshi-kanko-jp / L2 nap-camp |
| 久保キャンプ場 | 山梨県南都留郡道志村2447 | L1 doshi-kanko-jp |
| 貸し別荘 となり | 山梨県南都留郡道志村5073-7 | L1 doshi-kanko-jp |
| 9じ17じ道志オートキャンプ場 | 山梨県南都留郡道志村10242 | L1 doshi-kanko-jp |
| 山光荘オートキャンプ | 山梨県南都留郡道志村11777 | L1 doshi-kanko-jp |
| 室久保グリーンパーク | 山梨県南都留郡道志村7329 | L1 doshi-kanko-jp |
| ブナの森キャンプ＆コテージ | 山梨県南都留郡道志村8461-10 | L1 doshi-kanko-jp / L2 hinata-spot |
| 久保キャンプ場 | 山梨県南都留郡道志村久保2447 | L2 jalan / L2 hinata-spot |
| 水源の森 キャンプ・ランド | 山梨県山梨県南都留郡道志村5821-2 | L2 jalan |
| オートキャンプ長又 | 山梨県南都留郡道志村長又12408 / 南都留郡道志村長又 | L2 jalan / L2 hinata-spot / L3 japancamp |
| 両国橋キャンプ場 湯川屋 | 山梨県南都留郡道志村月夜野49 | L2 jalan |
| 道志川荘キャンプ場 | 山梨県南都留郡道志村8316 | L2 jalan |
| 道志観光農園キャンプ場 | 山梨県南都留郡道志村東神地9240 | L2 jalan / L2 hinata-spot |
| オートキャンプｉｎむじな | 山梨県南都留郡道志村道志9707 | L2 jalan / L2 hinata-spot |
| 谷相郷キャンプ場 | 山梨県南都留郡道志村谷相7910 / 南都留郡道志村谷相7910 | L2 jalan / L2 hinata-spot / L3 japancamp |
| 下村キャンプ場 | 山梨県南都留郡道志村3112 | L2 jalan |
| 月夜野キャンプ場 | 山梨県南都留郡道志村大渡 / 山梨県南都留郡道志村大渡957 | L2 jalan / L2 hinata-spot |
| 山伏オートキャンプ場 | 山梨県南都留郡道志村長又 | L2 jalan |
| オートキャンプしろいだいら | 山梨県南都留郡道志村下白井平11674 | L2 jalan |
| 椿キャンプ場 | 山梨県南都留郡道志村椿4229 / 山梨県南都留郡道志村椿4387 | L2 jalan / L2 hinata-spot |
| 滝原オートキャンプ場 | 山梨県南都留郡道志村8438 | L2 jalan / L2 hinata-spot |
| モモンガの森 | 山梨県南都留郡道志村長又12498-7 | L2 jalan / L2 hinata-spot / L3 japancamp |
| 水之元オートキャンプ場 | 山梨県南都留郡道志村下善之木10220 | L2 hinata-spot |
| オートキャンプせせらぎ | 山梨県南都留郡道志村下善之木10202 | L2 hinata-spot |
| 室久保グリーンパーク | 山梨県南都留郡道志村西和出村7496 | L2 hinata-spot |
| やぐら沢キャンプ場 | 山梨県南都留郡道志村戸渡6735 | L2 hinata-spot |
| 花の森オートキャンピア | 山梨県南都留郡道志村上中山9709-1 | L2 hinata-spot |
| 道志 森のコテージ | 山梨県南都留郡道志村7895 | L2 hinata-spot |
| 下村キャンプ場 | 山梨県南都留郡道志村大室指3112 | L2 hinata-spot |
| 両国橋キャンプ場 | 山梨県南都留郡道志村月夜野49 | L2 hinata-spot |
| 大栗オートキャンプ場 | 山梨県南都留郡道志村大栗5334 | L2 hinata-spot |
| 道志川荘キャンプ場 | 山梨県南都留郡道志村川原畑8316 | L2 hinata-spot |
| 山伏オートキャンプ場 | 南都留郡道志村山伏峠 | L3 japancamp |
| 椿荘オートキャンプ場 | 南都留郡道志村大椿4219 | L3 japancamp |
| オートキャンプしろいだいら | 南都留郡道志村白井平 | L3 japancamp |
| ラビットオートキャンプ場 | 南都留郡道志村下善之木10179 | L3 japancamp |
| 滝原オートキャンプ場 | 南都留郡道志村川原畑 | L3 japancamp |
| 水之元オートキャンプ場 | 南都留郡道志村10220 | L3 japancamp |
| オートキャンプせせらぎ | 南都留郡道志村善之木10202 | L3 japancamp |
| 道志の森キャンプ場 | 南都留郡道志村三ヶ瀬10041 | L3 japancamp |
| スカイバレーキャンプ場 | 南都留郡道志村白井平11754-1 | L3 japancamp |

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
