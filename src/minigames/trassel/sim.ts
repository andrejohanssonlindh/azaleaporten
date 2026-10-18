import type { Rng } from '../../platform/rng';
import type { KnutLoadout } from '../../platform/rpg/trassel';
import { AREA, checkSolved, newStrid, segCross, segDist, type Game, type Pt, type Pussel } from './strid';

// Pinnknutar: knuten är en plan graf (pinnar och rep) som ritas ihoptrasslad; barnet drar pinnarna
// tills inga rep korsar varandra. Spindeln rycker loss en pinne och slänger den någon annanstans.
// Striden och monstren finns i strid.ts.

export const PEG_R = 28;
/** Hur nära (enheter) ett tryck måste vara en pinne. */
export const TAP_PEG = 75;

/* ---------- knuten ---------- */

export interface Knot {
  pegs: Pt[];
  edges: [number, number][];
  /** En lösning (ett sätt att lägga pinnarna utan korsningar), för tester. */
  goal: Pt[];
}

/** Rutnätets storlek per knut: fler pinnar för varje steg. */
export function gridFor(l: number): [number, number] {
  if (l <= 1) return [2, 2];
  if (l <= 3) return [3, 2];
  if (l <= 5) return [3, 3];
  if (l <= 7) return [4, 3];
  if (l <= 10) return [4, 4];
  if (l <= 13) return [5, 4];
  return [5, 5];
}

/** Antal knutar (rep som korsar, och pinnar som ligger på ett rep de inte hör till) och vilka rep som är trassliga. */
export function crossings(pegs: Pt[], edges: [number, number][]): { n: number; bad: Set<number> } {
  let n = 0;
  const bad = new Set<number>();
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    for (let j = i + 1; j < edges.length; j++) {
      const [c, d] = edges[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (segCross(pegs[a], pegs[b], pegs[c], pegs[d])) { n++; bad.add(i); bad.add(j); }
    }
    for (let k = 0; k < pegs.length; k++) {
      if (k === a || k === b) continue;
      if (segDist(pegs[k], pegs[a], pegs[b]) < PEG_R * 0.7) { n++; bad.add(i); }
    }
  }
  return { n, bad };
}

function connected(n: number, edges: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const seen = new Set([0]);
  const todo = [0];
  while (todo.length) for (const m of adj[todo.pop()!]) if (!seen.has(m)) { seen.add(m); todo.push(m); }
  return seen.size === n;
}

/** Ställer pinnarna i en ring i slumpad ordning, så att repen trasslar. */
function scramble(n: number, edges: [number, number][], rng: Rng): Pt[] {
  const cx = (AREA.x0 + AREA.x1) / 2, cy = (AREA.y0 + AREA.y1) / 2, r = Math.min(AREA.x1 - AREA.x0, AREA.y1 - AREA.y0) * 0.4;
  let pegs: Pt[] = [];
  for (let tries = 0; tries < 60; tries++) {
    const order = rng.shuffle([...Array(n).keys()]);
    const turn = rng.next() * Math.PI * 2;
    pegs = new Array(n);
    order.forEach((p, k) => {
      const a = turn + (k / n) * Math.PI * 2;
      pegs[p] = { x: Math.round(cx + Math.cos(a) * r), y: Math.round(cy + Math.sin(a) * r) };
    });
    if (crossings(pegs, edges).n > 0) break;
  }
  return pegs;
}

/** Bygger knut nummer l: ett rutnät med några diagonaler och några borttagna rep, som sedan trasslas ihop. */
export function makeKnot(l: number, rng: Rng): Knot {
  const [cols, rows] = gridFor(l);
  const sx = (AREA.x1 - AREA.x0) / cols, sy = (AREA.y1 - AREA.y0) / rows;
  const id = (c: number, r: number) => r * cols + c;
  const goal: Pt[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    goal.push({
      x: Math.round(AREA.x0 + sx * (c + 0.5) + (rng.next() - 0.5) * sx * 0.3),
      y: Math.round(AREA.y0 + sy * (r + 0.5) + (rng.next() - 0.5) * sy * 0.3),
    });
  }
  let edges: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (c + 1 < cols) edges.push([id(c, r), id(c + 1, r)]);
    if (r + 1 < rows) edges.push([id(c, r), id(c, r + 1)]);
  }
  const diag = Math.min(0.6, 0.1 + 0.05 * l);
  for (let r = 0; r + 1 < rows; r++) for (let c = 0; c + 1 < cols; c++) {
    if (rng.next() >= diag) continue;
    edges.push(rng.next() < 0.5 ? [id(c, r), id(c + 1, r + 1)] : [id(c + 1, r), id(c, r + 1)]);
  }
  // Ta bort några rep, men varje pinne behåller minst två och allt hänger ihop.
  const n = cols * rows;
  for (const e of rng.shuffle(edges)) {
    if (rng.next() >= 0.25) continue;
    const deg = (p: number) => edges.filter(([a, b]) => a === p || b === p).length;
    if (deg(e[0]) <= 2 || deg(e[1]) <= 2) continue;
    const rest = edges.filter((x) => x !== e);
    if (connected(n, rest)) edges = rest;
  }
  return { pegs: scramble(n, edges, rng), edges, goal };
}

/* ---------- pusslet ---------- */

const clampX = (x: number) => Math.max(AREA.x0, Math.min(AREA.x1, x));
const clampY = (y: number) => Math.max(AREA.y0, Math.min(AREA.y1, y));

export class PinnKnut implements Pussel {
  hjalp = 'Dra pinnarna så att inga rep korsar varandra.';
  pegs: Pt[];
  edges: [number, number][];
  goal: Pt[];
  /** Pinnen som barnet drar i just nu. */
  drag: number | null = null;
  cross = 0;
  /** Trassliga rep just nu. */
  bad = new Set<number>();

  constructor(k: Knot) {
    this.pegs = k.pegs;
    this.edges = k.edges;
    this.goal = k.goal;
    this.measure();
  }

  measure() {
    const c = crossings(this.pegs, this.edges);
    this.cross = c.n;
    this.bad = c.bad;
  }

  kvar() { return this.cross; }
  haller() { return this.drag !== null; }
  slapp() { this.drag = null; }
  bonus() { return 0; }

  spindelMal(mal: number) { return this.pegs[mal % this.pegs.length]; }

  /** Spindeln rycker loss pinnen och slänger den någon annanstans (inte den barnet håller i). */
  trassla(mal: number, rng: Rng) {
    const i = mal % this.pegs.length;
    if (this.drag === i) return false;
    this.pegs[i] = { x: AREA.x0 + rng.int(AREA.x1 - AREA.x0), y: AREA.y0 + rng.int(AREA.y1 - AREA.y0) };
    this.measure();
    return true;
  }

  knuff() {
    const b = bestNudge(this);
    if (!b) return null;
    this.pegs[b.peg] = b.to;
    this.measure();
    return b.peg;
  }

  /** Närmaste pinne inom räckhåll, eller null. */
  pegAt(x: number, y: number): number | null {
    let best: number | null = null, bd = TAP_PEG;
    this.pegs.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
}

export type PinnGame = Game<PinnKnut>;

export const newGame = (lo: KnutLoadout, seed: number, startLevel = 1, skatt = false): PinnGame =>
  newStrid(lo, seed, (l, rng) => new PinnKnut(makeKnot(l, rng)), startLevel, skatt);

export function grab(g: PinnGame, i: number) {
  if (g.phase === 'play') g.pz.drag = i;
}

export function moveDrag(g: PinnGame, x: number, y: number) {
  const pz = g.pz;
  if (pz.drag === null || g.phase !== 'play') return;
  pz.pegs[pz.drag] = { x: clampX(x), y: clampY(y) };
  pz.measure();
}

export function release(g: PinnGame) {
  g.pz.drag = null;
  checkSolved(g);
}

/** Letar upp det bästa draget för en av de trassligaste pinnarna. null om inget drag hjälper. */
export function bestNudge(pz: PinnKnut): { peg: number; to: Pt; cross: number } | null {
  const { pegs, edges } = pz;
  const score = pegs.map(() => 0);
  pz.bad.forEach((e) => { score[edges[e][0]]++; score[edges[e][1]]++; });
  const worst = [...pegs.keys()].filter((i) => score[i] > 0).sort((a, b) => score[b] - score[a]).slice(0, 4);
  let best: { peg: number; to: Pt; cross: number; dist: number } | null = null;
  const N = 22;
  for (const i of worst) {
    const keep = pegs[i];
    for (let gy = 0; gy <= N; gy++) for (let gx = 0; gx <= N; gx++) {
      const to = { x: Math.round(AREA.x0 + ((AREA.x1 - AREA.x0) * gx) / N), y: Math.round(AREA.y0 + ((AREA.y1 - AREA.y0) * gy) / N) };
      if (pegs.some((p, k) => k !== i && Math.hypot(p.x - to.x, p.y - to.y) < PEG_R * 2.2)) continue;
      pegs[i] = to;
      const n = crossings(pegs, edges).n;
      const dist = Math.hypot(to.x - keep.x, to.y - keep.y);
      if (!best || n < best.cross || (n === best.cross && dist < best.dist)) best = { peg: i, to, cross: n, dist };
    }
    pegs[i] = keep;
  }
  return best && best.cross < pz.cross ? { peg: best.peg, to: best.to, cross: best.cross } : null;
}
