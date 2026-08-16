# 地区スイープ: 静岡市

実行: 2026-08-16 14:08:09　/　`node scripts/district-sweep.js --district "静岡市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **12** |
| IN_DATA（両方にある） | 3 |
| ORPHAN（データにあるがソースに無い） | 3 |
| データ側のこの地区のレコード | 6 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L2 | なっぷ shizuoka/shizuoka_shimizu | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 静岡市葵区（cit_221010000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 6 | 6 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_221010000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_221010000/g2_04/page_3/ → HTTP_404 |
| L2 | じゃらん観光ガイド 静岡市清水区（cit_221030000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 2 | 2 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_221030000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_221030000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 静岡・清水（tokai/shizuoka/2711） | OK | 12 | 12 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）静岡県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/22-shizuoka/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 静岡県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | しずおか観光ナビ（静岡市観光公式・visit-shizuoka.com） | **L1_NOT_FOUND** | – | – | スポット一覧にキャンプのジャンル分けが無く、一覧ページにキャンプ場が1件も出てこない |
| L1 | 都道府県オープンデータ（静岡） | **L1_NOT_FOUND** | – | – | 静岡県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **しずおか観光ナビ（静岡市観光公式・visit-shizuoka.com）** — スポット一覧にキャンプのジャンル分けが無く、一覧ページにキャンプ場が1件も出てこない
  - 確認: https://www.visit-shizuoka.com/spot/index.html
  - 確認: https://www.visit-shizuoka.com/spots/?genre=camp

取得したページ:

- `L2` https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_221010000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_221010000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_221010000/g2_04/page_3/ → 404
  - 詳細ページ 6 件（住所の取得のため）
- `L2` https://www.jalan.net/kankou/cit_221030000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_221030000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_221030000/g2_04/page_3/ → 404
  - 詳細ページ 2 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2711/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2711/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2711/list?page=3 → 200（キャッシュ）
  - 詳細ページ 12 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/2/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/3/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/4/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/5/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/6/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/7/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/8/ → 403
- `L3` https://www.walkerplus.com/spot_list/ar0622/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. おきつがわオートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市清水区茂野島 / 静岡県静岡市清水区茂野島1100
- **出典**:
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2
  - `L2` じゃらん観光ガイド 静岡市清水区（cit_221030000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000226859/
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/okitsugawa

### 2. 藤川キャンプヒルLUNA・Luna

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市葵区黒俣2735
- **出典**:
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/luna-luna

### 3. 静岡市梅ヶ島キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市葵区梅ヶ島3198
- **出典**:
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/shizuoka-umegashima

### 4. 静岡県県民の森キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市葵区岩崎284 / 静岡県静岡市葵区岩崎字穴入284
- **表記ゆれ**: 静岡県県民の森キャンプ場 / 県民の森キャンプ場 / 静岡県県民の森
- **出典**:
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2
  - `L2` じゃらん観光ガイド 静岡市葵区（cit_221010000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_22201ca3430055307/
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/shizuokakenminnomori

### 5. 清水森林公園 黒川キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市清水区西里1310-1
- **同じ番地に別名**: 黒川キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/shimizu-shinrinpark

### 6. 静岡市浜石野外センター

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市清水区由比阿僧934-6
- **出典**:
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/shizuoka-hamaishi

### 7. 井川青少年キャンプセンター

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市葵区井川3055-1
- **出典**:
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list
  - `L2` なっぷ shizuoka/shizuoka_shimizu — https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list?page=2
  - `L2` じゃらん観光ガイド 静岡市葵区（cit_221010000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_22201ca3430054864/
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/ikawaseishonen

### 8. 静岡市玉川キャンプセンター

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県静岡市葵区長妻田755番地 / 静岡県静岡市葵区長妻田755
- **出典**:
  - `L2` じゃらん観光ガイド 静岡市葵区（cit_221010000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_22201ca3430054074/
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/shizuoka-tamagawa

### 9. 梅ケ島キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県静岡市葵区梅ケ島3198番地地先
- **出典**:
  - `L2` じゃらん観光ガイド 静岡市葵区（cit_221010000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_22201ca3430054258/

### 10. TAKIBIBAキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県静岡市葵区牧ケ谷
- **出典**:
  - `L2` じゃらん観光ガイド 静岡市葵区（cit_221010000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000226491/

### 11. WholeEarthCommunications

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県静岡市駿河区高松字浜地3093-6
- **出典**:
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/wec

### 12. 赤石小屋

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県静岡市葵区田代
- **出典**:
  - `L2` hinata スポット 静岡・清水（tokai/shizuoka/2711） — https://camp-spot.hinata.me/spots/akaishi-koya

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
| `kokono-shizuoka` | キャンプ場此処野静岡 | 静岡県静岡市葵区新間2082 | active |  |
| `tsuchimura` | 土村キャンプ場 | 静岡県静岡市清水区土20 | active |  |
| `nishizato-camp-tekichi` | 西里キャンプ適地 | 静岡県静岡市清水区西里 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `magic-hour-camp` magic hour | magichour camp | 名前 | MID | L2 |
| `ikawa-auto` 南アルプス井川オートキャンプ場 | 南アルプス井川オートキャンプ場 | 名前 | MID | L2 |
| `kurokawa-shizuoka` 黒川キャンプ場（清水森林公園） | 黒川キャンプ場 | 名前 | LOW | L2 |

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
| 一致 | 3 |
| 検査対象外（どちらかの大字が取れない） | 0 |

> **★ 「不一致 0件」を「誤突合が 0件」と読まないこと。**
> 検査対象外が 0件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 10件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| `b2（地区外）` | 10 | 市区町村が別。地区の粒度とは無関係 |

<details><summary>内訳（項目ごと）</summary>

| ソース | 名前 | 住所 | 行き先 |
|---|---|---|---|
| `walkerplus` | 市民の森(沼津市) | 静岡県沼津市 | b2（地区外） |
| `walkerplus` | おれっぷ大久保キャンプ場 | 静岡県藤枝市 | b2（地区外） |
| `walkerplus` | 御殿場欅平ファミリーキャンプ場 | 静岡県御殿場市 | b2（地区外） |
| `walkerplus` | GRAN REGALO ASAGIRI (グランレガロあさぎり) | 静岡県富士宮市 | b2（地区外） |
| `walkerplus` | 富士山こどもの国オートキャンプ場 | 静岡県富士市 | b2（地区外） |
| `walkerplus` | 南伊豆夕日ヶ丘キャンプ場 | 静岡県賀茂郡南伊豆町 | b2（地区外） |
| `walkerplus` | 朝霧高原オートキャンプ場 | 静岡県富士宮市 | b2（地区外） |
| `walkerplus` | MT. FUJI SATOYAMA VACATION (マウントフジ里山バケーション) | 静岡県富士宮市 | b2（地区外） |
| `walkerplus` | 竜洋海洋公園オートキャンプ場 | 静岡県磐田市 | b2（地区外） |
| `walkerplus` | PICA富士ぐりんぱ | 静岡県裾野市 | b2（地区外） |

</details>

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **1** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 10 件 | **10** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 9 |

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
| なっぷ shizuoka/shizuoka_shimizu | 20 | 0 | 18 | 2 | 0 | OK |
| じゃらん観光ガイド 静岡市清水区（cit_221030000 / ジャンル キャンプ・バンガロー・コテージ） | 8 | 0 | 8 | 0 | 0 | OK |
| hinata スポット 静岡・清水（tokai/shizuoka/2711） | 12 | 0 | 12 | 0 | 0 | OK |
| キャンナビ（japancamp.jp）静岡県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 静岡県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）1 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| キャンプ場此処野静岡 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/shizuoka_shimizu/list |

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
| 市民の森(沼津市) | 静岡県沼津市 | L3 walkerplus |
| おれっぷ大久保キャンプ場 | 静岡県藤枝市 | L3 walkerplus |
| 御殿場欅平ファミリーキャンプ場 | 静岡県御殿場市 | L3 walkerplus |
| GRAN REGALO ASAGIRI (グランレガロあさぎり) | 静岡県富士宮市 | L3 walkerplus |
| 富士山こどもの国オートキャンプ場 | 静岡県富士市 | L3 walkerplus |
| 南伊豆夕日ヶ丘キャンプ場 | 静岡県賀茂郡南伊豆町 | L3 walkerplus |
| 朝霧高原オートキャンプ場 | 静岡県富士宮市 | L3 walkerplus |
| MT. FUJI SATOYAMA VACATION (マウントフジ里山バケーション) | 静岡県富士宮市 | L3 walkerplus |
| 竜洋海洋公園オートキャンプ場 | 静岡県磐田市 | L3 walkerplus |
| PICA富士ぐりんぱ | 静岡県裾野市 | L3 walkerplus |

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
| magichour camp | IN_DATA | L2 nap-camp |
| おきつがわオートキャンプ場 | MISSING | L2 nap-camp |
| 藤川キャンプヒルLUNA・Luna | MISSING | L2 nap-camp |
| 静岡市梅ヶ島キャンプ場 | MISSING | L2 nap-camp |
| 静岡県県民の森キャンプ場 | MISSING | L2 nap-camp |
| 清水森林公園 黒川キャンプ場 | MISSING | L2 nap-camp |
| 南アルプス井川オートキャンプ場 | IN_DATA | L2 nap-camp |
| 静岡市浜石野外センター | MISSING | L2 nap-camp |
| 井川青少年キャンプセンター | MISSING | L2 nap-camp |

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
