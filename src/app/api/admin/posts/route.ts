import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getAllPosts, createPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await getAllPosts(true); // include drafts for admin
  const mapped = all.map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    date: p.frontmatter.date,
    draft: p.frontmatter.draft ?? false,
    category: p.frontmatter.category,
  }));

  return NextResponse.json({ posts: mapped });
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { slug, title, description, category, tags, draft, body: content, publishedAt } = body as {
    slug: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    draft: boolean;
    body: string;
    publishedAt?: string;
  };

  if (!slug || !title || !description) {
    return NextResponse.json({ error: "slug, title, and description are required" }, { status: 400 });
  }

  try {
    const post = await createPost({
      slug,
      title,
      description,
      content: content ?? "",
      category,
      tags: tags ?? [],
      draft,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    });
    return NextResponse.json({ success: true, slug: post.slug });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? String(err);
    // Handle unique constraint violation (slug already exists)
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "A post with this slug already exists." }, { status: 409 });
    }
    console.error("[admin/posts POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
