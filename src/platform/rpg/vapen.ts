import type { Item } from './items';

// Vapengrupper: sten-sax-påse. Närstrid slår magi, magi slår avstånd, avstånd slår närstrid.
// Påverkar bara skadan i strider (aldrig vad som räknas som rätt). Ett "svagt" vapen tar bort en del av
// utrustningens bonus men går aldrig under grundskadan, så fel vapen gör aldrig en strid svårare än utan vapen.
// Grupp-id:n är permanenta.

export type Group = 'narstrid' | 'avstand' | 'magi';

export const GROUPS: Record<Group, { name: string; icon: string }> = {
  narstrid: { name: 'Närstrid', icon: '⚔️' },
  avstand: { name: 'Avstånd', icon: '🏹' },
  magi: { name: 'Magi', icon: '✨' },
};

/** Vilken grupp varje grupp slår. */
export const BEATS: Record<Group, Group> = { narstrid: 'magi', magi: 'avstand', avstand: 'narstrid' };
/** Gruppen som slår g. */
export const beatenBy = (g: Group) => (Object.keys(BEATS) as Group[]).find((k) => BEATS[k] === g)!;

const WEAPON_GROUP: Record<string, Group> = { svard: 'narstrid', yxa: 'narstrid', hammare: 'narstrid', bage: 'avstand', stav: 'magi' };

/** Vapnets grupp (unika signaturvapen ritas som stavar och räknas som magi). */
export function weaponGroup(it: Item | undefined): Group | null {
  if (!it || it.slot !== 'vapen') return null;
  if (it.base.startsWith('signatur:')) return 'magi';
  return WEAPON_GROUP[it.base] ?? null;
}

/** En fiendes grupp: uttalad, annars bestämd av id:t (samma varje gång). */
export function foeGroup(id: string, explicit?: Group): Group {
  if (explicit) return explicit;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (['narstrid', 'avstand', 'magi'] as const)[h % 3];
}

export type Matchup = 'stark' | 'svag' | null;

export function matchup(weapon: Group | null, foe: Group): Matchup {
  if (!weapon) return null;
  if (BEATS[weapon] === foe) return 'stark';
  if (BEATS[foe] === weapon) return 'svag';
  return null;
}

export const MATCHUP = { stark: 3, svag: -2, base: 10 };

/** Skadan efter vapengrupp. Svag går aldrig under grundskadan. */
export function withMatchup(dmg: number, m: Matchup): number {
  if (m === 'stark') return dmg + MATCHUP.stark;
  if (m === 'svag') return Math.max(Math.min(dmg, MATCHUP.base), dmg + MATCHUP.svag);
  return dmg;
}
