import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, getProfile, heroKey } from '../profiles';
import { addChest, type Chest } from '../rpg/inventory';
import { findNode, getArea, getPlay, nextOpenNode, type RunState } from '../rpg/progress';
import { PLAYABLE } from '../../content/areas';
import { areaById, fitsGrade } from '../../content/world';
import { getEvents } from './events';
import { addDays, dayOf, daysBetween, mistByArea } from './skills';

// Uppdragstavlan: tre uppdrag per dag, gjorda för just den här hjälten.
//  1. jaga bort dimman någonstans (repetition)
//  2. öva på det som var svårt sist
//  3. ta nästa steg (ny bana, ny stjärna eller en boss)
// Alla tre klara = dagens kista och en dag till i sviten. En frysdag i veckan räddar sviten om en dag missas.

export type QuestKind = 'dimma' | 'ova' | 'framsteg' | 'klara' | 'ang';

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
}

export const QUESTS: RecordSpec<QuestState> = {
  version: 1,
  defaults: () => ({ v: 1, day: '', list: [], chest: false, streak: 0, streakDay: null, freezeWeek: null, best: 0 }),
};

const key = (hid: string) => heroKey(hid, 'quests');

/** Måndagen i dagens vecka. */
export function weekOf(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7));
}

function makeQuests(hid: string): Quest[] {
  const title = (a: string) => PLAYABLE[a]?.def.title ?? a;
  const out: Quest[] = [];

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
  for (const a of areas) {
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
  const next = { ...r, day, list: makeQuests(hid), chest: false };
  saveRecord(key(hid), QUESTS, next);
  return next;
}

/** Sviten som den ser ut idag (0 om den har brutits). */
export function currentStreak(r: QuestState, day = dayOf()): { n: number; freezeLeft: boolean } {
  const freezeLeft = r.freezeWeek !== weekOf(day);
  if (!r.streakDay) return { n: 0, freezeLeft };
  const gap = daysBetween(r.streakDay, day);
  const alive = gap <= 1 || (gap === 2 && freezeLeft);
  return { n: alive ? r.streak : 0, freezeLeft };
}

/** Sviten utan att skapa dagens uppdrag (för topplisten på kartan). */
export const streakOf = (hid: string) => currentStreak(loadRecord(key(hid), QUESTS).value).n;

export interface RunReport { kind: RunState['kind']; areaId: string; nodeId: string; cleared: boolean; won: boolean; progressed: boolean }

function matches(q: Quest, r: RunReport): boolean {
  switch (q.kind) {
    case 'dimma': return r.kind === 'review' && r.areaId === q.areaId;
    case 'ova': return (r.kind === 'practice' || r.kind === 'stage') && r.areaId === q.areaId && r.nodeId === q.nodeId;
    case 'framsteg': return r.progressed;
    case 'klara': return (r.kind === 'stage' && r.cleared) || r.won;
    case 'ang': return r.kind === 'practice' || r.kind === 'review';
  }
}

export interface QuestNews { done: Quest[]; allDone: boolean; chest: Chest | null; streak: number; usedFreeze: boolean }

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
  const news: QuestNews = { done, allDone: list.length > 0 && list.every((q) => q.done), chest: null, streak: currentStreak(st, day).n, usedFreeze: false };
  let next: QuestState = { ...st, list };
  if (news.allDone && !st.chest) {
    const lvl = getHeroState(hid).level;
    news.chest = addChest(hid, { ilvl: Math.max(1, Math.min(10, Math.ceil(lvl / 2))), minRarity: 1, kind: 'dag', source: 'Dagens uppdrag' });
    const gap = st.streakDay ? daysBetween(st.streakDay, day) : Infinity;
    let { streak, freezeWeek } = st;
    if (gap === 1) streak++;
    else if (gap === 2 && st.freezeWeek !== weekOf(day)) { streak++; freezeWeek = weekOf(day); news.usedFreeze = true; }
    else if (gap !== 0) streak = 1;
    next = { ...next, chest: true, streak, streakDay: day, freezeWeek, best: Math.max(st.best, streak) };
    news.streak = streak;
  }
  saveRecord(key(hid), QUESTS, next);
  return news;
}
