import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { glosorGame } from '../src/games/glosor';
import { items, makeQ } from '../src/games/glosor/logic';
import { FALSKA, LIKNAR, TEMAN } from '../src/games/glosor/ord';
import { GLOSVIKEN } from '../src/games/glosor/content';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

// Glosviken: orden håller ihop, varje fråga har exakt ett rätt svar, och förklaringarna avslöjar aldrig svaret.

const low = (s: string) => s.toLocaleLowerCase('sv');

describe('Glosvikens ord', () => {
  it('inom ett tema är engelska, svenska och bilder unika, och varje ord går att fråga om', () => {
    for (const t of TEMAN) {
      for (const k of [0, 1] as const) {
        const xs = t.words.map((w) => low(w[k]));
        expect(new Set(xs).size, `${t.id} ${k}`).toBe(xs.length);
      }
      const pics = t.words.map((w) => w[2]).filter(Boolean);
      expect(new Set(pics).size, t.id).toBe(pics.length);
      for (const [en, sv, pic] of t.words) expect(!!pic || low(en) !== low(sv), `${t.id}: ${en}`).toBe(true);
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(6);
    }
    const all = TEMAN.flatMap((t) => t.words.map((w) => low(w[0])));
    expect(new Set(all).size).toBe(all.length);
    const allPics = TEMAN.flatMap((t) => t.words.map((w) => w[2])).filter(Boolean);
    expect(new Set(allPics).size).toBe(allPics.length);
  });

  it('liknande ord finns bland orden, och falska vänner skiljer sig från sin betydelse', () => {
    const all = new Set(TEMAN.flatMap((t) => t.words.map((w) => w[0])));
    for (const g of LIKNAR) for (const w of g) expect(all.has(w), w).toBe(true);
    for (const [en, sv, falsk] of FALSKA) expect(new Set([en, sv, falsk]).size, en).toBeGreaterThanOrEqual(2);
  });
});

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => {
    checkArea(GLOSVIKEN, glosorGame);
    for (const t of TEMAN) for (const level of [0, 1, 2]) for (let seed = 0; seed < 40; seed++) {
      const q = makeQ({ mode: t.id, level }, rngFrom(seed));
      expect(q.topic).toBe(t.id);
    }
  });

  it('bossarnas fällor finns alltid bland alternativen', () => checkTraps(GLOSVIKEN, glosorGame));

  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const t of TEMAN) expect(items(t.id, 2).length, t.id).toBeGreaterThanOrEqual(10);
    checkDecks(GLOSVIKEN, glosorGame, (q) => `${q.topic}/${q.row}/${q.how}`);
  });

  it('nivå 0 och 1 tar bara band 1-ord ur teman som har sådana', () => {
    for (let seed = 0; seed < 300; seed++) {
      const q = makeQ({ mode: 'blandat', level: seed % 2 }, rngFrom(seed));
      expect(q.how).not.toBe('falsk');
      expect(TEMAN.find((t) => t.id === q.topic)!.words[q.row][3], q.en).toBe(1);
      if (seed % 2 === 0) expect(q.how).not.toBe('en-sv');
    }
  });

  it('hörfrågor har bilder som alternativ och läses upp på engelska', () => {
    let n = 0;
    for (let seed = 0; seed < 200; seed++) {
      const q = makeQ({ mode: 'djur', level: 0 }, rngFrom(seed));
      if (q.how !== 'hor') continue;
      n++;
      expect(q.listen).toBe(true);
      expect(q.lang).toBe('en-GB');
      expect(q.say).toBe(q.en);
      expect(q.alts!.every((a) => a.pic)).toBe(true);
    }
    expect(n).toBeGreaterThan(20);
  });
});
