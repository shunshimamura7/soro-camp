# 二重登録の疑いがあるペア

対象: **173件**（auto で候補が出た分は除外）。以前は coordsVerified !== true のものだけを見ていたが、確認済みフラグが検証をすり抜けさせていたため全件を対象にした

総当たり 14878 ペアを比較し、**33ペア**を抽出。

判定基準

- **強い根拠**: 住所が完全一致 / 番地が一致（20km以内のとき） / 電話番号が一致 / 座標が1km以内
- 弱い根拠: 名称の類似（正規化＋編集距離） / 名前の共通部分が**4文字以上かつ地名でない** / 県をまたぐのに近接

共通部分は施設の area・prefecture・address に含まれる文字列を除外している。「富士」「朝霧」「山中湖」のような地名は同じエリアの別施設どうしで当然一致するため。

※ 判定のみ。data/campgrounds.json は変更していない。

| # | A | B | 距離 | 疑いの根拠 |
| --- | --- | --- | --- | --- |
| 1 | `pica-fuji-greenpa`<br>PICA富士ぐりんぱ<br>静岡・裾野 | `pica-sagamiko`<br>PICAさがみ湖<br>神奈川・相模湖 | 51.84km | 電話番号が一致（0555-30-4580） |
| 2 | `norolodge`<br>青野原野呂ロッジキャンプ場<br>神奈川・道志川 | `aonohara-auto`<br>青野原オートキャンプ場<br>神奈川・道志川 | 0.10km | 座標が近接（0.10km） |
| 3 | `sagamiko-kyuyomura`<br>相模湖休養村キャンプ場<br>神奈川・相模湖 | `sagamiko-pleasure-camp`<br>相模湖プレジャーフォレストキャンプ場<br>神奈川・相模湖 | 0.90km | 座標が近接（0.90km） |
| 4 | `asagiri-eichinomori`<br>朝霧高原 英知の杜キャンプ場<br>静岡・朝霧高原 | `urban-camping-asagiri-houzan`<br>アーバンキャンピング朝霧宝山<br>静岡・朝霧高原 | 0.84km | 座標が近接（0.84km） |
| 5 | `asagiri-sorairo`<br>朝霧Camp Base そらいろ<br>静岡・朝霧高原 | `asagiri-jamboree`<br>朝霧ジャンボリーオートキャンプ場<br>静岡・朝霧高原 | 0.53km | 座標が近接（0.53km） |
| 6 | `asagiri-sorairo`<br>朝霧Camp Base そらいろ<br>静岡・朝霧高原 | `asagiri-greenpark-camp`<br>朝霧高原グリーンパーク<br>静岡・朝霧高原 | 0.48km | 座標が近接（0.48km） |
| 7 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `sports-train-aokigahara`<br>SPORTS TRAIN in Forest CAMP<br>山梨・富士河口湖町 | 0.21km | 座標が近接（0.21km） |
| 8 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `komeidoso-auto`<br>湖明荘オートキャンプ場<br>山梨・山中湖 | 0.56km | 座標が近接（0.56km） |
| 9 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `fujigoko-auto-camp`<br>富士五湖オートキャンプ場<br>山梨・山中湖 | 0.92km | 座標が近接（0.92km） |
| 10 | `nishitanzawa-mountbridge`<br>西丹沢マウントブリッジキャンプ場<br>神奈川・西丹沢 | `mitsumata-camp`<br>みつまたキャンプ場<br>神奈川・西丹沢 | 0.69km | 座標が近接（0.69km） |
| 11 | `tanzawako-lodge`<br>丹沢湖ロッヂ<br>神奈川・丹沢湖 | `mushizawa-camp`<br>虫沢古道キャンプ場<br>神奈川・山北 | 0.86km | 座標が近接（0.86km） |
| 12 | `suigennnomori`<br>水源の森 キャンプ・ランド<br>山梨・道志村 | `doshi-mori-cottage`<br>道志森のコテージ<br>山梨・道志村 | 0.92km | 座標が近接（0.92km） |
| 13 | `turkeys-house`<br>ターキーズハウス 江ノ電に泊まれるキャンプ場<br>山梨・南部町 | `lumberjack-nanbu`<br>ランバージャック<br>山梨・南部町 | 0.79km | 座標が近接（0.79km） |
| 14 | `norolodge`<br>青野原野呂ロッジキャンプ場<br>神奈川・道志川 | `shindo`<br>新戸キャンプ場<br>神奈川・道志川 | 0.38km | 座標が近接（0.38km） |
| 15 | `tanukiko`<br>田貫湖キャンプ場<br>静岡・朝霧高原 | `asagiri-foodpark`<br>AFPオートキャンプ場（スタイルキャビンあさぎり）<br>静岡・朝霧高原 | 0.68km | 座標が近接（0.68km） |
| 16 | `tanukiko`<br>田貫湖キャンプ場<br>静岡・朝霧高原 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | 0.80km | 座標が近接（0.80km） |
| 17 | `shindo`<br>新戸キャンプ場<br>神奈川・道志川 | `aonohara-auto`<br>青野原オートキャンプ場<br>神奈川・道志川 | 0.30km | 座標が近接（0.30km） |
| 18 | `kannogawa`<br>神之川キャンプ・マス釣り場<br>神奈川・西丹沢 | `tsukiyono-doshi-camp`<br>月夜野キャンプ場<br>山梨・道志村 | 0.57km | 座標が近接（0.57km） |
| 19 | `tsubakiso-auto`<br>椿荘オートキャンプ場<br>山梨・道志村 | `konomasawa-camp`<br>このまさわキャンプ場<br>神奈川・道志川 | 0.89km | 座標が近接（0.89km） |
| 20 | `sankoso-auto`<br>山光荘オートキャンプ場<br>山梨・道志村 | `konomasawa-camp`<br>このまさわキャンプ場<br>神奈川・道志川 | 0.44km | 座標が近接（0.44km） |
| 21 | `izu-kakure-auto`<br>伊豆隠れオートキャンプ場<br>静岡・伊豆 | `nishi-amagi-kogen`<br>西天城高原牧場のキャンプ場<br>静岡・伊豆 | 0.82km | 座標が近接（0.82km） |
| 22 | `minoishtaki`<br>みの石滝キャンプ場<br>神奈川・相模湖 | `akiyamagawa-camp`<br>秋山川キャンプ場<br>神奈川・相模原・秋山 | 0.86km | 座標が近接（0.86km） |
| 23 | `ikenoya-family`<br>池の谷ファミリーキャンプ場<br>静岡・川根本町 | `yagi-camp`<br>八木キャンプ場<br>静岡・川根本町 | 2.66km | 電話番号が一致（0547-59-2746） |
| 24 | `pica-omotefuji`<br>PICA表富士<br>静岡・富士山南麓 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | 18.22km | 名前に共通部分「pica」（4文字・地名ではない）<br>県をまたぐが18.22kmしか離れていない（県の割り当て誤りの疑い） |
| 25 | `pica-fuji-greenpa`<br>PICA富士ぐりんぱ<br>静岡・裾野 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | 18.17km | 名前に共通部分「pica」（4文字・地名ではない）<br>県をまたぐが18.17kmしか離れていない（県の割り当て誤りの疑い） |
| 26 | `doshi-no-mori`<br>道志の森キャンプ場<br>山梨・道志村 | `doshi-no-yu-camp`<br>道志の湯キャンプ場<br>神奈川・道志川 | 16.78km | 名称類似（編集距離1）<br>県をまたぐが16.78kmしか離れていない（県の割り当て誤りの疑い） |
| 27 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | 7.91km | 名前に共通部分「pica」（4文字・地名ではない） |
| 28 | `pica-omotefuji`<br>PICA表富士<br>静岡・富士山南麓 | `pica-fuji-greenpa`<br>PICA富士ぐりんぱ<br>静岡・裾野 | 7.28km | 名前に共通部分「pica」（4文字・地名ではない） |
| 29 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `yamanakako-minami-auto`<br>山中湖みなみオートキャンプ場<br>山梨・山中湖 | 3.40km | 名前に共通部分「山中湖み」（4文字・地名ではない） |
| 30 | `amagi-kogen`<br>天城高原キャンプ場<br>静岡・伊豆 | `nishi-amagi-kogen`<br>西天城高原牧場のキャンプ場<br>静岡・伊豆 | 8.78km | 名前に共通部分「天城高原」（4文字・地名ではない） |
| 31 | `hakushu-ojiro-camp`<br>白州・尾白の森キャンプ場<br>山梨・北杜 | `flora-campsite`<br>白州・尾白 FLORA Campsite in the Natural Garden<br>山梨・南アルプス・甲斐駒 | 5.46km | 名前に共通部分「白州尾白」（4文字・地名ではない） |
| 32 | `fujisan-genshijin`<br>富士山オートキャンプ場GENSHIJIN<br>静岡・富士宮 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | 5.29km | 名前に共通部分「富士山g」（4文字・地名ではない） |
| 33 | `richland-kiyokawa`<br>リッチランドキャンプ場<br>神奈川・宮ヶ瀬 | `suigennnomori`<br>水源の森 キャンプ・ランド<br>山梨・道志村 | 16.52km | 県をまたぐが16.52kmしか離れていない（県の割り当て誤りの疑い） |
