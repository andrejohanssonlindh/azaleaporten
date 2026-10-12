import type { Arrow, Atom, Cmd, Dir, Loop, Palette, Pos, Prog, World } from './types';

// Robotens värld: köra ett program, räkna block, ge blocken id:n och göra små ändringar i ett program.
// Allt är rena funktioner, så att rättning och felsökning bara är att köra programmet.

export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;
export const ARROW_DIR: Record<Arrow, Dir> = { U: 0, R: 1, D: 2, L: 3 };
export const ARROWS: Arrow[] = ['U', 'R', 'D', 'L'];
export const TURNS: Atom[] = ['F', 'V', 'H'];
export const atomsOf = (p: Palette): Atom[] => (p === 'pilar' ? ARROWS : TURNS);

export const isLoop = (c: Cmd): c is Loop => typeof c === 'object';
export const samePos = (a: Pos, b: Pos) => a[0] === b[0] && a[1] === b[1];
export const key = (p: Pos) => `${p[0]},${p[1]}`;
export const inside = (w: World, p: Pos) => p[0] >= 0 && p[1] >= 0 && p[0] < w.w && p[1] < w.h;
export const isRock = (w: World, p: Pos) => w.rocks.some((r) => samePos(r, p));
export const free = (w: World, p: Pos) => inside(w, p) && !isRock(w, p);

/** Ett läge i körningen: var roboten står, vart den tittar, och vilket block som just kördes. */
export interface State { x: number; y: number; dir: Dir; block?: string }

export interface Trace {
  /** Läget före första blocket, och efter varje block. */
  states: State[];
  /** Rutan roboten försökte köra in i (en sten eller kanten). */
  crash?: Pos;
  /** Diamanterna som plockades, i ordning. */
  gems: Pos[];
  end: Pos;
  dir: Dir;
  /** Programmet tog slut på steg (en jättelång loop). */
  tooLong?: boolean;
}

/** Högst så här många rörelser per körning (skyddar mot loopar i loopar i loopar). */
const MAX_STEPS = 400;

/** Kör programmet. Id:t för ett block är dess plats: '2' = tredje blocket, '2.0' = första blocket i loopen där. */
export function run(w: World, prog: Prog): Trace {
  let x = w.start[0], y = w.start[1], dir: Dir = w.dir;
  const states: State[] = [{ x, y, dir }];
  const gems: Pos[] = [];
  let crash: Pos | undefined, steps = 0, tooLong = false;
  const pick = () => {
    const g = w.gems.find((p) => p[0] === x && p[1] === y);
    if (g && !gems.includes(g)) gems.push(g);
  };
  const exec = (cmds: Prog, prefix: string): boolean => {
    for (let i = 0; i < cmds.length; i++) {
      const c = cmds[i], id = `${prefix}${i}`;
      if (isLoop(c)) {
        for (let k = 0; k < c.rep; k++) if (!exec(c.body, `${id}.`)) return false;
        continue;
      }
      if (++steps > MAX_STEPS) { tooLong = true; return false; }
      if (c === 'V') dir = ((dir + 3) % 4) as Dir;
      else if (c === 'H') dir = ((dir + 1) % 4) as Dir;
      else {
        const d = c === 'F' ? dir : ARROW_DIR[c];
        if (c !== 'F') dir = d;
        const nx = x + DX[d], ny = y + DY[d];
        if (!free(w, [nx, ny])) { crash = [nx, ny]; states.push({ x, y, dir, block: id }); return false; }
        x = nx; y = ny;
        pick();
      }
      states.push({ x, y, dir, block: id });
    }
    return true;
  };
  exec(prog, '');
  return { states, crash, gems, end: [x, y], dir, tooLong };
}

/** Kom roboten fram: ingen krock, alla diamanter, och står på batteriet. */
export const solves = (w: World, prog: Prog, t: Trace = run(w, prog)) =>
  !t.crash && !t.tooLong && !!w.goal && samePos(t.end, w.goal) && t.gems.length === w.gems.length;

/** Antal block (en loop är ett block plus det som står i den). */
export const size = (prog: Prog): number => prog.reduce((n, c) => n + (isLoop(c) ? 1 + size(c.body) : 1), 0);

/** Alla block-id:n i den ordning de står. */
export function ids(prog: Prog, prefix = ''): string[] {
  return prog.flatMap((c, i) => (isLoop(c) ? [`${prefix}${i}`, ...ids(c.body, `${prefix}${i}.`)] : [`${prefix}${i}`]));
}

export function blockAt(prog: Prog, id: string): Cmd {
  const path = id.split('.').map(Number);
  let list = prog, c: Cmd = prog[path[0]];
  for (const i of path) { c = list[i]; if (isLoop(c)) list = c.body; }
  return c;
}

/** Byter ut blocket på platsen id (null = tar bort det). */
export function replaceAt(prog: Prog, id: string, by: Cmd | null): Prog {
  const [head, ...rest] = id.split('.').map(Number);
  return prog.flatMap((c, i) => {
    if (i !== head) return [c];
    if (rest.length === 0) return by == null ? [] : [by];
    const l = c as Loop;
    return [{ rep: l.rep, body: replaceAt(l.body, rest.join('.'), by) }];
  });
}

/** Byter varje atom med f (behåller looparna). */
export const mapAtoms = (prog: Prog, f: (a: Atom) => Atom): Prog =>
  prog.map((c) => (isLoop(c) ? { rep: c.rep, body: mapAtoms(c.body, f) } : f(c)));

const SWAP: Partial<Record<Atom, Atom>> = { V: 'H', H: 'V', L: 'R', R: 'L' };
/** Vänster och höger bytta (det vanligaste felet: robotens vänster är inte alltid din vänster). */
export const swapLR = (prog: Prog) => mapAtoms(prog, (a) => SWAP[a] ?? a);
export const hasAtom = (prog: Prog, test: (a: Atom) => boolean): boolean => prog.some((c) => (isLoop(c) ? hasAtom(c.body, test) : test(c)));

/** Programmet med varje loop ändrad med d varv (en i taget). */
export function loopCounts(prog: Prog, d: number): Prog[] {
  return ids(prog).filter((id) => isLoop(blockAt(prog, id))).flatMap((id) => {
    const l = blockAt(prog, id) as Loop;
    return l.rep + d >= 1 ? [replaceAt(prog, id, { rep: l.rep + d, body: l.body })] : [];
  });
}

/** Missuppfattningen att bara loopens första block upprepas: [a b c]×n blir a×n, b, c. */
export function firstOnly(prog: Prog): Prog {
  return prog.flatMap((c) => {
    if (!isLoop(c)) return [c];
    const [a, ...rest] = firstOnly(c.body);
    return a === undefined ? [] : [{ rep: c.rep, body: [a] }, ...rest];
  });
}

/** Missuppfattningen att loopen bara körs en gång. */
export const loopOnce = (prog: Prog): Prog => prog.flatMap((c) => (isLoop(c) ? loopOnce(c.body) : [c]));

/** Missuppfattningen att en sväng också flyttar roboten ett steg. */
export const turnMoves = (prog: Prog): Prog =>
  prog.flatMap((c): Cmd[] => (isLoop(c) ? [{ rep: c.rep, body: turnMoves(c.body) }] : c === 'V' || c === 'H' ? [c, 'F'] : [c]));

/** Lägger in blocket by direkt efter blocket på platsen id (på samma nivå). */
export function insertAfter(prog: Prog, id: string, by: Cmd): Prog {
  const [head, ...rest] = id.split('.').map(Number);
  return prog.flatMap((c, i) => {
    if (i !== head) return [c];
    if (rest.length === 0) return [c, by];
    const l = c as Loop;
    return [{ rep: l.rep, body: insertAfter(l.body, rest.join('.'), by) }];
  });
}

/** Programmet med ett rörelseblock borttaget eller dubblerat (ett steg för lite eller för mycket). Bara block utanför loopar. */
export function stepOff(prog: Prog): { fewer: Prog[]; more: Prog[] } {
  const moves = ids(prog).filter((id) => { const c = blockAt(prog, id); return !id.includes('.') && !isLoop(c) && c !== 'V' && c !== 'H'; });
  return {
    fewer: moves.map((id) => replaceAt(prog, id, null)),
    more: moves.map((id) => insertAfter(prog, id, blockAt(prog, id))),
  };
}

/** Kortaste programmet (i block, utan loopar) för paletten, genom alla diamanter till batteriet. */
export function solve(w: World, palette: Palette): Prog | null {
  if (!w.goal) return null;
  const gemIdx = (x: number, y: number) => w.gems.findIndex((g) => g[0] === x && g[1] === y);
  const all = (1 << w.gems.length) - 1;
  type N = { x: number; y: number; dir: Dir; m: number };
  const k = (n: N) => `${n.x},${n.y},${palette === 'svang' ? n.dir : 0},${n.m}`;
  const startM = (() => { const i = gemIdx(w.start[0], w.start[1]); return i >= 0 ? 1 << i : 0; })();
  const start: N = { x: w.start[0], y: w.start[1], dir: w.dir, m: startM };
  const prev = new Map<string, [string, Atom] | null>([[k(start), null]]);
  const nodes = new Map<string, N>([[k(start), start]]);
  const queue: N[] = [start];
  while (queue.length) {
    const n = queue.shift()!;
    if (n.x === w.goal[0] && n.y === w.goal[1] && n.m === all) {
      const out: Atom[] = [];
      let at: string | undefined = k(n);
      while (at && prev.get(at)) { const [from, a]: [string, Atom] = prev.get(at)!; out.unshift(a); at = from; }
      return out;
    }
    for (const a of atomsOf(palette)) {
      let { x, y, dir } = n, m = n.m;
      if (a === 'V') dir = ((dir + 3) % 4) as Dir;
      else if (a === 'H') dir = ((dir + 1) % 4) as Dir;
      else {
        const d = a === 'F' ? dir : ARROW_DIR[a as Arrow];
        x += DX[d]; y += DY[d];
        if (!free(w, [x, y])) continue;
        const gi = gemIdx(x, y);
        if (gi >= 0) m |= 1 << gi;
      }
      const nn = { x, y, dir, m };
      if (prev.has(k(nn))) continue;
      prev.set(k(nn), [k(n), a]);
      nodes.set(k(nn), nn);
      queue.push(nn);
    }
  }
  return null;
}

/** Drar ihop upprepade block till loopar där det sparar block (a a a a → [a]×4). Används för att visa en lösning. */
export function compress(prog: Prog): Prog {
  const out: Prog = [];
  for (let i = 0; i < prog.length;) {
    const c = prog[i];
    let n = 1;
    while (!isLoop(c) && prog[i + n] === c) n++;
    if (n >= 3) out.push({ rep: n, body: [c] }); else out.push(...prog.slice(i, i + n));
    i += n;
  }
  return out;
}
