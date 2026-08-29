/*
 * A Day at the Desk — the hero scene.
 *
 * One 96-second loop, drawn entirely in code as a pure function of time:
 * dawn → walk in with coffee → morning coding → review → a call → afternoon
 * deep work → golden-hour wind-down → controller pickup → gaming through dusk
 * into night → one late session → shutdown → lights off → an empty room while
 * the moon crosses the floor → dawn again.
 *
 * Composed in a fixed 1520×650 scene space and drawn to cover the container:
 * a 21:9 plate sees the whole room; a 4:3 mobile plate scales to height and
 * crops toward the character and the monitor. No external assets, no text,
 * no dependencies — the same contract as every other plate on the site.
 */

type V2 = [number, number];
type RGB = [number, number, number];

const SW = 1520;
const SH = 650;
const LOOP = 96;
/* The harness seeds its clock ~3.2s in; this offset lands that first (and
 * reduced-motion permanent) frame on the well-lit morning-coding beat. */
const OFFSET = 8.8;

/* ------------------------------------------------------------------ math */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sm = (t: number) => t * t * (3 - 2 * t); // smoothstep 0..1
const eo = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic
const TAU = Math.PI * 2;

const mixc = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const rgb = (c: RGB, a = 1) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/** Deterministic hash → 0..1, for stable per-index variation. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const dist = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* -------------------------------------------------------------- lighting */

interface Light {
  amb: number; // ambient room level 0..1
  sun: number; // directional daylight strength (from the window, camera-right)
  warm: number; // colour temperature of the daylight
  night: number; // 0 day .. 1 night; drives every practical light
  skyTop: RGB;
  skyBot: RGB;
}

/* [T, amb, sun, warm, night, skyTop, skyBot] */
const LIGHT_STOPS: [number, number, number, number, number, RGB, RGB][] = [
  [0, 0.16, 0.05, 0.3, 0.8, [24, 32, 48], [56, 44, 58]],
  [3, 0.3, 0.2, 0.6, 0.55, [40, 52, 84], [122, 82, 72]],
  [7, 0.58, 0.5, 0.55, 0.2, [92, 128, 168], [190, 158, 120]],
  [14, 0.78, 0.65, 0.4, 0.05, [128, 164, 200], [210, 196, 160]],
  [22, 0.88, 0.75, 0.25, 0, [148, 186, 224], [224, 216, 190]],
  [30, 0.84, 0.7, 0.3, 0, [140, 176, 214], [218, 206, 176]],
  [36, 0.74, 0.6, 0.5, 0.08, [120, 140, 180], [228, 178, 120]],
  [39.5, 0.6, 0.55, 0.8, 0.2, [96, 100, 150], [240, 150, 90]],
  [44, 0.4, 0.3, 0.7, 0.45, [60, 64, 110], [170, 100, 110]],
  [50, 0.24, 0.1, 0.4, 0.75, [34, 40, 74], [80, 64, 92]],
  [56, 0.17, 0, 0.3, 0.92, [22, 28, 52], [44, 42, 66]],
  [78, 0.15, 0, 0.3, 1, [18, 24, 44], [36, 36, 58]],
  [83, 0.13, 0, 0.3, 1, [16, 22, 40], [30, 32, 52]],
  [90, 0.12, 0, 0.3, 1, [15, 20, 38], [28, 30, 50]],
  [93, 0.13, 0.02, 0.3, 0.9, [18, 26, 44], [40, 36, 54]],
  [96, 0.16, 0.05, 0.3, 0.8, [24, 32, 48], [56, 44, 58]],
];

function lighting(T: number): Light {
  let i = 0;
  while (i < LIGHT_STOPS.length - 2 && LIGHT_STOPS[i + 1][0] <= T) i++;
  const a = LIGHT_STOPS[i];
  const b = LIGHT_STOPS[i + 1];
  const t = sm(clamp((T - a[0]) / (b[0] - a[0]), 0, 1));
  return {
    amb: lerp(a[1], b[1], t),
    sun: lerp(a[2], b[2], t),
    warm: lerp(a[3], b[3], t),
    night: lerp(a[4], b[4], t),
    skyTop: mixc(a[5], b[5], t),
    skyBot: mixc(a[6], b[6], t),
  };
}

/** Base colour under current room light, with a warm bias in golden hours. */
function lit(c: RGB, L: Light, f = 1): string {
  const a = 0.16 + 0.92 * clamp(L.amb * f, 0, 1.05);
  const w = L.warm * L.sun * 0.3;
  return rgb([
    clamp(c[0] * a * (1 + w * 0.55), 0, 255),
    clamp(c[1] * a * (1 + w * 0.18), 0, 255),
    clamp(c[2] * a * (1 - w * 0.28), 0, 255),
  ]);
}

/* --------------------------------------------------------------- palette */

const SKIN: RGB = [196, 150, 110];
const SKIN_DIM: RGB = [150, 112, 82];
const HAIR: RGB = [26, 24, 24];
const BEARD: RGB = [34, 30, 27];
const SHIRT: RGB = [64, 70, 80];
const PANTS: RGB = [33, 36, 41];
const SHOE: RGB = [58, 62, 68];

const DESK_TOP: RGB = [40, 43, 48];
const DESK_FACE: RGB = [24, 26, 29];
const BRICK: RGB = [82, 86, 96];
const MORTAR: RGB = [52, 56, 64];
const WALL_PLAIN: RGB = [168, 162, 152];
const FLOOR: RGB = [106, 100, 94];
const CURTAIN: RGB = [58, 142, 132];
const CHAIR_FRAME: RGB = [222, 225, 230];
const CHAIR_DARK: RGB = [28, 30, 33];
const KEY_WHITE: RGB = [212, 215, 220];
const MUG_C: RGB = [214, 209, 200];

const MAGENTA: RGB = [255, 62, 160];
const LEDBLUE: RGB = [64, 120, 255];
const CYAN_C: RGB = [63, 215, 232];

/* -------------------------------------------------------------- geometry */

const DESK_Y = 404; // desk top front edge
const DESK_BACK = 377; // desk top back edge (top-face cheat, ~quarter view)
const SHELF_Y = 344;
const SHELF_BACK = 326;
const FLOOR_Y = 520; // wall/floor meeting line
const BOTTOM = SH;

/* screen parallelogram, cheated a few degrees toward camera. Kept affine
 * (rb − rt === lb − lt) so content maps onto it exactly. */
const SCR = { lx: 108, rx: 524, lt: 158, lb: 302, rt: 142, rb: 286 };

/* hand targets (scene space). Everything on the desk sits inside true arm's
 * reach of the seated shoulder (~108 units); the far reaches — headphone
 * stand, controller — are covered by rolling the chair, not stretching. */
const KEY_R: V2 = [690, 386];
const KEY_L: V2 = [644, 388];
const MOUSE: V2 = [766, 384];
const MUG_SPOT: V2 = [812, 392]; // mug base centre on the desk
/* the hand grips the mug on its NEAR side (between shoulder and mug), so the
 * arm never crosses over the cup; held, the mug sits at hand + MUG_OFF */
const MUG_OFF: V2 = [10, 20];
const MUG_GRIP: V2 = [MUG_SPOT[0] - MUG_OFF[0], MUG_SPOT[1] - MUG_OFF[1]];
const MOUTH: V2 = [666, 272];
const CHIN: V2 = [696, 288];
const LAP_R: V2 = [724, 432];
const LAP_L: V2 = [706, 434];
const CTRL_REST: V2 = [566, 390];
/* held forward of the belly, below the desk line so it never reads as
 * resting on the desk edge, with clear air between controller and torso */
const CTRL_HOLD: V2 = [688, 412];
const CTRL_HOLD_R: V2 = [CTRL_HOLD[0] + 20, CTRL_HOLD[1] - 2];
const CTRL_HOLD_L: V2 = [CTRL_HOLD[0] - 16, CTRL_HOLD[1] - 3];
const PHONES_STAND: V2 = [916, 352];
const HEAD_SIDE: V2 = [712, 250];
const DESK_REST: V2 = [746, 396];
const UP_R: V2 = [742, 208];
const UP_L: V2 = [700, 202];
const FACE: V2 = [700, 268];
const SWITCH: V2 = [1036, 308];

/* --------------------------------------------------------- choreography */

interface Hand {
  x: number;
  y: number;
  mode: string; // rest | type | mouse | mug | sip | ctrl | phones | chin | stretch | rub | place | carry
}

interface Pose {
  present: boolean;
  facing: number; // 1 faces the desk (left), -1 faces right (walking out)
  seated: number; // 0 standing .. 1 seated
  bx: number; // hip x
  by: number; // hip y
  roll: number; // chair roll offset (chair + body move together)
  lean: number; // torso lean, + forward toward the desk
  slump: number; // late-night shoulders
  headPitch: number;
  nod: number;
  rHand: Hand;
  lHand: Hand;
  typing: number; // 0..1 finger activity
  mugHeld: boolean;
  mugX: number;
  mugY: number;
  mugTilt: number;
  steam: number;
  ctrlHeld: number; // 0 on desk .. 1 in hands
  ctrlX: number;
  ctrlY: number;
  phones: number; // 0 on stand .. 1 on head
  phonesX: number;
  phonesY: number;
  walk: number; // walk-cycle phase
  stretch: number;
}

/** Right/left hand routes: [moveStart, moveEnd, target, mode]. The hand rests
 * at each target until the next move begins, so nothing ever teleports. */
const ROUTE_R: [number, number, V2, string][] = [
  [4.6, 5.3, MUG_GRIP, "place"],
  [5.3, 5.9, LAP_R, "rest"],
  [6.8, 7.4, MOUSE, "mouse"],
  [7.8, 8.3, MUG_GRIP, "mug"],
  [8.3, 9.0, MOUTH, "sip"],
  [9.0, 9.6, MUG_GRIP, "mug"],
  [9.6, 10.2, KEY_R, "type"],
  [15.0, 15.5, MOUSE, "mouse"],
  [19.0, 19.5, MUG_GRIP, "mug"],
  [19.5, 20.1, MOUTH, "sip"],
  [20.1, 20.7, MUG_GRIP, "mug"],
  [20.9, 21.7, PHONES_STAND, "phones"],
  [21.7, 22.6, HEAD_SIDE, "phones"],
  [22.6, 23.2, DESK_REST, "rest"],
  [26.3, 26.9, HEAD_SIDE, "phones"],
  [26.9, 27.7, PHONES_STAND, "phones"],
  [27.7, 28.3, KEY_R, "type"],
  [30.2, 30.7, MOUSE, "mouse"],
  [31.4, 31.9, KEY_R, "type"],
  [33.5, 34.1, CHIN, "chin"],
  [35.2, 35.7, KEY_R, "type"],
  [38.0, 38.5, LAP_R, "rest"],
  [38.6, 39.3, UP_R, "stretch"],
  [39.5, 40.2, LAP_R, "rest"],
  [40.3, 41.0, CTRL_REST, "ctrl"],
  [41.3, 42.2, CTRL_HOLD_R, "ctrl"],
  [58.0, 58.8, CTRL_REST, "ctrl"],
  [58.9, 59.5, FACE, "rub"],
  [60.1, 60.5, MOUSE, "mouse"],
  [60.9, 61.3, KEY_R, "type"],
  [65.5, 66.0, CHIN, "chin"],
  [66.9, 67.4, KEY_R, "type"],
  [68.8, 69.3, MUG_GRIP, "mug"],
  [69.3, 70.0, MOUTH, "sip"],
  [70.0, 70.6, MUG_GRIP, "mug"],
  [70.6, 71.1, KEY_R, "type"],
  [74.6, 75.1, [712, 384], "type"],
  [75.3, 75.9, LAP_R, "rest"],
  [76.8, 77.2, MOUSE, "mouse"],
  [78.4, 79.0, MUG_GRIP, "mug"],
];

const ROUTE_L: [number, number, V2, string][] = [
  [5.3, 6.2, LAP_L, "rest"],
  [9.8, 10.4, KEY_L, "type"],
  [20.9, 21.6, LAP_L, "rest"],
  [27.6, 28.2, KEY_L, "type"],
  [38.0, 38.5, LAP_L, "rest"],
  [38.6, 39.3, UP_L, "stretch"],
  [39.5, 40.2, LAP_L, "rest"],
  [41.8, 42.4, CTRL_HOLD_L, "ctrl"],
  [58.0, 58.6, LAP_L, "rest"],
  [60.9, 61.4, KEY_L, "type"],
  [74.9, 75.6, LAP_L, "rest"],
];

function routeAt(route: [number, number, V2, string][], T: number, start: V2, startMode: string): Hand {
  let px = start[0];
  let py = start[1];
  let mode = startMode;
  for (const [a, b, tgt, m] of route) {
    if (T < a) break;
    if (T < b) {
      const p = sm((T - a) / (b - a));
      const cap = m === "sip" || m === "mug" ? 7 : 11;
      const arc = Math.sin(p * Math.PI) * Math.min(cap, dist([px, py], tgt) * 0.14);
      return { x: lerp(px, tgt[0], p), y: lerp(py, tgt[1], p) - arc, mode: m };
    }
    px = tgt[0];
    py = tgt[1];
    mode = m;
  }
  return { x: px, y: py, mode };
}

/** Piecewise typing intensity — bursts and pauses rather than a metronome. */
function typingIntensity(T: number): number {
  const spans: [number, number, number][] = [
    [10.2, 11.5, 1], [12.2, 13.6, 1], [14.1, 15.0, 0.9],
    [28.1, 30.2, 1], [31.9, 33.5, 0.95],
    [35.7, 37.8, 1],
    [61.3, 63.5, 0.55], [64.3, 65.5, 0.6], [67.4, 68.8, 0.55],
    [71.1, 74.4, 0.7],
  ];
  for (const [a, b, v] of spans) {
    if (T >= a && T < b) {
      const edge = Math.min(1, (T - a) / 0.4, (b - T) / 0.4);
      return v * edge;
    }
  }
  return 0;
}

function choreograph(T: number): Pose {
  const p: Pose = {
    present: true,
    facing: 1,
    seated: 1,
    bx: 742,
    by: 448,
    roll: 0,
    lean: 0.12,
    slump: 0,
    headPitch: 0,
    nod: 0,
    rHand: { x: LAP_R[0], y: LAP_R[1], mode: "rest" },
    lHand: { x: LAP_L[0], y: LAP_L[1], mode: "rest" },
    typing: typingIntensity(T),
    mugHeld: false,
    mugX: MUG_SPOT[0],
    mugY: MUG_SPOT[1],
    mugTilt: 0,
    steam: 0,
    ctrlHeld: 0,
    ctrlX: CTRL_REST[0],
    ctrlY: CTRL_REST[1],
    phones: 0,
    phonesX: PHONES_STAND[0],
    phonesY: PHONES_STAND[1],
    walk: 0,
    stretch: 0,
  };

  /* presence: gone from walk-out end until walk-in start (wrapping) */
  if (T >= 83.6 || T < 2.0) {
    p.present = false;
    return p;
  }

  const seg = (a: number, b: number) =>
    T >= a && T < b ? (T - a) / (b - a) : T >= b ? 1 : 0;

  /* --- standing / walking phases ------------------------------------- */
  if (T < 6.8) {
    const walkIn = seg(2.0, 4.6);
    const sit = seg(5.6, 6.8);
    p.seated = sm(sit);
    p.walk = walkIn < 1 ? T * 2.1 : 0;
    const standX = lerp(1260, 812, sm(walkIn));
    p.bx = lerp(standX, 742, sm(sit));
    p.by = lerp(430, 448, sm(sit));
    p.mugHeld = T < 5.28;
    p.rHand = routeAt(ROUTE_R, T, [p.bx - 34, p.by + 12], "carry");
    if (p.mugHeld && p.rHand.mode === "carry") {
      p.rHand.x = p.bx - 36;
      p.rHand.y = p.by + 14;
    }
    if (p.mugHeld) {
      p.mugX = p.rHand.x + MUG_OFF[0];
      p.mugY = p.rHand.y + MUG_OFF[1];
    }
    p.lHand =
      T < 4.6
        ? { x: p.bx + 10 + Math.sin(p.walk) * 12, y: p.by + 40, mode: "swing" }
        : routeAt(ROUTE_L, T, [p.bx + 8, p.by + 36], "rest");
    p.lean = lerp(0, 0.12, sm(sit));
    p.steam = T > 5.0 ? 1 : 0.8;
    return p;
  }

  if (T >= 79.0) {
    /* stand, walk out with the mug, hit the wall switch on the way */
    const rise = seg(79.0, 80.2);
    const out = seg(80.4, 83.4);
    p.seated = 1 - sm(rise);
    const outX = lerp(812, 1270, sm(out));
    p.bx = lerp(742, outX, sm(rise) < 1 ? sm(rise) : 1);
    if (out > 0) p.bx = outX;
    p.by = lerp(448, 430, sm(rise));
    p.walk = out > 0 && out < 1 ? T * 2.1 : 0;
    /* once he starts moving toward the door he turns to face it; the whole
     * figure is mirrored at draw time, so poses stay body-relative here */
    if (out > 0.02) p.facing = -1;
    p.mugHeld = true;
    p.mugTilt = 0;
    p.rHand = { x: p.bx - 34, y: p.by + 12, mode: "carry" };
    p.mugX = p.rHand.x + MUG_OFF[0];
    p.mugY = p.rHand.y + MUG_OFF[1];
    /* the near hand flicks the LED wall switch as he passes it. The switch is
     * a world position, so pre-mirror it when the figure is flipped. */
    const flick = seg(81.4, 82.3);
    if (flick > 0 && flick < 1) {
      const a = Math.sin(flick * Math.PI);
      const swx = p.facing === -1 ? 2 * p.bx - SWITCH[0] : SWITCH[0];
      p.lHand = {
        x: lerp(p.bx + 10, swx, a),
        y: lerp(p.by + 40, SWITCH[1], a),
        mode: "reach",
      };
    } else {
      p.lHand = { x: p.bx + 10 + Math.sin(p.walk) * 12, y: p.by + 40, mode: "swing" };
    }
    p.slump = 0.5;
    return p;
  }

  /* --- seated day ----------------------------------------------------- */
  p.rHand = routeAt(ROUTE_R, T, LAP_R, "rest");
  p.lHand = routeAt(ROUTE_L, T, LAP_L, "rest");

  /* chair rolls for the far reaches, body and chair together */
  const rollTo = (a: number, b: number, c: number, d: number, amt: number) => {
    if (T >= a && T < b) p.roll = amt * sm((T - a) / (b - a));
    else if (T >= b && T < c) p.roll = amt;
    else if (T >= c && T < d) p.roll = amt * (1 - sm((T - c) / (d - c)));
  };
  rollTo(20.9, 21.7, 21.7, 22.6, 96);
  rollTo(26.3, 26.9, 26.9, 27.7, 96);
  rollTo(40.3, 41.0, 41.1, 42.2, -76);
  rollTo(58.0, 58.7, 58.8, 59.5, -76);
  p.bx += p.roll;

  /* lean profile across the day */
  const leanSpans: [number, number, number][] = [
    [15.5, 19.0, 0.3], [16.8, 18.6, 0.5],
    [22.6, 26.3, -0.28],
    [33.5, 35.2, -0.12],
    [38.6, 40.0, -0.5],
    [42.4, 52.4, -0.15],
    [52.5, 55.0, 0.45],
    [55.0, 58.0, -0.1],
    [71.4, 74.6, 0.42],
    [75.3, 76.8, -0.3],
  ];
  for (const [a, b, v] of leanSpans) {
    if (T >= a && T < b) {
      const edge = sm(Math.min(1, (T - a) / 0.8, (b - T) / 0.8));
      p.lean = lerp(0.12, v, edge);
    }
  }

  /* late-night slump */
  p.slump = T > 60 ? clamp((T - 60) / 16, 0, 1) * 0.6 : 0;

  /* stretch */
  if (T >= 38.6 && T < 40.2) p.stretch = Math.sin(clamp((T - 38.6) / 1.6, 0, 1) * Math.PI);

  /* keep every reach physical: if a hand target sits past the arm's true
   * length from the shoulder, pull the wrist onto the reachable circle so
   * the forearm never stretches. The chair rolls cover the big reaches;
   * this only absorbs the last few units. */
  {
    const shx = p.bx - 20 - p.lean * 26 + 4;
    const shy = p.by - 150 + p.slump * 6 + 8;
    const MAXR = 107;
    for (const h of [p.rHand, p.lHand]) {
      if (h.mode === "stretch") continue;
      const dx = h.x - shx;
      const dy = h.y - shy;
      const d = Math.hypot(dx, dy);
      if (d > MAXR) {
        h.x = shx + (dx / d) * MAXR;
        h.y = shy + (dy / d) * MAXR;
      }
    }
  }

  /* mug: follows the hand between the moment it arrives at the grip and the
   * moment it sets the mug back down, so pick-up and release are seamless */
  const mugCarried =
    (T >= 8.3 && T < 9.58) || (T >= 19.5 && T < 20.68) || (T >= 69.3 && T < 70.58);
  if (mugCarried) {
    p.mugHeld = true;
    p.mugX = p.rHand.x + MUG_OFF[0];
    p.mugY = p.rHand.y + MUG_OFF[1];
    const sip =
      (T >= 8.5 && T < 9.0 ? Math.sin(((T - 8.5) / 0.5) * Math.PI) : 0) +
      (T >= 19.65 && T < 20.1 ? Math.sin(((T - 19.65) / 0.45) * Math.PI) : 0) +
      (T >= 69.45 && T < 70.0 ? Math.sin(((T - 69.45) / 0.55) * Math.PI) : 0);
    p.mugTilt = sip * 0.5;
    if (p.rHand.mode === "sip") p.headPitch = -0.1 * sip;
  }
  p.steam = clamp(1 - (T - 6) / 18, 0, 1);

  /* controller */
  const grab = seg(41.3, 42.2);
  const put = seg(58.0, 58.8);
  p.ctrlHeld = T >= 41.3 && T < 58.8 ? (T < 58.0 ? sm(grab) : 1 - sm(put)) : 0;
  if (T >= 41.3 && T < 58.4) {
    p.ctrlX = lerp(CTRL_REST[0], CTRL_HOLD[0] + p.roll, p.ctrlHeld);
    p.ctrlY = lerp(CTRL_REST[1], CTRL_HOLD[1], p.ctrlHeld) - Math.sin(p.ctrlHeld * Math.PI) * 12;
  } else if (T >= 58.4 && T < 58.8) {
    p.ctrlX = lerp(CTRL_HOLD[0] + p.roll, CTRL_REST[0], sm(put));
    p.ctrlY = CTRL_HOLD[1] - Math.sin((1 - sm(put)) * Math.PI) * 8;
    p.ctrlY = lerp(p.ctrlY, CTRL_REST[1], sm(put));
  }
  /* the hand rides the mouse, and the mouse rides the hand: small drifts
   * while pointing, so the mouse visibly moves during review */
  if (p.rHand.mode === "mouse" && Math.abs(p.rHand.x - MOUSE[0]) < 8) {
    const scrolling =
      (T >= 15.7 && T < 18.4) || (T >= 30.7 && T < 31.4) || (T >= 60.3 && T < 60.6);
    if (scrolling) p.rHand.x += Math.sin(T * 2.7) * 3 + Math.sin(T * 4.3) * 1.4;
  }

  /* while playing, the hands stay planted on the grips — the action lives
   * in the controller's gentle rock and the thumbs, not in pumping arms */
  if (T >= 42.4 && T < 58.0) {
    p.ctrlY += Math.sin(T * 2.2) * 1.0;
    p.rHand = { x: p.ctrlX + 20, y: p.ctrlY + 1, mode: "ctrl" };
    p.lHand = { x: p.ctrlX - 16, y: p.ctrlY, mode: "ctrl" };
  }

  /* headphones */
  const up = seg(21.7, 22.6);
  const down = seg(26.3, 27.7);
  if (T >= 21.7 && T < 26.3) p.phones = sm(up);
  else if (T >= 26.3 && T < 27.7) p.phones = 1 - sm(down);
  if (T >= 20.9 && T < 27.7) {
    if (p.phones > 0 && p.phones < 1) {
      p.phonesX = p.rHand.x;
      p.phonesY = p.rHand.y + 4;
    } else if (p.phones >= 1) {
      p.phonesX = 700;
      p.phonesY = 250;
    }
  }

  /* head + nods */
  if (p.rHand.mode === "chin") p.headPitch += 0.08;
  if (p.rHand.mode === "rub") p.headPitch += 0.16;
  const nodAt = (t0: number) =>
    T >= t0 && T < t0 + 0.7 ? Math.sin(((T - t0) / 0.7) * TAU) * 0.6 : 0;
  p.nod = nodAt(23.8) + nodAt(25.2) + nodAt(75.05) * 0.6;
  if (T >= 38.6 && T < 39.8) p.headPitch -= 0.14 * p.stretch;
  if (T > 61) p.headPitch += 0.05 * p.slump;

  return p;
}

/* ------------------------------------------------------------ screen ---- */

type ScreenMode =
  | { k: "off" }
  | { k: "boot"; p: number }
  | { k: "ide"; night: boolean; scroll: number; deploy: number }
  | { k: "call" }
  | { k: "pswake"; p: number }
  | { k: "game"; mixAB: number; dim: number }
  | { k: "shutdown"; p: number };

function screenMode(T: number): ScreenMode {
  if (T < 7.2 || T >= 78.6) return { k: "off" };
  if (T < 8.8) return { k: "boot", p: (T - 7.2) / 1.6 };
  if (T >= 22.8 && T < 26.5) return { k: "call" };
  if (T >= 41.8 && T < 43.0) return { k: "pswake", p: (T - 41.8) / 1.2 };
  if (T >= 43.0 && T < 58.6) {
    const mixAB = sm(clamp((T - 50) / 1.5, 0, 1));
    const dim = clamp((T - 58.0) / 0.6, 0, 1);
    return { k: "game", mixAB, dim };
  }
  if (T >= 77.2 && T < 78.6) return { k: "shutdown", p: (T - 77.2) / 1.4 };
  /* ide otherwise */
  let scroll = 0;
  if (T >= 15.5 && T < 18.4) scroll = eo(clamp((T - 15.5) / 2.9, 0, 1)) * 120;
  else if (T >= 18.4) scroll = 120;
  if (T >= 30.6 && T < 31.4) scroll = 120 + eo((T - 30.6) / 0.8) * 60;
  else if (T >= 31.4) scroll = 180;
  const night = T >= 58.6;
  const deploy = T >= 74.4 ? clamp((T - 74.4) / 2.4, 0, 1) : 0;
  return { k: "ide", night, scroll: night ? 40 : scroll, deploy };
}

/** How much light the screen throws into the room, and its tint. */
function screenLight(mode: ScreenMode, T: number): { tint: RGB; level: number } {
  switch (mode.k) {
    case "off":
      return { tint: [0, 0, 0], level: 0 };
    case "boot":
      return { tint: [140, 170, 200], level: 0.4 * Math.sin(mode.p * Math.PI) + 0.2 };
    case "call":
      return { tint: [120, 140, 165], level: 0.55 };
    case "pswake":
      return { tint: [70, 110, 235], level: 0.5 + 0.3 * Math.sin(mode.p * 9) };
    case "game": {
      const a: RGB = [70, 165, 120];
      const b: RGB = [120, 160, 230];
      const flick = 0.8 + 0.2 * Math.sin(T * 3.1) * Math.sin(T * 5.7);
      return { tint: mixc(a, b, mode.mixAB), level: (1 - mode.dim) * 0.85 * flick };
    }
    case "shutdown":
      return { tint: [110, 125, 150], level: 0.35 * (1 - mode.p) };
    case "ide":
      return { tint: mode.night ? [90, 130, 160] : [120, 150, 170], level: mode.night ? 0.6 : 0.45 };
  }
}

/** Draw the screen's content in a local 416×164 space (clipped by caller). */
function drawScreenContent(c: CanvasRenderingContext2D, mode: ScreenMode, T: number) {
  const W = 416;
  const H = 164;

  const codeLine = (y: number, i: number, grow: number) => {
    const ind = (hash(i * 3.7) * 3) | 0;
    let x = 10 + ind * 12;
    const segs = 2 + ((hash(i * 7.1) * 3) | 0);
    for (let s = 0; s < segs; s++) {
      const wSeg = 14 + hash(i * 13.3 + s * 5.1) * 46;
      const wDraw = Math.max(0, Math.min(wSeg, grow * (W - 80) - (x - 10)));
      if (wDraw <= 0) break;
      const r = hash(i * 17.9 + s * 3.3);
      c.fillStyle =
        r < 0.18 ? "rgba(63,215,232,0.75)" :
        r < 0.32 ? "rgba(240,160,90,0.7)" :
        r < 0.55 ? "rgba(220,228,235,0.75)" : "rgba(140,150,160,0.6)";
      c.fillRect(x, y, wDraw, 4);
      x += wSeg + 8;
    }
  };

  if (mode.k === "off") return;

  if (mode.k === "boot") {
    const a = Math.sin(mode.p * Math.PI);
    c.fillStyle = `rgba(220,230,240,${0.5 * a})`;
    c.beginPath();
    c.arc(W / 2, H / 2, 7 + a * 3, 0, TAU);
    c.fill();
    c.strokeStyle = `rgba(160,190,220,${0.3 * a})`;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(W / 2, H / 2, 14 + mode.p * 10, 0, TAU);
    c.stroke();
    return;
  }

  if (mode.k === "pswake") {
    c.fillStyle = "rgba(8,10,22,1)";
    c.fillRect(0, 0, W, H);
    const a = Math.sin(clamp(mode.p * 1.4, 0, 1) * Math.PI);
    const g = c.createLinearGradient(0, H / 2 - 14, 0, H / 2 + 14);
    g.addColorStop(0, "rgba(60,100,255,0)");
    g.addColorStop(0.5, `rgba(90,140,255,${0.5 * a})`);
    g.addColorStop(1, "rgba(60,100,255,0)");
    c.fillStyle = g;
    c.fillRect(0, H / 2 - 14, W, 28);
    c.fillStyle = `rgba(220,228,255,${0.8 * a})`;
    c.beginPath();
    c.arc(W / 2, H / 2, 4, 0, TAU);
    c.fill();
    return;
  }

  if (mode.k === "call") {
    c.fillStyle = "#0c1015";
    c.fillRect(0, 0, W, H);
    const gw = (W - 26) / 2;
    const gh = (H - 34) / 2;
    const speaking = Math.floor(T / 2.4) % 4;
    for (let i = 0; i < 4; i++) {
      const gx = 8 + (i % 2) * (gw + 10);
      const gy = 8 + ((i / 2) | 0) * (gh + 10);
      const hue = hash(i * 9.7);
      c.fillStyle = `rgba(${30 + hue * 30},${40 + hue * 25},${55 + hue * 30},1)`;
      c.fillRect(gx, gy, gw, gh);
      /* abstract head-and-shoulders */
      const cx = gx + gw / 2;
      const cy = gy + gh / 2;
      c.fillStyle = `rgba(${140 + hue * 60},${140 + hue * 40},${150 + hue * 30},0.5)`;
      c.beginPath();
      c.arc(cx, cy - 6, 9, 0, TAU);
      c.fill();
      c.beginPath();
      c.ellipse(cx, cy + 14, 15, 9, 0, Math.PI, 0);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.14)";
      c.fillRect(gx + 4, gy + gh - 8, 26, 4);
      if (i === speaking) {
        c.strokeStyle = "rgba(63,215,232,0.8)";
        c.lineWidth = 1.6;
        c.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
      }
    }
    /* control bar + live dot + tiny self tile */
    c.fillStyle = "rgba(255,255,255,0.10)";
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(W / 2 - 20 + i * 20, H - 9, 5, 0, TAU);
      c.fill();
    }
    c.fillStyle = "rgba(240,101,95,0.9)";
    c.beginPath();
    c.arc(W / 2 + 40, H - 9, 5, 0, TAU);
    c.fill();
    c.fillStyle = "rgba(60,70,85,1)";
    c.fillRect(W - 52, H - 34, 44, 26);
    c.fillStyle = "rgba(196,150,110,0.6)";
    c.beginPath();
    c.arc(W - 30, H - 23, 6, 0, TAU);
    c.fill();
    return;
  }

  if (mode.k === "game") {
    const m = mode.mixAB;
    /* scene A — overgrown ruin, drifting spores, green shafts */
    if (m < 1) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(14,32,24,1)");
      g.addColorStop(1, "rgba(30,56,38,1)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      const drift = (T * 5) % (W + 120);
      /* canopy hanging from above, and soft undergrowth mounds below —
       * organic silhouettes, so it reads forest ruin rather than skyline */
      c.fillStyle = "rgba(8,18,12,0.95)";
      c.beginPath();
      c.moveTo(0, 0);
      for (let x = 0; x <= W; x += 16) {
        c.lineTo(x, 14 + Math.sin(x * 0.05 + 1) * 8 + hash(x * 0.13) * 22);
      }
      c.lineTo(W, 0);
      c.closePath();
      c.fill();
      for (let i = 0; i < 5; i++) {
        const vx = ((i * 97 - drift * (0.3 + (i % 2) * 0.2)) % (W + 60) + W + 60) % (W + 60) - 30;
        const vl = 34 + hash(i * 5.7) * 46;
        c.strokeStyle = "rgba(8,20,12,0.85)";
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(vx, 18);
        c.quadraticCurveTo(vx + 7, 18 + vl * 0.5, vx - 3 + Math.sin(T * 0.9 + i) * 3, 18 + vl);
        c.stroke();
      }
      c.fillStyle = "rgba(8,18,12,0.95)";
      c.beginPath();
      c.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) {
        c.lineTo(x, H - 18 - Math.sin(x * 0.03 + 3) * 10 - hash(x * 0.29) * 16);
      }
      c.lineTo(W, H);
      c.closePath();
      c.fill();
      /* one broken column, the ruin part */
      c.fillStyle = "rgba(12,26,18,0.9)";
      c.fillRect(60, 48, 22, H - 70);
      c.fillRect(54, 44, 34, 10);
      c.fillRect(300, 78, 18, H - 96);
      const sh = c.createLinearGradient(W * 0.6, 0, W * 0.3, H);
      sh.addColorStop(0, "rgba(150,220,150,0.20)");
      sh.addColorStop(1, "rgba(150,220,150,0)");
      c.fillStyle = sh;
      c.beginPath();
      c.moveTo(W * 0.52, 0);
      c.lineTo(W * 0.74, 0);
      c.lineTo(W * 0.5, H);
      c.lineTo(W * 0.2, H);
      c.fill();
      for (let i = 0; i < 16; i++) {
        const sx = (hash(i * 7.7) * W + T * (4 + hash(i) * 7)) % W;
        const sy = (hash(i * 3.3) * H + Math.sin(T * 0.8 + i) * 6) % H;
        c.fillStyle = `rgba(190,240,180,${0.25 + hash(i * 1.7) * 0.3})`;
        c.fillRect(sx, sy, 1.6, 1.6);
      }
    }
    /* scene B — snowfield, aurora, embers */
    if (m > 0) {
      c.globalAlpha = m;
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(10,16,36,1)");
      g.addColorStop(1, "rgba(40,58,86,1)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      for (let band = 0; band < 3; band++) {
        c.beginPath();
        c.moveTo(0, 30 + band * 10);
        for (let x = 0; x <= W; x += 12) {
          c.lineTo(x, 26 + band * 9 + Math.sin(x * 0.02 + T * 0.7 + band * 2) * 9);
        }
        c.strokeStyle = `rgba(${80 + band * 20},${220 - band * 30},${170 + band * 20},${0.12 - band * 0.03})`;
        c.lineWidth = 10 - band * 2;
        c.stroke();
      }
      c.fillStyle = "rgba(16,24,40,1)";
      c.beginPath();
      c.moveTo(0, H);
      c.lineTo(0, 96);
      c.lineTo(70, 66);
      c.lineTo(150, 100);
      c.lineTo(230, 58);
      c.lineTo(320, 102);
      c.lineTo(416, 76);
      c.lineTo(W, H);
      c.fill();
      c.fillStyle = "rgba(170,190,215,0.5)";
      c.beginPath();
      c.moveTo(50, 75);
      c.lineTo(70, 66);
      c.lineTo(92, 76);
      c.lineTo(70, 80);
      c.fill();
      const fg = c.createRadialGradient(W - 60, H - 10, 4, W - 60, H - 10, 70);
      fg.addColorStop(0, "rgba(255,150,60,0.5)");
      fg.addColorStop(1, "rgba(255,150,60,0)");
      c.fillStyle = fg;
      c.fillRect(W - 140, H - 90, 140, 90);
      for (let i = 0; i < 14; i++) {
        const ph = (T * (10 + hash(i) * 14) + hash(i * 3.3) * 90) % 90;
        const ex = W - 60 + Math.sin(ph * 0.12 + i) * (8 + ph * 0.3);
        const ey = H - 8 - ph;
        c.fillStyle = `rgba(255,${140 + hash(i * 7) * 60},60,${clamp(1 - ph / 80, 0, 1) * 0.7})`;
        c.fillRect(ex, ey, 1.8, 1.8);
      }
      c.globalAlpha = 1;
    }
    /* minimal HUD so it reads as play, not a wallpaper */
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.fillRect(10, H - 12, 60, 3);
    c.fillStyle = "rgba(120,230,140,0.6)";
    c.fillRect(10, H - 12, 60 * (0.55 + 0.2 * Math.sin(T * 0.6)), 3);
    c.strokeStyle = "rgba(255,255,255,0.22)";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(W / 2, 12, 7, 0, TAU);
    c.stroke();
    if (mode.dim > 0) {
      c.fillStyle = `rgba(0,0,0,${mode.dim})`;
      c.fillRect(0, 0, W, H);
    }
    return;
  }

  if (mode.k === "shutdown") {
    c.fillStyle = "#0d1218";
    c.fillRect(0, 0, W, H);
    const a = 1 - clamp((mode.p - 0.6) / 0.4, 0, 1);
    c.globalAlpha = a;
    c.fillStyle = "rgba(30,38,48,1)";
    c.fillRect(W / 2 - 60, H / 2 - 26, 120, 52);
    c.fillStyle = "rgba(200,210,220,0.5)";
    c.fillRect(W / 2 - 46, H / 2 - 14, 92, 5);
    c.fillStyle = "rgba(63,215,232,0.7)";
    c.fillRect(W / 2 - 46, H / 2 + 6, 34, 12);
    c.fillStyle = "rgba(255,255,255,0.15)";
    c.fillRect(W / 2 + 12, H / 2 + 6, 34, 12);
    c.globalAlpha = 1;
    if (mode.p > 0.6) {
      c.fillStyle = `rgba(0,0,0,${(mode.p - 0.6) / 0.4})`;
      c.fillRect(0, 0, W, H);
    }
    return;
  }

  /* ide */
  const night = mode.night;
  c.fillStyle = night ? "#0b0f14" : "#10161d";
  c.fillRect(0, 0, W, H);
  /* activity bar + sidebar */
  c.fillStyle = night ? "#080b0f" : "#0b1016";
  c.fillRect(0, 0, 26, H);
  c.fillStyle = "rgba(255,255,255,0.12)";
  for (let i = 0; i < 4; i++) c.fillRect(8, 12 + i * 20, 10, 10);
  c.fillStyle = night ? "#0d1218" : "#121a22";
  c.fillRect(26, 0, 58, H);
  c.fillStyle = "rgba(255,255,255,0.10)";
  for (let i = 0; i < 8; i++) c.fillRect(34, 16 + i * 14, 30 + hash(i * 2.9) * 12, 3);
  /* tab strip */
  c.fillStyle = night ? "#0e141a" : "#151d26";
  c.fillRect(84, 0, W - 84, 12);
  c.fillStyle = "rgba(63,215,232,0.5)";
  c.fillRect(90, 10, 40, 2);
  /* code area — lines appear as the day's typing accumulates */
  c.save();
  c.beginPath();
  c.rect(84, 12, W - 84 - 22, H - 30);
  c.clip();
  c.translate(90, 20 - (mode.scroll % 14));
  const baseLine = (mode.scroll / 14) | 0;
  for (let r = 0; r < 12; r++) {
    const i = baseLine + r;
    /* lines "type in" while typing is active; older lines complete */
    const grow = clamp(typingSoFar(T) - i * 0.55, 0.15, 1);
    codeLine(r * 14, i, grow);
  }
  c.restore();
  /* caret */
  if (Math.sin(T * 6) > 0) {
    c.fillStyle = "rgba(220,230,240,0.8)";
    c.fillRect(96 + (typingSoFar(T) * 90) % 200, 20 + 9 * 14 - (mode.scroll % 14), 1.6, 9);
  }
  /* minimap */
  c.fillStyle = night ? "#0d1218" : "#131b24";
  c.fillRect(W - 22, 12, 22, H - 30);
  c.fillStyle = "rgba(255,255,255,0.10)";
  for (let i = 0; i < 18; i++) c.fillRect(W - 18, 16 + i * 7, 6 + hash(i * 4.1) * 8, 2);
  /* terminal strip */
  c.fillStyle = night ? "#080c10" : "#0c1218";
  c.fillRect(84, H - 18, W - 84, 18);
  c.fillStyle = "rgba(120,220,140,0.55)";
  c.fillRect(90, H - 12, 3, 3);
  c.fillStyle = "rgba(180,190,200,0.4)";
  c.fillRect(97, H - 12, 40 + 20 * Math.sin(T * 0.4), 3);
  if (mode.deploy > 0) {
    c.fillStyle = "rgba(255,255,255,0.16)";
    c.fillRect(150, H - 12, 120, 4);
    c.fillStyle = mode.deploy >= 1 ? "rgba(120,230,140,0.9)" : "rgba(63,215,232,0.8)";
    c.fillRect(150, H - 12, 120 * mode.deploy, 4);
  }
}

/** Monotonic "amount typed today" — drives how much code exists on screen. */
function typingSoFar(T: number): number {
  const spans: [number, number][] = [
    [10.2, 15.0], [19.0, 20.5], [28.1, 33.5], [35.7, 37.8], [61.3, 74.6],
  ];
  let total = 0.4; // yesterday's code is already on screen
  for (const [a, b] of spans) total += clamp((Math.min(T, b) - a) / (b - a), 0, 1) * ((b - a) / 6);
  return total;
}

/* ------------------------------------------------------------ drawing --- */

function capsule(c: CanvasRenderingContext2D, a: V2, b: V2, w: number, fill: string) {
  c.strokeStyle = fill;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.stroke();
}

/** Hand orientation per activity: flat on the desk for keys and mouse,
 * upright around the mug, and only sloped with the forearm otherwise. */
function handAng(mode: string, E: V2, W2: V2): number {
  if (mode === "type" || mode === "mouse" || mode === "rest" || mode === "place") return 0.05;
  if (mode === "sip" || mode === "mug" || mode === "carry") return -0.12;
  return clamp(Math.atan2(W2[1] - E[1], W2[0] - E[0]) * 0.3, -0.6, 0.6);
}

/** 2-bone IK: shoulder → elbow → wrist, elbow biased down-and-back. */
function solveArm(S: V2, W2: V2, upper: number, fore: number, bias = 1): V2 {
  const dx = W2[0] - S[0];
  const dy = W2[1] - S[1];
  let d = Math.hypot(dx, dy);
  const maxd = upper + fore - 2;
  if (d > maxd) d = maxd;
  const a = (upper * upper - fore * fore + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));
  const ux = dx / (d || 1);
  const uy = dy / (d || 1);
  return [S[0] + ux * a - uy * h * bias, S[1] + uy * a + ux * h * bias];
}

/* fingers point away from the body (left) at the keyboard, the mouse, the
 * chin; they point toward the cup or the grips when wrapping something on
 * the right. Getting this direction wrong reads instantly as a broken wrist. */
const HAND_FLIP = new Set(["type", "mouse", "rest", "place", "chin", "rub"]);

function drawHand(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  mode: string,
  t: number,
  skin: string
) {
  const dir = HAND_FLIP.has(mode) ? -1 : 1;
  c.save();
  c.translate(x, y);
  c.rotate(ang * dir);
  c.scale(dir, 1);
  c.fillStyle = skin;
  c.strokeStyle = skin;
  c.lineCap = "round";
  /* palm */
  c.beginPath();
  c.ellipse(3, 0, 6.5, 5, 0, 0, TAU);
  c.fill();
  /* fingers */
  const typing = mode === "type";
  const curl = mode === "ctrl" || mode === "mug" || mode === "carry" ? 0.9 : typing ? 0.55 : 0.25;
  for (let i = 0; i < 4; i++) {
    const fx = 7 + i * 0.4;
    const fy = -3.6 + i * 2.4;
    const tap = typing ? Math.max(0, Math.sin(t * 13 + i * 1.9)) * 2.2 : 0;
    c.lineWidth = 2.1;
    c.beginPath();
    c.moveTo(fx, fy);
    c.quadraticCurveTo(fx + 5, fy + curl * 3, fx + 8 - curl * 3, fy + curl * 6 + tap);
    c.stroke();
  }
  /* thumb */
  c.lineWidth = 2.3;
  c.beginPath();
  c.moveTo(0, 4);
  c.quadraticCurveTo(5, 7, 8, 5);
  c.stroke();
  c.restore();
}

function drawMug(c: CanvasRenderingContext2D, x: number, y: number, tilt: number, L: Light) {
  c.save();
  c.translate(x, y);
  c.rotate(-tilt);
  c.fillStyle = lit(MUG_C, L);
  c.beginPath();
  c.moveTo(-11, -26);
  c.lineTo(-9, 0);
  c.lineTo(9, 0);
  c.lineTo(11, -26);
  c.closePath();
  c.fill();
  /* handle on the near side, where the hand comes from */
  c.strokeStyle = lit(MUG_C, L);
  c.lineWidth = 3;
  c.beginPath();
  c.arc(-12, -14, 6, Math.PI / 2, (Math.PI * 3) / 2);
  c.stroke();
  /* coffee — the open top shows more now the camera sits a touch higher */
  c.fillStyle = "rgba(40,26,16,0.9)";
  c.beginPath();
  c.ellipse(0, -25, 10, 3.2, 0, 0, TAU);
  c.fill();
  c.restore();
}

function drawController(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  held: number,
  L: Light,
  on: boolean,
  tilt = 0
) {
  c.save();
  c.translate(x, y);
  c.rotate(held * -0.22 + tilt);
  const body = lit([215, 218, 224], L);
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(-13, 3, 8, 10, -0.35, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(13, 3, 8, 10, 0.35, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(0, 0, 17, 8, 0, 0, TAU);
  c.fill();
  c.fillStyle = lit([24, 26, 30], L);
  c.beginPath();
  c.ellipse(0, -1, 10, 4, 0, 0, TAU);
  c.fill();
  if (on) {
    c.strokeStyle = "rgba(90,140,255,0.85)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(0, 2, 5.5, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
  }
  c.restore();
}

function drawPhones(c: CanvasRenderingContext2D, x: number, y: number, onHead: number, L: Light) {
  /* band + two cups; drawn hanging (compact) or over the head (open) */
  const spread = lerp(10, 15, onHead);
  c.save();
  c.translate(x, y);
  c.strokeStyle = lit([30, 32, 36], L);
  c.lineWidth = 3.4;
  c.beginPath();
  c.arc(0, 0, spread, Math.PI * 1.05, Math.PI * 1.95);
  c.stroke();
  c.fillStyle = lit([22, 24, 27], L);
  c.beginPath();
  c.ellipse(-spread, 4, 5, 7.5, 0.15, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(spread, 4, 5, 7.5, -0.15, 0, TAU);
  c.fill();
  c.restore();
}

/* ------------------------------------------------------- the character --- */

function drawCharacter(c: CanvasRenderingContext2D, P: Pose, L: Light, T: number, scrGlow: number, scrTint: RGB) {
  /* the screen is a light source: it lifts the whole figure, no halo needed */
  const gb = 1 + scrGlow * 0.55;
  const skin = lit(SKIN, L, 1.15 * gb);
  const skinFar = lit(SKIN_DIM, L, 0.95 * gb);
  const shirt = lit(SHIRT, L, 1.1 * gb);
  const shirtFar = lit(mixc(SHIRT, [0, 0, 0], 0.35), L, gb);
  const pants = lit(PANTS, L, 1.05 * gb);
  const hair = lit(HAIR, L, 1.6 * gb);
  const beard = lit(BEARD, L, 1.5 * gb);

  const seated = P.seated;
  const bx = P.bx;
  const by = P.by;
  const breathe = Math.sin(T * 1.15) * 1.4;

  /* shoulder position from hips + lean + slump */
  const lean = P.lean;
  const sy = by - lerp(150, 128, 1 - seated) + P.slump * 6 + (1 - seated) * -18;
  const sx = bx - 20 - lean * 26 + (1 - seated) * 6;
  const S: V2 = [sx + 4, sy + 8 + breathe * 0.4]; // near (right) shoulder
  const S2: V2 = [sx - 6, sy + 3 + breathe * 0.4]; // far (left) shoulder, tucked behind

  /* head */
  const hx = sx - 10 - lean * 8;
  const hy = sy - 34 + P.slump * 3;
  const pitch = P.headPitch + P.nod * 0.12 + Math.sin(T * 0.9) * 0.012;

  /* ----- far arm (drawn first, behind everything) */
  {
    const W2: V2 = [P.lHand.x, P.lHand.y];
    const E = solveArm(S2, W2, 58, 54, P.lHand.mode === "stretch" ? 0.6 : -0.9);
    capsule(c, S2, E, 15, shirtFar);
    capsule(c, E, W2, 11, skinFar);
    drawHand(c, W2[0], W2[1], handAng(P.lHand.mode, E, W2), P.lHand.mode, T, skinFar);
  }

  /* ----- legs */
  if (seated > 0.5) {
    const knee: V2 = [bx - 96, by + 2];
    const foot: V2 = [bx - 104, 596];
    const knee2: V2 = [knee[0] + 26, knee[1] + 5];
    const foot2: V2 = [foot[0] + 28, 599];
    capsule(c, [bx + 2, by + 6], knee2, 21, lit(mixc(PANTS, [0, 0, 0], 0.3), L));
    capsule(c, knee2, [foot2[0], foot2[1] - 6], 14, lit(mixc(PANTS, [0, 0, 0], 0.3), L));
    c.fillStyle = lit(mixc(SHOE, [0, 0, 0], 0.3), L);
    c.beginPath();
    c.ellipse(foot2[0] - 8, foot2[1], 13, 5.5, 0, 0, TAU);
    c.fill();
    capsule(c, [bx, by + 4], knee, 22, pants);
    capsule(c, knee, [foot[0], foot[1] - 6], 15, pants);
    c.fillStyle = lit(SHOE, L);
    c.beginPath();
    c.ellipse(foot[0] - 9, foot[1], 14, 6, 0, 0, TAU);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.fillRect(foot[0] - 22, foot[1] + 2, 26, 1.4);
  } else {
    /* standing / walking legs */
    const ph = P.walk;
    for (const [off, col, shoeCol] of [
      [Math.PI, lit(mixc(PANTS, [0, 0, 0], 0.3), L), lit(mixc(SHOE, [0, 0, 0], 0.3), L)],
      [0, pants, lit(SHOE, L)],
    ] as [number, string, string][]) {
      const swing = P.walk === 0 ? 0 : Math.sin(ph + off) * 0.42;
      const kx = bx + Math.sin(swing) * 34;
      const ky = by + 88;
      const bend = P.walk === 0 ? 0 : Math.max(0, Math.sin(ph + off + 1.2)) * 16;
      const fx = kx + Math.sin(swing) * 26 - bend * 0.4;
      const fy = 598 - bend * 0.5;
      capsule(c, [bx, by + 8], [kx, ky], 20, col);
      capsule(c, [kx, ky], [fx, fy - 5], 14, col);
      c.fillStyle = shoeCol;
      c.beginPath();
      c.ellipse(fx - 8, fy, 13, 5.5, 0, 0, TAU);
      c.fill();
    }
  }

  /* ----- hips (trousers) then torso (t-shirt), so the clothing reads */
  c.fillStyle = pants;
  c.beginPath();
  c.roundRect(bx - 24, by - 14, 50, 28, 10);
  c.fill();
  /* far shoulder peeks past the chest now the torso is quarter-turned */
  c.fillStyle = shirtFar;
  c.beginPath();
  c.ellipse(sx - 16, sy + 2, 10, 9, -0.3, 0, TAU);
  c.fill();
  c.fillStyle = shirt;
  c.beginPath();
  c.moveTo(bx + 20, by - 4);
  c.quadraticCurveTo(sx + 26, sy + 44, sx + 20, sy - 2 + breathe * 0.5);
  c.quadraticCurveTo(sx + 10, sy - 14 + breathe, sx - 6, sy - 10 + breathe);
  c.quadraticCurveTo(sx - 22, sy + 6, sx - 17, sy + 48);
  c.quadraticCurveTo(bx - 22, by - 22, bx - 20, by - 2);
  c.closePath();
  c.fill();
  /* chest catches whatever light the room has */
  const chest = c.createLinearGradient(sx - 20, 0, sx + 20, 0);
  chest.addColorStop(0, "rgba(255,255,255,0.07)");
  chest.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = chest;
  c.beginPath();
  c.moveTo(sx - 15, sy + 48);
  c.quadraticCurveTo(sx - 19, sy + 6, sx - 6, sy - 10);
  c.quadraticCurveTo(sx - 2, sy + 20, sx - 4, sy + 48);
  c.closePath();
  c.fill();
  /* collar — an ellipse arc, so the neckline reads as a turned crew neck */
  c.strokeStyle = lit(mixc(SHIRT, [255, 255, 255], 0.15), L);
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(sx - 3, sy - 7, 9.5, 6, -0.15, Math.PI * 0.1, Math.PI * 0.95);
  c.stroke();

  /* ----- neck + head */
  c.save();
  c.translate(hx, hy);
  c.rotate(pitch);
  c.fillStyle = skin;
  c.fillRect(-3, 16, 11, 14); // neck
  /* skull + face — three-quarter view: the head is turned a few degrees
   * toward camera so the far brow, both eyes and the full beard read,
   * while the gaze stays on the screen */
  c.beginPath();
  c.ellipse(2, -2, 22.5, 22, 0, 0, TAU);
  c.fill();
  c.beginPath();
  c.moveTo(-16, -14);
  c.quadraticCurveTo(-22, -6, -22, 0);
  c.quadraticCurveTo(-22, 8, -18, 12);
  c.quadraticCurveTo(-14, 18, -6, 20);
  c.quadraticCurveTo(2, 22, 8, 20);
  c.lineTo(8, 0);
  c.closePath();
  c.fill();
  /* the far cheek turns away — one soft shade along the far edge */
  const shade = c.createLinearGradient(-22, 0, -11, 0);
  shade.addColorStop(0, "rgba(60,38,24,0.3)");
  shade.addColorStop(1, "rgba(60,38,24,0)");
  c.fillStyle = shade;
  c.beginPath();
  c.moveTo(-16, -14);
  c.quadraticCurveTo(-22, -6, -22, 0);
  c.quadraticCurveTo(-22, 8, -18, 12);
  c.quadraticCurveTo(-15, 15, -11, 17);
  c.lineTo(-11, -11);
  c.closePath();
  c.fill();
  /* nose — an interior wedge now that the face has turned */
  c.strokeStyle = "rgba(110,74,48,0.65)";
  c.lineWidth = 1.8;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-12, -6);
  c.quadraticCurveTo(-16.5, 0, -17, 3);
  c.quadraticCurveTo(-15, 5, -12.6, 4.6);
  c.stroke();
  /* beard — full, trimmed, wrapping the whole jaw */
  c.fillStyle = beard;
  c.beginPath();
  c.moveTo(-19, 6);
  c.quadraticCurveTo(-20, 15, -12, 20);
  c.quadraticCurveTo(-2, 24.5, 8, 22);
  c.quadraticCurveTo(15, 19, 16, 8);
  c.lineTo(11, 5);
  c.quadraticCurveTo(6, 12, -4, 11.5);
  c.quadraticCurveTo(-13, 10.5, -16, 5);
  c.closePath();
  c.fill();
  /* moustache */
  c.beginPath();
  c.ellipse(-11, 7.5, 6, 2.4, -0.12, 0, TAU);
  c.fill();
  /* sideburn ties beard to hair */
  c.fillRect(11, -4, 3.6, 10);
  /* hair — a thick swept-back mass with a real front hairline, so the
   * forehead keeps a natural height instead of a bald dome under a rim */
  c.fillStyle = hair;
  c.beginPath();
  c.moveTo(-15.5, -13);
  c.quadraticCurveTo(-19, -23, -9, -28);
  c.quadraticCurveTo(2, -33.5, 13, -29.5);
  c.quadraticCurveTo(25, -22, 25, -8);
  c.quadraticCurveTo(26, 2, 21, 9);
  c.lineTo(16.5, 4);
  c.quadraticCurveTo(20.5, -10, 12, -18.5);
  c.quadraticCurveTo(4, -24.5, -5, -21.5);
  c.quadraticCurveTo(-11.5, -18.5, -12.5, -13.5);
  c.closePath();
  c.fill();
  /* the top of the skull under the sweep is hair too, not scalp */
  c.beginPath();
  c.moveTo(-12.5, -13.5);
  c.quadraticCurveTo(-5, -22, 6, -21);
  c.quadraticCurveTo(14, -20, 17, -13);
  c.quadraticCurveTo(6, -19, -4, -18);
  c.quadraticCurveTo(-9, -17, -12.5, -13.5);
  c.closePath();
  c.fill();
  /* interior strands */
  c.strokeStyle = lit(mixc(HAIR, [255, 255, 255], 0.18), L, 1.6);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-9, -24);
  c.quadraticCurveTo(3, -29, 14, -22);
  c.stroke();
  /* ear sits further back on a turned head */
  c.fillStyle = skin;
  c.beginPath();
  c.ellipse(11, 1, 3.2, 5, 0.1, 0, TAU);
  c.fill();
  /* both brows and both eyes — the far pair narrower, past the nose */
  const blinkT = (T * 10) % 37;
  const blink = blinkT < 1.4 ? Math.sin((blinkT / 1.4) * Math.PI) : 0;
  c.strokeStyle = "rgba(24,20,16,0.75)";
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(-11, -9.6);
  c.lineTo(-4.5, -10.3);
  c.stroke();
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(-19.5, -8.8);
  c.lineTo(-15, -9.5);
  c.stroke();
  if (blink < 0.6) {
    c.fillStyle = "rgba(28,22,18,0.85)";
    c.beginPath();
    c.ellipse(-7.5, -4.6, 1.8, 2 * (1 - blink), 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(-17, -4.2, 1.1, 1.7 * (1 - blink), 0, 0, TAU);
    c.fill();
  } else {
    c.beginPath();
    c.moveTo(-9.5, -4.2);
    c.lineTo(-5.5, -4.2);
    c.stroke();
    c.beginPath();
    c.moveTo(-18, -4);
    c.lineTo(-15.8, -4);
    c.stroke();
  }
  c.restore();

  /* headphones on head */
  if (P.phones > 0.02) {
    drawPhones(c, P.phones >= 1 ? hx : P.phonesX, P.phones >= 1 ? hy - 6 : P.phonesY, P.phones, L);
  }

  /* screen light on the face — a rim along the profile, not a halo */
  if (scrGlow > 0.05) {
    c.save();
    c.globalCompositeOperation = "screen";
    c.strokeStyle = rgb(scrTint, 0.3 * scrGlow);
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(hx + 2, hy - 2, 22, Math.PI * 0.62, Math.PI * 1.28);
    c.stroke();
    c.strokeStyle = rgb(scrTint, 0.16 * scrGlow);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(sx - 15, sy + 46);
    c.quadraticCurveTo(sx - 19, sy + 6, sx - 7, sy - 9);
    c.stroke();
    c.restore();
  }

  /* ----- near arm (right) */
  {
    const W2: V2 = [P.rHand.x, P.rHand.y];
    const bias = P.rHand.mode === "stretch" ? 0.7 : P.rHand.mode === "carry" ? -0.5 : -1;
    const E = solveArm(S, W2, 58, 54, bias);
    capsule(c, S, E, 16, shirt);
    capsule(c, E, W2, 12, skin);
    drawHand(c, W2[0], W2[1], handAng(P.rHand.mode, E, W2), P.rHand.mode, T, skin);
  }
}

/* -------------------------------------------------------------- the room */

function quadY(x: number, top: boolean): number {
  const p = (x - SCR.lx) / (SCR.rx - SCR.lx);
  return top ? lerp(SCR.lt, SCR.rt, p) : lerp(SCR.lb, SCR.rb, p);
}

export function drawDay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const T = (t + OFFSET) % LOOP;
  const L = lighting(T);
  const P = choreograph(T);
  const scr = screenMode(T);
  const sl = screenLight(scr, T);

  const pcOn = scr.k !== "off";
  const ledOn = T >= 2.8 && T < 82.35;
  const barOn = T >= 47 && T < 78.6;
  const gameOn = T >= 41.8 && T < 58.8;

  /* ---- cover-fit: scale to the container, crop toward the focal point */
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  let scale = h / SH;
  if (w / scale > SW) scale = w / SW;
  const visW = w / scale;
  const visH = h / scale;
  const offX = clamp(560 - visW / 2, 0, SW - visW);
  const offY = clamp(390 - visH / 2, 0, SH - visH);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-offX, -offY);

  /* ================= background ================= */

  /* plain wall (right section) */
  ctx.fillStyle = lit(WALL_PLAIN, L, 0.85);
  ctx.fillRect(1000, 0, SW - 1000, FLOOR_Y);

  /* brick wall (left) */
  ctx.fillStyle = lit(MORTAR, L, 0.85);
  ctx.fillRect(0, 0, 1000, FLOOR_Y);
  const bh = 26;
  const bw = 58;
  for (let row = 0; row * bh < FLOOR_Y; row++) {
    const y = row * bh;
    const shift = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < 1000; col++) {
      const x = col * bw + shift;
      const v = hash(row * 31.7 + col * 7.3);
      ctx.fillStyle = lit(mixc(BRICK, [0, 0, 0], v * 0.3), L, 0.85);
      ctx.fillRect(Math.max(0, x + 2), y + 2, Math.min(bw - 3, 1000 - x - 2), bh - 3);
    }
  }

  /* LED wash on the brick behind the monitor (blue, strongest at night) */
  if (ledOn) {
    const ledA = lerp(0.06, 0.4, L.night);
    const g = ctx.createRadialGradient(300, 240, 40, 300, 240, 520);
    g.addColorStop(0, rgb(LEDBLUE, ledA));
    g.addColorStop(1, rgb(LEDBLUE, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1000, FLOOR_Y + 60);
  }

  /* window */
  const WX = 1120, WY = 74, WW = 300, WH = 360;
  ctx.fillStyle = lit([70, 66, 60], L, 0.8);
  ctx.fillRect(WX - 10, WY - 10, WW + 20, WH + 20);
  const sky = ctx.createLinearGradient(0, WY, 0, WY + WH);
  sky.addColorStop(0, rgb(L.skyTop));
  sky.addColorStop(1, rgb(L.skyBot));
  ctx.fillStyle = sky;
  ctx.fillRect(WX, WY, WW, WH);
  /* skyline silhouettes — distant, hazy, low */
  ctx.fillStyle = rgb(mixc(L.skyBot, [8, 10, 18], 0.45), 0.85);
  for (let i = 0; i < 8; i++) {
    const bx2 = WX + i * 39;
    const bh2 = 22 + hash(i * 5.9) * 42;
    ctx.fillRect(bx2, WY + WH - bh2, 34, bh2);
    if (L.night > 0.5 && hash(i * 2.3) > 0.4) {
      ctx.fillStyle = `rgba(255,220,140,${0.35 * (L.night - 0.5) * 2})`;
      ctx.fillRect(bx2 + 8, WY + WH - bh2 + 8, 2.4, 2.4);
      ctx.fillRect(bx2 + 20, WY + WH - bh2 + 16, 2.4, 2.4);
      ctx.fillStyle = rgb(mixc(L.skyBot, [8, 10, 18], 0.45), 0.85);
    }
  }
  /* stars + moon at night */
  if (L.night > 0.5) {
    const na = (L.night - 0.5) * 2;
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * na * hash(i * 3.1)})`;
      ctx.fillRect(WX + hash(i * 7.7) * WW, WY + hash(i * 11.3) * WH * 0.5, 1.6, 1.6);
    }
    /* one continuous arc across the whole night — rises low on the right at
     * dusk, sets high on the left before dawn. No wrap mid-night. */
    const Tm = T < 10 ? T + LOOP : T;
    const mp = clamp((Tm - 46) / 52, 0, 1);
    const moonX = WX + WW - 54 - mp * (WW - 108);
    const moonY = WY + 96 - Math.sin(mp * Math.PI) * 46;
    ctx.fillStyle = `rgba(225,230,240,${0.85 * na})`;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 13, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgb(L.skyTop, 0.9 * na);
    ctx.beginPath();
    ctx.arc(moonX - 6, moonY - 4, 11, 0, TAU);
    ctx.fill();
  }
  /* mullions */
  ctx.fillStyle = lit([70, 66, 60], L, 0.8);
  ctx.fillRect(WX + WW / 2 - 3, WY, 6, WH);
  ctx.fillRect(WX, WY + WH / 2 - 3, WW, 6);

  /* teal curtains flanking the window, with a slow sway */
  const sway = Math.sin(T * 0.7) * 3;
  const curtain = (cx0: number, wobble: number) => {
    ctx.fillStyle = lit(CURTAIN, L, 0.95);
    ctx.beginPath();
    ctx.moveTo(cx0, 42);
    ctx.lineTo(cx0 + 46, 42);
    ctx.quadraticCurveTo(cx0 + 52 + wobble, 300, cx0 + 42 + wobble, 508);
    ctx.lineTo(cx0 - 6 + wobble * 0.6, 508);
    ctx.quadraticCurveTo(cx0 - 8, 280, cx0, 42);
    ctx.closePath();
    ctx.fill();
    /* folds */
    ctx.strokeStyle = lit(mixc(CURTAIN, [0, 0, 0], 0.4), L);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx0 + 10 + i * 12, 46);
      ctx.quadraticCurveTo(
        cx0 + 12 + i * 12 + wobble * 0.7, 300,
        cx0 + 8 + i * 13 + wobble, 504
      );
      ctx.stroke();
    }
  };
  curtain(1072, sway);
  curtain(1412, -sway * 0.8);
  /* curtain rod */
  ctx.fillStyle = lit([90, 86, 80], L, 0.8);
  ctx.fillRect(1062, 38, 408, 5);

  /* corner trim between brick and plain wall */
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(998, 0, 4, FLOOR_Y);

  /* wall switch by the window — the one that gets flicked at night */
  ctx.fillStyle = lit([200, 196, 188], L, 0.8);
  ctx.fillRect(1030, 296, 16, 26);

  /* floor */
  const fg = ctx.createLinearGradient(0, FLOOR_Y, 0, BOTTOM);
  fg.addColorStop(0, lit(FLOOR, L, 0.9));
  fg.addColorStop(1, lit(mixc(FLOOR, [0, 0, 0], 0.55), L, 0.8));
  ctx.fillStyle = fg;
  ctx.fillRect(0, FLOOR_Y, SW, BOTTOM - FLOOR_Y);
  /* marble veins */
  ctx.strokeStyle = lit(mixc(FLOOR, [255, 255, 255], 0.25), L, 0.7);
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    const vy = FLOOR_Y + 14 + hash(i * 13.1) * (BOTTOM - FLOOR_Y - 20);
    ctx.moveTo(hash(i * 3.3) * SW, vy);
    ctx.quadraticCurveTo(
      hash(i * 5.7) * SW, vy + 22,
      hash(i * 9.1) * SW * 0.9 + 150, vy + 8
    );
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* daylight shaft from the window across the floor */
  if (L.sun > 0.04) {
    const dayFrac = clamp((T - 6) / 35, 0, 1);
    const elev = Math.sin(dayFrac * Math.PI); // low at both ends of the day
    const reach = lerp(980, 620, 1 - elev) - elev * 260;
    ctx.fillStyle = rgb(
      mixc([255, 240, 210], [255, 170, 100], L.warm),
      0.1 * L.sun
    );
    ctx.beginPath();
    ctx.moveTo(WX + 10, WY + 60);
    ctx.lineTo(WX + WW, WY + 30);
    ctx.lineTo(WX - 40, 640);
    ctx.lineTo(reach, 640);
    ctx.closePath();
    ctx.fill();
  }
  /* a quiet pool of moonlight on the floor by the window, drifting only a
   * little as the night passes — window light lands on the floor, not as a
   * beam across the wall */
  if (L.night > 0.6 && T > 66) {
    const na = (L.night - 0.6) * 2.5;
    const slide = clamp((T - 66) / 26, 0, 1);
    const foot = 1030 - slide * 90;
    ctx.fillStyle = `rgba(175,195,235,${0.055 * na})`;
    ctx.beginPath();
    ctx.moveTo(foot, 642);
    ctx.lineTo(foot + 240, 642);
    ctx.lineTo(WX + WW - 90, FLOOR_Y + 2);
    ctx.lineTo(WX + 6, FLOOR_Y + 2);
    ctx.closePath();
    ctx.fill();
    /* faint spill up the wall below the sill */
    ctx.fillStyle = `rgba(175,195,235,${0.03 * na})`;
    ctx.fillRect(WX - 6, WY + WH + 10, WW + 12, FLOOR_Y - (WY + WH) - 10);
  }

  /* ================= workstation ================= */

  /* shelf (raised riser) */
  ctx.fillStyle = lit(DESK_TOP, L);
  ctx.fillRect(62, SHELF_BACK, 526, SHELF_Y - SHELF_BACK);
  ctx.fillStyle = lit(DESK_FACE, L);
  ctx.fillRect(62, SHELF_Y, 526, 8);
  ctx.fillRect(84, SHELF_Y + 8, 12, DESK_BACK - SHELF_Y - 8);
  ctx.fillRect(548, SHELF_Y + 8, 12, DESK_BACK - SHELF_Y - 8);

  /* PS5, standing on the shelf beside the monitor */
  {
    const px = 78;
    ctx.fillStyle = lit([225, 228, 233], L);
    ctx.beginPath();
    ctx.moveTo(px - 12, SHELF_BACK);
    ctx.quadraticCurveTo(px - 16, SHELF_BACK - 60, px - 8, SHELF_BACK - 116);
    ctx.lineTo(px - 2, SHELF_BACK - 116);
    ctx.lineTo(px - 2, SHELF_BACK);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lit([30, 32, 36], L);
    ctx.fillRect(px - 2, SHELF_BACK - 114, 7, 114);
    ctx.fillStyle = lit([225, 228, 233], L);
    ctx.beginPath();
    ctx.moveTo(px + 5, SHELF_BACK);
    ctx.quadraticCurveTo(px + 14, SHELF_BACK - 62, px + 7, SHELF_BACK - 116);
    ctx.lineTo(px + 5, SHELF_BACK - 116);
    ctx.closePath();
    ctx.fill();
    if (gameOn) {
      ctx.fillStyle = "rgba(90,140,255,0.9)";
      ctx.fillRect(px - 2, SHELF_BACK - 110, 1.6, 104);
    }
  }

  /* monitor stand + RGB ring */
  ctx.fillStyle = lit([20, 21, 24], L);
  ctx.beginPath();
  ctx.ellipse(316, SHELF_BACK + 4, 46, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(306, 300, 20, SHELF_BACK - 296);
  if (pcOn) {
    ctx.strokeStyle = `rgba(150,90,255,${lerp(0.15, 0.8, L.night)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(316, SHELF_BACK + 4, 40, 6.4, 0, 0, TAU);
    ctx.stroke();
  }

  /* monitor body + screen */
  ctx.fillStyle = lit([15, 16, 18], L, 1.2);
  ctx.beginPath();
  ctx.moveTo(SCR.lx - 8, SCR.lt - 8);
  ctx.lineTo(SCR.rx + 8, SCR.rt - 8);
  ctx.lineTo(SCR.rx + 8, SCR.rb + 8);
  ctx.lineTo(SCR.lx - 8, SCR.lb + 8);
  ctx.closePath();
  ctx.fill();

  /* screen surface */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(SCR.lx, SCR.lt);
  ctx.lineTo(SCR.rx, SCR.rt);
  ctx.lineTo(SCR.rx, SCR.rb);
  ctx.lineTo(SCR.lx, SCR.lb);
  ctx.closePath();
  ctx.clip();
  /* base panel — near-black when off, content otherwise */
  ctx.fillStyle = pcOn ? "#0a0d11" : "#050607";
  ctx.fill();
  {
    /* map local 416×164 content space onto the (slightly skewed) quad */
    const sxm = (SCR.rx - SCR.lx) / 416;
    const skew = (SCR.rt - SCR.lt) / (SCR.rx - SCR.lx);
    const sym = (SCR.lb - SCR.lt) / 164;
    ctx.transform(sxm, skew * sxm, 0, sym, SCR.lx, SCR.lt);
    drawScreenContent(ctx, scr, T);
  }
  ctx.restore();
  /* glass sheen + a hint of the window reflected during the day */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(SCR.lx, SCR.lt);
  ctx.lineTo(SCR.rx, SCR.rt);
  ctx.lineTo(SCR.rx, SCR.rb);
  ctx.lineTo(SCR.lx, SCR.lb);
  ctx.closePath();
  ctx.clip();
  const sheen = ctx.createLinearGradient(SCR.lx, SCR.lt, SCR.rx, SCR.rb);
  sheen.addColorStop(0.55, "rgba(255,255,255,0)");
  sheen.addColorStop(0.72, `rgba(255,255,255,${0.035 + L.sun * 0.05})`);
  sheen.addColorStop(0.8, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fill();
  ctx.restore();
  /* standby LED */
  if (!pcOn) {
    ctx.fillStyle = `rgba(240,160,60,${0.4 + 0.3 * Math.sin(T * 1.8)})`;
    ctx.fillRect(SCR.rx - 10, SCR.rb + 3, 3, 2);
  }

  /* light bar on top of the monitor */
  ctx.fillStyle = lit([18, 19, 22], L);
  ctx.fillRect(250, quadY(250, true) - 14, 180, 7);
  if (barOn) {
    ctx.fillStyle = "rgba(255,220,170,0.9)";
    ctx.fillRect(252, quadY(250, true) - 8, 176, 1.6);
  }

  /* ================= desk ================= */

  ctx.fillStyle = lit(DESK_TOP, L);
  ctx.fillRect(36, DESK_BACK, 924, DESK_Y - DESK_BACK);
  ctx.fillStyle = lit(DESK_FACE, L);
  ctx.fillRect(36, DESK_Y, 924, 16);
  /* legs */
  ctx.fillRect(56, DESK_Y + 16, 12, 600 - DESK_Y - 16);
  ctx.fillRect(918, DESK_Y + 16, 12, 600 - DESK_Y - 16);
  /* under-desk shadow */
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(36, DESK_Y + 16, 924, 10);

  /* mousepad with RGB rim — a shallow parallelogram, echoing the camera's
   * quarter view of the desk top */
  const padX = 584, padW = 208, padY = DESK_BACK + 1, padH = DESK_Y - DESK_BACK - 4;
  const padSkew = 7;
  const padPath = (inset: number) => {
    ctx.beginPath();
    ctx.moveTo(padX + padSkew + inset, padY + inset);
    ctx.lineTo(padX + padW + padSkew - inset, padY + inset);
    ctx.lineTo(padX + padW - inset, padY + padH - inset);
    ctx.lineTo(padX + inset, padY + padH - inset);
    ctx.closePath();
  };
  ctx.fillStyle = lit([18, 20, 24], L);
  ctx.lineJoin = "round";
  padPath(0);
  ctx.fill();
  if (pcOn) {
    ctx.strokeStyle = rgb(MAGENTA, lerp(0.12, 0.75, L.night));
    ctx.lineWidth = 2;
    padPath(1.4);
    ctx.stroke();
  }

  /* keyboard */
  {
    const kx = 596, kw = 152, ky = DESK_BACK + 3, kh = 15;
    ctx.fillStyle = lit([140, 144, 150], L, 0.85);
    ctx.beginPath();
    ctx.moveTo(kx + 3, ky - 1);
    ctx.lineTo(kx + kw + 7, ky - 1);
    ctx.lineTo(kx + kw + 2, ky + kh + 3);
    ctx.lineTo(kx - 2, ky + kh + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lit(KEY_WHITE, L, 0.82);
    for (let r = 0; r < 3; r++) {
      for (let k2 = 0; k2 < 17; k2++) {
        /* back rows shift with the pad's skew, so the board lies on the desk */
        ctx.fillRect(kx + k2 * 9 + (2 - r) * 2, ky + r * 6, 7, 4.4);
      }
    }
    if (pcOn && L.night > 0.25) {
      /* per-key RGB bleed */
      for (let k2 = 0; k2 < 17; k2++) {
        const hue = hash(k2 * 3.9);
        ctx.fillStyle = `rgba(${120 + hue * 130},${60 + (1 - hue) * 120},255,${0.16 * L.night})`;
        ctx.fillRect(kx + k2 * 9, ky + 17, 7, 2);
      }
    }
  }

  /* mouse — follows the hand's drift while he is pointing */
  const mdx =
    P.rHand.mode === "mouse" && Math.abs(P.rHand.x - MOUSE[0]) < 12
      ? P.rHand.x - MOUSE[0]
      : 0;
  ctx.fillStyle = lit([32, 34, 38], L);
  ctx.beginPath();
  ctx.ellipse(MOUSE[0] + mdx, MOUSE[1] + 6, 9, 6.4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(MOUSE[0] + mdx, MOUSE[1] + 1);
  ctx.lineTo(MOUSE[0] + mdx, MOUSE[1] + 4);
  ctx.stroke();

  /* audio visualizer puck — little RGB columns, dances while the PC is on */
  {
    const vx = 560, vy = DESK_BACK - 20;
    ctx.fillStyle = lit([26, 28, 32], L);
    ctx.fillRect(vx, vy, 14, 22);
    if (pcOn) {
      for (let i = 0; i < 4; i++) {
        const amp = 4 + Math.abs(Math.sin(T * (3 + i) + i * 2)) * 12;
        ctx.fillStyle = `rgba(${i % 2 ? 63 : 255},${i % 2 ? 215 : 62},${i % 2 ? 232 : 160},${lerp(0.2, 0.8, L.night)})`;
        ctx.fillRect(vx + 2 + i * 3, vy + 20 - amp, 2, amp);
      }
    }
  }

  /* headphone stand (+ phones when they are hanging) */
  ctx.strokeStyle = lit([150, 155, 160], L);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PHONES_STAND[0], DESK_BACK + 6);
  ctx.lineTo(PHONES_STAND[0], PHONES_STAND[1] - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(PHONES_STAND[0], DESK_BACK + 8, 13, 3.4, 0, 0, TAU);
  ctx.stroke();
  if (P.phones <= 0.02 && !(P.rHand.mode === "phones" && P.phones === 0 && (T >= 21.7 && T < 27.7))) {
    drawPhones(ctx, PHONES_STAND[0], PHONES_STAND[1], 0, L);
  }

  /* controller on the desk (held frames are drawn with the character) */
  if (T < 41.3 || T >= 58.8) {
    drawController(ctx, CTRL_REST[0], CTRL_REST[1] - 4, 0, L, gameOn);
  }

  /* mug on the desk */
  if (!P.mugHeld && T >= 5.15 && T < 78.9) {
    drawMug(ctx, MUG_SPOT[0], MUG_SPOT[1], 0, L);
    /* steam while it is fresh */
    if (P.steam > 0.02) {
      ctx.strokeStyle = `rgba(255,255,255,${0.4 * P.steam})`;
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 3; i++) {
        const ph = (T * 0.6 + i * 0.33) % 1;
        ctx.globalAlpha = (1 - ph) * P.steam;
        ctx.beginPath();
        const sx0 = MUG_SPOT[0] - 4 + i * 4;
        const sy0 = MUG_SPOT[1] - 28 - ph * 22;
        ctx.moveTo(sx0, sy0 + 8);
        ctx.quadraticCurveTo(sx0 + 3 * Math.sin(T * 2 + i), sy0 + 4, sx0, sy0);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ================= chair + character ================= */

  const chairX = P.present && P.seated > 0
    ? lerp(790, 742, P.seated) + P.roll
    : 790;
  {
    /* base */
    ctx.strokeStyle = lit([120, 124, 130], L);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(chairX + 8, 476);
    ctx.lineTo(chairX + 8, 556);
    ctx.stroke();
    ctx.lineWidth = 4;
    for (const dx of [-52, -14, 34]) {
      ctx.beginPath();
      ctx.moveTo(chairX + 8, 556);
      ctx.lineTo(chairX + 8 + dx, 594);
      ctx.stroke();
      ctx.fillStyle = lit([40, 42, 46], L);
      ctx.beginPath();
      ctx.arc(chairX + 8 + dx, 598, 6, 0, TAU);
      ctx.fill();
    }
    /* seat */
    ctx.fillStyle = lit(CHAIR_DARK, L);
    ctx.beginPath();
    ctx.roundRect(chairX - 52, 458, 118, 18, 8);
    ctx.fill();
    /* backrest behind the torso */
    ctx.fillStyle = lit(CHAIR_DARK, L, 0.9);
    ctx.beginPath();
    ctx.moveTo(chairX + 48, 470);
    ctx.quadraticCurveTo(chairX + 72, 380, chairX + 62, 300);
    ctx.lineTo(chairX + 44, 300);
    ctx.quadraticCurveTo(chairX + 50, 380, chairX + 30, 468);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = lit(CHAIR_FRAME, L, 0.9);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(chairX + 52, 468);
    ctx.quadraticCurveTo(chairX + 74, 380, chairX + 62, 302);
    ctx.stroke();
    /* headrest riding the top of the frame */
    ctx.strokeStyle = lit(CHAIR_FRAME, L, 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chairX + 60, 302);
    ctx.lineTo(chairX + 56, 284);
    ctx.stroke();
    ctx.fillStyle = lit(CHAIR_DARK, L);
    ctx.beginPath();
    ctx.roundRect(chairX + 38, 266, 30, 20, 8);
    ctx.fill();
    ctx.strokeStyle = lit(CHAIR_FRAME, L, 0.7);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(chairX + 38, 266, 30, 20, 8);
    ctx.stroke();
  }

  if (P.present) {
    ctx.save();
    /* walking right, he faces right: mirror the whole figure (and whatever
     * he is holding) around his own axis */
    if (P.facing === -1) {
      ctx.translate(P.bx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-P.bx, 0);
    }
    drawCharacter(ctx, P, L, T, pcOn ? sl.level : 0, sl.tint);
    /* held props drawn over the near hand's arm */
    if (P.mugHeld) drawMug(ctx, P.mugX, P.mugY, P.mugTilt, L);
    if (T >= 41.3 && T < 58.8) {
      const playing = T >= 42.4 && T < 58.0;
      const burst =
        (T > 46.4 && T < 47.2) || (T > 51.0 && T < 51.7) || (T > 53.2 && T < 54.4);
      const rock = playing
        ? Math.sin(T * 2.6) * 0.05 + (burst ? Math.sin(T * 9) * 0.04 : 0)
        : 0;
      drawController(ctx, P.ctrlX, P.ctrlY, P.ctrlHeld, L, gameOn, rock);
      if (P.ctrlHeld > 0.9) {
        /* thumbs on the sticks; the fast micro-motion lives here, nowhere else */
        const skin = lit(SKIN, L, 1.1);
        const f1 = playing ? Math.sin(T * 11) * 1.4 * (burst ? 1.8 : 1) : 0;
        const f2 = playing ? Math.sin(T * 8.4 + 1.9) * 1.2 * (burst ? 1.8 : 1) : 0;
        capsule(ctx, [P.ctrlX + 16, P.ctrlY - 5], [P.ctrlX + 8 + f1, P.ctrlY - 2], 4.4, skin);
        capsule(ctx, [P.ctrlX - 17, P.ctrlY - 6], [P.ctrlX - 9 + f2, P.ctrlY - 3], 4.4, skin);
      }
    }
    if (P.phones > 0.02 && P.phones < 1) drawPhones(ctx, P.phonesX, P.phonesY, P.phones, L);
    ctx.restore();
  }

  /* ================= light overlays ================= */

  /* monitor glow into the room */
  if (pcOn && sl.level > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const gAmt = sl.level * lerp(0.10, 0.5, L.night);
    const g = ctx.createRadialGradient(316, 240, 30, 316, 240, 430);
    g.addColorStop(0, rgb(sl.tint, gAmt));
    g.addColorStop(1, rgb(sl.tint, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 900, 650);
    ctx.restore();
  }

  /* light-bar pool onto the desk */
  if (barOn) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,214,160,${0.10 * L.night})`;
    ctx.beginPath();
    ctx.moveTo(268, 150);
    ctx.lineTo(414, 148);
    ctx.lineTo(560, DESK_Y);
    ctx.lineTo(150, DESK_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* pad glow pool */
  if (pcOn && L.night > 0.3) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(700, 392, 8, 700, 392, 96);
    g.addColorStop(0, rgb(MAGENTA, 0.07 * L.night));
    g.addColorStop(1, rgb(MAGENTA, 0));
    ctx.fillStyle = g;
    ctx.fillRect(580, 340, 260, 100);
    ctx.restore();
  }

  /* cyan accent: the LED strip under the shelf edge */
  if (ledOn) {
    ctx.fillStyle = rgb(CYAN_C, lerp(0.08, 0.5, L.night));
    ctx.fillRect(64, SHELF_Y + 6, 522, 1.6);
  }

  /* daylight fill from the window, right to left across the whole room */
  if (L.sun > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const day = ctx.createLinearGradient(SW, 0, 200, 0);
    const warmc = mixc([255, 244, 224], [255, 190, 120], L.warm);
    day.addColorStop(0, rgb(warmc, 0.16 * L.sun));
    day.addColorStop(1, rgb(warmc, 0.02 * L.sun));
    ctx.fillStyle = day;
    ctx.fillRect(0, 0, SW, SH);
    ctx.restore();
  }

  /* vignette down to the void, so the plate sits on the black page */
  ctx.restore();
  const v = ctx.createRadialGradient(w / 2, h * 0.44, Math.min(w, h) * 0.5, w / 2, h * 0.52, Math.max(w, h) * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  const eb = ctx.createLinearGradient(0, h - 60, 0, h);
  eb.addColorStop(0, "rgba(0,0,0,0)");
  eb.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = eb;
  ctx.fillRect(0, h - 60, w, 60);
}
