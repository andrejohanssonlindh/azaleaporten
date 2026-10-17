import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Kublabbet på Robotön: lös Rubiks kub med nybörjarmetoden. Ett kubprogram (en algoritm) är en lista
// med drag – precis som robotarnas program. Bana-, boss- och lektions-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const KRABBAN: BossDef = {
  type: 'boss', id: 'krabban-bakfram', kind: 'monster', name: 'Krabban Bakfram', icon: '🦀', title: 'Vrider alltid åt fel håll',
  hp: 8, trap: 'prim', pool: [{ mode: 'drag', level: 1 }, { mode: 'vilket', level: 1 }, { mode: 'sekvens', level: 1 }],
  lines: {
    entrance: 'Klick klack! Jag är Krabban Bakfram. Jag går baklänges – och jag vrider baklänges också! R eller R prim, vem bryr sig? Klick!',
    phase2: 'Klick klack klick! Nu kommer prim-dragen, ett efter ett!',
    onHeroMiss: ['Klick! Åt fel håll!', 'Baklänges, hihi!', 'Klack! Medurs eller moturs?'],
    onBossHit: ['Klick?! Rätt håll!', 'Du kan prim!', 'Ajaj, precis som klockan!'],
    defeat: 'Klick… du vet alltid vilket håll det är. Får jag följa med? Jag lovar att gå baklänges bara när du säger prim.',
  },
  pet: { name: 'Lilla Krabban', icon: '🦀' }, titleReward: 'Primmästaren',
};

const MALARMUSEN: BossDef = {
  type: 'boss', id: 'malarmusen', kind: 'monster', name: 'Målarmusen', icon: '🐭', title: 'Bryr sig bara om den vita färgen',
  hp: 8, trap: 'fel-mitt', pool: [{ mode: 'kors', level: 1 }, { mode: 'kors', level: 0 }],
  lines: {
    entrance: 'Pip! Jag är Målarmusen. Jag målar botten vit, och mer behövs inte – pip! Vem bryr sig om att sidorna passar mittbitarna?',
    phase2: 'Pip pip! Nu målar jag ännu snabbare!',
    onHeroMiss: ['Pip! Fel mittbit!', 'Vitt nere, men sidan då?', 'Pip, titta på sidofärgen!'],
    onBossHit: ['Pip?! Färgerna passar!', 'Du tittade på mittbiten!', 'Ett riktigt kors!'],
    defeat: 'Pip… det vita korset ska passa åt alla håll. Nu förstår jag! Får jag följa med och hålla i penseln?',
  },
  pet: { name: 'Lilla Målarmusen', icon: '🐭' }, titleReward: 'Korsbyggaren',
};

const BLACKFISKEN: BossDef = {
  type: 'boss', id: 'blackfisken-rorallt', kind: 'monster', name: 'Bläckfisken Rörallt', icon: '🐙', title: 'Rör allt och förstör det som var klart',
  hp: 8, trap: 'forstorde', pool: [{ mode: 'mitten', level: 1 }, { mode: 'horn', level: 1 }, { mode: 'mitten', level: 0 }],
  lines: {
    entrance: 'Blubb! Jag är Bläckfisken Rörallt. Jag har åtta armar och vrider åtta sidor på en gång! Att något redan var klart? Blubb, det märks inte!',
    phase2: 'Blubb blubb! Alla armar på en gång nu!',
    onHeroMiss: ['Blubb! Det där var ju klart!', 'Oj, lagret gick sönder!', 'Blubb, hela kuben snurrar!'],
    onBossHit: ['Blubb?! Allt sitter kvar!', 'Knepet tog tillbaka allt!', 'Snyggt, inget gick sönder!'],
    defeat: 'Blubb… du använder knep som tar tillbaka allt de flyttar. Smart! Får jag följa med? Jag håller kuben med alla armar.',
  },
  pet: { name: 'Lilla Bläckfisken', icon: '🐙' }, titleReward: 'Lagerbyggaren',
};

const KUBMASTAREN: BossDef = {
  type: 'boss', id: 'kubmastaren', kind: 'mastare', name: 'Kubmästaren', icon: '🏆', title: 'Kublabbets Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'kublabbet.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Kublösaren',
};

export const KUBLABBET: AreaDef = {
  areaId: 'kublabbet',
  gameId: 'kublabbet',
  title: 'Kublabbet',
  kunskap: { name: 'Kublösning', icon: '🎲', titles: ['Kubsnurraren', 'Kubens mästare'] },
  texts: { cleared: 'Kuben snurrar precis som du vill!', notYet: 'Nio rätt av tio behövs – försök igen!', back: 'Till Kublabbet' },
  story: 'Längst in på Robotön ligger Kublabbet. Där står en robot som kan lösa Rubiks kub på en sekund – men den kan inte förklara hur! Här lär du dig kubens hemlighet: små kubprogram som flyttar en bit i taget. Steg för steg kan du lösa hela kuben själv.',
  lessons: [
    { id: 'kubens-delar', title: 'Kubens delar', icon: '🧊', desc: 'Mittbitar, kanter och hörn', nodes: ['mitt-kant-horn', 'hitta-biten', 'var-hor-den-hemma'], skills: ['prog.kub.bitar'] },
    { id: 'dragen', title: 'Dragen', icon: '🔄', desc: 'R, L, U, D, F och B', nodes: ['vrid-en-sida', 'vilket-drag'], skills: ['prog.kub.drag', 'prog.kub.vilket'] },
    { id: 'prim', title: 'Prim och dubbla drag', icon: '↩️', desc: 'Åt andra hållet, och ett halvt varv', nodes: ['prim-och-dubbelt', 'krabban-bakfram', 'vilket-drag-prim'], skills: ['prog.kub.prim'] },
    { id: 'kubprogram', title: 'Kubprogram', icon: '📜', desc: 'Drag i rad – och baklänges', nodes: ['folj-programmet', 'langre-program', 'baklanges'], skills: ['prog.kub.program', 'prog.kub.baklanges'] },
    { id: 'blomman', title: 'Blomman', icon: '🌼', desc: 'Fyra vita kronblad runt den gula mitten', nodes: ['blomman', 'hela-blomman'], skills: ['prog.kub.blomma'] },
    { id: 'vita-korset', title: 'Vita korset', icon: '➕', desc: 'Ner med kronbladen – vid rätt mittbit', nodes: ['ner-med-bladen', 'vrid-och-ner', 'malarmusen'], skills: ['prog.kub.kors'] },
    { id: 'hogertricket', title: 'Höger-tricket', icon: '🔺', desc: 'R U R′ U′ tills hörnet sitter', nodes: ['hogertricket', 'hitta-hornet', 'fast-horn'], skills: ['prog.kub.horn'] },
    { id: 'mittenlagret', title: 'Mittenlagret', icon: '🎯', desc: 'Kanten ner åt höger eller vänster', nodes: ['mitten-hoger', 'hoger-eller-vanster', 'fast-kant', 'blackfisken-rorallt'], skills: ['prog.kub.mitten'] },
    { id: 'gula-korset', title: 'Gula korset', icon: '✳️', desc: 'Prick, L, linje, kors', nodes: ['gula-korset'], skills: ['prog.kub.gulkors'] },
    { id: 'gula-kanterna', title: 'Gula kanterna', icon: '🟨', desc: 'Kanterna mot sina mittbitar', nodes: ['gula-kanterna'], skills: ['prog.kub.gulkant'] },
    { id: 'gula-hornen', title: 'Gula hörnen', icon: '📐', desc: 'Hörnen till rätt plats', nodes: ['gula-hornen'], skills: ['prog.kub.gulhorn'] },
    { id: 'vrid-hornen', title: 'Vrid hörnen', icon: '🌀', desc: 'Ner-tricket och den sista vridningen', nodes: ['vrid-hornen'], skills: ['prog.kub.vridhorn'] },
    { id: 'hela-losningen', title: 'Hela lösningen', icon: '🏆', desc: 'Alla åtta stegen – lös en hel kub!', nodes: ['vilket-steg', 'hela-gula-sidan', 'utantill'], skills: ['prog.kub.steg', 'prog.kub.utantill'] },
  ],
  eras: [
    { id: 'kubens-delar', name: 'Kubens delar', icon: '🧊', fact: 'En Rubiks kub har 26 små bitar. Mittbitarna sitter fast och flyttar sig aldrig – de visar vilken färg varje sida ska ha.',
      nodes: [
        stage('mitt-kant-horn', 'Mitt, kant och hörn', '🧊', 'Hitta rätt sorts bit', 'bitar', 0, 8000),
        stage('hitta-biten', 'Hitta biten', '🔍', 'Biten med de färgerna', 'bitar', 1, 12000),
        stage('var-hor-den-hemma', 'Var hör den hemma?', '🏠', 'Mittbitarna visar vägen', 'bitar', 2, 14000),
      ] },
    { id: 'dragen', name: 'Dragen', icon: '🔄', fact: 'Varje sida har en bokstav: R höger, L vänster, U upp, D ner, F fram och B bak. Bokstäverna kommer från engelskan.',
      nodes: [
        stage('vrid-en-sida', 'Vrid en sida', '🔄', 'Gör draget', 'drag', 0, 6000),
        stage('vilket-drag', 'Vilket drag?', '👀', 'Titta och gissa', 'vilket', 0, 10000),
        stage('prim-och-dubbelt', 'Prim och dubbelt', '↩️', 'R′ och R2', 'drag', 1, 7000),
        KRABBAN,
      ] },
    { id: 'kubprogram', name: 'Kubprogram', icon: '📜', fact: 'Ett kubprogram (en algoritm) är en lista med drag som görs i ordning – precis som robotarnas program!',
      nodes: [
        stage('folj-programmet', 'Följ programmet', '📜', 'Några drag i rad', 'sekvens', 0, 14000),
        stage('vilket-drag-prim', 'Vilket drag nu?', '🔍', 'Med prim', 'vilket', 1, 10000),
        stage('langre-program', 'Längre program', '📃', 'Fler drag, med prim', 'sekvens', 1, 20000),
        stage('baklanges', 'Baklänges', '⏪', 'Ta tillbaka programmet', 'baklanges', 0, 25000),
      ] },
    { id: 'vita-korset', name: 'Vita korset', icon: '⚪', fact: 'Vi håller alltid kuben med gult uppåt och vitt nedåt. Först gör vi en blomma runt den gula mitten.',
      nodes: [
        stage('blomman', 'Blomman', '🌼', 'Ett kronblad till', 'blomma', 0, 20000),
        stage('hela-blomman', 'Svåra kronblad', '🌸', 'Kronblad som gömmer sig', 'blomma', 1, 35000),
        stage('ner-med-bladen', 'Ner med bladen', '⬇️', 'Ett halvt varv ner', 'kors', 0, 12000),
        stage('vrid-och-ner', 'Vrid och ner', '➕', 'Rätt mittbit först', 'kors', 1, 22000),
        MALARMUSEN,
      ] },
    { id: 'vita-hornen', name: 'Vita hörnen', icon: '🔺', fact: 'Höger-tricket R U R′ U′ är kubens viktigaste program. Gör det om och om igen tills hörnet sitter!',
      nodes: [
        stage('hogertricket', 'Höger-tricket', '🔺', 'Hörnet står redan rätt', 'horn', 0, 30000),
        stage('hitta-hornet', 'Hitta hörnet', '🔎', 'Ställ hörnet rätt först', 'horn', 1, 45000),
        stage('fast-horn', 'Fast hörn', '🧲', 'Ett hörn har fastnat', 'horn', 2, 60000),
      ] },
    { id: 'mittenlagret', name: 'Mittenlagret', icon: '🎯', fact: 'Nu är första lagret klart. I mittenlagret ska fyra kanter in – åt höger eller åt vänster.',
      nodes: [
        stage('mitten-hoger', 'Höger eller vänster', '🎯', 'Följ kubprogrammet', 'mitten', 0, 25000),
        stage('hoger-eller-vanster', 'Välj själv', '↔️', 'Vilket håll ska kanten?', 'mitten', 1, 50000),
        stage('fast-kant', 'Fast kant', '🧲', 'En kant har fastnat', 'mitten', 2, 70000),
        BLACKFISKEN,
      ] },
    { id: 'gula-sidan', name: 'Gula sidan', icon: '🟡', fact: 'Två lager klara! Nu gör vi gula sidan med fyra kubprogram, ett i taget.',
      nodes: [
        stage('gula-korset', 'Gula korset', '✳️', 'F R U R′ U′ F′', 'gulkors', 0, 20000),
        stage('gula-kanterna', 'Gula kanterna', '🟨', 'R U R′ U R U2 R′', 'gulkant', 0, 20000),
        stage('gula-hornen', 'Gula hörnen', '📐', 'Hörnen på plats', 'gulhorn', 0, 22000),
        stage('vrid-hornen', 'Vrid hörnen', '🌀', 'Ner-tricket', 'vridhorn', 0, 30000),
        stage('vilket-steg', 'Vilket steg?', '🧭', 'Vad ska du göra nu?', 'steg', 0, 14000),
      ] },
    { id: 'kubmastarens-rum', name: 'Kubmästarens rum', icon: '🏆', fact: 'Nu kan du alla åtta stegen. Med dem kan du lösa vilken Rubiks kub som helst!',
      nodes: [
        stage('hela-gula-sidan', 'Gula sidan själv', '🌕', 'Välj rätt kubprogram och gör det', 'gul', 1, 45000),
        stage('utantill', 'Utantill', '🧠', 'Kubprogrammen utan lapp', 'trick', 0, 20000),
        KUBMASTAREN,
      ] },
  ],
};
