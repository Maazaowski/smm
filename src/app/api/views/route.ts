import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  if (!redis) {
    return NextResponse.json({ views: 0 });
  }

  const views = (await redis.get<number>(`views:${slug}`)) ?? 0;
  return NextResponse.json({ views });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug } = body as { slug: string };

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  if (!redis) {
    return NextResponse.json({ views: 0 });
  }

  // Deduplicate by IP hash
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  // Simple hash for privacy
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + slug);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const isNew = await redis.sadd(`viewers:${slug}`, hashHex);

  if (isNew) {
    await redis.incr(`views:${slug}`);

    // Track daily views for analytics dashboard
    const today = new Date().toISOString().split("T")[0];
    await redis.incr(`daily-views:${today}`);
  }

  const views = (await redis.get<number>(`views:${slug}`)) ?? 0;
  return NextResponse.json({ views });
}
