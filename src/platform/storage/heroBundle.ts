import { kv } from './kv';
import { snapshot } from './backup';
import { forgetReadOnly } from './record';
import { getHeroState, getMeta, getProfile, heroChangedAt, heroKey, saveProfile, saveMetaHeroes, type Profile } from '../profiles';

// En hjälte som ett paket: alla poster under h:<id>: plus lite fakta om var och när paketet gjordes.
// Paketet är enheten som flyttas mellan enheter. I dag som en fil barnet sparar och hämtar,
// senare som det som skickas till och hämtas från ett moln. Därför är allt här rena funktioner
// utan filer eller DOM: bundleHero() → (fil eller nät) → readBundle() → compareBundle() → applyBundle().
//
//  - id är hjältens UUID och följer med, så samma hjälte känns igen på en annan enhet (och i molnet).
//  - posterna kopieras som de är, med sitt v. loadRecord migrerar dem när de läses, precis som
//    lokala poster, och en post från en nyare version av appen blir skrivskyddad i stället för att skrivas över.
//  - savedAt mot hjältens h:<id>:andrad (senaste ändringen) avgör om enheten har något som filen saknar.
//    deviceId säger var paketet gjordes. Det är samma fakta som en synk behöver för att upptäcka konflikter.

export const BUNDLE_FORMAT = 'azaleaporten-hjalte';

export interface HeroBundle {
  format: typeof BUNDLE_FORMAT;
  v: 1;
  heroId: string;
  /** Visas när filen hämtas, så att barnet ser vems hjälte det är. Själva namnet ligger i profile-posten. */
  name: string;
  level: number;
  savedAt: string;
  /** Hjältens senaste besök när paketet gjordes. */
  lastActiveAt: string | null;
  /** Senaste ändringen av hjältens data när paketet gjordes. */
  changedAt: string | null;
  deviceId: string;
  appVersion: string;
  /** Posterna utan prefixet h:<id>:, t.ex. profile, hero, inventory, area:klocka. */
  records: Record<string, unknown>;
}

const version = () => (typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'test');
const ID = /^[A-Za-z0-9-]{1,64}$/;
const PART = /^[A-Za-z0-9_.:-]{1,80}$/;

/** Packar ihop allt om hjälten. Markerar också att hjälten är sparad (lastSavedAt). */
export function bundleHero(hid: string): HeroBundle {
  const p = getProfile(hid);
  if (!p) throw new Error('Hittar ingen sådan hjälte');
  const savedAt = new Date().toISOString();
  saveProfile({ ...p, lastSavedAt: savedAt });
  const prefix = heroKey(hid, '');
  const records: Record<string, unknown> = {};
  for (const k of kv.keys(prefix)) records[k.slice(prefix.length)] = kv.get(k);
  return {
    format: BUNDLE_FORMAT, v: 1, heroId: hid, name: p.name, level: getHeroState(hid).level,
    savedAt, lastActiveAt: p.lastActiveAt, changedAt: heroChangedAt(hid), deviceId: getMeta().deviceId, appVersion: version(), records,
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Kontrollerar att x är ett hjältepaket som går att lägga in. Returnerar paketet eller null. */
export function readBundle(x: unknown): HeroBundle | null {
  if (!isObj(x) || x.format !== BUNDLE_FORMAT || x.v !== 1) return null;
  const b = x as unknown as HeroBundle;
  if (typeof b.heroId !== 'string' || !ID.test(b.heroId) || !isObj(b.records)) return null;
  const profile = b.records.profile;
  if (!isObj(profile) || profile.id !== b.heroId || typeof profile.name !== 'string') return null;
  for (const [part, rec] of Object.entries(b.records)) {
    if (!PART.test(part) || !isObj(rec) || typeof rec.v !== 'number') return null;
  }
  return b;
}

export type BundleStatus =
  /** Hjälten finns inte här: läggs till. */
  | 'ny'
  /** Hjälten finns här, och filen är lika ny eller nyare. */
  | 'nyare'
  /** Hjälten finns här och har ändrats efter att filen sparades: att hämta filen tappar framsteg. */
  | 'äldre';

export interface BundleCompare {
  status: BundleStatus;
  /** Hjälten som finns på enheten nu (om den finns). */
  here: { name: string; level: number; changedAt: string | null } | null;
}

export function compareBundle(b: HeroBundle): BundleCompare {
  const p = getProfile(b.heroId);
  if (!p) return { status: 'ny', here: null };
  // Hjältar från innan andrad fanns: det senaste besöket är det bästa vi vet.
  const changedAt = heroChangedAt(b.heroId) ?? p.lastActiveAt;
  const here = { name: p.name, level: getHeroState(b.heroId).level, changedAt };
  const t = (s: string | null) => (s ? Date.parse(s) || 0 : 0);
  return { status: t(changedAt) > t(b.savedAt) ? 'äldre' : 'nyare', here };
}

/** Lägger in hjälten från paketet. Finns hjälten redan ersätts alla dess poster. Tar alltid backup först. */
export function applyBundle(b: HeroBundle): Profile {
  if (!readBundle(b)) throw new Error('Det är inte en hjältefil');
  snapshot(`före hämtning av hjälte ${b.heroId}`);
  const prefix = heroKey(b.heroId, '');
  for (const k of kv.keys(prefix)) kv.remove(k);
  forgetReadOnly(prefix);
  for (const [part, rec] of Object.entries(b.records)) kv.set(prefix + part, rec);
  const meta = getMeta();
  if (!meta.heroes.includes(b.heroId)) saveMetaHeroes([...meta.heroes, b.heroId]);
  return getProfile(b.heroId)!;
}
