import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "@/lib/constants";

/**
 * One-click unsubscribe links.
 *
 * Each newsletter email carries a link to /api/unsubscribe?e=<email>&t=<token>
 * where the token is an HMAC-SHA256 of the lowercase address under
 * NEWSLETTER_SECRET. Only the server can mint one, so a link proves the
 * address was handed out by us and nothing else is needed to act on it: no
 * login, no confirmation page, no second click. The same URL is what Gmail,
 * Apple Mail and Outlook POST to for their native Unsubscribe control
 * (RFC 8058).
 *
 * The secret is read at call time, not module load, so a missing variable
 * fails per request (503 at the endpoint, mailto fallback in the emails)
 * rather than at build.
 */

const PATH = "/api/unsubscribe";

export function isUnsubscribeConfigured(): boolean {
  return Boolean(process.env.NEWSLETTER_SECRET);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Hex HMAC-SHA256 of the normalized address, or null when there is no secret. */
export function unsubscribeToken(email: string): string | null {
  const secret = process.env.NEWSLETTER_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex");
}

/**
 * The signed per-recipient URL, or null when NEWSLETTER_SECRET is unset, in
 * which case callers should fall back to the mailto.
 */
export function unsubscribeUrl(email: string): string | null {
  const token = unsubscribeToken(email);
  if (!token) return null;
  const params = new URLSearchParams({ e: normalizeEmail(email), t: token });
  return `${SITE.url}${PATH}?${params.toString()}`;
}

/** Constant-time check of a presented token against the one we would mint. */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (!expected) return false;
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
