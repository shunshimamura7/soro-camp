# 地区スイープ: 南都留郡山中湖村山中

実行: 2026-08-10 14:09:28　/　`node scripts/district-sweep.js --district "南都留郡山中湖村山中"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **1** |
| IN_DATA（両方にある） | 0 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 1 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 山中湖観光協会 キャンプ特集 | OK | 0 | 0 | 宿泊施設 11 件のうち、本文にキャンプ関連語があった 0 件を残した（判定語: キャンプ/テント/オートサイト/バンガロー/野営） |
| L2 | なっぷ yamanashi/yamanakako_oshino | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 6 | 0 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194250000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194250000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | OK | 18 | 1 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L1` https://lake-yamanakako.com/feature/camp → 200（キャッシュ）
  - 詳細ページ 11 件（住所の取得のため）
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
- `L2` https://takibi-reservation.space/ → UNREACHABLE: fetch failed
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

### 1. moss camp field

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
| 山中湖観光協会 キャンプ特集 | 0 | 6 | 0 | 0% | yamanakako-misaki, komeidoso-auto, muraei-yamanakako, fujigoko-auto-camp, fujinomori-yamanakako, yamanakako-minami-auto |

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
