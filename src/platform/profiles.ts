import { kv } from './storage/kv';
import { loadRecord, saveRecord, type RecordSpec } from './storage/record';
import { snapshot } from './storage/backup';
import type { AnimalId, ClassId, ColorId } from '../content/heroes';

// Hjältar (profiler) på den här enheten. ID är ett slumpat UUID – aldrig namnet –
// så att namnbyten fungerar och två hjältar kan heta samma sak.

export interface Meta {
  v: number;
  deviceId: string;
  heroes: string[];
  lastHero: string | null;
  createdAt: string;
}

export interface Settings {
  readAloud: boolean;
  bigText: boolean;
  sound: boolean;
}

export interface Profile {
  v: number;
  id: string;
  name: string;
  animal: AnimalId;
  color: ColorId;
  heroClass: ClassId;
  grade: number;
  createdAt: string;
  lastActiveAt: string | null;
  settings: Settings;
}

/** Hjältens gemensamma framsteg. Nya fält behöver bara ett standardvärde (mergeDefaults). */
export interface HeroState {
  v: number;
  /** XP mot nästa nivå. */
  xp: number;
  level: number;
  kastanjer: number;
  blad: number;
  titles: string[];
  /** Vald titel som visas på hjältebladet. */
  title: string | null;
  achievements: Record<string, string>;
  /** Tämjda monsterbossar, id "<område>:<boss>". */
  pets: string[];
  /** Besegrade mästare som blivit mentorer, id "<område>:<boss>". */
  mentors: string[];
  legacy: { klockaV01?: { importedAt: string; from: string }[]; pioneerChest?: 'pending' | 'opened' };
}

const uuid = () => globalThis.crypto?.randomUUID?.() ?? `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();

export const META: RecordSpec<Meta> = {
  version: 1,
  defaults: () => ({ v: 1, deviceId: uuid(), heroes: [], lastHero: null, createdAt: now() }),
};

export const PROFILE: RecordSpec<Profile> = {
  version: 1,
  defaults: () => ({
    v: 1, id: '', name: '', animal: 'rav', color: 'azalea', heroClass: 'riddare', grade: 3,
    createdAt: now(), lastActiveAt: null, settings: { readAloud: false, bigText: false, sound: true },
  }),
};

export const HERO: RecordSpec<HeroState> = {
  version: 1,
  defaults: () => ({ v: 1, xp: 0, level: 1, kastanjer: 0, blad: 0, titles: [], title: null, achievements: {}, pets: [], mentors: [], legacy: {} }),
};

export const heroKey = (id: string, part: string) => `h:${id}:${part}`;

export function getMeta(): Meta {
  const m = loadRecord('meta', META);
  if (!m.exists) saveRecord('meta', META, m.value);
  return m.value;
}

function saveMeta(m: Meta) { saveRecord('meta', META, m); }

export function listHeroes(): Profile[] {
  return getMeta().heroes
    .map((id) => loadRecord(heroKey(id, 'profile'), PROFILE))
    .filter((r) => r.exists)
    .map((r) => r.value);
}

export function getProfile(id: string): Profile | null {
  const r = loadRecord(heroKey(id, 'profile'), PROFILE);
  return r.exists ? r.value : null;
}

export function saveProfile(p: Profile) { saveRecord(heroKey(p.id, 'profile'), PROFILE, p); }

export function getHeroState(id: string): HeroState { return loadRecord(heroKey(id, 'hero'), HERO).value; }
export function saveHeroState(id: string, s: HeroState) { saveRecord(heroKey(id, 'hero'), HERO, s); }

export const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, 20);

export function nameTaken(name: string, exceptId?: string): boolean {
  const n = cleanName(name).toLocaleLowerCase('sv');
  return listHeroes().some((p) => p.id !== exceptId && p.name.toLocaleLowerCase('sv') === n);
}

export interface NewHero { name: string; animal: AnimalId; color: ColorId; heroClass: ClassId; grade: number }

export function createHero(input: NewHero): Profile {
  const name = cleanName(input.name);
  if (!name) throw new Error('Hjälten behöver ett namn');
  const profile: Profile = { ...PROFILE.defaults(), ...input, name, id: uuid(), createdAt: now() };
  saveProfile(profile);
  saveHeroState(profile.id, HERO.defaults());
  const meta = getMeta();
  meta.heroes = [...meta.heroes, profile.id];
  meta.lastHero = profile.id;
  saveMeta(meta);
  return profile;
}

/** Markerar hjälten som aktiv. Returnerar förra besökets tid (för "välkommen tillbaka"). */
export function enterHero(id: string): string | null {
  const p = getProfile(id);
  if (!p) return null;
  const previous = p.lastActiveAt;
  saveProfile({ ...p, lastActiveAt: now() });
  const meta = getMeta();
  if (meta.lastHero !== id) saveMeta({ ...meta, lastHero: id });
  return previous;
}

/** Raderar en hjälte. Tar alltid backup först. */
export function deleteHero(id: string) {
  snapshot('före radering av hjälte');
  for (const k of kv.keys(`h:${id}:`)) kv.remove(k);
  const meta = getMeta();
  saveMeta({ ...meta, heroes: meta.heroes.filter((h) => h !== id), lastHero: meta.lastHero === id ? null : meta.lastHero });
}
