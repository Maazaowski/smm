import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Post, PostFrontmatter } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function getFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "drafts") {
        files.push(...getFilesRecursive(fullPath));
      }
    } else if (entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }
  return files;
}

function parsePost(filePath: string): Post {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = data as PostFrontmatter;
  const slug = path.basename(filePath, ".mdx");
  const stats = readingTime(content);

  return {
    slug,
    frontmatter,
    content,
    readingTime: stats.text,
    wordCount: stats.words,
  };
}

export function getAllPosts(): Post[] {
  const files = getFilesRecursive(POSTS_DIR);
  const posts = files.map(parsePost);

  const filtered =
    process.env.NODE_ENV === "production"
      ? posts.filter((p) => !p.frontmatter.draft)
      : posts;

  return filtered.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) =>
    p.frontmatter.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

export function getAllTags(): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.frontmatter.tags) {
      const lower = tag.toLowerCase();
      tagMap.set(lower, (tagMap.get(lower) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getRelatedPosts(currentSlug: string, limit = 3): Post[] {
  const current = getPostBySlug(currentSlug);
  if (!current) return [];

  const posts = getAllPosts().filter((p) => p.slug !== currentSlug);

  const scored = posts.map((post) => {
    let score = 0;
    for (const tag of post.frontmatter.tags) {
      if (current.frontmatter.tags.includes(tag)) score += 3;
    }
    if (post.frontmatter.category === current.frontmatter.category) score += 2;
    return { post, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
}
