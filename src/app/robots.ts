import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Served at /robots.txt. Lessons, playground, and glossary are open to crawlers
// (including AI crawlers); the admin dashboard and API routes are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
