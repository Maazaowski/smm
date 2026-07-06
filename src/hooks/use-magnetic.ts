"use client";

import { useRef } from "react";
import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { useInteractionMode } from "@/hooks/use-interaction-mode";

interface Magnetic {
  ref: React.RefObject<HTMLElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

/**
 * Magnetic pull: an element leans toward the cursor while hovered and springs
 * back on leave. Spread `{ ref, style: { x, y }, onMouseMove, onMouseLeave }`
 * onto a motion element. No-op (stays centered) when hover/motion is unavailable.
 */
export function useMagnetic(strength = 0.35): Magnetic {
  const { canHover, reducedMotion } = useInteractionMode();
  const enabled = canHover && !reducedMotion;
  const ref = useRef<HTMLElement | null>(null);

  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });

  const onMouseMove = (e: React.MouseEvent) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, x, y, onMouseMove, onMouseLeave };
}
