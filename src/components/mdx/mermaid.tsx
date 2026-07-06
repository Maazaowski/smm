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
                primaryColor: "#f6efe6",
                primaryBorderColor: "#c2703d",
                primaryTextColor: "#3a2c22",
                lineColor: "#b5602f",
                secondaryColor: "#f2e3d2",
                tertiaryColor: "#faf5ee",
                clusterBkg: "#faf5ee",
                clusterBorder: "#e0cdb6",
                edgeLabelBackground: "#f6efe6",
                fontSize: "15px",
              }
            : {
                background: "transparent",
                primaryColor: "#241d16",
                primaryBorderColor: "#e0a566",
                primaryTextColor: "#efe4d6",
                lineColor: "#d98b52",
                secondaryColor: "#2c231a",
                tertiaryColor: "#221b14",
                clusterBkg: "#1d1710",
                clusterBorder: "#4a3b2a",
                edgeLabelBackground: "#181209",
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
