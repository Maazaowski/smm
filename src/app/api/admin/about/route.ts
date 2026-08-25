import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getAboutContent, seedAboutContent, updateAboutContent } from "@/lib/about";
import { aboutContentSchema } from "@/lib/about-types";
import { revalidateAbout } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getAboutContent();
    if (data.source === "defaults") {
      const seeded = await seedAboutContent();
      return NextResponse.json({
        content: seeded.content,
        updatedAt: seeded.updatedAt?.toISOString() ?? null,
      });
    }

    return NextResponse.json({
      content: data.content,
      updatedAt: data.updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[admin/about GET]", err);
    return NextResponse.json({ error: "Failed to load about content" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = aboutContentSchema.safeParse(body.content ?? body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid about content", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = await updateAboutContent(parsed.data);
    revalidateAbout();
    return NextResponse.json({
      success: true,
      content: data.content,
      updatedAt: data.updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/about PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
