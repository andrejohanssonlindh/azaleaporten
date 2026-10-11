import { useEffect, useRef, useState } from 'preact/hooks';

// Himlen som visar tid på dygnet: sol 08–20, måne 20–08, högst upp kl 12 och 24.
// Används för att lära förmiddag/eftermiddag. Portad från v0.1 (drawSky/animateSky).

const SKY: [number, string, string, string][] = [[0, '#0b1430', '#1a2550', '#15221b'], [5, '#0b1430', '#1a2550', '#15221b'], [7, '#34508f', '#f3a97f', '#34502f'],
  [9, '#4f9fe0', '#cde9f8', '#6a9c46'], [17, '#4f9fe0', '#cde9f8', '#6a9c46'], [19, '#4a4f8e', '#f2925f', '#34502f'],
  [21, '#0e1838', '#1f2a58', '#15221b'], [24, '#0b1430', '#1a2550', '#15221b']];
const STARS = [[30, 20], [55, 38], [80, 14], [110, 30], [135, 10], [170, 26], [195, 12], [220, 34], [250, 18], [272, 40], [45, 58], [240, 56], [95, 52], [205, 50]];

const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, f: number) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join('');
};
function skyColors(t: number) {
  let i = 0;
  while (i < SKY.length - 2 && t >= SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], f = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
  return [1, 2, 3].map((k) => mix(a[k] as string, b[k] as string, f));
}
const arcPos = (p: number) => ({ x: 150 - 125 * Math.cos(Math.PI * p), y: 78 - 58 * Math.sin(Math.PI * p) });
const sunP = (t: number) => (t < 7.3 || t > 20.7 ? null : t <= 12 ? (t - 8) / 8 : 0.5 + (t - 12) / 16);
const moonP = (t: number) => (t >= 19.3 ? (t - 20) / 8 : t <= 8.7 ? 0.5 + t / 16 : null);
const nightness = (t: number) => (t < 5 || t > 21 ? 1 : t < 7 ? (7 - t) / 2 : t > 19 ? (t - 19) / 2 : 0);
const norm = (t: number) => ((t % 24) + 24) % 24;

let uid = 0;

/** t = timme med decimaler (0–24). Vid byte av t vandrar solen/månen fram till nya läget. */
export function Sky({ t, shortest = false }: { t: number; shortest?: boolean }) {
  const [shown, setShown] = useState(norm(t));
  const shownRef = useRef(shown);
  const id = useRef(`sky${++uid}`).current;

  useEffect(() => {
    const target = norm(t), from = shownRef.current;
    let delta = (((target - from) % 24) + 24) % 24;
    if (shortest && delta > 12) delta -= 24;
    const reduce = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || Math.abs(delta) < 0.01) { shownRef.current = target; setShown(target); return; }
    const dur = Math.min(1300, 450 + Math.abs(delta) * 45), t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const f = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - f, 3);
      const v = norm(from + delta * e);
      shownRef.current = v;
      setShown(v);
      if (f < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [t, shortest]);

  const [top, bot, ground] = skyColors(shown);
  const n = nightness(shown);
  const mp = moonP(shown), mpos = mp != null ? arcPos(mp) : null;
  const sp = sunP(shown), spos = sp != null ? arcPos(sp) : null;
  return (
    <svg class="sky" viewBox="0 0 300 100" role="img" aria-label="Himmel som visar tid på dygnet">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color={top} /><stop offset="1" stop-color={bot} /></linearGradient>
        {mpos && <mask id={`${id}-m`}><rect width="300" height="100" fill="white" /><circle cx={mpos.x + 6} cy={mpos.y - 4} r="10" fill="black" /></mask>}
      </defs>
      <rect width="300" height="100" fill={`url(#${id}-g)`} />
      {n > 0 && STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.4} fill="#fff" opacity={(n * 0.85).toFixed(2)} />)}
      <path d="M25 78 A125 58 0 0 1 275 78" fill="none" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 5" />
      <line x1="150" y1="14" x2="150" y2="25" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" />
      {spos && <><circle cx={spos.x} cy={spos.y} r="21" fill="#FFD45A" opacity=".28" /><circle cx={spos.x} cy={spos.y} r="12" fill="#FFC22E" /></>}
      {mpos && <circle cx={mpos.x} cy={mpos.y} r="11" fill="#F3EFD8" mask={`url(#${id}-m)`} />}
      <path d="M0 80 Q60 73 120 79 T240 77 T300 79 V100 H0 Z" fill={ground} />
    </svg>
  );
}
