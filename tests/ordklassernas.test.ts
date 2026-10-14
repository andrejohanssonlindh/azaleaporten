import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { ordklassGame } from '../src/games/ordklass';
import { genusByte, items, makeQ, pluralGissningar, tokensOf } from '../src/games/ordklass/logic';
import { GENUSADJ, KOMP, MENINGAR, PRONOMEN, SUBST, VERB } from '../src/games/ordklass/ord';
import { ORDKLASSERNAS_TEMPEL } from '../src/games/ordklass/content';
import { allNodes } from '../src/platform/rpg/types';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

// Ordklassernas tempel: innehållet håller ihop, varje fråga har exakt ett rätt svar, och förklaringarna avslöjar aldrig svaret.

describe('templets innehåll', () => {
  it('varje ord i meningarna har en känd ordklass, och varje mening har substantiv och verb', () => {
    MENINGAR.forEach((_, i) => {
      const t = tokensOf(i);
      for (const x of t) expect('svaprx', `${MENINGAR[i][0]}: ${x.w}`).toContain(x.c);
      expect(t.some((x) => x.c === 's'), MENINGAR[i][0]).toBe(true);
      expect(t.some((x) => x.c === 'v'), MENINGAR[i][0]).toBe(true);
    });
  });

  it('substantiven: fem olika former där det ska vara olika, och felgissningarna är inte riktiga former', () => {
    const words = SUBST.map((r) => r[0]);
    expect(new Set(words).size).toBe(words.length);
    SUBST.forEach(([w, g, pl, best, bestPl, , reg], i) => {
      expect(['en', 'ett']).toContain(g);
      expect(best, w).not.toBe(w);
      expect(bestPl, w).not.toBe(best);
      if (reg) expect([w, pl, best, bestPl]).not.toContain(reg);
      expect(pluralGissningar(i).length, w).toBeGreaterThanOrEqual(2);
      expect(genusByte(i), w).not.toBe(best);
    });
    expect(GENUSADJ.every(([u, n]) => u !== n)).toBe(true);
  });

  it('verben: starka verb har en felböjning, svaga har ingen, och formerna skiljer sig', () => {
    for (const [inf, pres, pret, sup, fel] of VERB) {
      expect(new Set([inf, pres, pret, sup]).size, inf).toBe(4);
      if (fel) expect([inf, pres, pret, sup], inf).not.toContain(fel);
    }
    expect(VERB.filter((r) => r[4]).length).toBeGreaterThanOrEqual(10);
  });

  it('jämförelser och pronomen: luckan finns och alternativen är olika', () => {
    for (const [pos, komp, sup, felK, felS, , kS, sS] of KOMP) {
      expect(kS, pos).toContain('___');
      expect(sS, pos).toContain('___');
      expect(new Set([komp, sup, felK || 'a', felS || 'b']).size, pos).toBe(4);
    }
    for (const [s, right, form, person] of PRONOMEN) {
      expect(s).toContain('___');
      expect(new Set([right, form, person].map((x) => x.toLocaleLowerCase('sv'))).size, s).toBe(3);
    }
  });
});

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => checkArea(ORDKLASSERNAS_TEMPEL, ordklassGame));
  it('bossarnas fällor', () => checkTraps(ORDKLASSERNAS_TEMPEL, ordklassGame));
  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(ORDKLASSERNAS_TEMPEL)) if (n.type === 'stage') expect(items(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
    checkDecks(ORDKLASSERNAS_TEMPEL, ordklassGame, (q) => `${q.topic}/${q.row}/${q.k ?? ''}`);
  });

  it('markera: varje ord av rätt ordklass räknas, och inget annat', () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = makeQ({ mode: 'verb', level: 1 }, rngFrom(seed));
      const t = tokensOf(q.row);
      expect(q.targets).toEqual(t.map((x, k) => (x.c === 'v' ? k : -1)).filter((k) => k >= 0));
    }
  });

  it('nivå 0 använder bara de lättare raderna, och Gådde-gåsen frågar bara om starka verb', () => {
    for (let seed = 0; seed < 300; seed++) {
      const q = makeQ({ mode: 'blandat', level: 0 }, rngFrom(seed));
      if (q.topic === 'pret' || q.topic === 'pres') expect(VERB[q.row][5]).toBe(1);
      if (q.topic === 'genus' || q.topic === 'plural') expect(SUBST[q.row][5]).toBe(1);
      const g = makeQ({ mode: 'starka', level: 1, trap: 'starkt-verb' }, rngFrom(seed));
      expect(VERB[g.row][4], g.answer).toBeTruthy();
    }
  });
});
