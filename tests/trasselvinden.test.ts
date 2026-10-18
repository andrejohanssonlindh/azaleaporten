import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState } from '../src/platform/profiles';
import { STATS } from '../src/platform/rpg/items';
import { finishKnut, knutBest, knutLoadout, knutNumbers, knutResult, knutStarts, type KnutLoadout } from '../src/platform/rpg/trassel';
import { giveSkattkistor, grantSpelTitlar } from '../src/platform/rpg/nycklar';
import { KEYS } from '../src/platform/rpg/balance';
import { getInv } from '../src/platform/rpg/inventory';
import type { OffKind, WeaponKind } from '../src/platform/rpg/dimstorm';
import { rngFrom } from '../src/platform/rng';
import { AREA, attack, BOSS_EVERY, checkSolved, HERO, maxMons, MONS, nextKnot, segCross, spawnEvery, step, useHint, type Game, type Mon } from '../src/minigames/trassel/strid';
import { bestNudge, crossings, grab, gridFor, makeKnot, moveDrag, newGame, release, type PinnGame } from '../src/minigames/trassel/sim';
import { lagg, lyft, makeRep, MIN_FRIA_HAL, newRepGame, repFor, type RepKnut } from '../src/minigames/trassel/rep';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'trollkarl', grade: 4 }).id;
const all = (n: number) => Object.fromEntries(STATS.map((s) => [s.id, n])) as Parameters<typeof knutNumbers>[0];
const lo = (n: number, weapon: WeaponKind = 'svard', off: OffKind = null, pet: string | null = null): KnutLoadout =>
  ({ weapon, weaponIcon: '', off, offIcon: '', pet, ...knutNumbers(all(n), weapon, off, 'trollkarl') });

/** Lägger alla pinnar på lösningen, som ett barn som drar en i taget. */
function solve(g: PinnGame) {
  g.pz.goal.forEach((p, i) => { grab(g, i); moveDrag(g, p.x, p.y); release(g); });
}
const mon = (g: Game, x: number, y: number, hp = 50, kind: Mon['kind'] = 'ratta'): Mon => {
  const m: Mon = { id: g.nextId++, kind, x, y, hp, maxHp: hp, dmg: 3, speed: MONS[kind].speed, mal: 0, stun: 0, bite: 0.4, wob: 0 };
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
    expect(g.pz.pegs.length).toBe(6);
  });

  it('en knut löses inte medan barnet håller i en pinne', () => {
    const g = calm(lo(0));
    g.pz.goal.forEach((p, i) => { g.pz.pegs[i] = { ...p }; });
    grab(g, 0);
    moveDrag(g, g.pz.goal[0].x, g.pz.goal[0].y);
    step(g, 0.1);
    expect(g.phase).toBe('play');
    release(g);
    expect(g.phase).toBe('solved');
  });

  it('en klurig knuff minskar trasslet och kostar en knuff', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const g = newGame(lo(0), seed, 6);
      const before = g.pz.cross, hints = g.hints;
      const b = bestNudge(g.pz);
      expect(b).not.toBeNull();
      expect(useHint(g)).toBe(true);
      expect(g.pz.cross).toBeLessThan(before);
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
    g.pz.goal.forEach((p, i) => { g.pz.pegs[i] = { ...p }; });
    const s = mon(g, g.pz.pegs[0].x + 10, g.pz.pegs[0].y, 7, 'spindel');
    grab(g, 0);
    moveDrag(g, g.pz.goal[0].x, g.pz.goal[0].y);
    step(g, 0.05);
    expect(g.mons).toContain(s);
    release(g);
    expect(g.phase).toBe('solved');
    const h = calm(lo(0), 3);
    const at = { ...h.pz.pegs[0] };
    mon(h, at.x + 10, at.y, 7, 'spindel');
    step(h, 0.05);
    expect(h.mons.length).toBe(0);
    expect(h.pz.pegs[0]).not.toEqual(at);
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
    expect(s.trassel).toEqual({ best: 6, runs: 2, rep: 0 });
    expect(s.blad).toBe(r.blad + 1);
    expect(knutResult(calm(lo(0), 6)).best).toBe(0);
  });

  it('skattrundan ger kistor varannan knut, högst KEYS.chestsPerRun, i båda lägena', () => {
    const solveAny = (g: Game) => {
      if ('reps' in g.pz) for (const d of [...(g.pz as RepKnut).losning]) (g.pz as RepKnut).flytta(d);
      else solve(g as PinnGame);
      checkSolved(g);
    };
    for (const make of [newGame, newRepGame]) {
      const run = (skatt: boolean) => {
        const g: Game = make(lo(0), 5, 1, skatt);
        const got: number[] = [];
        for (let k = 0; k < 8; k++) {
          g.spawnT = 1e9; g.bossT = null;
          solveAny(g);
          expect(g.phase).toBe('solved');
          if (g.last!.skatt) got.push(g.solved);
          nextKnot(g);
        }
        return { g, got };
      };
      const t = run(true);
      expect(t.g.skatter).toBe(KEYS.chestsPerRun);
      expect(t.got).toEqual([2, 4, 6]);
      expect(knutResult(t.g).skatter).toBe(KEYS.chestsPerRun);
      expect(run(false).g.skatter).toBe(0);
    }
  });

  it('kistorna från en skattrunda hamnar i hjältens förråd', () => {
    const id = hero();
    const before = getInv(id).chests.length;
    giveSkattkistor(id, 2, 'Trasselvinden');
    expect(getInv(id).chests.length).toBe(before + 2);
    expect(getHeroState(id).skatter).toBe(2);
  });

  it('Knutmästaren efter knut 10', () => {
    const id = hero();
    finishKnut(id, { best: 10, blad: 0 });
    expect(grantSpelTitlar(id)).toContain('Knutmästaren');
  });
});

/** Repknutens läge som text: hålen och lagerordningen. */
const snap = (pz: RepKnut) => JSON.stringify(pz.reps.map((r) => [r.a, r.b, r.z]));

describe('Trasselvinden: repknutar', () => {
  it('varje repknut börjar trasslig och går att lösa på par drag', () => {
    for (let l = 1; l <= 16; l++) for (let seed = 1; seed <= 25; seed++) {
      const pz = makeRep(l, rngFrom(seed * 77 + l));
      const { reps, cols, rows } = repFor(l);
      expect(pz.reps.length).toBe(reps);
      expect(pz.holes.length).toBe(cols * rows);
      expect(new Set(pz.reps.flatMap((r) => [r.a, r.b])).size).toBe(reps * 2);
      expect(pz.cross, `knut ${l} seed ${seed}`).toBeGreaterThan(0);
      expect(pz.par).toBe(pz.losning.length);
      for (const d of pz.losning) expect(pz.flytta(d), `knut ${l} seed ${seed}`).toBe(true);
      expect(pz.cross, `knut ${l} seed ${seed}`).toBe(0);
      expect(pz.moves).toBe(pz.par);
    }
  });

  it('pluggade hål: aldrig använda, alltid några hål kvar, och knuten går ändå att lösa', () => {
    for (let l = 1; l <= 16; l++) for (let seed = 1; seed <= 25; seed++) {
      const pz = makeRep(l, rngFrom(seed * 31 + l));
      const { reps, pluggar } = repFor(l);
      expect(pz.plugs.size).toBe(pluggar);
      expect(pz.freeHoles().length).toBeGreaterThanOrEqual(MIN_FRIA_HAL);
      for (const d of pz.losning) {
        expect(pz.plugs.has(d.to)).toBe(false);
        expect(pz.flytta(d)).toBe(true);
        for (const r of pz.reps) { expect(pz.plugs.has(r.a)).toBe(false); expect(pz.plugs.has(r.b)).toBe(false); }
      }
      expect(pz.cross).toBe(0);
      expect(pz.reps.some((_, i) => pz.overPlug(i))).toBe(false);
      expect(reps).toBe(pz.reps.length);
    }
    expect(repFor(1).pluggar).toBeGreaterThan(0);
    expect(repFor(12).pluggar).toBeGreaterThan(repFor(2).pluggar);
  });

  it('en ände går inte att lägga i en plugg, och ett rep över en plugg är trassligt', () => {
    const g = newRepGame(lo(0), 3, 8);
    g.spawnT = 1e9;
    const pz = g.pz, top = pz.topp(), plug = [...pz.plugs][0];
    expect(lyft(g, top, 0)).toBe(true);
    expect(lagg(g, plug)).toBe(false);
    expect(g.msg).toContain('pluggat');
    expect(pz.moves).toBe(0);
    // Ett ensamt rep rakt över en plugg räknas som en knut.
    const solo = new (pz.constructor as typeof RepKnut)(1, 3, 1, [{ a: 0, b: 2, z: 0, farg: 0 }]);
    expect(solo.cross).toBe(0);
    solo.plugs.add(1);
    solo.measure();
    expect(solo.cross).toBe(1);
    expect(solo.fria.size).toBe(0);
  });

  it('det blir svårare: fler rep och fler trasselsteg', () => {
    for (let l = 1; l < 20; l++) {
      expect(repFor(l + 1).reps).toBeGreaterThanOrEqual(repFor(l).reps);
      expect(repFor(l + 1).steg).toBeGreaterThanOrEqual(repFor(l).steg);
    }
    expect(repFor(1).reps).toBe(2);
  });

  it('ett rep med ett annat rep ovanpå går inte att lyfta; ett flyttat rep hamnar överst', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const g = newRepGame(lo(0), seed, 6);
      g.spawnT = 1e9;
      const pz = g.pz;
      const under = pz.reps.findIndex((_, i) => pz.covered(i));
      expect(under).toBeGreaterThanOrEqual(0);
      expect(lyft(g, under, 0)).toBe(false);
      expect(pz.held).toBeNull();
      expect(g.msg).toContain('ovanpå');
      const top = pz.topp();
      expect(pz.covered(top)).toBe(false);
      expect(lyft(g, top, 1)).toBe(true);
      expect(lagg(g, pz.freeHoles()[0])).toBe(true);
      expect(pz.topp()).toBe(top);
      expect(pz.moves).toBe(1);
      // Ett upptaget hål eller ett släpp utanför flyttar ingenting.
      lyft(g, top, 0);
      expect(lagg(g, pz.reps.find((_, i) => i !== top)!.a)).toBe(false);
      lyft(g, top, 0);
      expect(lagg(g, null)).toBe(false);
      expect(pz.moves).toBe(1);
    }
  });

  it('spindelns trassel går alltid att ta tillbaka med ett drag', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const pz = makeRep(1 + (seed % 12), rngFrom(seed));
      const before = snap(pz);
      const back = pz.bakat(rngFrom(seed + 999))!;
      expect(back).not.toBeNull();
      expect(pz.covered(back.rep)).toBe(false);
      expect(pz.flytta(back)).toBe(true);
      expect(snap(pz)).toBe(before);
    }
  });

  it('spindeln väntar medan barnet håller i ett rep, och höjer par', () => {
    const g = newRepGame(lo(0), 4, 3);
    g.spawnT = 1e9;
    const pz = g.pz, par = pz.par;
    lyft(g, pz.topp(), 0);
    expect(pz.trassla(0, rngFrom(1))).toBe(false);
    pz.slapp();
    expect(pz.trassla(0, rngFrom(1))).toBe(true);
    expect(pz.par).toBe(par + 1);
  });

  it('den kluriga knuffen hjälper nästan alltid hela vägen', () => {
    let ok = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const pz = makeRep(2 + (seed % 12), rngFrom(seed * 13));
      for (let k = 0; k < 40 && pz.cross > 0; k++) if (pz.knuff() === null) break;
      if (pz.cross === 0) ok++;
    }
    expect(ok).toBeGreaterThanOrEqual(36);
  });

  it('få drag ger extra blad', () => {
    const g = newRepGame(lo(0), 8, 6);
    g.spawnT = 1e9; g.bossT = null;
    for (const d of [...g.pz.losning]) { lyft(g, d.rep, d.end); lagg(g, d.to); }
    expect(g.phase).toBe('solved');
    expect(g.last!.bonus).toBeGreaterThan(0);
    const h = newRepGame(lo(0), 8, 6);
    h.spawnT = 1e9; h.bossT = null;
    h.pz.par = 0;
    for (const d of [...h.pz.losning]) { lyft(h, d.rep, d.end); lagg(h, d.to); }
    expect(h.last!.bonus).toBe(0);
  });

  it('repknutarna har ett eget rekord och en egen titel', () => {
    const id = hero();
    finishKnut(id, { best: 10, blad: 3 }, 'rep');
    const s = getHeroState(id);
    expect(s.trassel).toEqual({ best: 0, runs: 1, rep: 10 });
    expect(knutBest(s, 'rep')).toBe(10);
    expect(knutBest(s, 'pinnar')).toBe(0);
    expect(grantSpelTitlar(id)).toContain('Repmästaren');
  });
});
