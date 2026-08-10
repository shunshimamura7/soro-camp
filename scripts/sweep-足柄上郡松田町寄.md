# 地区スイープ: 足柄上郡松田町寄

実行: 2026-08-10 14:19:35　/　`node scripts/district-sweep.js --district "足柄上郡松田町寄"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

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
| L1 | 松田町公式 観光サイト キャンプ場 | OK | 1 | 1 |  |
| L2 | なっぷ kanagawa/ashigara | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 松田町（cit_143630000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 4 | 4 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_143630000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_143630000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 足柄（kanto/kanagawa/1909） | OK | 24 | 1 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）神奈川県 | OK | 69 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/14-kanagawa/page/4/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/5/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/6/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/7/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/8/ → HTTP_404 |
| L3 | ウォーカープラス 神奈川県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 松田町観光協会 | **L1_NOT_FOUND** | – | – | 町公式の観光サイト（kankou-sub）が観光協会のページを兼ねていて、独立した協会サイトの施設一覧が無い（§6-15） |
| L1 | 都道府県オープンデータ（神奈川） | **L1_NOT_FOUND** | – | – | 神奈川県オープンデータカタログ（catalog.opendata.pref.kanagawa.jp）に観光施設一覧のデータセット無し。「観光」で該当3件はいずれも調査統計 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **松田町観光協会** — 町公式の観光サイト（kankou-sub）が観光協会のページを兼ねていて、独立した協会サイトの施設一覧が無い（§6-15）
  - 確認: https://town.matsuda.kanagawa.jp/site/kankou-sub/camp.html

取得したページ:

- `L1` https://town.matsuda.kanagawa.jp/site/kankou-sub/camp.html → 200（キャッシュ）
  - 詳細ページ 1 件（住所の取得のため）
- `L2` https://www.nap-camp.com/kanagawa/ashigara/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/kanagawa/ashigara/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_143630000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_143630000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_143630000/g2_04/page_3/ → 404
  - 詳細ページ 4 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1909/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1909/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1909/list?page=3 → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
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

### 1. 南丹沢清津峡キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 神奈川県足柄上郡松田町寄1111-2
- **出典**:
  - `L1` 松田町公式 観光サイト キャンプ場 — https://town.matsuda.kanagawa.jp/site/kankou-sub/kiyotsukyo.html

### 2. 蜂花苑やどろぎ荘ミロクキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 神奈川県足柄上郡松田町寄4380番1
- **表記ゆれ**: 蜂花苑やどろぎ荘ミロクキャンプ場 / 蜂花苑やどろぎ荘
- **同じ番地に別名**: ミロクキャンプ場 / 蜂花苑キャンプ場(やどろぎ荘・ミロクキャンプ場)（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` なっぷ kanagawa/ashigara — https://www.nap-camp.com/kanagawa/ashigara/list
  - `L2` なっぷ kanagawa/ashigara — https://www.nap-camp.com/kanagawa/ashigara/list?page=2
  - `L2` じゃらん観光ガイド 松田町（cit_143630000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14363ca3432102364/

### 3. ミロクキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡松田町寄4380番地1 (総合受付:やどろぎ荘)
- **同じ番地に別名**: 蜂花苑やどろぎ荘ミロクキャンプ場 / 蜂花苑キャンプ場(やどろぎ荘・ミロクキャンプ場)（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 松田町（cit_143630000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14363ca3432102383/

### 4. ぽにぃている

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡松田町寄5239
- **出典**:
  - `L2` じゃらん観光ガイド 松田町（cit_143630000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000229726/

### 5. 蜂花苑キャンプ場(やどろぎ荘・ミロクキャンプ場)

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡松田町寄4380番1
- **同じ番地に別名**: 蜂花苑やどろぎ荘ミロクキャンプ場 / ミロクキャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/houkaen

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 松田町公式 観光サイト キャンプ場 | 1 | 1 | 0 | 0% | hachibanaen-miroku |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `yadoriki-camp` | やどりき水源林キャンプ場 | 神奈川県足柄上郡松田町寄3048 | active | true |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `hachibanaen-miroku` 蜂花苑 寄・中津川 源流の郷キャンプ場 | PLUS ALPHA SAUNA-ミロクキャンプ場- | 番地（名前は不一致） | LOW | L2 |

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
