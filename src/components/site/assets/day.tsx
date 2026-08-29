"use client";

import { useCallback } from "react";
import { Plate, type DrawCtx } from "./canvas";
import { drawDay } from "./day-scene";

/**
 * The hero plate: one 96-second day at my actual desk, drawn in code.
 *
 * Morning coffee, the workday, a call with the headphones on, the 6 PM
 * switch to the PS5, dusk turning the room over to the monitor and the
 * LEDs, one late-night fix, shutdown, and an empty room until dawn brings
 * the loop back around. The workstation is mine — one ultrawide, the
 * light bar, the magenta pad, the controller within reach — which is why
 * it is here instead of a stock illustration: nobody else can have it.
 *
 * Rendering goes through the same Plate harness as every other plate on
 * the site, so pausing off screen, reduced motion, and device-pixel
 * sizing are already handled. The scene lives in day-scene.ts as a pure
 * function of time.
 */
export function Workday() {
  const draw = useCallback(
    ({ ctx, w, h, t }: DrawCtx) => drawDay(ctx, w, h, t),
    []
  );

  return (
    <Plate
      draw={draw}
      ariaLabel="An animated day at Maaz's workstation: morning coffee, coding, a call, an evening PS5 session, one late-night fix, then shutdown"
      className="sg-cnv"
    />
  );
}
