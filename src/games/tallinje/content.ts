import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';
import type { Mode } from './logic';

// Tallinjebron: en lång hängbro där varje planka är ett tal. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const VELPADDAN: BossDef = {
  type: 'boss', id: 'velpaddan', kind: 'monster', name: 'Velpaddan', icon: '🐢', title: 'Kan aldrig bestämma sig vid femman',
  hp: 8, trap: 'fem-regeln', pool: [{ mode: 'avrunda', level: 0 }, { mode: 'avrunda', level: 1 }],
  lines: {
    entrance: 'Fyrtiofem… är det fyrtio eller femtio? Hmm. Hmmmm. Jag har stått mitt på bron i hundra år och kan inte bestämma mig!',
    phase2: 'Nu blir det hundratal… ännu svårare att bestämma sig!',
    onHeroMiss: ['Hmm, nedåt kanske… eller?', 'Ingen vet! Inte ens jag.', 'Vel, vel, vel…'],
    onBossHit: ['Oj, du bestämde dig!', 'Femman uppåt… klart som korvspad!', 'Aj, mitt skal!'],
    defeat: 'Mitt emellan – då avrundar man uppåt! Äntligen kan jag gå vidare. Får jag kliva med dig hem? Långsamt, förstås.',
  },
  pet: { name: 'Lilla Velpaddan', icon: '🐢' }, titleReward: 'Avrundaren',
};

const ISBJORNEN: BossDef = {
  type: 'boss', id: 'isbjornen-minus', kind: 'monster', name: 'Isbjörnen Minus', icon: '🐻‍❄️', title: 'Tappar minustecknet i snön',
  hp: 8, trap: 'teckenfel', pool: [{ mode: 'negativa', level: 1 }, { mode: 'negativa', level: 2 }],
  lines: {
    entrance: 'Brrr! Tre grader kallt minus fem… det blir väl två? Jag har tappat alla minustecken i snön och hittar dem aldrig!',
    phase2: 'Snöstorm! Nu blir det RIKTIGT kallt!',
    onHeroMiss: ['Brrr, där försvann minustecknet!', 'Hehe, under noll eller över?', 'Snön tog det!'],
    onBossHit: ['Du hittade minustecknet!', 'Brrr… rätt igen.', 'Aj, en istapp!'],
    defeat: 'Under noll har talen ett minustecken – nu vet jag! Får jag bo i din frys? Jag är snäll, jag lovar.',
  },
  pet: { name: 'Lilla Isbjörnen', icon: '🐻‍❄️' }, titleReward: 'Frostvakten',
};

const LINDANSAREN: BossDef = {
  type: 'boss', id: 'lindansaren', kind: 'mastare', name: 'Lindansaren', icon: '🎪', title: 'Tallinjebrons Mästare',
  hp: 12, pool: [{ mode: 'las', level: 2 }, { mode: 'avrunda', level: 2 }, { mode: 'negativa', level: 2 }, { mode: 'decimal', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'tallinjebron.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Linjeloparen',
};

export const TALLINJEBRON: AreaDef = {
  areaId: 'tallinjebron',
  gameId: 'tallinje',
  title: 'Tallinjebron',
  kunskap: { name: 'Linjekraft', icon: '📏', titles: ['Linjegångare', 'Tallinjens lots'] },
  texts: { cleared: 'Plankorna sitter!', notYet: 'Bron behöver minst 9 plankor på rätt plats – försök igen!', back: 'Till bron' },
  story: 'Tallinjebron är en lång hängbro där varje planka har ett tal. En storm har blandat ihop plankorna! Hitta rätt plats för talen – nio rätt av tio spikar fast nästa spann.',
  eras: [
    { id: 'forsta-spannet', name: 'Första spannet', icon: '🪵', fact: 'På en tallinje blir talen större åt höger. Mellan två siffror kan det finnas många streck.',
      nodes: [
        stage('tal-till-20', 'Tal till 20', '🪵', 'Var pekar pilen?', 'las', 0, 7000),
        stage('tal-till-100', 'Tal till 100', '📏', 'Ental mellan tiotalen', 'las', 1, 8000),
        stage('avrunda-tiotal', 'Avrunda till tiotal', '🎯', 'Vilket tiotal är närmast?', 'avrunda', 0, 7000),
        VELPADDAN,
      ] },
    { id: 'tusenspannet', name: 'Tusenspannet', icon: '🌁', fact: 'Från 0 till 1000 är det långt! Där kan varje streck vara värt 50.',
      nodes: [
        stage('tal-till-1000', 'Tal till 1000', '🌁', 'Streck som är värda 50', 'las', 2, 9000),
        stage('avrunda-hundratal', 'Avrunda till hundratal', '💯', 'Vilket hundratal är närmast?', 'avrunda', 1, 8000),
      ] },
    { id: 'isspannet', name: 'Isspannet', icon: '❄️', fact: 'Under noll fortsätter tallinjen åt vänster: −1, −2, −3. Det är så termometern visar kyla.',
      nodes: [
        stage('under-noll', 'Under noll', '🧊', 'Negativa tal på tallinjen', 'negativa', 0, 7000),
        stage('termometern', 'Termometern', '🌡️', 'Varmare och kallare förbi noll', 'negativa', 1, 12000),
        stage('kalla-natter', 'Kalla nätter', '🌙', 'Större temperaturskillnader', 'negativa', 2, 12000),
        ISBJORNEN,
      ] },
    { id: 'tiondelsspannet', name: 'Tiondelsspannet', icon: '🔍', fact: 'Mellan 0 och 1 finns tiondelar: 0,1 0,2 0,3 … Tio tiondelar är en hel.',
      nodes: [
        stage('tiondelar', 'Tiondelar', '🔍', 'Decimaltal på tallinjen', 'las', 3, 9000),
        stage('avrunda-decimaltal', 'Avrunda decimaltal', '🎯', 'Till närmaste heltal', 'avrunda', 2, 8000),
        stage('decimal-plus', 'Decimalplus', '➕', 'Lägg ihop tiondelar', 'decimal', 0, 9000),
        stage('over-heltalet', 'Över heltalet', '🌉', 'Tiondelar som blir en hel', 'decimal', 1, 10000),
        stage('decimal-minus', 'Decimalminus', '➖', 'Minus med tiondelar', 'decimal', 2, 12000),
        stage('minus-i-minus', 'Räkna förbi noll', '🧮', 'Plus och minus med negativa tal', 'negativa', 3, 12000),
      ] },
    { id: 'brotornet', name: 'Brotornet', icon: '🎪', fact: 'Högst upp i brotornet balanserar Lindansaren på själva tallinjen.',
      nodes: [LINDANSAREN] },
  ],
};
