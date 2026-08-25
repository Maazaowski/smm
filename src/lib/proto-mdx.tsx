import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import type { MDXComponents } from "mdx/types";
import type { HTMLAttributes } from "react";

/**
 * MDX pipeline for the prototype.
 *
 * Two deliberate differences from the production pipeline:
 *
 * 1. Heading anchors are PREPENDED as a small mono "#" that lives in the
 *    margin and appears on hover, instead of WRAPPING the heading text. In
 *    production the wrap plus a link component that overwrites className is why
 *    every h2 on the site renders as an amber underlined hyperlink.
 * 2. The link component merges its class with whatever it is given rather than
 *    replacing it, so a styled anchor can never be clobbered again.
 */

const protoComponents: MDXComponents = {
  pre: ({
    children,
    ...props
  }: HTMLAttributes<HTMLPreElement> & { "data-language"?: string }) => {
    const language = props["data-language"];
    return (
      <figure className="fn-code">
        {language && (
          <figcaption className="fn-code-bar">
            <span>{language}</span>
          </figcaption>
        )}
        <pre {...props}>{children}</pre>
      </figure>
    );
  },
  a: ({ className, href, ...props }) => {
    const external = href?.startsWith("http");
    return (
      <a
        {...props}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        // Merged, never replaced.
        className={className}
      />
    );
  },
  img: ({ alt, ...props }) => (
    // Article images come from MDX with unknown intrinsic dimensions, so
    // next/image cannot reserve space for them without the author supplying
    // width and height. Plain <img> with lazy loading is the honest choice
    // until the editor captures those.
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt || ""} loading="lazy" className="fn-figure" />
  ),
};

export async function renderProtoMDX(source: string) {
  const { content } = await compileMDX({
    source,
    components: protoComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "prepend",
              properties: { className: ["fn-anchor"], ariaHidden: true, tabIndex: -1 },
              content: { type: "text", value: "#" },
            },
          ],
          [
            rehypePrettyCode,
            {
              theme: { dark: "vitesse-dark", light: "vitesse-light" },
              keepBackground: false,
            },
          ],
        ],
      },
    },
  });

  return content;
}
