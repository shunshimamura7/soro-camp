# officialUrl 死活チェック（2026-08）

`node scripts/check-official-urls.js` の出力。**このスクリプトはデータを書き換えない。**
中身の精査と `campgrounds.json` への反映は人がやる。

対象: `status === 'active'` の **168件**。
**`lastVerified` や `priceVerified` が新しいことを除外条件にしていない**（引き継ぎ §6-1）。

同時実行 3 / リクエストの開始間隔 1000ms / タイムアウト 10秒 / リダイレクト追跡あり。

## 集計

| 判定 | 件数 | 意味 |
|---|---|---|
| **DEAD** | **3** | DNS解決失敗 / 接続不能 / タイムアウト / 4xx / 5xx |
| **PARKED** | **0** | 到達するが、ドメイン失効・売却・停止の定型文がある |
| **CLOSED_HINT** | **4** | 本文に閉業・閉鎖・営業終了・廃止・当面の間休業・閉館がある |
| NO_URL | 89 | `officialUrl` が空 |
| OK | 72 | 上記のどれでもない |

## 読むときの注意

- **403 / 429 は 4xx なので DEAD になるが、多くはボット遮断でサイト自体は生きている。**
  evidence 列にその旨を出してある。まずそこを疑うこと。
- **CLOSED_HINT は素朴な文字列一致なので誤検出が多い。**
  「本日の営業終了時刻」「直火は禁止」「旧町名を廃止」などが引っかかる。
  **必ず evidence の前後を読んでから判断する。**
- **OK は「営業している」の証明ではない。** JS でしか描画しないサイトは本文が空に近く、
  閉業の告知があっても拾えない。そういう行は evidence に「本文がほぼ空」と出してある。
- **`takaranoyama-fureai` は、この検査では見つけられなかった型。**
  公式サイトは生きていて料金ページも通常どおりだが、`/news/` に閉館告知があった。
  **トップページだけでは分からない。**

## DEAD（3件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
| 箱根園オートキャンプ場 | `hakonesono-auto` | <https://www.princehotels.co.jp/hakonesono/camp/> | 404 | HTTP 404 |
| PICA富士ぐりんぱ | `pica-fuji-greenpa` | <https://www.pica-resort.jp/greenpa/> | 404 | HTTP 404 |
| 滝沢園キャンプ場 | `takizawaso` | <https://www.takizawaso.com/> | — | DNS解決失敗（ENOTFOUND） |

## PARKED（0件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
| （なし） | | | | |

## CLOSED_HINT（4件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
| 朝霧高原 英知の杜キャンプ場 | `asagiri-eichinomori` | <https://www.bt-r.jp/aec/> | 200 | 「閉鎖」… 日前からキャンセル料金が発生いたします。 台風直撃等、当キャンプ場の判断で施設を閉鎖する場合を除き、お客様のいかなる理由でもキャンセルの場合は、ご利用7日前からサイ |
| 本栖レークサイドキャンプ場 | `motosu-lakeside` | <https://motosulakeside.com/> | 200 | 「閉鎖」… 合は警察に対応いただく場合もありますので、あらかじめご了承ください。 夜間ゲート閉鎖について 当キャンプ場では、防犯上の観点から、また夜間に静かにお過ごしいただくた |
| 天子の森オートキャンプ場 | `tenshino-mori-camp` | <https://tenshinomori.net/> | 200 | 「営業終了」… 1-23日、11月22-24日、12月26-31日 2026年 1月1-3日、本営業終了(FINAL) ご予約について ご予約の無い平日は、作業の為電話に出られない場合 |
| ウェルキャンプ西丹沢 | `wellcamp-nishitanzawa` | <https://well-camp.com/> | 200 | 「廃止」… 約束ごとを良くお読みになってからお越しください。 お知らせ ： ドッグシャワーが廃止になりました。 （2024/07/19） ご予約空き状況はこちら でご確認いただ |

## NO_URL（89件）

`officialUrl` が無いので死活を確かめようがない。
§6-9 のとおり、`officialUrl` の欠落自体が「調べていない」の指標になりうる。

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
| 北杜市明野ふれあいの里キャンプ場 | `akeno-fureai-camp` | — | — | — |
| 天城高原キャンプ場 | `amagi-kogen` | — | — | — |
| 青野原オートキャンプ場 | `aonohara-auto` | — | — | — |
| 朝霧高原グリーンパーク | `asagiri-greenpark-camp` | — | — | — |
| 長者屋敷キャンプ場 | `chojayashiki-camp` | — | — | — |
| だるま山高原キャンプ場 | `darumayama-kogen` | — | — | — |
| 道志渓谷キャンプ場 | `doshi-keikoku` | — | — | — |
| 道志の湯キャンプ場 | `doshi-no-yu-camp` | — | — | — |
| 道志川観光農園オートキャンプ場 | `doshigawa-kanko-noen` | — | — | — |
| 富士緑の休暇村オートキャンプ場 | `fuji-midori-kyuka-auto` | — | — | — |
| 富士山YMCAグローバル・エコ・ヴィレッジ | `fuji-ymca` | — | — | — |
| 富士五湖オートキャンプ場 | `fujigoko-auto-camp` | — | — | — |
| 富士川キャンプ場 | `fujikawa-camp` | — | — | — |
| 福士川オートキャンプ場 | `fukushigawa-auto` | — | — | — |
| 秦野戸川公園キャンプ場 | `hadano-togawa-camp` | — | — | — |
| 白州・尾白の森キャンプ場 | `hakushu-ojiro-camp` | — | — | — |
| 浜名湖ガーデンパークキャンプ場 | `hamanako-garden-camp` | — | — | — |
| 浜岡砂丘キャンプ場 | `hamaoka-sakyuu-camp` | — | — | — |
| 八菅橋河川敷 | `hasugebashi-kasenjiki` | — | — | — |
| HAYATO 箱根キャンプ場 | `hayato-hakone` | — | — | — |
| ひだまりの里キャンプ場 | `hidamari-yamakita` | — | — | — |
| 蓬莱橋キャンプ場 | `horaibashi-camp` | — | — | — |
| 池の谷ファミリーキャンプ場 | `ikenoya-family` | — | — | — |
| 伊豆隠れオートキャンプ場 | `izu-kakure-auto` | — | — | — |
| 伊豆高原オートキャンプ場 | `izukogen-auto` | — | — | — |
| かぶと虫の森キャンプ場 | `kabutomushi-mori-camp` | — | — | — |
| 上大島キャンプ場 | `kamioshima-camp` | — | — | — |
| 唐沢キャンプ場 | `karasawa-miyagase` | — | — | — |
| 河口湖オートキャンプ場 浜の湯 | `kawaguchiko-hamanoya-camp` | — | — | — |
| 河口湖畔キャンプ場 | `kawaguchiko-hanto` | — | — | — |
| 河津七滝オートキャンプ場 | `kawazu-nanadaru` | — | — | — |
| 清里丘の公園キャンプ場 | `kiyosato-oka` | — | — | — |
| 小淵沢オートキャンプ場 | `kobuchizawa-auto-camp` | — | — | — |
| 甲府市 森林浴広場 | `kofu-shinrinyoku-hiroba` | — | — | — |
| キャンプ場此処野静岡 | `kokono-shizuoka` | — | — | — |
| 湖明荘オートキャンプ場 | `komeidoso-auto` | — | — | — |
| 雲見オートキャンプ場 | `kumomi-auto` | — | — | — |
| magic hour | `magic-hour-camp` | — | — | — |
| 牧丘フルーツ村キャンプ場 | `makioka-fruits-camp` | — | — | — |
| 三ヶ木キャンプ場 | `mikagi-camp` | — | — | — |
| 南伊豆キャンピングテラス | `minamiizu-camping-terrace` | — | — | — |
| みつまたキャンプ場 | `mitsumata-camp` | — | — | — |
| 宮ヶ瀬ヴィレッジキャンプ場 | `miyagase-village` | — | — | — |
| モビリティーパーク | `mobility-park-izu` | — | — | — |
| 本栖湖キャンプ場 | `motosu-shore-camp` | — | — | — |
| 村営山中湖キャンプ場 | `muraei-yamanakako` | — | — | — |
| 虫沢古道キャンプ場 | `mushizawa-camp` | — | — | — |
| 都留戸沢の森 和みの里キャンプ場 | `nagomino-sato-tsuru` | — | — | — |
| 中田島砂丘キャンプ場 | `nakatajima-sakyuu-camp` | — | — | — |
| 中津川河川敷（田代運動公園） | `nakatsugawa-kasenjiki` | — | — | — |
| なみのこ村 | `naminokomura` | — | — | — |
| 七沢キャンプ場 | `nanasawa-camp` | — | — | — |
| 猫越岳キャンプ場 | `nekokodake-camp` | — | — | — |
| 西天城高原牧場のキャンプ場 | `nishi-amagi-kogen` | — | — | — |
| 西丹沢マウントブリッジキャンプ場 | `nishitanzawa-mountbridge` | — | — | — |
| 西里キャンプ適地 | `nishizato-camp-tekichi` | — | — | — |
| 小倉橋河川敷 | `ogurabashi-kasenjiki` | — | — | — |
| 大磯ロングビーチキャンプサイト | `oiso-longbeach` | — | — | — |
| 奥大井湖上キャンプ場 | `okooigawa-lake` | — | — | — |
| 奥道志オートキャンプ場 | `okudoshi-auto` | — | — | — |
| 奥牧野キャンプ場 | `okumakino-camp` | — | — | — |
| 大野路ファミリーキャンプ場 | `onoji-family` | — | — | — |
| 大瀬崎キャンプ場 | `osezaki-camp` | — | — | — |
| 忍野八海オートキャンプ場 | `oshino-hakkai-camp` | — | — | — |
| リトリートキャンプまほろば | `retreat-camp-mahoroba` | — | — | — |
| リッチランドキャンプ場 | `richland-kiyokawa` | — | — | — |
| 竜洋海洋公園オートキャンプ場 | `ryuyo-marine` | — | — | — |
| 相模湖休養村キャンプ場 | `sagamiko-kyuyomura` | — | — | — |
| 相模湖プレジャーフォレストキャンプ場 | `sagamiko-pleasure-camp` | — | — | — |
| 山光荘オートキャンプ場 | `sankoso-auto` | — | — | — |
| 接岨YANBY OUTDOOR FIELD | `sessokyo-camp` | — | — | — |
| 静波海岸キャンプサイト | `shizunami-beach-camp` | — | — | — |
| 精進湖キャンピングコテージ | `shojiko-camping` | — | — | — |
| 昇仙峡オートキャンプ場 | `shosenkyo-auto-camp` | — | — | — |
| 修善寺虹の郷キャンプ場 | `shuzenji-nijinokuni-camp` | — | — | — |
| 寸又峡温泉キャンプ場 | `sumatakyo-camp` | — | — | — |
| 角田大橋河川敷 | `sumida-ohashi-kasenjiki` | — | — | — |
| 高田橋多目的広場 | `takadabashi-kasenjiki` | — | — | — |
| 武川郷キャンプ場 | `takegawa-kyo-camp` | — | — | — |
| とやの沢キャンプ場 | `toyanosawa` | — | — | — |
| 椿荘オートキャンプ場 | `tsubakiso-auto` | — | — | — |
| 土村キャンプ場 | `tsuchimura` | — | — | — |
| 月夜野キャンプ場 | `tsukiyono-doshi-camp` | — | — | — |
| 和田長浜海岸 | `wadanagahama-kaigan` | — | — | — |
| ウエストリバーオートキャンプ場 | `westriver-auto-camp` | — | — | — |
| WOODSMAN CAMP | `woodsman-camp` | — | — | — |
| やどりき水源林キャンプ場 | `yadoriki-camp` | — | — | — |
| 山北キャンプ場 | `yamakita-camp` | — | — | — |
| 谷太郎キャンプ場 | `yataro-camp` | — | — | — |

## OK（72件）

| 施設名 | slug | URL | HTTP | evidence |
|---|---|---|---|---|
| 秋山川キャンプ場 | `akiyamagawa-camp` | <http://www.akikawaya.co.jp/> | 200 | — |
| 青根キャンプ場 | `aone` | <https://aonecamp.jp/> | 200 | — |
| アプトいちしろキャンプ場 | `apt-ichishiro` | <https://abt-camp.shizu.website/> | 200 | — |
| AFPオートキャンプ場（スタイルキャビンあさぎり） | `asagiri-foodpark` | <https://asagiri-foodpark.com/afp.html> | 200 | — |
| 朝霧ジャンボリーオートキャンプ場 | `asagiri-jamboree` | <https://asagiri-camp.net/> | 200 | — |
| 朝霧Camp Base そらいろ | `asagiri-sorairo` | <https://sorairo-camp.jp/> | 200 | — |
| 芦ノ湖キャンプ村 | `ashinoko-camp-mura` | <https://campmura.com/> | 200 | — |
| BUSHCRAFT湘南 | `bushcraft-shonan` | <https://bush-craft.biz/> | 200 | — |
| CAMP AKAIKE | `camp-akaike` | <https://www.camp-akaike.jp/> | 200 | — |
| キャンプベアード | `camp-baird` | <https://bairdbeer.com/> | 200 | 最終URL: https://bairdbeer.com/ja |
| CAMP BEAN | `camp-bean-izu` | <https://www.campbean.jp/> | 200 | — |
| 道志森のコテージ | `doshi-mori-cottage` | <https://doshi-kanko.com/moricote/moricote_ryokin/moricote_ryokin.html> | 200 | — |
| 道志の森キャンプ場 | `doshi-no-mori` | <https://doshinomori.jp/> | 200 | — |
| エコパ伊奈ヶ湖 | `ecopa-inagako` | <https://ecopa-inagako.jp/> | 200 | — |
| 白州・尾白 FLORA Campsite in the Natural Garden | `flora-campsite` | <https://www.floracampsite.com/> | 200 | — |
| FOLKWOOD VILLAGE 八ヶ岳 | `folkwood-yatsugatake` | <https://folkwood-camp.com/> | 200 | 本文がほぼ空（JS描画の可能性。判定の根拠は薄い） |
| 不動の滝自然広場オートキャンプ場 | `fudonotaki-auto` | <https://ffnpcs.com/> | 200 | — |
| 富士満願ビレッジファミリーキャンプ場 | `fujimangan-village` | <https://fuji-manganvillage.com/> | 200 | — |
| 山中湖ふじのもりオートキャンプ場 | `fujinomori-yamanakako` | <https://www.nap-camp.com/yamanashi/14555> | 200 | — |
| 富士山オートキャンプ場GENSHIJIN | `fujisan-genshijin` | <https://genshijin-fujinomiya.com/> | 200 | — |
| 青少年旅行村（キャンプ場） | `fukushigawa-seishonen` | <https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html> | 200 | — |
| ふもとっぱらキャンプ場 | `fumotoppara` | <https://fumotoppara.net/> | 200 | — |
| ガンダーラ真鶴シーサイドキャンプ場 | `gandahara-manazuru` | <https://gandahara.wixsite.com/mysite> | 200 | — |
| 富士山GranPapaソロぼっち区画サイト | `granpapa-solo-bocchi` | <https://www.gran-papa.com/site/solo/> | 200 | — |
| 蜂花苑 寄・中津川 源流の郷キャンプ場 | `hachibanaen-miroku` | <https://houkaen.jp/> | 200 | — |
| 花の森オートキャンピア | `hananomori-camp` | <https://www.hananomori.jp/> | 200 | — |
| 火剣山キャンプ場 | `hikenkayama` | <https://www.hitsurugi-camp.com/> | 200 | — |
| ほったらかしキャンプ場 | `hottarakashi-camp` | <https://hottarakashicamp.com/> | 200 | — |
| 南アルプス井川オートキャンプ場 | `ikawa-auto` | <https://www.city.shizuoka.lg.jp/shisetsu/s0001021.html> | 200 | — |
| 神之川キャンプ・マス釣り場 | `kannogawa` | <https://kannogawa.jp/> | 200 | — |
| 清里中央オートキャンプ場 | `kiyosato-chuo-auto` | <https://autocamp.co.jp/> | 200 | — |
| このまさわキャンプ場 | `konomasawa-camp` | <https://konomasawacamp.co.jp/> | 200 | — |
| 浩庵キャンプ場 | `kouan-motosuko` | <https://kouan-motosuko.com/> | 200 | — |
| くのわき親水公園キャンプ場 | `kunowaki-shinsui` | <https://www.kunowaki.net/> | 200 | — |
| 丹沢湖キャンプサイト | `kuragari-camp` | <https://tanzawa-camp.sakura.ne.jp/> | 200 | 最終URL: https://tanzawa-camp.sakura.ne.jp/main/index.php |
| 黒川キャンプ場（清水森林公園） | `kurokawa-shizuoka` | <https://www.city.shizuoka.lg.jp/okushizuoka/spot/s000093.html> | 200 | — |
| 御殿場まるびオートキャンプ場 | `marubi-auto` | <https://marubi.main.jp/> | 200 | 本文がほぼ空（JS描画の可能性。判定の根拠は薄い） |
| みの石滝キャンプ場 | `minoishtaki` | <https://camp-minoishi.com/> | 200 | — |
| 三ツ星オートキャンプ場 | `mitsuboshi-auto` | <http://kawanelife.org/camp/> | 200 | — |
| ならここの里キャンプ場 | `narakoko` | <https://www.narakoko.info/> | 200 | — |
| 福士川根熊山荘ファミリーオートキャンプ場 | `nekumasanso-auto` | <https://hukusshigawacamp.eyado.net/> | 200 | — |
| NELO Gotemba | `nelo-gotemba` | <https://challengeoutdoor.co/nelogotemba/> | 200 | — |
| 西丹沢大滝キャンプ場 | `nishitanzawa-ootaki` | <https://ootakicampsite.com/> | 200 | — |
| 青野原野呂ロッジキャンプ場 | `norolodge` | <https://norolodge.com/> | 200 | — |
| 沼津市民の森 | `numazu-shimin-no-mori` | <https://www.city.numazu.shizuoka.jp/kurashi/shisetsu/shiminnomori/> | 200 | — |
| 大柳川渓流キャンプ場 | `ogayanagawa-keikoku` | <https://ooyanagawa-camp.com/> | 200 | — |
| 富士ヶ嶺・おいしいキャンプ場 | `oishii-camp` | <https://oic-camp.com/> | 200 | — |
| 伊東市青少年キャンプ場 | `omuroyama-camp` | <https://www.city.ito.shizuoka.jp/gyosei/soshikikarasagasu/shogaigakushuka/kanko/2379.html> | 200 | — |
| 乙女森林公園第1キャンプ場 | `otome-forest-camp` | <https://www.gotemba-otome.jp/> | 200 | — |
| PICA富士西湖 | `pica-fuji-saiko` | <https://www.pica-resort.jp/saiko/> | 200 | — |
| PICA Fujiyama | `pica-fujiyama-camp` | <https://www.pica-resort.jp/fujiyama/> | 200 | — |
| PICA表富士 | `pica-omotefuji` | <https://www.pica-resort.jp/omotefuji/> | 200 | — |
| PICAさがみ湖 | `pica-sagamiko` | <https://www.sagamiko-resort.jp/camp/> | 200 | — |
| RECAMP富士スピードウェイ | `recamp-fuji-speedway` | <https://www.recamp.co.jp/fujispeedway> | 200 | — |
| 西湖自由キャンプ場 | `saiko-jiyu` | <https://saiko-jiyuu.camp/> | 200 | — |
| 道の駅しもべ オートキャンプ場〜ゆるキャン△の里〜 | `shimobe-yurucamp-sato` | <https://www.michinoeki-shimobe.jp/camp/> | 200 | — |
| 新戸キャンプ場 | `shindo` | <https://www.nap-camp.com/kanagawa/11644> | 200 | — |
| 篠沢大滝キャンプ場 | `shinozawa-ootaki-camp` | <https://shinozawa-ootaki-camp.com/> | 200 | — |
| 水源の森 キャンプ・ランド | `suigennnomori` | <https://www.doshisuigen-mori.com/> | 200 | — |
| 田貫湖キャンプ場 | `tanukiko` | <https://tanukiko.com/> | 200 | — |
| 丹沢湖ロッヂ | `tanzawako-lodge` | <https://tanzawakolodge.com/> | 200 | — |
| TINY CAMP VILLAGE | `tiny-camp-village` | <https://www.tiny-camp-village.com/> | 200 | — |
| ターキーズハウス 江ノ電に泊まれるキャンプ場 | `turkeys-house` | <http://www.turkeyshouse.com/> | 200 | — |
| 宇久須キャンプ場 | `ugusu-camp` | <https://www.nishiizu-kankou.com/stay/ugusucanp> | 200 | — |
| アーバンキャンピング朝霧宝山 | `urban-camping-asagiri-houzan` | <https://urban-camping.jp/> | 200 | — |
| 宇佐美城山公園キャンプ場 | `usami-shiroyama` | <https://www.nap-camp.com/shizuoka/14344> | 200 | — |
| ヴィレッヂ白州 | `village-hakushu` | <https://www.village-hakushu.com/> | 200 | — |
| 八木キャンプ場 | `yagi-camp` | <https://okuooi.gr.jp/contact_camp_yagi/index.php> | 200 | — |
| 山中湖みなみオートキャンプ場 | `yamanakako-minami-auto` | <https://www.minami-camp.com/> | 200 | — |
| sotosotodays 山中湖みさき | `yamanakako-misaki` | <https://camp.sotosotodays.com/yamanakako-misaki/> | 200 | — |
| ちがさき柳島キャンプ場 | `yanagishima` | <https://www.yanagishima-camp.com/> | 200 | — |
| 八ヶ岳オートキャンプ場 | `yatsugatake-oizumi` | <https://www.yatsugatake-autocamp.com/> | 200 | 本文がほぼ空（JS描画の可能性。判定の根拠は薄い） |
