"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { GalleryImage } from "@/lib/project-types";

/**
 * Thumbnails plus a lightbox. Images are site-relative paths under public/ —
 * see galleryImageSchema, which rejects anything else, so a private repo's file
 * tree can never be the source.
 */
export function ScreenshotGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const close = useCallback(() => setActive(null), []);

  const step = useCallback(
    (delta: number) =>
      setActive((prev) =>
        prev === null ? prev : (prev + delta + images.length) % images.length
      ),
    [images.length]
  );

  useEffect(() => {
    if (active === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, close, step]);

  if (images.length === 0) return null;

  const current = active === null ? null : images[active];

  // Phone and A4 captures are much taller than they are wide; two per row makes
  // them enormous. Give portrait sets a third column instead.
  const portrait = images.every((img) => img.height > img.width);
  const columns = portrait ? "sm:grid-cols-3" : "sm:grid-cols-2";
  const sizes = portrait
    ? "(min-width: 640px) 33vw, 100vw"
    : "(min-width: 640px) 50vw, 100vw";

  return (
    <section>
      <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted">
        Screenshots
      </h2>

      <div className={`grid gap-4 ${columns}`}>
        {images.map((img, i) => (
          <figure key={img.src}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className="block w-full overflow-hidden rounded-xl border border-glass-border transition-colors hover:border-glass-border-hover"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes={sizes}
                className="h-auto w-full"
              />
            </button>
            {img.caption && (
              <figcaption className="mt-2 text-xs text-muted">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.2 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-6 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-6 top-6 z-[101] text-sm text-secondary hover:text-primary"
            >
              Close (Esc)
            </button>

            <motion.figure
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="z-[101] max-h-full w-full max-w-5xl overflow-auto"
            >
              <Image
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
                sizes="100vw"
                className="h-auto w-full rounded-xl border border-glass-border"
              />
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-xs text-muted">
                <span>{current.caption ?? current.alt}</span>
                {images.length > 1 && (
                  <span className="tabular-nums">
                    {(active ?? 0) + 1} / {images.length}
                  </span>
                )}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
