import type { AreaDef, BossDef, StageDef } from '../../../platform/rpg/types';
import type { Mode } from './logic';

// Sibbarp: skejtparken vid havet med den stora bowlen. Vinklar. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const BLACKFISKEN: BossDef = {
  type: 'boss', id: 'blackfisken-langarm', kind: 'monster', name: 'Bläckfisken Långarm', icon: '🐙', title: 'Har längst armar – och tror att det vinner',
  hp: 8, trap: 'langa-ben', pool: [{ mode: 'jamfor', level: 0 }, { mode: 'jamfor', level: 1 }],
  lines: {
    entrance: 'Blubb! Titta på mina långa armar! Min vinkel måste vara störst, för mina ben är längst. Jag har sträckt ut alla vinklar i bowlen!',
    phase2: 'Blubb blubb! Nu sträcker jag ut ALLA åtta armarna!',
    onHeroMiss: ['Blubb! Längst armar vinner!', 'Hihi, så långa ben!', 'Bläckplask!'],
    onBossHit: ['Blubb?! Du tittade på hörnet!', 'Aj, mina sugkoppar!', 'Korta ben, stor vinkel…'],
    defeat: 'Det är hur mycket benen är isär som räknas, inte hur långa de är… Får jag följa med dig? Jag kan hålla åtta saker åt dig samtidigt.',
  },
  pet: { name: 'Lilla Bläckfisken', icon: '🐙' }, titleReward: 'Vinkelkännaren',
};

const SALEN: BossDef = {
  type: 'boss', id: 'salen-bakfram', kind: 'monster', name: 'Sälen Bakfram', icon: '🦭', title: 'Läser alltid gradskivan bakifrån',
  hp: 8, trap: 'fel-skala', pool: [{ mode: 'gradskiva', level: 1 }, { mode: 'gradskiva', level: 2 }],
  lines: {
    entrance: 'Ö-ö-ö! Jag har hittat en halv tallrik med siffror! Den här vinkeln är… 150 grader. Eller 30? Jag tar alltid den som står ytterst, ö-ö!',
    phase2: 'Ö-ö-ö! Nu vänder jag på gradskivan!',
    onHeroMiss: ['Ö-ö! Fel skala, hihi!', 'Bakfram är fram-bak!', 'Plask!'],
    onBossHit: ['Ö?! Du började på nollan!', 'Aj, min nos!', 'Den skalan som börjar på noll…'],
    defeat: 'Man börjar på nollan vid ena benet… och följer den skalan! Får jag följa med dig? Jag kan balansera gradskivan på nosen.',
  },
  pet: { name: 'Lilla Sälen', icon: '🦭' }, titleReward: 'Gradskivans mästare',
};

const MASTARE: BossDef = {
  type: 'boss', id: 'bowlmastaren', kind: 'mastare', name: 'Bowlmästaren', icon: '🌊', title: 'Sibbarps Mästare',
  hp: 12, pool: [{ mode: 'sort', level: 2 }, { mode: 'jamfor', level: 1 }, { mode: 'gradskiva', level: 2 }, { mode: 'varv', level: 2 }, { mode: 'summa', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'sibbarp.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Bowlskejtaren',
};

export const SIBBARP: AreaDef = {
  areaId: 'sibbarp',
  gameId: 'vinklar',
  title: 'Sibbarp',
  kunskap: { name: 'Vinkelkraft', icon: '📐', titles: ['Vinkelspanare', 'Gradskivans hjälte'] },
  texts: { cleared: 'Snyggt landat!', notYet: 'Minst 9 rätt för att landa tricket – försök igen!', back: 'Till Sibbarp' },
  story: 'I Sibbarp, nere vid havet, ligger den stora bowlen. Varje kant och varje snurr är en vinkel – och de som kan sina vinklar landar sina trick. Men Bläckfisken och Sälen har trasslat till allt! Nio rätt av tio, så landar du tricket.',
  lessons: [
    { id: 'vinklarnas-namn', title: 'Vinklarnas namn', icon: '📐', desc: 'Spetsig, rät och trubbig', nodes: ['vinklarnas-namn', 'vinklar-at-alla-hall'], skills: ['ma.geo.vinkel-namn'] },
    { id: 'jamfor-vinklar', title: 'Vilken vinkel är störst?', icon: '⚖️', desc: 'Benen spelar ingen roll', nodes: ['storst-vinkel', 'blackfisken-langarm', 'lurade-ben'], skills: ['ma.geo.vinkel-jamfor'] },
    { id: 'varv', title: 'Varv och grader', icon: '🔄', desc: 'Ett helt varv är 360°', nodes: ['kvarts-och-halva', 'stora-snurrar', 'trickens-namn'], skills: ['ma.geo.varv'] },
    { id: 'gradskivan', title: 'Gradskivan', icon: '🌗', desc: 'Följ raden som börjar på noll', nodes: ['gradskivan', 'bada-skalorna', 'salen-bakfram', 'femgradare'], skills: ['ma.geo.gradskiva'] },
    { id: 'vinkelsummor', title: 'Vinklar som fattas', icon: '🔺', desc: '180° på en linje och i en triangel, 360° runt', nodes: ['rak-linje', 'triangelns-vinklar', 'fyrhorningar-och-trianglar', 'runt-en-punkt'], skills: ['ma.geo.vinklar-linje', 'ma.geo.vinklar-triangel', 'ma.geo.vinklar-runt'] },
  ],
  eras: [
    { id: 'strandkanten', name: 'Strandkanten', icon: '🏖️', fact: 'En rät vinkel är som hörnet på ett papper. Spetsig är mindre, trubbig är större.',
      nodes: [
        stage('vinklarnas-namn', 'Vinklarnas namn', '📐', 'Spetsig, rät eller trubbig?', 'sort', 0, 6000),
        stage('storst-vinkel', 'Störst vinkel', '⚖️', 'Vilken vinkel är störst?', 'jamfor', 0, 6000),
        BLACKFISKEN,
        stage('kvarts-och-halva', 'Kvarts och halva', '🔄', 'Hur många grader är snurren?', 'varv', 0, 7000),
      ] },
    { id: 'lilla-bowlen', name: 'Lilla bowlen', icon: '🥣', fact: 'Ett helt varv är 360°. En 180 är ett halvt varv, och en 540 är ett och ett halvt.',
      nodes: [
        stage('vinklar-at-alla-hall', 'Åt alla håll', '🧭', 'Vinklar som ligger snett – och raka vinklar', 'sort', 1, 6000),
        stage('gradskivan', 'Gradskivan', '🌗', 'Läs av gradskivan', 'gradskiva', 0, 8000),
        stage('lurade-ben', 'Lurade ben', '🦵', 'Jämför vinklar med olika långa ben', 'jamfor', 1, 7000),
        stage('stora-snurrar', 'Stora snurrar', '🌀', '270, 540, 720 …', 'varv', 1, 7000),
      ] },
    { id: 'stora-bowlen', name: 'Stora bowlen', icon: '🌊', fact: 'Gradskivan har två skalor. Börja alltid på nollan vid det ena benet!',
      nodes: [
        stage('bada-skalorna', 'Båda skalorna', '🔁', 'Gradskivan åt båda hållen', 'gradskiva', 1, 9000),
        SALEN,
        stage('rak-linje', 'Rak linje', '➖', 'Vinkeln som fattas på en linje', 'summa', 0, 8000),
        stage('triangelns-vinklar', 'Triangelns vinklar', '🔺', 'Vinklarna i en triangel är 180°', 'summa', 1, 10000),
      ] },
    { id: 'piren', name: 'Piren', icon: '⚓', fact: 'Vinklarna i en triangel är 180° tillsammans, och i en fyrhörning 360°.',
      nodes: [
        stage('femgradare', 'Femgradare', '🎯', 'Gradskivan på fem grader när', 'gradskiva', 2, 9000),
        stage('trickens-namn', 'Trickens namn', '🛹', 'Från grader till varv', 'varv', 2, 8000),
        stage('fyrhorningar-och-trianglar', 'Fyrhörningar', '🔷', 'Vinklar som fattas', 'summa', 2, 12000),
        stage('runt-en-punkt', 'Runt en punkt', '✳️', 'Helt varv, likbenta trianglar och fyrhörningar', 'summa', 3, 14000),
        stage('bowlfinalen', 'Bowlfinalen', '🏆', 'Allt blandat', 'blandat', 2, 10000),
      ] },
    { id: 'fyren', name: 'Fyren', icon: '🗼', fact: 'Ute i fyren vid piren väntar Bowlmästaren. Härifrån ser man varje vinkel i hela bowlen.',
      nodes: [MASTARE] },
  ],
};
