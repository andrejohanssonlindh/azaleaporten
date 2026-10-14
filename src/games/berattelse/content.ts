import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Berättelsebiblioteket: ett bibliotek djupast inne i Ordskogen, fullt av korta berättelser, fakta, brev och dikter.
// Bana- och boss-id:n är permanenta. Läsbanorna har gott om tid (thrMs) – det är ingen kapplöpning.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const BOKMALEN: BossDef = {
  type: 'boss', id: 'bokmalen-gissa', kind: 'monster', name: 'Bokmalen Gissa', icon: '🐛', title: 'Gissar i stället för att läsa',
  hp: 8, trap: 'inte-i-texten', pool: [{ mode: 'mellan', level: 0 }, { mode: 'raden', level: 0 }],
  lines: {
    entrance: 'Mums, papper! Jag är Bokmalen Gissa. Jag äter böcker, men läsa dem? Nej då! Jag gissar bara vad det står. Det låter ju rätt, så då är det väl rätt?',
    phase2: 'Nu gissar jag ännu fortare! Vem behöver läsa?',
    onHeroMiss: ['Gissat är gissat!', 'Låter rätt, alltså är det rätt!', 'Mums, en gissning!'],
    onBossHit: ['Hm, stod det så i texten?', 'Aj! Du läste efter!', 'Du hittade det i texten. Fusk! Eller… läsning?'],
    defeat: 'Du läste – och det var mycket bättre än att gissa. Får jag följa med dig? Jag lovar att läsa sidorna innan jag äter dem.',
  },
  pet: { name: 'Lilla Bokmalen', icon: '🐛' }, titleReward: 'Bokmalsbetvingaren',
};

const SKATAN: BossDef = {
  type: 'boss', id: 'skumlasar-skatan', kind: 'monster', name: 'Skumläsar-Skatan', icon: '🐦', title: 'Snappar åt sig första bästa ord',
  hp: 8, trap: 'fel-detalj', pool: [{ mode: 'raden', level: 1 }, { mode: 'raden', level: 0 }],
  lines: {
    entrance: 'Skrak skrak! Jag är Skumläsar-Skatan. Jag flyger över texten och snappar åt mig det första som glittrar. Det står ju i texten – då måste det vara svaret!',
    phase2: 'Skrak! Nu skummar jag ännu snabbare!',
    onHeroMiss: ['Skrak! Det glittrade!', 'Stod i texten, alltså rätt!', 'Snapp!'],
    onBossHit: ['Skrak? Det var ju svaret på en annan fråga!', 'Du läste frågan noga…', 'Aj, inte mitt glitter!'],
    defeat: 'Du läste frågan och sedan texten – och hittade det som verkligen var svaret. Får jag följa med? Jag ska bara samla glitter som passar.',
  },
  pet: { name: 'Lilla Skatan', icon: '🐦' }, titleReward: 'Noggrannläsaren',
};

const BIBLIOTEKARIEN: BossDef = {
  type: 'boss', id: 'bibliotekarien', kind: 'mastare', name: 'Bibliotekarien', icon: '📚', title: 'Berättelsebibliotekets Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'berattelsebiblioteket.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Mästerläsare',
};

export const BERATTELSEBIBLIOTEKET: AreaDef = {
  areaId: 'berattelsebiblioteket',
  gameId: 'berattelse',
  title: 'Berättelsebiblioteket',
  kunskap: { name: 'Läsförståelse', icon: '📚', titles: ['Bokslukare', 'Läsdetektiv'] },
  texts: { cleared: 'En ny hylla öppnas!', notYet: 'Nio rätt av tio behövs för att öppna hyllan – läs igen!', back: 'Till biblioteket' },
  story: 'Djupast inne i Ordskogen ligger ett gammalt bibliotek. Hyllorna är fulla av berättelser, fakta, brev och dikter från hela ön. Läs noga, hitta ledtrådarna och lås upp hylla efter hylla!',
  eras: [
    { id: 'sagohyllan', name: 'Sagohyllan', icon: '📖', fact: 'Ofta står svaret rakt ut i texten. Läs frågan, leta upp stället i texten och läs det en gång till.',
      nodes: [
        stage('det-star-i-texten', 'Det står i texten', '🔦', 'Hitta svaret i texten', 'raden', 0, 40000),
        stage('vad-betyder-ordet', 'Vad betyder ordet?', '💬', 'Ord i en text', 'ord', 0, 40000),
      ] },
    { id: 'detektivhornan', name: 'Detektivhörnan', icon: '🔍', fact: 'Ibland står svaret inte rakt ut. Då letar man ledtrådar och tänker själv. Det kallas att läsa mellan raderna.',
      nodes: [
        stage('mellan-raderna', 'Mellan raderna', '🕵️', 'Leta ledtrådar', 'mellan', 0, 45000),
        stage('vad-handlar-det-om', 'Vad handlar det om?', '🧭', 'Hela texten, inte bara en bit', 'huvud', 0, 45000),
        BOKMALEN,
      ] },
    { id: 'langa-hyllan', name: 'Långa hyllan', icon: '📚', fact: 'Längre texter läser man en bit i taget. Det är okej att läsa samma ställe flera gånger.',
      nodes: [
        stage('langre-texter', 'Längre texter', '📜', 'Hitta svaret i längre texter', 'raden', 1, 60000),
        stage('kluriga-ledtradar', 'Kluriga ledtrådar', '🧩', 'Mellan raderna i längre texter', 'mellan', 1, 60000),
        SKATAN,
      ] },
    { id: 'lasesalen', name: 'Läsesalen', icon: '🪑', fact: 'Texter är olika: en berättelse, en faktatext, en instruktion, ett brev, en dikt eller en annons. Hur texten ser ut visar vad den vill.',
      nodes: [
        stage('ord-i-langre-texter', 'Svåra ord', '🔤', 'Vad betyder ordet i texten?', 'ord', 1, 60000),
        stage('huvudtanken', 'Huvudtanken', '💡', 'Vad handlar hela texten om?', 'huvud', 1, 60000),
        stage('vilken-sorts-text', 'Vilken sorts text?', '🗃️', 'Berättelse, fakta, brev …', 'texttyp', 1, 30000),
      ] },
    { id: 'arkivet', name: 'Arkivet', icon: '🗝️', fact: 'Längst in ligger arkivet med bibliotekets alla texter. Den som kan läsa dem alla får kalla sig Mästerläsare.',
      nodes: [
        stage('blandade-texter', 'Blandade texter', '📚', 'Allt från biblioteket', 'blandat', 0, 45000),
        stage('stora-lasprovet', 'Stora läsprovet', '🏅', 'De längsta texterna', 'blandat', 1, 60000),
        BIBLIOTEKARIEN,
      ] },
  ],
};
