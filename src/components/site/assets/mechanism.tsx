"use client";

import { MECHANISMS } from "./mechanisms";

/**
 * Picks a project's mechanism plate by slug.
 *
 * The lookup happens here rather than in the page so the component map stays
 * out of the server bundle — a server component indexing into a "use client"
 * export works, but this keeps the boundary obvious and the page free of
 * component-reference juggling.
 *
 * Renders nothing for an unknown slug, which is the right failure: a project
 * without a plate gets an empty framed panel rather than a crash.
 */
export function Mechanism({ slug }: { slug: string }) {
  const C = MECHANISMS[slug];
  return C ? <C /> : null;
}
