/**
 * GitHub reads for the projects sync.
 *
 * HARD RULE FOR THIS DIRECTORY: no Octokit response object may escape the
 * function that made the call. Every function below declares a return type made
 * only of primitives, and pulls out named fields one at a time. There is no
 * `...res.data` spread anywhere in this file and there must never be one — that
 * spread is exactly how a private repo's commit message would end up in a
 * public page. See ./safe-stats.ts for the rest of the redaction story.
 */
import type { Github } from "./client";
import type {
  CiConclusion,
  SafeLanguage,
  SafeRelease,
  SafeWeek,
} from "./safe-stats";

const CI_CONCLUSION_SET = new Set([
  "success",
  "failure",
  "cancelled",
  "timed_out",
]);

/**
 * GitHub has no commit-count endpoint. Asking for one item per page and reading
 * the `last` page number off the Link header is the standard trick.
 */
function lastPageFromLink(link: string | undefined): number | null {
  if (!link) return null;
  const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  return match ? Number(match[1]) : null;
}

function statusOf(err: unknown): number | undefined {
  return (err as { status?: number })?.status;
}

export interface RepoMeta {
  visibility: "public" | "private";
  defaultBranch: string;
  htmlUrl: string;
  topics: string[];
  stars: number;
  forks: number;
}

export async function fetchRepoMeta(
  gh: Github,
  owner: string,
  repo: string
): Promise<RepoMeta> {
  const res = await gh.rest.repos.get({ owner, repo });
  return {
    // The redaction switch comes from GitHub itself, never from a column a
    // human could edit.
    visibility: res.data.private ? "private" : "public",
    defaultBranch: res.data.default_branch,
    htmlUrl: res.data.html_url,
    topics: res.data.topics ?? [],
    stars: res.data.stargazers_count,
    forks: res.data.forks_count,
  };
}

export async function fetchCommitMeta(
  gh: Github,
  owner: string,
  repo: string,
  branch: string
): Promise<{ count: number; lastCommitAt: string | null }> {
  try {
    const res = await gh.rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: 1,
    });

    // Only the date is read. The message is deliberately never touched.
    const lastCommitAt = res.data[0]?.commit?.committer?.date ?? null;
    const count = lastPageFromLink(res.headers.link) ?? res.data.length;

    return { count, lastCommitAt };
  } catch (err) {
    // 409 is "Git Repository is empty" — a real state, not a failure.
    if (statusOf(err) === 409) return { count: 0, lastCommitAt: null };
    throw err;
  }
}

export async function fetchOpenPrCount(
  gh: Github,
  owner: string,
  repo: string
): Promise<number> {
  // Deliberately not search.issuesAndPullRequests: the Search API has its own
  // much smaller rate budget and is the usual way to get secondary-limited.
  const res = await gh.rest.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 1,
  });
  return lastPageFromLink(res.headers.link) ?? res.data.length;
}

export async function fetchLanguages(
  gh: Github,
  owner: string,
  repo: string
): Promise<SafeLanguage[]> {
  const res = await gh.rest.repos.listLanguages({ owner, repo });
  // Keys come from GitHub's fixed Linguist vocabulary, not from anything
  // written inside the repo — which is why this is safe for private repos.
  return Object.entries(res.data).map(([name, bytes]) => ({
    name,
    bytes: Number(bytes) || 0,
  }));
}

const STATS_RETRIES = 3;
const STATS_BACKOFF_MS = 2000;

/**
 * 52 weeks of commit counts.
 *
 * Returns null when GitHub is still computing the stats. That endpoint answers
 * 202 with an empty body while it warms its cache, and Octokit does not throw
 * on 202 — so an unchecked caller silently gets `[]` and wipes a good heatmap.
 * The caller must treat null as "keep what you had".
 */
export async function fetchWeeks(
  gh: Github,
  owner: string,
  repo: string
): Promise<SafeWeek[] | null> {
  for (let attempt = 0; attempt < STATS_RETRIES; attempt++) {
    const res = await gh.rest.repos.getCommitActivityStats({ owner, repo });

    if (res.status === 202 || !Array.isArray(res.data)) {
      await new Promise((r) => setTimeout(r, STATS_BACKOFF_MS));
      continue;
    }

    return res.data.map((w) => ({
      week: new Date(w.week * 1000).toISOString().slice(0, 10),
      total: w.total,
      days: w.days,
    }));
  }

  return null;
}

export async function fetchCi(
  gh: Github,
  owner: string,
  repo: string,
  branch: string
): Promise<{
  passRate: number | null;
  last: CiConclusion;
  sampled: number;
}> {
  const res = await gh.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    branch,
    status: "completed",
    exclude_pull_requests: true,
    per_page: 30,
  });

  const runs = res.data.workflow_runs;
  if (runs.length === 0) return { passRate: null, last: "unknown", sampled: 0 };

  // Only `conclusion` is read — never name, display_title, head_branch, or
  // head_commit.message, all of which are repo-authored strings.
  const conclusions: CiConclusion[] = runs.map((run) =>
    run.conclusion && CI_CONCLUSION_SET.has(run.conclusion)
      ? (run.conclusion as CiConclusion)
      : "unknown"
  );

  const passed = conclusions.filter((c) => c === "success").length;

  return {
    passRate: passed / conclusions.length,
    last: conclusions[0],
    sampled: conclusions.length,
  };
}

/**
 * Public repos only — the caller must not invoke this for a private repo, since
 * tag and release names are repo-authored strings.
 *
 * listReleases rather than getLatestRelease: the latter 404s when a repo has no
 * releases, which is currently every repo here.
 */
export async function fetchReleases(
  gh: Github,
  owner: string,
  repo: string
): Promise<SafeRelease[]> {
  const res = await gh.rest.repos.listReleases({ owner, repo, per_page: 10 });
  return res.data
    .filter((r) => !r.draft && r.published_at)
    .map((r) => ({
      tag: r.tag_name,
      name: r.name ?? null,
      publishedAt: r.published_at as string,
      url: r.html_url,
    }));
}
