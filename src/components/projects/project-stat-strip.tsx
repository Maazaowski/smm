import { relativeTime } from "@/lib/utils";
import type { SafeRepoStats } from "@/lib/github/safe-stats";

/** Colour for a CI conclusion. Raw oklch, matching the categoryColor() convention. */
function ciColor(conclusion: SafeRepoStats["ciLastConclusion"]): string {
  if (conclusion === "success") return "oklch(0.72 0.15 150)";
  if (conclusion === "failure" || conclusion === "timed_out") return "oklch(0.65 0.19 25)";
  return "oklch(0.76 0.13 60)";
}

function ciLabel(stats: SafeRepoStats): string {
  if (stats.ciPassRate === null) return "No CI";
  if (stats.ciLastConclusion === "success") return "Passing";
  if (stats.ciLastConclusion === "failure") return "Failing";
  if (stats.ciLastConclusion === "timed_out") return "Timed out";
  if (stats.ciLastConclusion === "cancelled") return "Cancelled";
  return "Unknown";
}

interface Stat {
  label: string;
  value: string;
  color?: string;
}

function buildStats(stats: SafeRepoStats): Stat[] {
  const out: Stat[] = [
    {
      label: "Commits",
      value: stats.commitCount.toLocaleString(),
    },
    {
      label: "Last active",
      value: stats.lastCommitAt ? relativeTime(stats.lastCommitAt) : "—",
    },
    {
      label: "Open PRs",
      value: String(stats.openPrCount),
    },
    {
      label: "CI",
      value: ciLabel(stats),
      color: stats.ciPassRate === null ? undefined : ciColor(stats.ciLastConclusion),
    },
  ];
  return out;
}

/**
 * Compact row for cards. Rendered inside a client component, so it stays a
 * plain function component with no server-only work beyond reading the clock.
 */
export function ProjectStatInline({ stats }: { stats: SafeRepoStats }) {
  const items = buildStats(stats).filter((s) => s.label !== "Open PRs");

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted/40">&middot;</span>}
          {item.color && (
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: item.color }}
            />
          )}
          <span className="tabular-nums text-secondary">{item.value}</span>
          <span>{item.label.toLowerCase()}</span>
        </span>
      ))}
    </div>
  );
}

/** Four tiles for the detail page. */
export function ProjectStatStrip({ stats }: { stats: SafeRepoStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {buildStats(stats).map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-glass-border bg-glass-bg p-4 backdrop-blur-[16px]"
        >
          <div
            className="font-display text-2xl leading-tight text-primary"
            style={item.color ? { color: item.color } : undefined}
          >
            {item.value}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
