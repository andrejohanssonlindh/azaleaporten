import { rngFrom, type Rng } from '../../platform/rng';
import type { KnutLoadout } from '../../platform/rpg/trassel';

// Trasselvindens spelmotor: ren logik utan DOM. Knuten är en plan graf (pinnar och rep) som ritas
// ihoptrasslad; barnet drar pinnarna tills inga rep korsar varandra. Under tiden kryper monster in
// från kanterna: råttor och fladdermöss biter hjälten, spindlar rycker i en pinne så att det trasslar
// igen. Barnet trycker på monstren för att slå, med utrustningens siffror. Allt i enheter på en
// bräda BW × BH; repen ligger inom AREA och hjälten står på golvet nedanför.

export const BW = 1000;
export const BH = 1150;
export const AREA = { x0: 50, y0: 50, x1: 950, y1: 960 };
export const HERO = { x: 500, y: 1075 };
export const PEG_R = 28;
/** Var femte knut kommer Knuttrollet. */
export const BOSS_EVERY = 5;
/** Hur nära (enheter) ett tryck måste vara ett monster eller en pinne. */
export const TAP_MON = 90;
export const TAP_PEG = 75;

/* ---------- monster ---------- */

export type MonKind = 'ratta' | 'spindel' | 'fladder' | 'orm' | 'troll';

export const MONS: Record<MonKind, { name: string; icon: string; hp: number; speed: number; dmg: number; from: number; yank?: boolean; boss?: boolean }> = {
  ratta: { name: 'Vindsråttan', icon: '🐀', hp: 6, speed: 55, dmg: 3, from: 1 },
  spindel: { name: 'Trasselspindeln', icon: '🕷️', hp: 7, speed: 50, dmg: 0, from: 3, yank: true },
  fladder: { name: 'Fladdermusen', icon: '🦇', hp: 4, speed: 95, dmg: 2, from: 5 },
  orm: { name: 'Repormen', icon: '🐍', hp: 14, speed: 38, dmg: 5, from: 8 },
  troll: { name: 'Knuttrollet', icon: '🧌', hp: 40, speed: 24, dmg: 8, from: 99, boss: true },
};

export const levelScale = (l: number) => ({ hp: 1 + 0.12 * (l - 1), dmg: 1 + 0.06 * (l - 1) });
/** Sekunder mellan monstren: få i början, tätare för varje knut. */
export const spawnEvery = (l: number) => Math.max(4, 20 - 1.6 * (l - 1));
export const maxMons = (l: number) => Math.min(8, 2 + Math.floor(l / 2));
/** Azaleablad för en löst knut. */
export const knotBlad = (l: number) => 1 + Math.ceil(l / 2);
const BITE_EVERY = 1.2;
const BOOK_EVERY = 15;
const PET_EVERY = 5;
const EV_LIFE = 0.9;

export interface Mon {
  id: number;
  kind: MonKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  dmg: number;
  speed: number;
  /** Spindeln: pinnen den är på väg till. */
  peg: number;
  stun: number;
  /** Tid till nästa bett när monstret står vid hjälten. */
  bite: number;
  /** Fas för fladdermusens sicksack. */
  wob: number;
}

/* ---------- knuten ---------- */

export interface Pt { x: number; y: number }
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

const orient = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/** Korsar två rep varandra (inte i en gemensam pinne)? */
export function segCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const d1 = orient(c, d, a), d2 = orient(c, d, b), d3 = orient(a, b, c), d4 = orient(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
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

/* ---------- spelet ---------- */

export type Ev =
  | { id: number; kind: 'dmg'; x: number; y: number; n: number; crit: boolean; toHero: boolean; age: number }
  | { id: number; kind: 'text'; x: number; y: number; text: string; age: number }
  | { id: number; kind: 'zap'; age: number }
  | { id: number; kind: 'glow'; peg: number; age: number };

export type Phase = 'play' | 'solved' | 'dead';

export interface Game {
  lo: KnutLoadout;
  seed: number;
  rng: Rng;
  /** Knutens nummer (svårighet). */
  level: number;
  /** Första knuten i rundan. */
  startLevel: number;
  knot: Knot;
  /** Trassliga rep just nu. */
  bad: Set<number>;
  cross: number;
  mons: Mon[];
  hp: number;
  phase: Phase;
  /** Pinnen som barnet drar i just nu. */
  drag: number | null;
  /** Väntetid innan nästa slag. */
  cd: number;
  spawnT: number;
  /** Knuttrollets nedräkning på bossknutar (null = inget troll). */
  bossT: number | null;
  bookT: number;
  petT: number;
  hints: number;
  blad: number;
  kills: number;
  /** Lösta knutar i rundan. */
  solved: number;
  skatt: boolean;
  skatter: number;
  /** Visas i rutan när knuten är löst. */
  last: { blad: number; heal: number; skatt: boolean } | null;
  msg: string;
  evs: Ev[];
  nextId: number;
}

type NewEv = Ev extends infer E ? (E extends Ev ? Omit<E, 'id' | 'age'> : never) : never;

function ev(g: Game, e: NewEv) {
  g.evs.push({ ...e, id: g.nextId++, age: 0 } as Ev);
}

function setKnot(g: Game, l: number) {
  g.level = l;
  g.knot = makeKnot(l, rngFrom((g.seed ^ Math.imul(l, 0x9e3779b1)) >>> 0));
  g.mons = [];
  g.drag = null;
  g.spawnT = Math.min(10, spawnEvery(l));
  g.bossT = l % BOSS_EVERY === 0 ? 6 : null;
  g.phase = 'play';
  g.last = null;
  g.msg = l % BOSS_EVERY === 0 ? `Knut ${l}. Akta dig, Knuttrollet är på väg!` : `Knut ${l}. Dra pinnarna så att inga rep korsar varandra.`;
  measure(g);
}

export function newGame(lo: KnutLoadout, seed: number, startLevel = 1, skatt = false): Game {
  const g = {
    lo, seed, rng: rngFrom(seed), level: startLevel, startLevel, bad: new Set(), cross: 0, mons: [], hp: lo.maxHp,
    phase: 'play', drag: null, cd: 0, spawnT: 0, bossT: null, bookT: BOOK_EVERY, petT: PET_EVERY, hints: lo.hints,
    blad: 0, kills: 0, solved: 0, skatt, skatter: 0, last: null, msg: '', evs: [], nextId: 1,
  } as unknown as Game;
  setKnot(g, startLevel);
  return g;
}

function measure(g: Game) {
  const c = crossings(g.knot.pegs, g.knot.edges);
  g.cross = c.n;
  g.bad = c.bad;
}

/** Nästa knut, efter att den förra är löst. */
export function nextKnot(g: Game) {
  if (g.phase !== 'solved') return;
  setKnot(g, g.level + 1);
}

/* ---------- dra pinnar ---------- */

const clampX = (x: number) => Math.max(AREA.x0, Math.min(AREA.x1, x));
const clampY = (y: number) => Math.max(AREA.y0, Math.min(AREA.y1, y));

/** Närmaste pinne inom räckhåll, eller null. */
export function pegAt(g: Game, x: number, y: number): number | null {
  let best: number | null = null, bd = TAP_PEG;
  g.knot.pegs.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

export function grab(g: Game, i: number) {
  if (g.phase === 'play') g.drag = i;
}

export function moveDrag(g: Game, x: number, y: number) {
  if (g.drag === null || g.phase !== 'play') return;
  g.knot.pegs[g.drag] = { x: clampX(x), y: clampY(y) };
  measure(g);
}

export function release(g: Game) {
  g.drag = null;
  checkSolved(g);
}

function checkSolved(g: Game) {
  if (g.phase !== 'play' || g.drag !== null || g.cross > 0) return;
  g.phase = 'solved';
  g.solved++;
  const blad = knotBlad(g.level);
  const heal = Math.min(g.lo.heal, g.lo.maxHp - g.hp);
  g.blad += blad;
  g.hp += heal;
  const skatt = g.skatt && g.solved % 2 === 0 && g.skatter < 3;
  if (skatt) g.skatter++;
  for (const m of g.mons) ev(g, { kind: 'text', x: m.x, y: m.y, text: '💨' });
  g.mons = [];
  g.last = { blad, heal, skatt };
  g.msg = 'Knuten är löst!';
}

/* ---------- knuffen (ledtråd) ---------- */

/** Letar upp det bästa draget för en av de trassligaste pinnarna. null om inget drag hjälper. */
export function bestNudge(g: Game): { peg: number; to: Pt; cross: number } | null {
  const { pegs, edges } = g.knot;
  const score = pegs.map(() => 0);
  g.bad.forEach((e) => { score[edges[e][0]]++; score[edges[e][1]]++; });
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
  return best && best.cross < g.cross ? { peg: best.peg, to: best.to, cross: best.cross } : null;
}

/** Använder en knuff: flyttar en pinne dit den gör mest nytta. */
export function useHint(g: Game): boolean {
  if (g.phase !== 'play' || g.hints < 1 || g.drag !== null) return false;
  const b = bestNudge(g);
  if (!b) { g.msg = 'Ingen knuff hjälper just nu. Prova att flytta en röd pinne själv!'; return false; }
  g.hints--;
  g.knot.pegs[b.peg] = b.to;
  measure(g);
  ev(g, { kind: 'glow', peg: b.peg });
  g.msg = 'En klurig knuff! 💡';
  checkSolved(g);
  return true;
}

/* ---------- monster och strid ---------- */

function spawn(g: Game, kind?: MonKind) {
  const l = g.level;
  if (!kind) {
    const ok = (Object.keys(MONS) as MonKind[]).filter((k) => MONS[k].from <= l);
    kind = ok.includes('spindel') && g.rng.next() < 0.3 ? 'spindel' : g.rng.pick(ok.filter((k) => k !== 'spindel'));
  }
  const def = MONS[kind], sc = levelScale(l);
  const side = g.rng.int(3);
  const x = side === 0 ? -40 : side === 1 ? BW + 40 : 80 + g.rng.int(BW - 160);
  const y = side === 2 ? -40 : 60 + g.rng.int(700);
  const hp = Math.round(def.hp * sc.hp);
  g.mons.push({
    id: g.nextId++, kind, x, y, hp, maxHp: hp, dmg: Math.round(def.dmg * sc.dmg), speed: def.speed,
    peg: g.rng.int(g.knot.pegs.length), stun: 0, bite: 0.4, wob: g.rng.next() * 6,
  });
}

function kill(g: Game, m: Mon) {
  g.mons = g.mons.filter((x) => x !== m);
  g.kills++;
  const def = MONS[m.kind];
  if (def.boss) {
    const v = 3 + g.level;
    g.blad += v;
    ev(g, { kind: 'text', x: m.x, y: m.y - 40, text: `+${v} 🌸` });
    g.msg = `Du besegrade ${def.name}!`;
  } else if (g.rng.next() < g.lo.bladChance) {
    g.blad++;
    ev(g, { kind: 'text', x: m.x, y: m.y - 40, text: '+1 🌸' });
  }
}

function hit(g: Game, m: Mon, base: number, canCrit = true) {
  const crit = canCrit && g.rng.next() < g.lo.crit;
  const n = Math.max(1, Math.round(base * (0.85 + 0.3 * g.rng.next()) * (crit ? 2 : 1)));
  m.hp -= n;
  ev(g, { kind: 'dmg', x: m.x, y: m.y - 30, n, crit, toHero: false });
  if (m.hp <= 0) kill(g, m);
}

/** Närmaste monster inom räckhåll för ett tryck, eller null. */
export function monAt(g: Game, x: number, y: number): Mon | null {
  let best: Mon | null = null, bd = TAP_MON;
  for (const m of g.mons) {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

/** Barnet trycker på ett monster. Vapnet avgör vad slaget gör. false om slaget inte hann laddas. */
export function attack(g: Game, id: number): boolean {
  const m = g.mons.find((x) => x.id === id);
  if (!m || g.phase !== 'play' || g.cd > 0) return false;
  const lo = g.lo;
  g.cd = lo.cd;
  const others = g.mons.filter((x) => x !== m);
  hit(g, m, lo.dmg);
  if (lo.weapon === 'yxa') {
    for (const o of others) if (Math.hypot(o.x - m.x, o.y - m.y) < 170) hit(g, o, lo.dmg * 0.6, false);
  } else if (lo.weapon === 'stav') {
    const near = others.filter((o) => Math.hypot(o.x - m.x, o.y - m.y) < 450).sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0];
    if (near) hit(g, near, lo.dmg * 0.7, false);
  } else if (lo.weapon === 'hammare' && m.hp > 0) {
    m.stun = 1.5;
  }
  return true;
}

function hurtHero(g: Game, m: Mon) {
  if (g.rng.next() < g.lo.block) { ev(g, { kind: 'text', x: HERO.x, y: HERO.y - 90, text: '🛡️' }); return; }
  const n = Math.max(1, m.dmg - g.lo.armor);
  g.hp = Math.max(0, g.hp - n);
  ev(g, { kind: 'dmg', x: HERO.x, y: HERO.y - 90, n, crit: false, toHero: true });
  if (g.hp <= 0) {
    g.phase = 'dead';
    g.drag = null;
    g.msg = `${MONS[m.kind].name} fick dig på fall.`;
  }
}

/** Spindeln rycker loss pinnen och slänger den någon annanstans. */
function yank(g: Game, m: Mon) {
  const p = g.knot.pegs[m.peg];
  ev(g, { kind: 'text', x: p.x, y: p.y - 40, text: '🕸️ Trassel!' });
  g.knot.pegs[m.peg] = { x: AREA.x0 + g.rng.int(AREA.x1 - AREA.x0), y: AREA.y0 + g.rng.int(AREA.y1 - AREA.y0) };
  g.mons = g.mons.filter((x) => x !== m);
  g.msg = 'Spindeln ryckte i ett rep!';
  measure(g);
}

function moveMon(g: Game, m: Mon, dt: number) {
  if (m.stun > 0) { m.stun -= dt; return; }
  const def = MONS[m.kind];
  const target = def.yank ? g.knot.pegs[m.peg] : { x: HERO.x + (m.x < HERO.x ? -60 : 60), y: HERO.y - 50 };
  const dx = target.x - m.x, dy = target.y - m.y, d = Math.hypot(dx, dy);
  const reach = def.yank ? 20 : 40;
  if (d <= reach) {
    if (def.yank) { if (g.drag !== m.peg) yank(g, m); return; }
    m.bite -= dt;
    if (m.bite <= 0) { m.bite = BITE_EVERY; hurtHero(g, m); }
    return;
  }
  const step = Math.min(d - reach * 0.8, m.speed * g.lo.slow * dt);
  let nx = m.x + (dx / d) * step, ny = m.y + (dy / d) * step;
  if (m.kind === 'fladder') {
    m.wob += dt * 5;
    const side = Math.sin(m.wob) * 60 * dt;
    nx += (-dy / d) * side;
    ny += (dx / d) * side;
  }
  m.x = nx;
  m.y = ny;
}

/** Ett steg i tiden (sekunder). */
export function step(g: Game, dt: number) {
  for (const e of g.evs) e.age += dt;
  g.evs = g.evs.filter((e) => e.age < EV_LIFE);
  if (g.phase !== 'play') return;
  g.cd = Math.max(0, g.cd - dt);

  g.spawnT -= dt;
  if (g.spawnT <= 0) {
    g.spawnT = spawnEvery(g.level);
    if (g.mons.filter((m) => !MONS[m.kind].boss).length < maxMons(g.level)) spawn(g);
  }
  if (g.bossT !== null) {
    g.bossT -= dt;
    if (g.bossT <= 0) { g.bossT = null; spawn(g, 'troll'); g.msg = 'Knuttrollet klampar in!'; }
  }

  for (const m of [...g.mons]) {
    if (g.phase !== 'play') break;
    if (g.mons.includes(m)) moveMon(g, m, dt);
  }
  if (g.phase !== 'play') return;

  if (g.lo.off === 'trollbok' && g.mons.length) {
    g.bookT -= dt;
    if (g.bookT <= 0) {
      g.bookT = BOOK_EVERY;
      ev(g, { kind: 'zap' });
      for (const m of [...g.mons]) hit(g, m, g.lo.dmg, false);
    }
  }
  if (g.lo.pet && g.mons.length) {
    g.petT -= dt;
    if (g.petT <= 0) {
      g.petT = PET_EVERY;
      const m = [...g.mons].sort((a, b) => Math.hypot(a.x - HERO.x, a.y - HERO.y) - Math.hypot(b.x - HERO.x, b.y - HERO.y))[0];
      ev(g, { kind: 'text', x: m.x, y: m.y + 40, text: g.lo.pet });
      hit(g, m, g.lo.dmg * 0.6, false);
    }
  }
  checkSolved(g);
}
