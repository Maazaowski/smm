import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { createProject, listProjectsForAdmin, seedProjects } from "@/lib/projects";
import { projectInputSchema } from "@/lib/project-types";
import { revalidateProject } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let projects = await listProjectsForAdmin();

    // Lazy self-seed on first admin visit, mirroring the about route.
    if (projects.length === 0) {
      const seeded = await seedProjects();
      if (seeded > 0) projects = await listProjectsForAdmin();
    }

    return NextResponse.json({
      projects: projects.map((p) => ({
        ...p,
        syncedAt: p.syncedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("[admin/projects GET]", err);
    return NextResponse.json(
      { error: "Failed to load projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = projectInputSchema.safeParse(body.project ?? body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await createProject(parsed.data);
    revalidateProject(project.slug);
    return NextResponse.json({ success: true, slug: project.slug });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/projects POST]", message);

    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json(
        { error: "A project with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
