"use client";

import { useEffect, useState } from "react";
import type { TableOfContentsItem } from "@/lib/types";

/**
 * Contents rail, ported from the Field Notebook prototype into Signal's tokens.
 *
 * The one thing that must not be re-broken: the sticky element's containing
 * block has to be tall enough for it to travel. In production the rail is
 * `sticky top-24` inside an auto-height <nav>, so it sticks for 288px of a
 * 5,868px article and then leaves, abandoning a 224px dead column beside the
 * rest of the piece. Here the rail is the sticky element itself and its parent
 * is the full-height grid column.
 *
 * Progress lives here too, which is why there is no separate bar pinned to the
 * top of the window.
 */
export function ReadingRail({
  headings,
  minutes,
}: {
  headings: TableOfContentsItem[];
  minutes: number;
}) {
  const [activeId, setActiveId] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.getElementById("sg-article");
    if (!article) return;

    const onScroll = () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(
        total > 0 ? Math.min(100, Math.max(0, (-rect.top / total) * 100)) : 0
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-84px 0px -66% 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const left = Math.max(0, Math.round(minutes * (1 - progress / 100)));

  return (
    <nav className="sg-rail" aria-label="Contents">
      <p className="sg-rail-head sg-micro">
        <span>Contents</span>
        <span>{left === 0 ? "done" : `${left} min left`}</span>
      </p>

      <ol className="sg-rail-list">
        {headings
          .filter((h) => h.level === 2)
          .map((h, i) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                data-active={activeId === h.id ? "true" : undefined}
              >
                <span className="sg-rail-n sg-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{h.title}</span>
              </a>
            </li>
          ))}
      </ol>

      <div
        className="sg-rail-bar"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <span style={{ transform: `scaleY(${progress / 100})` }} />
      </div>
    </nav>
  );
}
