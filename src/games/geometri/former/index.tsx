import { drillModule } from '../../../engines/drill/DrillView';
import type { DrillGame } from '../../../engines/drill/types';
import { CornerDots, Fig, fit, Poly } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, NAMES, solution, specsForSkill, type FQ, type Shape } from './logic';

// Fluffy som frågefabrik: formerna ritas i SVG.

function One({ s, x, y, w, h, cls, dots }: { s: Shape; x: number; y: number; w: number; h: number; cls?: string; dots?: 'start' | 'numbers' }) {
  if (!s.pts) {
    const r = Math.min(w, h) / 2;
    return <circle cx={x + w / 2} cy={y + h / 2} r={r} class={cls ?? 'geo-shape'} />;
  }
  const pts = fit(s.pts, x, y, w, h);
  return (
    <g>
      <Poly pts={pts} cls={cls} />
      {dots === 'numbers' && <CornerDots pts={pts} numbers />}
      {dots === 'start' && <CornerDots pts={pts.slice(0, 1)} numbers={false} />}
    </g>
  );
}

function Shapes({ q, hint: showHint, done }: { q: FQ; hint: boolean; done: boolean }) {
  if (q.mode === 'sortera') {
    const cols = 3, rows = Math.ceil(q.shapes.length / cols), cw = 100, ch = 74;
    return (
      <Fig w={cols * cw} h={rows * ch} label={`${q.shapes.length} former`}>
        {q.shapes.map((s, i) => (
          <One key={i} s={s} x={(i % cols) * cw + 16} y={Math.floor(i / cols) * ch + 10} w={cw - 32} h={ch - 20}
            cls={done && s.kind === q.ask ? 'geo-shape geo-hit' : 'geo-shape'} />
        ))}
      </Fig>
    );
  }
  const s = q.shapes[0];
  const dots = q.mode === 'horn' ? (done ? 'numbers' : showHint ? 'start' : undefined) : undefined;
  const label = q.mode === 'namn' && !done ? 'En form' : `En ${q.mode === 'namn' ? NAMES[q.answer] : 'form'}`;
  return <Fig w={300} h={180} label={label}><One s={s} x={70} y={22} w={160} h={136} dots={dots} /></Fig>;
}

export const formerGame: DrillGame<FQ> = { id: 'former', make: makeQ, specsForSkill, diagnose, explain, solution, hint, Visual: Shapes, errLabels: ERR };

export const former = drillModule(formerGame);
