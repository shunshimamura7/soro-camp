import type { Campground } from "./types";
import data from "../data/campgrounds.json";

export const campgrounds: Campground[] = data as Campground[];

/**
 * ソロ適性スコア。静けさと絶景を2倍で重み付けし、小数第1位に丸める。
 *
 *   (静けさ*2 + 絶景*2 + コスパ + アクセス + 設備) / 7
 *
 * 以前は JSON に soloScore を持たせていたが、scores と食い違っても
 * 気づけないため計算に統一した（JSON からフィールドは削除済み）。
 */
export function calcSoloScore(scores: Campground["scores"]): number {
  const raw =
    (scores.quietness * 2 +
      scores.scenery * 2 +
      scores.value +
      scores.access +
      scores.facility) /
    7;
  return Math.round(raw * 10) / 10;
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

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "soloScore":
        return calcSoloScore(b.scores) - calcSoloScore(a.scores);
      case "priceAsc":
        return a.priceMin - b.priceMin;
      default:
        return calcSoloScore(b.scores) - calcSoloScore(a.scores);
    }
  });

  return result;
}
