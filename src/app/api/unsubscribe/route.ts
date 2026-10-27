import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { SITE } from "@/lib/constants";
import {
  isUnsubscribeConfigured,
  normalizeEmail,
  verifyUnsubscribeToken,
} from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe: GET /api/unsubscribe?e=<email>&t=<token>
 *
 * The token is an HMAC of the address (see lib/unsubscribe.ts), so a valid
 * link is the whole proof. The address comes off the `subscribers` set at
 * once and the reader lands on a small page in the site's look. No form, no
 * "are you sure", no login.
 *
 * POST with the same query is what mail clients send for RFC 8058 one-click
 * (body `List-Unsubscribe=One-Click`). It does exactly the same thing; the
 * body is not needed because the identity is in the signed URL.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_RE = /^[0-9a-f]{64}$/;

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  if (!isUnsubscribeConfigured()) {
    return page(503, {
      slug: "// UNAVAILABLE",
      headline: "Not right now.",
      body:
        "Unsubscribing isn't configured on this server yet. Reply to the email with " +
        "\u201cunsubscribe\u201d and it will be done by hand.",
    });
  }

  const params = request.nextUrl.searchParams;
  const email = normalizeEmail(params.get("e") ?? "");
  const token = (params.get("t") ?? "").trim().toLowerCase();

  const valid =
    email.length > 0 &&
    email.length <= 254 &&
    EMAIL_RE.test(email) &&
    TOKEN_RE.test(token) &&
    verifyUnsubscribeToken(email, token);

  if (!valid) {
    return page(400, {
      slug: "// NOT VALID",
      headline: "This link is not valid.",
      body:
        "It may have been cut short when it was copied, or it belongs to a different address. " +
        "Open the newest email from me and use the link in its first line, or reply with " +
        "\u201cunsubscribe\u201d.",
    });
  }

  if (!redis) {
    return page(503, {
      slug: "// UNAVAILABLE",
      headline: "Not right now.",
      body:
        "The subscriber list can't be reached at the moment. Try the link again in a few " +
        "minutes, or reply to the email with \u201cunsubscribe\u201d.",
    });
  }

  // srem returns 1 when the member was present and removed, 0 when it was
  // already gone (a second click, or a client that GETs then POSTs). Only a
  // real removal moves the counter, so repeats can't drive it negative.
  const removed = await redis.srem("subscribers", email);
  if (removed) {
    await redis.decr("subscribers:count");
  }

  return page(200, {
    slug: "// UNSUBSCRIBED",
    headline: "You\u2019re off the list.",
    body: `${email} won\u2019t get another email from me. The essays stay where they were.`,
  });
}

/* ------------------------------------------------------------------------ */
/*  Page                                                                     */
/* ------------------------------------------------------------------------ */

interface PageCopy {
  slug: string;
  headline: string;
  body: string;
}

/**
 * A single screen in the Signal language: black ground, a slug line as the
 * spine, the headline set large, mono micro text, one cyan dot, one way back.
 * Inline styles only, so the page needs nothing else to render.
 */
function page(status: number, { slug, headline, body }: PageCopy) {
  const mono =
    "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const display = "'Clash Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const text =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const micro = `font-family:${mono};font-size:10px;line-height:1.6;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;`;
  const home = SITE.url.replace(/^https?:\/\//, "");
  const year = new Date().getFullYear();

  const html = `<!doctype html>
<html lang="en" style="color-scheme:dark;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="dark">
<title>${esc(headline)} — ${esc(SITE.name)}</title>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@700&display=swap">
<style>
  html, body { margin: 0; padding: 0; background: #000; color: #b6bfc6; }
  a { color: inherit; }
  @media (max-width: 600px) {
    .col { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 34px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#000;min-height:100vh;">
  <main class="col" style="max-width:560px;margin:0 auto;padding:36px 28px 44px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid #1c2126;padding-top:12px;${micro}color:#fff;white-space:nowrap;">
      <span>[--]</span>
      <span>${esc(slug)}</span>
      <span style="color:#6f797f;">${esc(home)}</span>
    </div>
    <div style="height:52px;"></div>
    <h1 class="h1" style="margin:0 0 22px;font-family:${display};font-weight:700;font-size:46px;line-height:0.96;letter-spacing:-0.015em;word-spacing:0.08em;text-transform:uppercase;color:#fff;">${esc(headline)}</h1>
    <p style="margin:0 0 30px;font-family:${text};font-size:17px;line-height:1.6;color:#b6bfc6;">${esc(body)}</p>
    <a href="${SITE.url}" style="display:inline-block;padding:15px 30px;border-radius:999px;background:#fff;font-family:${mono};font-size:11px;line-height:18px;letter-spacing:0.16em;text-transform:uppercase;font-weight:500;color:#000;text-decoration:none;">Back to ${esc(home)}&nbsp;&nbsp;&rarr;</a>
    <div style="height:72px;"></div>
    <div style="display:flex;justify-content:space-between;border-top:1px solid #2b3238;padding-top:16px;${micro}color:#8d979e;white-space:nowrap;">
      <span style="color:#fff;font-weight:700;">MAAZ</span>
      <span><span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:#3fd7e8;vertical-align:middle;margin:-2px 8px 0 0;"></span><a href="${SITE.url}" style="color:#8d979e;text-decoration:none;">${esc(home)}</a></span>
    </div>
    <p style="margin:18px 0 0;${micro}color:#6f797f;">${esc(SITE.author.name)} &mdash; Karachi, PK &mdash; ${year}</p>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
