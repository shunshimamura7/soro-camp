# 二重登録の疑いがあるペア

対象: **202件**（auto で候補が出た分は除外）。以前は coordsVerified !== true のものだけを見ていたが、確認済みフラグが検証をすり抜けさせていたため全件を対象にした

総当たり 20301 ペアを比較し、**133ペア**を抽出。

判定基準: 名称の類似（正規化＋編集距離） / 名前の共通部分3文字以上かつ20km以内 / 座標が1km以内 / 県をまたぐのに近接

※ 判定のみ。data/campgrounds.json は変更していない。

| # | A | B | 距離 | 疑いの根拠 |
| --- | --- | --- | --- | --- |
| 1 | `doshi-no-mori`<br>道志の森キャンプ場<br>山梨・道志村 | `doshi-no-yu-camp`<br>道志の湯キャンプ場<br>神奈川・道志川 | 16.78km | 名称類似（編集距離1）<br>名前に共通部分「道志の」（3文字）<br>県をまたぐが16.78kmしか離れていない（県の割り当て誤りの疑い） |
| 2 | `urban-camping-asagiri-houzan`<br>アーバンキャンピング朝霧宝山<br>静岡・朝霧高原 | `shojiko-camping`<br>精進湖キャンピングコテージ<br>山梨・精進湖 | 9.73km | 名前に共通部分「きゃんぴんぐ」（6文字）<br>県をまたぐが9.73kmしか離れていない（県の割り当て誤りの疑い） |
| 3 | `tanzawako-lodge`<br>丹沢湖ロッヂキャンプ場<br>神奈川・丹沢湖 | `tanzawako-roadside-camp`<br>丹沢湖ロッヂ<br>神奈川・丹沢湖 | 4.35km | 名称完全一致（編集距離0）<br>名前に共通部分「丹沢湖ろっぢ」（6文字） |
| 4 | `doshi-fureainomori`<br>道志ふれあいの森キャンプ場<br>山梨・道志村 | `shiroyama-fureainosato`<br>城山ふれあいの里<br>神奈川・津久井湖 | 16.37km | 名前に共通部分「ふれあいの」（5文字）<br>県をまたぐが16.37kmしか離れていない（県の割り当て誤りの疑い） |
| 5 | `pica-omotefuji`<br>PICA表富士<br>静岡・富士山南麓 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | 18.22km | 名前に共通部分「pica」（4文字）<br>県をまたぐが18.22kmしか離れていない（県の割り当て誤りの疑い） |
| 6 | `woodsman-camp`<br>WOODSMAN CAMP<br>山梨・道志村 | `tiny-camp-village`<br>TINY CAMP VILLAGE<br>神奈川・厚木・七沢 | 16.03km | 名前に共通部分「camp」（4文字）<br>県をまたぐが16.03kmしか離れていない（県の割り当て誤りの疑い） |
| 7 | `pica-fuji-greenpa`<br>PICA富士ぐりんぱ<br>静岡・裾野 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | 18.17km | 名前に共通部分「pica」（4文字）<br>県をまたぐが18.17kmしか離れていない（県の割り当て誤りの疑い） |
| 8 | `hananomori-camp`<br>花の森オートキャンピア<br>山梨・道志村 | `sagamiko-camping-village`<br>相模湖キャンピングヴィレッジ<br>神奈川・相模湖 | 19.38km | 名前に共通部分「きゃんぴ」（4文字）<br>県をまたぐが19.38kmしか離れていない（県の割り当て誤りの疑い） |
| 9 | `norolodge`<br>青野原野呂ロッジキャンプ場<br>神奈川・道志川 | `aonohara-auto`<br>青野原オートキャンプ場<br>神奈川・道志川 | 0.10km | 名前に共通部分「青野原」（3文字）<br>座標が近接（0.10km） |
| 10 | `urban-camping-asagiri-houzan`<br>アーバンキャンピング朝霧宝山<br>静岡・朝霧高原 | `shimobe-yurucamp-sato`<br>道の駅しもべ オートキャンプ場〜ゆるキャン△の里〜<br>山梨・身延町 | 10.72km | 名前に共通部分「きゃん」（3文字）<br>県をまたぐが10.72kmしか離れていない（県の割り当て誤りの疑い） |
| 11 | `wellcamp-nishitanzawa`<br>ウェルキャンプ西丹沢<br>神奈川・西丹沢 | `mountkan-kannogawa`<br>西丹沢マウントカンキャンプ場<br>神奈川・西丹沢 | 0.31km | 名前に共通部分「西丹沢」（3文字）<br>座標が近接（0.31km） |
| 12 | `sagamiko-kyuyomura`<br>相模湖休養村キャンプ場<br>神奈川・相模湖 | `sagamiko-pleasure-camp`<br>相模湖プレジャーフォレストキャンプ場<br>神奈川・相模湖 | 0.90km | 名前に共通部分「相模湖」（3文字）<br>座標が近接（0.90km） |
| 13 | `fuji-ymca`<br>富士山YMCAグローバル・エコ・ヴィレッジ<br>静岡・富士宮 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | 19.37km | 名前に共通部分「れっじ」（3文字）<br>県をまたぐが19.37kmしか離れていない（県の割り当て誤りの疑い） |
| 14 | `richland-kiyokawa`<br>リッチランドキャンプ場<br>神奈川・宮ヶ瀬 | `suigennnomori`<br>水源の森キャンプランド<br>山梨・道志村 | 16.52km | 名前に共通部分「らんど」（3文字）<br>県をまたぐが16.52kmしか離れていない（県の割り当て誤りの疑い） |
| 15 | `yamanakako-minami-auto`<br>山中湖みなみオートキャンプ場<br>山梨・山中湖 | `kirara-yamanakako`<br>山中湖交流プラザきらら<br>山梨・山中湖 | 0.72km | 名前に共通部分「山中湖」（3文字）<br>座標が近接（0.72km） |
| 16 | `nakatsugawa-camp`<br>中津川キャンプ場<br>神奈川・愛甲郡愛川町 | `nakatsugawa-kasenjiki`<br>中津川河川敷（田代運動公園）<br>神奈川・愛川町 | 0.00km | 名前に共通部分「中津川」（3文字）<br>座標が近接（0.00km） |
| 17 | `nishitanzawa-mountbridge`<br>西丹沢マウントブリッジキャンプ場<br>神奈川・西丹沢 | `mountkan-kannogawa`<br>西丹沢マウントカンキャンプ場<br>神奈川・西丹沢 | 12.28km | 名前に共通部分「西丹沢まうんと」（7文字） |
| 18 | `shiroyama-fureainosato`<br>城山ふれあいの里<br>神奈川・津久井湖 | `takaranoyama-fureai`<br>宝の山ふれあいの里キャンプ場<br>山梨・都留市 | 32.07km | 名称類似（編集距離2） |
| 19 | `miyagase-village`<br>宮ヶ瀬ヴィレッジキャンプ場<br>神奈川・宮ヶ瀬 | `sagamiko-camping-village`<br>相模湖キャンピングヴィレッジ<br>神奈川・相模湖 | 14.48km | 名前に共通部分「ゔぃれっじ」（5文字） |
| 20 | `onoji-family`<br>大野路ファミリーキャンプ場<br>静岡・裾野 | `nekumasanso-auto`<br>福士川根熊山荘ファミリーオートキャンプ場<br>山梨・南部町 | — | 名前に共通部分「ふぁみりー」（5文字） |
| 21 | `doshi-fureainomori`<br>道志ふれあいの森キャンプ場<br>山梨・道志村 | `takaranoyama-fureai`<br>宝の山ふれあいの里キャンプ場<br>山梨・都留市 | 15.94km | 名前に共通部分「ふれあいの」（5文字） |
| 22 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | `nekumasanso-auto`<br>福士川根熊山荘ファミリーオートキャンプ場<br>山梨・南部町 | — | 名前に共通部分「ふぁみりー」（5文字） |
| 23 | `ikenoya-family`<br>池の谷ファミリーキャンプ場<br>静岡・川根本町 | `nekumasanso-auto`<br>福士川根熊山荘ファミリーオートキャンプ場<br>山梨・南部町 | — | 名前に共通部分「ふぁみりー」（5文字） |
| 24 | `asagiri-eichinomori`<br>朝霧高原 英知の杜キャンプ場<br>静岡・朝霧高原 | `asagiri-greenpark-camp`<br>朝霧高原グリーンパーク<br>静岡・朝霧高原 | 2.46km | 名前に共通部分「朝霧高原」（4文字） |
| 25 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | 7.91km | 名前に共通部分「pica」（4文字） |
| 26 | `pica-omotefuji`<br>PICA表富士<br>静岡・富士山南麓 | `pica-fuji-greenpa`<br>PICA富士ぐりんぱ<br>静岡・裾野 | 7.28km | 名前に共通部分「pica」（4文字） |
| 27 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `yamanakako-minami-auto`<br>山中湖みなみオートキャンプ場<br>山梨・山中湖 | 3.40km | 名前に共通部分「山中湖み」（4文字） |
| 28 | `amagi-kogen`<br>天城高原キャンプ場<br>静岡・伊豆 | `nishi-amagi-kogen`<br>西天城高原牧場のキャンプ場<br>静岡・伊豆 | 8.78km | 名前に共通部分「天城高原」（4文字） |
| 29 | `fujisan-genshijin`<br>富士山オートキャンプ場GENSHIJIN<br>静岡・富士宮 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | 5.29km | 名前に共通部分「富士山g」（4文字） |
| 30 | `sumida-ohashi-kasenjiki`<br>角田大橋河川敷<br>神奈川・愛川町 | `hasugebashi-kasenjiki`<br>八菅橋河川敷<br>神奈川・愛川町 | 3.11km | 名前に共通部分「橋河川敷」（4文字） |
| 31 | `sumida-ohashi-kasenjiki`<br>角田大橋河川敷<br>神奈川・愛川町 | `ogurabashi-kasenjiki`<br>小倉橋河川敷<br>神奈川・相模原市緑区 | 6.71km | 名前に共通部分「橋河川敷」（4文字） |
| 32 | `hasugebashi-kasenjiki`<br>八菅橋河川敷<br>神奈川・愛川町 | `ogurabashi-kasenjiki`<br>小倉橋河川敷<br>神奈川・相模原市緑区 | 8.79km | 名前に共通部分「橋河川敷」（4文字） |
| 33 | `nishitanzawa-ootaki`<br>西丹沢大滝キャンプ場<br>神奈川・西丹沢 | `wellcamp-nishitanzawa`<br>ウェルキャンプ西丹沢<br>神奈川・西丹沢 | 2.25km | 名前に共通部分「西丹沢」（3文字） |
| 34 | `nishitanzawa-ootaki`<br>西丹沢大滝キャンプ場<br>神奈川・西丹沢 | `nishitanzawa-mountbridge`<br>西丹沢マウントブリッジキャンプ場<br>神奈川・西丹沢 | 10.69km | 名前に共通部分「西丹沢」（3文字） |
| 35 | `nishitanzawa-ootaki`<br>西丹沢大滝キャンプ場<br>神奈川・西丹沢 | `mountkan-kannogawa`<br>西丹沢マウントカンキャンプ場<br>神奈川・西丹沢 | 1.96km | 名前に共通部分「西丹沢」（3文字） |
| 36 | `wellcamp-nishitanzawa`<br>ウェルキャンプ西丹沢<br>神奈川・西丹沢 | `nishitanzawa-mountbridge`<br>西丹沢マウントブリッジキャンプ場<br>神奈川・西丹沢 | 12.46km | 名前に共通部分「西丹沢」（3文字） |
| 37 | `kannogawa`<br>神之川キャンプ・マス釣り場<br>神奈川・西丹沢 | `hayatogawa-masu`<br>早戸川国際マス釣場キャンプ場<br>神奈川・宮ヶ瀬 | 7.96km | 名前に共通部分「ます釣」（3文字） |
| 38 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `muraei-yamanakako`<br>村営山中湖キャンプ場<br>山梨・山中湖 | 2.57km | 名前に共通部分「山中湖」（3文字） |
| 39 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `fujinomori-yamanakako`<br>山中湖ふじのもりオートキャンプ場<br>山梨・富士五湖（山中湖） | 4.27km | 名前に共通部分「山中湖」（3文字） |
| 40 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `kirara-yamanakako`<br>山中湖交流プラザきらら<br>山梨・山中湖 | 2.68km | 名前に共通部分「山中湖」（3文字） |
| 41 | `sagamiko-kyuyomura`<br>相模湖休養村キャンプ場<br>神奈川・相模湖 | `sagamiko-camping-village`<br>相模湖キャンピングヴィレッジ<br>神奈川・相模湖 | 2.27km | 名前に共通部分「相模湖」（3文字） |
| 42 | `tanzawako-lodge`<br>丹沢湖ロッヂキャンプ場<br>神奈川・丹沢湖 | `kuragari-camp`<br>丹沢湖キャンプサイト<br>神奈川・丹沢湖 | 2.39km | 名前に共通部分「丹沢湖」（3文字） |
| 43 | `fuji-ymca`<br>富士山YMCAグローバル・エコ・ヴィレッジ<br>静岡・富士宮 | `fujisan-genshijin`<br>富士山オートキャンプ場GENSHIJIN<br>静岡・富士宮 | 3.28km | 名前に共通部分「富士山」（3文字） |
| 44 | `fuji-ymca`<br>富士山YMCAグローバル・エコ・ヴィレッジ<br>静岡・富士宮 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | 2.02km | 名前に共通部分「富士山」（3文字） |
| 45 | `fuji-ymca`<br>富士山YMCAグローバル・エコ・ヴィレッジ<br>静岡・富士宮 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | 7.28km | 名前に共通部分「富士山」（3文字） |
| 46 | `shojiko-camping`<br>精進湖キャンピングコテージ<br>山梨・精進湖 | `shimobe-yurucamp-sato`<br>道の駅しもべ オートキャンプ場〜ゆるキャン△の里〜<br>山梨・身延町 | 8.43km | 名前に共通部分「きゃん」（3文字） |
| 47 | `muraei-yamanakako`<br>村営山中湖キャンプ場<br>山梨・山中湖 | `fujinomori-yamanakako`<br>山中湖ふじのもりオートキャンプ場<br>山梨・富士五湖（山中湖） | 6.22km | 名前に共通部分「山中湖」（3文字） |
| 48 | `muraei-yamanakako`<br>村営山中湖キャンプ場<br>山梨・山中湖 | `yamanakako-minami-auto`<br>山中湖みなみオートキャンプ場<br>山梨・山中湖 | 5.68km | 名前に共通部分「山中湖」（3文字） |
| 49 | `muraei-yamanakako`<br>村営山中湖キャンプ場<br>山梨・山中湖 | `kirara-yamanakako`<br>山中湖交流プラザきらら<br>山梨・山中湖 | 4.97km | 名前に共通部分「山中湖」（3文字） |
| 50 | `kawaguchiko-hanto`<br>河口湖畔キャンプ場<br>山梨・河口湖 | `kawaguchiko-hamanoya-camp`<br>河口湖オートキャンプ場 浜の湯<br>山梨・河口湖 | 2.20km | 名前に共通部分「河口湖」（3文字） |
| 51 | `hadano-togawa-camp`<br>秦野戸川公園キャンプ場<br>神奈川・秦野 | `sanogawa-camp`<br>佐野川河川公園<br>山梨・南部町 | — | 名前に共通部分「川公園」（3文字） |
| 52 | `sagamiko-pleasure-camp`<br>相模湖プレジャーフォレストキャンプ場<br>神奈川・相模湖 | `sagamiko-camping-village`<br>相模湖キャンピングヴィレッジ<br>神奈川・相模湖 | 2.31km | 名前に共通部分「相模湖」（3文字） |
| 53 | `asagiri-greenpark-camp`<br>朝霧高原グリーンパーク<br>静岡・朝霧高原 | `asagiri-foodpark`<br>あさぎりフードパークキャンプ場<br>静岡・朝霧高原 | 3.08km | 名前に共通部分「ぱーく」（3文字） |
| 54 | `folkwood-yatsugatake`<br>FOLKWOOD VILLAGE 八ヶ岳<br>山梨・八ヶ岳・小淵沢 | `yatsugatake-oizumi`<br>八ヶ岳オートキャンプ場大泉<br>山梨・北杜 | 7.29km | 名前に共通部分「八ゖ岳」（3文字） |
| 55 | `fujinomori-yamanakako`<br>山中湖ふじのもりオートキャンプ場<br>山梨・富士五湖（山中湖） | `yamanakako-minami-auto`<br>山中湖みなみオートキャンプ場<br>山梨・山中湖 | 1.29km | 名前に共通部分「山中湖」（3文字） |
| 56 | `fujinomori-yamanakako`<br>山中湖ふじのもりオートキャンプ場<br>山梨・富士五湖（山中湖） | `kirara-yamanakako`<br>山中湖交流プラザきらら<br>山梨・山中湖 | 1.77km | 名前に共通部分「山中湖」（3文字） |
| 57 | `kuragari-camp`<br>丹沢湖キャンプサイト<br>神奈川・丹沢湖 | `tanzawako-roadside-camp`<br>丹沢湖ロッヂ<br>神奈川・丹沢湖 | 3.16km | 名前に共通部分「丹沢湖」（3文字） |
| 58 | `nishiizu-seto`<br>西伊豆せと海岸キャンプ場<br>静岡・西伊豆 | `nishiizu-dogashima-camp`<br>西伊豆堂ヶ島キャンプ場<br>静岡・西伊豆 | 2.64km | 名前に共通部分「西伊豆」（3文字） |
| 59 | `fujisan-genshijin`<br>富士山オートキャンプ場GENSHIJIN<br>静岡・富士宮 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | 9.78km | 名前に共通部分「富士山」（3文字） |
| 60 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | 6.40km | 名前に共通部分「富士山」（3文字） |
| 61 | `nakatsugawa-kasenjiki`<br>中津川河川敷（田代運動公園）<br>神奈川・愛川町 | `sumida-ohashi-kasenjiki`<br>角田大橋河川敷<br>神奈川・愛川町 | 1.13km | 名前に共通部分「河川敷」（3文字） |
| 62 | `nakatsugawa-kasenjiki`<br>中津川河川敷（田代運動公園）<br>神奈川・愛川町 | `hasugebashi-kasenjiki`<br>八菅橋河川敷<br>神奈川・愛川町 | 4.01km | 名前に共通部分「河川敷」（3文字） |
| 63 | `nakatsugawa-kasenjiki`<br>中津川河川敷（田代運動公園）<br>神奈川・愛川町 | `ogurabashi-kasenjiki`<br>小倉橋河川敷<br>神奈川・相模原市緑区 | 7.01km | 名前に共通部分「河川敷」（3文字） |
| 64 | `nakatsugawa-kasenjiki`<br>中津川河川敷（田代運動公園）<br>神奈川・愛川町 | `sanogawa-camp`<br>佐野川河川公園<br>山梨・南部町 | — | 名前に共通部分「川河川」（3文字） |
| 65 | `fukushigawa-auto`<br>福士川オートキャンプ場<br>山梨・南部町 | `nekumasanso-auto`<br>福士川根熊山荘ファミリーオートキャンプ場<br>山梨・南部町 | — | 名前に共通部分「福士川」（3文字） |
| 66 | `asagiri-eichinomori`<br>朝霧高原 英知の杜キャンプ場<br>静岡・朝霧高原 | `urban-camping-asagiri-houzan`<br>アーバンキャンピング朝霧宝山<br>静岡・朝霧高原 | 0.84km | 座標が近接（0.84km） |
| 67 | `asagiri-sorairo`<br>朝霧Camp Base そらいろ<br>静岡・朝霧高原 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | 15.11km | 県をまたぐが15.11kmしか離れていない（県の割り当て誤りの疑い） |
| 68 | `asagiri-sorairo`<br>朝霧Camp Base そらいろ<br>静岡・朝霧高原 | `asagiri-jamboree`<br>朝霧ジャンボリーオートキャンプ場<br>静岡・朝霧高原 | 0.53km | 座標が近接（0.53km） |
| 69 | `asagiri-sorairo`<br>朝霧Camp Base そらいろ<br>静岡・朝霧高原 | `asagiri-greenpark-camp`<br>朝霧高原グリーンパーク<br>静岡・朝霧高原 | 0.48km | 座標が近接（0.48km） |
| 70 | `asagiri-sorairo`<br>朝霧Camp Base そらいろ<br>静岡・朝霧高原 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | 17.70km | 県をまたぐが17.70kmしか離れていない（県の割り当て誤りの疑い） |
| 71 | `motosu-lakeside`<br>本栖レークサイドキャンプ場<br>山梨・本栖湖 | `asagiri-greenpark-camp`<br>朝霧高原グリーンパーク<br>静岡・朝霧高原 | 10.23km | 県をまたぐが10.23kmしか離れていない（県の割り当て誤りの疑い） |
| 72 | `motosu-lakeside`<br>本栖レークサイドキャンプ場<br>山梨・本栖湖 | `asagiri-foodpark`<br>あさぎりフードパークキャンプ場<br>静岡・朝霧高原 | 13.19km | 県をまたぐが13.19kmしか離れていない（県の割り当て誤りの疑い） |
| 73 | `motosu-lakeside`<br>本栖レークサイドキャンプ場<br>山梨・本栖湖 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | 12.66km | 県をまたぐが12.66kmしか離れていない（県の割り当て誤りの疑い） |
| 74 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `fuji-ymca`<br>富士山YMCAグローバル・エコ・ヴィレッジ<br>静岡・富士宮 | 18.68km | 県をまたぐが18.68kmしか離れていない（県の割り当て誤りの疑い） |
| 75 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `fujigane-kogen`<br>富士ヶ嶺高原キャンプ場<br>静岡・富士宮 | 15.53km | 県をまたぐが15.53kmしか離れていない（県の割り当て誤りの疑い） |
| 76 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | 18.05km | 県をまたぐが18.05kmしか離れていない（県の割り当て誤りの疑い） |
| 77 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | 11.65km | 県をまたぐが11.65kmしか離れていない（県の割り当て誤りの疑い） |
| 78 | `wellcamp-nishitanzawa`<br>ウェルキャンプ西丹沢<br>神奈川・西丹沢 | `recamp-fuji-speedway`<br>RECAMP富士スピードウェイ<br>静岡・小山町 | 16.61km | 県をまたぐが16.61kmしか離れていない（県の割り当て誤りの疑い） |
| 79 | `asagiri-jamboree`<br>朝霧ジャンボリーオートキャンプ場<br>静岡・朝霧高原 | `shojiko-camping`<br>精進湖キャンピングコテージ<br>山梨・精進湖 | 12.09km | 県をまたぐが12.09kmしか離れていない（県の割り当て誤りの疑い） |
| 80 | `asagiri-jamboree`<br>朝霧ジャンボリーオートキャンプ場<br>静岡・朝霧高原 | `retreat-camp-mahoroba`<br>リトリートキャンプまほろば<br>山梨・河口湖 | 19.46km | 県をまたぐが19.46kmしか離れていない（県の割り当て誤りの疑い） |
| 81 | `asagiri-jamboree`<br>朝霧ジャンボリーオートキャンプ場<br>静岡・朝霧高原 | `shimobe-yurucamp-sato`<br>道の駅しもべ オートキャンプ場〜ゆるキャン△の里〜<br>山梨・身延町 | 11.52km | 県をまたぐが11.52kmしか離れていない（県の割り当て誤りの疑い） |
| 82 | `asagiri-jamboree`<br>朝霧ジャンボリーオートキャンプ場<br>静岡・朝霧高原 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | 16.45km | 県をまたぐが16.45kmしか離れていない（県の割り当て誤りの疑い） |
| 83 | `pica-omotefuji`<br>PICA表富士<br>静岡・富士山南麓 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | 19.69km | 県をまたぐが19.69kmしか離れていない（県の割り当て誤りの疑い） |
| 84 | `onoji-family`<br>大野路ファミリーキャンプ場<br>静岡・裾野 | `oyama-kogen-camp`<br>大野山高原キャンプ場<br>神奈川・山北 | 19.07km | 県をまたぐが19.07kmしか離れていない（県の割り当て誤りの疑い） |
| 85 | `fujigane-kogen`<br>富士ヶ嶺高原キャンプ場<br>静岡・富士宮 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | 17.34km | 県をまたぐが17.34kmしか離れていない（県の割り当て誤りの疑い） |
| 86 | `fujigane-kogen`<br>富士ヶ嶺高原キャンプ場<br>静岡・富士宮 | `fuji-midori-kyuka-auto`<br>富士緑の休暇村オートキャンプ場<br>山梨・富士河口湖町 | 17.53km | 県をまたぐが17.53kmしか離れていない（県の割り当て誤りの疑い） |
| 87 | `kiyosato-oka`<br>清里丘の公園キャンプ場<br>山梨・清里 | `kiyosato-chuo-auto`<br>清里中央オートキャンプ場<br>山梨・清里 | 0.82km | 座標が近接（0.82km） |
| 88 | `kiyosato-oka`<br>清里丘の公園キャンプ場<br>山梨・清里 | `makiba-kogen-camp`<br>まきば公園キャンプ場<br>山梨・清里 | 0.60km | 座標が近接（0.60km） |
| 89 | `doshi-keikoku`<br>道志渓谷キャンプ場<br>山梨・道志村 | `doshi-no-yu-camp`<br>道志の湯キャンプ場<br>神奈川・道志川 | 1.74km | 県をまたぐが1.74kmしか離れていない（県の割り当て誤りの疑い） |
| 90 | `woodsman-camp`<br>WOODSMAN CAMP<br>山梨・道志村 | `pica-sagamiko`<br>PICAさがみ湖<br>神奈川・相模湖 | 8.32km | 県をまたぐが8.32kmしか離れていない（県の割り当て誤りの疑い） |
| 91 | `hidamari-yamakita`<br>ひだまりの里キャンプ場<br>神奈川・山北 | `momijino-sato`<br>もみじの里オートキャンプ場<br>山梨・道志村 | 15.33km | 県をまたぐが15.33kmしか離れていない（県の割り当て誤りの疑い） |
| 92 | `hidamari-yamakita`<br>ひだまりの里キャンプ場<br>神奈川・山北 | `takaranoyama-fureai`<br>宝の山ふれあいの里キャンプ場<br>山梨・都留市 | 19.87km | 県をまたぐが19.87kmしか離れていない（県の割り当て誤りの疑い） |
| 93 | `doshi-no-yu-camp`<br>道志の湯キャンプ場<br>神奈川・道志川 | `doshigawa-kanko-noen`<br>道志村観光農園オートキャンプ場<br>山梨・道志村 | 15.31km | 県をまたぐが15.31kmしか離れていない（県の割り当て誤りの疑い） |
| 94 | `doshi-no-yu-camp`<br>道志の湯キャンプ場<br>神奈川・道志川 | `doshi-fureainomori`<br>道志ふれあいの森キャンプ場<br>山梨・道志村 | 5.26km | 県をまたぐが5.26kmしか離れていない（県の割り当て誤りの疑い） |
| 95 | `doshi-no-yu-camp`<br>道志の湯キャンプ場<br>神奈川・道志川 | `doshi-minamoto-camp`<br>道志みなもとキャンプ<br>山梨・道志村 | 17.73km | 県をまたぐが17.73kmしか離れていない（県の割り当て誤りの疑い） |
| 96 | `doshi-no-yu-camp`<br>道志の湯キャンプ場<br>神奈川・道志川 | `doshi-mori-cottage`<br>道志・森のコテージ<br>山梨・道志村 | 13.60km | 県をまたぐが13.60kmしか離れていない（県の割り当て誤りの疑い） |
| 97 | `kabutomushi-mori-camp`<br>かぶと虫の森キャンプ場<br>神奈川・相模原 | `doshi-fureainomori`<br>道志ふれあいの森キャンプ場<br>山梨・道志村 | 15.71km | 県をまたぐが15.71kmしか離れていない（県の割り当て誤りの疑い） |
| 98 | `yadoriki-camp`<br>やどりき水源林キャンプ場<br>神奈川・秦野 | `suigennnomori`<br>水源の森キャンプランド<br>山梨・道志村 | 15.02km | 県をまたぐが15.02kmしか離れていない（県の割り当て誤りの疑い） |
| 99 | `pica-fuji-greenpa`<br>PICA富士ぐりんぱ<br>静岡・裾野 | `fujigoko-auto-camp`<br>富士五湖オートキャンプ場<br>山梨・山中湖 | 16.77km | 県をまたぐが16.77kmしか離れていない（県の割り当て誤りの疑い） |
| 100 | `fujikawa-camp`<br>富士川キャンプ場<br>静岡・富士 | `fukushigawa-auto`<br>福士川オートキャンプ場<br>山梨・南部町 | 13.65km | 県をまたぐが13.65kmしか離れていない（県の割り当て誤りの疑い） |
| 101 | `asagiri-greenpark-camp`<br>朝霧高原グリーンパーク<br>静岡・朝霧高原 | `retreat-camp-mahoroba`<br>リトリートキャンプまほろば<br>山梨・河口湖 | 19.50km | 県をまたぐが19.50kmしか離れていない（県の割り当て誤りの疑い） |
| 102 | `asagiri-greenpark-camp`<br>朝霧高原グリーンパーク<br>静岡・朝霧高原 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | 16.26km | 県をまたぐが16.26kmしか離れていない（県の割り当て誤りの疑い） |
| 103 | `pica-fujiyama-camp`<br>PICA Fujiyama<br>山梨・河口湖 | `recamp-fuji-speedway`<br>RECAMP富士スピードウェイ<br>静岡・小山町 | 18.50km | 県をまたぐが18.50kmしか離れていない（県の割り当て誤りの疑い） |
| 104 | `fujigoko-auto-camp`<br>富士五湖オートキャンプ場<br>山梨・山中湖 | `recamp-fuji-speedway`<br>RECAMP富士スピードウェイ<br>静岡・小山町 | 8.46km | 県をまたぐが8.46kmしか離れていない（県の割り当て誤りの疑い） |
| 105 | `minoishtaki`<br>みの石滝キャンプ場<br>神奈川・相模湖 | `nagomino-sato-tsuru`<br>和みの里オートキャンプ場<br>山梨・都留市 | 18.91km | 県をまたぐが18.91kmしか離れていない（県の割り当て誤りの疑い） |
| 106 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | 19.18km | 県をまたぐが19.18kmしか離れていない（県の割り当て誤りの疑い） |
| 107 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | `sports-train-aokigahara`<br>SPORTS TRAIN<br>山梨・富士河口湖町 | 18.25km | 県をまたぐが18.25kmしか離れていない（県の割り当て誤りの疑い） |
| 108 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | `fuji-midori-kyuka-auto`<br>富士緑の休暇村オートキャンプ場<br>山梨・富士河口湖町 | 19.82km | 県をまたぐが19.82kmしか離れていない（県の割り当て誤りの疑い） |
| 109 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | `fujimangan-village`<br>富士満願ビレッジファミリーキャンプ場<br>山梨・鳴沢村 | 13.11km | 県をまたぐが13.11kmしか離れていない（県の割り当て誤りの疑い） |
| 110 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | `fuji-midori-kyuka-auto`<br>富士緑の休暇村オートキャンプ場<br>山梨・富士河口湖町 | 13.50km | 県をまたぐが13.50kmしか離れていない（県の割り当て誤りの疑い） |
| 111 | `urban-camping-asagiri-houzan`<br>アーバンキャンピング朝霧宝山<br>静岡・朝霧高原 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | 0.85km | 座標が近接（0.85km） |
| 112 | `pica-fuji-saiko`<br>PICA富士西湖<br>山梨・西湖 | `sports-train-aokigahara`<br>SPORTS TRAIN<br>山梨・富士河口湖町 | 0.21km | 座標が近接（0.21km） |
| 113 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `komeidoso-auto`<br>湖明荘オートキャンプ場<br>山梨・山中湖 | 0.56km | 座標が近接（0.56km） |
| 114 | `yamanakako-misaki`<br>sotosotodays 山中湖みさき<br>山梨・山中湖 | `fujigoko-auto-camp`<br>富士五湖オートキャンプ場<br>山梨・山中湖 | 0.92km | 座標が近接（0.92km） |
| 115 | `nishitanzawa-mountbridge`<br>西丹沢マウントブリッジキャンプ場<br>神奈川・西丹沢 | `mitsumata-camp`<br>みつまたキャンプ場<br>神奈川・西丹沢 | 0.69km | 座標が近接（0.69km） |
| 116 | `suigennnomori`<br>水源の森キャンプランド<br>山梨・道志村 | `momijino-sato`<br>もみじの里オートキャンプ場<br>山梨・道志村 | 0.82km | 座標が近接（0.82km） |
| 117 | `suigennnomori`<br>水源の森キャンプランド<br>山梨・道志村 | `doshi-mori-cottage`<br>道志・森のコテージ<br>山梨・道志村 | 0.92km | 座標が近接（0.92km） |
| 118 | `izukogen-granpal-camp`<br>伊豆グランパル公園キャンプ場<br>静岡・伊東 | `omuroyama-camp`<br>伊東市青少年キャンプ場<br>静岡・伊東市 | 0.89km | 座標が近接（0.89km） |
| 119 | `turkeys-house`<br>ターキーズハウス 江ノ電に泊まれるキャンプ場<br>山梨・南部町 | `lumberjack-nanbu`<br>ランバージャック<br>山梨・南部町 | 0.79km | 座標が近接（0.79km） |
| 120 | `norolodge`<br>青野原野呂ロッジキャンプ場<br>神奈川・道志川 | `shindo`<br>新戸キャンプ場<br>神奈川・道志川 | 0.38km | 座標が近接（0.38km） |
| 121 | `tanukiko`<br>田貫湖キャンプ場<br>静岡・朝霧高原 | `asagiri-foodpark`<br>あさぎりフードパークキャンプ場<br>静岡・朝霧高原 | 0.68km | 座標が近接（0.68km） |
| 122 | `tanukiko`<br>田貫湖キャンプ場<br>静岡・朝霧高原 | `granpapa-solo-bocchi`<br>富士山GranPapaソロぼっち区画サイト<br>静岡・富士宮 | 0.80km | 座標が近接（0.80km） |
| 123 | `shindo`<br>新戸キャンプ場<br>神奈川・道志川 | `aonohara-auto`<br>青野原オートキャンプ場<br>神奈川・道志川 | 0.30km | 座標が近接（0.30km） |
| 124 | `kannogawa`<br>神之川キャンプ・マス釣り場<br>神奈川・西丹沢 | `tsukiyono-doshi-camp`<br>月夜野キャンプ場<br>山梨・道志村 | 0.57km | 座標が近接（0.57km） |
| 125 | `tsubakiso-auto`<br>椿荘オートキャンプ場<br>山梨・道志村 | `konomasawa-camp`<br>このまさわキャンプ場<br>神奈川・道志川 | 0.89km | 座標が近接（0.89km） |
| 126 | `sankoso-auto`<br>山光荘オートキャンプ場<br>山梨・道志村 | `konomasawa-camp`<br>このまさわキャンプ場<br>神奈川・道志川 | 0.44km | 座標が近接（0.44km） |
| 127 | `izu-kakure-auto`<br>伊豆隠れオートキャンプ場<br>静岡・伊豆 | `nishi-amagi-kogen`<br>西天城高原牧場のキャンプ場<br>静岡・伊豆 | 0.82km | 座標が近接（0.82km） |
| 128 | `kiyosato-chuo-auto`<br>清里中央オートキャンプ場<br>山梨・清里 | `makiba-kogen-camp`<br>まきば公園キャンプ場<br>山梨・清里 | 0.62km | 座標が近接（0.62km） |
| 129 | `suigennnomori`<br>水源の森キャンプランド<br>山梨・道志村 | `yamaboshi-camp`<br>キャンプ村やまぼうし<br>山梨・道志村 | 0.80km | 座標が近接（0.80km） |
| 130 | `minoishtaki`<br>みの石滝キャンプ場<br>神奈川・相模湖 | `akiyamagawa-camp`<br>秋山川キャンプ場<br>神奈川・相模原・秋山 | 0.86km | 座標が近接（0.86km） |
| 131 | `minoishtaki`<br>みの石滝キャンプ場<br>神奈川・相模湖 | `sagamiko-camping-village`<br>相模湖キャンピングヴィレッジ<br>神奈川・相模湖 | 0.73km | 座標が近接（0.73km） |
| 132 | `oishii-camp`<br>おいしいキャンプ場<br>山梨・富士河口湖町富士ヶ嶺 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | 0.32km | 座標が近接（0.32km） |
| 133 | `akiyamagawa-camp`<br>秋山川キャンプ場<br>神奈川・相模原・秋山 | `sagamiko-camping-village`<br>相模湖キャンピングヴィレッジ<br>神奈川・相模湖 | 0.87km | 座標が近接（0.87km） |
