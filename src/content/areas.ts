import type { AreaDef, GameModule } from '../platform/rpg/types';
import { TIDSTORNET } from '../games/klocka/content';
import { klocka } from '../games/klocka';

// Spelbara områden: områdets innehåll + spelet som levererar frågorna.
export const PLAYABLE: Record<string, { def: AreaDef; game: GameModule }> = {
  tidstornet: { def: TIDSTORNET, game: klocka },
};

export const playable = (areaId: string) => PLAYABLE[areaId];
