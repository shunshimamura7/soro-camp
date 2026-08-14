# coordsVerified 引き直し候補の仕分け

生成: 2026-08-14 / `node scripts/coordsverified-triage.js`（このファイルは毎回上書き）

**①（機械検証を通っていない）はここに出ない。**`coord-worklist.js` の「取るべき」が正。
T1〜T3 は「距離が誤りの証拠にならない」であって「座標が正しい」ではない（無罪の証明はしない）。

| 仕分け | 件数 | 扱い |
|---|---|---|
| ② 小数3桁以下 | 12 | **全件引き直し**（一括投入の粒度のまま。目視の座標ではありえない） |
| ③-T1 自治体ぐるみで lv01 欠落 | 10 | 低優先（距離は代表点まで） |
| ③-T2 大字が一致 | 20 | 低優先(座標は正しい大字の中) |
| ③-T3 広域スナップ | 14 | 低優先（GSI 側の粒度） |
| ③-T4 説明がつかない | **13** | **引き直し候補**（実ピンと突き合わせて決める） |
| 距離未計測 | 0 | 仕分け不能。`verify-address-gsi.js` を回し直してから再仕分け |

## ② 小数3桁以下 — 全件引き直し

| slug | status | 座標 | 距離 |
|---|---|---|---|
| `aone` | active | 35.554, 139.1516 | 5.16km |
| `yamanakako-misaki` | active | 35.419, 138.8714 | 2.65km |
| `kawazu-nanadaru` | active | 34.7996, 138.927 | 1.21km |
| `muraei-yamanakako` | active | 35.432, 138.8479 | 4.05km |
| `karasawa-miyagase` | active | 35.488, 139.2221 | 1.51km |
| `yanagishima` | active | 35.328, 139.395 | 1.36km |
| `suigennnomori` | active | 35.512, 139.032 | 2.19km |
| `minoishtaki` | active | 35.614, 139.147 | 5.36km |
| `usami-shiroyama` | active | 34.958, 139.095 | 5.62km |
| `asagiri-foodpark` | active | 35.35, 138.578 | 6.88km |
| `fujinomori-yamanakako` | active | 35.43, 138.9165 | 2.32km |
| `yatsugatake-oizumi` | active | 35.86, 138.35 | 1.46km |

## ③-T4 説明がつかない — 引き直し候補（ここから着手）

| slug | status | 市区町村 | lv01Nm | 距離 | 理由 |
|---|---|---|---|---|---|
| `nanasawa-camp` | unverified | 厚木市 | 上古沢 | 2.54km | 距離 2.54km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `yamakita-camp` | unverified | 山北町 | 山北 | 3.62km | 距離 3.62km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `ryuyo-marine` | active | 磐田市 | 万正寺 | 5.39km | 距離 5.39km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `izukogen-auto` | unverified | 伊東市 | 鎌田 | 5.64km | 距離 5.64km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `mikagi-camp` | unverified | 相模原市緑区 | 寸沢嵐 | 3.62km | 距離 3.62km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `mushizawa-camp` | unverified | 山北町 | 玄倉 | 5.49km | 距離 5.49km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `hamanako-garden-camp` | unverified | 浜松市中央区 | 湖東町 | 8.9km | 距離 8.9km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `westriver-auto-camp` | active | 南アルプス市 | 秋山 | 10km | 距離 10km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `retreat-camp-mahoroba` | active | 富士河口湖町 | 長浜 | 6.58km | 距離 6.58km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `oshino-hakkai-camp` | unverified | 忍野村 | 内野 | 3.34km | 距離 3.34km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `akeno-fureai-camp` | active | 北杜市 | 須玉町江草 | 2.86km | 距離 2.86km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `hayakawa-camp` | suspended | 早川町 | 保 | 4.95km | 距離 4.95km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |
| `kofu-shinrinyoku-hiroba` | active | 甲府市 | 黒平町 | 5.29km | 距離 5.29km に説明がつかない（大字は一致せず、スナップの痕跡も無い） |

## ③-T1 自治体ぐるみで lv01 欠落 — 低優先

| slug | status | 市区町村 | lv01Nm | 距離 | 理由 |
|---|---|---|---|---|---|
| `doshi-no-mori` | active | 道志村 | − | 5.39km | 道志村 は全15件で lv01 が欠落。距離 5.39km は町の代表点からの距離でしかない |
| `tsubakiso-auto` | active | 道志村 | − | 2.27km | 道志村 は全15件で lv01 が欠落。距離 2.27km は町の代表点からの距離でしかない |
| `doshi-keikoku` | active | 道志村 | − | 7.16km | 道志村 は全15件で lv01 が欠落。距離 7.16km は町の代表点からの距離でしかない |
| `sankoso-auto` | active | 道志村 | − | 7.45km | 道志村 は全15件で lv01 が欠落。距離 7.45km は町の代表点からの距離でしかない |
| `okudoshi-auto` | active | 道志村 | − | 10.3km | 道志村 は全15件で lv01 が欠落。距離 10.3km は町の代表点からの距離でしかない |
| `doshigawa-kanko-noen` | active | 道志村 | − | 3.67km | 道志村 は全15件で lv01 が欠落。距離 3.67km は町の代表点からの距離でしかない |
| `tsukiyono-doshi-camp` | active | 道志村 | − | 6.14km | 道志村 は全15件で lv01 が欠落。距離 6.14km は町の代表点からの距離でしかない |
| `hananomori-camp` | active | 道志村 | − | 4.74km | 道志村 は全15件で lv01 が欠落。距離 4.74km は町の代表点からの距離でしかない |
| `doshi-mori-cottage` | active | 道志村 | − | 2.5km | 道志村 は全15件で lv01 が欠落。距離 2.5km は町の代表点からの距離でしかない |
| `ryokokubashi-camp` | active | 道志村 | − | 7.36km | 道志村 は全15件で lv01 が欠落。距離 7.36km は町の代表点からの距離でしかない |

## ③-T2 大字が一致 — 低優先

| slug | status | 市区町村 | lv01Nm | 距離 | 理由 |
|---|---|---|---|---|---|
| `asagiri-eichinomori` | active | 富士宮市 | 根原 | 2.72km | 逆ジオの大字「根原」が address と2文字一致。座標は正しい大字の中（大字中心との距離 2.72km は証拠にならない） |
| `motosu-lakeside` | active | 富士河口湖町 | 本栖 | 3.66km | 逆ジオの大字「本栖」が address と2文字一致。座標は正しい大字の中（大字中心との距離 3.66km は証拠にならない） |
| `wellcamp-nishitanzawa` | active | 山北町 | 中川 | 4.1km | 逆ジオの大字「中川」が address と2文字一致。座標は正しい大字の中（大字中心との距離 4.1km は証拠にならない） |
| `nishitanzawa-mountbridge` | active | 山北町 | 中川 | 3.8km | 逆ジオの大字「中川」が address と2文字一致。座標は正しい大字の中（大字中心との距離 3.8km は証拠にならない） |
| `yataro-camp` | active | 清川村 | 煤ヶ谷 | 3.97km | 逆ジオの大字「煤ヶ谷」が address と3文字一致。座標は正しい大字の中（大字中心との距離 3.97km は証拠にならない） |
| `kiyosato-oka` | active | 北杜市 | 高根町清里 | 2.16km | 逆ジオの大字「高根町清里」が address と5文字一致。座標は正しい大字の中（大字中心との距離 2.16km は証拠にならない） |
| `ashinoko-camp-mura` | active | 箱根町 | 元箱根 | 5.39km | 逆ジオの大字「元箱根」が address と3文字一致。座標は正しい大字の中（大字中心との距離 5.39km は証拠にならない） |
| `richland-kiyokawa` | active | 清川村 | 煤ヶ谷 | 5.68km | 逆ジオの大字「煤ヶ谷」が address と3文字一致。座標は正しい大字の中（大字中心との距離 5.68km は証拠にならない） |
| `konomasawa-camp` | active | 相模原市緑区 | 青根 | 3.99km | 逆ジオの大字「青根」が address と2文字一致。座標は正しい大字の中（大字中心との距離 3.99km は証拠にならない） |
| `fujigoko-auto-camp` | unverified | 山中湖村 | 平野 | 2.16km | 逆ジオの大字「平野」が address と2文字一致。座標は正しい大字の中（大字中心との距離 2.16km は証拠にならない） |
| `hakushu-ojiro-camp` | active | 北杜市 | 白州町白須 | 4.43km | 逆ジオの大字「白州町白須」が address と5文字一致。座標は正しい大字の中（大字中心との距離 4.43km は証拠にならない） |
| `folkwood-yatsugatake` | active | 北杜市 | 小淵沢町 | 2.29km | 逆ジオの大字「小淵沢町」が address と4文字一致。座標は正しい大字の中（大字中心との距離 2.29km は証拠にならない） |
| `tiny-camp-village` | active | 厚木市 | 七沢 | 2.18km | 逆ジオの大字「七沢」が address と2文字一致。座標は正しい大字の中（大字中心との距離 2.18km は証拠にならない） |
| `ikawa-auto` | active | 静岡市葵区 | 田代 | 2.03km | 逆ジオの大字「田代」が address と2文字一致。座標は正しい大字の中（大字中心との距離 2.03km は証拠にならない） |
| `flora-campsite` | active | 北杜市 | 白州町白須 | 3.13km | 逆ジオの大字「白州町白須」が address と5文字一致。座標は正しい大字の中（大字中心との距離 3.13km は証拠にならない） |
| `oishii-camp` | active | 富士河口湖町 | 富士ヶ嶺 | 2km | 逆ジオの大字「富士ヶ嶺」が address と4文字一致。座標は正しい大字の中（大字中心との距離 2km は証拠にならない） |
| `nekumasanso-auto` | active | 南部町 | 福士 | 3.27km | 逆ジオの大字「福士」が address と2文字一致。座標は正しい大字の中（大字中心との距離 3.27km は証拠にならない） |
| `fujino-art-camp` | active | 相模原市緑区 | 牧野 | 2.82km | 逆ジオの大字「牧野」が address と2文字一致。座標は正しい大字の中（大字中心との距離 2.82km は証拠にならない） |
| `saiko-kohan-camp` | active | 富士河口湖町 | 西湖 | 2.43km | 逆ジオの大字「西湖」が address と2文字一致。座標は正しい大字の中（大字中心との距離 2.43km は証拠にならない） |
| `shiraishi-auto-camp` | active | 山北町 | 中川 | 5.33km | 逆ジオの大字「中川」が address と2文字一致。座標は正しい大字の中（大字中心との距離 5.33km は証拠にならない） |

## ③-T3 広域スナップ — 低優先

| slug | status | 市区町村 | lv01Nm | 距離 | 理由 |
|---|---|---|---|---|---|
| `sagamiko-kyuyomura` | active | 相模原市緑区 | 牧野 | 2.22km | lv01Nm「牧野」が食い違い全体で4件に返っている（広域スナップ先。I5型） |
| `okooigawa-lake` | unverified | 川根本町 | 東藤川 | 14.3km | 大字「千頭」を名乗る施設が3件あり lv01Nm が3種類に割れている（大字が広い。I8型） |
| `amagi-kogen` | unverified | 伊豆市 | 筏場 | 5.66km | 大字「湯ヶ島」を名乗る施設が2件あり lv01Nm が2種類に割れている（大字が広い。I8型） |
| `doshi-no-yu-camp` | unverified | 相模原市緑区 | 牧野 | 10.6km | lv01Nm「牧野」が食い違い全体で4件に返っている（広域スナップ先。I5型） |
| `mitsumata-camp` | unverified | 山北町 | − | 9.03km | 大字「中川」を名乗る施設が4件あり lv01Nm が2種類に割れている（大字が広い。I8型） |
| `sagamiko-pleasure-camp` | unverified | 相模原市緑区 | 牧野 | 3.4km | lv01Nm「牧野」が食い違い全体で4件に返っている（広域スナップ先。I5型） |
| `okumakino-camp` | unverified | 相模原市緑区 | 千木良 | 7.07km | 大字「牧野」を名乗る施設が3件あり lv01Nm が3種類に割れている（大字が広い。I8型） |
| `camp-baird` | active | 伊豆市 | 柏久保 | 5.38km | 大字「大平」を名乗る施設が2件あり lv01Nm が2種類に割れている（大字が広い。I8型） |
| `izu-kakure-auto` | active | 伊豆市 | 大平柿木 | 10.7km | lv01Nm「大平柿木」が食い違い全体で3件に返っている（広域スナップ先。I5型） |
| `sumatakyo-camp` | unverified | 川根本町 | 崎平 | 12.9km | 大字「千頭」を名乗る施設が3件あり lv01Nm が3種類に割れている（大字が広い。I8型） |
| `nishi-amagi-kogen` | unverified | 伊豆市 | 大平柿木 | 2.68km | lv01Nm「大平柿木」が食い違い全体で3件に返っている（広域スナップ先。I5型） |
| `nekokodake-camp` | unverified | 伊豆市 | 大平柿木 | 5.72km | lv01Nm「大平柿木」が食い違い全体で3件に返っている（広域スナップ先。I5型） |
| `asagiri-greenpark-camp` | unverified | 富士宮市 | 人穴 | 3.16km | 大字「猪之頭」を名乗る施設が3件あり lv01Nm が2種類に割れている（大字が広い。I8型） |
| `takegawa-kyo-camp` | unverified | 北杜市 | 長坂町大八田 | 8.72km | 旧町名「長坂町」が食い違い全体で2件に返っている（合併市の旧町名スナップ。I7型） |
