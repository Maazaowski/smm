"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { downstream, readGraph } from "@/lib/flow-graph";

/**
 * Renders a ```mermaid fence as an actual diagram, then makes it followable.
 *
 * Mermaid needs a DOM to measure text before it can lay a graph out, so there
 * is no honest way to do this on the server — it is a client component that
 * imports the library lazily. The import lives inside the effect rather than at
 * module scope so the parser only ships to readers of essays that actually
 * contain a diagram.
 *
 * What mermaid hands back is a flat picture: every node the same grey, every
 * arrow the same weight, and no way to tell the success branch from the failure
 * branch without reading all of it. So the SVG gets a second pass — see
 * lib/flow-graph.ts — that recovers the graph, works out what each node MEANS,
 * and hangs data attributes off it for the stylesheet to colour.
 *
 * The pre-hydration state is deliberately empty rather than a flash of the
 * source: the fence is authored as a picture, and showing its definition for
 * 200ms before replacing it reads as a bug. Readers without JavaScript still
 * get the source, via <noscript>.
 */
export function MermaidDiagram({ source }: { source: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);

  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [legend, setLegend] = useState<"none" | "toned">("none");

  // Mermaid uses this as a DOM id and inside its own CSS selectors, so the
  // colons React puts in useId() would produce invalid selectors.
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;

        // Read the palette off the host rather than hardcoding it. The tokens
        // live on `.sg`, the host is inside it, so custom properties resolve
        // by inheritance and the diagram tracks the design system for free.
        const token = (name: string, fallback: string) => {
          const v = hostRef.current
            ? getComputedStyle(hostRef.current).getPropertyValue(name).trim()
            : "";
          return v || fallback;
        };

        const raise = token("--raise", "#0e1114");
        const edge = token("--edge", "#2b3238");
        const text = token("--text", "#b6bfc6");
        const dim = token("--dim", "#8d979e");
        const near = token("--near", "#07090b");
        const line = token("--line", "#1c2126");
        const ground = token("--void", "#000000");
        const mono = token("--mono", "ui-monospace, Menlo, monospace");

        mermaid.initialize({
          startOnLoad: false,
          // Author content reaches this from the database via the admin, so
          // label HTML stays sanitised even though the author is the owner.
          securityLevel: "strict",
          // Mermaid otherwise appends its own error graphic to <body>, outside
          // React's tree, where nothing will ever clean it up.
          suppressErrorRendering: true,
          theme: "base",
          darkMode: true,
          fontFamily: mono,
          themeVariables: {
            background: ground,
            primaryColor: raise,
            primaryBorderColor: edge,
            primaryTextColor: text,
            secondaryColor: line,
            tertiaryColor: near,
            mainBkg: raise,
            nodeBorder: edge,
            nodeTextColor: text,
            lineColor: dim,
            textColor: text,
            clusterBkg: near,
            clusterBorder: line,
            edgeLabelBackground: ground,
            fontFamily: mono,
            fontSize: "13px",
          },
          flowchart: { curve: "linear", padding: 14, useMaxWidth: true },
          sequence: { useMaxWidth: true },
          gantt: { useMaxWidth: true },
        });

        const { svg } = await mermaid.render(id, source);
        if (live) setSvg(svg);
      } catch {
        // A syntax error in the fence should surface the fence, not a blank
        // gap the author will never notice.
        if (live) setFailed(true);
      }
    })();

    return () => {
      live = false;
    };
  }, [id, source]);

  /** Restart the walk-through from the top. */
  const replay = useCallback(() => {
    const fig = figureRef.current;
    if (!fig) return;
    fig.dataset.anim = "idle";
    // Force a reflow so removing and re-adding the attribute actually
    // restarts the animations rather than being coalesced into a no-op.
    void fig.offsetWidth;
    fig.dataset.anim = "run";
  }, []);

  // ---- second pass: read the graph back and wire the interaction ----------
  useEffect(() => {
    const host = hostRef.current;
    const fig = figureRef.current;
    if (!svg || !host || !fig) return;

    /*
     * The SVG is injected here rather than through dangerouslySetInnerHTML,
     * and the host is rendered as a permanently empty div, so React never owns
     * this subtree. It did once: the decorations below were being applied and
     * then silently reverted on the next render, because everything this
     * effect writes onto the picture is invisible to the reconciler and a
     * re-managed innerHTML takes it all back out. Owning the node outright is
     * the fix, and it is the usual arrangement for third-party DOM.
     */
    host.innerHTML = svg;

    const root = host.querySelector("svg");
    if (!root) return;

    const graph = readGraph(root);
    if (!graph) return;
    setLegend(graph.toned ? "toned" : "none");

    // --- paint meaning onto the picture ---
    for (const node of graph.nodes.values()) {
      node.el.dataset.role = node.role;
      node.el.dataset.tone = node.tone;
      node.el.style.setProperty("--fn-step", String(node.step));
      node.el.setAttribute("tabindex", "0");
      node.el.setAttribute("role", "button");

      const outs = node.out
        .map((i) => graph.edges[i])
        .map((e) =>
          e.label
            ? `${e.label} to ${graph.nodes.get(e.to)!.label}`
            : `to ${graph.nodes.get(e.to)!.label}`,
        );

      node.el.setAttribute(
        "aria-label",
        outs.length
          ? `${node.label}. Leads ${outs.join("; ")}. Activate to trace this path.`
          : `${node.label}. End of this path.`,
      );
    }

    for (const e of graph.edges) {
      e.el.dataset.tone = e.tone;
      e.el.style.setProperty("--fn-step", String(e.step));
      // The draw-on animation needs the path's own length to run against.
      const len = e.el.getTotalLength();
      e.el.style.setProperty("--fn-len", `${Math.ceil(len)}`);

      if (e.labelEl) {
        e.labelEl.dataset.tone = e.tone;
        e.labelEl.style.setProperty("--fn-step", String(e.step));
      }
    }

    // --- tracing ---
    let pinned: string | null = null;

    const clear = () => {
      fig.dataset.trace = "off";
      for (const n of graph.nodes.values()) delete n.el.dataset.lit;
      for (const e of graph.edges) {
        delete e.el.dataset.lit;
        if (e.labelEl) delete e.labelEl.dataset.lit;
      }
    };

    const trace = (key: string) => {
      // Any interaction means the reader is driving now; drop the intro so the
      // two animations never fight over the same opacity.
      fig.dataset.anim = "idle";

      const { litNodes, litEdges } = downstream(graph, key);
      fig.dataset.trace = "on";

      for (const n of graph.nodes.values()) {
        if (litNodes.has(n.key)) n.el.dataset.lit = "1";
        else delete n.el.dataset.lit;
      }
      graph.edges.forEach((e, i) => {
        if (litEdges.has(i)) {
          e.el.dataset.lit = "1";
          if (e.labelEl) e.labelEl.dataset.lit = "1";
        } else {
          delete e.el.dataset.lit;
          if (e.labelEl) delete e.labelEl.dataset.lit;
        }
      });
    };

    const cleanups: Array<() => void> = [];

    for (const node of graph.nodes.values()) {
      const el = node.el;
      const key = node.key;

      const enter = () => {
        if (!pinned) trace(key);
      };
      const leave = () => {
        if (!pinned) clear();
      };
      // Tap has no hover, so a press is what pins the path on a phone.
      const click = (ev: Event) => {
        ev.stopPropagation();
        if (pinned === key) {
          pinned = null;
          clear();
        } else {
          pinned = key;
          trace(key);
        }
      };
      const keydown = (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          click(ev);
        }
      };

      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      el.addEventListener("focus", enter);
      el.addEventListener("blur", leave);
      el.addEventListener("click", click);
      el.addEventListener("keydown", keydown);

      cleanups.push(() => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
        el.removeEventListener("focus", enter);
        el.removeEventListener("blur", leave);
        el.removeEventListener("click", click);
        el.removeEventListener("keydown", keydown);
      });
    }

    const unpin = () => {
      pinned = null;
      clear();
    };
    const onEscape = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && pinned) unpin();
    };
    root.addEventListener("click", unpin);
    document.addEventListener("keydown", onEscape);
    cleanups.push(() => {
      root.removeEventListener("click", unpin);
      document.removeEventListener("keydown", onEscape);
    });

    // --- the intro walk, once, when it comes into view ---
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      fig.dataset.anim = "idle";
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            replay();
            io.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(fig);
      cleanups.push(() => io.disconnect());
    }

    return () => {
      for (const fn of cleanups) fn();
    };
  }, [svg, replay]);

  return (
    <figure
      ref={figureRef}
      className="fn-code fn-mermaid"
      data-state={failed ? "failed" : svg ? "ready" : "pending"}
      data-anim="idle"
      data-trace="off"
    >
      <figcaption className="fn-code-bar">
        <span>{failed ? "mermaid — could not render" : "diagram"}</span>

        {svg && !failed && (
          <span className="fn-code-tools">
            {legend === "toned" && (
              <span className="fn-legend" aria-hidden="true">
                <span data-tone="pass">pass</span>
                <span data-tone="fail">fail</span>
              </span>
            )}
            <button type="button" className="fn-code-btn" onClick={replay}>
              replay
            </button>
          </span>
        )}
      </figcaption>

      {failed ? (
        <pre>
          <code>{source}</code>
        </pre>
      ) : (
        // Intentionally childless: the effect above fills this in and keeps
        // it, and React must not reconcile what it cannot see.
        <div ref={hostRef} className="fn-mermaid-host" />
      )}

      {svg && !failed && (
        <div className="fn-mermaid-hint sg-mono">
          Hover or tap a step to trace where it leads.
        </div>
      )}

      <noscript>
        <pre>
          <code>{source}</code>
        </pre>
      </noscript>
    </figure>
  );
}
