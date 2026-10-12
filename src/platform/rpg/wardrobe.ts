import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, heroKey, saveHeroState } from '../profiles';
import { bestStreak } from '../learning/quests';
import { solidCount } from '../learning/skills';

// Garderoben: utseende för hjältefiguren. Köps i Skräddaren för kastanjer, eller låses upp som belöning.
// Rent utseende – påverkar inga egenskaper. Id:n är permanenta: byt aldrig namn, lägg till nya.

export type LookSlot = 'hatt' | 'mantel' | 'skor' | 'bakgrund' | 'aura';

export interface Unlock { kind: 'mastare' | 'niva' | 'svit' | 'arena' | 'storm' | 'grotta' | 'sitter'; n: number }

export interface Cosmetic {
  id: string;
  slot: LookSlot;
  name: string;
  icon: string;
  /** Pris i kastanjer, eller en belöning som låses upp. */
  cost?: number;
  unlock?: Unlock;
  /** Finns bara i skattkistor från Spelön. */
  kista?: boolean;
  /** Belöning för sista steget i ett äventyrsuppdrag (storuppdrag.ts). */
  uppdrag?: boolean;
  /** Vilken ritning HeroFigure använder (annars id:t). Låter flera plagg dela form men ha egna färger. */
  form?: string;
  /** Glitter: tecknet som gnistrar runt hjälten. */
  emoji?: string;
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
  { id: 'bg.grotta', slot: 'bakgrund', name: 'Kristallgrottan', icon: '💎', unlock: { kind: 'grotta', n: 10 }, color: '#2b2440', color2: '#63e6be' },
  { id: 'bg.tornet', slot: 'bakgrund', name: 'Tidstornet', icon: '🕰️', unlock: { kind: 'svit', n: 7 }, color: '#5f3dc4', color2: '#ffd43b' },

  { id: 'aura.gnistor', slot: 'aura', name: 'Gnistor', icon: '✨', cost: 80, color: '#ffd43b' },
  { id: 'aura.hjartan', slot: 'aura', name: 'Hjärtan', icon: '💖', cost: 80, color: '#f06595' },
  { id: 'aura.eld', slot: 'aura', name: 'Eldaura', icon: '🔥', unlock: { kind: 'niva', n: 10 }, color: '#ff6b00' },
  { id: 'aura.storm', slot: 'aura', name: 'Stormvirvel', icon: '🌪️', unlock: { kind: 'storm', n: 3 }, color: '#74c0fc' },
  { id: 'aura.visdom', slot: 'aura', name: 'Visdomsljus', icon: '💡', unlock: { kind: 'sitter', n: 15 }, color: '#ffe066' },
  { id: 'mantel.uggla', slot: 'mantel', name: 'Ugglemanteln', icon: '🦉', unlock: { kind: 'sitter', n: 40 }, color: '#8d5524', color2: '#ffe8cc' },

  // Mellanpris: många att välja bland.
  { id: 'hatt.keps.rod', slot: 'hatt', name: 'Röd keps', icon: '🧢', cost: 35, form: 'keps', color: '#e03131', color2: '#ffffff' },
  { id: 'hatt.keps.bla', slot: 'hatt', name: 'Blå keps', icon: '🧢', cost: 35, form: 'keps', color: '#1c7ed6', color2: '#ffd43b' },
  { id: 'hatt.mossa.rosa', slot: 'hatt', name: 'Rosa mössa', icon: '🎀', cost: 40, form: 'mossa', color: '#f783ac', color2: '#ffffff' },
  { id: 'hatt.mossa.gron', slot: 'hatt', name: 'Grön mössa', icon: '🟢', cost: 40, form: 'mossa', color: '#2f9e44', color2: '#ffe066' },
  { id: 'hatt.kaninoron', slot: 'hatt', name: 'Kaninöron', icon: '🐰', cost: 55, form: 'oron', color: '#f8f9fa', color2: '#faa2c1' },
  { id: 'hatt.kattoron', slot: 'hatt', name: 'Kattöron', icon: '🐱', cost: 55, form: 'kattoron', color: '#495057', color2: '#faa2c1' },
  { id: 'hatt.cowboy', slot: 'hatt', name: 'Cowboyhatt', icon: '🤠', cost: 60, form: 'cowboy', color: '#a0522d', color2: '#5c3a1a' },
  { id: 'hatt.kock', slot: 'hatt', name: 'Kockmössa', icon: '👨‍🍳', cost: 50, form: 'kock', color: '#ffffff', color2: '#dee2e6' },
  { id: 'hatt.rosett', slot: 'hatt', name: 'Stor rosett', icon: '🎀', cost: 45, form: 'rosett', color: '#e64980', color2: '#fcc2d7' },
  { id: 'hatt.solhatt', slot: 'hatt', name: 'Solhatt', icon: '👒', cost: 60, form: 'solhatt', color: '#ffe066', color2: '#f06595' },
  { id: 'hatt.tiara', slot: 'hatt', name: 'Tiara', icon: '💎', cost: 90, form: 'tiara', color: '#ced4da', color2: '#74c0fc' },
  { id: 'mantel.lila', slot: 'mantel', name: 'Lila mantel', icon: '🟪', cost: 45, color: '#7048e8', color2: '#d0bfff' },
  { id: 'mantel.orange', slot: 'mantel', name: 'Orange mantel', icon: '🟧', cost: 45, color: '#f76707', color2: '#ffd8a8' },
  { id: 'mantel.svart', slot: 'mantel', name: 'Svart mantel', icon: '⬛', cost: 55, color: '#212529', color2: '#c92a2a' },
  { id: 'mantel.randig', slot: 'mantel', name: 'Randig mantel', icon: '🦓', cost: 60, form: 'randig', color: '#1c7ed6', color2: '#ffffff' },
  { id: 'mantel.prickig', slot: 'mantel', name: 'Prickig mantel', icon: '🍄', cost: 60, form: 'prickig', color: '#e03131', color2: '#ffffff' },
  { id: 'mantel.hjartan', slot: 'mantel', name: 'Hjärtmantel', icon: '💗', cost: 70, form: 'hjartan', color: '#fcc2d7', color2: '#e64980' },
  { id: 'skor.rod', slot: 'skor', name: 'Röda skor', icon: '👠', cost: 30, color: '#e03131', color2: '#ffffff' },
  { id: 'skor.bla', slot: 'skor', name: 'Blå gympaskor', icon: '👟', cost: 35, color: '#1c7ed6', color2: '#ffffff' },
  { id: 'skor.rosa', slot: 'skor', name: 'Rosa skor', icon: '🩰', cost: 35, color: '#f783ac', color2: '#ffffff' },
  { id: 'skor.gron', slot: 'skor', name: 'Grodstövlar', icon: '🐸', cost: 40, color: '#40c057', color2: '#ffe066' },
  { id: 'bg.himmel', slot: 'bakgrund', name: 'Molnhimmel', icon: '☁️', cost: 45, form: 'himmel', color: '#74c0fc', color2: '#ffffff' },
  { id: 'bg.sno', slot: 'bakgrund', name: 'Snölandet', icon: '⛄', cost: 55, form: 'sno', color: '#e7f5ff', color2: '#a5d8ff' },
  { id: 'bg.oken', slot: 'bakgrund', name: 'Öknen', icon: '🏜️', cost: 55, form: 'oken', color: '#ffd8a8', color2: '#ffa94d' },
  { id: 'bg.hav.djup', slot: 'bakgrund', name: 'Under havet', icon: '🐠', cost: 70, form: 'undervatten', color: '#1864ab', color2: '#4dabf7' },
  { id: 'bg.godis', slot: 'bakgrund', name: 'Godislandet', icon: '🍭', cost: 80, form: 'godis', color: '#fcc2d7', color2: '#b2f2bb' },
  { id: 'aura.stjarnor', slot: 'aura', name: 'Stjärnor', icon: '⭐', cost: 70, emoji: '⭐', color: '#ffd43b' },
  { id: 'aura.bubblor', slot: 'aura', name: 'Bubblor', icon: '🫧', cost: 70, emoji: '🫧', color: '#a5d8ff' },
  { id: 'aura.fjarilar', slot: 'aura', name: 'Fjärilar', icon: '🦋', cost: 80, emoji: '🦋', color: '#74c0fc' },
  { id: 'aura.musik', slot: 'aura', name: 'Musiknoter', icon: '🎵', cost: 80, emoji: '🎵', color: '#b197fc' },
  { id: 'aura.snoflingor', slot: 'aura', name: 'Snöflingor', icon: '❄️', cost: 80, emoji: '❄️', color: '#d0ebff' },

  // Glitter och blixtar: dyrt och flashigt.
  { id: 'aura.blixtar', slot: 'aura', name: 'Blixtar', icon: '⚡', cost: 180, form: 'blixt', emoji: '⚡', color: '#ffe066' },
  { id: 'aura.glitterregn', slot: 'aura', name: 'Glitterregn', icon: '🌟', cost: 200, form: 'regn', color: '#fcc419', color2: '#f783ac' },
  { id: 'aura.diamanter', slot: 'aura', name: 'Diamanter', icon: '💎', cost: 160, emoji: '💎', color: '#74c0fc' },
  { id: 'aura.regnbage', slot: 'aura', name: 'Regnbåge', icon: '🌈', cost: 220, form: 'regnbage', emoji: '🌈', color: '#e64980' },
  { id: 'mantel.glitter', slot: 'mantel', name: 'Glittermantel', icon: '✨', cost: 160, form: 'glitter', color: '#be4bdb', color2: '#fff3bf' },
  { id: 'mantel.blixt', slot: 'mantel', name: 'Blixtmantel', icon: '⚡', cost: 170, form: 'blixt', color: '#1c1c3a', color2: '#ffe066' },
  { id: 'skor.glitter', slot: 'skor', name: 'Glitterskor', icon: '💫', cost: 140, form: 'glitter', color: '#e599f7', color2: '#fff3bf' },
  { id: 'skor.blixt', slot: 'skor', name: 'Blixtskor', icon: '⚡', cost: 150, form: 'blixt', color: '#fab005', color2: '#1c7ed6' },
  { id: 'hatt.glorian', slot: 'hatt', name: 'Glorian', icon: '😇', cost: 180, form: 'gloria', color: '#ffe066', color2: '#fff9db' },
  { id: 'bg.disco', slot: 'bakgrund', name: 'Discot', icon: '🪩', cost: 200, form: 'disco', color: '#2b1a4a', color2: '#f783ac' },

  // Bara i Spelöns skattkistor.
  { id: 'mantel.fevingar', slot: 'mantel', name: 'Févingar', icon: '🧚', kista: true, form: 'vingar', color: '#d0bfff', color2: '#fcc2d7' },
  { id: 'mantel.drakvingar', slot: 'mantel', name: 'Drakvingar', icon: '🐉', kista: true, form: 'drakvingar', color: '#2f9e44', color2: '#c0eb75' },
  { id: 'hatt.enhorning', slot: 'hatt', name: 'Enhörningshorn', icon: '🦄', kista: true, form: 'horn', color: '#ffd43b', color2: '#f783ac' },
  { id: 'hatt.raket', slot: 'hatt', name: 'Rymdhjälm', icon: '🧑‍🚀', kista: true, form: 'rymdhjalm', color: '#f8f9fa', color2: '#4dabf7' },
  { id: 'skor.raket', slot: 'skor', name: 'Raketskor', icon: '🚀', kista: true, form: 'raket', color: '#868e96', color2: '#ff6b00' },
  { id: 'aura.guldregn', slot: 'aura', name: 'Guldregn', icon: '🪙', kista: true, form: 'regn', color: '#fab005', color2: '#fff3bf' },
  { id: 'aura.regnbagsblixt', slot: 'aura', name: 'Regnbågsblixtar', icon: '🌈', kista: true, form: 'blixt', emoji: '🌈', color: '#f783ac' },
  { id: 'bg.rymden', slot: 'bakgrund', name: 'Rymden', icon: '🪐', kista: true, form: 'rymd', color: '#0b0b2b', color2: '#ffa94d' },

  // Belöningar från äventyrsuppdragens sista steg.
  { id: 'hatt.lagerkrans', slot: 'hatt', name: 'Lagerkransen', icon: '🏅', uppdrag: true, form: 'blomkrans', color: '#2f9e44', color2: '#fab005' },
  { id: 'aura.stjarnregn', slot: 'aura', name: 'Stjärnregn', icon: '🌠', uppdrag: true, form: 'regn', color: '#ffe066', color2: '#ffffff' },
  { id: 'mantel.tamjare', slot: 'mantel', name: 'Tämjarvingar', icon: '🐲', uppdrag: true, form: 'drakvingar', color: '#7048e8', color2: '#e599f7' },
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
    case 'grotta': return `Nå våning ${u.n} i Grottdyket`;
    case 'sitter': return `Få ${u.n} saker att sitta som berget (repetera dem flera dagar)`;
  }
}

/** Belöningar låses upp av saker som aldrig minskar (nivå, mentorer, längsta svit, arenasteg, stormsteg, grottdjup, saker som suttit som berget). */
export function unlocked(hid: string, u: Unlock): boolean {
  const s = getHeroState(hid);
  switch (u.kind) {
    case 'mastare': return s.mentors.length >= u.n;
    case 'niva': return s.level >= u.n;
    case 'svit': return bestStreak(hid) >= u.n;
    case 'arena': return s.arena.rank >= u.n;
    case 'storm': return s.storm.best >= u.n;
    case 'grotta': return s.grotta.best >= u.n;
    case 'sitter': return solidCount(hid) >= u.n;
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

/** Ger ett plagg (t.ex. ur en skattkista). */
export function giveCosmetic(hid: string, id: string) {
  const w = getWardrobe(hid);
  if (!w.owned.includes(id)) saveWardrobe(hid, { ...w, owned: [...w.owned, id] });
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
