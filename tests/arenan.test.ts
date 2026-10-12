import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, saveHeroState } from '../src/platform/profiles';
import { getInv, saveInv } from '../src/platform/rpg/inventory';
import { STATS, type Item } from '../src/platform/rpg/items';
import { duelLoadout, duelNumbers, duelReward, MOVES, OPPONENTS, winArena, type DuelLoadout } from '../src/platform/rpg/arena';
import type { OffKind, WeaponKind } from '../src/platform/rpg/dimstorm';
import { cosmetic, owns } from '../src/platform/rpg/wardrobe';
import { newDuel, nextFoe, press, step, type Duel } from '../src/minigames/duell/sim';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'trollkarl', grade: 4 }).id;
const all = (n: number) => Object.fromEntries(STATS.map((s) => [s.id, n])) as Parameters<typeof duelNumbers>[0];
const lo = (n: number, w: WeaponKind = 'svard', off: OffKind = null, pet: string | null = null): DuelLoadout =>
  ({ weapon: w, weaponIcon: '', off, pet, ...duelNumbers(all(n), w, off, 'trollkarl') });
const tick = (d: Duel, secs: number) => { for (let i = 0; i < secs * 60; i++) step(d, 1 / 60); };

/**
 * En robot som spelar en hel kväll. `react` = hur långt innan slaget den hoppar, `miss` = chans att göra fel,
 * `mash` = trycker bara på Slå. Returnerar antal vinster.
 */
function evening(d: Duel, react: number, miss: number, mash = false) {
  let wins = 0, decided = -1;
  for (let i = 0; i < 60 * 600; i++) {
    if (d.phase === 'won') { wins++; if (d.foe.idx === OPPONENTS.length - 1) break; nextFoe(d); continue; }
    if (d.phase === 'lost') break;
    const f = d.foe, key = f.strikes * 10 + (f.lanes[2] ? 1 : 0);
    if (mash) press(d, 'attack');
    else if (f.state === 'wind' && f.t >= Math.max(f.dur - react, f.dur * 0.3) && decided !== key) {
      decided = key;
      if (d.rng.next() >= miss) {
        if (f.lanes.every(Boolean)) press(d, 'block');
        else if (f.lanes[1]) press(d, f.lanes[0] ? 'right' : 'left');
      }
    } else if (f.state === 'open') press(d, d.hero.special >= 1 ? 'special' : 'attack');
    step(d, 1 / 60);
  }
  return wins;
}

describe('Bossduellen: striden', () => {
  it('ett slag som missar gör motståndaren yr; då gör hjältens slag skada, annars blockerar den', () => {
    const d = newDuel(lo(0), 0, 1);
    press(d, 'attack');
    expect(d.foe.hp).toBe(OPPONENTS[0].hp);
    expect(d.fx.at(-1)!.text).toContain('Blockerat');
    tick(d, 1.3);
    expect(d.foe.state).toBe('wind');
    expect(d.foe.lanes).toEqual([false, true, false]);
    tick(d, d.foe.dur - d.foe.t - 0.3);
    press(d, 'left');
    tick(d, 0.4);
    expect(d.foe.state).toBe('open');
    expect(d.hero.hp).toBe(d.hero.maxHp);
    tick(d, 0.4);
    press(d, 'attack');
    expect(d.foe.hp).toBeLessThan(OPPONENTS[0].hp);
  });

  it('står man kvar i en röd bana blir man träffad; ett hopp för tidigt räcker inte', () => {
    const d = newDuel(lo(0), 0, 1);
    tick(d, 1.3);
    press(d, 'left');
    tick(d, d.foe.dur);
    expect(d.hero.hp).toBeLessThan(d.hero.maxHp);
    expect(d.hitsTaken).toBe(1);
  });

  it('stampen måste blockeras; skölden parerar helt och ger en öppning', () => {
    const stampa = (l: DuelLoadout) => {
      const d = newDuel(l, 3, 1);
      d.foe.state = 'wind'; d.foe.move = 'stamp'; d.foe.lanes = [...MOVES.stamp.lanes]; d.foe.hitsLeft = 1; d.foe.t = 0; d.foe.dur = 1;
      tick(d, 0.7);
      press(d, 'block');
      tick(d, 0.4);
      return d;
    };
    const naked = stampa(lo(0)), shield = stampa(lo(0, 'svard', 'skold'));
    expect(naked.hero.hp).toBeLessThan(naked.hero.maxHp);
    expect(naked.hero.maxHp - naked.hero.hp).toBeLessThan(OPPONENTS[3].atk);
    expect(naked.foe.state).not.toBe('open');
    expect(shield.hero.hp).toBe(shield.hero.maxHp);
    expect(shield.foe.state).toBe('open');
  });

  it('skölden parerar bara om man blockerar precis när slaget kommer', () => {
    const d = newDuel(lo(0, 'svard', 'skold'), 0, 1);
    d.foe.state = 'wind'; d.foe.move = 'slag'; d.foe.lanes = [...MOVES.slag.lanes]; d.foe.hitsLeft = 1; d.foe.t = 0; d.foe.dur = 1;
    tick(d, 0.5);
    press(d, 'block');
    tick(d, 0.6);
    expect(d.hero.hp).toBeLessThan(d.hero.maxHp);
    expect(d.foe.state).not.toBe('open');
  });

  it('finten byter sida halvvägs', () => {
    const d = newDuel(lo(0), 7, 1);
    d.foe.state = 'wind'; d.foe.move = 'finte'; d.foe.lanes = [...MOVES.finte.lanes]; d.foe.hitsLeft = 1; d.foe.t = 0; d.foe.dur = 1;
    expect(d.foe.lanes).toEqual([true, true, false]);
    tick(d, 0.6);
    expect(d.foe.lanes).toEqual([false, true, true]);
  });

  it('superslaget laddas av lyckade hopp och gör mycket skada', () => {
    const d = newDuel(lo(0), 0, 1);
    d.hero.special = 1;
    d.foe.state = 'open'; d.foe.dur = 2;
    press(d, 'special');
    expect(OPPONENTS[0].hp - d.foe.hp).toBeGreaterThanOrEqual(d.lo.dmg * 5);
    expect(d.hero.special).toBe(0);
  });

  it('att bara trycka på Slå vinner inte, men en bra spelare gör det', () => {
    for (const seed of [1, 2, 3]) {
      expect(evening(newDuel(lo(0), 0, seed), 0, 0, true)).toBe(0);
      expect(evening(newDuel(lo(0), 0, seed), 0.45, 0)).toBeGreaterThanOrEqual(3);
    }
  });

  it('utrustning hjälper en slarvig spelare längre upp på stegen', () => {
    const wins = (n: number) => [1, 2, 3, 4].reduce((s, seed) => s + evening(newDuel(lo(n, 'svard', 'skold', n ? '🐸' : null), 0, seed), 0.35, 0.3), 0);
    expect(wins(12)).toBeGreaterThan(wins(0));
  });

  it('nästa motståndare: hjälten får tillbaka en del av livet', () => {
    const d = newDuel(lo(0), 0, 1);
    d.hero.hp = 10;
    d.phase = 'won';
    nextFoe(d);
    expect(d.foe.idx).toBe(1);
    expect(d.hero.hp).toBe(10 + Math.round(d.hero.maxHp * 0.25));
    expect(d.phase).toBe('fight');
  });
});

describe('Bossduellen: utrustning och belöningar', () => {
  it('egenskaperna har tak och sköldplatsen gör olika saker', () => {
    const big = duelNumbers(all(999), 'svard', 'lykta', 'trollkarl');
    expect(big.maxHp).toBe(100);
    expect(big.windMult).toBeCloseTo(1.6);
    expect(big.crit).toBeLessThanOrEqual(0.35);
    expect(big.charge).toBeLessThanOrEqual(0.6);
    expect(duelNumbers(all(0), 'svard', 'skold').parry).toBe(true);
    expect(duelNumbers(all(0), 'bage', null).chip).toBeGreaterThan(0);
    expect(duelNumbers(all(0), 'svard', null).chip).toBe(0);
    expect(duelNumbers(all(0), 'stav', null).charge).toBeGreaterThan(duelNumbers(all(0), 'svard', null).charge);
  });

  it('duelLoadout läser utrustningen', () => {
    const hid = hero();
    const it = (id: string, base: string, slot: Item['slot']): Item => ({ id, base, slot, name: 'T', icon: '🔨', rarity: 0, ilvl: 1, stats: {}, plus: 0, foundAt: '' });
    saveInv(hid, { ...getInv(hid), items: [it('a', 'hammare', 'vapen'), it('b', 'skold', 'skold')], equipped: { vapen: 'a', skold: 'b' } });
    expect(duelLoadout(hid)).toMatchObject({ weapon: 'hammare', off: 'skold', parry: true });
  });

  it('vinster ger blad (aldrig kastanjer) och flyttar fram stegen; returmöten ger lite', () => {
    const hid = hero();
    const k = getHeroState(hid).kastanjer;
    expect(winArena(hid, 0)).toBe(1);
    expect(getHeroState(hid)).toMatchObject({ kastanjer: k, blad: 1, arena: { rank: 1, wins: 1 } });
    expect(winArena(hid, 0, true)).toBe(2);
    expect(getHeroState(hid).arena.rank).toBe(1);
    expect(duelReward(8, 8, false)).toBe(5);
    for (let i = 1; i < OPPONENTS.length; i++) winArena(hid, i);
    expect(getHeroState(hid).arena.rank).toBe(OPPONENTS.length);
    expect(owns(hid, cosmetic('mantel.arena')!)).toBe(true);
  });

  it('en gammal sparning med rank och vinster fungerar som förut', () => {
    const hid = hero();
    saveHeroState(hid, { ...getHeroState(hid), arena: { rank: 3, wins: 5 } });
    expect(winArena(hid, 3)).toBe(2);
    expect(getHeroState(hid).arena).toEqual({ rank: 4, wins: 6 });
  });
});
