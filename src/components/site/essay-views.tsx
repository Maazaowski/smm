"use client";

import { useEffect, useState } from "react";

/**
 * Records a read and shows the count.
 *
 * This is the only place a view is counted. The essay page is served from the
 * ISR cache, so counting on the server would only count regenerations; the
 * redesign dropped the old ViewCounter and with it every view since — the
 * dashboard's 30-day chart had been a flat line at zero.
 *
 * Renders nothing until the count arrives so the server and client markup
 * never disagree. The API deduplicates per reader per essay, which also makes
 * the second request from React's development double-mount harmless.
 */
export function EssayViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { views?: number } | null) => {
        if (!cancelled && typeof data?.views === "number") setViews(data.views);
      })
      .catch(() => {
        /* a missed count is not worth a console error on a reading page */
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (views === null) return null;

  return (
    <>
      <span aria-hidden="true">·</span>
      <span>
        {views.toLocaleString()} {views === 1 ? "view" : "views"}
      </span>
    </>
  );
}
