import { getHeroState, getProfile, saveHeroState } from '../profiles';
import { getInv, effectiveStats, type Stats } from './inventory';
import type { Item } from './items';
import { offOf, weaponOf, type OffKind, type WeaponKind } from './dimstorm';

// Grottdyket: ett turordningsspel i en grotta under Azaleabyn. Ett drag i taget, så man hinner tänka.
// Utrustningen avgör hur man slåss (vapnet: närstrid, svep, skott eller bedövning; sköldplatsen: block,
// trollformel eller mer ljus) och egenskaperna sätter siffrorna. Vid varje trappa väljer barnet:
// djupare (mer skatt, mer fara) eller hem med allt. Faller man får man behålla hälften.
// Spelas med polletter och ger bara azaleablad. Själva spelet laddas först när det startar.

export interface CaveLoadout {
  weapon: WeaponKind;
  weaponIcon: string;
  off: OffKind;
  offIcon: string;
  pet: string | null;
  maxHp: number;
  armor: number;
  /** Grundskada per slag (före slump och fullträff). */
  dmg: number;
  /** Räckvidd i rutor för skott (0 = bara närstrid). */
  range: number;
  crit: number;
  /** Chans att monstren inte hinner röra sig efter ett drag. */
  haste: number;
  /** Chans per drag att se en gömd fälla inom ljuset. */
  spot: number;
  /** Ljusets radie i rutor. */
  light: number;
  potionHeal: number;
  potions: number;
  /** Chans att skölden stoppar ett slag. */
  block: number;
}

export const CAVE_WEAPONS: Record<WeaponKind, { name: string; does: string }> = {
  svard: { name: 'Svärd', does: 'ett stadigt hugg mot monstret du går in i' },
  yxa: { name: 'Yxa', does: 'svingar runt och träffar alla monster bredvid dig' },
  stav: { name: 'Stav', does: 'skjuter trollskott upp till 3 rutor rakt fram' },
  bage: { name: 'Båge', does: 'skjuter pilar upp till 4 rutor rakt fram' },
  hammare: { name: 'Hammare', does: 'hårda slag som gör monstret yrt en tur' },
  nava: { name: 'Nävarna', does: 'svaga slag – hitta ett vapen i en skattkista!' },
};

export const CAVE_OFFHANDS: Record<Exclude<OffKind, null>, { name: string; does: string }> = {
  skold: { name: 'Sköld', does: 'stoppar ibland ett slag helt' },
  trollbok: { name: 'Trollbok', does: 'en blixt mot alla monster du ser, var åttonde tur' },
  lykta: { name: 'Lykta', does: 'lyser upp mycket mer av grottan' },
};

const WEAPON_DMG: Record<WeaponKind, { dmg: number; range: number }> = {
  svard: { dmg: 5, range: 0 }, yxa: { dmg: 4, range: 0 }, stav: { dmg: 4, range: 3 },
  bage: { dmg: 3, range: 4 }, hammare: { dmg: 6, range: 0 }, nava: { dmg: 3, range: 0 },
};

/** Egenskaperna i grottan, med tak. */
export function caveNumbers(st: Stats, weapon: WeaponKind, off: OffKind, heroClass = 'riddare') {
  const w = WEAPON_DMG[weapon];
  return {
    maxHp: 30 + Math.min(30, Math.floor(st.skydd * 1.5)) + (heroClass === 'riddare' ? 5 : 0),
    armor: Math.min(4, Math.floor(st.skydd / 5)),
    dmg: Math.round(w.dmg * (1 + Math.min(1, st.kraft * 0.04)) * 10) / 10,
    range: w.range,
    crit: Math.min(0.35, 0.05 + st.tur * 0.015 + (heroClass === 'ranger' ? 0.05 : 0)),
    haste: Math.min(0.3, st.snabbhet * 0.015),
    spot: Math.min(0.9, 0.15 + st.klurighet * 0.05 + (heroClass === 'uppfinnare' ? 0.2 : 0)),
    light: off === 'lykta' ? 5 : 3,
    potionHeal: 10 + Math.min(15, st.visdom),
    potions: (st.visdom >= 8 ? 1 : 0) + (heroClass === 'trollkarl' ? 1 : 0),
    block: off === 'skold' ? 0.25 : 0,
  };
}

export function caveLoadout(hid: string): CaveLoadout {
  const inv = getInv(hid);
  const eq = (slot: Item['slot']) => inv.items.find((x) => x.id === inv.equipped[slot]);
  const w = eq('vapen'), o = eq('skold'), pet = eq('husdjur');
  const weapon = weaponOf(w), off = offOf(o);
  return {
    weapon, weaponIcon: w?.icon ?? '👊', off, offIcon: o?.icon ?? '', pet: pet?.icon ?? null,
    ...caveNumbers(effectiveStats(hid), weapon, off, getProfile(hid)?.heroClass),
  };
}

/* ---------- framsteg ---------- */

/** Hem med skatten = allt. Föll man får man behålla hälften (avrundat uppåt, så att något alltid blir kvar). */
export const caveKeep = (blad: number, home: boolean) => (home ? blad : Math.ceil(blad / 2));

/** Sparar ett avslutat dyk. Returnerar antal blad som barnet fick. */
export function finishCave(hid: string, r: { depth: number; blad: number; home: boolean }): number {
  const s = getHeroState(hid);
  const blad = caveKeep(r.blad, r.home);
  saveHeroState(hid, { ...s, blad: s.blad + blad, grotta: { best: Math.max(s.grotta.best, r.depth), dives: s.grotta.dives + 1 } });
  return blad;
}
