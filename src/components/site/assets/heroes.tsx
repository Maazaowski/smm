"use client";

import { useCallback, useMemo, useRef } from "react";
import { Plate, makeNoise, CYAN, type DrawCtx } from "./canvas";

/*
 * Four candidates for the hero plate. All rendered in code — no stock, no
 * licence, no image payload, and nothing anyone else's site can have.
 */

/* ══════════════════════════════════════════════════════ A · TRACE ═══════ */

/**
 * Requests moving through gates: input screening, retrieval, tool
 * authorization, output filtering. Roughly one in five is blocked, and a
 * blocked one dies at the gate that caught it rather than carrying on. It is
 * the argument of "Your output filter is not a guardrail" as a moving picture.
 *
 * Six concurrent lanes rather than one, for two reasons. A single rail across
 * a 21:9 hero is a thin line in a large black box — it has no presence at that
 * scale. And a production agent serves many requests at once, so concurrency
 * is the honest picture: at any moment some pass, some are still in flight,
 * and some have just been stopped at different gates.
 */
export function Trace() {
  const draw = useCallback(({ ctx, w, h, t }: DrawCtx) => {
    const gates = [0.2, 0.44, 0.68, 0.87];
    const labels = ["INPUT", "RETRIEVAL", "TOOL AUTH", "OUTPUT"];
    const LANES = 6;

    const top = h * 0.3;
    const bottom = h * 0.84;
    const laneH = (bottom - top) / (LANES - 1);

    ctx.font = "500 9px ui-monospace, monospace";

    // --- lane rails -------------------------------------------------------
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 1;
    for (let l = 0; l < LANES; l++) {
      const y = top + l * laneH;
      ctx.beginPath();
      ctx.moveTo(w * 0.02, y);
      ctx.lineTo(w * 0.98, y);
      ctx.stroke();
    }

    // --- gates: full-height rules, so they read as barriers ---------------
    gates.forEach((g, i) => {
      const x = g * w;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 - i * 0.8);

      ctx.strokeStyle = `rgba(255,255,255,${0.14 + pulse * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top - laneH * 0.55);
      ctx.lineTo(x, bottom + laneH * 0.55);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(labels[i], x, top - laneH * 0.9);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillText(`0${i + 1}`, x, bottom + laneH * 1.15);
    });

    // --- packets ----------------------------------------------------------
    const PER_LANE = 2;
    let blockedNow = 0;

    for (let l = 0; l < LANES; l++) {
      const y = top + l * laneH;

      for (let k = 0; k < PER_LANE; k++) {
        // Lanes run at slightly different speeds so the field never pulses in
        // unison, which is what makes it read as traffic rather than a metronome.
        const speed = 0.13 + (l % 3) * 0.022;
        const raw = t * speed + k / PER_LANE + l * 0.31;
        const phase = raw % 1;
        const runId = Math.floor(raw);

        // Deterministic verdict per (lane, slot, run) so a packet always dies
        // at the same gate instead of flickering between frames.
        const seed =
          ((l * 374761393 + k * 668265263 + runId * 2246822519) >>> 0) /
          4294967295;
        const blocked = seed < 0.2;
        const dieAt = gates[Math.floor(seed * 9973) % gates.length];
        const stop = blocked ? dieAt : 1.04;

        const x = Math.min(phase, stop) * w;
        const dead = blocked && phase >= stop;

        if (dead) {
          const age = Math.min(1, (phase - stop) * 5);
          if (age < 1) blockedNow++;
          const a = 0.9 * (1 - age);
          ctx.strokeStyle = `rgba(240,101,95,${a})`;
          ctx.lineWidth = 1.3;
          const sz = 4.5;
          ctx.beginPath();
          ctx.moveTo(x - sz, y - sz);
          ctx.lineTo(x + sz, y + sz);
          ctx.moveTo(x + sz, y - sz);
          ctx.lineTo(x - sz, y + sz);
          ctx.stroke();
          continue;
        }

        const trail = Math.min(x, w * 0.075);
        const g = ctx.createLinearGradient(x - trail, 0, x, 0);
        g.addColorStop(0, "rgba(63,215,232,0)");
        g.addColorStop(1, "rgba(63,215,232,0.5)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - trail, y);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = CYAN;
        ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
      }
    }

    // --- a running count, because the ratio is the point ------------------
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillText("IN FLIGHT", w * 0.02, top - laneH * 0.9);
    ctx.textAlign = "right";
    ctx.fillStyle =
      blockedNow > 0 ? "rgba(240,101,95,0.75)" : "rgba(255,255,255,0.2)";
    ctx.fillText(
      `${blockedNow} BLOCKED`,
      w * 0.98,
      top - laneH * 0.9
    );
  }, []);

  return (
    <Plate
      draw={draw}
      ariaLabel="Concurrent requests moving through authorization gates, some blocked"
      className="sg-cnv"
    />
  );
}

/* ═══════════════════════════════════════════════════════ B · FIELD ═════ */

/**
 * A flow field: nine hundred short strokes following a slowly rotating noise
 * gradient, painted over a fading ground so they read as brush marks rather
 * than dots. Not about anything — the argument for it is that it is beautiful
 * and costs two kilobytes.
 */
export function Field() {
  const noise = useMemo(() => makeNoise(7), []);
  const particles = useRef<{ x: number; y: number; life: number }[]>([]);

  const draw = useCallback(
    ({ ctx, w, h, t }: DrawCtx) => {
      if (particles.current.length === 0) {
        particles.current = Array.from({ length: 900 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          life: Math.random() * 130,
        }));
      }

      ctx.lineWidth = 0.8;
      for (const p of particles.current) {
        if (p.life <= 0) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.life = 40 + Math.random() * 90;
        }

        const a =
          noise(p.x * 0.0016, p.y * 0.0016 + t * 0.03) * Math.PI * 2.4 + t * 0.06;
        const nx = p.x + Math.cos(a) * 1.5;
        const ny = p.y + Math.sin(a) * 1.5;

        const alpha = Math.min(0.5, p.life / 260);
        // A minority of strokes carry the accent, so it reads as a highlight
        // rather than a tint over everything.
        ctx.strokeStyle =
          p.life > 110
            ? `rgba(63,215,232,${alpha * 0.55})`
            : `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx;
        p.y = ny;
        p.life -= 1;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) p.life = 0;
      }
    },
    [noise]
  );

  return (
    <Plate
      draw={draw}
      fade={0.055}
      ariaLabel="A slowly evolving flow field"
      className="sg-cnv"
    />
  );
}

/* ════════════════════════════════════════════════════ C · LATTICE ══════ */

/**
 * A wireframe volume, rotated slowly and projected. Nodes light up and pass a
 * signal to their neighbours, so it reads as a distributed system rather than
 * a decorative 3D object. The most literal of the four; also the most legible
 * at a glance.
 */
export function Lattice() {
  const draw = useCallback(({ ctx, w, h, t }: DrawCtx) => {
    const cols = 9;
    const rows = 5;
    const deps = 3;
    const pts: { x: number; y: number; z: number; sx: number; sy: number; d: number }[] = [];

    const ry = t * 0.12;
    const rx = Math.sin(t * 0.07) * 0.22 + 0.42;
    const scale = Math.min(w / 11, h / 6.2);

    for (let z = 0; z < deps; z++) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = (x - (cols - 1) / 2) * 1.0;
          const py = (y - (rows - 1) / 2) * 1.0;
          const pz = (z - (deps - 1) / 2) * 1.6;

          const cx = px * Math.cos(ry) - pz * Math.sin(ry);
          const cz = px * Math.sin(ry) + pz * Math.cos(ry);
          const cy = py * Math.cos(rx) - cz * Math.sin(rx);
          const dz = py * Math.sin(rx) + cz * Math.cos(rx);

          const persp = 5.2 / (5.2 + dz);
          pts.push({
            x: px,
            y: py,
            z: pz,
            sx: w / 2 + cx * scale * persp,
            sy: h / 2 + cy * scale * persp,
            d: persp,
          });
        }
      }
    }

    // edges between grid neighbours only, so the structure stays readable
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i];
        const b = pts[j];
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        const dz = Math.abs(a.z - b.z);
        const adjacent =
          (dx === 1 && dy === 0 && dz === 0) ||
          (dx === 0 && dy === 1 && dz === 0) ||
          (dx === 0 && dy === 0 && Math.abs(dz - 1.6) < 0.01);
        if (!adjacent) continue;
        const dep = (a.d + b.d) / 2;
        ctx.strokeStyle = `rgba(255,255,255,${0.05 + (dep - 0.7) * 0.28})`;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }

    // a travelling activation
    pts.forEach((p, i) => {
      const fire = Math.sin(t * 1.6 - i * 0.13);
      const hot = fire > 0.92;
      const r = (hot ? 2.6 : 1.3) * p.d;
      ctx.fillStyle = hot ? CYAN : `rgba(255,255,255,${0.14 + (p.d - 0.7) * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  return <Plate draw={draw} ariaLabel="A rotating wireframe lattice passing signals between nodes" className="sg-cnv" />;
}

/* ═══════════════════════════════════════════════════════ D · RELIEF ════ */

/**
 * A monospace relief map: a noise surface sampled onto a character ramp and
 * drawn as text. It is the most "engineer" of the four and the cheapest to
 * run — no gradients, no blur, just glyphs — and at a distance it resolves
 * into landscape.
 */
export function Relief() {
  const noise = useMemo(() => makeNoise(23), []);
  const draw = useCallback(
    ({ ctx, w, h, t }: DrawCtx) => {
      const cell = 9;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / (cell * 1.5));
      const ramp = " ..:-=+*o%#@";

      ctx.font = "400 11px ui-monospace, monospace";
      ctx.textBaseline = "top";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const n =
            noise(x * 0.055, y * 0.09 - t * 0.09) * 0.7 +
            noise(x * 0.017 + t * 0.02, y * 0.028) * 0.5;
          const v = (n + 1) / 2;
          const idx = Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)));
          const ch = ramp[idx];
          if (ch === " ") continue;
          // The peaks — and only the peaks — carry the accent.
          ctx.fillStyle =
            idx >= ramp.length - 2
              ? `rgba(63,215,232,${0.5 + (idx / ramp.length) * 0.5})`
              : `rgba(255,255,255,${0.1 + (idx / ramp.length) * 0.62})`;
          ctx.fillText(ch, x * cell, y * cell * 1.5);
        }
      }
    },
    [noise]
  );

  return <Plate draw={draw} ariaLabel="A shifting relief map drawn in monospace characters" className="sg-cnv" />;
}
