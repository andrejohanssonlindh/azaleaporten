import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Glosviken: en vik på Västerön där fiskarna fångar engelska ord i sina nät. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const TVILLINGKRABBAN: BossDef = {
  type: 'boss', id: 'tvillingkrabban', kind: 'monster', name: 'Tvillingkrabban', icon: '🦀', title: 'Ser allt dubbelt',
  hp: 8, trap: 'liknar', pool: [{ mode: 'blandat', level: 1 }],
  lines: {
    entrance: 'Klick-klack! Jag är Tvillingkrabban, och jag ser allt dubbelt. Three och tree, sheep och ship – det är väl samma sak? Klick-klack!',
    phase2: 'Nu klipper jag ihop ännu fler ord! House, mouse, mouth – hihi!',
    onHeroMiss: ['Klick! Dubbelt fel!', 'Hihi, de ser ju likadana ut!', 'Klack-klack, lurad!'],
    onBossHit: ['Aj, i klon!', 'Du såg skillnaden!', 'Klick… klack… hmpf.'],
    defeat: 'Du ser varenda bokstav! Får jag följa med dig? Jag lovar att bara se dubbelt på söndagar.',
  },
  pet: { name: 'Lilla Tvillingkrabban', icon: '🦀' }, titleReward: 'Krabbtämjaren',
};

const FALSKA_VANNEN: BossDef = {
  type: 'boss', id: 'falska-vannen', kind: 'monster', name: 'Falska Fröken Friend', icon: '🎭', title: 'Ser svensk ut – men är det inte',
  hp: 8, trap: 'falsk-van', pool: [{ mode: 'falska', level: 2 }],
  lines: {
    entrance: 'Hej kompis! Jag är din vän, Fröken Friend. Lita på mig: "barn" betyder barn och "gift" är farligt. Eller hur? Hihihi…',
    phase2: 'Nu tar jag på mig min allra svenskaste mask!',
    onHeroMiss: ['Hihi, lurad av en vän!', 'Ser svenskt ut, va?', 'Tack, kompis!'],
    onBossHit: ['Oj, du genomskådade mig!', 'Masken föll av!', 'Hmpf, du tänkte på engelska.'],
    defeat: 'Du lät dig inte luras! Nu vill jag bli din riktiga vän – på riktigt den här gången.',
  },
  pet: { name: 'Lilla Fröken Friend', icon: '🎭' }, titleReward: 'Vänskapsdetektiven',
};

const GLOSMASTAREN: BossDef = {
  type: 'boss', id: 'glosmastaren', kind: 'mastare', name: 'Glosmästaren', icon: '⚓', title: 'Glosvikens Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 1 }, { mode: 'blandat', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'glosviken.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Glosmästare',
};

export const GLOSVIKEN: AreaDef = {
  areaId: 'glosviken',
  gameId: 'glosor',
  title: 'Glosviken',
  kunskap: { name: 'Glosförråd', icon: '⚓', titles: ['Glosfiskare', 'Ordkapten'] },
  texts: { cleared: 'Fullt nät av engelska ord!', notYet: 'Nio rätt av tio behövs för att fylla nätet – försök igen!', back: 'Till viken' },
  story: 'I Glosviken lägger fiskarna ut sina nät varje morgon, och det de fångar är engelska ord! Färger, djur, mat och kläder – och längst ut i viken simmar de klurigaste orden. Fyll ditt nät, ett tema i taget.',
  eras: [
    { id: 'stranden', name: 'Stranden', icon: '🏖️', fact: 'Engelska och svenska är släkt, så många ord liknar varandra: hand, arm, ring. Men långt ifrån alla!',
      nodes: [
        stage('farger', 'Färger', '🎨', 'Red, blue, green …', 'farger', 0, 6000),
        stage('siffror', 'Siffror', '🔢', 'One, two, three …', 'siffror', 0, 6000),
        stage('djur', 'Djur', '🐶', 'Dog, cat, horse …', 'djur', 0, 7000),
      ] },
    { id: 'fiskelaget', name: 'Fiskeläget', icon: '🎣', fact: 'I engelskan säger man "my mother" och "my father" – men "mum" och "dad" när man pratar med dem.',
      nodes: [
        stage('familjen', 'Familjen', '👪', 'Mother, father, sister …', 'familj', 0, 7000),
        stage('kroppen', 'Kroppen', '🦶', 'Head, eye, nose …', 'kroppen', 0, 7000),
        stage('maten', 'Mat och dryck', '🍎', 'Apple, bread, milk …', 'mat', 0, 7000),
        stage('fangsten', 'Dagens fångst', '🐟', 'Allt från stranden och fiskeläget', 'blandat', 1, 8000),
        TVILLINGKRABBAN,
      ] },
    { id: 'marknaden', name: 'Marknaden', icon: '🛍️', fact: 'På engelska har byxor och glasögon alltid -s på slutet: trousers, glasses. Det är ju två ben och två glas!',
      nodes: [
        stage('kladerna', 'Kläder', '👗', 'Dress, shoes, cap …', 'klader', 1, 7000),
        stage('skolan', 'Skolan', '✏️', 'Book, pen, ruler …', 'skolan', 1, 7000),
        stage('leksaker', 'Leksaker', '🧸', 'Ball, bike, kite …', 'leksaker', 1, 7000),
        stage('vadret', 'Väder', '🌦️', 'Sun, rain, snow …', 'vader', 1, 7000),
        stage('hemma', 'Hemma', '🏠', 'House, door, bed …', 'hemmet', 1, 7000),
      ] },
    { id: 'hamnstaden', name: 'Hamnstaden', icon: '🏘️', fact: 'Veckodagar och månader skrivs med stor bokstav på engelska: Monday, May.',
      nodes: [
        stage('stan', 'Stan och resor', '🚌', 'Bus, train, bridge …', 'stan', 2, 8000),
        stage('naturen', 'Naturen', '🌳', 'Tree, sea, mountain …', 'naturen', 2, 8000),
        stage('dagar', 'Dagar och månader', '📅', 'Monday, today, June …', 'dagar', 2, 8000),
        stage('yrken', 'Yrken', '🧑‍🚒', 'Doctor, farmer, pilot …', 'yrken', 2, 8000),
      ] },
    { id: 'djupa-viken', name: 'Djupa viken', icon: '🌊', fact: 'Se upp för falska vänner! Ett engelskt ord kan se precis ut som ett svenskt – men betyda något helt annat.',
      nodes: [
        stage('gora-saker', 'Göra saker', '🏃', 'Run, swim, laugh …', 'verb', 2, 8000),
        stage('kanslor', 'Känslor', '😀', 'Happy, tired, brave …', 'kanslor', 2, 8000),
        stage('falska-vanner', 'Falska vänner', '🎭', 'Ord som lurar', 'falska', 2, 9000),
        FALSKA_VANNEN,
      ] },
    { id: 'skattgrottan', name: 'Skattgrottan', icon: '💎', fact: 'Här ligger alla ord som fiskarna har fångat. Den som kan dem alla får kalla sig Glosmästare.',
      nodes: [
        stage('stora-fangsten', 'Stora fångsten', '🎣', 'Alla teman blandade', 'blandat', 2, 8000),
        GLOSMASTAREN,
      ] },
  ],
};
