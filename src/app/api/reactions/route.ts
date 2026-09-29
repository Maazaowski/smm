import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { clientIp } from "@/lib/request";
import type { ReactionType, Reactions } from "@/lib/types";

const VALID_TYPES: ReactionType[] = ["fire", "heart", "mindblown", "idea"];

/*
 * Four kinds per essay is the honest ceiling for one reader; anything past
 * a couple of dozen a minute from one address is a script, not a person.
 */
const ratelimit =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "ratelimit:reactions",
  });

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
  const body = await request.json().catch(() => ({}));
  const { slug, type } = body as { slug?: string; type?: ReactionType };

  if (!slug || !type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (ratelimit) {
    const { success } = await ratelimit.limit(clientIp(request));
    if (!success) {
      return NextResponse.json({ error: "Too many reactions" }, { status: 429 });
    }
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
