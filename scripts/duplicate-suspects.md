# 二重登録の疑いがあるペア

対象: 座標未確定のまま残っている **28件**（auto で候補が出た分は除外）

総当たり 378 ペアを比較し、**6ペア**を抽出。

判定基準: 名称の類似（正規化＋編集距離） / 名前の共通部分3文字以上かつ20km以内 / 座標が1km以内 / 県をまたぐのに近接

※ 判定のみ。data/campgrounds.json は変更していない。

| # | A | B | 距離 | 疑いの根拠 |
| --- | --- | --- | --- | --- |
| 1 | `doshi-fureainomori`<br>道志ふれあいの森キャンプ場<br>山梨・道志村 | `shiroyama-fureainosato`<br>城山ふれあいの里<br>神奈川・津久井湖 | 16.37km | 名前に共通部分「ふれあいの」（5文字）<br>県をまたぐが16.37kmしか離れていない（県の割り当て誤りの疑い） |
| 2 | `shiroyama-fureainosato`<br>城山ふれあいの里<br>神奈川・津久井湖 | `takaranoyama-fureai`<br>宝の山ふれあいの里キャンプ場<br>山梨・都留市 | 32.07km | 名称類似（編集距離2） |
| 3 | `doshi-fureainomori`<br>道志ふれあいの森キャンプ場<br>山梨・道志村 | `takaranoyama-fureai`<br>宝の山ふれあいの里キャンプ場<br>山梨・都留市 | 15.94km | 名前に共通部分「ふれあいの」（5文字） |
| 4 | `ogurabashi-kasenjiki`<br>小倉橋河川敷<br>神奈川・相模原市緑区 | `takadabashi-kasenjiki`<br>高田橋河川敷<br>神奈川・相模原市中央区 | — | 名前に共通部分「橋河川敷」（4文字） |
| 5 | `nishiizu-seto`<br>西伊豆せと海岸キャンプ場<br>静岡・西伊豆 | `nishiizu-dogashima-camp`<br>西伊豆堂ヶ島キャンプ場<br>静岡・西伊豆 | 2.64km | 名前に共通部分「西伊豆」（3文字） |
| 6 | `fuji-international-camp`<br>富士山国際キャンプ場<br>静岡・富士宮 | `fuji-midori-kyuka-auto`<br>富士緑の休暇村オートキャンプ場<br>山梨・富士河口湖町 | 13.50km | 県をまたぐが13.50kmしか離れていない（県の割り当て誤りの疑い） |
