import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { MDXComponents } from "mdx/types";
import type { HTMLAttributes } from "react";
import { MermaidDiagram } from "@/components/site/mermaid";
import { CodeBlock } from "@/components/site/code-block";

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
 * 3. ```mermaid fences are diverted to a diagram renderer before the syntax
 *    highlighter can claim them.
 */

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * Pull ```mermaid fences out of the code path.
 *
 * This has to run BEFORE rehype-pretty-code. Shiki has a mermaid grammar, so
 * left alone it happily highlights the fence and emits a perfectly good code
 * block — which is exactly the bug: the diagram never renders because nothing
 * downstream can tell "code that is mermaid" from "code that is bash".
 *
 * The fence is replaced with a bare <div data-mermaid="...">, which the
 * components map below turns into the client renderer. A data attribute rather
 * than a custom tag name because MDX resolves those against the components
 * record by exact string, and a plain div cannot be got wrong.
 */
function rehypeMermaid() {
  return (tree: HastNode) => {
    visit(tree, "element", (node: HastNode, index, parent) => {
      if (
        node.tagName !== "pre" ||
        !parent ||
        index === null ||
        index === undefined
      ) {
        return;
      }

      const code = node.children?.find(
        (c) => c.type === "element" && c.tagName === "code",
      );
      const classes = code?.properties?.className;
      if (!Array.isArray(classes) || !classes.includes("language-mermaid")) {
        return;
      }

      // A fence's body is a single text node; join defensively anyway.
      const source = (code?.children ?? [])
        .map((c) => (c.type === "text" ? (c.value ?? "") : ""))
        .join("");

      (parent as HastNode).children![index as number] = {
        type: "element",
        tagName: "div",
        properties: { "data-mermaid": source },
        children: [],
      };
    });
  };
}

const protoComponents: MDXComponents = {
  div: ({
    children,
    ...props
  }: HTMLAttributes<HTMLDivElement> & { "data-mermaid"?: string }) => {
    const source = props["data-mermaid"];
    if (typeof source === "string") return <MermaidDiagram source={source} />;
    return <div {...props}>{children}</div>;
  },
  pre: ({
    children,
    ...props
  }: HTMLAttributes<HTMLPreElement> & { "data-language"?: string }) => (
    // The bar is unconditional now. It used to appear only when the fence
    // declared a language, which meant a plain fence had nowhere to hang a
    // copy button — the blocks most worth copying are often the unlabelled
    // ones.
    <CodeBlock language={props["data-language"]}>
      <pre {...props}>{children}</pre>
    </CodeBlock>
  ),
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
          // Before rehypePrettyCode — see the note on rehypeMermaid.
          rehypeMermaid,
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "prepend",
              properties: {
                className: ["fn-anchor"],
                ariaHidden: true,
                tabIndex: -1,
              },
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
