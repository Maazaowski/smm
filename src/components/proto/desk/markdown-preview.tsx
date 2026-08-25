"use client";

import { Fragment, useMemo } from "react";

/**
 * Client-side markdown rendering for the editor's Read pane.
 *
 * Deliberately small: headings, paragraphs, fenced code, blockquotes, lists,
 * bold, inline code and links. That is everything these essays actually use,
 * and it renders through the same .fn-prose styles the published page uses, so
 * the pane shows the real measure, the real type and the real rhythm.
 *
 * The production "Preview" pane prints the markdown source into a monospace
 * box — `## heading` stays `## heading` — which means the only way to see a
 * post rendered is to publish it.
 */

type Block =
  | { kind: "h"; level: 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "code"; lang: string; text: string }
  | { kind: "quote"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "hr" };

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ kind: "code", lang, text: body.join("\n") });
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({
        kind: "h",
        level: heading[1].length === 2 ? 2 : 3,
        text: heading[2].trim(),
      });
      i++;
      continue;
    }

    if (line.startsWith(">")) {
      const body: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        body.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ kind: "quote", text: body.join(" ").trim() });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith(">") &&
      !/^(#{2,3})\s/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+[.)]\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", text: para.join(" ") });
  }

  return blocks;
}

/** Inline: **bold**, `code`, [text](href). Order matters — code wins. */
function Inline({ text }: { text: string }) {
  const parts = useMemo(() => {
    const out: React.ReactNode[] = [];
    const pattern =
      /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;

    while ((m = pattern.exec(text)) !== null) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const token = m[0];

      if (token.startsWith("`")) {
        out.push(<code key={key++}>{token.slice(1, -1)}</code>);
      } else if (token.startsWith("**")) {
        out.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
      } else {
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        if (link) {
          out.push(
            <a key={key++} href={link[2]} target="_blank" rel="noopener noreferrer">
              {link[1]}
            </a>
          );
        } else {
          out.push(token);
        }
      }
      last = m.index + token.length;
    }

    if (last < text.length) out.push(text.slice(last));
    return out;
  }, [text]);

  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

export function MarkdownPreview({ source }: { source: string }) {
  const blocks = useMemo(() => parse(source), [source]);

  if (!source.trim()) {
    return (
      <p className="fn-preview-empty">
        Nothing to read yet. Switch back to <b>write</b> and start.
      </p>
    );
  }

  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "h":
            return b.level === 2 ? (
              <h2 key={i}>
                <Inline text={b.text} />
              </h2>
            ) : (
              <h3 key={i}>
                <Inline text={b.text} />
              </h3>
            );
          case "code":
            return (
              <figure key={i} className="fn-code">
                {b.lang && (
                  <figcaption className="fn-code-bar">
                    <span>{b.lang}</span>
                  </figcaption>
                )}
                <pre>
                  <code>{b.text}</code>
                </pre>
              </figure>
            );
          case "quote":
            return (
              <blockquote key={i}>
                <p>
                  <Inline text={b.text} />
                </p>
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            );
          case "hr":
            return <hr key={i} />;
          default:
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </>
  );
}
