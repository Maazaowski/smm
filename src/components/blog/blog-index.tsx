"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PostCard, type PostPreview } from "@/components/blog/post-card";

interface BlogIndexProps {
  posts: PostPreview[];
  tags: { tag: string; count: number }[];
}

export function BlogIndex({ posts, tags }: BlogIndexProps) {
  const [active, setActive] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const filtered = useMemo(
    () =>
      active
        ? posts.filter((p) => p.frontmatter.tags.includes(active))
        : posts,
    [active, posts]
  );

  return (
    <>
      {tags.length > 0 && (
        <div className="mb-12 flex flex-wrap gap-2">
          <FilterPill
            label="All"
            active={active === null}
            onClick={() => setActive(null)}
          />
          {tags.map(({ tag, count }) => (
            <FilterPill
              key={tag}
              label={`${tag} (${count})`}
              active={active === tag}
              onClick={() => setActive(active === tag ? null : tag)}
            />
          ))}
        </div>
      )}

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => (
            <motion.div
              key={post.slug}
              layout
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, filter: "blur(6px)" }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 20,
                delay: reduce ? 0 : Math.min(i * 0.05, 0.3),
              }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-secondary">
          No posts with that tag yet.
        </p>
      )}
    </>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-transparent text-white"
          : "border-glass-border bg-glass-bg text-secondary hover:text-primary hover:border-glass-border-hover"
      }`}
    >
      {active && (
        <motion.span
          layoutId="filter-active"
          className="absolute inset-0 -z-10 rounded-full bg-accent-blue"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {label}
    </button>
  );
}
