import { SITE } from "@/lib/constants";

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. Improves deliverability and is what a screen reader gets. */
  text?: string;
  /** Extra SMTP headers, e.g. List-Unsubscribe. */
  headers?: Record<string, string>;
}

/**
 * Send a single transactional email through Resend. Returns false (without
 * throwing) when RESEND_API_KEY is not configured, so callers can treat email
 * as best-effort. Throws on an actual Resend API error.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  headers,
}: EmailMessage): Promise<boolean> {
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
      text,
      headers,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
  return true;
}

type BatchEmailMessage = EmailMessage;

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
        text: m.text,
        headers: m.headers,
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
