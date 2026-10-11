import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, saveHeroState } from '../src/platform/profiles';
import { getInv, saveInv } from '../src/platform/rpg/inventory';
import { STATS, type Item } from '../src/platform/rpg/items';
import { caveKeep, caveLoadout, caveNumbers, finishCave, type CaveLoadout } from '../src/platform/rpg/grotta';
import type { OffKind, WeaponKind } from '../src/platform/rpg/dimstorm';
import { cosmetic, owns } from '../src/platform/rpg/wardrobe';
import { act, attackDir, BOSS_EVERY, descend, GH, goHome, GW, isOpen, monAt, MONS, newCave, pathTo, type Cave, type Mon } from '../src/minigames/grotta/sim';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'trollkarl', grade: 4 }).id;
const all = (n: number) => Object.fromEntries(STATS.map((s) => [s.id, n])) as Parameters<typeof caveNumbers>[0];
const lo = (n: number, weapon: WeaponKind = 'svard', off: OffKind = null, pet: string | null = null): CaveLoadout =>
  ({ weapon, weaponIcon: '', off, offIcon: '', pet, ...caveNumbers(all(n), weapon, off, 'trollkarl') });

/** En tom, upplyst våning där testet själv ställer ut saker. */
function blank(l: CaveLoadout): Cave {
  const c = newCave(l, 1);
  c.floor = { open: new Array(GW * GH).fill(true), seen: new Array(GW * GH).fill(true), start: { x: 4, y: 5 }, stairs: { x: 8, y: 10 }, mons: [], things: [], traps: [] };
  c.lit = new Array(GW * GH).fill(true);
  c.hero.x = 4; c.hero.y = 5;
  return c;
}
const mon = (c: Cave, x: number, y: number, hp = 50): Mon => {
  const m: Mon = { id: c.nextId++, kind: 'ratta', x, y, hp, maxHp: hp, dmg: 2, stun: 0, awake: false };
  c.floor.mons.push(m);
  return m;
};

/** En robot som går mot trappan, slåss med det som står i vägen och dricker när livet är lågt. */
function dive(c: Cave, maxDepth: number) {
  for (let i = 0; i < 3000; i++) {
    if (c.phase === 'stairs') { if (c.depth >= maxDepth) goHome(c); else descend(c); continue; }
    if (c.phase !== 'play') break;
    const h = c.hero;
    if (h.hp < h.maxHp * 0.4 && act(c, { kind: 'potion' })) continue;
    const adj = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).find(([dx, dy]) => monAt(c, h.x + dx, h.y + dy));
    if (adj) { act(c, { kind: 'dir', dx: adj[0], dy: adj[1] }); continue; }
    const p = pathTo(c, c.floor.stairs.x, c.floor.stairs.y, true);
    act(c, p ? { kind: 'dir', dx: p[0][0], dy: p[0][1] } : { kind: 'wait' });
  }
  return c;
}

describe('Grottdyket: våningarna', () => {
  it('trappan går alltid att nå, och allt står på golv och på olika rutor', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const c = newCave(lo(0), seed);
      for (let d = 1; d <= 11; d++) {
        const f = c.floor;
        expect(f.stairs).not.toEqual(f.start);
        expect(pathTo(c, f.stairs.x, f.stairs.y, true), `seed ${seed} våning ${d}`).not.toBeNull();
        const spots = [...f.mons, ...f.things, ...f.traps].map((t) => `${t.x},${t.y}`);
        for (const t of [...f.mons, ...f.things, ...f.traps]) expect(isOpen(f, t.x, t.y)).toBe(true);
        expect(new Set(spots).size).toBe(spots.length);
        expect(spots).not.toContain(`${f.start.x},${f.start.y}`);
        expect(f.mons.some((m) => m.kind === 'drake')).toBe(d % BOSS_EVERY === 0);
        c.phase = 'stairs';
        descend(c);
      }
    }
  });

  it('är deterministiskt för samma seed', () => {
    const a = dive(newCave(lo(5), 9), 4), b = dive(newCave(lo(5), 9), 4);
    expect([a.phase, a.depth, a.blad, a.turn]).toEqual([b.phase, b.depth, b.blad, b.turn]);
  });

  it('bättre utrustning tar dig djupare', () => {
    const deep = (n: number) => [1, 2, 3, 4, 5, 6].reduce((s, seed) => s + dive(newCave(lo(n, 'svard', 'skold', '🐸'), seed), 50).depth, 0);
    expect(deep(12)).toBeGreaterThan(deep(0));
  });
});

describe('Grottdyket: dragen', () => {
  it('svärdet slår monstret man går in i; yxan träffar alla bredvid', () => {
    const c = blank(lo(0, 'svard'));
    const a = mon(c, 5, 5), b = mon(c, 3, 5);
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    expect(a.hp).toBeLessThan(50);
    expect(b.hp).toBe(50);
    expect(c.hero.x).toBe(4);
    const y = blank(lo(0, 'yxa'));
    const ya = mon(y, 5, 5), yb = mon(y, 3, 5);
    act(y, { kind: 'dir', dx: 1, dy: 0 });
    expect(ya.hp).toBeLessThan(50);
    expect(yb.hp).toBeLessThan(50);
  });

  it('bågen skjuter rakt fram inom räckvidd, men inte genom väggar', () => {
    const c = blank(lo(0, 'bage'));
    const m = mon(c, 4, 9);
    expect(attackDir(c, 4, 9)).toEqual([0, 1]);
    act(c, { kind: 'dir', dx: 0, dy: 1 });
    expect(m.hp).toBeLessThan(50);
    expect(c.hero.y).toBe(5);
    c.floor.open[7 * GW + 4] = false;
    expect(attackDir(c, 4, 9)).toBeNull();
    expect(attackDir(blank(lo(0, 'svard')), 4, 9)).toBeNull();
  });

  it('hammaren gör monstret yrt så att det inte slår tillbaka', () => {
    const c = blank(lo(0, 'hammare'));
    const m = mon(c, 5, 5);
    c.lo.haste = 0;
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    expect(c.hero.hp).toBe(c.hero.maxHp);
    expect(m.stun).toBe(0);
  });

  it('en gömd fälla skadar, en upptäckt går man förbi', () => {
    const c = blank(lo(0));
    c.floor.traps = [{ x: 5, y: 5, seen: false }, { x: 6, y: 5, seen: true }];
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    expect(c.hero.hp).toBe(c.hero.maxHp - 4);
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    expect(c.hero.hp).toBe(c.hero.maxHp - 4);
    expect(c.floor.traps).toEqual([]);
  });

  it('kistan behöver en nyckel; saker ger blad och styrka för dyket', () => {
    const c = blank(lo(0));
    c.floor.things = [{ id: 1, kind: 'kista', x: 5, y: 5, v: 4 }, { id: 2, kind: 'nyckel', x: 6, y: 5, v: 1 }, { id: 3, kind: 'vass', x: 6, y: 6, v: 1 }];
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    expect(c.blad).toBe(0);
    expect(c.msg).toContain('låst');
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    act(c, { kind: 'dir', dx: -1, dy: 0 });
    expect(c.blad).toBe(4);
    expect(c.hero.keys).toBe(0);
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    act(c, { kind: 'dir', dx: 0, dy: 1 });
    expect(c.hero.dmgBonus).toBe(1);
  });

  it('en vägg kostar inget drag, och drycken läker', () => {
    const c = blank(lo(0));
    c.floor.open[5 * GW + 5] = false;
    expect(act(c, { kind: 'dir', dx: 1, dy: 0 })).toBe(false);
    expect(c.turn).toBe(0);
    expect(act(c, { kind: 'potion' })).toBe(false);
    c.hero.potions = 1; c.hero.hp = 10;
    expect(act(c, { kind: 'potion' })).toBe(true);
    expect(c.hero.hp).toBe(10 + c.lo.potionHeal);
  });

  it('trappan: djupare (och lite vila) eller hem', () => {
    const c = blank(lo(0));
    c.floor.stairs = { x: 5, y: 5 };
    c.hero.hp = 20;
    act(c, { kind: 'dir', dx: 1, dy: 0 });
    expect(c.phase).toBe('stairs');
    descend(c);
    expect([c.phase, c.depth, c.hero.hp]).toEqual(['play', 2, 25]);
    c.phase = 'stairs';
    goHome(c);
    expect(c.phase).toBe('home');
  });

  it('vägen man trycker fram går bara över sedda rutor och runt monster', () => {
    const c = blank(lo(0));
    for (let x = 0; x < GW; x++) if (x !== 4) c.floor.open[7 * GW + x] = false;
    mon(c, 4, 7);
    expect(pathTo(c, 4, 9)).toBeNull();
    c.floor.mons = [];
    expect(pathTo(c, 4, 9)).toHaveLength(4);
    c.floor.seen[8 * GW + 4] = false;
    expect(pathTo(c, 4, 9)).toBeNull();
  });

  it('alla monster har namn och ikon', () => {
    for (const m of Object.values(MONS)) expect(m.name && m.icon).toBeTruthy();
  });
});

describe('Grottdyket: belöningar', () => {
  it('hem = allt, faller man = hälften (uppåt); rekord och Kristallgrottan på våning 10', () => {
    expect(caveKeep(7, true)).toBe(7);
    expect(caveKeep(7, false)).toBe(4);
    const hid = hero();
    const k = getHeroState(hid).kastanjer;
    expect(finishCave(hid, { depth: 4, blad: 10, home: true })).toBe(10);
    expect(finishCave(hid, { depth: 2, blad: 5, home: false })).toBe(3);
    expect(getHeroState(hid)).toMatchObject({ kastanjer: k, blad: 13, grotta: { best: 4, dives: 2 } });
    expect(owns(hid, cosmetic('bg.grotta')!)).toBe(false);
    finishCave(hid, { depth: 10, blad: 0, home: false });
    expect(owns(hid, cosmetic('bg.grotta')!)).toBe(true);
  });

  it('caveLoadout läser utrustningen; lyktan lyser längre', () => {
    const hid = hero();
    const it = (id: string, base: string, slot: Item['slot']): Item => ({ id, base, slot, name: 'T', icon: '🏮', rarity: 0, ilvl: 1, stats: {}, plus: 0, foundAt: '' });
    expect(caveLoadout(hid)).toMatchObject({ weapon: 'nava', light: 3, range: 0 });
    saveInv(hid, { ...getInv(hid), items: [it('a', 'stav', 'vapen'), it('b', 'lykta', 'skold')], equipped: { vapen: 'a', skold: 'b' } });
    expect(caveLoadout(hid)).toMatchObject({ weapon: 'stav', off: 'lykta', light: 5, range: 3 });
  });

  it('gamla sparningar utan grotta får standardvärden', () => {
    const hid = hero();
    const { grotta: _, ...old } = getHeroState(hid);
    saveHeroState(hid, old as ReturnType<typeof getHeroState>);
    expect(getHeroState(hid).grotta).toEqual({ best: 0, dives: 0 });
  });
});
