/**
 * Reads a rendered mermaid flowchart back out of its own SVG.
 *
 * Mermaid does not hand you a graph object — it hands you a picture. But it
 * names everything on the way out, and those names are the graph: nodes carry
 * `…-flowchart-{KEY}-{n}` and links carry `…-L_{FROM}_{TO}_{n}`. Reading the
 * structure back off the DOM is less fragile than parsing mermaid's source
 * syntax, which has a decade of accumulated shorthand.
 *
 * Everything here is pure DOM reading. No styling decisions, no side effects.
 */

/** Where a node sits in the shape of the graph. */
export type FlowRole = "entry" | "decision" | "terminal" | "step";

/** What a node or edge means — the only three the palette encodes. */
export type FlowTone = "neutral" | "pass" | "fail";

export interface FlowNode {
  key: string;
  el: SVGGElement;
  role: FlowRole;
  tone: FlowTone;
  label: string;
  /** Indices into FlowGraph.edges. */
  out: number[];
  in: number[];
  /** Reveal order, in half-steps: node, then its outgoing edges, then… */
  step: number;
}

export interface FlowEdge {
  el: SVGPathElement;
  /** The <g class="edgeLabel"> that belongs to this edge, if it has one. */
  labelEl: SVGGElement | null;
  from: string;
  to: string;
  label: string;
  tone: FlowTone;
  step: number;
}

export interface FlowGraph {
  nodes: Map<string, FlowNode>;
  edges: FlowEdge[];
  /** True if any branch was classified, i.e. the legend has something to say. */
  toned: boolean;
}

/*
 * A branch is named, not guessed. These match the words people actually write
 * on a mermaid arrow; anything else stays neutral rather than being forced
 * into a colour it does not mean.
 */
const PASS =
  /^(y|yes|ok|pass(ed)?|true|success|valid|good|accept(ed)?|clean)\b/i;
const FAIL =
  /^(n|no|fail(ed|ure)?|false|error|invalid|reject(ed)?|block(ed)?|bad|missing|unsure)\b/i;

function toneOfLabel(label: string): FlowTone {
  const t = label.trim();
  if (!t) return "neutral";
  if (PASS.test(t)) return "pass";
  if (FAIL.test(t)) return "fail";
  return "neutral";
}

/**
 * Split `L_{FROM}_{TO}_{n}` when either key may itself contain an underscore.
 * The set of real node keys is already known, so the ambiguity is resolvable:
 * try every split point and keep the one where both halves are real nodes.
 */
function splitLink(id: string, keys: Set<string>) {
  const m = /^L_(.+)_\d+$/.exec(id);
  if (!m) return null;
  const body = m[1];
  for (let i = 1; i < body.length; i++) {
    if (body[i] !== "_") continue;
    const from = body.slice(0, i);
    const to = body.slice(i + 1);
    if (keys.has(from) && keys.has(to)) return { from, to };
  }
  return null;
}

/** Strip the per-render mermaid id prefix off an element id. */
function localId(raw: string, prefix: string) {
  return raw.startsWith(`${prefix}-`) ? raw.slice(prefix.length + 1) : raw;
}

export function readGraph(svg: SVGSVGElement): FlowGraph | null {
  const prefix = svg.id;
  if (!prefix) return null;

  const nodes = new Map<string, FlowNode>();

  for (const el of Array.from(svg.querySelectorAll<SVGGElement>("g.node"))) {
    const m = /flowchart-(.+?)-\d+$/.exec(localId(el.id, prefix));
    if (!m) continue;
    nodes.set(m[1], {
      key: m[1],
      el,
      // A rhombus is the only shape mermaid gives a polygon to in a default
      // flowchart, which makes it a reliable tell for a branch point.
      role: el.querySelector("polygon") ? "decision" : "step",
      tone: "neutral",
      label: (el.textContent || "").trim(),
      out: [],
      in: [],
      step: 0,
    });
  }
  if (nodes.size === 0) return null;

  // Edge labels are emitted in the same order as the links themselves, one
  // group per edge whether or not it carries text. Position is the join.
  const labelEls = Array.from(
    svg.querySelectorAll<SVGGElement>("g.edgeLabels > g.edgeLabel"),
  );

  const linkEls = Array.from(
    svg.querySelectorAll<SVGPathElement>("path.flowchart-link"),
  );

  const edges: FlowEdge[] = [];
  linkEls.forEach((el, i) => {
    const ends = splitLink(localId(el.id, prefix), new Set(nodes.keys()));
    if (!ends) return;
    const labelEl = labelEls[i] ?? null;
    const label = (labelEl?.textContent || "").trim();
    const index = edges.length;
    edges.push({
      el,
      labelEl,
      from: ends.from,
      to: ends.to,
      label,
      tone: toneOfLabel(label),
      step: 0,
    });
    nodes.get(ends.from)!.out.push(index);
    nodes.get(ends.to)!.in.push(index);
  });

  for (const n of nodes.values()) {
    if (n.in.length === 0) n.role = "entry";
    else if (n.out.length === 0) n.role = "terminal";
  }

  propagateTone(nodes, edges);
  assignSteps(nodes, edges);

  return {
    nodes,
    edges,
    toned: edges.some((e) => e.tone !== "neutral"),
  };
}

/**
 * Carry a branch's meaning downstream until the paths merge back together.
 *
 * A node inherits a tone only when EVERY edge arriving at it agrees. That is
 * what stops a failure branch from staining the main line when it loops back:
 * the node it rejoins has one neutral parent and one failed one, so it returns
 * to neutral, which is the truth of it.
 */
function propagateTone(nodes: Map<string, FlowNode>, edges: FlowEdge[]) {
  const seeded = edges.map((e) => e.tone);

  // Bounded by the longest possible chain; converges long before that.
  for (let pass = 0; pass <= nodes.size; pass++) {
    let changed = false;

    for (const n of nodes.values()) {
      if (n.in.length === 0) continue;
      const first = edges[n.in[0]].tone;
      if (first === "neutral") continue;
      if (!n.in.every((i) => edges[i].tone === first)) continue;
      if (n.tone !== first) {
        n.tone = first;
        changed = true;
      }
    }

    edges.forEach((e, i) => {
      if (seeded[i] !== "neutral") return; // an explicit label always wins
      const src = nodes.get(e.from)!.tone;
      if (e.tone !== src) {
        e.tone = src;
        changed = true;
      }
    });

    if (!changed) break;
  }
}

/**
 * Order the reveal as a walk rather than a wave.
 *
 * Breadth-first from the entry, with each node's outgoing edges landing on the
 * half-step after it — so the eye is led node, arrow, node, arrow, which is
 * how you would trace the thing with a finger.
 */
function assignSteps(nodes: Map<string, FlowNode>, edges: FlowEdge[]) {
  const roots = [...nodes.values()].filter((n) => n.role === "entry");
  // A graph that is all cycle has no entry; start somewhere rather than nowhere.
  const seeds = roots.length ? roots : [[...nodes.values()][0]];
  const queue = seeds.map((n) => n.key);
  const depth = new Map<string, number>(queue.map((k) => [k, 0]));

  for (let head = 0; head < queue.length; head++) {
    const node = nodes.get(queue[head])!;
    const d = depth.get(node.key)!;
    node.step = d * 2;

    for (const i of node.out) {
      edges[i].step = d * 2 + 1;
      const next = edges[i].to;
      if (depth.has(next)) continue;
      depth.set(next, d + 1);
      queue.push(next);
    }
  }

  // Anything unreachable still has to appear; put it after the walk.
  const last = Math.max(0, ...[...nodes.values()].map((n) => n.step));
  for (const n of nodes.values()) if (!depth.has(n.key)) n.step = last + 2;
}

/** Every node and edge reachable from `key`, following arrows forward. */
export function downstream(graph: FlowGraph, key: string) {
  const litNodes = new Set<string>([key]);
  const litEdges = new Set<number>();
  const queue = [key];

  for (let head = 0; head < queue.length; head++) {
    for (const i of graph.nodes.get(queue[head])!.out) {
      litEdges.add(i);
      const next = graph.edges[i].to;
      if (litNodes.has(next)) continue; // cycles are normal here
      litNodes.add(next);
      queue.push(next);
    }
  }

  return { litNodes, litEdges };
}
