import { addPruner, kv } from './kv';

// Ögonblicksbilder av all sparad data. Tas automatiskt innan någon migrering körs
// och innan import/radering. De tre senaste behålls.

const BACKUP = 'backup:';
const KEEP = 3;
/** Nycklar som aldrig följer med i backup eller export. gate innehåller familjens nyckel. */
const PRIVATE = ['gate', 'pack-cache'];

export interface Snapshot {
  v: 1;
  reason: string;
  at: string;
  appVersion: string;
  data: Record<string, unknown>;
}

export interface DeviceExport {
  format: 'azaleaporten-export';
  v: 1;
  exportedAt: string;
  appVersion: string;
  data: Record<string, unknown>;
}

const version = () => (typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'test');

function isDataKey(k: string) {
  return !k.startsWith(BACKUP) && !k.startsWith('corrupt:') && !PRIVATE.includes(k);
}

function collect(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const k of kv.keys()) if (isDataKey(k)) data[k] = kv.get(k);
  return data;
}

export function listBackups(): string[] {
  return kv.keys(BACKUP);
}

// Full lagring: först får äldre backuper gå (den senaste behålls), och allra sist även den senaste.
addPruner(1, () => {
  const old = listBackups().slice(0, -1);
  for (const k of old) kv.remove(k);
  return old.length > 0;
});
addPruner(9, () => {
  const all = listBackups();
  for (const k of all) kv.remove(k);
  return all.length > 0;
});

/** Tar en backup. Kastar om det inte går (t.ex. full lagring) – då ska anroparen avstå från att ändra data. */
export function snapshot(reason: string): string {
  const at = new Date().toISOString();
  let key = BACKUP + at;
  for (let i = 1; kv.get(key) !== undefined; i++) key = `${BACKUP}${at}-${i}`;
  const snap: Snapshot = { v: 1, reason, at, appVersion: version(), data: collect() };
  const old = listBackups();
  // Rensa äldsta först så att det finns plats för den nya.
  while (old.length >= KEEP) kv.remove(old.shift()!);
  kv.set(key, snap);
  return key;
}

export function restoreBackup(key: string): void {
  const snap = kv.get<Snapshot>(key);
  if (!snap || snap.v !== 1) throw new Error('Hittar ingen sådan backup');
  snapshot('före återställning');
  for (const k of kv.keys()) if (isDataKey(k)) kv.remove(k);
  for (const [k, v] of Object.entries(snap.data)) kv.set(k, v);
}

export function exportAll(): DeviceExport {
  return { format: 'azaleaporten-export', v: 1, exportedAt: new Date().toISOString(), appVersion: version(), data: collect() };
}

export function isDeviceExport(x: unknown): x is DeviceExport {
  const e = x as DeviceExport;
  return !!e && e.format === 'azaleaporten-export' && e.v === 1 && typeof e.data === 'object' && e.data !== null;
}

/** Ersätter all hjältedata på enheten med exporten. Tar backup först. */
export function importReplace(exp: DeviceExport): void {
  if (!isDeviceExport(exp)) throw new Error('Filen är inte en Azaleaporten-export');
  snapshot('före import');
  for (const k of kv.keys()) if (isDataKey(k)) kv.remove(k);
  for (const [k, v] of Object.entries(exp.data)) if (isDataKey(k)) kv.set(k, v);
}
