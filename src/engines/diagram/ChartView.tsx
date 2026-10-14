import { useRef } from 'preact/hooks';
import { fmtNum } from '../drill/check';
import { axisPos, pictos, tally, ticks, values, type Chart } from './chart';
import type { Plock } from './types';

// Diagrammen ritas från en Chart: streckdiagram, tabell och bilddiagram som rader i HTML,
// stapeldiagram i SVG. Färgerna är temats (dia-* i styles.css), så att mörkt läge fungerar.
// Staplar har alltid kategorins namn (och bild) under sig, och serie två är randig, så färgen är aldrig ensam ledtråd.

export interface ChartProps {
  chart: Chart;
  /** Värden att rita i stället för datans (när barnet bygger). */
  vals?: number[];
  /** Tryck på en del: 'k2' = kategori 2. */
  onTap?: (part: string) => void;
  /** Delar som redan är fel tryckta (gråas ut). */
  off?: string[];
  /** Kategorier som lyser (det frågan handlade om, när den är klar). */
  hit?: number[];
  /** Skriv värdet vid varje stapel (när frågan är klar). */
  showVals?: boolean;
  /** Barnet bygger: värde i kategori i ändras. */
  edit?: (i: number, v: number) => void;
}

const kp = (i: number) => `k${i}`;

/** Kategorins namn med bild framför. */
const Kat = ({ c, i }: { c: Chart; i: number }) => (
  <span class="dia-kat">{c.ikoner?.[i] && <span class="dia-kat-ikon" aria-hidden="true">{c.ikoner[i]}</span>}{c.kat[i]}</span>
);

/** Streck i femgrupper: fyra lodräta och ett snett över. */
export function Tally({ n }: { n: number }) {
  const { buntar, rest } = tally(n);
  const w = Math.max(8, buntar * 32 + rest * 7 + 4);
  const lines = [];
  for (let b = 0; b < buntar; b++) {
    const x0 = 4 + b * 32;
    for (let j = 0; j < 4; j++) lines.push(<line key={`${b}-${j}`} x1={x0 + j * 7} y1={4} x2={x0 + j * 7} y2={24} />);
    lines.push(<line key={`${b}-x`} x1={x0 - 4} y1={20} x2={x0 + 25} y2={8} />);
  }
  for (let j = 0; j < rest; j++) lines.push(<line key={`r${j}`} x1={4 + buntar * 32 + j * 7} y1={4} x2={4 + buntar * 32 + j * 7} y2={24} />);
  return <svg class="dia-tally" viewBox={`0 0 ${w} 28`} width={w} height={28} aria-hidden="true">{lines}</svg>;
}

/** Streckdiagram och tabell: en rad per kategori. */
function Rader({ chart: c, vals, onTap, off, hit, edit }: ChartProps) {
  const v = vals ?? values(c);
  const streck = c.typ === 'streck';
  return (
    <div class={`dia-tab${streck ? ' streck' : ''}`}>
      <div class="dia-rad head">
        <span>{c.katNamn}</span>
        <span>{streck ? 'Streck' : c.enhet === 'kg' ? 'Kilo' : `Antal ${c.enhet}`}</span>
      </div>
      {c.kat.map((_, i) => {
        const cls = `dia-rad${hit?.includes(i) ? ' hit' : ''}${off?.includes(kp(i)) ? ' off' : ''}`;
        const cells = (
          <>
            <span><Kat c={c} i={i} /></span>
            <span class="dia-varde">{streck ? <Tally n={v[i]} /> : fmtNum(v[i])}</span>
          </>
        );
        if (edit) {
          return (
            <div key={i} class={`${cls} bygg`}>
              {cells}
              <span class="dia-knappar">
                <button type="button" class="btn small" aria-label={`Ett streck mindre: ${c.kat[i]}`} disabled={v[i] <= 0} onClick={() => edit(i, v[i] - 1)}>−</button>
                <button type="button" class="btn small" aria-label={`Ett streck till: ${c.kat[i]}`} disabled={v[i] >= c.axel.max} onClick={() => edit(i, v[i] + 1)}>+</button>
              </span>
            </div>
          );
        }
        return onTap
          ? <button key={i} type="button" class={cls} disabled={off?.includes(kp(i))} onClick={() => onTap(kp(i))}>{cells}</button>
          : <div key={i} class={cls}>{cells}</div>;
      })}
    </div>
  );
}

/** Bilddiagram: bilder i rader, och nyckeln som säger vad en bild betyder. */
function Bilder({ chart: c, onTap, off, hit }: ChartProps) {
  const per = c.bild!.per;
  const ikon = (i: number) => c.bild!.ikon ?? c.ikoner?.[i] ?? '⬤';
  return (
    <div class="dia-bild">
      {c.kat.map((_, i) => {
        const { hela, halv } = pictos(values(c)[i], per);
        const cls = `dia-bild-rad${hit?.includes(i) ? ' hit' : ''}${off?.includes(kp(i)) ? ' off' : ''}`;
        const body = (
          <>
            <Kat c={c} i={i} />
            <span class="dia-bilder" aria-hidden="true">
              {Array.from({ length: hela }, (_, k) => <span key={k} class="dia-pikto">{ikon(i)}</span>)}
              {halv && <span class="dia-pikto halv"><span>{ikon(i)}</span></span>}
            </span>
          </>
        );
        return onTap
          ? <button key={i} type="button" class={cls} disabled={off?.includes(kp(i))} onClick={() => onTap(kp(i))}>{body}</button>
          : <div key={i} class={cls}>{body}</div>;
      })}
      <div class="dia-nyckel">
        <b>Nyckel:</b> {c.bild!.ikon ? <><span class="dia-pikto">{c.bild!.ikon}</span> = {per} {c.enhet}</> : <>1 bild = {per} {c.enhet}</>}
      </div>
    </div>
  );
}

// Stapeldiagrammets mått (viewBox).
const W = 320;

/** Ränderna på serie två (så att färgen inte är enda skillnaden). */
const Ranor = () => (
  <defs>
    <pattern id="dia-ranor" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" class="dia-rand" />
    </pattern>
  </defs>
);

/** Stapeldiagram, stående eller liggande, med en eller två serier. */
function Staplar({ chart: c, vals, onTap, off, hit, showVals, edit }: ChartProps) {
  const svg = useRef<SVGSVGElement>(null);
  const n = c.kat.length, s = c.serier.length;
  const tk = ticks(c);
  const val = (j: number, i: number) => (j === 0 && vals ? vals[i] : c.serier[j].v[i]);
  const ikon = (i: number) => c.ikoner?.[i] ?? '';
  const hasIkon = c.kat.some((_, i) => ikon(i));

  if (c.liggande) {
    const L = 104, R = 14, T = 8, rowH = 34, H = T + n * rowH + 30, pw = W - L - R;
    const x = (v: number) => L + pw * axisPos(c, v);
    const bh = s === 1 ? rowH * 0.6 : rowH * 0.36;
    return (
      <svg ref={svg} class="dia-svg" viewBox={`0 0 ${W} ${H}`} role={onTap ? 'group' : 'img'} aria-label={c.titel}>
        {s > 1 && <Ranor />}
        {tk.map((t) => (
          <g key={t}>
            <line class="dia-grid" x1={x(t)} x2={x(t)} y1={T} y2={T + n * rowH} />
            <text class="dia-tick" x={x(t)} y={T + n * rowH + 16} text-anchor="middle">{fmtNum(t)}</text>
          </g>
        ))}
        <text class="dia-axelnamn" x={W - R} y={H - 2} text-anchor="end">{c.enhet}</text>
        <line class="dia-axis" x1={L} x2={L} y1={T} y2={T + n * rowH} />
        {c.kat.map((k, i) => {
          const y0 = T + i * rowH + (rowH - s * bh - (s - 1) * 3) / 2;
          return (
            <g key={i} class={`${hit?.includes(i) ? 'hit' : ''}${off?.includes(kp(i)) ? ' off' : ''}`}>
              <text class="dia-katnamn" x={L - 8} y={T + i * rowH + rowH / 2 + 5} text-anchor="end">{ikon(i) ? `${ikon(i)} ${k}` : k}</text>
              {c.serier.map((_, j) => {
                const v = val(j, i);
                return (
                  <g key={j}>
                    <rect class={`dia-bar s${j}`} x={L} y={y0 + j * (bh + 3)} width={Math.max(0, x(v) - L)} height={bh} />
                    {j === 1 && <rect class="dia-hatch" x={L} y={y0 + j * (bh + 3)} width={Math.max(0, x(v) - L)} height={bh} />}
                    {showVals && <text class="dia-varde-txt" x={x(v) + 4} y={y0 + j * (bh + 3) + bh / 2 + 5}>{fmtNum(v)}</text>}
                  </g>
                );
              })}
              {onTap && (
                <rect class="dia-tap" x={0} y={T + i * rowH} width={W} height={rowH} role="button" tabIndex={off?.includes(kp(i)) ? -1 : 0} aria-label={k}
                  onClick={() => !off?.includes(kp(i)) && onTap(kp(i))}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !off?.includes(kp(i))) { e.preventDefault(); onTap(kp(i)); } }} />
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  const L = 42, R = 10, T = 26, B = hasIkon ? 46 : 30, H = 246, pw = W - L - R, ph = H - T - B;
  const y = (v: number) => T + ph * (1 - axisPos(c, v));
  const slot = pw / n;
  const bw = slot * (s === 1 ? 0.56 : 0.36);
  const bx = (i: number, j: number) => L + slot * i + (slot - s * bw - (s - 1) * 4) / 2 + j * (bw + 4);
  const base = y(c.lur?.axelStart ?? c.axel.min);

  // Bygga: tryck eller dra i en kolumn så blir stapeln så hög, avrundat till skalans steg.
  function setFrom(i: number, clientY: number) {
    if (!edit || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const sy = ((clientY - r.top) * H) / r.height;
    const { min, max, steg } = c.axel;
    const raw = min + (1 - (sy - T) / ph) * (max - min);
    edit(i, Math.min(max, Math.max(min, Math.round(raw / steg) * steg)));
  }

  return (
    <svg ref={svg} class={`dia-svg${edit ? ' dia-edit' : ''}`} viewBox={`0 0 ${W} ${H}`} role={onTap ? 'group' : 'img'} aria-label={c.titel}>
        {s > 1 && <Ranor />}
      {tk.map((t) => (
        <g key={t}>
          <line class="dia-grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          <text class="dia-tick" x={L - 6} y={y(t) + 4} text-anchor="end">{fmtNum(t)}</text>
        </g>
      ))}
      <text class="dia-axelnamn" x={4} y={10}>{c.enhet}</text>
      <line class="dia-axis" x1={L} x2={L} y1={T - 4} y2={base} />
      <line class="dia-axis" x1={L} x2={W - R} y1={base} y2={base} />
      {c.kat.map((k, i) => (
        <g key={i} class={`${hit?.includes(i) ? 'hit' : ''}${off?.includes(kp(i)) ? ' off' : ''}`}>
          {c.serier.map((_, j) => {
            const v = val(j, i), w = bw * (c.lur?.bredd?.[i] ?? 1), x0 = bx(i, j) - (w - bw) / 2;
            return (
              <g key={j}>
                <rect class={`dia-bar s${j}`} x={x0} y={y(v)} width={w} height={Math.max(0, base - y(v))} />
                {j === 1 && <rect class="dia-hatch" x={x0} y={y(v)} width={w} height={Math.max(0, base - y(v))} />}
                {showVals && <text class="dia-varde-txt" x={x0 + w / 2} y={y(v) - 5} text-anchor="middle">{fmtNum(v)}</text>}
              </g>
            );
          })}
          {hasIkon && <text class="dia-kat-emoji" x={L + slot * (i + 0.5)} y={H - B + 22} text-anchor="middle">{ikon(i)}</text>}
          <text class="dia-katnamn" x={L + slot * (i + 0.5)} y={H - 8} text-anchor="middle">{k}</text>
          {onTap && (
            <rect class="dia-tap" x={L + slot * i} y={0} width={slot} height={H} role="button" tabIndex={off?.includes(kp(i)) ? -1 : 0} aria-label={k}
              onClick={() => !off?.includes(kp(i)) && onTap(kp(i))}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !off?.includes(kp(i))) { e.preventDefault(); onTap(kp(i)); } }} />
          )}
          {edit && (
            <rect class="dia-tap" x={L + slot * i} y={T - 8} width={slot} height={ph + 8} aria-hidden="true"
              onPointerDown={(e) => { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); setFrom(i, e.clientY); }}
              onPointerMove={(e) => { if (e.buttons) setFrom(i, e.clientY); }} />
          )}
        </g>
      ))}
    </svg>
  );
}

/** Knapparna under staplarna när barnet bygger: ett steg upp eller ner. */
function ByggKnappar({ chart: c, vals, edit }: ChartProps) {
  const v = vals!;
  const { min, max, steg } = c.axel;
  return (
    <div class="dia-byggknappar" style={{ paddingLeft: `${(42 / W) * 100}%`, paddingRight: `${(10 / W) * 100}%`, gridTemplateColumns: `repeat(${c.kat.length}, 1fr)` }}>
      {c.kat.map((k, i) => (
        <span key={i} class="dia-knappar">
          <button type="button" class="btn small" aria-label={`Lägre: ${k}`} disabled={v[i] <= min} onClick={() => edit!(i, Math.max(min, v[i] - steg))}>▼</button>
          <button type="button" class="btn small" aria-label={`Högre: ${k}`} disabled={v[i] >= max} onClick={() => edit!(i, Math.min(max, v[i] + steg))}>▲</button>
        </span>
      ))}
    </div>
  );
}

/** Ett diagram med rubrik (och teckenförklaring när det finns två serier). */
export function ChartView(p: ChartProps) {
  const c = p.chart;
  return (
    <figure class={`dia dia-typ-${c.typ}`}>
      <figcaption class="dia-titel">{c.titel}</figcaption>
      {c.serier.length > 1 && (
        <div class="dia-legend">
          {c.serier.map((s, j) => <span key={j}><svg width="16" height="16" aria-hidden="true">{j === 1 && <Ranor />}<rect class={`dia-bar s${j}`} width="16" height="16" />{j === 1 && <rect class="dia-hatch" width="16" height="16" />}</svg>{s.namn}</span>)}
        </div>
      )}
      {c.typ === 'streck' || c.typ === 'tabell' ? <Rader {...p} />
        : c.typ === 'bild' ? <Bilder {...p} />
          : <><Staplar {...p} />{p.edit && <ByggKnappar {...p} />}</>}
    </figure>
  );
}

/** En bild med saker att räkna (t.ex. fåglar vid tornet). */
export function PlockBild({ bild, label }: { bild: Plock[]; label: string }) {
  return (
    <svg class="dia-plock" viewBox="0 0 320 170" role="img" aria-label={label}>
      <rect class="dia-plock-bg" x="1" y="1" width="318" height="168" rx="14" />
      {bild.map((p, i) => <text key={i} x={16 + p.x * 288} y={30 + p.y * 124} text-anchor="middle" class="dia-plock-ikon">{p.ikon}</text>)}
    </svg>
  );
}
