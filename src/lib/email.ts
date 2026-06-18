import { SITE } from "@/lib/constants";

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a single transactional email through Resend. Returns false (without
 * throwing) when RESEND_API_KEY is not configured, so callers can treat email
 * as best-effort. Throws on an actual Resend API error.
 */
export async function sendEmail({ to, subject, html }: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to,
      reply_to: SITE.author.email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
  return true;
}

interface BatchEmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send up to 100 distinct emails in a single Resend batch request. Each
 * recipient gets their own message (no shared To/CC), so addresses stay
 * private. Returns false when RESEND_API_KEY is not configured.
 */
export async function sendEmailBatch(messages: BatchEmailMessage[]): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  if (messages.length === 0) return true;

  const from = emailFrom();
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      messages.map((m) => ({
        from,
        to: m.to,
        reply_to: SITE.author.email,
        subject: m.subject,
        html: m.html,
      }))
    ),
  });

  if (!res.ok) {
    throw new Error(`Resend batch ${res.status}: ${await res.text()}`);
  }
  return true;
}

export function emailFrom(): string {
  return process.env.NEWSLETTER_FROM ?? `${SITE.name} <hello@maazaowski.com>`;
}

/** Wrap body content in the shared newsletter shell (light background, signature). */
export function emailLayout(inner: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a; line-height: 1.6;">
      ${inner}
      <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">
        ${SITE.author.name}
      </p>
    </div>
  `;
}
