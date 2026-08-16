# 地区スイープ: 川根本町

実行: 2026-08-16 13:15:52　/　`node scripts/district-sweep.js --district "川根本町"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **2** |
| IN_DATA（両方にある） | 6 |
| ORPHAN（データにあるがソースに無い） | 3 |
| データ側のこの地区のレコード | 9 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 川根本町公式 キャンプ（詳細は川根本町観光協会 okuooi.gr.jp） | OK | 5 | 0 | **町公式の一覧は、全件が観光協会 okuooi.gr.jp の詳細ページへ直リンクしている。独立した2ソースではないので1ソースとして登録した（§6-15）。** |
| L2 | なっぷ shizuoka/oigawa_sumatakyo_kawane | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 川根本町（cit_224290000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 6 | 6 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_224290000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_224290000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 大井川・寸又峡・川根（tokai/shizuoka/2713） | OK | 12 | 7 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）静岡県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/22-shizuoka/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 静岡県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 川根本町観光協会（okuooi.gr.jp）を独立ソースとして | **L1_NOT_FOUND** | – | – | 町公式の一覧が観光協会の詳細ページへ全件直リンクしており、同じ元データ。独立した2ソースにならないので1ソースに畳んだ（§6-15）。**2026-08-16 追記: `okuooi.gr.jp` が robots.txt を403で返すため踏まなくなった。**町公式の一覧（5件）は取れるが、**詳細が全部 okuooi.gr.jp なので住所が0件になる**。住所が無いと地区が決まらないので、この L1 からは MISSING を立てられない。**「無い」ではなく「取らないと決めた」。**403 が解ければ自動で戻る |
| L1 | 都道府県オープンデータ（静岡） | **L1_NOT_FOUND** | – | – | 静岡県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **川根本町観光協会（okuooi.gr.jp）を独立ソースとして** — 町公式の一覧が観光協会の詳細ページへ全件直リンクしており、同じ元データ。独立した2ソースにならないので1ソースに畳んだ（§6-15）。**2026-08-16 追記: `okuooi.gr.jp` が robots.txt を403で返すため踏まなくなった。**町公式の一覧（5件）は取れるが、**詳細が全部 okuooi.gr.jp なので住所が0件になる**。住所が無いと地区が決まらないので、この L1 からは MISSING を立てられない。**「無い」ではなく「取らないと決めた」。**403 が解ければ自動で戻る
  - 確認: https://www.town.kawanehon.shizuoka.jp/kanko_site/tanoshimu/camp/index.html

取得したページ:

- `L1` https://www.town.kawanehon.shizuoka.jp/kanko_site/tanoshimu/camp/index.html → 200（キャッシュ）
  - 詳細ページ 5 件（住所の取得のため）
- `L2` https://www.nap-camp.com/shizuoka/oigawa_sumatakyo_kawane/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/oigawa_sumatakyo_kawane/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_224290000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_224290000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_224290000/g2_04/page_3/ → 404
  - 詳細ページ 6 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2713/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2713/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2713/list?page=3 → 200（キャッシュ）
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

### 1. いにしえの杜 鉄橋の杜キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県榛原郡川根本町崎平566
- **出典**:
  - `L2` hinata スポット 大井川・寸又峡・川根（tokai/shizuoka/2713） — https://camp-spot.hinata.me/spots/inishienomori

### 2. 時之栖 もりのくに

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県榛原郡川根本町奥泉840-1
- **出典**:
  - `L2` hinata スポット 大井川・寸又峡・川根（tokai/shizuoka/2713） — https://camp-spot.hinata.me/spots/tokinosumika-shizuoka

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 川根本町公式 キャンプ（詳細は川根本町観光協会 okuooi.gr.jp） | 5 | 6 | 5 | 83% | fudonotaki-auto |

## ORPHAN — データにあるが、どのソースにも出てこない

網羅率 70% 以上の L1 があるので、**判定として読める**。
ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `okooigawa-lake` | 奥大井湖上キャンプ場 | 静岡県榛原郡川根本町千頭 | unverified | true |
| `sumatakyo-camp` | 寸又峡温泉キャンプ場 | 静岡県榛原郡川根本町千頭1225 | unverified | true |
| `sessokyo-camp` | 接岨YANBY OUTDOOR FIELD | 静岡県榛原郡川根本町犬間 長嶋公園敷地内 | active | true |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `yagi-camp` 八木キャンプ場 | 八木キャンプ場 | 名前 | HIGH | L1+L2 |
| `apt-ichishiro` アプトいちしろキャンプ場 | アプトいちしろキャンプ場 | 名前 | HIGH | L1+L2 |
| `ikenoya-family` 池の谷ファミリーキャンプ場 | 池の谷ファミリーキャンプ場 | 名前 | HIGH | L1+L2 |
| `kunowaki-shinsui` くのわき親水公園キャンプ場 | くのわき親水公園キャンプ場 | 名前 | HIGH | L1+L2 |
| `mitsuboshi-auto` 三ツ星オートキャンプ場 | 三ツ星オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `fudonotaki-auto` 不動の滝自然広場オートキャンプ場 | 不動の滝キャンプ場 | 名前 | MID | L2 |

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
| 一致 | 6 |
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
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **4** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 15 件 | **15** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 6 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 川根本町公式 キャンプ（詳細は川根本町観光協会 okuooi.gr.jp） | 5 | 0 | 5 | 0 | 0 | OK |
| なっぷ shizuoka/oigawa_sumatakyo_kawane | 20 | 0 | 10 | 8 | 2 | OK |
| じゃらん観光ガイド 川根本町（cit_224290000 / ジャンル キャンプ・バンガロー・コテージ） | 6 | 0 | 6 | 0 | 0 | OK |
| hinata スポット 大井川・寸又峡・川根（tokai/shizuoka/2713） | 12 | 0 | 7 | 0 | 5 | OK |
| キャンナビ（japancamp.jp）静岡県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 静岡県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）4 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| びく石山 静かな夜のキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/oigawa_sumatakyo_kawane/list |
| ビンタンビンタングリーンヴィレッジ | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/oigawa_sumatakyo_kawane/list |
| 崎平 YANBY OUTDOOR FIELD | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/oigawa_sumatakyo_kawane/list |
| 接岨YANBY OUTDOOR FIELD | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/oigawa_sumatakyo_kawane/list |

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
| グリーンヴィレッジ川根 | 静岡県島田市川根町身成4856 | L2 nap-camp / L2 hinata-spot |
| 吉川キャンプ場カワセミの里 | 静岡県周智郡森町亀久保85-2 | L2 hinata-spot |
| 童子沢親水公園 | 静岡県島田市大代2477-16 | L2 hinata-spot |
| 八木キャンプ場 | 静岡県榛原郡川川根本町奥泉761-2 | L2 hinata-spot |
| 川根温泉ふれあいコテージ | 静岡県島田市川根町笹間渡220 | L2 hinata-spot |
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
| 八木キャンプ場 | IN_DATA | L1 kawanehon-town / L2 nap-camp |
| アプトいちしろキャンプ場 | IN_DATA | L1 kawanehon-town / L2 nap-camp |
| 池の谷ファミリーキャンプ場 | IN_DATA | L1 kawanehon-town / L2 nap-camp |
| くのわき親水公園キャンプ場 | IN_DATA | L1 kawanehon-town |
| 三ツ星オートキャンプ場 | IN_DATA | L1 kawanehon-town / L2 nap-camp |
| 不動の滝キャンプ場 | IN_DATA | L2 nap-camp |

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
