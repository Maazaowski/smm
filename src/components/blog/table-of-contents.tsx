"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li key={heading.id} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="toc-active"
                    className="absolute left-0 top-0 h-full w-[2px] -ml-px rounded bg-accent-blue"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(heading.id)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "block py-1 text-sm transition-all duration-300",
                    heading.level === 2 ? "pl-4" : "pl-8",
                    isActive
                      ? "text-primary translate-x-0.5"
                      : "text-muted hover:text-secondary"
                  )}
                >
                  {heading.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
