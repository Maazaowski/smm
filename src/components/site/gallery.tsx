"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Shot } from "@/lib/site-galleries";

/**
 * Screenshot gallery for a case study.
 *
 * Deliberately not a reuse of src/components/projects/screenshot-gallery.tsx —
 * that one is bound to framer-motion and the production tokens, and pulling it
 * in would drag the whole other design system across the boundary. The dialog
 * and focus-trap behaviour here follows the pattern already proven in the Desk
 * prototype's ConfirmDialog: Escape closes, Tab cycles inside, arrows move
 * between images, and focus returns to the thumbnail you opened from.
 */
export function Gallery({ shots }: { shots: Shot[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    // Returning focus to where it came from is the part everyone forgets.
    openerRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) =>
      setOpen((i) =>
        i === null ? i : (i + delta + shots.length) % shots.length,
      ),
    [shots.length],
  );

  useEffect(() => {
    if (open === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key === "Tab") {
        const items =
          dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() =>
      dialogRef.current?.querySelector<HTMLElement>("button")?.focus(),
    );

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
    };
  }, [open, close, step]);

  if (shots.length === 0) return null;

  const active = open === null ? null : shots[open];

  return (
    <>
      <ul className="sg-shots">
        {shots.map((s, i) => (
          <li key={s.src}>
            <button
              type="button"
              className="sg-shot"
              /* Phone screenshots are portrait; a 4:3 tile crops them to the
                 status bar. Let the tile follow the image instead. */
              data-portrait={s.h > s.w ? "true" : undefined}
              onClick={(e) => {
                openerRef.current = e.currentTarget;
                setOpen(i);
              }}
              aria-label={`Enlarge: ${s.alt}`}
            >
              <Image
                src={s.src}
                width={s.w}
                height={s.h}
                alt={s.alt}
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                quality={80}
              />
              <span className="sg-shot-n sg-mono">
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/*
        Portalled to <body>. `.sg-body` is position:relative with z-index:1, so
        an overlay rendered inside it is confined to that stacking context and
        paints *under* the fixed header — no local z-index can win that fight.
        Reproduced before fixing: the lightbox bar sat behind the site header.
      */}
      {active &&
        createPortal(
          <>
            <div
              className="sg-lightbox-scrim"
              onClick={close}
              aria-hidden="true"
            />
            <div
              ref={dialogRef}
              className="sg-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={active.alt}
            >
              <div className="sg-lightbox-bar sg-mono">
                <span>
                  {String((open ?? 0) + 1).padStart(2, "0")} /{" "}
                  {String(shots.length).padStart(2, "0")}
                </span>
                <div className="sg-lightbox-ctrls">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next image"
                  >
                    →
                  </button>
                  <button type="button" onClick={close} aria-label="Close">
                    esc
                  </button>
                </div>
              </div>

              <div className="sg-lightbox-img">
                <Image
                  src={active.src}
                  width={active.w}
                  height={active.h}
                  alt={active.alt}
                  sizes="90vw"
                  quality={90}
                  priority
                />
              </div>

              {active.caption && (
                <p className="sg-lightbox-cap">{active.caption}</p>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
