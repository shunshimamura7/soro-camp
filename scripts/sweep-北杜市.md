# 地区スイープ: 北杜市

実行: 2026-08-16 14:07:57　/　`node scripts/district-sweep.js --district "北杜市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **39** |
| IN_DATA（両方にある） | 7 |
| ORPHAN（データにあるがソースに無い） | 4 |
| データ側のこの地区のレコード | 11 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L2 | なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 29 | 29 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_192090000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_192090000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） | OK | 24 | 22 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）山梨県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/19-yamanashi/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/19-yamanashi/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 5 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 北杜市観光協会（ほくとにいくと） | **L1_NOT_FOUND** | – | – | **施設の詳細ページに施設の住所が無く、載っているのは観光協会自身の所在地（北杜市高根町村山北割3261）。ここから住所を取ると §6-16 の借用をこちらから作ることになる。**引き継ぎが `flora-campsite` の注意として警告していたのと同じ住所。名前だけなら取れるが、北杜市は大字が多く住所が無いと地区を決められないので L1 として登録しない |
| L1 | 北杜市公式（市サイト） | **L1_NOT_FOUND** | – | – | キャンプ場の一覧が見つからない |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **北杜市観光協会（ほくとにいくと）** — **施設の詳細ページに施設の住所が無く、載っているのは観光協会自身の所在地（北杜市高根町村山北割3261）。ここから住所を取ると §6-16 の借用をこちらから作ることになる。**引き継ぎが `flora-campsite` の注意として警告していたのと同じ住所。名前だけなら取れるが、北杜市は大字が多く住所が無いと地区を決められないので L1 として登録しない
  - 確認: https://www.hokuto-kanko.jp/spot/category/stay/
  - 確認: https://www.hokuto-kanko.jp/spot/campinngrandale/
- **北杜市公式（市サイト）** — キャンプ場の一覧が見つからない
  - 確認: https://www.hokuto-kanko.jp/spot/

取得したページ:

- `L2` https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192090000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_192090000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_192090000/g2_04/page_3/ → 404
  - 詳細ページ 29 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2008/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2008/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/koushinetsu/yamanashi/2008/list?page=3 → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
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

### 1. 新栄清里キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市高根町清里3545-238
- **同じ番地に別名**: Shin-Ei-Kiyosato Camp Field（新栄清里キャンプ場）（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list?page=2
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432072760/

### 2. みずがき山森の農園キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市須玉町小尾8862-1
- **同じ番地に別名**: みずがき山自然公園（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list?page=2
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/mizugakiyama-morinonouen

### 3. PAWS GROUND

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市小淵沢町5419-5paws ground
- **出典**:
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list?page=2
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/paws-ground

### 4. untitled

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市高根町清里3545番457
- **出典**:
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list?page=2
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000226465/

### 5. 八ヶ岳Air-ground

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市高根町村山東割2475-4
- **出典**:
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list
  - `L2` なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi — https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list?page=2
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000227270/

### 6. Foresters Village Kobitto

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市武川町柳沢3802-1
- **表記ゆれ**: Foresters Village Kobitto / Foresters Village Kobitto 南アルプスキャンプフィールド
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19409ca3430053419/
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/kobitto

### 7. みずがき山グリーンロッジ

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市須玉町小尾8861
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19403ca3430055421/
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/mizugaki

### 8. フレンドパークむかわ・オートキャンプ場・バーベキュー場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市武川町柳沢3506-1 / 山梨県北杜市武川町柳澤3506-1
- **表記ゆれ**: フレンドパークむかわ・オートキャンプ場・バーベキュー場 / フレンドパークむかわ
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076420/
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/friend-park-mukawa

### 9. 南清里レジャーセンターキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市須玉町若神子5048
- **表記ゆれ**: 南清里レジャーセンターキャンプ場 / 南清里レジャーセンター
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076390/
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/minamikiyosato

### 10. 八ヶ岳美し森ロッジ

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市大泉町西井出石堂8240-1
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209aa6712050761/
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/utsukushimori-yamanashi

### 11. モーモーランド清里オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市高根町清里3545-772
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076380/
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/momo-land-kiyosato

### 12. 清里ブレーメンリゾートクラブ

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県北杜市高根町清里3545-221 / 山梨県北杜市高根町清里3545
- **同じ番地に別名**: 清泉寮自然学校キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076378/
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/bremen

### 13. オートキャンプ牧場チロル

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市武川町柳沢3274-14
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19409ca3430052771/

### 14. オートキャンプ場グリーンメイト

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市武川町柳沢3274-2
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19409ca3430053420/

### 15. 清里中央オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市高根町浅川152-1
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076377/

### 16. Asuka’s House 八ヶ岳

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市大泉町谷戸8974-686
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000224103/

### 17. みずがき山自然公園

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市須玉町小尾8862-1
- **同じ番地に別名**: みずがき山森の農園キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076388/

### 18. 日野水牧場ファームキャンプ

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市大泉町西井出8240
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076379/

### 19. ACNオートリゾートパーク・ビッグランド

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市白州町大坊1131
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000154659/

### 20. みずがき山リーゼンヒュッテ

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市須玉町比志6498-1
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19403cb3530080034/

### 21. 白州観光尾白キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市白州町白須8886
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076416/

### 22. 南アルプス三景園

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市武川町柳沢3601-1
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19409ca3430156104/

### 23. 尾白川リゾートオートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市白州町白須2182-1
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076403/

### 24. ヴィレッジ白州

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市上教来石2124
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_19209ca3432076391/

### 25. コテージカイト

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市白州町横手278-3
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000217222/

### 26. 0site

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市須玉町比志5989-3 フィトンチッド
- **出典**:
  - `L2` じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000219764/

### 27. ザ ノマド 八ヶ岳

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市大泉町谷戸8599
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/the-nomad-yatsugatake

### 28. 大自然に抱かれたキャンプ場ウッドペッカー

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市須玉町上津金2449-5
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/woodpecker

### 29. 南アルプス三景園オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市武川町柳澤烏帽子3601-1
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/sankeien

### 30. Shin-Ei-Kiyosato Camp Field（新栄清里キャンプ場）

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市高根町清里3545-238
- **同じ番地に別名**: 新栄清里キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/shinei-kiyosato

### 31. ネオオリエンタルリゾート八ヶ岳高原

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市大泉町谷戸8741
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/yatsugatake

### 32. 清泉寮自然学校キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市高根町清里3545
- **同じ番地に別名**: 清里ブレーメンリゾートクラブ（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/seisenryo

### 33. 大人のキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市須玉町江草西沢原18004
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/otonano

### 34. 八ヶ岳美し森ロッジ（旧名称：美し森ファーム）

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県北杜市大泉町西井出8240-1
- **出典**:
  - `L2` hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） — https://camp-spot.hinata.me/spots/kiyosato-lodge

### 35. フレンドパークむかわ キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県北杜市
- **出典**:
  - `L3` ウォーカープラス 山梨県 — https://fp-mukawa-kaikoma.com/

### 36. ACNオートリゾートパーク・ビッグランド

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県北杜市
- **出典**:
  - `L3` ウォーカープラス 山梨県 — http://www.bigland.co.jp

### 37. 大自然に抱かれたキャンプ場ウッドペッカー

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県北杜市
- **出典**:
  - `L3` ウォーカープラス 山梨県 — https://www.woodpecker-cs.com/

### 38. BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳)

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県北杜市
- **出典**:
  - `L3` ウォーカープラス 山梨県 — https://yatsugatake.bub-resort.com/

### 39. 大人のキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 山梨県北杜市
- **出典**:
  - `L3` ウォーカープラス 山梨県 — http://xn--u9jyg0exb9d899tm4nmyb.com/

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
| `kobuchizawa-auto-camp` | 小淵沢オートキャンプ場 | 山梨県北杜市小淵沢町上笹尾3181 | unverified | true |
| `takegawa-kyo-camp` | 武川郷キャンプ場 | 山梨県北杜市武川町山高3012 | unverified | true |
| `folkwood-yatsugatake` | FOLKWOOD VILLAGE 八ヶ岳 | 山梨県北杜市小淵沢町3900-2 | active |  |
| `shinozawa-ootaki-camp` | 篠沢大滝キャンプ場 | 山梨県北杜市白州町大坊1181 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `kiyosato-chuo-auto` 清里中央オートキャンプ場 | 清里中央オートキャンプ場 | 名前 | MID | L2 |
| `kiyosato-oka` 清里丘の公園キャンプ場 | 清里丘の公園キャンプ場 | 名前 | MID | L2 |
| `village-hakushu` ヴィレッヂ白州 | ヴィレッヂ白州 | 名前 | LOW | L2 |
| `yatsugatake-oizumi` 八ヶ岳オートキャンプ場 | 八ヶ岳オートキャンプ場 | 名前 | MID | L2 |
| `hakushu-ojiro-camp` 白州・尾白の森キャンプ場 | 尾白の森キャンプ場 | 名前 | LOW | L2 |
| `flora-campsite` 白州・尾白 FLORA Campsite in the Natural Garden | FLORA Campsite in the Natural Garden | 名前 | LOW | L2 |
| `akeno-fureai-camp` 北杜市明野ふれあいの里キャンプ場 | PICA八ヶ岳明野（旧｜キャンピカ明野ふれあいの里） | 番地（名前は不一致） | LOW | L2 |

## 大字検査 — IN_DATA の突合が本当に同じ場所か

**判定には使っていない。**上の `MISSING` / `ORPHAN` / `IN_DATA` はこの節を見る前に確定している。

地区が市町村単位になったので、**名前だけで市内のどのレコードにも当たれる。**
大字の制約が外れたぶん、新しい誤突合が生まれうる。
そこで突合が成立した組だけを後から見て、両側の大字を比べている。
**もう一度大字単位でスイープしているのではない**（それをすると包含問題が検査側に戻る）。

| 分類 | 件数 |
|---|---:|
| **不一致（誤突合の疑い）** | **0** |
| 包含（粒度違い・無害） | 1 |
| 一致 | 6 |
| 検査対象外（どちらかの大字が取れない） | 0 |

> **★ 「不一致 0件」を「誤突合が 0件」と読まないこと。**
> 検査対象外が 0件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

### 包含 — 前方一致（無害として分けた）

`麓` と `麓朝霧` のような粒度の違い。**別施設の根拠にならない。**

- `village-hakushu` ヴィレッヂ白州（白州町上教来石平久保）↔ ヴィレッヂ白州（白州町上教来石平久保山）

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 10件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| `b2（地区外）` | 5 | 市区町村が別。地区の粒度とは無関係 |
| `MISSING` | 5 | 実在するがデータに無い。**案Cで増えた MISSING の出どころ** |

<details><summary>内訳（項目ごと）</summary>

| ソース | 名前 | 住所 | 行き先 |
|---|---|---|---|
| `walkerplus` | せせらぎ荘キャンプ場 | 山梨県都留市 | b2（地区外） |
| `walkerplus` | フレンドパークむかわ キャンプ場 | 山梨県北杜市 | MISSING |
| `walkerplus` | ACNオートリゾートパーク・ビッグランド | 山梨県北杜市 | MISSING |
| `walkerplus` | 平野田休養村キャンプ場 | 山梨県上野原市 | b2（地区外） |
| `walkerplus` | 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | b2（地区外） |
| `walkerplus` | 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | MISSING |
| `walkerplus` | ノースランドキャンパーズビレッジ | 山梨県甲斐市 | b2（地区外） |
| `walkerplus` | BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | MISSING |
| `walkerplus` | 道志の森キャンプ場 | 山梨県南都留郡道志村 | b2（地区外） |
| `walkerplus` | 大人のキャンプ場 | 山梨県北杜市 | MISSING |

</details>

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **3** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 7 件 | **7** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 7 |

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
| なっぷ yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi | 20 | 0 | 14 | 6 | 0 | OK |
| じゃらん観光ガイド 北杜市（cit_192090000 / ジャンル キャンプ・バンガロー・コテージ） | 29 | 0 | 29 | 0 | 0 | OK |
| hinata スポット 八ヶ岳・小淵沢・清里・大泉（koushinetsu/yamanashi/2008） | 24 | 0 | 22 | 0 | 2 | OK |
| キャンナビ（japancamp.jp）山梨県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 山梨県 | 10 | 0 | 5 | 0 | 5 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）3 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| Camp inn 清里 グランデール | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list |
| 清里オーベルジュ コート・ドゥ・ヴェール(緑の丘)オートキャンプサイト | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list |
| FOLKWOOD VILLAGE 八ヶ岳 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/yatsygatake_kobuchisawa_kiyosato_oizumi/list |

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
| ノースランドキャンパーズビレッジ | 山梨県甲斐市上芦沢1352 | L2 hinata-spot |
| 森の隠れ家ビッグホーンオートキャンプ場 | 山梨県甲斐市上芦沢1159 | L2 hinata-spot |
| せせらぎ荘キャンプ場 | 山梨県都留市 | L3 walkerplus |
| 平野田休養村キャンプ場 | 山梨県上野原市 | L3 walkerplus |
| 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | L3 walkerplus |
| ノースランドキャンパーズビレッジ | 山梨県甲斐市 | L3 walkerplus |
| 道志の森キャンプ場 | 山梨県南都留郡道志村 | L3 walkerplus |

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
| 清里中央オートキャンプ場 | IN_DATA | L2 nap-camp |
| 清里丘の公園キャンプ場 | IN_DATA | L2 nap-camp |
| 新栄清里キャンプ場 | MISSING | L2 nap-camp |
| みずがき山森の農園キャンプ場 | MISSING | L2 nap-camp |
| PAWS GROUND | MISSING | L2 nap-camp |
| untitled | MISSING | L2 nap-camp |
| 八ヶ岳Air-ground | MISSING | L2 nap-camp |

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
