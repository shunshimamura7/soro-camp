# 地区スイープ: 道志村

実行: 2026-08-16 14:07:45　/　`node scripts/district-sweep.js --district "道志村"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **42** |
| IN_DATA（両方にある） | 15 |
| ORPHAN（データにあるがソースに無い） | 0 |
| データ側のこの地区のレコード | 15 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 道志村役場観光情報サイト キャンプ場紹介 | OK | 31 | 31 | 村内のキャンプ場は数十軒あり、データ側12件との差は大きく出る前提 |
| L2 | なっぷ yamanashi/otsuki_turushi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 28 | 28 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194220000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194220000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 大月・都留（koushinetsu/yamanashi/2003） | OK | 60 | 34 | 一覧は先頭3ページまで |
| L2 | hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | OK | 18 | 0 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）山梨県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/19-yamanashi/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/8/ → SKIPPED_ROBOTS_403 |
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
  - 詳細ページ 60 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2004/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2004/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2004/list?page=3 → 200（キャッシュ）
  - 詳細ページ 18 件（住所の取得のため）
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

### 1. 川端オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村3074
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/kawabata/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052775/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yamanashi-kawabata

### 2. 椿キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村4387
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/tsubaki/

### 3. 大栗オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村5334
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/oguri/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055461/

### 4. ネイチャーランドオム

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村5964
- **表記ゆれ**: ネイチャーランドオム / ネイチャーランド オム
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/naturelandom/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054413/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/natureland-om

### 5. オートキャンプINむじな

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村9707
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/mujina/

### 6. オートキャンプせせらぎ

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村10201
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/seseragi/

### 7. ラビットオートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村10176 / 山梨県南都留郡道志村10611
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/rabbit/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052780/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/rabittoauto

### 8. 水の元オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村10220
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/mizunomoto/

### 9. オートキャンプしろいだいら

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村12272-1 / 山梨県南都留郡道志村11674
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/shiroidaira/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/shiroidaira

### 10. リバーサイドマイシーン

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村12344
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/riversidemyscene/

### 11. センタービレッジキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村12311
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/center-village/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054935/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/center-village

### 12. スカイバレーキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村11754-1
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/skyvalley/
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055040/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/sky-volley

### 13. オートキャンプ長又

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村12697-2
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/nagamata/

### 14. 山伏オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村12753-3
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/yamabushi/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yamabushi

### 15. やぐら沢キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村6735
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/yagurasawa/
  - `L2` なっぷ yamanashi/otsuki_turushi — https://www.nap-camp.com/yamanashi/otsuki_turushi/list
  - `L2` なっぷ yamanashi/otsuki_turushi — https://www.nap-camp.com/yamanashi/otsuki_turushi/list?page=2

### 16. 久保キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村2447
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/kubo/

### 17. 貸し別荘 となり

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村5073-7
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/tonari/

### 18. 9じ17じ道志オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡道志村10242
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/9ji17ji/

### 19. ブナの森キャンプ＆コテージ

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡道志村8461-10
- **表記ゆれ**: ブナの森キャンプ＆コテージ / 城ヶ尾 ブナの森キャンプ ＆コテージ
- **出典**:
  - `L1` 道志村役場観光情報サイト キャンプ場紹介 — https://www.doshi-kanko.jp/camp/takihara/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/jogaobunanomori

### 20. 久保キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村久保2447
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000198727/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/kubo

### 21. オートキャンプ長又

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村長又12408
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054521/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/nagamata

### 22. 道志観光農園キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村東神地9240
- **表記ゆれ**: 道志観光農園キャンプ場 / 観光農園オートキャンプ場
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430053673/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yamanashi-kankonoen

### 23. オートキャンプｉｎむじな

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村道志9707
- **表記ゆれ**: オートキャンプｉｎむじな / オートキャンプinむじな
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054554/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/mujina

### 24. 谷相郷キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村谷相7910
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052778/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yasokyo

### 25. 月夜野キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村大渡 / 山梨県南都留郡道志村大渡957
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430052776/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/tsukiyono

### 26. 椿キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村椿4229 / 山梨県南都留郡道志村椿4387
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055068/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/tsubaki

### 27. 滝原オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村8438
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055369/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/takihara

### 28. モモンガの森

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡道志村長又12498-7
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000188418/
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/momonga

### 29. 両国橋キャンプ場 湯川屋

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村月夜野49
- **同じ番地に別名**: 両国橋キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054244/

### 30. 道志川荘キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村8316
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055400/

### 31. 下村キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村3112
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430054628/

### 32. 山伏オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村長又
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430053674/

### 33. オートキャンプしろいだいら

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村下白井平11674
- **出典**:
  - `L2` じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19422ca3430055339/

### 34. 水之元オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村下善之木10220
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/mizunomoto

### 35. オートキャンプせせらぎ

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村下善之木10202
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/seseragi-yamanashi

### 36. 室久保グリーンパーク

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村西和出村7496
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/murokubo

### 37. やぐら沢キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村戸渡6735
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/yagurasawa

### 38. 花の森オートキャンピア

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村上中山9709-1
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/hananomori

### 39. 下村キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村大室指3112
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/shimomura

### 40. 両国橋キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村月夜野49
- **同じ番地に別名**: 両国橋キャンプ場 湯川屋（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/ryokokubashi

### 41. 大栗オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村大栗5334
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/oguri

### 42. 道志川荘キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡道志村川原畑8316
- **出典**:
  - `L2` hinata スポット 大月・都留（koushinetsu/yamanashi/2003） — https://camp-spot.hinata.me/spots/doshinogawa

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 道志村役場観光情報サイト キャンプ場紹介 | 31 | 13 | 10 | 77% | woodsman-camp, suigennnomori, doshi-mori-cottage |

## ORPHAN — データにあるが、どのソースにも出てこない

網羅率 70% 以上の L1 があるので、**判定として読める**。
ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

なし。

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `ryokokubashi-camp` 両国橋キャンプ場 | 両国橋キャンプ場 | 名前 | HIGH | L1 |
| `doshi-keikoku` 道志渓谷キャンプ場 | 道志渓谷キャンプ場 | 名前 | HIGH | L1+L2 |
| `tsukiyono-doshi-camp` 月夜野キャンプ場 | 月夜野キャンプ場 | 名前 | HIGH | L1+L2 |
| `tsubakiso-auto` 椿荘オートキャンプ場 | 椿荘オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `new-tashiro-auto-camp` ニュー田代オートキャンプ場 | ニュー田代オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `hananomori-camp` 花の森オートキャンピア | 花の森オートキャンピア | 名前 | HIGH | L1+L2 |
| `toyanosawa` とやの沢キャンプ場 | とやの沢キャンプ場 | 名前 | HIGH | L1+L2 |
| `okudoshi-auto` 奥道志オートキャンプ場 | 奥道志オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `doshi-no-mori` 道志の森キャンプ場 | 道志の森キャンプ場 | 名前 | HIGH | L1+L2+L3 |
| `doshigawa-kanko-noen` 道志川観光農園オートキャンプ場 | 観光農園オートキャンプ場 | 名前 | HIGH | L1 |
| `sankoso-auto` 山光荘オートキャンプ | 山光荘オートキャンプ | 名前 | HIGH | L1 |
| `murokubo-greenpark` 室久保グリーンパーク（THE Do-c Camp） | 室久保グリーンパーク | 名前 | HIGH | L1 |
| `suigennnomori` 水源の森 キャンプ・ランド | 水源の森 キャンプ・ランド | 名前 | LOW | L2 |
| `woodsman-camp` WOODSMAN CAMPGROUND | WOODSMAN CAMP GROUND | 名前 | LOW | L2 |
| `doshi-mori-cottage` 道志森のコテージ | 道志 森のコテージ | 名前 | LOW | L2 |

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
| 一致 | 1 |
| 検査対象外（どちらかの大字が取れない） | 14 |

> **★ 「不一致 0件」を「誤突合が 0件」と読まないこと。**
> 検査対象外が 14件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 79件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| `MISSING` | 37 | 実在するがデータに無い。**案Cで増えた MISSING の出どころ** |
| `IN_DATA` | 28 | データにあった。**大字が無いせいで突合できていなかっただけ** |
| `b2（地区外）` | 14 | 市区町村が別。地区の粒度とは無関係 |

<details><summary>内訳（項目ごと）</summary>

| ソース | 名前 | 住所 | 行き先 |
|---|---|---|---|
| `doshi-kanko-jp` | 両国橋キャンプ場 | 山梨県南都留郡道志村49 | IN_DATA |
| `doshi-kanko-jp` | 道志渓谷キャンプ場 | 山梨県南都留郡道志村43 | IN_DATA |
| `jalan` | 道志渓谷キャンプ場 | 山梨県南都留郡道志村43 | IN_DATA |
| `hinata-spot` | 道志渓谷キャンプ場 | 山梨県南都留郡道志村43 | IN_DATA |
| `doshi-kanko-jp` | 月夜野キャンプ場 | 山梨県南都留郡道志村950 | IN_DATA |
| `doshi-kanko-jp` | 川端オートキャンプ場 | 山梨県南都留郡道志村3074 | MISSING |
| `jalan` | 川端オートキャンプ場 | 山梨県南都留郡道志村3074 | MISSING |
| `hinata-spot` | 川端オートキャンプ場 | 山梨県南都留郡道志村3074 | MISSING |
| `doshi-kanko-jp` | 椿荘オートキャンプ場 | 山梨県南都留郡道志村4150 | IN_DATA |
| `jalan` | 椿荘オートキャンプ場 | 山梨県南都留郡道志村4150 | IN_DATA |
| `hinata-spot` | 椿荘オートキャンプ場 | 山梨県南都留郡道志村4150 | IN_DATA |
| `doshi-kanko-jp` | 椿キャンプ場 | 山梨県南都留郡道志村4387 | MISSING |
| `doshi-kanko-jp` | 大栗オートキャンプ場 | 山梨県南都留郡道志村5334 | MISSING |
| `jalan` | 大栗オートキャンプ場 | 山梨県南都留郡道志村5334 | MISSING |
| `doshi-kanko-jp` | ネイチャーランドオム | 山梨県南都留郡道志村5964 | MISSING |
| `jalan` | ネイチャーランドオム | 山梨県南都留郡道志村5964 | MISSING |
| `hinata-spot` | ネイチャーランド オム | 山梨県南都留郡道志村5964 | MISSING |
| `doshi-kanko-jp` | ニュー田代オートキャンプ場 | 山梨県南都留郡道志村5910 | IN_DATA |
| `jalan` | ニュー田代オートキャンプ場 | 山梨県南都留郡道志村5910 | IN_DATA |
| `hinata-spot` | ニュー田代オートキャンプ場 | 山梨県南都留郡道志村5910 | IN_DATA |
| `doshi-kanko-jp` | オートキャンプINむじな | 山梨県南都留郡道志村9707 | MISSING |
| `doshi-kanko-jp` | 花の森オートキャンピア | 山梨県南都留郡道志村9709-1 | IN_DATA |
| `jalan` | 花の森オートキャンピア | 山梨県南都留郡道志村9709-1 | IN_DATA |
| `doshi-kanko-jp` | オートキャンプせせらぎ | 山梨県南都留郡道志村10201 | MISSING |
| `doshi-kanko-jp` | ラビットオートキャンプ場 | 山梨県南都留郡道志村10176 | MISSING |
| `jalan` | ラビットオートキャンプ場 | 山梨県南都留郡道志村10176 | MISSING |
| `hinata-spot` | ラビットオートキャンプ場 | 山梨県南都留郡道志村10611 | MISSING |
| `doshi-kanko-jp` | 水の元オートキャンプ場 | 山梨県南都留郡道志村10220 | MISSING |
| `doshi-kanko-jp` | オートキャンプしろいだいら | 山梨県南都留郡道志村12272-1 | MISSING |
| `hinata-spot` | オートキャンプしろいだいら | 山梨県南都留郡道志村11674 | MISSING |
| `doshi-kanko-jp` | リバーサイドマイシーン | 山梨県南都留郡道志村12344 | MISSING |
| `doshi-kanko-jp` | センタービレッジキャンプ場 | 山梨県南都留郡道志村12311 | MISSING |
| `jalan` | センタービレッジキャンプ場 | 山梨県南都留郡道志村12311 | MISSING |
| `hinata-spot` | センタービレッジキャンプ場 | 山梨県南都留郡道志村12311 | MISSING |
| `doshi-kanko-jp` | スカイバレーキャンプ場 | 山梨県南都留郡道志村11754-1 | MISSING |
| `jalan` | スカイバレーキャンプ場 | 山梨県南都留郡道志村11754-1 | MISSING |
| `hinata-spot` | スカイバレーキャンプ場 | 山梨県南都留郡道志村11754-1 | MISSING |
| `doshi-kanko-jp` | とやの沢キャンプ場 | 山梨県南都留郡道志村12704 | IN_DATA |
| `jalan` | とやの沢オートキャンプ場 | 山梨県南都留郡道志村12433 | IN_DATA |
| `hinata-spot` | とやの沢オートキャンプ場 | 山梨県南都留郡道志村12433 | IN_DATA |
| `doshi-kanko-jp` | オートキャンプ長又 | 山梨県南都留郡道志村12697-2 | MISSING |
| `doshi-kanko-jp` | 山伏オートキャンプ場 | 山梨県南都留郡道志村12753-3 | MISSING |
| `hinata-spot` | 山伏オートキャンプ場 | 山梨県南都留郡道志村12753-3 | MISSING |
| `doshi-kanko-jp` | 奥道志オートキャンプ場 | 山梨県南都留郡道志村12637 | IN_DATA |
| `jalan` | 奥道志オートキャンプ場 | 山梨県南都留郡道志村12637 | IN_DATA |
| `hinata-spot` | 奥道志オートキャンプ場 | 山梨県南都留郡道志村12637 | IN_DATA |
| `doshi-kanko-jp` | 道志の森キャンプ場 | 山梨県南都留郡道志村10041 | IN_DATA |
| `jalan` | 道志の森キャンプ場 | 山梨県南都留郡道志村10701 | IN_DATA |
| `hinata-spot` | 道志の森キャンプ場 | 山梨県南都留郡道志村10041 | IN_DATA |
| `walkerplus` | 道志の森キャンプ場 | 山梨県南都留郡道志村 | IN_DATA |
| `doshi-kanko-jp` | 観光農園オートキャンプ場 | 山梨県南都留郡道志村9240 | IN_DATA |
| `doshi-kanko-jp` | やぐら沢キャンプ場 | 山梨県南都留郡道志村6735 | MISSING |
| `doshi-kanko-jp` | 久保キャンプ場 | 山梨県南都留郡道志村2447 | MISSING |
| `doshi-kanko-jp` | 貸し別荘 となり | 山梨県南都留郡道志村5073-7 | MISSING |
| `doshi-kanko-jp` | 9じ17じ道志オートキャンプ場 | 山梨県南都留郡道志村10242 | MISSING |
| `doshi-kanko-jp` | 山光荘オートキャンプ | 山梨県南都留郡道志村11777 | IN_DATA |
| `doshi-kanko-jp` | 室久保グリーンパーク | 山梨県南都留郡道志村7329 | IN_DATA |
| `doshi-kanko-jp` | ブナの森キャンプ＆コテージ | 山梨県南都留郡道志村8461-10 | MISSING |
| `hinata-spot` | 城ヶ尾 ブナの森キャンプ ＆コテージ | 山梨県南都留郡道志村8461-10 | MISSING |
| `hinata-spot` | ほうれん坊の森キャンプ場 | 山梨県北都留郡小菅村2402-2ほうれん坊の森キャンプ場(東部森林公園) | b2（地区外） |
| `hinata-spot` | 原始村キャンプ場 | 山梨県北都留郡小菅村1970番地 | b2（地区外） |
| `jalan` | 水源の森 キャンプ・ランド | 山梨県山梨県南都留郡道志村5821-2 | IN_DATA |
| `jalan` | 道志川荘キャンプ場 | 山梨県南都留郡道志村8316 | MISSING |
| `jalan` | 下村キャンプ場 | 山梨県南都留郡道志村3112 | MISSING |
| `jalan` | 滝原オートキャンプ場 | 山梨県南都留郡道志村8438 | MISSING |
| `hinata-spot` | 滝原オートキャンプ場 | 山梨県南都留郡道志村8438 | MISSING |
| `hinata-spot` | 富士満願ビレッジファミリーキャンプ場 | 山梨県南都留郡鳴沢村5163-1 | b2（地区外） |
| `hinata-spot` | 道志 森のコテージ | 山梨県南都留郡道志村7895 | IN_DATA |
| `hinata-spot` | 甲武キャンプ村 | 山梨県北都留郡丹波山村400 | b2（地区外） |
| `hinata-spot` | グリーンリバーかめやキャンプ場 | 山梨県北都留郡丹波山村966 | b2（地区外） |
| `walkerplus` | せせらぎ荘キャンプ場 | 山梨県都留市 | b2（地区外） |
| `walkerplus` | フレンドパークむかわ キャンプ場 | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | ACNオートリゾートパーク・ビッグランド | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | 平野田休養村キャンプ場 | 山梨県上野原市 | b2（地区外） |
| `walkerplus` | 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | b2（地区外） |
| `walkerplus` | 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | ノースランドキャンパーズビレッジ | 山梨県甲斐市 | b2（地区外） |
| `walkerplus` | BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | b2（地区外） |
| `walkerplus` | 大人のキャンプ場 | 山梨県北杜市 | b2（地区外） |

</details>

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **5** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 53 件 | **53** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 2 |

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
| 道志村役場観光情報サイト キャンプ場紹介 | 31 | 0 | 31 | 0 | 0 | OK |
| なっぷ yamanashi/otsuki_turushi | 20 | 0 | 4 | 10 | 6 | OK |
| じゃらん観光ガイド 道志村（cit_194220000 / ジャンル キャンプ・バンガロー・コテージ） | 28 | 0 | 28 | 0 | 0 | OK |
| hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | 78 | 0 | 34 | 0 | 44 | OK |
| キャンナビ（japancamp.jp）山梨県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 山梨県 | 10 | 0 | 1 | 0 | 9 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）5 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 水源の森 キャンプ·ランド | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| 猿橋リバーサイドベースキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| 平山キャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| SNUG CAMP HOUSE | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| CAMP＆SAUNA 3set（キャンプ＆サウナ サンセット） | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |

#### b1-2 — 詳細ページの取得に失敗して住所が取れなかった

**これは直せる可能性がある。**`fetchPage` は成功したものしかキャッシュしないので、
失敗した詳細ページは毎回取りに行って毎回失敗する。URL が生きているか確認すること。

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b2-a — 住所の市区町村が、この地区の市区町村と違う

**案C後の b2 はここに全部入る。**広域ソースが他の市町村ぶんを含んでいるだけのことが大半
（じゃらんは市全体、なっぷ・hinata は広域、ウォーカープラスとキャンナビは**県全体**）。
**件数が多いこと自体は異常の根拠にならない。**

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| ほうれん坊の森キャンプ場 | 山梨県北都留郡小菅村2402-2ほうれん坊の森キャンプ場(東部森林公園) | L2 nap-camp / L2 hinata-spot |
| 原始村キャンプ場 | 山梨県北都留郡小菅村1970番地 | L2 nap-camp / L2 hinata-spot |
| 山の中の天然温泉 和みの里キャンプ場 | 山梨県都留市戸沢1126 | L2 nap-camp / L2 hinata-spot |
| CALM MOUNTAIN AKIYAMA | 山梨県上野原市秋山12003 | L2 hinata-spot |
| 三ツ峠グリーンセンター | 山梨県南都留郡西桂町下暮地1900 | L2 hinata-spot |
| 富士満願ビレッジファミリーキャンプ場 | 山梨県南都留郡鳴沢村5163-1 | L2 hinata-spot |
| せせらぎ荘キャンプ場 | 山梨県都留市戸沢896-1 | L2 hinata-spot |
| hotel norm. Fuji | 山梨県南都留郡富士河口湖町長浜2109-1 | L2 hinata-spot |
| THE FOREST | 山梨県都留市戸沢1068 | L2 hinata-spot |
| KAGARIBI Camp Terrace | 山梨県山梨県大月市賑岡町奥山1473「森屋荘」内 | L2 hinata-spot |
| FOREST GATE | 山梨県都留市大野2881-5 | L2 hinata-spot |
| SPORTS TRAIN in Forest camp (スポーツトレイン) | 山梨県南都留郡富士河口湖町西湖2169-1 | L2 hinata-spot |
| 奥秋キャンプ場 | 山梨県北都留郡丹波山村奥秋1388 | L2 hinata-spot |
| 風車キャンプ場 | 山梨県都留市鹿留3064 | L2 hinata-spot |
| 近ヶ坂キャンプ場 | 山梨県都留市中津森55−6 | L2 hinata-spot |
| 緑と太陽の丘キャンプ場 | 山梨県上野原市秋山5030 | L2 hinata-spot |
| 甲武キャンプ村 | 山梨県北都留郡丹波山村400 | L2 hinata-spot |
| グリーンリバーかめやキャンプ場 | 山梨県北都留郡丹波山村966 | L2 hinata-spot |
| CAMP INNFUJI | 山梨県南都留郡忍野村忍草3235 | L2 hinata-spot |
| BerryPark in FISH ON！鹿留 | 山梨県都留市鹿留1543 | L2 hinata-spot |
| キャンプインフジ | 山梨県南都留郡忍野村忍草3236-2 | L2 hinata-spot |
| 月尾根自然の森 | 山梨県大月市梁川町立野106 | L2 hinata-spot |
| 鹿留オートキャンプ場 | 山梨県都留市鹿留1180 | L2 hinata-spot |
| 大沢オートキャンプ場 | 山梨県都留市鹿留1089 | L2 hinata-spot |
| 宝の山ふれあいの里 | 山梨県都留市大幡5108 | L2 hinata-spot |
| 平野田休養村 | 山梨県上野原市西原7293 | L2 hinata-spot |
| moss camp field | 山梨県南都留郡山中湖村山中1300-1 | L2 hinata-spot |
| VIASSO（ビアッソ） | 山梨県南都留郡山中湖村平野1536 | L2 hinata-spot |
| 山中湖ふじのもりオートキャンプ場 | 山梨県南都留郡山中湖村平野1134-3 | L2 hinata-spot |
| 東照館オートキャンプ山中湖 | 山梨県南都留郡山中湖村平野1430 | L2 hinata-spot |
| Lake Lodge YAMANAKA | 山梨県南都留郡山中湖村平野479 | L2 hinata-spot |
| Mauka Resort AZMY | 山梨県南都留郡山中湖村平野1289 | L2 hinata-spot |
| the 508 | 山梨県南都留郡山中湖村平野508-113 | L2 hinata-spot |
| sotosotodays CAMPGROUNDS 山中湖みさき（旧みさきキャンプ場） | 山梨県南都留郡山中湖村平野2431-2 | L2 hinata-spot |
| 湖山荘キャンプ場 | 山梨県南都留郡山中湖村平野508-123 | L2 hinata-spot |
| 小田急山中湖フォレストコテージ | 山梨県南都留郡山中湖村平野491 | L2 hinata-spot |
| 山中湖みなみオートキャンプ場 | 山梨県南都留郡山中湖村平野520-45 | L2 hinata-spot |
| PICA山中湖 | 山梨県南都留郡山中湖村平野506-296 | L2 hinata-spot |
| 村営山中湖キャンプ場 | 山梨県南都留郡山中湖村平野506-296 | L2 hinata-spot |
| プライベートハウス・バイロン | 山梨県南都留郡山中湖村平野508-28 | L2 hinata-spot |
| ペンション 飛遊人 | 山梨県南都留郡山中湖村平野508-687 | L2 hinata-spot |
| ペンション茂里 | 山梨県南都留郡山中湖村中山865-111 | L2 hinata-spot |
| 山中野営場 | 山梨県南都留郡山中湖村旭日丘 | L2 hinata-spot |
| 飛遊人キャンプ場 | 山梨県南都留郡山中湖村平野508-42 | L2 hinata-spot |
| せせらぎ荘キャンプ場 | 山梨県都留市 | L3 walkerplus |
| フレンドパークむかわ キャンプ場 | 山梨県北杜市 | L3 walkerplus |
| ACNオートリゾートパーク・ビッグランド | 山梨県北杜市 | L3 walkerplus |
| 平野田休養村キャンプ場 | 山梨県上野原市 | L3 walkerplus |
| 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | L3 walkerplus |
| 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | L3 walkerplus |
| ノースランドキャンパーズビレッジ | 山梨県甲斐市 | L3 walkerplus |
| BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | L3 walkerplus |
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
| 月夜野キャンプ場 | IN_DATA | L2 nap-camp |
| やぐら沢キャンプ場 | MISSING | L2 nap-camp |

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
