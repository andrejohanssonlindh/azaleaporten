import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Pythonhamnen på Robotön: de första raderna riktig kod. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const CITATKRAKAN: BossDef = {
  type: 'boss', id: 'citatkrakan', kind: 'monster', name: 'Citatkråkan', icon: '🐦', title: 'Stjäl och flyttar citattecken',
  hp: 8, trap: 'citat', pool: [{ mode: 'print', level: 0 }, { mode: 'variabel', level: 0 }],
  lines: {
    entrance: 'Kraa! Jag är Citatkråkan! Jag samlar på citattecken. print("x") eller print(x) – vem bryr sig? Det är ju samma sak! Kraa!',
    phase2: 'Kraa kraa! Nu stjäl jag ännu fler citattecken!',
    onHeroMiss: ['Kraa! Text eller värde?', 'Citattecknet var mitt!', 'Kraa, lurad!'],
    onBossHit: ['Kraa?! Du såg citattecknen!', 'Text är text!', 'Du har koll, kraa!'],
    defeat: 'Kraa… du vet precis vad citattecken gör. Här, du får tillbaka dem. Får jag följa med och vakta dem åt dig?',
  },
  pet: { name: 'Lilla Citatkråkan', icon: '🐦' }, titleReward: 'Citatvakten',
};

const NOLLORMEN: BossDef = {
  type: 'boss', id: 'nollormen', kind: 'monster', name: 'Nollormen', icon: '🐍', title: 'Börjar alltid räkna på 0',
  hp: 8, trap: 'range-noll', pool: [{ mode: 'for', level: 0 }, { mode: 'for', level: 1 }],
  lines: {
    entrance: 'Sssss… Jag är Nollormen. I Python börjar man räkna på noll, sssss. Noll, ett, två! Glömmer du det slingrar jag mig runt dig!',
    phase2: 'Sssss! Nu slingrar jag mig dubbelt!',
    onHeroMiss: ['Sss! Du glömde nollan!', 'Noll först, sss!', 'Hihi, sssslingrat!'],
    onBossHit: ['Sss?! Du räknade från noll!', 'Rätt varv, sss!', 'Ssssnyggt!'],
    defeat: 'Sssss… du räknar som en riktig programmerare. Får jag ringla med dig? Jag kan hålla räkningen åt dig.',
  },
  pet: { name: 'Lilla Nollormen', icon: '🐍' }, titleReward: 'Nollans vän',
};

const PYTHONMASTAREN: BossDef = {
  type: 'boss', id: 'pythonmastaren', kind: 'mastare', name: 'Pythonmästaren', icon: '🐍', title: 'Pythonhamnens Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'pythonhamnen.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Pythonprogrammerare',
};

export const PYTHONHAMNEN: AreaDef = {
  areaId: 'pythonhamnen',
  gameId: 'python',
  title: 'Pythonhamnen',
  kunskap: { name: 'Python', icon: '🐍', titles: ['Kodlärling', 'Pythonläsaren'] },
  texts: { cleared: 'Koden kör!', notYet: 'Nio rätt av tio behövs för att koden ska köra – försök igen!', back: 'Till hamnen' },
  story: 'I Pythonhamnen pratar robotarna inte med pilar – de läser riktig kod, skriven i programspråket Python. Lär dig läsa koden som en robot: rad för rad, uppifrån och ned. Vad skriver programmet ut?',
  eras: [
    { id: 'kajen', name: 'Kajen', icon: '⚓', fact: 'Python är ett riktigt programspråk som proffs använder varje dag. print betyder "skriv ut".',
      nodes: [
        stage('hej-python', 'Hej, Python!', '👋', 'print skriver ut', 'print', 0, 10000),
        stage('variabler', 'Variabler', '📦', 'En låda med ett namn', 'variabel', 0, 10000),
      ] },
    { id: 'lagerhuset', name: 'Lagerhuset', icon: '🏚️', fact: 'En variabel är som en låda med ett namn på. I lådan ligger ett värde, och det kan bytas ut.',
      nodes: [
        stage('text-och-tal', 'Text och tal', '🔤', '"3" är inte 3', 'text', 0, 11000),
        stage('nya-varden', 'Nya värden', '🔄', 'När lådan får nytt innehåll', 'variabel', 1, 13000),
        CITATKRAKAN,
      ] },
    { id: 'vagskalet', name: 'Vägskälet', icon: '🔀', fact: 'Med if väljer programmet väg. Raderna med indrag under if körs bara om villkoret stämmer – annars körs else.',
      nodes: [
        stage('if-och-else', 'if och else', '🚦', 'Vilken väg tar programmet?', 'if', 0, 12000),
        stage('mer-print', 'Mer print', '🖨️', 'Flera rader och gånger', 'print', 1, 12000),
        stage('kluriga-villkor', 'Kluriga villkor', '🤔', 'Mindre än, lika med', 'if', 1, 14000),
      ] },
    { id: 'snurrkajen', name: 'Snurrkajen', icon: '🔁', fact: 'for i in range(3) gör samma sak tre gånger. Men räkna noga – range börjar på 0!',
      nodes: [
        stage('for-loopar', 'for-loopar', '🔁', 'Samma sak flera gånger', 'for', 0, 13000),
        stage('range-fran-till', 'range från och till', '📏', 'Loopar som räknar', 'for', 1, 15000),
        NOLLORMEN,
      ] },
    { id: 'felsokarbryggan', name: 'Felsökarbryggan', icon: '🔍', fact: 'Python är noga: saknas ett enda citattecken eller kolon fungerar inte programmet. Då får man leta fel!',
      nodes: [
        stage('hitta-felet', 'Hitta felet', '🐞', 'Vilken rad är fel?', 'fel', 0, 12000),
        stage('text-tricks', 'Text-tricks', '🧵', 'Text, tal och variabler', 'text', 1, 13000),
        stage('svarare-fel', 'Svårare fel', '🕵️', 'Kolon, indrag och ==', 'fel', 1, 14000),
      ] },
    { id: 'hamnkontoret', name: 'Hamnkontoret', icon: '🏢', fact: 'Nu kan du läsa Python: print, variabler, if och for. Klarar du Pythonmästaren?',
      nodes: [
        stage('hela-hamnen', 'Hela hamnen', '🐍', 'Allt blandat', 'blandat', 1, 13000),
        PYTHONMASTAREN,
      ] },
  ],
};
