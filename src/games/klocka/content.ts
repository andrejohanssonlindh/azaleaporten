import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';
import type { Mode } from './logic/questions';

// Tidstornet: tidsresor genom epokerna. Bana- och boss-id:n är permanenta (sparas i framstegen).

const THR: Record<Mode, number> = { choice: 7000, words: 12000, clock: 12000, between: 30000 };

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode, level: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs: THR[mode] });

const HALVSAURUS: BossDef = {
  type: 'boss', id: 'halvsaurus', kind: 'monster', group: 'narstrid', name: 'Halvsaurus', icon: '🦖', title: 'Dinosaurien som delar allt på mitten',
  hp: 8, trap: 'halv', pool: [{ mode: 'choice', level: 1 }, { mode: 'words', level: 1 }],
  lines: {
    entrance: 'RAAAWR! Halv tre är väl tre och trettio? Hehe… eller? Ingen tar sig förbi mig utan att kunna "halv"!',
    phase2: 'Grrr! Nu blandar jag in kvartarna också!',
    onHeroMiss: ['Hahaa! Halv-fällan slog igen!', 'RAWR! Halv betyder halvvägs DIT, inte därifrån!', 'Hehe, där lurade jag dig!'],
    onBossHit: ['Aj! Du kan ju halv!', 'RAWR… rätt igen?!', 'Min svans! Det där var prick rätt.'],
    defeat: 'Okej, okej… halv tre är 2:30. Jag ger mig! Kan jag få följa med dig hem? Jag lovar att inte äta upp några klockor.',
  },
  pet: { name: 'Lilla Halvsaurus', icon: '🦖' }, titleReward: 'Halvtämjaren',
};

const MUMIEN: BossDef = {
  type: 'boss', id: 'mumien', kind: 'monster', group: 'magi', name: 'Mumien Vändkappa', icon: '🧟', title: 'Lindad åt fel håll i tretusen år',
  hp: 8, trap: 'rel', pool: [{ mode: 'choice', level: 3 }, { mode: 'words', level: 3 }, { mode: 'clock', level: 3 }],
  lines: {
    entrance: 'Mmmmfff… I eller över? Över eller i? Jag har lindat in alla klockor i pyramiden baklänges!',
    phase2: 'Mmmf! Nu lindar jag in dem DUBBELT!',
    onHeroMiss: ['Mmmhaha! Baklänges igen!', 'Fem i är FÖRE, fem över är EFTER… eller hur var det nu?', 'Mmmf, mina bindlar lurade dig!'],
    onBossHit: ['Mina bindlar lossnar!', 'Mmmf… du vet vad som är före och efter.', 'Aj, rakt i sarkofagen!'],
    defeat: 'Du såg igenom mina bindlar! "I" är före, "över" är efter. Får jag bo hos dig? Det är så dammigt i pyramiden.',
  },
  pet: { name: 'Lilla mumien', icon: '🧟' }, titleReward: 'Mumieväckaren',
};

const NATTKORPEN: BossDef = {
  type: 'boss', id: 'nattkorpen', kind: 'monster', group: 'avstand', name: 'Nattkorpen', icon: '🐦‍⬛', title: 'Vet aldrig om det är morgon eller kväll',
  hp: 8, trap: 'period', pool: [{ mode: 'clock', level: 4 }, { mode: 'words', level: 4 }, { mode: 'between', level: 4 }],
  lines: {
    entrance: 'KRAA! Är det morgon eller kväll? Jag har flugit runt jorden så länge att jag har glömt bort det!',
    phase2: 'KRAAA! Nu flyger jag över midnatt!',
    onHeroMiss: ['Kraa! Förmiddag eller eftermiddag? Hehe.', 'Titta på solen, lilla hjälte… kraa!', 'Kraa! Där tappade du dygnet!'],
    onBossHit: ['Kraa! Du har koll på solen.', 'Mina fjädrar! Rätt igen.', 'KRAA… prick rätt dygnshalva.'],
    defeat: 'Kraa… du vet alltid om solen är på väg upp eller ner. Låt mig flyga med dig, så slipper jag gissa.',
  },
  pet: { name: 'Nattkorpen Munin', icon: '🐦‍⬛' }, titleReward: 'Solvakten',
};

const TIDENS_VAKTARE: BossDef = {
  type: 'boss', id: 'tidens-vaktare', kind: 'mastare', name: 'Tidens väktare', icon: '⏳', title: 'Tidstornets Mästare',
  hp: 12, pool: [{ mode: 'choice', level: 7 }, { mode: 'words', level: 7 }, { mode: 'clock', level: 7 }, { mode: 'between', level: 7 }],
  // Repliker hämtas från personan (allmän eller familjepaketets) – se content/bosses.ts, id 'tidstornet.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Tidsresenären',
};

export const TIDSTORNET: AreaDef = {
  areaId: 'tidstornet',
  gameId: 'klocka',
  title: 'Tidstornet',
  kunskap: { name: 'Tidsmagi', icon: '⏳', titles: ['Klockläsare', 'Tidsväktare'] },
  texts: { cleared: 'Tidsmaskinen är laddad!', notYet: 'Tidsmaskinen behöver minst 9 rätt – försök igen!', back: 'Till tornet' },
  story: 'Tidsmaskinen högst upp i Tidstornet har gått sönder, och nu visar klockorna fel i alla tidsåldrar! Res genom tiden, läs klockorna rätt och ladda tidsmaskinen – nio rätt av tio tar dig vidare.',
  // Varje bana lägger till en sak i taget (se LEVELS i logic/questions.ts). En boss möter nivån n och
  // nivån n+1 i andra halvan av striden, så den står alltid efter banorna som övar n+1.
  eras: [
    { id: 'dinosaurier', name: 'Dinosauriernas tid', icon: '🦕', fact: 'För 66 miljoner år sedan fanns inga klockor alls – men nu har du med dig en!',
      nodes: [
        stage('minutvisaren', 'Minutvisaren', '🕐', 'Vad betyder den långa visaren?', 'choice', 0),
        stage('forsta-orden', 'Första orden', '💬', 'Hel och halv: välj rätt ord', 'choice', 1),
        stage('ord-blir-siffror', 'Ord blir siffror', '🔢', 'Hel och halv: skriv med siffror', 'words', 1),
        stage('kvarten', 'Kvarten', '💬', 'Kvart över och kvart i', 'choice', 2),
        stage('kvart-siffror', 'Kvart med siffror', '🔢', 'Kvart: skriv med siffror', 'words', 2),
        HALVSAURUS,
      ] },
    { id: 'stenaldern', name: 'Stenåldern', icon: '🪨', fact: 'På stenåldern visste man tiden genom att titta på solen.',
      nodes: [
        stage('las-klockan', 'Läs klockan', '🕑', 'Hel, halv och kvart: skriv vad klockan visar', 'clock', 2),
        stage('tjugo', 'Tjugo', '💬', 'Tjugo över och tjugo i', 'choice', 3),
        stage('tjugo-siffror', 'Tjugo med siffror', '🔢', 'Tjugo över och i: skriv med siffror', 'words', 3),
      ] },
    { id: 'egypten', name: 'Gamla Egypten', icon: '🏺', fact: 'Egyptierna byggde solur och delade dagen i tolv timmar – precis som vår urtavla.',
      nodes: [
        stage('femminutare', 'Femminutare', '💬', 'Fem och tio över och i: välj ord', 'choice', 4),
        stage('fem-siffror', 'Fem med siffror', '🔢', 'Fem och tio över och i: skriv med siffror', 'words', 4),
        stage('fem-i-taget', 'Fem i taget', '🕒', 'Läs klockan, femminuterssteg', 'clock', 4),
        MUMIEN,
      ] },
    { id: 'vikingatiden', name: 'Vikingatiden', icon: '⛵', fact: 'Vikingarna seglade efter solen och stjärnorna för att veta tid och riktning.',
      nodes: [
        stage('kvallen', 'Kvällen', '🌙', 'Läs klockan på eftermiddagen och kvällen', 'clock', 5),
        stage('kvallsord', 'Kvällsord', '🔢', '"På kvällen": skriv med siffror', 'words', 5),
        stage('hur-lange', 'Hur länge?', '⏳', 'Räkna tiden mellan två tider', 'between', 2),
        stage('langre-resor', 'Längre resor', '⛵', 'Tid emellan, blandade klockor', 'between', 5),
        NATTKORPEN,
      ] },
    { id: 'riddartiden', name: 'Riddartiden', icon: '🏰', fact: 'På medeltiden ringde kyrkklockorna för att alla skulle veta vad klockan var.',
      nodes: [
        stage('halvvagen', 'Halvvägs', '💬', 'Fem i halv och tio över halv: välj ord', 'choice', 6),
        stage('kluriga-ord', 'Kluriga ord', '🔢', 'Fem i halv och tio över halv: skriv med siffror', 'words', 6),
        stage('varje-minut', 'Varje minut', '💬', 'Välj ord, alla minuter', 'choice', 7),
        stage('ordmastaren', 'Ordmästaren', '🔢', 'Ord till siffror, alla minuter', 'words', 7),
      ] },
    { id: 'angloket', name: 'Ångloket', icon: '🚂', fact: 'När tågen kom fick hela Sverige samma klocktid 1879 – annars hade alla missat tåget!',
      nodes: [
        stage('minutlasaren', 'Minutläsaren', '🕓', 'Läs klockan, alla minuter', 'clock', 7),
        stage('tidsresan', 'Tidsresan', '🚂', 'Tid emellan, alla minuter', 'between', 7),
      ] },
    { id: 'framtiden', name: 'Framtiden', icon: '🚀', fact: 'Högst upp i tornet, långt in i framtiden, vaktar Tidens Mästare tidsmaskinen.',
      nodes: [TIDENS_VAKTARE] },
  ],
};

/** Klockövning v0.1 hade 14 banor i en lista. Index → nytt id (sista var slutbossen). Permanent. */
export const V01_STAGE_MAP = ['minutvisaren', 'forsta-orden', 'ord-blir-siffror', 'las-klockan', 'femminutare', 'kluriga-ord', 'fem-i-taget',
  'hur-lange', 'langre-resor', 'varje-minut', 'ordmastaren', 'minutlasaren', 'tidsresan', 'tidens-vaktare'];
