import type { ComponentChildren } from 'preact';
import type { Steg } from '../platform/rpg/vaxt';

// Det som växer fram på kartan, region för region (stegen räknas i platform/rpg/vaxt.ts).
// Varje lager ritas när regionen har nått sitt steg; ett lager som hjälten inte har sett förut
// poppar fram en gång (klassen isle-new).

export interface GrowthProps { steg: Steg; seen: number }

function Lager({ n, steg, seen, children }: GrowthProps & { n: number; children: ComponentChildren }) {
  if (steg < n) return null;
  return <g class={n > seen ? 'isle-grow isle-new' : 'isle-grow'} aria-hidden="true">{children}</g>;
}

/** En femuddig stjärna kring (cx, cy). */
function star(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return <polygon points={pts.join(' ')} fill="#ffd43b" stroke="#e8590c" stroke-width=".8" />;
}

/** En flagga på en topp; dir = -1 vajar åt vänster. */
function Flagga({ x, y, color, dir = 1 }: { x: number; y: number; color: string; dir?: number }) {
  return <g><path d={`M${x} ${y} v-18`} stroke="#495057" stroke-width="1.5" /><path d={`M${x} ${y - 18} l${13 * dir} 4 l${-13 * dir} 4 z`} fill={color} /></g>;
}

const LAMPFARG = ['#ffe066', '#ff8787', '#69db7c', '#4dabf7'];

/** Små lampor som tindrar; [x, y, färg?] där färg är ett index i LAMPFARG. */
function Lampor({ at, cls = 'isle-twinkle', r = 1.8 }: { at: number[][]; cls?: string; r?: number }) {
  return <>{at.map(([x, y, c = 0], i) => <circle key={i} class={cls} style={{ animationDelay: `${(i * 0.37) % 1.6}s` }} cx={x} cy={y} r={r} fill={LAMPFARG[c]} />)}</>;
}

export function TalbergenGrowth(p: GrowthProps) {
  return (
    <>
      <Lager n={1} {...p}>
        <path d="M226 182 Q246 170 236 157 Q226 144 246 132 Q258 122 252 110" fill="none" stroke="#f4e3b5" stroke-width="2.2" stroke-dasharray="2 3" stroke-linecap="round" />
        <path d="M222 182 v-9 M218 174 h9" stroke="#8d6e4a" stroke-width="1.8" stroke-linecap="round" />
      </Lager>
      <Lager n={2} {...p}><Flagga x={256} y={87} color="#e64980" /></Lager>
      <Lager n={3} {...p}>
        <Lampor at={[[239, 166], [231, 150], [244, 134], [252, 120]]} />
        <circle cx="310" cy="112" r="8.5" fill="none" stroke="#ffd43b" stroke-width="2" />
      </Lager>
      <Lager n={4} {...p}>
        <Flagga x={206} y={109} color="#ffd43b" />
        <Flagga x={296} y={134} color="#4dabf7" dir={-1} />
        {star(310, 64, 8)}
      </Lager>
    </>
  );
}

const TREES = [[130, 300], [152, 284], [174, 300], [140, 262], [168, 258], [120, 330], [158, 318], [186, 326], [196, 280]];

export function OrdskogenGrowth(p: GrowthProps) {
  return (
    <>
      <Lager n={1} {...p}>
        {[[127, 305], [150, 290], [172, 306], [200, 287], [138, 268], [184, 264], [118, 335]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.3" fill={['#f783ac', '#ffe066', '#fff'][i % 3]} />
        ))}
      </Lager>
      <Lager n={2} {...p}>
        <ellipse cx="144" cy="360" rx="12" ry="5.5" fill="#4dabf7" stroke="#1c7ed6" stroke-width=".8" />
        <circle cx="140" cy="359" r="2.4" fill="#40c057" /><circle cx="149" cy="361" r="1.8" fill="#40c057" />
      </Lager>
      <Lager n={3} {...p}>
        <Lampor at={[[140, 250], [162, 272], [186, 250], [132, 288], [178, 294], [204, 266]]} r={1.6} />
      </Lager>
      <Lager n={4} {...p}>
        {TREES.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
          <g key={i}><circle cx={x + 9} cy={y - 14} r="2.6" fill="#f06595" /><circle cx={x + 15} cy={y - 8} r="2.3" fill="#fcc2d7" /></g>
        ))}
      </Lager>
    </>
  );
}

export function BetongbuktenGrowth(p: GrowthProps) {
  return (
    <>
      <Lager n={1} {...p}>
        <rect x="270" y="425" width="9" height="4" rx="2" fill="#e64980" />
        <rect x="281" y="424" width="9" height="4" rx="2" fill="#4dabf7" />
        <rect x="314" y="422" width="9" height="4" rx="2" fill="#ffd43b" />
      </Lager>
      <Lager n={2} {...p}>
        <path d="M318 384 h18 M321 384 v5 M333 384 v5" stroke="#495057" stroke-width="1.8" stroke-linecap="round" />
        <path d="M258 396 l3 -8 l3 8 z M266 392 l3 -8 l3 8 z" fill="#fd7e14" stroke="#fff" stroke-width=".6" />
      </Lager>
      <Lager n={3} {...p}>
        <path d="M258 380 v-16 M344 373 v-18" stroke="#495057" stroke-width="1.4" />
        <path d="M258 364 Q300 374 344 355" fill="none" stroke="#fff" stroke-width="1" />
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t, i) => {
          const x = 258 + t * 86, y = (1 - t) * (1 - t) * 364 + 2 * (1 - t) * t * 374 + t * t * 355;
          return <path key={i} d={`M${x - 3} ${y} h6 l-3 6 z`} fill={['#e64980', '#ffd43b', '#4dabf7'][i % 3]} />;
        })}
      </Lager>
      <Lager n={4} {...p}>
        <path d="M262 420 a22 22 0 0 1 22 -22 M335 420 a22 22 0 0 0 -22 -22" fill="none" stroke="#fcc419" stroke-width="2.4" />
        <path d="M295 371 h10 v3 a5 5 0 0 1 -10 0 z M299 379 h2 v3 h3 v2 h-8 v-2 h3 z" fill="#fcc419" stroke="#e67700" stroke-width=".6" />
      </Lager>
    </>
  );
}

export function VasteronGrowth(p: GrowthProps) {
  return (
    <>
      <Lager n={1} {...p}>
        <path d="M8 262 h24 l-5 6 h-14 z" fill="#8d6e4a" />
        <path d="M20 260 v-16 l10 14 z" fill="#fff" />
      </Lager>
      <Lager n={2} {...p}>
        <path d="M38 314 L40 300" stroke="#8d6e4a" stroke-width="2.5" />
        <path d="M40 300 q-8 -2 -11 3 M40 300 q8 -2 11 2 M40 300 q-3 -6 -9 -6 M40 300 q3 -6 9 -5" stroke="#2f9e44" stroke-width="2.5" fill="none" stroke-linecap="round" />
      </Lager>
      <Lager n={3} {...p}>
        <path class="isle-beam" d="M66 279 L38 270 L38 282 Z M73 279 L101 270 L101 282 Z" fill="#ffe066" opacity=".7" />
        <circle cx="69.5" cy="279" r="2.2" fill="#ffe066" />
      </Lager>
      <Lager n={4} {...p}>
        <rect x="80" y="313" width="12" height="8" rx="1.5" fill="#a0522d" stroke="#5c3317" stroke-width=".7" />
        <path d="M80 316 h12" stroke="#fcc419" stroke-width="1.4" /><circle cx="86" cy="317" r="1.2" fill="#fcc419" />
        {star(69.5, 268, 4.5)}
      </Lager>
    </>
  );
}

export function KompassonGrowth(p: GrowthProps) {
  return (
    <>
      <Lager n={1} {...p}>
        <circle cx="38" cy="165" r="5" fill="#fff" stroke="#8d6e4a" stroke-width="1" />
        <path d="M38 161 l1.6 4 h-3.2 z" fill="#e03131" /><path d="M38 169 l1.6 -4 h-3.2 z" fill="#495057" />
      </Lager>
      <Lager n={2} {...p}>
        <circle cx="22" cy="112" r="7" fill="#4dabf7" />
        <path d="M22 105 q-3.5 7 0 14 q3.5 -7 0 -14" fill="#fff" />
        <path d="M16.5 116 L20 123 M27.5 116 L24 123" stroke="#8d6e4a" stroke-width=".7" />
        <rect x="19.5" y="122.5" width="5" height="3.5" rx=".8" fill="#8d6e4a" />
      </Lager>
      <Lager n={3} {...p}>
        <Lampor at={[[56, 124, 0], [61, 119, 0], [47, 117, 3], [66, 112, 0]]} r={1.5} />
      </Lager>
      <Lager n={4} {...p}>
        <circle cx="70" cy="142" r="11.5" fill="none" stroke="#fcc419" stroke-width="2.2" />
        {star(70, 126, 4.5)}
      </Lager>
    </>
  );
}

export function RobotonGrowth(p: GrowthProps) {
  return (
    <>
      <Lager n={1} {...p}>
        <path d="M382 478 v-15" stroke="#495057" stroke-width="1.5" />
        <circle class="isle-blink" cx="382" cy="462" r="2.4" fill="#ff6b6b" />
      </Lager>
      <Lager n={2} {...p}>
        <circle cx="346" cy="476" r="5" fill="none" stroke="#868e96" stroke-width="3" stroke-dasharray="2 1.93" />
        <circle cx="346" cy="476" r="3.2" fill="#adb5bd" /><circle cx="346" cy="476" r="1.2" fill="#495057" />
      </Lager>
      <Lager n={3} {...p}>
        <Lampor at={[[340, 487, 1], [351, 491, 2], [377, 491, 3], [388, 485, 0]]} cls="isle-blink" r={1.8} />
      </Lager>
      <Lager n={4} {...p}>
        <path d="M389 470 v-12 l3 -7 l3 7 v12 z" fill="#f8f9fa" stroke="#495057" stroke-width=".7" />
        <circle cx="392" cy="460" r="1.4" fill="#4dabf7" />
        <path d="M389 470 l-2 4 h2 z M395 470 l2 4 h-2 z" fill="#e03131" />
        <path class="isle-flame" d="M390 470 l2 6 l2 -6 z" fill="#ff922b" />
      </Lager>
    </>
  );
}
