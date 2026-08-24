import { formatDate } from "@/lib/utils";
import type { SafeRelease } from "@/lib/github/safe-stats";

/**
 * Renders nothing when there are no releases, which covers both the
 * not-yet-tagged case and private repos (whose releases array is always empty
 * by construction — see safe-stats.ts).
 */
export function ReleaseTimeline({ releases }: { releases: SafeRelease[] }) {
  if (releases.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted">
        Releases
      </h2>

      <ol className="relative space-y-6 border-l border-glass-border pl-8">
        {releases.map((r) => (
          <li key={r.tag} className="relative">
            <span
              aria-hidden
              className="absolute -left-[2.3rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent-blue bg-bg"
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-accent-blue hover:underline"
              >
                {r.tag}
              </a>
              <span className="text-xs text-muted">
                {formatDate(r.publishedAt)}
              </span>
            </div>
            {r.name && r.name !== r.tag && (
              <p className="mt-1 text-sm text-secondary">{r.name}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
