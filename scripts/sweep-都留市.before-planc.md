# 地区スイープ: 都留市

> ⛔ **案C以降このファイルは再生成されない。**
> 2026-08-16 時点の**大字単位**の記録として残してある（案Cで地区は市町村単位＝18本になる）。
> **消さない理由**: §5 の突合で使ったばかりで鮮度行も入っており、
> **消すと案C前後の比較ができなくなる**（`scripts/baseline-before-planc-2026-08-16.md` と対で読む）。
> 案C後の地区 md は `sweep-<市町村>.md` の18本。**こちらの数字を現況として引用しないこと。**


> ## ⚠ この md の MISSING / ORPHAN を判定として読まないこと（2026-08-15 追記）
>
> **都留市には L1（自治体公式・観光協会）を登録していない。**
> `MUNI_SOURCES` の都留市エントリは**L2 だけ**（やまなし観光推進機構・なっぷ・じゃらん）で、
> L1 は探索した上で**意図的に登録しなかった**。
>
> | 探索した L1 候補 | 判断 |
> |---|---|
> | 都留市公式「自然体験・キャンプ」 `/shigai/kankojoho/7/index.html` | **網羅率 既知4件中2件＝50%。**`ORPHAN_TRUST_MIN = 0.7`（district-sweep.js:1779）未満 |
> | 都留市観光協会 会員一覧 `https://tsurukankou.jp/list/` | 会員名簿であり施設一覧ではない。非会員は原理的に載らない |
> | 旧観光協会「キャンプ・BBQ」 `tsuru-kankou.com/tsurub/?cat=16` | **ドメインごと死んでいる**（301先に該当ページ無し） |
>
> **したがって下の数字は参考値。**とくに:
>
> - **ORPHAN は判定に使えない**（L1 が無いので「載っていない」に意味が無い）
> - **MISSING も「入れるべき」の意味ではない**。L1 が無い分、L2/L3 だけを根拠にした
>   confidence LOW/MID が並ぶ
>
> 探索の全文と経路は **`scripts/sweep-tsuru-2026-08.md`**。
>
> ### 08-14 版との差分 — `shishidome-auto` を削除した
>
> | | 08-14 11:39 版 | **この版（08-15）** |
> |---|---|---|
> | データ側のこの地区のレコード | 3 | **2** |
> | IN_DATA | 3 | **2** |
> | MISSING | 8 | **9** |
>
> **`shishidome-auto`（鹿留オートキャンプ場）を 2026-08-15 に削除した**ため、
> IN_DATA から外れ、**同じ施設が MISSING 側（confidence MID）に移っている。**
>
> **★ MISSING に出ているからといって追加し直さないこと。**
> 削除理由（実在基準＝予約・料金が出るかを満たさない／公式ドメイン `deer1989.com` が
> DNS 解決せず／料金4説・営業期間3説・住所2説）と**削除直前の全文 JSON** は
> **`scripts/deleted-records-2026-08.md`** にある。**電話 080-2232-0722 は未実施**で、
> そこで予約と料金が取れたなら復元してよい。
>
> 08-14 11:39 版そのものは、退避してある:
> `C:\Users\admin\AppData\Local\Temp\claude\C--Users-admin\11b2489a-c407-465a-906e-4cb0e63fb92e\scratchpad\sweep-都留市.ORIG.md`
> （**ただしそれは `shishidome-auto` を IN_DATA として含む版**なので、現状の記録としては使わない）
>
> ### ⚠ この枠は手書きで、再生成すると消える
>
> `district-sweep.js` は md を**全文上書き**する（2809行 `fs.writeFileSync(outPath, md)`。
> `md-sections.js` は使っていない）。**`--district "都留市"` や `--all` を回すとこの枠は消える。**
> 消えても困らないよう、同じ内容は `sweep-tsuru-2026-08.md` 側にも書いてある。**再生成したら書き戻すこと。**


実行: 2026-08-15 11:59:58　/　`node scripts/district-sweep.js --district "都留市"`

**調査のみ。`data/campgrounds.json` は読むだけで書き換えていない。**
反映は人が中身を見てから別途行う。

データ: `data/campgrounds.json` 188件 / 最終更新 2026-08-15 20:27:38

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

## 出力に載らなかったソース側の項目

**判定には使っていない。**`MISSING` / `ORPHAN` / `IN_DATA` を作り終えたあとに数えているだけで、
この節が何件になっても上の判定は1件も動かない。

`classify()` は地区内のバケットしか見ない。**落選した分はこれまでどこにも残らなかった。**

| | 意味 | 件数 |
|---|---|---|
| **b1** | **住所が無い**（名前だけ）。他ソースとも合流できなかった。原因は2つ（下記で分割） | **10** |
| **b2** | 住所はあるが**地区外**。うち市区町村も違う 91 件 | **91** |
| b3 | 住所なしの項目が地区内バケットに**合流した**（＝漏れていない。参考） | 0 |

**b1 と b2 は分けてある。対処が正反対だから。**
b1 は**ソース側の仕様**（一覧に住所が無い）で、抽出器を直しても取れない。
b2 は**住所が誤っている**か**本当に地区外**かのどちらかで、切り分けが要る。

**⚠ b2 の大半は正常。**じゃらん等は市単位で取るが、地区は大字単位なので、
同じ市の別の大字は必ずここに落ちる。**疑うのは「市区町村ごと違う」ほうだけ。**

### ソース別の行方

| ソース | 取得 | 名前が空 | 地区内 | b1 住所なし | b2 地区外 | 突合 |
|---|---|---|---|---|---|---|
| やまなし観光推進機構 大月・都留エリアのキャンプ場 | 24 | 0 | 2 | 2 | 20 | OK |
| なっぷ yamanashi/otsuki_turushi | 20 | 0 | 0 | 14 | 6 | OK |
| じゃらん観光ガイド 都留市（cit_192040000 / ジャンル キャンプ・バンガロー・コテージ） | 6 | 0 | 6 | 0 | 0 | OK |
| キャンナビ（japancamp.jp）山梨県 | 608 | 0 | 40 | 8 | 560 | OK |
| ウォーカープラス 山梨県 | 10 | 0 | 1 | 0 | 9 | OK |

### b1 — 住所が無く、他ソースとも合流できなかった

**このソースにしか無い施設は、名前しか無いので地区が決まらず、単独では MISSING を立てられない。**
これまで「限界」節に文章で書いてあっただけで、実数が出るのは初めて。

**⚠ 原因が2つある。分けてある。** b1-1（ソース側の仕様）8 件 / b1-2（取得失敗）2 件。
**b1-1 は抽出器を直しても取れない。b1-2 は取得さえ通れば取れる。**

#### b1-1 — ソースが一覧に住所を持っていない（ソース側の仕様）

**抽出器の不具合ではない。**そのソースの一覧に住所という項目が存在しない。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| やぐら沢キャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| 水源の森 キャンプ·ランド | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| 原始村キャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| 猿橋リバーサイドベースキャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| 山の中の天然温泉 和みの里キャンプ場 | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| SNUG CAMP HOUSE | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| CAMP＆SAUNA 3set（キャンプ＆サウナ サンセット） | L2 nap-camp | 一覧に住所が無い | https://www.nap-camp.com/yamanashi/otsuki_turushi/list |
| モモンガの森 | L3 japancamp | 一覧に住所が無い | https://japancamp.jp/camp_area/19-yamanashi/ |

#### b1-2 — 詳細ページの取得に失敗して住所が取れなかった

**これは直せる可能性がある。**`fetchPage` は成功したものしかキャッシュしないので、
失敗した詳細ページは毎回取りに行って毎回失敗する。URL が生きているか確認すること。

| 名前 | 出典（層 / ソース） | 原因 | URL |
|---|---|---|---|
| 奥道志 オートキャンプ場 | L2 yamanashi-kankou-otsuki | **詳細ページの取得に失敗**（HTTP_404） | https://www.yamanashi-kankou.jp/kankou/spot/p2_3157.html |
| ホリディロッジ鹿留オートキャンプ | L2 yamanashi-kankou-otsuki | **詳細ページの取得に失敗**（HTTP_404） | https://www.yamanashi-kankou.jp/kankou/spot/p2_3135.html |

### b2-a — 住所の市区町村が、この地区の市区町村と違う

**ここだけが「住所が誤っている」疑いの対象。**ただし市単位のソースが
広域を含んでいるだけのこともある（じゃらんは市全体、キャンナビは県全体）。

| 名前 | 住所 | 出典（層 / ソース） |
|---|---|---|
| 道志渓谷キャンプ場 | 南都留郡道志村43 | L2 yamanashi-kankou-otsuki / L3 japancamp |
| 奥秋キャンプ場 | 北都留郡丹波山村1388 | L2 yamanashi-kankou-otsuki |
| 大栗オートキャンプ場 | 南都留郡道志村5334大栗 | L2 yamanashi-kankou-otsuki |
| 両国橋キャンプ場 | 南都留郡道志村49 | L2 yamanashi-kankou-otsuki |
| 月夜野キャンプ場 | 南都留郡道志村950 | L2 yamanashi-kankou-otsuki / L2 nap-camp |
| 下村キャンプ場 | 南都留郡道志村3067 | L2 yamanashi-kankou-otsuki |
| 椿荘オートキャンプ場 | 南都留郡道志村4150 | L2 yamanashi-kankou-otsuki |
| 椿キャンプ場 | 南都留郡道志村椿4229 | L2 yamanashi-kankou-otsuki |
| ネイチャーランドオム | 南都留郡道志村5964馬場 / 南都留郡道志村5964 | L2 yamanashi-kankou-otsuki / L3 japancamp |
| 観光農園キャンプ場 | 南都留郡道志村9240 | L2 yamanashi-kankou-otsuki |
| オートキャンプinむじな | 南都留郡道志村9707 | L2 yamanashi-kankou-otsuki / L3 japancamp |
| 花の森 オートキャンピア | 南都留郡道志村9709-1 | L2 yamanashi-kankou-otsuki / L3 japancamp |
| 道志の森キャンプ場 | 南都留郡道志村10701 / 山梨県南都留郡道志村 | L2 yamanashi-kankou-otsuki / L3 walkerplus |
| センタービレッジキャンプ場 | 南都留郡道志村12311 | L2 yamanashi-kankou-otsuki / L3 japancamp |
| オートキャンプ 長又 | 南都留郡道志村長又12408 / 南都留郡道志村長又 | L2 yamanashi-kankou-otsuki / L3 japancamp |
| 山伏 オートキャンプ場 | 南都留郡道志村12753-3 | L2 yamanashi-kankou-otsuki |
| 谷相郷キャンプ場 | 南都留郡道志村谷相7910 | L2 yamanashi-kankou-otsuki / L3 japancamp |
| 川端オートキャンプ場 | 南都留郡道志村3074 | L2 yamanashi-kankou-otsuki |
| オートキャンプしろいだいら | 南都留郡道志村11674 | L2 yamanashi-kankou-otsuki |
| とやの沢 オートキャンプ場 | 南都留郡道志村12433長又 | L2 yamanashi-kankou-otsuki |
| ほうれん坊の森キャンプ場 | 北都留郡小菅村東部2402-2 | L2 nap-camp / L3 japancamp |
| 平山キャンプ場 | 北都留郡小菅村3974 | L2 nap-camp / L3 japancamp |
| ウエストリバーオートキャンプ場 | 南アルプス市須沢131 | L3 japancamp |
| 御坂路さくら公園オートキャンプ場 | 笛吹市御坂町上黒駒5421 | L3 japancamp |
| 富士満願ビレッジファミリーキャンプ場 | 南都留郡鳴沢村5163-1 | L3 japancamp |
| 昇仙峡オートキャンプ場 | 甲府市平瀬町3157 | L3 japancamp |
| 篠沢大滝キャンプ場 | 北杜市白州町大坊1181 | L3 japancamp |
| Foresters Village Kobitto | 北杜市武川町柳澤3802 | L3 japancamp |
| 黒坂オートキャンプ場 | 笛吹市境川町大黒坂1070 | L3 japancamp |
| 芦川オートキャンプ場 | 笛吹市芦川町中芦川入沢1393番地 | L3 japancamp |
| 大武川河川公園フレンドパークむかわ | 北杜市武川町柳澤3506-1 | L3 japancamp |
| ACNオートリゾートパークビッグランド | 北杜市白州町大坊1131 | L3 japancamp |
| 清里丘の公園オートキャンプ場 | 北杜市高根町清里3545-5 | L3 japancamp |
| 清里中央オートキャンプ場 | 北杜市高根町浅川水頭152番地1 | L3 japancamp |
| PICA富士西湖 | 南都留郡富士河口湖町西湖2068-1 | L3 japancamp |
| 山梨MTBベースオートキャンプ場 | 甲府市下曽根町996-1 | L3 japancamp |
| キャンピングリゾートＷＡＮ | 南都留郡富士河口湖町西湖1006 | L3 japancamp |
| 芦安キャンプサイトNo2 | 南アルプス市芦安芦倉1551-1 | L3 japancamp |
| AIRSTREAM RESORT®︎ HAKUSHU BASE | 山梨県北杜市白州町白須8292-3 | L3 japancamp |
| 大自然に抱かれたキャンプ場ウッドペッカー | 北杜市須玉町上津金2449-5 | L3 japancamp |
| みさきキャンプ場 | 南都留郡山中湖村平野2431-2 | L3 japancamp |
| 湖山荘キャンプ場 | 南都留郡山中湖村平野508 | L3 japancamp |
| 玉川キャンプ村 | 北都留郡小菅村2202 | L3 japancamp |
| 山伏オートキャンプ場 | 南都留郡道志村山伏峠 | L3 japancamp |
| 椿荘オートキャンプ場 | 南都留郡道志村大椿4219 | L3 japancamp |
| 小田急山中湖フォレストコテージ | 南都留郡山中湖村平野切詰491 | L3 japancamp |
| 福士川オートキャンプ場 | 南巨摩郡南部町福士19867 | L3 japancamp |
| オートキャンプしろいだいら | 南都留郡道志村白井平 | L3 japancamp |
| ラビットオートキャンプ場 | 南都留郡道志村下善之木10179 | L3 japancamp |
| 笛吹小屋キャンプ場 | 山梨市三富川浦1820 | L3 japancamp |
| PICA 八ヶ岳明野 | 北杜市明野町浅尾5260-5 | L3 japancamp |
| 大人のキャンプ場 | 北杜市須玉町江草字西沢原18004番地 | L3 japancamp |
| 根熊山荘フェミリーオートキャンプ場 | 南巨摩郡南部町福士15854 | L3 japancamp |
| 【閉鎖中】ＳＫ落合キャンプ場 | 甲州市塩山一之瀬高橋4783 | L3 japancamp |
| 一の瀬高原キャンプ場 | 甲州市塩山一之瀬高橋560 | L3 japancamp |
| オートキャンプすずらん | 笛吹市芦川町上芦川1808 | L3 japancamp |
| みずがき山グリーンロッジ | 北杜市須玉町小尾8861 | L3 japancamp |
| 清里ブレーメンリゾートクラブ | 北杜市高根町清里3545 | L3 japancamp |
| 浩庵キャンプ場 | 南巨摩郡身延町中ノ倉2926 | L3 japancamp |
| 滝原オートキャンプ場 | 南都留郡道志村川原畑 | L3 japancamp |
| 水之元オートキャンプ場 | 南都留郡道志村10220 | L3 japancamp |
| オートキャンプせせらぎ | 南都留郡道志村善之木10202 | L3 japancamp |
| ウッドランド武川キャンプ場 | 北杜市武川町柳沢 | L3 japancamp |
| 南清里レジャーセンター | 北杜市須玉町若神子下和田5048 | L3 japancamp |
| 河口湖オートキャンプ場 | 南都留郡富士河口湖町小立5404 | L3 japancamp |
| 創造の森オートキャンプ場 | 南都留郡富士河口湖町船津6603 | L3 japancamp |
| 本栖湖キャンプ場 | 南都留郡富士河口湖町本栖218 | L3 japancamp |
| 道志の森キャンプ場 | 南都留郡道志村三ヶ瀬10041 | L3 japancamp |
| 森の隠れ家ビッグホーンオートキャンプ場 | 甲斐市上芦沢1159 | L3 japancamp |
| ノースランドキャンパーズビレッジ | 甲斐市上芦沢1352 | L3 japancamp |
| 本栖レークサイドキャンプ場 | 南都留郡富士河口湖町本栖 | L3 japancamp |
| 西湖自由キャンプ場 | 南都留郡富士河口湖町西湖1003-2 | L3 japancamp |
| ハーブの里オートキャンプ場 | 南都留郡富士河口湖町河口534 | L3 japancamp |
| 南アルプス三景園オートキャンプ場 | 北杜市武川町柳沢3601-1 | L3 japancamp |
| オートキャンプ牧場チロル | 北杜市武川町柳沢3274-14 | L3 japancamp |
| 山中湖オートキャンプ場 | 南都留郡山中湖村梨が原1212-52 | L3 japancamp |
| べるが尾白の森キャンプ場 | 北杜市白州町白須8093 | L3 japancamp |
| ニューブリッヂキャンプ場 | 南都留郡富士河口湖町小立島原1200 | L3 japancamp |
| ＰｌＣＡ富士吉田 | 富士吉田市上吉田4959-4 | L3 japancamp |
| スカイバレーキャンプ場 | 南都留郡道志村白井平11754-1 | L3 japancamp |
| 西の海オートキャンプ場 | 南都留郡富士河口湖町西湖2403 | L3 japancamp |
| みずがき山森の農園キャンプ場 | 北杜市須玉町小尾字松平8862-1 | L3 japancamp |
| 西湖キャンプ・ビレッジノーム | 南都留郡富士河口湖町西湖1030 | L3 japancamp |
| フレンドパークむかわ キャンプ場 | 山梨県北杜市 | L3 walkerplus |
| 平野田休養村キャンプ場 | 山梨県上野原市 | L3 walkerplus |
| 大自然に抱かれたキャンプ場ウッドペッカー | 山梨県北杜市 | L3 walkerplus |
| 精進湖キャンピングコテージ | 山梨県南都留郡富士河口湖町 | L3 walkerplus |
| ノースランドキャンパーズビレッジ | 山梨県甲斐市 | L3 walkerplus |
| BUB RESORT Yatsugatake (バブ リゾート 八ヶ岳) | 山梨県北杜市 | L3 walkerplus |
| 大人のキャンプ場 | 山梨県北杜市 | L3 walkerplus |
| LScamp山中湖 | 山梨県南都留郡山中湖村 | L3 walkerplus |

### b2-b — 市区町村は同じだが、大字が違う

**大半は正常。**市単位で取ったソースを大字単位の地区に当てれば必ず出る。

なし。**0件が「本当に0件」か「数え方が壊れている」かは、
意図的に壊して非ゼロが出ることを確認してから信じること**（§18-3）。

### b3 — 住所なしの項目が合流したもの（漏れていない）

なし。

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
