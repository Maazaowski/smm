import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import type { ReactionType, Reactions } from "@/lib/types";

const VALID_TYPES: ReactionType[] = ["fire", "heart", "mindblown", "idea"];

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  if (!redis) {
    return NextResponse.json<Reactions>({
      fire: 0,
      heart: 0,
      mindblown: 0,
      idea: 0,
    });
  }

  const data = (await redis.hgetall(`reactions:${slug}`)) as Reactions | null;
  return NextResponse.json<Reactions>({
    fire: data?.fire ?? 0,
    heart: data?.heart ?? 0,
    mindblown: data?.mindblown ?? 0,
    idea: data?.idea ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, type } = body as { slug: string; type: ReactionType };

  if (!slug || !type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (!redis) {
    return NextResponse.json<Reactions>({
      fire: 0,
      heart: 0,
      mindblown: 0,
      idea: 0,
    });
  }

  await redis.hincrby(`reactions:${slug}`, type, 1);

  const data = (await redis.hgetall(`reactions:${slug}`)) as Reactions | null;
  return NextResponse.json<Reactions>({
    fire: data?.fire ?? 0,
    heart: data?.heart ?? 0,
    mindblown: data?.mindblown ?? 0,
    idea: data?.idea ?? 0,
  });
}
