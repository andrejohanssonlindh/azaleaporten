import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { isRight } from '../src/engines/ord/check';
import { logikGame } from '../src/games/logik';
import { LOGIKSLINGAN } from '../src/games/logik/content';
import { RUTINER } from '../src/games/logik/data';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

describe('Logikslingan', () => {
  it('varje fråga har ett rätt svar, och inget fel avslöjar det', () => checkArea(LOGIKSLINGAN, logikGame));
  it('bossarnas fällor finns bland alternativen', () => checkTraps(LOGIKSLINGAN, logikGame));
  it('ingen fråga kommer tillbaka i samma runda', () => checkDecks(LOGIKSLINGAN, logikGame, (q) => `${q.sentence ?? ''}|${q.prompt}|${q.answer}|${q.rule?.now ?? ''}`));

  it('rutinerna: inga steg som står i varandra, och ordna rättas och diagnostiseras', () => {
    for (const r of RUTINER) {
      for (const a of r.steps) for (const b of r.steps) if (a !== b) expect(b.includes(a), `${r.title}: ${a}`).toBe(false);
    }
    for (let seed = 0; seed < 20; seed++) {
      const q = logikGame.make({ mode: 'ordning', level: seed % 2 }, rngFrom(seed));
      const steps = RUTINER.find((r) => r.steps.join(' ') === q.answer)!.steps;
      expect(isRight(q, steps.join(' '))).toBe(true);
      const swapped = [steps[1], steps[0], ...steps.slice(2)].join(' ');
      expect(logikGame.diagnose(q, swapped)).toBe('bytte-plats');
      expect(logikGame.diagnose(q, [...steps].reverse().join(' '))).toBe('fel-ordning');
    }
  });
});
