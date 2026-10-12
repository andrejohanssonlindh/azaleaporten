import { rngFrom, type Rng } from '../../platform/rng';
import type { CaveLoadout } from '../../platform/rpg/grotta';

// Grottdykets spelmotor: ren logik utan DOM. Ett drag i taget: hjälten gör något, sedan rör sig monstren.
// Varje våning är ett rutnät GW × GH med rum och gångar, slumpat från dykets seed + våningen.

export const GW = 9;
export const GH = 11;
/** Var femte våning vaktar en boss trappan. */
export const BOSS_EVERY = 5;

/* ---------- monster ---------- */

export type MonKind = 'ratta' | 'fladder' | 'spindel' | 'orm' | 'skorpion' | 'troll' | 'drake';

export const MONS: Record<MonKind, { name: string; icon: string; hp: number; dmg: number; from: number; slow?: boolean; erratic?: boolean }> = {
  ratta: { name: 'Grottråttan', icon: '🐀', hp: 6, dmg: 2, from: 1 },
  fladder: { name: 'Fladdermusen', icon: '🦇', hp: 4, dmg: 2, from: 1, erratic: true },
  spindel: { name: 'Spindeln', icon: '🕷️', hp: 9, dmg: 3, from: 2 },
  orm: { name: 'Ormen', icon: '🐍', hp: 12, dmg: 4, from: 3 },
  skorpion: { name: 'Skorpionen', icon: '🦂', hp: 16, dmg: 5, from: 5 },
  troll: { name: 'Grottrollet', icon: '🧌', hp: 26, dmg: 7, from: 6, slow: true },
  drake: { name: 'Grottdraken', icon: '🐲', hp: 38, dmg: 6, from: 99, slow: true },
};

export const depthScale = (d: number) => ({ hp: 1 + 0.18 * (d - 1), dmg: 1 + 0.12 * (d - 1) });

/* ---------- saker ---------- */

export type ThingKind = 'blad' | 'dryck' | 'nyckel' | 'kista' | 'vass' | 'rustning' | 'kristall' | 'skatt';

export const THINGS: Record<ThingKind, { icon: string; name: string }> = {
  blad: { icon: '🌸', name: 'Azaleablad' },
  dryck: { icon: '🧪', name: 'Läkedryck' },
  nyckel: { icon: '🗝️', name: 'Nyckel' },
  kista: { icon: '🧰', name: 'Låst kista' },
  vass: { icon: '🪨', name: 'Brynsten (+1 skada)' },
  rustning: { icon: '🔩', name: 'Rustningsbit (+1 skydd)' },
  kristall: { icon: '💖', name: 'Livskristall (+5 liv)' },
  skatt: { icon: '🎁', name: 'Skattkista (bara i skattrundor)' },
};

/** Högst så här många skattkistor per skattrunda (samma som KEYS.chestsPerRun). */
export const SKATT_MAX = 3;

/* ---------- tillstånd ---------- */

export interface Mon { id: number; kind: MonKind; x: number; y: number; hp: number; maxHp: number; dmg: number; stun: number; awake: boolean }
export interface Thing { id: number; kind: ThingKind; x: number; y: number; v: number }
export interface Trap { x: number; y: number; seen: boolean }

export interface Floor {
  /** true = golv, false = vägg. Index y * GW + x. */
  open: boolean[];
  seen: boolean[];
  start: { x: number; y: number };
  stairs: { x: number; y: number };
  mons: Mon[];
  things: Thing[];
  traps: Trap[];
}

/** Det som hände under draget, för vyn (siffror, skott, blixtar). */
export type Ev =
  | { id: number; kind: 'dmg'; x: number; y: number; n: number; crit: boolean; toHero: boolean }
  | { id: number; kind: 'text'; x: number; y: number; text: string }
  | { id: number; kind: 'shot'; x1: number; y1: number; x2: number; y2: number; magic: boolean }
  | { id: number; kind: 'zap' }
  | { id: number; kind: 'bump'; who: number; dx: number; dy: number };

export type Phase = 'play' | 'stairs' | 'dead' | 'home';

export interface Hero {
  x: number; y: number; hp: number; maxHp: number;
  dmgBonus: number; armorBonus: number;
  potions: number; keys: number;
  /** Turer tills trollformeln kan användas igen. */
  spell: number;
  face: 1 | -1;
}

export interface Cave {
  lo: CaveLoadout;
  seed: number;
  rng: Rng;
  depth: number;
  floor: Floor;
  lit: boolean[];
  hero: Hero;
  blad: number;
  kills: number;
  /** Skattrunda (startad med en spelnyckel): skattkistor 🎁 ligger i grottan. */
  skatt: boolean;
  /** Skattkistor utlagda och upplockade. */
  skattUt: number;
  skatter: number;
  turn: number;
  phase: Phase;
  /** Senaste meddelandet till barnet. */
  msg: string;
  evs: Ev[];
  nextId: number;
}

/* ---------- hjälpare ---------- */

const idx = (x: number, y: number) => y * GW + x;
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < GW && y < GH;
export const isOpen = (f: Floor, x: number, y: number) => inside(x, y) && f.open[idx(x, y)];
export const monAt = (c: Cave, x: number, y: number) => c.floor.mons.find((m) => m.x === x && m.y === y && m.hp > 0);
export const thingAt = (c: Cave, x: number, y: number) => c.floor.things.find((t) => t.x === x && t.y === y);
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const manhattan = (ax: number, ay: number, bx: number, by: number) => Math.abs(ax - bx) + Math.abs(ay - by);

/** Bredden först från (x, y). Returnerar avstånd per ruta (-1 = går inte att nå). */
function bfs(f: Floor, x: number, y: number, pass: (x: number, y: number) => boolean): number[] {
  const d = new Array(GW * GH).fill(-1);
  d[idx(x, y)] = 0;
  const q = [[x, y]];
  for (let i = 0; i < q.length; i++) {
    const [cx, cy] = q[i];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!isOpen(f, nx, ny) || d[idx(nx, ny)] >= 0 || !pass(nx, ny)) continue;
      d[idx(nx, ny)] = d[idx(cx, cy)] + 1;
      q.push([nx, ny]);
    }
  }
  return d;
}

/** Siktlinje (Bresenham): väggar skymmer, men själva väggen syns. */
function los(f: Floor, x0: number, y0: number, x1: number, y1: number): boolean {
  let x = x0, y = y0;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (x !== x1 || y !== y1) {
    if ((x !== x0 || y !== y0) && !f.open[idx(x, y)]) return false;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return true;
}

function computeLit(c: Cave) {
  const { x, y } = c.hero, r = c.lo.light, f = c.floor;
  const lit = new Array(GW * GH).fill(false);
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    if ((tx - x) ** 2 + (ty - y) ** 2 > r * r + r) continue;
    if (los(f, x, y, tx, ty)) { lit[idx(tx, ty)] = true; f.seen[idx(tx, ty)] = true; }
  }
  c.lit = lit;
}

export const isLit = (c: Cave, x: number, y: number) => inside(x, y) && c.lit[idx(x, y)];
export const isSeen = (c: Cave, x: number, y: number) => inside(x, y) && c.floor.seen[idx(x, y)];

/* ---------- våningar ---------- */

function genFloor(depth: number, rng: Rng, nextId: () => number): Floor {
  const open = new Array(GW * GH).fill(false);
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  for (let t = 0; t < 60 && rooms.length < 5; t++) {
    const w = 3 + rng.int(3), h = 3 + rng.int(2);
    const x = 1 + rng.int(GW - w - 1), y = 1 + rng.int(GH - h - 1);
    if (rooms.some((r) => x <= r.x + r.w && r.x <= x + w && y <= r.y + r.h && r.y <= y + h)) continue;
    rooms.push({ x, y, w, h });
  }
  // Rummen i ordning uppifrån, så att gångarna slingrar sig genom hela våningen.
  rooms.sort((a, b) => a.y - b.y || a.x - b.x);
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) open[idx(x, y)] = true;
  const mid = (r: (typeof rooms)[number]) => [r.x + rng.int(r.w), r.y + rng.int(r.h)];
  for (let i = 1; i < rooms.length; i++) {
    let [x, y] = mid(rooms[i - 1]);
    const [x2, y2] = mid(rooms[i]);
    const horizFirst = rng.next() < 0.5;
    const walk = (hor: boolean) => {
      if (hor) while (x !== x2) { x += Math.sign(x2 - x); open[idx(x, y)] = true; }
      else while (y !== y2) { y += Math.sign(y2 - y); open[idx(x, y)] = true; }
    };
    walk(horizFirst); walk(!horizFirst);
  }
  const f: Floor = { open, seen: new Array(GW * GH).fill(false), start: { x: 0, y: 0 }, stairs: { x: 0, y: 0 }, mons: [], things: [], traps: [] };
  const [sx, sy] = mid(rooms[0]);
  f.start = { x: sx, y: sy };
  const dist = bfs(f, sx, sy, () => true);
  let far = 0;
  for (let i = 0; i < dist.length; i++) if (dist[i] > dist[far]) far = i;
  f.stairs = { x: far % GW, y: Math.floor(far / GW) };

  // Lediga rutor, och de som ligger en bit från starten (för monster).
  const used = new Set([idx(sx, sy), far]);
  const free = (minDist: number) => dist.map((d, i) => (d >= minDist && !used.has(i) ? i : -1)).filter((i) => i >= 0);
  const take = (minDist: number): [number, number] | null => {
    const fr = free(minDist);
    if (!fr.length) return null;
    const i = rng.pick(fr);
    used.add(i);
    return [i % GW, Math.floor(i / GW)];
  };
  const put = (kind: ThingKind, v: number, minDist = 1) => {
    const p = take(minDist);
    if (p) f.things.push({ id: nextId(), kind, x: p[0], y: p[1], v });
  };

  const bladV = 1 + Math.floor(depth / 4);
  put('blad', bladV); put('blad', bladV);
  if (rng.next() < 0.5) put('blad', bladV);
  if (rng.next() < 0.45) put('dryck', 1);
  if (rng.next() < 0.5) put(rng.pick(['vass', 'rustning', 'kristall'] as const), 1);
  if (depth >= 2 && rng.next() < 0.55) { put('nyckel', 1); put('kista', 3 + Math.floor(depth / 2), 3); }

  const nTraps = Math.min(4, 1 + Math.floor(depth / 2));
  for (let i = 0; i < nTraps; i++) {
    const p = take(3);
    if (p) f.traps.push({ x: p[0], y: p[1], seen: false });
  }

  const s = depthScale(depth);
  const pool = (Object.keys(MONS) as MonKind[]).filter((k) => MONS[k].from <= depth);
  const mk = (kind: MonKind, x: number, y: number, extra = 1): Mon => {
    const hp = Math.round(MONS[kind].hp * s.hp * extra);
    return { id: nextId(), kind, x, y, hp, maxHp: hp, dmg: Math.round(MONS[kind].dmg * s.dmg), stun: 0, awake: false };
  };
  const nMons = Math.min(7, 2 + Math.floor(depth * 0.7));
  for (let i = 0; i < nMons; i++) {
    const p = take(4);
    if (p) f.mons.push(mk(rng.pick(pool), p[0], p[1]));
  }
  if (depth % BOSS_EVERY === 0) {
    // Bossen står vid trappan.
    const sxy = f.stairs;
    const spot = DIRS.map(([dx, dy]) => [sxy.x + dx, sxy.y + dy]).find(([x, y]) => isOpen(f, x, y) && !used.has(idx(x, y)) && !f.mons.some((m) => m.x === x && m.y === y));
    const [bx, by] = spot ?? [sxy.x, sxy.y];
    f.mons.push(mk('drake', bx, by, 1 + 0.25 * (depth / BOSS_EVERY - 1)));
  }
  return f;
}

export function newCave(lo: CaveLoadout, seed: number, skatt = false): Cave {
  const c: Cave = {
    lo, seed, rng: rngFrom(seed), depth: 1, floor: null as unknown as Floor, lit: [],
    hero: { x: 0, y: 0, hp: lo.maxHp, maxHp: lo.maxHp, dmgBonus: 0, armorBonus: 0, potions: lo.potions, keys: 0, spell: 0, face: 1 },
    blad: 0, kills: 0, skatt, skattUt: 0, skatter: 0, turn: 0, phase: 'play', msg: 'Våning 1. Hitta trappan ner!', evs: [], nextId: 1,
  };
  enterFloor(c);
  return c;
}

function enterFloor(c: Cave) {
  c.floor = genFloor(c.depth, rngFrom(c.seed + c.depth * 7919), () => c.nextId++);
  if (c.skatt) placeSkatt(c);
  c.hero.x = c.floor.start.x;
  c.hero.y = c.floor.start.y;
  computeLit(c);
}

/** I en skattrunda: en skattkista på våningen (alltid på bossvåningar, annars ofta), långt från starten.
 *  Egen slump, så att vanliga dyk inte ändras. */
function placeSkatt(c: Cave) {
  const f = c.floor;
  const rng = rngFrom(c.seed + c.depth * 31 + 5);
  if (c.skattUt >= SKATT_MAX || (c.depth % BOSS_EVERY !== 0 && rng.next() < 0.35)) return;
  const busy = (x: number, y: number) => f.things.some((t) => t.x === x && t.y === y) || f.mons.some((m) => m.x === x && m.y === y)
    || f.traps.some((t) => t.x === x && t.y === y) || (f.stairs.x === x && f.stairs.y === y) || (f.start.x === x && f.start.y === y);
  const free = (minDist: number) => {
    const out: [number, number][] = [];
    for (let i = 0; i < f.open.length; i++) {
      const x = i % GW, y = Math.floor(i / GW);
      if (f.open[i] && !busy(x, y) && Math.abs(x - f.start.x) + Math.abs(y - f.start.y) >= minDist) out.push([x, y]);
    }
    return out;
  };
  const far = free(4);
  const spots = far.length ? far : free(1);
  if (!spots.length) return;
  const [x, y] = rng.pick(spots);
  f.things.push({ id: c.nextId++, kind: 'skatt', x, y, v: 1 });
  c.skattUt++;
}

/* ---------- strid ---------- */

type EvIn = Ev extends infer E ? (E extends Ev ? Omit<E, 'id'> : never) : never;
const ev = (c: Cave, e: EvIn) => c.evs.push({ id: c.nextId++, ...e } as Ev);

function heroHit(c: Cave, m: Mon, mult = 1) {
  const base = (c.lo.dmg + c.hero.dmgBonus) * mult * (0.8 + c.rng.next() * 0.4);
  const crit = c.rng.next() < c.lo.crit;
  const n = Math.max(1, Math.round(base * (crit ? 2 : 1)));
  m.hp -= n;
  m.awake = true;
  ev(c, { kind: 'dmg', x: m.x, y: m.y, n, crit, toHero: false });
  if (c.lo.weapon === 'hammare' && mult === 1) m.stun = 1;
}

function monHit(c: Cave, m: Mon) {
  const h = c.hero;
  ev(c, { kind: 'bump', who: m.id, dx: Math.sign(h.x - m.x), dy: Math.sign(h.y - m.y) });
  if (c.rng.next() < c.lo.block) { ev(c, { kind: 'text', x: h.x, y: h.y, text: '🛡️ Stopp!' }); return; }
  const n = Math.max(1, Math.round(m.dmg * (0.8 + c.rng.next() * 0.4)) - c.lo.armor - h.armorBonus);
  h.hp -= n;
  ev(c, { kind: 'dmg', x: h.x, y: h.y, n, crit: false, toHero: true });
  c.msg = `${MONS[m.kind].name} slår dig: −${n}`;
}

function bury(c: Cave) {
  for (const m of c.floor.mons) {
    if (m.hp > 0) continue;
    c.kills++;
    if (m.kind === 'drake') {
      c.floor.things.push({ id: c.nextId++, kind: 'blad', x: m.x, y: m.y, v: 3 + c.depth });
      c.msg = `Du besegrade ${MONS.drake.name}! Den tappade en hög med blad.`;
    } else if (c.rng.next() < 0.2 && !thingAt(c, m.x, m.y)) c.floor.things.push({ id: c.nextId++, kind: 'blad', x: m.x, y: m.y, v: 1 });
  }
  c.floor.mons = c.floor.mons.filter((m) => m.hp > 0);
}

/* ---------- hjältens drag ---------- */

export type Action = { kind: 'dir'; dx: number; dy: number } | { kind: 'wait' } | { kind: 'potion' } | { kind: 'spell' };

/** Gör ett drag. Returnerar false om draget inte gick (vägg, ingen dryck…) – då händer ingenting. */
export function act(c: Cave, a: Action): boolean {
  if (c.phase !== 'play') return false;
  c.evs = [];
  const h = c.hero;
  if (a.kind === 'potion') {
    if (h.potions < 1 || h.hp >= h.maxHp) return false;
    h.potions--;
    const n = Math.min(h.maxHp - h.hp, c.lo.potionHeal);
    h.hp += n;
    ev(c, { kind: 'text', x: h.x, y: h.y, text: `+${n} ❤️` });
    c.msg = 'Du dricker en läkedryck.';
  } else if (a.kind === 'spell') {
    if (c.lo.off !== 'trollbok' || h.spell > 0) return false;
    const targets = c.floor.mons.filter((m) => isLit(c, m.x, m.y));
    if (!targets.length) return false;
    for (const m of targets) heroHit(c, m, 1.5);
    ev(c, { kind: 'zap' });
    h.spell = 8;
    c.msg = 'Blixten slår ner i monstren!';
  } else if (a.kind === 'wait') {
    c.msg = 'Du väntar och lyssnar…';
  } else {
    const { dx, dy } = a;
    if (dx) h.face = dx > 0 ? 1 : -1;
    // Skott: första monstret rakt fram inom räckvidd.
    if (c.lo.range > 0) {
      for (let k = 1; k <= c.lo.range; k++) {
        const x = h.x + dx * k, y = h.y + dy * k;
        if (!isOpen(c.floor, x, y)) break;
        const m = monAt(c, x, y);
        if (m && isLit(c, x, y)) {
          ev(c, { kind: 'shot', x1: h.x, y1: h.y, x2: x, y2: y, magic: c.lo.weapon === 'stav' });
          heroHit(c, m);
          c.msg = `Träff på ${MONS[m.kind].name.toLowerCase()}!`;
          return endTurn(c);
        }
      }
    }
    const tx = h.x + dx, ty = h.y + dy;
    const m = monAt(c, tx, ty);
    if (m) {
      ev(c, { kind: 'bump', who: 0, dx, dy });
      const hits = c.lo.weapon === 'yxa' ? c.floor.mons.filter((o) => o.hp > 0 && manhattan(o.x, o.y, h.x, h.y) === 1) : [m];
      for (const o of hits) heroHit(c, o);
      c.msg = m.hp > 0 ? `Du slår ${MONS[m.kind].name.toLowerCase()}!` : `${MONS[m.kind].name} är besegrad!`;
    } else if (isOpen(c.floor, tx, ty)) {
      h.x = tx; h.y = ty;
      c.msg = '';
      stepOn(c);
      if (c.phase !== 'play') { computeLit(c); return true; }
    } else return false;
  }
  return endTurn(c);
}

function stepOn(c: Cave) {
  const h = c.hero, f = c.floor;
  const trap = f.traps.find((t) => t.x === h.x && t.y === h.y);
  if (trap) {
    f.traps = f.traps.filter((t) => t !== trap);
    if (trap.seen) {
      ev(c, { kind: 'text', x: h.x, y: h.y, text: 'Försiktigt…' });
      c.msg = 'Du ser fällan och tar dig förbi den.';
    } else {
      const n = 3 + c.depth;
      h.hp -= n;
      ev(c, { kind: 'dmg', x: h.x, y: h.y, n, crit: false, toHero: true });
      c.msg = `Aj! En gömd fälla: −${n}`;
    }
  }
  const t = thingAt(c, h.x, h.y);
  if (t) {
    let took = true;
    switch (t.kind) {
      case 'blad': c.blad += t.v; c.msg = `+${t.v} 🌸`; break;
      case 'dryck': h.potions++; c.msg = 'Du hittade en läkedryck 🧪'; break;
      case 'nyckel': h.keys++; c.msg = 'En nyckel 🗝️! Den passar i en kista.'; break;
      case 'vass': h.dmgBonus++; c.msg = 'En brynsten: ditt vapen blir vassare (+1 skada).'; break;
      case 'rustning': h.armorBonus++; c.msg = 'En rustningsbit: +1 skydd.'; break;
      case 'kristall': h.maxHp += 5; h.hp += 5; c.msg = 'En livskristall: +5 liv!'; break;
      case 'skatt': c.skatter++; c.msg = 'En skattkista 🎁! Du öppnar den i Azaleagården.'; break;
      case 'kista':
        if (h.keys > 0) { h.keys--; c.blad += t.v; c.msg = `Du låser upp kistan: +${t.v} 🌸!`; }
        else { took = false; c.msg = 'Kistan är låst. Hitta en nyckel 🗝️'; }
        break;
    }
    if (took) {
      f.things = f.things.filter((x) => x !== t);
      ev(c, { kind: 'text', x: h.x, y: h.y, text: t.kind === 'blad' || t.kind === 'kista' ? `+${t.v} 🌸` : THINGS[t.kind].icon });
    }
  }
  if (h.hp <= 0) { h.hp = 0; c.phase = 'dead'; c.msg = 'Du föll i grottan…'; return; }
  if (h.x === f.stairs.x && h.y === f.stairs.y) {
    c.phase = 'stairs';
    c.msg = 'Du hittade trappan!';
  }
}

function endTurn(c: Cave): boolean {
  const h = c.hero, f = c.floor;
  c.turn++;
  h.spell = Math.max(0, h.spell - 1);
  bury(c);

  // Husdjuret hjälper till.
  if (c.lo.pet) {
    const near = f.mons.filter((m) => manhattan(m.x, m.y, h.x, h.y) === 1);
    if (near.length && c.rng.next() < 0.35) {
      const m = c.rng.pick(near), n = Math.max(2, Math.round(c.lo.dmg * 0.5));
      m.hp -= n;
      ev(c, { kind: 'dmg', x: m.x, y: m.y, n, crit: false, toHero: false });
      bury(c);
    }
  }

  computeLit(c);
  if (c.rng.next() < c.lo.haste) {
    ev(c, { kind: 'text', x: h.x, y: h.y, text: '⚡ Snabb!' });
  } else {
    for (const m of f.mons) {
      if (m.stun > 0) { m.stun--; continue; }
      if (MONS[m.kind].slow && c.turn % 2) continue;
      if (isLit(c, m.x, m.y) && manhattan(m.x, m.y, h.x, h.y) <= 6) m.awake = true;
      if (manhattan(m.x, m.y, h.x, h.y) === 1) { monHit(c, m); continue; }
      let step: [number, number] | null = null;
      if (m.awake && !(MONS[m.kind].erratic && c.rng.next() < 0.5)) {
        // Mot hjälten, runt andra monster.
        const d = bfs(f, h.x, h.y, (x, y) => !monAt(c, x, y) || (x === m.x && y === m.y));
        let best = d[idx(m.x, m.y)];
        for (const [dx, dy] of DIRS) {
          const nx = m.x + dx, ny = m.y + dy;
          if (!isOpen(f, nx, ny) || monAt(c, nx, ny) || (nx === h.x && ny === h.y)) continue;
          const v = d[idx(nx, ny)];
          if (v >= 0 && (best < 0 || v < best)) { best = v; step = [nx, ny]; }
        }
      } else if (m.awake || c.rng.next() < 0.25) {
        const [dx, dy] = c.rng.pick(DIRS);
        const nx = m.x + dx, ny = m.y + dy;
        if (isOpen(f, nx, ny) && !monAt(c, nx, ny) && !(nx === h.x && ny === h.y) && !(nx === f.stairs.x && ny === f.stairs.y)) step = [nx, ny];
      }
      if (step) { m.x = step[0]; m.y = step[1]; }
    }
  }

  // Fällor i ljuset kan upptäckas.
  for (const t of f.traps) {
    if (!t.seen && isLit(c, t.x, t.y) && c.rng.next() < c.lo.spot) {
      t.seen = true;
      if (!c.msg) c.msg = 'Du ser en fälla 🪤!';
    }
  }
  if (h.hp <= 0) { h.hp = 0; c.phase = 'dead'; c.msg = 'Du föll i grottan…'; }
  return true;
}

/* ---------- trappan ---------- */

/** Ner till nästa våning. Hjälten vilar lite i trappan. */
export function descend(c: Cave) {
  if (c.phase !== 'stairs') return;
  c.depth++;
  c.hero.hp = Math.min(c.hero.maxHp, c.hero.hp + 5);
  c.hero.spell = 0;
  c.phase = 'play';
  c.evs = [];
  c.msg = c.depth % BOSS_EVERY === 0 ? `Våning ${c.depth}. Något stort vaktar trappan…` : `Våning ${c.depth}.`;
  enterFloor(c);
}

export function goHome(c: Cave) {
  if (c.phase === 'stairs') c.phase = 'home';
}

/* ---------- vägar (för att gå dit man trycker) ---------- */

/**
 * Vägen till (x, y) som riktningar, över rutor hjälten har sett, runt monster. Kända fällor går man
 * försiktigt förbi, så de stoppar inte vägen. `all` = hela kartan, rakt igenom monster (för testernas robot).
 */
export function pathTo(c: Cave, x: number, y: number, all = false): [number, number][] | null {
  const f = c.floor, h = c.hero;
  if (!isOpen(f, x, y) || (!all && !isSeen(c, x, y)) || (x === h.x && y === h.y)) return null;
  const ok = (px: number, py: number) => all || (isSeen(c, px, py) && !monAt(c, px, py));
  const d = bfs(f, x, y, ok);
  if (d[idx(h.x, h.y)] < 0) return null;
  const out: [number, number][] = [];
  let cx = h.x, cy = h.y;
  while (cx !== x || cy !== y) {
    const next = DIRS.find(([dx, dy]) => isOpen(f, cx + dx, cy + dy) && d[idx(cx + dx, cy + dy)] === d[idx(cx, cy)] - 1);
    if (!next) return null;
    out.push(next);
    cx += next[0]; cy += next[1];
  }
  return out;
}

/** Om man trycker på ett monster: riktningen att slå eller skjuta åt, annars null. */
export function attackDir(c: Cave, x: number, y: number): [number, number] | null {
  const h = c.hero, m = monAt(c, x, y);
  if (!m || !isLit(c, x, y)) return null;
  const dx = x - h.x, dy = y - h.y;
  if (manhattan(x, y, h.x, h.y) === 1) return [dx, dy];
  if (c.lo.range > 0 && (dx === 0 || dy === 0) && Math.abs(dx + dy) <= c.lo.range) {
    const sx = Math.sign(dx), sy = Math.sign(dy);
    for (let k = 1; k < Math.abs(dx + dy); k++) if (!isOpen(c.floor, h.x + sx * k, h.y + sy * k)) return null;
    return [sx, sy];
  }
  return null;
}
