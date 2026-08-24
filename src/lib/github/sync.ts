import { github } from "./client";
import {
  fetchCi,
  fetchCommitMeta,
  fetchLanguages,
  fetchOpenPrCount,
  fetchReleases,
  fetchRepoMeta,
  fetchWeeks,
} from "./fetchers";
import { toSafeStats } from "./safe-stats";
import {
  getExistingStats,
  getSyncableProjects,
  recordSyncFailure,
  upsertProjectStats,
} from "../projects";
import type { Github } from "./client";
import type { SafeRepoStats, SyncStatus } from "./safe-stats";
import type { DbProject } from "../db/schema";

export interface RepoSyncResult {
  slug: string;
  ok: boolean;
  status: SyncStatus;
  /** Sanitized code only. Never a raw error message. */
  error?: string;
}

export interface SyncSummary {
  results: RepoSyncResult[];
  /** True when every repo failed on auth — one banner beats five red rows. */
  tokenError: boolean;
}

/** How many repos to sync at once. Low on purpose: secondary rate limits. */
const CONCURRENCY = 2;

/**
 * Maps an error to a code safe to store and show. Never uses err.message —
 * GitHub error bodies can echo the resource path, which for a private repo is
 * a private string.
 */
function sanitizeError(err: unknown): string {
  const status = (err as { status?: number })?.status;
  if (status === 401) return "HTTP 401 bad_token";
  if (status === 403) return "HTTP 403 rate_limited";
  if (status === 404) return "HTTP 404";
  if (status === 409) return "HTTP 409 empty_repo";
  if (typeof status === "number") return `HTTP ${status}`;
  return "unknown";
}

function isAuthError(error: string | undefined): boolean {
  return error === "HTTP 401 bad_token" || error === "HTTP 403 rate_limited";
}

export async function syncProject(
  gh: Github,
  project: DbProject
): Promise<RepoSyncResult> {
  const { slug, repoOwner: owner, repoName: repo } = project;
  if (!owner || !repo) {
    return { slug, ok: false, status: "error", error: "no_repo" };
  }

  try {
    const previous = await getExistingStats(project.id);
    const meta = await fetchRepoMeta(gh, owner, repo);
    const isPrivate = meta.visibility === "private";

    const [commits, openPrCount, languages, weeks, ci, releases] =
      await Promise.all([
        fetchCommitMeta(gh, owner, repo, meta.defaultBranch),
        fetchOpenPrCount(gh, owner, repo),
        fetchLanguages(gh, owner, repo),
        fetchWeeks(gh, owner, repo),
        fetchCi(gh, owner, repo, meta.defaultBranch),
        // Never ask a private repo for release names.
        isPrivate ? Promise.resolve([]) : fetchReleases(gh, owner, repo),
      ]);

    // A 202 that never resolved must not wipe a good heatmap.
    const weeksResolved = weeks !== null;
    const status: SyncStatus = weeksResolved ? "ok" : "partial";

    const stats: SafeRepoStats = toSafeStats({
      visibility: meta.visibility,
      htmlUrl: meta.htmlUrl,
      defaultBranch: meta.defaultBranch,
      topics: meta.topics,
      stars: meta.stars,
      forks: meta.forks,
      commitCount: commits.count,
      lastCommitAt: commits.lastCommitAt,
      openPrCount,
      languages,
      weeks: weeks ?? previous?.weeks ?? [],
      ciPassRate: ci.passRate,
      ciLastConclusion: ci.last,
      ciRunsSampled: ci.sampled,
      releases,
    });

    await upsertProjectStats(
      project.id,
      stats,
      status,
      weeksResolved ? null : "stats_202_timeout"
    );

    return {
      slug,
      ok: true,
      status,
      error: weeksResolved ? undefined : "stats_202_timeout",
    };
  } catch (err) {
    const error = sanitizeError(err);
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[projects/sync]", slug, message);

    // Annotate the existing row rather than replacing good stats with nothing.
    await recordSyncFailure(project.id, error).catch(() => {});

    return { slug, ok: false, status: "error", error };
  }
}

export async function syncAllProjects(): Promise<SyncSummary> {
  if (!github) {
    throw new Error("GITHUB_SYNC_TOKEN is not configured.");
  }
  const gh = github;

  const projects = await getSyncableProjects();
  const results: RepoSyncResult[] = [];

  for (let i = 0; i < projects.length; i += CONCURRENCY) {
    const batch = projects.slice(i, i + CONCURRENCY);
    // allSettled plus the try/catch inside syncProject: one repo failing must
    // not be able to take the whole sync down, by either route.
    const settled = await Promise.allSettled(
      batch.map((p) => syncProject(gh, p))
    );

    settled.forEach((outcome, j) => {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
        return;
      }
      console.error("[projects/sync]", batch[j].slug, outcome.reason);
      results.push({
        slug: batch[j].slug,
        ok: false,
        status: "error",
        error: sanitizeError(outcome.reason),
      });
    });
  }

  const tokenError =
    results.length > 0 && results.every((r) => !r.ok && isAuthError(r.error));

  return { results, tokenError };
}
