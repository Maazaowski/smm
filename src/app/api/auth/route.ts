import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { createSession, clearSession, safeEqual } from "@/lib/auth";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * The whole admin is behind one shared password, so an unmetered login endpoint
 * is an offline-speed brute force with none of the offline part. Five attempts
 * per 15 minutes per IP is generous for a single legitimate user and useless to
 * anyone guessing.
 */
const loginLimit =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "ratelimit:admin-login",
    analytics: false,
  });

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (loginLimit) {
    const { success, reset } = await loginLimit.limit(ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (typeof password !== "string" || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
