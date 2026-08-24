import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { AboutContent } from "../about-types";
import type { ProjectKind, ProjectMeta, ProjectStatus } from "../project-types";
import type { SafeRepoStats, SyncStatus } from "../github/safe-stats";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull().default(""),
  category: text("category").notNull().default("General"),
  tags: text("tags").array().notNull().default([]),
  draft: boolean("draft").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type DbPost = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export const aboutPage = pgTable("about_page", {
  id: serial("id").primaryKey(),
  content: jsonb("content").$type<AboutContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type DbAboutPage = typeof aboutPage.$inferSelect;
export type NewAboutPage = typeof aboutPage.$inferInsert;

/**
 * Human-authored project content. Everything here is written by the admin panel
 * and nothing here is ever written by the GitHub sync — see projectStats.
 */
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    /** One line. Card subtitle and meta description. */
    summary: text("summary").notNull().default(""),
    /** Two or three sentences. Card body. */
    description: text("description").notNull().default(""),
    /** The MDX case study, rendered by renderMDX(). May be empty. */
    body: text("body").notNull().default(""),
    category: text("category").notNull().default("Web Development"),
    status: text("status").$type<ProjectStatus>().notNull().default("active"),
    kind: text("kind").$type<ProjectKind>().notNull().default("product"),
    year: text("year").notNull().default(""),
    /** Only rendered when kind === "client". */
    client: text("client").notNull().default(""),

    /** Both null means the project is never synced — a pure case study. */
    repoOwner: text("repo_owner"),
    repoName: text("repo_name"),

    featured: boolean("featured").notNull().default(false),
    draft: boolean("draft").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    /** Curated and shapeless: stack, outcomes, links, gallery. */
    meta: jsonb("meta").$type<ProjectMeta>().notNull(),

    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [index("projects_order_idx").on(t.sortOrder, t.publishedAt)]
);

export type DbProject = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

/**
 * Machine-written mirror of a GitHub repo, kept in its own table so the two
 * writers never touch the same bytes: the sync owns this, the admin owns
 * `projects`. Every value in `stats` has passed toSafeStats() and
 * safeRepoStatsSchema.parse() — see src/lib/github/safe-stats.ts.
 */
export const projectStats = pgTable("project_stats", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  stats: jsonb("stats").$type<SafeRepoStats>().notNull(),
  syncStatus: text("sync_status").$type<SyncStatus>().notNull().default("ok"),
  /** Sanitized code only ("HTTP 404"). Admin-only, never rendered publicly. */
  syncError: text("sync_error"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DbProjectStats = typeof projectStats.$inferSelect;
export type NewProjectStats = typeof projectStats.$inferInsert;
