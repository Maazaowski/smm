"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { categoryColor } from "@/lib/categories";
import { KIND_LABELS, STATUS_LABELS } from "@/lib/project-types";
import { ProjectStatInline } from "./project-stat-strip";
import type { ProjectPreview } from "@/lib/projects";

export function ProjectCard({
  project,
  index,
}: {
  project: ProjectPreview;
  index: number;
}) {
  const accent = categoryColor(project.category);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ry.set(((e.clientX - rect.left) / rect.width - 0.5) * 6);
    rx.set(-((e.clientY - rect.top) / rect.height - 0.5) * 6);
    ref.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  // Client work shows who it was for; everything else shows what kind of thing it is.
  const attribution =
    project.kind === "client" && project.client
      ? project.client
      : KIND_LABELS[project.kind];

  const { stats } = project;
  const repoUrl = stats?.visibility === "public" ? stats.repoUrl : null;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: index * 0.08 }}
      className="[perspective:1000px]"
    >
      <motion.article
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        whileHover={reduce ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="group relative h-full overflow-hidden rounded-2xl border border-glass-border bg-glass-bg p-7 backdrop-blur-[16px] shadow-[0_8px_32px_oklch(0.1_0.01_55/0.25)] transition-colors hover:border-glass-border-hover
        after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-300
        after:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),oklch(0.8_0.14_70/0.07),transparent_40%)]"
      >
        <span
          className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl"
          style={{ background: accent }}
        />

        <div className="mb-4 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium" style={{ color: accent }}>
            {project.category}
          </span>
          <span className="text-muted">
            {attribution}
            {project.year && <> &middot; {project.year}</>}
          </span>
        </div>

        <h3 className="mb-2 text-xl font-semibold text-primary">
          {/* Stretched link: `after:` is taken by the mouse gradient above, and a
              wrapping <Link> would nest the anchors in the links row below. */}
          <Link
            href={`/projects/${project.slug}`}
            className="transition-colors before:absolute before:inset-0 before:z-10 before:content-[''] group-hover:text-accent-blue"
          >
            {project.title}
          </Link>
        </h3>

        <p className="mb-5 text-sm leading-relaxed text-secondary">
          {project.description}
        </p>

        {stats && <ProjectStatInline stats={stats} />}

        <ul className="mb-5 space-y-1.5">
          {project.meta.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2 text-sm text-secondary">
              <span className="mt-[3px] text-xs" style={{ color: accent }}>
                &#9679;
              </span>
              {o}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            style={{ color: accent, borderColor: `color-mix(in oklch, ${accent} 30%, transparent)` }}
          >
            {STATUS_LABELS[project.status]}
          </span>
          {project.meta.stack.map((s) => (
            <span
              key={s}
              className="rounded-full border border-glass-border bg-surface-1/50 px-2.5 py-0.5 font-mono text-[11px] text-muted"
            >
              {s}
            </span>
          ))}
        </div>

        {(repoUrl || project.meta.links.length > 0) && (
          <div className="relative z-20 mt-5 flex flex-wrap gap-4">
            {project.meta.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent-blue hover:underline"
              >
                {l.label} &rarr;
              </a>
            ))}
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent-blue hover:underline"
              >
                GitHub &rarr;
              </a>
            )}
          </div>
        )}
      </motion.article>
    </motion.div>
  );
}
