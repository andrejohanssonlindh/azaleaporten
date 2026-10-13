import type { AreaDef, BossDef, StageDef } from '../../../platform/rpg/types';
import type { Mode } from './logic';

// Kroksbäck: parken med lådor, block och ramper i 3D. Kroppar och volym. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const UGGLAN: BossDef = {
  type: 'boss', id: 'ugglan-framsida', kind: 'monster', name: 'Ugglan Framsida', icon: '🦉', title: 'Räknar bara det hon ser',
  hp: 8, trap: 'bara-synliga', pool: [{ mode: 'delar', level: 0 }, { mode: 'kuber', level: 1 }],
  lines: {
    entrance: 'Hoo-hoo! Jag ser tre sidor på kuben – alltså har den tre sidor! Det jag inte ser finns inte. Hoo!',
    phase2: 'Hoo-hoo! Nu bygger jag stora block av kuber – bara framsidan räknas!',
    onHeroMiss: ['Hoo! Det jag inte ser finns inte!', 'Hihi, baksidan? Vilken baksida?', 'Hoo-hoo!'],
    onBossHit: ['Hoo?! Du räknade baksidan!', 'Aj, mina fjädrar!', 'De streckade linjerna… finns på riktigt?'],
    defeat: 'Saker finns ju fast man inte ser dem… Jag kan vrida huvudet nästan ett helt varv, och ändå missade jag det! Får jag följa med dig?',
  },
  pet: { name: 'Lilla Ugglan', icon: '🦉' }, titleReward: 'Kroppskännaren',
};

const ORMEN: BossDef = {
  type: 'boss', id: 'plusormen', kind: 'monster', name: 'Plusormen', icon: '🐍', title: 'Plussar ihop alla mått',
  hp: 8, trap: 'adderade', pool: [{ mode: 'volym', level: 1 }, { mode: 'volym', level: 2 }],
  lines: {
    entrance: 'Sssss… Fem plus tre plus två – tio kubikcentimeter! Jag plussar alltid. Gånger är så… långt. Sssss.',
    phase2: 'Sssss! Större lådor, större plus!',
    onHeroMiss: ['Sssss, plus är bäst!', 'Hihi, lägg ihop allt!', 'Sssslurp!'],
    onBossHit: ['Sss?! Lager på lager?', 'Aj, min svans!', 'Gånger… gånger… gånger?'],
    defeat: 'Volymen är lager på lager – gånger, inte plus! Får jag följa med dig? Jag kan rulla ihop mig till en cylinder.',
  },
  pet: { name: 'Lilla Plusormen', icon: '🐍' }, titleReward: 'Volymmästaren',
};

const MASTARE: BossDef = {
  type: 'boss', id: 'kubmastaren', kind: 'mastare', name: 'Kubmästaren', icon: '📦', title: 'Kroksbäcks Mästare',
  hp: 12, pool: [{ mode: 'namn', level: 2 }, { mode: 'delar', level: 1 }, { mode: 'kuber', level: 2 }, { mode: 'volym', level: 2 }, { mode: 'liter', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'kroksback.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Kubskejtaren',
};

export const KROKSBACK: AreaDef = {
  areaId: 'kroksback',
  gameId: 'kroppar',
  title: 'Kroksbäck',
  kunskap: { name: 'Rymdkraft', icon: '📦', titles: ['Kubstaplare', 'Volymvirtuos'] },
  texts: { cleared: 'Blocket står!', notYet: 'Minst 9 rätt för att bygga klart – försök igen!', back: 'Till Kroksbäck' },
  story: 'I Kroksbäcks park är allt byggt i 3D: lådor, block, rör och pyramider att skejta på. Men Ugglan Framsida tror att bara det hon ser finns, och Plusormen har räknat fel på alla lådor. Hjälp till att bygga rätt! Nio rätt av tio, så står blocket.',
  lessons: [
    { id: 'kropparna', title: 'Kropparna', icon: '🎲', desc: 'Kub, klot, cylinder, kon och fler', nodes: ['kropparna', 'fler-kroppar', 'vardagskroppar'], skills: ['ma.geo.kroppar-namn', 'ma.geo.kroppar-vardag'] },
    { id: 'kubens-delar', title: 'Sidoytor, kanter och hörn', icon: '🧊', desc: 'Glöm inte baksidan', nodes: ['kubens-delar', 'kanter-och-horn'], skills: ['ma.geo.kroppar-delar'] },
    { id: 'rakna-kuber', title: 'Räkna kuber', icon: '🧱', desc: 'Lager för lager', nodes: ['bygg-med-kuber', 'ugglan-framsida', 'storre-block', 'trappan'], skills: ['ma.geo.volym-kuber'] },
    { id: 'volym', title: 'Rätblockets volym', icon: '📏', desc: 'Längd gånger bredd gånger höjd', nodes: ['ratblockets-volym', 'plusormen', 'stora-lador', 'akvariet'], skills: ['ma.geo.volym-ratblock', 'ma.geo.volym-liter'] },
    { id: 'liter', title: 'Liter och milliliter', icon: '🥛', desc: 'l, dl, cl, ml och dm³', nodes: ['liter-och-deciliter', 'ml-och-cl', 'kubik'], skills: ['ma.geo.volymenheter'] },
  ],
  eras: [
    { id: 'lador', name: 'Lådorna', icon: '📦', fact: 'En kropp har tre dimensioner: längd, bredd och höjd. En kub är som en tärning – alla kanter lika långa.',
      nodes: [
        stage('kropparna', 'Kropparna', '🎲', 'Kub, klot, cylinder och kon', 'namn', 0, 6000),
        stage('kubens-delar', 'Kubens delar', '🧊', 'Hörn och sidoytor på en kub', 'delar', 0, 7000),
        stage('bygg-med-kuber', 'Bygg med kuber', '🧱', 'Hur många kuber?', 'kuber', 0, 8000),
        UGGLAN,
      ] },
    { id: 'roren', name: 'Rören', icon: '🛢️', fact: 'De streckade linjerna i en teckning är kanter på baksidan – de finns, fast man inte ser dem.',
      nodes: [
        stage('fler-kroppar', 'Fler kroppar', '🔺', 'Rätblock, pyramid och prisma', 'namn', 1, 7000),
        stage('kanter-och-horn', 'Kanter och hörn', '📐', 'Räkna delarna, även baksidan', 'delar', 1, 8000),
        stage('storre-block', 'Större block', '🏗️', 'Rätblock av kuber, lager på lager', 'kuber', 1, 9000),
        stage('liter-och-deciliter', 'Liter och deciliter', '🥛', 'Byt enhet: l och dl', 'liter', 0, 7000),
      ] },
    { id: 'pyramiderna', name: 'Pyramiderna', icon: '🔺', fact: 'Rätblockets volym = längd · bredd · höjd. Den mäts i kubikcentimeter, cm³.',
      nodes: [
        stage('ratblockets-volym', 'Rätblockets volym', '📏', 'Längd gånger bredd gånger höjd', 'volym', 1, 10000),
        ORMEN,
        stage('vardagskroppar', 'Vardagskroppar', '🥫', 'Vilken kropp liknar saken?', 'namn', 2, 7000),
        stage('trappan', 'Trappan', '🪜', 'Räkna kuberna i en trappa', 'kuber', 2, 10000),
      ] },
    { id: 'stora-blocket', name: 'Stora blocket', icon: '🧊', fact: 'En liter är lika mycket som en kubikdecimeter: 1 l = 1 dm³ = 1000 cm³.',
      nodes: [
        stage('ml-och-cl', 'Milliliter och centiliter', '🧪', 'l, dl, cl och ml', 'liter', 1, 8000),
        stage('stora-lador', 'Stora lådor', '🚚', 'Volym med större tal', 'volym', 2, 14000),
        stage('kubik', 'Kubik', '🧊', 'dm³, cm³ och liter', 'liter', 2, 9000),
        stage('akvariet', 'Akvariet', '🐠', 'Hur många liter? (räknare finns)', 'volym', 3, 20000),
        stage('blockfesten', 'Blockfesten', '🎉', 'Allt blandat', 'blandat', 2, 12000),
      ] },
    { id: 'lagret', name: 'Lagret', icon: '🏚️', fact: 'Längst in i det gamla lagret, bland tusentals kuber, väntar Kubmästaren.',
      nodes: [MASTARE] },
  ],
};
