import type { LogEvent } from './events';
import { addDays, dayOf, type SkillItem } from './skills';

// Statistik för Vuxenläge, räknad ur händelseloggen och repetitionsschemat. Rena funktioner (testas).

/** Svarstid som räknas som aktiv tid per fråga (längre = barnet gick nog ifrån). Samma tak som tröttheten. */
const MAX_MS = 60_000;
/** Paus som skiljer två övningspass åt. */
const SESSION_GAP_MS = 20 * 60_000;

const ms = (e: LogEvent) => Math.min(Math.max(e.ms, 0), MAX_MS);

/** Aktiva minuter per dag de senaste `days` dagarna, äldst först. */
export function minutesPerDay(events: LogEvent[], days = 14, today = dayOf()): { day: string; min: number; n: number }[] {
  const out = Array.from({ length: days }, (_, i) => ({ day: addDays(today, i - days + 1), ms: 0, n: 0 }));
  const idx = new Map(out.map((d, i) => [d.day, i]));
  for (const e of events) {
    const i = e.t ? idx.get(dayOf(new Date(e.t))) : undefined;
    if (i === undefined) continue;
    out[i].ms += ms(e);
    out[i].n++;
  }
  return out.map((d) => ({ day: d.day, min: Math.round(d.ms / 60_000), n: d.n }));
}

export interface Session { start: string; end: string; n: number; right: number; min: number; areas: string[] }

/** Övningspassen, senaste först. Ett nytt pass börjar efter 20 minuters paus. */
export function sessions(events: LogEvent[], limit = 5): Session[] {
  type Open = Session & { ms: number; lastT: number };
  const out: Open[] = [];
  let cur: Open | null = null;
  // Importerade gamla svar läggs först i loggen, så sortera på tid.
  for (const e of events.filter((x) => x.t).sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0))) {
    const t = Date.parse(e.t);
    if (!cur || t - cur.lastT > SESSION_GAP_MS) {
      if (cur) out.push(cur);
      cur = { start: e.t, end: e.t, n: 0, right: 0, min: 0, areas: [], ms: 0, lastT: t };
    }
    cur.end = e.t;
    cur.lastT = t;
    cur.n++;
    if (e.c) cur.right++;
    cur.ms += ms(e);
    if (!cur.areas.includes(e.a)) cur.areas.push(e.a);
  }
  if (cur) out.push(cur);
  return out.slice(-limit).reverse().map(({ start, end, n, right, ms: m, areas }) => ({ start, end, n, right, min: Math.max(1, Math.round(m / 60_000)), areas }));
}

export type SkillColor = 'gron' | 'gul' | 'rod';

/** Grön = sitter (låda 4+), röd = dags att repetera (Glömskans dimma), gul = övar fortfarande. */
export function skillColor(it: SkillItem, today = dayOf()): SkillColor {
  if (it.due <= today) return 'rod';
  return it.box >= 4 ? 'gron' : 'gul';
}

/** Vanligaste felkoderna per område bland de senaste felen ('annat' räknas inte; det är ingen diagnos). */
export function topErrors(events: LogEvent[], recent = 300, limit = 3): Record<string, { tag: string; n: number }[]> {
  const counts: Record<string, Map<string, number>> = {};
  for (const e of events.filter((x) => !x.c && x.e && x.e !== 'annat').slice(-recent)) {
    const m = (counts[e.a] ??= new Map());
    m.set(e.e!, (m.get(e.e!) ?? 0) + 1);
  }
  return Object.fromEntries(Object.entries(counts).map(([a, m]) => [a, [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, limit).map(([tag, n]) => ({ tag, n }))]));
}
