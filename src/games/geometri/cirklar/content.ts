import type { AreaDef, BossDef, StageDef } from '../../../platform/rpg/types';
import type { Mode } from './logic';

// Stapelbäddsparken: den stora finalparken i hamnen. Cirklar och skala, med räknare och formelkort.
// Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const DUVAN: BossDef = {
  type: 'boss', id: 'diameterduvan', kind: 'monster', name: 'Diameterduvan', icon: '🕊️', title: 'Flyger aldrig hela vägen över',
  hp: 8, trap: 'radie-diameter', pool: [{ mode: 'radie', level: 0 }, { mode: 'radie', level: 1 }],
  lines: {
    entrance: 'Kuttra kuttra! Jag flyger från mitten till kanten – det är väl diametern? Hela vägen över? Pff, det orkar jag inte!',
    phase2: 'Kuttraaa! Nu med halva centimetrar!',
    onHeroMiss: ['Kuttra! Halvvägs räcker!', 'Hihi, radie, diameter, samma sak!', 'Flaxx!'],
    onBossHit: ['Kuttra?! Två radier blir en diameter?', 'Aj, mina fjädrar!', 'Hela vägen över, genom mitten…'],
    defeat: 'Radien är halva diametern – nu flyger jag hela vägen över! Får jag följa med dig? Jag kan flyga runt cirklar åt dig.',
  },
  pet: { name: 'Lilla Duvan', icon: '🕊️' }, titleReward: 'Cirkelkännaren',
};

const PIRATEN: BossDef = {
  type: 'boss', id: 'piraten-pilos', kind: 'monster', name: 'Piraten Pi-lös', icon: '🏴‍☠️', title: 'Har tappat sitt π i havet',
  hp: 8, trap: 'glomde-pi', pool: [{ mode: 'omkrets', level: 0 }, { mode: 'area', level: 0 }],
  lines: {
    entrance: 'Arrr! Omkretsen är väl samma som diametern? Det där π slängde jag överbord för länge sen! Arrr!',
    phase2: 'Arrr! Nu tar vi areorna också – utan π, såklart!',
    onHeroMiss: ['Arrr! Inget π här!', 'Hehe, π är bara för landkrabbor!', 'Yo-ho-ho!'],
    onBossHit: ['Arrr?! Drygt tre gånger diametern?', 'Aj, mitt träben!', 'Det där π var visst viktigt…'],
    defeat: 'π ≈ 3,14 – det är skatten jag letat efter hela livet! Får jag följa med dig? Jag har en papegoja som kan räkna.',
  },
  pet: { name: 'Lilla Piraten', icon: '🏴‍☠️' }, titleReward: 'Pi-jägaren',
};

const MASTARE: BossDef = {
  type: 'boss', id: 'cirkelmastaren', kind: 'mastare', name: 'Cirkelmästaren', icon: '⭕', title: 'Stapelbäddsparkens Mästare',
  hp: 12, pool: [{ mode: 'radie', level: 1 }, { mode: 'omkrets', level: 1 }, { mode: 'area', level: 1 }, { mode: 'area', level: 2 }, { mode: 'skala', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'stapelbaddsparken.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Cirkelskejtaren',
};

export const STAPELBADDSPARKEN: AreaDef = {
  areaId: 'stapelbaddsparken',
  gameId: 'cirklar',
  title: 'Stapelbäddsparken',
  kunskap: { name: 'Cirkelkraft', icon: '⭕', titles: ['Cirkelritare', 'Pi-kännare'] },
  texts: { cleared: 'Perfekt landning!', notYet: 'Minst 9 rätt för att landa – försök igen!', back: 'Till Stapelbäddsparken' },
  story: 'Stapelbäddsparken nere vid hamnen är den största parken av alla. Här finns bowlar, rundade ramper och hjul som snurrar – allt är cirklar! Här får du ta fram räknaren och formelkortet, precis som på ett riktigt prov. Nio rätt av tio, så landar du.',
  lessons: [
    { id: 'radie-diameter', title: 'Radie och diameter', icon: '⭕', desc: 'Från mitten eller tvärs över?', nodes: ['radie-och-diameter', 'diameterduvan', 'halva-centimetrar'], skills: ['ma.geo.radie-diameter'] },
    { id: 'skala', title: 'Skala', icon: '📐', desc: 'Ritningar och förstoringar', nodes: ['ritningen', 'stora-ritningar', 'forstoring'], skills: ['ma.geo.skala', 'ma.geo.skala-forstoring'] },
    { id: 'cirkelns-omkrets', title: 'Cirkelns omkrets', icon: '🛞', desc: 'π gånger diametern', nodes: ['runt-hjulet', 'fran-radien', 'piraten-pilos', 'hur-langt-rullar', 'baklanges'], skills: ['ma.geo.cirkel-omkrets'] },
    { id: 'cirkelns-area', title: 'Cirkelns area', icon: '🟠', desc: 'π gånger radien gånger radien', nodes: ['cirkelns-yta', 'fran-diametern', 'halva-bowlar', 'blandade-bowlar'], skills: ['ma.geo.cirkel-area', 'ma.geo.cirkel-delar'] },
  ],
  eras: [
    { id: 'hamnen', name: 'Hamnen', icon: '⚓', fact: 'Radien går från mitten till kanten. Diametern går tvärs över, genom mitten – den är två radier lång.',
      nodes: [
        stage('radie-och-diameter', 'Radie och diameter', '⭕', 'Från mitten eller tvärs över?', 'radie', 0, 7000),
        DUVAN,
        stage('halva-centimetrar', 'Halva centimetrar', '➗', 'Radie och diameter med decimaler', 'radie', 1, 8000),
        stage('ritningen', 'Ritningen', '📐', 'Skala 1:100', 'skala', 0, 9000),
      ] },
    { id: 'hjulen', name: 'Hjulen', icon: '🛞', fact: 'Omkretsen av en cirkel är drygt tre gånger diametern. Det talet heter π (pi): π ≈ 3,14.',
      nodes: [
        stage('runt-hjulet', 'Runt hjulet', '🛞', 'Omkretsen när diametern är given (räknare finns)', 'omkrets', 0, 20000),
        stage('fran-radien', 'Från radien', '📏', 'Omkretsen när radien är given', 'omkrets', 1, 22000),
        PIRATEN,
        stage('hur-langt-rullar', 'Hur långt rullar?', '🛹', 'Hjul som snurrar många varv', 'omkrets', 2, 25000),
      ] },
    { id: 'bowlarna', name: 'Bowlarna', icon: '🥣', fact: 'Cirkelns area = π · r · r. Har du diametern? Ta hälften först!',
      nodes: [
        stage('cirkelns-yta', 'Cirkelns yta', '🟠', 'Arean med radien (räknare finns)', 'area', 0, 22000),
        stage('fran-diametern', 'Från diametern', '🔵', 'Arean när diametern är given', 'area', 1, 24000),
        stage('halva-bowlar', 'Halva bowlar', '🌗', 'Halvcirklar och kvartscirklar', 'area', 2, 26000),
        stage('stora-ritningar', 'Stora ritningar', '🗺️', 'Skala åt båda hållen', 'skala', 2, 14000),
      ] },
    { id: 'finalen', name: 'Finalen', icon: '🏆', fact: 'Omkretsen är π · d. Vet du omkretsen kan du dela med π för att få diametern!',
      nodes: [
        stage('baklanges', 'Baklänges', '🔙', 'Från omkrets till diameter', 'omkrets', 3, 25000),
        stage('forstoring', 'Förstoring', '🔍', 'Skala 2:1, 5:1 och 10:1', 'skala', 3, 14000),
        stage('blandade-bowlar', 'Blandade bowlar', '🌀', 'Hela, halva och kvarts cirklar', 'area', 3, 26000),
        stage('stora-finalen', 'Stora finalen', '🎉', 'Allt blandat', 'blandat', 2, 22000),
      ] },
    { id: 'kranen', name: 'Kranen', icon: '🏗️', fact: 'Högst upp i den gamla hamnkranen väntar Cirkelmästaren. Därifrån ser man alla bowlar i parken.',
      nodes: [MASTARE] },
  ],
};
