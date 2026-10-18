import { rngFrom, type Rng } from '../../platform/rng';
import type { KnutLoadout } from '../../platform/rpg/trassel';

// Trasselvindens gemensamma del: monstren, striden och knut efter knut. Själva pusslet är utbytbart
// (Pussel): pinnknutar (sim.ts, dra pinnar tills inga rep korsar) eller repknutar (rep.ts, flytta
// repändar mellan hål; bara ett rep som inget ligger på kan lyftas). Ren logik utan DOM, allt i
// enheter på en bräda BW × BH; pusslet ligger inom AREA och hjälten står på golvet nedanför.

export const BW = 1000;
export const BH = 1150;
export const AREA = { x0: 50, y0: 50, x1: 950, y1: 960 };
export const HERO = { x: 500, y: 1075 };
/** Var femte knut kommer Knuttrollet. */
export const BOSS_EVERY = 5;
/** Hur nära (enheter) ett tryck måste vara ett monster. */
export const TAP_MON = 90;

export interface Pt { x: number; y: number }

/* ---------- geometri (används av båda pusslen) ---------- */

const orient = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/** Korsar två rep varandra (inte i en gemensam ände)? */
export function segCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const d1 = orient(c, d, a), d2 = orient(c, d, b), d3 = orient(a, b, c), d4 = orient(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/* ---------- pusslet ---------- */

export interface Pussel {
  /** Instruktionen i meddelanderaden. */
  hjalp: string;
  /** Knutar kvar (0 = löst). */
  kvar(): number;
  /** Barnet håller i något just nu: då löses inget och spindeln väntar. */
  haller(): boolean;
  /** Släpper det barnet håller i. */
  slapp(): void;
  /** Var spindeln med det här målet är på väg. */
  spindelMal(mal: number): Pt;
  /** Spindeln trasslar till. false = det går inte just nu, spindeln väntar. */
  trassla(mal: number, rng: Rng): boolean;
  /** Den kluriga knuffen: gör det bästa draget. Returnerar det som ska lysa, eller null om inget drag hjälper. */
  knuff(): number | null;
  /** Extra blad när knuten är löst. */
  bonus(): number;
}

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
  /** Spindeln: vad den siktar på (pusslet avgör vad talet betyder). */
  mal: number;
  stun: number;
  /** Tid till nästa bett när monstret står vid hjälten. */
  bite: number;
  /** Fas för fladdermusens sicksack. */
  wob: number;
}

/* ---------- spelet ---------- */

export type Ev =
  | { id: number; kind: 'dmg'; x: number; y: number; n: number; crit: boolean; toHero: boolean; age: number }
  | { id: number; kind: 'text'; x: number; y: number; text: string; age: number }
  | { id: number; kind: 'zap'; age: number }
  | { id: number; kind: 'glow'; i: number; age: number };

type NewEv = Ev extends infer E ? (E extends Ev ? Omit<E, 'id' | 'age'> : never) : never;

export type Phase = 'play' | 'solved' | 'dead';

export interface Game<P extends Pussel = Pussel> {
  lo: KnutLoadout;
  seed: number;
  rng: Rng;
  /** Bygger knut nummer l. */
  make: (l: number, rng: Rng) => P;
  /** Knutens nummer (svårighet). */
  level: number;
  /** Första knuten i rundan. */
  startLevel: number;
  pz: P;
  mons: Mon[];
  hp: number;
  phase: Phase;
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
  last: { blad: number; bonus: number; heal: number; skatt: boolean } | null;
  msg: string;
  evs: Ev[];
  nextId: number;
}

export function ev(g: Game, e: NewEv) {
  g.evs.push({ ...e, id: g.nextId++, age: 0 } as Ev);
}

function setKnot<P extends Pussel>(g: Game<P>, l: number) {
  g.level = l;
  g.pz = g.make(l, rngFrom((g.seed ^ Math.imul(l, 0x9e3779b1)) >>> 0));
  g.mons = [];
  g.spawnT = Math.min(10, spawnEvery(l));
  g.bossT = l % BOSS_EVERY === 0 ? 6 : null;
  g.phase = 'play';
  g.last = null;
  g.msg = l % BOSS_EVERY === 0 ? `Knut ${l}. Akta dig, Knuttrollet är på väg!` : `Knut ${l}. ${g.pz.hjalp}`;
}

export function newStrid<P extends Pussel>(lo: KnutLoadout, seed: number, make: (l: number, rng: Rng) => P, startLevel = 1, skatt = false): Game<P> {
  const g = {
    lo, seed, rng: rngFrom(seed), make, level: startLevel, startLevel, mons: [], hp: lo.maxHp,
    phase: 'play', cd: 0, spawnT: 0, bossT: null, bookT: BOOK_EVERY, petT: PET_EVERY, hints: lo.hints,
    blad: 0, kills: 0, solved: 0, skatt, skatter: 0, last: null, msg: '', evs: [], nextId: 1,
  } as unknown as Game<P>;
  setKnot(g, startLevel);
  return g;
}

/** Nästa knut, efter att den förra är löst. */
export function nextKnot(g: Game) {
  if (g.phase !== 'solved') return;
  setKnot(g, g.level + 1);
}

/** Kollar om knuten är löst (anropas efter varje drag). */
export function checkSolved(g: Game) {
  if (g.phase !== 'play' || g.pz.haller() || g.pz.kvar() > 0) return;
  g.phase = 'solved';
  g.solved++;
  const blad = knotBlad(g.level), bonus = g.pz.bonus();
  const heal = Math.min(g.lo.heal, g.lo.maxHp - g.hp);
  g.blad += blad + bonus;
  g.hp += heal;
  const skatt = g.skatt && g.solved % 2 === 0 && g.skatter < 3;
  if (skatt) g.skatter++;
  for (const m of g.mons) ev(g, { kind: 'text', x: m.x, y: m.y, text: '💨' });
  g.mons = [];
  g.last = { blad, bonus, heal, skatt };
  g.msg = 'Knuten är löst!';
}

/** Använder en klurig knuff. */
export function useHint(g: Game): boolean {
  if (g.phase !== 'play' || g.hints < 1 || g.pz.haller()) return false;
  const i = g.pz.knuff();
  if (i === null) { g.msg = 'Ingen knuff hjälper just nu. Prova själv!'; return false; }
  g.hints--;
  ev(g, { kind: 'glow', i });
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
    mal: g.rng.int(1000), stun: 0, bite: 0.4, wob: g.rng.next() * 6,
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
    g.pz.slapp();
    g.msg = `${MONS[m.kind].name} fick dig på fall.`;
  }
}

function moveMon(g: Game, m: Mon, dt: number) {
  if (m.stun > 0) { m.stun -= dt; return; }
  const def = MONS[m.kind];
  const target = def.yank ? g.pz.spindelMal(m.mal) : { x: HERO.x + (m.x < HERO.x ? -60 : 60), y: HERO.y - 50 };
  const dx = target.x - m.x, dy = target.y - m.y, d = Math.hypot(dx, dy);
  const reach = def.yank ? 20 : 40;
  if (d <= reach) {
    if (def.yank) {
      if (g.pz.trassla(m.mal, g.rng)) {
        ev(g, { kind: 'text', x: m.x, y: m.y - 40, text: '🕸️ Trassel!' });
        g.mons = g.mons.filter((x) => x !== m);
        g.msg = 'Spindeln trasslade till det!';
      }
      return;
    }
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
