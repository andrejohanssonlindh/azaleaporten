// ALLA justerbara siffror för belöningar och tempo. Medvetet snålt: barnen fick valuta för fort i v0.1.
// Ingen valuta per svar – belöningar kommer när en runda eller strid är klar.

export const RUN_LENGTH = 10;
export const CLEAR_MIN = 9;
export const PRACTICE_LENGTH = 5;

export const XP = {
  correct: 5,
  /** Bonus för att rätta sitt eget fel. */
  fix: 2,
  /** Ledtråd halverar XP för frågan. */
  hintFactor: 0.5,
  practiceCorrect: 3,
  /** Trollkarlens perk. */
  trollkarlBonus: 0.1,
};

export const REWARD = {
  firstClear: { xp: 30, kastanjer: 12 },
  /** Per ny stjärna utöver den första. */
  newStar: { kastanjer: 8 },
  replayClear: { xp: 8, kastanjer: 2 },
  failedRun: { kastanjer: 1 },
  practiceDone: { kastanjer: 2 },
  /** Att jaga bort Glömskans dimma ger extra kunskaps-XP. */
  reviewDone: { xp: 15, kastanjer: 3 },
  /** En runda med veckans ord (skolans stavningsord). */
  veckansDone: { xp: 15, kastanjer: 3 },
  bossFirstWin: { xp: 60, kastanjer: 30 },
  mastareFirstWin: { xp: 120, kastanjer: 60 },
  bossRewin: { xp: 12, kastanjer: 4 },
  bossLoss: { kastanjer: 1 },
};

export const BOSS = { hearts: 3, riddareHearts: 1, maxHearts: 6 };

export const HINTS_PER_DAY = 2;

/** Efter så här mycket aktiv tid per dag blir hjälten trött: inga fler kastanjer, men XP och lärande räknas. */
export const TIRED_AFTER_MS = 30 * 60_000;

/** XP som krävs från nivå l till l+1. */
export const needXP = (l: number) => 60 + 30 * l;

export const TITLES: [number, string][] = [[1, 'Lärling'], [3, 'Upptäckare'], [5, 'Äventyrare'], [8, 'Hjälte'], [12, 'Mästarhjälte'], [16, 'Legend']];
export const levelTitle = (l: number) => TITLES.filter(([n]) => l >= n).pop()![1];

/**
 * Behärskning: när en färdighet för första gången når en högre låda i repetitionsschemat
 * (alltså sitter kvar dag efter dag) får områdets kunskap XP. Lådorna går bara upp en gång per dag,
 * så det här kan bara växa av riktigt lärande över tid. Utrustning och klass påverkar det aldrig.
 * xp[b] = XP för att nå låda b första gången.
 */
export const MASTERY = { xp: [0, 0, 10, 15, 25, 40] };

/** Kunskapsnivåer som ger områdets titlar (AreaDef.kunskap.titles). */
export const KUNSKAP_TITLE_LEVELS = [5, 10];

/** Kunskapsnivå (per område) ur områdets XP. */
export function kunskapLevel(xp: number): { level: number; into: number; need: number } {
  let level = 0, left = xp;
  const need = (l: number) => 40 + 20 * l;
  while (left >= need(level)) { left -= need(level); level++; }
  return { level, into: left, need: need(level) };
}

/** Skattkistor. Chanserna gäller per avslutad runda/strid; trött hjälte hittar inga kistor. */
export const LOOT = {
  capacity: 30,
  maxCapacity: 60,
  /** Garanterad kista efter så här många avslutade rundor utan kista. */
  pityRuns: 3,
  replayClearChance: 0.35,
  failedRunChance: 0.1,
  practiceChance: 0.2,
};

/**
 * Husdjur: ett tämjt monster börjar som ovanligt (grönt). Besegrar man bossen igen (en gång per dag räknas)
 * kan det växa ett steg i sällsynthet: chansen per nuvarande sällsynthet (1 → 2, 2 → 3, 3 → 4).
 */
export const PETS = { rarity: 1 as const, ilvl: 5, grow: [0, 0.5, 0.3, 0.15, 0] };

export const BOSS_HP_SCALE = 10;
/** Minsta antal rätta svar för att vinna, oavsett utrustning (lärandets integritet). */
export const minHits = (kind: 'monster' | 'mastare', hp: number) => (kind === 'mastare' ? Math.max(10, hp - 2) : Math.ceil(hp * 0.75));
/** Snabbt svar i bossstrid (ms) ger extra skada med Snabbhet. */
export const FAST_MS = 6000;

/** Stigmonster i vanliga banor: rätta svar slår till det, utrustningen avgör hur hårt.
 *  Rundan är alltid 10 frågor och stjärnorna räknas som vanligt; monstret ger bara azaleablad. */
export const MOB = { hp: 50, blad: 1 };

/** Spelnycklar: hittas ibland när en vanlig bana eller bossstrid är klar (aldrig när hjälten är trött).
 *  En nyckel startar en skattrunda i ett minispel, där upp till chestsPerRun skattkistor dyker upp. */
export const KEYS = { stageChance: 0.08, bossChance: 0.3, max: 5, chestsPerRun: 3 };
