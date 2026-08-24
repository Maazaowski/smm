import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "./db";
import { projects, projectStats } from "./db/schema";
import { DEFAULT_PROJECTS } from "./project-defaults";
import { safeRepoStatsSchema } from "./github/safe-stats";
import type { DbProject } from "./db/schema";
import type { ProjectInput, ProjectMeta } from "./project-types";
import type { SafeRepoStats, SyncStatus } from "./github/safe-stats";

/**
 * A project as the public site sees it: human content plus whatever the last
 * sync left behind. `stats` is null when the project has no repo, has never
 * been synced, or the sync has never succeeded.
 */
export interface Project extends DbProject {
  stats: SafeRepoStats | null;
  syncedAt: Date | null;
}

/** The list-page shape: everything except the MDX body. */
export type ProjectPreview = Omit<Project, "body">;

/** One row of the admin list. Never carries a body. */
export interface AdminProjectRow {
  slug: string;
  title: string;
  category: string;
  status: DbProject["status"];
  kind: DbProject["kind"];
  year: string;
  draft: boolean;
  featured: boolean;
  sortOrder: number;
  repoOwner: string | null;
  repoName: string | null;
  syncStatus: SyncStatus | null;
  syncError: string | null;
  syncedAt: Date | null;
}

/**
 * Columns for list views. Selecting the body to render a card is the kind of
 * waste that stays invisible because the page is ISR-cached.
 */
const previewColumns = {
  id: projects.id,
  slug: projects.slug,
  title: projects.title,
  summary: projects.summary,
  description: projects.description,
  category: projects.category,
  status: projects.status,
  kind: projects.kind,
  year: projects.year,
  client: projects.client,
  repoOwner: projects.repoOwner,
  repoName: projects.repoName,
  featured: projects.featured,
  draft: projects.draft,
  sortOrder: projects.sortOrder,
  meta: projects.meta,
  publishedAt: projects.publishedAt,
  updatedAt: projects.updatedAt,
} as const;

export async function getAllProjects(
  includeDrafts = false
): Promise<ProjectPreview[]> {
  if (!db) return [];
  try {
    const query = db
      .select({
        ...previewColumns,
        stats: projectStats.stats,
        syncedAt: projectStats.syncedAt,
      })
      .from(projects)
      .leftJoin(projectStats, eq(projectStats.projectId, projects.id))
      .$dynamic();

    const rows = await (includeDrafts
      ? query
      : query.where(eq(projects.draft, false))
    ).orderBy(asc(projects.sortOrder), desc(projects.publishedAt));

    return rows;
  } catch (err) {
    console.error("[projects] Failed to read projects:", err);
    return [];
  }
}

export async function getProjectBySlug(
  slug: string,
  includeDrafts = false
): Promise<Project | null> {
  if (!db) return null;
  try {
    const where = includeDrafts
      ? eq(projects.slug, slug)
      : and(eq(projects.slug, slug), eq(projects.draft, false));

    const rows = await db
      .select({
        ...previewColumns,
        body: projects.body,
        stats: projectStats.stats,
        syncedAt: projectStats.syncedAt,
      })
      .from(projects)
      .leftJoin(projectStats, eq(projectStats.projectId, projects.id))
      .where(where)
      .limit(1);

    return rows[0] ?? null;
  } catch (err) {
    console.error("[projects] Failed to read project:", err);
    return null;
  }
}

/** For generateStaticParams and the sitemap. */
export async function getProjectSlugs(): Promise<
  { slug: string; updatedAt: Date | null; publishedAt: Date }[]
> {
  if (!db) return [];
  try {
    return await db
      .select({
        slug: projects.slug,
        updatedAt: projects.updatedAt,
        publishedAt: projects.publishedAt,
      })
      .from(projects)
      .where(eq(projects.draft, false));
  } catch (err) {
    console.error("[projects] Failed to read project slugs:", err);
    return [];
  }
}

/** Projects with a repo configured — the sync's work list. */
export async function getSyncableProjects(): Promise<DbProject[]> {
  if (!db) return [];
  const rows = await db.select().from(projects);
  return rows.filter((p) => p.repoOwner && p.repoName);
}

export async function listProjectsForAdmin(): Promise<AdminProjectRow[]> {
  if (!db) return [];
  try {
    return await db
      .select({
        slug: projects.slug,
        title: projects.title,
        category: projects.category,
        status: projects.status,
        kind: projects.kind,
        year: projects.year,
        draft: projects.draft,
        featured: projects.featured,
        sortOrder: projects.sortOrder,
        repoOwner: projects.repoOwner,
        repoName: projects.repoName,
        syncStatus: projectStats.syncStatus,
        syncError: projectStats.syncError,
        syncedAt: projectStats.syncedAt,
      })
      .from(projects)
      .leftJoin(projectStats, eq(projectStats.projectId, projects.id))
      .orderBy(asc(projects.sortOrder), desc(projects.publishedAt));
  } catch (err) {
    console.error("[projects] Failed to list projects for admin:", err);
    return [];
  }
}

// --- Write operations ---

export async function createProject(input: ProjectInput): Promise<Project> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db
    .insert(projects)
    .values({ ...input, meta: input.meta as ProjectMeta })
    .returning();
  return { ...rows[0], stats: null, syncedAt: null };
}

export async function updateProject(
  slug: string,
  input: ProjectInput
): Promise<Project | null> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  // Slug is deliberately absent from the SET: it is immutable on edit, the same
  // way the posts editor treats it.
  const rows = await db
    .update(projects)
    .set({
      title: input.title,
      summary: input.summary,
      description: input.description,
      body: input.body,
      category: input.category,
      status: input.status,
      kind: input.kind,
      year: input.year,
      client: input.client,
      repoOwner: input.repoOwner,
      repoName: input.repoName,
      featured: input.featured,
      draft: input.draft,
      sortOrder: input.sortOrder,
      meta: input.meta as ProjectMeta,
      updatedAt: new Date(),
    })
    .where(eq(projects.slug, slug))
    .returning();
  if (!rows[0]) return null;
  const stats = await readStatsFor(rows[0].id);
  return { ...rows[0], stats: stats?.stats ?? null, syncedAt: stats?.syncedAt ?? null };
}

export async function deleteProject(slug: string): Promise<boolean> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db
    .delete(projects)
    .where(eq(projects.slug, slug))
    .returning();
  return rows.length > 0;
}

async function readStatsFor(projectId: number) {
  if (!db) return null;
  const rows = await db
    .select()
    .from(projectStats)
    .where(eq(projectStats.projectId, projectId))
    .limit(1);
  return rows[0] ?? null;
}

/** The stats a project already has, so a partial sync can preserve them. */
export async function getExistingStats(
  projectId: number
): Promise<SafeRepoStats | null> {
  const row = await readStatsFor(projectId);
  return row?.stats ?? null;
}

/**
 * The write boundary for GitHub-derived data. Everything is re-validated here,
 * so a stats blob that a refactor forgot to redact throws rather than landing
 * in a table the public site reads. See src/lib/github/safe-stats.ts.
 */
export async function upsertProjectStats(
  projectId: number,
  stats: SafeRepoStats,
  syncStatus: SyncStatus,
  syncError: string | null
): Promise<void> {
  if (!db) throw new Error("DATABASE_URL is not configured.");

  const validated = safeRepoStatsSchema.parse(stats);
  const now = new Date();
  const existing = await readStatsFor(projectId);

  if (existing) {
    await db
      .update(projectStats)
      .set({ stats: validated, syncStatus, syncError, syncedAt: now })
      .where(eq(projectStats.id, existing.id));
    return;
  }

  await db
    .insert(projectStats)
    .values({ projectId, stats: validated, syncStatus, syncError, syncedAt: now });
}

/** Records a failed sync without touching the stats blob it could not refresh. */
export async function recordSyncFailure(
  projectId: number,
  syncError: string
): Promise<void> {
  if (!db) return;
  const existing = await readStatsFor(projectId);
  if (!existing) return; // nothing to annotate yet — the first sync simply failed
  await db
    .update(projectStats)
    .set({ syncStatus: "error", syncError, syncedAt: new Date() })
    .where(eq(projectStats.id, existing.id));
}

/** Idempotent. Mirrors seedAboutContent — the table fills on first admin visit. */
export async function seedProjects(): Promise<number> {
  if (!db) return 0;
  try {
    const existing = await db.select({ id: projects.id }).from(projects).limit(1);
    if (existing.length > 0) return 0;

    const rows = await db
      .insert(projects)
      .values(
        DEFAULT_PROJECTS.map((p) => ({ ...p, meta: p.meta as ProjectMeta }))
      )
      .returning({ id: projects.id });

    return rows.length;
  } catch (err) {
    console.error("[projects] Failed to seed projects:", err);
    return 0;
  }
}
