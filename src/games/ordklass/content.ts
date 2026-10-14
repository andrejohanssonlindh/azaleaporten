import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Ordklassernas tempel: ett gammalt tempel djupt inne i Ordskogen där varje ord har sin sal. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const BLANDAREN: BossDef = {
  type: 'boss', id: 'ordklassblandaren', kind: 'monster', name: 'Ordklassblandaren', icon: '🌀', title: 'Rör ihop alla ordklasser',
  hp: 8, trap: 'fel-ordklass', pool: [{ mode: 'vilken', level: 0 }, { mode: 'vilken', level: 1 }],
  lines: {
    entrance: 'Snurr snurr! Jag är Ordklassblandaren! Jag rör om i templet tills ingen vet vad som är verb och vad som är substantiv. Är "hoppa" en sak? Är "katt" något man gör? Hihi!',
    phase2: 'Nu snurrar jag snabbare! Adjektiv, verb, substantiv – allt i samma gryta!',
    onHeroMiss: ['Snurr! Fel sal!', 'Ihoprört och klart!', 'Vilket virrvarr, hihi!'],
    onBossHit: ['Oj, du sorterade rätt!', 'Sluta städa i min gryta!', 'Hmpf. Det där ordet hamnade på rätt plats.'],
    defeat: 'Nu står varje ord i sin egen sal igen. Det är faktiskt ganska fint. Får jag följa med dig? Jag lovar att bara röra om i soppan.',
  },
  pet: { name: 'Lilla Blandaren', icon: '🌀' }, titleReward: 'Ordklasssorteraren',
};

const GASEN: BossDef = {
  type: 'boss', id: 'gadde-gasen', kind: 'monster', name: 'Gådde-gåsen', icon: '🦢', title: 'Böjer alla verb med -de',
  hp: 8, trap: 'starkt-verb', pool: [{ mode: 'starka', level: 0 }, { mode: 'starka', level: 1 }],
  lines: {
    entrance: 'Kackel! Igår gådde jag till templet, och där sedde jag dig! Jag äte en mask och dricksade lite vatten. Så heter det väl?',
    phase2: 'Igår springde jag fortare än någonsin! Kackel kackel!',
    onHeroMiss: ['Kackel! Gådde rätt!', 'Precis som jag säger!', 'Snattrade du -de? Bra!'],
    onBossHit: ['Kack… det heter visst gick?', 'Aj! Det där verbet bytte vokal!', 'Hmpf. Du kan dina starka verb.'],
    defeat: 'Igår… gick jag hit. Och såg dig. Och förlorade. Det låter faktiskt bättre! Får jag följa med dig och lära mig fler starka verb?',
  },
  pet: { name: 'Lilla Gådde-gåsen', icon: '🦢' }, titleReward: 'Verbtämjaren',
};

const ORAKLET: BossDef = {
  type: 'boss', id: 'templets-orakel', kind: 'mastare', name: 'Templets orakel', icon: '🏛️', title: 'Ordklassernas Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }, { mode: 'blandat', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'ordklassernas-tempel.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Ordklassmästare',
};

export const ORDKLASSERNAS_TEMPEL: AreaDef = {
  areaId: 'ordklassernas-tempel',
  gameId: 'ordklass',
  title: 'Ordklassernas tempel',
  kunskap: { name: 'Grammatik', icon: '🏛️', titles: ['Ordsorterare', 'Grammatikens väktare'] },
  texts: { cleared: 'Templets ljus tänds!', notYet: 'Nio rätt av tio behövs för att tända ljuset – försök igen!', back: 'Till templet' },
  story: 'Djupt inne i Ordskogen står ett gammalt tempel. Varje ordklass har sin egen sal: substantiven, verben, adjektiven och de små orden. Men Ordklassblandaren har rört ihop allt! Sortera orden, böj dem rätt och tänd templets ljus igen.',
  eras: [
    { id: 'forgarden', name: 'Förgården', icon: '🚪', fact: 'Ett substantiv är namnet på en sak, ett djur eller en person: en katt, ett hus. Ett verb är något man gör: hoppa, äta.',
      nodes: [
        stage('hitta-substantiv', 'Hitta substantivet', '🐈', 'Tryck på ett substantiv', 'subst', 0, 9000),
        stage('hitta-verb', 'Hitta verbet', '🏃', 'Tryck på ett verb', 'verb', 0, 9000),
        stage('sak-eller-gora', 'Sak eller göra?', '🤔', 'Substantiv eller verb?', 'vilken', 0, 9000),
      ] },
    { id: 'adjektivens-sal', name: 'Adjektivens sal', icon: '🎨', fact: 'Ett adjektiv beskriver hur något är: stor, röd, glad. Det får plats mellan en och ett substantiv: en glad hund.',
      nodes: [
        stage('hitta-adjektiv', 'Hitta adjektivet', '🌈', 'Tryck på ett adjektiv', 'adj', 0, 9000),
        stage('vilken-ordklass', 'Vilken ordklass?', '🗂️', 'Substantiv, verb eller adjektiv?', 'vilken', 1, 10000),
        BLANDAREN,
      ] },
    { id: 'substantivens-kammare', name: 'Substantivens kammare', icon: '📦', fact: 'Substantiv är en-ord eller ett-ord. De kan stå i plural (två katter) och i bestämd form (katten).',
      nodes: [
        stage('en-eller-ett', 'En eller ett?', '☝️', 'Välj rätt: en stor eller ett stort?', 'genus', 0, 8000),
        stage('flera', 'En katt, två …', '✌️', 'Hur blir det när det är flera?', 'plural', 0, 8000),
        stage('bestamd-form', 'Bestämd form', '👉', 'En katt → katten', 'bestamd', 1, 8000),
      ] },
    { id: 'tidens-trappa', name: 'Tidens trappa', icon: '⏳', fact: 'Verb visar när något händer: idag leker jag, igår lekte jag. Starka verb byter vokal i stället: gå – gick, sitta – satt.',
      nodes: [
        stage('igar-och-idag', 'Igår och idag', '📅', 'Nutid eller dåtid?', 'tempus', 0, 9000),
        stage('starka-verb', 'Starka verb', '💪', 'Verb som byter vokal', 'starka', 0, 9000),
        stage('har-gjort', 'Jag har …', '✅', 'Verbet efter har', 'tempus', 1, 9000),
        GASEN,
      ] },
    { id: 'jamforelsens-torn', name: 'Jämförelsens torn', icon: '🗼', fact: 'Man jämför med -are och -ast: snabb, snabbare, snabbast. Men en del ord är krångliga: stor, större, störst.',
      nodes: [
        stage('storre-an', 'Större än', '🐘', 'Jämför två saker', 'komparation', 0, 9000),
        stage('mest-av-alla', 'Mest av alla', '🏆', 'Jämför och hitta den största', 'komparation', 1, 9000),
        stage('han-eller-honom', 'Han eller honom?', '🙋', 'Pronomen i rätt form', 'pronomen', 0, 10000),
        stage('sma-orden', 'De små orden', '🔎', 'Hitta pronomen och prepositioner', 'smaord', 1, 10000),
      ] },
    { id: 'templets-hjarta', name: 'Templets hjärta', icon: '🔥', fact: 'Här samlas alla ordklasser. Den som kan sortera och böja dem alla får kalla sig Ordklassmästare.',
      nodes: [
        stage('tempelprovet', 'Tempelprovet', '📜', 'Allt från templet blandat', 'blandat', 1, 10000),
        stage('orakelprovet', 'Orakelprovet', '🔮', 'De klurigaste orden', 'blandat', 2, 10000),
        ORAKLET,
      ] },
  ],
};
