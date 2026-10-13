import { drillModule } from '../../engines/drill/DrillView';
import { LEKTIONER } from './lektioner';
import type { DrillGame } from '../../engines/drill/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type BQ, type F } from './logic';

// Bråkbageriet som frågefabrik: pajer och chokladkakor delade i bitar.

export function Pie({ f, size = 120 }: { f: F; size?: number }) {
  const r = size / 2 - 4, c = size / 2;
  const pt = (i: number) => {
    const a = (i / f.d) * 2 * Math.PI - Math.PI / 2;
    return `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
  };
  return (
    <svg class="pie" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Paj: ${f.n} av ${f.d} bitar färgade`}>
      <circle cx={c} cy={c} r={r} class="pie-empty" />
      {Array.from({ length: f.d }, (_, i) => (
        <path key={i} d={`M${c} ${c} L${pt(i)} A${r} ${r} 0 0 1 ${pt(i + 1)} Z`} class={i < f.n ? 'pie-full' : 'pie-slice'} />
      ))}
    </svg>
  );
}

export function Bar({ f, width = 200 }: { f: F; width?: number }) {
  const w = (width - 4) / f.d;
  return (
    <svg class="bar" width={width} height="44" viewBox={`0 0 ${width} 44`} role="img" aria-label={`Kaka: ${f.n} av ${f.d} bitar färgade`}>
      {Array.from({ length: f.d }, (_, i) => <rect key={i} x={2 + i * w} y="2" width={w} height="40" class={i < f.n ? 'bar-full' : 'bar-empty'} />)}
    </svg>
  );
}

function Groups({ whole, d, take }: { whole: number; d: number; take: number }) {
  const per = whole / d;
  return (
    <div class="groups" aria-label={`${whole} bullar i ${d} högar`}>
      {Array.from({ length: d }, (_, g) => (
        <span key={g} class={`group${g < take ? ' take' : ''}`}>{'🥯'.repeat(per)}</span>
      ))}
    </div>
  );
}

function Bakery({ q, hint: showHint }: { q: BQ; hint: boolean; done: boolean }) {
  const [a, b] = q.f;
  if (q.mode === 'namnge') return <div class="bakery">{q.shape === 'paj' ? <Pie f={a} /> : <Bar f={a} width={Math.min(300, 40 * a.d)} />}</div>;
  if (!showHint) return null;
  if (q.mode === 'jamfor') return <div class="bakery"><Pie f={a} size={96} /><Pie f={b} size={96} /></div>;
  if (q.mode === 'lika') return <div class="bakery col"><Bar f={a} width={240} /><Bar f={{ n: b.n, d: b.d }} width={240} /></div>;
  if (q.mode === 'delav' && q.whole! <= 40) return <Groups whole={q.whole!} d={a.d} take={a.n} />;
  if (q.mode === 'addera') return <div class="bakery col"><Bar f={a} width={240} /><Bar f={b} width={240} /></div>;
  return null;
}

export const brakGame: DrillGame<BQ> = { id: 'brak', make: makeQ, specsForSkill, diagnose, explain, solution, hint, Visual: Bakery, errLabels: ERR, lessons: LEKTIONER };

export const brak = drillModule(brakGame);
