import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const KEY = "guestbook";
const MAX_ENTRIES = 200;

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  ts: number;
}

const ratelimit =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "10 m"),
    prefix: "rl:guestbook",
  });

export async function GET() {
  if (!redis) return NextResponse.json({ entries: [] });
  const raw = await redis.lrange<GuestbookEntry>(KEY, 0, 49);
  // @upstash/redis auto-parses JSON; guard against string form just in case.
  const entries = raw.map((e) =>
    typeof e === "string" ? (JSON.parse(e) as GuestbookEntry) : e
  );
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  let name: string, message: string, honeypot: string;
  try {
    const body = (await request.json()) as {
      name?: string;
      message?: string;
      website?: string; // honeypot: real users never fill this
    };
    name = (body.name ?? "").trim();
    message = (body.message ?? "").trim();
    honeypot = (body.website ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot filled → silently accept without storing (defeats bots quietly).
  if (honeypot) return NextResponse.json({ ok: true });

  if (name.length < 1 || name.length > 50) {
    return NextResponse.json(
      { error: "Name must be 1-50 characters." },
      { status: 400 }
    );
  }
  if (message.length < 1 || message.length > 500) {
    return NextResponse.json(
      { error: "Message must be 1-500 characters." },
      { status: 400 }
    );
  }

  if (!redis || !ratelimit) {
    return NextResponse.json(
      { error: "Guestbook is not available right now." },
      { status: 503 }
    );
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "You're posting too fast. Try again in a bit." },
      { status: 429 }
    );
  }

  const entry: GuestbookEntry = {
    id: crypto.randomUUID(),
    name,
    message,
    ts: Date.now(),
  };

  await redis.lpush(KEY, entry);
  await redis.ltrim(KEY, 0, MAX_ENTRIES - 1);

  return NextResponse.json({ ok: true, entry });
}

// Author-only moderation: remove an entry by id.
export async function DELETE(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!redis) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const raw = await redis.lrange<GuestbookEntry>(KEY, 0, -1);
  const match = raw.find((e) => {
    const parsed = typeof e === "string" ? (JSON.parse(e) as GuestbookEntry) : e;
    return parsed.id === id;
  });
  if (match !== undefined) await redis.lrem(KEY, 1, match);

  return NextResponse.json({ ok: true });
}
