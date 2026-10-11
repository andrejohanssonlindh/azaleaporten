import type { AreaDef, BossDef, StageDef } from '../../../platform/rpg/types';
import type { Mode } from './logic';

// Oxie skatepark: här mäts allt – ramper, räcken och hela banan runt. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const MASKEN: BossDef = {
  type: 'boss', id: 'matmasken', kind: 'monster', name: 'Mätmasken', icon: '🪱', title: 'Läser bara av där det tar slut',
  hp: 8, trap: 'lasta-slutet', pool: [{ mode: 'linjal', level: 1 }, { mode: 'linjal', level: 2 }],
  lines: {
    entrance: 'Slingra slingra! Brädan slutar vid nian, alltså är den nio centimeter. Var den börjar? Det bryr jag mig inte om! Jag har mätt alla ramper i parken – fel!',
    phase2: 'Slingra! Nu mäter jag halva centimetrar också!',
    onHeroMiss: ['Slingra! Där den slutar, där den slutar!', 'Hihi, nollan är väl inte så viktig?', 'Mät mät!'],
    onBossHit: ['Va?! Du tittade var den började!', 'Aj, jag knöt mig!', 'Skillnaden… såklart.'],
    defeat: 'Längden är från början till slut – inte bara slutet! Får jag följa med dig? Jag kan vara ditt måttband.',
  },
  pet: { name: 'Lilla Mätmasken', icon: '🪱' }, titleReward: 'Linjalkännaren',
};

const KRABBAN: BossDef = {
  type: 'boss', id: 'kantkrabban', kind: 'monster', name: 'Kantkrabban', icon: '🦀', title: 'Går bara längs två sidor',
  hp: 8, trap: 'bara-tva-sidor', pool: [{ mode: 'omkrets', level: 1 }, { mode: 'omkrets', level: 2 }],
  lines: {
    entrance: 'Klick klack! Jag går i sidled längs kanten – men bara två sidor, sen blir jag trött. Omkretsen är väl de sidor som har siffror?',
    phase2: 'Klick klack! Nu tar jag sexhörningar – en sida räcker väl?',
    onHeroMiss: ['Klick! Två sidor räcker!', 'Hihi, varför gå hela vägen?', 'Klack klack!'],
    onBossHit: ['Klick?! Hela vägen runt?', 'Aj, mina klor!', 'Sidorna mitt emot… är lika långa?'],
    defeat: 'Omkretsen är hela vägen runt… även sidorna utan siffror. Får jag följa med dig? Jag går gärna runt kanten åt dig.',
  },
  pet: { name: 'Lilla Kantkrabban', icon: '🦀' }, titleReward: 'Omkretsmästaren',
};

const MASTARE: BossDef = {
  type: 'boss', id: 'mattmastaren', kind: 'mastare', name: 'Måttmästaren', icon: '📏', title: 'Oxies Mästare',
  hp: 12, pool: [{ mode: 'linjal', level: 2 }, { mode: 'enheter', level: 2 }, { mode: 'omkrets', level: 2 }, { mode: 'saknad', level: 1 }, { mode: 'omkrets', level: 3 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'oxie.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Måttskejtaren',
};

export const OXIE: AreaDef = {
  areaId: 'oxie',
  gameId: 'langd',
  title: 'Oxie skatepark',
  kunskap: { name: 'Mätkraft', icon: '📏' },
  texts: { cleared: 'Måttet stämmer!', notYet: 'Minst 9 rätt för att klara rampen – försök igen!', back: 'Till Oxie' },
  story: 'I Oxie skatepark mäts allt: ramper, räcken och hela banan runt. Men Mätmasken och Kantkrabban har mätt fel överallt, och nu passar ingenting! Hjälp till att mäta rätt. Nio rätt av tio klarar en ramp.',
  eras: [
    { id: 'verkstaden', name: 'Verkstaden', icon: '🔧', fact: 'Längden är från där något börjar till där det slutar. Börjar det på noll kan du läsa av direkt.',
      nodes: [
        stage('fran-noll', 'Från noll', '📏', 'Mät med linjalen', 'linjal', 0, 6000),
        stage('mitt-pa-linjalen', 'Mitt på linjalen', '📐', 'När det inte börjar på noll', 'linjal', 1, 8000),
        MASKEN,
        stage('enheterna', 'Enheterna', '🔁', 'Meter, decimeter, centimeter, millimeter', 'enheter', 0, 7000),
      ] },
    { id: 'banan', name: 'Banan', icon: '🛤️', fact: 'Omkretsen är sträckan runt en figur – alla sidor tillsammans.',
      nodes: [
        stage('runt-rampen', 'Runt rampen', '🔲', 'Omkretsen när alla sidor har mått', 'omkrets', 0, 9000),
        stage('mitt-emot', 'Mitt emot', '↔️', 'Rektanglar och kvadrater med få mått', 'omkrets', 1, 9000),
        KRABBAN,
        stage('halva-centimetrar', 'Halva centimetrar', '✏️', 'Mät med halva centimetrar', 'linjal', 2, 9000),
      ] },
    { id: 'langa-raka', name: 'Långa raka', icon: '🛹', fact: '1 m = 100 cm, och 1 km = 1000 m. Till en mindre enhet: gånger. Till en större: delat.',
      nodes: [
        stage('byt-enhet', 'Byt enhet', '🔄', 'Fram och tillbaka mellan enheterna', 'enheter', 1, 8000),
        stage('sidan-som-fattas', 'Sidan som fattas', '❓', 'Omkretsen är känd – vilken sida fattas?', 'saknad', 1, 11000),
        stage('manga-sidor', 'Många sidor', '⬡', 'Trianglar, femhörningar och sexhörningar', 'omkrets', 2, 12000),
        stage('stora-tal', 'Stora tal', '🔢', 'Kilometer, meter och millimeter', 'enheter', 2, 10000),
      ] },
    { id: 'tavlingsbanan', name: 'Tävlingsbanan', icon: '🏁', fact: 'En L-formad figur har lika lång omkrets som rektangeln runt den. Klurigt, va?',
      nodes: [
        stage('millimeter', 'Millimeter', '🔬', 'Mät exakt i millimeter', 'linjal', 3, 10000),
        stage('l-formen', 'L-formen', '📐', 'Omkrets med sidor som saknar mått', 'omkrets', 3, 16000),
        stage('decimaler', 'Decimaler', '🔣', 'Byt enhet med decimaltal', 'enheter', 3, 11000),
        stage('stora-planen', 'Stora planen', '🧮', 'Sidan som fattas, med större tal', 'saknad', 3, 14000),
        stage('mattavlingen', 'Mättävlingen', '🏆', 'Allt blandat', 'blandat', 2, 12000),
      ] },
    { id: 'domartornet', name: 'Domartornet', icon: '🗼', fact: 'Uppe i domartornet sitter Måttmästaren och mäter varje hopp på millimetern.',
      nodes: [MASTARE] },
  ],
};
