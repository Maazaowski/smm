"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useInteractionMode } from "@/hooks/use-interaction-mode";

/**
 * Signature cursor: a small solid dot that tracks the pointer 1:1, plus a larger
 * ring that trails with spring physics and swells when hovering interactive
 * elements. Warm-tinted, blend-mode difference so it reads on any background.
 * Only mounts on hover-capable, non-reduced-motion devices.
 */
export function CustomCursor() {
  const { ready, canHover, reducedMotion } = useInteractionMode();
  const enabled = ready && canHover && !reducedMotion;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.6 });

  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target as HTMLElement;
      setActive(
        !!target.closest(
          'a, button, [role="button"], input, textarea, select, label, summary'
        )
      );
    };
    const leave = () => setVisible(false);

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    // Hide the native cursor while ours is active.
    document.documentElement.style.cursor = "none";
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
      document.documentElement.style.cursor = "";
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ mixBlendMode: "difference" }}
      aria-hidden="true"
    >
      {/* Trailing ring */}
      <motion.div
        className="absolute rounded-full border"
        style={{
          x: ringX,
          y: ringY,
          borderColor: "oklch(0.85 0.14 75)",
          translateX: "-50%",
          translateY: "-50%",
          opacity: visible ? 1 : 0,
        }}
        animate={{
          width: active ? 52 : 32,
          height: active ? 52 : 32,
          borderWidth: active ? 1.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />
      {/* Precise dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          x,
          y,
          width: 6,
          height: 6,
          background: "oklch(0.9 0.1 80)",
          translateX: "-50%",
          translateY: "-50%",
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
