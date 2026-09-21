import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://artikare.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/app`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: article.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes];
}
