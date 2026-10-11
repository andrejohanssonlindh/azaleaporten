import { allNodes, type AreaDef, type GameModule } from '../platform/rpg/types';
import { getArea } from '../platform/rpg/progress';
import { REGIONS } from './world';
import { regionGame } from '../games/region';
import { TALBERGEN_TOPPEN } from '../games/talbergen';
import { TIDSTORNET } from '../games/klocka/content';
import { klocka } from '../games/klocka';
import { TIOKOMPISBRON } from '../games/tiokompis/content';
import { tiokompis } from '../games/tiokompis';
import { TABELLGRUVAN } from '../games/tabeller/content';
import { tabeller } from '../games/tabeller';
import { MYNTMARKNADEN } from '../games/pengar/content';
import { pengar } from '../games/pengar';
import { TALLINJEBRON } from '../games/tallinje/content';
import { tallinje } from '../games/tallinje';
import { BRAKBAGERIET } from '../games/brak/content';
import { brak } from '../games/brak';

// Spelbara områden: områdets innehåll + spelet som levererar frågorna.
const AREAS: Record<string, { def: AreaDef; game: GameModule }> = {
  tidstornet: { def: TIDSTORNET, game: klocka },
  tiokompisbron: { def: TIOKOMPISBRON, game: tiokompis },
  tabellgruvan: { def: TABELLGRUVAN, game: tabeller },
  myntmarknaden: { def: MYNTMARKNADEN, game: pengar },
  tallinjebron: { def: TALLINJEBRON, game: tallinje },
  brakbageriet: { def: BRAKBAGERIET, game: brak },
};

// Regionbossar: en blandning av regionens spel.
const talbergenGames = Object.fromEntries(REGIONS.find((r) => r.id === 'talbergen')!.areas.filter((a) => AREAS[a.id]).map((a) => [a.id, AREAS[a.id].game]));

export const PLAYABLE: Record<string, { def: AreaDef; game: GameModule }> = {
  ...AREAS,
  talbergen: { def: TALBERGEN_TOPPEN, game: regionGame('talbergen', talbergenGames) },
};

export const playable = (areaId: string) => PLAYABLE[areaId];

/** Hur många av regionens Mästare hjälten har besegrat, och hur många som krävs för regionbossen. */
export function regionProgress(hid: string, def: AreaDef): { have: number; need: number; open: boolean } {
  if (!def.region) return { have: 0, need: 0, open: true };
  const areas = REGIONS.find((r) => r.id === def.region!.id)?.areas ?? [];
  const have = areas.filter((a) => {
    const pl = AREAS[a.id];
    const m = pl && allNodes(pl.def).find((n) => n.type === 'boss' && n.kind === 'mastare');
    return m && getArea(hid, a.id).bosses[m.id]?.defeated;
  }).length;
  return { have, need: def.region.mastareNeeded, open: have >= def.region.mastareNeeded };
}
