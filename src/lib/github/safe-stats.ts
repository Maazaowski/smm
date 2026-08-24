/**
 * The redaction boundary between GitHub and this website.
 *
 * Two of the synced repos are private. Everything GitHub gives us about them
 * passes through this file before it can reach Postgres, and therefore before
 * it can reach a public page.
 *
 * The rule: numbers, timestamps and closed enums are safe for any repo.
 * Repo-authored *strings* (urls, branch names, topics, release titles) are
 * safe only for public repos.
 *
 * Four layers enforce that, in order:
 *
 *   1. Every fetcher in ./fetchers.ts declares a primitive-only return type, so
 *      no Octokit response object ever escapes the function that made the call.
 *      There is no `...res.data` spread anywhere in this directory, ever.
 *   2. toSafeStats() below builds a fresh object literal and nulls the
 *      string-bearing fields when the repo is private.
 *   3. .strict() on the schema — a field nobody declared safe throws rather
 *      than being persisted.
 *   4. .superRefine() below — if a future refactor drops the ternary in layer
 *      2, the write throws "PRIVATE REPO LEAK" instead of silently publishing.
 *
 * Layer 4 exists because layers 1-3 are all things a person can accidentally
 * undo while editing. Layer 4 fails closed and says why.
 */
import { z } from "zod";

/** GitHub's own conclusion vocabulary, plus a fallback for runs we can't read. */
export const CI_CONCLUSIONS = [
  "success",
  "failure",
  "cancelled",
  "timed_out",
  "unknown",
] as const;

export const ciConclusionSchema = z.enum(CI_CONCLUSIONS);

export const safeReleaseSchema = z.object({
  tag: z.string(),
  name: z.string().nullable(),
  publishedAt: z.string(),
  url: z.string().url(),
});

/** One week of commit activity. Pure counters — safe for any repo. */
export const safeWeekSchema = z.object({
  /** ISO date of the week's Sunday, UTC. */
  week: z.string(),
  total: z.number().int().nonnegative(),
  days: z.array(z.number().int().nonnegative()).length(7),
});

export const safeLanguageSchema = z.object({
  /** From GitHub's fixed Linguist vocabulary, never repo-authored text. */
  name: z.string(),
  bytes: z.number().int().nonnegative(),
});

export const safeRepoStatsSchema = z
  .object({
    schemaVersion: z.literal(1),
    visibility: z.enum(["public", "private"]),

    // ---- numeric / enum only: always safe, public or private ----
    commitCount: z.number().int().nonnegative(),
    openPrCount: z.number().int().nonnegative(),
    lastCommitAt: z.string().nullable(),
    stars: z.number().int().nonnegative(),
    forks: z.number().int().nonnegative(),
    ciPassRate: z.number().min(0).max(1).nullable(),
    ciLastConclusion: ciConclusionSchema,
    ciRunsSampled: z.number().int().nonnegative(),
    languages: z.array(safeLanguageSchema),
    weeks: z.array(safeWeekSchema),

    // ---- repo-authored strings: PUBLIC REPOS ONLY ----
    repoUrl: z.string().url().nullable(),
    defaultBranch: z.string().nullable(),
    topics: z.array(z.string()),
    releases: z.array(safeReleaseSchema),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.visibility !== "private") return;
    const leaks: string[] = [];
    if (s.repoUrl !== null) leaks.push("repoUrl");
    if (s.defaultBranch !== null) leaks.push("defaultBranch");
    if (s.topics.length > 0) leaks.push("topics");
    if (s.releases.length > 0) leaks.push("releases");
    if (leaks.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `PRIVATE REPO LEAK: ${leaks.join(", ")} must be empty or null for a private repo`,
      });
    }
  });

export type CiConclusion = z.infer<typeof ciConclusionSchema>;
export type SafeRelease = z.infer<typeof safeReleaseSchema>;
export type SafeWeek = z.infer<typeof safeWeekSchema>;
export type SafeLanguage = z.infer<typeof safeLanguageSchema>;
export type SafeRepoStats = z.infer<typeof safeRepoStatsSchema>;

/** How the last sync went for one project. */
export type SyncStatus = "ok" | "partial" | "error";

/**
 * Everything the fetchers gathered, before redaction. This type is the only
 * thing allowed to hold a private repo's strings, and it never leaves memory.
 */
export interface RawRepoParts {
  visibility: "public" | "private";
  htmlUrl: string;
  defaultBranch: string;
  topics: string[];
  stars: number;
  forks: number;
  commitCount: number;
  lastCommitAt: string | null;
  openPrCount: number;
  languages: SafeLanguage[];
  weeks: SafeWeek[];
  ciPassRate: number | null;
  ciLastConclusion: CiConclusion;
  ciRunsSampled: number;
  releases: SafeRelease[];
}

/**
 * The redaction gate. Builds a fresh literal — never spreads `raw` — so a field
 * added to RawRepoParts cannot reach the output by accident.
 */
export function toSafeStats(raw: RawRepoParts): SafeRepoStats {
  const isPrivate = raw.visibility === "private";
  return {
    schemaVersion: 1,
    visibility: raw.visibility,

    commitCount: raw.commitCount,
    openPrCount: raw.openPrCount,
    lastCommitAt: raw.lastCommitAt,
    stars: raw.stars,
    forks: raw.forks,
    ciPassRate: raw.ciPassRate,
    ciLastConclusion: raw.ciLastConclusion,
    ciRunsSampled: raw.ciRunsSampled,
    languages: raw.languages,
    weeks: raw.weeks,

    // The gate. Everything below this line is a repo-authored string.
    repoUrl: isPrivate ? null : raw.htmlUrl,
    defaultBranch: isPrivate ? null : raw.defaultBranch,
    topics: isPrivate ? [] : raw.topics,
    releases: isPrivate ? [] : raw.releases,
  };
}
