import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Piratskeppet: ett engelskt piratskepp som ligger förtöjt vid Västerön. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const KAPTEN_GLOM_S: BossDef = {
  type: 'boss', id: 'kapten-glom-s', kind: 'monster', name: 'Kapten Glöm-S', icon: '🏴‍☠️', title: 'Har tappat alla sina s',
  hp: 8, trap: 'glomt-s', pool: [{ mode: 'plural', level: 0 }, { mode: 's-form', level: 0 }],
  lines: {
    entrance: 'Arrr! Jag är Kapten Glöm-S! Jag har två papegoja och tre skattkista. She play, he sing, arrr! Vem behöver s?',
    phase2: 'Arrr! Nu tappar jag ännu fler s i havet!',
    onHeroMiss: ['Arrr! Inget s!', 'Two cat, arrr!', 'Ho ho, s:et sjönk!'],
    onBossHit: ['Arrr?! Ett s!', 'Du fiskade upp s:et!', 'Blixt och dunder, rätt!'],
    defeat: 'Arrr… du hittade alla mina s. Får jag mönstra på hos dig? Jag lovar att ta med s:en den här gången.',
  },
  pet: { name: 'Lilla Kapten Glöm-S', icon: '🏴‍☠️' }, titleReward: 'S-jägaren',
};

const BLACKFISKEN: BossDef = {
  type: 'boss', id: 'bakvanda-blackfisken', kind: 'monster', name: 'Bakvända Bläckfisken', icon: '🐙', title: 'Pratar engelska med svensk ordföljd',
  hp: 8, trap: 'svensk-ordfoljd', pool: [{ mode: 'ordfoljd', level: 0 }, { mode: 'bygg', level: 0 }],
  lines: {
    entrance: 'Blubb! Today go I to the sea! Like you my eight arms? Jag är Bakvända Bläckfisken, och jag lägger orden precis som på svenska. Blubb!',
    phase2: 'Blubb blubb! Now come I with ALL my arms!',
    onHeroMiss: ['Blubb! Svensk ordföljd!', 'Today win I!', 'Hihi, bakvänt!'],
    onBossHit: ['Blubb?! Rätt ordning!', 'Du rätade ut mina armar!', 'Bläck i ögat!'],
    defeat: 'Blubb… now I understand. Ser du? Jag sa det rätt! Får jag följa med dig? Jag har åtta armar att hjälpa till med.',
  },
  pet: { name: 'Lilla Bläckfisken', icon: '🐙' }, titleReward: 'Bläckfiskens vän',
};

const SKEPPSMASTAREN: BossDef = {
  type: 'boss', id: 'skeppsmastaren', kind: 'mastare', name: 'Skeppsmästaren', icon: '⚓', title: 'Piratskeppets Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'piratskeppet.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Grammatikpirat',
};

export const PIRATSKEPPET: AreaDef = {
  areaId: 'piratskeppet',
  gameId: 'pirat',
  title: 'Piratskeppet',
  kunskap: { name: 'Engelsk grammatik', icon: '🏴‍☠️', titles: ['Däcksgast', 'Skeppets styrman'] },
  texts: { cleared: 'Full fart framåt!', notYet: 'Nio rätt av tio behövs för att hissa seglen – försök igen!', back: 'Till skeppet' },
  story: 'Vid Västerön ligger ett piratskepp förtöjt, och besättningen pratar bara engelska – nästan rätt. Hjälp dem med a och an, am, is och are, och att få orden i rätt ordning. Annars kommer de aldrig ut på havet!',
  eras: [
    { id: 'landgangen', name: 'Landgången', icon: '🪜', fact: 'Före ett vokalljud heter det an: an apple, an egg. Annars a: a dog, a cat.',
      nodes: [
        stage('a-eller-an', 'a eller an?', '🍎', 'a dog, an apple', 'artikel', 0, 8000),
        stage('en-katt-tva-katter', 'En katt, två katter', '🐱', 'one cat – two cats', 'plural', 0, 8000),
      ] },
    { id: 'dacket', name: 'Däcket', icon: '⚓', fact: 'Svenskans "är" blir tre ord på engelska: I am, he is, we are.',
      nodes: [
        stage('am-is-are', 'am, is eller are?', '🟰', 'I am, she is, they are', 'vara', 0, 8000),
        stage('she-plays', 'She plays', '⚽', 'He, she, it – glöm inte s!', 's-form', 0, 9000),
        KAPTEN_GLOM_S,
      ] },
    { id: 'kajutan', name: 'Kajutan', icon: '🗺️', fact: 'in = i, on = på, under = under. Och what, where, who, when, how = vad, var, vem, när, hur.',
      nodes: [
        stage('in-on-under', 'In, on, under', '📦', 'Var är katten?', 'prep', 0, 8000),
        stage('bakom-och-framfor', 'Bakom och framför', '🧸', 'next to, behind, in front of', 'prep', 1, 9000),
        stage('frageord', 'Frågeord', '❓', 'What, where, who …', 'fragord', 0, 9000),
      ] },
    { id: 'lastrummet', name: 'Lastrummet', icon: '📦', fact: 'Några ord byter form i plural, precis som på svenska: one mouse – two mice, en mus – två möss.',
      nodes: [
        stage('dont-doesnt', "don't och doesn't", '🙅', "I don't, she doesn't", 'neka', 0, 9000),
        stage('kluriga-plural', 'Kluriga plural', '🐭', 'boxes, babies, children', 'plural', 1, 9000),
        stage('goes-has-watches', 'Goes, has, watches', '📺', 'Fler verb med -s', 's-form', 1, 9000),
      ] },
    { id: 'utkiken', name: 'Utkiken', icon: '🔭', fact: 'På svenska: "Idag går jag." På engelska: "Today I go." Den som gör något står före verbet!',
      nodes: [
        stage('ratt-ordning', 'Rätt ordning', '🔀', 'Vilken mening är rätt?', 'ordfoljd', 1, 10000),
        stage('bygg-meningen', 'Bygg meningen', '🧱', 'Lägg orden i rätt ordning', 'bygg', 1, 14000),
        BLACKFISKEN,
      ] },
    { id: 'kaptenshytten', name: 'Kaptenshytten', icon: '👑', fact: 'Här samlas allt som besättningen har lärt sig. Klarar du Skeppsmästaren får du bli styrman!',
      nodes: [
        stage('hela-skeppet', 'Hela skeppet', '🏴‍☠️', 'Allt blandat', 'blandat', 1, 11000),
        SKEPPSMASTAREN,
      ] },
  ],
};
