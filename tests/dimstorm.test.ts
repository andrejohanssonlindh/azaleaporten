import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, saveHeroState } from '../src/platform/profiles';
import { getInv, saveInv } from '../src/platform/rpg/inventory';
import { STATS, type Item } from '../src/platform/rpg/items';
import { ARENA, giveTokens } from '../src/platform/rpg/arena';
import { finishStorm, offOf, stormLoadout, stormNumbers, stormReward, STORM_WAVES, weaponOf, type Loadout, type OffKind, type WeaponKind } from '../src/platform/rpg/dimstorm';
import { cosmetic, owns } from '../src/platform/rpg/wardrobe';
import { choose, H, needXp, newGame, step, UPS, W, wavesCleared, type Game } from '../src/minigames/dimstorm/sim';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'trollkarl', grade: 4 }).id;
const zero = () => Object.fromEntries(STATS.map((s) => [s.id, 0])) as Parameters<typeof stormNumbers>[0];
const all = (n: number) => Object.fromEntries(STATS.map((s) => [s.id, n])) as Parameters<typeof stormNumbers>[0];
const lo = (n: number, weapon: WeaponKind, off: OffKind = null, pet: string | null = null): Loadout =>
  ({ weapon, weaponIcon: '', off, offIcon: '', pet, ...stormNumbers(all(n), 'trollkarl') });
const item = (id: string, base: string, slot: Item['slot']): Item => ({ id, base, slot, name: 'T', icon: '🗡️', rarity: 0, ilvl: 1, stats: { kraft: 2 }, plus: 0, foundAt: '' });

/** En enkel spelare: håller sig mot mitten och springer ifrån monster som kommer nära. Väljer alltid första kraften. */
function play(l: Loadout, steg: number, seed: number) {
  const g = newGame(l, steg, seed);
  while ((g.phase === 'play' || g.phase === 'choose') && g.t < 400) {
    if (g.phase === 'choose') { choose(g, g.offer[0]); continue; }
    let dx = (W / 2 - g.hero.x) * 0.004, dy = (H / 2 - g.hero.y) * 0.004;
    for (const f of g.foes) {
      const ex = g.hero.x - f.x, ey = g.hero.y - f.y, d2 = ex * ex + ey * ey + 1;
      if (d2 < 120 * 120) { dx += (ex / d2) * 40; dy += (ey / d2) * 40; }
    }
    step(g, 1 / 60, { dx, dy });
  }
  return g;
}

describe('Dimstormen: utrustningen', () => {
  it('vapnet och sköldplatsen avgör hur man slåss; signaturföremål räknas som stav/trollbok', () => {
    expect(weaponOf(undefined)).toBe('nava');
    for (const b of ['svard', 'yxa', 'stav', 'bage', 'hammare'] as const) expect(weaponOf(item('x', b, 'vapen'))).toBe(b);
    expect(weaponOf(item('x', 'signatur:x', 'vapen'))).toBe('stav');
    expect(offOf(undefined)).toBe(null);
    expect(offOf(item('x', 'lykta', 'skold'))).toBe('lykta');
    expect(offOf(item('x', 'signatur:x', 'skold'))).toBe('trollbok');
  });

  it('alla egenskaper hjälper, men har tak', () => {
    const z = stormNumbers(zero(), 'trollkarl'), big = stormNumbers(all(10_000), 'trollkarl');
    expect(stormNumbers(all(5), 'trollkarl')).toMatchObject({ maxHp: 125, armor: 1 });
    expect(big.maxHp).toBe(200);
    expect(big.dmgMult).toBe(2);
    expect(big.crit).toBeLessThanOrEqual(0.35);
    expect(big.bladDrop).toBeLessThanOrEqual(0.04);
    expect(big.magnet).toBe(120);
    expect(big.choices).toBe(4);
    expect(z.choices).toBe(3);
    expect(stormNumbers(zero(), 'riddare').maxHp).toBe(z.maxHp + 20);
  });

  it('stormLoadout läser det hjälten har på sig', () => {
    const hid = hero();
    const inv = getInv(hid);
    saveInv(hid, { ...inv, items: [item('a', 'bage', 'vapen'), item('b', 'skold', 'skold')], equipped: { vapen: 'a', skold: 'b' } });
    expect(stormLoadout(hid)).toMatchObject({ weapon: 'bage', off: 'skold', pet: null });
  });
});

describe('Dimstormen: spelet', () => {
  it('är deterministiskt för samma seed', () => {
    const a = play(lo(5, 'svard'), 1, 7), b = play(lo(5, 'svard'), 1, 7);
    expect([a.phase, a.t, a.kills, a.picked]).toEqual([b.phase, b.t, b.kills, b.picked]);
  });

  it('bättre utrustning räcker längre, och högre steg är svårare', () => {
    const waves = (n: number, w: WeaponKind, steg: number) => [1, 2, 3].reduce((s, seed) => s + wavesCleared(play(lo(n, w, 'skold', '🐸'), steg, seed)), 0);
    expect(waves(12, 'svard', 1)).toBeGreaterThan(waves(0, 'nava', 1));
    expect(waves(12, 'svard', 1)).toBeGreaterThan(waves(12, 'svard', 5));
  });

  it('steg 1 går att vinna med lite utrustning: vågor, jätten och nivåer', () => {
    const g = play(lo(12, 'svard', 'skold', '🐸'), 1, 1);
    expect(g.phase).toBe('won');
    expect(wavesCleared(g)).toBe(STORM_WAVES + 1);
    expect(g.lvl).toBeGreaterThan(5);
    expect(g.t).toBeGreaterThan(STORM_WAVES * 30);
  });

  it('alla vapen och sköldplatser fungerar', () => {
    for (const w of ['svard', 'yxa', 'stav', 'bage', 'hammare', 'nava'] as const) {
      for (const off of ['skold', 'trollbok', 'lykta', null] as const) {
        const g = newGame(lo(5, w, off, '🐸'), 1, 3);
        for (let i = 0; i < 60 * 20 && g.phase !== 'lost'; i++) { if (g.phase === 'choose') choose(g, g.offer[0]); step(g, 1 / 60, { dx: Math.sin(i / 50), dy: Math.cos(i / 50) }); }
        expect(g.kills, `${w}/${off}`).toBeGreaterThan(0);
      }
    }
  });

  it('en ny nivå pausar spelet tills en kraft är vald', () => {
    const g: Game = newGame(lo(0, 'svard'), 1, 1);
    g.xp = needXp(1);
    step(g, 1 / 60, { dx: 0, dy: 0 });
    expect(g.phase).toBe('choose');
    expect(g.offer).toHaveLength(3);
    const t = g.t;
    step(g, 1, { dx: 0, dy: 0 });
    expect(g.t).toBe(t);
    const notOffered = (Object.keys(UPS) as (keyof typeof UPS)[]).find((id) => !g.offer.includes(id))!;
    choose(g, notOffered);
    expect(g.phase).toBe('choose');
    choose(g, g.offer[0]);
    expect(g.phase).toBe('play');
    expect(Object.values(g.ups).reduce((a, b) => a + b, 0)).toBe(1);
    for (const id of Object.keys(UPS) as (keyof typeof UPS)[]) expect(UPS[id].text('svard')[0]).toBeTruthy();
  });
});

describe('Dimstormen: belöningar', () => {
  it('ger blad (aldrig kastanjer); en vinst öppnar nästa steg och låser upp Stormvirveln på steg 3', () => {
    const hid = hero();
    const k = getHeroState(hid).kastanjer;
    expect(stormReward({ steg: 1, waves: STORM_WAVES + 1, won: true, picked: 4 })).toBe(4 + STORM_WAVES + 2);
    expect(finishStorm(hid, { steg: 1, waves: 2, won: false, picked: 1 })).toBe(3);
    expect(getHeroState(hid)).toMatchObject({ kastanjer: k, blad: 3, storm: { steg: 1, wins: 0, best: 0 } });
    finishStorm(hid, { steg: 1, waves: 6, won: true, picked: 0 });
    finishStorm(hid, { steg: 2, waves: 6, won: true, picked: 0 });
    expect(getHeroState(hid).storm).toEqual({ steg: 3, wins: 2, best: 2 });
    expect(owns(hid, cosmetic('aura.storm')!)).toBe(false);
    finishStorm(hid, { steg: 1, waves: 6, won: true, picked: 0 }); // ett lägre steg öppnar inget nytt
    expect(getHeroState(hid).storm.steg).toBe(3);
    finishStorm(hid, { steg: 3, waves: 6, won: true, picked: 0 });
    expect(owns(hid, cosmetic('aura.storm')!)).toBe(true);
  });

  it('gamla sparningar utan storm får standardvärden', () => {
    const hid = hero();
    const { storm: _, ...old } = getHeroState(hid);
    saveHeroState(hid, old as ReturnType<typeof getHeroState>);
    expect(getHeroState(hid).storm).toEqual({ steg: 1, wins: 0, best: 0 });
  });

  it('dagens uppdrag ger polletter upp till taket', () => {
    const hid = hero();
    expect(giveTokens(hid, ARENA.dailyTokens)).toBe(2);
    saveHeroState(hid, { ...getHeroState(hid), polletter: ARENA.maxTokens - 1 });
    expect(giveTokens(hid, ARENA.dailyTokens)).toBe(1);
    expect(getHeroState(hid).polletter).toBe(ARENA.maxTokens);
  });
});
