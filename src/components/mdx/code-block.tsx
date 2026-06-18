"use client";

import { useRef, useState, Children } from "react";
import { Mermaid } from "./mermaid";

function childrenToText(children: React.ReactNode): string {
  return Children.toArray(children)
    .map((c) => (typeof c === "string" ? c : ""))
    .join("");
}

export function CodeBlock(props: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  // Mermaid blocks are emitted by rehypeMermaid as <pre class="mermaid"> with
  // the raw diagram source as their text child. Render a diagram, not a box.
  const className =
    typeof props.className === "string" ? props.className : "";
  if (className.split(/\s+/).includes("mermaid")) {
    return <Mermaid chart={childrenToText(props.children)} />;
  }

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lang =
    (props as Record<string, unknown>)["data-language"] as string | undefined;

  return (
    <div className="group relative my-6 rounded-xl border border-code-border bg-code-bg overflow-hidden">
      {lang && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-glass-border text-xs text-muted">
          <span className="uppercase tracking-wider">{lang}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-primary text-xs"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
      {!lang && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-primary text-xs bg-surface-1/80 px-2 py-1 rounded-md"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
      <pre ref={preRef} {...props} className="overflow-x-auto p-4 text-sm leading-relaxed" />
    </div>
  );
}
