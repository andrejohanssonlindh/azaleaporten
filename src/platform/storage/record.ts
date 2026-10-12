import { kv } from './kv';
import { snapshot } from './backup';

// Versionerade poster. Regler (se CLAUDE.md):
//  - varje post har fältet v
//  - vid läsning körs migreringar steg för steg (v → v+1 → …) och resultatet läggs över standardvärdena
//  - backup tas innan första migreringen
//  - misslyckas en migrering lämnas originalet orört och posten blir skrivskyddad
//  - är sparad v NYARE än koden (gammal cachad version) blir posten skrivskyddad

export interface Versioned { v: number }
/** migrations[n] tar data i version n och returnerar version n+1. */
export type Migrations = Record<number, (old: any) => any>;

export interface RecordSpec<T extends Versioned> {
  version: number;
  defaults: () => T;
  migrations?: Migrations;
}

export interface Loaded<T> {
  value: T;
  /** true om posten inte får skrivas (nyare data eller trasig migrering). */
  readOnly: boolean;
  /** Satt om migrering skedde. */
  migratedFrom?: number;
  exists: boolean;
}

const readOnlyKeys = new Set<string>();
let newerDataSeen = false;
let backupTakenThisSession = false;

/** true om någon post var sparad av en nyare version av appen. */
export function hasNewerData() { return newerDataSeen; }

/** Glömmer att poster under `prefix` var skrivskyddade, t.ex. när de just har ersatts av en hämtad hjälte. */
export function forgetReadOnly(prefix: string) { for (const k of [...readOnlyKeys]) if (k.startsWith(prefix)) readOnlyKeys.delete(k); }

/** Endast för tester. */
export function _resetRecordState() { readOnlyKeys.clear(); newerDataSeen = false; backupTakenThisSession = false; }

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Fyller i saknade fält från standardvärdena, rekursivt för vanliga objekt. Sparade värden vinner alltid. */
export function mergeDefaults<T>(defaults: T, data: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(data)) return (data === undefined ? defaults : data) as T;
  const out: Record<string, unknown> = { ...data };
  for (const [k, dv] of Object.entries(defaults)) {
    out[k] = k in data ? mergeDefaults(dv, data[k]) : dv;
  }
  return out as T;
}

export function loadRecord<T extends Versioned>(key: string, spec: RecordSpec<T>): Loaded<T> {
  const raw = kv.get<Record<string, unknown>>(key);
  if (raw === undefined) return { value: spec.defaults(), readOnly: false, exists: false };

  const from = typeof raw.v === 'number' ? raw.v : 0;

  if (from > spec.version) {
    newerDataSeen = true;
    readOnlyKeys.add(key);
    return { value: mergeDefaults(spec.defaults(), raw), readOnly: true, exists: true };
  }

  if (from === spec.version) {
    return { value: mergeDefaults(spec.defaults(), raw), readOnly: readOnlyKeys.has(key), exists: true };
  }

  try {
    if (!backupTakenThisSession) {
      snapshot(`före migrering av ${key} från v${from}`);
      backupTakenThisSession = true;
    }
    let data: any = structuredClone(raw);
    for (let v = from; v < spec.version; v++) {
      const step = spec.migrations?.[v];
      if (!step) throw new Error(`Migrering saknas för ${key} v${v} → v${v + 1}`);
      data = step(data);
      data.v = v + 1;
    }
    const value = mergeDefaults(spec.defaults(), data);
    kv.set(key, value);
    return { value, readOnly: false, migratedFrom: from, exists: true };
  } catch (e) {
    console.error('[Azaleaporten] migrering misslyckades', key, e);
    readOnlyKeys.add(key);
    return { value: mergeDefaults(spec.defaults(), raw), readOnly: true, exists: true };
  }
}

const savedListeners: ((key: string) => void)[] = [];
/** Anropas efter varje lyckad saveRecord (profiles.ts noterar när en hjälte senast ändrades). */
export function onRecordSaved(fn: (key: string) => void) { savedListeners.push(fn); }

/** Sparar posten. Returnerar false (och sparar inget) om posten är skrivskyddad. */
export function saveRecord<T extends Versioned>(key: string, spec: RecordSpec<T>, value: T): boolean {
  if (readOnlyKeys.has(key)) return false;
  kv.set(key, { ...value, v: spec.version });
  for (const fn of savedListeners) fn(key);
  return true;
}
