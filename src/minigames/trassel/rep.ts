import type { Rng } from '../../platform/rng';
import type { KnutLoadout } from '../../platform/rpg/trassel';
import { AREA, checkSolved, ev, newStrid, segCross, segDist, type Game, type Pt, type Pussel } from './strid';

// Repknutar: färgade rep med ändarna instuckna i hål på en bräda. Repen ligger i lager, och barnet får
// bara lyfta ett rep som inget annat rep ligger ovanpå. Ett rep man flyttar läggs alltid överst.
// Knuten är löst när inga rep rör varandra (korsar, eller ligger över ett annat reps ände).
//
// Varje knut byggs baklänges från ett löst läge, med steg som är exakta motsatser till riktiga drag:
// topprepet flyttar en ände och trycks ner så långt det går utan att något hamnar ovanpå det. Därför
// går varje knut att lösa, på högst så många drag som stegen (par). Spindeln gör samma sorts steg.

export const PIN_R = 30;
/** Hur nära (enheter) ett tryck måste vara en repände. */
export const TAP_PIN = 80;
export const FARGER = ['#e03131', '#1c7ed6', '#fcc419', '#2f9e44', '#9c36b5', '#f76707', '#e64980', '#15aabf', '#f1f3f5'];
export const FARGNAMN = ['röda', 'blå', 'gula', 'gröna', 'lila', 'orange', 'rosa', 'turkosa', 'vita'];

export interface Rep {
  /** Hålen som ändarna sitter i. */
  a: number;
  b: number;
  /** Lager: högre ligger ovanpå. */
  z: number;
  farg: number;
}
export type End = 0 | 1;
/** Ett drag: flytta repets ände till hålet `to`. */
export interface Drag { rep: number; end: End; to: number }

/** Antal rep, hålens rutnät och antal trasselsteg för knut l. */
export function repFor(l: number): { reps: number; cols: number; rows: number; steg: number } {
  const reps = Math.min(9, 2 + Math.floor(l / 2));
  const [cols, rows] = reps <= 3 ? [3, 4] : reps <= 5 ? [4, 5] : reps <= 7 ? [5, 6] : [5, 7];
  return { reps, cols, rows, steg: reps + Math.ceil(l / 2) };
}

export function holesFor(cols: number, rows: number): Pt[] {
  const sx = (AREA.x1 - AREA.x0) / cols, sy = (AREA.y1 - AREA.y0) / rows;
  const out: Pt[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: Math.round(AREA.x0 + sx * (c + 0.5)), y: Math.round(AREA.y0 + sy * (r + 0.5)) });
  return out;
}

export class RepKnut implements Pussel {
  hjalp = 'Flytta repändarna tills inga rep ligger över varandra. Bara det översta repet går att lyfta!';
  level: number;
  cols: number;
  rows: number;
  holes: Pt[];
  reps: Rep[];
  /** Repänden som barnet håller i. */
  held: { rep: number; end: End } | null = null;
  moves = 0;
  /** Så många drag räcker (antal trasselsteg). */
  par = 0;
  /** Ett sätt att lösa knuten som den byggdes (för tester). */
  losning: Drag[] = [];
  cross = 0;
  /** Rep som inte rör något annat rep. */
  fria = new Set<number>();

  constructor(level: number, cols: number, rows: number, reps: Rep[]) {
    this.level = level;
    this.cols = cols;
    this.rows = rows;
    this.holes = holesFor(cols, rows);
    this.reps = reps;
    this.measure();
  }

  end(i: number, e: End): Pt { return this.holes[e ? this.reps[i].b : this.reps[i].a]; }
  hole(i: number, e: End) { return e ? this.reps[i].b : this.reps[i].a; }
  private setHole(i: number, e: End, h: number) { if (e) this.reps[i].b = h; else this.reps[i].a = h; }
  used(): Set<number> { return new Set(this.reps.flatMap((r) => [r.a, r.b])); }
  freeHoles(): number[] { const u = this.used(); return [...this.holes.keys()].filter((h) => !u.has(h)); }

  /** Rör rep i och j varandra: korsar de, eller ligger det ena över det andras ände? */
  touch(i: number, j: number): boolean {
    const a0 = this.end(i, 0), a1 = this.end(i, 1), b0 = this.end(j, 0), b1 = this.end(j, 1);
    if (segCross(a0, a1, b0, b1)) return true;
    return segDist(b0, a0, a1) < PIN_R || segDist(b1, a0, a1) < PIN_R || segDist(a0, b0, b1) < PIN_R || segDist(a1, b0, b1) < PIN_R;
  }

  touching(i: number): number[] { return [...this.reps.keys()].filter((j) => j !== i && this.touch(i, j)); }

  measure() {
    let n = 0;
    const fria = new Set(this.reps.keys());
    for (let i = 0; i < this.reps.length; i++) for (let j = i + 1; j < this.reps.length; j++) {
      if (this.touch(i, j)) { n++; fria.delete(i); fria.delete(j); }
    }
    this.cross = n;
    this.fria = fria;
  }

  /** Ligger något rep ovanpå rep i? */
  covered(i: number): boolean { return this.touching(i).some((j) => this.reps[j].z > this.reps[i].z); }

  topp(): number {
    let best = 0;
    this.reps.forEach((r, i) => { if (r.z > this.reps[best].z) best = i; });
    return best;
  }

  /** Lagren numreras om till 0, 1, 2 … i samma ordning. */
  private renumber() {
    [...this.reps.keys()].sort((a, b) => this.reps[a].z - this.reps[b].z).forEach((i, k) => { this.reps[i].z = k; });
  }

  /** Ett riktigt drag: lyft repet (om inget ligger ovanpå), flytta änden och lägg repet överst. */
  flytta(d: Drag): boolean {
    if (this.covered(d.rep) || this.used().has(d.to)) return false;
    this.setHole(d.rep, d.end, d.to);
    this.reps[d.rep].z = this.reps.length;
    this.renumber();
    this.moves++;
    this.measure();
    return true;
  }

  /** Ett trasselsteg baklänges: topprepet flyttar en ände och trycks ner under allt det nu rör.
   *  Returnerar draget som tar tillbaka det. */
  bakat(rng: Rng, onlyEnd?: End, avoid?: number): Drag | null {
    const i = this.topp();
    const free = this.freeHoles();
    const cands: { end: End; to: number; t: number }[] = [];
    for (const end of onlyEnd === undefined ? ([0, 1] as End[]) : [onlyEnd]) {
      const from = this.hole(i, end);
      for (const to of free) {
        if (to === avoid) continue;
        this.setHole(i, end, to);
        cands.push({ end, to, t: this.touching(i).length });
        this.setHole(i, end, from);
      }
    }
    if (!cands.length) return null;
    const tangled = cands.filter((c) => c.t > 0);
    const most = Math.max(0, ...tangled.map((c) => c.t));
    const pool = tangled.length ? (rng.next() < 0.6 ? tangled.filter((c) => c.t === most) : tangled) : cands;
    const c = rng.pick(pool);
    const back: Drag = { rep: i, end: c.end, to: this.hole(i, c.end) };
    this.setHole(i, c.end, c.to);
    const under = this.touching(i).map((j) => this.reps[j].z);
    this.reps[i].z = (under.length ? Math.max(...under) : -1) + 0.5;
    this.renumber();
    this.measure();
    return back;
  }

  /* ---------- Pussel ---------- */

  kvar() { return this.cross; }
  haller() { return this.held !== null; }
  slapp() { this.held = null; }
  bonus() { return this.moves <= this.par ? 1 + Math.floor(this.level / 3) : 0; }

  /** Spindeln kryper mot en ände av det översta repet. */
  spindelMal(mal: number) { return this.end(this.topp(), (mal % 2) as End); }

  trassla(mal: number, rng: Rng) {
    if (this.held) return false;
    if (!this.bakat(rng, (mal % 2) as End)) return false;
    this.par++;
    return true;
  }

  /** Det bästa draget just nu: färre rep som rör varandra. */
  bestDrag(): Drag | null {
    const now = this.cross, free = this.freeHoles();
    let best: Drag | null = null, bestN = now;
    for (let i = 0; i < this.reps.length; i++) {
      if (this.covered(i)) continue;
      for (const end of [0, 1] as End[]) {
        const from = this.hole(i, end);
        for (const to of free) {
          this.setHole(i, end, to);
          this.measure();
          if (this.cross < bestN) { bestN = this.cross; best = { rep: i, end, to }; }
          this.setHole(i, end, from);
        }
      }
    }
    this.measure();
    return best;
  }

  knuff() {
    const d = this.bestDrag();
    if (!d || !this.flytta(d)) return null;
    return d.rep;
  }

  /** Repänden närmast ett tryck, eller null. */
  pinAt(x: number, y: number): { rep: number; end: End } | null {
    let best: { rep: number; end: End } | null = null, bd = TAP_PIN;
    this.reps.forEach((_, i) => {
      for (const end of [0, 1] as End[]) {
        const p = this.end(i, end), d = Math.hypot(p.x - x, p.y - y);
        if (d < bd) { bd = d; best = { rep: i, end }; }
      }
    });
    return best;
  }

  /** Hålet närmast ett tryck, eller null. */
  holeAt(x: number, y: number): number | null {
    const reach = Math.min((AREA.x1 - AREA.x0) / this.cols, (AREA.y1 - AREA.y0) / this.rows) * 0.5;
    let best: number | null = null, bd = reach;
    this.holes.forEach((p, h) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = h; }
    });
    return best;
  }
}

/** Ett löst läge: korta rep mellan närliggande hål som inte rör varandra, i slumpad lagerordning. */
function tidy(l: number, rng: Rng): RepKnut {
  const { reps: n, cols, rows } = repFor(l);
  const steps = [[1, 0], [0, 1], [1, 1], [1, -1], [2, 0], [0, 2], [2, 1], [1, 2]];
  for (let tries = 0; ; tries++) {
    const pz = new RepKnut(l, cols, rows, []);
    for (let k = 0; k < n; k++) {
      const used = pz.used();
      const cands: [number, number][] = [];
      for (let h = 0; h < cols * rows; h++) {
        if (used.has(h)) continue;
        const c = h % cols, r = Math.floor(h / cols);
        for (const [dx, dy] of steps) {
          const c2 = c + dx, r2 = r + dy;
          if (c2 < 0 || c2 >= cols || r2 < 0 || r2 >= rows || used.has(r2 * cols + c2)) continue;
          cands.push([h, r2 * cols + c2]);
        }
      }
      const ok = rng.shuffle(cands).find(([a, b]) => {
        pz.reps.push({ a, b, z: k, farg: k });
        const free = pz.touching(pz.reps.length - 1).length === 0;
        pz.reps.pop();
        return free;
      });
      if (!ok) break;
      pz.reps.push({ a: ok[0], b: ok[1], z: k, farg: k });
    }
    if (pz.reps.length === n || tries > 50) {
      const order = rng.shuffle([...pz.reps.keys()]);
      order.forEach((i, z) => { pz.reps[i].z = z; });
      pz.measure();
      return pz;
    }
  }
}

/** Bygger repknut nummer l: ett löst läge som trasslas till baklänges. */
export function makeRep(l: number, rng: Rng): RepKnut {
  const pz = tidy(l, rng);
  const { steg } = repFor(l);
  let last: number | undefined;
  for (let k = 0; (k < steg || pz.cross === 0) && k < steg * 3; k++) {
    const d = pz.bakat(rng, undefined, last);
    if (!d) break;
    last = d.to;
    pz.losning.unshift(d);
  }
  pz.par = pz.losning.length;
  pz.moves = 0;
  return pz;
}

export type RepGame = Game<RepKnut>;

export const newRepGame = (lo: KnutLoadout, seed: number, startLevel = 1, skatt = false): RepGame =>
  newStrid(lo, seed, makeRep, startLevel, skatt);

/** Barnet tar tag i en repände. Ligger något ovanpå går det inte. */
export function lyft(g: RepGame, rep: number, end: End): boolean {
  const pz = g.pz;
  if (g.phase !== 'play') return false;
  if (pz.covered(rep)) {
    const p = pz.end(rep, end);
    ev(g, { kind: 'text', x: p.x, y: p.y - 50, text: '🔒' });
    g.msg = `Det ${FARGNAMN[pz.reps[rep].farg]} repet ligger under ett annat rep. Flytta det som ligger ovanpå först!`;
    return false;
  }
  pz.held = { rep, end };
  return true;
}

/** Barnet släpper änden i ett hål (eller utanför, då hamnar den där den var). */
export function lagg(g: RepGame, hole: number | null): boolean {
  const pz = g.pz, h = pz.held;
  pz.held = null;
  if (!h || hole === null || g.phase !== 'play') return false;
  const ok = pz.flytta({ rep: h.rep, end: h.end, to: hole });
  if (ok) g.msg = pz.cross ? `${pz.cross} kvar att reda ut.` : g.msg;
  checkSolved(g);
  return ok;
}
