import type { AreaDef, BossDef, StageDef } from '../../../platform/rpg/types';
import type { Mode } from './logic';

// Fluffy: den första skejtparken i Betongbukten, full av former. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const GRODAN: BossDef = {
  type: 'boss', id: 'grodan-dubbelhopp', kind: 'monster', name: 'Grodan Dubbelhopp', icon: '🐸', title: 'Hoppar alltid två gånger på första hörnet',
  hp: 8, trap: 'raknade-start-igen', pool: [{ mode: 'horn', level: 1 }, { mode: 'horn', level: 2 }],
  lines: {
    entrance: 'Kvack! Ett, två, tre, fyra… och FEM! En triangel har väl fyra hörn? Jag hoppar alltid på första hörnet igen – det är det roligaste!',
    phase2: 'Kvack kvack! Nu hoppar jag runt de kluriga formerna!',
    onHeroMiss: ['Kvack! Ett hopp för mycket!', 'Boing boing, hihi!', 'Dubbelhopp!'],
    onBossHit: ['Kvack?! Du slutade i tid!', 'Aj, mina fötter!', 'Exakt rätt antal hopp…'],
    defeat: 'Man slutar där man började… Nu fattar jag! Får jag följa med dig? Jag lovar att bara hoppa en gång per hörn.',
  },
  pet: { name: 'Lilla Grodan', icon: '🐸' }, titleReward: 'Hörnräknaren',
};

const SNIGELN: BossDef = {
  type: 'boss', id: 'snurrsnigeln', kind: 'monster', name: 'Snurrsnigeln', icon: '🐌', title: 'Vrider på alla former',
  hp: 8, trap: 'vriden-form', pool: [{ mode: 'sortera', level: 1 }, { mode: 'ar', level: 2 }],
  lines: {
    entrance: 'Snurr, snurr… Om jag vrider kvadraten är den väl ingen kvadrat längre? Haha! Jag har snurrat alla former i parken så att ingen känner igen dem!',
    phase2: 'Snuuurr! Nu gör jag dem sneda och konstiga också!',
    onHeroMiss: ['Snurr! Du kände inte igen den!', 'Hihi, vriden är väl en annan form?', 'Snurrigt, va?'],
    onBossHit: ['Va?! Du vred tillbaka den i huvudet!', 'Aj, mitt skal snurrar!', 'Samma form… bara snett?'],
    defeat: 'En form byter inte namn för att den ligger snett… Nu blir jag yr av att ha haft fel! Får jag bo hos dig? Jag kan snurra som en karusell.',
  },
  pet: { name: 'Lilla Snurrsnigeln', icon: '🐌' }, titleReward: 'Formkännaren',
};

const MASTARE: BossDef = {
  type: 'boss', id: 'formmastaren', kind: 'mastare', name: 'Formmästaren', icon: '🛹', title: 'Fluffys Mästare',
  hp: 12, pool: [{ mode: 'namn', level: 2 }, { mode: 'ar', level: 3 }, { mode: 'horn', level: 2 }, { mode: 'sortera', level: 2 }, { mode: 'namn', level: 3 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'fluffy.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Formskejtaren',
};

export const FLUFFY: AreaDef = {
  areaId: 'fluffy',
  gameId: 'former',
  title: 'Fluffy',
  kunskap: { name: 'Formkraft', icon: '🔷', titles: ['Formspanare', 'Formgeni'] },
  texts: { cleared: 'Rampen är din!', notYet: 'Minst 9 rätt för att klara rampen – försök igen!', back: 'Till Fluffy' },
  story: 'Fluffy är den första skejtparken i Betongbukten. Varje ramp och kant har sin form – men Snurrsnigeln har vridit på allt, så ingen vet vad som är vad! Lär dig känna igen formerna. Nio rätt av tio, så klarar du rampen.',
  lessons: [
    { id: 'horn-och-sidor', title: 'Hörn och sidor', icon: '📍', desc: 'Räkna runt – utan att räkna dubbelt', nodes: ['fyra-former', 'rakna-horn', 'hitta-formen', 'grodan-dubbelhopp'], skills: ['ma.geo.former-grund', 'ma.geo.horn', 'ma.geo.sortera'] },
    { id: 'manghorningar', title: 'Månghörningar', icon: '⬡', desc: 'Namnet räknar hörnen', nodes: ['manga-horn', 'horn-och-sidor'], skills: ['ma.geo.manghorningar'] },
    { id: 'vridna-former', title: 'Snett och vint', icon: '🌀', desc: 'En form byter inte namn när den snurrar', nodes: ['snett-och-vint', 'ar-det-en', 'snurrsnigeln', 'sneda-former'], skills: ['ma.geo.former-vridna'] },
    { id: 'fyrhorningar', title: 'Fyrhörningarna', icon: '🔶', desc: 'Kvadrat, rektangel, romb, parallellogram och parallelltrapets', nodes: ['fyrhorningar'], skills: ['ma.geo.fyrhorningar'] },
    { id: 'inat-horn', title: 'Hörn som pekar inåt', icon: '⭐', desc: 'Stjärnor och pilar', nodes: ['kluriga-horn', 'stjarnor-och-kors'], skills: ['ma.geo.horn-kluriga'] },
  ],
  eras: [
    { id: 'entren', name: 'Entrén', icon: '🛹', fact: 'En cirkel är rund och har inga hörn. En triangel har tre hörn. En kvadrat och en rektangel har fyra.',
      nodes: [
        stage('fyra-former', 'Fyra former', '🔷', 'Cirkel, triangel, kvadrat och rektangel', 'namn', 0, 6000),
        stage('rakna-horn', 'Räkna hörn', '📍', 'Hur många hörn har formen?', 'horn', 0, 6000),
        stage('hitta-formen', 'Hitta formen', '🔍', 'Hur många av en sort finns det?', 'sortera', 0, 8000),
      ] },
    { id: 'minirampen', name: 'Minirampen', icon: '🛝', fact: 'En femhörning har fem hörn och en sexhörning sex. Namnet säger hur många!',
      nodes: [
        stage('manga-horn', 'Många hörn', '⬡', 'Femhörning, sexhörning och åttahörning', 'namn', 1, 6000),
        stage('horn-och-sidor', 'Hörn och sidor', '📐', 'Räkna hörn och sidor', 'horn', 1, 7000),
        GRODAN,
        stage('snett-och-vint', 'Snett och vint', '🌀', 'Hitta formerna, även de sneda', 'sortera', 1, 10000),
      ] },
    { id: 'streetytan', name: 'Streetytan', icon: '🧱', fact: 'En kvadrat som ligger snett är fortfarande en kvadrat. En form byter inte namn för att den vrids!',
      nodes: [
        stage('fyrhorningar', 'Fyrhörningarna', '🔶', 'Kvadrat, rektangel, romb och parallellogram', 'namn', 2, 7000),
        stage('ar-det-en', 'Är det en …?', '❓', 'Känn igen former som ligger snett', 'ar', 2, 6000),
        SNIGELN,
        stage('kluriga-horn', 'Kluriga hörn', '⭐', 'Former med hörn som pekar inåt', 'horn', 2, 8000),
      ] },
    { id: 'bowlen', name: 'Bowlen', icon: '🥣', fact: 'Hörn som pekar inåt räknas också. Gå runt hela formen med fingret!',
      nodes: [
        stage('sneda-former', 'Sneda former', '🔺', 'Namnge vridna och ovanliga former', 'namn', 3, 7000),
        stage('stjarnor-och-kors', 'Stjärnor och kors', '✴️', 'Många hörn att räkna', 'horn', 3, 10000),
        stage('formjakten', 'Formjakten', '🏁', 'Allt blandat', 'blandat', 3, 9000),
      ] },
    { id: 'skejtshoppen', name: 'Skejtshoppen', icon: '🏪', fact: 'I skejtshoppen väntar Formmästaren, som har ritat varenda ramp i parken.',
      nodes: [MASTARE] },
  ],
};
