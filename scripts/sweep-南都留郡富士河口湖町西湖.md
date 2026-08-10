# 地区スイープ: 南都留郡富士河口湖町西湖

実行: 2026-08-10 10:27:07　/　`node scripts/district-sweep.js --district "南都留郡富士河口湖町西湖"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **18** |
| IN_DATA（両方にある） | 2 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 3 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる | OK | 17 | 7 | ホテル・旅館と同じ一覧。詳細ページの本文にキャンプ関連語があるかで選別している。町公式サイトはこのサイトへ誘導しているだけなので1ソース扱い（§6-15） / 宿泊施設 231 件のうち、本文にキャンプ関連語があった 17 件を残した（判定語: キャンプ/テント/オートサイト/バンガロー/野営） |
| L2 | なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 22 | 13 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194300000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194300000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） | OK | 45 | 9 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 40 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L1` https://fujisan.ne.jp/sightseeing-category/stay/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/2/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/3/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/4/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/5/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/6/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/7/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/8/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/9/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/10/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/11/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/12/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/13/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/14/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/15/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/16/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/17/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/18/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/19/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/20/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/21/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/22/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/23/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/24/ → 200（キャッシュ）
- `L1` https://fujisan.ne.jp/sightseeing-category/stay/page/25/ → 200（キャッシュ）
  - 詳細ページ 231 件（住所の取得のため）
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

### 1. 観岳園キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖1131
- **出典**:
  - `L1` 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる — https://fujisan.ne.jp/sightseeing/1905/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/kangakuen

### 2. 紅葉台キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡富士河口湖町西湖南4-10
- **出典**:
  - `L1` 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる — https://fujisan.ne.jp/sightseeing/1907/

### 3. 西湖湖畔キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖207-7
- **表記ゆれ**: 西湖湖畔キャンプ場 / 西湖・湖畔キャンプ場
- **同じ番地に別名**: 湖畔キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる — https://fujisan.ne.jp/sightseeing/1899/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/saikokohan

### 4. 西湖津原キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖351 / 山梨県南都留郡富士河口湖町西湖2299
- **出典**:
  - `L1` 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる — https://fujisan.ne.jp/sightseeing/1909/
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ee4590068518/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/tsuhara

### 5. 西の海キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2 + L3）
- **住所**: 山梨県南都留郡富士河口湖町西湖2403 / 山梨県南都留郡富士河口湖町西湖24-3 / 南都留郡富士河口湖町西湖2403
- **表記ゆれ**: 西の海キャンプ場 / 西ノ海キャンプ場 / 西の海オートキャンプ場
- **出典**:
  - `L1` 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる — https://fujisan.ne.jp/sightseeing/1914/
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430052787/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/nishinoumi
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 6. 浜の家キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2334
- **出典**:
  - `L1` 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる — https://fujisan.ne.jp/sightseeing/1911/
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ee4590068549/
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/hamanoya

### 7. 西湖キャンプビレッジ・ノーム

- **分類**: MISSING
- **confidence**: LOW（層: L2 + L3）
- **住所**: 南都留郡富士河口湖町西湖1030
- **表記ゆれ**: 西湖キャンプビレッジ・ノーム / 西湖キャンプ・ビレッジノーム
- **同じ番地に別名**: 西湖レークサイドキャンプ村（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list
  - `L2` なっぷ yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko — https://www.nap-camp.com/yamanashi/motosuko_nishiko_kawaguchiko_fuzjiyoshida_shojiko/list?page=2
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 8. FUNOUT! PARK FUJI

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖997
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000219246/

### 9. オートキャンプ・ボア

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430054708/

### 10. 大和キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖1224
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430055429/

### 11. 西湖レークサイドキャンプ村

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖1030
- **同じ番地に別名**: 西湖キャンプビレッジ・ノーム（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430053919/

### 12. 湖畔キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖207-7
- **同じ番地に別名**: 西湖湖畔キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430054099/

### 13. 西湖キャンプ場テント村

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2515
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430053678/

### 14. 青木ケ原自由テント村キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2175-4
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430052789/

### 15. 富士キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2331
- **出典**:
  - `L2` じゃらん観光ガイド 富士河口湖町（cit_194300000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19428ca3430054936/

### 16. 紅葉台キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖2202
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/koyodai

### 17. 福住オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡富士河口湖町西湖986
- **出典**:
  - `L2` hinata スポット 河口湖・西湖・富士吉田・精進湖・本栖湖（koushinetsu/yamanashi/2005） — https://camp-spot.hinata.me/spots/fukusumi-out

### 18. キャンピングリゾートＷＡＮ

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡富士河口湖町西湖1006
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる | 17 | 11 | 3 | 27% | picafuji-saiko, fujigane-kogen, shojiko-camping, kawaguchiko-hanto, retreat-camp-mahoroba, pica-fujiyama-camp, camp-akaike, oishii-camp |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `sports-train-aokigahara` | SPORTS TRAIN in Forest CAMP | 山梨県南都留郡富士河口湖町西湖2169-1 | closed |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `saiko-jiyu` 西湖自由キャンプ場 | 西湖自由キャンプ場 | 名前 | HIGH | L1+L2+L3 |
| `picafuji-saiko` PICA富士西湖 | PICA富士西湖 | 名前 | MID | L2+L3 |

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
