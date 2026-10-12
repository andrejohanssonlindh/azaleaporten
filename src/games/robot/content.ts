import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Robotöns robotområden: Kodstigen, Loopverkstaden och Buggjakten. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const mastare = (id: string, name: string, icon: string, title: string, titleReward: string, hp = 12): BossDef => ({
  type: 'boss', id, kind: 'mastare', name, icon, title, hp, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id '<område>.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward,
});

// ---------- Kodstigen ----------

const HOPPETOSSAN: BossDef = {
  type: 'boss', id: 'hoppetossan', kind: 'monster', name: 'Hoppetossan', icon: '🦘', title: 'Räknar alltid ett steg fel',
  hp: 8, trap: 'ett-steg', pool: [{ mode: 'pilar-vart', level: 0 }, { mode: 'pilar', level: 1 }],
  lines: {
    entrance: 'Boing! Jag är Hoppetossan! Jag räknar rutan jag står på också – boing! – så jag hoppar alltid ett steg för långt. Eller för kort. Boing!',
    phase2: 'Boing boing! Nu hoppar jag dubbelt så fort!',
    onHeroMiss: ['Boing! Ett steg fel!', 'Hoppsan, för långt!', 'Boing, räkna igen!'],
    onBossHit: ['Boing?! Precis rätt!', 'Du räknade stegen!', 'Oj, landade perfekt!'],
    defeat: 'Boing… du räknar varenda steg rätt. Lär du mig? Jag lovar att bara hoppa när du säger till.',
  },
  pet: { name: 'Lilla Hoppetossan', icon: '🦘' }, titleReward: 'Stegräknaren',
};

const SPEGELTROLLET: BossDef = {
  type: 'boss', id: 'spegeltrollet', kind: 'monster', name: 'Spegeltrollet', icon: '🪞', title: 'Blandar ihop robotens vänster och din vänster',
  hp: 8, trap: 'vanster-hoger', pool: [{ mode: 'svang-vart', level: 0 }, { mode: 'svang', level: 0 }],
  lines: {
    entrance: 'Hihi! Jag är Spegeltrollet. När roboten tittar mot dig byter jag plats på vänster och höger. Vilket håll är vilket nu? Hihi!',
    phase2: 'Nu vänder jag roboten upp och ner – hihi!',
    onHeroMiss: ['Hihi, spegelvänt!', 'Fel håll!', 'Speglat och klart!'],
    onBossHit: ['Va?! Du vände dig rätt!', 'Spegeln spricker!', 'Robotens vänster – rätt!'],
    defeat: 'Min spegel lurar dig inte längre… Får jag följa med? Jag kan visa dig hur saker ser ut från andra hållet.',
  },
  pet: { name: 'Lilla Spegeltrollet', icon: '🪞' }, titleReward: 'Spegelmästaren',
};

export const KODSTIGEN: AreaDef = {
  areaId: 'kodstigen',
  gameId: 'kodstigen',
  title: 'Kodstigen',
  kunskap: { name: 'Robotstyrning', icon: '🧭', titles: ['Robotförare', 'Robotkaptenen'] },
  texts: { cleared: 'Roboten kom hela vägen fram!', notYet: 'Nio rätt av tio behövs för att roboten ska hitta hem – försök igen!', back: 'Till stigen' },
  story: 'På Robotön rullar små robotar omkring som bara gör exakt det man säger åt dem. De behöver batterier för att orka, men de hittar inte själva. Bygg program som tar dem till 🔋 – steg för steg!',
  eras: [
    { id: 'startrutan', name: 'Startrutan', icon: '🟩', fact: 'En robot gör precis det du säger – inte mer och inte mindre. Ett program är en lista med instruktioner.',
      nodes: [
        stage('forsta-stegen', 'Första stegen', '⬆️', 'Styr roboten med pilar', 'pilar', 0, 15000),
        stage('vart-tar-den-vagen', 'Vart tar den vägen?', '👀', 'Följ pilarna', 'pilar-vart', 0, 10000),
      ] },
    { id: 'stenfaltet', name: 'Stenfältet', icon: '🪨', fact: 'Programmerare planerar först och testar sedan. Kör programmet och se om det blev rätt!',
      nodes: [
        stage('runt-stenarna', 'Runt stenarna', '🧱', 'Hitta vägen förbi', 'pilar', 1, 20000),
        stage('langre-vagar', 'Längre vägar', '🛤️', 'Var hamnar roboten?', 'pilar-vart', 1, 14000),
        HOPPETOSSAN,
      ] },
    { id: 'svangen', name: 'Svängen', icon: '↪️', fact: 'När roboten svänger vänder den sig på stället. Vänster och höger räknas från robotens håll – inte ditt!',
      nodes: [
        stage('fram-och-svang', 'Fram och sväng', '↩️', 'Framåt, vänster, höger', 'svang', 0, 20000),
        stage('robotens-vanster', 'Robotens vänster', '🤖', 'Vart tittar roboten?', 'svang-vart', 0, 12000),
        stage('svangar-och-stenar', 'Svängar och stenar', '🪨', 'Sväng runt stenarna', 'svang', 1, 25000),
        SPEGELTROLLET,
      ] },
    { id: 'diamantgruvan', name: 'Diamantgruvan', icon: '💎', fact: 'Ofta finns det många vägar. Den kortaste är smart – men alla vägar som kommer fram är rätt!',
      nodes: [
        stage('diamanter', 'Diamanter', '💎', 'Plocka alla på vägen', 'diamant', 0, 25000),
        stage('svang-i-gruvan', 'Sväng i gruvan', '⛏️', 'Var hamnar roboten?', 'svang-vart', 1, 16000),
        stage('diamanter-med-svang', 'Diamanter och svängar', '💠', 'Svängar och diamanter', 'diamant', 1, 35000),
      ] },
    { id: 'kompassen', name: 'Kompassen', icon: '🧭', fact: 'Nu kan du styra en robot både med pilar och med svängar. Klarar du Kodstigens Mästare?',
      nodes: [
        stage('hela-stigen', 'Hela stigen', '🗺️', 'Allt blandat', 'blandat', 1, 25000),
        mastare('stigmastaren', 'Stigmästaren', '🧭', 'Kodstigens Mästare', 'Robotstyraren'),
      ] },
  ],
};

// ---------- Loopverkstaden ----------

const EKORREN: BossDef = {
  type: 'boss', id: 'ekorren-ett-till', kind: 'monster', name: 'Ekorren Ett-Till', icon: '🐿️', title: 'Vill alltid ha ett varv till',
  hp: 8, trap: 'loop-antal', pool: [{ mode: 'antal', level: 0 }, { mode: 'loop-vart', level: 0 }],
  lines: {
    entrance: 'Ett varv till! Ett varv till! Jag är Ekorren Ett-Till, och jag snurrar alltid ett varv för mycket. Eller ett för lite. Vem räknar?',
    phase2: 'Ett varv till, och ett till, och ett TILL!',
    onHeroMiss: ['Ett varv till!', 'Snurr snurr, fel antal!', 'Hihi, räkna igen!'],
    onBossHit: ['Va? Precis rätt antal!', 'Du räknade varven!', 'Inte ett varv för mycket!'],
    defeat: 'Okej, okej… precis så många varv som det står. Får jag följa med? Jag räknar nötter åt dig.',
  },
  pet: { name: 'Lilla Ekorren', icon: '🐿️' }, titleReward: 'Varvräknaren',
};

const SNURRAN: BossDef = {
  type: 'boss', id: 'snurran', kind: 'monster', name: 'Snurran', icon: '🌀', title: 'Upprepar bara det första',
  hp: 8, trap: 'bara-forsta', pool: [{ mode: 'loop-vart', level: 1 }],
  lines: {
    entrance: 'Snurr snurr! Jag är Snurran. I en loop upprepar jag bara det första blocket – resten glömmer jag. Snurr!',
    phase2: 'Snurrrrr! Nu glömmer jag ännu mer!',
    onHeroMiss: ['Snurr! Bara det första!', 'Resten glömde du!', 'Snurrigt!'],
    onBossHit: ['Hela loopen?! Snurr…', 'Du kom ihåg allt!', 'Varv för varv – rätt!'],
    defeat: 'Snurr… hela loopen, varv efter varv. Nu fattar jag! Får jag snurra bredvid dig?',
  },
  pet: { name: 'Lilla Snurran', icon: '🌀' }, titleReward: 'Loopläsaren',
};

export const LOOPVERKSTADEN: AreaDef = {
  areaId: 'loopverkstaden',
  gameId: 'loopverkstaden',
  title: 'Loopverkstaden',
  kunskap: { name: 'Loopar', icon: '🔁', titles: ['Loopsnickaren', 'Loopverkstadens chef'] },
  texts: { cleared: 'Maskinerna snurrar som de ska!', notYet: 'Nio rätt av tio behövs för att få igång maskinerna – försök igen!', back: 'Till verkstaden' },
  story: 'I Loopverkstaden bygger robotarna saker – samma sak om och om igen. Men programmen blir alldeles för långa! Lär dig loopar, så kan ett kort program göra jättemycket.',
  eras: [
    { id: 'transportbandet', name: 'Transportbandet', icon: '🔁', fact: 'En loop upprepar samma block flera gånger. I stället för ➡ ➡ ➡ ➡ kan du skriva 🔁 4 × ➡.',
      nodes: [
        stage('hur-manga-varv', 'Hur många varv?', '🔢', 'Välj rätt antal', 'antal', 0, 12000),
        stage('folj-loopen', 'Följ loopen', '👀', 'Var hamnar roboten?', 'loop-vart', 0, 12000),
      ] },
    { id: 'kugghjulen', name: 'Kugghjulen', icon: '⚙️', fact: 'Med en loop blir programmet kort, även när roboten åker långt.',
      nodes: [
        stage('bygg-med-loop', 'Bygg med loop', '🧰', 'Blocken räcker bara med en loop', 'loop-bygg', 0, 25000),
        stage('varv-och-svangar', 'Varv och svängar', '↪️', 'Hur många varv nu?', 'antal', 1, 14000),
        EKORREN,
      ] },
    { id: 'monsterhallen', name: 'Mönsterhallen', icon: '🧱', fact: 'Allt som står inne i loopen upprepas – hela mönstret, varv efter varv.',
      nodes: [
        stage('monster-i-loopen', 'Mönster i loopen', '🔂', 'Följ hela mönstret', 'loop-vart', 1, 15000),
        stage('trappan', 'Trappan', '🪜', 'Bygg ett mönster som upprepas', 'loop-bygg', 1, 30000),
        SNURRAN,
      ] },
    { id: 'loop-i-loop', name: 'Loop i loop', icon: '🪆', fact: 'En loop kan ligga i en annan loop. Den inre loopen körs klart varje gång den yttre går ett varv.',
      nodes: [
        stage('loop-i-loopen', 'Loop i loopen', '🪆', 'Var hamnar roboten?', 'nastlad', 0, 18000),
        stage('diamantloopen', 'Diamantloopen', '💎', 'Loopa förbi diamanterna', 'loop-bygg', 2, 35000),
        stage('bygg-loop-i-loop', 'Bygg loop i loop', '🏗️', 'Två loopar', 'nastlad', 1, 40000),
      ] },
    { id: 'verkmastarens-rum', name: 'Verkmästarens rum', icon: '🛠️', fact: 'Nu kan du få en robot att göra samma sak hur många gånger som helst. Klarar du Loopverkstadens Mästare?',
      nodes: [
        stage('hela-verkstaden', 'Hela verkstaden', '🏭', 'Allt blandat', 'blandat', 1, 25000),
        mastare('loopmastaren', 'Loopmästaren', '🔁', 'Loopverkstadens Mästare', 'Loopmästare'),
      ] },
  ],
};

// ---------- Buggjakten ----------

const SKYLLBUGGEN: BossDef = {
  type: 'boss', id: 'skyll-pa-sista-buggen', kind: 'monster', name: 'Skyll-på-sista-Buggen', icon: '🪲', title: 'Skyller alltid på det sista blocket',
  hp: 8, trap: 'sista-blocket', pool: [{ mode: 'pilar', level: 1 }, { mode: 'svang', level: 0 }],
  lines: {
    entrance: 'Krrr! Jag är Skyll-på-sista-Buggen. När roboten krockar skyller jag på blocket där det small. Men felet sitter ju någon helt annanstans! Krrr!',
    phase2: 'Krrr krrr! Nu gömmer jag felet ännu tidigare!',
    onHeroMiss: ['Krrr! Där var det inte!', 'Skyll på nåt annat!', 'Felet sitter tidigare, krrr!'],
    onBossHit: ['Krrr?! Du hittade början!', 'Precis där det började!', 'Bugg funnen!'],
    defeat: 'Krrr… du letar där felet börjar, inte där det syns. Får jag följa med? Jag är bra på att krypa in i program.',
  },
  pet: { name: 'Lilla Buggen', icon: '🪲' }, titleReward: 'Buggjägaren',
};

export const BUGGJAKTEN: AreaDef = {
  areaId: 'buggjakten',
  gameId: 'buggjakten',
  title: 'Buggjakten',
  kunskap: { name: 'Felsökning', icon: '🐞', titles: ['Buggspanaren', 'Mästerdetektiven'] },
  texts: { cleared: 'Buggen är fångad!', notYet: 'Nio rätt av tio behövs för att fånga buggarna – försök igen!', back: 'Till buggjakten' },
  story: 'Små buggar har krupit in i robotarnas program, och nu krockar robotarna överallt. Testkör programmen, se var det går fel och hitta blocket som är buggigt!',
  eras: [
    { id: 'myrstacken', name: 'Myrstacken', icon: '🐜', fact: 'Ett fel i ett program kallas en bugg. Ordet blev känt när en riktig mal fastnade i en dator år 1947!',
      nodes: [
        stage('forsta-buggen', 'Första buggen', '🐞', 'Hitta det felaktiga blocket', 'pilar', 0, 15000),
        stage('ramlat-block', 'Ett block har ramlat bort', '🧩', 'Vilket block fattas?', 'laga', 0, 12000),
      ] },
    { id: 'svangbuggar', name: 'Svängbuggarna', icon: '↪️', fact: 'Testkör programmet och titta noga. Felet sitter där roboten först går åt fel håll – inte alltid där den krockar.',
      nodes: [
        stage('svangbuggen', 'Svängbuggen', '🔄', 'En sväng är fel', 'svang', 0, 18000),
        stage('langre-program', 'Längre program', '📜', 'Leta i långa program', 'pilar', 1, 18000),
        SKYLLBUGGEN,
      ] },
    { id: 'loopbuggar', name: 'Loopbuggarna', icon: '🔁', fact: 'En bugg i en loop görs om varje varv – därför kan ett litet fel ge en stor krock!',
      nodes: [
        stage('buggar-i-loopar', 'Buggar i loopar', '🔁', 'Felet sitter i en loop', 'loop', 0, 18000),
        stage('laga-svangen', 'Laga svängen', '🔧', 'Vilket block fattas?', 'laga', 1, 15000),
        stage('svara-buggar', 'Svåra buggar', '🕷️', 'Svängar och stenar', 'svang', 1, 22000),
        stage('loopbuggar-med-svang', 'Loopbuggar med svängar', '🌀', 'Loopar och svängar', 'loop', 1, 22000),
      ] },
    { id: 'buggmastarens-bo', name: 'Buggmästarens bo', icon: '🕸️', fact: 'Riktiga programmerare letar buggar varje dag. Klarar du Buggjaktens Mästare?',
      nodes: [
        stage('alla-buggar', 'Alla buggar', '🐛', 'Allt blandat', 'blandat', 1, 22000),
        mastare('buggmastaren', 'Buggmästaren', '🔍', 'Buggjaktens Mästare', 'Buggdetektiven'),
      ] },
  ],
};
