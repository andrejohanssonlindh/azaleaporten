import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { heroKey } from '../profiles';
import { getEvents, type LogEvent } from './events';

// Repetitionsschemat (Leitner). Varje färdighet ligger i en låda 0–5; lådan avgör hur många dagar
// det dröjer innan den ska repeteras. När en färdighet är "dags" ligger Glömskans dimma över området.
// - Rätt (utan ledtråd) när färdigheten är dags: en låda upp. Högst en gång per dag, så tio rätt i
//   samma runda flyttar den bara ett steg.
// - Fel: två lådor ner (minst 0), och den kommer tillbaka imorgon – inte idag, barnet har ju just rättat felet.

/** Dagar till nästa repetition per låda. */
export const INTERVALS = [1, 1, 2, 4, 8, 16];
export const TOP_BOX = INTERVALS.length - 1;

export interface SkillItem {
  box: number;
  /** Dag (ÅÅÅÅ-MM-DD) då färdigheten ska repeteras. */
  due: string;
  seen: number;
  correct: number;
  /** Området där färdigheten senast övades (dimman hamnar där). */
  area: string;
  lastSeen: string;
  lastErr?: string;
  lastErrDay?: string;
}

export interface SkillsRecord { v: number; items: Record<string, SkillItem>; seeded: boolean }
export const SKILLS: RecordSpec<SkillsRecord> = { version: 1, defaults: () => ({ v: 1, items: {}, seeded: false }) };

export const dayOf = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y, m - 1, d + n));
}
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

const key = (hid: string) => heroKey(hid, 'skills');

export function getSkills(hid: string): SkillsRecord {
  const r = loadRecord(key(hid), SKILLS).value;
  if (r.seeded) return r;
  // Hjältar som spelade innan schemat fanns: bygg det ur händelseloggen.
  seedSkills(hid, getEvents(hid));
  return loadRecord(key(hid), SKILLS).value;
}

/** Uppdaterar en färdighet efter ett första svar. Ren funktion (för tester och omspelning). */
export function step(item: SkillItem | undefined, area: string, correct: boolean, hint: boolean, day: string, errTag?: string): SkillItem {
  const it: SkillItem = item ? { ...item } : { box: 0, due: day, seen: 0, correct: 0, area, lastSeen: day };
  it.seen++;
  it.area = area;
  it.lastSeen = day;
  if (correct) {
    it.correct++;
    if (!hint && it.due <= day) { it.box = Math.min(TOP_BOX, it.box + 1); it.due = addDays(day, INTERVALS[it.box]); }
  } else {
    it.box = Math.max(0, it.box - 2);
    it.due = addDays(day, INTERVALS[it.box]);
    if (errTag) it.lastErr = errTag;
    it.lastErrDay = day;
  }
  return it;
}

export function noteAnswer(hid: string, area: string, skill: string, correct: boolean, hint: boolean, errTag?: string, day = dayOf()) {
  const r = getSkills(hid);
  saveRecord(key(hid), SKILLS, { ...r, items: { ...r.items, [skill]: step(r.items[skill], area, correct, hint, day, errTag) } });
}

/**
 * Lägger in färdigheter ur gamla svar (importen från v0.1, eller loggen för hjältar från före schemat).
 * Färdigheter med fel blir dags direkt (så att dimman visar det som var svårt); felfria hamnar i låda 2.
 * Färdigheter som redan finns i schemat lämnas orörda.
 */
export function seedSkills(hid: string, events: LogEvent[], day = dayOf()) {
  const r = loadRecord(key(hid), SKILLS).value;
  const items = { ...r.items };
  const by = new Map<string, LogEvent[]>();
  for (const e of events) if (e.k && !items[e.k]) by.set(e.k, [...(by.get(e.k) ?? []), e]);
  for (const [k, evs] of by) {
    const last = evs[evs.length - 1];
    const errs = evs.filter((e) => !e.c);
    const lastErr = errs[errs.length - 1];
    items[k] = {
      box: errs.length ? 0 : 2, due: errs.length ? day : addDays(day, INTERVALS[2]),
      seen: evs.length, correct: evs.length - errs.length, area: last.a, lastSeen: day,
      ...(lastErr ? { lastErr: lastErr.e, lastErrDay: day } : {}),
    };
  }
  saveRecord(key(hid), SKILLS, { ...r, items, seeded: true });
}

export interface Due { skill: string; item: SkillItem }

/** Färdigheter som är dags, viktigast först: lägst låda, sedan senaste fel, sedan äldst. */
export function dueSkills(hid: string, area?: string, day = dayOf()): Due[] {
  return Object.entries(getSkills(hid).items)
    .filter(([, it]) => it.due <= day && (!area || it.area === area))
    .map(([skill, item]) => ({ skill, item }))
    .sort((a, b) => a.item.box - b.item.box || (b.item.lastErrDay ?? '').localeCompare(a.item.lastErrDay ?? '') || a.item.due.localeCompare(b.item.due));
}

/** Antal färdigheter som är dags, per område. */
export function mistByArea(hid: string, day = dayOf()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of dueSkills(hid, undefined, day)) out[d.item.area] = (out[d.item.area] ?? 0) + 1;
  return out;
}

/** Färdigheterna i en repetitionsrunda: de viktigaste som är dags, upprepade tills rundan är full. */
export function reviewPlan(hid: string, area: string, length: number, day = dayOf()): string[] {
  const due = dueSkills(hid, area, day).slice(0, length).map((d) => d.skill);
  return due.length ? Array.from({ length }, (_, i) => due[i % due.length]) : [];
}
