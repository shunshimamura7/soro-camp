# 地区スイープ: 伊東市池

実行: 2026-08-10 14:19:21　/　`node scripts/district-sweep.js --district "伊東市池"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

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
| L2 | なっぷ shizuoka/izu | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 伊東市（cit_222080000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 3 | 1 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_222080000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_222080000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 伊東・宇佐美・川奈（tokai/shizuoka/2702） | OK | 8 | 1 | 一覧は先頭3ページまで |
| L2 | hinata スポット 伊豆高原（tokai/shizuoka/2703） | OK | 2 | 0 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）静岡県 | OK | 600 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） |
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

この地区では出なかった。**ただし「掲載漏れが無い」という意味ではない**（上の限界を参照）。

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
| `omuroyama-camp` | 伊東市青少年キャンプ場 | 静岡県伊東市池字柏戸676-1 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `izukogen-auto` 伊豆高原オートキャンプ場 | 伊豆高原テントリゾート | 名前 | MID | L2 |

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
