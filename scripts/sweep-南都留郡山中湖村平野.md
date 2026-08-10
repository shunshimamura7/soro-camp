# 地区スイープ: 南都留郡山中湖村平野

実行: 2026-08-10 14:15:52　/　`node scripts/district-sweep.js --district "南都留郡山中湖村平野"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **22** |
| IN_DATA（両方にある） | 4 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 5 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 山中湖観光協会 泊まる | OK | 9 | 7 | 一覧は先頭5ページまで / 住所を取りに行く詳細ページを 60 件で打ち切った（対象 192 件）。**打ち切った分はこの検査に載らない** / 宿泊施設 192 件のうち、本文にキャンプ関連語があった 9 件を残した（判定語: キャンプ/テント/オートサイト/バンガロー/野営） |
| L2 | なっぷ yamanashi/yamanakako_oshino | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 6 | 6 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_194250000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_194250000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） | OK | 18 | 15 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）山梨県 | OK | 608 | 24 | 一覧は先頭8ページまで（無いページは404として記録される） |
| L3 | ウォーカープラス 山梨県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（山梨） | **L1_NOT_FOUND** | – | – | 山梨県のオープンデータに観光施設（キャンプ場）一覧の CSV は未確認 |

取得したページ:

- `L1` https://lake-yamanakako.com/reserve → 200
- `L1` https://lake-yamanakako.com/reserve?page=2 → 200
- `L1` https://lake-yamanakako.com/reserve?page=3 → 200
- `L1` https://lake-yamanakako.com/reserve?page=4 → 200
- `L1` https://lake-yamanakako.com/reserve?page=5 → 200
  - 詳細ページ 60 件（住所の取得のため）
- `L2` https://www.nap-camp.com/yamanashi/yamanakako_oshino/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194250000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_194250000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_194250000/g2_04/page_3/ → 404
  - 詳細ページ 6 件（住所の取得のため）
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

### 1. PICA山中湖ヴィレッジ

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡山中湖村平野506-296
- **表記ゆれ**: PICA山中湖ヴィレッジ / PICA山中湖
- **同じ番地に別名**: 村営山中湖キャンプ場 / 地球元気村｢山中湖キャンプ場｣（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10105
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/pica-yamanakako

### 2. 東照館

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村平野210
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10069

### 3. the508

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡山中湖村平野508-114 / 山梨県南都留郡山中湖村平野508-113
- **表記ゆれ**: the508 / the 508
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10113
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/bugakuso

### 4. 三興荘

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村平野118
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10503

### 5. 小田急山中湖フォレストコテージ

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 山梨県南都留郡山中湖村平野491
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10106
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/odakyu-yamanakako

### 6. 富月荘

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 山梨県南都留郡山中湖村平野1903
- **出典**:
  - `L1` 山中湖観光協会 泊まる — https://lake-yamanakako.com/reserve/10070

### 7. Lake Lodge YAMANAKA

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野479
- **出典**:
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/lake-lodge-yamanaka

### 8. VIASSO（ビアッソ）

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野1536
- **同じ番地に別名**: ビアッソ（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/viasso

### 9. MaukaResortAZMY

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野1289
- **表記ゆれ**: MaukaResortAZMY / Mauka Resort AZMY
- **出典**:
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/azmy

### 10. 東照館 オートキャンプ山中湖

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野1430
- **表記ゆれ**: 東照館 オートキャンプ山中湖 / 東照館オートキャンプ山中湖
- **出典**:
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list
  - `L2` なっぷ yamanashi/yamanakako_oshino — https://www.nap-camp.com/yamanashi/yamanakako_oshino/list?page=2
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/tosyokan-yamanakako

### 11. コンテナワークスin山中湖

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野1286
- **出典**:
  - `L2` じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000218465/

### 12. ニュー福寿荘

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野140
- **出典**:
  - `L2` じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000220019/

### 13. LOTUS FUJI

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野648-27
- **出典**:
  - `L2` じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000220955/

### 14. 地球元気村｢山中湖キャンプ場｣

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野506-296 文学の森公園
- **同じ番地に別名**: 村営山中湖キャンプ場 / PICA山中湖ヴィレッジ（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000223312/

### 15. ビアッソ

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野1536
- **同じ番地に別名**: VIASSO（ビアッソ）（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000214881/

### 16. 山中湖ハウス

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野508-72
- **出典**:
  - `L2` じゃらん観光ガイド 山中湖村（cit_194250000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_guide000000218144/

### 17. 湖山荘キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2 + L3）
- **住所**: 山梨県南都留郡山中湖村平野508-123 / 南都留郡山中湖村平野508
- **出典**:
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/kozanso
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 18. プライベートハウス・バイロン

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野508-28
- **出典**:
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/byron

### 19. ペンション 飛遊人

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野508-687
- **出典**:
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/humanpension

### 20. 飛遊人キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 山梨県南都留郡山中湖村平野508-42
- **出典**:
  - `L2` hinata スポット 山中湖・忍野（koushinetsu/yamanashi/2004） — https://camp-spot.hinata.me/spots/human

### 21. みさきキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡山中湖村平野2431-2
- **同じ番地に別名**: sotosotodays CAMPGROUNDS 山中湖みさき（旧みさきキャンプ場）（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/2/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/3/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/4/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/5/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/6/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/7/
  - `L3` キャンナビ（japancamp.jp）山梨県 — https://japancamp.jp/camp_area/19-yamanashi/page/8/

### 22. 小田急山中湖フォレストコテージ

- **分類**: MISSING
- **confidence**: LOW（層: L3）
- **住所**: 南都留郡山中湖村平野切詰491
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
| 山中湖観光協会 泊まる | 9 | 6 | 1 | 17% | yamanakako-misaki, komeidoso-auto, fujigoko-auto-camp, fujinomori-yamanakako, yamanakako-minami-auto |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `fujigoko-auto-camp` | 富士五湖オートキャンプ場 | 山梨県南都留郡山中湖村平野2563-1 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `muraei-yamanakako` 村営山中湖キャンプ場 | 村営山中湖キャンプ場 | 名前 | HIGH | L1+L2 |
| `yamanakako-minami-auto` 山中湖みなみオートキャンプ場 | 山中湖みなみオートキャンプ場 | 名前 | MID | L2 |
| `fujinomori-yamanakako` 山中湖ふじのもりオートキャンプ場 | 山中湖ふじのもりオートキャンプ場 | 名前 | LOW | L2 |
| `yamanakako-misaki` sotosotodays 山中湖みさき | sotosotodays CAMPGROUNDS 山中湖みさき（旧みさきキャンプ場） | 番地（名前は不一致） | LOW | L2 |

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
