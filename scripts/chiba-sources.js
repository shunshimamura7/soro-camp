/**
 * 千葉県のソース定義。**2026-08-16 に sweep へ接続した。**
 *
 * ## なぜ長く定義だけで止めてあったか（経緯。消さないこと）
 *
 * 地区の作り方（19-5 の 案A / 案B / 案C）が未決だったから。
 * 旧 district-sweep は**データにレコードがある大字しか地区にしなかった**ので、
 * レコード0件の大字は測定対象にすらならなかった（既存3県で126件が落ちていた穴）。
 * **千葉は `data/campgrounds.json` にレコードが0件**（2026-08-16 現在も0件。
 * 全188件の内訳は 山梨72 / 静岡61 / 神奈川55）なので、その頃に走らせると
 * **全地区がこの穴に落ちた。**同じ穴を千葉にもう一度掘ることになる。
 *
 * **案Cで地区は `MUNI_SOURCES` のキー由来になり、その前提が消えた。**
 * 接続は `district-sweep.js` の `MUNI_SOURCES` 定義の直後の1行:
 *
 *   Object.assign(MUNI_SOURCES, require('./chiba-sources.js').chibaMuniSources({ jalan, napCamp }));
 *
 * **接続は定義の追加であって実行ではない。**`--all` の対象が 18 → 26 に増えるだけで、
 * 既存18市区町村のソースは1本も変わらない（`.check-chiba-connect.js` で実測）。
 *
 * ## ★ 千葉だけ層が薄い
 *
 * 既存3県は `PREF_SOURCES` に県単位の L3（キャンナビ・ウォーカープラス）が入っているが、
 * **千葉には無い。**L1 + なっぷ + じゃらんだけ。
 * **MISSING が少なく出ても「掲載漏れが少ない」ではなく「見ている層が少ない」。**
 *
 * ## この県で新しいこと（既存18市町村には無かった型）
 *
 * 1. **県の台帳が1本で14市町村にまたがる**（SRC_CHIBA_PREF_SPORTS）。
 *    市町村ごとの L1 ではなく、県全体の L1 を各市町村に配る形になる。
 * 2. **その台帳の住所に市町村名が入っていない。**市町村は別の列（管理主体）にある。
 *    既存の `addressPrefix` はソース単位の定数なので、これには使えない（行ごとに違う）。
 * 3. **管理主体の市町村と施設の所在地が違う行がある。**
 *    習志野市の「富士吉田青年の家キャンプ場」は**山梨県富士吉田市**にある。
 *    県の一覧なのに県外が混ざる。名前でも「キャンプ場」でも落とせない。
 */

'use strict';

/* ── ★ 循環参照を避ける取り方（2026-08-16、接続にあたって変えた）─────────
 *
 * このファイルは `district-sweep.js` のヘルパを使い、
 * 接続後は `district-sweep.js` がこのファイルを require する。**相互参照になる。**
 *
 * Node は循環を検出しても止めず、**まだ組み立て途中の `module.exports`（空のオブジェクト）**
 * を返す。`district-sweep.js` は `module.exports` をファイル末尾で組み立てるので、
 * **上から素直に分割代入すると `helpers` が undefined で落ちる。**
 *
 * 分けて対処する:
 *
 *   - `list` / `address` の中で使うもの（`stripTags` 等）… **遅延**。
 *     取得時にしか呼ばれないので、そのときには揃っている
 *   - `MUNI_SOURCES_CHIBA` を組み立てるのに要るもの（`jalan` / `napCamp`）… **注入**。
 *     定義時に必要なので、`district-sweep.js` 側から渡してもらう（`chibaMuniSources()`）
 *
 * 単体実行（`node scripts/chiba-sources.js`）でも動く。そのときは
 * `district-sweep.js` が先に完全に読み込まれるので、遅延も注入も普通に解決する。
 * ------------------------------------------------------------------------ */
let _sweep = null;
const SW = () => (_sweep || (_sweep = require('./district-sweep.js')));

const stripTags = (...a) => SW().helpers.stripTags(...a);
const cleanText = (...a) => SW().helpers.cleanText(...a);
const tidyAddress = (...a) => SW().helpers.tidyAddress(...a);
const banchiKey = (...a) => SW()._internal.banchiKey(...a);
const splitAddress = (...a) => SW()._internal.splitAddress(...a);
const districtKey = (...a) => SW()._internal.districtKey(...a);

/* ============================================================================
 * L1 — 千葉県公立社会体育施設一覧（キャンプ場）
 * ========================================================================== */

/**
 * 管理主体の列 → 正式な市町村名。
 *
 * **推測で `市` を付けない。**「長南」は長南町であって長南市ではない。
 * ここに無い主体が現れたら住所を作らず `null` を返す（＝ sweep の「住所なし」に出る）。
 * **黙って市を付けて通すより、住所なしで目に付くほうがいい**（§18-3）。
 *
 * 町村は郡から書く。既存データが「足柄上郡山北町中川」の形で持っているため。
 */
const CHIBA_MANAGER_TO_MUNI = {
  千葉: '千葉市',
  習志野: '習志野市',
  船橋: '船橋市',
  市川: '市川市',
  柏: '柏市',
  我孫子: '我孫子市',
  鎌ケ谷: '鎌ケ谷市',
  佐倉: '佐倉市',
  成田: '成田市',
  八街: '八街市',
  旭: '旭市',
  長南: '長生郡長南町',
  南房総: '南房総市',
  富津: '富津市',
};

/** 県の課が持っている行は、所在地の列に市町村名が最初から入っている。 */
const CHIBA_PREF_MANAGER = /^県(\s|$)/;

/**
 * 千葉県公立社会体育施設一覧・キャンプ場（令和5年4月1日現在）。
 *
 * ## kind は listInline
 *
 * **詳細ページが1枚も無い。**1枚の表に 名称・所在地・規模・連絡先・電話 まで全部入っている。
 * 一覧に名前と住所が両方あるので `listInline`（`listDetail` にすると踏む先が無い）。
 * 既存で同じ型なのは大月市公式（SRC_OTSUKI_CITY）とキャンナビ／ウォーカープラス。
 *
 * ## layer は L1（ただし神奈川県公式は L2 にしてある。理由は下）
 *
 * ヘッダの定義は「L1 一次 自治体公式・観光協会・都道府県オープンデータ」。
 * 神奈川県公式の県央ページ（SRC_KANAGAWA_KENOU）は **L2** にしてあるが、
 * あれは**観光紹介の記事**でリンク集が主体だった。こちらは
 * **社会体育施設の台帳**（施設種別・規模・バリアフリー対応まで列がある行政データ）で、
 * オープンデータ側に寄っている。だから L1 で登録する。
 * **これは可逆な判断。**L2 に落としても定義の他の部分は変わらない。
 *
 * ## 網羅率の性格 — 公営しか載らない
 *
 * 「公立社会体育施設」の台帳なので、**民間キャンプ場は原理的に1件も載らない。**
 * 実測21行はすべて公営。だから
 * **この L1 は「網羅率が高い」ではなく「公営に対して網羅的」**と読むこと。
 * 逆に言うと、じゃらんが取りこぼす公営をここが拾う（2026-08-15 実測で
 * 鴨川市・大多喜町はじゃらん g2_04 が0件だが、内浦山県民の森・大多喜県民の森はここに載っている）。
 *
 * ## 住所の作り方（この県だけの特殊処理）
 *
 * 所在地の列は市町村名を省いている（「緑区小食土町955」「大神保町594」）。
 * 市町村は1列目の管理主体から来る。**ただし県の課が主体の行だけは所在地に市町村が入っている。**
 * さらに、管理主体の市町村と所在地が食い違う行（＝県外・域外の施設）は落とす。
 *
 * ## 更新頻度
 *
 * URL に `/r5/` が入っている（令和5年4月1日現在）。
 * **年度が変わると URL ごと変わる型。**`check-muni-sources.js` が 404 を拾ったら
 * `/r6/` `/r7/` を探すこと。ハードコードは必ず腐る（§18-3）。
 *
 * ## ★ 台帳の番地は当てにならない（2026-08-15 実測）
 *
 * 「自治体公式の台帳だから住所も正しい」わけではない。**同じ千葉県の中で食い違う。**
 *
 *   大多喜県民の森 … 台帳 `大多喜486-1`   / **森林課のページは `大多喜486-21`**
 *   富津市民の森   … 台帳 `豊岡2948-16`  / **富津市公式は `豊岡2785番地1`**
 *
 * 台帳は令和5年4月1日現在で、施設所管課のページのほうが新しい。
 * **幸いどちらも大字は同じ（大多喜／豊岡）なので地区キーは変わらない。**
 * 番地は §6-16 のとおり地区の同定に使わないので、いまの使い方なら実害は無い。
 * **ただし番地キーでの突き合わせには効く。**この台帳の番地を正解として扱わないこと。
 */
const SRC_CHIBA_PREF_SPORTS = {
  id: 'pref-chiba-sports',
  layer: 'L1',
  kind: 'listInline',
  label: '千葉県 公立社会体育施設一覧・キャンプ場（令和5年4月1日現在）',
  note:
    '公営のみ（民間は原理的に載らない）。実測21行 → 県外1行を落として20行 / 14市町村にまたがる。' +
    '住所は管理主体の列から市町村を補って作る',
  pages: ['https://www.pref.chiba.lg.jp/shousupo/sports-shisetsu/r5/11campjo.html'],
  list(html) {
    const out = [];
    const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbody) return out;
    for (const row of tbody[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []) {
      const tds = (row.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []).map(stripTags);
      if (tds.length < 4) continue;
      const [manager, facility, name, where] = tds;
      // 施設の列で切る。将来この表に体育館やプールが混ざっても名前で判定しない
      if (facility !== 'キャンプ場') continue;
      if (!name) continue;

      let address = null;
      if (CHIBA_PREF_MANAGER.test(manager)) {
        // 県の課が主体。所在地に市町村が入っている
        address = where ? tidyAddress('千葉県' + where) : null;
      } else {
        const muni = CHIBA_MANAGER_TO_MUNI[manager];
        if (muni && where) {
          const bare = muni.replace(/^.+郡/, '');   // 「長生郡長南町」→「長南町」
          if (where.startsWith(bare)) {
            // すでに市町村名が入っている行（将来の表記ゆれ）。二重に付けない
            address = tidyAddress('千葉県' + where);
          } else if (/^.{1,4}市/.test(where)) {
            // **管理主体の市町村と所在地が食い違う行を落とす。**
            // 習志野市の「富士吉田青年の家キャンプ場」は山梨県富士吉田市にある。
            //
            // 判定を「市」で終わる先頭だけに限るのが肝。`[市町村]` まで広げると
            // **大字の「富浦町多田良」「大神保町594」が市町村名に見えて全部落ちる**
            // （最初にこれを踏んだ）。大字が「市」で終わることはまず無いが、
            // 「町」で終わる大字はいくらでもある。
            // 限界: 主体が市で所在地が県内の別の**町**、という行は拾えない。
            // その型が出たら住所が壊れた地区として md に出るので、そこで気付く
            continue;
          } else {
            address = tidyAddress('千葉県' + muni + where);
          }
        }
        // muni が引けなければ address は null のまま。
        // **名前だけ通して「住所なし」として目に付かせる**（黙って落とさない）
      }
      out.push({ name: cleanText(name), address, url: null });
    }
    return out;
  },
};

/* ============================================================================
 * L1 — 南房総市観光協会
 * ========================================================================== */

/**
 * 南房総市観光協会「南房総でキャンプをしよう！」。
 *
 * ## kind は listInline
 *
 * カードに 業態・名前・住所（県名から番地まで）が全部入っている。
 * 詳細ページ（`member_NNN.html`）も存在して `<dt>住所</dt><dd>` を持っているが、
 * **一覧の住所のほうが番地まで細かい**ことがある
 * （多田良北浜: 一覧「富浦町多田良」/ 詳細も「富浦町多田良」、
 *  大房岬: 一覧「富浦町多田良1212-29」）。踏みに行く理由が無いので `listInline`。
 *
 * ## ★ このページの本体は民宿一覧。区間で切らないと山中湖村の再現になる
 *
 * 1ページに会員カードが **48枚**ある。内訳（2026-08-15 実測）:
 *
 *   「キャンプ関連施設一覧」        …  7枚 ← **これだけが欲しい**
 *   「バーベキューのできる宿泊施設一覧」… 41枚（BBQ ができるだけの民宿。キャンプ場ではない）
 *
 * **区間で切らずに取ると 48件中41件が民宿**（混入85%）。
 * 山中湖村観光協会の混入56%（§6-24 / l1-audit）を超える。
 * 見出しのテキストで区間を切ってから抽出する。
 *
 * ## 業態フィールドは記録するが、採否には使わない
 *
 * カードに `<div class="member_area"><div>泊まる &gt; キャンプ・グランピング</div>` がある。
 * **機械で読める業態がある**のは既存18市町村に無かった良い条件だが、
 * **これで絞ると本命が落ちる。**キャンプ区間7枚の業態内訳:
 *
 *   キャンプ・グランピング 3 … 大房岬 / 根本マリン / 多田良北浜
 *   貸別荘                 2 … 千倉オレンジセンター（オレンジ村オートキャンプ場）/ THE CHIKURA UMI BASE CAMP
 *   旅館                   1 … しおさいキャンプフィールド
 *   ペンション             1 … SOUTH BIRD INN（Camp Ground 併設）
 *
 * 業態で切ると 7→3 になり、**オートキャンプ場を名乗っている施設を落とす。**
 * 亀見橋バカンス村（名前で切ると落ちる）と同じ型が、こんどは業態で起きる。
 * **区間が採否のフィルタ、業態は参考値。**
 */
const SRC_MINAMIBOSO_KANKO = {
  id: 'cm-boso',
  layer: 'L1',
  kind: 'listInline',
  label: '南房総市観光協会 南房総でキャンプをしよう！（キャンプ関連施設一覧）',
  note:
    '1ページに会員カード48枚。「キャンプ関連施設一覧」の区間7枚だけを取る。' +
    '区間で切らないと41枚の BBQ 民宿が混ざる（混入85%）',
  pages: ['https://www.cm-boso.com/camp.html'],
  list(html) {
    // **見出しのテキストで区間を切る。**バイト位置は次の更新で必ずずれる
    const begin = html.indexOf('キャンプ関連施設一覧');
    const end = html.indexOf('バーベキューのできる宿泊施設一覧');
    if (begin < 0) return [];   // 見出しが変わったら0件。**黙って全件返さない**
    const scope = html.slice(begin, end > begin ? end : undefined);

    const out = [];
    // カード1枚 = member_area（業態）→ h2（名前）→ 住所
    const re =
      /<div class="member_area">\s*<div>([\s\S]*?)<\/div>[\s\S]{0,400}?<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]{0,600}?<span class="bold">住所\s*<\/span>([^<]+)</g;
    let m;
    while ((m = re.exec(scope))) {
      out.push({
        name: cleanText(stripTags(m[2])),
        address: tidyAddress(m[3]),
        url: null,
        // 業態は判定に使わないが、l1-audit で人が見るために残す
        category: cleanText(stripTags(m[1])),
      });
    }
    return out;
  },
};

/* ============================================================================
 * L1 — 君津市公式「きみつの観光情報」
 * ========================================================================== */

/**
 * 君津市公式のキャンプ場一覧。
 *
 * ## ★ 前回「一覧が無い」と書いたのは誤り（2026-08-15 訂正）
 *
 * 一覧は**ある**。ただし置き場所が「泊る」ではなく **「遊ぶ・体験」** の下。
 * 前回は「泊る」の下位分類（ホテル・ペンション/旅館/貸別荘/グランピング/温泉）に
 * キャンプ場が無いことと、観光トップ・エリア別一覧に「キャンプ」の語が0回だったことから
 * `l1NotFound` と書いたが、**`2201.html` を開いていなかった。**
 * 「泊まる」しか見ないと落ちる型なので、新しい自治体サイトでは
 * **「遊ぶ」「体験」「レジャー」まで開くこと。**
 *
 * ## kind は listDetail
 *
 * 一覧はサムネイル＋施設名だけ。住所は詳細ページの
 * `<th scope="row">住所</th><td>` にある。電話・駐車場・宿泊施設・定休日まで表で持っている。
 *
 * ## 区間で切る（cm-boso と同じ）
 *
 * `2201.html` は「遊ぶ・体験」の総合ページで、**ゴルフ場9・釣り船11・観光農園4**などが同居する。
 * 区間で切らないと全部混ざる。幸い `<h2><strong>キャンプ場</strong></h2>` という
 * 見出しがあるので、そこから次の `<h2>`（観光農園）までを取る。**実測14件。**
 *
 * ## ★ 区間の外に2件こぼれる（これは承知の上）
 *
 * **清和県民の森**と**奥米・木村農園**は「キャンプ場」ではなく **「その他」** の区間にいる。
 * 区間で切ると**この2件は取れない。**
 * それでも区間で切るのは、「その他」に 日本製鉄・自動車教習所・スーパー銭湯が混ざっていて、
 * 本文判定（`CAMP_BODY_RE`）を足しても ロマンの森共和国 のような境界例が残るから。
 * **清和県民の森は県台帳（L1-a）が拾うので二重の穴にはならない。奥米はどこも拾わない。**
 *
 * ## 住所のふりがな括弧に注意
 *
 * 千石台の住所は `君津市黄和田畑(きわだはた)2245-16`。
 * **括弧が数字の前に入るので `banchiKey` が null になる**（`[（(].*$` で番地ごと消える）。
 * かなだけの括弧は住所を組む時点で落とす。
 */
const SRC_KIMITSU_CITY = {
  id: 'kimitsu-city',
  layer: 'L1',
  kind: 'listDetail',
  label: '君津市公式 きみつの観光情報「遊ぶ・体験」内のキャンプ場一覧',
  note:
    '一覧は「泊る」ではなく「遊ぶ・体験」(2201.html) の下。実測14件。' +
    '清和県民の森・奥米/木村農園は「その他」の区間なので取れない',
  pages: ['https://www.city.kimitsu.lg.jp/site/kanko/2201.html'],
  list(html) {
    const begin = html.indexOf('<h2><strong>キャンプ場</strong></h2>');
    if (begin < 0) return [];       // 見出しが変わったら0件。**全件返さない**
    const rest = html.slice(begin + 10);
    const end = rest.indexOf('<h2>');
    const scope = rest.slice(0, end > 0 ? end : undefined);

    const seen = new Map();
    for (const m of scope.matchAll(/<a\s+href="(\/site\/kanko\/\d+\.html)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const name = cleanText(stripTags(m[2]));
      if (!name) continue;          // 画像だけのリンク
      if (!seen.has(m[1])) seen.set(m[1], name);
    }
    return [...seen].map(([p, name]) => ({ name, url: 'https://www.city.kimitsu.lg.jp' + p }));
  },
  address(html) {
    const m = html.match(/<th[^>]*scope="row"[^>]*>\s*住所\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/);
    if (!m) return null;
    let a = stripTags(m[1]);
    // **ふりがなの括弧を先に落とす。**`黄和田畑(きわだはた)2245-16` の括弧を残すと
    // banchiKey が `[（(].*$` で番地ごと捨てて null になる
    a = a.replace(/[（(][ぁ-んァ-ヶー\s]+[）)]/g, '');
    // **番地の区切りが `&minus;` で書かれているページがある**（オートキャンプ七里川
    // `黄和田畑969&minus;1` / レイクサイド亀山 `川俣旧押込68&minus;3`）。
    // `decodeEntities` は拾わないので、実体参照のまま `banchiKey` に渡ると
    // `969` までしか読めず `-1` が落ちる。全角ダッシュ類もここで揃える
    a = a.replace(/&minus;/g, '-').replace(/[‐‑‒–—―ー−－]/g, '-');
    // 郵便番号は tidyAddress も剥がすが、**全角ダッシュだと `\d{3}-?\d{4}` に当たらない。**
    // 上でダッシュを揃えたあとに、県名の前に付いている形（`299-1115 千葉県…`）も剥がす
    a = a.replace(/^〒?\s*\d{3}-?\d{4}\s*/, '');
    a = tidyAddress(a);
    if (!a) return null;
    return /^千葉県/.test(a) ? a : '千葉県' + a;   // 市公式は県名を書かない
  },
};

/* ============================================================================
 * 市区町村ごとの登録
 *
 * **対象市町村はまだ決めていない。**ここに並べたのは候補であって決定ではない。
 * 選定の判断材料は `chiba-precheck-2026-08.md` と `chiba-candidates2-precheck-2026-08.md`。
 * ========================================================================== */

/** 県の台帳は1本で14市町村にまたがるので、各市町村に同じ定義を配る。 */
const PREF_L1 = SRC_CHIBA_PREF_SPORTS;

/**
 * 千葉の市町村ソースを組み立てる。
 *
 * **引数で受け取るのは循環参照を避けるため**（上の注釈）。
 * `district-sweep.js` が `MUNI_SOURCES` を定義した直後に呼ぶ。
 *
 *   Object.assign(MUNI_SOURCES, chibaMuniSources({ jalan, napCamp }));
 *
 * 引数を省くと `district-sweep.js` から取る（単体実行・テスト用）。
 */
let _chibaMuni = null;
function chibaMuniSources(injected) {
  if (_chibaMuni) return _chibaMuni;
  const { jalan, napCamp } = injected || SW().helpers;
  _chibaMuni = {
  南房総市: {
    pref: '千葉',
    sources: [
      PREF_L1,
      SRC_MINAMIBOSO_KANKO,
      napCamp('tateyama_minamiboso', 'chiba'),
      jalan('12234', '南房総市'),
    ],
  },

  館山市: {
    pref: '千葉',
    sources: [
      // 県の台帳に館山市の行は無い（0件）。**未登録ではなく0件**なので登録はする
      PREF_L1,
      napCamp('tateyama_minamiboso', 'chiba'),
      jalan('12205', '館山市'),
    ],
    l1NotFound: [
      {
        label: '館山市観光協会（tateyamacity.com）「キャンプ場」カテゴリ',
        reason:
          '**カテゴリとしては存在するのに、施設の住所がどこにも無い。**' +
          '`/camp` に「キャンプ場」カテゴリがあり、詳細（`/archives/2608` お台場海浜庭園など）も生きているが、' +
          '**詳細ページに施設の住所が無く、ページ内で唯一の住所は「館山市北条1879-2」＝観光協会自身の所在地。**' +
          '**ここから住所を取ると §6-16 の借用をこちらから作る**（北杜市観光協会と完全に同じ型）。' +
          '館山市は候補が2件（マリンサイド・キャンプマナビス）あって L1 が1本も無い市なので惜しいが、' +
          '住所が取れない以上 L1 として登録しない',
        checked: ['https://tateyamacity.com/camp', 'https://tateyamacity.com/archives/2608'],
      },
      {
        label: '館山市公式「館山市内にあるキャンプ＆BBQ可能施設」',
        reason:
          '**検索には出るが実物は404**（`/kankominato/page000001_00086.html`、2026-08-15 実測）。' +
          '市公式にキャンプ場一覧があった痕跡はあるが、現行サイトでは辿り着けない。' +
          '**検索結果のURLをそのまま登録しないこと**（内浦山で検索スニペットの料金が誤っていたのと同じ型）。' +
          'checked には**生きている**観光トップを置く',
        checked: ['https://www.city.tateyama.chiba.jp/kankou-bunka/cate000153.html'],
      },
    ],
  },

  君津市: {
    pref: '千葉',
    sources: [
      PREF_L1,
      SRC_KIMITSU_CITY,
      napCamp('kisarazu_kimitsu_uttsu', 'chiba'),
      jalan('12225', '君津市'),
    ],
  },

  富津市: {
    pref: '千葉',
    sources: [
      PREF_L1,
      napCamp('kisarazu_kimitsu_uttsu', 'chiba'),
      jalan('12226', '富津市'),
    ],
  },

  木更津市: {
    pref: '千葉',
    sources: [
      PREF_L1,
      napCamp('kisarazu_kimitsu_uttsu', 'chiba'),
      jalan('12206', '木更津市'),
    ],
  },

  鴨川市: {
    pref: '千葉',
    sources: [
      PREF_L1,
      napCamp('katsuura_kamogawa', 'chiba'),
      jalan('12223', '鴨川市'),
    ],
  },

  大多喜町: {
    pref: '千葉',
    sources: [
      PREF_L1,
      // なっぷに大多喜を含むエリアが無い。勝浦・鴨川が最寄りだが**町を含む保証は無い**
      napCamp('katsuura_kamogawa', 'chiba'),
      jalan('12441', '大多喜町'),
    ],
  },

  鋸南町: {
    pref: '千葉',
    sources: [
      // 県の台帳に鋸南町の行は無い（0件）
      PREF_L1,
      napCamp('tateyama_minamiboso', 'chiba'),
      jalan('12463', '鋸南町'),
    ],
    l1NotFound: [
      {
        label: '鋸南町公式「泊まる > キャンプ」',
        reason:
          '**入口はあるが中身が1件で、しかも住所が無い。**' +
          'カテゴリ（list167-385.html）に載っているのは「佐久間ダムキャンプ場の予約受付について」の1本だけ。' +
          'その詳細（1736.html）は 区画数14・期間5/1〜11/30・事前届出制まで書いてあるのに、' +
          '**キャンプ場の所在地が書かれていない。**' +
          'ページ内で唯一の住所は問い合わせ先「地域振興課農林水産振興室 安房郡鋸南町下佐久間3458番地」＝**役場の住所**で、' +
          '**ここから住所を取ると §6-16 の借用をこちらから作る**（北杜市観光協会と同じ型）。' +
          'なっぷに出ている鋸南ほしふるキャンプ場も載っていない。住所が取れないので L1 として登録しない',
        checked: [
          'https://www.town.kyonan.chiba.jp/site/tourism/list167-385.html',
          'https://www.town.kyonan.chiba.jp/site/tourism/1736.html',
        ],
      },
    ],
  },
  };
  return _chibaMuni;
}

/* ============================================================================
 * オフライン自己検査
 *
 * **ネットを踏まない。**答えが分かっている HTML を通して、抽出器が効いているかだけ見る。
 * `node scripts/chiba-sources.js` で走る。
 * ========================================================================== */

const FIXTURE_PREF = `
<table><thead><tr><th>市町村・管理主体</th></tr></thead><tbody>
 <tr><td>千葉</td><td>キャンプ場</td><td>昭和の森フォレストビレッジ</td><td>緑区小食土町955</td></tr>
 <tr><td>習志野</td><td>キャンプ場</td><td>富士吉田青年の家キャンプ場</td><td>富士吉田市上吉田4443</td></tr>
 <tr><td>船橋</td><td>キャンプ場</td><td>船橋市立大神保青少年キャンプ場</td><td>大神保町594</td></tr>
 <tr><td>南房総</td><td>キャンプ場</td><td>多田良北浜海岸キャンプ場</td><td>富浦町多田良</td></tr>
 <tr><td>長南</td><td>キャンプ場</td><td>長南町野営場</td><td>蔵持1869-1</td></tr>
 <tr><td>県 森林課</td><td>キャンプ場</td><td>内浦山県民の森キャンプ場</td><td>鴨川市内浦3228</td></tr>
 <tr><td>白井</td><td>キャンプ場</td><td>未知の主体キャンプ場</td><td>どこか1-1</td></tr>
 <tr><td>千葉</td><td>体育館</td><td>まぎれこんだ体育館</td><td>緑区どこか2-2</td></tr>
</tbody></table>`;

const FIXTURE_BOSO = `
<h3>キャンプ関連施設一覧</h3>
<div class="member_area"><div>泊まる &gt; 貸別荘</div><div></div></div>
<h2>千倉オレンジセンター（オレンジ村オートキャンプ場）</h2>
<ul><li><span class="bold">住所 </span>千葉県南房総市千倉町久保1494</li></ul>
<div class="member_area"><div>泊まる &gt; キャンプ・グランピング</div><div></div></div>
<h2>南房総市大房岬自然の家キャンプ場</h2>
<ul><li><span class="bold">住所 </span>千葉県南房総市富浦町多田良1212-29</li></ul>
<h3>バーベキューのできる宿泊施設一覧</h3>
<div class="member_area"><div>宿泊</div><div></div></div>
<h2>ベイサイド ごんべえ</h2>
<ul><li><span class="bold">住所 </span>千葉県南房総市久枝769</li></ul>`;

const FIXTURE_KIMITSU_LIST = `
<h2><strong>体験型観光</strong></h2>
<table><tbody><tr><td><p><a href="/site/kanko/76144.html">君津の朝めし</a></p></td></tr></tbody></table>
<h2><strong>キャンプ場</strong></h2>
<table><tbody><tr>
 <td><p><a href="/site/kanko/2169.html"><img alt="稲ヶ崎キャンプ場の写真" src="/x.jpg"><br>
 稲ヶ崎キャンプ場</a><br>水と緑の体験ゾーン</p></td>
 <td><p><a href="/site/kanko/2172.html"><img alt="柿山田の写真" src="/y.jpg"><br>
 柿山田<br>オートキャンプガーデン</a><br>千葉県の大自然を満喫！</p></td>
</tr></tbody></table>
<h2><strong>観光農園</strong></h2>
<table><tbody><tr><td><p><a href="/site/kanko/2141.html">ドリプレ・ローズガーデン</a></p></td></tr></tbody></table>
<h2><strong>その他</strong></h2>
<table><tbody><tr><td><p><a href="/site/kanko/2262.html">清和県民の森</a></p></td></tr></tbody></table>`;

const FIXTURE_KIMITSU_DETAIL_FURIGANA = `
<table><tbody>
<tr><th scope="row" style="width:21%">住所</th><td>君津市黄和田畑(きわだはた)2245-16<a href="http://maps.google.com/x">　地図を表示する</a></td></tr>
<tr><th scope="row" style="width:21%">問い合わせ電話</th><td>0439-39-2743</td></tr>
</tbody></table>`;

const FIXTURE_KIMITSU_DETAIL_PAREN = `
<table><tbody>
<tr><th scope="row" style="width:21%">住所</th><td>君津市豊英660　（清和県民の森管理事務所）<a href="http://maps.google.com/x">地図を表示する</a></td></tr>
</tbody></table>`;

function runChibaSelfTest() {
  const fails = [];
  const eq = (label, got, want) => {
    if (got !== want) fails.push(`${label}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  };

  const pref = SRC_CHIBA_PREF_SPORTS.list(FIXTURE_PREF);
  const byName = Object.fromEntries(pref.map(i => [i.name, i.address]));

  eq('体育館を落とす', pref.some(i => i.name === 'まぎれこんだ体育館'), false);
  eq('県外（富士吉田）を落とす', pref.some(i => /富士吉田/.test(i.name)), false);
  eq('政令市の区', byName['昭和の森フォレストビレッジ'], '千葉県千葉市緑区小食土町955');
  eq('市町村を補う', byName['船橋市立大神保青少年キャンプ場'], '千葉県船橋市大神保町594');
  eq('大字が町で始まる行', byName['多田良北浜海岸キャンプ場'], '千葉県南房総市富浦町多田良');
  eq('町は郡から', byName['長南町野営場'], '千葉県長生郡長南町蔵持1869-1');
  eq('県の課は所在地をそのまま', byName['内浦山県民の森キャンプ場'], '千葉県鴨川市内浦3228');
  eq('未知の主体は住所なしで通す', byName['未知の主体キャンプ場'], null);
  // 8行 − 体育館1 − 県外1 = 6
  eq('残る行数', pref.length, 6);

  const boso = SRC_MINAMIBOSO_KANKO.list(FIXTURE_BOSO);
  eq('区間の外（民宿）を取らない', boso.some(i => i.name === 'ベイサイド ごんべえ'), false);
  eq('区間内の件数', boso.length, 2);
  eq('業態が貸別荘でも取る', boso[0] && boso[0].name, '千倉オレンジセンター（オレンジ村オートキャンプ場）');
  eq('住所', boso[1] && boso[1].address, '千葉県南房総市富浦町多田良1212-29');
  eq('業態を記録している', boso[1] && boso[1].category, '泊まる > キャンプ・グランピング');
  eq('見出しが無ければ0件', SRC_MINAMIBOSO_KANKO.list('<div>なにもない</div>').length, 0);

  const kim = SRC_KIMITSU_CITY.list(FIXTURE_KIMITSU_LIST);
  eq('君津: 区間内だけ', kim.length, 2);
  eq('君津: 体験型観光を取らない', kim.some(i => i.name === '君津の朝めし'), false);
  eq('君津: 観光農園を取らない', kim.some(i => /ドリプレ/.test(i.name)), false);
  // **その他の区間にいる清和県民の森は取れない。**承知の上（県台帳が拾う）
  eq('君津: その他の清和県民の森は取れない', kim.some(i => /清和/.test(i.name)), false);
  eq('君津: br をまたぐ名前', kim[1] && kim[1].name, '柿山田 オートキャンプガーデン');
  eq('君津: URL を絶対化', kim[0] && kim[0].url, 'https://www.city.kimitsu.lg.jp/site/kanko/2169.html');
  eq('君津: 見出しが無ければ0件', SRC_KIMITSU_CITY.list('<div>なにもない</div>').length, 0);

  // 住所: ふりがな括弧を落とさないと banchiKey が null になる
  const aFuri = SRC_KIMITSU_CITY.address(FIXTURE_KIMITSU_DETAIL_FURIGANA);
  eq('君津: ふりがな括弧を落とす', aFuri, '千葉県君津市黄和田畑2245-16');
  eq('君津: 番地キーが立つ', banchiKey(aFuri), '黄和田畑2245-16');
  // 実データで踏んだ2件（カージの杜・オートキャンプ七里川）。
  // カージの杜の生の値は `299ー1115　千葉県君津市馬登729`
  // （〒が無い / 全角ダッシュ / 全角スペース）。**この3つが揃うと郵便番号が剥がれず、
  // 先頭が数字なので県名まで足されて `千葉県299-1115 千葉県…` になった**
  const aPost = SRC_KIMITSU_CITY.address(
    '<table><tbody><tr><th scope="row">住所</th><td>299ー1115　千葉県君津市馬登729</td></tr></tbody></table>');
  eq('君津: 〒なし全角ダッシュの郵便番号を剥がす', aPost, '千葉県君津市馬登729');
  eq('君津: 剥がした結果パースできる', districtKey(aPost), '君津市馬登');
  const aMinus = SRC_KIMITSU_CITY.address(
    '<table><tbody><tr><th scope="row">住所</th><td>君津市黄和田畑969&minus;1</td></tr></tbody></table>');
  eq('君津: &minus; を番地の区切りに直す', banchiKey(aMinus), '黄和田畑969-1');

  const aParen = SRC_KIMITSU_CITY.address(FIXTURE_KIMITSU_DETAIL_PAREN);
  eq('君津: 「地図を表示する」を落とす', /地図/.test(aParen), false);
  eq('君津: 大字が取れる', splitAddress(aParen).oaza, '豊英');

  return fails;
}

module.exports = {
  chibaMuniSources,
  /** @deprecated 互換のため。接続側は chibaMuniSources() を使う */
  get MUNI_SOURCES_CHIBA() { return chibaMuniSources(); },
  SRC_CHIBA_PREF_SPORTS,
  SRC_MINAMIBOSO_KANKO,
  SRC_KIMITSU_CITY,
  CHIBA_MANAGER_TO_MUNI,
  runChibaSelfTest,
};

if (require.main === module) {
  const fails = runChibaSelfTest();
  if (fails.length) {
    console.log('自己検査 NG');
    fails.forEach(f => console.log('  ✗ ' + f));
    process.exitCode = 1;
  } else {
    console.log('自己検査 OK（千葉のソース定義。**sweep に接続済み**。走らせるのは --district で別途）');
  }
}
