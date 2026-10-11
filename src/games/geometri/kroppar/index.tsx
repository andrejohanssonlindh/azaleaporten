import { drillModule } from '../../../engines/drill/DrillView';
import type { DrillGame } from '../../../engines/drill/types';
import { Fig, path, Txt, type Pt } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, notes, solution, SOLIDS, specsForSkill, type KQ } from './logic';

// Kroksbäck som frågefabrik: kroppar med dolda kanter streckade, och rätblock byggda av kuber.

type Edge = [Pt, Pt, boolean?]; // true = dold (streckad)

/** Kroppar med raka kanter: hörn, kanter (dolda markerade) och de synliga ytorna. */
const POLY: Record<number, { edges: Edge[]; faces: Pt[][] }> = (() => {
  const box = (x0: number, y0: number, w: number, h: number, dx: number, dy: number) => {
    const F: Pt[] = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]];
    const B: Pt[] = F.map(([x, y]) => [x + dx, y + dy]);
    return {
      edges: [[F[0], F[1]], [F[1], F[2]], [F[2], F[3]], [F[3], F[0]], [B[0], B[1]], [B[1], B[2]], [B[2], B[3], true], [B[3], B[0], true], [F[0], B[0]], [F[1], B[1]], [F[2], B[2]], [F[3], B[3], true]] as Edge[],
      faces: [F, [F[0], F[1], B[1], B[0]], [F[1], B[1], B[2], F[2]]],
    };
  };
  const A: Pt = [80, 150], Bp: Pt = [190, 150], C: Pt = [230, 120], D: Pt = [120, 120], T: Pt = [155, 30];
  const p = { FL: [80, 150] as Pt, FR: [180, 150] as Pt, FT: [130, 70] as Pt, BL: [130, 120] as Pt, BR: [230, 120] as Pt, BT: [180, 40] as Pt };
  const t = { A: [80, 150] as Pt, B: [200, 150] as Pt, C: [238, 112] as Pt, D: [150, 32] as Pt };
  return {
    0: box(92, 72, 82, 82, 42, -32),
    1: box(56, 84, 150, 70, 44, -32),
    5: { edges: [[A, Bp], [Bp, C], [C, D, true], [D, A, true], [A, T], [Bp, T], [C, T], [D, T, true]], faces: [[A, Bp, T], [Bp, C, T]] },
    6: { edges: [[p.FL, p.FR], [p.FR, p.FT], [p.FT, p.FL], [p.BL, p.BR, true], [p.BR, p.BT], [p.BT, p.BL, true], [p.FL, p.BL, true], [p.FR, p.BR], [p.FT, p.BT]], faces: [[p.FL, p.FR, p.FT], [p.FR, p.BR, p.BT, p.FT], [p.FT, p.BT, p.BL, p.FL]] },
    7: { edges: [[t.A, t.B], [t.B, t.C], [t.C, t.A, true], [t.A, t.D], [t.B, t.D], [t.C, t.D]], faces: [[t.A, t.B, t.D], [t.B, t.C, t.D]] },
  };
})();

function Round({ kind }: { kind: number }) {
  // 2 cylinder, 3 klot, 4 kon. Bakre halvan av ellipserna är streckad.
  const half = (cx: number, cy: number, rx: number, ry: number, back: boolean) =>
    `M${cx - rx} ${cy} A${rx} ${ry} 0 0 ${back ? 1 : 0} ${cx + rx} ${cy}`;
  if (kind === 2) return (
    <g>
      <path d={`M95 50 L95 150 ${half(150, 150, 55, 16, false).replace('M', 'L')} L205 50 Z`} class="geo-solid" />
      <ellipse cx={150} cy={50} rx={55} ry={16} class="geo-solid top" />
      <path d={half(150, 150, 55, 16, true)} class="geo-hidden" />
    </g>
  );
  if (kind === 3) return (
    <g>
      <circle cx={150} cy={95} r={72} class="geo-solid" />
      <path d={half(150, 95, 72, 18, false)} class="geo-edge" />
      <path d={half(150, 95, 72, 18, true)} class="geo-hidden" />
      <ellipse cx={122} cy={62} rx={14} ry={9} class="geo-shine" />
    </g>
  );
  return (
    <g>
      <path d={`M150 24 L90 150 ${half(150, 150, 60, 16, false).replace('M90 150', '')} Z`} class="geo-solid" />
      <path d={half(150, 150, 60, 16, true)} class="geo-hidden" />
    </g>
  );
}

function Solid({ kind }: { kind: number }) {
  if (kind === 2 || kind === 3 || kind === 4) return <Round kind={kind} />;
  const s = POLY[kind];
  return (
    <g>
      {s.faces.map((f, i) => <path key={i} d={path(f)} class={`geo-solid${i === 1 ? ' top' : i === 2 ? ' side' : ''}`} />)}
      {s.edges.map(([a, b, hidden], i) => <line key={`e${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} class={hidden ? 'geo-hidden' : 'geo-edge'} />)}
    </g>
  );
}

/* ---------- kuber i isometri ---------- */

const S = 26;
const iso = (x: number, y: number, z: number): Pt => [(x - y) * S * 0.866, (x + y) * S * 0.5 - z * S];

function Cubes({ cubes, label }: { cubes: [number, number, number][]; label: string }) {
  const sorted = [...cubes].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  const faces = sorted.flatMap(([x, y, z], i) => [
    { d: path([iso(x, y, z + 1), iso(x + 1, y, z + 1), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)]), cls: 'geo-cube top', k: `${i}t` },
    { d: path([iso(x + 1, y, z), iso(x + 1, y + 1, z), iso(x + 1, y + 1, z + 1), iso(x + 1, y, z + 1)]), cls: 'geo-cube right', k: `${i}r` },
    { d: path([iso(x, y + 1, z), iso(x + 1, y + 1, z), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)]), cls: 'geo-cube left', k: `${i}l` },
  ]);
  const pts = cubes.flatMap(([x, y, z]) => [iso(x, y + 1, z), iso(x + 1, y, z), iso(x, y, z + 1), iso(x + 1, y + 1, z)]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs) - 10, Math.min(...ys) - 10];
  const w = Math.max(...xs) - x0 + 10, h = Math.max(...ys) - y0 + 10;
  return (
    <Fig w={Math.max(160, w)} h={h} label={label}>
      <g transform={`translate(${-x0 + Math.max(0, (160 - w) / 2)} ${-y0})`}>{faces.map((f) => <path key={f.k} d={f.d} class={f.cls} />)}</g>
    </Fig>
  );
}

function Block({ q }: { q: KQ }) {
  const [l, b, h] = q.dims!;
  // Ett rätblock med mått: framsidan l × h, djupet b.
  const k = Math.min(150 / l, 90 / h), d = Math.min(36, (b / Math.max(l, b)) * 60);
  const x0 = 50, y0 = 50;
  const F: Pt[] = [[x0, y0], [x0 + l * k, y0], [x0 + l * k, y0 + h * k], [x0, y0 + h * k]];
  const B: Pt[] = F.map(([x, y]) => [x + d, y - d * 0.75]);
  const u = 'cm';
  return (
    <Fig w={300} h={Math.round(y0 + h * k + 34)} label={q.liters ? 'Ett akvarium' : 'Ett rätblock med mått'}>
      <path d={path(F)} class={`geo-solid${q.liters ? ' water' : ''}`} />
      <path d={path([F[0], F[1], B[1], B[0]])} class="geo-solid top" />
      <path d={path([F[1], B[1], B[2], F[2]])} class={`geo-solid side${q.liters ? ' water' : ''}`} />
      <Txt at={[(F[2][0] + F[3][0]) / 2, F[2][1] + 16]}>{l} {u}</Txt>
      <Txt at={[(F[2][0] + B[2][0]) / 2 + 26, (F[2][1] + B[2][1]) / 2 + 4]}>{b} {u}</Txt>
      <Txt at={[F[0][0] - 28, (F[0][1] + F[3][1]) / 2]}>{h} {u}</Txt>
    </Fig>
  );
}

function Visual({ q }: { q: KQ; hint: boolean; done: boolean }) {
  switch (q.mode) {
    case 'namn': return q.thing
      ? <div class="geo-thing-icon" role="img" aria-label={q.thing[0]}>{q.thing[1]}</div>
      : <Fig w={300} h={190} label="En kropp"><Solid kind={q.solid!} /></Fig>;
    case 'delar': return <Fig w={300} h={190} label={`En ${SOLIDS[q.solid!]}`}><Solid kind={q.solid!} /></Fig>;
    case 'kuber': {
      const [l, w, h] = q.dims!;
      const cubes: [number, number, number][] = [];
      for (let x = 0; x < l; x++) for (let y = 0; y < w; y++) for (let z = 0; z < (q.stairs ? q.stairs[x] : h); z++) cubes.push([x, y, z]);
      return <Cubes cubes={cubes} label={q.stairs ? 'En trappa av kuber' : 'Ett rätblock av kuber'} />;
    }
    case 'volym': return <Block q={q} />;
    case 'liter': return null;
  }
}

export const kropparGame: DrillGame<KQ> = { id: 'kroppar', make: makeQ, specsForSkill, diagnose, explain, solution, hint, notes, Visual, errLabels: ERR };

export const kroppar = drillModule(kropparGame);
