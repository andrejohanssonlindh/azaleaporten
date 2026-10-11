import { drillModule } from '../../engines/drill/DrillView';
import type { DrillGame } from '../../engines/drill/types';
import { fmtNum } from '../../engines/drill/check';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type Line, type LQ } from './logic';

// Tallinjebron som frågefabrik.

const W = 340, PAD = 22;

export function NumberLine({ line, showMark }: { line: Line; showMark: boolean }) {
  const { min, max, tick, label, mark } = line;
  const x = (v: number) => PAD + ((v - min) / (max - min)) * (W - 2 * PAD);
  const n = Math.round((max - min) / tick);
  const isLabel = (v: number) => Math.abs(v / label - Math.round(v / label)) < 1e-6;
  return (
    <svg class="numline" viewBox={`0 0 ${W} 86`} width={W} role="img" aria-label={`Tallinje från ${fmtNum(min)} till ${fmtNum(max)}`}>
      <line x1={PAD - 12} y1="50" x2={W - PAD + 12} y2="50" class="nl-axis" />
      <path d={`M${W - PAD + 14} 50 l-8 -5 v10 z`} class="nl-head" />
      {Array.from({ length: n + 1 }, (_, i) => {
        const v = Math.round((min + i * tick) * 1000) / 1000;
        const big = isLabel(v);
        return (
          <g key={i}>
            <line x1={x(v)} x2={x(v)} y1={big ? 40 : 44} y2={big ? 60 : 56} class={`nl-tick${big ? ' big' : ''}${v === 0 && min < 0 ? ' zero' : ''}`} />
            {big && <text x={x(v)} y="76" text-anchor="middle" class="nl-label">{fmtNum(v)}</text>}
          </g>
        );
      })}
      <path d={`M${x(mark)} 38 l-8 -14 h16 z`} class="nl-mark" />
      {showMark && <text x={x(mark)} y="16" text-anchor="middle" class="nl-mark-label">{fmtNum(mark)}</text>}
    </svg>
  );
}

function Visual({ q, done }: { q: LQ; hint: boolean; done: boolean }) {
  if (!q.line) return null;
  return <div class="numline-wrap"><NumberLine line={q.line} showMark={done || !!q.line.markLabel || q.mode === 'negativa' && q.level > 0} /></div>;
}

export const tallinjeGame: DrillGame<LQ> = { id: 'tallinje', make: makeQ, specsForSkill, diagnose, explain, solution, hint, Visual, errLabels: ERR };

export const tallinje = drillModule(tallinjeGame);
