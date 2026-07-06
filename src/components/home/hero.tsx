"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  useMotionTemplate,
} from "framer-motion";
import { SITE } from "@/lib/constants";
import { MagneticButton } from "@/components/ui/magnetic-button";

const nameChars = SITE.name.split("");

export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Pointer parallax for the local aurora layers (normalized -0.5..0.5).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20 });
  const sy = useSpring(py, { stiffness: 60, damping: 20 });

  const blob1x = useTransform(sx, (v) => v * 40);
  const blob1y = useTransform(sy, (v) => v * 40);
  const blob2x = useTransform(sx, (v) => v * -60);
  const blob2y = useTransform(sy, (v) => v * -30);
  const blob1 = useMotionTemplate`translate(${blob1x}px, ${blob1y}px)`;
  const blob2 = useMotionTemplate`translate(${blob2x}px, ${blob2y}px)`;

  const handleMove = (e: React.MouseEvent) => {
    if (reduce || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    px.set((e.clientX - (rect.left + rect.width / 2)) / rect.width);
    py.set((e.clientY - (rect.top + rect.height / 2)) / rect.height);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMove}
      className="relative overflow-hidden py-28 sm:py-36"
    >
      {/* Local mouse-reactive aurora, layered over the global ambient one */}
      {!reduce && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <motion.div
            style={{ transform: blob1 }}
            className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.8_0.15_70/0.28),transparent_70%)] blur-2xl"
          />
          <motion.div
            style={{ transform: blob2 }}
            className="absolute top-10 right-[6%] h-80 w-80 rounded-full bg-[radial-gradient(circle,oklch(0.7_0.16_32/0.24),transparent_70%)] blur-2xl"
          />
        </div>
      )}

      {/* Status chip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass-bg px-3 py-1 text-xs text-secondary backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        Available for freelance work
      </motion.div>

      {/* Kinetic name */}
      <motion.h1
        className="font-display text-6xl sm:text-8xl text-primary mb-6 flex flex-wrap"
        initial="hidden"
        animate="shown"
        transition={{ staggerChildren: reduce ? 0 : 0.04, delayChildren: 0.15 }}
        aria-label={SITE.name}
      >
        {nameChars.map((ch, i) => (
          <motion.span
            key={i}
            variants={{
              hidden: reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 40, rotateX: -90, filter: "blur(8px)" },
              shown: reduce
                ? { opacity: 1 }
                : { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" },
            }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="inline-block origin-bottom"
            aria-hidden="true"
          >
            {ch}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-xl sm:text-2xl text-secondary max-w-2xl leading-snug font-medium"
      >
        {SITE.description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.6 }}
        className="flex gap-4 mt-8"
      >
        <MagneticButton
          href="/blog"
          className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-medium text-white hover:brightness-105 transition-all"
        >
          Read the Blog
        </MagneticButton>
        <MagneticButton
          href="/about"
          className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-glass-border-hover transition-all"
        >
          About Me
        </MagneticButton>
      </motion.div>
    </section>
  );
}
