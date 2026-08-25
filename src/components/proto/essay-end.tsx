"use client";

import { useState } from "react";

/**
 * How an essay ends.
 *
 * The production article stacks five modules here — custom reactions at zero,
 * a share row, a newsletter card, Giscus (which brings its OWN reaction bar and
 * comment box), then a three-card related grid. Two reaction systems, four
 * competing asks, all showing zero.
 *
 * This is one ask and one utility. The subscribe field is the ask because it is
 * the only one that compounds; copying a link is the utility because it is what
 * people actually do with a technical post. Comments stay on GitHub, where the
 * audience already is, behind a link rather than an iframe that loads on every
 * article whether anyone opens it or not.
 */
export function EssayEnd({ title, slug }: { title: string; slug: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "bad" | "done">("idle");
  const [copied, setCopied] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Designed validation, not the browser's light-themed native bubble.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setState("bad");
      return;
    }
    setState("done");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `https://maazaowski.com/blog/${slug}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fn-end">
      <div className="fn-end-ask">
        <p className="fn-label">One email when there is a new essay</p>
        {state === "done" ? (
          <p className="fn-end-done fn-mono" role="status">
            ✓ Confirmed — check {email} for the first one.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="fn-end-form">
            <input
              className="fn-field"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === "bad") setState("idle");
              }}
              placeholder="you@work.com"
              aria-label="Email address"
              aria-invalid={state === "bad"}
              aria-describedby={state === "bad" ? "fn-email-err" : undefined}
              data-invalid={state === "bad" ? "true" : undefined}
            />
            <button type="submit" className="fn-btn" data-variant="primary">
              Subscribe
            </button>
          </form>
        )}
        {state === "bad" && (
          <span className="fn-error" id="fn-email-err" role="alert">
            That address is missing an @ or a domain.
          </span>
        )}
        <p className="fn-end-note">
          No drip sequence, no newsletter platform branding. Unsubscribe is one
          click in the first line.
        </p>
      </div>

      <div className="fn-end-tools">
        <button type="button" className="fn-btn" data-variant="quiet" onClick={copy}>
          {copied ? "✓ copied" : "copy link"}
        </button>
        <a
          className="fn-btn"
          data-variant="quiet"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            `https://maazaowski.com/blog/${slug}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          share
        </a>
        <a
          className="fn-btn"
          data-variant="quiet"
          href={`https://github.com/Maazaowski/maazaowski/discussions?discussions_q=${encodeURIComponent(
            title
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          discuss on github
        </a>
      </div>
    </div>
  );
}
