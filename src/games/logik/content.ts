import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Logikslingan på Robotön: logik utan kod. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const HARMAPAN: BossDef = {
  type: 'boss', id: 'harmapan', kind: 'monster', name: 'Härmapan', icon: '🐒', title: 'Härmar alltid det sista',
  hp: 8, trap: 'harmar-sista', pool: [{ mode: 'monster', level: 0 }, { mode: 'monster', level: 1 }],
  lines: {
    entrance: 'Ooh ooh! Jag är Härmapan! Vad kommer sen i mönstret? Samma som sist, förstås! Samma som sist! Ooh ooh!',
    phase2: 'Ooh! Nu härmar jag ännu fortare!',
    onHeroMiss: ['Ooh! Samma som sist!', 'Härmad!', 'Ooh ooh, lurad!'],
    onBossHit: ['Ooh?! Du såg mönstret!', 'Inte härmat – tänkt!', 'Ooh, smart!'],
    defeat: 'Ooh… du ser hela mönstret, inte bara det sista. Får jag följa med? Jag lovar att bara härma dig när du gör rätt.',
  },
  pet: { name: 'Lilla Härmapan', icon: '🐒' }, titleReward: 'Mönsterspanaren',
};

const GLADAN: BossDef = {
  type: 'boss', id: 'glom-inte-gladan', kind: 'monster', name: 'Glöm-Inte-Gladan', icon: '🦅', title: 'Flyger förbi alla INTE',
  hp: 8, trap: 'missar-inte', pool: [{ mode: 'ochinte', level: 0 }, { mode: 'ochinte', level: 1 }],
  lines: {
    entrance: 'Kri-kri! Jag är Glöm-Inte-Gladan. Jag flyger så fort att jag aldrig hinner läsa ordet INTE. Vilken är INTE röd? Den röda, så klart! Kri!',
    phase2: 'Kri-kri! Nu flyger jag ännu fortare!',
    onHeroMiss: ['Kri! Glömde INTE!', 'Svisch, förbi!', 'Kri-kri, lurad!'],
    onBossHit: ['Kri?! Du läste INTE!', 'Du såg ordet!', 'Inte lurad – snyggt!'],
    defeat: 'Kri… du läser varje litet ord. Får jag sitta på din axel? Jag ska viska INTE i ditt öra.',
  },
  pet: { name: 'Lilla Gladan', icon: '🦅' }, titleReward: 'INTE-läsaren',
};

const LOGIKMASTAREN: BossDef = {
  type: 'boss', id: 'logikmastaren', kind: 'mastare', name: 'Logikmästaren', icon: '🧩', title: 'Logikslingans Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'logikslingan.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Logikhjärnan',
};

export const LOGIKSLINGAN: AreaDef = {
  areaId: 'logikslingan',
  gameId: 'logik',
  title: 'Logikslingan',
  kunskap: { name: 'Logik', icon: '🧩', titles: ['Klurhuvudet', 'Logikens mästare'] },
  texts: { cleared: 'Slingan är löst!', notYet: 'Nio rätt av tio behövs för att lösa slingan – försök igen!', back: 'Till slingan' },
  story: 'Längs Logikslingan bor robotar som tänker. Innan man kan programmera måste man kunna se mönster, göra saker i rätt ordning och följa regler – precis som en robot. Följ slingan!',
  eras: [
    { id: 'monsterangen', name: 'Mönsterängen', icon: '🌼', fact: 'Ett mönster är något som upprepas. Den som hittar biten som upprepas kan gissa vad som kommer sedan – det gör datorer hela tiden!',
      nodes: [
        stage('vad-kommer-sen', 'Vad kommer sen?', '🔴', 'Hitta mönstret', 'monster', 0, 8000),
        stage('steg-for-steg', 'Steg för steg', '🪜', 'Lägg stegen i ordning', 'ordning', 0, 15000),
      ] },
    { id: 'sorteringsmaskinen', name: 'Sorteringsmaskinen', icon: '🗃️', fact: 'Datorer sorterar med OCH och INTE. OCH betyder att båda sakerna måste stämma.',
      nodes: [
        stage('och', 'Röd OCH rund', '🟥', 'Både färgen och formen', 'ochinte', 0, 9000),
        stage('kluriga-monster', 'Kluriga mönster', '🌀', 'Längre mönster och tal', 'monster', 1, 10000),
        HARMAPAN,
      ] },
    { id: 'robotreglerna', name: 'Robotreglerna', icon: '📋', fact: 'OM … SÅ … är hur en robot bestämmer sig. Stämmer villkoret gör den saken – annars gör den ingenting.',
      nodes: [
        stage('om-sa', 'OM … SÅ …', '🚦', 'Vad gör Robo nu?', 'omsa', 0, 10000),
        stage('men-inte', 'Men INTE', '🚫', 'OCH, INTE och men inte', 'ochinte', 1, 11000),
        GLADAN,
      ] },
    { id: 'annarsbron', name: 'Annars-bron', icon: '🌉', fact: 'Med ANNARS vet roboten alltid vad den ska göra: en sak om villkoret stämmer, en annan sak om det inte gör det.',
      nodes: [
        stage('om-sa-annars', 'OM … SÅ … ANNARS', '🔀', 'Två vägar', 'omsa', 1, 12000),
        stage('langre-recept', 'Längre recept', '📜', 'Fem steg i rätt ordning', 'ordning', 1, 20000),
      ] },
    { id: 'logikens-topp', name: 'Logikens topp', icon: '🏔️', fact: 'Mönster, ordning och regler – det är grunden i all programmering. Klarar du Logikmästaren?',
      nodes: [
        stage('hela-slingan', 'Hela slingan', '🧩', 'Allt blandat', 'blandat', 1, 12000),
        LOGIKMASTAREN,
      ] },
  ],
};
