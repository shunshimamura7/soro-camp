# かぶと虫の森キャンプ場 調査（2026-08-12）

`verify-coords-gsi.js` が唯一の PREF_MISMATCH として出したレコードの追調査。
**data/campgrounds.json は書き換えていない。** 承認待ち。

きっかけは「Google マップ上の『カブトムシの森』が 神奈川県足柄上郡山北町中川870
（35.482954 / 139.064896）にあり、現在の座標と約20km離れている」という指摘。

---

## 1. 該当レコードの全フィールド

```json
{
  "id": "kabutomushi-mori-camp",
  "slug": "kabutomushi-mori-camp",
  "name": "かぶと虫の森キャンプ場",
  "prefecture": "神奈川",
  "area": "相模原",
  "status": "unverified",
  "address": "神奈川県相模原市緑区牧野4015",
  "lat": 35.6197,
  "lng": 139.2548,
  "coordsVerified": true,
  "priceMin": 3000,
  "priceMax": 6000,
  "priceNote": "大人1,500円+サイト1,500円〜",
  "scores": { "quietness": 4, "scenery": 3, "value": 3, "access": 4, "facility": 4 },
  "features": {
    "bonfire": true, "bonfireNote": "焚き火台使用", "pet": true, "shower": true,
    "bath": false, "toilet": "洋式", "carIn": true, "soloPlan": false,
    "reservation": "要", "convenience": false, "shop": false, "wifi": false,
    "firewood": false, "ice": false, "alcohol": false,
    "garbage": "", "nearbySupermarket": "", "nearbyShop": ""
  },
  "season": "4月〜11月",
  "soloComment": "",
  "lastVerified": "2026-08-11",
  "priceVerified": true,
  "needsVerify": true,
  "needsVerifyNote": "（下記参照）"
}
```

存在しないフィールド: `officialUrl` / `tel` / `cautions` / `coordsGsiChecked` / `closedDays`。
**`tel` と `officialUrl` がそもそも無い**ので、一次連絡先が1つも押さえられていない。

`needsVerifyNote` の全文:

> 2026-08-07 調査。相模原市観光協会のキャンプ場一覧13件に該当名なし https://www.e-sagamihara.com/camp/ 。同名の「カブト虫の森」は和歌山県日高川町の施設で閉館済み。座標は八王子市南浅川町を指し、address（相模原市緑区牧野4015）と9.8km離れている。2026-08-07 追調査: データの住所（牧野4015）は牧野地区の実在施設（亀見橋バカンス村12822・藤野芸術の家4819）のどれとも一致せず、借用元が特定できない 2026-08-11 判断: district-sweep.js で相模原市の全 L1・L2・L3 に一致せず（ORPHAN） https://www.e-sagamihara.com/camp/ ／ https://midori.city.sagamihara.kanagawa.jp/category/play/camp/ 。相模原市は L1 網羅率80%で、ORPHAN を判定として読める2市町村の1つ（もう1つは道志村75%。scripts/sweep-l1-coverage-2026-08.md）。番地はどこの実在施設のものでもない（捏造型・§6-16）。**ただし ORPHAN の誤検出率は17%あるため、削除ではなく unverified とした。実在が確認できたら active に戻すこと。**地区の突き合わせは scripts/sweep-相模原市緑区牧野.md

### 内部矛盾

- `coordsVerified: true` が立っているのに、座標は県外（東京都八王子市）を指す。この `true` は誤り。
- `priceVerified: true` が立っているが、`tel` も `officialUrl` も無く、裏を取れる一次情報の記録がない。
- `status: unverified` と `needsVerify: true` は既に立っている。**この調査で初めて疑わしくなったレコードではない。**

---

## 2. lastVerified と投入回

| 項目 | 値 |
|---|---|
| `lastVerified` | **2026-08-11** |
| 同じ `lastVerified` の他レコード | **81件** |

`lastVerified` の全分布（184件）:

| lastVerified | 件数 |
|---|---|
| (なし) | 1 |
| 2026-05-27 | 1 |
| 2026-08-06 | 3 |
| 2026-08-07 | 94 |
| 2026-08-10 | 4 |
| 2026-08-11 | 81 |

**`lastVerified` だけ見ると5月の不良投入回には属さない。** ただしこれは8月の再点検で押し直された日付で、
レコードそのものの出自ではない。git で追うと出自は5月に出る:

```
$ git log -S 'kabutomushi-mori-camp' -- data/campgrounds.json
fb9bddc 2026-05-27 feat: reach 100 campgrounds + remove bonfire filter + mobile UI improvements
```

**投入は 2026-05-27 のコミット fb9bddc、「100件到達」の水増し回。**
5月の不良投入回（2026-05-26 / 2026-05-27）に属すると見てよい。
`lastVerified: 2026-08-11` は「8月に疑わしいと確認した日」であって「実在を確認した日」ではない。

---

## 3. address と lat/lng が指す場所（GSI）

### 逆ジオコーディング

| 対象 | 座標 | GSI の返り | 標高 |
|---|---|---|---|
| データの現座標 | 35.6197, 139.2548 | **東京都 八王子市 南浅川町** | 253.9m |
| Google ピン（中川870） | 35.482954, 139.064896 | **神奈川県 山北町 中川** | 588.3m |

現座標は県すら違う（データは神奈川、GSI は東京都）。これが PREF_MISMATCH の中身。

### 住所検索（GSI AddressSearch）

| クエリ | ヒット | 座標 |
|---|---|---|
| 神奈川県相模原市緑区牧野4015 | 神奈川県相模原市緑区**牧野**（大字止まり） | 35.571507, 139.164047 |
| 神奈川県足柄上郡山北町中川870 | 神奈川県山北町**中川**（大字止まり） | 35.438549, 139.045639 |
| 神奈川県足柄上郡山北町中川867-7 | 神奈川県山北町**中川**（大字止まり） | 35.438549, 139.045639 |

**GSI は3件とも番地を解決せず大字の代表点しか返さない。**870 と 867-7 が同じ座標を返すのはそのため。
つまり GSI では「中川870 が実在の番地か」も「そこに何があるか」も判定できない。大字レベルで
「Google ピンは確かに山北町中川の中にある」ことしか言えない。

address（牧野）と現座標（八王子市南浅川町）は**別の市どころか別の都県**を指しており、両者は整合しない。

---

## 4. 近接・重複チェック

Google ピン（35.482954, 139.064896）からの距離:

| 距離 | slug | 名称 | address | 保存座標 | tel | officialUrl |
|---|---|---|---|---|---|---|
| **0.17km** | `shiraishi-auto-camp` | 白石オートキャンプ場 | 中川**字相馬沢870-3** | 35.484174, 139.063771 | (なし) | shiraishiautocamp.com |
| 1.21km | `wellcamp-nishitanzawa` | ウェルキャンプ西丹沢 | 中川**868** | 35.4721, 139.0644 | 0465-78-3181 | well-camp.com |
| 3.37km | `nishitanzawa-ootaki` | 西丹沢大滝キャンプ場 | 中川879-4 | 35.4543931, 139.0523013 | 0465-78-3422 | ootakicampsite.com |
| 4.39km | `suigennnomori` | 水源の森 キャンプ・ランド | – | 35.512, 139.032 | – | – |
| 4.56km | `doshi-mori-cottage` | 道志森のコテージ | – | 35.5068893, 139.0239734 | – | – |
| 5.54km | `nishitanzawa-nakagawa-lodge` | 西丹沢中川ロッヂ | 中川字小塚897-111 | 35.435518, 139.0462467 | 0465-78-3780 | (なし) |
| 13.07km | `nishitanzawa-mountbridge` | 西丹沢マウントブリッジ | 中川**867-7** | 35.423, 138.9408 | 0465-78-3378 | mount-bridge.com |

**最大の発見: Google ピンの「中川870」は、既存レコード `shiraishi-auto-camp`
（白石オートキャンプ場 / 中川字相馬沢870-3）の番地とほぼ同一で、距離は170m。**
白石オートの住所は yamakita.net の施設ページで裏が取れている（下記5-2）。
中川870 番地の土地は白石オートキャンプ場の区画と見てよい。

現座標（八王子側）3km 以内には自分以外のレコードは1件も無い。孤立している。

`tel` / `officialUrl` の重複: 対象レコードは**両方とも未設定**なので、突き合わせ自体が成立しない。
重複の判定材料として使えるのは座標と住所だけ。

### 副次的な発見（今回の対象外・別途要確認）

依頼文では「隣地の中川867-7 は西丹沢マウントブリッジ」とあるが、**データ上の
マウントブリッジの保存座標（35.423, 138.9408）はピンから13.07km離れている。**
逆ジオでは「神奈川県 山北町（大字なし・`lv01Nm` が `−`）」＝山中の大字未設定域を指す。
番地（867-7）が正しいなら 868 のウェルキャンプの隣のはずで、13km も離れるのはおかしい。
同様に `mitsumata-camp`（中川896）と `kuragari-camp`（玄倉490-2）も `lv01Nm` が `−` を返す。
**マウントブリッジ・みつまた・丹沢湖キャンプサイトの3件は座標が疑わしい。** 本件とは別問題として
`verify-address-gsi.js` の OAZA_MISS 候補に入れて追うべき。

---

## 5. Web 一次情報

判定基準は「名前がヒットするか」ではなく「**予約・料金が出てくるか**」。

### 5-1. 山北町公式のキャンプ場一覧

https://www.town.yamakita.kanagawa.jp/0000000232.html

掲載13件: バウアーハウスジャパン(0465-78-3959) / マウントブリッジキャンプ場(0465-78-3378) /
大石キャンプ場(0465-78-3138) / 西丹沢コテージキャンプ場(0465-78-3559) / 大滝キャンプ場(0465-78-3146) /
笹子沢バンガロー(0465-78-3427) / 西丹沢中川ロッヂ(0465-78-3780) / 丹沢湖キャンプサイト(0465-78-3248) /
丹沢湖ロッヂ(0465-78-3156) / 黒倉森の家(0465-78-3388) / 世附川ロッジ(0465-78-3636) /
ひだまりの里(0465-77-2777) / 河内川ふれあいビレッジ(0465-77-2299・休業中)

**「かぶと虫の森」「カブトムシの森」は無い。**

ただしこの13件には**白石オートキャンプ場もウェルキャンプ西丹沢も入っていない**。
どちらも実在して営業している。**この一覧は網羅的ではないので、
「載っていない＝存在しない」の根拠には使えない。**

### 5-2. 山北町観光協会（yamakita.net）

https://www.yamakita.net/stay/detail.php?id=6&type=2

白石オートキャンプ場のページ。

- 正式名: 白石オートキャンプ場（しらいしおーときゃんぷじょう）
- 住所: 〒258-0201 **神奈川県足柄上郡山北町中川字相馬沢870-3**
- 電話: 受付 0465-81-2236 / 現地 0465-78-3017
- 料金: 宿泊 1台6,000円（4名まで） / 日帰り 1台3,000円（4名まで）
- **別名・愛称の記載なし。カブトムシ／かぶと虫への言及なし。**

→ 中川870 番地の施設は白石オートキャンプ場であり、**「カブトムシの森」という別名では呼ばれていない。**

### 5-3. 予約サイト

- **なっぷ 神奈川県一覧（106件）** https://www.nap-camp.com/kanagawa/list
  → 名称に「カブトムシ」「かぶと虫」を含む施設は**0件**。足柄上郡・山北町にも該当なし。
- **なっぷ 全国検索**
  → 「かぶと」で当たるのは かぶと山公園キャンプ場（京都府京丹後市） https://www.nap-camp.com/kyoto/10581 と
  かぶとの森テラス（三重県） https://www.nap-camp.com/mie/14019 のみ。**神奈川に該当施設なし。**
- **じゃらん 山北町のキャンプ・バンガロー・コテージ** https://www.jalan.net/kankou/cit_143640000/g2_04/
  → 該当名なし。（※このページは自動抽出で施設名が崩れたため、判定材料としては弱く見ている）

**料金ページ・予約枠・空室カレンダーが出てくる経路は1つも見つからなかった。**
これが本調査の中核。実在確認の基準（予約・料金）を満たさない。

### 5-4. Google の 中川870 ピンは何か

「カブトムシの森」を名乗る施設の一次情報はどの経路でも出てこない。一方で:

- **ウェルキャンプ西丹沢（中川868・ピンから1.21km）の B ゾーンが
  『カブトムシ、ミヤマクワガタの生息ゾーン』として宣伝されている。**
  https://well-camp.com/ ／ 紹介記事 https://note.com/tmlaboratory/n/n29cd08f0865f
  ただし公式サイトに「カブトムシの森」という**ゾーン名は存在しない**（「森で宝物を見つけよう カブトムシ」という
  アクティビティ紹介の見出しがあるだけ）。
- 白石オートキャンプ場の公式サイト https://www.shiraishiautocamp.com/ にも
  カブトムシ関連の記述・エリア名は**無い**。

→ 中川870 のピンは、**営業しているキャンプ場「カブトムシの森」ではない**と考えるのが妥当。
土地としては白石オートキャンプ場の区画（870-3）にあたり、名称は
周辺（特にウェルキャンプ西丹沢Bゾーン）のカブトムシ採集スポットとしての評判に由来する
**ユーザー投稿型の Google POI** の可能性が高い。ただしピンの登録元を直接確認したわけではないので、
これは断定ではなく最も整合する説明にとどまる。

### 5-5. 同名施設

和歌山県日高川町の「カブト虫の森」は**閉館済み**。
https://www.tripadvisor.jp/Attraction_Review-g1121350-d1385153-Reviews-Rhinoceros_Beetle_Forest-Hidakagawa_cho_Hidaka_gun_Wakayama_Prefecture_Kinki.html
（`needsVerifyNote` の既述と一致。神奈川とは無関係。）

---

## 6. 所見

**分類: 「unverified 落ち」（＝現状維持）。座標修正案件ではない。**

理由:

1. **座標修正で済む話ではない。** 座標を中川870 に動かすと、address（相模原市緑区牧野4015）・
   `area`（相模原）と 20km 単位で矛盾する。座標だけ直しても整合しない。
2. **住所も誤り、とも言い切れない。** 「正しい住所は中川870」と言うには、そこに
   「カブトムシの森」という施設が実在する裏付けが要る。**予約・料金の出る経路が1つも無く、
   基準を満たさない。** 山北町公式一覧に無いことは（白石・ウェルキャンプも漏れているので）
   根拠にしていない。根拠は「なっぷ神奈川106件・じゃらん・観光協会のどこにも
   料金/予約が存在しない」ことと「中川870 の番地が別の実在施設のものである」こと。
3. **中川870 に寄せると既存レコードとの重複になる。** ピンから 170m の
   `shiraishi-auto-camp`（中川字相馬沢870-3）と実質同一地点。番地も 870 系で一致する。
   このレコードを中川870 に移動させる＝白石オートの二重登録。
4. よって **`status: unverified` / `needsVerify: true` のまま据え置きが妥当。**
   今回の調査は 2026-08-11 の判断（捏造型・§6-16 / ORPHAN だが誤検出率17%を考慮して削除せず unverified）を
   **覆さず、補強した**。山北町側にも実体が無いことが分かったので、「別の場所に実在するのでは」という
   最後の逃げ道が1つ潰れた形。

### 承認をもらえれば直したい点（今回は触っていない）

- **`coordsVerified: true` → `false`**（もしくは削除）。座標は東京都八王子市を指しており、
  この `true` は明確に誤り。PREF_MISMATCH を出し続ける原因でもある。
- **`priceVerified: true` → `false`**（もしくは削除）。`tel` も `officialUrl` も無く、
  料金の裏付け元が記録されていない。
- `needsVerifyNote` に本調査の結果（山北町中川870 の線も潰れたこと・中川870 は白石オートの番地）を追記。
- 座標そのものは、実在が確認できていない以上、動かす先が無い。**現状維持か 0,0 化かは要判断**
  （0,0 は他3件の前例に倣う形になるが、`verify-coords-gsi.js` では SEA として出る）。

### 別件として起票したい点

`nishitanzawa-mountbridge` / `mitsumata-camp` / `kuragari-camp` の3件は保存座標が
大字未設定域（`lv01Nm` = `−`）を指しており、address の番地と整合しない疑いが強い。
特にマウントブリッジは中川867-7 のはずが 868 のウェルキャンプから13km離れている。要 OAZA_MISS 追跡。

---

## 出典一覧

- 山北町 キャンプ場の紹介 https://www.town.yamakita.kanagawa.jp/0000000232.html
- 山北町観光協会 白石オートキャンプ場 https://www.yamakita.net/stay/detail.php?id=6&type=2
- 白石オートキャンプ場 公式 https://www.shiraishiautocamp.com/
- ウェルキャンプ西丹沢 公式 https://well-camp.com/
- ウェルキャンプ西丹沢 Bゾーンのカブトムシ記事 https://note.com/tmlaboratory/n/n29cd08f0865f
- なっぷ 神奈川県のキャンプ場一覧 https://www.nap-camp.com/kanagawa/list
- なっぷ かぶと山公園キャンプ場（京都・別施設） https://www.nap-camp.com/kyoto/10581
- なっぷ かぶとの森テラス（三重・別施設） https://www.nap-camp.com/mie/14019
- じゃらん 山北町のキャンプ・バンガロー・コテージ https://www.jalan.net/kankou/cit_143640000/g2_04/
- TripAdvisor カブト虫の森（和歌山・閉館） https://www.tripadvisor.jp/Attraction_Review-g1121350-d1385153-Reviews-Rhinoceros_Beetle_Forest-Hidakagawa_cho_Hidaka_gun_Wakayama_Prefecture_Kinki.html
- 相模原市観光協会 キャンプ場一覧（既述の出典） https://www.e-sagamihara.com/camp/
- 相模原市緑区 キャンプ場（既述の出典） https://midori.city.sagamihara.kanagawa.jp/category/play/camp/
- GSI 逆ジオコーディング https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress
- GSI 住所検索 https://msearch.gsi.go.jp/address-search/AddressSearch
