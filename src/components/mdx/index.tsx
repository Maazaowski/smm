import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "./code-block";
import { Callout } from "./callout";

export const mdxComponents: MDXComponents = {
  pre: (props) => <CodeBlock {...props} />,
  blockquote: (props) => <Callout {...props} />,
  a: (props) => (
    <a
      {...props}
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-accent-blue hover:text-accent-purple transition-colors underline underline-offset-4 decoration-accent-blue/30 hover:decoration-accent-purple/50"
    />
  ),
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={props.alt || ""}
      className="rounded-xl border border-white/[0.08] my-8"
      loading="lazy"
    />
  ),
};
