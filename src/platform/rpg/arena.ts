import { getHeroState, getProfile, saveHeroState } from '../profiles';
import { getInv, effectiveStats, type Stats } from './inventory';
import type { Item } from './items';
import { offOf, weaponOf, type OffKind, type WeaponKind } from './dimstorm';

// Arenan: Bossduellen. Motståndaren laddar upp och visar vilka banor slaget träffar; hjälten hoppar undan
// eller blockerar, och slår tillbaka när motståndaren är yr. Varje motståndare har nya drag, så det går inte
// att vinna genom att bara trycka på Slå. En pollett = en kväll i arenan: man möter motståndare efter
// motståndare tills man förlorar. Polletterna köps för kastanjer (lärandet kommer först) och gäller alla
// minispel. Arenan ger aldrig kastanjer (då kunde man växla pengar), bara azaleablad.

export const ARENA = {
  tokenCost: 15,
  maxTokens: 10,
  /** Polletter när alla dagens uppdrag är klara (polletterna gäller alla minispel). */
  dailyTokens: 2,
  /** Andel av livet som kommer tillbaka mellan två strider samma kväll. */
  healBetween: 0.25,
};

/* ---------- motståndarnas drag ---------- */

export type MoveId = 'slag' | 'svepV' | 'svepH' | 'stamp' | 'dubbel' | 'eld' | 'finte';

/** Vilka banor (vänster, mitten, höger) draget träffar. Stampen träffar allt och måste blockeras. */
export const MOVES: Record<MoveId, { name: string; lanes: [boolean, boolean, boolean]; dmg: number }> = {
  slag: { name: 'Rakt slag', lanes: [false, true, false], dmg: 1 },
  svepV: { name: 'Svep från vänster', lanes: [true, true, false], dmg: 1 },
  svepH: { name: 'Svep från höger', lanes: [false, true, true], dmg: 1 },
  stamp: { name: 'Stamp', lanes: [true, true, true], dmg: 1.2 },
  dubbel: { name: 'Dubbelslag', lanes: [false, true, false], dmg: 0.8 },
  eld: { name: 'Eld på sidorna', lanes: [true, false, true], dmg: 1.1 },
  /** Ser ut som ett svep från vänster men byter sida halvvägs. */
  finte: { name: 'Finten', lanes: [true, true, false], dmg: 1 },
};

export interface Opponent {
  name: string;
  icon: string;
  hp: number;
  /** Skada per träff. */
  atk: number;
  moves: MoveId[];
  /** Sekunder från att draget syns till att det slår. */
  wind: number;
  /** Sekunder motståndaren är yr efter ett missat slag. */
  open: number;
  /** Visas i listan: vad som är nytt med den här. */
  tip: string;
}

/** Stegen i Arenan. Namnen och ordningen är permanenta (rank i sparningen pekar hit). */
export const OPPONENTS: Opponent[] = [
  { name: 'Halmdockan', icon: '🌾', hp: 60, atk: 6, moves: ['slag'], wind: 1.4, open: 1.8, tip: 'Slår rakt fram. Hoppa åt sidan!' },
  { name: 'Grodkungen', icon: '🐸', hp: 90, atk: 7, moves: ['slag', 'svepV', 'svepH'], wind: 1.25, open: 1.7, tip: 'Sveper från sidorna. Hoppa åt andra hållet.' },
  { name: 'Krabban Klo', icon: '🦀', hp: 120, atk: 9, moves: ['svepV', 'svepH', 'slag'], wind: 1.1, open: 1.6, tip: 'Snabba svep med klorna.' },
  { name: 'Trollungen', icon: '👹', hp: 160, atk: 11, moves: ['slag', 'svepV', 'svepH', 'stamp'], wind: 1.05, open: 1.5, tip: 'Stampar så att hela marken skakar: blockera!' },
  { name: 'Robotten Bzzt', icon: '🤖', hp: 200, atk: 12, moves: ['slag', 'dubbel', 'svepV', 'svepH'], wind: 0.95, open: 1.4, tip: 'Slår två gånger i rad.' },
  { name: 'Stenjätten', icon: '🗿', hp: 260, atk: 15, moves: ['stamp', 'slag', 'svepV', 'svepH'], wind: 1.1, open: 1.3, tip: 'Långsam men hårdslående.' },
  { name: 'Draken Glöd', icon: '🐲', hp: 300, atk: 15, moves: ['eld', 'svepV', 'svepH', 'dubbel'], wind: 0.9, open: 1.3, tip: 'Sprutar eld på sidorna: stå kvar i mitten!' },
  { name: 'Spöket Kalle Kåre', icon: '👻', hp: 330, atk: 16, moves: ['finte', 'slag', 'eld', 'svepV'], wind: 0.85, open: 1.2, tip: 'Lurar dig: svepet kan byta sida!' },
  { name: 'Arenans mästare', icon: '🏆', hp: 380, atk: 18, moves: ['slag', 'svepV', 'svepH', 'stamp', 'dubbel', 'eld', 'finte'], wind: 0.75, open: 1.1, tip: 'Kan allt. Lycka till!' },
];

export const opponentFor = (rank: number) => OPPONENTS[Math.min(rank, OPPONENTS.length - 1)];

/* ---------- hjälten i arenan ---------- */

export interface DuelLoadout {
  weapon: WeaponKind;
  weaponIcon: string;
  off: OffKind;
  pet: string | null;
  maxHp: number;
  armor: number;
  /** Skada per slag när motståndaren är yr. */
  dmg: number;
  /** Sekunder mellan slag. */
  atkCd: number;
  /** Andel skada när motståndaren inte är yr: den blockerar närstrid, men bågens pilar når fram lite. */
  chip: number;
  crit: number;
  /** Multiplikator på uppladdningstiden (längre = lättare att hinna). */
  windMult: number;
  /** Hur mycket superslaget laddas per lyckad undanmanöver (1 = fullt). */
  charge: number;
  /** Blockerar skölden helt (och räknas som en lyckad undanmanöver)? */
  parry: boolean;
  /** Extra yr-tid när hammaren träffar. */
  stun: number;
}

export const DUEL_WEAPONS: Record<WeaponKind, { name: string; does: string; dmg: number; cd: number; chip: number }> = {
  svard: { name: 'Svärd', does: 'snabba, stadiga hugg', dmg: 6, cd: 0.35, chip: 0 },
  yxa: { name: 'Yxa', does: 'långsamma men tunga hugg', dmg: 11, cd: 0.6, chip: 0 },
  stav: { name: 'Stav', does: 'laddar superslaget snabbare', dmg: 5, cd: 0.4, chip: 0 },
  bage: { name: 'Båge', does: 'träffar lite även när motståndaren inte är yr', dmg: 5, cd: 0.3, chip: 0.3 },
  hammare: { name: 'Hammare', does: 'tunga slag som håller motståndaren yr längre', dmg: 12, cd: 0.7, chip: 0 },
  nava: { name: 'Nävarna', does: 'svaga slag – hitta ett vapen i en skattkista!', dmg: 4, cd: 0.3, chip: 0 },
};

export const DUEL_OFFHANDS: Record<Exclude<OffKind, null>, string> = {
  skold: 'blockerar helt, och efter en blockering är motståndaren yr',
  trollbok: 'laddar superslaget snabbare',
  lykta: 'lyser upp så att du ser slagen tidigare',
};

export function duelNumbers(st: Stats, weapon: WeaponKind, off: OffKind, heroClass = 'riddare') {
  const w = DUEL_WEAPONS[weapon];
  return {
    maxHp: 50 + Math.min(50, Math.floor(st.skydd * 2.5)) + (heroClass === 'riddare' ? 10 : 0),
    armor: Math.min(5, Math.floor(st.skydd / 4)),
    dmg: Math.round(w.dmg * (1 + Math.min(1, st.kraft * 0.04)) * 10) / 10,
    atkCd: Math.round((w.cd / (1 + Math.min(0.4, st.snabbhet * 0.02))) * 100) / 100,
    chip: w.chip,
    crit: Math.min(0.35, 0.05 + st.tur * 0.015 + (heroClass === 'ranger' ? 0.05 : 0)),
    windMult: 1 + Math.min(0.4, st.klurighet * 0.02) + (off === 'lykta' ? 0.2 : 0) + (heroClass === 'uppfinnare' ? 0.1 : 0),
    charge: Math.min(0.6, 0.25 * (1 + Math.min(0.6, st.visdom * 0.03)) * (weapon === 'stav' || off === 'trollbok' ? 1.5 : 1) * (heroClass === 'trollkarl' ? 1.1 : 1)),
    parry: off === 'skold',
    stun: weapon === 'hammare' ? 0.15 : 0,
  };
}

export function duelLoadout(hid: string): DuelLoadout {
  const inv = getInv(hid);
  const eq = (slot: Item['slot']) => inv.items.find((x) => x.id === inv.equipped[slot]);
  const w = eq('vapen'), o = eq('skold'), pet = eq('husdjur');
  const weapon = weaponOf(w), off = offOf(o);
  return { weapon, weaponIcon: w?.icon ?? '👊', off, pet: pet?.icon ?? null, ...duelNumbers(effectiveStats(hid), weapon, off, getProfile(hid)?.heroClass) };
}

/* ---------- polletter ---------- */

export function buyToken(hid: string): boolean {
  const s = getHeroState(hid);
  if (s.kastanjer < ARENA.tokenCost || s.polletter >= ARENA.maxTokens) return false;
  saveHeroState(hid, { ...s, kastanjer: s.kastanjer - ARENA.tokenCost, polletter: s.polletter + 1 });
  return true;
}

/** Lägger en pollett. Sparas direkt, så en omladdning mitt i en strid kostar polletten. */
export function payToken(hid: string): boolean {
  const s = getHeroState(hid);
  if (s.polletter < 1) return false;
  saveHeroState(hid, { ...s, polletter: s.polletter - 1 });
  return true;
}

/** Ger polletter upp till taket. Returnerar hur många som faktiskt gavs. */
export function giveTokens(hid: string, n: number): number {
  const s = getHeroState(hid);
  const got = Math.max(0, Math.min(n, ARENA.maxTokens - s.polletter));
  if (got) saveHeroState(hid, { ...s, polletter: s.polletter + got });
  return got;
}

/* ---------- vinster ---------- */

/** Blad för en vinst: mer för svårare motståndare, en extra utan att ha tagit skada, mindre för returmöten. */
export function duelReward(foe: number, rank: number, flawless: boolean): number {
  const fresh = foe >= rank;
  return (fresh ? 1 + Math.floor(Math.min(foe, OPPONENTS.length - 1) / 2) : 1) + (flawless ? 1 : 0);
}

/** Sparar en vinst direkt (en kväll kan ha flera). Första vinsten mot nästa motståndare flyttar fram stegen. */
export function winArena(hid: string, foe: number, flawless = false): number {
  const s = getHeroState(hid);
  const blad = duelReward(foe, s.arena.rank, flawless);
  const rank = foe >= s.arena.rank ? Math.min(foe + 1, OPPONENTS.length) : s.arena.rank;
  saveHeroState(hid, { ...s, blad: s.blad + blad, arena: { rank, wins: s.arena.wins + 1 } });
  return blad;
}
