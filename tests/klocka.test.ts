import { describe, expect, it } from 'vitest';
import { fmt, phraseKind, render, stMin, structs, tOf } from '../src/games/klocka/logic/language';
import { parseAny, parseTime } from '../src/games/klocka/logic/parse';
import { betweenSteps, diagBetween, diagnose, hmSwapTime } from '../src/games/klocka/logic/diagnose';
import { makeQ, MINS, type TimeQ, type BetweenQ } from '../src/games/klocka/logic/questions';
import { rngFrom } from '../src/platform/rng';

describe('svenskt tidsspråk', () => {
  it('alla 720 tider: varje formulering betyder rätt tid och kan tolkas tillbaka', () => {
    for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m++) {
      for (const s of structs(h, m)) {
        expect(stMin(s)).toBe(tOf(h, m));
        const p = parseAny(render(s));
        expect(p, render(s)).not.toBeNull();
        expect(tOf(p!.h12, p!.m)).toBe(tOf(h, m));
      }
    }
  });

  it('kända fraser', () => {
    expect(render(structs(2, 30)[0])).toBe('halv tre');
    expect(render(structs(2, 25)[0])).toBe('fem i halv tre');
    expect(render(structs(2, 45)[0])).toBe('kvart i tre');
    expect(render(structs(7, 0)[0])).toBe('prick sju');
    expect(phraseKind(structs(2, 25)[0])).toBe('i-halv');
  });

  it('tolkar dygnstid', () => {
    expect(parseAny('tio i halv elva på kvällen')).toMatchObject({ h24: 22, m: 20 });
    expect(parseAny('halv tolv på natten')).toMatchObject({ h24: 23, m: 30 });
    expect(parseAny('kvart i sju på morgonen')).toMatchObject({ h24: 6, m: 45 });
    expect(parseAny('14:35')).toMatchObject({ h24: 14, m: 35 });
    expect(parseAny('nonsens')).toBeNull();
    expect(parseTime('845')).toEqual({ h: 8, mn: 45 });
    expect(parseTime('24:00')).toEqual({ h: 0, mn: 0 });
  });
});

describe('diagnos', () => {
  const q = (h: number, m: number, isFm = true): TimeQ => ({ kind: 'time', mode: 'words', level: 2, h, m, isFm, s: structs(h, m)[0] });
  it('halv tre skrivet som 3:30 = fel timme', () => expect(diagnose(q(2, 30), 3, 30, null)).toBe('hour'));
  it('fem i halv tre skrivet som 2:35 = i/över', () => expect(diagnose(q(2, 25), 2, 35, null)).toBe('rel'));
  it('rätt urtavla men fel dygnshalva = period', () => expect(diagnose(q(2, 25, false), 2, 25, null)).toBe('period'));
  it('timme och minut omkastade', () => {
    const qq: TimeQ = { ...q(4, 10), mode: 'clock', s: structs(4, 10)[0] };
    expect(diagnose(qq, 10, 4, hmSwapTime(4, 10, 2))).toBe('hm');
  });

  it('tid emellan: 100 minuter per timme', () => {
    const b: BetweenQ = { kind: 'between', mode: 'between', level: 2,
      a: { h24: 9, m: 45, fmt: 'digits', s: structs(9, 45)[0] }, b: { h24: 11, m: 15, fmt: 'digits', s: structs(11, 15)[0] } };
    expect(diagBetween(b, 1, 70).tag).toBe('base100');
    expect(betweenSteps(9 * 60 + 45, 11 * 60 + 15)).toEqual(['09:45 → 10:00: 15 min', '10:00 → 11:00: 1 tim', '11:00 → 11:15: 15 min', '09:45 → 11:15: 1 tim 30 min']);
  });
});

describe('frågor', () => {
  it('samma frö ger samma frågor', () => {
    expect(makeQ('choice', 2, rngFrom(42))).toEqual(makeQ('choice', 2, rngFrom(42)));
  });
  it('flervalsfrågor har fyra olika alternativ med exakt ett rätt', () => {
    const rng = rngFrom(7);
    for (let i = 0; i < 300; i++) {
      const q = makeQ('choice', (i % 4) as 0 | 1 | 2 | 3, rng) as TimeQ;
      expect(q.opts).toHaveLength(4);
      expect(new Set(q.opts!.map((o) => o.text)).size).toBe(4);
      expect(q.opts!.filter((o) => o.tag === 'correct')).toHaveLength(1);
    }
  });
  it('minuter följer nivån', () => {
    const rng = rngFrom(3);
    for (let i = 0; i < 200; i++) expect(MINS[1]).toContain((makeQ('clock', 1, rng) as TimeQ).m);
  });
  it('fällan "halv" ger tider med halv', () => {
    const rng = rngFrom(9);
    for (let i = 0; i < 100; i++) expect((makeQ('words', 2, rng, 'halv') as TimeQ).s.halv).toBe(true);
  });
  it('tid emellan håller sig inom dygnet och nivåns längd', () => {
    const rng = rngFrom(5);
    for (let i = 0; i < 200; i++) {
      const q = makeQ('between', 1, rng) as BetweenQ;
      const d = q.b.h24 * 60 + q.b.m - (q.a.h24 * 60 + q.a.m);
      expect(d).toBeGreaterThanOrEqual(10);
      expect(d).toBeLessThanOrEqual(240);
      expect(fmt(q.b.h24, q.b.m) <= '23:59').toBe(true);
    }
  });
});
