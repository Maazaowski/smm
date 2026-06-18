import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { SITE } from "@/lib/constants";
import { sendEmail, emailLayout } from "@/lib/email";

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
  await sendEmail({
    to: email,
    subject: `You're subscribed to ${SITE.name}`,
    html: emailLayout(`
      <h2 style="margin: 0 0 12px;">Thanks for subscribing.</h2>
      <p style="margin: 0 0 16px;">
        You'll get an email when I publish something new. I write about
        building software, deploying AI agents, and the things I learn
        along the way.
      </p>
      <p style="margin: 0 0 16px;">
        In the meantime, the latest posts are at
        <a href="${SITE.url}/blog" style="color: #14b8a6;">${SITE.url.replace(/^https?:\/\//, "")}/blog</a>.
      </p>
    `),
  });
}
