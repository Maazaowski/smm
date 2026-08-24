import { Octokit } from "@octokit/rest";

/**
 * Read-only GitHub client for the projects sync.
 *
 * Deliberately NOT named GITHUB_TOKEN: that variable already holds a stale
 * classic PAT from the retired post-management feature, and reusing the name
 * would silently run this sync on a token with unknown scopes.
 *
 * Expected: a fine-grained PAT scoped to the project repos with
 * Metadata:R, Contents:R, Actions:R, Pull requests:R. No write scopes.
 */
function createGithub() {
  const auth = process.env.GITHUB_SYNC_TOKEN;
  if (!auth) return null;
  return new Octokit({ auth, userAgent: "maazaowski-projects-sync" });
}

export type Github = NonNullable<ReturnType<typeof createGithub>>;
export const github = createGithub();
