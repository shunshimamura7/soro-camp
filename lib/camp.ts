import type { Campground } from "./types";
import data from "../data/campgrounds.json";

export const campgrounds: Campground[] = data as Campground[];

export * from "./camp-core";
import { hasEvidence, PLACEHOLDER_VERIFIED_DATE } from "./camp-core";

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

/** 公開根拠が揃う通常掲載。既存の詳細URLは消さず、一覧の既定おすすめだけを分ける。 */
export const evidenceBackedCampgrounds: Campground[] = activeCampgrounds.filter(hasEvidence);
export const evidencePendingCampgrounds: Campground[] = activeCampgrounds.filter((c) => !hasEvidence(c));

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
