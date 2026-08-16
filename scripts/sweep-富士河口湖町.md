# 地区スイープ: 富士河口湖町

実行: 2026-08-16 14:07:22　/　`node scripts/district-sweep.js --district "富士河口湖町"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **37** |
| IN_DATA（両方にある） | 10 |
| ORPHAN（データにあるがソースに無い） | 5 |
| データ側のこの地区のレコード | 15 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる | SKIPPED_ROBOTS | **測れず**（0） | – | ホテル・旅館と同じ一覧。詳細ページの本文にキャンプ関連語があるかで選別している。町公式サイトはこのサイトへ誘導しているだけなので1ソース扱い（§6-15） / https://fujisan.ne.jp/sightseeing-category/stay/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/2/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/3/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/4/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/5/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/6/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/7/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/8/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/9/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/10/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/11/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/12/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/13/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/14/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/15/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/16/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/17/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/18/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/19/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/20/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/21/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/22/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/23/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/24/ → SKIPPED_ROBOTS_403 / https://fujisan.ne.jp/sightseeing-category/stay/page/25/ → SKIPPED_ROBOTS_403 / 宿泊施設 0 件のうち、本文にキャンプ関連語があった 0 件を残した（判定語: キャンプ/テント/オートサイト/バンガロー/野営） |
| L2 | やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 | OK | 17 | 7 | 実測17件のうち住所が取れたのは 富士河口湖町7 / 山中湖村3。fujisan.ne.jp が robots 403 になった穴埋め（L1 の代替ではない） |
| L2 | なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 22 | 22 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194300000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194300000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） | OK | 45 | 35 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）山梨県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/19-yamanashi/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 1 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 富士河口湖町観光連盟（登録済み L1・fujisan.ne.jp） | **L1_NOT_FOUND** | – | – | **「無い」ではなく「取らないと決めた」。**`fujisan.ne.jp` が robots.txt を **403** で返すため、`robots-guard.js` で踏まないことにした（2026-08-16）。**Chrome を名乗れば取れるが踏まない。****MISSING 43件を抱える主要エリアなので損失が大きい。**穴埋めに SRC_YAMANASHI_KANKO_MTFUJI（L2・富士河口湖町7件）を足したが、**層が違うので L1 の代替ではない。**ソース定義は外していないので、403 が解けたら自動で復活する |
| L1 | 富士河口湖町公式（町サイト） | **L1_NOT_FOUND** | – | – | **トップに「キャンプ」の語が0回。**観光情報を丸ごと `fujisan.ne.jp`（観光連盟）へのリンクで委ねていて、町公式側に施設一覧が無い（2026-08-16 実測）。robots.txt は404で制限なし＝踏めるが、中身が無い |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **富士河口湖町観光連盟（登録済み L1・fujisan.ne.jp）** — **「無い」ではなく「取らないと決めた」。**`fujisan.ne.jp` が robots.txt を **403** で返すため、`robots-guard.js` で踏まないことにした（2026-08-16）。**Chrome を名乗れば取れるが踏まない。****MISSING 43件を抱える主要エリアなので損失が大きい。**穴埋めに SRC_YAMANASHI_KANKO_MTFUJI（L2・富士河口湖町7件）を足したが、**層が違うので L1 の代替ではない。**ソース定義は外していないので、403 が解けたら自動で復活する
  - 確認: https://www.town.fujikawaguchiko.lg.jp/
- **富士河口湖町公式（町サイト）** — **トップに「キャンプ」の語が0回。**観光情報を丸ごと `fujisan.ne.jp`（観光連盟）へのリンクで委ねていて、町公式側に施設一覧が無い（2026-08-16 実測）。robots.txt は404で制限なし＝踏めるが、中身が無い
  - 確認: https://www.town.fujikawaguchiko.lg.jp/

取得したページ:

- `L1` https://fujisan.ne.jp/sightseeing-category/stay/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/2/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/3/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/4/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/5/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/6/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/7/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/8/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/9/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/10/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/11/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/12/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/13/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/14/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/15/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/16/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/17/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/18/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/19/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/20/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/21/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/22/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/23/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/24/ → 403
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/25/ → 403
- `L2` https://www.yamanashi-kankou.jp/special/yamanashicamp/mtfuji.html → 200（キャッシュ）
  - 詳細ページ 17 件（住所の取得のため）
- `L2` https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194300000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194300000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_194300000/g2_04/page_3/ → 404
  - 詳細ページ 22 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2005/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2005/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2005/list?page=3 → 200（キャッシュ）
  - 詳細ページ 45 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/19-yamanashi/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/2/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/3/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/4/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/5/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/6/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/7/ → 403
- `L3` https://japancamp.jp/camp_area/19-yamanashi/page/8/ → 403
- `L3` https://www.walkerplus.com/spot_list/ar0419/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. 戸沢センターキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町大石2578
- **表記ゆれ**: 戸沢センターキャンプ場 / 夢見る河口湖コテージ戸沢センター / コテージ戸沢センター
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_3108.html
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/k-tozawa
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/cottage-tozawa

### 2. 河口湖レイクサイドコテージ（足和田キャンプ場）

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 南都留郡富士河口湖町長浜2183 / 山梨県南都留郡富士河口湖町長浜2183
- **表記ゆれ**: 河口湖レイクサイドコテージ（足和田キャンプ場） / 河口湖レイクサイドコテージ
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_3100.html
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/lakeside-cotage

### 3. 観岳園キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖1131
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_3104.html
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/kangakuen

### 4. ニューブリッヂキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 南都留郡富士河口湖町小立島原1200 / 山梨県南都留郡富士河口湖町小立島原1200
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_4292.html
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19426ca3430055462/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/new-bridge

### 5. 紅葉台キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 南都留郡富士河口湖町西湖2202 / 山梨県南都留郡富士河口湖町西湖2202
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_3103.html
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/koyodai

### 6. 浜の家キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2334
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_3101.html
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ee4590068549/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/hamanoya

### 7. ハーブの里オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡河口湖町宇河口534
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_3107.html
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000199588/

### 8. 森と湖の楽園

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 南都留郡富士河口湖町小立5606 / 山梨県南都留郡富士河口湖町小立5606
- **表記ゆれ**: 森と湖の楽園 / 森と湖の楽園 Work Shop Camp Resort / 森と湖の楽園 Workshop Camp Resort / WorkShopCampResort森と湖の楽園
- **出典**:
  - `L2` やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 — https://www.yamanashi-kankou.jp/kankou/spot/p2_2776.html
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list?page=2
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000213803/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/moritomizuuminorakuen

### 9. &GREEN

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町船津6662−1
- **出典**:
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list?page=2
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/andgreen

### 10. DOTEKAGE CAMP GROUND

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町小立5321-2
- **出典**:
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list?page=2
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/dotekage

### 11. レークサイドキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町本栖19
- **表記ゆれ**: レークサイドキャンプ場 / 本栖レークサイドキャンプ場
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19341ca3430052757/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/motosu-lakeside

### 12. 富久澄キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町浅川1-1
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19430ca3432011482/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/fukusumi

### 13. 西の海キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖24-3 / 山梨県南都留郡富士河口湖町西湖2403
- **表記ゆれ**: 西の海キャンプ場 / 西ノ海キャンプ場
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430052787/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/nishinoumi

### 14. FUNOUT! PARK FUJI

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖997
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000219246/

### 15. Glampark S.O.P 富士河口湖

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町大石838-4
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000226512/

### 16. 河口湖足和田キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町長浜
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430052788/

### 17. オートキャンプ・ボア

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430054708/

### 18. 大和キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖1224
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430055429/

### 19. 西湖レークサイドキャンプ村

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖1030
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430053919/

### 20. 湖畔キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖207-7
- **同じ番地に別名**: 西湖湖畔キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430054099/

### 21. 西湖キャンプ場テント村

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2515
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430053678/

### 22. 河口湖明光山キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町大石2917
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19426ca3430054396/

### 23. 青木ケ原自由テント村キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2175-4
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430052789/

### 24. 富士キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2331
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430054936/

### 25. RetreatCamp まほろば

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町河口2553
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/retreat-camp-mahoroba

### 26. TheVillaGlamping河口湖

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町小立字白木平8038-2
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/glamping-kawaguchiko

### 27. ツーリストヴィラ河口湖

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町小立8027-10
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/tourist-villa-kawaguchiko

### 28. 福住オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖986
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/fukusumi-out

### 29. 精進レークサイドキャンプ

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町精進255
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/shojin_lake

### 30. 精進湖自由キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡河口湖町精進500
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/shojinko-jiyu

### 31. グランピングヴィラハンズ河口湖

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町勝山3283
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/hanz-kawaguchiko

### 32. ヴィラ メイクイーン貸別荘

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町小立1246
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/villa-mayqueen

### 33. 明光山キャンプ場【H27/3現在閉鎖中】

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町大石189
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/myokozan

### 34. 本栖湖スポーツセンター（本栖湖 SUMIKA CAMP FIELD）

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町本栖210
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/motosuko-sports-center

### 35. レイクヴィラ河口湖

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町河口1799
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/lake-villa-kawaguchiko

### 36. 河口湖コテージMINAMI

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町河口2944
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/kawaguchiko-minami

### 37. 精進湖キャンピングコテージ

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県南都留郡富士河口湖町
- **出典**:
  - `L3` ウォーカープラス 山梨県 — https://shojiko.jp/

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる | 0 | 11 | 0 | 0% | motosulakeside, picafuji-saiko, saiko-jiyu, shojiko-camping, motosu-shore-camp, retreat-camp-mahoroba, pica-fujiyama-camp, camp-akaike, oishii-camp, saiko-kohan-camp, saiko-tsuhara-camp |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `fujigane-kogen` | STAR MEADOWS 富士ケ嶺高原キャンプ場 | 山梨県南都留郡富士河口湖町富士ヶ嶺 | closed |  |
| `kawaguchiko-hanto` | 河口湖畔キャンプ場 | 山梨県南都留郡富士河口湖町大石2585-10 | unverified | true |
| `retreat-camp-mahoroba` | リトリートキャンプまほろば | 山梨県南都留郡富士河口湖町河口山宮2553 | active |  |
| `pica-fujiyama-camp` | PICA Fujiyama | 山梨県南都留郡富士河口湖町船津6662-10 | active |  |
| `sports-train-aokigahara` | SPORTS TRAIN in Forest CAMP | 山梨県南都留郡富士河口湖町西湖2169-1 | closed |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `saiko-kohan-camp` 西湖湖畔キャンプ場 | 西湖湖畔キャンプ場 | 名前 | MID | L2 |
| `saiko-tsuhara-camp` 西湖津原キャンプ場 | 西湖津原キャンプ場 | 名前 | MID | L2 |
| `motosulakeside` 本栖レークサイドキャンプ場 | 本栖レークサイドキャンプ場 | 名前 | LOW | L2 |
| `shojiko-camping` 精進湖キャンピングコテージ | 精進湖キャンピングコテージ | 名前 | MID | L2 |
| `camp-akaike` CAMP AKAIKE | CAMP AKAIKE（キャンプ アカイケ） | 名前 | MID | L2 |
| `picafuji-saiko` PICA富士西湖 | PICA富士西湖 | 名前 | MID | L2 |
| `saiko-jiyu` 西湖自由キャンプ場 | 西湖自由キャンプ場 | 名前 | MID | L2 |
| `oishii-camp` 富士ヶ嶺・おいしいキャンプ場 | 富士ヶ嶺 おいしいキャンプ場 | 名前 | LOW | L2 |
| `motosu-shore-camp` 本栖湖キャンプ場 | 本栖湖キャンプ場 | 名前 | LOW | L2 |
| `kawaguchiko-hamanoya-camp` 河口湖オートキャンプ場 浜の湯 | 河口湖オートキャンプ場 | 番地（名前は不一致） | MID | L2 |

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
| 一致 | 10 |
| 検査対象外（どちらかの大字が取れない） | 0 |

> **★ 「不一致 0件」を「誤突合が 0件」と読まないこと。**
> 検査対象外が 0件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 12件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| `b2（地区外）` | 11 | 市区町村が別。地区の粒度とは無関係 |
| `MISSING` | 1 | 実在するがデータに無い。**案Cで増えた MISSING の出どころ** |

<details><summary>内訳（項目ごと）</summary>

| ソース | 名前 | 住所 | 行き先 |
|---|---|---|---|
| `hinata-spot` | BULLsキャンプ【富士山の麓、自然に囲まれたペットと泊まれるキャンプ&コテージ】 | 山梨県南都留郡鳴沢村4122-3 | b2（地区外） |
| `hinata-spot` | 浪漫の森キャンプ場 | 山梨県南都留郡鳴沢村6800 | b2（地区外） |
| `walkerplus` | せせらぎ荘キャンプ場 | 山梨県都留市 | b2（地区外） |
| `walkerplus` | フレンドパークむかわ キャンプ場 | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | ACNオートリゾートパーク・ビッグランド | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | 平野田休養村キャンプ場 | 山梨県上野原市 | b2（地区外） |
| `walkerplus` | 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | MISSING |
| `walkerplus` | 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | ノースランドキャンパーズビレッジ | 山梨県甲斐市 | b2（地区外） |
| `walkerplus` | BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | 道志の森キャンプ場 | 山梨県南都留郡道志村 | b2（地区外） |
| `walkerplus` | 大人のキャンプ場 | 山梨県北杜市 | b2（地区外） |

</details>

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **7** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 22 件 | **22** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 9 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**理由は案C（2026-08-16）で変わった。

**旧**（大字単位の地区）は「同じ市の別の大字」が b2 の大半だった。
**いまは地区＝市区町村なので、その状態が存在しない。**市が一致すれば必ず地区内。

残るのは**広域ソースの取りこぼし**。じゃらんは市全体、なっぷ・hinata は広域、
ウォーカープラスとキャンナビは**県全体**を返すので、
**他の市町村ぶんは必ずここに落ちる。**件数の大きさ自体は異常の根拠にならない。

**疑うのは「この市区町村の住所を持つのに地区外に落ちたもの」**＝下の b2-b。
**案C後は定義上0件になる。**0件を「測れていない」ではなく
**「市町村単位になっていることの確認」**と読むこと。

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる | 0 | 0 | 0 | 0 | 0 | OK |
| やまなし観光推進機構 富士山・富士五湖エリアのキャンプ場 | 17 | 0 | 12 | 2 | 3 | OK |
| なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko | 20 | 0 | 8 | 10 | 2 | OK |
| じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） | 22 | 0 | 22 | 0 | 0 | OK |
| hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） | 45 | 0 | 35 | 0 | 10 | OK |
| キャンナビ（japancamp.jp）山梨県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 山梨県 | 10 | 0 | 1 | 0 | 9 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）5 件 / b1-2（取得失敗）2 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 本栖湖 SUMIKA CAMP FIELD | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list |
| 西湖キャンプビレッジ・ノーム | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list |
| 富士満願ビレッジファミリーキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list |
| 富士エコパークビレッヂ 富士エコキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list |
| リゾートペンションもとすfujisanno.himitukichi | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list |

#### b1-2 — 詳細ページの取得に失敗して住所が取れなかった

**これは直せる可能性がある。**`fetchPage` は成功したものしかキャッシュしないので、
失敗した詳細ページは毎回取りに行って毎回失敗する。URL が生きているか確認すること。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 富士見荘キャンプ場 | L2 yamanashi-kankou-mtfuji | **詳細ページの取得に失敗**（HTTP_404） | https://www.yamanashi-kankou.jp/kankou/spot/p2_3112.html |
| 小田急山中湖フォレストコテージ | L2 yamanashi-kankou-mtfuji | **詳細ページの取得に失敗**（HTTP_404） | https://www.yamanashi-kankou.jp/kankou/spot/p2_3115.html |

### b2-a — 住所の市区町村が、この地区の市区町村と違う

**案C後の b2 はここに全部入る。**広域ソースが他の市町村ぶんを含んでいるだけのことが大半
（じゃらんは市全体、なっぷ・hinata は広域、ウォーカープラスとキャンナビは**県全体**）。
**件数が多いこと自体は異常の根拠にならない。**

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| the 508 \| CAMP \| | 南都留郡山中湖村平野508-113 | L2 yamanashi-kankou-mtfuji |
| 村営山中湖キャンプ場 | 南都留郡山中湖村平野506-296 | L2 yamanashi-kankou-mtfuji |
| 湖山荘キャンプ場 | 南都留郡山中湖村平野508 | L2 yamanashi-kankou-mtfuji |
| BULLs キャンプ【ペットと泊まれるキャンプ場】 | 山梨県南都留郡鳴沢村4122-3 | L2 nap-camp / L2 hinata-spot |
| 浩庵キャンプ場（kouan campground) | 山梨県南巨摩郡身延町中ノ倉2926 | L2 hinata-spot |
| 水源の森 キャンプ・ランド | 山梨県南都留郡道志村馬場5821-2 | L2 hinata-spot |
| PICA富士吉田 | 山梨県富士吉田市上吉田4959-4 | L2 hinata-spot |
| マウントフジキャンプリゾート | 山梨県南都留郡鳴沢村鳴沢7328 | L2 hinata-spot |
| 杓子山ゲートウェイキャンプ場 | 山梨県富士吉田市大明見古屋敷4101 | L2 hinata-spot |
| 浪漫の森キャンプ場 | 山梨県南都留郡鳴沢村6800 | L2 hinata-spot |
| プライベートリゾート パインツリー | 山梨県富士吉田市松山1229 | L2 hinata-spot |
| 富士山リゾートログハウスふようの宿 | 山梨県富士吉田市松山1394 | L2 hinata-spot |
| オートキャンプ場サブ・フィールド | 山梨県富士吉田市上暮地8丁目5-32 | L2 hinata-spot |
| せせらぎ荘キャンプ場 | 山梨県都留市 | L3 walkerplus |
| フレンドパークむかわ キャンプ場 | 山梨県北杜市 | L3 walkerplus |
| ACNオートリゾートパーク・ビッグランド | 山梨県北杜市 | L3 walkerplus |
| 平野田休養村キャンプ場 | 山梨県上野原市 | L3 walkerplus |
| 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | L3 walkerplus |
| ノースランドキャンパーズビレッジ | 山梨県甲斐市 | L3 walkerplus |
| BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | L3 walkerplus |
| 道志の森キャンプ場 | 山梨県南都留郡道志村 | L3 walkerplus |
| 大人のキャンプ場 | 山梨県北杜市 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**案C後は0件になる。**地区が市区町村単位なので、市が一致すれば必ず地区内で、
「市は同じで大字が違う」という状態が存在しない（旧・大字単位では実測2,014件あった）。
**0件は「測れていない」ではなく「市町村単位になっている」ことの確認。**
**1件でも出たら地区の作り方が壊れている。**

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b3 — 住所なしの項目が合流したもの（漏れていない）

| 合流先 | 分類 | 合流した住所なしの出典 |
|---|---|---|
| 戸沢センターキャンプ場 | MISSING | L2 yamanashi-kankou-mtfuji |
| 観岳園キャンプ場 | MISSING | L2 yamanashi-kankou-mtfuji |
| 西湖湖畔キャンプ場 | IN_DATA | L2 yamanashi-kankou-mtfuji |
| 浜の家キャンプ場 | MISSING | L2 yamanashi-kankou-mtfuji |
| ハーブの里オートキャンプ場 | MISSING | L2 yamanashi-kankou-mtfuji |
| 森と湖の楽園 | MISSING | L2 nap-camp |
| CAMP AKAIKE（キャンプ アカイケ） | IN_DATA | L2 nap-camp |
| &GREEN | MISSING | L2 nap-camp |
| DOTEKAGE CAMP GROUND | MISSING | L2 nap-camp |

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
