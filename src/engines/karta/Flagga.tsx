// Flaggor ritade i SVG (Windows ritar inga flagg-emoji). Förenklade: inga vapensköldar, men färger,
// ränder, kors, cirklar och stjärnor stämmer. Alla ritas i formatet 3:2 (30 × 20).

/** Grunden: lodräta ränder, vågräta ränder (w = relativa bredder), nordiskt kors, eller en färg. */
export type Bas =
  | { v: string[] }
  | { h: string[]; w?: number[] }
  | { kors: string; bg: string; inre?: string }
  | { fyll: string };

/** Det som ritas ovanpå. x, y, r i flaggans enheter (30 × 20). */
export type Extra =
  | { cirkel: string; x?: number; y?: number; r?: number; ring?: boolean }
  | { stjarna: string; x?: number; y?: number; r?: number }
  | { tri: string; w?: number }
  | { kanton: string; w?: number; h?: number }
  | { plus: string }
  | { romb: string }
  | { mane: string; bg: string }
  | { uk: true }
  | { usa: true };

export interface FlaggData { bas: Bas; extra?: Extra[] }

const W = 30, H = 20;

function star(cx: number, cy: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.4 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function BasRit({ b }: { b: Bas }) {
  if ('v' in b) return <>{b.v.map((c, i) => <rect key={i} x={(i * W) / b.v.length} y={0} width={W / b.v.length + 0.05} height={H} fill={c} />)}</>;
  if ('h' in b) {
    const w = b.w ?? b.h.map(() => 1), sum = w.reduce((a, x) => a + x, 0);
    let y = 0;
    return <>{b.h.map((c, i) => { const hh = (w[i] / sum) * H, el = <rect key={i} x={0} y={y} width={W} height={hh + 0.05} fill={c} />; y += hh; return el; })}</>;
  }
  if ('kors' in b) {
    return (
      <>
        <rect width={W} height={H} fill={b.bg} />
        {b.inre ? (
          <>
            <rect x={8} y={0} width={6} height={H} fill={b.kors} /><rect x={0} y={7} width={W} height={6} fill={b.kors} />
            <rect x={9.5} y={0} width={3} height={H} fill={b.inre} /><rect x={0} y={8.5} width={W} height={3} fill={b.inre} />
          </>
        ) : (
          <><rect x={9} y={0} width={4} height={H} fill={b.kors} /><rect x={0} y={8} width={W} height={4} fill={b.kors} /></>
        )}
      </>
    );
  }
  return <rect width={W} height={H} fill={b.fyll} />;
}

function ExtraRit({ e }: { e: Extra }) {
  if ('cirkel' in e) {
    const { x = 15, y = 10, r = 6 } = e;
    return e.ring ? <circle cx={x} cy={y} r={r} fill="none" stroke={e.cirkel} stroke-width={0.8} /> : <circle cx={x} cy={y} r={r} fill={e.cirkel} />;
  }
  if ('stjarna' in e) return <polygon points={star(e.x ?? 15, e.y ?? 10, e.r ?? 5)} fill={e.stjarna} />;
  if ('tri' in e) return <polygon points={`0,0 ${e.w ?? 15},${H / 2} 0,${H}`} fill={e.tri} />;
  if ('kanton' in e) return <rect x={0} y={0} width={e.w ?? 12} height={e.h ?? 10} fill={e.kanton} />;
  if ('plus' in e) return <><rect x={13} y={4} width={4} height={12} fill={e.plus} /><rect x={9} y={8} width={12} height={4} fill={e.plus} /></>;
  if ('romb' in e) return <polygon points={`15,2 28,10 15,18 2,10`} fill={e.romb} />;
  if ('mane' in e) return <><circle cx={12} cy={10} r={5} fill={e.mane} /><circle cx={13.3} cy={10} r={4} fill={e.bg} /><polygon points={star(18.2, 10, 2.2)} fill={e.mane} /></>;
  if ('uk' in e) {
    return (
      <>
        <rect width={W} height={H} fill="#012169" />
        <path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" stroke-width={4} />
        <path d="M0 0 L30 20 M30 0 L0 20" stroke="#C8102E" stroke-width={1.4} />
        <path d="M15 0 V20 M0 10 H30" stroke="#fff" stroke-width={6} />
        <path d="M15 0 V20 M0 10 H30" stroke="#C8102E" stroke-width={3.4} />
      </>
    );
  }
  // USA: 13 ränder och ett blått hörn med stjärnor (som prickar).
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => <rect key={i} x={0} y={(i * H) / 13} width={W} height={H / 13 + 0.05} fill={i % 2 ? '#fff' : '#B22234'} />)}
      <rect x={0} y={0} width={12} height={(7 * H) / 13} fill="#3C3B6E" />
      {Array.from({ length: 20 }, (_, i) => <circle key={`s${i}`} cx={1.2 + (i % 5) * 2.4 + (Math.floor(i / 5) % 2) * 1.2} cy={1.3 + Math.floor(i / 5) * 2.4} r={0.45} fill="#fff" />)}
    </>
  );
}

/** En flagga. label = vad skärmläsaren säger (utelämna när namnet är svaret). */
export function Flagga({ data, label, class: cls = 'flagga' }: { data: FlaggData; label?: string; class?: string }) {
  return (
    <svg class={cls} viewBox={`0 0 ${W} ${H}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
      <BasRit b={data.bas} />
      {data.extra?.map((e, i) => <ExtraRit key={i} e={e} />)}
      <rect width={W} height={H} fill="none" stroke="rgba(0,0,0,.18)" stroke-width={0.5} />
    </svg>
  );
}
