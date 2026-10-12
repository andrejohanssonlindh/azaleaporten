import { drillModule } from '../../../engines/drill/DrillView';
import type { DrillGame } from '../../../engines/drill/types';
import { Fig, fit, Poly, RightMarks, SideLabels, Txt } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, notes, solution, specsForSkill, type LQ } from './logic';

// Oxie som frågefabrik: linjalen och figurer med mått.

const CM = 21, X0 = 12;
const LW = 150, LH = 96, LY = 124, PX_MM = 10;

/** Förstoringsglas över ena änden: millimetrarna blir tio gånger större (ingen siffra för mm, barnet räknar själv). */
function Loupe({ q, at, ox, name }: { q: LQ; at: number; ox: number; name: string }) {
  const X = (cm: number) => ox + LW / 2 + (cm - at) * 10 * PX_MM;
  const lo = Math.ceil((at - LW / 2 / 10 / PX_MM) * 10), hi = Math.floor((at + LW / 2 / 10 / PX_MM) * 10);
  const top = LY + 34;
  return (
    <g>
      <clipPath id={`lupp-${name}`}><rect x={ox} y={LY} width={LW} height={LH} rx={10} /></clipPath>
      <g clip-path={`url(#lupp-${name})`}>
        <rect x={X(q.s!)} y={LY + 6} width={(q.e! - q.s!) * 10 * PX_MM} height={20} class="geo-thing" />
        <rect x={ox} y={top} width={LW} height={LH} class="geo-ruler" />
        {Array.from({ length: hi - lo + 1 }, (_, k) => {
          const i = lo + k, big = i % 10 === 0, half = i % 5 === 0;
          return <line key={i} x1={X(i / 10)} x2={X(i / 10)} y1={top} y2={top + (big ? 24 : half ? 17 : 11)} class="geo-tick" />;
        })}
        {Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).filter((i) => i % 10 === 0).map((i) => <Txt key={`n${i}`} at={[X(i / 10), top + 38]} cls="geo-small">{i / 10}</Txt>)}
        <line x1={X(at)} x2={X(at)} y1={LY + 26} y2={top + 26} class="geo-guide loupe" />
      </g>
      <rect x={ox} y={LY} width={LW} height={LH} rx={10} class="geo-loupe" />
    </g>
  );
}

function Ruler({ q, done }: { q: LQ; done: boolean }) {
  const x = (cm: number) => X0 + cm * CM;
  const mm = q.level >= 2, loupe = q.level === 3;
  const W = X0 * 2 + 15 * CM;
  return (
    <Fig w={W} h={loupe ? LY + LH + 6 : 118} label={`En linjal och ${q.thing}`}>
      <rect x={x(q.s!)} y={14} width={(q.e! - q.s!) * CM} height={20} rx={mm ? 2 : 9} class="geo-thing" />
      <line x1={x(q.s!)} x2={x(q.s!)} y1={34} y2={mm ? 70 : 56} class="geo-guide" />
      <line x1={x(q.e!)} x2={x(q.e!)} y1={34} y2={mm ? 70 : 56} class="geo-guide" />
      <rect x={X0 - 8} y={56} width={15 * CM + 16} height={56} rx={6} class="geo-ruler" />
      {Array.from({ length: 151 }, (_, i) => {
        const big = i % 10 === 0, half = i % 5 === 0;
        if (!mm && !half) return null;
        return <line key={i} x1={x(i / 10)} x2={x(i / 10)} y1={56} y2={56 + (big ? 18 : half ? 12 : 7)} class="geo-tick" />;
      })}
      {Array.from({ length: 16 }, (_, i) => <Txt key={`n${i}`} at={[x(i), 86]} cls="geo-small">{i}</Txt>)}
      <Txt at={[x(15) - 4, 104]} cls="geo-small">cm</Txt>
      {loupe && <Loupe q={q} at={q.s!} ox={W / 2 - LW - 6} name="start" />}
      {loupe && <Loupe q={q} at={q.e!} ox={W / 2 + 6} name="slut" />}
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
