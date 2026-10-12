import type { AreaDef, BossDef } from '../platform/rpg/types';

// Västeröns regionboss: Mästaren över hela ön, högst upp i fyren. Blandar frågor från alla områden på Västerön.
// Personan ligger på boss-platsen 'vasteron.region' (Mr. Wordsworth i det publika bygget). Id:n är permanenta.

const REGIONSBOSS: BossDef = {
  type: 'boss', id: 'vasteron-mastaren', kind: 'mastare', name: 'Västeröns Mästare', icon: '🗼', title: 'Mästaren över hela Västerön',
  hp: 15, personaId: 'vasteron.region',
  pool: [
    { mode: 'glosviken/blandat', level: 1 }, { mode: 'glosviken/blandat', level: 2 },
    { mode: 'hamnen/blandat', level: 0 }, { mode: 'hamnen/blandat', level: 1 },
    { mode: 'big-ben-tornet/blandat', level: 2 }, { mode: 'big-ben-tornet/blandat', level: 3 },
    { mode: 'stavklippan/blandat', level: 0 }, { mode: 'stavklippan/blandat', level: 1 },
    { mode: 'piratskeppet/blandat', level: 0 }, { mode: 'piratskeppet/blandat', level: 1 },
  ],
  lines: { entrance: '', defeat: '' },
  titleReward: 'Fyrens hjälte',
};

export const VASTERONS_FYR: AreaDef = {
  areaId: 'vasteron',
  gameId: 'vasteron',
  title: 'Västeröns fyr',
  region: { id: 'vasteron', mastareNeeded: 3 },
  kunskap: { name: 'Västerökraft', icon: '🗼', titles: ['Västeröfarare', 'Västeröns hjälte'] },
  texts: { cleared: 'Fyren lyser för dig!', notYet: 'Försök igen!', back: 'Till Västerön' },
  story: 'Längst ut på Västerön står en gammal fyr. Där uppe, där ljuset snurrar, väntar Mästaren över hela ön. Här blandas allt: glosor, hörförståelse, klockan, stavning och grammatik – allt på engelska!',
  eras: [{ id: 'fyren', name: 'Fyren', icon: '🗼', fact: 'Bara den som besegrat tre av Västeröns Mästare hittar trappan upp i fyren.', nodes: [REGIONSBOSS] }],
};
