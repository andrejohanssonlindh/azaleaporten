import type { AreaDef, BossDef, StageDef } from '../../../platform/rpg/types';
import type { Mode } from './logic';

// Bryggeriet: inomhusparken i det gamla bryggeriet. Area – hur stora är ytorna? Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const KRYPET: BossDef = {
  type: 'boss', id: 'kantkrypet', kind: 'monster', name: 'Kantkrypet', icon: '🐛', title: 'Kryper runt kanten i stället för över ytan',
  hp: 8, trap: 'raknade-omkrets', pool: [{ mode: 'rektangel', level: 0 }, { mode: 'rektangel', level: 1 }],
  lines: {
    entrance: 'Krypa krypa… jag kryper runt kanten på varje golv. Fyra plus tre plus fyra plus tre – fjorton! Så stort är golvet. Eller hur?',
    phase2: 'Krypa krypa! Nu tar jag de stora hallarna!',
    onHeroMiss: ['Krypa! Runt kanten, runt kanten!', 'Hihi, kanten är ju ytan?', 'Sniff sniff!'],
    onBossHit: ['Va?! Du räknade rutorna inuti!', 'Aj, jag ramlade in på ytan!', 'Gånger… inte plus?'],
    defeat: 'Arean är ytan inuti, inte kanten runt! Får jag följa med dig? Jag kan krypa över alla golv du vill mäta.',
  },
  pet: { name: 'Lilla Kantkrypet', icon: '🐛' }, titleReward: 'Areakännaren',
};

const DRAKEN: BossDef = {
  type: 'boss', id: 'dubbeldraken', kind: 'monster', name: 'Dubbeldraken', icon: '🐲', title: 'Gör allt dubbelt så stort',
  hp: 8, trap: 'glomde-halvera', pool: [{ mode: 'triangel', level: 1 }, { mode: 'triangel', level: 2 }],
  lines: {
    entrance: 'ROOOAR! Triangel? Basen gånger höjden, klart! Dela med två? Aldrig! Allt ska vara DUBBELT så stort, som jag!',
    phase2: 'ROOAR! Nu med sneda trianglar!',
    onHeroMiss: ['Rooar! Dubbelt så stort!', 'Hihi, varför dela?', 'Eld och lågor!'],
    onBossHit: ['Roar?! Halva rektangeln?', 'Aj, min svans!', 'Delat med två… hmpf.'],
    defeat: 'En triangel är halva rektangeln… därför ska man dela med två! Får jag bo hos dig? Jag kan värma upp ditt rum – lagom mycket.',
  },
  pet: { name: 'Lilla Draken', icon: '🐲' }, titleReward: 'Triangelmästaren',
};

const MASTARE: BossDef = {
  type: 'boss', id: 'ytmastaren', kind: 'mastare', name: 'Ytmästaren', icon: '🏭', title: 'Bryggeriets Mästare',
  hp: 12, pool: [{ mode: 'rutor', level: 2 }, { mode: 'rektangel', level: 2 }, { mode: 'saknad', level: 1 }, { mode: 'triangel', level: 2 }, { mode: 'sammansatt', level: 3 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'bryggeriet.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Ytskejtaren',
};

export const BRYGGERIET: AreaDef = {
  areaId: 'bryggeriet',
  gameId: 'area',
  title: 'Bryggeriet',
  kunskap: { name: 'Ytkraft', icon: '🟩' },
  texts: { cleared: 'Golvet är lagt!', notYet: 'Minst 9 rätt för att lägga golvet – försök igen!', back: 'Till Bryggeriet' },
  story: 'I det gamla bryggeriet finns en skejtpark inomhus. Nu ska det läggas nya golv och ramper – men ingen vet hur stora ytorna är! Kantkrypet har bara mätt kanterna. Hjälp till att räkna ut arean. Nio rätt av tio, så är golvet lagt.',
  eras: [
    { id: 'lagerhallen', name: 'Lagerhallen', icon: '📦', fact: 'Area är hur stor en yta är. Man kan mäta den i rutor: hur många rutor får plats?',
      nodes: [
        stage('rakna-rutor', 'Räkna rutor', '🟩', 'Hur många rutor stor är ytan?', 'rutor', 0, 7000),
        stage('rader-och-kolumner', 'Rader och kolumner', '🔢', 'Rutor i varje rad, gånger antalet rader', 'rektangel', 0, 7000),
        KRYPET,
        stage('kluriga-ytor', 'Kluriga ytor', '🧩', 'L- och T-formade ytor', 'rutor', 1, 9000),
      ] },
    { id: 'jasrummet', name: 'Jäsrummet', icon: '🫧', fact: 'Rektangelns area = basen · höjden. Arean mäts i kvadratcentimeter (cm²) eller kvadratmeter (m²).',
      nodes: [
        stage('utan-rutor', 'Utan rutor', '▭', 'Rektangelns area utan rutnät', 'rektangel', 1, 8000),
        stage('halva-rutor', 'Halva rutor', '◩', 'Två halva blir en hel', 'rutor', 2, 10000),
        stage('sidan-som-fattas', 'Sidan som fattas', '❓', 'Arean är känd – hur lång är sidan?', 'saknad', 1, 9000),
        stage('halva-rektangeln', 'Halva rektangeln', '◺', 'Triangeln på rutat papper', 'rutor', 3, 10000),
      ] },
    { id: 'tappningen', name: 'Tappningen', icon: '🍾', fact: 'En triangel är halva rektangeln runt den: basen · höjden / 2.',
      nodes: [
        stage('trianglar', 'Trianglar', '🔺', 'Rätvinkliga trianglar', 'triangel', 1, 10000),
        DRAKEN,
        stage('stora-hallar', 'Stora hallar', '🏟️', 'Areor med större tal', 'rektangel', 2, 10000),
        stage('hojden', 'Höjden', '📏', 'Trianglar med höjden inritad', 'triangel', 2, 12000),
      ] },
    { id: 'skejthallen', name: 'Skejthallen', icon: '🛹', fact: 'En L-formad yta kan delas i två rektanglar. Räkna var och en och lägg ihop!',
      nodes: [
        stage('l-golvet', 'L-golvet', '📐', 'Sammansatta figurer', 'sammansatt', 3, 18000),
        stage('decimalgolvet', 'Decimalgolvet', '🧮', 'Areor med decimaltal (räknare finns)', 'rektangel', 3, 18000),
        stage('sneda-tak', 'Sneda tak', '⛺', 'Trianglar med höjden utanför', 'triangel', 3, 14000),
        stage('golvfesten', 'Golvfesten', '🎉', 'Allt blandat', 'blandat', 2, 12000),
      ] },
    { id: 'kontoret', name: 'Kontoret', icon: '🏢', fact: 'Högst upp i bryggeriets gamla kontor sitter Ytmästaren med ritningarna över hela hallen.',
      nodes: [MASTARE] },
  ],
};
