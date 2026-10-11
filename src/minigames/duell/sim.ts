import { rngFrom, type Rng } from '../../platform/rng';
import { ARENA, MOVES, OPPONENTS, type DuelLoadout, type MoveId } from '../../platform/rpg/arena';

// Bossduellens motor: ren logik utan DOM. Tre banor (vänster, mitten, höger). Motståndaren laddar upp ett drag
// och visar vilka banor det träffar; hjälten hoppar undan (en stund, sedan tillbaka till mitten) eller blockerar.
// Ett slag som missar gör motståndaren yr, och då gör hjältens slag full skada.

export type Lane = -1 | 0 | 1;
export type FoeState = 'idle' | 'wind' | 'strike' | 'open';

export const HOP_SECS = 0.7;
export const BLOCK_SECS = 0.5;
const BLOCK_CD = 0.85;
const STRIKE_SECS = 0.3;

export interface Foe {
  idx: number;
  hp: number;
  maxHp: number;
  state: FoeState;
  /** Tid i nuvarande läge och hur länge det varar. */
  t: number;
  dur: number;
  move: MoveId | null;
  lanes: [boolean, boolean, boolean];
  /** Dubbelslaget: slag kvar i draget. */
  hitsLeft: number;
  /** Ökas varje gång motståndaren slår (för vyns animation). */
  strikes: number;
}

export interface Hero {
  hp: number; maxHp: number;
  lane: Lane;
  /** Tid kvar ute på sidan innan hjälten kliver tillbaka till mitten. */
  hop: number;
  block: number; blockCd: number;
  atkCd: number;
  /** Superslaget, 0–1. */
  special: number;
  petCd: number;
  swings: number;
}

export type Fx = { id: number; kind: 'num' | 'text'; text: string; who: 'hero' | 'foe'; big: boolean; t: number };

export type Phase = 'fight' | 'won' | 'lost';

export interface Duel {
  lo: DuelLoadout;
  rng: Rng;
  t: number;
  phase: Phase;
  foe: Foe;
  hero: Hero;
  /** Träffar hjälten tagit mot den här motståndaren (0 = utan en skråma). */
  hitsTaken: number;
  fx: Fx[];
  nextId: number;
}

const newFoe = (idx: number): Foe => {
  const o = OPPONENTS[idx];
  return { idx, hp: o.hp, maxHp: o.hp, state: 'idle', t: 0, dur: 1.2, move: null, lanes: [false, false, false], hitsLeft: 0, strikes: 0 };
};

export function newDuel(lo: DuelLoadout, idx: number, seed: number): Duel {
  return {
    lo, rng: rngFrom(seed), t: 0, phase: 'fight', foe: newFoe(idx),
    hero: { hp: lo.maxHp, maxHp: lo.maxHp, lane: 0, hop: 0, block: 0, blockCd: 0, atkCd: 0, special: 0, petCd: 0, swings: 0 },
    hitsTaken: 0, fx: [], nextId: 1,
  };
}

/** Nästa motståndare samma kväll: hjälten får tillbaka en del av livet. */
export function nextFoe(d: Duel) {
  const idx = Math.min(d.foe.idx + 1, OPPONENTS.length - 1);
  d.foe = newFoe(idx);
  const h = d.hero;
  h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * ARENA.healBetween));
  Object.assign(h, { lane: 0, hop: 0, block: 0, blockCd: 0, atkCd: 0 });
  d.hitsTaken = 0;
  d.phase = 'fight';
  d.fx = [];
}

const say = (d: Duel, text: string, who: 'hero' | 'foe', big = false, kind: Fx['kind'] = 'text') => d.fx.push({ id: d.nextId++, kind, text, who, big, t: 0 });

/* ---------- hjältens knappar ---------- */

export type Input = 'left' | 'right' | 'block' | 'attack' | 'special';

export function press(d: Duel, input: Input) {
  if (d.phase !== 'fight') return;
  const h = d.hero, f = d.foe;
  switch (input) {
    case 'left':
    case 'right':
      if (h.block > 0) return;
      h.lane = input === 'left' ? -1 : 1;
      h.hop = HOP_SECS;
      return;
    case 'block':
      if (h.blockCd > 0) return;
      h.lane = 0; h.hop = 0;
      h.block = BLOCK_SECS;
      h.blockCd = BLOCK_CD;
      return;
    case 'attack':
    case 'special': {
      const sp = input === 'special';
      if (h.lane !== 0 || h.block > 0 || (sp ? h.special < 1 : h.atkCd > 0)) return;
      const open = f.state === 'open';
      const crit = d.rng.next() < d.lo.crit;
      const mult = sp ? (open ? 5 : 2.5) : open ? 1 : d.lo.chip;
      h.atkCd = d.lo.atkCd;
      h.swings++;
      if (!mult) { say(d, '🛡️ Blockerat!', 'foe'); return; }
      const n = Math.max(1, Math.round(d.lo.dmg * mult * (crit ? 2 : 1)));
      f.hp -= n;
      if (sp) { h.special = 0; say(d, '✨ Superslag!', 'foe', true); }
      say(d, `−${n}`, 'foe', crit || sp, 'num');
      if (open && d.lo.stun) f.dur = Math.min(f.dur + d.lo.stun, OPPONENTS[f.idx].open * 1.6);
      if (f.hp <= 0) { f.hp = 0; d.phase = 'won'; say(d, `${OPPONENTS[f.idx].name} är besegrad!`, 'foe', true); }
    }
  }
}

/* ---------- tiden går ---------- */

function startMove(d: Duel, move: MoveId) {
  const f = d.foe, o = OPPONENTS[f.idx];
  f.move = move;
  f.lanes = [...MOVES[move].lanes];
  f.hitsLeft = move === 'dubbel' ? 2 : 1;
  f.state = 'wind';
  f.t = 0;
  f.dur = o.wind * d.lo.windMult;
}

/** Slaget landar: träffar det hjältens bana? */
function strike(d: Duel) {
  const f = d.foe, h = d.hero, o = OPPONENTS[f.idx];
  f.strikes++;
  const hit = f.lanes[h.lane + 1];
  let dodged = !hit;
  if (hit && h.block > 0 && d.lo.parry) { dodged = true; say(d, '🛡️ Parerat!', 'hero', true); }
  else if (hit) {
    const raw = o.atk * MOVES[f.move!].dmg * (0.9 + d.rng.next() * 0.2) - d.lo.armor;
    const n = Math.max(1, Math.round(h.block > 0 ? raw * 0.4 : raw));
    h.hp -= n;
    d.hitsTaken++;
    say(d, h.block > 0 ? `🛡️ −${n}` : `−${n}`, 'hero', false, 'num');
    if (h.hp <= 0) { h.hp = 0; d.phase = 'lost'; return; }
  } else say(d, 'Miss!', 'foe');

  if (dodged) h.special = Math.min(1, h.special + d.lo.charge);
  f.hitsLeft--;
  if (f.hitsLeft > 0) {
    // Andra slaget i dubbelslaget kommer snabbt.
    f.state = 'wind'; f.t = 0; f.dur = 0.45 * d.lo.windMult;
    return;
  }
  if (dodged && f.move !== 'stamp') {
    f.state = 'open'; f.t = 0; f.dur = o.open;
    say(d, '💫 Yr! Slå nu!', 'foe', true);
  } else if (dodged) {
    // Stampen: en parad ger också en öppning.
    f.state = 'open'; f.t = 0; f.dur = o.open * 0.8;
    say(d, '💫 Yr! Slå nu!', 'foe', true);
  } else {
    f.state = 'strike'; f.t = 0; f.dur = STRIKE_SECS;
  }
}

export function step(d: Duel, dt: number) {
  if (d.phase !== 'fight') { for (const e of d.fx) e.t += dt; d.fx = d.fx.filter((e) => e.t < 1); return; }
  d.t += dt;
  const h = d.hero, f = d.foe, o = OPPONENTS[f.idx];
  h.atkCd = Math.max(0, h.atkCd - dt);
  h.blockCd = Math.max(0, h.blockCd - dt);
  h.block = Math.max(0, h.block - dt);
  if (h.hop > 0) { h.hop -= dt; if (h.hop <= 0) { h.hop = 0; h.lane = 0; } }

  f.t += dt;
  if (f.state === 'wind' && f.move === 'finte' && f.hitsLeft === 1 && f.lanes[0] && f.t >= f.dur * 0.55) {
    f.lanes = [false, true, true];
    say(d, 'Finte!', 'foe');
  }
  if (f.t >= f.dur) {
    if (f.state === 'wind') strike(d);
    else if (f.state === 'open' || f.state === 'strike') { f.state = 'idle'; f.t = 0; f.dur = 0.4 + d.rng.next() * 0.6; f.move = null; f.lanes = [false, false, false]; }
    else startMove(d, d.rng.pick(o.moves));
  }

  // Husdjuret biter när motståndaren är yr.
  if (d.lo.pet && f.state === 'open' && d.phase === 'fight') {
    h.petCd -= dt;
    if (h.petCd <= 0) {
      h.petCd = 0.7;
      const n = Math.max(2, Math.round(d.lo.dmg * 0.4));
      f.hp -= n;
      say(d, `${d.lo.pet} −${n}`, 'foe', false, 'num');
      if (f.hp <= 0) { f.hp = 0; d.phase = 'won'; say(d, `${o.name} är besegrad!`, 'foe', true); }
    }
  }

  for (const e of d.fx) e.t += dt;
  d.fx = d.fx.filter((e) => e.t < 1);
}

/** Hur långt uppladdningen har kommit (0–1), för vyns röda banor. */
export const windPart = (f: Foe) => (f.state === 'wind' ? Math.min(1, f.t / f.dur) : 0);
