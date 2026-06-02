import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getPostBySlug } from "@/lib/posts";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

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

  const { slug } = await params;
  const body = await request.json();
  const {
    title,
    description,
    category,
    tags,
    draft,
    body: content,
  } = body as {
    title: string;
    description: string;
    category: string;
    tags: string[];
    draft: boolean;
    body: string;
  };

  const post = getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = new Date().toISOString().split("T")[0];
  const frontmatter = [
    "---",
    `title: "${title}"`,
    `description: "${description}"`,
    `date: "${post.frontmatter.date}"`,
    `updated: "${updated}"`,
    `tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]`,
    `category: "${category}"`,
    `featured: ${post.frontmatter.featured || false}`,
    `draft: ${draft}`,
    "---",
  ].join("\n");

  const fileContent = `${frontmatter}\n\n${content}`;
  const year = post.frontmatter.date.split("-")[0];
  const filePath = `content/posts/${year}/${slug}.mdx`;

  const token = process.env.GITHUB_TOKEN;

  // Local dev — write directly to disk
  if (!token) {
    try {
      const absPath = path.join(process.cwd(), filePath);
      fs.writeFileSync(absPath, fileContent, "utf-8");
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to write file", details: String(err) },
        { status: 500 }
      );
    }
  }

  // Production — update via GitHub API
  const octokit = new Octokit({ auth: token });
  const owner = process.env.GITHUB_OWNER ?? "Maazaowski";
  const repo = process.env.GITHUB_REPO ?? "smm";

  try {
    const { data: existing } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });
    const sha = "sha" in existing ? existing.sha : undefined;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `feat: update post "${title}"`,
      content: Buffer.from(fileContent).toString("base64"),
      sha,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "GitHub API error", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const year = post.frontmatter.date.split("-")[0];
  const filePath = `content/posts/${year}/${slug}.mdx`;

  const token = process.env.GITHUB_TOKEN;

  // Local dev — delete from disk
  if (!token) {
    try {
      const absPath = path.join(process.cwd(), filePath);
      fs.unlinkSync(absPath);
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to delete file", details: String(err) },
        { status: 500 }
      );
    }
  }

  // Production — delete via GitHub API
  const octokit = new Octokit({ auth: token });
  const owner = process.env.GITHUB_OWNER ?? "Maazaowski";
  const repo = process.env.GITHUB_REPO ?? "smm";

  try {
    const { data: existing } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });
    const sha = "sha" in existing ? existing.sha : undefined;

    await octokit.repos.deleteFile({
      owner,
      repo,
      path: filePath,
      message: `feat: delete post "${post.frontmatter.title}"`,
      sha: sha!,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "GitHub API error", details: String(err) },
      { status: 500 }
    );
  }
}
