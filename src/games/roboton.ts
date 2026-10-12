import type { AreaDef, BossDef } from '../platform/rpg/types';

// Robotöns regionboss: Mästaren över hela ön, inne i robotfabriken. Blandar frågor från alla områden på Robotön.
// Personan ligger på boss-platsen 'roboton.region' (Mega-Robo i det publika bygget). Id:n är permanenta.

const REGIONSBOSS: BossDef = {
  type: 'boss', id: 'roboton-mastaren', kind: 'mastare', name: 'Robotöns Mästare', icon: '🏭', title: 'Mästaren över hela Robotön',
  hp: 15, personaId: 'roboton.region',
  pool: [
    { mode: 'logikslingan/blandat', level: 0 }, { mode: 'logikslingan/blandat', level: 1 },
    { mode: 'kodstigen/blandat', level: 0 }, { mode: 'kodstigen/blandat', level: 1 },
    { mode: 'loopverkstaden/blandat', level: 0 }, { mode: 'loopverkstaden/blandat', level: 1 },
    { mode: 'buggjakten/blandat', level: 0 }, { mode: 'buggjakten/blandat', level: 1 },
    { mode: 'pythonhamnen/blandat', level: 0 }, { mode: 'pythonhamnen/blandat', level: 1 },
  ],
  lines: { entrance: '', defeat: '' },
  titleReward: 'Robotöns hjälte',
};

export const ROBOTFABRIKEN: AreaDef = {
  areaId: 'roboton',
  gameId: 'roboton',
  title: 'Robotfabriken',
  region: { id: 'roboton', mastareNeeded: 3 },
  kunskap: { name: 'Robotkraft', icon: '🏭', titles: ['Robotfarare', 'Robotöns skyddshelgon'] },
  texts: { cleared: 'Fabriken surrar av glädje!', notYet: 'Försök igen!', back: 'Till Robotön' },
  story: 'Mitt på Robotön ligger den stora robotfabriken. Där inne, bland transportband och blinkande lampor, väntar Mästaren över hela ön. Här blandas allt: logik, robotstyrning, loopar, buggar och Python!',
  eras: [{ id: 'fabriken', name: 'Fabriken', icon: '🏭', fact: 'Bara den som besegrat tre av Robotöns Mästare får komma in i fabriken.', nodes: [REGIONSBOSS] }],
};
