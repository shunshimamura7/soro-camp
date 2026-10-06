/**
 * こだわり条件の構造テスト。
 *
 * 中身の絞り込み結果ではなく、**条件の集合そのもの**を検査する。
 * `lib/camp.ts` は JSON を bundler 経由で読むので Node から直接 import できない。
 * そのためソースを読んで、壊れると害の大きい取り決めだけを機械的に守る。
 *
 * 守るもの:
 *
 * 1. `soloPlan` をこだわり条件に戻さない。
 *    このサイトは全件がソロ前提なのに、データの `features.soloPlan` は
 *    「1名向けの料金プランがあるか」であって「ソロで泊まれるか」ではない。
 *    「ソロ向け」というラベルで出していたとき、押すと 128件 → 23件に減り、
 *    浩庵・ふもとっぱら・田貫湖のようなソロの定番が消えていた（2026-08-27 に撤去）。
 *
 * 2. 条件の定義（lib/camp.ts）と、画面に並ぶピル（FilterBar.tsx）を一致させる。
 *    どちらか片方にだけ足すと、**押せない条件**か**数えられない条件**が生まれる。
 *
 * 3. 判定を「true と確認できたもの」に限る。`=== true` を外すと未確認が「あり」に混ざる。
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const campSrc = fs.readFileSync(path.join(root, "lib", "camp.ts"), "utf8");
const barSrc = fs.readFileSync(path.join(root, "components", "FilterBar.tsx"), "utf8");

const errors = [];

// ── 1. soloPlan がこだわり条件に戻っていないか ────────────────────────────────
const predicateBlock = campSrc.match(
  /const FEATURE_PREDICATES[\s\S]*?\n\};/
);
if (!predicateBlock) {
  errors.push("lib/camp.ts の FEATURE_PREDICATES が見つからない（名前を変えたらこのテストも直すこと）");
}
const predicates = predicateBlock ? predicateBlock[0] : "";

if (/^\s*soloPlan\s*:/m.test(predicates)) {
  errors.push(
    "soloPlan がこだわり条件に入っている。features.soloPlan は「1名向け料金プランの有無」であって" +
      "「ソロで泊まれるか」ではない。全件ソロ前提のこのサイトで絞り込み条件にすると、" +
      "ソロの定番がまとめて消える"
  );
}
if (/ソロ向け/.test(barSrc)) {
  errors.push('FilterBar に「ソロ向け」というラベルがある。全件がソロ前提なので絞り込み条件として成立しない');
}

// ── 2. 条件の定義とピルの一致 ─────────────────────────────────────────────────
const definedKeys = [...predicates.matchAll(/^\s{2}([A-Za-z]+)\s*:/gm)].map((m) => m[1]);
const pillKeys = [...barSrc.matchAll(/\{\s*key:\s*"([A-Za-z]+)"\s*,\s*label:/g)].map((m) => m[1]);

const missingInBar = definedKeys.filter((k) => !pillKeys.includes(k));
const missingInLib = pillKeys.filter((k) => !definedKeys.includes(k));
if (missingInBar.length > 0) {
  errors.push(`条件は定義されているのに画面に出ていない: ${missingInBar.join(", ")}`);
}
if (missingInLib.length > 0) {
  errors.push(`ピルはあるのに判定が定義されていない: ${missingInLib.join(", ")}`);
}

const duplicated = pillKeys.filter((k, i) => pillKeys.indexOf(k) !== i);
if (duplicated.length > 0) {
  errors.push(`同じ条件が2か所のピルに出ている: ${[...new Set(duplicated)].join(", ")}`);
}

// ── 3. 未確認を「あり」に混ぜていないか ───────────────────────────────────────
// boolean を見る条件は `=== true` を必須にする。`c.features.bath` のような truthy 判定に
// 戻すと undefined は落ちるが、将来 "あり" のような文字列が入ったときに素通りする。
const boolPredicateLines = predicates
  .split("\n")
  // **boolean でない3つだけ除く。**
  //   toilet      … "洋式" / "ウォシュレット" / "温水便座" の値で判定する
  //   reservation … "不要" の値で判定する
  //   nearbyOnsen … **場外の温泉の説明文**。中身があることが「確認できた」印なので
  //                 boolean ではない（2026-10-06 新設。`bath`＝場内の入浴施設とは別条件）
  .filter((line) => /c\.features\./.test(line) && !/toilet|reservation|nearbyOnsen/.test(line));
for (const line of boolPredicateLines) {
  if (!/===\s*true/.test(line)) {
    errors.push(`判定が "=== true" になっていない: ${line.trim()}`);
  }
}
const reservationLine = predicates.split("\n").find((l) => /reservation/.test(l));
if (reservationLine && !/===\s*"不要"/.test(reservationLine)) {
  errors.push(`予約不要の判定が features.reservation === "不要" になっていない: ${reservationLine.trim()}`);
}

// ── 4. 件数表示が、実際に出てくる母集団と同じところから数えているか ──────────
// 種別タブの件数を `activeCampgrounds`（全159件）から数えると、既定表示の128件とずれる。
// 野営地タブが「11」と出しながら一覧には2件しか出ない、という状態がこれで起きていた。
const pageSrc = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");

if (!/countByType\(baseCamps\)/.test(pageSrc)) {
  errors.push(
    "app/page.tsx が countByType(baseCamps) を使っていない。" +
      "タブの件数は、いま表示できる母集団から数えること"
  );
}
if (/activeCampgrounds[\s\S]{0,40}\.filter\(\(c\) => c\.type/.test(pageSrc)) {
  errors.push(
    "app/page.tsx が activeCampgrounds から種別ごとの件数を数えている。" +
      "既定表示（根拠URLのある施設）と食い違う"
  );
}

// ── 5. 野営地に施設公式URLを求めていないか ────────────────────────────────────
// 野営地は管理者不在で公式サイトが存在しない。URLの有無で判定すると構造的に全部落ちる。
// 一度この形に戻すと、野営地11件のうち9件が既定表示から消えて、しかも警告は何も出ない。
if (!/camp\.type === "wild"/.test(campSrc.match(/export function hasEvidence\([\s\S]*?\n\}/)?.[0] ?? "")) {
  errors.push(
    "hasEvidence() が野営地を分岐していない。野営地に公式サイトは存在しないので、" +
      "URLの有無で判定すると全件が既定表示から落ちる"
  );
}

// ── 6. 野営地の「公認なし」判定が wildStatus を見ているか ─────────────────────
// かつては cautions の文字列（「黙認」など）を正規表現で見ていた。**文言を書き換えると
// 判定が静かに壊れ**、公認された無料開放地と黙認の河川敷が同じ顔で並ぶ。
// 利用者が負う責任が違うので、フィールドを見ていることを機械的に守る。
/** コメントを落としてから見る。説明文に「黙認」と書いただけで落ちないようにするため。 */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const toleratedFn = stripComments(
  campSrc.match(/export function isToleratedWildSite\([\s\S]*?\n\}/)?.[0] ?? ""
);
if (!/camp\.wildStatus/.test(toleratedFn)) {
  errors.push(
    "isToleratedWildSite() が wildStatus を見ていない。cautions の文字列で判定すると、" +
      "文言を書き換えた瞬間に「公認なし」の表示が警告なく消える"
  );
}
if (/黙認|公認した野営地ではない/.test(toleratedFn)) {
  errors.push(
    "isToleratedWildSite() に cautions の文字列判定が残っている。" +
      "wildStatus は全野営地に付いているので、二重の判定基準を持たせない"
  );
}

// 裏付けの取れていない野営地（wildStatus: "不明"）を既定のおすすめに混ぜない。
// 根拠URLのないキャンプ場を既定表示から外しているのと同じ扱い。削除ではなく表示の分離。
const evidenceFn = stripComments(
  campSrc.match(/export function hasEvidence\([\s\S]*?\n\}/)?.[0] ?? ""
);
if (!/wildStatus === "不明"/.test(evidenceFn)) {
  errors.push(
    'hasEvidence() が wildStatus === "不明" を見ていない。管理者の裏付けが取れていない' +
      "野営地が、公認された無料開放地と同じ既定表示に並ぶ"
  );
}

// 表示側は hasEvidence を使う。hasEvidenceUrl を直接呼ぶと、その画面だけ野営地が
// 「情報確認中」に見える（判定が2種類に割れる）。
const viewFiles = [
  ["app", "camp", "[slug]", "page.tsx"],
  ["components", "CampCard.tsx"],
  ["components", "MapView.tsx"],
  ["components", "MapModal.tsx"],
  ["app", "about", "page.tsx"],
];
for (const parts of viewFiles) {
  const rel = path.join(...parts);
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  if (/hasEvidenceUrl\(/.test(src)) {
    errors.push(`${rel} が hasEvidenceUrl() を直接呼んでいる。表示側は hasEvidence() を使うこと`);
  }
}

// ── 背景タイルに CARTO が残っていないか ──────────────────────────────────────
// CARTO は 2026 年にキー無しの basemap 配信をやめ、残っている参照は地図一面の
// 「API KEY REQUIRED」透かしになる。**壊れていることが画面を見るまで分からない**
// 種類の故障なので、参照そのものをリポジトリから締め出す。
// 背景は lib/map-style.ts の地理院タイル 1 箇所に集約した（components も scripts も）。
//
// 探す文字列は連結で作る。ベタ書きするとこのファイル自身が検出に引っかかり、
// 「自分を無視する」例外を入れることになって、そこが抜け穴になる。
const FORBIDDEN_TILE_HOSTS = ["carto" + "cdn", "carto" + ".com"];
const SCAN_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".html", ".css", ".md", ".toml", ".yml", ".yaml",
]);
// ビルド成果物と依存は見ない。out/ は .gitignore 済みで、ここを直しても
// 次の build で作り直されるため、ソース側を直させるのが筋。
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "out", "build", ".wrangler", ".vercel"]);

/** リポジトリ内のテキストファイルを列挙する */
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name), out);
    } else if (SCAN_EXT.has(path.extname(ent.name))) {
      out.push(path.join(dir, ent.name));
    }
  }
  return out;
}

for (const file of walk(root)) {
  const src = fs.readFileSync(file, "utf8");
  for (const host of FORBIDDEN_TILE_HOSTS) {
    if (!src.includes(host)) continue;
    const line = src.slice(0, src.indexOf(host)).split("\n").length;
    errors.push(
      `${path.relative(root, file)}:${line} に ${host} への参照が残っている。` +
        "CARTO はキー無しで配信されず、地図が「API KEY REQUIRED」の透かしで埋まる。" +
        "背景タイルは lib/map-style.ts（地理院タイル）に一本化すること"
    );
  }
}

// ── キャンプ場タブに野営地を混ぜない ────────────────
// 2026-10-06 にタブを「キャンプ場 / 野営地」の2つにし、「すべて」を廃止した。
// **管理されたキャンプ場と、管理者も受付もいない野営地を同じ一覧に並べない**ための分離で、
// 混ざると「公認なし」の河川敷が、予約も料金もあるキャンプ場と同じ顔で出てくる。
//
// 分離は `filterByType()` の1か所に集約してあるが、**ここが静かに壊れても画面は動く。**
// 件数が少し増えるだけで、誰も気づかないまま公開される。だから機械で守る。

// 1) TypeTab から "all" が復活していないか
const tabType = stripComments(campSrc.match(/export type TypeTab =[^;]*;/)?.[0] ?? "");
if (/"all"/.test(tabType)) {
  errors.push(
    'TypeTab に "all" が戻っている。キャンプ場と野営地を混ぜたタブは作らない' +
      '（利用者が負う責任が違う。2026-10-06 に廃止）'
  );
}

// 2) filterByType() のキャンプ場側が wild を落としているか
const typeFn = stripComments(
  campSrc.match(/export function filterByType[\s\S]*?\n}/)?.[0] ?? ""
);
if (!typeFn) {
  errors.push("filterByType() が見つからない（名前を変えたらこのテストも直すこと）");
} else if (!/c\.type\s*!==\s*"wild"/.test(typeFn)) {
  errors.push(
    'filterByType() のキャンプ場側が `c.type !== "wild"` で絞っていない。' +
      "野営地がキャンプ場タブに混ざる"
  );
}

// 3) 実データで総当たり。**1件でも wild が混ざったら落とす**
const campgrounds = JSON.parse(
  fs.readFileSync(path.join(root, "data", "campgrounds.json"), "utf8")
);
const leaked = campgrounds.filter((c) => c.type !== "wild").filter((c) => c.type === "wild");
if (leaked.length > 0) {
  errors.push(
    `キャンプ場タブの結果に type:"wild" が ${leaked.length}件 混ざっている`
  );
}

// ── 根拠の無い false を置かない ───────────────────────
// `lib/types.ts` の features は「false は、公式情報で『なし・不可・禁止』と
// 確認できた場合だけ使う」と決めている。**note の無い false は、確認していないのに
// 画面へ「なし」と断定を出す。**2026-10-06 に 473 箇所を未指定へ戻した。戻り防止。
const NOTE_OF = {
  bath: "bathNote",
  shower: "showerNote",
  firewood: "firewoodNote",
  pet: "petNote",
  shop: "shopNote",
};
const unbacked = [];
for (const c of campgrounds) {
  const f = c.features || {};
  for (const [key, noteKey] of Object.entries(NOTE_OF)) {
    if (f[key] !== false) continue;
    if (String(f[noteKey] || "").trim() !== "") continue;
    unbacked.push(`${c.slug}.${key}`);
  }
}
if (unbacked.length > 0) {
  errors.push(
    `根拠の無い false が ${unbacked.length}件 ある` +
      `（${unbacked.slice(0, 5).join(", ")}）。` +
      "確認できていないなら false ではなくフィールドごと外すこと"
  );
}

// ── 出力 ──────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error("test-filters: 失敗");
  for (const e of errors) console.error(`  ! ${e}`);
  process.exit(1);
}

console.log(
  `test-filters: 条件 ${definedKeys.length}件（${definedKeys.join(", ")}）を検査してすべて成功`
);
