import { useRef } from 'preact/hooks';
import { fmtNum } from '../drill/check';
import { axisPos, pictos, sum, tally, ticks, values, type Chart } from './chart';
import type { Plock } from './types';

// Diagrammen ritas från en Chart: streckdiagram, tabell, bilddiagram och listor som rader i HTML,
// stapel-, linje- och cirkeldiagram i SVG. Färgerna är temats (dia-* i styles.css), så att mörkt läge fungerar.
// Staplar har alltid kategorins namn (och bild) under sig, serie två är randig (och streckad i ett linjediagram),
// och varannan bit i en cirkel är randig, så färgen är aldrig ensam ledtråd.
// Knepen i chart.lur ritas som de lurar: axeln börjar högre upp, skalan är ojämn, staplarna är olika breda,
// bilderna växer på både höjden och bredden, och talen vid axeln kan saknas.

export interface ChartProps {
  chart: Chart;
  /** Värden att rita i stället för datans (när barnet bygger). */
  vals?: number[];
  /** Tryck på en del: 'k2' = kategori 2, 'axel' = axelns tal (bara i diagram som lurar). */
  onTap?: (part: string) => void;
  /** Delar som redan är fel tryckta (gråas ut). */
  off?: string[];
  /** Kategorier som lyser (det frågan handlade om, när den är klar). */
  hit?: number[];
  /** Skriv värdet vid varje stapel eller punkt (när frågan är klar). */
  showVals?: boolean;
  /** Barnet bygger: värde i kategori i ändras. */
  edit?: (i: number, v: number) => void;
}

const kp = (i: number) => `k${i}`;

/** Gör en SVG-del tryckbar med mus, finger och tangentbord. */
function tapAttrs(id: string, label: string, p: ChartProps) {
  const off = p.off?.includes(id);
  return {
    role: 'button' as const, tabIndex: off ? -1 : 0, 'aria-label': label,
    onClick: () => !off && p.onTap!(id),
    onKeyDown: (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && !off) { e.preventDefault(); p.onTap!(id); } },
  };
}

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

/** Talen på en rad (till medelvärde, median och typvärde), med namnet under varje tal. */
function Lista({ chart: c, hit }: ChartProps) {
  const v = values(c);
  return (
    <div class="dia-lista" role="list">
      {v.map((x, i) => (
        <span key={i} role="listitem" class={`dia-lapp${hit?.includes(i) ? ' hit' : ''}`}>
          <b>{fmtNum(x)}</b>
          {c.kat[i] && <small>{c.ikoner?.[i] ? `${c.ikoner[i]} ` : ''}{c.kat[i]}</small>}
        </span>
      ))}
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

// Diagrammens mått (viewBox).
const W = 320;

/** Ränderna på serie två (så att färgen inte är enda skillnaden). */
const Ranor = () => (
  <defs>
    <pattern id="dia-ranor" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" class="dia-rand" />
    </pattern>
  </defs>
);

/** Liggande stapeldiagram. */
function Liggande(p: ChartProps) {
  const { chart: c, vals, onTap, off, hit } = p;
  const showVals = p.showVals || c.talPa;
  const n = c.kat.length, s = c.serier.length;
  const tk = ticks(c);
  const val = (j: number, i: number) => (j === 0 && vals ? vals[i] : c.serier[j].v[i]);
  const ikon = (i: number) => c.ikoner?.[i] ?? '';
  const L = 104, R = 14, T = 8, rowH = 34, H = T + n * rowH + 30, pw = W - L - R;
  const x = (v: number) => L + pw * axisPos(c, v);
  const bh = s === 1 ? rowH * 0.6 : rowH * 0.36;
  const tal = !c.lur?.utanEnhet;
  return (
    <svg class="dia-svg" viewBox={`0 0 ${W} ${H}`} role={onTap ? 'group' : 'img'} aria-label={c.titel}>
      {s > 1 && <Ranor />}
      {tk.map((t) => (
        <g key={t}>
          <line class="dia-grid" x1={x(t)} x2={x(t)} y1={T} y2={T + n * rowH} />
          {tal && <text class="dia-tick" x={x(t)} y={T + n * rowH + 16} text-anchor="middle">{fmtNum(t)}</text>}
        </g>
      ))}
      {tal && <text class="dia-axelnamn" x={W - R} y={H - 2} text-anchor="end">{c.enhet}</text>}
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
            {onTap && <rect class="dia-tap" x={0} y={T + i * rowH} width={W} height={rowH} {...tapAttrs(kp(i), k, p)} />}
          </g>
        );
      })}
    </svg>
  );
}

/** Stående stapeldiagram och linjediagram (samma axlar), med en eller två serier. */
function Staplar(p: ChartProps) {
  const { chart: c, vals, onTap, off, hit, edit } = p;
  const showVals = p.showVals || (c.talPa && !edit);
  const svg = useRef<SVGSVGElement>(null);
  if (c.liggande) return <Liggande {...p} />;
  const n = c.kat.length, s = c.serier.length;
  const linje = c.typ === 'linje', yta = !!c.lur?.ytskala;
  const tk = ticks(c);
  const val = (j: number, i: number) => (j === 0 && vals ? vals[i] : c.serier[j].v[i]);
  const ikon = (i: number) => c.ikoner?.[i] ?? '';
  const hasIkon = !yta && c.kat.some((_, i) => ikon(i));
  const tal = !c.lur?.utanEnhet && !yta;

  const L = tal || !yta ? 42 : 12, R = 10, T = 26, B = hasIkon ? 46 : 30, H = 246, pw = W - L - R, ph = H - T - B;
  const y = (v: number) => T + ph * (1 - axisPos(c, v));
  const slot = pw / n;
  const bw = slot * (s === 1 ? 0.56 : 0.36);
  const bx = (i: number, j: number) => L + slot * i + (slot - s * bw - (s - 1) * 4) / 2 + j * (bw + 4);
  const px = (i: number) => L + slot * (i + 0.5);
  const base = y(c.lur?.axelStart ?? c.axel.min);

  // Bygga: tryck eller dra i en kolumn så blir stapeln (eller punkten) så hög, avrundat till skalans steg.
  function setFrom(i: number, clientY: number) {
    if (!edit || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const sy = ((clientY - r.top) * H) / r.height;
    const { min, max, steg } = c.axel;
    const raw = min + (1 - (sy - T) / ph) * (max - min);
    edit(i, Math.min(max, Math.max(min, Math.round(raw / steg) * steg)));
  }

  // Bilder som växer: bildens höjd följer värdet, men bredden växer lika mycket.
  const maxV = Math.max(...values(c));
  const ytBild = (i: number) => {
    const v = values(c)[i], size = Math.max(8, Math.min(slot * 0.95, ph) * (v / maxV));
    return (
      <g key={`y${i}`}>
        <text class="dia-ytbild" x={px(i)} y={base - size * 0.1} font-size={`${size}px`} text-anchor="middle">{ikon(i) || c.bild?.ikon || '⬤'}</text>
        <text class="dia-varde-txt" x={px(i)} y={base - size - 4} text-anchor="middle">{fmtNum(v)}</text>
      </g>
    );
  };

  return (
    <svg ref={svg} class={`dia-svg${edit ? ' dia-edit' : ''}`} viewBox={`0 0 ${W} ${H}`} role={onTap ? 'group' : 'img'} aria-label={c.titel}>
      {s > 1 && <Ranor />}
      {!yta && tk.map((t) => (
        <g key={t}>
          <line class="dia-grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          {tal && <text class="dia-tick" x={L - 6} y={y(t) + 4} text-anchor="end">{fmtNum(t)}</text>}
        </g>
      ))}
      {tal && <text class="dia-axelnamn" x={4} y={10}>{c.enhet}</text>}
      {!yta && <line class="dia-axis" x1={L} x2={L} y1={T - 4} y2={base} />}
      <line class="dia-axis" x1={L} x2={W - R} y1={base} y2={base} />
      {linje && c.serier.map((_, j) => (
        <polyline key={`l${j}`} class={`dia-line s${j}`} points={c.kat.map((_, i) => `${px(i)},${y(val(j, i))}`).join(' ')} />
      ))}
      {c.kat.map((k, i) => (
        <g key={i} class={`${hit?.includes(i) ? 'hit' : ''}${off?.includes(kp(i)) ? ' off' : ''}`}>
          {yta ? ytBild(i) : c.serier.map((_, j) => {
            const v = val(j, i);
            if (linje) {
              const cy = y(v);
              return (
                <g key={j}>
                  {j === 0 ? <circle class="dia-punkt s0" cx={px(i)} cy={cy} r={hit?.includes(i) ? 7 : 5} />
                    : <rect class="dia-punkt s1" x={px(i) - 5} y={cy - 5} width={10} height={10} />}
                  {showVals && <text class="dia-varde-txt" x={px(i)} y={cy + (j === 0 ? -10 : 18)} text-anchor="middle">{fmtNum(v)}</text>}
                </g>
              );
            }
            const w = bw * (c.lur?.bredd?.[i] ?? 1), x0 = bx(i, j) - (w - bw) / 2;
            return (
              <g key={j}>
                <rect class={`dia-bar s${j}`} x={x0} y={y(v)} width={w} height={Math.max(0, base - y(v))} />
                {j === 1 && <rect class="dia-hatch" x={x0} y={y(v)} width={w} height={Math.max(0, base - y(v))} />}
                {showVals && <text class="dia-varde-txt" x={x0 + w / 2} y={y(v) - 5} text-anchor="middle">{fmtNum(v)}</text>}
              </g>
            );
          })}
          {hasIkon && <text class="dia-kat-emoji" x={px(i)} y={H - B + 22} text-anchor="middle">{ikon(i)}</text>}
          <text class="dia-katnamn" x={px(i)} y={H - 8} text-anchor="middle">{k}</text>
          {onTap && <rect class="dia-tap" x={L + slot * i} y={0} width={slot} height={H} {...tapAttrs(kp(i), k, p)} />}
          {edit && (
            <rect class="dia-tap" x={L + slot * i} y={T - 8} width={slot} height={ph + 8} aria-hidden="true"
              onPointerDown={(e) => { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); setFrom(i, e.clientY); }}
              onPointerMove={(e) => { if (e.buttons) setFrom(i, e.clientY); }} />
          )}
        </g>
      ))}
      {onTap && c.lur && !yta && <rect class="dia-tap" x={0} y={T - 10} width={L - 2} height={base - T + 16} {...tapAttrs('axel', 'Axelns tal', p)} />}
    </svg>
  );
}

/** Cirkeldiagram: bitarna börjar uppe och går medsols. Varje bit har sin färg, och varannan är randig. */
function Cirkel(p: ChartProps) {
  const { chart: c, onTap, off, hit } = p;
  const v = values(c), tot = sum(v);
  const cx = 104, cy = 104, r = 92, H = Math.max(208, 24 + c.kat.length * 34);
  let a0 = 0;
  const pt = (a: number, rr = r) => [cx + rr * Math.sin(a * 2 * Math.PI), cy - rr * Math.cos(a * 2 * Math.PI)];
  const label = (i: number) => {
    if (c.etikett === 'ingen') return '';
    if (c.etikett === 'procent') return `${fmtNum(c.lur?.ejHundra?.[i] ?? Math.round((v[i] / tot) * 1000) / 10)} %`;
    return fmtNum(v[i]);
  };
  const slices = v.map((x) => {
    const a1 = a0 + x / tot, mid = (a0 + a1) / 2;
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    const d = x >= tot ? `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 0.5 ? 1 : 0} 1 ${x1} ${y1} Z`;
    const [lx, ly] = pt(mid, r * 0.62);
    a0 = a1;
    return { d, lx, ly, big: x / tot >= 0.09 };
  });
  return (
    <svg class="dia-svg dia-cirkel" viewBox={`0 0 ${W} ${H}`} role={onTap ? 'group' : 'img'} aria-label={c.titel}>
      <Ranor />
      {slices.map((sl, i) => (
        <g key={i} class={`${hit?.includes(i) ? 'hit' : ''}${off?.includes(kp(i)) ? ' off' : ''}`}>
          <path class={`dia-bit p${i % 6}`} d={sl.d} />
          {i % 2 === 1 && <path class="dia-hatch" d={sl.d} />}
          {sl.big && <text class="dia-bit-ikon" x={sl.lx} y={sl.ly + 7} text-anchor="middle">{c.ikoner?.[i] || ''}</text>}
          {onTap && <path class="dia-tap" d={sl.d} {...tapAttrs(kp(i), c.kat[i], p)} />}
        </g>
      ))}
      {c.kat.map((k, i) => {
        const ly = 24 + i * 34;
        return (
          <g key={`n${i}`} class={`${hit?.includes(i) ? 'hit' : ''}${off?.includes(kp(i)) ? ' off' : ''}`}>
            <rect class={`dia-bit p${i % 6}`} x={214} y={ly - 13} width={18} height={18} rx={3} />
            {i % 2 === 1 && <rect class="dia-hatch" x={214} y={ly - 13} width={18} height={18} rx={3} />}
            <text class="dia-katnamn" x={238} y={ly + 1}>{c.ikoner?.[i] ? `${c.ikoner[i]} ` : ''}{k}</text>
            {label(i) && <text class="dia-varde-txt" x={238} y={ly + 15}>{label(i)}</text>}
            {onTap && <rect class="dia-tap" x={210} y={ly - 16} width={W - 210} height={32} {...tapAttrs(kp(i), k, p)} tabIndex={-1} />}
          </g>
        );
      })}
    </svg>
  );
}

/** Knapparna under staplarna (eller punkterna) när barnet bygger: ett steg upp eller ner. */
function ByggKnappar({ chart: c, vals, edit }: ChartProps) {
  const v = vals!;
  const { min, max, steg } = c.axel;
  const vad = c.typ === 'linje' ? ' punkt' : '';
  return (
    <div class="dia-byggknappar" style={{ paddingLeft: `${(42 / W) * 100}%`, paddingRight: `${(10 / W) * 100}%`, gridTemplateColumns: `repeat(${c.kat.length}, 1fr)` }}>
      {c.kat.map((k, i) => (
        <span key={k} class="dia-knappar">
          <button type="button" class="btn small" aria-label={`Lägre${vad}: ${k}`} disabled={v[i] <= min} onClick={() => edit!(i, Math.max(min, v[i] - steg))}>▼</button>
          <button type="button" class="btn small" aria-label={`Högre${vad}: ${k}`} disabled={v[i] >= max} onClick={() => edit!(i, Math.min(max, v[i] + steg))}>▲</button>
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
          {c.serier.map((s, j) => (
            <span key={j}>
              <svg width="22" height="16" aria-hidden="true">
                {j === 1 && <Ranor />}
                {c.typ === 'linje'
                  ? <><line class={`dia-line s${j}`} x1="0" x2="22" y1="8" y2="8" />{j === 0 ? <circle class="dia-punkt s0" cx="11" cy="8" r="4" /> : <rect class="dia-punkt s1" x="7" y="4" width="8" height="8" />}</>
                  : <><rect class={`dia-bar s${j}`} width="16" height="16" />{j === 1 && <rect class="dia-hatch" width="16" height="16" />}</>}
              </svg>
              {s.namn}
            </span>
          ))}
        </div>
      )}
      {c.typ === 'streck' || c.typ === 'tabell' ? <Rader {...p} />
        : c.typ === 'bild' ? <Bilder {...p} />
          : c.typ === 'lista' ? <Lista {...p} />
            : c.typ === 'cirkel' ? <Cirkel {...p} />
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
