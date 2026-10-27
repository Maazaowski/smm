import { SITE } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { unsubscribeUrl } from "@/lib/unsubscribe";

export { unsubscribeUrl };

/**
 * Newsletter emails, in the Signal language.
 *
 * The previous shell was a 480px column of system sans on white with a teal
 * pill — the default every email builder emits. These follow the site and the
 * social cards instead: black ground, the slug line as spine, the title set as
 * large as the column allows, mono micro labels, and one cyan dot. No
 * gradient, no card, no illustration.
 *
 * Two promises the site makes are kept here. The essay footer says
 * "Unsubscribe is one click in the first line", so the first line of every
 * email carries a signed per-recipient link to /api/unsubscribe that acts at
 * once (see lib/unsubscribe.ts); the same URL goes in List-Unsubscribe with
 * the RFC 8058 one-click header, so Gmail's native control uses it too. Every
 * email is therefore rendered for one recipient. And the subscribe copy says
 * one email per essay, so the footer repeats exactly that and nothing is
 * added to it.
 *
 * Fonts: Clash Display is linked from Fontshare for clients that honour a
 * stylesheet (Apple Mail, iOS Mail, Outlook for Mac). Gmail and Outlook on
 * Windows strip it and fall to Helvetica/Arial bold, which is the same
 * degradation the OG card accepts. The body deliberately uses the reader's own
 * system face rather than a second webfont.
 */

// Single quotes inside: these land in double-quoted style attributes.
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
const DISPLAY = "'Clash Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const C = {
  void: "#000000",
  line: "#1c2126",
  line2: "#12161a",
  edge: "#2b3238",
  white: "#ffffff",
  text: "#b6bfc6",
  dim: "#8d979e",
  faint: "#6f797f",
  signal: "#3fd7e8",
} as const;

const FONT_LINK =
  "https://api.fontshare.com/v2/css?f[]=clash-display@700&display=swap";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

/** The fallback: a reply from the subscriber's own address is the identity. */
export function unsubscribeMailto(): string {
  const subject = encodeURIComponent("unsubscribe");
  const body = encodeURIComponent("Please take this address off the list.");
  return `mailto:${SITE.author.email}?subject=${subject}&body=${body}`;
}

/**
 * Where the first-line link and the footer send this recipient. The signed
 * HTTPS URL when NEWSLETTER_SECRET is set, otherwise the mailto.
 */
function unsubscribeHref(to: string): string {
  return unsubscribeUrl(to) ?? unsubscribeMailto();
}

function unsubscribeHeaders(to: string): Record<string, string> {
  // Gmail, Apple Mail and Outlook surface List-Unsubscribe as a native
  // Unsubscribe control. With the one-click header they POST to the HTTPS
  // entry without opening a browser; the mailto stays as the second entry
  // for clients that only understand that form.
  const url = unsubscribeUrl(to);
  if (!url) return { "List-Unsubscribe": `<${unsubscribeMailto()}>` };
  return {
    "List-Unsubscribe": `<${unsubscribeMailto()}>, <${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/* ------------------------------------------------------------------------ */
/*  New essay                                                                */
/* ------------------------------------------------------------------------ */

export interface NewEssayOptions {
  /** 1-based position among published essays, or null if unknown. */
  issue: number | null;
  /** The recipient. The unsubscribe link and headers are signed for this address. */
  to: string;
}

export function newEssayEmail(post: Post, { issue, to }: NewEssayOptions): RenderedEmail {
  const { title, description, category, date } = post.frontmatter;
  const url = `${SITE.url}/blog/${post.slug}`;
  const facts = [`// ${category}`, stamp(date), post.readingTime].map(upper);
  const unsubscribe = unsubscribeHref(to);

  const html = shell({
    title,
    preheader: description,
    slug: { n: pad(issue), label: "// NEW ESSAY" },
    unsubscribe,
    body: `
      ${micro(facts.join(sep()), C.dim)}
      ${h1(title)}
      ${para(description)}
      ${cta("Read the essay", url)}
      ${urlLine(url)}
    `,
  });

  const text = [
    `${pad(issue)} // NEW ESSAY`,
    "",
    facts.map(unesc).join("  ·  "),
    "",
    title.toUpperCase(),
    "",
    description,
    "",
    `Read the essay: ${url}`,
    "",
    footerText(unsubscribe),
  ].join("\n");

  return { subject: title, html, text, headers: unsubscribeHeaders(to) };
}

/* ------------------------------------------------------------------------ */
/*  Welcome                                                                  */
/* ------------------------------------------------------------------------ */

export interface WelcomeOptions {
  /** Most recent published essays, newest first. Up to three are shown. */
  latest: Post[];
  /** Total published essays, used for the [NN] on each row. */
  total: number;
  /** The recipient. The unsubscribe link and headers are signed for this address. */
  to: string;
}

export function welcomeEmail({ latest, total, to }: WelcomeOptions): RenderedEmail {
  const blogUrl = `${SITE.url}/blog`;
  const unsubscribe = unsubscribeHref(to);
  const rows = latest.slice(0, 3);
  const headline = "You're on the list.";
  const lede =
    "One email each time an essay goes up. No drip sequence, no digest, nothing else. " +
    "I write about building software, deploying AI agents, and what breaks along the way.";

  const index =
    rows.length === 0
      ? ""
      : `
      ${spacer(44)}
      ${slugLine({
        n: "",
        label: "// LATEST",
        right: `${total} ESSAY${total === 1 ? "" : "S"}`,
      })}
      ${rows
        .map((p, i) =>
          indexRow({
            n: pad(total - i),
            title: p.frontmatter.title,
            meta: [p.frontmatter.category, p.readingTime].map(upper).join(sep()),
            href: `${SITE.url}/blog/${p.slug}`,
            last: i === rows.length - 1,
          })
        )
        .join("")}
    `;

  const html = shell({
    title: headline,
    preheader: "One email per essay. Nothing else.",
    slug: { n: "[00]", label: "// SUBSCRIBED" },
    unsubscribe,
    body: `
      ${micro(["// WELCOME", stamp(new Date().toISOString())].join(sep()), C.dim)}
      ${h1(headline)}
      ${para(lede)}
      ${index}
      ${spacer(36)}
      ${cta("Read the essays", blogUrl)}
      ${urlLine(blogUrl)}
    `,
  });

  const text = [
    "[00] // SUBSCRIBED",
    "",
    headline.toUpperCase(),
    "",
    lede,
    "",
    ...(rows.length
      ? [
          "// LATEST",
          ...rows.map(
            (p, i) =>
              `${pad(total - i)}  ${p.frontmatter.title}  —  ${SITE.url}/blog/${p.slug}`
          ),
          "",
        ]
      : []),
    `Read the essays: ${blogUrl}`,
    "",
    footerText(unsubscribe),
  ].join("\n");

  return {
    subject: `You're on the list — ${SITE.name}`,
    html,
    text,
    headers: unsubscribeHeaders(to),
  };
}

/* ------------------------------------------------------------------------ */
/*  Shell + parts                                                            */
/* ------------------------------------------------------------------------ */

interface ShellOptions {
  title: string;
  preheader: string;
  slug: { n: string; label: string };
  /** This recipient's unsubscribe href: the first-line link and the footer link. */
  unsubscribe: string;
  body: string;
}

function shell({ title, preheader, slug, unsubscribe, body }: ShellOptions): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en" style="color-scheme:dark;supported-color-schemes:dark;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${FONT_LINK}">
<style>
  :root { color-scheme: dark; supported-color-schemes: dark; }
  body { margin: 0; padding: 0; background: ${C.void}; -webkit-text-size-adjust: 100%; }
  table { border-collapse: collapse; }
  a { color: inherit; }
  @media (max-width: 600px) {
    .col { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 34px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.void};" bgcolor="${C.void}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${esc(preheader)}${"&zwnj;&nbsp;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.void}" style="background:${C.void};">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr>
          <td class="col" align="left" style="padding:36px 28px 44px;">
            ${slugLine({
              n: slug.n,
              label: slug.label,
              right: `<a href="${esc(unsubscribe)}" style="color:${C.faint};text-decoration:none;">UNSUBSCRIBE</a>`,
            })}
            ${spacer(52)}
            ${body}
            ${spacer(72)}
            ${footer(year, unsubscribe)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** [NN]  // LABEL  ............  RIGHT — the spine of the page, same as the site. */
function slugLine({ n, label, right }: { n: string; label: string; right: string }): string {
  const cell = `padding-top:12px;font-family:${MONO};font-size:10px;line-height:1.6;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;white-space:nowrap;`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};">
      <tr>
        <td align="left" width="25%" style="${cell}color:${C.white};">${n}</td>
        <td align="center" width="50%" style="${cell}color:${C.white};">${label}</td>
        <td align="right" width="25%" style="${cell}color:${C.faint};">${right}</td>
      </tr>
    </table>`;
}

function micro(content: string, color: string): string {
  return `<p style="margin:0 0 18px;font-family:${MONO};font-size:10px;line-height:1.6;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;color:${color};">${content}</p>`;
}

/** Steps down for long titles, as the OG card does, so the measure never breaks a word. */
function h1(title: string): string {
  const size = title.length > 68 ? 32 : title.length > 42 ? 38 : 46;
  return `<h1 class="h1" style="margin:0 0 22px;font-family:${DISPLAY};font-weight:700;font-size:${size}px;line-height:0.96;letter-spacing:-0.015em;word-spacing:0.08em;text-transform:uppercase;color:${C.white};">${esc(title)}</h1>`;
}

function para(content: string): string {
  return `<p style="margin:0 0 30px;font-family:${BODY};font-size:17px;line-height:1.6;color:${C.text};">${esc(content)}</p>`;
}

/** The site's filled pill: white on black, mono, tracked caps. */
function cta(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="${C.white}" style="border-radius:999px;background:${C.white};">
          <a href="${href}" style="display:inline-block;padding:15px 30px;font-family:${MONO};font-size:11px;line-height:18px;letter-spacing:0.16em;text-transform:uppercase;font-weight:500;color:${C.void};text-decoration:none;">${label}&nbsp;&nbsp;&rarr;</a>
        </td>
      </tr>
    </table>`;
}

/** The destination, in plain sight, under the button. */
function urlLine(href: string): string {
  const shown = href.replace(/^https?:\/\//, "");
  return `<p style="margin:14px 0 0;font-family:${MONO};font-size:10px;line-height:1.6;letter-spacing:0.06em;word-break:break-all;color:${C.faint};"><a href="${href}" style="color:${C.faint};text-decoration:none;">${esc(shown)}</a></p>`;
}

function indexRow({
  n,
  title,
  meta,
  href,
  last,
}: {
  n: string;
  title: string;
  meta: string;
  href: string;
  last: boolean;
}): string {
  const border = last ? "" : `border-bottom:1px solid ${C.line2};`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="44" valign="top" style="${border}padding:16px 0 14px;font-family:${MONO};font-size:10px;line-height:22px;letter-spacing:0.18em;color:${C.dim};">${n}</td>
        <td valign="top" style="${border}padding:16px 0 14px;">
          <a href="${href}" style="display:block;font-family:${BODY};font-size:15px;line-height:22px;font-weight:600;color:${C.white};text-decoration:none;">${esc(title)}</a>
          <span style="display:block;margin-top:4px;font-family:${MONO};font-size:10px;line-height:1.6;letter-spacing:0.16em;text-transform:uppercase;color:${C.faint};">${meta}</span>
        </td>
        <td width="24" align="right" valign="top" style="${border}padding:16px 0 14px;font-family:${MONO};font-size:14px;line-height:22px;color:${C.dim};"><a href="${href}" style="color:${C.dim};text-decoration:none;">&rarr;</a></td>
      </tr>
    </table>`;
}

/** Same footer as the site, plus the one line every newsletter owes its reader. */
function footer(year: number, unsubscribe: string): string {
  const link = `color:${C.dim};text-decoration:none;`;
  const microCell = `font-family:${MONO};font-size:10px;line-height:1.6;letter-spacing:0.16em;text-transform:uppercase;font-weight:500;`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.edge};">
      <tr>
        <td align="left" style="padding-top:16px;${microCell}color:${C.white};font-weight:700;">MAAZ</td>
        <td align="right" style="padding-top:16px;${microCell}color:${C.dim};white-space:nowrap;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:${C.signal};vertical-align:middle;margin:-2px 8px 0 0;"></span><a href="${SITE.url}" style="${link}">maazaowski.com</a>
        </td>
      </tr>
    </table>
    <p style="margin:22px 0 0;${microCell}color:${C.dim};">
      <a href="${SITE.url}/blog" style="${link}">Essays</a>${gap()}<a href="${SITE.url}/projects" style="${link}">Work</a>${gap()}<a href="${SITE.url}/about" style="${link}">About</a>${gap()}<a href="https://github.com/${SITE.author.github}" style="${link}">GitHub</a>${gap()}<a href="${SITE.url}/rss.xml" style="${link}">RSS</a>
    </p>
    <p style="margin:18px 0 0;${microCell}color:${C.faint};">${esc(SITE.author.name)} &mdash; Karachi, PK &mdash; ${year}</p>
    <p style="margin:18px 0 0;font-family:${BODY};font-size:12px;line-height:1.6;color:${C.faint};">
      You're getting this because you subscribed at maazaowski.com. One email per essay, nothing else.
      <a href="${esc(unsubscribe)}" style="color:${C.dim};text-decoration:underline;">Unsubscribe</a> is one click, with nothing to confirm.
    </p>`;
}

function footerText(unsubscribe: string): string {
  return [
    `${SITE.author.name} — Karachi, PK — ${SITE.url}`,
    "You're getting this because you subscribed at maazaowski.com. One email per essay, nothing else.",
    `Unsubscribe (one click): ${unsubscribe}`,
  ].join("\n");
}

/* ------------------------------------------------------------------------ */
/*  Small helpers                                                            */
/* ------------------------------------------------------------------------ */

function spacer(px: number): string {
  return `<div style="height:${px}px;line-height:${px}px;font-size:1px;">&nbsp;</div>`;
}

/** Real spaces around the dot so a facts row can wrap on a phone. */
function sep(): string {
  return " &nbsp;&middot;&nbsp; ";
}

function gap(): string {
  return "&nbsp;&nbsp;&nbsp;&nbsp;";
}

/** "27 OCT 2026" from an ISO date or date-only string. */
function stamp(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(d)
    .toUpperCase();
}

/** "[07]", or "[--]" when the issue number is unknown — the OG card's convention. */
function pad(n: number | null): string {
  return n === null ? "[--]" : `[${String(n).padStart(2, "0")}]`;
}

function upper(s: string): string {
  return esc(s).toUpperCase();
}

/** Reverse of esc(), for the plain-text part. */
function unesc(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
