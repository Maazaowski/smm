"use client";

import { useRef, useState } from "react";

export function CodeBlock(props: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lang =
    (props as Record<string, unknown>)["data-language"] as string | undefined;

  return (
    <div className="group relative my-6 rounded-xl border border-white/[0.08] bg-[oklch(0.13_0.01_260)] overflow-hidden">
      {lang && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] text-xs text-muted">
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
