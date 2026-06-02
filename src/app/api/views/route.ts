import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  if (!redis) return NextResponse.json({ views: 0 });

  const views = (await redis.get<number>(`views:${slug}`)) ?? 0;
  return NextResponse.json({ views });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug } = body as { slug: string };
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  if (!redis) return NextResponse.json({ views: 0 });

  // Deduplicate by hashed IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const data = new TextEncoder().encode(ip + slug);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const isNew = await redis.sadd(`viewers:${slug}`, hashHex);

  if (isNew) {
    const newViews = await redis.incr(`views:${slug}`);

    // Track daily views for analytics dashboard
    const today = new Date().toISOString().split("T")[0];
    await redis.incr(`daily-views:${today}`);

    // Maintain sorted set for featured posts (top by view count)
    await redis.zadd("posts:views", { score: newViews, member: slug });
  }

  const views = (await redis.get<number>(`views:${slug}`)) ?? 0;
  return NextResponse.json({ views });
}
