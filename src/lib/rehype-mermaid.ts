/**
 * Rehype plugin: turn ```mermaid fenced code blocks into a <pre class="mermaid">
 * whose only child is the raw diagram source as a text node. Must run BEFORE
 * rehype-pretty-code: with no <code> child, Shiki skips the block and the raw
 * source survives. The CodeBlock component detects the "mermaid" class and
 * renders the diagram client-side instead of a highlighted code box.
 *
 * Note: a custom element tagName (e.g. <mermaid>) is dropped by the MDX
 * compiler, so we reuse <pre>, which is already in the components map.
 */

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function collectText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  if (!node.children) return "";
  return node.children.map(collectText).join("");
}

function isMermaidCode(node: HastNode): boolean {
  if (node.tagName !== "code") return false;
  const className = node.properties?.className;
  return Array.isArray(className) && className.includes("language-mermaid");
}

export function rehypeMermaid() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (
          child.tagName === "pre" &&
          child.children?.some(isMermaidCode)
        ) {
          const code = child.children.find(isMermaidCode)!;
          const chart = collectText(code).replace(/\n$/, "");
          node.children[i] = {
            type: "element",
            tagName: "pre",
            properties: { className: ["mermaid"] },
            children: [{ type: "text", value: chart }],
          };
          continue;
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
