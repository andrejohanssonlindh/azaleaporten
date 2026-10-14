import type { AreaDef, BossDef } from '../platform/rpg/types';

// Ordskogens regionboss: Mästaren över hela Ordskogen, i det gamla trädet mitt i skogen. Blandar frågor från alla områden i Ordskogen.
// Personan ligger på boss-platsen 'ordskogen.region' (Fru Grammatika i det publika bygget). Id:n är permanenta.

const REGIONSBOSS: BossDef = {
  type: 'boss', id: 'ordskogen-mastaren', kind: 'mastare', name: 'Ordskogens Mästare', icon: '🌳', title: 'Mästaren över hela Ordskogen',
  hp: 15, personaId: 'ordskogen.region',
  pool: [
    { mode: 'stavningstrasket/blandat', level: 1 }, { mode: 'stavningstrasket/blandat', level: 2 },
    { mode: 'rimbacken/blandat', level: 0 }, { mode: 'rimbacken/blandat', level: 1 },
    { mode: 'meningssmedjan/blandat', level: 0 }, { mode: 'meningssmedjan/blandat', level: 1 },
    { mode: 'ordklassernas-tempel/blandat', level: 0 }, { mode: 'ordklassernas-tempel/blandat', level: 1 },
    { mode: 'berattelsebiblioteket/blandat', level: 0 }, { mode: 'berattelsebiblioteket/blandat', level: 1 },
  ],
  lines: { entrance: '', defeat: '' },
  titleReward: 'Ordskogens hjälte',
};

export const ORDSKOGENS_HJARTA: AreaDef = {
  areaId: 'ordskogen',
  gameId: 'ordskogen',
  title: 'Ordskogens hjärta',
  region: { id: 'ordskogen', mastareNeeded: 3 },
  kunskap: { name: 'Ordskogskraft', icon: '🌳', titles: ['Ordskogsvandrare', 'Ordskogens väktare'] },
  texts: { cleared: 'Hela skogen susar för dig!', notYet: 'Försök igen!', back: 'Till Ordskogen' },
  story: 'Mitt i Ordskogen står det äldsta trädet av alla. I dess hjärta väntar Mästaren över hela skogen. Här blandas allt: stavning, rim, meningar, ordklasser och läsning!',
  eras: [{ id: 'hjartat', name: 'Hjärtat', icon: '🌳', fact: 'Bara den som besegrat tre av Ordskogens Mästare hittar stigen in till det äldsta trädet.', nodes: [REGIONSBOSS] }],
};
