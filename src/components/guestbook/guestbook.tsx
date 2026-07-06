"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Entry {
  id: string;
  name: string;
  message: string;
  ts: number;
}

export function Guestbook() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (data.entry) setEntries((prev) => [data.entry, ...prev]);
      setName("");
      setMessage("");
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="h-fit rounded-2xl border border-glass-border bg-glass-bg p-6 backdrop-blur-xl lg:sticky lg:top-24"
      >
        <h2 className="mb-4 text-lg font-semibold text-primary">Sign the guestbook</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
          placeholder="Your name"
          className="mb-3 w-full rounded-xl border border-glass-border bg-surface-1 px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          required
          rows={4}
          placeholder="Leave a message..."
          className="mb-1 w-full resize-none rounded-xl border border-glass-border bg-surface-1 px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue"
        />
        {/* Honeypot: hidden from real users */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <div className="mb-3 text-right text-xs text-muted">{message.length}/500</div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-xl bg-accent-blue px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-105 disabled:opacity-60"
        >
          {status === "loading" ? "Signing..." : "Sign"}
        </button>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </form>

      {/* Wall */}
      <div>
        {entries.length === 0 ? (
          <p className="py-16 text-center text-secondary">
            No messages yet. Be the first to sign.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 20,
                    delay: Math.min(i * 0.03, 0.3),
                  }}
                  className="rounded-2xl border border-glass-border bg-glass-bg p-5 backdrop-blur-[16px]"
                >
                  <p className="mb-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                    {entry.message}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {entry.name}
                    <span className="ml-2 font-normal text-muted">
                      {new Date(entry.ts).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
