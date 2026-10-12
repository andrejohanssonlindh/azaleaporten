import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { explainAny, hintFor } from '../src/engines/ord/check';
import { bigbenGame } from '../src/games/bigben';
import { ampmPhrase, cards, digital, digitalPhrase, makeQ, phrase } from '../src/games/bigben/logic';
import { BIG_BEN_TORNET } from '../src/games/bigben/content';
import { allNodes } from '../src/platform/rpg/types';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

// Big Ben-tornet: klockan på engelska.

describe('tiden på engelska', () => {
  it('fraserna', () => {
    expect(phrase(3, 0)).toBe("three o'clock");
    expect(phrase(2, 30)).toBe('half past two');
    expect(phrase(3, 15)).toBe('quarter past three');
    expect(phrase(3, 45)).toBe('quarter to four');
    expect(phrase(12, 45)).toBe('quarter to one');
    expect(phrase(3, 20)).toBe('twenty past three');
    expect(phrase(3, 40)).toBe('twenty to four');
    expect(phrase(3, 25)).toBe('twenty-five past three');
    expect(phrase(3, 7)).toBe('seven minutes past three');
    expect(phrase(3, 59)).toBe('one minute to four');
    expect(digitalPhrase(3, 5)).toBe('three oh five');
    expect(digitalPhrase(3, 40)).toBe('three forty');
    expect(digital(12, 5)).toBe('12:05');
    expect(ampmPhrase(19, 0)).toBe('seven p.m.');
    expect(ampmPhrase(7, 30)).toBe('seven thirty a.m.');
    expect(ampmPhrase(12, 15)).toBe('twelve fifteen p.m.');
  });

  it('alla 720 tider har en egen fras', () => {
    const all = new Set<string>();
    for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m++) all.add(phrase(h, m));
    expect(all.size).toBe(720);
  });
});

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => checkArea(BIG_BEN_TORNET, bigbenGame));

  it('den digitala tiden står aldrig i förklaringen eller ledtråden', () => {
    for (const mode of ['ord', 'hor']) for (const level of [0, 1, 2, 3, 4]) for (let seed = 0; seed < 100; seed++) {
      const q = makeQ({ mode, level }, rngFrom(seed));
      const texts = [hintFor(bigbenGame, q), ...q.alts!.filter((a) => a.err).map((a) => { const e = explainAny(bigbenGame, a.err!, q, a.text); return `${e.title} ${e.text}`; })];
      for (const t of texts) expect(t, `${q.answer}: ${t}`).not.toContain(q.answer);
    }
  });

  it('halv-fällan: klockan 2:30 lockar med "half past three", och "half past three" lockar med 2:30', () => {
    for (let seed = 0; seed < 50; seed++) {
      const k = makeQ({ mode: 'klocka', level: 0, trap: 'half-past' }, rngFrom(seed));
      expect(k.m).toBe(30);
      expect(k.alts!.find((a) => a.err === 'half-past')!.text).toBe(phrase(k.h + 1, 30));
      const o = makeQ({ mode: 'ord', level: 0, trap: 'half-past' }, rngFrom(seed));
      expect(o.alts!.find((a) => a.err === 'half-past')!.text).toBe(digital(o.h - 1, 30));
    }
  });

  it('bossarnas fällor finns alltid bland alternativen', () => checkTraps(BIG_BEN_TORNET, bigbenGame));

  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(BIG_BEN_TORNET)) if (n.type === 'stage') expect(cards(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
    checkDecks(BIG_BEN_TORNET, bigbenGame, (q) => `${q.how}/${q.h}/${q.m}`);
  });
});
