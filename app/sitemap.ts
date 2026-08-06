import type { MetadataRoute } from "next";
import { campgrounds } from "@/lib/camp";
import { SITE_URL } from "@/lib/site";


// output: "export"（Cloudflare Workers 向け静的書き出し）で必須
export const dynamic = "force-static";

/** lastVerified 未設定（野営地など）は Invalid Date になるので現在時刻にフォールバック */
function verifiedDate(lastVerified: string): Date {
  const d = new Date(lastVerified);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const campPages = campgrounds.map((c) => ({
    url: `${SITE_URL}/camp/${c.slug}`,
    lastModified: verifiedDate(c.lastVerified),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    ...campPages,
  ];
}
