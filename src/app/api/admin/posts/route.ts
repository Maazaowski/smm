import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getAllPosts } from "@/lib/posts";
import { Octokit } from "@octokit/rest";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return all posts including drafts
  const posts = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    date: p.frontmatter.date,
    draft: p.frontmatter.draft || false,
    category: p.frontmatter.category,
  }));

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { slug, title, description, category, tags, draft, body: content } = body;

  const date = new Date().toISOString().split("T")[0];
  const year = date.split("-")[0];

  const frontmatter = [
    "---",
    `title: "${title}"`,
    `description: "${description}"`,
    `date: "${date}"`,
    `tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]`,
    `category: "${category}"`,
    `featured: false`,
    `draft: ${draft}`,
    "---",
  ].join("\n");

  const fileContent = `${frontmatter}\n\n${content}`;
  const path = `content/posts/${year}/${slug}.mdx`;

  const octokit = new Octokit({ auth: token });

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: "maazaowski",
      repo: "smm",
      path,
      message: `Add post: ${title}`,
      content: Buffer.from(fileContent).toString("base64"),
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create post", details: String(error) },
      { status: 500 }
    );
  }
}
