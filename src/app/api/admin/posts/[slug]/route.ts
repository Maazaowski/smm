import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getPostBySlug } from "@/lib/posts";
import { Octokit } from "@octokit/rest";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: post.slug,
    frontmatter: post.frontmatter,
    content: post.content,
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  const { slug } = await params;
  const body = await request.json();
  const { title, description, category, tags, draft, body: content } = body;

  const post = getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const frontmatter = [
    "---",
    `title: "${title}"`,
    `description: "${description}"`,
    `date: "${post.frontmatter.date}"`,
    `updated: "${new Date().toISOString().split("T")[0]}"`,
    `tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]`,
    `category: "${category}"`,
    `featured: ${post.frontmatter.featured || false}`,
    `draft: ${draft}`,
    "---",
  ].join("\n");

  const fileContent = `${frontmatter}\n\n${content}`;
  const year = post.frontmatter.date.split("-")[0];
  const path = `content/posts/${year}/${slug}.mdx`;

  const octokit = new Octokit({ auth: token });

  try {
    // Get current file SHA
    const { data: existing } = await octokit.repos.getContent({
      owner: "maazaowski",
      repo: "smm",
      path,
    });

    const sha = "sha" in existing ? existing.sha : undefined;

    await octokit.repos.createOrUpdateFileContents({
      owner: "maazaowski",
      repo: "smm",
      path,
      message: `Update post: ${title}`,
      content: Buffer.from(fileContent).toString("base64"),
      sha,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update post", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const year = post.frontmatter.date.split("-")[0];
  const path = `content/posts/${year}/${slug}.mdx`;

  const octokit = new Octokit({ auth: token });

  try {
    const { data: existing } = await octokit.repos.getContent({
      owner: "maazaowski",
      repo: "smm",
      path,
    });

    const sha = "sha" in existing ? existing.sha : undefined;

    await octokit.repos.deleteFile({
      owner: "maazaowski",
      repo: "smm",
      path,
      message: `Delete post: ${post.frontmatter.title}`,
      sha: sha!,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete post", details: String(error) },
      { status: 500 }
    );
  }
}
