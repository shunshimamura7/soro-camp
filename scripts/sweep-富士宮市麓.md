# 地区スイープ: 富士宮市麓

実行: 2026-08-10 14:11:13　/　`node scripts/district-sweep.js --district "富士宮市麓"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **2** |
| IN_DATA（両方にある） | 2 |
| ORPHAN（データにあるがソースに無い） | 0 |
| データ側のこの地区のレコード | 2 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L2 | なっぷ shizuoka/gotenba_fuzi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 12 | 1 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_222070000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_222070000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 御殿場・富士（tokai/shizuoka/2710） | OK | 58 | 3 | 一覧は先頭3ページまで / 住所を取りに行く詳細ページを 45 件で打ち切った（対象 58 件）。**打ち切った分はこの検査に載らない** |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）静岡県 | OK | 600 | 16 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 静岡県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 富士宮市公式（市サイト） | **L1_NOT_FOUND** | – | – | **2025年5月にサイトをリニューアルしており、検索に出る施設ページのURL（/1025110000/p001691.html 型）が全部404。**新URLでのキャンプ場一覧を特定できていない |
| L1 | 富士宮市観光協会（fujinomiya.gr.jp） | **L1_NOT_FOUND** | – | – | トップにキャンプ場の記載が無く、スポット一覧（/spot/）は404 |
| L1 | 都道府県オープンデータ（静岡） | **L1_NOT_FOUND** | – | – | 静岡県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **富士宮市公式（市サイト）** — **2025年5月にサイトをリニューアルしており、検索に出る施設ページのURL（/1025110000/p001691.html 型）が全部404。**新URLでのキャンプ場一覧を特定できていない
  - 確認: https://www.city.fujinomiya.lg.jp/1025110000/
  - 確認: https://www.city.fujinomiya.lg.jp/kanko/p001691.html
- **富士宮市観光協会（fujinomiya.gr.jp）** — トップにキャンプ場の記載が無く、スポット一覧（/spot/）は404
  - 確認: https://fujinomiya.gr.jp/
  - 確認: https://fujinomiya.gr.jp/spot/

取得したページ:

- `L2` https://www.nap-camp.com/shizuoka/gotenba_fuzi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/gotenba_fuzi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/page_3/ → 404
  - 詳細ページ 12 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list?page=3 → 200（キャッシュ）
  - 詳細ページ 45 件（住所の取得のため）
- `L2` https://takibi-reservation.space/ → UNREACHABLE: fetch failed
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

### 1. 富士オートキャンプ場ふもと村

- **分類**: MISSING
- **confidence**: MID（層: L2 + L3）
- **住所**: 静岡県富士宮市麓174-1 / 富士宮市麓174-1
- **出典**:
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000199371/
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fumotomura
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/2/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/3/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/4/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/5/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/6/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/7/
  - `L3` キャンナビ（japancamp.jp）静岡県 — https://japancamp.jp/camp_area/22-shizuoka/page/8/

### 2. 【閉鎖中】朝霧高原ふもとオートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 富士宮市麓浅野397
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

この市町村に L1 は無い（L1_NOT_FOUND）。**ORPHAN は判定として使えない。**

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

なし。

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `fumotoppara` ふもとっぱらキャンプ場 | ふもとっぱら（fumotoppara) | 名前 | LOW | L2 |
| `sorairo` 朝霧Camp Base そらいろ | 朝霧CampBaseそらいろ | 名前 | LOW | L2 |

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
