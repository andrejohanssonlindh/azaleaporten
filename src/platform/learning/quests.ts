import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, getProfile, heroKey } from '../profiles';
import { addChest, getInv, saveInv, type Chest } from '../rpg/inventory';
import { ARENA, giveTokens } from '../rpg/arena';
import { findNode, getArea, getPlay, nextOpenNode, type RunState } from '../rpg/progress';
import { PLAYABLE, regionProgress } from '../../content/areas';
import { areaById, fitsGrade } from '../../content/world';
import { getEvents } from './events';
import { addDays, dayOf, daysBetween, mistByArea } from './skills';
import { currentList, VECKANS_AREA } from './veckans';

// Uppdragstavlan: tre uppdrag per dag, gjorda för just den här hjälten.
//  1. jaga bort dimman någonstans (repetition)
//  2. öva på det som var svårt sist
//  3. ta nästa steg (ny bana, ny stjärna eller en boss)
// Har en vuxen skrivit in veckans ord kommer "öva på veckans ord" först, varje dag den veckan.
// Alla tre klara = dagens kista, två polletter och en dag till i sviten. En frysdag i veckan räddar sviten om en dag missas.

export type QuestKind = 'dimma' | 'ova' | 'framsteg' | 'klara' | 'ang' | 'veckans';

export interface Quest { kind: QuestKind; label: string; done: boolean; areaId?: string; nodeId?: string }

export interface QuestState {
  v: number;
  day: string;
  list: Quest[];
  /** Dagens kista är utdelad. */
  chest: boolean;
  streak: number;
  /** Senaste dagen alla uppdrag blev klara. */
  streakDay: string | null;
  /** Måndagen i veckan då frysdagen senast användes. */
  freezeWeek: string | null;
  best: number;
  /** Tidigare dagar: hur många uppdrag som blev klara (för Vuxenläge). Senaste sist, högst HISTORY_CAP. */
  history: { day: string; done: number; of: number }[];
}

export const QUESTS: RecordSpec<QuestState> = {
  version: 1,
  defaults: () => ({ v: 1, day: '', list: [], chest: false, streak: 0, streakDay: null, freezeWeek: null, best: 0, history: [] }),
};

const key = (hid: string) => heroKey(hid, 'quests');
const HISTORY_CAP = 60;

/** Uppdragen utan att skapa dagens (Vuxenläge ska bara titta, inte ändra). */
export const peekQuests = (hid: string) => loadRecord(key(hid), QUESTS).value;

/** Måndagen i dagens vecka. */
export function weekOf(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7));
}

function makeQuests(hid: string): Quest[] {
  const title = (a: string) => PLAYABLE[a]?.def.title ?? a;
  const out: Quest[] = [];

  if (currentList(hid)) out.push({ kind: 'veckans', areaId: VECKANS_AREA, label: 'Öva på veckans ord från skolan', done: false });

  const mist = Object.entries(mistByArea(hid)).filter(([a]) => PLAYABLE[a]).sort((a, b) => b[1] - a[1]);
  if (mist.length) out.push({ kind: 'dimma', areaId: mist[0][0], label: `Jaga bort dimman i ${title(mist[0][0])}`, done: false });

  const wrong = getEvents(hid).slice().reverse().find((e) => !e.c && PLAYABLE[e.a] && findNode(PLAYABLE[e.a].def, e.n));
  if (wrong) {
    const n = findNode(PLAYABLE[wrong.a].def, wrong.n)!;
    out.push({ kind: 'ova', areaId: wrong.a, nodeId: n.id, label: `Öva på ${n.name} i ${title(wrong.a)} – det var klurigt sist`, done: false });
  }

  const last = getPlay(hid).last?.areaId;
  const grade = getProfile(hid)?.grade ?? 0;
  const fits = Object.keys(PLAYABLE).filter((a) => { const w = areaById(a); return w && fitsGrade(w.area, grade); });
  const areas = [...(last && PLAYABLE[last] ? [last] : []), ...fits, ...Object.keys(PLAYABLE)];
  for (const a of areas.filter((x) => regionProgress(hid, PLAYABLE[x].def).open)) {
    const n = nextOpenNode(PLAYABLE[a].def, getArea(hid, a));
    if (n) { out.push({ kind: 'framsteg', areaId: a, nodeId: n.id, label: `Ta nästa steg: ${n.type === 'boss' ? `besegra ${n.name}` : `klara ${n.name}`} i ${title(a)}`, done: false }); break; }
  }

  out.push({ kind: 'klara', label: 'Klara en runda med minst 9 rätt', done: false });
  out.push({ kind: 'ang', label: 'Öva fem frågor på Övningsängen', done: false });
  return out.filter((q, i) => out.findIndex((x) => x.kind === q.kind) === i).slice(0, 3);
}

export function getQuests(hid: string, day = dayOf()): QuestState {
  const r = loadRecord(key(hid), QUESTS).value;
  if (r.day === day) return r;
  const history = r.day && r.list.length ? [...r.history, { day: r.day, done: r.list.filter((q) => q.done).length, of: r.list.length }].slice(-HISTORY_CAP) : r.history;
  const next = { ...r, day, list: makeQuests(hid), chest: false, history };
  saveRecord(key(hid), QUESTS, next);
  return next;
}

/**
 * Sviten som den ser ut idag (0 om den har brutits). Missade dagar räddas först av veckans frysdag,
 * sedan av sköldamuletter (amulets = hur många hjälten har).
 */
export function currentStreak(r: QuestState, day = dayOf(), amulets = 0): { n: number; freezeLeft: boolean; missed: number } {
  const freezeLeft = r.freezeWeek !== weekOf(day);
  if (!r.streakDay) return { n: 0, freezeLeft, missed: 0 };
  // Idag räknas inte som missad (den kan fortfarande klaras).
  const missed = Math.max(0, daysBetween(r.streakDay, day) - 1);
  const alive = missed <= (freezeLeft ? 1 : 0) + amulets;
  return { n: alive ? r.streak : 0, freezeLeft, missed };
}

const amuletsOf = (hid: string) => getInv(hid).potions.skold ?? 0;

/** Sviten utan att skapa dagens uppdrag (för topplisten på kartan). */
/** Längsta sviten någonsin (minskar aldrig). */
export const bestStreak = (hid: string) => loadRecord(key(hid), QUESTS).value.best;
export const streakOf = (hid: string) => currentStreak(loadRecord(key(hid), QUESTS).value, dayOf(), amuletsOf(hid)).n;

export interface RunReport { kind: RunState['kind']; areaId: string; nodeId: string; cleared: boolean; won: boolean; progressed: boolean }

function matches(q: Quest, r: RunReport): boolean {
  switch (q.kind) {
    case 'dimma': return r.kind === 'review' && r.areaId === q.areaId;
    case 'ova': return (r.kind === 'practice' || r.kind === 'stage') && r.areaId === q.areaId && r.nodeId === q.nodeId;
    case 'framsteg': return r.progressed;
    case 'klara': return (r.kind === 'stage' && r.cleared) || r.won;
    case 'ang': return r.kind === 'practice' || r.kind === 'review' || r.kind === 'veckans';
    case 'veckans': return r.kind === 'veckans';
  }
}

export interface QuestNews { done: Quest[]; allDone: boolean; chest: Chest | null; streak: number; usedFreeze: boolean; usedAmulets: number; tokens: number }

/** Bockar av uppdrag efter en avslutad runda. Kistan sparas innan den visas (som all loot). */
export function noteRun(hid: string, r: RunReport, day = dayOf()): QuestNews {
  const st = getQuests(hid, day);
  const done: Quest[] = [];
  const list = st.list.map((q) => {
    if (q.done || !matches(q, r)) return q;
    const d = { ...q, done: true };
    done.push(d);
    return d;
  });
  const news: QuestNews = { done, allDone: list.length > 0 && list.every((q) => q.done), chest: null, streak: currentStreak(st, day, amuletsOf(hid)).n, usedFreeze: false, usedAmulets: 0, tokens: 0 };
  let next: QuestState = { ...st, list };
  if (news.allDone && !st.chest) {
    const lvl = getHeroState(hid).level;
    news.chest = addChest(hid, { ilvl: Math.max(1, Math.min(10, Math.ceil(lvl / 2))), minRarity: 1, kind: 'dag', source: 'Dagens uppdrag' });
    news.tokens = giveTokens(hid, ARENA.dailyTokens);
    let { streak, freezeWeek } = st;
    if (!st.streakDay) streak = 1;
    else if (st.streakDay !== day) {
      let missed = Math.max(0, daysBetween(st.streakDay, day) - 1);
      const amulets = amuletsOf(hid);
      const canSave = missed <= (st.freezeWeek !== weekOf(day) ? 1 : 0) + amulets;
      if (!canSave) streak = 1;
      else {
        if (missed > 0 && st.freezeWeek !== weekOf(day)) { missed--; freezeWeek = weekOf(day); news.usedFreeze = true; }
        if (missed > 0) {
          const inv = getInv(hid);
          saveInv(hid, { ...inv, potions: { ...inv.potions, skold: amulets - missed } });
          news.usedAmulets = missed;
        }
        streak++;
      }
    }
    next = { ...next, chest: true, streak, streakDay: day, freezeWeek, best: Math.max(st.best, streak) };
    news.streak = streak;
  }
  saveRecord(key(hid), QUESTS, next);
  return news;
}
