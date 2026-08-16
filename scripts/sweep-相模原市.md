# 地区スイープ: 相模原市

実行: 2026-08-16 14:06:55　/　`node scripts/district-sweep.js --district "相模原市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-16 08:02:18

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **23** |
| IN_DATA（両方にある） | 12 |
| ORPHAN（データにあるがソースに無い） | 7 |
| データ側のこの地区のレコード | 19 |

## 必須検証

この地区は既知の答え合わせがある。**PASS**

| 期待 | 結果 | 実際 |
|---|---|---|
| 亀見橋バカンス村 が実在側（ソース側）に出ている | ✅ PASS | MISSING・HIGH / 神奈川県相模原市緑区牧野12822 / 相模原市緑区牧野12822 |
| 藤野芸術の家 が実在側（ソース側）に出ている | ✅ PASS | IN_DATA・HIGH / 神奈川県相模原市緑区牧野4819 |
| かぶと虫の森キャンプ場 が実在側（ソース側）に出ない（一次情報で実在が確認できなかった名前） | ✅ PASS | 出ていない（期待どおり） |
| 奥牧野キャンプ場 が実在側（ソース側）に出ない（一次情報で実在が確認できなかった名前） | ✅ PASS | 出ていない（期待どおり） |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 相模原市観光協会 キャンプ場一覧 | OK | 22 | 21 |  |
| L1 | 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | OK | 17 | 17 |  |
| L2 | 神奈川県公式 県央地域のバーベキュー・キャンプ | OK | 4 | 2 | 実測4件（相模原2 / 海老名1 / 愛川1）。本文の表は他団体の一覧へのリンク集で施設ではない |
| L2 | なっぷ kanagawa/sagamihara | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 18 | 18 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_141510000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_141510000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 相模原（kanto/kanagawa/1906） | OK | 29 | 23 | 一覧は先頭3ページまで |
| L3 | キャンナビ（japancamp.jp）神奈川県 | SKIPPED_ROBOTS | **測れず**（0） | – | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/14-kanagawa/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/14-kanagawa/page/2/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/14-kanagawa/page/3/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/14-kanagawa/page/4/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/14-kanagawa/page/5/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/14-kanagawa/page/6/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/14-kanagawa/page/7/ → SKIPPED_ROBOTS_403 / https://japancamp.jp/camp_area/14-kanagawa/page/8/ → SKIPPED_ROBOTS_403 |
| L3 | ウォーカープラス 神奈川県 | OK | 10 | 4 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（神奈川） | **L1_NOT_FOUND** | – | – | 神奈川県オープンデータカタログ（catalog.opendata.pref.kanagawa.jp）に観光施設一覧のデータセット無し。「観光」で該当3件はいずれも調査統計 |

取得したページ:

- `L1` https://www.e-sagamihara.com/camp/ → 200（キャッシュ）
  - 詳細ページ 22 件（住所の取得のため）
- `L1` https://midori.city.sagamihara.kanagawa.jp/category/play/camp/ → 200（キャッシュ）
- `L1` https://midori.city.sagamihara.kanagawa.jp/category/play/camp/page/2/ → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
- `L2` https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/p12621.html → 200（キャッシュ）
  - 詳細ページ 4 件（住所の取得のため）
- `L2` https://www.nap-camp.com/kanagawa/sagamihara/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/kanagawa/sagamihara/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_141510000/g2_04/page_3/ → 404
  - 詳細ページ 18 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1906/list?page=3 → 200（キャッシュ）
  - 詳細ページ 29 件（住所の取得のため）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/ → 403
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/2/ → 403
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/3/ → 403
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/4/ → 403
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/5/ → 403
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/6/ → 403
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/7/ → 403
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/8/ → 403
- `L3` https://www.walkerplus.com/spot_list/ar0314/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. 【市営】望地弁天キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県相模原市中央区田名5835-16 / 相模原市中央区田名5835-16
- **表記ゆれ**: 【市営】望地弁天キャンプ場 / 望地弁天キャンプ場
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-696/
  - `L2` 神奈川県公式 県央地域のバーベキュー・キャンプ — https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/tabi-105.html
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/mochibenten

### 2. 音久和キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県相模原市緑区青根2861-2 / 相模原市緑区青根2861-2
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-630/
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/15/onguwa-camp/
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000199137/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/onguwa

### 3. 此の間沢渓流園

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県相模原市緑区青根2510-3 / 相模原市緑区青根2510-3 / 神奈川県相模原市緑区青根2510
- **表記ゆれ**: 此の間沢渓流園 / 此の間沢溪流園
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-673/
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/15/konomasawa/
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14422ca3430054659/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/konomasawa-kanagawa

### 4. 相模湖 日相園

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 神奈川県相模原市緑区日連754
- **同じ番地に別名**: コテージ日相園 / 日相園（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-1214/

### 5. 高瀬野キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 相模原市緑区青根3297 / 神奈川県相模原市緑区青根3297
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-2596/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/takaseno

### 6. 桐花園

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県相模原市緑区佐野川1822 / 相模原市緑区佐野川1822
- **表記ゆれ**: 桐花園 / 桐花園キャンプ場
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-666/
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/15/tokaen/
  - `L2` なっぷ kanagawa/sagamihara — https://www.nap-camp.com/kanagawa/sagamihara/list
  - `L2` なっぷ kanagawa/sagamihara — https://www.nap-camp.com/kanagawa/sagamihara/list?page=2
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14424ca3430052691/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/tokaen

### 7. バカンス村

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県相模原市緑区牧野12822 / 相模原市緑区牧野12822
- **表記ゆれ**: バカンス村 / 亀見橋バカンス村
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-627/
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/14/vacance-village/
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14424ca3430140177/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/kamemibashi

### 8. 日比谷花壇のSTAY「里楽巣FUJINO」

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県相模原市緑区牧野4611-1
- **表記ゆれ**: 日比谷花壇のSTAY「里楽巣FUJINO」 / 里楽巣FUJINO
- **同じ番地に別名**: 藤野倶楽部（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-622/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/relax-fujino

### 9. 本田蘭灯商店

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 相模原市中央区淵野辺3-16-6
- **出典**:
  - `L1` 相模原市観光協会 キャンプ場一覧 — https://www.e-sagamihara.com/camp/camp-4389/

### 10. 藤野倶楽部

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 相模原市緑区牧野4611-1
- **同じ番地に別名**: 日比谷花壇のSTAY「里楽巣FUJINO」（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/14/fujinoclub/

### 11. コテージ日相園

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 相模原市緑区日連754
- **同じ番地に別名**: 相模湖 日相園 / 日相園（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/14/nissouen/

### 12. 夫婦園キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 相模原市緑区青根98 / 神奈川県相模原市緑区青根98
- **出典**:
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/14/meotoen/
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14422ca3430053637/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/fufuen

### 13. 青野原オートキャンプ場組合

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 相模原市緑区青野原918-1
- **同じ番地に別名**: 青野原オートキャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ — https://midori.city.sagamihara.kanagawa.jp/2023/02/14/aonohara-auto/

### 14. 神之川キャンプ場

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 神奈川県相模原市緑区青根3685
- **同じ番地に別名**: 神之川キャンプ・マス釣り場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000198643/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/kanogawa

### 15. 日相園

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 神奈川県相模原市緑区日連754 / 神奈川県相模原市緑区日連754−1
- **同じ番地に別名**: 相模湖 日相園 / コテージ日相園（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14424ca3430054646/
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/nissouen

### 16. 遊魚園

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県相模原市緑区名倉3231
- **出典**:
  - `L2` じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14424ca3432008902/

### 17. 青野原野呂ロッジキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県相模原市緑区津久井町青野原931
- **出典**:
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/noro-lodge

### 18. いやしの湯・青根緑の休暇村センター

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県相模原市津久井町青根844
- **出典**:
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/iyashinoyu

### 19. 北丹沢山岳センター 蛭ヶ岳山荘

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県相模原市緑区小渕1545-1
- **出典**:
  - `L2` hinata スポット 相模原（kanto/kanagawa/1906） — https://camp-spot.hinata.me/spots/kitatatanzawa-hirugatake

### 20. このまさわキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 神奈川県相模原市緑区
- **出典**:
  - `L3` ウォーカープラス 神奈川県 — https://konomasawacamp.co.jp/

### 21. PICAさがみ湖

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 神奈川県相模原市緑区
- **出典**:
  - `L3` ウォーカープラス 神奈川県 — https://www.pica-resort.jp/sagamiko/index.html

### 22. 緑の休暇村 青根キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 神奈川県相模原市緑区
- **出典**:
  - `L3` ウォーカープラス 神奈川県 — https://aonecamp.jp/

### 23. 神之川キャンプ場・マス釣り場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 神奈川県相模原市緑区
- **出典**:
  - `L3` ウォーカープラス 神奈川県 — https://kannogawa.jp/

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 相模原市観光協会 キャンプ場一覧 | 22 | 11 | 9 | 82% | ogurabashi-kasenjiki, takadabashi-kasenjiki |
| 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | 17 | 11 | 7 | 64% | aone, ogurabashi-kasenjiki, takadabashi-kasenjiki, fujino-art-camp |

## ORPHAN — データにあるが、どのソースにも出てこない

網羅率 70% 以上の L1 があるので、**判定として読める**。
ただし対照群での実測で **active レコードの17%を誤って撃つ**（10地区・24件中4件）。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `doshi-no-yu-camp` | 道志の湯キャンプ場 | 神奈川県相模原市緑区長者原40-1 | unverified | true |
| `kabutomushi-mori-camp` | かぶと虫の森キャンプ場 | 神奈川県相模原市緑区牧野4015 | unverified | true |
| `sagamiko-pleasure-camp` | 相模湖プレジャーフォレストキャンプ場 | 神奈川県相模原市緑区若柳1634 | unverified | true |
| `okumakino-camp` | 奥牧野キャンプ場 | 神奈川県相模原市緑区牧野2108 | unverified | true |
| `mikagi-camp` | 三ヶ木キャンプ場 | 神奈川県相模原市緑区三ヶ木2341 | unverified | true |
| `ogurabashi-kasenjiki` | 小倉橋河川敷 | 神奈川県相模原市緑区小倉 | active |  |
| `takadabashi-kasenjiki` | 高田橋多目的広場 | 神奈川県相模原市中央区水郷田名4-11-23 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `kamioshima-camp` 上大島キャンプ場 | 【市営】上大島キャンプ場 | 名前 | HIGH | L1+L2 |
| `aonohara-auto` 青野原オートキャンプ場 | 青野原オートキャンプ場 | 名前 | HIGH | L1+L2 |
| `norolodge` 青野原野呂ロッジキャンプ場 | 青野原 野呂ロッジキャンプ場 | 名前 | HIGH | L1+L2 |
| `akiyamagawa-camp` 秋山川キャンプ場 | 秋山川キャンプ場 | 名前 | HIGH | L1+L2 |
| `kannogawa` 神之川キャンプ・マス釣り場 | 神之川キャンプ・マス釣り場 | 名前 | HIGH | L1 |
| `konomasawa-camp` このまさわキャンプ場 | このまさわキャンプ場 | 名前 | HIGH | L1+L2 |
| `sagamiko-kyuyomura` 相模湖休養村キャンプ場 | 相模湖休養村キャンプ場 | 名前 | HIGH | L1+L2 |
| `shindo` 新戸キャンプ場 | 新戸キャンプ場 | 名前 | HIGH | L1+L2 |
| `pica-sagamiko` PICAさがみ湖 | PICAさがみ湖 | 名前 | HIGH | L1+L2 |
| `fujino-art-camp` 藤野芸術の家キャンプ場 | 藤野芸術の家キャンプ場 | 名前 | HIGH | L1+L2 |
| `minoishtaki` みの石滝キャンプ場 | みの石滝キャンプ場 | 名前 | HIGH | L1+L2 |
| `aone` 青根キャンプ場 | 緑の休暇村 青根キャンプ場 | 番地（名前は不一致） | HIGH | L1+L2 |

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
| 一致 | 12 |
| 検査対象外（どちらかの大字が取れない） | 0 |

> **★ 「不一致 0件」を「誤突合が 0件」と読まないこと。**
> 検査対象外が 0件ある。住所を持たないソース（`nameOnly`）で当たった突合は
> この検査を素通りする。**検査に出なかったことは、正しいことの根拠にならない。**

## 大字が取れないソース項目の行き先

住所が**市区町村どまり**（`南都留郡道志村1388` のように大字が無い）の項目。
大字単位の地区では `inDistrict` が必ず false になり、**どの地区にも入れず落ちていた。**
市町村単位にすると突合の対象に入ってくる。

**この地区では 10件。**

| 落ちた先 | 件数 | 意味 |
|---|---:|---|
| `b2（地区外）` | 6 | 市区町村が別。地区の粒度とは無関係 |
| `MISSING` | 4 | 実在するがデータに無い。**案Cで増えた MISSING の出どころ** |

<details><summary>内訳（項目ごと）</summary>

| ソース | 名前 | 住所 | 行き先 |
|---|---|---|---|
| `walkerplus` | ひだまりの里オートキャンプ場 | 神奈川県足柄上郡山北町 | b2（地区外） |
| `walkerplus` | なみのこ村 | 神奈川県小田原市 | b2（地区外） |
| `walkerplus` | このまさわキャンプ場 | 神奈川県相模原市緑区 | MISSING |
| `walkerplus` | PICAさがみ湖 | 神奈川県相模原市緑区 | MISSING |
| `walkerplus` | 緑の休暇村 青根キャンプ場 | 神奈川県相模原市緑区 | MISSING |
| `walkerplus` | 清川リバーランド | 神奈川県愛甲郡清川村 | b2（地区外） |
| `walkerplus` | 滝沢園キャンプ場 | 神奈川県秦野市 | b2（地区外） |
| `walkerplus` | キャンプ＆スパ 山の音 | 神奈川県足柄下郡箱根町 | b2（地区外） |
| `walkerplus` | 長井海の手公園 ソレイユの丘・キャンプ場 The CLIFF CAMP&BBQ | 神奈川県横須賀市 | b2（地区外） |
| `walkerplus` | 神之川キャンプ場・マス釣り場 | 神奈川県相模原市緑区 | MISSING |

</details>

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **6** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 12 件 | **12** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 6 |

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
| 相模原市観光協会 キャンプ場一覧 | 22 | 0 | 21 | 1 | 0 | OK |
| 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | 17 | 0 | 17 | 0 | 0 | OK |
| 神奈川県公式 県央地域のバーベキュー・キャンプ | 4 | 0 | 2 | 2 | 0 | OK |
| なっぷ kanagawa/sagamihara | 20 | 0 | 12 | 6 | 2 | OK |
| じゃらん観光ガイド 相模原市緑区（cit_141510000 / ジャンル キャンプ・バンガロー・コテージ） | 18 | 0 | 18 | 0 | 0 | OK |
| hinata スポット 相模原（kanto/kanagawa/1906） | 29 | 0 | 23 | 0 | 6 | OK |
| キャンナビ（japancamp.jp）神奈川県 | 0 | 0 | 0 | 0 | 0 | OK |
| ウォーカープラス 神奈川県 | 10 | 0 | 4 | 0 | 6 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）6 件 / b1-2（取得失敗）0 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 夕暮れ迫る黄昏の時間を楽しむ “Twilight SAGAMIHARA” | L1 e-sagamihara | 一覧に住所が無い | https://www.e-sagamihara.com/camp/camp-2897/ |
| ウエインズパーク海老名 | L2 pref-kanagawa-kenou | 一覧に住所が無い | https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/tabi-172.html |
| 県立愛川ふれあいの村 | L2 pref-kanagawa-kenou | 一覧に住所が無い | https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/tabi-104.html |
| 宮ヶ瀬ヴィレッジ【Miyagase Village】 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/sagamihara/list |
| MAMURO CAMP BASE | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/sagamihara/list |
| 里楽巣 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/kanagawa/sagamihara/list |

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
| 清川リバーランド | 神奈川県愛甲郡清川村煤ヶ谷2450 | L2 nap-camp / L2 hinata-spot |
| リッチランド | 神奈川県愛甲郡清川村煤ヶ谷4513-1 | L2 hinata-spot |
| 服部牧場 | 神奈川県愛甲郡愛川町半原6087 | L2 hinata-spot |
| 田代運動公園 | 神奈川県愛甲郡愛川町田代339 | L2 hinata-spot |
| 唐沢キャンプ場 | 神奈川県愛甲郡清川村宮ヶ瀬1700 | L2 hinata-spot |
| 長者屋敷キャンプ場 | 神奈川県愛甲郡清川村宮ケ瀬1644-1 | L2 hinata-spot |
| ひだまりの里オートキャンプ場 | 神奈川県足柄上郡山北町 | L3 walkerplus |
| なみのこ村 | 神奈川県小田原市 | L3 walkerplus |
| 清川リバーランド | 神奈川県愛甲郡清川村 | L3 walkerplus |
| 滝沢園キャンプ場 | 神奈川県秦野市 | L3 walkerplus |
| キャンプ＆スパ 山の音 | 神奈川県足柄下郡箱根町 | L3 walkerplus |
| 長井海の手公園 ソレイユの丘・キャンプ場 The CLIFF CAMP&BBQ | 神奈川県横須賀市 | L3 walkerplus |

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
| 青野原 野呂ロッジキャンプ場 | IN_DATA | L2 nap-camp |
| 秋山川キャンプ場 | IN_DATA | L2 nap-camp |
| このまさわキャンプ場 | IN_DATA | L2 nap-camp |
| 相模湖休養村キャンプ場 | IN_DATA | L2 nap-camp |
| 桐花園 | MISSING | L2 nap-camp |
| 緑の休暇村 青根キャンプ場 | IN_DATA | L2 nap-camp |

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
