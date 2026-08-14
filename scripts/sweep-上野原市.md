# 地区スイープ: 上野原市

実行: 2026-08-14 11:55:31　/　`node scripts/district-sweep.js --district "上野原市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **8** |
| IN_DATA（両方にある） | 0 |
| ORPHAN（データにあるがソースに無い） | 0 |
| データ側のこの地区のレコード | 0 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 上野原市公式 発見うえのはら キャンプ | OK | 4 | 3 |  |
| L2 | やまなし観光推進機構 大月・都留エリアのキャンプ場 | OK | 24 | 0 | 実測の内訳は 道志村20 / 都留市3 / 丹波山村1。大月市・上野原市は0件 |
| L2 | なっぷ yamanashi/otsuki_turushi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 上野原市（cit_192120000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 6 | 6 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_192120000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_192120000/g2_04/page_3/ → HTTP_404 |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 0 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 1 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L1` https://www.city.uenohara.yamanashi.jp/site/kankou/list152-468.html → 200
  - 詳細ページ 4 件（住所の取得のため）
- `L2` https://www.yamanashi-kankou.jp/special/yamanashicamp/otsuki.html → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192120000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192120000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_192120000/g2_04/page_3/ → 404
  - 詳細ページ 6 件（住所の取得のため）
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

### 1. 平野田休養村キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県上野原市西原7293 / 山梨県上野原市西原
- **表記ゆれ**: 平野田休養村キャンプ場 / 平野田休養村
- **出典**:
  - `L1` 上野原市公式 発見うえのはら キャンプ — https://www.city.uenohara.yamanashi.jp/site/kankou/1018585.html
  - `L2` じゃらん観光ガイド 上野原市（cit_192120000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000200111/
  - `L2` じゃらん観光ガイド 上野原市（cit_192120000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19441ca3430055340/

### 2. 緑と太陽の丘キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県上野原市秋山5030番地 / 山梨県上野原市秋山5030
- **出典**:
  - `L1` 上野原市公式 発見うえのはら キャンプ — https://www.city.uenohara.yamanashi.jp/site/kankou/1018586.html
  - `L2` じゃらん観光ガイド 上野原市（cit_192120000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19421ca3430054609/

### 3. ミューの森

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 上野原市棡原13880
- **出典**:
  - `L1` 上野原市公式 発見うえのはら キャンプ — https://www.city.uenohara.yamanashi.jp/site/kankou/1018584.html

### 4. CALM MOUNTAIN AKIYAMA（旧アオゲラの森キャンプ場）

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県上野原市秋山12003
- **同じ番地に別名**: CARM MOUNTAIN AKIYAMA（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 上野原市公式 発見うえのはら キャンプ — https://www.city.uenohara.yamanashi.jp/site/kankou/1018587.html

### 5. CARM MOUNTAIN AKIYAMA

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県上野原市秋山12003
- **同じ番地に別名**: CALM MOUNTAIN AKIYAMA（旧アオゲラの森キャンプ場）（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 上野原市（cit_192120000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000199751/

### 6. さがざわキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県上野原市秋山8788
- **出典**:
  - `L2` じゃらん観光ガイド 上野原市（cit_192120000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19421ca3430052774/

### 7. 西原ife体験宿したで

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県上野原市西原1738
- **出典**:
  - `L2` じゃらん観光ガイド 上野原市（cit_192120000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000220739/

### 8. 平野田休養村キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県上野原市
- **出典**:
  - `L3` ウォーカープラス 山梨県 — https://www.city.uenohara.yamanashi.jp/site/kankou/1018585.html

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 上野原市公式 発見うえのはら キャンプ | 4 | 0 | 0 | – | – |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

なし。

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
