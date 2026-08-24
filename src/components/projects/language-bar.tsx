import { languageColor } from "@/lib/languages";
import type { SafeLanguage } from "@/lib/github/safe-stats";

const MAX_SHOWN = 6;

/**
 * Language breakdown. Safe for private repos: the names come from GitHub's
 * fixed Linguist vocabulary, not from anything written in the repo.
 */
export function LanguageBar({ languages }: { languages: SafeLanguage[] }) {
  if (languages.length === 0) return null;

  const total = languages.reduce((sum, l) => sum + l.bytes, 0);
  if (total === 0) return null;

  const sorted = [...languages].sort((a, b) => b.bytes - a.bytes);
  const shown = sorted.slice(0, MAX_SHOWN);
  const restBytes = sorted.slice(MAX_SHOWN).reduce((sum, l) => sum + l.bytes, 0);

  const segments = shown.map((l, i) => ({
    name: l.name,
    pct: (l.bytes / total) * 100,
    color: languageColor(l.name, i),
  }));

  if (restBytes > 0) {
    segments.push({
      name: "Other",
      pct: (restBytes / total) * 100,
      color: "oklch(0.55 0.02 60)",
    });
  }

  return (
    <div className="rounded-2xl border border-glass-border bg-glass-bg p-6 backdrop-blur-[16px]">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
        Languages
      </h2>

      <div
        role="img"
        aria-label={segments
          .map((s) => `${s.name} ${s.pct.toFixed(1)} percent`)
          .join(", ")}
        className="flex h-2 overflow-hidden rounded-full"
      >
        {segments.map((s) => (
          <span
            key={s.name}
            style={{ width: `${s.pct}%`, background: s.color }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-secondary">{s.name}</span>
            <span className="tabular-nums text-muted">{s.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
