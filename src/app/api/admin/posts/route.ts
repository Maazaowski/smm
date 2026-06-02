import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getAllPosts } from "@/lib/posts";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    date: p.frontmatter.date,
    draft: p.frontmatter.draft || false,
    category: p.frontmatter.category,
  }));

  return NextResponse.json({ posts });
}

function buildMDX(params: {
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  draft: boolean;
  content: string;
  featured?: boolean;
}) {
  const frontmatter = [
    "---",
    `title: "${params.title}"`,
    `description: "${params.description}"`,
    `date: "${params.date}"`,
    `tags: [${params.tags.map((t) => `"${t}"`).join(", ")}]`,
    `category: "${params.category}"`,
    `featured: ${params.featured ?? false}`,
    `draft: ${params.draft}`,
    "---",
  ].join("\n");

  return `${frontmatter}\n\n${params.content}`;
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    slug,
    title,
    description,
    category,
    tags,
    draft,
    body: content,
  } = body as {
    slug: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    draft: boolean;
    body: string;
  };

  if (!slug || !title || !description) {
    return NextResponse.json(
      { error: "slug, title and description are required" },
      { status: 400 }
    );
  }

  const date = new Date().toISOString().split("T")[0];
  const year = date.split("-")[0];
  const filePath = `content/posts/${year}/${slug}.mdx`;
  const fileContent = buildMDX({
    title,
    description,
    date,
    tags: tags || [],
    category,
    draft,
    content: content || "",
  });

  const token = process.env.GITHUB_TOKEN;

  // Local dev — write directly to disk
  if (!token) {
    try {
      const absPath = path.join(process.cwd(), filePath);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, fileContent, "utf-8");
      return NextResponse.json({ success: true, slug });
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to write file", details: String(err) },
        { status: 500 }
      );
    }
  }

  // Production — commit via GitHub API
  const octokit = new Octokit({ auth: token });
  const owner = process.env.GITHUB_OWNER ?? "Maazaowski";
  const repo = process.env.GITHUB_REPO ?? "smm";

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `feat: add post "${title}"`,
      content: Buffer.from(fileContent).toString("base64"),
    });
    return NextResponse.json({ success: true, slug });
  } catch (err) {
    return NextResponse.json(
      { error: "GitHub API error", details: String(err) },
      { status: 500 }
    );
  }
}
