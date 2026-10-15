import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import { axisFor, sum, type Chart } from '../../engines/diagram/chart';
import type { Alt } from '../../engines/diagram/types';
import { fmtNum } from '../../engines/drill/check';
import { cands, type Base, type DQ, type Extra } from './gen';

// Vågmästarens bod (åk 4–6): lägesmått. Medelvärde ("dela lika"; Delaglömmaren glömmer att dela), median
// (sortera först; Mittenmusen tar mitten direkt), typvärde, variationsbredd, vilket mått som är vilket,
// och jätten som drar iväg medelvärdet. Lägen, färdighets-id:n och felkoder är permanenta.

type M = 'medel' | 'median' | 'typ' | 'bredd' | 'valj';
const MAX: Record<M, number> = { medel: 2, median: 2, typ: 0, bredd: 0, valj: 1 };

function skillOf(mode: M, level: number): string {
  if (mode === 'medel') return level === 2 ? 'ma.stat.medel-diagram' : 'ma.stat.medel';
  return { median: 'ma.stat.median', typ: 'ma.stat.typvarde', bredd: 'ma.stat.variationsbredd', valj: 'ma.stat.lagesmatt' }[mode];
}
const SKILLS: [string, QuestionSpec[]][] = [
  ['ma.stat.medel', [{ mode: 'medel', level: 0 }, { mode: 'medel', level: 1 }]],
  ['ma.stat.medel-diagram', [{ mode: 'medel', level: 2 }]],
  ['ma.stat.median', [0, 1, 2].map((level) => ({ mode: 'median', level }))],
  ['ma.stat.typvarde', [{ mode: 'typ', level: 0 }]],
  ['ma.stat.variationsbredd', [{ mode: 'bredd', level: 0 }]],
  ['ma.stat.lagesmatt', [{ mode: 'valj', level: 0 }, { mode: 'valj', level: 1 }]],
];

export const LAGE_ERR: Record<string, string> = {
  'medel-glomt-dela': 'Lägger ihop men glömmer att dela',
  'medel-fel-antal': 'Delar med fel antal (glömmer nollan)',
  'median-osorterad': 'Tar mitten utan att sortera',
  'median-jamnt': 'Tar ett av de två mittersta talen',
  'typvarde-storst': 'Tar det största talet i stället för det vanligaste',
  'antal-ganger': 'Svarar hur många gånger i stället för vilket tal',
  'fel-matt': 'Blandar ihop medelvärde, median och typvärde',
  jatten: 'Ser inte hur ett jättevärde drar iväg medelvärdet',
};

export const lageExtra: Extra = {
  err: LAGE_ERR,
  explain(tag) {
    switch (tag) {
      case 'medel-glomt-dela':
        return { title: 'Glöm inte att dela', text: 'Du lade ihop alla talen – bra! Men medelvärdet är vad var och en får om alla delar lika. Dela summan med hur många tal det är.' };
      case 'medel-fel-antal':
        return { title: 'Nollan räknas', text: 'Ett av talen är noll. Det är också med! Dela med hur många tal det är – nollan inräknad.' };
      case 'median-osorterad':
        return { title: 'Sortera först', text: 'Du tog talet i mitten direkt. Men först måste talen stå i ordning, från minst till störst. Sortera, och ta sedan talet i mitten.' };
      case 'median-jamnt':
        return { title: 'Två tal i mitten', text: 'När det är ett jämnt antal tal finns det två tal i mitten. Medianen är mitt emellan dem: lägg ihop dem och dela med två.' };
      case 'typvarde-storst':
        return { title: 'Vanligast, inte störst', text: 'Typvärdet är det tal som finns flest gånger – inte det största talet. Räkna hur många gånger varje tal finns.' };
      case 'antal-ganger':
        return { title: 'Vilket tal?', text: 'Du svarade hur många gånger talet finns. Frågan är vilket tal det är som finns flest gånger.' };
      case 'fel-matt':
        return { title: 'Vilket mått?', text: 'Medelvärde: lägg ihop och dela lika. Median: sortera och ta mitten. Typvärde: det vanligaste talet. Variationsbredd: största minus minsta.' };
      case 'jatten':
        return { title: 'Tänk på jätten', text: 'Ett jättestort tal gör summan av alla talen mycket större. Vilket mått räknas ut med summan? Ett mått som bara tittar på talet i mitten, eller på det vanligaste talet, flyttar sig nästan inte.' };
      default:
        return undefined;
    }
  },
};

/** Vad talen räknar. kat = vem talet hör till. */
interface Data { titel: string; enhet: string; svarEnhet?: string; kat: string[]; ikoner?: string[]; lo: number; hi: number }

const DJUR = ['Ekorren', 'Haren', 'Igelkotten', 'Räven', 'Grodan', 'Ugglan', 'Musen', 'Björnen'];
const DJURIKON = ['🐿️', '🐇', '🦔', '🦊', '🐸', '🦉', '🐭', '🐻'];
const DATA: Data[] = [
  { titel: 'Kastanjer som djuren plockade', enhet: 'kastanjer', kat: DJUR, ikoner: DJURIKON, lo: 0, hi: 15 },
  { titel: 'Mål i varje match', enhet: 'mål', kat: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `Match ${n}`), lo: 0, hi: 9 },
  { titel: 'Poäng i frågesporten', enhet: 'poäng', kat: DJUR, ikoner: DJURIKON, lo: 2, hi: 20 },
  { titel: 'Fiskar som fångades varje dag', enhet: 'fiskar', kat: ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön', 'Mån igen'], lo: 0, hi: 12 },
];

/** Talen som en lista (eller staplar). Djurens namn blandas, så att samma djur inte alltid har det första talet. */
function lista(d: Data, v: number[], rng: Rng, typ: Chart['typ'] = 'lista'): Chart {
  const order = d.kat === DJUR ? rng.shuffle(d.kat.map((_, i) => i)).slice(0, v.length) : v.map((_, i) => i);
  return {
    typ, titel: d.titel, enhet: d.enhet, katNamn: '', kat: order.map((i) => d.kat[i]), ikoner: d.ikoner ? order.map((i) => d.ikoner![i]) : undefined,
    serier: [{ namn: d.titel, v }], axel: typ === 'stapel' ? axisFor(Math.max(...v) + 1, 1) : axisFor(Math.max(...v, 1), 1),
  };
}

const sorted = (v: number[]) => [...v].sort((a, b) => a - b);
function medianOf(v: number[]): number {
  const s = sorted(v), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
const meanOf = (v: number[]) => sum(v) / v.length;
function modeOf(v: number[]): number | null {
  const c = new Map<number, number>();
  for (const x of v) c.set(x, (c.get(x) ?? 0) + 1);
  const top = Math.max(...c.values());
  const best = [...c].filter(([, k]) => k === top);
  return best.length === 1 && top > 1 ? best[0][0] : null;
}

/** n slumptal i [lo, hi] vars summa går jämnt ut med n (justeras på ett av talen). */
function jamnSumma(n: number, lo: number, hi: number, rng: Rng): number[] | null {
  const v = Array.from({ length: n }, () => lo + rng.int(hi - lo + 1));
  const r = sum(v) % n;
  if (r) {
    const i = rng.int(n);
    v[i] += n - r;
    if (v[i] > hi) return null;
  }
  return v;
}

function medel(b: Base, rng: Rng): DQ | null {
  const d = rng.pick(DATA);
  const n = b.level === 0 ? 3 + rng.int(2) : 5;
  const v = b.level === 2 ? jamnSumma(n, 1, 10, rng) : jamnSumma(n, b.level === 1 ? 0 : Math.max(1, d.lo), Math.min(d.hi, b.level === 0 ? 10 : 15), rng);
  if (!v) return null;
  if (b.level === 1 && rng.next() < 0.6 && !v.includes(0)) {
    // En nolla: flytta det talet till ett annat (summan, och därmed medelvärdet, är densamma).
    const i = rng.int(n), j = (i + 1 + rng.int(n - 1)) % n;
    v[j] += v[i];
    v[i] = 0;
    if (v[j] > 15) return null;
  }
  const s = sum(v), m = s / n, zeros = v.filter((x) => x === 0).length;
  const chart = lista(d, v, rng, b.level === 2 ? 'stapel' : 'lista');
  return {
    ...b, kind: 'las', prompt: b.level === 2 ? 'Läs av staplarna. Vad är medelvärdet?' : 'Vad är medelvärdet?', chart, answer: String(m), enhet: d.svarEnhet,
    cand: cands(m, [[s, 'medel-glomt-dela'], ...(zeros ? [[s / (n - zeros), 'medel-fel-antal'] as [number, string]] : []), [medianOf(v), 'fel-matt']]),
    visa: v.map((_, i) => i),
    los: `${v.map(fmtNum).join(' + ')} = ${fmtNum(s)}. Det är ${n} tal, så ${fmtNum(s)} / ${n} = ${fmtNum(m)}. Om alla delade lika skulle var och en få ${fmtNum(m)}.`,
    tips: zeros ? 'Lägg ihop alla talen. Dela sedan med hur många tal det är – nollan räknas också!' : 'Lägg ihop alla talen. Dela sedan summan med hur många tal det är.',
  };
}

function median(b: Base, rng: Rng): DQ | null {
  const d = rng.pick(DATA);
  const n = b.level === 0 ? 5 : b.level === 1 ? 7 : 6;
  const pool = rng.shuffle(Array.from({ length: Math.max(d.hi - d.lo + 1, 21) }, (_, i) => d.lo + i)).slice(0, n);
  const v = rng.shuffle(pool), s = sorted(v);
  const med = medianOf(v);
  if (!Number.isInteger(med)) return null;
  const mid = n % 2 ? [(n - 1) / 2] : [n / 2 - 1, n / 2];
  const osorterad = mid.length === 1 ? v[mid[0]] : (v[mid[0]] + v[mid[1]]) / 2;
  if (osorterad === med) return null;
  const list: [number, string][] = [[osorterad, 'median-osorterad']];
  if (mid.length === 2) list.push([s[mid[0]], 'median-jamnt'], [s[mid[1]], 'median-jamnt']);
  list.push([meanOf(v), 'fel-matt']);
  const chart = lista(d, v, rng);
  chart.axel = axisFor(Math.max(...v, 1), 1);
  return {
    ...b, kind: 'las', prompt: 'Vad är medianen?', chart, answer: String(med), enhet: d.svarEnhet,
    cand: cands(med, list),
    los: mid.length === 1
      ? `Sortera: ${s.map(fmtNum).join(', ')}. Talet i mitten är ${fmtNum(med)}.`
      : `Sortera: ${s.map(fmtNum).join(', ')}. I mitten står ${fmtNum(s[mid[0]])} och ${fmtNum(s[mid[1]])}. Mitt emellan dem är ${fmtNum(med)}.`,
    tips: mid.length === 1 ? 'Skriv talen i ordning, från minst till störst. Vilket tal står i mitten?' : 'Skriv talen i ordning. Det är ett jämnt antal tal, så två tal står i mitten. Vad är mitt emellan dem?',
  };
}

function typ(b: Base, rng: Rng): DQ | null {
  const d = DATA[rng.int(2) * 2]; // teman med djur (åtta olika namn)
  const n = 7 + rng.int(2);
  const m = 1 + rng.int(6), top = m + 2 + rng.int(5);
  const v = [m, m, m, top];
  const counts = new Map<number, number>([[m, 3], [top, 1]]);
  while (v.length < n) {
    const x = rng.int(top);
    if (x === m || (counts.get(x) ?? 0) >= 2) continue;
    counts.set(x, (counts.get(x) ?? 0) + 1);
    v.push(x);
  }
  const data = rng.shuffle(v);
  if (modeOf(data) !== m) return null;
  return {
    ...b, kind: 'las', prompt: 'Vad är typvärdet?', chart: lista(d, data, rng), answer: String(m), enhet: d.svarEnhet,
    cand: cands(m, [[top, 'typvarde-storst'], [3, 'antal-ganger'], [medianOf(data), 'fel-matt']]),
    los: `${fmtNum(m)} finns tre gånger. Inget annat tal finns så många gånger, så typvärdet är ${fmtNum(m)}.`,
    tips: 'Räkna hur många gånger varje tal finns. Vilket tal finns flest gånger?',
  };
}

function bredd(b: Base, rng: Rng): DQ | null {
  const d = rng.pick(DATA);
  const n = 5 + rng.int(2);
  const v = rng.shuffle(Array.from({ length: 20 }, (_, i) => d.lo + i)).slice(0, n);
  const hi = Math.max(...v), lo = Math.min(...v), r = hi - lo;
  return {
    ...b, kind: 'las', prompt: 'Vad är variationsbredden?', chart: lista(d, v, rng), answer: String(r), enhet: d.svarEnhet,
    cand: cands(r, [[hi, 'svarade-varde'], [lo, 'svarade-varde'], [hi + lo, 'summa-skillnad']]),
    los: `Största talet är ${fmtNum(hi)} och minsta är ${fmtNum(lo)}. ${fmtNum(hi)} − ${fmtNum(lo)} = ${fmtNum(r)}.`,
    tips: 'Leta upp det största och det minsta talet. Variationsbredden är skillnaden mellan dem.',
  };
}

const MATT = ['Medelvärdet', 'Medianen', 'Typvärdet', 'Variationsbredden'] as const;

function valj(b: Base, rng: Rng): DQ | null {
  if (b.level === 0) {
    const d = rng.pick(DATA);
    const v = jamnSumma(5, 1, 12, rng);
    if (!v) return null;
    const vals = [meanOf(v), medianOf(v), modeOf(v), Math.max(...v) - Math.min(...v)];
    if (vals[2] === null || new Set(vals).size < 4) return null;
    const k = rng.int(3), x = vals[k]!;
    return {
      ...b, kind: 'val', prompt: `Talet ${fmtNum(x)} – vilket lägesmått är det?`, chart: lista(d, v, rng), answer: MATT[k],
      alts: MATT.map((t, i) => (i === k ? { text: t } : { text: t, err: 'fel-matt' })),
      los: `Medelvärdet är ${fmtNum(vals[0]!)}, medianen är ${fmtNum(vals[1]!)}, typvärdet är ${fmtNum(vals[2]!)} och variationsbredden är ${fmtNum(vals[3]!)}.`,
      tips: 'Räkna ut medelvärdet, medianen och typvärdet ett i taget. Vilket av dem blev talet?',
    };
  }
  // Jätten: ett jättestort tal drar iväg medelvärdet, men medianen står nästan still.
  const v = rng.shuffle(Array.from({ length: 16 }, (_, i) => 128 + i)).slice(0, 5);
  const jatte = 230 + rng.int(4) * 10;
  const alla = rng.shuffle([...v, jatte]);
  const names = alla.map((x, i) => (x === jatte ? 'Jätten' : DJUR[i]));
  const chart: Chart = {
    typ: 'lista', titel: 'Hur långa djuren i klassen är (cm)', enhet: 'cm', katNamn: '', kat: names,
    ikoner: alla.map((x, i) => (x === jatte ? '🧌' : DJURIKON[i])), serier: [{ namn: 'Längd', v: alla }], axel: axisFor(jatte, 10),
  };
  const wrong: Alt[] = [{ text: 'Medianen', err: 'jatten' }, { text: 'Typvärdet', err: 'jatten' }];
  return {
    ...b, kind: 'val', prompt: 'En jätte har börjat i klassen! Vilket mått drar jätten iväg mest?', chart,
    answer: 'Medelvärdet', alts: [{ text: 'Medelvärdet' }, ...wrong],
    los: `Utan jätten är medelvärdet ${fmtNum(Math.round(meanOf(v)))} cm, med jätten ungefär ${fmtNum(Math.round(meanOf(alla)))} cm. Medianen flyttar sig bara lite: från ${fmtNum(medianOf(v))} till ${fmtNum(medianOf(alla))}.`,
    tips: 'Tänk på hur man räknar ut varje mått. Vilket av dem använder alla talen i en summa?',
  };
}

const MODES: M[] = ['medel', 'median', 'typ', 'bredd', 'valj'];

export function makeQ(spec: QuestionSpec, rng: Rng): DQ | null {
  const mode: M = spec.mode === 'blandat'
    ? (spec.trap === 'median-osorterad' ? 'median' : spec.trap === 'medel-glomt-dela' ? 'medel' : rng.pick(MODES))
    : spec.mode as M;
  const level = Math.min(Math.max(0, spec.level), MAX[mode]);
  const b: Base = { mode, level, skill: skillOf(mode, level) };
  switch (mode) {
    case 'medel': return medel(b, rng);
    case 'median': return median(b, rng);
    case 'typ': return typ(b, rng);
    case 'bredd': return bredd(b, rng);
    case 'valj': return valj(b, rng);
  }
}

export const specsForSkill = (skill: string): QuestionSpec[] => SKILLS.find(([s]) => s === skill)?.[1] ?? [];

/** Exempel till Klassrummet. */
const exempel = (d: Data, v: number[]): Chart => ({
  typ: 'lista', titel: d.titel, enhet: d.enhet, katNamn: '', kat: d.kat.slice(0, v.length), ikoner: d.ikoner?.slice(0, v.length),
  serier: [{ namn: d.titel, v }], axel: axisFor(Math.max(...v), 1),
});
export const EXEMPEL_MEDEL = exempel(DATA[0], [2, 7, 3]);
export const EXEMPEL_MEDIAN = exempel(DATA[1], [3, 1, 4, 0, 2]);
