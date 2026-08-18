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

export type Filters = {
  prefecture: string;
  soloPlan: boolean;
  bath: boolean;
  shower: boolean;
  noReservation: boolean;
  bonfire: boolean;
};

/** 一覧上部のタブ。キャンプ場と野営地の切り替え。 */
export type TypeTab = "all" | "campground" | "wild";

export function filterByType(camps: Campground[], tab: TypeTab): Campground[] {
  if (tab === "wild") return camps.filter((c) => c.type === "wild");
  if (tab === "campground") return camps.filter((c) => c.type !== "wild");
  return camps;
}

export function filterAndSort(
  camps: Campground[],
  filters: Filters,
  sort: SortKey
): Campground[] {
  let result = camps.filter((c) => {
    if (filters.prefecture && filters.prefecture !== "全部") {
      if (c.prefecture !== filters.prefecture) return false;
    }
    if (filters.bath && !c.features.bath) return false;
    if (filters.shower && !c.features.shower) return false;
    if (filters.noReservation && c.features.reservation !== "不要") return false;
    if (filters.bonfire && !c.features.bonfire) return false;
    return true;
  });

  /**
   * 価格順のキー。料金が未確認の施設は根拠のない数字なので、
   * その値で順位を付けずに末尾へ回す。一覧から消してしまうと
   * 「価格順にしたら施設が減った」という別の事故になるので除外はしない。
   */
  const priceKey = (c: Campground) =>
    c.priceVerified === true ? c.priceMin : Number.POSITIVE_INFINITY;

  result = [...result].sort((a, b) => {
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
