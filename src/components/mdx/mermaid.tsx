"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

export function Mermaid({ chart }: { chart: string }) {
  const { resolvedTheme } = useTheme();
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Lazy-load the heavy mermaid bundle only on posts that use it.
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "light" ? "neutral" : "dark",
          fontFamily: "var(--font-inter), sans-serif",
        });

        // Unique id per render so concurrent (StrictMode) renders never collide.
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const out = await mermaid.render(id, chart);
        setSvg(out.svg);
        setError(false);
      } catch {
        setError(true);
      }
    })();
  }, [chart, resolvedTheme, reactId]);

  if (error) {
    return (
      <pre className="my-6 overflow-x-auto rounded-xl border border-code-border bg-code-bg p-4 text-sm text-muted">
        {chart}
      </pre>
    );
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-glass-border bg-glass-bg p-4 [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
