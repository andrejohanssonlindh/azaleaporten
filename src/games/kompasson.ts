import type { AreaDef, BossDef } from '../platform/rpg/types';

// Kompassöns regionboss: Mästaren över hela ön, högst upp i observatoriet vid den gyllene jordgloben.
// Blandar frågor från alla områden på Kompassön. Personan ligger på boss-platsen 'kompasson.region'
// (Atlas, titanen som bär världen, i det publika bygget). Id:n är permanenta.

const AREAS = ['kartrummet', 'globen', 'sverigeresan', 'ballongresan', 'huvudstadsexpressen', 'flaggmasten'];

const REGIONSBOSS: BossDef = {
  type: 'boss', id: 'kompasson-mastaren', kind: 'mastare', name: 'Kompassöns Mästare', icon: '🌐', title: 'Mästaren över hela Kompassön',
  hp: 15, personaId: 'kompasson.region',
  pool: AREAS.flatMap((a) => [{ mode: `${a}/blandat`, level: 0 }, { mode: `${a}/blandat`, level: 1 }]),
  lines: { entrance: '', defeat: '' },
  titleReward: 'Kompassöns hjälte',
};

export const OBSERVATORIET: AreaDef = {
  areaId: 'kompasson',
  gameId: 'kompasson',
  title: 'Observatoriet',
  region: { id: 'kompasson', mastareNeeded: 3 },
  kunskap: { name: 'Världskännedom', icon: '🌐', titles: ['Kompassöns väktare', 'Världens kartmästare'] },
  texts: { cleared: 'Den gyllene globen lyser!', notYet: 'Försök igen!', back: 'Till Kompassön' },
  story: 'Högst upp i observatoriet, under den gyllene jordgloben, väntar Mästaren över hela Kompassön. Här blandas allt: kartor, världsdelar, Sverige, länder, huvudstäder och flaggor!',
  eras: [{ id: 'observatoriet', name: 'Observatoriet', icon: '🔭', fact: 'Bara den som besegrat tre av Kompassöns Mästare får gå upp i observatoriets torn.', nodes: [REGIONSBOSS] }],
};
