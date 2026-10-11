import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';
import type { Mode } from './logic';

// Tabellgruvan: gruvgångar djupt inne i Talbergen. Bana- och boss-id:n är permanenta (sparas i framstegen).

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const PLUSRATTAN: BossDef = {
  type: 'boss', id: 'plusrattan', kind: 'monster', name: 'Plusråttan', icon: '🐀', title: 'Gruvråttan som plussar allt',
  hp: 8, trap: 'plus', pool: [{ mode: 'ganger', level: 0 }, { mode: 'delat', level: 0 }],
  lines: {
    entrance: 'Pip pip! Tre gånger fyra? Det är sju! Tre plus fyra, tre gånger fyra – samma sak, eller hur? Pip!',
    phase2: 'Piiip! Nu plussar jag ännu snabbare!',
    onHeroMiss: ['Pip! Plus är ju så mycket lättare!', 'Hihi, du plussade!', 'Pip pip, en kristall till mig!'],
    onBossHit: ['Pip?! Det var ju gånger!', 'Aj, min svans!', 'Pip… du räknar grupper. Smart.'],
    defeat: 'Pip… gånger är många grupper, inte plus. Jag förstår nu! Får jag bo i din ficka? Jag är jättesmå.',
  },
  pet: { name: 'Lilla Plusråttan', icon: '🐀' }, titleReward: 'Gruppräknaren',
};

const NOLLFLADDERMUSEN: BossDef = {
  type: 'boss', id: 'nollfladdermusen', kind: 'monster', name: 'Nollfladdermusen', icon: '🦇', title: 'Tror att noll är allt och ingenting',
  hp: 8, trap: 'noll-ett', pool: [{ mode: 'ganger', level: 1 }, { mode: 'delat', level: 1 }],
  lines: {
    entrance: 'Fniss! Sju gånger noll är väl sju? Och sju gånger ett är… åtta? Här i mörkret blandar jag ihop allt!',
    phase2: 'Fniss fniss! Nu släcker jag lyktorna!',
    onHeroMiss: ['Fniss! Noll lurade dig!', 'Hihi, ett är ett busigt tal!', 'Fladder fladder!'],
    onBossHit: ['Iiik! Du kan reglerna!', 'Mina vingar! Rätt igen.', 'Fniss… noll är noll.'],
    defeat: 'Allt gånger noll är noll, och gånger ett ändrar ingenting. Nu vet jag! Får jag hänga upp och ner i ditt hus?',
  },
  pet: { name: 'Lilla Nollfladdermusen', icon: '🦇' }, titleReward: 'Nollkollaren',
};

const GANGERSPINDELN: BossDef = {
  type: 'boss', id: 'gangerspindeln', kind: 'monster', name: 'Gångerspindeln', icon: '🕷️', title: 'Spinner nät mellan grannarna i tabellen',
  hp: 8, trap: 'granntabell', pool: [{ mode: 'ganger', level: 2 }, { mode: 'saknas', level: 2 }],
  lines: {
    entrance: 'Sju gånger åtta… är det femtiofyra? Eller sextiotre? Mitt nät hänger mellan alla grannar i tabellen – du kommer att trassla in dig!',
    phase2: 'Nu spinner jag med alla åtta benen!',
    onHeroMiss: ['Fast i nätet! Det var grannen!', 'Hihi, ett steg för långt!', 'Mitt nät håller!'],
    onBossHit: ['Nätet går sönder!', 'Aj! Prick rätt tal.', 'Du hoppade över mitt nät!'],
    defeat: 'Du hittar rätt tal varje gång, inte grannen. Får jag följa med? Jag kan spinna ett mysigt nät i ditt fönster.',
  },
  pet: { name: 'Lilla Gångerspindeln', icon: '🕷️' }, titleReward: 'Spindeltämjaren',
};

const GRUVMASTAREN: BossDef = {
  type: 'boss', id: 'gruvmastaren', kind: 'mastare', name: 'Gruvmästaren', icon: '⛏️', title: 'Tabellgruvans Mästare',
  hp: 12, pool: [{ mode: 'ganger', level: 3 }, { mode: 'delat', level: 3 }, { mode: 'saknas', level: 3 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'tabellgruvan.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Tabellmästaren',
};

export const TABELLGRUVAN: AreaDef = {
  areaId: 'tabellgruvan',
  gameId: 'tabeller',
  title: 'Tabellgruvan',
  kunskap: { name: 'Tabellkraft', icon: '⛏️' },
  texts: { cleared: 'Kristallerna glittrar!', notYet: 'Gruvvagnen behöver minst 9 kristaller – försök igen!', back: 'Till gruvan' },
  story: 'Djupt inne i Talbergen ligger Tabellgruvan, full av glittrande tabellkristaller. Gräv dig nedåt gång för gång – nio rätt av tio lyser upp nästa gruvgång.',
  eras: [
    { id: 'gruvoppningen', name: 'Gruvöppningen', icon: '⛏️', fact: 'Gånger är snabb plus: 3 · 5 är samma som 5 + 5 + 5.',
      nodes: [
        stage('tvaan-femman-tian', 'Tvåan, femman, tian', '🔨', 'Gånger med 2, 5 och 10', 'ganger', 0, 5000),
        stage('dela-lika', 'Dela lika', '✂️', 'Delat med 2, 5 och 10', 'delat', 0, 6000),
        PLUSRATTAN,
      ] },
    { id: 'kristallgangen', name: 'Kristallgången', icon: '💎', fact: 'Fyrans tabell är dubbla tvåans: 4 · 6 är 2 · 6 och 2 · 6 till.',
      nodes: [
        stage('trean-och-fyran', 'Trean och fyran', '💎', 'Gånger med 3 och 4', 'ganger', 1, 6000),
        stage('dela-i-tre-och-fyra', 'Dela i tre och fyra', '🔷', 'Delat med 3 och 4', 'delat', 1, 7000),
        stage('gomda-kristaller', 'Gömda kristaller', '❓', 'Vilket tal fattas? 3 · ? = 12', 'saknas', 1, 8000),
        NOLLFLADDERMUSEN,
      ] },
    { id: 'djupa-schaktet', name: 'Djupa schaktet', icon: '🕯️', fact: 'Nians tabell har ett trick: siffrorna i svaret blir 9 tillsammans. 9 · 7 = 63, och 6 + 3 = 9!',
      nodes: [
        stage('de-svara-tabellerna', 'De svåra tabellerna', '🪨', 'Gånger med 6, 7, 8 och 9', 'ganger', 2, 7000),
        stage('dela-pa-djupet', 'Dela på djupet', '⚒️', 'Delat med 6, 7, 8 och 9', 'delat', 2, 8000),
        stage('djupa-gomstallen', 'Djupa gömställen', '🔦', 'Vilket tal fattas?', 'saknas', 2, 9000),
        GANGERSPINDELN,
      ] },
    { id: 'skattkammaren', name: 'Skattkammaren', icon: '👑', fact: 'Kan du 7 · 8 = 56 kan du också 8 · 7, 56 / 7 och 56 / 8 – fyra fakta på en gång!',
      nodes: [
        stage('hela-tabellen', 'Hela tabellen', '👑', 'Alla tabeller blandade', 'ganger', 3, 6000),
        stage('dela-allt', 'Dela allt', '💰', 'All division blandad', 'delat', 3, 7000),
        stage('gruvvagnsracet', 'Gruvvagnsracet', '🚃', 'Allt blandat – mot klockan!', 'blandat', 3, 5000),
      ] },
    { id: 'kristallhallen', name: 'Kristallhallen', icon: '💠', fact: 'Längst ner i gruvan, där kristallerna lyser starkast, väntar Gruvans Mästare.',
      nodes: [GRUVMASTAREN] },
  ],
};
