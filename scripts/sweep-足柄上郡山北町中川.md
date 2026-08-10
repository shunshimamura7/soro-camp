# 地区スイープ: 足柄上郡山北町中川

実行: 2026-08-10 10:27:00　/　`node scripts/district-sweep.js --district "足柄上郡山北町中川"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

| | 件数 |
|---|---|
| **MISSING**（実在側にあるがデータに無い） | **12** |
| IN_DATA（両方にある） | 3 |
| ORPHAN（データにあるがソースに無い） | 1 |
| データ側のこの地区のレコード | 4 |

## ソースの取得結果

**0件と「取れなかった」を区別すること。**取れなかったソースは、そこに無いことの根拠にならない。

| 層 | ソース | 状態 | 取得件数 | うちこの地区 | 備考 |
|---|---|---|---|---|---|
| L1 | 山北町公式 キャンプ場の紹介 | OK | 7 | 0 | 施設名・電話・料金の表。**住所欄が無い**ので名前のみ |
| L1 | 山北町観光協会 自然に泊まる | OK | 9 | 5 | 町公式とは別ページ・別構造で、町公式は観光協会にリンクしていない。独立した2ソースとして数えている |
| L2 | なっぷ kanagawa/ashigara | OK | 20 | 0 | robots.txt に Crawl-delay: 30。一覧に住所が無いため名前のみ |
| L2 | じゃらん観光ガイド 山北町（cit_143640000 / ジャンル キャンプ・バンガロー・コテージ） | OK | 12 | 7 | ジャンル g2_04 のみ / 一覧は先頭3ページまで / https://www.jalan.net/kankou/cit_143640000/g2_04/page_2/ → HTTP_404 / https://www.jalan.net/kankou/cit_143640000/g2_04/page_3/ → HTTP_404 |
| L2 | hinata スポット 足柄（kanto/kanagawa/1909） | OK | 24 | 12 | 一覧は先頭3ページまで |
| L2 | TAKIBI | UNREACHABLE | 0 | 0 | https://takibi-reservation.space/ → UNREACHABLE: fetch failed |
| L3 | キャンナビ（japancamp.jp）神奈川県 | OK | 69 | 15 | 一覧は先頭8ページまで（無いページは404として記録される） / https://japancamp.jp/camp_area/14-kanagawa/page/4/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/5/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/6/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/7/ → HTTP_404 / https://japancamp.jp/camp_area/14-kanagawa/page/8/ → HTTP_404 |
| L3 | ウォーカープラス 神奈川県 | OK | 10 | 0 | robots.txt が ClaudeBot に Crawl-delay: 3 を指定しているので3秒あける。住所は市区町村まで |
| L1 | 都道府県オープンデータ（神奈川） | **L1_NOT_FOUND** | – | – | 神奈川県オープンデータカタログ（catalog.opendata.pref.kanagawa.jp）に観光施設一覧のデータセット無し。「観光」で該当3件はいずれも調査統計 |

取得したページ:

- `L1` https://www.town.yamakita.kanagawa.jp/0000000232.html → 200（キャッシュ）
- `L1` https://www.yamakita.net/stay/natural.php → 200（キャッシュ）
  - 詳細ページ 9 件（住所の取得のため）
- `L2` https://www.nap-camp.com/kanagawa/ashigara/list → 200（キャッシュ）
- `L2` https://www.nap-camp.com/kanagawa/ashigara/list?page=2 → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_143640000/g2_04/ → 200（キャッシュ）
- `L2` https://www.jalan.net/kankou/cit_143640000/g2_04/page_2/ → 404
- `L2` https://www.jalan.net/kankou/cit_143640000/g2_04/page_3/ → 404
  - 詳細ページ 12 件（住所の取得のため）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1909/list → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1909/list?page=2 → 200（キャッシュ）
- `L2` https://camp-spot.hinata.me/kanto/kanagawa/1909/list?page=3 → 200（キャッシュ）
  - 詳細ページ 24 件（住所の取得のため）
- `L2` https://takibi-reservation.space/ → UNREACHABLE: fetch failed
- `L3` https://japancamp.jp/camp_area/14-kanagawa/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/2/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/3/ → 200（キャッシュ）
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/4/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/5/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/6/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/7/ → 404
- `L3` https://japancamp.jp/camp_area/14-kanagawa/page/8/ → 404
- `L3` https://www.walkerplus.com/spot_list/ar0314/sg0112/ → 200（キャッシュ）

## MISSING — 実在側にあるがデータに無い

### 1. バウアーハウスジャパン

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県足柄上郡山北町中川 / 神奈川県足柄上郡山北町中川869
- **出典**:
  - `L1` 山北町公式 キャンプ場の紹介 — https://www.town.yamakita.kanagawa.jp/0000000232.html
  - `L2` なっぷ kanagawa/ashigara — https://www.nap-camp.com/kanagawa/ashigara/list
  - `L2` なっぷ kanagawa/ashigara — https://www.nap-camp.com/kanagawa/ashigara/list?page=2
  - `L2` じゃらん観光ガイド 山北町（cit_143640000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14364ca3430055125/
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/bowerhouse

### 2. 白石オートキャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県足柄上郡山北町中川字相馬沢870-3
- **出典**:
  - `L1` 山北町観光協会 自然に泊まる — https://www.yamakita.net/stay/detail.php?id=6&type=2
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/shiraishi

### 3. 大石キャンプ場

- **分類**: MISSING
- **confidence**: HIGH（層: L1 + L2）
- **住所**: 神奈川県足柄上郡山北町中川866
- **出典**:
  - `L1` 山北町観光協会 自然に泊まる — https://www.yamakita.net/stay/detail.php?id=5&type=2
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/oishi-camp

### 4. 西丹沢中川ロッヂ

- **分類**: MISSING
- **confidence**: HIGH（層: L1）
- **住所**: 神奈川県足柄上郡山北町中川字小塚897-111
- **出典**:
  - `L1` 山北町観光協会 自然に泊まる — https://www.yamakita.net/stay/detail.php?id=11&type=2

### 5. 笹子沢バンガロー

- **分類**: MISSING
- **confidence**: MID（層: L2）
- **住所**: 神奈川県足柄上郡山北町中川 / 神奈川県足柄上郡山北町中川328
- **出典**:
  - `L2` なっぷ kanagawa/ashigara — https://www.nap-camp.com/kanagawa/ashigara/list
  - `L2` なっぷ kanagawa/ashigara — https://www.nap-camp.com/kanagawa/ashigara/list?page=2
  - `L2` じゃらん観光ガイド 山北町（cit_143640000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14364ca3430052681/
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/sasagozawa

### 6. 西丹沢中川ロッヂ

- **分類**: MISSING
- **confidence**: MID（層: L2 + L3）
- **住所**: 神奈川県足柄上郡山北町中川 / 神奈川県足柄上郡山北町中川897-111 / 足柄上郡山北町中川897-111
- **出典**:
  - `L2` じゃらん観光ガイド 山北町（cit_143640000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14364ca3430055180/
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/nishitanzawanakagawa
  - `L3` キャンナビ（japancamp.jp）神奈川県 — https://japancamp.jp/camp_area/14-kanagawa/
  - `L3` キャンナビ（japancamp.jp）神奈川県 — https://japancamp.jp/camp_area/14-kanagawa/page/2/
  - `L3` キャンナビ（japancamp.jp）神奈川県 — https://japancamp.jp/camp_area/14-kanagawa/page/3/

### 7. 白石オートキャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡山北町中川
- **出典**:
  - `L2` じゃらん観光ガイド 山北町（cit_143640000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14364ca3430133613/

### 8. 大滝キャンプ場

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡山北町中川879
- **同じ番地に別名**: 西丹沢 大滝キャンプ場（同一施設の別表記か、敷地内の別施設か。番地では寄せていない）
- **出典**:
  - `L2` じゃらん観光ガイド 山北町（cit_143640000 / ジャンル キャンプ・バンガロー・コテージ） — https://www.jalan.net/kankou/spt_14364ca3430052679/

### 9. SPRINGSVILLAGE足柄・丹沢温泉リゾート＆グランピング

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡山北町中川448-2
- **出典**:
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/tokinosumika-camp

### 10. 奥箒沢山の家

- **分類**: MISSING
- **confidence**: LOW（層: L2 + L3）
- **住所**: 神奈川県足柄上郡山北町中川874 / 足柄上郡山北町中川825-1
- **出典**:
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/okuhokisawa
  - `L3` キャンナビ（japancamp.jp）神奈川県 — https://japancamp.jp/camp_area/14-kanagawa/
  - `L3` キャンナビ（japancamp.jp）神奈川県 — https://japancamp.jp/camp_area/14-kanagawa/page/2/
  - `L3` キャンナビ（japancamp.jp）神奈川県 — https://japancamp.jp/camp_area/14-kanagawa/page/3/

### 11. 箒沢荘グランピングエリア杢

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡山北町中川698-1
- **出典**:
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/glumping_moku

### 12. KINOBA

- **分類**: MISSING
- **confidence**: LOW（層: L2）
- **住所**: 神奈川県足柄上郡山北町中川818
- **出典**:
  - `L2` hinata スポット 足柄（kanto/kanagawa/1909） — https://camp-spot.hinata.me/spots/kinoba

## L1 の網羅率（この市町村）

`priceVerified: true` かつ `needsVerify` なし＝**実在がほぼ確実なレコード**のうち、
その L1 に何件が載っているか。**ORPHAN を判定として使ってよいかの根拠。**

| L1 | 一覧の件数 | 実在確実 | うち掲載 | 網羅率 | 落ちている id |
|---|---|---|---|---|---|
| 山北町公式 キャンプ場の紹介 | 7 | 7 | 3 | 43% | ootaki, wellcamp-nishitanzawa, yamakita-camp, mitsumata-camp |
| 山北町観光協会 自然に泊まる | 9 | 7 | 4 | 57% | wellcamp-nishitanzawa, yamakita-camp, mitsumata-camp |

## ORPHAN — データにあるが、どのソースにも出てこない

**⚠ この地区の ORPHAN は判定に使えない。参考値として出しているだけ。**
網羅率 70% 以上の L1 が1つも無い。
一覧に載らない実在施設がある以上、「載っていない」ことに意味が無い。

**いずれにせよ、これを根拠に `status` を変えない（§6-7）。**

| id | 名前 | 住所 | status | needsVerify |
|---|---|---|---|---|
| `mitsumata-camp` | みつまたキャンプ場 | 神奈川県足柄上郡山北町中川896 | active |  |

## IN_DATA — 両方にある

| データ側 | ソース側の名前 | 一致の根拠 | confidence | 層 |
|---|---|---|---|---|
| `nishitanzawa-mountbridge` 西丹沢マウントブリッジキャンプ場 | マウントブリッジキャンプ場 | 名前 | HIGH | L1+L2+L3 |
| `ootaki` 西丹沢大滝キャンプ場 | 西丹沢 大滝キャンプ場 | 名前 | HIGH | L1+L2+L3 |
| `wellcamp-nishitanzawa` ウェルキャンプ西丹沢 | ウェルキャンプ西丹沢 | 名前 | MID | L2+L3 |

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
