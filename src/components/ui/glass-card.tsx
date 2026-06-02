"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !hover) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-[16px]",
        "shadow-[0_8px_32px_oklch(0_0_0/0.12)] dark:shadow-[0_8px_32px_oklch(0_0_0/0.3)]",
        "transition-all duration-300 ease-out",
        hover && [
          "hover:border-glass-border-hover hover:scale-[1.01]",
          "after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:opacity-0 hover:after:opacity-100",
          "after:transition-opacity after:duration-300",
          "after:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),oklch(0.65_0.15_250/0.06),transparent_40%)]",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
