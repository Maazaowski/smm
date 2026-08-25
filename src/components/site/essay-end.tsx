"use client";

import { useState } from "react";
import { SITE } from "@/lib/constants";

/**
 * How an essay ends.
 *
 * One ask and two utilities. The old article footer stacked five modules here —
 * custom reactions permanently at zero, a share row, a newsletter card, a
 * Giscus embed that loaded its own second reaction bar and comment box, then a
 * three-card related grid. Four competing asks, all showing nothing.
 *
 * Subscribing is the ask because it is the only one that compounds. Comments
 * are a link rather than an iframe: every thread currently has zero comments,
 * and the URLs deliberately did not change, so the threads stay attached if the
 * embed is ever wanted back.
 */
export function EssayEnd({ title, slug }: { title: string; slug: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "bad" | "sending" | "done">("idle");
  const [copied, setCopied] = useState(false);
  const url = `${SITE.url}/blog/${slug}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Designed validation, not the browser's light-themed native bubble on a
    // black page — which is what the old forms fell back to.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setState("bad");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setState(res.ok ? "done" : "bad");
    } catch {
      setState("bad");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="sg-end">
      <div className="sg-slug">
        <span className="sg-slug-n">[·]</span>
        <span className="sg-slug-label">{"// End"}</span>
        <span className="sg-slug-fact">One email per essay</span>
      </div>

      <div className="sg-end-inner">
        <div>
          <h2 className="sg-h3">Get the next one</h2>
          {state === "done" ? (
            <p className="sg-end-done sg-mono" role="status">
              ✓ Confirmed — {email}
            </p>
          ) : (
            <form onSubmit={submit} noValidate className="sg-end-form">
              <input
                className="sg-field"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "bad") setState("idle");
                }}
                placeholder="you@work.com"
                aria-label="Email address"
                aria-invalid={state === "bad"}
                aria-describedby={state === "bad" ? "sg-email-err" : undefined}
                data-invalid={state === "bad" ? "true" : undefined}
                disabled={state === "sending"}
              />
              <button
                type="submit"
                className="sg-cta"
                data-fill="true"
                disabled={state === "sending"}
              >
                {state === "sending" ? "…" : "Subscribe"}
              </button>
            </form>
          )}
          {state === "bad" && (
            <span className="sg-error sg-mono" id="sg-email-err" role="alert">
              That address is missing an @ or a domain.
            </span>
          )}
          <p className="sg-end-note">
            No drip sequence. Unsubscribe is one click in the first line.
          </p>
        </div>

        <div className="sg-end-tools">
          <button type="button" className="sg-cta" onClick={copy}>
            {copied ? "✓ copied" : "copy link"}
          </button>
          <a
            className="sg-cta"
            href={`https://github.com/${SITE.author.github}/${SITE.author.handle}/discussions?discussions_q=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            discuss ↗
          </a>
        </div>
      </div>
    </section>
  );
}
