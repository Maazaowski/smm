import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getProjectSlugs } from "@/lib/projects";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([
    getAllPosts(),
    getProjectSlugs(),
  ]);

  const postEntries = posts.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(post.frontmatter.updated ?? post.frontmatter.date),
    priority: 0.8 as const,
  }));

  // lastModified uses the human updatedAt, never the sync timestamp — otherwise
  // every project would look like it changed daily.
  const projectEntries = projects.map((p) => ({
    url: `${SITE.url}/projects/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt,
    priority: 0.8 as const,
  }));


  return [
    { url: SITE.url, priority: 1.0 },
    { url: `${SITE.url}/blog`, priority: 0.9 },
    { url: `${SITE.url}/projects`, priority: 0.9 },
    { url: `${SITE.url}/about`, priority: 0.7 },
    ...projectEntries,
    ...postEntries,
  ];
}
