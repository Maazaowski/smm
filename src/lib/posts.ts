import { cache } from "react";
import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import { posts } from "./db/schema";
import readingTime from "reading-time";
import type { Post } from "./types";
import type { DbPost } from "./db/schema";

// Map a DB row into the Post shape used throughout the app
function dbToPost(p: DbPost): Post {
  const rt = readingTime(p.content);
  return {
    slug: p.slug,
    frontmatter: {
      title: p.title,
      description: p.description,
      date: p.publishedAt.toISOString().split("T")[0],
      updated: p.updatedAt?.toISOString().split("T")[0],
      tags: p.tags,
      category: p.category,
      draft: p.draft,
    },
    content: p.content,
    readingTime: rt.text,
    wordCount: rt.words,
  };
}

// cache() deduplicates calls within the same request (avoids N+1 on layout + page)
export const getAllPosts = cache(async (includeDrafts = false): Promise<Post[]> => {
  if (!db) return [];
  const rows = includeDrafts
    ? await db.select().from(posts).orderBy(desc(posts.publishedAt))
    : await db.select().from(posts).where(eq(posts.draft, false)).orderBy(desc(posts.publishedAt));
  return rows.map(dbToPost);
});

export const getPostBySlug = cache(
  async (slug: string, includeDrafts = false): Promise<Post | null> => {
    if (!db) return null;
    const rows = includeDrafts
      ? await db.select().from(posts).where(eq(posts.slug, slug)).limit(1)
      : await db.select().from(posts)
          .where(and(eq(posts.slug, slug), eq(posts.draft, false)))
          .limit(1);
    return rows[0] ? dbToPost(rows[0]) : null;
  }
);

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const all = await getAllPosts();
  return all.filter((p) =>
    p.frontmatter.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  if (!db) return [];
  const rows = await db
    .select({ tags: posts.tags })
    .from(posts)
    .where(eq(posts.draft, false));

  const tagMap = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row.tags) {
      const lower = tag.toLowerCase();
      tagMap.set(lower, (tagMap.get(lower) ?? 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<Post[]> {
  const current = await getPostBySlug(currentSlug);
  if (!current) return [];

  const all = await getAllPosts();
  return all
    .filter((p) => p.slug !== currentSlug)
    .map((p) => {
      let score = 0;
      for (const tag of p.frontmatter.tags) {
        if (current.frontmatter.tags.includes(tag)) score += 3;
      }
      if (p.frontmatter.category === current.frontmatter.category) score += 2;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

// --- Write operations (used by admin panel) ---

export async function createPost(data: {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  draft: boolean;
  publishedAt?: Date;
}): Promise<Post> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db.insert(posts).values(data).returning();
  return dbToPost(rows[0]);
}

export async function updatePost(
  slug: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    category?: string;
    tags?: string[];
    draft?: boolean;
  }
): Promise<Post | null> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db
    .update(posts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(posts.slug, slug))
    .returning();
  return rows[0] ? dbToPost(rows[0]) : null;
}

export async function deletePost(slug: string): Promise<boolean> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db.delete(posts).where(eq(posts.slug, slug)).returning();
  return rows.length > 0;
}
