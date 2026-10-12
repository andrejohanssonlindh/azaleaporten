import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, saveHeroState, type NewHero } from '../src/platform/profiles';
import { generateItem, RARITIES, rollRarity, statBudget, upgradeCost, type Item } from '../src/platform/rpg/items';
import {
  effectiveStats, statExplain, statScale,
  addChest, buy, ensurePioneerChest, equip, getInv, heroStats, openChest, salvage, saveInv, syncPetItems, upgrade, effects,
} from '../src/platform/rpg/inventory';
import { advance, bossHit, findNode, finishRun, getArea, getPlay, recordAnswer, runOver, savePlay, startRun, today, hintsLeft } from '../src/platform/rpg/progress';
import { minHits } from '../src/platform/rpg/balance';
import { TIDSTORNET } from '../src/games/klocka/content';
import type { BossDef, PathNode } from '../src/platform/rpg/types';
import { rngFrom } from '../src/platform/rng';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = (p: Partial<NewHero> = {}) => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'riddare', grade: 4, ...p }).id;
const node = (id: string) => findNode(TIDSTORNET, id) as PathNode;

function play(hid: string, n: PathNode, answers: boolean[], ms = 3000) {
  let run = startRun(hid, TIDSTORNET, n);
  for (const c of answers) {
    run = recordAnswer(hid, run, n, { correct: c, ms, hint: false }, 's');
    if (runOver(run)) break;
    run = advance(hid, run);
  }
  return finishRun(hid, TIDSTORNET, run);
}

/** Ett föremål med givna egenskaper, utrustat. */
function wear(hid: string, stats: Item['stats'], slot: Item['slot'] = 'vapen') {
  const it: Item = { id: 'x-' + slot, base: 'svard', slot, name: 'Test', icon: '🗡️', rarity: 4, ilvl: 10, stats, plus: 0, foundAt: '' };
  const inv = getInv(hid);
  saveInv(hid, { ...inv, items: [...inv.items, it] });
  equip(hid, it.id);
}

describe('föremål', () => {
  it('samma seed ger samma föremål', () => {
    const a = generateItem(123, { ilvl: 3 }), b = generateItem(123, { ilvl: 3 });
    expect({ ...a, id: '', foundAt: '' }).toEqual({ ...b, id: '', foundAt: '' });
  });
  it('egenskaperna följer budgeten och sällsyntheten', () => {
    for (let seed = 0; seed < 300; seed++) {
      const it = generateItem(seed, { ilvl: 1 + (seed % 9) });
      const sum = Object.values(it.stats).reduce((a, b) => a + b!, 0);
      expect(sum).toBe(Math.max(Object.keys(it.stats).length, statBudget(it.ilvl, it.rarity)));
      const [lo, hi] = RARITIES[it.rarity].stats;
      expect(Object.keys(it.stats).length).toBeGreaterThanOrEqual(lo);
      expect(Object.keys(it.stats).length).toBeLessThanOrEqual(hi);
      expect(it.name).toMatch(/ av /);
    }
  });
  it('tur ger finare skatter, minsta sällsynthet respekteras', () => {
    const avg = (tur: number) => { const r = rngFrom(1); let s = 0; for (let i = 0; i < 3000; i++) s += rollRarity(r, tur); return s / 3000; };
    expect(avg(30)).toBeGreaterThan(avg(0));
    const r = rngFrom(2);
    for (let i = 0; i < 200; i++) expect(rollRarity(r, 0, 2)).toBeGreaterThanOrEqual(2);
  });
});

describe('kistor och packning', () => {
  it('första klara banan ger en kista; den öppnas till exakt det föremål som seeden bestämde', () => {
    const hid = hero();
    const o = play(hid, node('minutvisaren'), Array(10).fill(true), 20_000);
    expect(o.chests).toHaveLength(1);
    const c = o.chests[0];
    const expected = generateItem(c.seed, { ilvl: c.ilvl, minRarity: c.minRarity, tur: 0 });
    const got = openChest(hid, c.id)!;
    expect(got[0].name).toBe(expected.name);
    expect(getInv(hid).chests).toHaveLength(0);
    expect(getInv(hid).items).toHaveLength(1);
  });

  it('garanterad kista efter tre rundor utan', () => {
    const hid = hero();
    let total = 0;
    for (let i = 0; i < 9; i++) total += play(hid, node('minutvisaren'), Array(10).fill(false)).chests.length;
    expect(total).toBeGreaterThanOrEqual(3);
  });

  it('trött hjälte hittar inga kistor', () => {
    const hid = hero();
    savePlay(hid, { ...getPlay(hid), activeMs: 31 * 60_000 });
    expect(play(hid, node('minutvisaren'), Array(10).fill(true), 20_000).chests).toHaveLength(0);
  });

  it('full packning: kistan väntar tills det finns plats', () => {
    const hid = hero();
    const inv = getInv(hid);
    saveInv(hid, { ...inv, capacity: 0 });
    const c = addChest(hid, { ilvl: 1, minRarity: 0, kind: 'vanlig', source: 't' });
    expect(openChest(hid, c.id)).toBeNull();
    expect(getInv(hid).chests).toHaveLength(1);
  });

  it('smälta ger blad, uppgradera kostar blad och kastanjer och höjer huvudegenskapen', () => {
    const hid = hero();
    const c = addChest(hid, { ilvl: 3, minRarity: 0, kind: 'vanlig', source: 't' });
    const [it] = openChest(hid, c.id)!;
    saveHeroState(hid, { ...getHeroState(hid), blad: 50, kastanjer: 100 });
    const before = Object.values(it.stats).reduce((a, b) => a + b!, 0);
    expect(upgrade(hid, it.id)).toBe(true);
    const cost = upgradeCost(it);
    expect(getHeroState(hid).blad).toBe(50 - cost.blad);
    equip(hid, it.id);
    expect(Object.values(heroStats(hid)).reduce((a, b) => a + b, 0)).toBe(before + 1);
    expect(salvage(hid, it.id)).toBe(0); // utrustad
  });

  it('butiken: kista, livsdryck och ledtrådsdryck', () => {
    const hid = hero();
    saveHeroState(hid, { ...getHeroState(hid), kastanjer: 100 });
    const hints = hintsLeft(hid);
    expect(buy(hid, 'ledtrad', today())).toBe(true);
    expect(hintsLeft(hid)).toBe(hints + 1);
    expect(buy(hid, 'liv', today())).toBe(true);
    expect(startRun(hid, TIDSTORNET, node('halvsaurus')).hearts).toBe(5); // 3 + riddare + dryck
    expect(buy(hid, 'kista', today())).toBe(true);
    expect(getInv(hid).chests).toHaveLength(1);
    expect(buy(hid, 'kista', today())).toBe(false); // för lite kastanjer kvar
  });

  it('Pionjärkistan ger ett sällsynt föremål och Pionjärmanteln', () => {
    const hid = hero();
    saveHeroState(hid, { ...getHeroState(hid), legacy: { pioneerChest: 'pending' } });
    ensurePioneerChest(hid);
    ensurePioneerChest(hid);
    expect(getInv(hid).chests).toHaveLength(1);
    const got = openChest(hid, getInv(hid).chests[0].id)!;
    expect(got.map((x) => x.name)).toContain('Pionjärmanteln');
    expect(got[0].rarity).toBeGreaterThanOrEqual(2);
    expect(getHeroState(hid).legacy.pioneerChest).toBe('opened');
  });
});

describe('utrustning i bossstrider – men aldrig på bekostnad av lärandet', () => {
  it('ingen utrustning kan vinna med färre rätta svar än minHits', () => {
    const hid = hero();
    wear(hid, { kraft: 99, snabbhet: 99, tur: 99 });
    for (const id of ['halvsaurus', 'tidens-vaktare']) {
      const b = node(id) as BossDef;
      const run = startRun(hid, TIDSTORNET, b);
      const maxDmg = Math.max(...Array.from({ length: 200 }, () => bossHit(hid, run, b, 100).dmg));
      expect(Math.ceil(run.maxHp! / maxDmg)).toBeGreaterThanOrEqual(minHits(b.kind, b.hp));
    }
    expect(minHits('mastare', 12)).toBeGreaterThanOrEqual(10);
  });

  it('kraft gör att bossen faller på färre träffar än utan utrustning', () => {
    const plain = hero();
    const strong = hero();
    wear(strong, { kraft: 16 });
    const hitsTo = (hid: string) => {
      let run = startRun(hid, TIDSTORNET, node('halvsaurus')), n = 0;
      while (!runOver(run)) { run = recordAnswer(hid, run, node('halvsaurus'), { correct: true, ms: 9000, hint: false }, 's'); n++; run = advance(hid, run); }
      return n;
    };
    expect(hitsTo(strong)).toBeLessThan(hitsTo(plain));
  });

  it('skydd ger hjärtan, visdom mer XP, klurighet fler ledtrådar', () => {
    const hid = hero({ heroClass: 'ranger' });
    const hints = hintsLeft(hid);
    wear(hid, { skydd: 12 }, 'kropp');
    wear(hid, { klurighet: 10 }, 'huvud');
    expect(startRun(hid, TIDSTORNET, node('halvsaurus')).hearts).toBe(5);
    expect(hintsLeft(hid)).toBe(hints + 2);
    expect(effects.xpBonus({ kraft: 0, skydd: 0, tur: 0, visdom: 100, snabbhet: 0, klurighet: 0 })).toBe(0.25);
  });

  it('tämjd boss blir ett husdjursföremål, även för bossar tämjda före fas 3', () => {
    const hid = hero();
    const o = play(hid, node('halvsaurus'), Array(8).fill(true));
    expect(o.gained.items?.[0].slot).toBe('husdjur');
    expect(o.chests[0].minRarity).toBe(2);
    const old = hero();
    saveHeroState(old, { ...getHeroState(old), pets: ['tidstornet:mumien'] });
    const lookup = (k: string) => (k === 'tidstornet:mumien' ? (node('mumien') as BossDef) : null);
    syncPetItems(old, lookup);
    syncPetItems(old, lookup);
    expect(getInv(old).items.filter((x) => x.slot === 'husdjur')).toHaveLength(1);
    expect(getArea(old, 'tidstornet')).toBeTruthy();
  });
});

describe('egenskapernas skala följer hjältens nivå', () => {
  it('samma utrustning verkar mindre på högre nivå, men det som visas är detsamma', () => {
    const hid = hero();
    const inv = getInv(hid);
    const it: Item = { ...generateItem(1, { ilvl: 5 }), stats: { kraft: 16 } };
    inv.items.push(it);
    inv.equipped.vapen = it.id;
    saveInv(hid, inv);
    expect(effectiveStats(hid).kraft).toBe(16);
    saveHeroState(hid, { ...getHeroState(hid), level: 10 });
    expect(statScale(10)).toBe(2);
    expect(heroStats(hid).kraft).toBe(16);
    expect(effectiveStats(hid).kraft).toBe(8);
    expect(statExplain('kraft', heroStats(hid), false, 2)).toContain('Vid 24 Kraft');
  });
});
