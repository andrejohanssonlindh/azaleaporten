import { getHeroState, heroKey, saveHeroState } from '../profiles';
import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getArea, giveXP, saveArea, type LogEvent } from '../rpg/progress';
import { TIDSTORNET, V01_STAGE_MAP } from '../../games/klocka/content';
import { parseAny } from '../../games/klocka/logic/parse';
import { phraseKind, structs } from '../../games/klocka/logic/language';

// Import av framsteg från Klockövning v0.1 (den nedladdade HTML-filen).
// Föräldern kör KONSOLSNUTTEN i den gamla filen och klistrar in resultatet i Vuxenläge.

export const CONSOLE_SNIPPET = "copy(JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('klocka_')).map(k=>[k,JSON.parse(localStorage[k])]))))";

/** Formatet som v0.1 sparade per spelare (bara fälten vi använder). */
export interface V01Player {
  sc?: number; st?: number;
  results?: { mode?: string; level?: number; timeMs?: number; target?: string; correct?: boolean; err?: string | null; hint?: boolean }[];
  camp?: {
    lvl?: number; xp?: number; coins?: number;
    stages?: Record<string, { stars?: number; done?: boolean }>;
    ach?: Record<string, number>;
    skins?: string[]; skin?: string;
  };
}

/** Läser inklistrad text. Returnerar { namn: data } eller null. */
export function parseV01Paste(text: string): Record<string, V01Player> | null {
  let data: unknown;
  try { data = JSON.parse(text.trim()); } catch { return null; }
  if (!data || typeof data !== 'object') return null;
  const out: Record<string, V01Player> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (k.startsWith('klocka_') && v && typeof v === 'object') out[k.slice('klocka_'.length)] = v as V01Player;
  }
  return Object.keys(out).length ? out : null;
}

interface KlockaGame { v: number; skins: string[]; skin: string | null }
export const KLOCKA_GAME: RecordSpec<KlockaGame> = { version: 1, defaults: () => ({ v: 1, skins: ['klassisk'], skin: null }) };

const V01_NEED = (l: number) => 50 + 25 * l;
/** v0.1-kurvan var lite snålare än den nya; faktorn gör att ingen tappar nivå. */
const XP_FACTOR = 1.2;

export interface ImportSummary { stages: number; stars: number; xp: number; kastanjer: number; events: number; finalBoss: boolean }

export function alreadyImported(hid: string, from: string): boolean {
  return !!getHeroState(hid).legacy.klockaV01?.some((x) => x.from === from);
}

function skillFromTarget(r: NonNullable<V01Player['results']>[number]): string {
  if (r.mode === 'between') return 'ma.tid.emellan';
  const p = r.target ? parseAny(r.target) : null;
  return p ? `ma.tid.${phraseKind(structs(p.h12, p.m)[0])}` : 'ma.tid.okand';
}

export function importV01(hid: string, from: string, data: V01Player): ImportSummary {
  const camp = data.camp ?? {};
  const sum: ImportSummary = { stages: 0, stars: 0, xp: 0, kastanjer: 0, events: 0, finalBoss: false };

  // Banor och stjärnor (behåll det bästa av gammalt och nytt).
  const area = getArea(hid, 'tidstornet');
  for (const [idx, st] of Object.entries(camp.stages ?? {})) {
    const id = V01_STAGE_MAP[Number(idx)];
    if (!id || !st?.done) continue;
    if (id === 'tidens-vaktare') {
      const b = area.bosses[id] ?? { defeated: false, attempts: 0, wins: 0 };
      area.bosses[id] = { ...b, defeated: true, wins: Math.max(1, b.wins) };
      sum.finalBoss = true;
      continue;
    }
    const sp = area.stages[id] ?? { stars: 0, cleared: false, best: 0, runs: 0 };
    const stars = Math.max(sp.stars, Math.min(3, Math.max(1, st.stars ?? 1)));
    area.stages[id] = { ...sp, cleared: true, stars, best: Math.max(sp.best, 9), clearedAt: sp.clearedAt ?? new Date().toISOString() };
    sum.stages++;
    sum.stars += stars;
  }
  saveArea(hid, 'tidstornet', area);

  // XP: v0.1:s totala XP räknas om, så nivån följer med.
  let total = camp.xp ?? 0;
  for (let l = 1; l < (camp.lvl ?? 1); l++) total += V01_NEED(l);
  sum.xp = giveXP(hid, 'tidstornet', Math.round(total * XP_FACTOR)).xp;

  // Mynten var för många i v0.1: i stället en Pionjärkista och ett måttligt antal kastanjer.
  const s = getHeroState(hid);
  sum.kastanjer = Math.min(60, 10 + Math.floor((camp.coins ?? 0) / 10));
  s.kastanjer += sum.kastanjer;
  s.legacy = { ...s.legacy, pioneerChest: s.legacy.pioneerChest ?? 'pending', klockaV01: [...(s.legacy.klockaV01 ?? []), { importedAt: new Date().toISOString(), from }] };
  for (const t of ['Pionjär', ...(sum.finalBoss ? ['Tidsresenären'] : [])]) if (!s.titles.includes(t)) s.titles = [...s.titles, t];
  s.title = s.title ?? 'Pionjär';
  if (sum.finalBoss && !s.mentors.includes('tidstornet:tidens-vaktare')) s.mentors = [...s.mentors, 'tidstornet:tidens-vaktare'];
  for (const [id, ts] of Object.entries(camp.ach ?? {})) {
    const key = 'klocka.' + id;
    if (!s.achievements[key]) s.achievements[key] = new Date(ts).toISOString();
  }
  saveHeroState(hid, s);

  // Klockskal följer med.
  const g = loadRecord(heroKey(hid, 'g:klocka'), KLOCKA_GAME).value;
  saveRecord(heroKey(hid, 'g:klocka'), KLOCKA_GAME, { ...g, skins: [...new Set([...g.skins, ...(camp.skins ?? [])])], skin: camp.skin ?? g.skin });

  // Gamla svar blir händelser, så att repetitionen vet vad som var svårt.
  const EVENTS: RecordSpec<{ v: number; log: LogEvent[] }> = { version: 1, defaults: () => ({ v: 1, log: [] }) };
  const ev = loadRecord(heroKey(hid, 'events'), EVENTS).value;
  const t = new Date().toISOString();
  const old: LogEvent[] = (data.results ?? []).slice(-1000).map((r) => ({
    t, a: 'tidstornet', n: 'v01', k: skillFromTarget(r), c: !!r.correct, ms: r.timeMs ?? 0,
    ...(r.err ? { e: r.err } : {}), ...(r.hint ? { h: true } : {}),
  }));
  saveRecord(heroKey(hid, 'events'), EVENTS, { ...ev, log: [...old, ...ev.log].slice(-3000) });
  sum.events = old.length;
  return sum;
}

export { TIDSTORNET };
