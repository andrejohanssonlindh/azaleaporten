import type { AreaDef, BossDef } from '../platform/rpg/types';

// Talbergens regionboss: Mästaren över hela berget. Blandar frågor från alla områden i Talbergen.
// Personan (lärar-bossen) ligger på boss-platsen 'talbergen.region'. Id:n är permanenta.

const REGIONSBOSS: BossDef = {
  type: 'boss', id: 'regionsmastaren', kind: 'mastare', name: 'Talbergens Mästare', icon: '👑', title: 'Mästaren över hela Talbergen',
  hp: 15, personaId: 'talbergen.region',
  pool: [
    { mode: 'tidstornet/words', level: 6 }, { mode: 'tidstornet/clock', level: 6 },
    { mode: 'tiokompisbron/plus', level: 2 }, { mode: 'tiokompisbron/minus', level: 2 },
    { mode: 'tabellgruvan/ganger', level: 2 }, { mode: 'tabellgruvan/delat', level: 1 },
    { mode: 'myntmarknaden/vaxel', level: 1 }, { mode: 'myntmarknaden/pris', level: 1 },
    { mode: 'tallinjebron/las', level: 1 }, { mode: 'tallinjebron/avrunda', level: 0 },
    { mode: 'brakbageriet/namnge', level: 1 }, { mode: 'brakbageriet/jamfor', level: 0 },
  ],
  lines: { entrance: '', defeat: '' },
  titleReward: 'Bergets hjälte',
};

export const TALBERGEN_TOPPEN: AreaDef = {
  areaId: 'talbergen',
  gameId: 'talbergen',
  title: 'Talbergens topp',
  region: { id: 'talbergen', mastareNeeded: 3 },
  kunskap: { name: 'Bergskraft', icon: '👑', titles: ['Bergsklättrare', 'Talbergens hjälte'] },
  texts: { cleared: 'Toppen är din!', notYet: 'Försök igen!', back: 'Till Talbergen' },
  story: 'Högst upp på Talbergen, ovanför molnen, väntar Mästaren över hela berget. Här blandas allt: klockor, tabeller, pengar, tallinjer och bråk.',
  eras: [{ id: 'toppen', name: 'Toppen', icon: '🏔️', fact: 'Bara den som besegrat tre av bergets Mästare hittar stigen hit upp.', nodes: [REGIONSBOSS] }],
};
