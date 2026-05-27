import type { Campground } from "./types";
import data from "../data/campgrounds.json";

export const campgrounds: Campground[] = data as Campground[];

export function getCampground(slug: string): Campground | undefined {
  return campgrounds.find((c) => c.slug === slug);
}

export function getAllSlugs(): string[] {
  return campgrounds.map((c) => c.slug);
}

export type SortKey =
  | "soloScore"
  | "priceAsc"
  | "priceDesc"
  | "quietness"
  | "scenery"
  | "value"
  | "facility";

export type Filters = {
  prefecture: string;
  soloPlan: boolean;
  bath: boolean;
  noReservation: boolean;
};

export function filterAndSort(
  camps: Campground[],
  filters: Filters,
  sort: SortKey
): Campground[] {
  let result = camps.filter((c) => {
    if (filters.prefecture && filters.prefecture !== "全部") {
      if (c.prefecture !== filters.prefecture) return false;
    }
    if (filters.soloPlan && !c.features.soloPlan) return false;
    if (filters.bath && !c.features.bath) return false;
    if (filters.noReservation && c.features.reservation !== "不要") return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "soloScore":
        return b.soloScore - a.soloScore;
      case "priceAsc":
        return a.priceMin - b.priceMin;
      case "priceDesc":
        return b.priceMin - a.priceMin;
      case "quietness":
        return b.scores.quietness - a.scores.quietness;
      case "scenery":
        return b.scores.scenery - a.scores.scenery;
      case "value":
        return b.scores.value - a.scores.value;
      case "facility":
        return b.scores.facility - a.scores.facility;
      default:
        return b.soloScore - a.soloScore;
    }
  });

  return result;
}
