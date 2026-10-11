import { beforeEach, describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { diagnoseAny, explainAny, parseAnswer } from '../src/engines/drill/check';
import { makeQ as makeT, diagnose as diagT, type TQ } from '../src/games/tiokompis/logic';
import { makeQ as makeM, diagnose as diagM, type MQ } from '../src/games/tabeller/logic';
import { tiokompisGame } from '../src/games/tiokompis';
import { tabellerGame } from '../src/games/tabeller';
import { PLAYABLE } from '../src/content/areas';
import { createHero, getHeroState } from '../src/platform/profiles';
import { advance, currentQuestion, finishRun, getArea, nextOpenNode, recordAnswer, runOver, startRun } from '../src/platform/rpg/progress';
import { allNodes, type AreaDef, type PathNode } from '../src/platform/rpg/types';
import { freshStorage } from './helpers';

const SEEDS = 400;
/** Text som säger vad svaret är: "= 13", "är 13", "blir 13". */
const reveals = (n: number) => new RegExp(`(=|är|blir)\\s+${n}(?![0-9])`);
const each = <Q,>(make: (s: { mode: string; level: number; trap?: string }, r: ReturnType<typeof rngFrom>) => Q, mode: string, level: number, trap?: string) =>
  Array.from({ length: SEEDS }, (_, i) => make({ mode, level, trap }, rngFrom(i * 7919 + level)));

describe('Tiokompisbron: frågorna', () => {
  it('alla lägen och nivåer: rätt räknat, heltal 0–100, en ruta', () => {
    for (const mode of ['par', 'plus', 'minus', 'saknas']) for (let level = 0; level <= 3; level++) {
      for (const q of each(makeT, mode, level)) {
        expect(q.op === '+' ? q.a + q.b : q.a - q.b).toBe(q.c);
        for (const n of [q.a, q.b, q.c]) { expect(Number.isInteger(n)).toBe(true); expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(100); }
        expect(q.parts.filter((p) => p === null)).toHaveLength(1);
        expect(q.answer).toBe([q.a, q.b, q.c][q.blank]);
        expect(q.skill).toMatch(/^ma\.(add|sub)\.[a-z0-9-]+$/);
      }
    }
  });

  it('nivåerna betyder det de säger', () => {
    for (const q of each(makeT, 'par', 0)) expect(q.c).toBe(10);
    for (const q of each(makeT, 'par', 2)) expect(q.c).toBe(100);
    for (const q of each(makeT, 'plus', 0)) { expect(q.c).toBeLessThanOrEqual(20); expect(q.a % 10 + q.b <= 9 || q.c === 10).toBe(true); }
    for (const q of each(makeT, 'plus', 1)) { expect(q.a).toBeLessThan(10); expect(q.c).toBeGreaterThan(10); }
    for (const q of each(makeT, 'minus', 0)) expect(q.c).toBeGreaterThanOrEqual(0);
    for (const q of each(makeT, 'minus', 1)) { expect(q.a).toBeGreaterThan(10); expect(q.c).toBeLessThan(10); }
    for (const q of each(makeT, 'minus', 3)) { expect(q.b).toBeGreaterThanOrEqual(11); expect(q.c).toBeGreaterThanOrEqual(10); }
  });

  it('bossfällor: Tiotapparen ger tiotalsövergång, Baklängesbävern ger lån', () => {
    for (const q of each(makeT, 'saknas', 1, 'glomd-tia')) { expect(q.op).toBe('+'); expect(q.blank).toBe(2); expect(q.a % 10 + q.b % 10).toBeGreaterThanOrEqual(10); }
    for (const q of each(makeT, 'minus', 2, 'lanade-inte')) { expect(q.op).toBe('−'); expect(q.b % 10).toBeGreaterThan(q.a % 10); }
  });

  it('samma seed ger samma fråga', () => {
    expect(makeT({ mode: 'plus', level: 3 }, rngFrom(42))).toEqual(makeT({ mode: 'plus', level: 3 }, rngFrom(42)));
  });
});

describe('Tiokompisbron: diagnos av fel', () => {
  const q = (mode: string, op: '+' | '−', a: number, b: number, blank: 0 | 1 | 2): TQ => {
    const c = op === '+' ? a + b : a - b;
    return { mode, level: 2, op, a, b, c, blank, answer: [a, b, c][blank], parts: [], skill: 's' } as TQ;
  };
  it('känner igen typiska misstag', () => {
    expect(diagT(q('plus', '+', 9, 4, 2), 3)).toBe('glomd-tia');
    expect(diagT(q('plus', '+', 8, 5, 2), 3)).toBe('fel-satt'); // 8 − 5 = 3 går före
    expect(diagT(q('plus', '+', 38, 47, 2), 75)).toBe('glomd-tia');
    expect(diagT(q('plus', '+', 47, 8, 2), 415)).toBe('glomd-tia');
    expect(diagT(q('plus', '+', 9, 4, 2), 5)).toBe('fel-satt');
    expect(diagT(q('minus', '−', 62, 27, 2), 45)).toBe('lanade-inte');
    expect(diagT(q('minus', '−', 43, 7, 2), 44)).toBe('lanade-inte');
    expect(diagT(q('minus', '−', 13, 5, 2), 12)).toBe('lanade-inte');
    expect(diagT(q('minus', '−', 61, 27, 2), 44)).toBe('glomd-lan');
    expect(diagT(q('minus', '−', 61, 27, 2), 46)).toBe('lanade-inte');
    expect(diagT(q('minus', '−', 13, 5, 2), 18)).toBe('fel-satt');
    expect(diagT(q('par', '+', 37, 63, 1), 73)).toBe('tio-fel');
    expect(diagT(q('saknas', '+', 8, 5, 1), 21)).toBe('fel-satt');
    expect(diagT(q('plus', '+', 6, 7, 2), 12)).toBe('ett-fel');
    expect(diagnoseAny(tiokompisGame, q('plus', '+', 6, 7, 2), 31)).toBe('omvanda-siffror');
    expect(diagnoseAny(tiokompisGame, q('plus', '+', 6, 7, 2), 50)).toBe('annat');
  });

  it('förklaringen vid ett fel avslöjar aldrig svaret (barnet ska rätta själv)', () => {
    for (const mode of ['par', 'plus', 'minus', 'saknas']) for (let level = 0; level <= 3; level++) {
      // (När svaret också syns i uppgiften, som 5 + _ = 10, går det inte att undvika.)
      for (const tq of each(makeT, mode, level).slice(0, 100).filter((x) => x.parts.filter((p) => p === x.answer).length === 0)) {
        const tries = [tq.answer + 10, tq.answer - 10, tq.answer + 1, tq.answer - 1, tq.a + tq.b, Math.abs(tq.a - tq.b), tq.c + tq.a, tq.c + tq.b, tq.answer + 3, tq.answer + 27];
        for (const given of tries.filter((g) => g >= 0 && g !== tq.answer)) {
          const tag = diagnoseAny(tiokompisGame, tq, given);
          const e = explainAny(tiokompisGame, tag, tq, given);
          expect(`${e.title} ${e.text}`, `${tag}: ${tq.a} ${tq.op} ${tq.b} = ${tq.c}`).not.toMatch(reveals(tq.answer));
        }
      }
    }
  });
});

describe('Tabellgruvan', () => {
  it('alla lägen och nivåer: rätt räknat, delat går jämnt ut, rätt tabell', () => {
    for (const mode of ['ganger', 'delat', 'saknas', 'blandat']) for (let level = 0; level <= 4; level++) {
      for (const q of each(makeM, mode, level)) {
        expect(q.op === '·' ? q.x * q.y : q.x / q.y).toBe(q.z);
        expect(Number.isInteger(q.z)).toBe(true);
        expect(q.z).toBeLessThanOrEqual(144);
        expect(q.answer).toBe([q.x, q.y, q.z][q.blank]);
        expect(q.skill).toMatch(/^ma\.(mult|div)\.(\d+)$/);
      }
    }
    for (const q of each(makeM, 'ganger', 0)) expect([2, 5, 10].some((t) => q.x === t || q.y === t)).toBe(true);
    for (const q of each(makeM, 'ganger', 2).filter((x) => x.skill.match(/\.[6-9]$/))) expect([6, 7, 8, 9].some((t) => q.x === t || q.y === t)).toBe(true);
    // Tabellerna går upp till 12, och den andra faktorn också.
    expect(each(makeM, 'ganger', 3).filter((q) => /\.1[12]$/.test(q.skill)).length).toBeGreaterThan(SEEDS * 0.7);
    expect(each(makeM, 'ganger', 3).some((q) => q.x === 12 && q.y === 12)).toBe(true);
    expect(each(makeM, 'ganger', 0).some((q) => q.x === 12 || q.y === 12)).toBe(true);
    expect(each(makeM, 'delat', 4).some((q) => q.y === 11)).toBe(true);
  });

  it('bossfällor', () => {
    for (const q of each(makeM, 'delat', 1, 'noll-ett')) expect([q.x, q.y].some((n) => n === 0 || n === 1)).toBe(true);
    for (const q of each(makeM, 'saknas', 2, 'granntabell')) { expect(q.mode).toBe('ganger'); expect([6, 7, 8, 9].some((t) => q.x === t || q.y === t)).toBe(true); }
    for (const q of each(makeM, 'delat', 0, 'plus')) expect(q.mode).toBe('ganger');
  });

  const g = (x: number, y: number): MQ => ({ mode: 'ganger', level: 2, op: '·', x, y, z: x * y, blank: 2, answer: x * y, parts: [], skill: 's' });
  it('känner igen typiska misstag', () => {
    expect(diagM(g(7, 8), 63)).toBe('granntabell');
    expect(diagM(g(7, 8), 48)).toBe('granntabell');
    expect(diagM(g(3, 4), 7)).toBe('plus');
    expect(diagM(g(7, 0), 7)).toBe('noll-ett');
    expect(diagM(g(1, 6), 1)).toBe('noll-ett');
    expect(diagM(g(1, 6), 7)).toBe('noll-ett');
    const d: MQ = { mode: 'delat', level: 2, op: '/', x: 56, y: 8, z: 7, blank: 2, answer: 7, parts: [], skill: 's' };
    expect(diagM(d, 48)).toBe('fel-satt');
    expect(diagM(d, 6)).toBe('granntabell');
    const s: MQ = { mode: 'saknas', level: 2, op: '·', x: 7, y: 8, z: 56, blank: 1, answer: 8, parts: [], skill: 's' };
    expect(diagM(s, 49)).toBe('fel-satt');
    expect(diagM(s, 9)).toBe('granntabell');
    expect(diagnoseAny(tabellerGame, g(7, 8), 65)).toBe('omvanda-siffror');
  });

  it('förklaringar för granne/plus/räknesätt avslöjar inte svaret', () => {
    for (const mode of ['ganger', 'delat', 'saknas']) for (let level = 0; level <= 4; level++) {
      for (const q of each(makeM, mode, level).slice(0, 100).filter((x) => !x.parts.includes(x.answer))) {
        for (const given of [q.answer + 1, q.answer - 1, q.x + q.y, q.x - q.y, q.z - q.x, q.z - q.y, q.answer + 3, q.answer + 13].filter((v) => v >= 0 && v !== q.answer)) {
          const tag = diagnoseAny(tabellerGame, q, given);
          if (tag === 'noll-ett') continue;
          const e = explainAny(tabellerGame, tag, q, given);
          expect(`${e.title} ${e.text}`, `${tag}: ${q.x} ${q.op} ${q.y}`).not.toMatch(reveals(q.answer));
        }
      }
    }
  });
});

describe('drillmotorn', () => {
  it('tolkar svar', () => {
    expect(parseAnswer(' 42 ')).toBe(42);
    expect(parseAnswer('1 000')).toBe(1000);
    expect(parseAnswer('4,2')).toBeNull();
    expect(parseAnswer('')).toBeNull();
    expect(parseAnswer('tolv')).toBeNull();
  });
});

describe('alla spelbara områden', () => {
  beforeEach(() => { freshStorage(); });

  function play(hid: string, area: AreaDef, n: PathNode, answers: boolean[], ms = 1000) {
    const game = PLAYABLE[area.areaId].game;
    let run = startRun(hid, area, n);
    for (const c of answers) {
      const q = currentQuestion(run, n, game);
      run = recordAnswer(hid, run, n, { correct: c, ms, hint: false }, game.skillOf(q));
      if (runOver(run)) break;
      run = advance(hid, run);
    }
    return finishRun(hid, area, run);
  }

  for (const { def, game } of Object.values(PLAYABLE)) {
    it(`${def.title}: unika id:n, frågor för varje nod, och en hel genomspelning`, () => {
      const ids = allNodes(def).map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(def.eras.at(-1)!.nodes.at(-1)).toMatchObject({ type: 'boss', kind: 'mastare' });
      for (const n of allNodes(def)) if (n.type === 'boss' && n.trap) expect(game.errLabel(n.trap), n.id).toBeTruthy();

      const hid = createHero({ name: 'Hjälte2', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 2 }).id;
      let n = nextOpenNode(def, getArea(hid, def.areaId));
      let steps = 0;
      while (n && steps++ < 40) {
        const o = n.type === 'boss' ? play(hid, def, n, Array(n.hp).fill(true)) : play(hid, def, n, Array(10).fill(true));
        expect(o.cleared || o.bossWon, n.id).toBe(true);
        n = nextOpenNode(def, getArea(hid, def.areaId));
      }
      expect(n).toBeUndefined();
      const last = def.eras.at(-1)!.nodes.at(-1)!;
      expect(getHeroState(hid).mentors).toContain(`${def.areaId}:${last.id}`);
    });
  }
});
