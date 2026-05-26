import type { MetadataRoute } from "next";
import { campgrounds } from "@/lib/camp";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soro-camp.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const campPages = campgrounds.map((c) => ({
    url: `${SITE_URL}/camp/${c.slug}`,
    lastModified: new Date(c.lastVerified),
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
    ...campPages,
  ];
}
