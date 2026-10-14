// Diagrammotorns modell: ett diagram är data plus hur det ritas. Allt här är rent (inga DOM-anrop),
// så att generatorer och tester kan använda det.

/**
 * streck = streckdiagram (tabell med streck), tabell = frekvenstabell, stapel = stapeldiagram, bild = bilddiagram,
 * linje = linjediagram, cirkel = cirkeldiagram, lista = talen på en rad (till lägesmåtten).
 */
export type ChartTyp = 'streck' | 'tabell' | 'stapel' | 'bild' | 'linje' | 'cirkel' | 'punkt' | 'lista';

export interface Serie { namn: string; v: number[] }

export interface Chart {
  typ: ChartTyp;
  titel: string;
  /** Vad värdena räknar, t.ex. 'fåglar' eller 'kg' (axelns eller tabellens rubrik). */
  enhet: string;
  /** Rubriken över kategorierna i en tabell, t.ex. 'Fågel'. */
  katNamn: string;
  /** Kategorierna (eller x-värdena). */
  kat: string[];
  /** En bild per kategori (emoji). Tom sträng = ingen bild. */
  ikoner?: string[];
  serier: Serie[];
  /** Värdeaxeln: från min till max, med ett streck var steg. */
  axel: { min: number; max: number; steg: number };
  /** Bilddiagram: varje bild betyder per stycken. ikon = samma bild på alla rader (annars kategorins bild). */
  bild?: { per: number; ikon?: string };
  /** Liggande staplar. */
  liggande?: boolean;
  /** Cirkeldiagram: vad som står vid bitarna (antal, procent eller inget). */
  etikett?: 'antal' | 'procent' | 'ingen';
  /** Talet står alltid vid varje stapel (och punkt). */
  talPa?: boolean;
  /** Hur ritningen lurar (bara i Spegelsalen och Skvallerpressen). Den sanna datan finns alltid kvar i serier. */
  lur?: Lur;
}

/** Knep som gör att ett diagram ser ut att visa något annat än datan. */
export interface Lur {
  /** Värdeaxeln börjar inte på 0 utan här. */
  axelStart?: number;
  /** Axelns streckvärden med ojämna steg, t.ex. 0 10 20 50 100 (ritas med lika avstånd). */
  ojamnSkala?: number[];
  /** Staplarnas bredd, en per kategori (1 = vanlig bredd). */
  bredd?: number[];
  /** Varje sak ritas som en bild som växer både på höjden och bredden (ytan växer i kvadrat). */
  ytskala?: boolean;
  /** Inga tal vid axeln och ingen enhet. */
  utanEnhet?: boolean;
  /** Cirkeldiagram: procenten som står vid bitarna (de blir mer än 100 tillsammans). */
  ejHundra?: number[];
}

export const values = (c: Chart, serie = 0) => c.serier[serie].v;
export const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);

/** Samma diagram utan knep: så som det borde ha ritats. */
export function honest(c: Chart): Chart {
  const { lur: _lur, ...rest } = c;
  return { ...rest, titel: 'Så ser det ut på riktigt' };
}

/** En axel som börjar på 0 och räcker till max, med lagom många steg. */
export function axisFor(max: number, steg: number): Chart['axel'] {
  return { min: 0, max: Math.max(steg, Math.ceil(max / steg) * steg), steg };
}

/** Axelns streckvärden. */
export function ticks(c: Chart): number[] {
  if (c.lur?.ojamnSkala) return c.lur.ojamnSkala;
  const { min, max } = c.axel;
  // Börjar axeln högre upp syns bara strecken därifrån. Blir strecken för många glesas de ut (dubbla steget).
  const start = c.lur?.axelStart ?? min;
  let steg = c.axel.steg;
  while ((max - start) / steg > 20) steg *= 2;
  const out: number[] = [];
  for (let t = start; t <= max + 1e-9; t += steg) out.push(Math.round(t * 1000) / 1000);
  return out;
}

/** Var på axeln (0–1) ett värde hamnar, så som diagrammet ritar det (med knepen). */
export function axisPos(c: Chart, v: number): number {
  const t = ticks(c);
  if (c.lur?.ojamnSkala) {
    // Varje steg i den ojämna skalan får lika stort avstånd.
    for (let i = 1; i < t.length; i++) {
      if (v <= t[i] || i === t.length - 1) return (i - 1 + (v - t[i - 1]) / (t[i] - t[i - 1])) / (t.length - 1);
    }
  }
  const lo = c.lur?.axelStart ?? c.axel.min, hi = c.axel.max;
  return Math.max(0, (v - lo) / (hi - lo));
}

/** Ett streckdiagram: hela femgrupper (fyra streck och ett tvärs över) och resten. */
export const tally = (n: number) => ({ buntar: Math.floor(n / 5), rest: n % 5 });

/** Hur många bilder ett värde blir i ett bilddiagram (hela och en eventuell halv). */
export function pictos(v: number, per: number): { hela: number; halv: boolean } {
  const n = v / per;
  return { hela: Math.floor(n + 1e-9), halv: n - Math.floor(n + 1e-9) > 0.25 };
}

/** Hur mycket större den största saken ser ut än den minsta (det ögat ser), för staplar och bilder. */
export function seenRatio(c: Chart, hi: number, lo: number): number {
  const v = values(c);
  if (c.lur?.ytskala) return (v[hi] / v[lo]) ** 2;
  const len = (i: number) => axisPos(c, v[i]);
  const w = (i: number) => c.lur?.bredd?.[i] ?? 1;
  return (len(hi) * w(hi)) / Math.max(1e-9, len(lo) * w(lo));
}

/**
 * Hur mycket ritningen förvränger: hur mycket större den största stapeln (eller bilden) ser ut än den minsta,
 * delat med hur mycket större den verkligen är. 1 = ärligt; 2 = ser dubbelt så stor skillnad ut.
 * Gäller staplar och bilddiagram, den första serien.
 */
export function distortion(c: Chart): number {
  const v = values(c);
  const hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v));
  if (v[lo] <= 0) return 1;
  const r = seenRatio(c, hi, lo) / (v[hi] / v[lo]);
  return r >= 1 ? r : 1 / r;
}

/**
 * Ett diagram som barnet har lagat. given: 'a:<tal>' = axeln börjar på talet; 'b:1,1,2' = staplarnas bredd.
 * Rätt när det inte längre förvränger (distortion under 1,1).
 */
export function lagat(c: Chart, given: string): Chart {
  const [k, rest] = given.split(':');
  if (k === 'a') return { ...c, lur: { ...c.lur, axelStart: Number(rest) } };
  if (k === 'b') return { ...c, lur: { ...c.lur, bredd: rest.split(',').map(Number) } };
  return c;
}
