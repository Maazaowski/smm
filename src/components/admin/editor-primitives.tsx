"use client";

import { useState } from "react";

/**
 * Shared building blocks for the admin editors. These lived in about-editor.tsx
 * until the projects editor needed the same three, at which point a second copy
 * became a maintenance problem rather than a convenience.
 *
 * The class names resolve to admin.css. They are exported as strings rather
 * than components so the editors can keep composing them with the odd layout
 * utility (`w-1/3`, `h-96`) without a wrapper per field.
 */

export const inputClass = "dk-field";

export const textareaClass = "dk-field dk-textarea";

export const selectClass = "dk-field dk-select";

export const labelClass = "dk-label";

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
    <section className="dk-panel">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="dk-panel-toggle"
        aria-expanded={open}
      >
        <h2 className="dk-panel-h">{title}</h2>
        <span className="sg-micro" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="dk-panel-body space-y-4">{children}</div>}
    </section>
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
  label = "item",
}: {
  index: number;
  length: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  /** What the row is, for the screen-reader names of the arrow buttons. */
  label?: string;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        className="dk-link"
        aria-label={`Move ${label} up`}
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === length - 1}
        className="dk-link"
        aria-label={`Move ${label} down`}
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="dk-link"
        data-tone="danger"
      >
        Remove
      </button>
    </div>
  );
}
