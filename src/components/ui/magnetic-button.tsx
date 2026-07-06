"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMagnetic } from "@/hooks/use-magnetic";

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
}

const MotionLink = motion.create(Link);

/**
 * A Next.js Link that leans toward the cursor (magnetic pull) and springs back.
 * Degrades to a normal link when hover/motion is unavailable (handled by the
 * useMagnetic hook, which stays centered).
 */
export function MagneticButton({
  href,
  children,
  className,
  strength = 0.4,
}: MagneticButtonProps) {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMagnetic(strength);

  return (
    <MotionLink
      href={href}
      ref={ref as React.Ref<HTMLAnchorElement>}
      style={{ x, y }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
    >
      {children}
    </MotionLink>
  );
}
