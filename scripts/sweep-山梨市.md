# 地区スイープ: 山梨市

実行: 2026-08-16 14:07:33　/　`node scripts/district-sweep.js --district "山梨市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **5** |
| IN_DATA（両方にある） | 1 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 2 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L2 | なっぷ yamanashi/isawa_katsunuma_enzan | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 山梨市（cit_192050000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 3 | 3 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_192050000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_192050000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 甲府・湯村・昇仙峡（koushinetsu/yamanashi/2001） | OK | 7 | 2 | 一覧は先頭3ページまで |
| L2 | hinata スポット 石和・勝沼・塩山（koushinetsu/yamanashi/2002） | OK | 14 | 2 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）山梨県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/19-yamanashi/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 山梨市公式（観光課） | **L1_NOT_FOUND** | – | – | 観光施設のページは温泉・道の駅・イベントのみで、キャンプ場が1件も無い |
| L1 | 山梨市観光協会 | **L1_NOT_FOUND** | – | – | 観光施設・宿泊のどちらの一覧にもキャンプ場が無い |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **山梨市公式（観光課）** — 観光施設のページは温泉・道の駅・イベントのみで、キャンプ場が1件も無い
  - 確認: https://www.city.yamanashi.yamanashi.jp/soshiki/17/
- **山梨市観光協会** — 観光施設・宿泊のどちらの一覧にもキャンプ場が無い
  - 確認: https://www.yamanashishi-kankou.com/nature-facilities/
  - 確認: https://www.yamanashishi-kankou.com/stay/

取得したページ:

- `L2` https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192050000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192050000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_192050000/g2_04/page_3/ → 404
  - 詳細ページ 3 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2001/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2001/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2001/list?page=3 → 200（キャッシュ）
  - 詳細ページ 7 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2002/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2002/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2002/list?page=3 → 200（キャッシュ）
  - 詳細ページ 14 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/2/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/3/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/4/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/5/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/6/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/7/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/8/ → 403
- `L3` https://www.walkerplus.com/spot_list/ar0419/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. 7inchCAMP ミチノエキミトミDOG BASE

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県山梨市牧丘町北原1786
- **表記ゆれ**: 7inchCAMP ミチノエキミトミDOG BASE / 7inch CAMP
- **出典**:
  - `L2` なっぷ yamanashi/isawa_katsunuma_enzan — https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list
  - `L2` なっぷ yamanashi/isawa_katsunuma_enzan — https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list?page=2
  - `L2` じゃらん観光ガイド 山梨市（cit_192050000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19205ca3439718953/

### 2. マキオカネイチャークラブ

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県山梨市牧丘町北原1342
- **出典**:
  - `L2` なっぷ yamanashi/isawa_katsunuma_enzan — https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list
  - `L2` なっぷ yamanashi/isawa_katsunuma_enzan — https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list?page=2
  - `L2` じゃらん観光ガイド 山梨市（cit_192050000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000199786/
  - `L2` hinata スポット 石和・勝沼・塩山（koushinetsu/yamanashi/2002） — https://camp-spot.hinata.me/spots/makioka

### 3. 瀬音村こもれびの森キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県山梨市三富川浦円川1613
- **出典**:
  - `L2` じゃらん観光ガイド 山梨市（cit_192050000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000225220/

### 4. パインウッドオートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県山梨市大工2483
- **出典**:
  - `L2` hinata スポット 甲府・湯村・昇仙峡（koushinetsu/yamanashi/2001） — https://camp-spot.hinata.me/spots/pine_wood

### 5. 笛吹小屋キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県山梨市三富川浦1820
- **出典**:
  - `L2` hinata スポット 石和・勝沼・塩山（koushinetsu/yamanashi/2002） — https://camp-spot.hinata.me/spots/fuefukigoya

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

この市町村に L1 は無い（L1_NOT_FOUND）。**ORPHAN は判定として使えない。**

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `makioka-fruits-camp` | 牧丘フルーツ村キャンプ場 | 山梨県山梨市牧丘町牧平3041 | unverified | true |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `hottarakashi-camp` ほったらかしキャンプ場 | HOTTARAKASHI CAMPING FIELD（ほったらかしキャンピングフィールド） | 番地（名前は不一致） | LOW | L2 |

## 大字検査 — IN_DATA の突合が本当に同じ場所か

**判定には使っていない。**上の `MISSING` / `ORPHAN` / `IN_DATA` はこの節を見る前に確定している。

地区が市町村単位になったので、**名前だけで市内のどのレコードにも当たれる。**
大字の制約が外れたぶん、新しい誤突合が生まれうる。
そこで突合が成立した組だけを後から見て、両側の大字を比べている。
**もう一度大字単位でスイープしているのではない**（それをすると包含問題が検査側に戻る）。

| 分類 | 件数 |
|---|---:|
| **不一致（誤突合の疑い）** | **0** |
| 包含（粒度違い・無害） | 0 |
| 一致 | 1 |
| 検査対象外（どちらかの大字が取れない） | 0 |

> **★ 「不一致 0件」を「誤突合が 0件」と読まないこと。**
> 検査対象外が 0件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 15件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| `b2（地区外）` | 15 | 市区町村が別。地区の粒度とは無関係 |

<details><summary>内訳（項目ごと）</summary>

| ソース | 名前 | 住所 | 行き先 |
|---|---|---|---|
| `hinata-spot` | 玉川キャンプ村 | 山梨県北都留郡小菅村2457-4 | b2（地区外） |
| `hinata-spot` | ファミリー倶楽部 キャンプ場 | 山梨県北都留郡小菅村4838 | b2（地区外） |
| `hinata-spot` | 東キャンプ場 | 山梨県山梨県北都留郡丹波山村3008 | b2（地区外） |
| `hinata-spot` | 平山キャンプ場 | 山梨県北都留郡小菅村3974 | b2（地区外） |
| `hinata-spot` | 木下ファミリーキャンプ場 | 山梨県北都留郡丹波山村1903 | b2（地区外） |
| `walkerplus` | せせらぎ荘キャンプ場 | 山梨県都留市 | b2（地区外） |
| `walkerplus` | フレンドパークむかわ キャンプ場 | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | ACNオートリゾートパーク・ビッグランド | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | 平野田休養村キャンプ場 | 山梨県上野原市 | b2（地区外） |
| `walkerplus` | 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | b2（地区外） |
| `walkerplus` | 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | ノースランドキャンパーズビレッジ | 山梨県甲斐市 | b2（地区外） |
| `walkerplus` | BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | 道志の森キャンプ場 | 山梨県南都留郡道志村 | b2（地区外） |
| `walkerplus` | 大人のキャンプ場 | 山梨県北杜市 | b2（地区外） |

</details>

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **6** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 27 件 | **27** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 2 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**理由は案C（2026-08-16）で変わった。

**旧**（大字単位の地区）は「同じ市の別の大字」が b2 の大半だった。
**いまは地区＝市区町村なので、その状態が存在しない。**市が一致すれば必ず地区内。

残るのは**広域ソースの取りこぼし**。じゃらんは市全体、なっぷ・hinata は広域、
ウォーカープラスとキャンナビは**県全体**を返すので、
**他の市町村ぶんは必ずここに落ちる。**件数の大きさ自体は異常の根拠にならない。

**疑うのは「この市区町村の住所を持つのに地区外に落ちたもの」**＝下の b2-b。
**案C後は定義上0件になる。**0件を「測れていない」ではなく
**「市町村単位になっていることの確認」**と読むこと。

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| なっぷ yamanashi/isawa_katsunuma_enzan | 20 | 0 | 4 | 12 | 4 | OK |
| じゃらん観光ガイド 山梨市（cit_192050000 / ジャンル キャンプ・バンガロー・コテージ） | 3 | 0 | 3 | 0 | 0 | OK |
| hinata スポット 石和・勝沼・塩山（koushinetsu/yamanashi/2002） | 21 | 0 | 4 | 0 | 17 | OK |
| キャンナビ（japancamp.jp）山梨県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 山梨県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）6 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 琴川キャンプ場 & サウナ琴川 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list |
| 御坂路さくら公園オートキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list |
| ワインの宿東夢 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list |
| 甲武キャンプ村 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list |
| Mt.Kentoku Fish&Lodge（マウント ケントク フィッシュ＆ロッジ） | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list |
| 嵯峨塩labo | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/isawa_katsunuma_enzan/list |

#### b1-2 — 詳細ページの取得に失敗して住所が取れなかった

**これは直せる可能性がある。**`fetchPage` は成功したものしかキャッシュしないので、
失敗した詳細ページは毎回取りに行って毎回失敗する。URL が生きているか確認すること。

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b2-a — 住所の市区町村が、この地区の市区町村と違う

**案C後の b2 はここに全部入る。**広域ソースが他の市町村ぶんを含んでいるだけのことが大半
（じゃらんは市全体、なっぷ・hinata は広域、ウォーカープラスとキャンナビは**県全体**）。
**件数が多いこと自体は異常の根拠にならない。**

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| 玉川キャンプ村 | 山梨県北都留郡小菅村2457-4 | L2 nap-camp / L2 hinata-spot |
| 黒坂オートキャンプ場 | 山梨県笛吹市境川町大黒坂1070 | L2 nap-camp / L2 hinata-spot |
| スリーストーン | 山梨県山梨県甲府市横根町1182-338-2 | L2 hinata-spot |
| newsakuraresort | 山梨県甲斐市亀沢亀沢6949-96 | L2 hinata-spot |
| LOOF TINY HOUSE CAMP | 山梨県笛吹市芦川町鶯宿620−1 | L2 hinata-spot |
| 創作の森おびな | 山梨県甲府市下帯那町24 | L2 hinata-spot |
| IPPEN | 兵庫県美方郡香美町香住区七日市308 | L2 hinata-spot |
| 一の瀬高原キャンプ場 | 山梨県甲州市塩山一ノ瀬高橋560 | L2 hinata-spot |
| オートキャンプすずらん | 山梨県笛吹市芦川町上芦川1808 | L2 hinata-spot |
| 日川渓谷レジャーセンター | 山梨県甲州市大和町田野3 | L2 hinata-spot |
| 芦川オートキャンプ場 | 山梨県笛吹市芦川町中芦川入沢1393 | L2 hinata-spot |
| 古民家宿LOOF澤之家 | 山梨県笛吹市芦川町中芦川559-1 | L2 hinata-spot |
| 古民家宿LOOF坂之家 | 山梨県笛吹市芦川町中芦川107 | L2 hinata-spot |
| ファミリー倶楽部 キャンプ場 | 山梨県北都留郡小菅村4838 | L2 hinata-spot |
| 東キャンプ場 | 山梨県山梨県北都留郡丹波山村3008 | L2 hinata-spot |
| 平山キャンプ場 | 山梨県北都留郡小菅村3974 | L2 hinata-spot |
| 木下ファミリーキャンプ場 | 山梨県北都留郡丹波山村1903 | L2 hinata-spot |
| せせらぎ荘キャンプ場 | 山梨県都留市 | L3 walkerplus |
| フレンドパークむかわ キャンプ場 | 山梨県北杜市 | L3 walkerplus |
| ACNオートリゾートパーク・ビッグランド | 山梨県北杜市 | L3 walkerplus |
| 平野田休養村キャンプ場 | 山梨県上野原市 | L3 walkerplus |
| 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | L3 walkerplus |
| 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | L3 walkerplus |
| ノースランドキャンパーズビレッジ | 山梨県甲斐市 | L3 walkerplus |
| BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | L3 walkerplus |
| 道志の森キャンプ場 | 山梨県南都留郡道志村 | L3 walkerplus |
| 大人のキャンプ場 | 山梨県北杜市 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**案C後は0件になる。**地区が市区町村単位なので、市が一致すれば必ず地区内で、
「市は同じで大字が違う」という状態が存在しない（旧・大字単位では実測2,014件あった）。
**0件は「測れていない」ではなく「市町村単位になっている」ことの確認。**
**1件でも出たら地区の作り方が壊れている。**

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b3 — 住所なしの項目が合流したもの（漏れていない）

| 合流先 | 分類 | 合流した住所なしの出典 |
|---|---|---|
| 7inchCAMP ミチノエキミトミDOG BASE | MISSING | L2 nap-camp |
| マキオカネイチャークラブ | MISSING | L2 nap-camp |

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
