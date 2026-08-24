import { categoryColor } from "@/lib/categories";
import { KIND_LABELS, STATUS_LABELS } from "@/lib/project-types";
import type { Project } from "@/lib/projects";

export function ProjectHero({ project }: { project: Project }) {
  const accent = categoryColor(project.category);
  const attribution =
    project.kind === "client" && project.client
      ? project.client
      : KIND_LABELS[project.kind];

  const { stats } = project;
  const repoUrl = stats?.visibility === "public" ? stats.repoUrl : null;

  return (
    <header className="mb-10">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <span className="font-medium" style={{ color: accent }}>
          {project.category}
        </span>
        <span className="text-muted">&middot;</span>
        <span className="text-muted">{attribution}</span>
        {project.year && (
          <>
            <span className="text-muted">&middot;</span>
            <span className="text-muted">{project.year}</span>
          </>
        )}
        <span
          className="rounded-full border px-2.5 py-0.5 font-medium"
          style={{
            color: accent,
            borderColor: `color-mix(in oklch, ${accent} 30%, transparent)`,
          }}
        >
          {STATUS_LABELS[project.status]}
        </span>
      </div>

      <h1 className="mb-4 font-display text-4xl text-primary sm:text-5xl">
        {project.title}
      </h1>

      {project.summary && (
        <p className="max-w-2xl text-lg leading-relaxed text-secondary">
          {project.summary}
        </p>
      )}

      {project.meta.stack.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.meta.stack.map((s) => (
            <span
              key={s}
              className="rounded-full border border-glass-border bg-surface-1/50 px-2.5 py-0.5 font-mono text-[11px] text-muted"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {(repoUrl || project.meta.links.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-4">
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
              View on GitHub &rarr;
            </a>
          )}
        </div>
      )}

      {project.meta.outcomes.length > 0 && (
        <ul className="mt-8 space-y-2">
          {project.meta.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2.5 text-secondary">
              <span className="mt-[7px] text-xs" style={{ color: accent }}>
                &#9679;
              </span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
