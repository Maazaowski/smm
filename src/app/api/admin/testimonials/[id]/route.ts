import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  deleteTestimonial,
  testimonialInputSchema,
  updateTestimonial,
} from "@/lib/testimonials";
import { revalidateTestimonials } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = testimonialInputSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid testimonial", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await updateTestimonial(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    revalidateTestimonials();
    return NextResponse.json({ success: true, testimonial: updated });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/testimonials PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const deleted = await deleteTestimonial(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    revalidateTestimonials();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/testimonials DELETE]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
