import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, saveHeroState } from '../src/platform/profiles';
import { KEYS } from '../src/platform/rpg/balance';
import { getInv, openChestFull, spaceLeft } from '../src/platform/rpg/inventory';
import { giveSkattkistor, grantSpelTitlar, payKey, rollKey } from '../src/platform/rpg/nycklar';
import { STATS } from '../src/platform/rpg/items';
import { caveNumbers, type CaveLoadout } from '../src/platform/rpg/grotta';
import { stormNumbers, type Loadout } from '../src/platform/rpg/dimstorm';
import { COSMETICS, owns } from '../src/platform/rpg/wardrobe';
import { BOSS_EVERY, descend, newCave, SKATT_MAX } from '../src/minigames/grotta/sim';
import { newGame, step, W, H } from '../src/minigames/dimstorm/sim';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'riddare', grade: 4 }).id;
const all = (n: number) => Object.fromEntries(STATS.map((s) => [s.id, n])) as Parameters<typeof caveNumbers>[0];

describe('spelnycklar', () => {
  it('hittas ibland, aldrig fler än taket, och läggs i ett minispel', () => {
    const hid = hero();
    expect(rollKey(hid, false, 0.99)).toBe(false);
    expect(rollKey(hid, false, 0)).toBe(true);
    expect(rollKey(hid, true, KEYS.bossChance - 0.01)).toBe(true);
    saveHeroState(hid, { ...getHeroState(hid), nycklar: KEYS.max });
    expect(rollKey(hid, true, 0)).toBe(false);
    expect(payKey(hid)).toBe(true);
    expect(getHeroState(hid).nycklar).toBe(KEYS.max - 1);
    saveHeroState(hid, { ...getHeroState(hid), nycklar: 0 });
    expect(payKey(hid)).toBe(false);
  });

  it('skattkistor ger minst ovanliga saker, eller kläder som bara finns i kistorna', () => {
    const hid = hero();
    const n = COSMETICS.filter((c) => c.kista).length;
    const chests = giveSkattkistor(hid, 99, 'Grottdyket');
    expect(chests).toHaveLength(KEYS.chestsPerRun);
    expect(getHeroState(hid).skatter).toBe(KEYS.chestsPerRun);
    giveSkattkistor(hid, 20, 'test');
    giveSkattkistor(hid, 20, 'test');
    let looks = 0;
    for (const c of getInv(hid).chests) {
      const got = openChestFull(hid, c.id)!;
      if (got.look) { looks++; expect(got.look.kista).toBe(true); expect(owns(hid, got.look)).toBe(true); }
      else for (const it of got.items) expect(it.rarity).toBeGreaterThanOrEqual(1);
    }
    expect(looks).toBeLessThanOrEqual(n);
    expect(spaceLeft(getInv(hid))).toBeGreaterThanOrEqual(0);
  });

  it('minispelstitlar delas ut en gång', () => {
    const hid = hero();
    saveHeroState(hid, { ...getHeroState(hid), grotta: { best: 10, dives: 3 } });
    expect(grantSpelTitlar(hid)).toEqual(['Djupdykaren']);
    expect(grantSpelTitlar(hid)).toEqual([]);
  });
});

describe('skattkistor i minispelen', () => {
  it('Grottdyket: bara i skattdyk, högst SKATT_MAX, alltid på bossvåningen', () => {
    const lo: CaveLoadout = { weapon: 'svard', weaponIcon: '', off: null, offIcon: '', pet: null, ...caveNumbers(all(5), 'svard', null, 'riddare') };
    for (let seed = 1; seed < 30; seed++) {
      const plain = newCave(lo, seed);
      expect(plain.floor.things.some((t) => t.kind === 'skatt')).toBe(false);
      const c = newCave(lo, seed, true);
      // Samma grotta i övrigt: skattkistan läggs till ovanpå.
      expect(c.floor.things.filter((t) => t.kind !== 'skatt')).toEqual(plain.floor.things);
      for (let d = 1; d < BOSS_EVERY; d++) { c.phase = 'stairs'; descend(c); }
      expect(c.skattUt).toBeLessThanOrEqual(SKATT_MAX);
      if (c.skattUt < SKATT_MAX) expect(c.floor.things.some((t) => t.kind === 'skatt')).toBe(true);
    }
  });

  it('Dimstormen: skattkistor dyker upp i våg 2 bara i en skattstorm', () => {
    const lo: Loadout = { weapon: 'svard', weaponIcon: '', off: null, offIcon: '', pet: null, ...stormNumbers(all(5), 'riddare') };
    const run = (skatt: boolean) => {
      const g = newGame(lo, 1, 7, skatt);
      for (let i = 0; i < 31 * 30; i++) { step(g, 1 / 30, { dx: 0, dy: 0 }); if (g.phase === 'choose') g.phase = 'play'; if (g.phase === 'lost') break; }
      return g;
    };
    const g = run(true);
    expect(g.skattUt + g.skatter).toBeGreaterThan(0);
    const d = g.drops.find((x) => x.kind === 'skatt');
    if (d) { expect(d.x).toBeGreaterThan(0); expect(d.x).toBeLessThan(W); expect(d.y).toBeLessThan(H); }
    expect(run(false).skattUt).toBe(0);
  });
});
