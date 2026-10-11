import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, heroKey, saveHeroState } from '../profiles';
import { bestStreak } from '../learning/quests';

// Garderoben: utseende för hjältefiguren. Köps i Skräddaren för kastanjer, eller låses upp som belöning.
// Rent utseende – påverkar inga egenskaper. Id:n är permanenta: byt aldrig namn, lägg till nya.

export type LookSlot = 'hatt' | 'mantel' | 'skor' | 'bakgrund' | 'aura';

export interface Unlock { kind: 'mastare' | 'niva' | 'svit' | 'arena' | 'storm'; n: number }

export interface Cosmetic {
  id: string;
  slot: LookSlot;
  name: string;
  icon: string;
  /** Pris i kastanjer, eller en belöning som låses upp. */
  cost?: number;
  unlock?: Unlock;
  /** Huvudfärg och ev. andrafärg för ritningen i HeroFigure. */
  color: string;
  color2?: string;
}

export const LOOK_SLOTS: { id: LookSlot; name: string; icon: string }[] = [
  { id: 'hatt', name: 'Huvudbonad', icon: '🎩' },
  { id: 'mantel', name: 'Mantel', icon: '🧣' },
  { id: 'skor', name: 'Skor', icon: '👢' },
  { id: 'bakgrund', name: 'Bakgrund', icon: '🖼️' },
  { id: 'aura', name: 'Glitter', icon: '✨' },
];

export const COSMETICS: Cosmetic[] = [
  { id: 'hatt.party', slot: 'hatt', name: 'Partyhatt', icon: '🥳', cost: 40, color: '#f06595', color2: '#ffd43b' },
  { id: 'hatt.tofs', slot: 'hatt', name: 'Tofsmössa', icon: '🧶', cost: 40, color: '#1c7ed6', color2: '#ffffff' },
  { id: 'hatt.blomkrans', slot: 'hatt', name: 'Azaleakrans', icon: '🌸', cost: 50, color: '#e64980', color2: '#2f9e44' },
  { id: 'hatt.troll', slot: 'hatt', name: 'Trollkarlshatt', icon: '🧙', cost: 70, color: '#7048e8', color2: '#ffd43b' },
  { id: 'hatt.pirat', slot: 'hatt', name: 'Pirathatt', icon: '🏴‍☠️', cost: 70, color: '#212529', color2: '#f8f9fa' },
  { id: 'hatt.viking', slot: 'hatt', name: 'Vikingahjälm', icon: '🪖', cost: 90, color: '#868e96', color2: '#fff3bf' },
  { id: 'hatt.mastarkrona', slot: 'hatt', name: 'Mästarkronan', icon: '👑', unlock: { kind: 'mastare', n: 3 }, color: '#fab005', color2: '#e64980' },

  { id: 'mantel.rod', slot: 'mantel', name: 'Röd mantel', icon: '🟥', cost: 50, color: '#e03131', color2: '#a61e4d' },
  { id: 'mantel.skog', slot: 'mantel', name: 'Skogsmantel', icon: '🟩', cost: 50, color: '#2f9e44', color2: '#1b5e20' },
  { id: 'mantel.natt', slot: 'mantel', name: 'Stjärnmantel', icon: '🌌', cost: 90, color: '#364fc7', color2: '#ffd43b' },
  { id: 'mantel.regnbage', slot: 'mantel', name: 'Regnbågsmantel', icon: '🌈', cost: 120, color: '#e64980', color2: '#4dabf7' },
  { id: 'mantel.guld', slot: 'mantel', name: 'Mästarmanteln', icon: '🎓', unlock: { kind: 'mastare', n: 1 }, color: '#f59f00', color2: '#fff3bf' },
  { id: 'mantel.arena', slot: 'mantel', name: 'Arenamanteln', icon: '🏟️', unlock: { kind: 'arena', n: 5 }, color: '#c92a2a', color2: '#ffd43b' },

  { id: 'skor.stovlar', slot: 'skor', name: 'Läderstövlar', icon: '👢', cost: 30, color: '#8d5524', color2: '#5c3a1a' },
  { id: 'skor.gympa', slot: 'skor', name: 'Gympaskor', icon: '👟', cost: 40, color: '#f8f9fa', color2: '#e64980' },
  { id: 'skor.guld', slot: 'skor', name: 'Guldskor', icon: '✨', cost: 100, color: '#fab005', color2: '#fff3bf' },
  { id: 'skor.skejt', slot: 'skor', name: 'Skejtskor', icon: '🛹', unlock: { kind: 'niva', n: 5 }, color: '#212529', color2: '#ff922b' },

  { id: 'bg.angen', slot: 'bakgrund', name: 'Ängen', icon: '🌼', cost: 40, color: '#8ce99a', color2: '#d0ebff' },
  { id: 'bg.berg', slot: 'bakgrund', name: 'Talbergen', icon: '⛰️', cost: 60, color: '#868e96', color2: '#a5d8ff' },
  { id: 'bg.hav', slot: 'bakgrund', name: 'Havet', icon: '🌊', cost: 60, color: '#339af0', color2: '#fff3bf' },
  { id: 'bg.betong', slot: 'bakgrund', name: 'Skejtparken', icon: '🛹', cost: 60, color: '#adb5bd', color2: '#ffe066' },
  { id: 'bg.natt', slot: 'bakgrund', name: 'Stjärnnatt', icon: '🌙', cost: 80, color: '#2f2346', color2: '#ffe066' },
  { id: 'bg.tornet', slot: 'bakgrund', name: 'Tidstornet', icon: '🕰️', unlock: { kind: 'svit', n: 7 }, color: '#5f3dc4', color2: '#ffd43b' },

  { id: 'aura.gnistor', slot: 'aura', name: 'Gnistor', icon: '✨', cost: 80, color: '#ffd43b' },
  { id: 'aura.hjartan', slot: 'aura', name: 'Hjärtan', icon: '💖', cost: 80, color: '#f06595' },
  { id: 'aura.eld', slot: 'aura', name: 'Eldaura', icon: '🔥', unlock: { kind: 'niva', n: 10 }, color: '#ff6b00' },
  { id: 'aura.storm', slot: 'aura', name: 'Stormvirvel', icon: '🌪️', unlock: { kind: 'storm', n: 3 }, color: '#74c0fc' },
];

export const cosmetic = (id: string | undefined) => COSMETICS.find((c) => c.id === id);

export interface Wardrobe {
  v: number;
  owned: string[];
  worn: Partial<Record<LookSlot, string>>;
}

export const WARDROBE: RecordSpec<Wardrobe> = { version: 1, defaults: () => ({ v: 1, owned: [], worn: {} }) };

export const getWardrobe = (hid: string) => loadRecord(heroKey(hid, 'wardrobe'), WARDROBE).value;
const saveWardrobe = (hid: string, w: Wardrobe) => saveRecord(heroKey(hid, 'wardrobe'), WARDROBE, w);

export function unlockText(u: Unlock): string {
  switch (u.kind) {
    case 'mastare': return u.n === 1 ? 'Besegra en Mästare' : `Besegra ${u.n} Mästare`;
    case 'niva': return `Nå nivå ${u.n}`;
    case 'svit': return `Klara alla uppdrag ${u.n} dagar i rad`;
    case 'arena': return `Vinn över ${u.n} motståndare i Arenan`;
    case 'storm': return `Klara steg ${u.n} i Dimstormen`;
  }
}

/** Belöningar låses upp av saker som aldrig minskar (nivå, mentorer, längsta svit, arenasteg, stormsteg). */
export function unlocked(hid: string, u: Unlock): boolean {
  const s = getHeroState(hid);
  switch (u.kind) {
    case 'mastare': return s.mentors.length >= u.n;
    case 'niva': return s.level >= u.n;
    case 'svit': return bestStreak(hid) >= u.n;
    case 'arena': return s.arena.rank >= u.n;
    case 'storm': return s.storm.best >= u.n;
  }
}

export function owns(hid: string, c: Cosmetic, w = getWardrobe(hid)): boolean {
  return w.owned.includes(c.id) || (!!c.unlock && unlocked(hid, c.unlock));
}

export function buyCosmetic(hid: string, id: string): boolean {
  const c = cosmetic(id);
  const s = getHeroState(hid);
  if (!c || c.cost === undefined || owns(hid, c) || s.kastanjer < c.cost) return false;
  saveHeroState(hid, { ...s, kastanjer: s.kastanjer - c.cost });
  const w = getWardrobe(hid);
  saveWardrobe(hid, { ...w, owned: [...w.owned, c.id], worn: { ...w.worn, [c.slot]: c.id } });
  return true;
}

export function wear(hid: string, id: string): boolean {
  const c = cosmetic(id);
  if (!c || !owns(hid, c)) return false;
  const w = getWardrobe(hid);
  saveWardrobe(hid, { ...w, worn: { ...w.worn, [c.slot]: c.id } });
  return true;
}

export function takeOff(hid: string, slot: LookSlot) {
  const w = getWardrobe(hid);
  const worn = { ...w.worn };
  delete worn[slot];
  saveWardrobe(hid, { ...w, worn });
}

/** Det som faktiskt bärs: bara saker hjälten äger och som finns. */
export function wornLook(hid: string): Partial<Record<LookSlot, Cosmetic>> {
  const w = getWardrobe(hid);
  const out: Partial<Record<LookSlot, Cosmetic>> = {};
  for (const [slot, id] of Object.entries(w.worn) as [LookSlot, string][]) {
    const c = cosmetic(id);
    if (c && c.slot === slot && owns(hid, c, w)) out[slot] = c;
  }
  return out;
}
