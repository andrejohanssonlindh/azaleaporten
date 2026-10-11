import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Rimbäcken: en porlande bäck i Ordskogen där orden leker. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const TVARTOMTROLLET: BossDef = {
  type: 'boss', id: 'tvartomtrollet', kind: 'monster', name: 'Tvärtomtrollet', icon: '🙃', title: 'Säger alltid tvärtom',
  hp: 8, trap: 'tvartom', pool: [{ mode: 'tvartom', level: 0 }, { mode: 'tvartom', level: 1 }],
  lines: {
    entrance: 'Adjö! Jag menar hej! Jag är Tvärtomtrollet, och jag är jätteledsen över att träffa dig. Varm betyder samma som kall, eller hur?',
    phase2: 'Nu blir det lätt! Alltså svårt! Alltså… tvärtom!',
    onHeroMiss: ['Hihi, tvärtom!', 'Rätt! Jag menar fel!', 'Upp är ner, ner är upp!'],
    onBossHit: ['Aj! Alltså… skönt!', 'Du såg igenom mig!', 'Hmpf. Det där var rätt. Inte fel.'],
    defeat: 'Du vann – jag förlorade. Det är faktiskt inte tvärtom den här gången. Får jag följa med dig? Jag lovar att säga som det är. Ibland.',
  },
  pet: { name: 'Lilla Tvärtomtrollet', icon: '🙃' }, titleReward: 'Tvärtomtämjaren',
};

const BENGT: BossDef = {
  type: 'boss', id: 'bokstavliga-bengt', kind: 'monster', name: 'Bokstavliga Bengt', icon: '🤖', title: 'Tar allt precis som det står',
  hp: 8, trap: 'bokstavligt', pool: [{ mode: 'uttryck', level: 0 }, { mode: 'uttryck', level: 1 }],
  lines: {
    entrance: 'GOD DAG. JAG ÄR BOKSTAVLIGA BENGT. Någon sa att jag har is i magen. Jag har kollat. Där finns ingen is. FEL I SYSTEMET.',
    phase2: 'VARNING: DET REGNAR SMÅSPIK. HÄMTA ETT PARAPLY AV STÅL.',
    onHeroMiss: ['BEKRÄFTAT: BOKSTAVLIGT.', 'PIP! Precis som det står!', 'LOGISKT. HELT LOGISKT.'],
    onBossHit: ['…BERÄKNAR… Det var inte bokstavligt?', 'FEL I SYSTEMET!', 'Bzzt! Uttryck förstått.'],
    defeat: 'JAG HAR… förstått. Ord kan betyda mer än det står. Får jag följa med dig och lära mig fler uttryck? Jag lovar att inte leta efter is i någons mage.',
  },
  pet: { name: 'Lilla Bengt', icon: '🤖' }, titleReward: 'Uttrycksknäckaren',
};

const RIMMASTAREN: BossDef = {
  type: 'boss', id: 'rimmastaren', kind: 'mastare', name: 'Rimmästaren', icon: '🎻', title: 'Rimbäckens Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }, { mode: 'blandat', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'rimbacken.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Rimmästare',
};

export const RIMBACKEN: AreaDef = {
  areaId: 'rimbacken',
  gameId: 'rim',
  title: 'Rimbäcken',
  kunskap: { name: 'Ordförråd', icon: '🎶', titles: ['Rimsmed', 'Ordskattjägare'] },
  texts: { cleared: 'Bäcken porlar av glädje!', notYet: 'Nio rätt av tio behövs för att bäcken ska sjunga – försök igen!', back: 'Till bäcken' },
  story: 'Rimbäcken porlar genom Ordskogen och sjunger på sina ord. Den som lyssnar noga hör rim, ord som betyder tvärtom och ord som betyder nästan samma sak. Följ bäcken från källan hela vägen ut till mynningen!',
  eras: [
    { id: 'kallan', name: 'Källan', icon: '💧', fact: 'Ord som rimmar slutar likadant: sol – stol, katt – hatt. Det är början som är olika.',
      nodes: [
        stage('vad-rimmar', 'Vad rimmar?', '🎵', 'Hitta ordet som rimmar', 'rim', 0, 7000),
        stage('rimverser', 'Fyll i rimmet', '📜', 'Ordet som fattas ska rimma', 'rim', 1, 10000),
      ] },
    { id: 'tvartomforsen', name: 'Tvärtomforsen', icon: '🌊', fact: 'En motsats betyder tvärtom: varm – kall. En synonym betyder nästan samma sak: glad – lycklig.',
      nodes: [
        stage('motsatser', 'Motsatser', '↔️', 'Hitta ordet som betyder tvärtom', 'motsats', 0, 7000),
        stage('synonymer', 'Synonymer', '🟰', 'Hitta ordet som betyder nästan samma sak', 'synonym', 0, 7000),
        stage('samma-eller-tvartom', 'Samma eller tvärtom?', '🔄', 'Motsatser och synonymer om vartannat', 'tvartom', 1, 8000),
        TVARTOMTROLLET,
      ] },
    { id: 'ordbron', name: 'Ordbron', icon: '🌉', fact: 'Två ord kan bli ett nytt ord. Den sista delen berättar vad det är: en fotboll är en boll, en snögubbe är en gubbe.',
      nodes: [
        stage('sammansatta-ord', 'Sammansatta ord', '🧩', 'Vad betyder ordet?', 'sammansatt', 0, 9000),
        stage('satt-ihop', 'Sätt ihop', '🔗', 'Vilket ord betyder så här?', 'sammansatt', 1, 9000),
      ] },
    { id: 'ekodalen', name: 'Ekodalen', icon: '🏞️', fact: 'Samma ord kan betyda olika saker – en fil kan vara mjölk, en del av vägen eller ett verktyg. Och ett uttryck betyder ofta något helt annat än orden säger!',
      nodes: [
        stage('flera-betydelser', 'Flera betydelser', '🎭', 'Vad betyder ordet just här?', 'betydelse', 0, 10000),
        stage('uttryck', 'Uttryck', '💭', 'Vad betyder uttrycket?', 'uttryck', 0, 10000),
        stage('kluriga-uttryck', 'Kluriga uttryck', '🌀', 'Fler uttryck', 'uttryck', 1, 10000),
        BENGT,
      ] },
    { id: 'mynningen', name: 'Mynningen', icon: '🌅', fact: 'Här rinner alla orden ihop. Den som klarar sig hela vägen får kalla sig Rimmästare.',
      nodes: [
        stage('ordstrommen', 'Ordströmmen', '🎶', 'Allt från bäcken blandat', 'blandat', 1, 10000),
        stage('djupa-vattnet', 'Djupa vattnet', '🐟', 'De klurigaste orden', 'blandat', 2, 10000),
        RIMMASTAREN,
      ] },
  ],
};
