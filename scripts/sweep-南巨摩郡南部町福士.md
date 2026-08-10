# 地区スイープ: 南巨摩郡南部町福士

実行: 2026-08-10 10:26:55　/　`node scripts/district-sweep.js --district "南巨摩郡南部町福士"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **2** |
| IN_DATA（両方にある） | 4 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 5 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L2 | なっぷ yamanashi/shimobe_minobu_hayakawa | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 南部町（cit_193660000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 4 | 4 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_193660000/g2_04/page_2/ → HTTP_429 / https://www.jalan.net/kankou/cit_193660000/g2_04/page_3/ → HTTP_429 |
| L2 | hinata スポット 下部・身延・早川（koushinetsu/yamanashi/2006） | OK | 8 | 4 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 16 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 南部町公式（観光ページ） | **L1_NOT_FOUND** | – | – | 宿泊施設・レジャー・公園のどのページにもキャンプ場の記載が無い。公園一覧に佐野川河川公園も無い |
| L1 | 南部町観光協会 | **L1_NOT_FOUND** | – | – | 独立した観光協会サイトが見つからない（町公式の観光ページが兼ねている） |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **南部町公式（観光ページ）** — 宿泊施設・レジャー・公園のどのページにもキャンプ場の記載が無い。公園一覧に佐野川河川公園も無い
  - 確認: https://www.town.nanbu.yamanashi.jp/kankou/shukuhaku/index.html
  - 確認: https://www.town.nanbu.yamanashi.jp/kankou/leisure/index.html
  - 確認: https://www.town.nanbu.yamanashi.jp/kankou/park/index.html
- **南部町観光協会** — 独立した観光協会サイトが見つからない（町公式の観光ページが兼ねている）
  - 確認: https://www.town.nanbu.yamanashi.jp/kankou/index.html

取得したページ:

- `L2` https://www.nap-camp.com/yamanashi/shimobe_minobu_hayakawa/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/shimobe_minobu_hayakawa/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_193660000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_193660000/g2_04/page_2/ → 429
- `L2` https://www.jalan.net/kankou/cit_193660000/g2_04/page_3/ → 429
  - 詳細ページ 4 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2006/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2006/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2006/list?page=3 → 200（キャッシュ）
  - 詳細ページ 8 件（住所の取得のため）
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

### 1. 福士川オートキャプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南巨摩郡南部町福士19867
- **同じ番地に別名**: 福士川オートキャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 南部町（cit_193660000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19367ca3430052766/

### 2. 福士川根熊山荘ファミリーオートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南巨摩郡南部町福士西根熊15854
- **出典**:
  - `L2` hinata スポット 下部・身延・早川（koushinetsu/yamanashi/2006） — https://camp-spot.hinata.me/spots/fukushigawanegumasanso

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
| `lumberjack-nanbu` | ランバージャック | 山梨県南巨摩郡南部町福士16407 | unverified |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `fukushigawa-seishonen` 青少年旅行村（キャンプ場） | 福士川渓谷青少年旅行村奥山キャンプ場 | 名前 | MID | L2 |
| `turkeys-house` ターキーズハウス 江ノ電に泊まれるキャンプ場 | ターキーズハウス 江ノ電に泊まれるキャンプ場 | 名前 | MID | L2 |
| `nekumasanso-auto` 福士川根熊山荘ファミリーオートキャンプ場 | 福士川根熊山荘ファミリーオートキャンプ場 | 名前 | LOW | L2+L3 |
| `fukushigawa-auto` 福士川オートキャンプ場 | 福士川オートキャンプ場 | 名前 | LOW | L2+L3 |

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
