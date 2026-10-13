import { drillModule } from '../../../engines/drill/DrillView';
import { LEKTIONER } from './lektioner';
import type { DrillGame } from '../../../engines/drill/types';
import { Fig, fit, Poly, Txt, type Pt } from '../draw';
import { diagnose, ERR, explain, hint, makeQ, notes, solution, specsForSkill, type VQ } from './logic';

// Sibbarp som frågefabrik: vinklar, gradskivan, snurrar och vinkelsummor.

const rad = (d: number) => (d * Math.PI) / 180;
/** En punkt i riktningen d grader (moturs från höger, som i matten – skärmens y går nedåt). */
const dirPt = ([x, y]: Pt, d: number, r: number): Pt => [x + r * Math.cos(rad(d)), y - r * Math.sin(rad(d))];

function arc(c: Pt, from: number, to: number, r: number) {
  const [x1, y1] = dirPt(c, from, r), [x2, y2] = dirPt(c, to, r);
  const large = to - from > 180 ? 1 : 0;
  return `M${x1} ${y1} A${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
}

function Angle({ c, rot, deg, len, label, square }: { c: Pt; rot: number; deg: number; len: number; label?: string; square?: boolean }) {
  const [a, b] = [dirPt(c, rot, len), dirPt(c, rot + deg, len)];
  const s = 14;
  return (
    <g>
      <line x1={c[0]} y1={c[1]} x2={a[0]} y2={a[1]} class="geo-arm" />
      <line x1={c[0]} y1={c[1]} x2={b[0]} y2={b[1]} class="geo-arm" />
      {square ? (
        <path d={`M${dirPt(c, rot, s).join(' ')} L${dirPt(dirPt(c, rot, s), rot + 90, s).join(' ')} L${dirPt(c, rot + 90, s).join(' ')}`} class="geo-right" />
      ) : deg < 180 && <path d={arc(c, rot, rot + deg, 24)} class="geo-arc" />}
      {deg === 180 && <path d={arc(c, rot, rot + 180, 24)} class="geo-arc" />}
      <circle cx={c[0]} cy={c[1]} r={4} class="geo-vertex" />
      {label && <Txt at={dirPt(c, rot + deg / 2, 44)} cls="geo-label">{label}</Txt>}
    </g>
  );
}

function Sort({ q }: { q: VQ }) {
  return (
    <Fig w={300} h={190} label="En vinkel">
      <Angle c={[150, 100]} rot={q.rot!} deg={q.deg!} len={84} square={q.deg === 90 && q.level >= 1} label={q.level >= 2 ? `${q.deg}°` : undefined} />
    </Fig>
  );
}

function Jamfor({ q, done }: { q: VQ; done: boolean }) {
  return (
    <Fig w={320} h={190} label="Två vinklar, A och B">
      {q.pair!.map((p, i) => (
        <g key={i}>
          <Angle c={[80 + i * 160, 100]} rot={p.rot} deg={p.deg} len={p.arm * 72} label={done ? `${p.deg}°` : undefined} />
          <Txt at={[80 + i * 160, 178]} cls="geo-label big">{'AB'[i]}</Txt>
        </g>
      ))}
    </Fig>
  );
}

function Gradskiva({ q, done }: { q: VQ; done: boolean }) {
  const c: Pt = [170, 168], R = 152;
  const first = q.side === 'h' ? 0 : 180, second = q.side === 'h' ? q.deg! : 180 - q.deg!;
  return (
    <Fig w={340} h={182} label="En gradskiva med en vinkel">
      <path d={`${arc(c, 0, 180, R)} Z`} class="geo-protractor" />
      {Array.from({ length: 37 }, (_, i) => {
        const t = i * 5, big = t % 10 === 0;
        const [x1, y1] = dirPt(c, t, R), [x2, y2] = dirPt(c, t, R - (big ? 12 : 7));
        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} class="geo-tick" />;
      })}
      {Array.from({ length: 19 }, (_, i) => {
        const t = i * 10;
        return (
          <g key={`l${t}`}>
            <Txt at={dirPt(c, t, R - 22)} cls="geo-tiny outer">{180 - t}</Txt>
            <Txt at={dirPt(c, t, R - 42)} cls="geo-tiny inner">{t}</Txt>
          </g>
        );
      })}
      <line x1={c[0]} y1={c[1]} x2={dirPt(c, first, R + 12)[0]} y2={dirPt(c, first, R + 12)[1]} class="geo-arm" />
      <line x1={c[0]} y1={c[1]} x2={dirPt(c, second, R + 12)[0]} y2={dirPt(c, second, R + 12)[1]} class="geo-arm" />
      <path d={q.side === 'h' ? arc(c, 0, q.deg!, 30) : arc(c, second, 180, 30)} class="geo-arc" />
      <circle cx={c[0]} cy={c[1]} r={4} class="geo-vertex" />
      {done && <Txt at={dirPt(c, (first + second) / 2, 56)} cls="geo-label">{q.answer}°</Txt>}
    </Fig>
  );
}

function Varv({ q, hint: showHint, done }: { q: VQ; hint: boolean; done: boolean }) {
  const c: Pt = [150, 92];
  const show = q.level === 0 || showHint || done;
  const turns = q.turns!;
  const pts: Pt[] = [];
  for (let i = 0; i <= Math.ceil(turns * 72); i++) {
    const t = Math.min(turns * 360, i * 5);
    pts.push(dirPt(c, 90 - t, 34 + (t / 360) * 14));
  }
  const end = pts[pts.length - 1], prev = pts[pts.length - 2] ?? c;
  const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  const head = (d: number): Pt => [end[0] - 10 * Math.cos(ang + d), end[1] - 10 * Math.sin(ang + d)];
  return (
    <Fig w={300} h={180} label="En skejtare som snurrar">
      <text x={c[0]} y={c[1]} text-anchor="middle" dominant-baseline="central" font-size="34">🛹</text>
      {show && (
        <>
          <path d={`M${pts.map((p) => p.join(' ')).join(' L')}`} class="geo-turn" />
          <path d={`M${head(0.5).join(' ')} L${end.join(' ')} L${head(-0.5).join(' ')}`} class="geo-turn" />
        </>
      )}
    </Fig>
  );
}

function Rays({ q }: { q: VQ }) {
  const c: Pt = [150, q.kind === 'runt' ? 100 : 140];
  const known = q.angles!;
  const label = (x: number | null) => (x === null ? '?' : `${x}°`);
  if (q.kind === 'runt') {
    let acc = 0;
    const starts = known.map((x) => { const s = acc; acc += x ?? 0; return s; });
    const sizes = known.map((x) => x ?? 360 - known.reduce<number>((s, v) => s + (v ?? 0), 0));
    return (
      <Fig w={300} h={200} label="Vinklar runt en punkt">
        {starts.map((s, i) => <line key={i} x1={c[0]} y1={c[1]} x2={dirPt(c, s, 86)[0]} y2={dirPt(c, s, 86)[1]} class="geo-arm" />)}
        {starts.map((s, i) => <path key={`a${i}`} d={arc(c, s, s + sizes[i], 20 + (i % 2) * 6)} class="geo-arc" />)}
        {starts.map((s, i) => <Txt key={`t${i}`} at={dirPt(c, s + sizes[i] / 2, 52)} cls="geo-label">{label(known[i])}</Txt>)}
        <circle cx={c[0]} cy={c[1]} r={4} class="geo-vertex" />
      </Fig>
    );
  }
  const total = q.kind === 'rat' ? 90 : 180;
  const a = known[0]!;
  return (
    <Fig w={300} h={170} label={q.kind === 'rat' ? 'En rät vinkel delad i två' : 'Två vinklar längs en rak linje'}>
      <line x1={q.kind === 'rat' ? c[0] : c[0] - 120} y1={c[1]} x2={c[0] + 120} y2={c[1]} class="geo-arm" />
      {q.kind === 'rat' && <line x1={c[0]} y1={c[1]} x2={c[0]} y2={c[1] - 120} class="geo-arm" />}
      <line x1={c[0]} y1={c[1]} x2={dirPt(c, a, 120)[0]} y2={dirPt(c, a, 120)[1]} class="geo-arm" />
      <path d={arc(c, 0, a, 26)} class="geo-arc" />
      <path d={arc(c, a, total, 32)} class="geo-arc" />
      <Txt at={dirPt(c, a / 2, 54)} cls="geo-label">{label(a)}</Txt>
      <Txt at={dirPt(c, (a + total) / 2, 58)} cls="geo-label">?</Txt>
      <circle cx={c[0]} cy={c[1]} r={4} class="geo-vertex" />
    </Fig>
  );
}

function Corners({ q }: { q: VQ }) {
  const pts = fit(q.pts!, 40, 20, 220, 150);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return (
    <Fig w={300} h={190} label={q.kind === 'fyrhorning' ? 'En fyrhörning' : 'En triangel'}>
      <Poly pts={pts} />
      {pts.map((p, i) => {
        const d = Math.hypot(cx - p[0], cy - p[1]) || 1, k = Math.min(30, d * 0.5);
        const x = q.angles![i];
        return <Txt key={i} at={[p[0] + ((cx - p[0]) / d) * k, p[1] + ((cy - p[1]) / d) * k]} cls="geo-label small">{x === null ? '?' : `${x}°`}</Txt>;
      })}
    </Fig>
  );
}

function Visual({ q, hint: h, done }: { q: VQ; hint: boolean; done: boolean }) {
  switch (q.mode) {
    case 'sort': return <Sort q={q} />;
    case 'jamfor': return <Jamfor q={q} done={done} />;
    case 'gradskiva': return <Gradskiva q={q} done={done} />;
    case 'varv': return q.extra ? null : <Varv q={q} hint={h} done={done} />;
    case 'summa': return q.pts ? <Corners q={q} /> : <Rays q={q} />;
  }
}

export const vinklarGame: DrillGame<VQ> = { id: 'vinklar', make: makeQ, specsForSkill, diagnose, explain, solution, hint, notes, Visual, errLabels: ERR, lessons: LEKTIONER };

export const vinklar = drillModule(vinklarGame);
