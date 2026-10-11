import { drillModule } from '../../engines/drill/DrillView';
import type { DrillGame } from '../../engines/drill/types';
import { diagnose, ERR, explain, hint, makeQ, solution, type TQ } from './logic';

// Tiokompisbron som frågefabrik.

/** Tiorutor (två rader om fem per ruta). Plus: a i en färg och b i en annan. Minus: b sista överkryssade. */
function TenFrames({ q, hint: showHint }: { q: TQ; hint: boolean; done: boolean }) {
  const always = q.mode === 'par' && q.level === 0;
  const total = Math.max(q.a, q.c, q.op === '+' ? q.a + q.b : 0);
  if (!(always || showHint) || total > 20) return null;
  const frames = total > 10 ? 2 : 1;
  const cell = 26, gap = 12;
  const kind = (i: number): 'a' | 'b' | 'x' | 'empty' => {
    if (q.op === '+') return i < q.a ? 'a' : q.mode === 'par' || q.blank !== 2 ? 'empty' : i < q.a + q.b ? 'b' : 'empty';
    return i < q.a - q.b ? 'a' : i < q.a ? 'x' : 'empty';
  };
  const w = frames * 5 * cell + (frames - 1) * gap;
  return (
    <svg class="tenframe" viewBox={`-2 -2 ${w + 4} ${2 * cell + 4}`} width={w + 4} role="img" aria-label="Tiorutor">
      {Array.from({ length: frames * 10 }, (_, i) => {
        const f = Math.floor(i / 10), j = i % 10;
        const x = f * (5 * cell + gap) + (j % 5) * cell, y = Math.floor(j / 5) * cell;
        const k = kind(i);
        return (
          <g key={i}>
            <rect x={x} y={y} width={cell} height={cell} class="tf-cell" />
            {k !== 'empty' && <circle cx={x + cell / 2} cy={y + cell / 2} r={cell * 0.36} class={`tf-dot tf-${k}`} />}
            {k === 'x' && <path d={`M${x + 6} ${y + 6} L${x + cell - 6} ${y + cell - 6} M${x + cell - 6} ${y + 6} L${x + 6} ${y + cell - 6}`} class="tf-cross" />}
          </g>
        );
      })}
    </svg>
  );
}

export const tiokompisGame: DrillGame<TQ> = { id: 'tiokompis', make: makeQ, diagnose, explain, solution, hint, Visual: TenFrames, errLabels: ERR };

export const tiokompis = drillModule(tiokompisGame);
