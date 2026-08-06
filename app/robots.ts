import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";


// output: "export"（Cloudflare Workers 向け静的書き出し）で必須
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
