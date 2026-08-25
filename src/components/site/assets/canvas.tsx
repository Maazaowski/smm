"use client";

import { useEffect, useRef } from "react";

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  dpr: number;
}

/**
 * Shared harness for every generative plate.
 *
 * Handles the four things that separate a canvas that is nice to look at from
 * one that is a battery complaint:
 *
 *   1. Device-pixel sizing, so strokes are crisp on retina without guessing.
 *   2. ResizeObserver, so the plate is correct in any container.
 *   3. IntersectionObserver — the loop is *stopped*, not just invisible, when
 *      the plate is off screen. A page with six of these running at once would
 *      otherwise cost six animation loops for five things nobody is looking at.
 *   4. prefers-reduced-motion — draws a single static frame and stops.
 *
 * `draw` is a pure function of time. It never accumulates state outside the
 * canvas, so a paused-and-resumed plate looks correct rather than jumped.
 */
export function Plate({
  draw,
  className = "",
  fade = 0,
  ariaLabel,
}: {
  draw: (c: DrawCtx) => void;
  className?: string;
  /**
   * 0 clears every frame. >0 paints a translucent black over the previous
   * frame instead, leaving trails — the difference between particles and
   * brush strokes.
   */
  fade?: number;
  ariaLabel: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;

    /*
     * The clock is seeded in the past so the very first frame lands on a
     * composed moment rather than t=0, where every plate is at its emptiest —
     * Trace's packets on the start line, Stencil's sweep unmoved, HotPlate's
     * grid blank. That frame is what reduced-motion users get permanently and
     * what everyone sees for the instant before the loop starts, so it has to
     * be a still worth looking at.
     *
     * The origin is fixed for the element's lifetime. Every draw() here is a
     * pure function of t and everything cycles, so a plate that was paused
     * off screen resumes at the phase the clock says rather than rewinding —
     * and nobody was watching it while it was paused.
     */
    const start = performance.now() - 3200;

    const size = () => {
      const r = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
    };

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      if (fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fade})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
      }
      draw({ ctx, w, h, t, dpr });
      if (running) raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    size();
    // Static readers still get a composed frame rather than a black box.
    frame(performance.now());

    const ro = new ResizeObserver(() => {
      size();
      if (!running) frame(performance.now());
    });
    ro.observe(host);

    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? startLoop() : stopLoop()),
      { rootMargin: "120px" }
    );
    io.observe(host);

    const onVis = () =>
      document.visibilityState === "hidden" ? stopLoop() : startLoop();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopLoop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [draw, fade]);

  return (
    <div ref={hostRef} className={className} role="img" aria-label={ariaLabel}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ noise */

/**
 * Small deterministic value noise. Enough for flow fields and terrain, and
 * about 30 lines instead of a dependency.
 */
export function makeNoise(seed = 1) {
  const p = new Uint8Array(512);
  let s = seed * 16807;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = p[X] + Y;
    const b = p[X + 1] + Y;
    return lerp(
      lerp(grad(p[a], x, y), grad(p[b], x - 1, y), u),
      lerp(grad(p[a + 1], x, y - 1), grad(p[b + 1], x - 1, y - 1), u),
      v
    );
  };
}

/** Deterministic per-string seed, so a project always renders the same plate. */
export function seedFrom(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

export const INK = "#ffffff";
export const CYAN = "#3fd7e8";
export const DIMMED = "rgba(255,255,255,0.22)";
