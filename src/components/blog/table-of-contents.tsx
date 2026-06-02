"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TableOfContentsItem } from "@/lib/types";

interface TableOfContentsProps {
  headings: TableOfContentsItem[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block" aria-label="Table of contents">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          On this page
        </p>
        <ul className="space-y-1 border-l border-glass-border">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(heading.id)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={cn(
                  "block py-1 text-sm transition-colors border-l -ml-px",
                  heading.level === 2 ? "pl-4" : "pl-8",
                  activeId === heading.id
                    ? "border-accent-blue text-primary"
                    : "border-transparent text-muted hover:text-secondary"
                )}
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
