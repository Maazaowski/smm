import { z } from "zod";

/** Where a project is in its life. Drives the status pill on cards and hero. */
export const PROJECT_STATUSES = [
  "active",
  "maintained",
  "shipped",
  "archived",
  "wip",
] as const;

export const projectStatusSchema = z.enum(PROJECT_STATUSES);

/**
 * Who a project was built for. "client" is the only kind where `client` is
 * rendered; the others show the kind label instead.
 */
export const PROJECT_KINDS = ["product", "client", "experiment"] as const;

export const projectKindSchema = z.enum(PROJECT_KINDS);

export const projectLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

/**
 * A published screenshot. `src` must be site-relative — that rule is what keeps
 * a private repo's raw.githubusercontent.com path out of the database. Images
 * are committed to public/images/projects/<slug>/ by hand.
 * width/height are required because next/image needs them to avoid layout shift.
 */
export const galleryImageSchema = z.object({
  src: z.string().min(1).startsWith("/", "Must be a site-relative path under /public"),
  alt: z.string().min(1),
  caption: z.string().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/** The curated, shapeless parts of a project — stored as one jsonb column. */
export const projectMetaSchema = z.object({
  stack: z.array(z.string().min(1)).default([]),
  outcomes: z.array(z.string().min(1)).default([]),
  links: z.array(projectLinkSchema).default([]),
  gallery: z.array(galleryImageSchema).default([]),
});

/**
 * What an admin create/update body must satisfy.
 *
 * Note there is deliberately no stats field here: GitHub-derived data lives in
 * a separate table written only by the sync, so a human request cannot set it
 * and a sync cannot overwrite prose. See src/lib/github/safe-stats.ts.
 */
export const projectInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be lowercase-kebab-case"),
  title: z.string().min(1),
  summary: z.string().default(""),
  description: z.string().default(""),
  body: z.string().default(""),
  category: z.string().min(1),
  status: projectStatusSchema,
  kind: projectKindSchema,
  year: z.string().default(""),
  client: z.string().default(""),
  repoOwner: z.string().nullable().default(null),
  repoName: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  meta: projectMetaSchema,
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectKind = z.infer<typeof projectKindSchema>;
export type ProjectLink = z.infer<typeof projectLinkSchema>;
export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type ProjectMeta = z.infer<typeof projectMetaSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;

/** Human-readable labels for the card meta line and the admin selects. */
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  maintained: "Maintained",
  shipped: "Shipped",
  archived: "Archived",
  wip: "In progress",
};

export const KIND_LABELS: Record<ProjectKind, string> = {
  product: "Product",
  client: "Client work",
  experiment: "Experiment",
};
