"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { inputClass, labelClass, selectClass } from "./editor-primitives";
import { slugify } from "@/lib/utils";

/**
 * The image tool: pick a file, crop it, turn it, size it, adjust it, choose
 * the encoding, say where it sits in the essay, upload, insert.
 *
 * All the pixel work happens here in a canvas. The server never resizes:
 * that keeps the upload small (Vercel caps a request body at 4.5 MB), keeps
 * a native image library out of the build, and means what the preview shows
 * is byte-for-byte what gets stored.
 *
 * SVG and GIF skip the canvas. Rasterising an SVG throws away the thing that
 * makes it an SVG, and a canvas keeps one frame of a GIF; both go up as they
 * are.
 */

/* ------------------------------------------------------------------ types */

export type FigureAlign = "full" | "wide" | "left" | "right" | "center";
type Format = "image/webp" | "image/jpeg" | "image/png";
type Rotation = 0 | 90 | 180 | 270;
type Corner = "nw" | "ne" | "sw" | "se";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Source {
  file: File;
  url: string;
  img: HTMLImageElement;
  w: number;
  h: number;
  kind: "raster" | "svg" | "gif";
}

interface Adjust {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  blur: number;
}

interface Output {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  type: string;
}

interface Placement {
  alt: string;
  caption: string;
  align: FigureAlign;
  size: number;
}

interface LibraryItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

interface Props {
  /** Folder the upload lands in. */
  postSlug: string;
  /** A file pasted or dropped into the body textarea, handed over here. */
  incomingFile: File | null;
  onIncomingConsumed: () => void;
  /** Receives the MDX to put at the cursor. */
  onInsert: (snippet: string) => void;
}

/* -------------------------------------------------------------- constants */

const MIN_CROP = 16;
const PREVIEW_MAX = 560;
const WIDTH_PRESETS = [480, 720, 960, 1280, 1600];
const ASPECTS: { label: string; value: number | null }[] = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "21:9", value: 21 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
];
const ALIGN_OPTIONS: { value: FigureAlign; label: string; hint: string }[] = [
  { value: "full", label: "Column", hint: "the width of the text" },
  { value: "wide", label: "Wide", hint: "a little past the text on both sides" },
  { value: "left", label: "Left", hint: "text wraps on the right" },
  { value: "right", label: "Right", hint: "text wraps on the left" },
  { value: "center", label: "Centred", hint: "narrower than the text, centred" },
];
const DEFAULT_ADJUST: Adjust = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  blur: 0,
};
const DEFAULT_PLACEMENT: Placement = { alt: "", caption: "", align: "full", size: 45 };
const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

/* ---------------------------------------------------------------- helpers */

/**
 * The MDX the tool writes. Markdown's image syntax cannot carry any of this.
 *
 * Every attribute is a quoted string, never a `{…}` expression: the site
 * renders essays with next-mdx-remote's `blockJS` left on, which strips JSX
 * expressions from body text before it compiles. `width={960}` would simply
 * vanish; `width="960"` arrives.
 */
export function buildFigureSnippet(o: {
  url: string;
  alt: string;
  caption?: string;
  align: FigureAlign;
  size?: number;
  width?: number;
  height?: number;
}): string {
  const attrs = [`src="${o.url}"`, `alt="${escapeAttr(o.alt)}"`];
  if (o.width && o.height) attrs.push(`width="${o.width}"`, `height="${o.height}"`);
  if (o.align !== "full") attrs.push(`align="${o.align}"`);
  if (o.size && (o.align === "left" || o.align === "right" || o.align === "center")) {
    attrs.push(`size="${Math.round(o.size)}"`);
  }
  if (o.caption?.trim()) attrs.push(`caption="${escapeAttr(o.caption.trim())}"`);
  return `<Figure ${attrs.join(" ")} />`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/[{}]/g, (c) => (c === "{" ? "&#123;" : "&#125;")).replace(/\r?\n/g, " ");
}

/** `name-1200x800-9f3a1c2b.webp` → dims the server folded into the name. */
function dimsFromPathname(pathname: string): { width: number; height: number } | null {
  const m = /-(\d+)x(\d+)-[a-f0-9]{8}\.[a-z0-9]+$/i.exec(pathname);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

function orient(w: number, h: number, rotate: Rotation): [number, number] {
  return rotate % 180 === 0 ? [w, h] : [h, w];
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function filterString(a: Adjust): string {
  const parts: string[] = [];
  if (a.brightness !== 100) parts.push(`brightness(${a.brightness}%)`);
  if (a.contrast !== 100) parts.push(`contrast(${a.contrast}%)`);
  if (a.saturate !== 100) parts.push(`saturate(${a.saturate}%)`);
  if (a.grayscale !== 0) parts.push(`grayscale(${a.grayscale}%)`);
  if (a.blur !== 0) parts.push(`blur(${a.blur}px)`);
  return parts.length ? parts.join(" ") : "none";
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Largest rect of `aspect` that fits in w×h, centred. */
function fitAspect(w: number, h: number, aspect: number): Rect {
  let cw = w;
  let ch = cw / aspect;
  if (ch > h) {
    ch = h;
    cw = ch * aspect;
  }
  return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
}

/** Draw the source rotated and flipped into a context sized for the result. */
function drawOriented(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  w: number,
  h: number,
  rotate: Rotation,
  flipH: boolean,
  flipV: boolean,
  scale = 1
) {
  const [ow, oh] = orient(w, h, rotate);
  ctx.save();
  ctx.translate((ow * scale) / 2, (oh * scale) / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, (-w * scale) / 2, (-h * scale) / 2, w * scale, h * scale);
  ctx.restore();
}

/** Move one corner of `start` by (dx, dy), keeping it inside ow×oh and on `aspect`. */
function resizeCorner(
  start: Rect,
  corner: Corner,
  dx: number,
  dy: number,
  aspect: number | null,
  ow: number,
  oh: number
): Rect {
  const west = corner.includes("w");
  const north = corner.includes("n");
  const left0 = start.x;
  const top0 = start.y;
  const right0 = start.x + start.w;
  const bottom0 = start.y + start.h;

  let left = left0;
  let right = right0;
  let top = top0;
  let bottom = bottom0;
  if (west) left = clamp(left0 + dx, 0, right0 - MIN_CROP);
  else right = clamp(right0 + dx, left0 + MIN_CROP, ow);
  if (north) top = clamp(top0 + dy, 0, bottom0 - MIN_CROP);
  else bottom = clamp(bottom0 + dy, top0 + MIN_CROP, oh);

  if (aspect) {
    let w = right - left;
    let h = w / aspect;
    if (north) {
      top = bottom - h;
      if (top < 0) {
        top = 0;
        h = bottom;
        w = h * aspect;
      }
    } else {
      bottom = top + h;
      if (bottom > oh) {
        bottom = oh;
        h = bottom - top;
        w = h * aspect;
      }
    }
    if (west) {
      left = right - w;
      if (left < 0) {
        left = 0;
        w = right;
        h = w / aspect;
        if (north) top = bottom - h;
        else bottom = top + h;
      }
    } else {
      right = left + w;
      if (right > ow) {
        right = ow;
        w = right - left;
        h = w / aspect;
        if (north) top = bottom - h;
        else bottom = top + h;
      }
    }
  }
  return { x: left, y: top, w: right - left, h: bottom - top };
}

async function loadSource(file: File): Promise<Source> {
  if (!file.type.startsWith("image/")) throw new Error("That is not an image.");
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
  const kind =
    file.type === "image/svg+xml" ? "svg" : file.type === "image/gif" ? "gif" : "raster";
  return { file, url, img, w: img.naturalWidth, h: img.naturalHeight, kind };
}

async function renderOutput(
  src: Source,
  rotate: Rotation,
  flipH: boolean,
  flipV: boolean,
  crop: Rect,
  targetWidth: number,
  adjust: Adjust,
  format: Format,
  quality: number
): Promise<Output> {
  const [ow, oh] = orient(src.w, src.h, rotate);
  const oriented = document.createElement("canvas");
  oriented.width = ow;
  oriented.height = oh;
  const octx = oriented.getContext("2d");
  if (!octx) throw new Error("Canvas is not available in this browser.");
  drawOriented(octx, src.img, src.w, src.h, rotate, flipH, flipV);

  const outW = Math.max(1, Math.round(targetWidth));
  const outH = Math.max(1, Math.round((crop.h * outW) / crop.w));
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  if (format === "image/jpeg") {
    // JPEG has no alpha; without this, transparent pixels come out black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = filterString(adjust);
  ctx.drawImage(oriented, crop.x, crop.y, crop.w, crop.h, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, format, format === "image/png" ? undefined : quality)
  );
  if (!blob) throw new Error("Encoding failed.");
  return { blob, url: URL.createObjectURL(blob), width: outW, height: outH, type: blob.type };
}

/* ------------------------------------------------------------- component */

export function ImageTool({ postSlug, incomingFile, onIncomingConsumed, onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "library">("new");
  const [error, setError] = useState<string | null>(null);

  // Source and edit state
  const [source, setSource] = useState<Source | null>(null);
  const [rotate, setRotate] = useState<Rotation>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [crop, setCrop] = useState<Rect | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [targetWidth, setTargetWidth] = useState<number | null>(null);
  const [adjust, setAdjust] = useState<Adjust>(DEFAULT_ADJUST);
  const [format, setFormat] = useState<Format>("image/webp");
  const [quality, setQuality] = useState(82);
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [output, setOutput] = useState<Output | null>(null);
  const [rendering, setRendering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Library
  const [library, setLibrary] = useState<LibraryItem[] | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [libraryBackend, setLibraryBackend] = useState<string | null>(null);
  const [picked, setPicked] = useState<LibraryItem | null>(null);
  const [pickedPlacement, setPickedPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ow, oh] = useMemo(
    () => (source ? orient(source.w, source.h, rotate) : [0, 0]),
    [source, rotate]
  );
  const effCrop: Rect = useMemo(
    () => crop ?? { x: 0, y: 0, w: ow, h: oh },
    [crop, ow, oh]
  );
  const effWidth = Math.round(targetWidth ?? effCrop.w);
  const editable = source?.kind === "raster";

  /* ---- loading a file ---- */

  const resetEdits = () => {
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(null);
    setAspect(null);
    setTargetWidth(null);
    setAdjust(DEFAULT_ADJUST);
    setFormat("image/webp");
    setQuality(82);
  };

  const takeFile = useCallback(async (file: File) => {
    try {
      const next = await loadSource(file);
      setError(null);
      setSource((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return next;
      });
      setRotate(0);
      setFlipH(false);
      setFlipV(false);
      setCrop(null);
      setAspect(null);
      setAdjust(DEFAULT_ADJUST);
      setQuality(82);
      // Anything over 1600 wide gets brought down to it: wider than the
      // column will ever show at 2x, and the main lever on file size.
      setTargetWidth(next.w > 1600 && next.kind === "raster" ? 1600 : null);
      setFormat(next.file.type === "image/png" ? "image/png" : "image/webp");
      setName(slugify(file.name.replace(/\.[a-z0-9]+$/i, "")) || "image");
      setPlacement(DEFAULT_PLACEMENT);
      setOpen(true);
      setTab("new");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Each pasted or dropped file is handled once. The parent keeps the File in
  // state until the next one arrives; the ref stops a re-render re-loading it.
  const handledRef = useRef<File | null>(null);
  useEffect(() => {
    if (!incomingFile || handledRef.current === incomingFile) return;
    handledRef.current = incomingFile;
    void takeFile(incomingFile).then(onIncomingConsumed);
  }, [incomingFile, takeFile, onIncomingConsumed]);

  const clearSource = () => {
    setSource((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setOutput((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    resetEdits();
    setPlacement(DEFAULT_PLACEMENT);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---- the preview canvas: oriented, adjusted, not yet cropped ---- */

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !source || !editable) return;
    const scale = Math.min(1, PREVIEW_MAX / ow);
    canvas.width = Math.round(ow * scale);
    canvas.height = Math.round(oh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = filterString(adjust);
    drawOriented(ctx, source.img, source.w, source.h, rotate, flipH, flipV, scale);
  }, [source, editable, ow, oh, rotate, flipH, flipV, adjust]);

  /* ---- the output: debounced, so sliders do not encode on every tick ---- */

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setRendering(true);
      try {
        // SVG and GIF pass through as they are; see the note at the top.
        const next: Output = editable
          ? await renderOutput(
              source, rotate, flipH, flipV, effCrop, effWidth, adjust, format, quality / 100
            )
          : {
              blob: source.file,
              url: URL.createObjectURL(source.file),
              width: source.w,
              height: source.h,
              type: source.file.type,
            };
        if (cancelled) {
          URL.revokeObjectURL(next.url);
          return;
        }
        setOutput((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return next;
        });
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [source, editable, rotate, flipH, flipV, effCrop, effWidth, adjust, format, quality]);

  /* ---- crop interaction ---- */

  const dragRef = useRef<{
    mode: "move" | Corner;
    startX: number;
    startY: number;
    start: Rect;
    scale: number;
  } | null>(null);

  const beginDrag = (mode: "move" | Corner, e: ReactPointerEvent) => {
    if (!overlayRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = overlayRef.current.getBoundingClientRect();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      start: effCrop,
      scale: rect.width / ow,
    };
    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (ev.clientX - d.startX) / d.scale;
      const dy = (ev.clientY - d.startY) / d.scale;
      if (d.mode === "move") {
        setCrop({
          ...d.start,
          x: clamp(d.start.x + dx, 0, ow - d.start.w),
          y: clamp(d.start.y + dy, 0, oh - d.start.h),
        });
      } else {
        setCrop(resizeCorner(d.start, d.mode, dx, dy, aspect, ow, oh));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const chooseAspect = (value: number | null) => {
    setAspect(value);
    setCrop(value ? fitAspect(ow, oh, value) : null);
  };

  const turn = (dir: 1 | -1) => {
    setRotate((r) => (((r + dir * 90) % 360 + 360) % 360) as Rotation);
    // The crop was in the old orientation's coordinates. Start again.
    setCrop(null);
    setAspect(null);
  };

  /* ---- upload + insert ---- */

  const upload = async (): Promise<{ url: string; width?: number; height?: number } | null> => {
    if (!output || !source) return null;
    setUploading(true);
    setError(null);
    try {
      const ext = EXT[output.type] ?? "bin";
      const file = new File([output.blob], `${name || "image"}.${ext}`, { type: output.type });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("post", postSlug);
      fd.append("name", name);
      if (output.width && output.height) {
        fd.append("width", String(output.width));
        fd.append("height", String(output.height));
      }
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status}).`);
      setLibrary(null); // refetch next time the library opens
      return { url: data.url, width: data.width, height: data.height };
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadAndInsert = async () => {
    const up = await upload();
    if (!up) return;
    onInsert(
      buildFigureSnippet({
        url: up.url,
        alt: placement.alt,
        caption: placement.caption,
        align: placement.align,
        size: placement.size,
        width: up.width,
        height: up.height,
      })
    );
    clearSource();
  };

  const uploadOnly = async () => {
    const up = await upload();
    if (!up) return;
    clearSource();
    setTab("library");
  };

  /* ---- library ---- */

  useEffect(() => {
    if (!open || tab !== "library" || library !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/media", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `Could not list images (${res.status}).`);
        if (cancelled) return;
        setLibrary(data.items ?? []);
        setLibraryBackend(data.backend ?? null);
        setLibraryError(null);
      } catch (err) {
        if (!cancelled) setLibraryError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, library]);

  const insertPicked = () => {
    if (!picked) return;
    const dims = dimsFromPathname(picked.pathname);
    onInsert(
      buildFigureSnippet({
        url: picked.url,
        alt: pickedPlacement.alt,
        caption: pickedPlacement.caption,
        align: pickedPlacement.align,
        size: pickedPlacement.size,
        width: dims?.width,
        height: dims?.height,
      })
    );
    setPicked(null);
    setPickedPlacement(DEFAULT_PLACEMENT);
  };

  const deletePicked = async (item: LibraryItem) => {
    try {
      const res = await fetch(`/api/admin/media?url=${encodeURIComponent(item.url)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Delete failed (${res.status}).`);
      setLibrary((prev) => (prev ?? []).filter((i) => i.url !== item.url));
      if (picked?.url === item.url) setPicked(null);
      setConfirmDelete(null);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : String(err));
    }
  };

  /* ---- render ---- */

  const cropPct = {
    left: `${(effCrop.x / (ow || 1)) * 100}%`,
    top: `${(effCrop.y / (oh || 1)) * 100}%`,
    width: `${(effCrop.w / (ow || 1)) * 100}%`,
    height: `${(effCrop.h / (oh || 1)) * 100}%`,
  };

  return (
    <section className="dk-panel dk-imgtool" aria-label="Images">
      <button
        type="button"
        className="dk-panel-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h2 className="dk-panel-h">Images</h2>
        <span className="sg-micro" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="dk-panel-body">
          <div className="dk-seg" role="tablist" aria-label="Image source">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "new"}
              onClick={() => setTab("new")}
            >
              New
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "library"}
              onClick={() => setTab("library")}
            >
              Uploaded
            </button>
          </div>

          {error && (
            <p className="sg-error sg-mono" role="alert">
              {error}
            </p>
          )}

          {tab === "new" && !source && (
            <div
              className="dk-drop"
              data-over={dragOver ? "true" : undefined}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void takeFile(f);
              }}
            >
              <p>Drop an image here, paste one into the body, or</p>
              <button
                type="button"
                className="dk-link"
                onClick={() => fileInputRef.current?.click()}
              >
                choose a file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void takeFile(f);
                }}
              />
              <span className="dk-help">webp, jpeg, png, gif, avif, svg</span>
            </div>
          )}

          {tab === "new" && source && (
            <div className="dk-imgtool-work">
              <div className="dk-imgtool-stage">
                <div className="dk-sub">
                  <div className="dk-sub-head">
                    <span className="dk-label" style={{ margin: 0 }}>
                      {editable ? "Crop" : source.kind === "svg" ? "SVG" : "GIF"}
                    </span>
                    <span className="dk-help sg-mono" style={{ margin: 0 }}>
                      {source.w}×{source.h} · {fmtBytes(source.file.size)}
                    </span>
                  </div>
                  {editable ? (
                    <div className="dk-crop-frame">
                      <canvas ref={previewRef} className="dk-crop-canvas" />
                      <div ref={overlayRef} className="dk-crop-overlay">
                        <div
                          className="dk-crop-box"
                          style={cropPct}
                          onPointerDown={(e) => beginDrag("move", e)}
                          role="presentation"
                        >
                          {(["nw", "ne", "sw", "se"] as Corner[]).map((c) => (
                            <span
                              key={c}
                              className="dk-crop-handle"
                              data-corner={c}
                              onPointerDown={(e) => beginDrag(c, e)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="dk-crop-frame">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={source.url} alt="" className="dk-crop-canvas" />
                      <p className="dk-help">
                        {source.kind === "svg"
                          ? "Vector files go up untouched; nothing here would survive rasterising."
                          : "GIFs go up untouched so the animation survives."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="dk-sub">
                  <div className="dk-sub-head">
                    <span className="dk-label" style={{ margin: 0 }}>
                      Result
                    </span>
                    <span className="dk-help sg-mono" style={{ margin: 0 }}>
                      {output
                        ? `${output.width}×${output.height} · ${EXT[output.type] ?? output.type} · ${fmtBytes(output.blob.size)}`
                        : "…"}
                      {rendering ? " · rendering" : ""}
                    </span>
                  </div>
                  <div className="dk-result" data-align={placement.align}>
                    {output && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={output.url} alt="" />
                    )}
                    {placement.align !== "full" && placement.align !== "wide" && (
                      <div className="dk-result-text" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                  </div>
                  {output && output.blob.size > 4 * 1024 * 1024 && (
                    <p className="sg-error sg-mono">Over 4 MB. Lower the width or quality.</p>
                  )}
                </div>
              </div>

              {editable && (
                <div className="dk-imgtool-controls">
                  <div>
                    <span className={labelClass}>Aspect</span>
                    <div className="dk-seg">
                      {ASPECTS.map((a) => (
                        <button
                          key={a.label}
                          type="button"
                          aria-pressed={aspect === a.value}
                          onClick={() => chooseAspect(a.value)}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className={labelClass}>Turn · flip</span>
                    <div className="dk-seg">
                      <button type="button" onClick={() => turn(-1)} aria-label="Rotate left">
                        ↺ 90°
                      </button>
                      <button type="button" onClick={() => turn(1)} aria-label="Rotate right">
                        ↻ 90°
                      </button>
                      <button
                        type="button"
                        aria-pressed={flipH}
                        onClick={() => setFlipH((v) => !v)}
                      >
                        ↔ Flip
                      </button>
                      <button
                        type="button"
                        aria-pressed={flipV}
                        onClick={() => setFlipV((v) => !v)}
                      >
                        ↕ Flip
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCrop(null);
                          setAspect(null);
                        }}
                        disabled={!crop}
                      >
                        Uncrop
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="img-width">
                      Width · px
                    </label>
                    <div className="dk-seg">
                      {WIDTH_PRESETS.filter((w) => w <= effCrop.w).map((w) => (
                        <button
                          key={w}
                          type="button"
                          aria-pressed={effWidth === w}
                          onClick={() => setTargetWidth(w)}
                        >
                          {w}
                        </button>
                      ))}
                      <button
                        type="button"
                        aria-pressed={targetWidth === null}
                        onClick={() => setTargetWidth(null)}
                      >
                        As cropped ({Math.round(effCrop.w)})
                      </button>
                    </div>
                    <input
                      id="img-width"
                      type="number"
                      min={16}
                      max={Math.round(effCrop.w)}
                      value={effWidth}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 16) {
                          setTargetWidth(Math.min(n, Math.round(effCrop.w)));
                        }
                      }}
                      className={`${inputClass} dk-mono`}
                      style={{ marginTop: 8, maxWidth: 160 }}
                    />
                    <span className="dk-help">
                      Height follows. No upscaling past the crop.
                    </span>
                  </div>

                  <div>
                    <span className={labelClass}>Adjust</span>
                    <div className="dk-ranges">
                      <Range
                        label="Brightness"
                        value={adjust.brightness}
                        min={40}
                        max={160}
                        onChange={(v) => setAdjust((a) => ({ ...a, brightness: v }))}
                      />
                      <Range
                        label="Contrast"
                        value={adjust.contrast}
                        min={40}
                        max={160}
                        onChange={(v) => setAdjust((a) => ({ ...a, contrast: v }))}
                      />
                      <Range
                        label="Saturation"
                        value={adjust.saturate}
                        min={0}
                        max={200}
                        onChange={(v) => setAdjust((a) => ({ ...a, saturate: v }))}
                      />
                      <Range
                        label="Grayscale"
                        value={adjust.grayscale}
                        min={0}
                        max={100}
                        onChange={(v) => setAdjust((a) => ({ ...a, grayscale: v }))}
                      />
                      <Range
                        label="Blur"
                        value={adjust.blur}
                        min={0}
                        max={12}
                        unit="px"
                        onChange={(v) => setAdjust((a) => ({ ...a, blur: v }))}
                      />
                    </div>
                    <button
                      type="button"
                      className="dk-link"
                      onClick={() => setAdjust(DEFAULT_ADJUST)}
                      disabled={JSON.stringify(adjust) === JSON.stringify(DEFAULT_ADJUST)}
                    >
                      Reset adjustments
                    </button>
                  </div>

                  <div className="dk-grid-2">
                    <div>
                      <label className={labelClass} htmlFor="img-format">
                        Format
                      </label>
                      <select
                        id="img-format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value as Format)}
                        className={selectClass}
                      >
                        <option value="image/webp">WebP — smallest, keeps transparency</option>
                        <option value="image/jpeg">JPEG — photos, no transparency</option>
                        <option value="image/png">PNG — lossless, large</option>
                      </select>
                    </div>
                    <div>
                      <Range
                        label="Quality"
                        value={quality}
                        min={30}
                        max={100}
                        disabled={format === "image/png"}
                        onChange={setQuality}
                      />
                    </div>
                  </div>
                </div>
              )}

              <PlacementFields
                idPrefix="img"
                value={placement}
                onChange={setPlacement}
                name={name}
                onNameChange={setName}
              />

              <div className="dk-actions">
                <button
                  type="button"
                  className="sg-cta"
                  data-fill="true"
                  onClick={uploadAndInsert}
                  disabled={!output || uploading || rendering || !placement.alt.trim()}
                >
                  {uploading ? "Uploading…" : "Upload and insert at cursor"}
                </button>
                <button
                  type="button"
                  className="dk-link"
                  onClick={uploadOnly}
                  disabled={!output || uploading || rendering}
                >
                  Upload only
                </button>
                <button type="button" className="dk-link" onClick={clearSource} disabled={uploading}>
                  Discard
                </button>
                {!placement.alt.trim() && (
                  <span className="dk-help" style={{ margin: 0 }}>
                    Alt text first.
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === "library" && (
            <div className="dk-imgtool-work">
              {libraryError && (
                <p className="sg-error sg-mono" role="alert">
                  {libraryError}
                </p>
              )}
              {library === null && !libraryError && <p className="dk-help">Loading…</p>}
              {library && library.length === 0 && (
                <p className="dk-help">
                  Nothing uploaded yet
                  {libraryBackend === "local" ? " (local folder: public/uploads)" : ""}.
                </p>
              )}
              {library && library.length > 0 && (
                <div className="dk-thumbs">
                  {library.map((item) => {
                    const dims = dimsFromPathname(item.pathname);
                    return (
                      <button
                        key={item.url}
                        type="button"
                        className="dk-thumb"
                        aria-pressed={picked?.url === item.url}
                        onClick={() => {
                          setPicked(item);
                          setPickedPlacement(DEFAULT_PLACEMENT);
                          setConfirmDelete(null);
                        }}
                        title={item.pathname}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt="" loading="lazy" />
                        <span className="dk-thumb-meta">
                          {dims ? `${dims.width}×${dims.height} · ` : ""}
                          {fmtBytes(item.size)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {picked && (
                <div className="dk-sub">
                  <div className="dk-sub-head">
                    <span className="dk-label" style={{ margin: 0 }}>
                      Place
                    </span>
                    <span className="dk-help sg-mono" style={{ margin: 0 }}>
                      {picked.pathname}
                    </span>
                  </div>
                  <PlacementFields
                    idPrefix="lib"
                    value={pickedPlacement}
                    onChange={setPickedPlacement}
                  />
                  <div className="dk-actions">
                    <button
                      type="button"
                      className="sg-cta"
                      data-fill="true"
                      onClick={insertPicked}
                      disabled={!pickedPlacement.alt.trim()}
                    >
                      Insert at cursor
                    </button>
                    <button
                      type="button"
                      className="dk-link"
                      onClick={() => navigator.clipboard?.writeText(picked.url)}
                    >
                      Copy URL
                    </button>
                    {confirmDelete === picked.url ? (
                      <button
                        type="button"
                        className="dk-link"
                        data-tone="danger"
                        onClick={() => deletePicked(picked)}
                      >
                        Really delete — essays using it will break
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="dk-link"
                        data-tone="danger"
                        onClick={() => setConfirmDelete(picked.url)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ sub-parts */

function Range({
  label,
  value,
  min,
  max,
  unit = "%",
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="dk-range">
      <span className="dk-range-l">
        {label}
        <span className="sg-mono">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function PlacementFields({
  idPrefix,
  value,
  onChange,
  name,
  onNameChange,
}: {
  idPrefix: string;
  value: Placement;
  onChange: (p: Placement) => void;
  name?: string;
  onNameChange?: (n: string) => void;
}) {
  const sized = value.align === "left" || value.align === "right" || value.align === "center";
  return (
    <div className="dk-imgtool-place">
      <div className="dk-grid-2">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-alt`}>
            Alt text
          </label>
          <input
            id={`${idPrefix}-alt`}
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="What the image shows, for someone who cannot see it"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-caption`}>
            Caption
          </label>
          <input
            id={`${idPrefix}-caption`}
            value={value.caption}
            onChange={(e) => onChange({ ...value, caption: e.target.value })}
            placeholder="Optional, shown under the image"
            className={inputClass}
          />
        </div>
      </div>

      <div className="dk-grid-2">
        <div>
          <span className={labelClass}>Placement</span>
          <div className="dk-seg">
            {ALIGN_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={value.align === o.value}
                title={o.hint}
                onClick={() => onChange({ ...value, align: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
          <span className="dk-help">
            {ALIGN_OPTIONS.find((o) => o.value === value.align)?.hint}
          </span>
        </div>
        <div>
          {sized ? (
            <Range
              label="Width of column"
              value={value.size}
              min={20}
              max={100}
              onChange={(v) => onChange({ ...value, size: v })}
            />
          ) : onNameChange ? (
            <>
              <label className={labelClass} htmlFor={`${idPrefix}-name`}>
                File name
              </label>
              <input
                id={`${idPrefix}-name`}
                value={name ?? ""}
                onChange={(e) => onNameChange(slugify(e.target.value))}
                className={`${inputClass} dk-mono`}
              />
            </>
          ) : null}
        </div>
      </div>
      {sized && onNameChange && (
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-name`}>
            File name
          </label>
          <input
            id={`${idPrefix}-name`}
            value={name ?? ""}
            onChange={(e) => onNameChange(slugify(e.target.value))}
            className={`${inputClass} dk-mono`}
            style={{ maxWidth: 320 }}
          />
        </div>
      )}
    </div>
  );
}
