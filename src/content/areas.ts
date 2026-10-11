import type { AreaDef, GameModule } from '../platform/rpg/types';
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
export const PLAYABLE: Record<string, { def: AreaDef; game: GameModule }> = {
  tidstornet: { def: TIDSTORNET, game: klocka },
  tiokompisbron: { def: TIOKOMPISBRON, game: tiokompis },
  tabellgruvan: { def: TABELLGRUVAN, game: tabeller },
  myntmarknaden: { def: MYNTMARKNADEN, game: pengar },
  tallinjebron: { def: TALLINJEBRON, game: tallinje },
  brakbageriet: { def: BRAKBAGERIET, game: brak },
};

export const playable = (areaId: string) => PLAYABLE[areaId];
