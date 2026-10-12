import { rngFrom, type Rng } from '../../platform/rng';
import { STORM_WAVES, type Loadout, type WeaponKind } from '../../platform/rpg/dimstorm';

// Dimstormens spelmotor: ren logik utan DOM, så att den kan testas och köras utan skärm.
// Allt sker i en värld på W × H enheter; vyn skalar den till skärmen. step() flyttar spelet dt sekunder.

export const W = 360;
export const H = 480;
export const WAVE_SECS = 30;
const HERO_R = 12;
const MAX_FOES = 80;
const MAX_GEMS = 120;

/* ---------- monster ---------- */

export type FoeKind = 'spoke' | 'fladder' | 'galt' | 'snigel' | 'troll' | 'jatte';

export const FOES: Record<FoeKind, { name: string; icon: string; hp: number; spd: number; dmg: number; r: number; xp: number }> = {
  spoke: { name: 'Dimspöke', icon: '👻', hp: 14, spd: 42, dmg: 9, r: 12, xp: 1 },
  fladder: { name: 'Dimfladdermus', icon: '🦇', hp: 7, spd: 76, dmg: 6, r: 10, xp: 1 },
  galt: { name: 'Dimgalt', icon: '🐗', hp: 24, spd: 60, dmg: 11, r: 13, xp: 2 },
  snigel: { name: 'Dimsnigel', icon: '🐌', hp: 42, spd: 24, dmg: 13, r: 15, xp: 2 },
  troll: { name: 'Dimtroll', icon: '👹', hp: 85, spd: 30, dmg: 18, r: 18, xp: 4 },
  jatte: { name: 'Stormjätten', icon: '🌪️', hp: 750, spd: 30, dmg: 22, r: 30, xp: 0 },
};

/** Vågornas blandning (vikter) och takt (monster per sekund). Våg STORM_WAVES + 1 är jättens våg. */
const WAVES: { mix: Partial<Record<FoeKind, number>>; rate: number; swarm?: boolean }[] = [
  { mix: { spoke: 3, fladder: 1 }, rate: 0.7 },
  { mix: { spoke: 3, fladder: 2, galt: 1 }, rate: 1.0 },
  { mix: { spoke: 2, fladder: 2, galt: 2, snigel: 1 }, rate: 1.3, swarm: true },
  { mix: { spoke: 2, fladder: 2, galt: 2, snigel: 1, troll: 1 }, rate: 1.6 },
  { mix: { spoke: 2, fladder: 2, galt: 2, snigel: 2, troll: 2 }, rate: 2.0, swarm: true },
  { mix: { spoke: 2, fladder: 2 }, rate: 0.6 },
];

/** Hur mycket svårare varje steg är. Steg 1 ska gå att klara med lite utrustning. */
export function stegScale(steg: number) {
  const k = Math.max(0, steg - 1);
  return { hp: 1 + 0.5 * k, dmg: 1 + 0.3 * k, rate: 1 + 0.12 * k };
}

/* ---------- uppgraderingar under stormen ---------- */

export type UpId = 'skada' | 'fart' | 'rackvidd' | 'fler' | 'liv' | 'lak' | 'magnet' | 'skor' | 'blad' | 'blixt' | 'tur';

const FLER: Record<WeaponKind, [string, string]> = {
  svard: ['Ett hugg till', 'Svärdet hugger åt ett håll till'],
  yxa: ['Större snurr', 'Yxan når längre och slår hårdare'],
  stav: ['Ett trollskott till', 'Staven skjuter ett skott till'],
  bage: ['En pil till', 'Bågen skjuter en pil till'],
  hammare: ['Längre bedövning', 'Monstren står still längre'],
  nava: ['Ett slag till', 'Du slår åt ett håll till'],
};

export const UPS: Record<UpId, { icon: string; max: number; text: (w: WeaponKind) => [string, string] }> = {
  skada: { icon: '⚔️', max: 5, text: () => ['Vassare', '+20 % skada'] },
  fart: { icon: '⏩', max: 5, text: () => ['Snabbare attacker', 'Du attackerar oftare'] },
  rackvidd: { icon: '📏', max: 4, text: () => ['Längre räckvidd', 'Attackerna når längre'] },
  fler: { icon: '➕', max: 3, text: (w) => FLER[w] },
  liv: { icon: '❤️', max: 4, text: () => ['Mer liv', '+25 liv, och läker 25'] },
  lak: { icon: '🍓', max: 99, text: () => ['Smultron', 'Läker 50 liv'] },
  magnet: { icon: '🧲', max: 3, text: () => ['Magnet', 'Plockar upp saker längre bort'] },
  skor: { icon: '👟', max: 3, text: () => ['Snabba fötter', 'Du springer fortare'] },
  blad: { icon: '🌸', max: 3, text: () => ['Bladvirvel', 'Azaleablad snurrar runt dig och slår'] },
  blixt: { icon: '⚡', max: 3, text: () => ['Blixt', 'Blixtar slår ner i monstren'] },
  tur: { icon: '🍀', max: 3, text: () => ['Tur', 'Fler fullträffar'] },
};

/** Kristaller som krävs från nivå l till l + 1. */
export const needXp = (l: number) => 5 + 4 * l;

/* ---------- tillstånd ---------- */

export interface Foe {
  id: number; kind: FoeKind; x: number; y: number; r: number; hp: number; maxHp: number; spd: number; dmg: number;
  /** Tider (s) för bedövning, långsamhet, vit blink och nästa gång en snurrande sak får slå. */
  stun: number; slow: number; flash: number; orbitCd: number;
  /** Tid tills hammaren kan bedöva igen (annars blir snabba hammarslag ett evigt stillastående). */
  stunCd: number;
  kbx: number; kby: number; wob: number;
  boss?: { state: 'walk' | 'aim' | 'charge'; t: number; dx: number; dy: number; summon: number };
}
export interface Shot { x: number; y: number; vx: number; vy: number; dmg: number; crit: boolean; pierce: number; life: number; kind: 'pil' | 'troll'; hit: number[] }
export interface Drop { x: number; y: number; kind: 'xp' | 'blad' | 'hjarta' | 'skatt'; v: number; pull: boolean; life: number }

/** Högst så här många skattkistor per skattrunda (samma som KEYS.chestsPerRun). */
export const SKATT_MAX = 3;
export type Fx =
  | { kind: 'arc'; x: number; y: number; ang: number; spread: number; r: number; t: number; ttl: number }
  | { kind: 'ring'; x: number; y: number; r: number; t: number; ttl: number; color: string }
  | { kind: 'num'; x: number; y: number; text: string; crit: boolean; t: number; ttl: number }
  | { kind: 'zap'; x1: number; y1: number; x2: number; y2: number; t: number; ttl: number }
  | { kind: 'poof'; x: number; y: number; t: number; ttl: number }
  | { kind: 'text'; text: string; t: number; ttl: number };

export interface Hero {
  x: number; y: number; hp: number; maxHp: number;
  /** Osårbar så här länge efter ett slag. */
  inv: number;
  fx: number; fy: number;
  cd: number;
  /** Tid tills skölden är redo igen (0 = redo). */
  shield: number;
  pet: { x: number; y: number; cd: number; tx: number | null; ty: number | null };
  zap: number;
  orbit: number;
  /** Räknas upp när hjälten slår, så att vyn kan visa ett utfall. */
  swings: number;
  hurts: number;
}

export type Phase = 'play' | 'choose' | 'won' | 'lost';

export interface Game {
  lo: Loadout;
  steg: number;
  rng: Rng;
  t: number;
  /** 1..STORM_WAVES, och STORM_WAVES + 1 när jätten är ute. */
  wave: number;
  waveT: number;
  spawnAcc: number;
  swarmDone: boolean;
  foes: Foe[];
  shots: Shot[];
  drops: Drop[];
  fx: Fx[];
  hero: Hero;
  lvl: number;
  xp: number;
  ups: Record<UpId, number>;
  offer: UpId[];
  /** Plockade azaleablad (belöning efteråt). */
  picked: number;
  /** Skattrunda (startad med en spelnyckel): skattkistor 🎁 dyker upp i våg 2 och 4 och när jätten faller. */
  skatt: boolean;
  skattUt: number;
  skatter: number;
  kills: number;
  phase: Phase;
  nextId: number;
  shake: number;
}

export function newGame(lo: Loadout, steg: number, seed: number, skatt = false): Game {
  return {
    lo, steg, rng: rngFrom(seed), t: 0, wave: 1, waveT: 0, spawnAcc: 0, swarmDone: false,
    foes: [], shots: [], drops: [], fx: [{ kind: 'text', text: 'Våg 1', t: 0, ttl: 2 }],
    hero: { x: W / 2, y: H / 2 + 20, hp: lo.maxHp, maxHp: lo.maxHp, inv: 0, fx: 1, fy: 0, cd: 0.5, shield: 0, pet: { x: W / 2 - 24, y: H / 2 + 34, cd: 1, tx: null, ty: null }, zap: 2, orbit: 0, swings: 0, hurts: 0 },
    lvl: 1, xp: 0, ups: { skada: 0, fart: 0, rackvidd: 0, fler: 0, liv: 0, lak: 0, magnet: 0, skor: 0, blad: 0, blixt: 0, tur: 0 }, offer: [],
    picked: 0, skatt, skattUt: 0, skatter: 0, kills: 0, phase: 'play', nextId: 1, shake: 0,
  };
}

/** Klarade vågor (för belöningen). Jättens våg räknas när jätten är besegrad. */
export const wavesCleared = (g: Game) => (g.phase === 'won' ? STORM_WAVES + 1 : Math.min(STORM_WAVES, g.wave - 1));

/* ---------- hjälpare ---------- */

function dropSkatt(g: Game, x: number, y: number) {
  if (g.skattUt >= SKATT_MAX) return;
  g.skattUt++;
  g.drops.push({ x, y, kind: 'skatt', v: 1, pull: false, life: 99 });
}

const dist2 = (ax: number, ay: number, bx: number, by: number) => (ax - bx) ** 2 + (ay - by) ** 2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const angDiff = (a: number, b: number) => Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI);

function nearest(g: Game, x: number, y: number, range: number, skip: Set<number> = new Set()): Foe | null {
  let best: Foe | null = null, bd = range * range;
  for (const f of g.foes) {
    if (skip.has(f.id)) continue;
    const d = dist2(x, y, f.x, f.y) - f.r * f.r;
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

const rangeMult = (g: Game) => 1 + 0.15 * g.ups.rackvidd;

function roll(g: Game, base: number): { dmg: number; crit: boolean } {
  const crit = g.rng.next() < g.lo.crit + 0.08 * g.ups.tur;
  const dmg = base * g.lo.dmgMult * (1 + 0.2 * g.ups.skada) * (crit ? 2 : 1);
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

function hurt(g: Game, f: Foe, dmg: number, crit: boolean, kb = 0, from?: { x: number; y: number }) {
  f.hp -= dmg;
  f.flash = 0.12;
  if (kb && !f.boss && from) {
    const d = Math.sqrt(dist2(f.x, f.y, from.x, from.y)) || 1;
    f.kbx += ((f.x - from.x) / d) * kb;
    f.kby += ((f.y - from.y) / d) * kb;
  }
  g.fx.push({ kind: 'num', x: f.x, y: f.y - f.r, text: String(dmg), crit, t: 0, ttl: 0.7 });
}

function spawn(g: Game, kind: FoeKind, x?: number, y?: number) {
  const d = FOES[kind], s = stegScale(g.steg);
  if (x === undefined || y === undefined) {
    // Kanten av världen, en bit utanför.
    const side = g.rng.int(4), u = g.rng.next();
    const pad = d.r + 6;
    [x, y] = side === 0 ? [u * W, -pad] : side === 1 ? [W + pad, u * H] : side === 2 ? [u * W, H + pad] : [-pad, u * H];
  }
  const hp = Math.round(d.hp * s.hp);
  const f: Foe = { id: g.nextId++, kind, x, y, r: d.r, hp, maxHp: hp, spd: d.spd * (0.9 + g.rng.next() * 0.2), dmg: Math.round(d.dmg * s.dmg), stun: 0, stunCd: 0, slow: 0, flash: 0, orbitCd: 0, kbx: 0, kby: 0, wob: g.rng.next() * 6 };
  if (kind === 'jatte') f.boss = { state: 'walk', t: 2.5, dx: 0, dy: 0, summon: 6 };
  g.foes.push(f);
}

function pickKind(g: Game, mix: Partial<Record<FoeKind, number>>): FoeKind {
  const entries = Object.entries(mix) as [FoeKind, number][];
  let r = g.rng.next() * entries.reduce((a, [, w]) => a + w, 0);
  for (const [k, w] of entries) if ((r -= w) < 0) return k;
  return entries[0][0];
}

/* ---------- uppgraderingar ---------- */

function makeOffer(g: Game): UpId[] {
  const hurtNow = g.hero.hp < g.hero.maxHp * 0.8;
  const pool = (Object.keys(UPS) as UpId[]).filter((id) => g.ups[id] < UPS[id].max && (id !== 'lak' || hurtNow));
  const offer = g.rng.shuffle(pool).slice(0, g.lo.choices);
  return offer.length ? offer : ['lak'];
}

export function choose(g: Game, id: UpId) {
  if (g.phase !== 'choose' || !g.offer.includes(id)) return;
  g.ups[id]++;
  if (id === 'liv') { g.hero.maxHp += 25; g.hero.hp = Math.min(g.hero.maxHp, g.hero.hp + 25); }
  if (id === 'lak') g.hero.hp = Math.min(g.hero.maxHp, g.hero.hp + 50);
  g.offer = [];
  g.phase = 'play';
  levelCheck(g);
}

function levelCheck(g: Game) {
  if (g.phase === 'play' && g.xp >= needXp(g.lvl)) {
    g.xp -= needXp(g.lvl);
    g.lvl++;
    g.offer = makeOffer(g);
    g.phase = 'choose';
  }
}

/* ---------- vapnen ---------- */

// Närstrid slår hårdare än skott: man måste gå nära monstren för att träffa.
/** Sekunder ett monster går fritt efter hammarens bedövning innan det kan bedövas igen. */
export const STUN_REST = 1.2;
const WEAPON_CD: Record<WeaponKind, number> = { svard: 0.6, yxa: 1.0, stav: 0.75, bage: 0.5, hammare: 1.25, nava: 0.55 };

/** Försöker attackera. Returnerar false om inget monster var inom räckhåll (då väntar vapnet). */
function attack(g: Game): boolean {
  const h = g.hero, w = g.lo.weapon, rm = rangeMult(g);
  switch (w) {
    case 'svard':
    case 'nava': {
      const reach = (w === 'svard' ? 50 : 40) * rm, spread = w === 'svard' ? 1.15 : 1.0, base = w === 'svard' ? 16 : 12;
      const t = nearest(g, h.x, h.y, reach + 22);
      if (!t) return false;
      const a0 = Math.atan2(t.y - h.y, t.x - h.x);
      const n = 1 + g.ups.fler;
      for (let k = 0; k < n; k++) {
        const ang = a0 + (k * Math.PI * 2) / n;
        g.fx.push({ kind: 'arc', x: h.x, y: h.y, ang, spread, r: reach, t: 0, ttl: 0.18 });
        for (const f of g.foes) {
          const d = Math.sqrt(dist2(h.x, h.y, f.x, f.y));
          if (d > reach + f.r || angDiff(Math.atan2(f.y - h.y, f.x - h.x), ang) > spread / 2 + f.r / Math.max(d, 1)) continue;
          const { dmg, crit } = roll(g, base);
          hurt(g, f, dmg, crit, 70, h);
        }
      }
      h.fx = Math.cos(a0); h.fy = Math.sin(a0);
      return true;
    }
    case 'yxa': {
      const reach = 46 * rm * (1 + 0.15 * g.ups.fler);
      if (!nearest(g, h.x, h.y, reach + 10)) return false;
      g.fx.push({ kind: 'ring', x: h.x, y: h.y, r: reach, t: 0, ttl: 0.25, color: '#ffd43b' });
      for (const f of g.foes) {
        if (dist2(h.x, h.y, f.x, f.y) > (reach + f.r) ** 2) continue;
        const { dmg, crit } = roll(g, 20 * (1 + 0.2 * g.ups.fler));
        hurt(g, f, dmg, crit, 150, h);
      }
      return true;
    }
    case 'stav':
    case 'bage': {
      const skip = new Set<number>();
      const t = nearest(g, h.x, h.y, w === 'stav' ? 260 : 300);
      if (!t) return false;
      const n = 1 + g.ups.fler;
      for (let k = 0; k < n; k++) {
        let ang: number;
        if (w === 'stav') {
          const tk = nearest(g, h.x, h.y, 260, skip) ?? t;
          skip.add(tk.id);
          ang = Math.atan2(tk.y - h.y, tk.x - h.x);
        } else ang = Math.atan2(t.y - h.y, t.x - h.x) + (k - (n - 1) / 2) * 0.16;
        const sp = w === 'stav' ? 230 : 380;
        const { dmg, crit } = roll(g, w === 'stav' ? 13 : 9);
        g.shots.push({ x: h.x, y: h.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg, crit, pierce: w === 'bage' ? 1 : 0, life: 1.6 * rm, kind: w === 'stav' ? 'troll' : 'pil', hit: [] });
      }
      h.fx = Math.cos(Math.atan2(t.y - h.y, t.x - h.x)); h.fy = Math.sin(Math.atan2(t.y - h.y, t.x - h.x));
      return true;
    }
    case 'hammare': {
      const reach = 70 * rm;
      if (!nearest(g, h.x, h.y, reach)) return false;
      g.fx.push({ kind: 'ring', x: h.x, y: h.y, r: reach, t: 0, ttl: 0.35, color: '#e8590c' });
      for (const f of g.foes) {
        if (dist2(h.x, h.y, f.x, f.y) > (reach + f.r) ** 2) continue;
        const { dmg, crit } = roll(g, 20);
        hurt(g, f, dmg, crit, 40, h);
        if (!f.boss && f.stunCd <= 0) {
          const t = 0.8 + 0.3 * g.ups.fler;
          f.stun = Math.max(f.stun, t);
          f.stunCd = t + STUN_REST;
        }
      }
      g.shake = Math.max(g.shake, 0.15);
      return true;
    }
  }
}

/** Var trollboken och bladvirvelns blad är just nu (används av både spelet och ritningen). */
export function orbitPositions(g: Game): { x: number; y: number; icon: string; dmg: number }[] {
  const h = g.hero, out: { x: number; y: number; icon: string; dmg: number }[] = [];
  const ring = (r: number, n: number, speed: number, icon: string, dmg: number) => {
    for (let k = 0; k < n; k++) {
      const a = h.orbit * speed + (k * Math.PI * 2) / n;
      out.push({ x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r, icon, dmg });
    }
  };
  if (g.lo.off === 'trollbok') ring(44 * rangeMult(g), 1, 1, g.lo.offIcon || '📕', 7);
  if (g.ups.blad) ring(64 * rangeMult(g), g.ups.blad + 1, -0.8, '🌸', 6);
  return out;
}

/** Lyktans ljuscirkel (0 utan lykta). */
export const auraRadius = (g: Game) => (g.lo.off === 'lykta' ? 58 * rangeMult(g) : 0);

/* ---------- ett steg ---------- */

export interface Input { dx: number; dy: number }

export function step(g: Game, dt: number, input: Input) {
  if (g.phase !== 'play') return;
  dt = Math.min(dt, 0.05);
  g.t += dt;
  g.waveT += dt;
  g.shake = Math.max(0, g.shake - dt);
  const h = g.hero, lo = g.lo;

  // Vågor
  if (g.wave <= STORM_WAVES && g.waveT >= WAVE_SECS) {
    g.wave++;
    g.waveT = 0;
    g.swarmDone = false;
    if (g.wave > STORM_WAVES) {
      spawn(g, 'jatte', W / 2, -40);
      g.fx.push({ kind: 'text', text: 'Stormjätten kommer!', t: 0, ttl: 2.5 });
    } else g.fx.push({ kind: 'text', text: `Våg ${g.wave}`, t: 0, ttl: 2 });
    if (g.skatt && (g.wave === 2 || g.wave === 4)) dropSkatt(g, 40 + g.rng.next() * (W - 80), 60 + g.rng.next() * (H - 120));
  }
  const wv = WAVES[g.wave - 1];
  const s = stegScale(g.steg);
  g.spawnAcc += dt * wv.rate * s.rate * (1 + 0.3 * Math.min(1, g.waveT / WAVE_SECS));
  while (g.spawnAcc >= 1) {
    g.spawnAcc -= 1;
    if (g.foes.length < MAX_FOES) spawn(g, pickKind(g, wv.mix));
  }
  if (wv.swarm && !g.swarmDone && g.waveT >= WAVE_SECS / 2) {
    // En ring fladdermöss runt hjälten.
    g.swarmDone = true;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      spawn(g, 'fladder', clamp(h.x + Math.cos(a) * 190, -10, W + 10), clamp(h.y + Math.sin(a) * 190, -10, H + 10));
    }
    g.fx.push({ kind: 'text', text: 'En svärm!', t: 0, ttl: 1.5 });
  }

  // Hjälten rör sig
  const len = Math.hypot(input.dx, input.dy);
  if (len > 0.05) {
    const k = Math.min(1, len) / len;
    const sp = lo.moveSpeed * (1 + 0.1 * g.ups.skor);
    h.x = clamp(h.x + input.dx * k * sp * dt, HERO_R, W - HERO_R);
    h.y = clamp(h.y + input.dy * k * sp * dt, HERO_R + 24, H - HERO_R);
    h.fx = input.dx / len; h.fy = input.dy / len;
  }
  h.inv = Math.max(0, h.inv - dt);
  h.shield = Math.max(0, h.shield - dt);

  // Vapnet
  h.cd -= dt;
  if (h.cd <= 0) {
    if (attack(g)) { h.cd = WEAPON_CD[lo.weapon] * lo.cdMult * 0.88 ** g.ups.fart; h.swings++; }
    else h.cd = 0;
  }

  // Det som snurrar: trollboken och bladvirveln
  h.orbit += dt * 3.2;
  for (const o of orbitPositions(g)) {
    for (const f of g.foes) {
      if (f.orbitCd > 0 || dist2(o.x, o.y, f.x, f.y) > (f.r + 10) ** 2) continue;
      const { dmg, crit } = roll(g, o.dmg);
      hurt(g, f, dmg, crit, 40, h);
      f.orbitCd = 0.5;
    }
  }

  // Lyktans ljus
  const auraR = auraRadius(g);

  // Blixtar
  if (g.ups.blixt) {
    h.zap -= dt;
    if (h.zap <= 0) {
      h.zap = 2.2;
      const near = g.foes.filter((f) => dist2(h.x, h.y, f.x, f.y) < 230 * 230);
      for (const f of g.rng.shuffle(near).slice(0, g.ups.blixt)) {
        const { dmg, crit } = roll(g, 16);
        hurt(g, f, dmg, crit);
        f.stun = Math.max(f.stun, 0.3);
        g.fx.push({ kind: 'zap', x1: f.x + (g.rng.next() - 0.5) * 30, y1: f.y - 120, x2: f.x, y2: f.y, t: 0, ttl: 0.2 });
      }
    }
  }

  // Husdjuret hoppar på närmaste monster
  const pet = h.pet;
  if (lo.pet) {
    pet.cd -= dt;
    if (pet.cd <= 0) {
      const t = nearest(g, h.x, h.y, 140);
      pet.cd = 1.6;
      if (t) {
        pet.tx = t.x; pet.ty = t.y;
        const { dmg, crit } = roll(g, 9);
        hurt(g, t, dmg, crit, 60, h);
      }
    }
    if (pet.cd < 1.3) { pet.tx = null; pet.ty = null; }
    const gx = pet.tx ?? h.x - 24 * Math.sign(h.fx || 1), gy = pet.ty ?? h.y + 14;
    const kk = Math.min(1, dt * (pet.tx !== null ? 18 : 6));
    pet.x += (gx - pet.x) * kk;
    pet.y += (gy - pet.y) * kk;
  }

  // Skotten
  for (const sh of g.shots) {
    sh.life -= dt;
    if (sh.kind === 'troll') {
      const t = nearest(g, sh.x, sh.y, 120);
      if (t) {
        const want = Math.atan2(t.y - sh.y, t.x - sh.x), cur = Math.atan2(sh.vy, sh.vx), sp = Math.hypot(sh.vx, sh.vy);
        let d = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        d = clamp(d, -6 * dt, 6 * dt);
        sh.vx = Math.cos(cur + d) * sp; sh.vy = Math.sin(cur + d) * sp;
      }
    }
    sh.x += sh.vx * dt; sh.y += sh.vy * dt;
    if (sh.x < -20 || sh.x > W + 20 || sh.y < -20 || sh.y > H + 20) sh.life = 0;
    for (const f of g.foes) {
      if (sh.life <= 0) break;
      if (sh.hit.includes(f.id) || dist2(sh.x, sh.y, f.x, f.y) > (f.r + 5) ** 2) continue;
      sh.hit.push(f.id);
      hurt(g, f, sh.dmg, sh.crit, sh.kind === 'pil' ? 30 : 50, { x: sh.x - sh.vx, y: sh.y - sh.vy });
      if (--sh.pierce < 0) sh.life = 0;
    }
  }
  g.shots = g.shots.filter((sh) => sh.life > 0);

  // Monstren
  for (const f of g.foes) {
    f.flash = Math.max(0, f.flash - dt);
    f.orbitCd = Math.max(0, f.orbitCd - dt);
    f.stun = Math.max(0, f.stun - dt);
    f.stunCd = Math.max(0, f.stunCd - dt);
    f.slow = Math.max(0, f.slow - dt);
    if (auraR && dist2(h.x, h.y, f.x, f.y) < (auraR + f.r) ** 2) {
      f.slow = 0.2;
      f.hp -= 4 * lo.dmgMult * (1 + 0.2 * g.ups.skada) * dt;
      if (f.hp <= 0) f.flash = 0.12;
    }
    let vx = 0, vy = 0;
    const dx = h.x - f.x, dy = h.y - f.y, d = Math.hypot(dx, dy) || 1;
    if (f.boss) {
      const b = f.boss;
      b.t -= dt;
      b.summon -= dt;
      if (b.summon <= 0) {
        b.summon = 7;
        for (let k = 0; k < 4; k++) spawn(g, 'fladder', clamp(f.x + Math.cos(k * 1.57) * 40, 0, W), clamp(f.y + Math.sin(k * 1.57) * 40, 0, H));
      }
      if (b.state === 'walk') {
        vx = (dx / d) * f.spd; vy = (dy / d) * f.spd;
        if (b.t <= 0) { b.state = 'aim'; b.t = 1.0; b.dx = dx / d; b.dy = dy / d; }
      } else if (b.state === 'aim') {
        if (b.t <= 0) { b.state = 'charge'; b.t = 0.75; }
      } else {
        vx = b.dx * 320; vy = b.dy * 320;
        if (b.t <= 0) { b.state = 'walk'; b.t = 2.6; }
      }
    } else if (f.stun <= 0) {
      const sp = f.spd * (f.slow > 0 ? 0.5 : 1);
      vx = (dx / d) * sp; vy = (dy / d) * sp;
      if (f.kind === 'fladder') { f.wob += dt * 7; vx += (-dy / d) * Math.sin(f.wob) * 40; vy += (dx / d) * Math.sin(f.wob) * 40; }
    }
    f.x += (vx + f.kbx) * dt;
    f.y += (vy + f.kby) * dt;
    const decay = Math.exp(-8 * dt);
    f.kbx *= decay; f.kby *= decay;
    if (f.boss) { f.x = clamp(f.x, f.r, W - f.r); f.y = clamp(f.y, f.r - 50, H - f.r); }

    // Slår hjälten
    if (h.inv <= 0 && dist2(h.x, h.y, f.x, f.y) < (f.r + HERO_R - 2) ** 2) {
      if (lo.off === 'skold' && h.shield <= 0) {
        h.shield = 6;
        h.inv = 0.4;
        g.fx.push({ kind: 'ring', x: h.x, y: h.y, r: 22, t: 0, ttl: 0.3, color: '#74c0fc' });
        g.fx.push({ kind: 'num', x: h.x, y: h.y - 20, text: 'Stopp!', crit: false, t: 0, ttl: 0.8 });
      } else {
        h.hp -= Math.max(1, f.dmg - lo.armor);
        h.inv = 0.6;
        h.hurts++;
        g.shake = 0.25;
      }
      if (!f.boss) { f.kbx -= (dx / d) * 120; f.kby -= (dy / d) * 120; }
    }
  }

  // Lite knuffande så att monstren inte ligger i en enda hög
  const fs = g.foes;
  for (let i = 0; i < fs.length; i++) {
    for (let j = i + 1; j < fs.length; j++) {
      const a = fs[i], b = fs[j];
      const min = (a.r + b.r) * 0.8, ddx = b.x - a.x, ddy = b.y - a.y, dd = ddx * ddx + ddy * ddy;
      if (dd >= min * min || dd === 0) continue;
      const dl = Math.sqrt(dd), push = (min - dl) / 2;
      const ux = ddx / dl, uy = ddy / dl;
      const wa = a.boss ? 0 : b.boss ? 2 : 1, wb = b.boss ? 0 : a.boss ? 2 : 1;
      a.x -= ux * push * wa; a.y -= uy * push * wa;
      b.x += ux * push * wb; b.y += uy * push * wb;
    }
  }

  // Besegrade monster
  const alive: Foe[] = [];
  for (const f of g.foes) {
    if (f.hp > 0) { alive.push(f); continue; }
    g.kills++;
    g.fx.push({ kind: 'poof', x: f.x, y: f.y, t: 0, ttl: 0.35 });
    if (f.boss) {
      for (let k = 0; k < 3; k++) g.drops.push({ x: f.x + (k - 1) * 20, y: f.y, kind: 'blad', v: 1, pull: true, life: 99 });
      if (g.skatt) dropSkatt(g, f.x, f.y + 24);
      g.phase = 'won';
      continue;
    }
    g.drops.push({ x: f.x, y: f.y, kind: 'xp', v: FOES[f.kind].xp, pull: false, life: 99 });
    const r = g.rng.next();
    if (r < lo.bladDrop) g.drops.push({ x: f.x + 6, y: f.y, kind: 'blad', v: 1, pull: false, life: 99 });
    else if (r < lo.bladDrop + 0.015) g.drops.push({ x: f.x - 6, y: f.y, kind: 'hjarta', v: 20, pull: false, life: 15 });
  }
  g.foes = alive;

  // Saker att plocka upp
  const magnet = lo.magnet * (1 + 0.5 * g.ups.magnet);
  for (const dr of g.drops) {
    dr.life -= dt;
    const d2 = dist2(h.x, h.y, dr.x, dr.y);
    if (d2 < magnet * magnet) dr.pull = true;
    if (dr.pull) {
      const d = Math.sqrt(d2) || 1, sp = 260;
      dr.x += ((h.x - dr.x) / d) * Math.min(d, sp * dt);
      dr.y += ((h.y - dr.y) / d) * Math.min(d, sp * dt);
    }
    if (d2 < 16 * 16) {
      dr.life = 0;
      if (dr.kind === 'xp') g.xp += dr.v * lo.xpMult;
      else if (dr.kind === 'blad') g.picked++;
      else if (dr.kind === 'skatt') { g.skatter++; g.fx.push({ kind: 'text', text: 'En skattkista! 🎁', t: 0, ttl: 2 }); }
      else h.hp = Math.min(h.maxHp, h.hp + dr.v);
    }
  }
  g.drops = g.drops.filter((dr) => dr.life > 0);
  // För många kristaller: slå ihop de äldsta till en.
  const gems = g.drops.filter((dr) => dr.kind === 'xp');
  if (gems.length > MAX_GEMS) {
    const old = gems.slice(0, gems.length - MAX_GEMS + 1);
    const sum = old.reduce((a, dr) => a + dr.v, 0);
    for (const dr of old) dr.life = 0;
    g.drops = g.drops.filter((dr) => dr.life > 0);
    g.drops.push({ x: old[0].x, y: old[0].y, kind: 'xp', v: sum, pull: false, life: 99 });
  }

  for (const e of g.fx) e.t += dt;
  g.fx = g.fx.filter((e) => e.t < e.ttl);

  if (g.phase === 'won') {
    // Allt som ligger kvar plockas upp av sig självt.
    for (const dr of g.drops) if (dr.kind === 'blad') g.picked++; else if (dr.kind === 'skatt') g.skatter++;
    g.drops = [];
    return;
  }
  if (h.hp <= 0) { h.hp = 0; g.phase = 'lost'; return; }
  levelCheck(g);
}
