import { drillModule } from '../../../engines/drill/DrillView';
import type { DrillGame } from '../../../engines/drill/types';
import { Fig, fit, Poly, RightMarks, SideLabels, Txt } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, notes, solution, specsForSkill, type LQ } from './logic';

// Oxie som frågefabrik: linjalen och figurer med mått.

const CM = 21, X0 = 12;

function Ruler({ q, done }: { q: LQ; done: boolean }) {
  const x = (cm: number) => X0 + cm * CM;
  const mm = q.level >= 2;
  return (
    <Fig w={X0 * 2 + 15 * CM} h={118} label={`En linjal och ${q.thing}`}>
      <rect x={x(q.s!)} y={14} width={(q.e! - q.s!) * CM} height={20} rx={9} class="geo-thing" />
      <line x1={x(q.s!)} x2={x(q.s!)} y1={34} y2={56} class="geo-guide" />
      <line x1={x(q.e!)} x2={x(q.e!)} y1={34} y2={56} class="geo-guide" />
      <rect x={X0 - 8} y={56} width={15 * CM + 16} height={56} rx={6} class="geo-ruler" />
      {Array.from({ length: 151 }, (_, i) => {
        const big = i % 10 === 0, half = i % 5 === 0;
        if (!mm && !half) return null;
        return <line key={i} x1={x(i / 10)} x2={x(i / 10)} y1={56} y2={56 + (big ? 18 : half ? 12 : 7)} class="geo-tick" />;
      })}
      {Array.from({ length: 16 }, (_, i) => <Txt key={`n${i}`} at={[x(i), 86]} cls="geo-small">{i}</Txt>)}
      <Txt at={[x(15) - 4, 104]} cls="geo-small">cm</Txt>
      {done && <Txt at={[(x(q.s!) + x(q.e!)) / 2, 24]} cls="geo-label on-thing">{q.level === 3 ? `${q.answer} mm` : `${String(q.answer).replace('.', ',')} cm`}</Txt>}
    </Fig>
  );
}

function Shape({ q }: { q: LQ }) {
  const pts = fit(q.pts!, 46, 30, 208, 130);
  const right = q.shape === 'rektangel' || q.shape === 'kvadrat' ? [0, 1, 2, 3] : q.shape === 'L' ? [0, 1, 2, 4, 5] : [];
  return (
    <Fig w={300} h={190} label={`En ${q.shape === 'L' ? 'L-formad figur' : q.shape}`}>
      <Poly pts={pts} />
      <RightMarks pts={pts} at={right} />
      <SideLabels pts={pts} labels={q.labels!} off={17} />
    </Fig>
  );
}

function Visual({ q, done }: { q: LQ; hint: boolean; done: boolean }) {
  if (q.mode === 'linjal') return <Ruler q={q} done={done} />;
  if (q.mode === 'omkrets' || q.mode === 'saknad') return <Shape q={q} />;
  return null;
}

export const langdGame: DrillGame<LQ> = { id: 'langd', make: makeQ, specsForSkill, diagnose, explain, solution, hint, notes, Visual, errLabels: ERR };

export const langd = drillModule(langdGame);
