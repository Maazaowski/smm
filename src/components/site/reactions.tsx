"use client";

import { useEffect, useState } from "react";
import type { ReactionType, Reactions as Counts } from "@/lib/types";

const KINDS: { type: ReactionType; glyph: string; label: string }[] = [
  { type: "fire", glyph: "🔥", label: "Fire" },
  { type: "heart", glyph: "❤️", label: "Love" },
  { type: "mindblown", glyph: "🤯", label: "Mind blown" },
  { type: "idea", glyph: "💡", label: "Useful" },
];

const ZERO: Counts = { fire: 0, heart: 0, mindblown: 0, idea: 0 };

/**
 * Four reactions, one each per reader, kept in the site's own voice: mono
 * pills on a hairline, no particle burst. The storage key is the one the
 * pre-redesign component used, so anyone who reacted before still sees it.
 */
export function Reactions({ slug }: { slug: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [mine, setMine] = useState<Set<ReactionType>>(() => new Set());
  const storageKey = `reactions:${slug}`;

  useEffect(() => {
    let cancelled = false;
    // Read what this reader already pressed, in the same tick as the counts
    // so the buttons never flash enabled and then lock.
    let remembered: ReactionType[] = [];
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) remembered = JSON.parse(saved) as ReactionType[];
    } catch {
      /* private mode — reacting still works, it just is not remembered */
    }
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : ZERO))
      .then((data: Counts) => {
        if (cancelled) return;
        if (remembered.length) setMine(new Set(remembered));
        setCounts(data);
      })
      .catch(() => {
        if (cancelled) return;
        if (remembered.length) setMine(new Set(remembered));
        setCounts(ZERO);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, storageKey]);

  const react = async (type: ReactionType) => {
    if (mine.has(type)) return;

    const next = new Set(mine);
    next.add(type);
    setMine(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      /* see above */
    }
    setCounts((c) => ({ ...(c ?? ZERO), [type]: (c ?? ZERO)[type] + 1 }));

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type }),
      });
      if (res.ok) setCounts(await res.json());
    } catch {
      /* keep the optimistic count */
    }
  };

  return (
    <div className="sg-react" role="group" aria-label="React to this essay">
      <span className="sg-micro">React</span>
      {KINDS.map((k) => {
        const on = mine.has(k.type);
        return (
          <button
            key={k.type}
            type="button"
            className="sg-cta sg-react-btn"
            data-fill={on ? "true" : undefined}
            disabled={on}
            onClick={() => react(k.type)}
            aria-pressed={on}
            aria-label={`${k.label}${counts ? `, ${counts[k.type]}` : ""}`}
            title={k.label}
          >
            <em aria-hidden="true">{k.glyph}</em>
            <span className="sg-mono">{counts ? counts[k.type] : "–"}</span>
          </button>
        );
      })}
    </div>
  );
}
