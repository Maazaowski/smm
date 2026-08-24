import type { SafeWeek } from "@/lib/github/safe-stats";

/** Percentage of accent blended into surface-1, per intensity level. */
const LEVEL_MIX = [0, 22, 42, 64, 88] as const;

const DAY_MS = 86_400_000;

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  // `week` is a Sunday-00:00-UTC boundary; formatting it locally is an
  // off-by-one waiting to happen.
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

function cellLabel(week: string, dayIndex: number, count: number) {
  const date = new Date(new Date(week).getTime() + dayIndex * DAY_MS);
  const plural = count === 1 ? "commit" : "commits";
  return `${count} ${plural} on ${dayFormatter.format(date)}`;
}

/**
 * GitHub-style contribution grid. Deliberately a plain CSS grid rather than a
 * chart library: it is a server component with zero client JS, and it can tint
 * cells with color-mix() so it follows both themes for free.
 */
export function ActivityHeatmap({ weeks }: { weeks: SafeWeek[] }) {
  if (weeks.length === 0) return null;

  const max = Math.max(1, ...weeks.flatMap((w) => w.days));
  const total = weeks.reduce((sum, w) => sum + w.total, 0);

  // A month label above the first week that starts a new month.
  const monthLabels = weeks.map((w, i) => {
    const month = new Date(w.week).getUTCMonth();
    const prev = i > 0 ? new Date(weeks[i - 1].week).getUTCMonth() : -1;
    return month !== prev ? monthFormatter.format(new Date(w.week)) : "";
  });

  return (
    <div className="rounded-2xl border border-glass-border bg-glass-bg p-6 backdrop-blur-[16px]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Commit activity
        </h2>
        <span className="text-xs text-muted">
          <span className="tabular-nums text-secondary">
            {total.toLocaleString()}
          </span>{" "}
          commits in the last {weeks.length} weeks
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-max">
          <div
            className="mb-1 grid grid-flow-col gap-[3px] text-[10px] text-muted"
            aria-hidden
          >
            {monthLabels.map((label, i) => (
              <span key={i} className="w-[11px] whitespace-nowrap">
                {label}
              </span>
            ))}
          </div>

          <div
            role="img"
            aria-label={`Commit activity heatmap: ${total} commits over the last ${weeks.length} weeks`}
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
          >
            {weeks.flatMap((w) =>
              w.days.map((count, d) => {
                const level =
                  count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
                return (
                  <div
                    key={`${w.week}-${d}`}
                    title={cellLabel(w.week, d, count)}
                    className="h-[11px] w-[11px] rounded-[2px] border border-glass-border"
                    style={{
                      background: `color-mix(in oklch, var(--color-accent-blue) ${LEVEL_MIX[level]}%, var(--color-surface-1))`,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted">
        <span>Less</span>
        {LEVEL_MIX.map((mix) => (
          <span
            key={mix}
            aria-hidden
            className="h-[11px] w-[11px] rounded-[2px] border border-glass-border"
            style={{
              background: `color-mix(in oklch, var(--color-accent-blue) ${mix}%, var(--color-surface-1))`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
