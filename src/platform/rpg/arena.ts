import { getHeroState, saveHeroState } from '../profiles';
import type { Stats } from './inventory';

// Arenan (prototyp): ett minispel där hjältens utrustning avgör. Det spelas med polletter som köps för
// kastanjer, så lärandet kommer först. Arenan ger aldrig kastanjer (då kunde man växla pengar), bara azaleablad.

export const ARENA = {
  tokenCost: 15,
  maxTokens: 10,
  /** Polletter när alla dagens uppdrag är klara (polletterna gäller både Arenan och Dimstormen). */
  dailyTokens: 2,
};

export interface Opponent { name: string; icon: string; hp: number; atk: number }

/** Stegen i Arenan. Hjälten möter alltid nästa motståndare; mästaren kan man utmana om och om igen. */
export const OPPONENTS: Opponent[] = [
  { name: 'Halmdockan', icon: '🌾', hp: 30, atk: 2 },
  { name: 'Grodkungen', icon: '🐸', hp: 40, atk: 3 },
  { name: 'Krabban Klo', icon: '🦀', hp: 50, atk: 4 },
  { name: 'Trollungen', icon: '👹', hp: 60, atk: 5 },
  { name: 'Robotten Bzzt', icon: '🤖', hp: 75, atk: 6 },
  { name: 'Stenjätten', icon: '🗿', hp: 90, atk: 7 },
  { name: 'Draken Glöd', icon: '🐲', hp: 110, atk: 8 },
  { name: 'Spöket Kalle Kåre', icon: '👻', hp: 130, atk: 9 },
  { name: 'Arenans mästare', icon: '🏆', hp: 160, atk: 10 },
];

export const opponentFor = (rank: number) => OPPONENTS[Math.min(rank, OPPONENTS.length - 1)];

/** Hur egenskaperna märks i Arenan. Allt har tak så att utrustning hjälper men inte gör det tråkigt lätt. */
export function arenaStats(st: Stats, rank: number) {
  return {
    hp: 30 + Math.min(30, st.skydd * 3),
    dmg: 6 + Math.min(10, Math.floor(st.kraft / 2)),
    /** Bredd på träffzonen (andel av mätaren). Klurighet gör den bredare. */
    hitZone: Math.min(0.45, 0.3 + st.klurighet * 0.01),
    /** Bredd på fullträffzonen i mitten. Tur gör den bredare. */
    critZone: Math.min(0.16, 0.06 + st.tur * 0.01),
    /** Varv per sekund för mätaren. Snabbhet saktar ner den. */
    speed: (0.55 + Math.min(rank, OPPONENTS.length - 1) * 0.07) / (1 + Math.min(st.snabbhet, 20) * 0.03),
    /** Motståndarens slag mot hjälten. */
    hurt: Math.max(1, opponentFor(rank).atk - Math.floor(st.skydd / 3)),
    /** Extra azaleablad vid vinst. */
    bonusBlad: Math.min(2, Math.floor(st.visdom / 5)),
  };
}

export type Swing = 'miss' | 'hit' | 'crit';

/** Var mätaren stannade (0–1) → miss, träff eller fullträff. Zonerna ligger mitt på mätaren. */
export function swingAt(pos: number, a: { hitZone: number; critZone: number }): Swing {
  const d = Math.abs(pos - 0.5);
  if (d <= a.critZone / 2) return 'crit';
  if (d <= a.hitZone / 2) return 'hit';
  return 'miss';
}

/** Mätarens läge (0–1, fram och tillbaka) efter t sekunder. */
export const meterAt = (t: number, speed: number) => {
  const x = (t * speed) % 2;
  return x <= 1 ? x : 2 - x;
};

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

/** Vinst: azaleablad och nästa motståndare. Returnerar antal blad. */
export function winArena(hid: string, bonusBlad: number): number {
  const s = getHeroState(hid);
  const rank = s.arena.rank;
  const blad = 1 + Math.floor(Math.min(rank, OPPONENTS.length - 1) / 2) + bonusBlad;
  saveHeroState(hid, { ...s, blad: s.blad + blad, arena: { rank: Math.min(rank + 1, OPPONENTS.length), wins: s.arena.wins + 1 } });
  return blad;
}

/** Ger polletter upp till taket. Returnerar hur många som faktiskt gavs. */
export function giveTokens(hid: string, n: number): number {
  const s = getHeroState(hid);
  const got = Math.max(0, Math.min(n, ARENA.maxTokens - s.polletter));
  if (got) saveHeroState(hid, { ...s, polletter: s.polletter + got });
  return got;
}
