import type { Campground } from "./types";
import data from "../data/campgrounds.json";

export const campgrounds: Campground[] = data as Campground[];

/**
 * 一覧・地図・件数表示に使う「掲載中」の施設。
 *
 * status が 'active' でないもの（閉鎖・営業状況未確認）は訪問を勧めてはいけないので
 * 一覧から外す。ただし既存リンク対策として詳細ページとサイトマップは残すため、
 * そちら側は素の `campgrounds` を使うこと。
 */
export const activeCampgrounds: Campground[] = campgrounds.filter(
  (c) => c.status === "active"
);

/**
 * 公式・自治体・予約など、利用者が確認できる根拠URLがレコードにあるか。
 * URLがないことは誤りの証明ではないが、通常のおすすめ表示で強く推さないために分ける。
 */
export function hasEvidenceUrl(camp: Campground): boolean {
  if (camp.officialUrl || camp.reservationUrl) return true;
  if (camp.source?.some((s) => /https?:\/\//.test(s))) return true;
  return camp.cautions?.some((s) => /https?:\/\//.test(s)) ?? false;
}

/**
 * 野営地は「自治体・管理者が黙認しているだけ」の場所を含むか。
 *
 * 野営地の cautions には、調査の結果その場所が公認されていないと分かったものに
 * その旨を書いてある。**表示側でこの区別を落とすと、公認された無料開放地と
 * 黙認されているだけの河川敷が同じ顔で並ぶ。**利用者が負う責任が違うので必ず出す。
 *
 * 判定を1か所に集約しているのは、カード・詳細・地図で文言や条件がずれないようにするため。
 * 将来 `wildStatus` のようなフィールドを持たせたら、この関数だけ差し替えればよい。
 */
export function isToleratedWildSite(camp: Campground): boolean {
  if (camp.type !== "wild") return false;
  /**
   * `wildStatus` だけを見る。
   *
   * 2026-08-29 まではここで `cautions` の文字列（「黙認」など）を正規表現で見ていた。
   * **文言を書き換えると「公認なし」の表示が静かに消え**、公認された無料開放地と
   * 黙認の河川敷が同じ顔で並んでいた。フィールドに移して固定し、
   * 全野営地に付け終わったので文字列判定は削除した。
   *
   * 付け忘れは `validate-data.js` が「野営地なのに wildStatus が無い」でビルドを止める。
   */
  return camp.wildStatus !== "公認";
}

/**
 * 既定の一覧・地図に出してよいか。
 *
 * ★ **野営地に施設公式URLを求めない。**
 *
 * 野営地は管理者不在の河川敷・海岸・市の無料開放地で、**そもそも公式サイトが存在しない**。
 * URLの有無だけで判定していたため、野営地11件のうち9件が既定表示から落ちていた。
 * 「根拠が無い」のではなく「根拠がURLの形をしていない」だけだった。
 *
 * 代わりに野営地には次を求める。どちらも欠けていると、行き先も注意点も示せない。
 *
 * 1. **場所が特定できていること**（`hasUsableCoord`）。野営地は住所が字までしか無いことが多く、
 *    座標が無いと現地にたどり着けない
 * 2. **現地の制約が3つ以上書かれていること**（`cautions`）。直火の可否・増水・トイレの有無・
 *    ゴミの扱いは、管理者がいない以上こちらが書かなければ誰も伝えない
 *
 * キャンプ場（`type` 未指定を含む）はこれまでどおりURLで判定する。料金と営業状態を
 * 確かめる先が必ず存在するため。
 */
export function hasEvidence(camp: Campground): boolean {
  if (camp.type === "wild") {
    /**
     * 裏付けが取れていない野営地を既定のおすすめに混ぜない。
     * 根拠URLのないキャンプ場を既定表示から外しているのと同じ扱いで、
     * 削除ではなく表示の分離。調べがついたら戻る。
     */
    if (camp.wildStatus === "不明") return false;
    return hasUsableCoord(camp) && (camp.cautions?.length ?? 0) >= 3;
  }
  return hasEvidenceUrl(camp);
}

/** 公開根拠が揃う通常掲載。既存の詳細URLは消さず、一覧の既定おすすめだけを分ける。 */
export const evidenceBackedCampgrounds: Campground[] = activeCampgrounds.filter(hasEvidence);
export const evidencePendingCampgrounds: Campground[] = activeCampgrounds.filter((c) => !hasEvidence(c));

/** 未指定も「未評価」と扱う。置き値の5軸スコアをランキングに使わない。 */
export function hasVerifiedScores(camp: Campground): boolean {
  return camp.scoresVerified === true;
}

/**
 * 地図・座標リンク・構造化データに座標を出してよいか。
 *
 * **地図まわりの「座標を出すか」の判定は、必ずこの1か所を通すこと。**
 * 以前は各所に `c.lat !== 0 && c.lng !== 0` が直書きされていて、
 * 条件を足すと**直し漏れた箇所だけが誤った位置を出し続ける**形だった。
 *
 * 出さないのは2通り。**どちらも「正しい位置が分からない」**という同じ結論になる。
 *
 * 1. `lat/lng` が 0 … **座標をまだ取得していない**（`0,0` はギニア湾沖を指す）
 * 2. `needsCoord: true` … **入っている座標が誤りと分かっている**が、差し替える値が無い
 *
 * **2 を data 側で 0 に潰さない理由**は `lib/types.ts` の `needsCoord` に書いてある
 * ——「未取得」と「誤りと判明」を区別できなくなるため。
 * **データは誤った値を保持したまま、表示だけ止める。**
 *
 * ★ **誤りと確定した座標は、正しい値が無くても残さない。**
 * **正しい値が無いことより、間違った値が出ていることのほうが害が大きい。**
 * （`mobility-park-izu` は逆ジオが函南町を返し address と 10.6km ずれていた。2026-08-18）
 */
export function hasUsableCoord(c: Pick<Campground, "lat" | "lng" | "needsCoord">): boolean {
  return c.lat !== 0 && c.lng !== 0 && c.needsCoord !== true;
}

/**
 * ソロ適性スコア。静けさと絶景を2倍で重み付けし、小数第1位に丸める。
 *
 *   (静けさ*2 + 絶景*2 + コスパ + アクセス + 設備) / 7
 *
 * 以前は JSON に soloScore を持たせていたが、scores と食い違っても
 * 気づけないため計算に統一した（JSON からフィールドは削除済み）。
 *
 * 料金が未確認（`priceVerified !== true`）の施設は、コスパを判定する根拠が無い。
 * その場合だけ `scores.value` の代わりに中立値の 3 を使う。
 *
 * コスパを分母から外す（4軸で /6 にする）方式は採らない。残り4軸の平均が
 * 暗黙に代入される形になり、value が平均より低い未確認施設ほど順位が上がってしまう。
 * 実データで試すと、上位20件に入る未確認施設が2件から10件に増えた。
 *
 * `scores.value` そのものは書き換えない。料金を確認して priceVerified を立てれば
 * 元の値がそのまま効くようにしておく。
 */
export function calcSoloScore(camp: Campground): number {
  // 5軸の根拠が揃っていない候補は、置き値の scores を順位付けに使わない。
  // 低評価ではなく「未評価」を示すため、中立の3.0に固定する。
  if (!hasVerifiedScores(camp)) return 3;

  const s = camp.scores;
  const value = camp.priceVerified === true ? s.value : 3;
  const raw =
    (s.quietness * 2 + s.scenery * 2 + value + s.access + s.facility) / 7;
  return Math.round(raw * 10) / 10;
}

/**
 * データ全体の「最終確認日」。lastVerified の最大値。
 *
 * フッターに固定文字列で書いていたが、データを更新しても直し忘れて古いままになった。
 * 派生値なので計算に統一する（soloScore と同じ理由）。
 *
 * `"2025-01-01"` は一括投入時のプレースホルダなので除く。現在は0件だが、
 * 将来また混入したときに最終確認日が過去に引き戻されないようにしておく。
 */
export const PLACEHOLDER_VERIFIED_DATE = "2025-01-01";

export function latestVerifiedDate(camps: Campground[] = campgrounds): string | null {
  const dates = camps
    .map((c) => c.lastVerified)
    .filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .filter((d) => d !== PLACEHOLDER_VERIFIED_DATE);
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (a > b ? a : b));
}

export function getCampground(slug: string): Campground | undefined {
  return campgrounds.find((c) => c.slug === slug);
}

export function getAllSlugs(): string[] {
  return campgrounds.map((c) => c.slug);
}

export type SortKey =
  | "soloScore"
  | "priceAsc";

/**
 * 予算の上限。`null` は条件なし。
 *
 * 固定の4段階をやめて 0〜10,000円を自由に動かせるようにした。
 * 実データの最安額は 0〜8,800円（中央値3,000円）で、4段階では
 * 2,000〜4,000円台に半分近くが入ってしまい、そこを刻めなかった。
 */
export type BudgetMax = number | null;

/**
 * スライダーの上限。**ここに達したら「上限なし」として扱う**（`budgetMax: null`）。
 *
 * 上限を額として扱うと、10,000円を超える施設が将来入ったとき、
 * スライダーを右端まで振っても出てこない施設が生まれる。
 * 右端は「制限しない」であって「10,000円まで」ではない。
 */
export const BUDGET_LIMIT = 10000;
/** スライダーの刻み。実データが100円単位まであるので500円で十分細かい。 */
export const BUDGET_STEP = 500;

/**
 * 「こだわり」で絞れる条件のキー。
 *
 * ★ **`soloPlan` をここに置かない。**
 *
 * このサイトは全件がソロ利用を前提に選んだ施設なので、利用者から見た「ソロ向け」は
 * 本来ぜんぶ該当する条件になる。ところがデータの `features.soloPlan` は
 * **1名向けの料金プランが用意されているか**であって、「ソロで泊まれるか」ではない。
 *
 * それを「⛺ ソロ向け」というラベルで出していたため、押すと既定表示の 128件が 23件まで減り、
 * 浩庵・ふもとっぱら・田貫湖・青根・神之川といったソロの定番がまとめて消えていた。
 * **ソロで行ける場所を探して押した人ほど、ソロの定番から遠ざかる**という向きの誤りなので外した。
 *
 * プランの有無自体は事実なので、詳細ページと地図ポップアップには残している。
 *
 * どの条件も「公式情報で true と確認できたもの」だけを該当とする。
 * 未確認（未指定）を該当にも非該当にも数えない。
 */
export type FeatureFilterKey =
  | "bath"
  | "pet"
  | "shop"
  | "shower"
  | "carIn"
  | "firewood"
  | "westernToilet"
  | "wifi"
  | "noReservation"
  | "fishing"
  | "nearbyOnsen";

/**
 * 条件ごとの判定。**未確認を「あり」に混ぜない**ため、すべて厳密な true 判定にする。
 * `westernToilet` だけは boolean ではなく `features.toilet` の値で判定する。
 */
const FEATURE_PREDICATES: Record<FeatureFilterKey, (c: Campground) => boolean> = {
  bath:          (c) => c.features.bath === true,
  pet:           (c) => c.features.pet === true,
  shop:          (c) => c.features.shop === true,
  shower:        (c) => c.features.shower === true,
  carIn:         (c) => c.features.carIn === true,
  firewood:      (c) => c.features.firewood === true,
  westernToilet: (c) =>
    c.features.toilet === "洋式" ||
    c.features.toilet === "ウォシュレット" ||
    c.features.toilet === "温水便座",
  wifi:          (c) => c.features.wifi === true,
  noReservation: (c) => c.features.reservation === "不要",
  fishing:       (c) => c.features.fishing === true,
  /**
   * **場外**の立ち寄り湯。`bath`（場内の入浴施設）とは別の条件。
   * 文字列が入っていることが「公式で近隣の温泉を確認できた」印なので、
   * 他と違って boolean ではなく中身の有無で判定する。
   */
  nearbyOnsen:   (c) => String(c.features.nearbyOnsen || "").trim() !== "",
};

export const FEATURE_FILTER_KEYS = Object.keys(FEATURE_PREDICATES) as FeatureFilterKey[];

export type Filters = {
  prefecture: string;
  /** 料金確認済みの最安額だけで絞る上限。null は予算条件なし。 */
  budgetMax: BudgetMax;
} & Record<FeatureFilterKey, boolean>;

export const DEFAULT_FILTERS: Filters = {
  prefecture: "全部",
  budgetMax: null,
  bath: false,
  pet: false,
  shop: false,
  shower: false,
  carIn: false,
  firewood: false,
  westernToilet: false,
  wifi: false,
  noReservation: false,
  fishing: false,
  nearbyOnsen: false,
};

export function hasActiveConditions(filters: Filters): boolean {
  if (filters.prefecture !== "全部" || filters.budgetMax !== null) return true;
  return FEATURE_FILTER_KEYS.some((key) => filters[key]);
}

/**
 * 1件が条件に合うか。
 *
 * 絞り込みと「この条件を足したら何件になるか」の件数表示の両方がここを通る。
 * 絞り込みと件数で別々の判定を書くと、**ピルに出ている数字と押した結果がずれる**。
 */
export function matchesFilters(camp: Campground, filters: Filters): boolean {
  if (filters.prefecture && filters.prefecture !== "全部") {
    if (camp.prefecture !== filters.prefecture) return false;
  }
  // 予算検索は、公式料金を確認済みの施設だけを対象にする。未確認の金額で「予算内」とは判定しない。
  if (filters.budgetMax !== null) {
    if (camp.priceVerified !== true) return false;
    if (camp.priceMin > filters.budgetMax) return false;
  }
  return FEATURE_FILTER_KEYS.every((key) => !filters[key] || FEATURE_PREDICATES[key](camp));
}

/**
 * 条件を一時的に差し替えたときの件数。ピルに出す数字はこれで作る。
 *
 * 選択中のピルは「いまの結果件数」、未選択のピルは「押したらこうなる件数」を示す。
 * どちらも `{ ...filters, ...patch }` の一発で出せるので、表示と実際の絞り込みがずれない。
 */
export function countMatching(camps: Campground[], filters: Filters, patch: Partial<Filters> = {}): number {
  const merged = { ...filters, ...patch };
  return camps.reduce((n, c) => (matchesFilters(c, merged) ? n + 1 : n), 0);
}

/**
 * 一覧上部のタブ。**キャンプ場と野営地の2つだけ。既定はキャンプ場。**
 *
 * 2026-10-06 に `"all"` を廃止した。管理されたキャンプ場と、管理者のいない野営地を
 * 同じ一覧に混ぜると、**利用者が負う責任の違いが見えなくなる。**
 * 野営地は予約も料金も管理人も無く、「公認なし」のものも含む。
 * 混在した一覧で「風呂あり」を絞り込むような使い方は、そもそも噛み合わない。
 *
 * **混ぜない保証は `filterByType()` の1か所に集約**し、`scripts/test-filters.js` が
 * 「キャンプ場タブの結果に type:"wild" が1件でも入ったら落ちる」で機械的に守る。
 */
export type TypeTab = "campground" | "wild";

export function filterByType(camps: Campground[], tab: TypeTab): Campground[] {
  if (tab === "wild") return camps.filter((c) => c.type === "wild");
  // キャンプ場タブ。**野営地を1件も通さない**
  return camps.filter((c) => c.type !== "wild");
}

/**
 * 種別タブに出す件数。**渡した母集団から数える。**
 *
 * タブの数字は `filterByType()` で実際に絞った結果と一致していなければならない。
 * 別々に数えると、押す前の数字と押した後の件数がずれる。
 * （既定表示では出てこない根拠URLなしの施設まで数えていて、
 *   野営地タブが 11 と表示しながら一覧には2件しか出ていなかった。2026-08-27 に修正）
 */
export function countByType(camps: Campground[]): { campground: number; wild: number } {
  return {
    campground: filterByType(camps, "campground").length,
    wild: filterByType(camps, "wild").length,
  };
}

export function filterAndSort(
  camps: Campground[],
  filters: Filters,
  sort: SortKey
): Campground[] {
  let result = camps.filter((c) => matchesFilters(c, filters));

  /**
   * 価格順のキー。料金が未確認の施設は根拠のない数字なので、
   * その値で順位を付けずに末尾へ回す。一覧から消してしまうと
   * 「価格順にしたら施設が減った」という別の事故になるので除外はしない。
   */
  const priceKey = (c: Campground) =>
    c.priceVerified === true ? c.priceMin : Number.POSITIVE_INFINITY;

  result = [...result].sort((a, b) => {
    // 同一の検索結果内でも根拠URLのある施設を先に出す。
    // 根拠不足の施設を消すのではなく、利用者が確認中だと分かる位置へ回す。
    const evidenceDiff = Number(hasEvidenceUrl(b)) - Number(hasEvidenceUrl(a));
    if (evidenceDiff !== 0) return evidenceDiff;
    switch (sort) {
      case "priceAsc": {
        const diff = priceKey(a) - priceKey(b);
        // 末尾に溜まる未確認施設どうしは soloScore 順で安定させる
        if (Number.isNaN(diff) || diff === 0) return calcSoloScore(b) - calcSoloScore(a);
        return diff;
      }
      case "soloScore":
      default:
        return calcSoloScore(b) - calcSoloScore(a);
    }
  });

  return result;
}
