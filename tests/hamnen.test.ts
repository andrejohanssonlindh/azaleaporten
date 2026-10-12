import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { explainAny, hintFor } from '../src/engines/ord/check';
import { hamnenGame } from '../src/games/hamnen';
import { cards, makeQ } from '../src/games/hamnen/logic';
import { FRAGOR, FRASER, INSTRUKTIONER, numWord, STAVAS } from '../src/games/hamnen/fraser';
import { HAMNEN } from '../src/games/hamnen/content';
import { allNodes } from '../src/platform/rpg/types';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

// Hamnen: hörfrågor på engelska med ett rätt svar, och förklaringar som aldrig avslöjar svaret.

describe('Hamnens innehåll', () => {
  it('talen på engelska', () => {
    expect(numWord(0)).toBe('zero');
    expect(numWord(13)).toBe('thirteen');
    expect(numWord(30)).toBe('thirty');
    expect(numWord(47)).toBe('forty-seven');
    expect(numWord(100)).toBe('one hundred');
  });

  it('varje fras har en tvilling i samma lista, och svenskan är unik', () => {
    for (const list of [FRASER, INSTRUKTIONER]) {
      const ens = list.map((r) => r[0]);
      expect(new Set(ens).size).toBe(ens.length);
      expect(new Set(list.map((r) => r[1])).size).toBe(list.length);
      for (const [en, , twin] of list) { expect(ens, en).toContain(twin); expect(twin).not.toBe(en); }
    }
    expect(new Set(FRAGOR.map((r) => r[1])).size).toBe(FRAGOR.length);
    for (const [w, t, o] of STAVAS) expect(new Set([w, t, o]).size, w).toBe(3);
  });
});

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => checkArea(HAMNEN, hamnenGame));

  it('talfrågor: varken siffrorna eller talet på engelska står i förklaringen eller ledtråden', () => {
    for (const level of [0, 1, 2]) for (let seed = 0; seed < 200; seed++) {
      const q = makeQ({ mode: 'siffror', level }, rngFrom(seed));
      const texts = [hintFor(hamnenGame, q), ...q.alts!.filter((a) => a.err).map((a) => { const e = explainAny(hamnenGame, a.err!, q, a.text); return `${e.title} ${e.text}`; })];
      for (const t of texts) {
        expect(t.toLowerCase(), `${q.answer}: ${t}`).not.toContain(`"${q.en}"`);
        expect(t, `${q.answer}: ${t}`).not.toMatch(new RegExp(`(?<!\\d)${q.answer}(?!\\d)`));
      }
    }
  });

  it('bossarnas fällor finns alltid bland alternativen', () => checkTraps(HAMNEN, hamnenGame));

  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(HAMNEN)) if (n.type === 'stage') expect(cards(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
    checkDecks(HAMNEN, hamnenGame, (q) => `${q.topic}/${q.row}`);
  });

  it('alla frågor läses upp på engelska och har en text att läsa om rösten saknas', () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = makeQ({ mode: 'blandat', level: seed % 2 }, rngFrom(seed));
      expect(q.listen).toBe(true);
      expect(q.lang).toBe('en-GB');
      expect(q.say).toBeTruthy();
      expect(q.read).toBeTruthy();
    }
  });

  it('-teen och -ty: fällan är talet med det andra slutet', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = makeQ({ mode: 'siffror', level: 1, trap: 'teen-ty' }, rngFrom(seed));
      const t = q.alts!.find((a) => a.err === 'teen-ty')!.text;
      const n = Number(q.answer);
      expect(n < 20 ? Number(t) === (n - 10) * 10 : Number(t) === n / 10 + 10, `${n} ${t}`).toBe(true);
    }
  });
});
