import { rngFrom, type Rng } from '../rng';

// Utrustning: bas + föremålsnivå + sällsynthet + slumpade egenskaper.
// Egenskaper påverkar ALDRIG vad som räknas som rätt, trösklar eller stjärnor (lärandets integritet);
// bara bossstridernas känsla, tur med skatter, XP och ledtrådar. Id:n (slot, bas, stat) är permanenta.

export type Slot = 'huvud' | 'kropp' | 'vapen' | 'skold' | 'amulett' | 'husdjur';
export type Stat = 'kraft' | 'skydd' | 'tur' | 'visdom' | 'snabbhet' | 'klurighet';
export type Rarity = 0 | 1 | 2 | 3 | 4;

export interface Item {
  id: string;
  base: string;
  slot: Slot;
  name: string;
  icon: string;
  rarity: Rarity;
  ilvl: number;
  stats: Partial<Record<Stat, number>>;
  /** Uppgraderingar i Smedjan (0–5). */
  plus: number;
  /** Unika föremål (bossar, pionjär) kan inte smältas. */
  unique?: boolean;
  flavor?: string;
  foundAt: string;
}

export const SLOTS: { id: Slot; name: string; icon: string }[] = [
  { id: 'huvud', name: 'Huvud', icon: '⛑️' }, { id: 'kropp', name: 'Kropp', icon: '🦺' }, { id: 'vapen', name: 'Vapen', icon: '🗡️' },
  { id: 'skold', name: 'Sköld/Bok', icon: '🛡️' }, { id: 'amulett', name: 'Amulett', icon: '📿' }, { id: 'husdjur', name: 'Husdjur', icon: '🐾' },
];

export const STATS: { id: Stat; name: string; icon: string; desc: string }[] = [
  { id: 'kraft', name: 'Kraft', icon: '⚔️', desc: 'Hårdare slag mot bossar' },
  { id: 'skydd', name: 'Skydd', icon: '🛡️', desc: 'Fler hjärtan i bossstrider (+1 per 6)' },
  { id: 'tur', name: 'Tur', icon: '🍀', desc: 'Finare skatter och fler fullträffar' },
  { id: 'visdom', name: 'Visdom', icon: '🦉', desc: 'Mer XP' },
  { id: 'snabbhet', name: 'Snabbhet', icon: '⚡', desc: 'Extra skada när du svarar snabbt i bossstrider' },
  { id: 'klurighet', name: 'Klurighet', icon: '💡', desc: 'Fler ledtrådar per dag (+1 per 5)' },
];

export const RARITIES = [
  { name: 'Vanlig', color: '#868e96', mult: 1, stats: [1, 1] },
  { name: 'Ovanlig', color: '#2f9e44', mult: 1.4, stats: [1, 2] },
  { name: 'Sällsynt', color: '#1c7ed6', mult: 1.9, stats: [2, 2] },
  { name: 'Episk', color: '#7048e8', mult: 2.5, stats: [2, 3] },
  { name: 'Legendarisk', color: '#e8590c', mult: 3.2, stats: [3, 3] },
] as const;

/** Grundvikter för sällsynthet. Tur flyttar vikt uppåt. */
const RARITY_WEIGHTS = [60, 28, 9, 2.5, 0.5];

interface Base { id: string; slot: Exclude<Slot, 'husdjur'>; noun: string; icon: string; stats: Stat[] }
// stats = egenskaper som basen gärna får.
const BASES: Base[] = [
  { id: 'svard', slot: 'vapen', noun: 'svärd', icon: '🗡️', stats: ['kraft', 'snabbhet'] },
  { id: 'yxa', slot: 'vapen', noun: 'yxa', icon: '🪓', stats: ['kraft', 'skydd'] },
  { id: 'stav', slot: 'vapen', noun: 'stav', icon: '🪄', stats: ['visdom', 'kraft'] },
  { id: 'bage', slot: 'vapen', noun: 'båge', icon: '🏹', stats: ['snabbhet', 'tur'] },
  { id: 'hammare', slot: 'vapen', noun: 'hammare', icon: '🔨', stats: ['kraft', 'klurighet'] },
  { id: 'hjalm', slot: 'huvud', noun: 'hjälm', icon: '⛑️', stats: ['skydd', 'kraft'] },
  { id: 'hatt', slot: 'huvud', noun: 'hatt', icon: '🎩', stats: ['visdom', 'klurighet'] },
  { id: 'luva', slot: 'huvud', noun: 'luva', icon: '🧢', stats: ['snabbhet', 'tur'] },
  { id: 'krona', slot: 'huvud', noun: 'krona', icon: '👑', stats: ['tur', 'visdom'] },
  { id: 'rustning', slot: 'kropp', noun: 'rustning', icon: '🦺', stats: ['skydd', 'kraft'] },
  { id: 'mantel', slot: 'kropp', noun: 'mantel', icon: '🧥', stats: ['visdom', 'tur'] },
  { id: 'tunika', slot: 'kropp', noun: 'tunika', icon: '👕', stats: ['snabbhet', 'skydd'] },
  { id: 'skold', slot: 'skold', noun: 'sköld', icon: '🛡️', stats: ['skydd', 'kraft'] },
  { id: 'trollbok', slot: 'skold', noun: 'trollbok', icon: '📕', stats: ['visdom', 'klurighet'] },
  { id: 'lykta', slot: 'skold', noun: 'lykta', icon: '🏮', stats: ['klurighet', 'tur'] },
  { id: 'amulett', slot: 'amulett', noun: 'amulett', icon: '📿', stats: ['tur', 'visdom'] },
  { id: 'ring', slot: 'amulett', noun: 'ring', icon: '💍', stats: ['kraft', 'snabbhet'] },
  { id: 'talisman', slot: 'amulett', noun: 'talisman', icon: '🧿', stats: ['skydd', 'klurighet'] },
];

const MATERIALS = ['Trä', 'Läder', 'Brons', 'Järn', 'Silver', 'Guld', 'Stjärn'];
const AFFIX: Record<Stat, string> = { kraft: 'styrka', skydd: 'skydd', tur: 'tur', visdom: 'visdom', snabbhet: 'snabbhet', klurighet: 'klurighet' };

/** Materialsteg ur föremålsnivån: 0 trä/läder … 6 stjärn. Används också för färgen på hjältefiguren. */
export const materialTier = (ilvl: number) => Math.max(0, Math.min(MATERIALS.length - 1, Math.floor((ilvl - 1) / 2)));

const materialFor = (base: Base, ilvl: number) => {
  const tier = materialTier(ilvl);
  // Läder passar bättre för luva/tunika/mantel, trä för stav/båge/sköld.
  const m = MATERIALS[tier];
  if (tier <= 1) return ['luva', 'tunika', 'mantel', 'hatt'].includes(base.id) ? 'Läder' : 'Trä';
  return m;
};

export function rollRarity(rng: Rng, tur: number, min: Rarity = 0): Rarity {
  const boost = 1 + Math.min(tur, 40) * 0.03;
  const w = RARITY_WEIGHTS.map((x, i) => (i < min ? 0 : i === 0 ? x : x * boost ** i));
  let r = rng.next() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i as Rarity; }
  return 4;
}

export const statBudget = (ilvl: number, rarity: Rarity) => Math.max(1, Math.round((2 + ilvl) * RARITIES[rarity].mult));

const statSum = (stats: Partial<Record<Stat, number>>) => Object.values(stats).reduce((a, b) => a + (b ?? 0), 0);

/**
 * Skalar upp egenskaperna så att de blir precis `budget` poäng, i samma proportioner (största resten först).
 * Sänker aldrig: ligger de redan över budgeten lämnas de som de är.
 */
export function fitBudget(stats: Partial<Record<Stat, number>>, budget: number): Partial<Record<Stat, number>> {
  const sum = statSum(stats);
  if (sum <= 0 || sum >= budget) return stats;
  const keys = (Object.keys(stats) as Stat[]).filter((k) => (stats[k] ?? 0) > 0);
  const exact = keys.map((k) => ((stats[k] ?? 0) * budget) / sum);
  const out = keys.map((_, i) => Math.floor(exact[i]));
  let left = budget - out.reduce((a, b) => a + b, 0);
  for (const i of keys.map((_, i) => i).sort((a, b) => (exact[b] - out[b]) - (exact[a] - out[a]))) { if (left-- <= 0) break; out[i]++; }
  return Object.fromEntries(keys.map((k, i) => [k, out[i]]));
}

/** Unika föremål följer samma budget som slumpade: nivå och sällsynthet bestämmer poängen. */
export const fitUnique = (it: Item): Item => (it.unique ? { ...it, stats: fitBudget(it.stats, statBudget(it.ilvl, it.rarity)) } : it);

let counter = 0;
const newId = () => `i-${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Slumpar ett föremål. Samma seed ger samma föremål (ett kistdrop kan inte slumpas om). */
export function generateItem(seed: number, opts: { ilvl: number; minRarity?: Rarity; tur?: number; slot?: Slot }): Item {
  const rng = rngFrom(seed);
  const rarity = rollRarity(rng, opts.tur ?? 0, opts.minRarity ?? 0);
  const pool = opts.slot && opts.slot !== 'husdjur' ? BASES.filter((b) => b.slot === opts.slot) : BASES;
  const base = rng.pick(pool);
  const [lo, hi] = RARITIES[rarity].stats;
  const nStats = lo + rng.int(hi - lo + 1);
  const chosen: Stat[] = [];
  for (const s of rng.shuffle(base.stats)) if (chosen.length < nStats) chosen.push(s);
  const others = rng.shuffle(STATS.map((s) => s.id).filter((s) => !chosen.includes(s)));
  while (chosen.length < nStats) chosen.push(others.shift()!);
  const budget = statBudget(opts.ilvl, rarity);
  const stats: Partial<Record<Stat, number>> = {};
  chosen.forEach((s) => { stats[s] = 1; });
  for (let left = budget - chosen.length; left > 0; left--) {
    const s = rng.next() < 0.55 ? chosen[0] : rng.pick(chosen);
    stats[s] = (stats[s] ?? 0) + 1;
  }
  const main = chosen.reduce((a, b) => ((stats[b] ?? 0) > (stats[a] ?? 0) ? b : a), chosen[0]);
  const noun = base.noun;
  const name = `${materialFor(base, opts.ilvl)}${noun} av ${AFFIX[main]}`;
  return { id: newId(), base: base.id, slot: base.slot, name, icon: base.icon, rarity, ilvl: opts.ilvl, stats, plus: 0, foundAt: new Date().toISOString() };
}

/** Egenskaper inklusive uppgraderingar (+1 på huvudegenskapen per plus). */
export function itemStats(it: Item): Partial<Record<Stat, number>> {
  if (!it.plus) return it.stats;
  const main = (Object.entries(it.stats) as [Stat, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
  return main ? { ...it.stats, [main]: (it.stats[main] ?? 0) + it.plus } : it.stats;
}

export const MAX_PLUS = 5;
export const salvageValue = (it: Item) => [1, 2, 4, 8, 16][it.rarity] + it.plus;
export const upgradeCost = (it: Item) => ({ blad: (it.plus + 1) * [2, 3, 4, 6, 8][it.rarity], kastanjer: (it.plus + 1) * 10 });

/** Unikt föremål (bossens signatur, husdjur, pionjär). */
export function uniqueItem(u: Omit<Item, 'id' | 'plus' | 'foundAt' | 'unique'>): Item {
  return fitUnique({ ...u, id: newId(), plus: 0, unique: true, foundAt: new Date().toISOString() });
}

export const statLine = (stats: Partial<Record<Stat, number>>) =>
  STATS.filter((s) => stats[s.id]).map((s) => `${s.icon} +${stats[s.id]} ${s.name}`).join(' · ');
