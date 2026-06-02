import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const tags = getAllTags();

  const postEntries = posts.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(post.frontmatter.updated || post.frontmatter.date),
    priority: 0.8 as const,
  }));

  const tagEntries = tags.map(({ tag }) => ({
    url: `${SITE.url}/tags/${tag}`,
    priority: 0.5 as const,
  }));

  return [
    { url: SITE.url, priority: 1.0 },
    { url: `${SITE.url}/blog`, priority: 0.9 },
    { url: `${SITE.url}/about`, priority: 0.7 },
    ...postEntries,
    ...tagEntries,
  ];
}
