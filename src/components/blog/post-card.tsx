"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { categoryColor } from "@/lib/categories";
import type { Post } from "@/lib/types";

export type PostPreview = Pick<Post, "frontmatter" | "slug" | "readingTime">;

interface PostCardProps {
  post: PostPreview;
}

export function PostCard({ post }: PostCardProps) {
  const { frontmatter, slug, readingTime } = post;
  const accent = categoryColor(frontmatter.category);
  const reduce = useReducedMotion();

  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateX = useTransform(rx, (v) => v);
  const rotateY = useTransform(ry, (v) => v);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
    // Spotlight position for the glass sheen.
    ref.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <Link href={`/blog/${slug}`} className="group block h-full [perspective:1000px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileHover={reduce ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative h-full overflow-hidden rounded-2xl border border-glass-border bg-glass-bg p-6 backdrop-blur-[16px] shadow-[0_8px_32px_oklch(0.1_0.01_55/0.25)] transition-colors group-hover:border-glass-border-hover
        after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-300
        after:bg-[radial-gradient(500px_circle_at_var(--mouse-x)_var(--mouse-y),oklch(0.8_0.14_70/0.07),transparent_40%)]"
      >
        {/* Category accent bar */}
        <span
          className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl"
          style={{ background: accent }}
        />

        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span
              className="font-medium"
              style={{ color: accent }}
            >
              {frontmatter.category}
            </span>
            <span className="text-muted">&middot;</span>
            <time dateTime={frontmatter.date} className="text-muted">
              {formatDate(frontmatter.date)}
            </time>
            <span className="text-muted">&middot;</span>
            <span className="text-muted">{readingTime}</span>
          </div>

          <h3 className="text-lg font-semibold text-primary leading-snug transition-colors group-hover:text-[var(--card-accent)]" style={{ ["--card-accent" as string]: accent }}>
            {frontmatter.title}
          </h3>

          <p className="text-sm text-secondary leading-relaxed line-clamp-2">
            {frontmatter.description}
          </p>

          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex flex-wrap gap-2">
              {frontmatter.tags.slice(0, 2).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-muted transition-all group-hover:text-primary">
              Read
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
