import { revalidatePath } from "next/cache";

/**
 * Public pages are served from the ISR cache with `revalidate = 60` (3600 for
 * the feed and sitemap). Without an explicit invalidation, an admin write does
 * not reach the public site for up to an hour: publishing looks like it failed,
 * unpublishing leaves the post readable, and a deleted URL keeps returning 200.
 *
 * Every admin mutation calls one of these. They are deliberately blunt — this
 * is a personal site with a handful of pages, so purging the whole surface
 * costs one rebuild of a few static pages and removes an entire class of
 * "did my save work?" confusion.
 */

type Target = string | [path: string, type: "page" | "layout"];

function purge(targets: Target[]) {
  for (const target of targets) {
    const [path, type] = Array.isArray(target) ? target : [target, undefined];
    try {
      if (type) revalidatePath(path, type);
      else revalidatePath(path);
    } catch (err) {
      // A failed purge must never fail the write that already succeeded.
      console.error("[revalidate]", path, err);
    }
  }
}

/** Call after any create/update/delete on a post. */
export function revalidatePost(slug: string) {
  purge([
    "/",
    "/blog",
    `/blog/${slug}`,
    "/rss.xml",
    "/sitemap.xml",
  ]);
}

/** Call after any create/update/delete on a project. */
export function revalidateProject(slug: string) {
  purge(["/", "/projects", `/projects/${slug}`, "/sitemap.xml"]);
}

/**
 * Call after a GitHub sync. The sync can touch every project's stats at once,
 * so purge the whole project surface rather than guessing which rows moved.
 */
export function revalidateProjectsIndex() {
  purge(["/", "/projects", ["/projects/[slug]", "page"]]);
}

/** Call after the About page content is saved. */
export function revalidateAbout() {
  purge(["/about"]);
}

/** Call after any create/update/delete on a testimonial. They render on "/". */
export function revalidateTestimonials() {
  purge(["/"]);
}
