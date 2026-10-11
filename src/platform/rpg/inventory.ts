import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, getProfile, heroKey, saveHeroState } from '../profiles';
import { randomSeed } from '../rng';
import { generateItem, itemStats, MAX_PLUS, salvageValue, STATS, uniqueItem, upgradeCost, type Item, type Rarity, type Slot, type Stat } from './items';
import { LOOT } from './balance';

// Packningen: föremål, utrustade föremål och oöppnade kistor.
// Kistor sparas med seed när de hittas – att öppna dem kan inte "slumpas om" genom att ladda om.

export interface Chest {
  id: string;
  seed: number;
  ilvl: number;
  minRarity: Rarity;
  kind: 'vanlig' | 'boss' | 'pionjar' | 'kopt';
  source: string;
  at: string;
}

export interface Inventory {
  v: number;
  items: Item[];
  equipped: Partial<Record<Slot, string>>;
  chests: Chest[];
  /** Avslutade rundor sedan senaste kistan (garanterad kista efter LOOT.pityRuns). */
  pity: number;
  capacity: number;
  potions: { liv: number };
  bonusHints: { day: string; n: number };
}

export const INVENTORY: RecordSpec<Inventory> = {
  version: 1,
  defaults: () => ({ v: 1, items: [], equipped: {}, chests: [], pity: 0, capacity: LOOT.capacity, potions: { liv: 0 }, bonusHints: { day: '', n: 0 } }),
};

export const getInv = (hid: string) => loadRecord(heroKey(hid, 'inventory'), INVENTORY).value;
export const saveInv = (hid: string, inv: Inventory) => saveRecord(heroKey(hid, 'inventory'), INVENTORY, inv);

const chestId = () => `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ---------- egenskaper och deras effekter ---------- */

export type Stats = Record<Stat, number>;

export function heroStats(hid: string): Stats {
  const inv = getInv(hid);
  const out = Object.fromEntries(STATS.map((s) => [s.id, 0])) as Stats;
  for (const id of Object.values(inv.equipped)) {
    const it = inv.items.find((x) => x.id === id);
    if (!it) continue;
    for (const [k, v] of Object.entries(itemStats(it)) as [Stat, number][]) out[k] += v;
  }
  return out;
}

export const effects = {
  /** Skada per rätt svar i bossstrid (bossens HP = träffar × 10). */
  damage: (s: Stats) => 10 + Math.min(4, Math.floor(s.kraft / 4)),
  fastBonus: (s: Stats) => Math.min(4, Math.ceil(s.snabbhet / 3)),
  critChance: (s: Stats, ranger: boolean) => Math.min(0.25, s.tur * 0.02 + (ranger ? 0.05 : 0)),
  extraHearts: (s: Stats) => Math.floor(s.skydd / 6),
  xpBonus: (s: Stats) => Math.min(0.25, s.visdom * 0.02),
  extraHints: (s: Stats) => Math.min(2, Math.floor(s.klurighet / 5)),
  /** Tur för skattkistor (rangern får lite extra). */
  lootLuck: (s: Stats, ranger: boolean) => s.tur + (ranger ? 5 : 0),
};

/* ---------- kistor ---------- */

export function addChest(hid: string, c: Omit<Chest, 'id' | 'seed' | 'at'>): Chest {
  const inv = getInv(hid);
  const chest: Chest = { ...c, id: chestId(), seed: randomSeed(), at: new Date().toISOString() };
  saveInv(hid, { ...inv, chests: [...inv.chests, chest], pity: 0 });
  return chest;
}

export function bumpPity(hid: string) {
  const inv = getInv(hid);
  saveInv(hid, { ...inv, pity: inv.pity + 1 });
}

export const spaceLeft = (inv: Inventory) => inv.capacity - inv.items.length;

/** Öppnar en kista. Returnerar föremålen, eller null om packningen är full. */
export function openChest(hid: string, id: string): Item[] | null {
  const inv = getInv(hid);
  const c = inv.chests.find((x) => x.id === id);
  if (!c) return null;
  const n = c.kind === 'pionjar' ? 2 : 1;
  if (spaceLeft(inv) < n) return null;
  const ranger = getProfile(hid)?.heroClass === 'ranger';
  const tur = effects.lootLuck(heroStats(hid), ranger);
  const got: Item[] = [generateItem(c.seed, { ilvl: c.ilvl, minRarity: c.minRarity, tur })];
  if (c.kind === 'pionjar') {
    got.push(uniqueItem({
      base: 'pionjarmantel', slot: 'kropp', name: 'Pionjärmanteln', icon: '🧥', rarity: 3, ilvl: 4,
      stats: { visdom: 3, tur: 3, skydd: 2 }, flavor: 'Bara för hjältar som var med från allra första början.',
    }));
    const s = getHeroState(hid);
    saveHeroState(hid, { ...s, legacy: { ...s.legacy, pioneerChest: 'opened' } });
  }
  saveInv(hid, { ...inv, items: [...inv.items, ...got], chests: inv.chests.filter((x) => x.id !== id) });
  return got;
}

/** Skapar Pionjärkistan om hjälten har en som väntar (från importen av v0.1). */
export function ensurePioneerChest(hid: string) {
  const s = getHeroState(hid);
  const inv = getInv(hid);
  if (s.legacy.pioneerChest === 'pending' && !inv.chests.some((c) => c.kind === 'pionjar')) {
    addChest(hid, { ilvl: 4, minRarity: 2, kind: 'pionjar', source: 'Klockövning v0.1' });
  }
}

/* ---------- utrustning ---------- */

export function equip(hid: string, itemId: string) {
  const inv = getInv(hid);
  const it = inv.items.find((x) => x.id === itemId);
  if (!it) return;
  saveInv(hid, { ...inv, equipped: { ...inv.equipped, [it.slot]: it.id } });
}

export function unequip(hid: string, slot: Slot) {
  const inv = getInv(hid);
  const eq = { ...inv.equipped };
  delete eq[slot];
  saveInv(hid, { ...inv, equipped: eq });
}

export const isEquipped = (inv: Inventory, id: string) => Object.values(inv.equipped).includes(id);

/** Smälter ett föremål till azaleablad. Utrustade och unika föremål kan inte smältas. */
export function salvage(hid: string, itemId: string): number {
  const inv = getInv(hid);
  const it = inv.items.find((x) => x.id === itemId);
  if (!it || it.unique || isEquipped(inv, it.id)) return 0;
  const blad = salvageValue(it);
  saveInv(hid, { ...inv, items: inv.items.filter((x) => x.id !== itemId) });
  const s = getHeroState(hid);
  saveHeroState(hid, { ...s, blad: s.blad + blad });
  return blad;
}

export function canUpgrade(hid: string, it: Item): boolean {
  const s = getHeroState(hid), c = upgradeCost(it);
  return it.plus < MAX_PLUS && s.blad >= c.blad && s.kastanjer >= c.kastanjer;
}

export function upgrade(hid: string, itemId: string): boolean {
  const inv = getInv(hid);
  const it = inv.items.find((x) => x.id === itemId);
  if (!it || !canUpgrade(hid, it)) return false;
  const c = upgradeCost(it);
  const s = getHeroState(hid);
  saveHeroState(hid, { ...s, blad: s.blad - c.blad, kastanjer: s.kastanjer - c.kastanjer });
  saveInv(hid, { ...inv, items: inv.items.map((x) => (x.id === itemId ? { ...x, plus: x.plus + 1 } : x)) });
  return true;
}

/* ---------- butiken i Smedjan ---------- */

export const SHOP = [
  { id: 'kista', icon: '🎁', name: 'Skattkista', cost: 45, desc: 'En vanlig kista med ett föremål på din nivå.' },
  { id: 'ledtrad', icon: '💡', name: 'Ledtrådsdryck', cost: 15, desc: 'En extra ledtråd idag.' },
  { id: 'liv', icon: '🧪', name: 'Livsdryck', cost: 25, desc: '+1 hjärta i nästa bossstrid.' },
  { id: 'packning', icon: '🎒', name: 'Större packning', cost: 60, desc: '+5 platser i packningen.' },
] as const;

export function buy(hid: string, id: (typeof SHOP)[number]['id'], today: string): boolean {
  const item = SHOP.find((x) => x.id === id)!;
  const s = getHeroState(hid);
  if (s.kastanjer < item.cost) return false;
  if (id === 'packning' && getInv(hid).capacity >= LOOT.maxCapacity) return false;
  saveHeroState(hid, { ...s, kastanjer: s.kastanjer - item.cost });
  const inv = getInv(hid);
  if (id === 'kista') { addChest(hid, { ilvl: Math.max(1, Math.min(10, s.level)), minRarity: 0, kind: 'kopt', source: 'Smedjan' }); return true; }
  if (id === 'ledtrad') saveInv(hid, { ...inv, bonusHints: { day: today, n: (inv.bonusHints.day === today ? inv.bonusHints.n : 0) + 1 } });
  if (id === 'liv') saveInv(hid, { ...inv, potions: { liv: inv.potions.liv + 1 } });
  if (id === 'packning') saveInv(hid, { ...inv, capacity: inv.capacity + 5 });
  return true;
}

export function useLifePotion(hid: string): boolean {
  const inv = getInv(hid);
  if (inv.potions.liv < 1) return false;
  saveInv(hid, { ...inv, potions: { liv: inv.potions.liv - 1 } });
  return true;
}

/* ---------- unika föremål från bossar ---------- */

const PET_STAT: Record<string, Stat> = { halv: 'kraft', rel: 'skydd', period: 'tur', hm: 'snabbhet' };

/** Ger husdjursföremålet för en tämjd boss (om det inte redan finns). */
export function givePetItem(hid: string, key: string, pet: { name: string; icon: string }, trap?: string): Item | null {
  const inv = getInv(hid);
  const base = `husdjur:${key}`;
  if (inv.items.some((x) => x.base === base)) return null;
  const main = PET_STAT[trap ?? ''] ?? 'visdom';
  const it = uniqueItem({ base, slot: 'husdjur', name: pet.name, icon: pet.icon, rarity: 3, ilvl: 5, stats: { [main]: 4, klurighet: 1 }, flavor: 'Tämjd i en bossstrid. Följer dig överallt.' });
  saveInv(hid, { ...inv, items: [...inv.items, it] });
  return it;
}

/** Mästarens signaturföremål. */
export function giveSignatureItem(hid: string, key: string, sig: { name: string; slot: string; flavor: string }): Item | null {
  const inv = getInv(hid);
  const base = `signatur:${key}`;
  if (inv.items.some((x) => x.base === base)) return null;
  const slot = (['huvud', 'kropp', 'vapen', 'skold', 'amulett'].includes(sig.slot) ? sig.slot : 'amulett') as Slot;
  const icon = { huvud: '👑', kropp: '🧥', vapen: '🪄', skold: '📕', amulett: '⏳' }[slot as Exclude<Slot, 'husdjur'>];
  const it = uniqueItem({ base, slot, name: sig.name, icon, rarity: 4, ilvl: 9, stats: { kraft: 5, visdom: 5, tur: 4 }, flavor: sig.flavor });
  saveInv(hid, { ...inv, items: [...inv.items, it] });
  return it;
}

/** Säkerställer husdjursföremål för bossar som tämjdes innan utrustning fanns. */
export function syncPetItems(hid: string, lookup: (key: string) => { pet?: { name: string; icon: string }; trap?: string } | null) {
  for (const key of getHeroState(hid).pets) {
    const b = lookup(key);
    if (b?.pet) givePetItem(hid, key, b.pet, b.trap);
  }
}

