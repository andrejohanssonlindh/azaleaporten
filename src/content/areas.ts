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
import { BETONGBUKTENS_TOPP } from '../games/geometri/betongbukten';
import { FLUFFY } from '../games/geometri/former/content';
import { former } from '../games/geometri/former';
import { SVAMPEN } from '../games/geometri/symmetri/content';
import { symmetri } from '../games/geometri/symmetri';
import { OXIE } from '../games/geometri/langd/content';
import { langd } from '../games/geometri/langd';
import { SIBBARP } from '../games/geometri/vinklar/content';
import { vinklar } from '../games/geometri/vinklar';
import { BRYGGERIET } from '../games/geometri/area/content';
import { area } from '../games/geometri/area';
import { KROKSBACK } from '../games/geometri/kroppar/content';
import { kroppar } from '../games/geometri/kroppar';
import { STAPELBADDSPARKEN } from '../games/geometri/cirklar/content';
import { cirklar } from '../games/geometri/cirklar';

// Spelbara områden: områdets innehåll + spelet som levererar frågorna.
const AREAS: Record<string, { def: AreaDef; game: GameModule }> = {
  tidstornet: { def: TIDSTORNET, game: klocka },
  tiokompisbron: { def: TIOKOMPISBRON, game: tiokompis },
  tabellgruvan: { def: TABELLGRUVAN, game: tabeller },
  myntmarknaden: { def: MYNTMARKNADEN, game: pengar },
  tallinjebron: { def: TALLINJEBRON, game: tallinje },
  brakbageriet: { def: BRAKBAGERIET, game: brak },
  fluffy: { def: FLUFFY, game: former },
  svampen: { def: SVAMPEN, game: symmetri },
  oxie: { def: OXIE, game: langd },
  sibbarp: { def: SIBBARP, game: vinklar },
  bryggeriet: { def: BRYGGERIET, game: area },
  kroksback: { def: KROKSBACK, game: kroppar },
  stapelbaddsparken: { def: STAPELBADDSPARKEN, game: cirklar },
};

// Regionbossar: en blandning av regionens spel.
const gamesOf = (region: string) => Object.fromEntries(REGIONS.find((r) => r.id === region)!.areas.filter((a) => AREAS[a.id]).map((a) => [a.id, AREAS[a.id].game]));

export const PLAYABLE: Record<string, { def: AreaDef; game: GameModule }> = {
  ...AREAS,
  talbergen: { def: TALBERGEN_TOPPEN, game: regionGame('talbergen', gamesOf('talbergen')) },
  betongbukten: { def: BETONGBUKTENS_TOPP, game: regionGame('betongbukten', gamesOf('betongbukten')) },
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
