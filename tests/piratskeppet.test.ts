import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { diagnoseAny, isRight } from '../src/engines/ord/check';
import { piratGame } from '../src/games/pirat';
import { cards, makeQ } from '../src/games/pirat/logic';
import { BYGG, ORDFOLJD, PLURAL, VARA } from '../src/games/pirat/meningar';
import { PIRATSKEPPET } from '../src/games/pirat/content';
import { allNodes } from '../src/platform/rpg/types';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

// Piratskeppet: första engelska grammatiken.

describe('Piratskeppets innehåll', () => {
  it('meningarna har en lucka, och felen skiljer sig från det rätta', () => {
    for (const [s] of VARA) expect(s.split('___').length, s).toBe(2);
    for (const [one, many, wrong] of PLURAL) for (const [w] of wrong) expect(w, one).not.toBe(many);
    for (const [r, sv, an] of ORDFOLJD) expect(new Set([r, sv, an]).size, r).toBe(3);
    for (const [tiles, , also, svensk] of BYGG) {
      const right = tiles.join(' ');
      for (const s of svensk) { expect(s.split(' ').sort().join(' '), s).toBe(right.split(' ').sort().join(' ')); expect(also.includes(s)).toBe(false); }
      for (const a of also) expect(a.toLowerCase().split(' ').sort().join(' '), a).toBe(right.toLowerCase().split(' ').sort().join(' '));
    }
  });
});

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => checkArea(PIRATSKEPPET, piratGame));

  it('bygg meningen: rätt ordning (och andra som duger) godtas, svensk ordföljd känns igen', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = makeQ({ mode: 'bygg', level: 1 }, rngFrom(seed));
      expect(q.kind).toBe('ordna');
      expect(isRight(q, q.tiles!.join(' ')), q.answer).toBe(false);
      expect(isRight(q, q.answer)).toBe(true);
      for (const a of q.answers ?? []) expect(isRight(q, a)).toBe(true);
      for (const s of q.svensk ?? []) expect(diagnoseAny(piratGame, q, s)).toBe('svensk-ordfoljd');
    }
  });

  it('prepositioner har en bild som stämmer med svaret', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = makeQ({ mode: 'prep', level: 1 }, rngFrom(seed));
      expect(q.scene!.prep).toBe(q.answer);
      expect(!(q.scene!.obj === 'box' && q.answer === 'under') && !(q.scene!.obj === 'table' && q.answer === 'in')).toBe(true);
    }
  });

  it('bossarnas fällor finns alltid', () => checkTraps(PIRATSKEPPET, piratGame, (q, t) => (q.kind === 'ordna' ? !!q.svensk?.length : !!q.alts?.some((a) => a.err === t))));

  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(PIRATSKEPPET)) if (n.type === 'stage') expect(cards(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
    checkDecks(PIRATSKEPPET, piratGame, (q) => `${q.topic}/${q.row}`);
  });
});
