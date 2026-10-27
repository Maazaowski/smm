import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { getAllPosts } from "@/lib/posts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (!redis) {
    return NextResponse.json(
      { error: "Subscriptions are not available right now." },
      { status: 503 }
    );
  }

  // sadd returns 1 if the member is new, 0 if it already existed.
  const isNew = await redis.sadd("subscribers", email);

  if (!isNew) {
    return NextResponse.json({ ok: true, alreadySubscribed: true });
  }

  await redis.incr("subscribers:count");

  // Fire the welcome email if Resend is configured. Never block the
  // subscription on email delivery; the address is already saved.
  await sendWelcomeEmail(email).catch((err) => {
    console.error("Welcome email failed:", err);
  });

  return NextResponse.json({ ok: true });
}

async function sendWelcomeEmail(email: string) {
  // The welcome lists the three latest essays so the first email is worth
  // opening. If the DB is down the list is simply empty; the email still goes.
  const published = await getAllPosts().catch(() => [] as Awaited<ReturnType<typeof getAllPosts>>);
  const { subject, html, text, headers } = welcomeEmail({
    latest: published.slice(0, 3),
    total: published.length,
  });
  await sendEmail({ to: email, subject, html, text, headers });
}
