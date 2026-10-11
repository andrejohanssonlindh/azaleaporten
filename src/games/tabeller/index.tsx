import { drillModule } from '../../engines/drill/DrillView';
import type { DrillGame } from '../../engines/drill/types';
import { diagnose, ERR, explain, hint, makeQ, solution, type MQ } from './logic';

// Tabellgruvan som frågefabrik.

/** Ledtrådsbild för gånger: x rader med y kristaller (gånger som en rektangel). */
function Array2D({ q, hint: showHint }: { q: MQ; hint: boolean; done: boolean }) {
  if (!showHint || q.mode !== 'ganger' || q.x === 0 || q.y === 0) return null;
  const cell = q.x > 6 || q.y > 6 ? 18 : 24;
  const w = q.y * cell, h = q.x * cell;
  return (
    <svg class="dot-array" viewBox={`0 0 ${w} ${h}`} width={w} role="img" aria-label={`${q.x} rader med ${q.y} i varje`}>
      {Array.from({ length: q.x * q.y }, (_, i) => (
        <circle key={i} cx={(i % q.y) * cell + cell / 2} cy={Math.floor(i / q.y) * cell + cell / 2} r={cell * 0.34}
          class={`tf-dot ${Math.floor(i / q.y) % 5 === 4 ? 'tf-b' : 'tf-a'}`} />
      ))}
    </svg>
  );
}

export const tabellerGame: DrillGame<MQ> = { id: 'tabeller', make: makeQ, diagnose, explain, solution, hint, Visual: Array2D, errLabels: ERR };

export const tabeller = drillModule(tabellerGame);
