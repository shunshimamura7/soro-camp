# 地区スイープ: 富士宮市

実行: 2026-08-16 13:16:49　/　`node scripts/district-sweep.js --district "富士宮市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **24** |
| IN_DATA（両方にある） | 11 |
| ORPHAN（データにあるがソースに無い） | 2 |
| データ側のこの地区のレコード | 13 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） | OK | 12 | 0 | 一覧に住所が無いため名前のみ。`/play/camp/` はカテゴリ全体が返るので使わない |
| L2 | フジヤマNAVI 富士宮市 × キャンプ | OK | 17 | 0 | 一覧に住所が無いため名前のみ。コテージ・ホテルが混ざる |
| L2 | なっぷ shizuoka/gotenba_fuzi | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 12 | 12 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_222070000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_222070000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 御殿場・富士（tokai/shizuoka/2710） | OK | 58 | 31 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）静岡県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/22-shizuoka/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/22-shizuoka/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 静岡県 | OK | 10 | 3 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 富士宮市公式（市サイト） | **L1_NOT_FOUND** | – | – | **2025年5月のリニューアルでキャンプ場一覧ごと消滅した。**旧URL（p001678 / p001688 / p001691 と FAQ）は全部404、施設一覧の入口 /1025110000/ は403。新サイトに引き継がれた一覧は無く、**観光ページ /kanko/ には「キャンプ」の語が1回も出てこない**（2026-08-13 実測）。観光協会側（SRC_FUJINOMIYA_KANKO）で代替できているので、市公式は追わない |
| L1 | 都道府県オープンデータ（静岡） | **L1_NOT_FOUND** | – | – | 静岡県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

**L1_NOT_FOUND は「探したが一覧が存在しない」。**「まだ探していない」とは違う。
次に見る人が同じ探索を繰り返さないために、確認したURLを残しておく。

- **富士宮市公式（市サイト）** — **2025年5月のリニューアルでキャンプ場一覧ごと消滅した。**旧URL（p001678 / p001688 / p001691 と FAQ）は全部404、施設一覧の入口 /1025110000/ は403。新サイトに引き継がれた一覧は無く、**観光ページ /kanko/ には「キャンプ」の語が1回も出てこない**（2026-08-13 実測）。観光協会側（SRC_FUJINOMIYA_KANKO）で代替できているので、市公式は追わない
  - 確認: https://www.city.fujinomiya.lg.jp/kanko/

取得したページ:

- `L1` https://fujinomiya.gr.jp/guides/play/?term=camp → 200（キャッシュ）
- `L2` https://www.fujiyama-navi.jp/areas/%E5%AF%8C%E5%A3%AB%E5%AE%AE%E5%B8%82/categories/%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97 → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/gotenba_fuzi/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/shizuoka/gotenba_fuzi/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_222070000/g2_04/page_3/ → 404
  - 詳細ページ 12 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/tokai/shizuoka/2710/list?page=3 → 200（キャッシュ）
  - 詳細ページ 58 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/22-shizuoka/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/2/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/3/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/4/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/5/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/6/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/7/ → 403
- `L3` https://japancamp.jp/camp_area/22-shizuoka/page/8/ → 403
- `L3` https://www.walkerplus.com/spot_list/ar0622/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. Field Dogs Garden

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 静岡県富士宮市猪之頭人穴道1816-9
- **表記ゆれ**: Field Dogs Garden / Ｆｉｅｌｄ Ｄｏｇｓ Ｇａｒｄｅｎ（キャンプ場）
- **出典**:
  - `L1` 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） — https://fujinomiya.gr.jp/guide/98/
  - `L2` フジヤマNAVI 富士宮市 × キャンプ — https://www.fujiyama-navi.jp/spots/Zq76p
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/field-dog-garden

### 2. 富士オートキャンプ場ふもと村

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 静岡県富士宮市麓174-1
- **出典**:
  - `L1` 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） — https://fujinomiya.gr.jp/guide/124/
  - `L2` フジヤマNAVI 富士宮市 × キャンプ — https://www.fujiyama-navi.jp/spots/H07tH
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000199371/
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fumotomura

### 3. 富士山ワイルドアドベンチャー（FWA）

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 静岡県富士宮市上井出2753-2
- **表記ゆれ**: 富士山ワイルドアドベンチャー（FWA） / 富士山ワイルドアドベンチャー
- **出典**:
  - `L1` 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） — https://fujinomiya.gr.jp/guide/4970/
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000220636/
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fujisan-wild-adventure

### 4. 新富士オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県富士宮市北山7430-421
- **出典**:
  - `L2` フジヤマNAVI 富士宮市 × キャンプ — https://www.fujiyama-navi.jp/spots/Pkh8F
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000198770/

### 5. 白糸オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県富士宮市内野字中野坂1892-1 / 静岡県富士宮市内野1892-1
- **出典**:
  - `L2` フジヤマNAVI 富士宮市 × キャンプ — https://www.fujiyama-navi.jp/spots/qYrTi
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000154674/
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/shiraito

### 6. 猪の頭オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県富士宮市猪之頭2350
- **同じ番地に別名**: Foresters Village Kobitto あさぎりキャンプフィールド（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` フジヤマNAVI 富士宮市 × キャンプ — https://www.fujiyama-navi.jp/spots/NXGxz
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/inogashira

### 7. 表富士キャンピング場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県富士宮市上井出静1253-1
- **出典**:
  - `L2` フジヤマNAVI 富士宮市 × キャンプ — https://www.fujiyama-navi.jp/spots/7dZIo
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/omotefuji

### 8. Foresters Village Kobitto あさぎりキャンプフィールド

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県富士宮市猪之頭2350
- **同じ番地に別名**: 猪の頭オートキャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` なっぷ shizuoka/gotenba_fuzi — https://www.nap-camp.com/shizuoka/gotenba_fuzi/list
  - `L2` なっぷ shizuoka/gotenba_fuzi — https://www.nap-camp.com/shizuoka/gotenba_fuzi/list?page=2
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/foresters_village_kobitto_asagiri

### 9. 西富士オートキャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 静岡県富士宮市内野1687
- **出典**:
  - `L2` なっぷ shizuoka/gotenba_fuzi — https://www.nap-camp.com/shizuoka/gotenba_fuzi/list
  - `L2` なっぷ shizuoka/gotenba_fuzi — https://www.nap-camp.com/shizuoka/gotenba_fuzi/list?page=2
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_22207ca3430055383/
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/nishifuji-autocamp

### 10. foothills キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市北山7429-2
- **出典**:
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000227894/

### 11. 桂の森 CAMPERS FIELD

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市大中里1884-5
- **出典**:
  - `L2` じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000228273/

### 12. 田貫湖キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市佐折634-1
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/tanukiko

### 13. 村山ジャンボキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市村山1071-2
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/murayama-jumbo

### 14. グランパパ -大人の隠れ場- キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市猪之頭26−1
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/02259

### 15. Mt.FUJISATOYAMAVACATION

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市狩宿8-2
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/satoyama-vacation

### 16. 朝霧高原英知の杜キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市根原71-3
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/eitinomori

### 17. FUJIYAMA 泉の森キャンピングフィールド

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市猪之頭2131−4 / 静岡県富士宮市猪之頭2227−1
- **表記ゆれ**: FUJIYAMA 泉の森キャンピングフィールド / Fuji Camp Village
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fujiyama_izuminomori
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fujicamp

### 18. 新富士オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市北山鞍骨7430
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/shinfuji

### 19. アサギリ高原パラグライダーキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市根原282-1
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/asagiri-paraglider

### 20. 富士山キャンプランド

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市上井出3680富士ミルクランド内
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fuji-miruku-and

### 21. スタイルキャビンあさぎり

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市根原449-11
- **同じ番地に別名**: あさぎりフードパーク（スタイルキャビンあさぎり）（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/stylecabin-asagiri

### 22. 富士桜モビランドキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 静岡県富士宮市上井出2460
- **出典**:
  - `L2` hinata スポット 御殿場・富士（tokai/shizuoka/2710） — https://camp-spot.hinata.me/spots/fujisakura-mobiland

### 23. GRAN REGALO ASAGIRI (グランレガロあさぎり)

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 静岡県富士宮市
- **出典**:
  - `L3` ウォーカープラス 静岡県 — https://gran-regalo.com/

### 24. MT. FUJI SATOYAMA VACATION (マウントフジ里山バケーション)

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 静岡県富士宮市
- **出典**:
  - `L3` ウォーカープラス 静岡県 — https://satoyama-vacation.com/

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） | 12 | 11 | 4 | 36% | eichinomori, sorairo, houzan, fuji-ymca, asagiri-foodpark, fujisan-genshijin, granpapa-solo-bocchi |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `fujisan-genshijin` | 富士山オートキャンプ場GENSHIJIN | 静岡県富士宮市上井出2527番地の1 | active |  |
| `granpapa-solo-bocchi` | 富士山GranPapaソロぼっち区画サイト | 静岡県富士宮市猪之頭26-1 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `pica-omotefuji` PICA表富士 | PICA表富士（富士山2合目） | 名前 | HIGH | L1+L2 |
| `fumotoppara` ふもとっぱらキャンプ場 | ふもとっぱら | 名前 | HIGH | L1+L2 |
| `eichinomori` 朝霧高原 英知の杜キャンプ場 | ペンギン村オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `tenshino-mori-camp` 天子の森オートキャンプ場 | 天子の森オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `asagiri-jamboree` 朝霧ジャンボリーオートキャンプ場 | 朝霧ジャンボリーオートキャンプ場 | 名前 | HIGH | L1+L2 |
| `tanukiko` 田貫湖キャンプ場 | 田貫湖（たぬきこ） | 名前 | HIGH | L1+L2 |
| `houzan` アーバンキャンピング朝霧宝山 | アーバンキャンピング朝霧宝山 | 名前 | MID | L2 |
| `sorairo` 朝霧Camp Base そらいろ | 朝霧CampBaseそらいろ | 名前 | LOW | L2 |
| `fuji-ymca` 富士山YMCAグローバル・エコ・ヴィレッジ | 富士山YMCAグローバル・エコ・ヴィレッジ | 名前 | LOW | L2 |
| `asagiri-greenpark-camp` 朝霧高原グリーンパーク | 朝霧高原オートキャンプ場 | 名前 | LOW | L3 |
| `asagiri-foodpark` AFPオートキャンプ場（スタイルキャビンあさぎり） | あさぎりフードパーク（スタイルキャビンあさぎり） | 番地（名前は不一致） | LOW | L2 |

## 大字検査 — IN_DATA の突合が本当に同じ場所か

**判定には使っていない。**上の `MISSING` / `ORPHAN` / `IN_DATA` はこの節を見る前に確定している。

地区が市町村単位になったので、**名前だけで市内のどのレコードにも当たれる。**
大字の制約が外れたぶん、新しい誤突合が生まれうる。
そこで突合が成立した組だけを後から見て、両側の大字を比べている。
**もう一度大字単位でスイープしているのではない**（それをすると包含問題が検査側に戻る）。

| 分類 | 件数 |
|---|---:|
| **不一致（誤突合の疑い）** | **2** |
| 包含（粒度違い・無害） | 1 |
| 一致 | 7 |
| 検査対象外（どちらかの大字が取れない） | 1 |

> **★ 「不一致 2件」を「誤突合が 2件」と読まないこと。**
> 検査対象外が 1件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

### 不一致 — 大字が別

| データ側 | データ側の大字 | ソース側 | ソース側の大字 | 一致の根拠 |
|---|---|---|---|---|
| `eichinomori` 朝霧高原 英知の杜キャンプ場 | 根原 | ペンギン村オートキャンプ場 | 猪之頭 | 名前 |
| `tanukiko` 田貫湖キャンプ場 | 佐折 | 田貫湖（たぬきこ） | 猪之頭 | 名前 |

**「不一致＝誤突合」でもない。**同じ施設でソース側の住所が古い、という型がある
（田貫湖の例: ソースが猪之頭、データが佐折。移転ではなく表記の世代違い）。
**1件ずつ人が見るための一覧**であって、自動で外す根拠には使わない。

### 包含 — 前方一致（無害として分けた）

`麓` と `麓朝霧` のような粒度の違い。**別施設の根拠にならない。**

- `sorairo` 朝霧Camp Base そらいろ（麓）↔ 朝霧CampBaseそらいろ（麓朝霧）

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 10件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| b2（地区外） | 7 | 市区町村が別。地区の粒度とは無関係 |
| MISSING | 2 | 実在するがデータに無い。**案Cで増えた MISSING の出どころ** |
| IN_DATA | 1 | データにあった。**大字が無いせいで突合できていなかっただけ** |

<details><summary>内訳（項目ごと）</summary>

| ソース | 名前 | 住所 | 行き先 |
|---|---|---|---|
| `walkerplus` | 市民の森(沼津市) | 静岡県沼津市 | b2（地区外） |
| `walkerplus` | おれっぷ大久保キャンプ場 | 静岡県藤枝市 | b2（地区外） |
| `walkerplus` | 御殿場欅平ファミリーキャンプ場 | 静岡県御殿場市 | b2（地区外） |
| `walkerplus` | GRAN REGALO ASAGIRI (グランレガロあさぎり) | 静岡県富士宮市 | MISSING |
| `walkerplus` | 富士山こどもの国オートキャンプ場 | 静岡県富士市 | b2（地区外） |
| `walkerplus` | 南伊豆夕日ヶ丘キャンプ場 | 静岡県賀茂郡南伊豆町 | b2（地区外） |
| `walkerplus` | 朝霧高原オートキャンプ場 | 静岡県富士宮市 | IN_DATA |
| `walkerplus` | MT. FUJI SATOYAMA VACATION (マウントフジ里山バケーション) | 静岡県富士宮市 | MISSING |
| `walkerplus` | 竜洋海洋公園オートキャンプ場 | 静岡県磐田市 | b2（地区外） |
| `walkerplus` | PICA富士ぐりんぱ | 静岡県裾野市 | b2（地区外） |

</details>

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **10** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 34 件 | **34** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 16 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| 富士宮市観光協会 遊ぶ（?term=camp で絞り込み） | 12 | 0 | 10 | 2 | 0 | OK |
| フジヤマNAVI 富士宮市 × キャンプ | 17 | 0 | 13 | 4 | 0 | OK |
| なっぷ shizuoka/gotenba_fuzi | 20 | 0 | 6 | 8 | 6 | OK |
| じゃらん観光ガイド 富士宮市（cit_222070000 / ジャンル キャンプ・バンガロー・コテージ） | 12 | 0 | 12 | 0 | 0 | OK |
| hinata スポット 御殿場・富士（tokai/shizuoka/2710） | 58 | 0 | 31 | 0 | 27 | OK |
| キャンナビ（japancamp.jp）静岡県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 静岡県 | 10 | 0 | 3 | 0 | 7 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）10 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| COW RESORT IDEBOK | L1 fujinomiya-kankou | 一覧に住所が無い | https://fujinomiya.gr.jp/guide/4438/ |
| 西富士オ－トキャンプ場 | L1 fujinomiya-kankou | 一覧に住所が無い | https://fujinomiya.gr.jp/guide/119/ |
| 表富士グリーンキャンプ場 | L2 fujiyama-navi | 一覧に住所が無い | https://www.fujiyama-navi.jp/spots/wqs0G |
| ＡＣＮ西富士オートキャンプ場 | L2 fujiyama-navi | 一覧に住所が無い | https://www.fujiyama-navi.jp/spots/5Pqow |
| 伊豆高原コテッジ | L2 fujiyama-navi | 一覧に住所が無い | https://www.fujiyama-navi.jp/spots/pu670 |
| コテージホテル 大いなる海 | L2 fujiyama-navi | 一覧に住所が無い | https://www.fujiyama-navi.jp/spots/jY4dK |
| RECAMP 富士スピードウェイ | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |
| キャンプ場フィール | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |
| VOLCANO 白糸オートキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |
| FWA【富士山ワイルドアドベンチャー】 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/shizuoka/gotenba_fuzi/list |

#### b1-2 — 詳細ページの取得に失敗して住所が取れなかった

**これは直せる可能性がある。**`fetchPage` は成功したものしかキャッシュしないので、
失敗した詳細ページは毎回取りに行って毎回失敗する。URL が生きているか確認すること。

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b2-a — 住所の市区町村が、この地区の市区町村と違う

**ここだけが「住所が誤っている」疑いの対象。**ただし市単位のソースが
広域を含んでいるだけのこともある（じゃらんは市全体、キャンナビは県全体）。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| 乙女森林公園第２キャンプ場 | 静岡県御殿場市深沢2696-2 | L2 nap-camp / L2 hinata-spot |
| 桃沢野外活動センター | 静岡県駿東郡長泉町元長窪895-108桃沢野外活動センター | L2 nap-camp / L2 hinata-spot |
| 乙女森林公園第1キャンプ場 | 静岡県御殿場市深沢2190 | L2 nap-camp / L2 hinata-spot |
| 富士見の丘オートキャンプ場 | 静岡県富士市大淵1297 | L2 hinata-spot |
| 長田山荘キャンプ場 | 静岡県御殿場市板妻511 | L2 hinata-spot |
| 大野路ファミリーキャンプ場 | 静岡県裾野市須山2934-3 | L2 hinata-spot |
| やまぼうしオートキャンプ場 | 静岡県御殿場市板妻630 | L2 hinata-spot |
| 御殿場まるびオートキャンプ場 | 静岡県御殿場市印野1379-1 | L2 hinata-spot |
| 富士スピードウェイ アクティブパーク | 静岡県駿東郡小山町中日向694富士スピードウェイ | L2 hinata-spot |
| 富士すそ野ファミリーキャンプ場 | 静岡県裾野市須山字大野2653 | L2 hinata-spot |
| 泊まれる公園 INN THE PARK | 静岡県沼津市足高220-4 | L2 hinata-spot |
| ＧＬＡＭＰＩＮＧ藤乃煌富士御殿場 | 静岡県御殿場市東田中3373−25 | L2 hinata-spot |
| DogField合衆国 | 静岡県裾野市下和田572-1 | L2 hinata-spot |
| 御殿場高原リゾート時之栖OUTDOORHILLVILLAGE | 静岡県御殿場市神山719 | L2 hinata-spot |
| NELOgotemba | 静岡県駿東郡小山町新柴字道端672-1 | L2 hinata-spot |
| 丸火自然公園グリーンキャンプ場 | 静岡県富士市大淵10847番地の1 | L2 hinata-spot |
| カントリーベアーファミリーキャンプ場 | 静岡県裾野市須山字大野2646 | L2 hinata-spot |
| 野田山健康緑地公園 富士川キャンプ場 | 静岡県富士市中之郷4482-141 | L2 hinata-spot |
| 炭屋ベース | 静岡県静岡県裾野市下和田字堀向509 | L2 hinata-spot |
| 御殿場欅平ファミリーキャンプ場 | 静岡県御殿場市印野696-1 | L2 hinata-spot |
| みらくのキャンプ場 | 静岡県裾野市須山2956-7 | L2 hinata-spot |
| 函南町立木立キャンプ場 | 静岡県田方郡函南町桑原1331-1 | L2 hinata-spot |
| PICA富士ぐりんぱ | 静岡県裾野市須山字藤原2427 | L2 hinata-spot |
| ながおねオートキャンプ場 | 静岡県裾野市須山3406-2 | L2 hinata-spot |
| 三島市立箱根の里 | 静岡県三島市山中新田4710-1 | L2 hinata-spot |
| 須津山休養林キャンプ場 | 静岡県富士市江尾1035 | L2 hinata-spot |
| 静岡県富士山こどもの国 | 静岡県富士市桑崎1015 | L2 hinata-spot |
| 市民の森(沼津市) | 静岡県沼津市 | L3 walkerplus |
| おれっぷ大久保キャンプ場 | 静岡県藤枝市 | L3 walkerplus |
| 御殿場欅平ファミリーキャンプ場 | 静岡県御殿場市 | L3 walkerplus |
| 富士山こどもの国オートキャンプ場 | 静岡県富士市 | L3 walkerplus |
| 南伊豆夕日ヶ丘キャンプ場 | 静岡県賀茂郡南伊豆町 | L3 walkerplus |
| 竜洋海洋公園オートキャンプ場 | 静岡県磐田市 | L3 walkerplus |
| PICA富士ぐりんぱ | 静岡県裾野市 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b3 — 住所なしの項目が合流したもの（漏れていない）

| 合流先 | 分類 | 合流した住所なしの出典 |
|---|---|---|
| Field Dogs Garden | MISSING | L1 fujinomiya-kankou / L2 fujiyama-navi |
| PICA表富士（富士山2合目） | IN_DATA | L1 fujinomiya-kankou |
| ふもとっぱら | IN_DATA | L1 fujinomiya-kankou / L2 fujiyama-navi |
| ペンギン村オートキャンプ場 | IN_DATA | L1 fujinomiya-kankou / L2 fujiyama-navi |
| 天子の森オートキャンプ場 | IN_DATA | L1 fujinomiya-kankou / L2 fujiyama-navi |
| 富士オートキャンプ場ふもと村 | MISSING | L1 fujinomiya-kankou / L2 fujiyama-navi |
| 富士山ワイルドアドベンチャー（FWA） | MISSING | L1 fujinomiya-kankou |
| 朝霧ジャンボリーオートキャンプ場 | IN_DATA | L1 fujinomiya-kankou / L2 fujiyama-navi |
| 田貫湖（たぬきこ） | IN_DATA | L1 fujinomiya-kankou / L2 fujiyama-navi |
| 新富士オートキャンプ場 | MISSING | L2 fujiyama-navi |
| 白糸オートキャンプ場 | MISSING | L2 fujiyama-navi |
| 猪の頭オートキャンプ場 | MISSING | L2 fujiyama-navi |
| 表富士キャンピング場 | MISSING | L2 fujiyama-navi |
| アーバンキャンピング朝霧宝山 | IN_DATA | L2 nap-camp |
| Foresters Village Kobitto あさぎりキャンプフィールド | MISSING | L2 nap-camp |
| 西富士オートキャンプ場 | MISSING | L2 nap-camp |

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
