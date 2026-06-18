import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { getPostBySlug } from "@/lib/posts";
import { sendEmailBatch, emailLayout } from "@/lib/email";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 100; // Resend batch endpoint limit

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!redis) {
    return NextResponse.json(
      { error: "Subscriber storage is not configured." },
      { status: 503 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email sending is not configured (RESEND_API_KEY missing)." },
      { status: 503 }
    );
  }

  const { slug } = await params;

  // The post must exist and be published. We never email drafts.
  const post = await getPostBySlug(slug, true).catch(() => null);
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (post.frontmatter.draft) {
    return NextResponse.json(
      { error: "This post is a draft. Publish it before notifying subscribers." },
      { status: 400 }
    );
  }

  // Idempotency guard: claim the slug atomically so concurrent or repeat
  // clicks can never double-send. NX = only set if not already present.
  const claimed = await redis.set(`notified:${slug}`, new Date().toISOString(), {
    nx: true,
  });
  if (claimed === null) {
    return NextResponse.json(
      { error: "This post was already sent to subscribers.", alreadySent: true },
      { status: 409 }
    );
  }

  const subscribers = await redis.smembers("subscribers");
  if (subscribers.length === 0) {
    // Nothing to send, but the post is now flagged as "handled" so the button
    // settles into the Sent state rather than inviting an empty re-send.
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const url = `${SITE.url}/blog/${slug}`;
  const html = emailLayout(`
    <p style="margin: 0 0 4px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
      ${post.frontmatter.category}
    </p>
    <h2 style="margin: 0 0 12px;">${escapeHtml(post.frontmatter.title)}</h2>
    <p style="margin: 0 0 20px;">${escapeHtml(post.frontmatter.description)}</p>
    <p style="margin: 0 0 16px;">
      <a href="${url}" style="display: inline-block; background: #14b8a6; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px;">
        Read the post
      </a>
    </p>
  `);

  const subject = post.frontmatter.title;

  try {
    let sent = 0;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const chunk = subscribers.slice(i, i + BATCH_SIZE);
      await sendEmailBatch(chunk.map((to) => ({ to, subject, html })));
      sent += chunk.length;
      // Stay under Resend's request-rate limit between batches.
      if (i + BATCH_SIZE < subscribers.length) {
        await sleep(600);
      }
    }
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    // The send failed partway. Release the guard so the admin can retry,
    // accepting that some subscribers may receive a duplicate on retry.
    await redis.del(`notified:${slug}`);
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin notify]", message);
    return NextResponse.json(
      { error: `Send failed: ${message}` },
      { status: 502 }
    );
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
