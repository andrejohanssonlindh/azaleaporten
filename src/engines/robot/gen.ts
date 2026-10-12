import type { Rng } from '../../platform/rng';
import type { Atom, Cmd, Dir, Fill, Loop, Palette, Pos, Prog, Spot, World } from './types';
import {
  atomsOf, blockAt, firstOnly, ids, inside, isLoop, key, loopCounts, loopOnce, replaceAt, run, samePos, size, solve, solves,
  stepOff, swapLR, turnMoves, hasAtom,
} from './world';

// Världar och program till robotfrågorna. Allt dras med frågans slump, så samma frö ger samma fråga.

const cell = (rng: Rng, w: number, h: number): Pos => [rng.int(w), rng.int(h)];
const dir4 = (rng: Rng) => rng.int(4) as Dir;

export interface PuzzleOpts {
  w: number;
  h: number;
  palette: Palette;
  /** Lösningens längd i block (utan loopar): [minst, högst]. */
  len: [number, number];
  rocks?: [number, number];
  gems?: number;
  /** Stenarna ska spela roll: utan dem finns en kortare väg. */
  rocksMatter?: boolean;
}

/** En värld med batteri (och kanske stenar och diamanter) och den kortaste lösningen. */
export function puzzle(rng: Rng, o: PuzzleOpts): { world: World; sol: Prog } {
  for (let tries = 0; tries < 400; tries++) {
    const start = cell(rng, o.w, o.h);
    const goal = cell(rng, o.w, o.h);
    if (samePos(start, goal)) continue;
    const taken = new Set([key(start), key(goal)]);
    const nRocks = o.rocks ? o.rocks[0] + rng.int(o.rocks[1] - o.rocks[0] + 1) : 0;
    const rocks: Pos[] = [];
    while (rocks.length < nRocks) { const p = cell(rng, o.w, o.h); if (!taken.has(key(p))) { taken.add(key(p)); rocks.push(p); } }
    const gems: Pos[] = [];
    while (gems.length < (o.gems ?? 0)) { const p = cell(rng, o.w, o.h); if (!taken.has(key(p))) { taken.add(key(p)); gems.push(p); } }
    const world: World = { w: o.w, h: o.h, start, dir: o.palette === 'svang' ? dir4(rng) : 1, goal, rocks, gems };
    const sol = solve(world, o.palette);
    if (!sol || sol.length < o.len[0] || sol.length > o.len[1]) continue;
    if (o.rocksMatter && rocks.length) {
      const open = solve({ ...world, rocks: [] }, o.palette);
      if (open && open.length >= sol.length) continue;
    }
    return { world, sol };
  }
  // Reserv (händer i praktiken inte): rakt åt höger.
  const world: World = { w: o.w, h: o.h, start: [0, 0], dir: 1, goal: [3, 0], rocks: [], gems: [] };
  return { world, sol: solve(world, o.palette)! };
}

/** Kör ett mönster (t.ex. [F H F V]×3) från en slumpad start i en tom värld. Batteriet hamnar där mönstret slutar. */
export function patternWorld(rng: Rng, w: number, h: number, prog: Prog, palette: Palette, gemsOnPath = 0): World | null {
  for (let tries = 0; tries < 200; tries++) {
    const world: World = { w, h, start: cell(rng, w, h), dir: palette === 'svang' ? dir4(rng) : 1, rocks: [], gems: [] };
    const t = run(world, prog);
    if (t.crash || samePos(t.end, world.start)) continue;
    // Varje ruta på vägen en gång (annars blir det rörigt att följa).
    const seen = new Set(t.states.map((s) => `${s.x},${s.y}`));
    const moves = t.states.filter((s, i) => i > 0 && (s.x !== t.states[i - 1].x || s.y !== t.states[i - 1].y)).length;
    if (seen.size !== moves + 1) continue;
    const path = [...seen].slice(1, -1).map((s) => s.split(',').map(Number) as Pos);
    const gems = rng.shuffle(path).slice(0, gemsOnPath);
    return { ...world, goal: t.end, gems };
  }
  return null;
}

/** Stenar som inte ligger på vägen (pynt, och de gör genvägar omöjliga). */
export function addRocks(rng: Rng, world: World, n: number, avoid: Prog): World {
  const path = new Set(run(world, avoid).states.map((s) => `${s.x},${s.y}`));
  const rocks: Pos[] = [...world.rocks];
  for (let tries = 0; tries < 60 && rocks.length < world.rocks.length + n; tries++) {
    const p = cell(rng, world.w, world.h);
    if (path.has(key(p)) || rocks.some((r) => samePos(r, p)) || (world.goal && samePos(world.goal, p))) continue;
    rocks.push(p);
  }
  return { ...world, rocks };
}

// ---------- vart: var hamnar roboten? ----------

/** Missuppfattningar som ger en annan slutruta. Ordningen avgör vilken felkod en ruta får om flera ger samma. */
export function wrongEnds(world: World, prog: Prog): { at: Pos; err: string }[] {
  const out: { at: Pos; err: string }[] = [];
  const add = (p: Prog, err: string) => { const t = run(world, p); out.push({ at: t.end, err }); };
  if (hasAtom(prog, (a) => a === 'V' || a === 'H')) { add(swapLR(prog), 'vanster-hoger'); add(turnMoves(prog), 'svang-flyttar'); }
  if (prog.some(isLoop)) {
    add(firstOnly(prog), 'bara-forsta');
    for (const p of [...loopCounts(prog, 1), ...loopCounts(prog, -1)]) add(p, 'loop-antal');
    add(loopOnce(prog), 'loop-en-gang');
  }
  const { fewer, more } = stepOff(prog);
  for (const p of [...more, ...fewer]) add(p, 'ett-steg');
  return out;
}

/**
 * Rutorna A–D: rätt ruta och upp till tre fel (från missuppfattningar, fällan först).
 * null om programmet inte ger en bra fråga (för få olika fel, eller fällan ger ingen egen ruta).
 */
export function vartSpots(rng: Rng, world: World, prog: Prog, trap?: string): Spot[] | null {
  const t = run(world, prog);
  if (t.crash || t.tooLong) return null;
  const right = t.end;
  const seen = new Set([key(right)]);
  const wrong: Spot[] = [];
  const cands = wrongEnds(world, prog).filter((c) => inside(world, c.at));
  const ordered = [...cands.filter((c) => c.err === trap), ...rng.shuffle(cands.filter((c) => c.err !== trap))];
  for (const c of ordered) {
    if (seen.has(key(c.at)) || wrong.length >= 3) continue;
    seen.add(key(c.at));
    wrong.push(c);
  }
  if (trap && !wrong.some((s) => s.err === trap)) return null;
  // För lite fel: grannrutor till rätt ruta.
  for (const [dx, dy] of rng.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)) {
    if (wrong.length >= 2) break;
    const p: Pos = [right[0] + dx, right[1] + dy];
    if (inside(world, p) && !seen.has(key(p)) && !samePos(p, world.start)) { seen.add(key(p)); wrong.push({ at: p, err: 'fel-ruta' }); }
  }
  if (wrong.length < 2) return null;
  return rng.shuffle([{ at: right }, ...wrong]);
}

/** Ett slumpat program med pilar eller svängar som inte krockar och inte slutar där det började. */
export function randomProg(rng: Rng, world: World, palette: Palette, len: [number, number], turns = 1): Prog | null {
  for (let tries = 0; tries < 200; tries++) {
    const n = len[0] + rng.int(len[1] - len[0] + 1);
    const prog: Atom[] = [];
    if (palette === 'pilar') {
      // Raka sträckor: samma pil 1–3 gånger, sedan en ny riktning.
      while (prog.length < n) {
        const a = rng.pick(atomsOf('pilar').filter((x) => x !== prog[prog.length - 1]));
        for (let k = 1 + rng.int(3); k > 0 && prog.length < n; k--) prog.push(a);
      }
    } else {
      while (prog.length < n) {
        const last = prog[prog.length - 1];
        // Aldrig två svängar i rad, och aldrig en sväng sist.
        if (last && last !== 'F' || prog.length === n - 1) prog.push('F');
        else prog.push(rng.next() < 0.4 ? rng.pick(['V', 'H'] as Atom[]) : 'F');
      }
      if (prog.filter((a) => a !== 'F').length < turns) continue;
    }
    const t = run(world, prog);
    if (t.crash || samePos(t.end, world.start)) continue;
    return prog;
  }
  return null;
}

// ---------- bugg: hitta felet ----------

/** Alla sätt att ändra ett enda block (byta, ta bort, ändra varv). */
function edits(prog: Prog, id: string, palette: Palette): Prog[] {
  const c = blockAt(prog, id);
  const out: Prog[] = [replaceAt(prog, id, null)];
  if (isLoop(c)) for (let r = 1; r <= 9; r++) { if (r !== c.rep) out.push(replaceAt(prog, id, { rep: r, body: c.body })); }
  else for (const a of atomsOf(palette)) if (a !== c) out.push(replaceAt(prog, id, a));
  return out;
}

/** Blocken där en enda ändring får roboten fram. */
export const fixable = (world: World, prog: Prog, palette: Palette) =>
  ids(prog).filter((id) => edits(prog, id, palette).some((p) => solves(world, p)));

/** Lägger in ett fel i ett fungerande program. early = felet ligger i första halvan (och syns först senare). */
export function injectBug(rng: Rng, world: World, sol: Prog, palette: Palette, early = false): { prog: Prog; bug: string } | null {
  const all = ids(sol);
  const cands = early ? all.slice(0, Math.max(1, Math.floor(all.length / 2))) : all;
  for (const id of rng.shuffle(cands)) {
    const c = blockAt(sol, id);
    const options: Cmd[] = isLoop(c)
      ? [c.rep + 1, c.rep - 1].filter((r) => r >= 2).map((r): Loop => ({ rep: r, body: c.body }))
      : c === 'V' ? ['H'] : c === 'H' ? ['V'] : atomsOf(palette).filter((a) => a !== c);
    for (const by of rng.shuffle(options)) {
      const prog = replaceAt(sol, id, by);
      if (!solves(world, prog) && !run(world, prog).tooLong) return { prog, bug: id };
    }
  }
  return null;
}

// ---------- lucka: välj det som fattas ----------

export function luckaFills(world: World, prog: Prog, hole: string, palette: Palette): Fill[] | null {
  const c = blockAt(prog, hole);
  if (isLoop(c)) {
    const nums = [c.rep - 1, c.rep, c.rep + 1, c.rep + 2].filter((n) => n >= 1);
    const fills = nums.map((n): Fill => (n === c.rep ? { fill: n } : { fill: n, err: Math.abs(n - c.rep) === 1 ? 'loop-antal' : 'fel-block' }));
    if (fills.filter((f) => solves(world, replaceAt(prog, hole, { rep: f.fill as number, body: c.body }))).length !== 1) return null;
    return fills.slice(0, 4);
  }
  const swapped: Partial<Record<Atom, Atom>> = { V: 'H', H: 'V', L: 'R', R: 'L' };
  const fills = atomsOf(palette).map((a): Fill => (a === c ? { fill: a } : { fill: a, err: swapped[c] === a ? 'vanster-hoger' : 'fel-block' }));
  if (fills.filter((f) => solves(world, replaceAt(prog, hole, f.fill as Atom))).length !== 1) return null;
  return fills;
}

export { size };
