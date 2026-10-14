import type { JSX } from 'preact';
import type { Karta, Linje, Prick, Ros, Yta } from './types';

// Ritar en Karta i SVG. Färgerna är temats (kar-* i styles.css), så att mörkt läge fungerar.
// Det som frågas om markeras med tjock kant och ränder, aldrig bara med färg.
// Platser som går att trycka på har en osynlig, bredare träffyta, så att ett tryck nära gränsen räknas.
// Rätt plats (fore) ritas sist: ett tryck precis på gränsen till grannen räknas då som rätt – det är geografi som övas, inte fingertoppar.

export interface KartaProps {
  k: Karta;
  onTap?: (id: string) => void;
  /** Platsen som barnet har valt (innan Svara). */
  vald?: string;
  /** Platser som redan är fel tryckta (gråas ut). */
  off?: string[];
  /** Platser som lyser (det frågan handlar om). */
  lyser?: string[];
  /** Platser som visas med namn (när frågan är klar). */
  visa?: string[];
  /** Ritas sist (rätt svar vid peka). */
  fore?: string;
  class?: string;
}

const RIKTNINGAR = ['N', 'NO', 'Ö', 'SO', 'S', 'SV', 'V', 'NV'];

function cls(base: string, id: string, p: KartaProps) {
  return `${base}${p.lyser?.includes(id) ? ' lyser' : ''}${p.vald === id ? ' vald' : ''}${p.off?.includes(id) ? ' off' : ''}${p.visa?.includes(id) ? ' visa' : ''}`;
}

/** Gör ett element tryckbart (mus, finger och tangentbord). Namnet sägs inte: det kan vara svaret. */
interface TapProps {
  role?: 'button';
  tabIndex?: number;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}

function tapProps(id: string, n: number, p: KartaProps): TapProps {
  if (!p.onTap || p.off?.includes(id)) return {};
  const go = () => p.onTap!(id);
  return {
    role: 'button', tabIndex: 0, 'aria-label': `Plats ${n + 1}`, 'aria-pressed': p.vald === id,
    onClick: go, onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } },
  };
}

/** fore flyttas sist bland sina egna sort (ett hav ritas aldrig ovanpå land). */
function order<T extends { id: string; typ?: string }>(xs: T[], fore?: string): T[] {
  const f = fore ? xs.find((x) => x.id === fore) : undefined;
  if (!f) return xs;
  const rest = xs.filter((x) => x !== f);
  let at = rest.length;
  for (let i = rest.length - 1; i >= 0; i--) if (rest[i].typ === f.typ) { at = i + 1; break; }
  if (!rest.some((x) => x.typ === f.typ)) at = xs.indexOf(f);
  return [...rest.slice(0, at), f, ...rest.slice(at)];
}

function YtaRit({ y, n, p }: { y: Yta; n: number; p: KartaProps }) {
  const tap = !!(p.onTap && y.tap);
  return (
    <g class={cls(`kar-yta kar-${y.typ}${tap ? ' tap' : ''}`, y.id, p)} {...(tap ? tapProps(y.id, n, p) : {})}>
      <path class="kar-fyll" d={y.d} />
      {(p.lyser?.includes(y.id) || p.vald === y.id || p.visa?.includes(y.id)) && <path class="kar-rand" d={y.d} />}
      {tap && <path class="kar-hit" d={y.d} />}
    </g>
  );
}

function LinjeRit({ l, n, p }: { l: Linje; n: number; p: KartaProps }) {
  const tap = !!(p.onTap && l.tap);
  return (
    <g class={cls(`kar-linje kar-${l.typ}${tap ? ' tap' : ''}`, l.id, p)} {...(tap ? tapProps(l.id, n, p) : {})}>
      <path class="kar-streck" d={l.d} />
      {tap && <path class="kar-hit-linje" d={l.d} />}
    </g>
  );
}

function PrickRit({ pr, n, p }: { pr: Prick; n: number; p: KartaProps }) {
  const tap = !!(p.onTap && pr.tap);
  const hit = Math.max(pr.hit ?? 10, 6);
  return (
    <g class={cls(`kar-prick${pr.stor ? ' stor' : ''}${tap ? ' tap' : ''}`, pr.id, p)} {...(tap ? tapProps(pr.id, n, p) : {})}>
      {pr.ikon
        ? <text class="kar-ikon" x={pr.x} y={pr.y} text-anchor="middle" dominant-baseline="central">{pr.ikon}</text>
        : pr.stor ? <rect class="kar-punkt" x={pr.x - 3.6} y={pr.y - 3.6} width={7.2} height={7.2} /> : <circle class="kar-punkt" cx={pr.x} cy={pr.y} r={4} />}
      {(p.lyser?.includes(pr.id) || p.vald === pr.id) && <circle class="kar-ring" cx={pr.x} cy={pr.y} r={pr.ikon ? 15 : 8} />}
      {tap && <circle class="kar-hit" cx={pr.x} cy={pr.y} r={hit} />}
    </g>
  );
}

/** Kompassrosen. Bokstäverna står alltid upprätt, även när rosen är vriden. */
export function RosRit({ ros }: { ros: Ros }) {
  const { x, y, r, vrid = 0 } = ros;
  return (
    <g class="kar-ros" aria-hidden="true">
      <circle class="kar-ros-bg" cx={x} cy={y} r={r * 1.18} />
      {RIKTNINGAR.map((d, i) => {
        const a = ((vrid + i * 45) * Math.PI) / 180, len = i % 2 ? r * 0.62 : r;
        const tx = x + Math.sin(a) * len, ty = y - Math.cos(a) * len;
        const sx = Math.cos(a) * r * 0.14, sy = Math.sin(a) * r * 0.14;
        const on = ros.pil === d;
        return (
          <g key={d}>
            <polygon class={`kar-ros-pil${d === 'N' ? ' norr' : ''}${on ? ' on' : ''}${i % 2 ? ' liten' : ''}`} points={`${x + sx},${y + sy} ${tx},${ty} ${x - sx},${y - sy}`} />
            {(d === 'N' || ros.alla) && (
              <text class={`kar-ros-text${i % 2 ? ' liten' : ''}`} x={x + Math.sin(a) * (len + r * 0.3)} y={y - Math.cos(a) * (len + r * 0.3)} text-anchor="middle" dominant-baseline="central">{d}</text>
            )}
          </g>
        );
      })}
      <circle class="kar-ros-mitt" cx={x} cy={y} r={r * 0.1} />
    </g>
  );
}

/** Namnen på det som visas när frågan är klar. */
function Namn({ k, visa }: { k: Karta; visa: string[] }) {
  const out: JSX.Element[] = [];
  for (const id of visa) {
    const y = k.ytor.find((x) => x.id === id), l = k.linjer?.find((x) => x.id === id), pr = k.prickar?.find((x) => x.id === id);
    const at = pr ? { x: pr.x, y: pr.y - (pr.ikon ? 18 : 10), namn: pr.namn } : y ? { x: y.lx, y: y.ly, namn: y.namn } : l ? { x: l.lx, y: l.ly, namn: l.namn } : null;
    if (at?.namn && at.x !== undefined && at.y !== undefined) {
      out.push(<text key={id} class="kar-namn" x={at.x} y={at.y} text-anchor="middle" dominant-baseline="central">{at.namn}</text>);
    }
  }
  return <>{out}</>;
}

export function KartaView(p: KartaProps) {
  const { k } = p;
  const ytor = order(k.ytor, p.fore), linjer = order(k.linjer ?? [], p.fore), prickar = order(k.prickar ?? [], p.fore);
  let n = 0;
  return (
    <svg class={`kar-svg${p.class ? ` ${p.class}` : ''}${p.onTap ? ' kar-tryck' : ''}`} viewBox={`0 0 ${k.w} ${k.h}`} role="group" aria-label={k.titel}>
      <defs>
        <pattern id="kar-ranor" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <rect width="2" height="5" class="kar-ranor-streck" />
        </pattern>
      </defs>
      <rect class={k.hav ? 'kar-havbg' : 'kar-papper'} width={k.w} height={k.h} />
      {ytor.map((y) => <YtaRit key={y.id} y={y} n={y.tap ? n++ : 0} p={p} />)}
      {k.ekvator !== undefined && (
        <g class="kar-ekvator" aria-hidden="true">
          <path d={`M0 ${k.ekvator} H${k.w}`} />
          <text x={6} y={k.ekvator - 4}>Ekvatorn</text>
        </g>
      )}
      {linjer.map((l) => <LinjeRit key={l.id} l={l} n={l.tap ? n++ : 0} p={p} />)}
      {prickar.map((pr) => <PrickRit key={pr.id} pr={pr} n={pr.tap ? n++ : 0} p={p} />)}
      {k.etiketter?.map((e, i) => <text key={i} class={`kar-etikett${e.liten ? ' liten' : ''}`} x={e.x} y={e.y} text-anchor="middle" dominant-baseline="central">{e.text}</text>)}
      {k.skala && (
        <g class="kar-skala" aria-hidden="true">
          <path d={`M${k.skala.x} ${k.skala.y} h${k.skala.px} M${k.skala.x} ${k.skala.y - 4} v8 M${k.skala.x + k.skala.px} ${k.skala.y - 4} v8`} />
          <text x={k.skala.x + k.skala.px / 2} y={k.skala.y - 8} text-anchor="middle">{k.skala.text}</text>
        </g>
      )}
      {k.ros && <RosRit ros={k.ros} />}
      {p.visa && <Namn k={k} visa={p.visa} />}
    </svg>
  );
}
