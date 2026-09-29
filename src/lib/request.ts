import type { NextRequest } from "next/server";

/**
 * The caller's address as Vercel reports it. Behind the platform proxy the
 * socket address is the proxy, so the first hop of x-forwarded-for is the one
 * that means anything. "unknown" collapses every local request into one
 * reader, which is what you want in development.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
