import type { MetadataRoute } from "next";
import { evidenceBackedCampgrounds, latestVerifiedDate } from "@/lib/camp";
import { SITE_URL } from "@/lib/site";
import { PREF_SLUG } from "@/lib/prefs";
import { AREAS, areaKey } from "@/lib/areas";

// output: "export"（Cloudflare Pages 向け静的書き出し）で必須
export const dynamic = "force-static";

/** lastVerified 未設定（野営地など）は Invalid Date になるので、データ全体の最終更新日に寄せる */
function verifiedDate(lastVerified: string | undefined, fallback: Date): Date {
  const d = new Date(lastVerified ?? "");
  return Number.isNaN(d.getTime()) || lastVerified === "2025-01-01" ? fallback : d;
}

/**
 * lastmod は施設ごとの確認日。一覧系はデータの最終更新日。
 * changefreq / priority は Google が使わないので出さない（一律の値は意味がない。審査員8）
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const latest = new Date(latestVerifiedDate() ?? Date.now());
  // 一覧ページの lastmod は、そのページに載る施設の確認日の最大値（ビルド日にしない。審査員8）
  const latestOf = (pred: (c: (typeof evidenceBackedCampgrounds)[number]) => boolean) =>
    new Date(latestVerifiedDate(evidenceBackedCampgrounds.filter(pred)) ?? latest);
  const areaPages = AREAS.filter(
    (a) => evidenceBackedCampgrounds.filter((c) => c.type !== "wild" && c.prefecture === a.pref && areaKey(c.area) === a.name).length >= 5
  ).map((a) => ({ url: `${SITE_URL}/area/${a.slug}`, lastModified: latestOf((c) => c.prefecture === a.pref && areaKey(c.area) === a.name) }));
  const campPages = evidenceBackedCampgrounds.map((c) => ({
    url: `${SITE_URL}/camp/${c.slug}`,
    lastModified: verifiedDate(c.lastVerified, latest),
  }));
  return [
    { url: SITE_URL, lastModified: latest },
    { url: `${SITE_URL}/about`, lastModified: latest },
    { url: `${SITE_URL}/updates`, lastModified: latest },
    ...Object.entries(PREF_SLUG).map(([name, pref]) => ({ url: `${SITE_URL}/pref/${pref}`, lastModified: latestOf((c) => c.prefecture === name) })),
    ...areaPages,
    ...campPages,
  ];
}
