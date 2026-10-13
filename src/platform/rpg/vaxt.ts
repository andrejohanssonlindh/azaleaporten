import { allNodes } from './types';
import { getArea, nodeDone } from './progress';
import { PLAYABLE } from '../../content/areas';
import { REGIONS, type RegionId } from '../../content/world';
import { getHeroState, saveHeroState } from '../profiles';

// Ön växer: varje region på kartan får nya detaljer när hjälten kommer längre där.
// Stegen bygger bara på saker som aldrig går tillbaka (avklarade banor, besegrade Mästare),
// så att en region aldrig krymper, inte heller när nya områden öppnar.
//   1 = första banan klar, 2 = första Mästaren, 3 = tre Mästare, 4 = regionbossen besegrad.

export type Steg = 0 | 1 | 2 | 3 | 4;
export const MAX_STEG: Steg = 4;
const MASTARE_FOR_STEG3 = 3;

export function regionSteg(hid: string, rid: RegionId): Steg {
  const region = REGIONS.find((r) => r.id === rid);
  if (!region) return 0;
  const boss = Object.entries(PLAYABLE).find(([, p]) => p.def.region?.id === rid);
  if (boss) {
    const nodes = allNodes(boss[1].def);
    const bp = getArea(hid, boss[0]);
    if (nodes.length && nodes.every((n) => nodeDone(bp, n))) return 4;
  }
  let started = false;
  let mastare = 0;
  for (const a of region.areas) {
    const pl = PLAYABLE[a.id];
    if (!pl) continue;
    const p = getArea(hid, a.id);
    if (Object.values(p.stages).some((s) => s.cleared)) started = true;
    if (allNodes(pl.def).some((n) => n.type === 'boss' && n.kind === 'mastare' && p.bosses[n.id]?.defeated)) mastare++;
  }
  if (mastare >= MASTARE_FOR_STEG3) return 3;
  if (mastare >= 1) return 2;
  return started ? 1 : 0;
}

export function allSteg(hid: string): Record<RegionId, Steg> {
  return Object.fromEntries(REGIONS.map((r) => [r.id, regionSteg(hid, r.id)])) as Record<RegionId, Steg>;
}

/** Regioner som har vuxit sedan hjälten senast såg kartan. */
export function grownSince(hid: string, now: Record<RegionId, Steg>): RegionId[] {
  const seen = getHeroState(hid).oSteg;
  return (Object.keys(now) as RegionId[]).filter((r) => now[r] > (seen[r] ?? 0));
}

/** Kommer ihåg vad hjälten har sett, så att växandet bara firas en gång. */
export function markSeen(hid: string, now: Record<RegionId, Steg>) {
  const s = getHeroState(hid);
  const seen = { ...s.oSteg };
  let changed = false;
  for (const [r, n] of Object.entries(now)) if (n > (seen[r] ?? 0)) { seen[r] = n; changed = true; }
  if (changed) saveHeroState(hid, { ...s, oSteg: seen });
}
