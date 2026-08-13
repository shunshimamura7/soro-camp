/**
 * 日本の住所文字列を突き合わせるための共通処理。
 *
 * `verify-address-gsi.js` と `classify-oaza-miss.js` が同じ処理を別々に持っていたので、
 * ここに集約した。`verify-coords-gsi.js` の市区町村比較もここを使う。
 *
 * ## ⚠ normalize が2種類あるのは意図的
 *
 * 抽出前から**2本のスクリプトは違う normalize を使っていた。**
 * 統合すると挙動が変わるので、**違いを残したまま**別の名前で持っている。
 *
 * | | NFKC | 空白除去 | 大字/字除去 | ダッシュ統一 | 漢数字→算用 |
 * |---|---|---|---|---|---|
 * | `normalizeDashUnified`（`verify-address-gsi.js`） | ○ | ○ | ○ | **○** | × |
 * | `normalizeNumUnified`（`classify-oaza-miss.js`） | ○ | ○ | ○ | × | **○** |
 *
 * **`normalizeDashUnified` のダッシュ統一は既知の不具合を含む。**
 * `[‐‑‒–—―ー−]` を `-` に潰すので、国土地理院が `lv01Nm` に返す「−」（＝大字データが無い印）が
 * `-` になり、`oazaCandidates()` が候補 `['-']` を返す。その結果
 * **address の番地のハイフン（「中川867-7」の `-`）に当たって MATCH になる。**
 * 実測で `nishitanzawa-mountbridge`（9.65km）・`kuragari-camp`（9.32km）・
 * `suigennnomori`（2.19km）の3件が「大字『-』が一致」として MATCH に紛れていた。
 *
 * **ここでは直さない。**引き継ぎ §17-4 の穴2（`lv01Nm` の「−」を自治体内の相対で評価する）
 * の作業で、`oazaCandidates()` 側と合わせて直す。
 * この抽出は「挙動を1文字も変えない」ことを条件にしているため、不具合ごと持ってきている。
 */

/** 漢数字→算用数字。丁目の表記ゆれを吸収するために使う */
const KANJI_NUM = {
  〇: '0', 一: '1', 二: '2', 三: '3', 四: '4', 五: '5',
  六: '6', 七: '7', 八: '8', 九: '9',
};

/**
 * 全角・大字/字・空白などを落として比較しやすくする。**ダッシュを `-` に統一する。**
 * `verify-address-gsi.js` が使っていたもの。上の注意書きを読むこと。
 */
function normalizeDashUnified(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFKC')
    .replace(/[‐‑‒–—―ー−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/大字|字(?=[^\d])/g, '');
}

/**
 * 全角・大字/字・空白を落とし、**漢数字を算用数字に直す。**ダッシュは触らない。
 * `classify-oaza-miss.js` が使っていたもの。
 */
function normalizeNumUnified(s) {
  return String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/大字|字(?=[^\d])/g, '')
    .replace(/[〇一二三四五六七八九]/g, (c) => KANJI_NUM[c] ?? c);
}

/**
 * 国土地理院が「その地点に大字データを持っていない」印として返す値かどうか。
 *
 * 実際に返ってくるのは **U+2212 MINUS SIGN の「−」**。空文字・「なし」も同じ扱いにする。
 * 実在する大字が1〜2文字のダッシュ類だけということはない。
 *
 * **なぜ専用の判定が要るか。**`normalizeDashUnified` はダッシュ類を `-` に統一する。
 * これは address の番地（「中川867‑7」のような異体ハイフン）を揃えるために必要な処理だが、
 * `lv01Nm` の「−」まで `-` になるため、そのまま候補にすると
 * **address の番地のハイフンに当たって「大字が一致した」ことになってしまう。**
 * 実測で `nishitanzawa-mountbridge`（9.65km）・`kuragari-camp`（9.32km）・
 * `suigennnomori`（2.19km）の3件が MATCH に紛れていた（引き継ぎ §17-4-2）。
 *
 * 直す場所を `normalizeDashUnified` 側にしないのは、address のダッシュ統一は正しいから。
 * **壊れているのは「GSI の欠損マーカーを地名として扱っていること」のほう。**
 */
function isLv01Missing(lv01Nm) {
  const s = String(lv01Nm ?? '').normalize('NFKC').replace(/\s+/g, '');
  return s === '' || s === 'なし' || /^[-‐‑‒–—―ー−]+$/.test(s);
}

/**
 * lv01Nm から比較用の候補を作る。
 * 「戸川」はそのまま、「元町一丁目」は「元町1丁目」「元町」も候補にする。
 * 丁目の表記は address 側が「元町1-2-3」のように書くことが多く、そのままでは当たらない。
 *
 * **欠損マーカー（「−」）は候補を返さない。**上の `isLv01Missing` を参照。
 */
function oazaCandidates(lv01Nm) {
  if (isLv01Missing(lv01Nm)) return [];
  const base = normalizeDashUnified(lv01Nm);
  if (!base) return [];
  const set = new Set([base]);
  const arabic = base.replace(/[〇一二三四五六七八九]/g, (c) => KANJI_NUM[c] ?? c);
  set.add(arabic);
  for (const v of [base, arabic]) {
    const stripped = v.replace(/[0-9]+丁目$/, '').replace(/[〇一二三四五六七八九十]+丁目$/, '');
    if (stripped && stripped !== v) set.add(stripped);
  }
  return [...set].filter(Boolean);
}

/**
 * 市区町村名の候補。muni マスタは「南都留郡道志村」のように郡付きで返ることがある。
 * 政令市は「相模原市　緑区」のように全角空白入りで返るが、NFKC＋空白除去で「相模原市緑区」になる。
 */
function cityCandidates(city) {
  const c = normalizeDashUnified(city);
  if (!c) return [];
  const set = new Set([c]);
  const afterGun = c.split('郡').pop();
  if (afterGun && afterGun !== c) set.add(afterGun);
  return [...set].filter(Boolean);
}

/** address から都道府県・市区町村を取り除いた残り（＝大字以降）を返す。cityList は候補の配列 */
function addressRemainder(address, cityList) {
  let rest = normalizeDashUnified(address).replace(/^(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/, '');
  for (const c of cityList) {
    const i = rest.indexOf(c);
    if (i >= 0) {
      rest = rest.slice(i + c.length);
      break;
    }
  }
  return rest;
}

/** address から都道府県・市区町村を落とした残り。city は単一の文字列 */
function remainder(address, city) {
  let rest = normalizeNumUnified(address).replace(/^(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/, '');
  const c = normalizeNumUnified(city);
  const candidates = [c, c.split('郡').pop()].filter(Boolean);
  for (const cand of candidates) {
    const i = rest.indexOf(cand);
    if (i >= 0) return rest.slice(i + cand.length);
  }
  return rest;
}

/** 「長坂町大八田」→「長坂町」。合併市の旧町名の接頭辞を取る。「湖東町」のように後ろが無いものは対象外 */
function chouPrefix(lv01Nm) {
  const m = /^(.+?町)(.+)$/.exec(normalizeNumUnified(lv01Nm));
  return m ? m[1] : null;
}

/** address 残余の先頭の地名部分（数字の手前まで）。「堀山下1513」→「堀山下」 */
function addressOaza(address, city) {
  const rest = remainder(address, city);
  const m = /^([^\d]+)/.exec(rest);
  return m ? m[1].replace(/[（(].*$/, '') : rest;
}

/** 2つの文字列が共有する最長の連続部分の長さ */
function longestCommonSubstring(a, b) {
  if (!a || !b) return 0;
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + best + 1; j <= a.length; j++) {
      const sub = a.slice(i, j);
      if (b.includes(sub)) best = Math.max(best, sub.length);
      else break;
    }
  }
  return best;
}

/** 「神奈川県」「東京都」「大阪府」→「神奈川」「東京」「大阪」 */
function normalizePref(name) {
  return String(name || '').trim().replace(/[県都府]$/, '');
}

module.exports = {
  KANJI_NUM,
  normalizeDashUnified,
  normalizeNumUnified,
  isLv01Missing,
  oazaCandidates,
  cityCandidates,
  addressRemainder,
  remainder,
  chouPrefix,
  addressOaza,
  longestCommonSubstring,
  normalizePref,
};
