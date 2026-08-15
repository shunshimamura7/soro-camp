# 地区スイープ: 厚木市七沢

実行: 2026-08-15 11:44:50　/　`node scripts/district-sweep.js --district "厚木市七沢"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-15 20:27:38

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **0** |
| IN_DATA（両方にある） | 0 |
| ORPHAN（データにあるがソースに無い） | 2 |
| データ側のこの地区のレコード | 2 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 厚木市観光協会 あつぎ観光なび 泊まる | OK | 1 | 0 | ホテル・旅館と同じ一覧。詳細ページの本文にキャンプ関連語があるかで選別している / 宿泊施設 29 件のうち、本文にキャンプ関連語があった 2 件を残した（判定語: キャンプ/テント/オートサイト/バンガロー/野営） |
| L2 | なっぷ kanagawa/atsugi_ebina | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 厚木市（cit_142120000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 1 | 0 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_142120000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_142120000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 厚木・海老名（kanto/kanagawa/1905） | OK | 6 | 0 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）神奈川県 | OK | 69 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/14-kanagawa/page/4/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/5/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/6/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/7/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/8/ → HTTP_404 |
| L3 | ウォーカープラス 神奈川県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 厚木市公式（市サイト） | **L1_NOT_FOUND** | – | – | 観光・施設のページにキャンプ場の一覧が無い。市営キャンプ場が無いため個別ページも立っていない |
| L1 | 都道府県オープンデータ（神奈川） | **L1_NOT_FOUND** | – | – | 神奈川県オープンデータカタログ（catalog.opendata.pref.kanagawa.jp）に観光施設一覧のデータセット無し。「観光」で該当3件はいずれも調査統計 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **厚木市公式（市サイト）** — 観光・施設のページにキャンプ場の一覧が無い。市営キャンプ場が無いため個別ページも立っていない
  - 確認: https://www.atsugi-kankou.jp/detailsearch/index.php

取得したページ:

- `L1` https://www.atsugi-kankou.jp/life/6/ → 200（キャッシュ）
  - 詳細ページ 29 件（住所の取得のため）
- `L2` https://www.nap-camp.com/kanagawa/atsugi_ebina/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/kanagawa/atsugi_ebina/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_142120000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_142120000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_142120000/g2_04/page_3/ → 404
  - 詳細ページ 1 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1905/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1905/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1905/list?page=3 → 200（キャッシュ）
  - 詳細ページ 6 件（住所の取得のため）
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
| 厚木市観光協会 あつぎ観光なび 泊まる | 1 | 1 | 0 | 0% | tiny-camp-village |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `nanasawa-camp` | 七沢キャンプ場 | 神奈川県厚木市七沢657 | unverified | true |
| `tiny-camp-village` | TINY CAMP VILLAGE | 神奈川県厚木市七沢1854 | active |  |

## IN_DATA — 両方にある

なし。

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **5** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 37 件 | **38** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 0 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 厚木市観光協会 あつぎ観光なび 泊まる | 1 | 0 | 0 | 0 | 1 | OK |
| なっぷ kanagawa/atsugi_ebina | 20 | 0 | 0 | 8 | 12 | OK |
| じゃらん観光ガイド 厚木市（cit_142120000 / ジャンル キャンプ・バンガロー・コテージ） | 1 | 0 | 0 | 0 | 1 | OK |
| hinata スポット 厚木・海老名（kanto/kanagawa/1905） | 6 | 0 | 0 | 0 | 6 | OK |
| キャンナビ（japancamp.jp）神奈川県 | 69 | 0 | 0 | 3 | 66 | OK |
| ウォーカープラス 神奈川県 | 10 | 0 | 0 | 0 | 10 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）5 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| WEINS PARK U-BASE CAMP | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/atsugi_ebina/list |
| 日向山荘 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/atsugi_ebina/list |
| 【H28/11現在閉鎖中】厚木市七沢弁天の森キャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/atsugi_ebina/list |
| TINY CAMP VILLAGE | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/atsugi_ebina/list |
| 青野原野呂ロッジキャンプ場 | L3 japancamp | 一覧に住所が無い | https://japancamp.jp/camp_area/14-kanagawa/ |

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
| クアハウス山小屋 | 神奈川県伊勢原市日向2184-1 | L2 nap-camp / L2 hinata-spot |
| 御所の入森のコテージ | 神奈川県伊勢原市日向1818 | L2 nap-camp / L2 hinata-spot |
| 泉の森ふれあいキャンプ場 | 神奈川県大和市上草柳1794 | L2 nap-camp / L2 hinata-spot |
| 滝沢園 キャンプ場 | 神奈川県秦野市戸川1445 / 秦野市戸川1445 | L2 nap-camp / L2 hinata-spot / L3 japancamp |
| 【R3/4現在閉鎖中】ふれあいの森日向キャンプ場 | 神奈川県伊勢原市日向2190-2 | L2 nap-camp / L2 hinata-spot |
| LOCAL BBQ伊勢原 | 神奈川県伊勢原市西富岡1399 | L2 hinata-spot |
| ウェルキャンプ西丹沢 | 足柄上郡山北町中川868 | L3 japancamp |
| 青根キャンプ場 | 相模原市津久井町青根807-2 | L3 japancamp |
| BOSCO Auto Camp Base | 秦野市丹沢寺山75 | L3 japancamp |
| このまさわキャンプ場 | 相模原市津久井町青根2745 | L3 japancamp |
| BIOTOPIA autocamp | 神奈川県足柄上郡大井町山田300 | L3 japancamp |
| Fun Space芦ノ湖キャンプ村レイクサイドヴィラ | 足柄下郡箱根町元箱根164 | L3 japancamp |
| 西丹沢 大滝キャンプ場 | 神奈川県足柄上郡山北町中川879−4 | L3 japancamp |
| 青野原オートキャンプ場 | 相模原市津久井町青野原918-2 | L3 japancamp |
| 西丹沢マウントブリッジキャンプ場 | 足柄上郡山北町中川867-7 | L3 japancamp |
| 【閉鎖中】ウッディハウス玄倉 | 足柄上郡山北町玄倉492-1 | L3 japancamp |
| 奥箒沢山の家 | 足柄上郡山北町中川825-1 | L3 japancamp |
| 桐花園キャンプ場 | 相模原市藤野町佐野川1822 | L3 japancamp |
| 西丹沢中川ロッヂ | 足柄上郡山北町中川897-111 | L3 japancamp |
| ひだまりの里オートキャンプ場 | 足柄上郡山北町神縄438 | L3 japancamp |
| 秋山川キャンプ場 | 相模原市藤野町名倉25 | L3 japancamp |
| 相模湖休養村キャンプ場 | 相模原市相模湖町寸沢嵐3574 | L3 japancamp |
| 山北町立河内川ふれあいビレッジ | 足柄上郡山北町湯触322-1 | L3 japancamp |
| リッチランド | 愛甲郡清川村煤ケ谷4513-1 | L3 japancamp |
| 新戸キャンプ場 | 相模原市相模湖町寸沢嵐2362 | L3 japancamp |
| さがみ湖リゾート プレジャーフォレスト PICAさがみ湖 | 相模原市緑区若柳1634番地相模湖リゾートプレジャーフォレスト内 | L3 japancamp |
| 神之川キャンプ場 | 相模原市津久井町青根3685 | L3 japancamp |
| ひだまりの里オートキャンプ場 | 神奈川県足柄上郡山北町 | L3 walkerplus |
| なみのこ村 | 神奈川県小田原市 | L3 walkerplus |
| このまさわキャンプ場 | 神奈川県相模原市緑区 | L3 walkerplus |
| PICAさがみ湖 | 神奈川県相模原市緑区 | L3 walkerplus |
| 緑の休暇村 青根キャンプ場 | 神奈川県相模原市緑区 | L3 walkerplus |
| 清川リバーランド | 神奈川県愛甲郡清川村 | L3 walkerplus |
| 滝沢園キャンプ場 | 神奈川県秦野市 | L3 walkerplus |
| キャンプ＆スパ 山の音 | 神奈川県足柄下郡箱根町 | L3 walkerplus |
| 長井海の手公園 ソレイユの丘・キャンプ場 The CLIFF CAMP&BBQ | 神奈川県横須賀市 | L3 walkerplus |
| 神之川キャンプ場・マス釣り場 | 神奈川県相模原市緑区 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| あつぎ飯山キャンプ場 | 厚木市飯山4955-1 / 神奈川県厚木市飯山4955-1 | L1 atsugi-kankou / L2 nap-camp / L2 jalan |

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
