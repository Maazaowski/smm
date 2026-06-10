"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

interface NewsletterFormProps {
  /** Optional heading + blurb wrapper. Set false to render the input row alone. */
  framed?: boolean;
  className?: string;
}

export function NewsletterForm({ framed = true, className }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        alreadySubscribed?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      setMessage(
        data.alreadySubscribed
          ? "You're already on the list."
          : "You're in. Check your inbox."
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status !== "idle") setStatus("idle");
        }}
        required
        placeholder="you@example.com"
        aria-label="Email address"
        className="min-w-0 flex-1 rounded-full border border-glass-border bg-glass-bg px-4 py-2 text-sm text-primary placeholder:text-muted focus:border-glass-border-hover focus:outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="shrink-0 rounded-full border border-glass-border bg-glass-bg px-5 py-2 text-sm font-medium text-secondary hover:text-primary hover:border-glass-border-hover transition-all disabled:opacity-60"
      >
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </button>
    </form>
  );

  const status_line = message && (
    <p
      className={`mt-2 text-sm ${
        status === "error" ? "text-red-400" : "text-teal-400"
      }`}
      role="status"
    >
      {message}
    </p>
  );

  if (!framed) {
    return (
      <div className={className}>
        {form}
        {status_line}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-glass-border bg-glass-bg p-6 backdrop-blur-xl ${className ?? ""}`}
    >
      <h3 className="text-lg font-semibold text-primary">Subscribe to the newsletter</h3>
      <p className="mt-1 mb-4 text-sm text-secondary">
        New posts on software, AI agents, and what I learn building them.
        Straight to your inbox, no spam.
      </p>
      {form}
      {status_line}
    </div>
  );
}
