"use client";

import { useEffect, useState } from "react";

interface ViewCounterProps {
  slug: string;
}

export function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // Record view and get count
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((r) => r.json())
      .then((data) => setViews(data.views))
      .catch(() => {
        // Fallback: just GET
        fetch(`/api/views?slug=${slug}`)
          .then((r) => r.json())
          .then((data) => setViews(data.views))
          .catch(() => {});
      });
  }, [slug]);

  if (views === null) {
    return <span className="text-muted text-sm">...</span>;
  }

  return (
    <span className="text-muted text-sm tabular-nums">
      {views.toLocaleString()} view{views !== 1 ? "s" : ""}
    </span>
  );
}
