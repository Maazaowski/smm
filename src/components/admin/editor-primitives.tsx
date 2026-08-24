"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * Shared building blocks for the admin editors. These lived in about-editor.tsx
 * until the projects editor needed the same three, at which point a second copy
 * became a maintenance problem rather than a convenience.
 */

export const inputClass =
  "w-full rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue";

export const textareaClass =
  "w-full rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue resize-none";

export const selectClass =
  "w-full rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary outline-none focus:border-accent-blue";

export const labelClass =
  "text-xs font-medium text-muted uppercase tracking-wider";

export function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <GlassCard className="p-4" hover={false}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-sm font-medium text-primary">{title}</h2>
        <span className="text-xs text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </GlassCard>
  );
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return items;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Up / down / remove controls for an ordered list row. */
export function RowControls({
  index,
  length,
  onMove,
  onRemove,
}: {
  index: number;
  length: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        className="text-xs text-muted hover:text-primary disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === length - 1}
        className="text-xs text-muted hover:text-primary disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-error hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
