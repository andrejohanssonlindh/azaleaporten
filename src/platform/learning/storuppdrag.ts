import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, getProfile, heroKey, saveHeroState, type HeroState } from '../profiles';
import { addChest, type Chest } from '../rpg/inventory';
import { getArea } from '../rpg/progress';
import { giveCosmetic, cosmetic } from '../rpg/wardrobe';
import { KEYS } from '../rpg/balance';
import { rngFrom } from '../rng';
import { PLAYABLE } from '../../content/areas';
import { areaById, fitsGrade } from '../../content/world';
import { ARENDEN, arende, type Arende } from '../../content/arenden';
import { dayOf, solidCount } from './skills';
import { bestStreak, weekOf, type RunReport } from './quests';

// Uppdrag utöver dagens tre:
//  - Veckans utmaningar: tre större mål per vecka (måndag–söndag). Varje klar ger en veckokista,
//    alla tre en spelnyckel.
//  - Äventyrsuppdrag: kedjor som pågår tills de är klara (10 → 25 → 50 → 100 banor …). Bygger på saker
//    som aldrig minskar. Barnet hämtar belöningen själv; sista steget ger en titel och ett unikt plagg.
//  - Byns ärenden: en invånare i taget ber om hjälp i ett område (content/arenden.ts).
// Allt är belöningar och påverkar aldrig vad som räknas som rätt. Id:n (veckotyper, kedjor, ärenden) är permanenta.

/* ---------- veckans utmaningar ---------- */

export type WeekKind = 'banor' | 'perfekt' | 'dimma' | 'monster' | 'boss' | 'dagar' | 'ang';

export const WEEK_KINDS: Record<WeekKind, { goal: number; icon: string; label: (n: number) => string }> = {
  banor: { goal: 8, icon: '🗺️', label: (n) => `Klara ${n} banor (minst 9 rätt)` },
  perfekt: { goal: 3, icon: '⭐', label: (n) => `Få alla rätt i ${n} banor` },
  dimma: { goal: 3, icon: '🌫️', label: (n) => `Jaga bort Glömskans dimma ${n} gånger` },
  monster: { goal: 15, icon: '👾', label: (n) => `Besegra ${n} stigmonster` },
  boss: { goal: 2, icon: '🐲', label: (n) => `Besegra ${n} bossar` },
  dagar: { goal: 4, icon: '🔥', label: (n) => `Klara dagens uppdrag ${n} dagar` },
  ang: { goal: 4, icon: '🌼', label: (n) => `Öva ${n} gånger på Övningsängen` },
};

export interface WeekQuest { kind: WeekKind; goal: number; n: number; done: boolean }

/* ---------- äventyrsuppdrag (kedjor) ---------- */

export interface ChainReward { kastanjer?: number; nycklar?: number; chest?: number; title?: string; look?: string }

export interface Chain {
  id: string;
  name: string;
  icon: string;
  goals: number[];
  label: (n: number) => string;
  count: (hid: string, s: HeroState) => number;
}

/** Belöningen för steg i (0-baserat) i en kedja. Sista steget ger kedjans titel och plagg. */
export function chainReward(c: Chain, i: number): ChainReward {
  const last = i === c.goals.length - 1;
  if (last) return { chest: 3, title: CHAIN_FINALE[c.id]?.title, look: CHAIN_FINALE[c.id]?.look };
  return [{ kastanjer: 20 }, { kastanjer: 40, nycklar: 1 }, { chest: 2, nycklar: 1 }][Math.min(i, 2)];
}

const CHAIN_FINALE: Record<string, { title: string; look?: string }> = {
  banor: { title: 'Den stora äventyraren', look: 'hatt.lagerkrans' },
  stjarnor: { title: 'Stjärnornas vän', look: 'aura.stjarnregn' },
  tamj: { title: 'Monsterviskaren', look: 'mantel.tamjare' },
  mastare: { title: 'Mästarnas mästare' },
  sitter: { title: 'Kunskapsberget' },
  svit: { title: 'Den trogna hjälten' },
  spelon: { title: 'Spelöns legend' },
};

function clearedStages(hid: string): { stages: number; stars: number } {
  let stages = 0, stars = 0;
  for (const a of Object.keys(PLAYABLE)) {
    for (const sp of Object.values(getArea(hid, a).stages)) {
      if (sp.cleared) stages++;
      stars += sp.stars;
    }
  }
  return { stages, stars };
}

export const CHAINS: Chain[] = [
  { id: 'banor', name: 'Äventyraren', icon: '🗺️', goals: [10, 25, 50, 100], label: (n) => `Klara ${n} banor`, count: (hid) => clearedStages(hid).stages },
  { id: 'stjarnor', name: 'Stjärnsamlaren', icon: '⭐', goals: [20, 50, 100, 200], label: (n) => `Samla ${n} stjärnor`, count: (hid) => clearedStages(hid).stars },
  { id: 'tamj', name: 'Monstertämjaren', icon: '🐾', goals: [1, 3, 6, 10], label: (n) => `Tämj ${n} monsterboss${n === 1 ? '' : 'ar'}`, count: (_, s) => s.pets.length },
  { id: 'mastare', name: 'Mästarnas vän', icon: '🎓', goals: [1, 3, 6, 10], label: (n) => `Besegra ${n} Mästare`, count: (_, s) => s.mentors.length },
  { id: 'sitter', name: 'Kunskapsberget', icon: '🧠', goals: [5, 15, 30, 60], label: (n) => `Få ${n} saker att sitta som berget`, count: (hid) => solidCount(hid) },
  { id: 'svit', name: 'Trogen hjälte', icon: '🔥', goals: [3, 7, 14, 30], label: (n) => `Klara dagens uppdrag ${n} dagar i rad`, count: (hid) => bestStreak(hid) },
  { id: 'spelon', name: 'Skattjägaren', icon: '🎁', goals: [1, 5, 10, 25], label: (n) => `Hitta ${n} skattkist${n === 1 ? 'a' : 'or'} på Spelön`, count: (_, s) => s.skatter },
];

/* ---------- lagring ---------- */

export interface BigQuests {
  v: number;
  /** Måndagen för veckans utmaningar. */
  week: string;
  weekly: WeekQuest[];
  /** Spelnyckeln för alla tre är utdelad. */
  weekBonus: boolean;
  /** Antal hämtade steg per kedja. */
  chains: Record<string, number>;
  /** Pågående ärende (null = inget valt än) och hur långt det har kommit. */
  errand: { id: string | null; n: number };
  errandsDone: string[];
}

export const BIGQUESTS: RecordSpec<BigQuests> = {
  version: 1,
  defaults: () => ({ v: 1, week: '', weekly: [], weekBonus: false, chains: {}, errand: { id: null, n: 0 }, errandsDone: [] }),
};

const key = (hid: string) => heroKey(hid, 'storuppdrag');
const load = (hid: string) => loadRecord(key(hid), BIGQUESTS).value;
const save = (hid: string, r: BigQuests) => saveRecord(key(hid), BIGQUESTS, r);

function makeWeek(week: string): WeekQuest[] {
  let seed = 0;
  for (const ch of week) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const kinds = rngFrom(seed).shuffle(Object.keys(WEEK_KINDS) as WeekKind[]).slice(0, 3);
  return kinds.map((kind) => ({ kind, goal: WEEK_KINDS[kind].goal, n: 0, done: false }));
}

/** Uppdragen, med veckans utmaningar för den här veckan och ett ärende valt. */
export function getBigQuests(hid: string, day = dayOf()): BigQuests {
  let r = load(hid);
  const week = weekOf(day);
  let changed = false;
  if (r.week !== week) { r = { ...r, week, weekly: makeWeek(week), weekBonus: false }; changed = true; }
  if (!r.errand.id || !arende(r.errand.id)) {
    const next = nextArende(hid, r.errandsDone);
    if (next && next.id !== r.errand.id) { r = { ...r, errand: { id: next.id, n: 0 } }; changed = true; }
  }
  if (changed) save(hid, r);
  return r;
}

/** Nästa ärende: först de som passar hjältens årskurs, i ordning. */
function nextArende(hid: string, done: string[], skip?: string): Arende | null {
  const grade = getProfile(hid)?.grade ?? 0;
  const left = ARENDEN.filter((a) => !done.includes(a.id) && a.id !== skip && PLAYABLE[a.areaId]);
  const fit = left.filter((a) => { const w = areaById(a.areaId); return w && fitsGrade(w.area, grade); });
  return fit[0] ?? left[0] ?? null;
}

/* ---------- belöningar ---------- */

function give(hid: string, rw: ChainReward, source: string, kind: Chest['kind']): Chest | null {
  const s = getHeroState(hid);
  const titles = rw.title && !s.titles.includes(rw.title) ? [...s.titles, rw.title] : s.titles;
  saveHeroState(hid, {
    ...s,
    kastanjer: s.kastanjer + (rw.kastanjer ?? 0),
    nycklar: Math.min(KEYS.max, s.nycklar + (rw.nycklar ?? 0)),
    titles, title: rw.title && titles !== s.titles ? rw.title : s.title,
  });
  if (rw.look && cosmetic(rw.look)) giveCosmetic(hid, rw.look);
  if (rw.chest === undefined) return null;
  const lvl = getHeroState(hid).level;
  return addChest(hid, { ilvl: Math.min(13, 2 + Math.floor(lvl / 2)), minRarity: rw.chest as 0 | 1 | 2 | 3, kind, source });
}

/* ---------- framsteg ---------- */

export interface BigNews { weekly: WeekQuest[]; weekBonus: boolean; errandDone: Arende | null; chests: Chest[] }

export interface BigReport extends RunReport {
  /** Rätt av totalt i rundan. */
  correct?: number;
  total?: number;
  /** Stigmonster besegrade i rundan. */
  mobs?: number;
  /** Alla dagens uppdrag blev klara just nu. */
  dayDone?: boolean;
}

function weekStep(q: WeekQuest, r: BigReport): number {
  switch (q.kind) {
    case 'banor': return r.kind === 'stage' && r.cleared ? 1 : 0;
    case 'perfekt': return r.kind === 'stage' && r.total === 10 && r.correct === 10 ? 1 : 0;
    case 'dimma': return r.kind === 'review' ? 1 : 0;
    case 'monster': return r.mobs ?? 0;
    case 'boss': return r.won ? 1 : 0;
    case 'dagar': return r.dayDone ? 1 : 0;
    case 'ang': return r.kind === 'practice' || r.kind === 'review' || r.kind === 'veckans' ? 1 : 0;
  }
}

/** Räknar en avslutad runda mot veckans utmaningar och ärendet. Kistor sparas innan de visas. */
export function noteBig(hid: string, r: BigReport, day = dayOf()): BigNews {
  const st = getBigQuests(hid, day);
  const news: BigNews = { weekly: [], weekBonus: false, errandDone: null, chests: [] };
  const weekly = st.weekly.map((q) => {
    if (q.done) return q;
    const n = Math.min(q.goal, q.n + weekStep(q, r));
    const nq = { ...q, n, done: n >= q.goal };
    if (nq.done) {
      news.weekly.push(nq);
      const c = give(hid, { kastanjer: 15, chest: 1 }, 'Veckans utmaning', 'vecka');
      if (c) news.chests.push(c);
    }
    return nq;
  });
  let weekBonus = st.weekBonus;
  if (!weekBonus && weekly.length > 0 && weekly.every((q) => q.done)) {
    weekBonus = true;
    news.weekBonus = true;
    give(hid, { nycklar: 1 }, 'Veckans utmaningar', 'vecka');
  }
  let errand = st.errand, errandsDone = st.errandsDone;
  const a = arende(errand.id);
  if (a && r.areaId === a.areaId && ((r.kind === 'stage' && r.cleared) || r.won)) {
    const n = Math.min(a.n, errand.n + 1);
    errand = { ...errand, n };
    if (n >= a.n) {
      news.errandDone = a;
      const c = give(hid, { kastanjer: 25, chest: 1 }, a.who, 'uppdrag');
      if (c) news.chests.push(c);
      errandsDone = [...errandsDone, a.id];
      const next = nextArende(hid, errandsDone);
      errand = { id: next?.id ?? null, n: 0 };
    }
  }
  save(hid, { ...st, weekly, weekBonus, errand, errandsDone });
  return news;
}

/** Byter ärende (om barnet inte vill eller kan göra det här just nu). Det kommer tillbaka senare. */
export function skipArende(hid: string): Arende | null {
  const st = getBigQuests(hid);
  const next = nextArende(hid, st.errandsDone, st.errand.id ?? undefined);
  if (!next) return null;
  // Det överhoppade ärendet räknas inte som klart, så det kommer tillbaka senare.
  save(hid, { ...st, errand: { id: next.id, n: 0 } });
  return next;
}

/** Var en kedja står: hämtade steg, nästa mål och hur långt hjälten har kommit. */
export function chainState(hid: string, c: Chain, st = getBigQuests(hid)) {
  const claimed = st.chains[c.id] ?? 0;
  const count = c.count(hid, getHeroState(hid));
  const goal = c.goals[Math.min(claimed, c.goals.length - 1)];
  return { claimed, count, goal, done: claimed >= c.goals.length, ready: claimed < c.goals.length && count >= goal };
}

/** Hämtar belöningen för nästa steg i en kedja (om målet är nått). */
export function claimChain(hid: string, id: string): { reward: ChainReward; chest: Chest | null } | null {
  const c = CHAINS.find((x) => x.id === id);
  if (!c) return null;
  const st = getBigQuests(hid);
  const cs = chainState(hid, c, st);
  if (!cs.ready) return null;
  const reward = chainReward(c, cs.claimed);
  const chest = give(hid, reward, `Äventyrsuppdrag: ${c.name}`, 'uppdrag');
  save(hid, { ...getBigQuests(hid), chains: { ...st.chains, [c.id]: cs.claimed + 1 } });
  return { reward, chest };
}

/** Kedjor med en belöning att hämta (för en prick på Uppdragstavlan). */
export const chainsReady = (hid: string) => CHAINS.filter((c) => chainState(hid, c).ready).length;
