import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';
import type { Mode } from './logic';

// Myntmarknaden: marknaden vid foten av Talbergen. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const MYNTSKATAN: BossDef = {
  type: 'boss', id: 'myntskatan', kind: 'monster', name: 'Myntskatan', icon: '🐦', title: 'Samlar på allt som glittrar',
  hp: 8, trap: 'raknade-antal', pool: [{ mode: 'rakna', level: 0 }, { mode: 'rakna', level: 1 }],
  lines: {
    entrance: 'Skrak! Fem mynt är väl fem kronor? Ett glänsande mynt är ett mynt, hihi! Jag har snott hela kassan!',
    phase2: 'Skrak skrak! Nu tar jag sedlarna också!',
    onHeroMiss: ['Skrak! Du räknade mynten, inte pengarna!', 'Hihi, mitt bo blir allt rikare!', 'Glitter glitter!'],
    onBossHit: ['Skrak?! Du läste siffrorna!', 'Mina fina mynt!', 'Aj, en tia rätt i näbben!'],
    defeat: 'Okej… en tiokrona är värd tio, inte ett. Du räknar som en riktig köpman! Får jag bo hos dig? Jag lovar att bara samla knappar.',
  },
  pet: { name: 'Lilla Myntskatan', icon: '🐦' }, titleReward: 'Myntkännaren',
};

const TVATTBJORNEN: BossDef = {
  type: 'boss', id: 'tvattbjornen', kind: 'monster', name: 'Tvättbjörnen Tvärtom', icon: '🦝', title: 'Ger alltid fel växel tillbaka',
  hp: 8, trap: 'lanade-inte', pool: [{ mode: 'vaxel', level: 1 }, { mode: 'vaxel', level: 2 }],
  lines: {
    entrance: 'Femtio minus trettiosju? Noll minus sju går inte, så jag tar sju minus noll! Varsågod, tjugosju kronor tillbaka. Tvärtom är bäst!',
    phase2: 'Nu tvättar jag sedlarna – tvärtom!',
    onHeroMiss: ['Tvärtom igen, hehe!', 'Min kassa växer!', 'Fel växel, fel växel!'],
    onBossHit: ['Du räknade uppåt! Smart.', 'Aj, rätt växel!', 'Hmpf… inte tvärtom alls.'],
    defeat: 'Du räknar växel som en riktig kassör! Får jag följa med? Jag kan tvätta dina mynt så de blänker.',
  },
  pet: { name: 'Lilla Tvättbjörnen', icon: '🦝' }, titleReward: 'Växelmästaren',
};

const MARKNADSMASTAREN: BossDef = {
  type: 'boss', id: 'marknadsmastaren', kind: 'mastare', name: 'Marknadsmästaren', icon: '🪙', title: 'Myntmarknadens Mästare',
  hp: 12, pool: [{ mode: 'rakna', level: 2 }, { mode: 'pris', level: 2 }, { mode: 'vaxel', level: 2 }, { mode: 'pris', level: 3 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'myntmarknaden.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Köpmannen',
};

export const MYNTMARKNADEN: AreaDef = {
  areaId: 'myntmarknaden',
  gameId: 'pengar',
  title: 'Myntmarknaden',
  kunskap: { name: 'Handelskraft', icon: '🪙', titles: ['Marknadsräknare', 'Växelvirtuos'] },
  texts: { cleared: 'Kassan stämmer!', notYet: 'Kassan behöver minst 9 rätt för att stämma – försök igen!', back: 'Till marknaden' },
  story: 'Vid foten av Talbergen ligger Myntmarknaden, där alla handlar med kronor. Men handlarna har blandat ihop kassorna! Hjälp dem räkna pengar och ge rätt växel – nio rätt av tio får en kassa att stämma.',
  lessons: [
    { id: 'rakna-pengar', title: 'Räkna pengar', icon: '🪙', desc: 'Värdet, inte antalet – störst först', nodes: ['mynten', 'myntskatan', 'sedlarna', 'stora-sedlar'], skills: ['ma.pengar.mynt', 'ma.pengar.sedlar'] },
    { id: 'lagg-ihop-priser', title: 'Lägg ihop priser', icon: '🧾', desc: 'Tiotal och ental, och avrunda för att kolla', nodes: ['sma-inkop', 'kassan', 'storhandla'], skills: ['ma.pengar.summa'] },
    { id: 'vaxel', title: 'Växel', icon: '🔄', desc: 'Räkna uppåt från priset', nodes: ['vaxel-pa-tian', 'vaxla-tillbaka', 'tvattbjornen', 'hundralappen', 'stora-kopet'], skills: ['ma.pengar.vaxel', 'ma.pengar.vaxel-stor'] },
    { id: 'styckpris', title: 'Många av samma', icon: '🧁', desc: 'Styckpris gånger antal', nodes: ['manga-av-samma'], skills: ['ma.pengar.styckpris'] },
  ],
  eras: [
    { id: 'torget', name: 'Torget', icon: '🧺', fact: 'I Sverige finns mynt på 1, 2, 5 och 10 kronor. Tiokronan är minst av de guldiga – men värd mest!',
      nodes: [
        stage('mynten', 'Mynten', '🪙', 'Hur mycket är mynten värda?', 'rakna', 0, 7000),
        stage('sma-inkop', 'Små inköp', '🍎', 'Lägg ihop två priser', 'pris', 0, 7000),
        stage('vaxel-pa-tian', 'Växel på tian', '🔟', 'Betala med en tiokrona', 'vaxel', 0, 8000),
        MYNTSKATAN,
      ] },
    { id: 'standen', name: 'Marknadsstånden', icon: '⛺', fact: 'Sedlarna är på 20, 50, 100, 200 och 500 kronor. Varje sedel har sin egen färg.',
      nodes: [
        stage('sedlarna', 'Sedlarna', '💵', 'Räkna sedlar och mynt', 'rakna', 1, 9000),
        stage('kassan', 'Kassan', '🧾', 'Lägg ihop större priser', 'pris', 1, 10000),
        stage('vaxla-tillbaka', 'Växla tillbaka', '🔄', 'Betala med 20 eller 50 kronor', 'vaxel', 1, 10000),
        TVATTBJORNEN,
      ] },
    { id: 'stora-torget', name: 'Stora torget', icon: '🎪', fact: 'Växel kan du räkna uppåt: köper du för 37 kr och betalar 50, räknar du från 37 upp till 50.',
      nodes: [
        stage('stora-sedlar', 'Stora sedlar', '💰', 'Räkna upp till 500 kronor', 'rakna', 2, 12000),
        stage('storhandla', 'Storhandla', '🛒', 'Lägg ihop tre priser', 'pris', 2, 16000),
        stage('hundralappen', 'Hundralappen', '💯', 'Betala med en hundralapp', 'vaxel', 2, 12000),
      ] },
    { id: 'basaren', name: 'Basaren', icon: '🏮', fact: 'Kostar en sak 15 kr, kostar fyra stycken 4 · 15 = 60 kr.',
      nodes: [
        stage('manga-av-samma', 'Många av samma', '🧁', 'Styckpris gånger antal', 'pris', 3, 12000),
        stage('stora-kopet', 'Det stora köpet', '🎁', 'Två saker, betala med en stor sedel', 'vaxel', 3, 18000),
        stage('marknadsdagen', 'Marknadsdagen', '🎉', 'Allt blandat', 'blandat', 3, 14000),
      ] },
    { id: 'radhuset', name: 'Rådhuset', icon: '🏛️', fact: 'I rådhuset vid torget väntar Marknadsmästaren, som har koll på varenda krona.',
      nodes: [MARKNADSMASTAREN] },
  ],
};
