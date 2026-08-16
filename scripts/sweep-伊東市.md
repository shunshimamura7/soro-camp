# 地区スイープ: 伊東市

実行: 2026-08-16 13:09:13　/　`node scripts/district-sweep.js --district "伊東市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **8** |
| IN_DATA（両方にある） | 2 |
| ORPHAN（データにあるがソースに無い） | 2 |
| データ側のこの地区のレコード | 4 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L2 | なっぷ shizuoka/izu | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 伊東市（cit_222080000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 3 | 3 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_222080000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_222080000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） | OK | 8 | 8 | 一覧は先頭3ページまで |
| L2 | hinata スポット 伊豆高原（tokai/shizuoka/2703） | OK | 2 | 1 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）静岡県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/22-shizuoka/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 静岡県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 伊東市公式（市サイト） | **L1_NOT_FOUND** | – | – | 観光行政ページにキャンプ場の記載が無い |
| L1 | 伊東観光協会（伊豆・伊東観光ガイド itospa.com） | **L1_NOT_FOUND** | – | – | 宿泊施設一覧・観光体験一覧のどちらにもキャンプ場のカテゴリが無く、一覧中にキャンプ場が1件も出てこない |
| L1 | 都道府県オープンデータ（静岡） | **L1_NOT_FOUND** | – | – | 静岡県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **伊東市公式（市サイト）** — 観光行政ページにキャンプ場の記載が無い
  - 確認: https://www.city.ito.shizuoka.jp/kanko/index.html
- **伊東観光協会（伊豆・伊東観光ガイド itospa.com）** — 宿泊施設一覧・観光体験一覧のどちらにもキャンプ場のカテゴリが無く、一覧中にキャンプ場が1件も出てこない
  - 確認: https://itospa.com/stay/index.html
  - 確認: https://itospa.com/spot/index.html

取得したページ:

- `L2` https://www.nap-camp.com/shizuoka/izu/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/izu/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222080000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222080000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_222080000/g2_04/page_3/ → 404
  - 詳細ページ 3 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2702/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2702/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2702/list?page=3 → 200（キャッシュ）
  - 詳細ページ 8 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2703/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2703/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2703/list?page=3 → 200（キャッシュ）
  - 詳細ページ 2 件（住所の取得のため）
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

### 1. 伊豆高原テントリゾート

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県伊東市池614-171 / 静岡県伊東市池614-168
- **出典**:
  - `L2` じゃらん観光ガイド 伊東市（cit_222080000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000218739/
  - `L2` hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） — https://camp-spot.hinata.me/spots/izukogen-tentresort

### 2. お宿らんたん

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県伊東市富戸887-16
- **出典**:
  - `L2` じゃらん観光ガイド 伊東市（cit_222080000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000188781/

### 3. 自由キャンプ場 伊東

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県伊東市荻649−2
- **出典**:
  - `L2` hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） — https://camp-spot.hinata.me/spots/02141

### 4. WEHOMEVILLA～城ケ崎温泉～

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県伊東市八幡野1086-66
- **出典**:
  - `L2` hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） — https://camp-spot.hinata.me/spots/wehome-jogasaki

### 5. ログハウスの宿LOG LOG inn

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県伊東市富戸1273ー131
- **出典**:
  - `L2` hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） — https://camp-spot.hinata.me/spots/log-log-inn

### 6. 貸別荘 レイクタウン

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県伊東市吉田836-93
- **出典**:
  - `L2` hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） — https://camp-spot.hinata.me/spots/kashibesso-laketown

### 7. 貸別荘 ロイヤルハイランド

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県伊東市十足関場614-160
- **出典**:
  - `L2` hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） — https://camp-spot.hinata.me/spots/kashibesso-loyal-highland

### 8. UMIHOTEL ANNEX

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県伊東市宇佐美1746-2
- **出典**:
  - `L2` hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） — https://camp-spot.hinata.me/spots/umihotel-annex

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
| `ito-marine-town-camp` | 伊東マリンタウンキャンプ場 | 静岡県伊東市湯川571-19 | unverified | true |
| `omuroyama-camp` | 伊東市青少年キャンプ場 | 静岡県伊東市池字柏戸676-1 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `usami-shiroyama` 宇佐美城山公園キャンプ場 | 宇佐美城山公園キャンプ場 USAMI SHIROYAMA CAMP FIELD | 名前 | MID | L2 |
| `izukogen-auto` 伊豆高原オートキャンプ場 | K's CAMP伊豆高原グランピング | 名前 | MID | L2 |

## 大字検査 — IN_DATA の突合が本当に同じ場所か

**判定には使っていない。**上の `MISSING` / `ORPHAN` / `IN_DATA` はこの節を見る前に確定している。

地区が市町村単位になったので、**名前だけで市内のどのレコードにも当たれる。**
大字の制約が外れたぶん、新しい誤突合が生まれうる。
そこで突合が成立した組だけを後から見て、両側の大字を比べている。
**もう一度大字単位でスイープしているのではない**（それをすると包含問題が検査側に戻る）。

| 分類 | 件数 |
|---|---:|
| **不一致（誤突合の疑い）** | **1** |
| 包含（粒度違い・無害） | 0 |
| 一致 | 1 |
| 検査対象外（どちらかの大字が取れない） | 0 |

> **★ 「不一致 1件」を「誤突合が 1件」と読まないこと。**
> 検査対象外が 0件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

### 不一致 — 大字が別

| データ側 | データ側の大字 | ソース側 | ソース側の大字 | 一致の根拠 |
|---|---|---|---|---|
| `izukogen-auto` 伊豆高原オートキャンプ場 | 池 | K's CAMP伊豆高原グランピング | 富戸 | 名前 |

**「不一致＝誤突合」でもない。**同じ施設でソース側の住所が古い、という型がある
（田貫湖の例: ソースが猪之頭、データが佐折。移転ではなく表記の世代違い）。
**1件ずつ人が見るための一覧**であって、自動で外す根拠には使わない。

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 10件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| b2（地区外） | 10 | 市区町村が別。地区の粒度とは無関係 |

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
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **9** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 11 件 | **11** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 1 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| なっぷ shizuoka/izu | 20 | 0 | 2 | 18 | 0 | OK |
| じゃらん観光ガイド 伊東市（cit_222080000 / ジャンル キャンプ・バンガロー・コテージ） | 3 | 0 | 3 | 0 | 0 | OK |
| hinata スポット 伊豆高原（tokai/shizuoka/2703） | 10 | 0 | 9 | 0 | 1 | OK |
| キャンナビ（japancamp.jp）静岡県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 静岡県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）9 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 宇久須キャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| 西伊豆オートキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| キャンプベアード | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| LScamp中伊豆（萬城の滝キャンプ場） | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| キャンプ黄金崎 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| ストーンチェアキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| 河津オートキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| 河津七滝オートキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |
| CampFantasea（キャンプファンタジア） | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/izu/list |

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
| CAMP BEAN | 静岡県伊豆市大平1499-2 | L2 hinata-spot |
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

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b3 — 住所なしの項目が合流したもの（漏れていない）

| 合流先 | 分類 | 合流した住所なしの出典 |
|---|---|---|
| 宇佐美城山公園キャンプ場 USAMI SHIROYAMA CAMP FIELD | IN_DATA | L2 nap-camp |

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
