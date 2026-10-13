import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';
import type { Mode } from './logic';

// Bråkbageriet: ett bageri inne i Talbergen där allt delas i bitar. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const GLUFSGRISEN: BossDef = {
  type: 'boss', id: 'glufsgrisen', kind: 'monster', name: 'Glufsgrisen', icon: '🐷', title: 'Vill alltid ha biten med störst siffra',
  hp: 8, trap: 'storre-namnare', pool: [{ mode: 'jamfor', level: 0 }, { mode: 'jamfor', level: 1 }],
  lines: {
    entrance: 'Nöff! En åttondel eller en fjärdedel? Åtta är ju mer än fyra, så jag tar åttondelen! Nöff nöff… varför blir jag aldrig mätt?',
    phase2: 'Nöff! Nu vill jag ha tolftedelar – tolv är ÄNNU mer!',
    onHeroMiss: ['Nöff, större siffra = större bit!', 'Hihi, du tänker som jag!', 'Smask!'],
    onBossHit: ['Nöff?! Fler bitar blir mindre bitar?', 'Aj, min mage!', 'Du tog den stora biten!'],
    defeat: 'Fler bitar betyder mindre bitar… det är därför jag alltid var hungrig! Får jag följa med dig? Jag delar gärna min paj.',
  },
  pet: { name: 'Lilla Glufsgrisen', icon: '🐷' }, titleReward: 'Bitkännaren',
};

const TARTMUSEN: BossDef = {
  type: 'boss', id: 'tartmusen', kind: 'monster', name: 'Tårtmusen', icon: '🐭', title: 'Lägger ihop allt – även nämnarna',
  hp: 8, trap: 'adderade-namnare', pool: [{ mode: 'addera', level: 1 }, { mode: 'addera', level: 2 }],
  lines: {
    entrance: 'Pip! En fjärdedel plus en fjärdedel blir två åttondelar, det vet väl alla! Jag lägger ihop ALLT – över och under strecket!',
    phase2: 'Piip! Nu plussar jag hela tårtor!',
    onHeroMiss: ['Pip, nämnarna ihop!', 'Hihi, fler bitar, fler bitar!', 'Tårtsmulor!'],
    onBossHit: ['Pip?! Bitarna är lika stora?', 'Aj, min svans i grädden!', 'Rätt igen…'],
    defeat: 'Bitarna har samma storlek – bara antalet ändras. Nu fattar jag! Får jag bo i ditt skafferi? Jag äter bara smulor.',
  },
  pet: { name: 'Lilla Tårtmusen', icon: '🐭' }, titleReward: 'Tårtmästaren',
};

const BAGARMASTAREN: BossDef = {
  type: 'boss', id: 'bagarmastaren', kind: 'mastare', name: 'Bagarmästaren', icon: '🥧', title: 'Bråkbageriets Mästare',
  hp: 12, pool: [{ mode: 'jamfor', level: 2 }, { mode: 'lika', level: 2 }, { mode: 'delav', level: 2 }, { mode: 'addera', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'brakbageriet.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Mästerbagaren',
};

export const BRAKBAGERIET: AreaDef = {
  areaId: 'brakbageriet',
  gameId: 'brak',
  title: 'Bråkbageriet',
  kunskap: { name: 'Bråkkraft', icon: '🥧', titles: ['Bråkbagare', 'Bråkgeni'] },
  texts: { cleared: 'Nybakat!', notYet: 'Degen behöver minst 9 rätt för att jäsa – försök igen!', back: 'Till bageriet' },
  story: 'I Bråkbageriet delas allt i bitar: pajer, tårtor och chokladkakor. Men bagarlärlingarna har blandat ihop beställningarna! Hjälp dem dela rätt – nio rätt av tio, så är plåten klar.',
  lessons: [
    { id: 'vad-ar-ett-brak', title: 'Vad är ett bråk?', icon: '🥧', desc: 'Täljare och nämnare', nodes: ['halvor-och-fjardedelar', 'fler-bitar'], skills: ['ma.brak.namnge'] },
    { id: 'jamfor-brak', title: 'Vilken bit är störst?', icon: '⚖️', desc: 'Jämför bråk – fler bitar är mindre bitar', nodes: ['samma-bitar', 'storst-bit', 'glufsgrisen', 'nastan-hela'], skills: ['ma.brak.jamfor-namnare', 'ma.brak.jamfor-taljare', 'ma.brak.jamfor-halv'] },
    { id: 'del-av', title: 'Del av ett antal', icon: '🥯', desc: 'Dela med nämnaren, gånger med täljaren', nodes: ['del-av-bullarna', 'del-av-mer', 'manga-delar-av'], skills: ['ma.brak.del-av'] },
    { id: 'lika-stora', title: 'Lika stora bråk', icon: '🟰', desc: 'Förlänga och förkorta', nodes: ['lika-stora', 'stora-likheter'], skills: ['ma.brak.likvardiga'] },
    { id: 'plus-med-brak', title: 'Plus och minus med bråk', icon: '➕', desc: 'Nämnaren är bitarnas storlek', nodes: ['lagg-ihop-bitar', 'tartmusen', 'ta-bort-bitar'], skills: ['ma.brak.addera', 'ma.brak.subtrahera'] },
  ],
  eras: [
    { id: 'disken', name: 'Disken', icon: '🧁', fact: 'Ett bråk som 3/4 betyder: delat i 4 lika stora bitar, och 3 av dem.',
      nodes: [
        stage('halvor-och-fjardedelar', 'Halvor och fjärdedelar', '🥧', 'Hur stor del är färgad?', 'namnge', 0, 7000),
        stage('fler-bitar', 'Fler bitar', '🍫', 'Namnge bråk upp till åttondelar', 'namnge', 1, 8000),
        stage('samma-bitar', 'Samma bitar', '⚖️', 'Jämför bråk med samma nämnare', 'jamfor', 0, 7000),
        stage('del-av-bullarna', 'Del av bullarna', '🥯', 'Hälften och fjärdedelen av ett antal', 'delav', 0, 8000),
      ] },
    { id: 'ugnen', name: 'Ugnen', icon: '🔥', fact: 'Ju fler bitar en paj delas i, desto mindre blir varje bit. 1/8 är mindre än 1/4!',
      nodes: [
        stage('storst-bit', 'Störst bit', '🍰', 'Jämför bråk med samma täljare', 'jamfor', 1, 7000),
        GLUFSGRISEN,
        stage('del-av-mer', 'Mer delar av', '🍩', 'En tredjedel, fjärdedel, femtedel av …', 'delav', 1, 9000),
        stage('lika-stora', 'Lika stora', '🟰', 'Likvärdiga bråk: 1/2 = 2/4', 'lika', 1, 9000),
      ] },
    { id: 'tartverkstan', name: 'Tårtverkstan', icon: '🎂', fact: 'Bitar av samma sort kan läggas ihop: 2/8 + 3/8 = 5/8. Nämnaren visar bara bitarnas storlek.',
      nodes: [
        stage('lagg-ihop-bitar', 'Lägg ihop bitar', '➕', 'Plus med samma nämnare', 'addera', 1, 9000),
        stage('nastan-hela', 'Nästan hela', '🌗', 'Mer eller mindre än en halv?', 'jamfor', 2, 8000),
        TARTMUSEN,
        stage('manga-delar-av', 'Många delar av', '🥨', '3/4 av 20 och liknande', 'delav', 2, 10000),
      ] },
    { id: 'festsalen', name: 'Festsalen', icon: '🎉', fact: '6/8 och 3/4 är exakt lika mycket paj – man har bara delat bitarna olika.',
      nodes: [
        stage('stora-likheter', 'Stora likheter', '🟰', 'Förläng och förkorta bråk', 'lika', 3, 10000),
        stage('ta-bort-bitar', 'Ta bort bitar', '➖', 'Plus och minus med bråk', 'addera', 3, 10000),
        stage('kalaset', 'Kalaset', '🎈', 'Allt blandat', 'blandat', 3, 10000),
      ] },
    { id: 'bagarstugan', name: 'Bagarstugan', icon: '🏠', fact: 'Längst in i bageriet, där det doftar mest, bakar Bagarmästaren.',
      nodes: [BAGARMASTAREN] },
  ],
};
