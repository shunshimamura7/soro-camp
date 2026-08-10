# 地区スイープ: 相模原市緑区小倉

実行: 2026-08-10 14:10:30　/　`node scripts/district-sweep.js --district "相模原市緑区小倉"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **0** |
| IN_DATA（両方にある） | 0 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 1 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 相模原市観光協会 キャンプ場一覧 | OK | 22 | 0 |  |
| L1 | 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | OK | 17 | 0 |  |
| L2 | なっぷ kanagawa/sagamihara | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 18 | 0 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_141510000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_141510000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 相模原（kanto/kanagawa/1906） | OK | 29 | 0 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）神奈川県 | OK | 69 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/14-kanagawa/page/4/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/5/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/6/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/7/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/8/ → HTTP_404 |
| L3 | ウォーカープラス 神奈川県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（神奈川） | **L1_NOT_FOUND** | – | – | 神奈川県オープンデータカタログ（catalog.opendata.pref.kanagawa.jp）に観光施設一覧のデータセット無し。「観光」で該当3件はいずれも調査統計 |

取得したページ:

- `L1` https://www.e-sagamihara.com/camp/ → 200（キャッシュ）
  - 詳細ページ 22 件（住所の取得のため）
- `L1` https://midori.city.sagamihara.kanagawa.jp/category/play/camp/ → 200（キャッシュ）
- `L1` https://midori.city.sagamihara.kanagawa.jp/category/play/camp/page/2/ → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
- `L2` https://www.nap-camp.com/kanagawa/sagamihara/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/kanagawa/sagamihara/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/page_3/ → 404
  - 詳細ページ 18 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list?page=3 → 200（キャッシュ）
  - 詳細ページ 29 件（住所の取得のため）
- `L2` https://takibi-reservation.space/ → UNREACHABLE: fetch failed
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
| 相模原市観光協会 キャンプ場一覧 | 22 | 15 | 12 | 80% | doshi-no-yu-camp, ogurabashi-kasenjiki, takadabashi-kasenjiki |
| 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | 17 | 15 | 9 | 60% | aone, doshi-no-yu-camp, sagamiko-pleasure-camp, ogurabashi-kasenjiki, takadabashi-kasenjiki, fujino-art-camp |

## ORPHAN — データにあるが、どのソースにも出てこない

網羅率 70% 以上の L1 があるので、**判定として読める**。
ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `ogurabashi-kasenjiki` | 小倉橋河川敷 | 神奈川県相模原市緑区小倉 | active |  |

## IN_DATA — 両方にある

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
