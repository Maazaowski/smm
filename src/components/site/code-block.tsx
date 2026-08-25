"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

/**
 * Chrome around a highlighted code fence: language on the left, copy on the
 * right, and the <pre> itself passed straight through from the server.
 *
 * The text is read back off the DOM at copy time rather than being threaded
 * through as a second prop. rehype-pretty-code has already serialised the
 * source into the markup once; sending it again as a string would double the
 * weight of every code block in the RSC payload to save a `textContent`.
 */
export function CodeBlock({
  language,
  children,
}: {
  language?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = useCallback(async () => {
    const text = ref.current?.querySelector("pre")?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // Clipboard access is refusable, and an unlabelled no-op looks like a
      // broken button.
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1600);
  }, []);

  return (
    <figure className="fn-code" ref={ref}>
      <figcaption className="fn-code-bar">
        <span>{language || "text"}</span>
        <span className="fn-code-tools">
          <button
            type="button"
            className="fn-code-btn"
            onClick={copy}
            data-state={state}
            // The label carries the result so a screen reader hears the
            // outcome, not just the word "copy" again.
            aria-label={
              state === "copied"
                ? "Copied to clipboard"
                : state === "failed"
                  ? "Could not copy to clipboard"
                  : "Copy code to clipboard"
            }
          >
            {state === "copied"
              ? "copied"
              : state === "failed"
                ? "blocked"
                : "copy"}
          </button>
        </span>
      </figcaption>
      {children}
    </figure>
  );
}
