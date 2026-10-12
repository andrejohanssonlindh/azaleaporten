import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Stavklippan: en brant klippa på Västerön där varje ord man stavar rätt blir ett steg uppåt. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const SJOORMEN: BossDef = {
  type: 'boss', id: 'svengelska-sjoormen', kind: 'monster', name: 'Svengelska Sjöormen', icon: '🐉', title: 'Stavar allt som på svenska',
  hp: 8, trap: 'som-svenska', pool: [{ mode: 'del1', level: 0 }, { mode: 'del1', level: 1 }],
  lines: {
    entrance: 'Jes, jes, jes! Jag är Svengelska Sjöormen. Jag stavar som det låter: tri, sjip, vater. Lätt som en plätt – eller hur?',
    phase2: 'Nu kommer diktatet! Jag läser upp och du skriver – på svengelska, hoppas jag!',
    onHeroMiss: ['Jes! Svengelska!', 'Sjip ohoj!', 'Det låter ju rätt, hihi!'],
    onBossHit: ['Ojdå, riktig engelska!', 'Aj, rätt stavat!', 'Sjöormen sjunker…'],
    defeat: 'Okej, okej – engelska stavas inte som svenska. Får jag simma med dig? Jag lovar att stava rätt. För det mesta.',
  },
  pet: { name: 'Lilla Sjöormen', icon: '🐉' }, titleReward: 'Sjöormstämjaren',
};

const TYSTA_TORA: BossDef = {
  type: 'boss', id: 'tysta-tora', kind: 'monster', name: 'Tysta Tora', icon: '🤫', title: 'Gömmer bokstäverna som inte hörs',
  hp: 8, trap: 'tyst-bokstav', pool: [{ mode: 'tyst', level: 0 }, { mode: 'tyst', level: 1 }],
  lines: {
    entrance: 'Shhh… Jag är Tysta Tora. Jag har gömt k:et i knee och w:et i write. Hör du dem? Nej. Då finns de inte. Shhh…',
    phase2: 'Shhh! Nu gömmer jag ännu fler. Climb, listen, island…',
    onHeroMiss: ['Shhh… borta!', 'Hihi, den hördes inte!', 'Shhh, gömd!'],
    onBossHit: ['Oj! Du hittade den!', 'Shhh… aj!', 'Den tysta bokstaven syns!'],
    defeat: 'Shhh… du ser bokstäverna fast de inte hörs. Får jag följa med? Jag är väldigt tyst.',
  },
  pet: { name: 'Lilla Tora', icon: '🤫' }, titleReward: 'Tystnadens detektiv',
};

const KLIPPMASTAREN: BossDef = {
  type: 'boss', id: 'klippmastaren', kind: 'mastare', name: 'Klippmästaren', icon: '🧗', title: 'Stavklippans Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 1 }, { mode: 'blandat', level: 2 }, { mode: 'blandat', level: 3 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'stavklippan.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Stavklippans mästare',
};

export const STAVKLIPPAN: AreaDef = {
  areaId: 'stavklippan',
  gameId: 'stavklippan',
  title: 'Stavklippan',
  kunskap: { name: 'Engelsk stavning', icon: '🧗', titles: ['Klippklättrare', 'Bokstavsbergsbestigare'] },
  texts: { cleared: 'Ett steg högre upp på klippan!', notYet: 'Nio rätt av tio behövs för att klättra vidare – försök igen!', back: 'Till klippan' },
  story: 'Stavklippan reser sig brant ur havet. Varje ord du stavar rätt blir ett fäste för händerna. Men akta dig: på engelska stavas orden inte som de låter – inte som på svenska i alla fall!',
  eras: [
    { id: 'klippfoten', name: 'Klippfoten', icon: '🪨', fact: 'Engelska stavas sällan som det låter. "cat" låter som "katt" men stavas med c!',
      nodes: [
        stage('c-och-k', 'c, k och ck', '🐱', 'cat, duck, clock', 'c-k', 0, 8000),
        stage('y-som-j', 'y som j', '💛', 'yes, you, yellow', 'y', 0, 8000),
        stage('w-som-v', 'w', '💧', 'water, window, wolf', 'w', 0, 8000),
      ] },
    { id: 'masboet', name: 'Måsboet', icon: '🐦', fact: 'Sj-ljudet stavas sh (ship) och tj-ljudet ch (chair). Och th är ett ljud som inte finns på svenska!',
      nodes: [
        stage('th', 'th', '👅', 'three, mother, bath', 'th', 0, 8000),
        stage('ee-och-ea', 'ee och ea', '🌳', 'tree, sea, eat', 'ee-ea', 0, 8000),
        stage('sh-och-ch', 'sh och ch', '🚢', 'ship, chair, fish', 'sh-ch', 0, 8000),
        stage('forsta-diktatet', 'Första diktatet', '✍️', 'Lyssna och skriv', 'del1', 1, 12000),
        SJOORMEN,
      ] },
    { id: 'vindgrottan', name: 'Vindgrottan', icon: '🌬️', fact: 'Ett tyst e på slutet får vokalen att säga sitt namn: kit – kite, cap – cape.',
      nodes: [
        stage('aj-ljudet', 'Aj-ljudet', '🚲', 'bike, night, my', 'lang-i', 0, 8000),
        stage('ej-ljudet', 'Ej-ljudet', '🍰', 'cake, rain, day', 'lang-a', 0, 8000),
        stage('oo-och-ou', 'oo, ou och ow', '🌙', 'moon, house, brown', 'oo-ou', 0, 8000),
        stage('vindens-diktat', 'Vindens diktat', '✍️', 'Lyssna och skriv', 'del2', 1, 12000),
      ] },
    { id: 'tysta-stigen', name: 'Tysta stigen', icon: '🤫', fact: 'Knee, write, climb, listen – k, w, b och t syns men hörs inte. Förr i tiden sa man dem!',
      nodes: [
        stage('dubbla-bokstaver', 'Dubbla bokstäver', '🍎', 'apple, happy, dinner', 'dubbel', 0, 8000),
        stage('tysta-bokstaver', 'Tysta bokstäver', '🔪', 'knee, write, castle', 'tyst', 0, 9000),
        stage('tyst-diktat', 'Tyst diktat', '✍️', 'Skriv de tysta orden', 'tyst', 2, 12000),
        TYSTA_TORA,
      ] },
    { id: 'klipptoppen', name: 'Klipptoppen', icon: '🏔️', fact: 'En box, två boxes. En baby, två babies. En toy, två toys. Plural har sina egna regler!',
      nodes: [
        stage('plural', 'Plural', '📦', 'boxes, babies, toys', 'plural', 0, 9000),
        stage('stora-diktatet', 'Stora diktatet', '📜', 'Alla regler, alla ord', 'blandat', 2, 12000),
        stage('hitta-felet', 'Hitta felet', '🔍', 'Vilket ord är felstavat?', 'blandat', 3, 12000),
        KLIPPMASTAREN,
      ] },
  ],
};
