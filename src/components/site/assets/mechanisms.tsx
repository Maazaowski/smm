"use client";

import { useCallback } from "react";
import { Plate, seedFrom, CYAN, type DrawCtx } from "./canvas";

/*
 * MECHANISM PLATES
 *
 * One per project, replacing the product screenshot on the index. The rule:
 * each plate animates the thing that made the project hard, so the image is an
 * argument rather than decoration — and the screenshots stay where they belong,
 * inside the case study, where someone has already decided they care.
 *
 * All are seeded from the project slug, so a given project always renders the
 * same composition.
 */

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/* ------------------------------------------------ KHATAFLOW - BALANCE --- */

/**
 * Double-entry, drawn literally: debits on the left, credits on the right, and
 * the two columns are always exactly equal no matter how the entries move. An
 * arc crosses the spine for the FX conversion. The invariant IS the product,
 * so the invariant is the picture.
 */
export function Balance() {
  const draw = useCallback(({ ctx, w, h, t }: DrawCtx) => {
    const r = rng(seedFrom("khataflow"));
    const n = 7;
    const mid = w / 2;
    const pad = h * 0.16;
    const rowH = (h - pad * 2) / n;
    const maxBar = w * 0.34;

    const vals = Array.from({ length: n }, (_, i) => {
      const base = 0.25 + r() * 0.75;
      return base * (0.82 + 0.18 * Math.sin(t * 0.6 + i * 1.3));
    });

    ctx.font = "500 8px ui-monospace, monospace";

    vals.forEach((v, i) => {
      const y = pad + rowH * i + rowH / 2;
      const len = v * maxBar;
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.fillRect(mid - 10 - len, y - rowH * 0.2, len, rowH * 0.4);
      ctx.fillStyle = "rgba(63,215,232,0.48)";
      ctx.fillRect(mid + 10, y - rowH * 0.2, len, rowH * 0.4);
    });

    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mid, pad * 0.45);
    ctx.lineTo(mid, h - pad * 0.45);
    ctx.stroke();

    const p = (t * 0.22) % 1;
    const ax = mid - maxBar * 0.72;
    const bx = mid + maxBar * 0.72;
    const ay = pad + rowH * 1.5;
    const by = pad + rowH * 5.5;
    const cy = (ay + by) / 2 - h * 0.2;

    ctx.strokeStyle = "rgba(63,215,232,0.45)";
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mid, cy, bx, by);
    ctx.stroke();

    const qx = (1 - p) * (1 - p) * ax + 2 * (1 - p) * p * mid + p * p * bx;
    const qy = (1 - p) * (1 - p) * ay + 2 * (1 - p) * p * cy + p * p * by;
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.arc(qx, qy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.34)";
    ctx.textAlign = "right";
    ctx.fillText("DR", mid - 14, pad * 0.45 + 2);
    ctx.textAlign = "left";
    ctx.fillText("CR", mid + 14, pad * 0.45 + 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(63,215,232,0.62)";
    ctx.fillText("DIFFERENCE  0.00", mid, h - pad * 0.1);
  }, []);

  return (
    <Plate
      draw={draw}
      ariaLabel="A double-entry ledger where both columns always balance"
      className="sg-cnv"
    />
  );
}

/* -------------------------------------------------- STENCIL - EXTRACT --- */

/**
 * A page of unstructured text collapsing into structured rows. The left half is
 * noise shaped like a document; the right is the schema it resolves to. The
 * sweep is the interpreter, and it runs once per layout, which is the entire
 * cost model of the product.
 */
export function Extract() {
  const draw = useCallback(({ ctx, w, h, t }: DrawCtx) => {
    const r = rng(seedFrom("stencil"));
    const pad = h * 0.16;
    const colW = w * 0.36;
    const left = w * 0.08;
    const right = w - left - colW;
    const lines = 14;
    const lh = (h - pad * 2) / lines;
    const sweep = (t * 0.3) % 1.35;

    for (let i = 0; i < lines; i++) {
      const y = pad + i * lh;
      const segs = 1 + Math.floor(r() * 3);
      let x = left;
      for (let s = 0; s < segs; s++) {
        const len = (0.15 + r() * 0.5) * colW;
        const resolved = i / lines < sweep;
        ctx.fillStyle = resolved
          ? "rgba(255,255,255,0.13)"
          : "rgba(255,255,255,0.42)";
        ctx.fillRect(x, y, Math.min(len, left + colW - x), lh * 0.34);
        x += len + colW * 0.04;
        if (x > left + colW) break;
      }
    }

    for (let i = 0; i < lines; i++) {
      const y = pad + i * lh;
      if (i / lines >= sweep) continue;
      const cells = 3;
      const cw = colW / cells;
      for (let c = 0; c < cells; c++) {
        ctx.strokeStyle = "rgba(63,215,232,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(right + c * cw, y, cw - 3, lh * 0.34);
        ctx.fillStyle = "rgba(63,215,232,0.17)";
        ctx.fillRect(right + c * cw, y, (cw - 3) * (0.4 + r() * 0.6), lh * 0.34);
      }
    }

    if (sweep <= 1) {
      const sy = pad + sweep * (h - pad * 2);
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, sy);
      ctx.lineTo(w - left, sy);
      ctx.stroke();
      ctx.fillStyle = CYAN;
      ctx.fillRect(left - 3, sy - 3, 6, 6);
    }

    ctx.font = "500 8px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.fillText("PDF, ANY LAYOUT", left, pad - 9);
    ctx.fillStyle = "rgba(63,215,232,0.55)";
    ctx.fillText("SCHEMA, REPLAYABLE", right, pad - 9);
  }, []);

  return (
    <Plate
      draw={draw}
      ariaLabel="Unstructured document text resolving into a schema"
      className="sg-cnv"
    />
  );
}

/* ----------------------------------------------------- SIGNAL - MATCH --- */

/**
 * A field of candidates scored against a role. Signal's actual claim is that
 * location fit is scored separately from role fit, so the field is
 * two-dimensional and the cut is a curve rather than a threshold.
 */
export function Match() {
  const draw = useCallback(({ ctx, w, h, t }: DrawCtx) => {
    const r = rng(seedFrom("signal"));
    const padX = w * 0.11;
    const padY = h * 0.15;
    const iw = w - padX * 2;
    const ih = h - padY * 2;
    const N = 140;

    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padX, padY, iw, ih);

    ctx.strokeStyle = "rgba(63,215,232,0.42)";
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = i / 40;
      const y = 0.62 - 0.34 * x * x;
      const px = padX + x * iw;
      const py = padY + (1 - y) * ih;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const sweep = (t * 0.24) % 1.3;

    for (let i = 0; i < N; i++) {
      const cx = r();
      const cy = r();
      const above = cy > 0.62 - 0.34 * cx * cx;
      const scanned = cx < sweep;
      const px = padX + cx * iw;
      const py = padY + (1 - cy) * ih;

      if (!scanned) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (above) {
        ctx.fillStyle = CYAN;
        ctx.beginPath();
        ctx.arc(px, py, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(63,215,232,0.26)";
        ctx.beginPath();
        ctx.arc(px, py, 6 + Math.sin(t * 2 + i) * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.26)";
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (sweep <= 1) {
      const sx = padX + sweep * iw;
      ctx.strokeStyle = "rgba(63,215,232,0.5)";
      ctx.beginPath();
      ctx.moveTo(sx, padY);
      ctx.lineTo(sx, padY + ih);
      ctx.stroke();
    }

    ctx.font = "500 8px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.fillText("ROLE FIT", padX, h - padY * 0.42);
    ctx.save();
    ctx.translate(padX - 10, padY + ih);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("LOCATION FIT", 0, 0);
    ctx.restore();
    ctx.fillStyle = "rgba(63,215,232,0.6)";
    ctx.textAlign = "right";
    ctx.fillText("SURFACED", w - padX, padY - 9);
  }, []);

  return (
    <Plate
      draw={draw}
      ariaLabel="Candidates scored on two axes against a curved cut-off"
      className="sg-cnv"
    />
  );
}

/* ------------------------------------------------------ HOTPLATE - PLAN - */

/**
 * A week solving. Slots fill in dependency order across seven days and four
 * services; a few are locked by an earlier constraint and refuse. The solver is
 * the hard part, not the CRUD.
 */
export function Planner() {
  const draw = useCallback(({ ctx, w, h, t }: DrawCtx) => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const meals = ["BREAKFAST", "LUNCH", "DINNER", "PREP"];
    const padL = Math.max(56, w * 0.14);
    const padT = h * 0.18;
    const padB = h * 0.08;
    const padR = w * 0.05;
    const cw = (w - padL - padR) / days.length;
    const ch = (h - padT - padB) / meals.length;
    const phase = (t * 0.26) % 1.5;

    ctx.font = "500 8px ui-monospace, monospace";

    ctx.textAlign = "center";
    days.forEach((d, i) => {
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.fillText(d, padL + i * cw + cw / 2, padT - 11);
    });

    ctx.textAlign = "right";
    meals.forEach((m, i) => {
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillText(m, padL - 11, padT + i * ch + ch / 2 + 3);
    });

    const r = rng(seedFrom("hotplate"));

    for (let y = 0; y < meals.length; y++) {
      for (let x = 0; x < days.length; x++) {
        const order = r();
        const locked = r() < 0.11;
        const px = padL + x * cw + 2;
        const py = padT + y * ch + 2;
        const iw = cw - 5;
        const ih = ch - 5;

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, iw, ih);
        if (order >= phase) continue;

        if (locked) {
          ctx.strokeStyle = "rgba(240,101,95,0.55)";
          ctx.strokeRect(px, py, iw, ih);
          ctx.beginPath();
          ctx.moveTo(px + 3, py + 3);
          ctx.lineTo(px + iw - 3, py + ih - 3);
          ctx.moveTo(px + iw - 3, py + 3);
          ctx.lineTo(px + 3, py + ih - 3);
          ctx.stroke();
          continue;
        }

        // Portions stacked inside the slot, so a filled cell reads as content
        // rather than as a coloured rectangle.
        const portions = 2 + Math.floor(r() * 3);
        const gap = 2;
        const bh = (ih - gap * (portions - 1)) / portions;
        for (let k = 0; k < portions; k++) {
          const bw = iw * (0.45 + r() * 0.55);
          ctx.fillStyle =
            k === 0 ? "rgba(63,215,232,0.45)" : "rgba(255,255,255,0.22)";
          ctx.fillRect(px, py + k * (bh + gap), bw, bh);
        }
      }
    }

    if (phase <= 1) {
      const sx = padL + phase * (w - padL - padR);
      ctx.strokeStyle = "rgba(63,215,232,0.45)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, padT - 5);
      ctx.lineTo(sx, h - padB);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, []);

  return (
    <Plate
      draw={draw}
      ariaLabel="A weekly meal plan solving, with locked slots refusing"
      className="sg-cnv"
    />
  );
}

/* -------------------------------------------------------- RAQAM - TRIAGE */

/**
 * Bank alerts arriving as a dense stream, hitting the parser, and fanning into
 * categories — except the ones the parser is not confident about, which are
 * diverted to a review queue rather than guessed. The lanes accumulate volume,
 * so the plate builds a picture of the split rather than just showing motion.
 */
export function Triage() {
  const draw = useCallback(({ ctx, w, h, t }: DrawCtx) => {
    const cats = ["FOOD", "TRANSPORT", "BILLS", "TRANSFER"];
    const split = w * 0.4;
    const top = h * 0.16;
    const laneArea = h * 0.52;
    const laneH = laneArea / cats.length;
    const qy = h * 0.85;
    const railEnd = w * 0.9;

    ctx.font = "500 8px ui-monospace, monospace";
    ctx.textAlign = "left";

    // incoming stream
    for (let i = 0; i < 46; i++) {
      const ph = (t * 0.34 + i * 0.137) % 1;
      const seed = ((i * 2654435761) >>> 0) / 4294967295;
      const y0 = top - h * 0.06 + seed * (laneArea + h * 0.12);
      const x = ph * split;
      const y = y0 + Math.sin(seed * 20 + t * 0.4) * h * 0.02;
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, ph * 3) * 0.45})`;
      ctx.fillRect(x - 6, y, 6, 1.4);
    }

    // the parser
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(split, top - h * 0.05, 18, laneArea + h * 0.1);
    const sc = top - h * 0.05 + ((t * 0.5) % 1) * (laneArea + h * 0.1);
    ctx.strokeStyle = "rgba(63,215,232,0.5)";
    ctx.beginPath();
    ctx.moveTo(split, sc);
    ctx.lineTo(split + 18, sc);
    ctx.stroke();

    ctx.save();
    ctx.translate(split + 9, top + laneArea / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("PARSER", 0, 3);
    ctx.restore();
    ctx.textAlign = "left";

    // outbound, counted per lane
    const counts = [0, 0, 0, 0];
    let review = 0;
    const OUT = 40;
    const flying: { x: number; y: number; unsure: boolean; a: number }[] = [];

    for (let i = 0; i < OUT; i++) {
      const ph = (t * 0.26 + i * 0.1573) % 1;
      const rid = Math.floor(t * 0.26 + i * 0.1573);
      const sd = ((i * 2246822519 + rid * 668265263) >>> 0) / 4294967295;
      const unsure = sd < 0.22;
      const lane = Math.floor(sd * 991) % cats.length;
      const targetY = unsure ? qy : top + lane * laneH + laneH / 2;

      if (unsure) review++;
      else counts[lane]++;

      const x = split + 18 + ph * (railEnd - split - 18);
      const startY = top + laneArea / 2;
      const k = Math.min(1, ph * 2.4);
      const ease = 1 - Math.pow(1 - k, 3);
      flying.push({
        x,
        y: startY + (targetY - startY) * ease,
        unsure,
        a: ph > 0.9 ? (1 - ph) * 10 : 1,
      });
    }

    cats.forEach((c, i) => {
      const y = top + i * laneH + laneH / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(split + 18, y);
      ctx.lineTo(railEnd, y);
      ctx.stroke();

      const vol = counts[i] / OUT;
      ctx.fillStyle = "rgba(63,215,232,0.4)";
      ctx.fillRect(railEnd + 6, y - 5 - vol * 26, 4, 10 + vol * 26);

      ctx.fillStyle = "rgba(255,255,255,0.34)";
      ctx.fillText(c, split + 24, y - 7);
    });

    ctx.strokeStyle = "rgba(232,176,79,0.42)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(split + 18, qy);
    ctx.lineTo(railEnd, qy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(232,176,79,0.72)";
    ctx.fillText("REVIEW QUEUE, NOT GUESSED", split + 24, qy - 7);
    ctx.fillStyle = "rgba(232,176,79,0.42)";
    ctx.fillRect(railEnd + 6, qy - 5 - (review / OUT) * 26, 4, 10 + (review / OUT) * 26);

    for (const f of flying) {
      const col = f.unsure ? "232,176,79" : "63,215,232";
      ctx.fillStyle = `rgba(${col},${0.9 * f.a})`;
      ctx.fillRect(f.x - 4, f.y - 1.5, 8, 3);
    }

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("SMS ALERTS", w * 0.03, top - h * 0.08);
  }, []);

  return (
    <Plate
      draw={draw}
      ariaLabel="Bank alerts parsed into categories, uncertain ones diverted to review"
      className="sg-cnv"
    />
  );
}

export const MECHANISMS: Record<string, () => React.JSX.Element> = {
  khataflow: Balance,
  stencil: Extract,
  signal: Match,
  hotplate: Planner,
  raqam: Triage,
};
