import type { ComponentChildren } from 'preact';
import type { Rng } from '../../platform/rng';

// Gemensamma ritverktyg för Betongbuktens spel: månghörningar med mått på sidorna, räta vinklar, rutnät.
// Allt ritas i SVG med klasser (geo-*), så att färgerna följer ljust och mörkt läge.

export type Pt = [number, number];

export const range = (rng: Rng, lo: number, hi: number) => lo + rng.int(hi - lo + 1);
export const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
export const round1 = (x: number) => Math.round(x * 10 + 1e-9) / 10;
/** Tal med decimalkomma, så som de skrivs i frågorna. */
export const sv = (n: number) => String(Math.round(n * 1000) / 1000).replace('.', ',');

export const regular = (n: number, cx: number, cy: number, r: number, rot = -Math.PI / 2): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos(rot + (i * 2 * Math.PI) / n), cy + r * Math.sin(rot + (i * 2 * Math.PI) / n)]);

export const rotate = (pts: Pt[], a: number, cx: number, cy: number): Pt[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);

/** Flytt och skala som får punkterna att rymmas i rutan (x, y, w, h), centrerade. k = skalan. */
export function fitter(pts: Pt[], x: number, y: number, w: number, h: number): { at: (p: Pt) => Pt; k: number } {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min(w / (x1 - x0 || 1), h / (y1 - y0 || 1));
  const dx = x + (w - (x1 - x0) * k) / 2, dy = y + (h - (y1 - y0) * k) / 2;
  return { at: ([px, py]) => [dx + (px - x0) * k, dy + (py - y0) * k], k };
}

export const fit = (pts: Pt[], x: number, y: number, w: number, h: number): Pt[] => pts.map(fitter(pts, x, y, w, h).at);

const r1 = (n: number) => Math.round(n * 10) / 10;
export const path = (pts: Pt[], close = true) => `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L')}${close ? ' Z' : ''}`;
const twiceArea = (pts: Pt[]) => pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0);

/** Var en etikett för sida i (från hörn i till hörn i+1) ska stå: mitt på sidan, en bit utanför figuren. */
export function sidePos(pts: Pt[], i: number, off = 15): Pt {
  const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const s = twiceArea(pts) > 0 ? 1 : -1;
  return [(ax + bx) / 2 + (s * dy * off) / len, (ay + by) / 2 - (s * dx * off) / len];
}

export function Fig({ w, h, label, children, cls = '' }: { w: number; h: number; label: string; children: ComponentChildren; cls?: string }) {
  return (
    <div class="geo-wrap">
      <svg class={`geo ${cls}`} viewBox={`0 0 ${w} ${h}`} width={w} role="img" aria-label={label}>{children}</svg>
    </div>
  );
}

export function Poly({ pts, cls = 'geo-shape' }: { pts: Pt[]; cls?: string }) {
  return <path d={path(pts)} class={cls} />;
}

export function Txt({ at: [x, y], children, cls = 'geo-label' }: { at: Pt; children: ComponentChildren; cls?: string }) {
  return <text x={r1(x)} y={r1(y)} text-anchor="middle" dominant-baseline="central" class={cls}>{children}</text>;
}

/** Mått på sidorna; null = ingen etikett på den sidan. */
export function SideLabels({ pts, labels, off }: { pts: Pt[]; labels: (string | null)[]; off?: number }) {
  return <>{labels.map((l, i) => (l === null ? null : <Txt key={i} at={sidePos(pts, i, off)}>{l}</Txt>))}</>;
}

/** Små fyrkanter i hörnen som är räta vinklar. */
export function RightMarks({ pts, at, size = 11 }: { pts: Pt[]; at: number[]; size?: number }) {
  return (
    <>
      {at.map((i) => {
        const p = pts[i], a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
        const u = (q: Pt): Pt => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [((q[0] - p[0]) / l) * size, ((q[1] - p[1]) / l) * size]; };
        const [ua, ub] = [u(a), u(b)];
        return <path key={i} class="geo-right" d={`M${r1(p[0] + ua[0])} ${r1(p[1] + ua[1])} L${r1(p[0] + ua[0] + ub[0])} ${r1(p[1] + ua[1] + ub[1])} L${r1(p[0] + ub[0])} ${r1(p[1] + ub[1])}`} />;
      })}
    </>
  );
}

/** Numrerade prickar i hörnen (när man räknar hörn). */
export function CornerDots({ pts, numbers }: { pts: Pt[]; numbers: boolean }) {
  return (
    <>
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={r1(p[0])} cy={r1(p[1])} r={numbers ? 9 : 6} class="geo-dot" />
          {numbers && <Txt at={p} cls="geo-dot-n">{i + 1}</Txt>}
        </g>
      ))}
    </>
  );
}

/** Ett rutnät med ifyllda rutor. cells[rad][kolumn]: 0 tom, 1 fylld, 2 halv (nedre vänstra triangeln), 3 halv (övre högra). */
export function Cells({ cells, x = 0, y = 0, size, cls = '' }: { cells: number[][]; x?: number; y?: number; size: number; cls?: string }) {
  return (
    <g class={`geo-grid ${cls}`}>
      {cells.map((row, r) => row.map((c, k) => {
        const cx = x + k * size, cy = y + r * size;
        return (
          <g key={`${r}-${k}`}>
            <rect x={cx} y={cy} width={size} height={size} class="geo-cell" />
            {c === 1 && <rect x={cx} y={cy} width={size} height={size} class="geo-fill" />}
            {c === 2 && <path d={`M${cx} ${cy} L${cx} ${cy + size} L${cx + size} ${cy + size} Z`} class="geo-fill" />}
            {c === 3 && <path d={`M${cx} ${cy} L${cx + size} ${cy} L${cx + size} ${cy + size} Z`} class="geo-fill" />}
          </g>
        );
      }))}
    </g>
  );
}
