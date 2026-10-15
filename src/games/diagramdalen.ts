import type { AreaDef, BossDef } from '../platform/rpg/types';

// Diagramdalens regionboss: Mästaren över hela dalen, högst upp i utsiktstornet. Blandar frågor från alla
// områden i Diagramdalen. Personan ligger på boss-platsen 'diagramdalen.region' (Doktor Diagram i det publika
// bygget). Id:n är permanenta.

const AREAS = ['fageltornet', 'skordemarknaden', 'vaderstationen', 'omrostningstorget', 'vagmastarens-bod', 'spegelsalen', 'skvallerpressen'];

const REGIONSBOSS: BossDef = {
  type: 'boss', id: 'diagramdalen-mastaren', kind: 'mastare', name: 'Diagramdalens Mästare', icon: '📊', title: 'Mästaren över hela Diagramdalen',
  hp: 15, personaId: 'diagramdalen.region',
  pool: AREAS.flatMap((a) => [{ mode: `${a}/blandat`, level: 0 }, { mode: `${a}/blandat`, level: 1 }]),
  lines: { entrance: '', defeat: '' },
  titleReward: 'Diagramdalens hjälte',
};

export const UTSIKTSTORNET: AreaDef = {
  areaId: 'diagramdalen',
  gameId: 'diagramdalen',
  title: 'Utsiktstornet',
  region: { id: 'diagramdalen', mastareNeeded: 3 },
  kunskap: { name: 'Statistik', icon: '📊', titles: ['Dalens statistiker', 'Diagramdalens väktare'] },
  texts: { cleared: 'Hela dalen syns från tornet!', notYet: 'Försök igen!', back: 'Till Diagramdalen' },
  story: 'Högst upp i utsiktstornet ser man hela dalen: fågeltornet, marknaden, väderstationen, torget, boden – och tivolits spegelsal. Här väntar Mästaren över hela Diagramdalen. Här blandas allt!',
  eras: [{ id: 'utsiktstornet', name: 'Utsiktstornet', icon: '🔭', fact: 'Bara den som besegrat tre av Diagramdalens Mästare får gå upp i utsiktstornet.', nodes: [REGIONSBOSS] }],
};
