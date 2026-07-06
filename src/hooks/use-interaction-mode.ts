"use client";

import { useEffect, useState } from "react";

interface InteractionMode {
  /** True once mounted on the client (avoids SSR/hydration mismatch). */
  ready: boolean;
  /** Pointer supports true hover (desktop-style). False on touch devices. */
  canHover: boolean;
  /** User asked to reduce motion. Gate big/looping animations on !reducedMotion. */
  reducedMotion: boolean;
}

/**
 * Single source of truth for "should we run rich motion here?". Used to gate the
 * custom cursor, magnetic effects, and heavy hero animation. Reacts to live
 * changes (e.g. toggling reduce-motion in OS settings).
 */
export function useInteractionMode(): InteractionMode {
  const [mode, setMode] = useState<InteractionMode>({
    ready: false,
    canHover: false,
    reducedMotion: false,
  });

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () =>
      setMode({
        ready: true,
        canHover: hover.matches,
        reducedMotion: motion.matches,
      });

    update();
    hover.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      hover.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return mode;
}
