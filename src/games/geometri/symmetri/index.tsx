import { drillModule } from '../../../engines/drill/DrillView';
import type { DrillGame } from '../../../engines/drill/types';
import { Cells, Fig, fitter, Poly, Txt, type Pt } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, mirror, solution, specsForSkill, type SQ } from './logic';

// Svampen som frågefabrik: speglar, symmetrilinjer, mönster och koordinatsystem.

function Spegla({ q, done }: { q: SQ; done: boolean }) {
  const g = q.grid!, n = g.length, cell = n === 5 ? 20 : n === 4 ? 24 : 28, side = n * cell;
  const small = Math.floor(78 / n), ow = n * small;
  const empty = g.map((row) => row.map(() => 0));
  const target = done ? mirror(g, q.axis!) : empty;
  const v = q.axis === 'v';
  const w = 300, top = 8;
  const optY = (v ? top + side : top + 2 * side + 12) + 44;
  const h = optY + ow + 8;
  return (
    <Fig w={w} h={h} label="Figur och spegel">
      {v ? (
        <>
          <Cells cells={g} x={150 - side - 6} y={top} size={cell} />
          <line x1={150} x2={150} y1={top - 4} y2={top + side + 4} class="geo-mirror" />
          <Cells cells={target} x={156} y={top} size={cell} cls="geo-target" />
        </>
      ) : (
        <>
          <Cells cells={g} x={150 - side / 2} y={top} size={cell} />
          <line x1={150 - side / 2 - 6} x2={150 + side / 2 + 6} y1={top + side + 6} y2={top + side + 6} class="geo-mirror" />
          <Cells cells={target} x={150 - side / 2} y={top + side + 12} size={cell} cls="geo-target" />
        </>
      )}
      {q.opts!.map((o, i) => (
        <g key={i}>
          <Txt at={[50 + i * 100, optY - 14]} cls="geo-label big">{'ABC'[i]}</Txt>
          <Cells cells={o} x={50 + i * 100 - ow / 2} y={optY} size={small} cls={done && i === q.answer ? 'geo-hit' : ''} />
        </g>
      ))}
    </Fig>
  );
}

function Linjer({ q, done }: { q: SQ; done: boolean }) {
  const s = q.shape!;
  const f = fitter(s.pts, 80, 20, 140, 140);
  const pts = s.pts.map(f.at);
  const xs = s.pts.map((p) => p[0]), ys = s.pts.map((p) => p[1]);
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * f.k * 0.62;
  return (
    <Fig w={300} h={180} label={`En ${s.name}`}>
      <Poly pts={pts} />
      {done && s.axes.map((ax, i) => {
        const [cx, cy] = f.at(ax.p), dx = Math.cos(ax.a) * R, dy = Math.sin(ax.a) * R;
        return <line key={i} x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} class="geo-mirror" />;
      })}
    </Fig>
  );
}

function Sym({ v, at: [x, y], r = 10, cls = 'geo-sym' }: { v: number; at: Pt; r?: number; cls?: string }) {
  if (v === 0) return <circle cx={x} cy={y} r={r} class={cls} />;
  if (v === 1) return <path d={`M${x} ${y - r} L${x + r} ${y + r * 0.8} L${x - r} ${y + r * 0.8} Z`} class={cls} />;
  if (v === 2) return <rect x={x - r * 0.85} y={y - r * 0.85} width={r * 1.7} height={r * 1.7} class={cls} />;
  const star = Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r * 1.1; return `${x + rr * Math.cos(a)} ${y + rr * Math.sin(a)}`; });
  return <path d={`M${star.join(' L')} Z`} class={cls} />;
}

function Upprepa({ q, done }: { q: SQ; done: boolean }) {
  const step = 27, n = q.shown!, w = Math.max(300, 20 + n * step + 80);
  return (
    <Fig w={w} h={74} label={`Ett mönster med ${n} former. Frågan gäller plats ${q.pos}.`}>
      {Array.from({ length: n }, (_, i) => <Sym key={i} v={q.unit![i % q.unit!.length]} at={[22 + i * step, 28]} />)}
      {Array.from({ length: n }, (_, i) => <Txt key={`n${i}`} at={[22 + i * step, 58]} cls="geo-small">{i + 1}</Txt>)}
      <Txt at={[22 + n * step + 6, 28]} cls="geo-label">…</Txt>
      {q.pos! > n + 1 && <Txt at={[22 + n * step + 6, 58]} cls="geo-small">{q.pos! - 1 > n + 1 ? `${n + 1}–${q.pos! - 1}` : n + 1}</Txt>}
      <rect x={w - 52} y={10} width={36} height={36} rx={8} class="geo-box" />
      {done ? <Sym v={q.answer} at={[w - 34, 28]} cls="geo-sym geo-hit" /> : <Txt at={[w - 34, 28]} cls="geo-label big">?</Txt>}
      <Txt at={[w - 34, 58]} cls="geo-small">{q.pos}</Txt>
    </Fig>
  );
}

function Vaxa({ q }: { q: SQ }) {
  const t = 16, gap = 28;
  const figs = [1, 2, 3];
  const width = (n: number) => ((q.start! > 0 ? 1 : 0) + n) * t;
  const tall = Math.max(q.start!, q.step!) * t;
  let x = 14;
  const out = figs.map((n) => {
    const x0 = x;
    x += width(n) + gap;
    return (
      <g key={n}>
        {Array.from({ length: q.start! }, (_, i) => <rect key={`s${i}`} x={x0} y={10 + tall - (i + 1) * t} width={t} height={t} class="geo-tile start" />)}
        {Array.from({ length: n }, (_, c) => Array.from({ length: q.step! }, (_, r) => (
          <rect key={`${c}-${r}`} x={x0 + ((q.start! > 0 ? 1 : 0) + c) * t} y={10 + tall - (r + 1) * t} width={t} height={t} class="geo-tile" />
        )))}
        <Txt at={[x0 + width(n) / 2, tall + 26]} cls="geo-small">Figur {n}</Txt>
      </g>
    );
  });
  return <Fig w={Math.max(260, x)} h={tall + 40} label="Figur 1, 2 och 3 i ett växande mönster">{out}</Fig>;
}

function Koordinat({ q, done }: { q: SQ; done: boolean }) {
  const c = 24, ox = 28, oy = 12, W = 10, H = 8;
  const X = (x: number) => ox + x * c, Y = (y: number) => oy + (H - y) * c;
  const [px, py] = q.pt!, { dir, m } = q.line!;
  const mirrored: Pt = dir === 'x' ? [2 * m - px, py] : [px, 2 * m - py];
  return (
    <Fig w={ox + W * c + 16} h={oy + H * c + 30} label={`Koordinatsystem med punkten P (${px}, ${py}) och linjen ${dir} = ${m}`}>
      {Array.from({ length: W + 1 }, (_, i) => <line key={`x${i}`} x1={X(i)} x2={X(i)} y1={Y(0)} y2={Y(H)} class="geo-gridline" />)}
      {Array.from({ length: H + 1 }, (_, i) => <line key={`y${i}`} x1={X(0)} x2={X(W)} y1={Y(i)} y2={Y(i)} class="geo-gridline" />)}
      <line x1={X(0)} x2={X(W)} y1={Y(0)} y2={Y(0)} class="geo-axis" />
      <line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(H)} class="geo-axis" />
      {Array.from({ length: W + 1 }, (_, i) => <Txt key={`lx${i}`} at={[X(i), Y(0) + 14]} cls="geo-small">{i}</Txt>)}
      {Array.from({ length: H + 1 }, (_, i) => <Txt key={`ly${i}`} at={[X(0) - 14, Y(i)]} cls="geo-small">{i}</Txt>)}
      {dir === 'x' ? <line x1={X(m)} x2={X(m)} y1={Y(0)} y2={Y(H)} class="geo-mirror" /> : <line x1={X(0)} x2={X(W)} y1={Y(m)} y2={Y(m)} class="geo-mirror" />}
      <circle cx={X(px)} cy={Y(py)} r={6} class="geo-point" />
      <Txt at={[X(px) + 12, Y(py) - 12]} cls="geo-label">P</Txt>
      {done && <><circle cx={X(mirrored[0])} cy={Y(mirrored[1])} r={6} class="geo-point hit" /><Txt at={[X(mirrored[0]) + 12, Y(mirrored[1]) - 12]} cls="geo-label">P′</Txt></>}
    </Fig>
  );
}

function Visual({ q, done }: { q: SQ; hint: boolean; done: boolean }) {
  switch (q.mode) {
    case 'spegla': return <Spegla q={q} done={done} />;
    case 'linjer': return <Linjer q={q} done={done} />;
    case 'upprepa': return <Upprepa q={q} done={done} />;
    case 'vaxa': return <Vaxa q={q} />;
    case 'koordinat': return <Koordinat q={q} done={done} />;
  }
}

export const symmetriGame: DrillGame<SQ> = { id: 'symmetri', make: makeQ, specsForSkill, diagnose, explain, solution, hint, Visual, errLabels: ERR };

export const symmetri = drillModule(symmetriGame);
