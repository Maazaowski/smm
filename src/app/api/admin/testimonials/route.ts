import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  createTestimonial,
  listTestimonialsForAdmin,
  testimonialInputSchema,
} from "@/lib/testimonials";
import { revalidateTestimonials } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ testimonials: await listTestimonialsForAdmin() });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/testimonials GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = testimonialInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid testimonial", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const created = await createTestimonial(parsed.data);
    revalidateTestimonials();
    return NextResponse.json({ success: true, testimonial: created });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/testimonials POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
