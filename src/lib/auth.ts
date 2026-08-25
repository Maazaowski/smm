import { cookies } from "next/headers";
import { redis } from "./redis";

const SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 60 * 60 * 24; // 24 hours in seconds
const SESSION_KEY = (id: string) => `admin-session:${id}`;

/**
 * Sessions are random opaque ids stored server-side with a TTL.
 *
 * The previous scheme made the cookie value `SHA-256(ADMIN_PASSWORD + salt)`
 * with a salt that is a literal in a public repo. That value was identical for
 * every session, never rotated, could not be revoked, and was reversible to the
 * password by anyone who captured the cookie once. A random id fixes all four:
 * it carries no secret, differs per login, expires server-side, and can be
 * deleted to end a session.
 *
 * Falls back to a stateless HMAC when Redis is not configured, so local
 * development without Upstash still works — that fallback is still per-session
 * random and expiring, it just cannot be revoked early.
 */

export async function verifyAuth(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;

  if (redis) {
    const exists = await redis.exists(SESSION_KEY(session.value));
    return exists === 1;
  }

  return verifyStatelessToken(session.value);
}

export async function createSession(): Promise<void> {
  if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD not set");

  const token = redis ? randomId() : await signStatelessToken();

  if (redis) {
    await redis.set(SESSION_KEY(token), "1", { ex: SESSION_DURATION });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (redis && session?.value) {
    await redis.del(SESSION_KEY(session.value));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Constant-time string comparison. A plain `!==` leaks the length of the
 * matching prefix through response timing.
 */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare a fixed number of bytes so the loop length does not depend on input.
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Stateless fallback (no Redis) -----------------------------------------
// Format: <nonce>.<expiryMs>.<hmac>. Still random per session and still
// expiring; it just cannot be revoked before its expiry.

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(payload: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signStatelessToken(): Promise<string> {
  const payload = `${randomId()}.${Date.now() + SESSION_DURATION * 1000}`;
  return `${payload}.${await sign(payload)}`;
}

async function verifyStatelessToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [nonce, expiry, mac] = parts;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return safeEqual(mac, await sign(`${nonce}.${expiry}`));
}
