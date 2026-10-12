import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { kv } from '../src/platform/storage/kv';
import { heroKey } from '../src/platform/profiles';
import { getInv } from '../src/platform/rpg/inventory';
import { fitBudget, generateItem, itemStats, statBudget, uniqueItem, type Item } from '../src/platform/rpg/items';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const sum = (s: Partial<Record<string, number>>): number => Object.values(s).reduce<number>((a, b) => a + (b ?? 0), 0);

describe('Nivå och sällsynthet bestämmer egenskapspoängen', () => {
  it('fitBudget skalar upp i samma proportioner men sänker aldrig', () => {
    expect(fitBudget({ kraft: 5, visdom: 5, tur: 4 }, 35)).toEqual({ kraft: 13, visdom: 12, tur: 10 });
    expect(sum(fitBudget({ kraft: 5, visdom: 5, tur: 4 }, 35))).toBe(35);
    expect(fitBudget({ kraft: 20 }, 10)).toEqual({ kraft: 20 });
  });

  it('unika föremål får hela budgeten, och slår ett sämre föremål på lägre nivå', () => {
    const sig = uniqueItem({ base: 'signatur:x', slot: 'vapen', name: 'T', icon: '🪄', rarity: 4, ilvl: 9, stats: { kraft: 5, visdom: 5, tur: 4 } });
    expect(sum(sig.stats)).toBe(statBudget(9, 4));
    for (let seed = 1; seed < 200; seed++) {
      const it = generateItem(seed, { ilvl: 5, minRarity: 3 });
      if (it.rarity !== 3) continue;
      expect(sum(it.stats)).toBe(statBudget(5, 3));
      expect(sum(itemStats({ ...sig, plus: 5 }))).toBeGreaterThan(sum(itemStats({ ...it, plus: 5 })));
    }
  });

  it('migrering v1 → v2: gamla unika föremål får sin budget, allt annat är orört', () => {
    const old = JSON.parse(readFileSync('tests/fixtures/storage/inventory-v1.json', 'utf8'));
    kv.set(heroKey('h1', 'inventory'), old);
    const inv = getInv('h1');
    expect(inv.v).toBe(2);
    const by = (id: string) => inv.items.find((x) => x.id === id) as Item;
    expect(sum(by('i-sig').stats)).toBe(statBudget(9, 4));
    expect(by('i-sig').plus).toBe(5);
    expect(sum(by('i-pet').stats)).toBe(statBudget(5, 3));
    expect(by('i-pet').stats.visdom).toBeGreaterThan(by('i-pet').stats.klurighet!);
    expect(by('i-ham').stats).toEqual(old.items[2].stats);
    expect(inv.equipped).toEqual(old.equipped);
    expect(inv.pity).toBe(2);
  });
});
