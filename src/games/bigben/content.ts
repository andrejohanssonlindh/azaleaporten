import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Big Ben-tornet: Västeröns klocktorn, där klockan bara slår på engelska. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const HALF_PAST_SPOKET: BossDef = {
  type: 'boss', id: 'half-past-spoket', kind: 'monster', name: 'Half-past-spöket', icon: '👻', title: 'Säger halv på fel håll',
  hp: 8, trap: 'half-past', pool: [{ mode: 'klocka', level: 0 }, { mode: 'ord', level: 0 }],
  lines: {
    entrance: 'Buuu! Klockan är halv tre – alltså half past three! Eller? Buuuhuhu! Jag är Half-past-spöket och jag spökar i alla halvtimmar.',
    phase2: 'Nu spökar jag i kvartarna också! Buuu!',
    onHeroMiss: ['Buuu! En timme fel!', 'Hihi, half past på svenska!', 'Spökat och klart!'],
    onBossHit: ['Buu?! Du räknade rätt!', 'Aj, rätt timme!', 'Spöket bleknar…'],
    defeat: 'Buu… du vet att half past räknar bakåt! Får jag följa med dig? Jag lovar att bara spöka på rätt timme.',
  },
  pet: { name: 'Lilla Half-past-spöket', icon: '👻' }, titleReward: 'Spökjägaren',
};

const KVARTSKATTEN: BossDef = {
  type: 'boss', id: 'kvartskatten', kind: 'monster', name: 'Kvartskatten', icon: '🐈', title: 'Vänder på past och to',
  hp: 8, trap: 'past-to', pool: [{ mode: 'klocka', level: 3 }, { mode: 'ord', level: 3 }],
  lines: {
    entrance: 'Mjaaau. Past, to, to, past – vem bryr sig? Jag är Kvartskatten och jag knuffar visarna åt fel håll. Mjau!',
    phase2: 'Nu knuffar jag minutvisaren hela vägen runt! Mjaaau!',
    onHeroMiss: ['Mjau! Tvärtom!', 'Purr… fel håll!', 'Hihi, över eller i?'],
    onBossHit: ['Fräs! Rätt håll!', 'Mjau?! Du såg det!', 'Svansen i kläm!'],
    defeat: 'Mjau… du vet skillnad på past och to. Får jag spinna i ditt knä? Jag lovar att låta visarna vara.',
  },
  pet: { name: 'Lilla Kvartskatten', icon: '🐈' }, titleReward: 'Kattväktaren',
};

const TORNVAKTAREN: BossDef = {
  type: 'boss', id: 'tornvaktaren', kind: 'mastare', name: 'Tornväktaren', icon: '🕰️', title: 'Big Ben-tornets Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 3 }, { mode: 'blandat', level: 4 }, { mode: 'blandat', level: 5 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'big-ben-tornet.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Big Ben-mästare',
};

export const BIG_BEN_TORNET: AreaDef = {
  areaId: 'big-ben-tornet',
  gameId: 'bigben',
  title: 'Big Ben-tornet',
  kunskap: { name: 'Engelsk tid', icon: '🕰️', titles: ['Tick-tock-lärling', 'Klockornas herre'] },
  texts: { cleared: 'Ding-dong! Klockan slår för dig!', notYet: 'Nio rätt av tio behövs för att klockan ska slå – försök igen!', back: 'Till tornet' },
  story: 'Mitt på Västerön står ett högt klocktorn, precis som Big Ben i London. Här slår klockan bara på engelska: o\'clock, half past, quarter to. Men akta dig – i trapporna spökar det, och svenska "halv" betyder inte alls samma sak som "half past"!',
  eras: [
    { id: 'tornets-fot', name: 'Tornets fot', icon: '🚪', fact: '"o\'clock" betyder prick: "three o\'clock" är klockan tre. "half past three" är 3:30 – på svenska halv fyra!',
      nodes: [
        stage('oclock', "O'clock och half past", '🕒', 'Vad är klockan på engelska?', 'klocka', 0, 9000),
        stage('las-tiden', 'Läs tiden', '📖', 'Engelska → digital klocka', 'ord', 0, 9000),
        stage('lyssna-pa-big-ben', 'Lyssna på Big Ben', '🔔', 'Hör tiden och välj', 'hor', 0, 9000),
      ] },
    { id: 'trapporna', name: 'Trapporna', icon: '🪜', fact: '"quarter past" är kvart över och "quarter to" är kvart i. Engelsmännen säger "a quarter" – en fjärdedel av en timme.',
      nodes: [
        stage('kvartar', 'Kvart över och kvart i', '🕞', 'Quarter past, quarter to', 'klocka', 1, 9000),
        stage('fran-digital', 'Från digital till engelska', '📟', '3:45 – hur säger man det?', 'digital', 1, 9000),
        HALF_PAST_SPOKET,
      ] },
    { id: 'urverket', name: 'Urverket', icon: '⚙️', fact: '"past" betyder över och "to" betyder i. "twenty past four" är tjugo över fyra, "twenty to four" är tjugo i fyra.',
      nodes: [
        stage('fem-over', 'Fem över, tio över', '🕔', 'Five past … twenty-five past', 'klocka', 2, 10000),
        stage('fem-i', 'Fem i, tio i', '🕗', 'Twenty to, ten to, five to', 'klocka', 3, 10000),
        stage('past-eller-to', 'Past eller to?', '🔀', 'Engelska → digital klocka', 'ord', 3, 10000),
        KVARTSKATTEN,
      ] },
    { id: 'klockrummet', name: 'Klockrummet', icon: '🔔', fact: 'Mellan femminutarna säger man "minutes": "seven minutes past three". Vid femminutarna räcker "five past".',
      nodes: [
        stage('lyssna-pa-tiden', 'Lyssna på tiden', '👂', 'Hör och välj', 'hor', 3, 10000),
        stage('varenda-minut', 'Varenda minut', '⏱️', '3:07 – hur säger man det?', 'digital', 4, 12000),
        stage('minuter-pa-klockan', 'Minuter på klockan', '🕰️', 'Seven minutes past …', 'klocka', 4, 12000),
      ] },
    { id: 'tornets-topp', name: 'Tornets topp', icon: '🌙', fact: 'På engelska används sällan 24-timmarsklockan. I stället säger man a.m. (förmiddag) och p.m. (eftermiddag och kväll).',
      nodes: [
        stage('am-pm', 'a.m. och p.m.', '🌗', '19:00 – seven p.m.', 'ampm', 5, 10000),
        stage('hela-tornet', 'Hela tornet', '🏰', 'Allt blandat', 'blandat', 4, 11000),
        TORNVAKTAREN,
      ] },
  ],
};
