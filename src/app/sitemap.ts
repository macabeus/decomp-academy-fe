import type { MetadataRoute } from "next";
import { LESSONS } from "@/lib/lessons/registry";
import { SITE_URL } from "@/lib/seo";

// Generated at build time from the lesson registry, so every lesson is
// discoverable without hand-maintaining a list. Served at /sitemap.xml.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/playground`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/glossary`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const lessonRoutes: MetadataRoute.Sitemap = LESSONS.map((l) => ({
    url: `${SITE_URL}/lesson/${l.id}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...lessonRoutes];
}
