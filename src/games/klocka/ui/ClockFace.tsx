import { pad } from '../logic/language';

// Urtavlan. Portad från v0.1 (drawClock). `ring` visar minuterna runt tavlan (ledtråd).

const cx = 120, cy = 120, r = 110;
const pt = (a: number, rad: number) => [(cx + rad * Math.sin(a)).toFixed(1), (cy - rad * Math.cos(a)).toFixed(1)];

export function ClockFace({ h, m, noHour = false, ring = false, size = 240 }: { h: number; m: number; noHour?: boolean; ring?: boolean; size?: number }) {
  const ha = (((h % 12) / 12) + m / 720) * 2 * Math.PI;
  const ma = (m / 60) * 2 * Math.PI;
  const [hx, hy] = pt(ha, 66);
  const [mx, my] = pt(ma, 90);
  return (
    <svg class="clock" viewBox="0 0 240 240" width={size} height={size} role="img"
      aria-label={noHour ? 'Klocka med bara minutvisare' : 'Analog klocka'}>
      <circle cx={cx} cy={cy} r={r} class="clock-face" stroke-width="2.5" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * 2 * Math.PI, big = i % 5 === 0;
        const [x1, y1] = pt(a, big ? r - 15 : r - 7);
        const [x2, y2] = pt(a, r - 3);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} class="clock-tick" stroke-width={big ? 2 : 0.8} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = pt(((i + 1) / 12) * 2 * Math.PI, r - 30);
        return <text key={i} x={x} y={y} text-anchor="middle" dominant-baseline="central" font-size="15" class="clock-num" font-weight="600">{i + 1}</text>;
      })}
      {ring && Array.from({ length: 12 }, (_, i) => {
        const [x, y] = pt((i / 12) * 2 * Math.PI, r - 54);
        return <text key={i} x={x} y={y} text-anchor="middle" dominant-baseline="central" font-size="11" class="clock-ring" font-weight="800">{pad(i * 5)}</text>;
      })}
      {!noHour && <line x1={cx} y1={cy} x2={hx} y2={hy} class="clock-hand" stroke-width="6" stroke-linecap="round" />}
      <line x1={cx} y1={cy} x2={mx} y2={my} class="clock-min" stroke-width="3.2" stroke-linecap="round" />
      <circle cx={cx} cy={cy} r="6" class={noHour ? 'clock-min-fill' : 'clock-hand-fill'} />
      <circle cx={cx} cy={cy} r="3.5" class="clock-min-fill" />
    </svg>
  );
}
