import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, getProfile, heroKey, saveHeroState } from '../profiles';
import { randomSeed, rngFrom } from '../rng';
import { COSMETICS, giveCosmetic, owns, type Cosmetic } from './wardrobe';
import { fitUnique, generateItem, isPet, itemStats, scaleStats, statBudget, MAX_PLUS, salvageValue, STATS, uniqueItem, upgradeCost, type Item, type Rarity, type Slot, type Stat } from './items';
import { LOOT, PETS } from './balance';

// Packningen: föremål, utrustade föremål och oöppnade kistor.
// Kistor sparas med seed när de hittas – att öppna dem kan inte "slumpas om" genom att ladda om.

export interface Chest {
  id: string;
  seed: number;
  ilvl: number;
  minRarity: Rarity;
  kind: 'vanlig' | 'boss' | 'pionjar' | 'kopt' | 'dag' | 'spel' | 'vecka' | 'uppdrag';
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
  /** skold = Sköldamuletter: var och en räddar sviten en missad dag (saknas i äldre sparningar). */
  potions: { liv: number; skold?: number };
  bonusHints: { day: string; n: number };
}

export const INVENTORY: RecordSpec<Inventory> = {
  version: 3,
  defaults: () => ({ v: 3, items: [], equipped: {}, chests: [], pity: 0, capacity: LOOT.capacity, potions: { liv: 0 }, bonusHints: { day: '', n: 0 } }),
  migrations: {
    // v2: unika föremål (signatur, husdjur, Pionjärmanteln) fick för få egenskaper för sin nivå och sällsynthet.
    1: (old) => ({ ...old, v: 2, items: (old.items ?? []).map(fitUnique) }),
    // v3: husdjuren börjar som ovanliga (gröna) och kan växa när bossen besegras igen.
    2: (old) => ({ ...old, v: 3, items: (old.items ?? []).map((it: Item) => (isPet(it) ? petAt(it, PETS.rarity) : it)) }),
  },
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

/**
 * Hur många poäng som behövs per effekt-poäng: på högre hjältenivå krävs fler poäng för samma effekt
 * (nivå 1: ×1, nivå 10: ×2, nivå 19: ×3). Taken ligger kvar, så ny och bättre utrustning gör alltid nytta.
 */
export const statScale = (level: number) => 1 + (Math.max(1, level) - 1) / 9;

/** Egenskaperna som de verkar i strider och minispel. Det som visas för barnet är alltid heroStats(). */
export function effectiveStats(hid: string): Stats {
  const f = statScale(getHeroState(hid).level);
  const raw = heroStats(hid);
  return Object.fromEntries(STATS.map((s) => [s.id, raw[s.id] / f])) as Stats;
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

/** Vad en egenskap gör just nu, med hjältens egna siffror (visas när barnet trycker på den). raw = heroStats, scale = statScale(nivå). */
export function statExplain(stat: Stat, raw: Stats, ranger: boolean, scale = 1): string {
  const s = Object.fromEntries(STATS.map((x) => [x.id, raw[x.id] / scale])) as Stats;
  // Nästa steg i barnets egna (visade) poäng.
  const nextAt = (v: number, step: number, maxSteps: number) => (Math.floor(v / step) < maxSteps ? Math.ceil((Math.floor(v / step) + 1) * step * scale) : null);
  switch (stat) {
    case 'kraft': {
      const n = nextAt(s.kraft, 4, 4);
      return `Varje rätt svar i en strid gör ${effects.damage(s)} skada (utan utrustning 10).${n ? ` Vid ${n} Kraft blir det ${effects.damage({ ...s, kraft: n / scale })}.` : ' Det är max!'}`;
    }
    case 'skydd': {
      const h = effects.extraHearts(s), n = nextAt(s.skydd, 6, 3);
      return `${h ? `+${h} hjärta${h > 1 ? 'n' : ''} i bossstrider.` : 'Inga extra hjärtan än.'}${n ? ` Vid ${n} Skydd får du ${h + 1}.` : ''} I Arenan tål du också mer.`;
    }
    case 'tur':
      return `${Math.round(effects.critChance(s, ranger) * 100)} % chans till fullträff (+5 skada), och finare saker i skattkistorna.`;
    case 'visdom':
      return `+${Math.round(effects.xpBonus(s) * 100)} % XP på allt du gör (högst +25 %).`;
    case 'snabbhet':
      return effects.fastBonus(s) ? `Svarar du på under 6 sekunder i en strid gör du +${effects.fastBonus(s)} extra skada.` : 'Ger extra skada när du svarar snabbt i en strid. Du har ingen Snabbhet än.';
    case 'klurighet': {
      const h = effects.extraHints(s), n = nextAt(s.klurighet, 5, 2);
      return `${h ? `+${h} ledtråd${h > 1 ? 'ar' : ''} per dag.` : 'Inga extra ledtrådar än.'}${n ? ` Vid ${n} Klurighet får du ${h + 1}.` : ''}`;
    }
  }
}

/** Skillnad i egenskaper om man byter till `it` från det som sitter i samma plats nu. */
export function statDiff(it: Item, current: Item | undefined): Partial<Record<Stat, number>> {
  const a = itemStats(it), b = current ? itemStats(current) : {};
  const out: Partial<Record<Stat, number>> = {};
  for (const { id } of STATS) {
    const d = (a[id] ?? 0) - (b[id] ?? 0);
    if (d) out[id] = d;
  }
  return out;
}

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
  return openChestFull(hid, id)?.items ?? null;
}

/**
 * Öppnar en kista. En skattkista från Spelön (kind 'spel') ger varannan gång ett klädesplagg som bara
 * finns i skattkistor (om det finns något kvar att få), annars ett föremål. Allt bestäms av kistans seed.
 */
export function openChestFull(hid: string, id: string): { items: Item[]; look?: Cosmetic } | null {
  const inv = getInv(hid);
  const c = inv.chests.find((x) => x.id === id);
  if (!c) return null;
  if (c.kind === 'spel') {
    const rng = rngFrom(c.seed + 99);
    const left = COSMETICS.filter((x) => x.kista && !owns(hid, x));
    if (left.length && rng.next() < 0.5) {
      const look = rng.pick(left);
      giveCosmetic(hid, look.id);
      saveInv(hid, { ...inv, chests: inv.chests.filter((x) => x.id !== id) });
      return { items: [], look };
    }
  }
  const n = c.kind === 'pionjar' ? 2 : 1;
  if (spaceLeft(inv) < n) return null;
  const ranger = getProfile(hid)?.heroClass === 'ranger';
  const tur = effects.lootLuck(effectiveStats(hid), ranger);
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
  return { items: got };
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

/** Smälter alla vanliga (gråa) föremål som inte används. Returnerar antal föremål och blad. */
export function salvageCommon(hid: string): { n: number; blad: number } {
  const inv = getInv(hid);
  const melt = inv.items.filter((it) => it.rarity === 0 && !it.unique && !isEquipped(inv, it.id));
  if (!melt.length) return { n: 0, blad: 0 };
  const blad = melt.reduce((a, it) => a + salvageValue(it), 0);
  saveInv(hid, { ...inv, items: inv.items.filter((it) => !melt.includes(it)) });
  const s = getHeroState(hid);
  saveHeroState(hid, { ...s, blad: s.blad + blad });
  return { n: melt.length, blad };
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
  { id: 'skold', icon: '🧿', name: 'Sköldamulett', cost: 40, desc: 'Skyddar din svit en dag du inte hinner spela.' },
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
  if (id === 'liv') saveInv(hid, { ...inv, potions: { ...inv.potions, liv: inv.potions.liv + 1 } });
  if (id === 'skold') saveInv(hid, { ...inv, potions: { ...inv.potions, skold: (inv.potions.skold ?? 0) + 1 } });
  if (id === 'packning') saveInv(hid, { ...inv, capacity: inv.capacity + 5 });
  return true;
}

export function useLifePotion(hid: string): boolean {
  const inv = getInv(hid);
  if (inv.potions.liv < 1) return false;
  saveInv(hid, { ...inv, potions: { ...inv.potions, liv: inv.potions.liv - 1 } });
  return true;
}

/* ---------- unika föremål från bossar ---------- */

const PET_STAT: Record<string, Stat> = {
  halv: 'kraft', rel: 'skydd', period: 'tur', hm: 'snabbhet',
  'glomd-tia': 'kraft', 'lanade-inte': 'skydd', plus: 'tur', 'noll-ett': 'klurighet', granntabell: 'snabbhet',
  'raknade-antal': 'tur', 'fem-regeln': 'klurighet', teckenfel: 'skydd',
  'storre-namnare': 'kraft', 'adderade-namnare': 'snabbhet',
  'raknade-start-igen': 'snabbhet', 'vriden-form': 'klurighet', flyttade: 'tur', diagonal: 'skydd', 'lasta-slutet': 'kraft', 'bara-tva-sidor': 'skydd',
  'langa-ben': 'kraft', 'fel-skala': 'klurighet', 'raknade-omkrets': 'skydd', 'glomde-halvera': 'kraft', 'bara-synliga': 'tur', adderade: 'snabbhet',
  'radie-diameter': 'snabbhet', 'glomde-pi': 'tur',
  'enkel-konsonant': 'kraft', 'sj-ljud': 'klurighet', sarskrivning: 'tur',
  tvartom: 'snabbhet', bokstavligt: 'visdom', punkt: 'skydd', 'komma-och': 'tur',
  'fel-ordklass': 'klurighet', 'starkt-verb': 'kraft', 'inte-i-texten': 'visdom', 'fel-detalj': 'snabbhet',
  liknar: 'klurighet', 'falsk-van': 'tur', bokstavsljud: 'snabbhet', 'teen-ty': 'kraft', 'half-past': 'kraft', 'past-to': 'skydd',
  'som-svenska': 'visdom', 'tyst-bokstav': 'klurighet', 'glomt-s': 'kraft', 'svensk-ordfoljd': 'skydd',
  'harmar-sista': 'klurighet', 'missar-inte': 'visdom', 'ett-steg': 'snabbhet', 'vanster-hoger': 'skydd',
  'loop-antal': 'kraft', 'bara-forsta': 'tur', 'sista-blocket': 'klurighet', citat: 'visdom', 'range-noll': 'snabbhet',
  femgrupp: 'klurighet', 'rutor-inte-varde': 'visdom', 'nyckel-glomd': 'tur',
};

/** Ger husdjursföremålet för en tämjd boss (om det inte redan finns). */
export function givePetItem(hid: string, key: string, pet: { name: string; icon: string }, trap?: string): Item | null {
  const inv = getInv(hid);
  const base = `husdjur:${key}`;
  if (inv.items.some((x) => x.base === base)) return null;
  const main = PET_STAT[trap ?? ''] ?? 'visdom';
  const it = uniqueItem({ base, slot: 'husdjur', name: pet.name, icon: pet.icon, rarity: PETS.rarity, ilvl: PETS.ilvl, stats: { [main]: 4, klurighet: 1 }, flavor: PET_FLAVOR });
  saveInv(hid, { ...inv, items: [...inv.items, it] });
  return it;
}

const PET_FLAVOR = 'Tämjd i en bossstrid. Besegra bossen igen, så kan husdjuret växa sig starkare.';

/** Husdjuret på en viss sällsynthet: egenskaperna följer budgeten för nivå och sällsynthet, i samma proportioner. */
function petAt(it: Item, rarity: Rarity): Item {
  return { ...it, rarity, ilvl: PETS.ilvl, stats: scaleStats(it.stats, statBudget(PETS.ilvl, rarity)), flavor: PET_FLAVOR };
}

/** En boss som redan är tämjd besegras igen: kanske växer husdjuret ett steg. Returnerar det växta husdjuret. */
export function growPet(hid: string, key: string, roll = Math.random()): Item | null {
  const inv = getInv(hid);
  const it = inv.items.find((x) => x.base === `husdjur:${key}`);
  if (!it || it.rarity >= 4 || roll >= (PETS.grow[it.rarity] ?? 0)) return null;
  const grown = petAt(it, (it.rarity + 1) as Rarity);
  saveInv(hid, { ...inv, items: inv.items.map((x) => (x.id === it.id ? grown : x)) });
  return grown;
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

