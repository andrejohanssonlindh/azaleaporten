import { drillModule } from '../../../engines/drill/DrillView';
import { LEKTIONER } from './lektioner';
import type { DrillGame } from '../../../engines/drill/types';
import { Cells, Fig, fit, Poly, RightMarks, SideLabels, sv, Txt, type Pt } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, notes, solution, specsForSkill, type AQ } from './logic';

// Bryggeriet som frågefabrik: rutnät, rektanglar, trianglar och L-former.

function Rutor({ q, hint: showHint }: { q: AQ; hint: boolean }) {
  const size = 30, g = q.cells!;
  const w = g[0].length * size, h = g.length * size;
  const t = q.tri;
  const tri: Pt[] | null = t ? [[size, h - size], [size * (1 + t.a), h - size], [size, h - size * (1 + t.b)]] : null;
  return (
    <Fig w={w + 8} h={h + 8} label={t ? 'En triangel på rutat papper' : 'En yta på rutat papper'}>
      <g transform="translate(4 4)">
        <Cells cells={g} size={size} />
        {tri && showHint && <rect x={tri[0][0]} y={tri[2][1]} width={t!.a * size} height={t!.b * size} class="geo-help" />}
        {tri && <Poly pts={tri} cls="geo-shape see-through" />}
      </g>
    </Fig>
  );
}

function Rektangel({ q }: { q: AQ }) {
  const [a, b] = [q.a!, q.b!];
  const k = Math.min(220 / a, 130 / b);
  const pts: Pt[] = [[40, 24], [40 + a * k, 24], [40 + a * k, 24 + b * k], [40, 24 + b * k]];
  const u = q.unit;
  return (
    <Fig w={300} h={190} label={q.square ? 'En kvadrat' : 'En rektangel'}>
      <Poly pts={pts} />
      {q.grid && Array.from({ length: a - 1 }, (_, i) => <line key={`v${i}`} x1={40 + (i + 1) * k} x2={40 + (i + 1) * k} y1={24} y2={24 + b * k} class="geo-inner" />)}
      {q.grid && Array.from({ length: b - 1 }, (_, i) => <line key={`h${i}`} x1={40} x2={40 + a * k} y1={24 + (i + 1) * k} y2={24 + (i + 1) * k} class="geo-inner" />)}
      <RightMarks pts={pts} at={[0, 1, 2, 3]} />
      <SideLabels pts={pts} labels={[`${sv(a)} ${u}`, q.square ? null : `${sv(b)} ${u}`, null, null]} off={16} />
    </Fig>
  );
}

function Saknad({ q }: { q: AQ }) {
  const pts: Pt[] = [[60, 30], [240, 30], [240, 150], [60, 150]];
  return (
    <Fig w={300} h={180} label="En rektangel där en sida fattas">
      <Poly pts={pts} />
      <RightMarks pts={pts} at={[0, 1, 2, 3]} />
      <SideLabels pts={pts} labels={[`${q.a} ${q.unit}`, '?', null, null]} off={16} />
      <Txt at={[150, 90]} cls="geo-label">{q.a! * q.b!} {q.unit}²</Txt>
    </Fig>
  );
}

function Triangel({ q }: { q: AQ }) {
  const [b, h] = [q.b!, q.h!];
  const p = q.right ? 0 : b * (q.level >= 3 ? 1.25 : 0.35);
  const raw: Pt[] = [[0, 0], [b, 0], [p, -h]];
  const pts = fit(raw, 40, 22, 220, 140);
  const foot: Pt = [pts[2][0], pts[0][1]];
  const u = q.unit;
  return (
    <Fig w={300} h={190} label={q.right ? 'En rätvinklig triangel' : 'En triangel med höjden inritad'}>
      {!q.right && p > b && <line x1={pts[1][0]} y1={pts[1][1]} x2={foot[0]} y2={foot[1]} class="geo-guide" />}
      <Poly pts={pts} />
      {q.right ? <RightMarks pts={pts} at={[0]} /> : (
        <>
          <line x1={pts[2][0]} y1={pts[2][1]} x2={foot[0]} y2={foot[1]} class="geo-height" />
          <RightMarks pts={[pts[2], foot, pts[1][0] > foot[0] ? pts[1] : pts[0]]} at={[1]} size={9} />
          <Txt at={[foot[0] + 22, (pts[2][1] + foot[1]) / 2]} cls="geo-label">{h} {u}</Txt>
        </>
      )}
      <SideLabels pts={pts} labels={[`${b} ${u}`, null, q.right ? `${h} ${u}` : `${q.s} ${u}`]} off={16} />
    </Fig>
  );
}

function Sammansatt({ q }: { q: AQ }) {
  const { W, H, w1, h1 } = q.L!;
  const raw: Pt[] = [[0, 0], [W, 0], [W, h1], [w1, h1], [w1, H], [0, H]];
  const pts = fit(raw, 46, 26, 208, 136);
  const u = q.unit;
  return (
    <Fig w={300} h={190} label="En L-formad figur">
      <Poly pts={pts} />
      <RightMarks pts={pts} at={[0, 1, 2, 4, 5]} />
      <SideLabels pts={pts} labels={[`${W} ${u}`, `${h1} ${u}`, null, null, `${w1} ${u}`, `${H} ${u}`]} off={17} />
    </Fig>
  );
}

function Visual({ q, hint: h }: { q: AQ; hint: boolean; done: boolean }) {
  switch (q.mode) {
    case 'rutor': return <Rutor q={q} hint={h} />;
    case 'rektangel': return <Rektangel q={q} />;
    case 'saknad': return <Saknad q={q} />;
    case 'triangel': return <Triangel q={q} />;
    case 'sammansatt': return <Sammansatt q={q} />;
  }
}

export const areaGame: DrillGame<AQ> = { id: 'area', make: makeQ, specsForSkill, diagnose, explain, solution, hint, notes, Visual, errLabels: ERR, lessons: LEKTIONER };

export const area = drillModule(areaGame);
