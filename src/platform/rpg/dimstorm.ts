import { getHeroState, getProfile, saveHeroState } from '../profiles';
import { getInv, heroStats, type Stats } from './inventory';
import type { Item } from './items';

// Dimstormen: ett actionspel där hjälten står emot monster ur Glömskans dimma i några minuter.
// Utrustningen avgör HUR man slåss: vapnet ger attacken, sköldplatsen en extra förmåga, husdjuret hjälper till,
// och egenskaperna sätter siffrorna. Spelas med polletter (köps för kastanjer), så lärandet kommer först.
// Ger bara azaleablad, aldrig kastanjer. Själva spelet (sim + vy) laddas först när det startas.

export type WeaponKind = 'svard' | 'yxa' | 'stav' | 'bage' | 'hammare' | 'nava';
export type OffKind = 'skold' | 'trollbok' | 'lykta' | null;

export interface Loadout {
  weapon: WeaponKind;
  weaponIcon: string;
  off: OffKind;
  offIcon: string;
  /** Husdjurets ikon, eller null utan husdjur. */
  pet: string | null;
  maxHp: number;
  /** Dras av från varje slag hjälten tar (minst 1 kvar). */
  armor: number;
  /** Multiplikator på all skada. */
  dmgMult: number;
  /** Multiplikator på väntetiden mellan attacker (lägre = snabbare). */
  cdMult: number;
  /** Rörelse i enheter per sekund. */
  moveSpeed: number;
  crit: number;
  /** Chans per besegrat monster att tappa ett azaleablad. */
  bladDrop: number;
  /** Räckvidd för att plocka upp saker. */
  magnet: number;
  /** Multiplikator på dimkristaller (fler nivåer i stormen). */
  xpMult: number;
  /** Antal kort att välja mellan vid ny nivå. */
  choices: number;
}

export const WEAPONS: Record<WeaponKind, { name: string; does: string }> = {
  svard: { name: 'Svärd', does: 'hugger i en båge mot närmaste monster' },
  yxa: { name: 'Yxa', does: 'snurrar runt och slår alla nära dig, och knuffar bort dem' },
  stav: { name: 'Stav', does: 'skjuter trollskott som letar upp monstren' },
  bage: { name: 'Båge', does: 'skjuter snabba pilar som går igenom ett monster' },
  hammare: { name: 'Hammare', does: 'slår i marken så att en chockvåg bedövar allt runt dig' },
  nava: { name: 'Nävarna', does: 'slår nära – hitta ett vapen i en skattkista!' },
};

export const OFFHANDS: Record<Exclude<OffKind, null>, { name: string; does: string }> = {
  skold: { name: 'Sköld', does: 'stoppar ett slag var sjätte sekund' },
  trollbok: { name: 'Trollbok', does: 'en bok flyger runt dig och slår monstren' },
  lykta: { name: 'Lykta', does: 'ljuset bränner och saktar ner monster nära dig' },
};

const BASE_WEAPON: Record<string, WeaponKind> = { svard: 'svard', yxa: 'yxa', stav: 'stav', bage: 'bage', hammare: 'hammare' };
const BASE_OFF: Record<string, OffKind> = { skold: 'skold', trollbok: 'trollbok', lykta: 'lykta' };

/** Unika föremål (signatur från en Mästare) räknas som stav respektive trollbok, som i HeroFigure. */
export const weaponOf = (it?: Item): WeaponKind => (!it ? 'nava' : BASE_WEAPON[it.base] ?? 'stav');
export const offOf = (it?: Item): OffKind => (!it ? null : BASE_OFF[it.base] ?? 'trollbok');

/** Egenskaperna i Dimstormen. Allt har tak, så att utrustning hjälper mycket men aldrig gör det trivialt. */
export function stormNumbers(st: Stats, heroClass = 'riddare') {
  return {
    maxHp: 100 + Math.min(100, st.skydd * 5) + (heroClass === 'riddare' ? 20 : 0),
    armor: Math.min(6, Math.floor(st.skydd / 4)),
    dmgMult: 1 + Math.min(1, st.kraft * 0.04),
    cdMult: 1 / (1 + Math.min(0.45, st.snabbhet * 0.015)),
    moveSpeed: Math.round(115 * (1 + Math.min(0.35, st.snabbhet * 0.015))),
    crit: Math.min(0.35, 0.05 + st.tur * 0.015 + (heroClass === 'ranger' ? 0.05 : 0)),
    bladDrop: Math.min(0.04, 0.012 + st.tur * 0.0015),
    magnet: 40 + Math.min(80, st.klurighet * 4),
    xpMult: 1 + Math.min(0.6, st.visdom * 0.03) + (heroClass === 'trollkarl' ? 0.1 : 0),
    choices: st.klurighet >= 10 || heroClass === 'uppfinnare' ? 4 : 3,
  };
}

export function stormLoadout(hid: string): Loadout {
  const inv = getInv(hid);
  const eq = (slot: Item['slot']) => inv.items.find((x) => x.id === inv.equipped[slot]);
  const w = eq('vapen'), o = eq('skold'), pet = eq('husdjur');
  const off = offOf(o);
  return {
    weapon: weaponOf(w), weaponIcon: w?.icon ?? '👊',
    off, offIcon: o?.icon ?? '',
    pet: pet?.icon ?? null,
    ...stormNumbers(heroStats(hid), getProfile(hid)?.heroClass),
  };
}

/* ---------- framsteg ---------- */

/** Antal vågor innan stormens jätte kommer. */
export const STORM_WAVES = 5;

/** Belöning: plockade blad + 1 per klarad våg + vinstbonus som växer med steget. Aldrig kastanjer. */
export function stormReward(r: { steg: number; waves: number; won: boolean; picked: number }) {
  return r.picked + Math.min(STORM_WAVES, r.waves) + (r.won ? 1 + r.steg : 0);
}

/** Sparar en avslutad storm. En vinst på det högsta öppna steget öppnar nästa. Returnerar antal blad. */
export function finishStorm(hid: string, r: { steg: number; waves: number; won: boolean; picked: number }): number {
  const s = getHeroState(hid);
  const blad = stormReward(r);
  const storm = {
    steg: r.won && r.steg >= s.storm.steg ? r.steg + 1 : s.storm.steg,
    wins: s.storm.wins + (r.won ? 1 : 0),
    best: Math.max(s.storm.best, r.won ? r.steg : 0),
  };
  saveHeroState(hid, { ...s, blad: s.blad + blad, storm });
  return blad;
}
