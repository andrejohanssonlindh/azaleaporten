import { kv } from './storage/kv';
import { loadRecord, onRecordSaved, saveRecord, type RecordSpec } from './storage/record';
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
  /** Senaste gången en säkerhetskopia laddades ner i Vuxenläge. */
  lastExport: string | null;
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
  /** Senaste gången hjälten sparades i en hjältefil (heroBundle.ts). */
  lastSavedAt: string | null;
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
  /** Introduktioner som Mästare Kastanj redan har visat (t.ex. 'utrustning'). */
  tips: string[];
  /** Polletter till Arenan (köps för kastanjer). */
  polletter: number;
  /** Arenan: nästa motståndare (0 = den första) och antal vinster. */
  arena: { rank: number; wins: number };
  /** Dimstormen: högsta öppna steget (1 = det första), antal vinster och högsta vunna steget. */
  storm: { steg: number; wins: number; best: number };
  /** Grottdyket: djupaste våningen man har nått och antal dyk. */
  grotta: { best: number; dives: number };
  /** Spelnycklar 🗝️ (hittas i vanliga banor): öppnar en skattrunda i ett minispel. */
  nycklar: number;
  /** Skattkistor hittade i minispel (för titeln Skattjägaren). */
  skatter: number;
}

const uuid = () => globalThis.crypto?.randomUUID?.() ?? `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();

export const META: RecordSpec<Meta> = {
  version: 1,
  defaults: () => ({ v: 1, deviceId: uuid(), heroes: [], lastHero: null, createdAt: now(), lastExport: null }),
};

export const PROFILE: RecordSpec<Profile> = {
  version: 1,
  defaults: () => ({
    v: 1, id: '', name: '', animal: 'rav', color: 'azalea', heroClass: 'riddare', grade: 3,
    createdAt: now(), lastActiveAt: null, lastSavedAt: null, settings: { readAloud: false, bigText: false, sound: true },
  }),
};

export const HERO: RecordSpec<HeroState> = {
  version: 1,
  defaults: () => ({ v: 1, xp: 0, level: 1, kastanjer: 0, blad: 0, titles: [], title: null, achievements: {}, pets: [], mentors: [], legacy: {}, tips: [], polletter: 0, arena: { rank: 0, wins: 0 }, storm: { steg: 1, wins: 0, best: 0 }, grotta: { best: 0, dives: 0 }, nycklar: 0, skatter: 0 }),
};

export const heroKey = (id: string, part: string) => `h:${id}:${part}`;

// När hjältens framsteg senast ändrades (vilken post som helst under h:<id>: utom profilen, som skrivs
// varje gång hjälten väljs). Behövs för att se om en hjältefil är äldre än hjälten på enheten, och
// senare för att synka med ett moln.
interface Changed { v: number; at: string }
const CHANGED: RecordSpec<Changed> = { version: 1, defaults: () => ({ v: 1, at: '' }) };
onRecordSaved((key) => {
  const m = /^h:([^:]+):(.+)$/.exec(key);
  if (m && m[2] !== 'andrad' && m[2] !== 'profile') saveRecord(heroKey(m[1], 'andrad'), CHANGED, { v: 1, at: now() });
});

/** Senaste ändringen av hjältens data, eller null för hjältar sparade innan det noterades. */
export function heroChangedAt(id: string): string | null {
  return loadRecord(heroKey(id, 'andrad'), CHANGED).value.at || null;
}

export function getMeta(): Meta {
  const m = loadRecord('meta', META);
  if (!m.exists) saveRecord('meta', META, m.value);
  return m.value;
}

function saveMeta(m: Meta) { saveRecord('meta', META, m); }

/** Byter listan med hjältar på enheten (används när en hjälte hämtas från en fil). */
export function saveMetaHeroes(heroes: string[]) { saveMeta({ ...getMeta(), heroes }); }

export const BACKUP_REMINDER_DAYS = 30;

export function markExported(at = new Date()) { saveMeta({ ...getMeta(), lastExport: at.toISOString() }); }

/** Dags att påminna om en säkerhetskopia: det finns hjältar, och det har gått 30 dagar sedan förra kopian
 *  (eller sedan enheten började användas, om ingen kopia har tagits). */
export function backupDue(now = new Date()): boolean {
  const m = getMeta();
  if (!m.heroes.length) return false;
  const since = Date.parse(m.lastExport ?? m.createdAt);
  return !Number.isFinite(since) || now.getTime() - since >= BACKUP_REMINDER_DAYS * 86_400_000;
}

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

/** Markerar att en introduktion har visats (visas bara en gång per hjälte). */
export function markTip(id: string, tip: string) {
  const s = getHeroState(id);
  if (!s.tips.includes(tip)) saveHeroState(id, { ...s, tips: [...s.tips, tip] });
}

/** Längsta namnet: längre namn får inte plats på hjältekorten och i striderna. */
export const NAME_MAX = 12;
export const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

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
