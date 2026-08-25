"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProtoEssay, ProtoWork } from "@/lib/proto-data";

interface Hit {
  kind: "essay" | "work" | "go";
  title: string;
  sub: string;
  href: string;
  score: number;
}

/**
 * Search, fixing every defect found in the production command palette:
 * Escape closes it, focus lands in the input on open and is trapped while it is
 * open, exact title matches outrank body matches, and every group — including
 * navigation — is filtered by the same query instead of always showing.
 */
export function CommandBar({
  open,
  onClose,
  essays,
  work,
}: {
  open: boolean;
  onClose: () => void;
  essays: ProtoEssay[];
  work: ProtoWork[];
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const places = useMemo(
    () => [
      { title: "Essays", sub: "all writing", href: "/proto/essays" },
      { title: "Work", sub: "shipped projects", href: "/proto/work" },
      { title: "Colophon", sub: "who and how", href: "/proto/colophon" },
      { title: "Desk", sub: "the admin", href: "/proto/admin" },
    ],
    []
  );

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      return essays.slice(0, 5).map<Hit>((e) => ({
        kind: "essay",
        title: e.title,
        sub: `${e.date} · ${e.minutes} min`,
        href: `/proto/essays/${e.slug}`,
        score: 0,
      }));
    }

    // Title matches beat body matches, and a prefix beats a match anywhere.
    // The production palette weights title, description and tags equally, which
    // is why searching "guard" ranked the CS-graduates post above "…guardrail".
    const rank = (title: string, body: string) => {
      const t = title.toLowerCase();
      if (t.startsWith(query)) return 100;
      if (t.includes(query)) return 80 - t.indexOf(query);
      if (body.toLowerCase().includes(query)) return 20;
      return 0;
    };

    const all: Hit[] = [
      ...essays.map<Hit>((e) => ({
        kind: "essay",
        title: e.title,
        sub: `${e.date} · ${e.minutes} min`,
        href: `/proto/essays/${e.slug}`,
        score: rank(e.title, `${e.dek} ${e.body}`),
      })),
      ...work.map<Hit>((w) => ({
        kind: "work",
        title: w.title,
        sub: `${w.year} · ${w.category}`,
        href: `/proto/work/${w.slug}`,
        score: rank(w.title, `${w.summary} ${w.description}`),
      })),
      ...places.map<Hit>((p) => ({
        kind: "go",
        title: p.title,
        sub: p.sub,
        href: p.href,
        score: rank(p.title, p.sub),
      })),
    ];

    return all
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [q, essays, work, places]);

  // Adjusting state during render is React's documented pattern for "reset when
  // an input changes". Doing it in an effect causes a second render pass and a
  // visible frame with the stale value.
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setActive(0);
  }

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQ("");
      setLastQ("");
      setActive(0);
    }
  }

  useEffect(() => {
    if (!open) return;
    // Focus the input, not the dialog — typing should work immediately. This is
    // a DOM sync, which is what effects are for.
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, hits.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && hits[active]) {
        e.preventDefault();
        router.push(hits[active].href);
        onClose();
        return;
      }
      // Keep focus inside the dialog while it is open.
      if (e.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'input, button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, hits, active, onClose, router]);

  if (!open) return null;

  return (
    <>
      <div className="fn-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="fn-dialog fn-cmd"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="fn-cmd-input">
          <span className="fn-label" aria-hidden="true">
            /
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search essays, work, pages"
            className="fn-mono"
            aria-label="Search query"
            autoComplete="off"
          />
        </div>

        {hits.length === 0 ? (
          <p className="fn-cmd-empty fn-mono">
            Nothing matches “{q}”.
          </p>
        ) : (
          <ul className="fn-cmd-list" role="listbox" aria-label="Results">
            {hits.map((hit, i) => (
              <li key={hit.href} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  data-active={i === active ? "true" : undefined}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    router.push(hit.href);
                    onClose();
                  }}
                >
                  <span className="fn-cmd-kind fn-label">{hit.kind}</span>
                  <span className="fn-cmd-title">{hit.title}</span>
                  <span className="fn-cmd-sub fn-mono">{hit.sub}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="fn-cmd-foot fn-mono">
          <span>
            <kbd className="fn-kbd">↑↓</kbd> move
          </span>
          <span>
            <kbd className="fn-kbd">↵</kbd> open
          </span>
          <span>
            <kbd className="fn-kbd">esc</kbd> close
          </span>
        </div>
      </div>
    </>
  );
}
