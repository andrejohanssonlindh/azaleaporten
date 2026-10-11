// Namnrymdad nyckel-värde-lagring ovanpå localStorage.
// Allt från Azaleaporten ligger under prefixet nedan, eftersom alla repon på
// <användare>.github.io delar samma origin och därmed samma localStorage.

export const PREFIX = 'azaleaporten:';

export interface Backend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

export class MemoryBackend implements Backend {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.has(key) ? this.map.get(key)! : null; }
  setItem(key: string, value: string) { this.map.set(key, String(value)); }
  removeItem(key: string) { this.map.delete(key); }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  get length() { return this.map.size; }
}

export class StorageFullError extends Error {
  constructor() { super('Lagringen är full'); this.name = 'StorageFullError'; }
}

function detect(): Backend {
  if (typeof window === 'undefined') return new MemoryBackend();
  try {
    const ls = globalThis.localStorage;
    const probe = PREFIX + '__probe';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    // Privat läge, blockerad lagring, förhandsvisning: appen fungerar men sparar inget.
    return new MemoryBackend();
  }
}

let backend: Backend = detect();

/** Endast för tester. */
export function setBackend(b: Backend) { backend = b; }

function isQuota(e: unknown) {
  return e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
}

export const kv = {
  /** Läser och tolkar JSON. Trasig JSON flyttas undan (aldrig tyst överskriven) och ger undefined. */
  get<T = unknown>(key: string): T | undefined {
    const raw = backend.getItem(PREFIX + key);
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      try { backend.setItem(`${PREFIX}corrupt:${key}:${Date.now()}`, raw); } catch { /* full lagring: behåll originalet orört */ return undefined; }
      backend.removeItem(PREFIX + key);
      return undefined;
    }
  },

  set(key: string, value: unknown): void {
    try {
      backend.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      if (isQuota(e)) throw new StorageFullError();
      throw e;
    }
  },

  remove(key: string): void { backend.removeItem(PREFIX + key); },

  /** Alla nycklar (utan prefix) som börjar med `start`. */
  keys(start = ''): string[] {
    const out: string[] = [];
    for (let i = 0; i < backend.length; i++) {
      const k = backend.key(i);
      if (k && k.startsWith(PREFIX + start)) out.push(k.slice(PREFIX.length));
    }
    return out.sort();
  },

  /** false om vi kör på minneslagring (inget sparas mellan besök). */
  isPersistent(): boolean { return !(backend instanceof MemoryBackend); },
};
