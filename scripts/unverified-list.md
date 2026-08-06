# 情報未確認のデータ

`lastVerified` が **2025-01-01** のものは、batch 投入時に一律で入れたプレースホルダで、
実際に情報を確認した日ではない。二重登録として削除した2件
（朝霧高原 英知の杜キャンプ場、大野山キャンプ場）がいずれもこの日付だったため、
**実在性・内容とも未確認**として扱う。

- 全 187件中、プレースホルダ日付: **34件**
- うち tel と officialUrl がどちらもないもの: **29件**（裏取りの手がかりなし）
- `lastVerified` が空: 9件

※ 判定のみ。data/campgrounds.json は変更していない。

## プレースホルダ日付（2025-01-01）の 34件

| slug | name | prefecture | area | tel | officialUrl |
| --- | --- | --- | --- | --- | --- |
| `doshigawa-kanko-noen` | 道志村観光農園オートキャンプ場 | 山梨 | 道志村 | なし | なし |
| `marutamura-camp` | 丸太村キャンプ場 | 神奈川 | 相模原 | なし | なし |
| `tiny-camp-village` | TINY CAMP VILLAGE | 神奈川 | 厚木・七沢 | あり | あり |
| `hinata-camp` | 日向キャンプ場 | 神奈川 | 伊勢原 | なし | なし |
| `okuyugawara-auto` | 奥湯河原オートキャンプ場 | 神奈川 | 湯河原 | なし | なし |
| `doshi-fureainomori` | 道志ふれあいの森キャンプ場 | 山梨 | 道志村 | なし | なし |
| `naminokomura` | なみのこ村 | 神奈川 | 湯河原・海沿い | なし | なし |
| `kuragari-camp` | 玄倉キャンプ場 | 神奈川 | 丹沢湖 | なし | なし |
| `hayatogawa-masu` | 早戸川国際マス釣場キャンプ場 | 神奈川 | 宮ヶ瀬 | なし | なし |
| `yakeyamazawa-shinpukuji` | 焼山沢真福寺キャンプ場 | 神奈川 | 相模原 | なし | なし |
| `shiroyama-fureainosato` | 城山ふれあいの里 | 神奈川 | 津久井湖 | なし | なし |
| `mountkan-kannogawa` | 西丹沢マウントカンキャンプ場 | 神奈川 | 西丹沢 | なし | なし |
| `nelo-gotemba` | NELOキャンプ場御殿場 | 静岡 | 御殿場 | なし | なし |
| `nishiizu-seto` | 西伊豆せと海岸キャンプ場 | 静岡 | 西伊豆 | なし | なし |
| `fujisan-genshijin` | 富士山オートキャンプ場GENSHIJIN | 静岡 | 富士宮 | なし | あり |
| `magic-hour-camp` | magic hour | 静岡 | 静岡市清水区 | なし | なし |
| `kokono-shizuoka` | キャンプ場此処野静岡 | 静岡 | 静岡市葵区 | なし | なし |
| `makigaya-auto` | 牧ヶ谷オートキャンプ場 | 静岡 | 静岡市 | なし | なし |
| `granpapa-solo-bocchi` | 富士山GranPapaソロぼっち区画サイト | 静岡 | 富士宮 | なし | あり |
| `marubi-auto` | 御殿場まるびオートキャンプ場 | 静岡 | 御殿場 | なし | なし |
| `ikawa-auto` | 井川オートキャンプ場 | 静岡 | 静岡市葵区・井川 | なし | なし |
| `sessokyo-camp` | 接岨峡キャンプ場 | 静岡 | 川根本町 | なし | なし |
| `minamialps-auto-camp` | 南アルプスオートキャンプ場 | 山梨 | 南アルプス | なし | なし |
| `doshi-minamoto-camp` | 道志みなもとキャンプ | 山梨 | 道志村 | なし | なし |
| `yamanakako-minami-auto` | 山中湖みなみオートキャンプ場 | 山梨 | 山中湖 | なし | なし |
| `camp-akaike` | キャンプアカイケ | 山梨 | 精進湖近く | なし | なし |
| `tsukiyono-doshi-camp` | 月夜野キャンプ場 | 山梨 | 道志村 | なし | なし |
| `ecopa-inagako` | エコパ伊奈ヶ湖 | 山梨 | 南アルプス | なし | なし |
| `village-hakushu` | ヴィレッヂ白州 | 山梨 | 北杜・白州 | なし | なし |
| `hananomori-camp` | 花の森オートキャンピア | 山梨 | 道志村 | なし | なし |
| `flora-campsite` | FLORA Campsite | 山梨 | 南アルプス・甲斐駒 | なし | なし |
| `shinozawa-ootaki-camp` | 篠沢大滝キャンプ場 | 山梨 | 北杜・南アルプス | なし | あり |
| `oishii-camp` | おいしいキャンプ場 | 山梨 | 富士河口湖町富士ヶ嶺 | あり | あり |
| `shimobe-yurucamp-sato` | 道の駅しもべ オートキャンプ場〜ゆるキャン△の里〜 | 山梨 | 身延町 | なし | なし |

## lastVerified が空の 9件

野営地など、そもそも確認日を持たないもの。

| slug | name | prefecture | area | tel | officialUrl |
| --- | --- | --- | --- | --- | --- |
| `nakatsugawa-kasenjiki` | 中津川河川敷（田代運動公園） | 神奈川 | 愛川町 | なし | なし |
| `sumida-ohashi-kasenjiki` | 角田大橋河川敷 | 神奈川 | 愛川町 | なし | なし |
| `hasugebashi-kasenjiki` | 八菅橋河川敷 | 神奈川 | 愛川町 | なし | なし |
| `wadanagahama-kaigan` | 和田長浜海岸 | 神奈川 | 三浦市 | なし | なし |
| `kofu-shinrinyoku-hiroba` | 甲府市 森林浴広場 | 山梨 | 甲府市 | なし | なし |
| `ogayanagawa-keikoku` | 大柳川渓谷キャンプ場 | 山梨 | 富士川町十谷 | なし | なし |
| `tsuchimura` | 土村キャンプ場 | 静岡 | 静岡市葵区 | なし | なし |
| `kurokawa-shizuoka` | 黒川キャンプ場（清水森林公園） | 静岡 | 静岡市清水区 | なし | なし |
| `omuroyama-camp` | 大室山キャンプ場（伊東市営） | 静岡 | 伊東市 | なし | なし |
