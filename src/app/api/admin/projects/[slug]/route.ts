import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { deleteProject, getProjectBySlug, updateProject } from "@/lib/projects";
import { projectInputSchema } from "@/lib/project-types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const project = await getProjectBySlug(slug, true);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        description: project.description,
        body: project.body,
        category: project.category,
        status: project.status,
        kind: project.kind,
        year: project.year,
        client: project.client,
        repoOwner: project.repoOwner,
        repoName: project.repoName,
        featured: project.featured,
        draft: project.draft,
        sortOrder: project.sortOrder,
        meta: project.meta,
      },
      stats: project.stats,
      syncedAt: project.syncedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[admin/projects/[slug] GET]", err);
    return NextResponse.json(
      { error: "Failed to load project" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const body = await request.json();
    const parsed = projectInputSchema.safeParse(body.project ?? body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await updateProject(slug, parsed.data);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, slug: project.slug });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/projects/[slug] PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const deleted = await deleteProject(slug);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/projects/[slug] DELETE]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
