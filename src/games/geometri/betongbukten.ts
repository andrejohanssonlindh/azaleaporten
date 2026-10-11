import type { AreaDef, BossDef } from '../../platform/rpg/types';

// Betongbuktens regionboss: Mästaren över alla skejtparker. Blandar frågor från alla parker.
// Personan (lärar-bossen) ligger på boss-platsen 'betongbukten.region'. Id:n är permanenta.

const REGIONSBOSS: BossDef = {
  type: 'boss', id: 'tavlingsmastaren', kind: 'mastare', name: 'Betongbuktens Mästare', icon: '👑', title: 'Mästaren över alla parker',
  hp: 15, personaId: 'betongbukten.region',
  pool: [
    { mode: 'fluffy/namn', level: 2 }, { mode: 'fluffy/horn', level: 2 },
    { mode: 'svampen/spegla', level: 1 }, { mode: 'svampen/linjer', level: 1 },
    { mode: 'oxie/omkrets', level: 1 }, { mode: 'oxie/enheter', level: 1 },
    { mode: 'sibbarp/sort', level: 1 }, { mode: 'sibbarp/gradskiva', level: 1 },
    { mode: 'bryggeriet/rektangel', level: 1 }, { mode: 'bryggeriet/triangel', level: 1 },
    { mode: 'kroksback/delar', level: 1 }, { mode: 'kroksback/volym', level: 1 },
    { mode: 'stapelbaddsparken/radie', level: 0 }, { mode: 'stapelbaddsparken/omkrets', level: 0 },
  ],
  lines: { entrance: '', defeat: '' },
  titleReward: 'Buktens hjälte',
};

export const BETONGBUKTENS_TOPP: AreaDef = {
  areaId: 'betongbukten',
  gameId: 'betongbukten',
  title: 'Den stora tävlingen',
  region: { id: 'betongbukten', mastareNeeded: 3 },
  kunskap: { name: 'Betongkraft', icon: '👑', titles: ['Betongskejtare', 'Betongbuktens hjälte'] },
  texts: { cleared: 'Tävlingen är vunnen!', notYet: 'Försök igen!', back: 'Till Betongbukten' },
  story: 'En gång om året hålls den stora tävlingen i Betongbukten. Mästaren över alla parker blandar allt: former, speglar, mått, vinklar, ytor, kroppar och cirklar.',
  eras: [{ id: 'tavlingen', name: 'Tävlingen', icon: '🏆', fact: 'Bara den som besegrat tre av parkernas Mästare får vara med i den stora tävlingen.', nodes: [REGIONSBOSS] }],
};
