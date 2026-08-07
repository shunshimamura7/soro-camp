# 座標 0,0 の19件 実在確認・座標特定レポート

- 対象: `scripts/coord-report.json` のうち `lat === 0 && lng === 0` の19件
- 調査日: 2026-08-07
- **このレポートは検出と記録のみ。`data/campgrounds.json` は一切書き換えていない。**

## 座標の取得方針

記載した座標は、すべて **GoogleマップのURLに書かれていた値そのまま**である。内訳は次の3形式のみ。

- `/maps/place/…!3d{緯度}!4d{経度}`（ピンの座標）
- `maps.google.com/maps?q={緯度},{経度}`（ピンの座標）
- 短縮URL `goo.gl/maps/…` を解決して得た `/maps/place/` のピン座標

ブログのGoogleマップ埋め込みに含まれる「地図中心」の値（`!2d{経度}!3d{緯度}`）は**採用していない**。
情報カードの表示分だけ経度が約 0.0022°（≈200m）西にずれることを、正解の分かっている地点で確認したため。

| 地点 | 埋め込みの中心（経度） | 実ピン（経度） | 差 |
|---|---|---|---|
| 高田橋多目的広場 | 139.33040 | 139.33259 | +0.00219 |
| 上大島キャンプ場 | 139.30781 | 139.31000 | +0.00219 |
| 不動の滝自然広場 | 138.10097 | 138.10316 | +0.00219 |

補正すれば数値は作れるが、それは推測になるため行っていない。

全件、取得した座標を**国土地理院の逆ジオコーディングにかけ直し**、返ってきた市区町村がデータの住所と一致することを確認済み（下表の「GSI照合」）。

---

## CONFIRMED（16件）

### 大室山キャンプ場（伊東市営）
- slug: `omuroyama-camp`
- データ上の名前 / 正式名称: 大室山キャンプ場（伊東市営） / **伊東市青少年キャンプ場**
- 所在地: 静岡県伊東市池字柏戸676-1
- 座標: 34.9075265, 139.0883787
- GSI照合: 静岡県 伊東市 **池** / 標高 352.8m
- ソース: https://camplog.jp/article/camp/tW ／ https://campoo.jp/shizuoka/22003/ ／ https://www.city.ito.shizuoka.jp/gyosei/soshikikarasagasu/shogaigakushuka/kanko/2379.html
- 備考: 予約必要・使用料無料。受付は伊東市民体育センター事務室（0557-36-1178、使用月の2〜3か月前の1日から先着）、問い合わせは伊東市振興公社（0557-37-7135）。**データの住所「伊東市富戸」は誤り**（GSIも「池」を返す）。

### 小倉橋河川敷
- slug: `ogurabashi-kasenjiki`
- データ上の名前 / 正式名称: 小倉橋河川敷 / Googleマップ上の地点名は「小倉橋下の河川敷」
- 所在地: 〒252-0115 神奈川県相模原市緑区小倉
- 座標: 35.5867121, 139.2984116
- GSI照合: 神奈川県 相模原市緑区 小倉 / 標高 69.4m
- ソース: https://camp-quests.com/74773/
- 備考: キャンプ場ではなく河川敷の自由使用。無料。直火は不可で焚火台が必要。水洗トイレあり、炊事場なし。

### 高田橋河川敷
- slug: `takadabashi-kasenjiki`
- データ上の名前 / 正式名称: 高田橋河川敷 / **高田橋多目的広場**
- 所在地: 〒252-0244 神奈川県相模原市中央区水郷田名4-11-23
- 座標: 35.5415695, 139.3325907
- GSI照合: 神奈川県 相模原市中央区 田名 / 標高 48.3m
- ソース: https://camp-quests.com/77469/ ／ https://flamin-ko.com/takada-bridge/
- 備考: 約15万㎡の河川敷。無料・予約不要、車の乗り入れ可。5月の「泳げ鯉のぼり相模川」、8月の花火大会の期間は使用不可。

### 西里キャンプ適地
- slug: `nishizato-camp-tekichi`
- データ上の名前 / 正式名称: 西里キャンプ適地（一致）
- 所在地: 〒424-0413 静岡県静岡市清水区西里
- 座標: 35.1249393, 138.4407838
- GSI照合: 静岡県 静岡市清水区 西里 / 標高 128.6m
- ソース: https://note.com/interpreter_rex/n/ndaf4c3931d5c
- 備考: 無料・予約不要。水洗トイレと水場あり、直火禁止。駐車場約30台。データの soloComment は「標高140m」だがGSI実測は128.6m。

### 沼津市民の森
- slug: `numazu-shimin-no-mori`
- データ上の名前 / 正式名称: 沼津市民の森 / **市民の森**（沼津市の施設名）
- 所在地: 〒410-0232 静岡県沼津市西浦河内字堂山506
- 座標: 34.985472, 138.848321
- GSI照合: 静岡県 沼津市 西浦河内 / 標高 447.4m
- ソース: https://goo.gl/maps/Bq9xs62yUnd4BySq9 （→ `/maps/place/市民の森/@34.985472,138.848321`）／ https://www.city.numazu.shizuoka.jp/kurashi/shisetsu/shiminnomori/
- 備考: 金冠山北側斜面、48ha。持込テント30区画。予約は3日前までに市民の森管理事務所（055-942-3103）または沼津市公共施設予約システム。園内の水は飲用不適。

### 上大島キャンプ場
- slug: `kamioshima-camp`
- データ上の名前 / 正式名称: 上大島キャンプ場（一致、市営）
- 所在地: 〒252-0135 神奈川県相模原市緑区大島3657付近
- 座標: 35.5749618, 139.3100068
- GSI照合: 神奈川県 相模原市緑区 大島 / 標高 67.7m
- ソース: https://www.kanagawa-kankou.or.jp/spot/7222 ／ https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html
- 備考: 開設 3月1日〜11月30日（冬季閉鎖）。**無料ではない**（下記「データ修正候補」参照）。予約は042-760-6066、開設期間の9:00〜17:00。

### 宇久須キャンプ場
- slug: `ugusu-camp`
- データ上の名前 / 正式名称: 宇久須キャンプ場（一致）
- 所在地: 静岡県賀茂郡西伊豆町宇久須2102-13（西伊豆町公式の表記は「西伊豆町宇久須深田」）
- 座標: 34.854567, 138.776602
- GSI照合: 静岡県 西伊豆町 宇久須 / 標高 7.6m
- ソース: https://camp.garvyplus.jp/campsite/280034/ ／ https://www.nishiizu-kankou.com/stay/ugusucanp
- 備考: テントサイト1泊2,200円〜（時期・曜日で変動）＋駐車1台1,000円。データの `priceMin: 2200` / `priceMax: 5500` / priceNote は公式と整合しており**誤りではない**。営業期間は出典間で不一致（下記参照）。

### 池の谷ファミリーキャンプ場
- slug: `ikenoya-family`
- データ上の名前 / 正式名称: 池の谷ファミリーキャンプ場（一致）
- 所在地: 静岡県榛原郡川根本町千頭528-5地先
- 座標: 35.1404131, 138.127922
- GSI照合: 静岡県 川根本町 **千頭** / 標高 342.2m
- ソース: https://camplog.jp/article/camp/Nt ／ https://campoo.jp/shizuoka/22131/（35.14060768, 138.12791609 ≒ 約21m差で一致）
- 備考: 町営。管理は川根本町まちづくり観光協会（0547-59-2746）、利用月の2か月前の1日からWEB予約。

### くのわき親水公園キャンプ場
- slug: `kunowaki-shinsui`
- データ上の名前 / 正式名称: くのわき親水公園キャンプ場（一致）
- 所在地: 静岡県榛原郡川根本町久野脇280
- 座標: 34.9961229, 138.0870294
- GSI照合: 静岡県 川根本町 **久野脇** / 標高 194.2m
- ソース: https://camplog.jp/article/camp/5W ／ https://www.kunowaki.net/
- 備考: 公式サイト稼働中。管理はくのわき親水公園管理運営組合（0547-56-1781）、利用日の2か月前から受付。

### 八木キャンプ場
- slug: `yagi-camp`
- データ上の名前 / 正式名称: 八木キャンプ場（一致）
- 所在地: 静岡県榛原郡川根本町奥泉761-2地先
- 座標: 35.1328862, 138.155653
- GSI照合: 静岡県 川根本町 **奥泉** / 標高 349.1m
- ソース: https://camplog.jp/article/camp/Z ／ https://campoo.jp/shizuoka/22110/（35.133013, 138.155666 ≒ 約14m差で一致）／ https://okuooi.gr.jp/contact_camp_yagi/index.php
- 備考: 予約は「なっぷ」オンラインのみ、電話予約なし。3か月前の月の1日から受付。データの season「3月15日〜11月30日」は観光協会の記載と一致。

### 三ツ星オートキャンプ場
- slug: `mitsuboshi-auto`
- データ上の名前 / 正式名称: 三ツ星オートキャンプ場（一致）
- 所在地: 静岡県榛原郡川根本町上長尾1143
- 座標: 35.0475748, 138.0771144
- GSI照合: 静岡県 川根本町 **上長尾** / 標高 235.0m
- ソース: https://camplog.jp/article/camp/XP ／ http://kawanelife.org/camp/
- 備考: 運営はかわね来風。公式ページのタイトルも「三ツ星オートキャンプ場 – かわね来風」で名称一致。

### 不動の滝自然広場オートキャンプ場
- slug: `fudonotaki-auto`
- データ上の名前 / 正式名称: 不動の滝自然広場オートキャンプ場（一致）
- 所在地: 静岡県榛原郡川根本町下泉1122
- 座標: 35.024022, 138.103164
- GSI照合: 静岡県 川根本町 **下泉** / 標高 261.7m
- ソース: https://campoo.jp/shizuoka/22109/ ／ https://ffnpcs.com/
- 備考: 公式サイト稼働中。以前は町営、2015年ごろ民間運営に移行。NORDISKのテント設営済みヴィラサイトあり。

### アプトいちしろキャンプ場
- slug: `apt-ichishiro`
- データ上の名前 / 正式名称: アプトいちしろキャンプ場（一致）
- 所在地: 静岡県榛原郡川根本町梅地3-19
- 座標: 35.165373, 138.151306
- GSI照合: 静岡県 川根本町 **梅地** / 標高 474.9m
- ソース: https://campoo.jp/shizuoka/22066/ ／ https://abt-camp.shizu.website/
- 備考: 公式サイト稼働中。長島ダム脇、あぷとライン沿い。

### 福士川渓谷青少年旅行村
- slug: `fukushigawa-seishonen`
- データ上の名前 / 正式名称: 福士川渓谷青少年旅行村 / 南部町公式は「**青少年旅行村(キャンプ場)**」、なっぷは「福士川渓谷青少年旅行村奥山キャンプ場」
- 所在地: 山梨県南巨摩郡南部町福士26842（管理運営する奥山温泉の住所）
- 座標: 35.225815, 138.417517
- GSI照合: 山梨県 南部町 **福士** / 標高 567.2m
- ソース: https://camplog.jp/article/camp/E4 ／ https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html
- 備考: 要予約。データの tel `0556-66-3366` は奥山温泉の番号で、南部町公式の記載と一致（**誤りではない**）。料金は町公式に明記あり（下記「データ修正候補」参照）。

### 福士川オートキャンプ場
- slug: `fukushigawa-auto`
- データ上の名前 / 正式名称: 福士川オートキャンプ場（一致）
- 所在地: 山梨県南巨摩郡南部町福士19867
- 座標: 35.2211908, 138.4768309
- GSI照合: 山梨県 南部町 **福士** / 標高 135.2m
- ソース: https://map.camp-quests.com/campgrounds/fukushigawa-autocampsite/ （→ https://goo.gl/maps/pAfE7uFmmpVhLdmi8）／ https://www.nap-camp.com/yamanashi/11260
- 備考: なっぷの住所表記はデータと一致（福士19867）。tel 0556-66-2272 も一致。ただし営業期間に食い違いあり（下記参照）。なお map.camp-quests.com は住所を「福士15691-1」としており出典間で不一致。

### ターキーズハウス
- slug: `turkeys-house`
- データ上の名前 / 正式名称: ターキーズハウス / **ターキーズハウス 江ノ電に泊まれるキャンプ場**
- 所在地: 〒409-2102 山梨県南巨摩郡南部町福士16095
- 座標: 35.2107755, 138.4650031
- GSI照合: 山梨県 南部町 **福士** / 標高 166.9m
- ソース: https://map.camp-quests.com/campgrounds/turkeyshouse/ （→ https://goo.gl/maps/CAH2ybiKxtQFcdaU7）／ https://www.nap-camp.com/yamanashi/11259 ／ http://www.turkeyshouse.com/
- 備考: 公式サイト turkeyshouse.com 稼働中。1997年引退の江ノ電302号車両をバンガローとして使用。住所・tel（0556-66-3155）ともデータと一致。なっぷは現在「予約不可」表示。

---

## NEEDS_COORD（1件）

### 福士川根熊山荘ファミリーオートキャンプ場
- slug: `nekumasanso-auto`
- データ上の名前 / 正式名称: 福士川根熊山荘ファミリーオートキャンプ場（**公式サイトのタイトルと完全一致**）
- 所在地: 山梨県南巨摩郡南部町福士15854
- 座標: **取得できず**
- ソース: https://hukusshigawacamp.eyado.net/ ／ https://hukusshigawacamp.eyado.net/map.html ／ https://www.nap-camp.com/yamanashi/11262
- 備考: 実在は確実（公式サイト稼働中、民宿「福士川根熊山荘」敷地内のオートサイト、tel 0556-66-3241）。公式のアクセスページ・なっぷ・hinata・ソニー損保MAPPLEのいずれにもGoogleマップのURLが無く、ピン座標を出せなかった。座標だけが未取得。データの `needsVerify: true` は妥当。

---

## CLOSED（1件）

### 佐野川キャンプ場
- slug: `sanogawa-camp`
- データ上の名前 / 正式名称: 佐野川キャンプ場 / 現在の呼称は「**佐野川河川公園**」、「佐野川キャンプ適地」表記もあり
- 所在地: 山梨県南巨摩郡南部町（井出地区、佐野川温泉の先）
- 座標: 取得できず（下記のとおり座標以前に利用不可）
- ソース: https://camp.tabinchuya.com/yamanashi/sanogawa.html ／ https://nature-fun.com/camp-recommend/sanogawa/
- 備考: **「※キャンプ禁止になりました」と明記されている**（tabinchuya）。別の記事は「佐野川キャンプ場**跡地**」と表題に付けている。町役場への確認としてデイキャンプ可否もグレーとの記述あり。管理人不在、日没前の退去が推奨され宿泊は非推奨。データの soloComment「無料で焚き火ができる野営地としてソロキャンパーに知られる場所」は**現状と食い違う**ため掲載継続は要判断。

---

## NOT_FOUND（0件）

該当なし。19件すべてについて、その名前の施設が実在する（または実在した）裏付けが取れた。

---

## 判定保留（1件）— 4分類に収まらなかったもの

指定の4分類のどれにも正しく収まらないため、独立させた。CONFIRMED の条件「営業中」が確認できず、かといって閉業の証拠も無いため。

### ランバージャック
- slug: `lumberjack-nanbu`
- データ上の名前 / 正式名称: ランバージャック（一致）
- 所在地: 山梨県南巨摩郡南部町福士16407
- 座標: 35.2101011, 138.4563323
- GSI照合: 山梨県 南部町 福士 / 標高 189.7m
- ソース: https://web.archive.org/web/20260115181321/https://www.lumberjacktaimo.jp/ （→ https://goo.gl/maps/TWW9UmoPqRCaVLLJ7）
- 備考: **実在は確実、座標も取得済み。しかし営業状況が確認できない。**
  - データの officialUrl `https://www.lumberjacktaimo.jp/` は、現在**まったく無関係の漫画アフィリエイトサイト**を返す（HTTP 200）。ページ内に「キャンプ」「南部町」「福士川」の語は0件、漫画関連語は21件。`/home/facility/` などの下層ページは404。
  - Wayback の記録では **2026年1月15日時点までは正規のキャンプ場サイト**（title「ランバージャック – 山梨県南部町の小さなオートキャンプ場」）。それ以降、当調査時点（2026年8月7日）までの間にドメインが失効し第三者に取得されたとみられる。
  - 検索エンジンの結果には旧タイトルがキャッシュとして残っているが、実際に取得すると漫画サイトである。**検索結果のタイトルだけで「営業中」と判断してはいけない事例。**
  - 閉業・休業を明示する情報源は見つからなかったため CLOSED とはしていない。電話（アーカイブ記載: 0556-66-3110 / 090-4763-6987）での確認が必要。

---

## データ修正候補

`data/campgrounds.json` は書き換えていない。以下は出典付きで確認できた食い違いのみを記載する。

| slug | フィールド | 現在の値 | 正しい値 | ソースURL |
|---|---|---|---|---|
| `omuroyama-camp` | `name` | 大室山キャンプ場（伊東市営） | 伊東市青少年キャンプ場 | https://www.city.ito.shizuoka.jp/gyosei/soshikikarasagasu/shogaigakushuka/kanko/2379.html |
| `omuroyama-camp` | `address` | 静岡県伊東市富戸 | 静岡県伊東市池字柏戸676-1 | https://www.navitime.co.jp/poi?spot=02022-1192407 （国土地理院の逆ジオコーディングでも当該座標は「伊東市 池」を返す） |
| `takadabashi-kasenjiki` | `name` | 高田橋河川敷 | 高田橋多目的広場 | https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/tabi-140_trachi.html |
| `takadabashi-kasenjiki` | `address` | 神奈川県相模原市中央区 | 〒252-0244 神奈川県相模原市中央区水郷田名4-11-23 | https://rakucamp.net/free-camp-kasenjiki/ |
| `kamioshima-camp` | `priceMin` | `0` | `1000`（デイキャンプ1〜10人） | https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html |
| `kamioshima-camp` | `priceMax` | `0` | `2000`（宿泊1泊2日 1〜10人） | 同上 |
| `kamioshima-camp` | `priceNote` | 要問合せ | デイキャンプ1〜10人1,000円／宿泊1泊2日1〜10人2,000円（人数10人ごとに加算） | 同上 |
| `kamioshima-camp` | `address` | 神奈川県相模原市緑区大島3657 | 〒252-0135 神奈川県相模原市緑区大島3657付近 | 同上 |
| `kamioshima-camp` | `season` | 3月〜11月 | 3月1日〜11月30日（宿泊は4〜6月・10〜11月の土日祝と7/1〜9/30に限定） | 同上 |
| `ugusu-camp` | `address` | 静岡県賀茂郡西伊豆町宇久須 | 静岡県賀茂郡西伊豆町宇久須2102-13 | https://www.nishiizu-kankou.com/stay/ugusucanp |
| `fukushigawa-seishonen` | `name` | 福士川渓谷青少年旅行村 | 青少年旅行村(キャンプ場)〔南部町公式〕／福士川渓谷青少年旅行村奥山キャンプ場〔なっぷ〕 | https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html ／ https://www.nap-camp.com/yamanashi/11261 |
| `fukushigawa-seishonen` | `address` | 山梨県南巨摩郡南部町 | 山梨県南巨摩郡南部町福士26842 | https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html |
| `fukushigawa-seishonen` | `priceMin` | `0` | `2200`（1名1泊） | 同上 |
| `fukushigawa-seishonen` | `priceMax` | `0` | `4400`（5名以上1泊。2〜4名は3,300円） | 同上 |
| `fukushigawa-seishonen` | `priceNote` | 要問合せ | 1名2,200円／2〜4名3,300円／5名以上4,400円（いずれも1泊）・要予約 | 同上 |
| `fukushigawa-auto` | `season` | 4月〜11月 | 4月1日〜12月31日 | https://www.nap-camp.com/yamanashi/11260 |
| `turkeys-house` | `name` | ターキーズハウス | ターキーズハウス 江ノ電に泊まれるキャンプ場 | https://www.nap-camp.com/yamanashi/11259 |
| `turkeys-house` | `officialUrl` | （なし） | http://www.turkeyshouse.com/ | http://www.turkeyshouse.com/ |
| `lumberjack-nanbu` | `officialUrl` | https://www.lumberjacktaimo.jp/ | **削除すべき**（ドメイン失効、現在は無関係の漫画サイト） | 現URL取得結果＋ https://web.archive.org/web/20260115181321/https://www.lumberjacktaimo.jp/ |
| `lumberjack-nanbu` | `address` | 山梨県南巨摩郡南部町 | 山梨県南巨摩郡南部町福士16407 | https://web.archive.org/web/20260115181321/https://www.lumberjacktaimo.jp/ |
| `lumberjack-nanbu` | `tel` | （なし） | 0556-66-3110（携帯 090-4763-6987） | 同上 |
| `nekumasanso-auto` | `address` | 山梨県南巨摩郡南部町 | 山梨県南巨摩郡南部町福士15854 | https://hukusshigawacamp.eyado.net/map.html |
| `nekumasanso-auto` | `tel` | （なし） | 0556-66-3241 | 同上 |
| `nekumasanso-auto` | `officialUrl` | （なし） | https://hukusshigawacamp.eyado.net/ | https://hukusshigawacamp.eyado.net/ |
| `sanogawa-camp` | `name` | 佐野川キャンプ場 | 佐野川河川公園（キャンプ場としては廃止） | https://camp.tabinchuya.com/yamanashi/sanogawa.html |
| `sanogawa-camp` | `soloComment` | 「無料で焚き火ができる野営地としてソロキャンパーに知られる場所。」 | キャンプ禁止のため記述が現状と矛盾。掲載自体の可否を要判断 | 同上 |
| `nishizato-camp-tekichi` | `soloComment` | 「標高140mと夏も過ごしやすい」 | 国土地理院の実測は標高128.6m | 国土地理院 標高API（本レポートの座標で照会） |

### 出典が割れていて確定できなかったもの（修正候補に入れない）

| slug | フィールド | 出典A | 出典B |
|---|---|---|---|
| `ugusu-camp` | `season`（現在「要確認」） | 4月下旬〜10月31日（西伊豆町公式） | 4月初旬〜11月末（西伊豆町観光協会） |
| `fukushigawa-auto` | `address` | 福士19867（なっぷ・データと一致） | 福士15691-1（map.camp-quests.com） |

どちらも一次情報どうしが食い違っているため、現地確認なしに片方を「正しい値」とはしなかった。

### 誤りではなかったもの（確認済み・変更不要）

- `ugusu-camp` の `priceMin: 2200` / `priceMax: 5500` — 西伊豆町観光協会の「テントサイト1泊2,200円〜」「＋駐車1台1,000円」と整合。当初2,200円の出所を疑ったが公式表記どおりだった。
- `fukushigawa-seishonen` の `tel: 0556-66-3366` — 運営する奥山温泉の番号で、南部町公式の案内と一致。
- `fukushigawa-auto` の `tel: 0556-66-2272` / `address: 福士19867` — なっぷと一致。
- `turkeys-house` の `address: 福士16095` / `tel: 0556-66-3155` — なっぷと一致。
- `yagi-camp` の `season: 3月15日〜11月30日` — 川根本町観光協会の記載と一致。
- `priceMin: 0` かつ `priceNote: "要問合せ"` の組み合わせ — データ全体で `priceMin === 0` は26件あり、全件に priceNote が入っている。「無料開放」と「要問合せ」が明確に区別されているので、**`0` は「無料」の意味ではなく未確定のプレースホルダ**。よってこれ自体は誤りとして扱っていない。

---

## 所感

**NOT_FOUND は0件だった。** 19件すべて、その名前の施設が実在する（少なくとも実在した）ことを一次情報で確認できた。事前に疑っていた川根本町6件・南部町6件も、名前の取り違えや「似た名前の別施設」は1件も無かった。

とくに**川根本町の6件は全件クリーン**だった。データの住所に入っていた大字（千頭・久野脇・奥泉・上長尾・下泉・梅地）が、取得した座標を国土地理院に逆ジオコーディングして返ってきた大字と**6件とも完全一致**した。うち4件は公式サイトが現在も稼働しており（kunowaki.net、ffnpcs.com、abt-camp.shizu.website、kawanelife.org）、残る2件も川根本町観光協会の予約ページに名前がそのまま載っている。座標が 0,0 だったのは単に未入力だったためで、施設情報そのものの質は高い。

**問題が集中したのは南部町6件のほう**で、性質もばらばらだった。

- 座標まで取れて問題なしが3件（青少年旅行村・福士川オート・ターキーズハウス）
- 公式サイトはあるがGoogleマップのピンがどこにも無く座標だけ取れないのが1件（根熊山荘）
- キャンプ禁止になっていたのが1件（佐野川）
- 公式ドメインが失効して無関係サイトに変わっていたのが1件（ランバージャック）

つまり「南部町だから怪しい」のではなく、**南部町は個人・小規模運営の施設が多く、その分だけ情報の風化が早い**という傾向に見える。川根本町側が町・観光協会・法人運営で固まっているのと対照的だった。

今回いちばん危なかったのは**ランバージャック**で、検索エンジンの結果には「ランバージャック – 山梨県南部町の小さなオートキャンプ場」というタイトルが今も出るのに、実際にURLを取得すると漫画アフィリエイトサイトが返る。検索結果のタイトルだけを見て「公式サイトが生きている＝営業中」と判断していたら誤りだった。**officialUrl は定期的に中身まで取得して検証する必要がある**。他の18件についても今回すべてHTTPステータスと`<title>`を確認したが、実際に中身が別物だったのはこの1件だけだった。

座標については、**残り18件のうち17件でピンを取得できた**。取れなかったのは根熊山荘1件のみで、これは「情報が無い」のではなく「Googleマップのリンクを置いているページが無い」という取得経路の問題。公式サイトも電話番号もあるので、電話1本か現地の1回の確認で埋まる。

なお、地図中心の値を使えば根熊山荘以外も含めもっと簡単に数字は揃えられたが、経度が約200mずれることが確認できたため使っていない。**200mのずれは「キャンプ場の対岸」や「川の中」を指すには十分な距離**で、今回の 0,0 と同じく後から検出しにくい種類の誤りになる。
