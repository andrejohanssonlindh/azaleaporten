import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { loadAllGames, PLAYABLE } from '../src/content/areas';
import { spoken } from '../src/engines/drill/check';
import type { DrillQ } from '../src/engines/drill/types';
import { allNodes } from '../src/platform/rpg/types';

// Uppläsning av drillfrågor: varje fråga blir begriplig svenska utan rester av kod eller symboler.

const GAMES = await loadAllGames();

describe('uppläsning av drillfrågor', () => {
  it('exempel', () => {
    const q = (parts: DrillQ['parts'], extra: Partial<DrillQ> = {}) => spoken({ mode: '', level: 0, skill: '', answer: 0, parts, ...extra });
    expect(q([7, '+', null, '=', 12])).toBe('7 plus vad är lika med 12.');
    expect(q([{ n: 3, d: 4 }, '+', { n: 1, d: 4 }, '=', { n: null, d: 4 }])).toBe('3 fjärdedelar plus en fjärdedel är lika med hur många fjärdedelar.');
    expect(q([-3, '−', 2, '=', null])).toBe('minus 3 minus 2 är lika med vad.');
    expect(q([2.5, 'kr'], { prompt: 'Vad kostar det?' })).toBe('Vad kostar det? 2,5 kronor.');
    expect(q([5, null, 7], { choices: [{ label: '<', value: 0 }, { label: '=', value: 1 }, { label: '>', value: 2 }] })).toContain('Välj: är mindre än, är lika med, är större än.');
  });

  for (const [id, { def }] of Object.entries(PLAYABLE)) {
    it(`${def.title}: varje fråga går att läsa upp`, () => {
      for (const n of allNodes(def)) {
        const specs = n.type === 'stage' ? [n.spec] : n.pool;
        for (const spec of specs) for (let seed = 0; seed < 20; seed++) {
          const q = GAMES[id].makeQuestion(spec, rngFrom(seed)) as DrillQ & { q?: DrillQ };
          const dq = (q.q ?? q) as DrillQ;
          if (!Array.isArray(dq.parts)) continue; // inte en drillfråga
          const s = spoken(dq);
          expect(s, JSON.stringify(dq.parts)).not.toMatch(/undefined|null|NaN|\[object|[·−=<>≈]/);
        }
      }
    });
  }
});
