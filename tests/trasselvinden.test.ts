import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState } from '../src/platform/profiles';
import { STATS } from '../src/platform/rpg/items';
import { finishKnut, knutLoadout, knutNumbers, knutResult, knutStarts, type KnutLoadout } from '../src/platform/rpg/trassel';
import { grantSpelTitlar } from '../src/platform/rpg/nycklar';
import type { OffKind, WeaponKind } from '../src/platform/rpg/dimstorm';
import { rngFrom } from '../src/platform/rng';
import {
  AREA, attack, bestNudge, BOSS_EVERY, crossings, gridFor, HERO, makeKnot, maxMons, MONS, moveDrag, grab, newGame, nextKnot, release,
  segCross, spawnEvery, step, useHint, type Game, type Mon,
} from '../src/minigames/trassel/sim';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'trollkarl', grade: 4 }).id;
const all = (n: number) => Object.fromEntries(STATS.map((s) => [s.id, n])) as Parameters<typeof knutNumbers>[0];
const lo = (n: number, weapon: WeaponKind = 'svard', off: OffKind = null, pet: string | null = null): KnutLoadout =>
  ({ weapon, weaponIcon: '', off, offIcon: '', pet, ...knutNumbers(all(n), weapon, off, 'trollkarl') });

/** Lägger alla pinnar på lösningen, som ett barn som drar en i taget. */
function solve(g: Game) {
  g.knot.goal.forEach((p, i) => { grab(g, i); moveDrag(g, p.x, p.y); release(g); });
}
const mon = (g: Game, x: number, y: number, hp = 50, kind: Mon['kind'] = 'ratta'): Mon => {
  const m: Mon = { id: g.nextId++, kind, x, y, hp, maxHp: hp, dmg: 3, speed: MONS[kind].speed, peg: 0, stun: 0, bite: 0.4, wob: 0 };
  g.mons.push(m);
  return m;
};
/** Ett spel utan monster som dyker upp av sig själva. */
const calm = (l: KnutLoadout, level = 1) => { const g = newGame(l, 7, level); g.spawnT = 1e9; g.bossT = null; return g; };

describe('Trasselvinden: knutarna', () => {
  it('korsningar räknas rätt', () => {
    expect(segCross({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true);
    expect(segCross({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 })).toBe(false);
    // En pinne mitt på ett rep den inte hör till räknas som en knut.
    expect(crossings([{ x: 0, y: 500 }, { x: 600, y: 500 }, { x: 300, y: 500 }, { x: 300, y: 900 }], [[0, 1], [2, 3]]).n).toBe(1);
  });

  it('varje knut går att lösa, börjar trasslig och håller ihop', () => {
    for (let l = 1; l <= 16; l++) for (let seed = 1; seed <= 25; seed++) {
      const k = makeKnot(l, rngFrom(seed * 101 + l));
      const [c, r] = gridFor(l);
      expect(k.pegs.length).toBe(c * r);
      expect(crossings(k.goal, k.edges).n, `knut ${l} seed ${seed}`).toBe(0);
      expect(crossings(k.pegs, k.edges).n, `knut ${l} seed ${seed}`).toBeGreaterThan(0);
      for (const p of [...k.pegs, ...k.goal]) {
        expect(p.x).toBeGreaterThanOrEqual(AREA.x0); expect(p.x).toBeLessThanOrEqual(AREA.x1);
        expect(p.y).toBeGreaterThanOrEqual(AREA.y0); expect(p.y).toBeLessThanOrEqual(AREA.y1);
      }
      const deg = k.pegs.map((_, i) => k.edges.filter(([a, b]) => a === i || b === i).length);
      expect(Math.min(...deg)).toBeGreaterThanOrEqual(2);
    }
  });

  it('det blir svårare: fler pinnar, fler och tätare monster', () => {
    for (let l = 1; l < 20; l++) {
      expect(gridFor(l + 1)[0] * gridFor(l + 1)[1]).toBeGreaterThanOrEqual(gridFor(l)[0] * gridFor(l)[1]);
      expect(spawnEvery(l + 1)).toBeLessThanOrEqual(spawnEvery(l));
      expect(maxMons(l + 1)).toBeGreaterThanOrEqual(maxMons(l));
    }
    expect(gridFor(1)[0] * gridFor(1)[1]).toBe(4);
    expect(spawnEvery(1)).toBeGreaterThanOrEqual(15);
  });

  it('löst knut ger blad och liv, och nästa knut är större', () => {
    const g = calm(lo(0));
    g.hp = 5;
    solve(g);
    expect(g.phase).toBe('solved');
    expect(g.solved).toBe(1);
    expect(g.blad).toBeGreaterThan(0);
    expect(g.hp).toBeGreaterThan(5);
    nextKnot(g);
    expect(g.phase).toBe('play');
    expect(g.level).toBe(2);
    expect(g.knot.pegs.length).toBe(6);
  });

  it('en knut löses inte medan barnet håller i en pinne', () => {
    const g = calm(lo(0));
    g.knot.goal.forEach((p, i) => { g.knot.pegs[i] = { ...p }; });
    grab(g, 0);
    moveDrag(g, g.knot.goal[0].x, g.knot.goal[0].y);
    step(g, 0.1);
    expect(g.phase).toBe('play');
    release(g);
    expect(g.phase).toBe('solved');
  });

  it('en klurig knuff minskar trasslet och kostar en knuff', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const g = newGame(lo(0), seed, 6);
      const before = g.cross, hints = g.hints;
      const b = bestNudge(g);
      expect(b).not.toBeNull();
      expect(useHint(g)).toBe(true);
      expect(g.cross).toBeLessThan(before);
      expect(g.hints).toBe(hints - 1);
    }
  });
});

describe('Trasselvinden: monstren', () => {
  it('få monster i början, Knuttrollet var femte knut', () => {
    const g = newGame(lo(0), 3, 1);
    for (let t = 0; t < 15; t += 0.05) step(g, 0.05);
    expect(g.mons.length).toBeLessThanOrEqual(1);
    const b = newGame(lo(0), 3, BOSS_EVERY);
    for (let t = 0; t < 7; t += 0.05) step(b, 0.05);
    expect(b.mons.some((m) => m.kind === 'troll')).toBe(true);
  });

  it('råttan går till hjälten och biter; utan motstånd faller hjälten', () => {
    const g = calm(lo(0));
    mon(g, 100, 100);
    for (let t = 0; t < 120 && g.phase === 'play'; t += 0.05) step(g, 0.05);
    expect(g.phase).toBe('dead');
    expect(g.hp).toBe(0);
  });

  it('spindeln rycker i en pinne, men inte i den barnet håller', () => {
    const g = calm(lo(0));
    g.knot.goal.forEach((p, i) => { g.knot.pegs[i] = { ...p }; });
    const s = mon(g, g.knot.pegs[0].x + 10, g.knot.pegs[0].y, 7, 'spindel');
    grab(g, 0);
    moveDrag(g, g.knot.goal[0].x, g.knot.goal[0].y);
    step(g, 0.05);
    expect(g.mons).toContain(s);
    release(g);
    expect(g.phase).toBe('solved');
    const h = calm(lo(0), 3);
    const at = { ...h.knot.pegs[0] };
    mon(h, at.x + 10, at.y, 7, 'spindel');
    step(h, 0.05);
    expect(h.mons.length).toBe(0);
    expect(h.knot.pegs[0]).not.toEqual(at);
  });

  it('ett tryck slår, sedan måste slaget laddas', () => {
    const g = calm(lo(0));
    const m = mon(g, 500, 500);
    expect(attack(g, m.id)).toBe(true);
    expect(m.hp).toBeLessThan(50);
    expect(attack(g, m.id)).toBe(false);
    step(g, g.lo.cd + 0.01);
    expect(attack(g, m.id)).toBe(true);
    expect(g.kills).toBe(0);
  });

  it('vapnen gör olika saker', () => {
    const yxa = calm(lo(0, 'yxa'));
    const [a, b] = [mon(yxa, 500, 500), mon(yxa, 560, 500)];
    attack(yxa, a.id);
    expect(b.hp).toBeLessThan(50);
    const stav = calm(lo(0, 'stav'));
    const [c, d] = [mon(stav, 300, 300), mon(stav, 600, 300)];
    attack(stav, c.id);
    expect(d.hp).toBeLessThan(50);
    const ham = calm(lo(0, 'hammare'));
    const e = mon(ham, 500, 500);
    attack(ham, e.id);
    expect(e.stun).toBeGreaterThan(0);
  });

  it('utrustning och egenskaper hjälper, med tak', () => {
    const weak = knutNumbers(all(0), 'nava', null), strong = knutNumbers(all(30), 'svard', 'skold');
    expect(strong.maxHp).toBeGreaterThan(weak.maxHp);
    expect(strong.dmg).toBeGreaterThan(weak.dmg);
    expect(strong.cd).toBeLessThan(weak.cd);
    expect(strong.hints).toBeGreaterThan(weak.hints);
    expect(strong.heal).toBeGreaterThan(weak.heal);
    const huge = knutNumbers(all(500), 'svard', 'skold');
    expect(huge.crit).toBeLessThanOrEqual(0.35);
    expect(huge.hints).toBeLessThanOrEqual(5);
    expect(huge.armor).toBeLessThanOrEqual(3);
    expect(knutNumbers(all(0), 'svard', 'lykta').slow).toBeLessThan(1);
    expect(knutLoadout(hero()).weapon).toBe('nava');
  });

  it('en hjälte som slår bort monstren klarar flera knutar', () => {
    const g = newGame(lo(5, 'svard'), 11, 1);
    for (let k = 0; k < 6; k++) {
      for (let t = 0; t < 40; t += 0.05) {
        step(g, 0.05);
        const m = [...g.mons].sort((a, b) => Math.hypot(a.x - HERO.x, a.y - HERO.y) - Math.hypot(b.x - HERO.x, b.y - HERO.y))[0];
        if (m) attack(g, m.id);
      }
      expect(g.phase).toBe('play');
      solve(g);
      expect(g.phase).toBe('solved');
      nextKnot(g);
    }
    expect(g.level).toBe(7);
    expect(g.kills).toBeGreaterThan(0);
  });
});

describe('Trasselvinden: framsteg', () => {
  it('sparar högsta knuten och bladen, och startpunkterna öppnas', () => {
    const id = hero();
    expect(knutStarts(0)).toEqual([1]);
    expect(knutStarts(5)).toEqual([1, 6]);
    expect(knutStarts(12)).toEqual([1, 6, 11]);
    const g = calm(lo(0), 6);
    solve(g);
    const r = knutResult(g);
    expect(r.best).toBe(6);
    nextKnot(g);
    expect(knutResult(g).best).toBe(6);
    finishKnut(id, r);
    finishKnut(id, { best: 2, blad: 1 });
    const s = getHeroState(id);
    expect(s.trassel).toEqual({ best: 6, runs: 2 });
    expect(s.blad).toBe(r.blad + 1);
    expect(knutResult(calm(lo(0), 6)).best).toBe(0);
  });

  it('skattrundan ger kistor varannan knut, högst tre', () => {
    const g = newGame(lo(0), 5, 1, true);
    g.spawnT = 1e9;
    for (let k = 0; k < 8; k++) { g.spawnT = 1e9; g.bossT = null; solve(g); nextKnot(g); }
    expect(g.skatter).toBe(3);
  });

  it('Knutmästaren efter knut 10', () => {
    const id = hero();
    finishKnut(id, { best: 10, blad: 0 });
    expect(grantSpelTitlar(id)).toContain('Knutmästaren');
  });
});
