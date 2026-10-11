import { drillModule } from '../../../engines/drill/DrillView';
import type { DrillGame } from '../../../engines/drill/types';
import { Fig, round1, sv, Txt } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, notes, PI, solution, specsForSkill, type CQ } from './logic';

// Stapelbäddsparken som frågefabrik: cirklar med radie och diameter, och ritningar i skala.

function Circle({ q, done }: { q: CQ; done: boolean }) {
  const cx = 150, R = q.part === 4 ? 110 : q.turns ? 66 : 72, cy = q.part === 2 ? 140 : q.part === 4 ? 150 : q.turns ? 104 : 95;
  const r = q.r!, d = 2 * r;
  const value = (k: 'r' | 'd') => `${k} = ${sv(k === 'r' ? r : d)} cm`;
  // Linjen som ritas (radie eller diameter), texten ovanför den och en rad under.
  let line: 'r' | 'd', top: string, below: string | null = null;
  if (q.mode === 'radie') { line = q.given!; top = value(q.given!); below = done ? value(q.ask!) : `${q.ask} = ?`; }
  else if (q.reverse) { line = 'd'; top = done ? value('d') : 'd = ?'; below = `O = ${sv(round1(PI * d))} cm`; }
  else { line = q.part === 4 ? 'r' : q.given!; top = value(line); }
  const label = q.part === 2 ? 'En halvcirkel' : q.part === 4 ? 'En kvartscirkel' : q.turns ? 'Ett skejthjul' : 'En cirkel';
  const ox = q.part === 4 ? cx - R / 2 : cx; // mittpunkten
  return (
    <Fig w={300} h={q.part === 2 ? 160 : 190} label={label}>
      {q.part === 2 ? <path d={`M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy} Z`} class="geo-shape" />
        : q.part === 4 ? <path d={`M${ox} ${cy} L${ox} ${cy - R} A${R} ${R} 0 0 1 ${ox + R} ${cy} Z`} class="geo-shape" />
          : <circle cx={cx} cy={cy} r={R} class={q.turns ? 'geo-wheel' : 'geo-shape'} />}
      {q.turns && <circle cx={cx} cy={cy} r={18} class="geo-hub" />}
      <line x1={line === 'd' ? ox - R : ox} y1={cy} x2={ox + R} y2={cy} class="geo-measure" />
      <Txt at={q.turns ? [cx, cy - R - 11] : [line === 'd' ? ox : ox + R / 2, cy - 14]}>{top}</Txt>
      {below && <Txt at={[ox, q.reverse ? cy + R + 12 : cy + 20]} cls="geo-label small">{below}</Txt>}
      <circle cx={ox} cy={cy} r={3.5} class="geo-vertex" />
    </Fig>
  );
}

function Ritning({ q }: { q: CQ }) {
  const { a, b } = q.scale!;
  const big = a > b;
  const len = big ? (q.toReal ? 200 : 60) : q.toReal ? 160 : 220;
  return (
    <Fig w={300} h={130} label={big ? 'En skruv på en bild' : 'En ritning över parken'}>
      <rect x={8} y={8} width={284} height={114} rx={10} class="geo-blueprint" />
      <Txt at={[240, 26]} cls="geo-small blue">Skala {a}:{b}</Txt>
      {q.toReal ? (
        <>
          {big ? <rect x={150 - len / 2} y={52} width={len} height={22} rx={4} class="geo-screw" /> : <path d={`M${150 - len / 2} 82 L${150 + len / 2} 82 L${150 + len / 2} 52 Q${150} 52 ${150 - len / 2} 82 Z`} class="geo-ramp" />}
          <line x1={150 - len / 2} y1={98} x2={150 + len / 2} y2={98} class="geo-measure" />
          <Txt at={[150, 110]} cls="geo-small blue">{sv(q.v!)} {q.vUnit}</Txt>
        </>
      ) : (
        <>
          <Txt at={[150, 66]} cls="geo-label">{big ? '🔩' : '🛹'} {sv(q.v!)} {q.vUnit} i verkligheten</Txt>
          <Txt at={[150, 96]} cls="geo-small blue">På {big ? 'bilden' : 'ritningen'}: ? {q.unit}</Txt>
        </>
      )}
    </Fig>
  );
}

function Visual({ q, done }: { q: CQ; hint: boolean; done: boolean }) {
  return q.mode === 'skala' ? <Ritning q={q} /> : <Circle q={q} done={done} />;
}

export const cirklarGame: DrillGame<CQ> = { id: 'cirklar', make: makeQ, specsForSkill, diagnose, explain, solution, hint, notes, Visual, errLabels: ERR };

export const cirklar = drillModule(cirklarGame);
