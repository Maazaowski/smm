import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getPostBySlug, updatePost, deletePost } from "@/lib/posts";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const post = await getPostBySlug(slug, true); // include drafts
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    slug: post.slug,
    frontmatter: post.frontmatter,
    content: post.content,
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await request.json();
  const { title, description, category, tags, draft, body: content } = body as {
    title: string;
    description: string;
    category: string;
    tags: string[];
    draft: boolean;
    body: string;
  };

  try {
    const updated = await updatePost(slug, { title, description, category, tags, draft, content });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/posts PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  try {
    const deleted = await deletePost(slug);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/posts DELETE]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
