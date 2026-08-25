"use client";

import { useEffect, useState } from "react";
import type { TableOfContentsItem } from "@/lib/types";

/**
 * The contents rail.
 *
 * Fixes the production TOC, whose sticky element sat inside an auto-height
 * <nav> and therefore stopped travelling after 288px, leaving a 224px dead
 * column beside the rest of the article. Here the rail is fixed to the
 * viewport, so it is present for the whole read, and it carries progress —
 * which replaces the separate gradient progress bar entirely.
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
    const article = document.getElementById("fn-article");
    if (!article) return;

    const onScroll = () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const done = total > 0 ? (-rect.top / total) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, done)));
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

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -66% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const left = Math.max(0, Math.round(minutes * (1 - progress / 100)));

  return (
    <nav className="fn-rail" aria-label="Contents">
      <div className="fn-rail-inner">
        <p className="fn-label fn-rail-head">
          Contents
          <span className="fn-rail-left">
            {left === 0 ? "done" : `${left} min left`}
          </span>
        </p>

        <ol className="fn-rail-list">
          {headings
            .filter((h) => h.level === 2)
            .map((h, i) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  data-active={activeId === h.id ? "true" : undefined}
                >
                  <span className="fn-rail-n fn-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="fn-rail-t">{h.title}</span>
                </a>
              </li>
            ))}
        </ol>

        <div
          className="fn-rail-progress"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Reading progress"
        >
          <span style={{ transform: `scaleY(${progress / 100})` }} />
        </div>
      </div>
    </nav>
  );
}
