import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Stavningsträsket: en dimmig mosse i Ordskogen. Bana- och boss-id:n är permanenta (sparas i framstegen).
// Nivå 0 = välj rätt stavning, 1 = lyssna och skriv, 2 = skriv svårare ord, 3 = hitta felet.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const valj = (id: string, name: string, icon: string, mode: string, desc = 'Välj rätt stavning') => stage(id, name, icon, desc, mode, 0, 7000);
const skriv = (id: string, name: string, icon: string, mode: string, desc = 'Lyssna och skriv') => stage(id, name, icon, desc, mode, 1, 12000);

const GRODAN: BossDef = {
  type: 'boss', id: 'grodan-enkelhopp', kind: 'monster', name: 'Grodan Enkelhopp', icon: '🐸', title: 'Hoppar alltid bara en gång',
  hp: 8, trap: 'enkel-konsonant', pool: [{ mode: 'vokal', level: 0 }, { mode: 'vokal', level: 1 }, { mode: 'mck', level: 0 }],
  lines: {
    entrance: 'Kväk! Varför hoppa två gånger när man kan hopa en? Jag stavar alla ord med bara en konsonant. Det går mycket fortare!',
    phase2: 'Kväk kväk! Nu hoppar jag över ALLA dubbla bokstäver!',
    onHeroMiss: ['Kväk! En konsonant räcker väl?', 'Plask! Där sjönk en bokstav.', 'Hihi, enkelhopp!'],
    onBossHit: ['Kväk! Du hörde den korta vokalen!', 'Aj! Dubbelhopp!', 'Hm… två konsonanter. Rätt igen.'],
    defeat: 'Okej, okej! Ibland måste man hoppa två gånger. Får jag följa med dig? Jag lovar att öva på dubbelhopp.',
  },
  pet: { name: 'Lilla Grodan Enkelhopp', icon: '🐸' }, titleReward: 'Dubbelhopparen',
};

const SJSPOKET: BossDef = {
  type: 'boss', id: 'sj-spoket', kind: 'monster', name: 'Sj-spöket', icon: '👻', title: 'Spöket med hundra stavningar',
  hp: 8, trap: 'sj-ljud', pool: [{ mode: 'sj', level: 0 }, { mode: 'sjtj', level: 1 }],
  lines: {
    entrance: 'Sjhhhh… Jag är Sj-spöket! Mitt ljud kan stavas på så många sätt att du aldrig vet var jag gömmer mig. Sk? Stj? Skj? Hihihi!',
    phase2: 'Sjhhh! Nu gömmer jag mig i ännu klurigare ord!',
    onHeroMiss: ['Sjhhh! Där gömde jag mig!', 'Bu! Fel stavning!', 'Hihihi, fel spökväg!'],
    onBossHit: ['Åh nej, du hittade mig!', 'Sjhh… rätt stavat.', 'Du ser rakt igenom mig!'],
    defeat: 'Du kan alla mina gömställen! Får jag spöka hemma hos dig i stället? Jag är jättesnäll, egentligen.',
  },
  pet: { name: 'Lilla Sj-spöket', icon: '👻' }, titleReward: 'Spökjägaren',
};

const TROLLET: BossDef = {
  type: 'boss', id: 'sarskrivnings-trollet', kind: 'monster', name: 'Särskrivnings Trollet', icon: '✂️', title: 'Klipper isär alla ord',
  hp: 8, trap: 'sarskrivning', pool: [{ mode: 'sammansatt', level: 0 }, { mode: 'sammansatt', level: 1 }],
  lines: {
    entrance: 'Hå hå! Jag har en sax, och jag klipper isär alla ord jag ser. Glass bil! Snö gubbe! Sjuk sköterska! Visst låter det bättre så?',
    phase2: 'Snipp snapp! Nu klipper jag ännu längre ord!',
    onHeroMiss: ['Snipp snapp, isär!', 'Hå hå, två ord är bättre än ett!', 'Klipp!'],
    onBossHit: ['Va?! Du limmade ihop det igen!', 'Min sax blev slö…', 'Hmpf. Ett ord. Rätt.'],
    defeat: 'Okej… ord som hör ihop ska sitta ihop. Jag lägger undan saxen. Får jag bo hos dig? Jag kan klippa gräset i stället!',
  },
  pet: { name: 'Lilla Särskrivningstrollet', icon: '🧌' }, titleReward: 'Ordlimmaren',
};

const STAVMASTAREN: BossDef = {
  type: 'boss', id: 'stavmastaren', kind: 'mastare', name: 'Stavmästaren', icon: '🪶', title: 'Stavningsträskets Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 1 }, { mode: 'blandat', level: 2 }, { mode: 'blandat', level: 3 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'stavningstrasket.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Stavmästare',
};

export const STAVNINGSTRASKET: AreaDef = {
  areaId: 'stavningstrasket',
  gameId: 'stavning',
  title: 'Stavningsträsket',
  kunskap: { name: 'Bokstavsmagi', icon: '🔤', titles: ['Ordsnickare', 'Stavningsstjärna'] },
  texts: { cleared: 'Du hittade stenarna över träsket!', notYet: 'Nio rätt av tio behövs för att kliva torrskodd – försök igen!', back: 'Till träsket' },
  story: 'Stavningsträsket är en dimmig mosse där orden flyter omkring som näckrosblad. Stavar du rätt hittar du stenarna att kliva på – stavar du fel blir det plask! Hoppa från sten till sten hela vägen in till Träskets hjärta.',
  eras: [
    { id: 'strandkanten', name: 'Strandkanten', icon: '🪵', fact: 'Småord som "och", "jag" och "det" säger vi slarvigt – men de skrivs alltid likadant.',
      nodes: [
        valj('smaord', 'Småorden', '💬', 'smaord'),
        skriv('smaord-skriv', 'Skriv småorden', '✏️', 'smaord'),
      ] },
    { id: 'vassen', name: 'Vassen', icon: '🌾', fact: 'Lyssna på vokalen! Är den kort blir det oftast två konsonanter efter: katt, hoppa. Är den lång räcker det med en: sol, glas.',
      nodes: [
        valj('kort-eller-lang', 'Kort eller lång?', '🎵', 'vokal'),
        skriv('dubbla-hopp', 'Dubbla hopp', '🐸', 'vokal'),
        valj('m-och-ck', 'M-regeln och ck', '🔤', 'mck', 'm eller mm? k eller ck?'),
        skriv('m-och-ck-skriv', 'Skriv m och ck', '✏️', 'mck'),
        GRODAN,
      ] },
    { id: 'nackrosdammen', name: 'Näckrosdammen', icon: '🪷', fact: 'ng-ljudet kan skrivas ng (lång), n före k (bank) och g före n (regn). j-ljudet har sex stavningar: j, g, gj, hj, dj och lj!',
      nodes: [
        valj('ng-ljudet', 'ng-ljudet', '🔔', 'ng'),
        valj('j-ljudet', 'j-ljudet', '🦒', 'j'),
        skriv('ng-skriv', 'Skriv ng-ljudet', '✏️', 'ng'),
        skriv('j-skriv', 'Skriv j-ljudet', '✏️', 'j'),
      ] },
    { id: 'dimmossen', name: 'Dimmossen', icon: '🌫️', fact: 'sj-ljudet är svenskans klurigaste ljud – det kan stavas på massor av sätt: sj, sk, skj, stj, ch, -tion… tj-ljudet är snällare: tj, k eller kj.',
      nodes: [
        valj('sj-ljudet', 'sj-ljudet', '👻', 'sj'),
        valj('tj-ljudet', 'tj-ljudet', '🚂', 'tj'),
        skriv('sj-tj-skriv', 'Skriv sj och tj', '✏️', 'sjtj'),
        valj('o-som-later-a', 'O som låter å', '🫧', 'oa'),
        SJSPOKET,
      ] },
    { id: 'namnholmen', name: 'Namnholmen', icon: '🏝️', fact: 'Namn på personer och platser har stor bokstav. Veckodagar, månader och språk har liten bokstav på svenska!',
      nodes: [
        valj('stor-eller-liten', 'Stor eller liten?', '🔠', 'stor', 'Stor eller liten bokstav?'),
        valj('ihop-eller-isar', 'Ihop eller isär?', '🔗', 'sammansatt', 'Ett ord eller två?'),
        stage('skriv-ihop', 'Skriv ihop', '✏️', 'Lyssna och skriv', 'sammansatt', 1, 14000),
        TROLLET,
      ] },
    { id: 'trasketshjarta', name: 'Träskets hjärta', icon: '💚', fact: 'Här inne blandas alla stavningsregler. Den som klarar sig hela vägen får kalla sig Stavmästare.',
      nodes: [
        stage('svara-ord', 'Svåra ord', '📜', 'Lyssna och skriv svåra ord', 'blandat', 2, 14000),
        stage('hitta-felet', 'Hitta felet', '🔍', 'Leta upp det felstavade ordet', 'blandat', 3, 12000),
        STAVMASTAREN,
      ] },
  ],
};
