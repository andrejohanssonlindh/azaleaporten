import type { ComponentChildren } from 'preact';

// Bilder till Klassrummets lektioner. Används bara av spelens lektionsfiler (laddas med spelet).
// Allt ritas med temats färger (CSS-klasser lb-* i styles.css), så att det fungerar i mörkt läge.

/** En rad på tavlan: text, eller [text, 'dim' | 'hi' | 'line'] (line = summastreck ovanför). */
export type TavlaRad = string | [string, 'dim' | 'hi' | 'line'];

/** En svart tavla med uppställningar, t.ex. ett räkneexempel i kolumner. */
export function Tavla({ rader, label }: { rader: TavlaRad[]; label?: string }) {
  return (
    <div class="lb-board" role="img" aria-label={label ?? rader.map((r) => (typeof r === 'string' ? r : r[0])).join(', ')}>
      {rader.map((r, i) => {
        const [t, k] = typeof r === 'string' ? [r, ''] : r;
        return <span key={i} class={k ? `lb-${k}` : ''} style={{ whiteSpace: 'pre-wrap' }}>{t}</span>;
      })}
    </div>
  );
}

/** Bildtext under en bild. */
export const Text = ({ children }: { children: ComponentChildren }) => <p class="lb-caption">{children}</p>;

/** Flera saker på en rad (t.ex. två bilder bredvid varandra). */
export const Rad = ({ children }: { children: ComponentChildren }) => <div class="lb-row">{children}</div>;

/** Stor text, t.ex. ett tal eller en uppställning mitt i en bild. */
export const Stor = ({ children }: { children: ComponentChildren }) => <span class="lb-big">{children}</span>;

/**
 * Prickar i rader: rader × per. ring = rita en streckad ring runt varje rad (grupperna i gånger).
 * farg(r, k) väljer färg per prick: '' (blå), 'b' (rosa), 'c' (guld) eller 'off' (grå).
 */
export function Prickar({ rader, per, ring = false, farg, cell = 26 }: { rader: number; per: number; ring?: boolean; farg?: (r: number, k: number) => '' | 'b' | 'c' | 'off'; cell?: number }) {
  const pad = ring ? 6 : 2;
  const w = per * cell + 2 * pad, h = rader * cell + 2 * pad;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} role="img" aria-label={`${rader} rader med ${per} i varje`}>
      {ring && Array.from({ length: rader }, (_, r) => (
        <rect key={`g${r}`} x={pad - 4} y={pad + r * cell + 1} width={per * cell + 8} height={cell - 2} rx={cell / 2 - 1} class="lb-group" />
      ))}
      {Array.from({ length: rader * per }, (_, i) => {
        const r = Math.floor(i / per), k = i % per;
        const f = farg?.(r, k) ?? '';
        return <circle key={i} cx={pad + k * cell + cell / 2} cy={pad + r * cell + cell / 2} r={cell * 0.32} class={`lb-dot ${f}`} />;
      })}
    </svg>
  );
}

/** Dela lika: tallrikar med lika många saker på varje (division som delning). */
export function Tallrikar({ tallrikar, per, sak = '🍪', tomma = false }: { tallrikar: number; per: number; sak?: string; tomma?: boolean }) {
  return (
    <div class="lb-row" role="img" aria-label={`${tallrikar} tallrikar${tomma ? '' : ` med ${per} på varje`}`}>
      {Array.from({ length: tallrikar }, (_, i) => (
        <span key={i} style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', width: `${Math.max(64, Math.ceil(Math.sqrt(per)) * 26 + 18)}px`, minHeight: '64px', padding: '6px', borderRadius: '50%', background: 'color-mix(in srgb, var(--gold) 18%, var(--card))', border: '2px solid var(--rim)', fontSize: '20px', lineHeight: '1.1' }}>
          {tomma ? '' : sak.repeat(per)}
        </span>
      ))}
    </div>
  );
}

export interface Hopp { fran: number; till: number; text?: string; b?: boolean }

/**
 * En tallinje från `fran` till `till` med hopp (bågar). steg = streckens avstånd, siffror = vilka tal som skrivs ut
 * (standard: varje streck om de är få, annars var femte), mark = tal som lyses upp.
 */
export function Tallinje({ fran, till, steg = 1, hopp = [], siffror, mark = [], bredd = 340 }: { fran: number; till: number; steg?: number; hopp?: Hopp[]; siffror?: number[]; mark?: number[]; bredd?: number }) {
  const pad = 18, y = 70;
  const x = (v: number) => pad + ((v - fran) / (till - fran)) * (bredd - 2 * pad);
  const n = Math.round((till - fran) / steg);
  const ticks = Array.from({ length: n + 1 }, (_, i) => Math.round((fran + i * steg) * 1000) / 1000);
  const labels = siffror ?? (n <= 12 ? ticks : ticks.filter((v) => Math.abs(v / (steg * 5) - Math.round(v / (steg * 5))) < 1e-6));
  const fmt = (v: number) => String(v).replace('.', ',').replace('-', '−');
  return (
    <svg viewBox={`0 0 ${bredd} 100`} width={bredd} role="img" aria-label={`Tallinje från ${fmt(fran)} till ${fmt(till)}`}>
      <line x1={pad - 8} y1={y} x2={bredd - pad + 8} y2={y} class="lb-axis" />
      {ticks.map((v) => <line key={v} x1={x(v)} x2={x(v)} y1={y - 6} y2={y + 6} class="lb-tick" />)}
      {labels.map((v) => <text key={`l${v}`} x={x(v)} y={y + 22} text-anchor="middle" class={`lb-num${mark.includes(v) ? ' hi' : ''}`}>{fmt(v)}</text>)}
      {hopp.map((h, i) => {
        const a = x(h.fran), b = x(h.till), mid = (a + b) / 2, lift = Math.min(44, 14 + Math.abs(b - a) / 3);
        return (
          <g key={i}>
            <path d={`M${a} ${y - 4} Q${mid} ${y - 4 - lift * 1.6} ${b} ${y - 4}`} class={`lb-hop${h.b ? ' b' : ''}`} />
            <path d={`M${b} ${y - 4} l${b > a ? -7 : 7} -6 l${b > a ? 1 : -1} 8 z`} class={`lb-hop-head${h.b ? ' b' : ''}`} />
            {h.text && <text x={mid} y={y - 8 - lift * 0.8} text-anchor="middle" class={`lb-hop-label${h.b ? ' b' : ''}`}>{h.text}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** Tiorutor: a blå prickar, sedan b rosa, och x överkryssade (borttagna) sist bland de blå. */
export function Tiorutor({ a, b = 0, x = 0 }: { a: number; b?: number; x?: number }) {
  const total = a + b;
  const frames = Math.max(1, Math.ceil(total / 10));
  const cell = 26, gap = 12;
  const w = frames * 5 * cell + (frames - 1) * gap;
  return (
    <svg class="tenframe" viewBox={`-2 -2 ${w + 4} ${2 * cell + 4}`} width={w + 4} role="img" aria-label="Tiorutor">
      {Array.from({ length: frames * 10 }, (_, i) => {
        const f = Math.floor(i / 10), j = i % 10;
        const cx = f * (5 * cell + gap) + (j % 5) * cell, cy = Math.floor(j / 5) * cell;
        const k = i < a - x ? 'tf-a' : i < a ? 'tf-x' : i < total ? 'tf-b' : '';
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={cell} height={cell} class="tf-cell" />
            {k && <circle cx={cx + cell / 2} cy={cy + cell / 2} r={cell * 0.36} class={`tf-dot ${k}`} />}
            {k === 'tf-x' && <path d={`M${cx + 6} ${cy + 6} L${cx + cell - 6} ${cy + cell - 6} M${cx + cell - 6} ${cy + 6} L${cx + 6} ${cy + cell - 6}`} class="tf-cross" />}
          </g>
        );
      })}
    </svg>
  );
}

/** Tiotalsstavar och entalskuber (basblock). */
export function Basblock({ tiotal, ental }: { tiotal: number; ental: number }) {
  const u = 10, w = tiotal * (u + 6) + (ental ? 12 + Math.ceil(ental / 5) * (u + 3) : 0) + 4;
  return (
    <svg viewBox={`0 0 ${w} ${10 * u + 4}`} width={w * 1.3} role="img" aria-label={`${tiotal} tiotal och ${ental} ental`}>
      {Array.from({ length: tiotal }, (_, t) => Array.from({ length: 10 }, (_, k) => (
        <rect key={`${t}-${k}`} x={2 + t * (u + 6)} y={2 + k * u} width={u} height={u} class="lb-ten" />
      )))}
      {Array.from({ length: ental }, (_, e) => (
        <rect key={`e${e}`} x={2 + tiotal * (u + 6) + 12 + Math.floor(e / 5) * (u + 3)} y={2 + 10 * u - (e % 5 + 1) * (u + 3)} width={u} height={u} class="lb-one" />
      ))}
    </svg>
  );
}
