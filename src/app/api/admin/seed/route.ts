import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { createPost } from "@/lib/posts";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const dynamic = "force-dynamic";

/**
 * One-time endpoint: reads all MDX files from content/posts/
 * and imports them into the database. Safe to run multiple times
 * (duplicate slugs are skipped).
 */
export async function POST() {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postsDir = path.join(process.cwd(), "content", "posts");
  const results: { slug: string; status: string }[] = [];

  function readMdxFiles(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== "drafts") {
        readMdxFiles(path.join(dir, entry.name));
      } else if (entry.name.endsWith(".mdx")) {
        const filePath = path.join(dir, entry.name);
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(raw);
        const slug = path.basename(entry.name, ".mdx");

        createPost({
          slug,
          title: data.title ?? slug,
          description: data.description ?? "",
          content: content.trim(),
          category: data.category ?? "General",
          tags: Array.isArray(data.tags) ? data.tags : [],
          draft: data.draft ?? false,
          publishedAt: data.date ? new Date(data.date) : new Date(),
        })
          .then(() => results.push({ slug, status: "imported" }))
          .catch((err: unknown) => {
            const msg = (err as { message?: string })?.message ?? String(err);
            const isDuplicate = msg.includes("unique") || msg.includes("duplicate");
            results.push({ slug, status: isDuplicate ? "skipped (already exists)" : `error: ${msg}` });
          });
      }
    }
  }

  readMdxFiles(postsDir);

  // Give async operations a moment to settle
  await new Promise((r) => setTimeout(r, 2000));

  return NextResponse.json({ seeded: results });
}
