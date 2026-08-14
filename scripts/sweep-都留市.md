# 地区スイープ: 都留市

実行: 2026-08-14 11:39:51　/　`node scripts/district-sweep.js --district "都留市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **9** |
| IN_DATA（両方にある） | 2 |
| ORPHAN（データにあるがソースに無い） | 0 |
| データ側のこの地区のレコード | 2 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L2 | やまなし観光推進機構 大月・都留エリアのキャンプ場 | OK | 24 | 2 | 実測の内訳は 道志村20 / 都留市3 / 丹波山村1。大月市・上野原市は0件 |
| L2 | なっぷ yamanashi/otsuki_turushi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 都留市（cit_192040000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 6 | 6 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_192040000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_192040000/g2_04/page_3/ → HTTP_404 |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 40 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 1 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L2` https://www.yamanashi-kankou.jp/special/yamanashicamp/otsuki.html → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192040000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192040000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_192040000/g2_04/page_3/ → 404
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

### 1. 鹿留オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2 + L3）
- **住所**: 都留市鹿留1180 / 山梨県都留市鹿留1288番地 / 都留市鹿留1281
- **出典**:
  - `L2` やまなし観光推進機構 大月・都留エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_3133.html
  - `L2` じゃらん観光ガイド 都留市（cit_192040000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19204ca3432067545/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 2. ベリーパーク in ＦＩＳＨ-ＯＮ！鹿留

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県都留市鹿留1,543番地
- **出典**:
  - `L2` じゃらん観光ガイド 都留市（cit_192040000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19204ca3432067548/

### 3. すげのレジャー（キャンプ））

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県都留市大野2410
- **出典**:
  - `L2` じゃらん観光ガイド 都留市（cit_192040000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19204cb3532095132/

### 4. 大沢オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2 + L3）
- **住所**: 山梨県都留市鹿留2961 / 都留市鹿留1089
- **出典**:
  - `L2` じゃらん観光ガイド 都留市（cit_192040000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19204ca3432067547/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 5. ホテル&薬草風呂 スターらんど

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県都留市下谷2450-1
- **出典**:
  - `L2` じゃらん観光ガイド 都留市（cit_192040000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000160061/

### 6. 都留星と風キャンプフィールド

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 都留市大幡5119番地
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 7. THE FOREST

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 都留市戸沢1068
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 8. ＦＩＳＨ・ＯＮ！鹿留

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 都留市鹿留1543
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 9. せせらぎ荘キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県都留市
- **出典**:
  - `L3` ウォーカープラス 山梨県 — https://www.walkerplus.com/spot_list/ar0419/sg0112/

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
| `takaranoyama-fureai` 宝の山ふれあいの里キャンプ場 | 宝の山ふれあいの里 | 名前 | LOW | L2 |
| `nagomino-sato-tsuru` 都留戸沢の森 和みの里キャンプ場 | 都留市戸沢の森和みの里キャンプ場 | 番地（名前は不一致） | LOW | L2 |

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
