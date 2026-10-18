import { getHeroState, getProfile, saveHeroState } from '../profiles';
import { getInv, effectiveStats, type Stats } from './inventory';
import type { Item } from './items';
import { offOf, weaponOf, type OffKind, type WeaponKind } from './dimstorm';

// Trasselvinden: ett pusselspel på en vind full av trassliga rep. Barnet drar pinnarna tills inga rep
// korsar varandra, och knutarna blir större för varje steg. Samtidigt kryper vindsmonster fram, och
// barnet trycker på dem för att slå. Utrustningen avgör hur slagen fungerar och egenskaperna sätter
// siffrorna. Spelas med polletter och ger bara azaleablad. Själva spelet laddas först när det startar.

export interface KnutLoadout {
  weapon: WeaponKind;
  weaponIcon: string;
  off: OffKind;
  offIcon: string;
  pet: string | null;
  maxHp: number;
  armor: number;
  /** Grundskada per slag (före slump och fullträff). */
  dmg: number;
  /** Sekunder innan nästa slag. */
  cd: number;
  crit: number;
  /** Chans att ett besegrat monster tappar ett azaleablad. */
  bladChance: number;
  /** Kluriga knuffar (ledtrådar) per runda. */
  hints: number;
  /** Liv tillbaka för varje löst knut. */
  heal: number;
  /** Multiplikator på monstrens fart (lyktan saktar ner dem). */
  slow: number;
  /** Chans att skölden stoppar ett bett. */
  block: number;
}

export const KNUT_WEAPONS: Record<WeaponKind, { name: string; does: string }> = {
  svard: { name: 'Svärd', does: 'ett stadigt hugg mot monstret du trycker på' },
  yxa: { name: 'Yxa', does: 'svingar brett och träffar monster som står nära' },
  stav: { name: 'Stav', does: 'trollskottet studsar vidare till ett monster till' },
  bage: { name: 'Båge', does: 'svagare pilar, men du skjuter snabbt' },
  hammare: { name: 'Hammare', does: 'tunga slag som gör monstret yrt en stund' },
  nava: { name: 'Nävarna', does: 'svaga slag – hitta ett vapen i en skattkista!' },
};

export const KNUT_OFFHANDS: Record<Exclude<OffKind, null>, { name: string; does: string }> = {
  skold: { name: 'Sköld', does: 'stoppar ibland ett bett helt' },
  trollbok: { name: 'Trollbok', does: 'en blixt mot alla monster var femtonde sekund' },
  lykta: { name: 'Lykta', does: 'ljuset bländar monstren så att de kryper långsammare' },
};

const WEAPON: Record<WeaponKind, { dmg: number; cd: number }> = {
  svard: { dmg: 5, cd: 0.4 }, yxa: { dmg: 4, cd: 0.55 }, stav: { dmg: 4, cd: 0.5 },
  bage: { dmg: 3, cd: 0.28 }, hammare: { dmg: 6, cd: 0.6 }, nava: { dmg: 3, cd: 0.4 },
};

/** Egenskaperna på vinden, med tak. */
export function knutNumbers(st: Stats, weapon: WeaponKind, off: OffKind, heroClass = 'riddare') {
  const w = WEAPON[weapon];
  return {
    maxHp: 20 + Math.min(20, st.skydd) + (heroClass === 'riddare' ? 5 : 0),
    armor: Math.min(3, Math.floor(st.skydd / 6)),
    dmg: Math.round(w.dmg * (1 + Math.min(1, st.kraft * 0.04)) * 10) / 10,
    cd: Math.round((w.cd / (1 + Math.min(0.6, st.snabbhet * 0.03))) * 100) / 100,
    crit: Math.min(0.35, 0.05 + st.tur * 0.015 + (heroClass === 'ranger' ? 0.05 : 0)),
    bladChance: Math.min(0.5, 0.15 + st.tur * 0.02),
    hints: 1 + Math.min(3, Math.floor(st.klurighet / 4)) + (heroClass === 'uppfinnare' ? 1 : 0),
    heal: 3 + Math.min(12, st.visdom) + (heroClass === 'trollkarl' ? 3 : 0),
    slow: off === 'lykta' ? 0.75 : 1,
    block: off === 'skold' ? 0.25 : 0,
  };
}

export function knutLoadout(hid: string): KnutLoadout {
  const inv = getInv(hid);
  const eq = (slot: Item['slot']) => inv.items.find((x) => x.id === inv.equipped[slot]);
  const w = eq('vapen'), o = eq('skold'), pet = eq('husdjur');
  const weapon = weaponOf(w), off = offOf(o);
  return {
    weapon, weaponIcon: w?.icon ?? '👊', off, offIcon: o?.icon ?? '', pet: pet?.icon ?? null,
    ...knutNumbers(effectiveStats(hid), weapon, off, getProfile(hid)?.heroClass),
  };
}

/* ---------- framsteg ---------- */

/** Var femte knut är en startpunkt: när man har löst knuten före får man börja där. */
export const knutStarts = (best: number) => {
  const out: number[] = [];
  for (let l = 1; l <= best + 1; l += 5) out.push(l);
  return out;
};

export interface KnutResult { best: number; solved: number; blad: number; kills: number; skatter: number; fell: boolean }

/** Rundans resultat ur spelets tillstånd. best = den högsta knuten som löstes (0 = ingen). */
export const knutResult = (g: { level: number; solved: number; phase: string; blad: number; kills: number; skatter: number }): KnutResult => ({
  best: g.solved ? g.level - (g.phase === 'solved' ? 0 : 1) : 0, solved: g.solved, blad: g.blad, kills: g.kills, skatter: g.skatter, fell: g.phase === 'dead',
});

/** Sparar en avslutad runda. best = den högsta knuten som löstes (0 = ingen). Allt man fått behålls. */
export function finishKnut(hid: string, r: { best: number; blad: number }): number {
  const s = getHeroState(hid);
  saveHeroState(hid, { ...s, blad: s.blad + r.blad, trassel: { best: Math.max(s.trassel.best, r.best), runs: s.trassel.runs + 1 } });
  return r.blad;
}
