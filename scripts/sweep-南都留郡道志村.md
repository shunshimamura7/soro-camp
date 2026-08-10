# 地区スイープ: 南都留郡道志村

実行: 2026-08-10 14:10:49　/　`node scripts/district-sweep.js --district "南都留郡道志村"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **51** |
| IN_DATA（両方にある） | 11 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 12 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 道志村役場観光情報サイト キャンプ場紹介 | OK | 31 | 31 | 村内のキャンプ場は数十軒あり、データ側12件との差は大きく出る前提 |
| L2 | なっぷ yamanashi/otsuki_turushi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 28 | 27 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194220000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194220000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 大月・都留（koushinetsu/yamanashi/2003） | OK | 60 | 30 | 一覧は先頭3ページまで / 住所を取りに行く詳細ページを 45 件で打ち切った（対象 60 件）。**打ち切った分はこの検査に載らない** |
| L2 | hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | OK | 18 | 0 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 128 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 1 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L1` https://www.doshi-kanko.jp/camp/ → 200（キャッシュ）
  - 詳細ページ 31 件（住所の取得のため）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/otsuki_turushi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194220000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194220000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_194220000/g2_04/page_3/ → 404
  - 詳細ページ 28 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2003/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2003/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2003/list?page=3 → 200（キャッシュ）
  - 詳細ページ 45 件（住所の取得のため）
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

### 1. 両国橋キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村49
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/ryoukokubashi/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/ryokokubashi

### 2. 川端オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村3074
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/kawabata/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052775/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yamanashi-kawabata

### 3. 椿キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村4387
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/tsubaki/

### 4. 大栗オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村5334
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/oguri/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055461/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/oguri

### 5. ネイチャーランドオム

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2 + L3）
- **住所**: 山梨県南都留郡道志村5964 / 南都留郡道志村5964
- **表記ゆれ**: ネイチャーランドオム / ネイチャーランド オム / ネイチャーランド・オム
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/naturelandom/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054413/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/natureland-om
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 6. ニュー田代オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村5910
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/new-tashiro/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052779/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/new-tashiro

### 7. オートキャンプINむじな

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L3）
- **住所**: 山梨県南都留郡道志村9707 / 南都留郡道志村9707
- **表記ゆれ**: オートキャンプINむじな / オートキャンプｉｎむじな
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/mujina/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 8. オートキャンプせせらぎ

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村10201
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/seseragi/

### 9. ラビットオートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村10176
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/rabbit/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052780/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/rabittoauto

### 10. 水の元オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村10220
- **同じ番地に別名**: 水之元オートキャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/mizunomoto/

### 11. オートキャンプしろいだいら

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村12272-1 / 山梨県南都留郡道志村11674
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/shiroidaira/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/shiroidaira

### 12. リバーサイドマイシーン

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村12344
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/riversidemyscene/

### 13. センタービレッジキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2 + L3）
- **住所**: 山梨県南都留郡道志村12311 / 南都留郡道志村12311
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/center-village/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054935/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/center-village
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 14. スカイバレーキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村11754-1
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/skyvalley/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055040/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/sky-volley

### 15. オートキャンプ長又

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村12697-2
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/nagamata/

### 16. 山伏オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村12753-3
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/yamabushi/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yamabushi

### 17. やぐら沢キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村6735
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/yagurasawa/
  - `L2` なっぷ yamanashi/otsuki_turushi — https://www.nap-camp.com/yamanashi/otsuki_turushi/list
  - `L2` なっぷ yamanashi/otsuki_turushi — https://www.nap-camp.com/yamanashi/otsuki_turushi/list?page=2

### 18. 久保キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村2447
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/kubo/

### 19. 貸し別荘 となり

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村5073-7
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/tonari/

### 20. 9じ17じ道志オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村10242
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/9ji17ji/

### 21. 室久保グリーンパーク

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村7329
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/murokubo-greenpark/

### 22. ブナの森キャンプ＆コテージ

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村8461-10
- **表記ゆれ**: ブナの森キャンプ＆コテージ / 城ヶ尾 ブナの森キャンプ ＆コテージ
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/takihara/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/jogaobunanomori

### 23. 久保キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村久保2447
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000198727/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/kubo

### 24. オートキャンプ長又

- **分類**: MISSING
- **confidence**: MID（層: L2 + L3）
- **住所**: 山梨県南都留郡道志村長又12408 / 南都留郡道志村長又
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054521/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/nagamata
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 25. 道志川荘キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村8316
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055400/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/doshinogawa

### 26. 道志観光農園キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村東神地9240
- **表記ゆれ**: 道志観光農園キャンプ場 / 観光農園オートキャンプ場
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430053673/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yamanashi-kankonoen

### 27. オートキャンプｉｎむじな

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村道志9707
- **表記ゆれ**: オートキャンプｉｎむじな / オートキャンプinむじな
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054554/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/mujina

### 28. 谷相郷キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2 + L3）
- **住所**: 山梨県南都留郡道志村谷相7910 / 南都留郡道志村谷相7910
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052778/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yasokyo
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 29. 月夜野キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村大渡 / 山梨県南都留郡道志村大渡957
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052776/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/tsukiyono

### 30. 椿キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村椿4229 / 山梨県南都留郡道志村椿4387
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055068/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/tsubaki

### 31. 滝原オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村8438
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055369/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/takihara

### 32. モモンガの森

- **分類**: MISSING
- **confidence**: MID（層: L2 + L3）
- **住所**: 山梨県南都留郡道志村長又12498-7
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000188418/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/momonga
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 33. 両国橋キャンプ場 湯川屋

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村月夜野49
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054244/

### 34. 下村キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村3112
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054628/

### 35. 山伏オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村長又
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430053674/

### 36. オートキャンプしろいだいら

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村下白井平11674
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055339/

### 37. 水之元オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村下善之木10220
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/mizunomoto

### 38. オートキャンプせせらぎ

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村下善之木10202
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/seseragi-yamanashi

### 39. 室久保グリーンパーク

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村西和出村7496
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/murokubo

### 40. やぐら沢キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村戸渡6735
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yagurasawa

### 41. 花の森オートキャンピア

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村上中山9709-1
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/hananomori

### 42. 下村キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村大室指3112
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/shimomura

### 43. 山伏オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村山伏峠
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 44. 椿荘オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村大椿4219
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 45. オートキャンプしろいだいら

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村白井平
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 46. ラビットオートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村下善之木10179
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 47. 滝原オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村川原畑
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 48. 水之元オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村10220
- **同じ番地に別名**: 水の元オートキャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 49. オートキャンプせせらぎ

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村善之木10202
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 50. 道志の森キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村三ヶ瀬10041
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 51. スカイバレーキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡道志村白井平11754-1
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
| 道志村役場観光情報サイト キャンプ場紹介 | 31 | 12 | 9 | 75% | woodsman-camp, suigennnomori, doshi-mori-cottage |

## ORPHAN — データにあるが、どのソースにも出てこない

網羅率 70% 以上の L1 があるので、**判定として読める**。
ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `suigennnomori` | 水源の森 キャンプ・ランド | 山梨県南都留郡道志村馬場5821-2 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `doshi-keikoku` 道志渓谷キャンプ場 | 道志渓谷キャンプ場 | 名前 | HIGH | L1+L2+L3 |
| `tsukiyono-doshi-camp` 月夜野キャンプ場 | 月夜野キャンプ場 | 名前 | HIGH | L1+L2 |
| `tsubakiso-auto` 椿荘オートキャンプ場 | 椿荘オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `hananomori-camp` 花の森オートキャンピア | 花の森オートキャンピア | 名前 | HIGH | L1+L2+L3 |
| `toyanosawa` とやの沢キャンプ場 | とやの沢キャンプ場 | 名前 | HIGH | L1+L2 |
| `okudoshi-auto` 奥道志オートキャンプ場 | 奥道志オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `doshi-no-mori` 道志の森キャンプ場 | 道志の森キャンプ場 | 名前 | HIGH | L1+L2+L3 |
| `doshigawa-kanko-noen` 道志川観光農園オートキャンプ場 | 観光農園オートキャンプ場 | 名前 | HIGH | L1 |
| `sankoso-auto` 山光荘オートキャンプ場 | 山光荘オートキャンプ | 名前 | HIGH | L1 |
| `woodsman-camp` WOODSMAN CAMP | WOODSMAN CAMP GROUND | 名前 | LOW | L2 |
| `doshi-mori-cottage` 道志森のコテージ | 道志 森のコテージ | 名前 | LOW | L2 |

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
