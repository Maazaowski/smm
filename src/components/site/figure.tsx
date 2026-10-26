import type { CSSProperties } from "react";

export type FigureAlign = "full" | "wide" | "left" | "right" | "center";

export interface FigureProps {
  src: string;
  alt?: string;
  /** Shown under the image in the mono micro face. */
  caption?: string;
  /**
   * full   — the text column (default)
   * wide   — bleeds a little past the column on either side
   * left   — floats left, text wraps on the right
   * right  — floats right, text wraps on the left
   * center — narrower than the column, centred
   */
  align?: FigureAlign;
  /** Percentage of the column, for left / right / center. */
  size?: number | string;
  /** Intrinsic pixel size, so the browser reserves the box before the bytes land. */
  width?: number | string;
  height?: number | string;
}

const ALIGNS: FigureAlign[] = ["full", "wide", "left", "right", "center"];

/**
 * An essay image with placement.
 *
 * Plain Markdown `![alt](src)` still works and renders the full-column figure;
 * this is for everything Markdown cannot say — a caption, a float, a width.
 * It is what the desk's image tool writes into the body.
 */
export function Figure({
  src,
  alt = "",
  caption,
  align = "full",
  size,
  width,
  height,
}: FigureProps) {
  const safeAlign = ALIGNS.includes(align) ? align : "full";
  const pct = Number(size);
  const sized =
    (safeAlign === "left" || safeAlign === "right" || safeAlign === "center") &&
    Number.isFinite(pct) &&
    pct > 0;
  const style = sized
    ? ({ "--fn-figure-w": `${Math.min(100, Math.max(20, pct))}%` } as CSSProperties)
    : undefined;

  return (
    <figure className="fn-figure-wrap" data-align={safeAlign} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="fn-figure"
      />
      {caption ? <figcaption className="fn-figcaption">{caption}</figcaption> : null}
    </figure>
  );
}
