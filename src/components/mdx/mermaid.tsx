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
        const isLight = resolvedTheme === "light";
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: "var(--font-inter), sans-serif",
          // Tuned to the site palette: teal borders, blue/purple edges, on a
          // glassy navy (dark) or slate (light) surface.
          themeVariables: isLight
            ? {
                background: "transparent",
                primaryColor: "#f1f5f9",
                primaryBorderColor: "#0d9488",
                primaryTextColor: "#0f172a",
                lineColor: "#7c3aed",
                secondaryColor: "#ede9fe",
                tertiaryColor: "#f8fafc",
                clusterBkg: "#f8fafc",
                clusterBorder: "#cbd5e1",
                edgeLabelBackground: "#f1f5f9",
                fontSize: "15px",
              }
            : {
                background: "transparent",
                primaryColor: "#161e2e",
                primaryBorderColor: "#2dd4bf",
                primaryTextColor: "#e2e8f0",
                lineColor: "#a78bfa",
                secondaryColor: "#1e2740",
                tertiaryColor: "#161e2e",
                clusterBkg: "#131a28",
                clusterBorder: "#334155",
                edgeLabelBackground: "#0f1623",
                fontSize: "15px",
              },
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
