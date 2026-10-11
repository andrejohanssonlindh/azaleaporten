import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';
import type { Mode } from './logic';

// Tiokompisbron: en lång bro över Talforsen. Bana- och boss-id:n är permanenta (sparas i framstegen).

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const TIOTAPPAREN: BossDef = {
  type: 'boss', id: 'tiotapparen', kind: 'monster', name: 'Tiotapparen', icon: '🧌', title: 'Brotrollet som tappar tior i forsen',
  hp: 8, trap: 'glomd-tia', pool: [{ mode: 'plus', level: 1 }, { mode: 'plus', level: 2 }, { mode: 'saknas', level: 1 }],
  lines: {
    entrance: 'Hö hö! Varje gång entalen blir fler än tio slänger jag tian i forsen. Plask! Ingen kommer över min bro med alla tior kvar!',
    phase2: 'Nu kastar jag tior från BÅDA sidorna av bron!',
    onHeroMiss: ['Plask! Där for tian!', 'Hö hö, en tia mindre!', 'Tian simmar iväg!'],
    onBossHit: ['Aj! Du fångade tian!', 'Hö… den tian tog du med dig.', 'Mina tior! Rätt igen?!'],
    defeat: 'Okej, okej! Tian ska följa med. Får jag bo hos dig? Under bron är det så blött.',
  },
  pet: { name: 'Lilla Tiotapparen', icon: '🧌' }, titleReward: 'Tiofångaren',
};

const BAVERN: BossDef = {
  type: 'boss', id: 'baklangesbavern', kind: 'monster', name: 'Baklängesbävern', icon: '🦫', title: 'Bygger allt baklänges',
  hp: 8, trap: 'lanade-inte', pool: [{ mode: 'minus', level: 1 }, { mode: 'minus', level: 2 }],
  lines: {
    entrance: 'Sextiotvå minus tjugosju? Två minus sju går inte – så jag tar sju minus två! Gnag gnag! Min damm är byggd helt baklänges.',
    phase2: 'Gnag gnag! Nu gnager jag i tiotalen också!',
    onHeroMiss: ['Gnag gnag! Baklänges igen!', 'Hihi, du tog det minsta från det största!', 'Min damm växer!'],
    onBossHit: ['Du lånade en tia! Smart.', 'Aj, min damm läcker!', 'Gnag… rätt igen.'],
    defeat: 'Du lånar tior som en riktig brobyggare! Får jag följa med? Jag lovar att bara gnaga på pinnar.',
  },
  pet: { name: 'Lilla Baklängesbävern', icon: '🦫' }, titleReward: 'Tialånaren',
};

const BROVAKTAREN: BossDef = {
  type: 'boss', id: 'brovaktaren', kind: 'mastare', name: 'Brovaktaren', icon: '🌉', title: 'Tiokompisbrons Mästare',
  hp: 12, pool: [{ mode: 'par', level: 2 }, { mode: 'plus', level: 2 }, { mode: 'minus', level: 2 }, { mode: 'saknas', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'tiokompisbron.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Brobyggaren',
};

export const TIOKOMPISBRON: AreaDef = {
  areaId: 'tiokompisbron',
  gameId: 'tiokompis',
  title: 'Tiokompisbron',
  kunskap: { name: 'Räknekraft', icon: '➕' },
  texts: { cleared: 'Bron håller!', notYet: 'Bron behöver minst 9 hela plankor – försök igen!', back: 'Till bron' },
  story: 'Tiokompisbron går över den vilda Talforsen. Men brotrollen har knyckt plankor, och nu fattas det tal överallt! Laga bron bit för bit – nio rätt av tio lägger en ny planka på plats.',
  eras: [
    { id: 'brofastet', name: 'Brofästet', icon: '🪵', fact: 'Tiokompisar är två tal som blir 10 tillsammans, som 3 och 7. De håller alltid ihop!',
      nodes: [
        stage('tiokompisar', 'Tiokompisar', '🤝', 'Vilket tal blir 10 tillsammans?', 'par', 0, 6000),
        stage('plus-till-20', 'Plus till 20', '➕', 'Plus utan att gå över tian', 'plus', 0, 6000),
        stage('minus-till-20', 'Minus till 20', '➖', 'Minus utan att gå över tian', 'minus', 0, 6000),
      ] },
    { id: 'forsen', name: 'Över forsen', icon: '🌊', fact: 'När du går över tian kan tiokompisarna hjälpa dig: 8 + 5 = 8 + 2 + 3.',
      nodes: [
        stage('over-tian', 'Över tian', '🌊', 'Plus över tiotalet', 'plus', 1, 7000),
        stage('tillbaka-over-tian', 'Tillbaka över tian', '↩️', 'Minus över tiotalet', 'minus', 1, 8000),
        stage('vad-fattas', 'Vad fattas?', '❓', 'Hitta talet som saknas', 'saknas', 1, 9000),
        TIOTAPPAREN,
      ] },
    { id: 'hundraholmen', name: 'Hundraholmen', icon: '🏝️', fact: 'Hundrakompisar blir 100 tillsammans, som 30 och 70 – eller 37 och 63.',
      nodes: [
        stage('hundrakompisar', 'Hundrakompisar', '💯', 'Hela tiotal till 100', 'par', 1, 7000),
        stage('stora-kliv', 'Stora kliv', '🦘', 'Tvåsiffrigt plus ensiffrigt', 'plus', 2, 9000),
        stage('stora-kliv-tillbaka', 'Stora kliv tillbaka', '🐸', 'Tvåsiffrigt minus ensiffrigt', 'minus', 2, 10000),
        BAVERN,
      ] },
    { id: 'mittspannet', name: 'Mittspannet', icon: '🌉', fact: 'Mitt på bron blåser det! Räkna tiotalen för sig och entalen för sig, så står du stadigt.',
      nodes: [
        stage('kluriga-kompisar', 'Kluriga kompisar', '💯', 'Vilket tal blir 100?', 'par', 2, 9000),
        stage('tiotal-och-ental', 'Tiotal och ental', '🧱', 'Tvåsiffrigt plus tvåsiffrigt', 'plus', 3, 14000),
        stage('lana-en-tia', 'Låna en tia', '🔄', 'Tvåsiffrigt minus tvåsiffrigt', 'minus', 3, 16000),
        stage('hal-i-bron', 'Hål i bron', '🕳️', 'Stora tal som fattas', 'saknas', 3, 16000),
      ] },
    { id: 'andra-stranden', name: 'Andra stranden', icon: '🏰', fact: 'Den som tar sig över hela bron får möta Brovaktaren – och kallas sedan Brobyggare.',
      nodes: [BROVAKTAREN] },
  ],
};
