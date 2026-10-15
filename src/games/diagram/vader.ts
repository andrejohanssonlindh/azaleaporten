import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import { axisFor, type Chart } from '../../engines/diagram/chart';
import type { Alt } from '../../engines/diagram/types';
import { fmtNum } from '../../engines/drill/check';
import { LINJER, SOLROS, TEMP, type Linje } from './data';
import { cands, chartOf, stapelBygg, type Base, type DQ, type Extra } from './gen';

// Väderstationen (åk 3–6): linjediagram. Läsa av en punkt (och mellan strecken), när var värdet så här,
// när ökade det mest (Toppjägaren väljer toppen i stället), hur mycket det ökade, två linjer i samma diagram,
// sätta ut punkter, och vilket diagram som passar till vilken sorts data.
// Lägen, färdighets-id:n och felkoder är permanenta.

type M = 'las' | 'forandring' | 'tva' | 'rita' | 'valj';
const MAX: Record<M, number> = { las: 2, forandring: 2, tva: 1, rita: 1, valj: 0 };
const SKILL: Record<M, string> = {
  las: 'ma.stat.linje', forandring: 'ma.stat.linje-forandring', tva: 'ma.stat.linje-tva', rita: 'ma.stat.linje-rita', valj: 'ma.stat.diagramtyp',
};

export const VADER_ERR: Record<string, string> = {
  'fel-punkt': 'Läser av fel punkt',
  'x-y-bytt': 'Svarar med tiden i stället för värdet',
  'topp-inte-okning': 'Väljer toppen i stället för där det ökade mest',
  'okning-minskning': 'Blandar ihop ökning och minskning',
  'fel-serie': 'Läser av fel linje',
  'fel-diagramtyp': 'Väljer ett diagram som inte passar datan',
};

export const vaderExtra: Extra = {
  err: VADER_ERR,
  explain(tag, q) {
    switch (tag) {
      case 'fel-punkt':
        return { title: 'Fel punkt', text: 'Du läste av en annan punkt. Leta först upp rätt tid längst ner. Gå rakt upp till linjen, och sedan rakt åt sidan till axeln.' };
      case 'x-y-bytt':
        return { title: 'Det var tiden', text: 'Talet du svarade står längst ner – det är tiden. Frågan gäller hur mycket: gå upp till punkten och läs av talet vid axeln till vänster.' };
      case 'topp-inte-okning':
        return { title: 'Toppen är inte ökningen', text: 'Högst upp är inte samma sak som att öka mest! Titta på hur brant linjen går uppåt mellan två punkter som sitter bredvid varandra. Ju brantare, desto större ökning.' };
      case 'okning-minskning':
        return { title: 'Upp eller ner?', text: 'Läs frågan igen. Öka betyder att linjen går uppåt. Minska betyder att den går nedåt.' };
      case 'fel-serie':
        return { title: 'Fel linje', text: 'Det finns två linjer. Titta i teckenförklaringen ovanför diagrammet: vilken linje hör till det frågan gäller?' };
      case 'fel-diagramtyp':
        return { title: 'Vad visar datan?', text: 'Något som ändras över tid passar i ett linjediagram. Delar av en helhet passar i ett cirkeldiagram. Antal av olika saker som ska jämföras passar i ett stapeldiagram.' };
      default:
        return q.mode === 'valj' ? { title: 'Inte riktigt', text: `Prova igen. ${q.tips}` } : undefined;
    }
  },
};

/** n olika värden som bildar en kurva: ökar hela tiden (vaxt) eller upp till en topp och ner igen (dag). */
export function kurva(form: Linje['form'], n: number, lo: number, hi: number, step: number, rng: Rng): number[] {
  const pool: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) pool.push(Math.round(v * 100) / 100);
  const s = rng.shuffle(pool).slice(0, n).sort((a, b) => a - b);
  if (form === 'vaxt') return s;
  const top = s.pop()!;
  const p = 1 + rng.int(n - 2);
  const rest = rng.shuffle(s);
  return [...rest.slice(0, p).sort((a, b) => a - b), top, ...rest.slice(p).sort((a, b) => b - a)];
}

/** Talet står i texten (då avslöjar texten svaret). */
const inText = (text: string, n: number) => new RegExp(`(?<![\\d,.])${String(n).replace('.', '[.,]')}(?![\\d]|[,.]\\d)`).test(text);

function linjeChart(t: Linje, idx: number[], v: number[], step: number, v2?: number[]): Chart {
  const top = Math.max(...v, ...(v2 ?? []));
  const c = chartOf(t, idx, v, 'linje', axisFor(Math.max(top + step / 2, 5 * step), step));
  c.ikoner = undefined;
  if (v2 && t.serier) c.serier = [{ namn: t.serier[0], v }, { namn: t.serier[1], v: v2 }];
  return c;
}

/** Ett stycke ur tidpunkterna: n stycken i följd. */
function idxOf(t: Linje, n: number, rng: Rng): number[] {
  const s = rng.int(t.kat.length - n + 1);
  return Array.from({ length: n }, (_, i) => s + i);
}

const onLine = (x: number, step: number) => Math.abs(x / step - Math.round(x / step)) < 1e-9;
const neighbours = (v: number[], i: number): [number, string][] => [v[i - 1], v[i + 1]].filter((x) => x !== undefined).map((x) => [x, 'fel-punkt']);

/** Läs av en punkt. */
function lasPunkt(b: Base, t: Linje, idx: number[], c: Chart, i: number): DQ | null {
  const v = c.serier[0].v, step = c.axel.steg, x = v[i];
  const prompt = t.las(t.kat[idx[i]]);
  if (inText(prompt, x)) return null;
  const line = onLine(x, step);
  const list: [number, string][] = [];
  if (t.x) list.push([t.x[idx[i]], 'x-y-bytt']);
  if (!line) list.push([x - step / 2, 'mellan-linjer'], [x + step / 2, 'mellan-linjer']);
  else if (step > 1) list.push([x / step, 'rutor-inte-varde']);
  return {
    ...b, kind: 'las', prompt, chart: c, answer: String(x), enhet: t.svarEnhet,
    cand: cands(x, [...list, ...neighbours(v, i)]), visa: [i],
    los: line
      ? `Punkten för ${t.kat[idx[i]].p} ligger på strecket där det står ${fmtNum(x)}.`
      : `Punkten ligger mitt emellan ${fmtNum(x - step / 2)} och ${fmtNum(x + step / 2)}. Mitt emellan är ${fmtNum(x)}.`,
    tips: 'Leta upp tiden längst ner. Gå rakt upp till punkten, och sedan rakt åt sidan till axeln. Vilket tal står där?',
  };
}

function las(b: Base, rng: Rng): DQ | null {
  const t = rng.pick(LINJER);
  const n = b.level === 0 ? 5 : 6;
  const idx = idxOf(t, n, rng);
  if (b.level === 0) {
    const step = rng.pick([1, 2]);
    const c = linjeChart(t, idx, kurva(t.form, n, step, step * 10, step, rng), step);
    if (rng.next() < 0.35 && t.form === 'dag') {
      const v = c.serier[0].v, mest = rng.next() < 0.6;
      const right = v.indexOf(mest ? Math.max(...v) : Math.min(...v)), other = v.indexOf(mest ? Math.min(...v) : Math.max(...v));
      return {
        ...b, kind: 'tryck', prompt: `${mest ? t.mest : t.minst} Tryck på punkten.`, chart: c, answer: `k${right}`,
        misses: Object.fromEntries(v.map((_, j) => [`k${j}`, j === other ? 'mest-minst' : 'jamforde-fel']).filter(([k]) => k !== `k${right}`)),
        visa: [right], los: `${c.kat[right]}: ${t.med(v[right])}. Den punkten ligger ${mest ? 'högst' : 'lägst'}.`,
        tips: `Vilken punkt ligger ${mest ? 'högst upp' : 'längst ner'}?`,
      };
    }
    return lasPunkt(b, t, idx, c, rng.int(n));
  }
  if (b.level === 1) {
    const step = rng.pick([5, 10]);
    const c = linjeChart(t, idx, kurva(t.form, n, step / 2, step * 9, step / 2, rng), step);
    const v = c.serier[0].v;
    const mellan = v.map((x, i) => (onLine(x, step) ? -1 : i)).filter((i) => i >= 0);
    return lasPunkt(b, t, idx, c, mellan.length && rng.next() < 0.7 ? rng.pick(mellan) : rng.int(n));
  }
  // Nivå 2: åt andra hållet – när var värdet så här?
  const step = rng.pick([2, 5, 10]);
  const c = linjeChart(t, idx, kurva(t.form, n, step, step * 9, step, rng), step);
  const v = c.serier[0].v, i = rng.int(n);
  const wrong: Alt[] = [
    ...[i - 1, i + 1].filter((j) => j >= 0 && j < n).map((j) => ({ text: c.kat[j], err: 'fel-punkt' })),
    ...rng.shuffle(v.map((_, j) => j).filter((j) => Math.abs(j - i) > 1)).map((j) => ({ text: c.kat[j], err: 'jamforde-fel' })),
  ].slice(0, 3);
  return {
    ...b, kind: 'val', prompt: t.nar(t.med(v[i])), chart: c, answer: c.kat[i], alts: rng.shuffle([{ text: c.kat[i] }, ...wrong]),
    visa: [i], los: `Talet ${fmtNum(v[i])} står vid axeln. Gå rakt åt sidan till linjen och sedan rakt ner: ${c.kat[i].toLocaleLowerCase('sv')}.`,
    tips: 'Leta upp talet vid axeln. Gå rakt åt sidan tills du träffar en punkt, och sedan rakt ner till tiden.',
  };
}

/** "steg temperaturen" → "Temperaturen steg". */
function mening(fras: string): string {
  const [verb, ...rest] = fras.split(' ');
  const subj = rest.join(' ');
  return `${subj.charAt(0).toUpperCase()}${subj.slice(1)} ${verb}`;
}

const intervall = (t: Linje, idx: number[], i: number) => `Från ${t.kat[idx[i]].p} till ${t.kat[idx[i + 1]].p}`;

/** När ökade (eller minskade) det mest? Toppjägaren väljer sträckan upp till toppen. */
function mestOkning(b: Base, t: Linje, rng: Rng, minska: boolean): DQ | null {
  const n = 6, idx = idxOf(t, n, rng), step = b.level >= 2 ? rng.pick([5, 10]) : 2;
  const c = linjeChart(t, idx, kurva(t.form, n, step, step * 12, step, rng), step);
  const v = c.serier[0].v;
  const d = v.slice(1).map((x, i) => x - v[i]);
  const best = minska ? Math.min(...d) : Math.max(...d);
  if ((minska ? best >= 0 : best <= 0) || d.filter((x) => x === best).length > 1) return null;
  const right = d.indexOf(best);
  const peak = v.indexOf(minska ? Math.min(...v) : Math.max(...v));
  // Sträckan som slutar vid toppen (eller botten) – det Toppjägaren väljer.
  const topp = peak - 1;
  if (topp < 0 || topp === right) return null;
  const other = d.indexOf(minska ? Math.max(...d) : Math.min(...d));
  const wrong: Alt[] = [{ text: intervall(t, idx, topp), err: 'topp-inte-okning' }];
  if ((minska ? d[other] > 0 : d[other] < 0) && other !== topp) wrong.push({ text: intervall(t, idx, other), err: 'okning-minskning' });
  for (const j of rng.shuffle(d.map((_, j) => j))) if (j !== right && j !== topp && j !== other && wrong.length < 3) wrong.push({ text: intervall(t, idx, j), err: 'jamforde-fel' });
  if (wrong.length < 2) return null;
  const fras = minska ? t.minskade : t.okade;
  return {
    ...b, kind: 'val', prompt: `När ${fras} mest?`, chart: c, answer: intervall(t, idx, right),
    alts: rng.shuffle([{ text: intervall(t, idx, right) }, ...wrong]), visa: [right, right + 1],
    los: `${intervall(t, idx, right)} går linjen ${minska ? 'brantast nedåt' : 'brantast uppåt'}: från ${fmtNum(v[right])} till ${fmtNum(v[right + 1])}. Det är ${fmtNum(Math.abs(best))} på en gång.`,
    tips: `Titta på varje bit av linjen mellan två punkter som sitter bredvid varandra. Var går den ${minska ? 'brantast nedåt' : 'brantast uppåt'}?`,
  };
}

function forandring(b: Base, rng: Rng, trap?: string): DQ | null {
  const t = rng.pick(LINJER);
  if (trap === 'topp-inte-okning' || b.level === 0) return mestOkning(b, t, rng, false);
  if (b.level === 2) return mestOkning(b, t, rng, t.form === 'dag' && rng.next() < 0.5);
  // Nivå 1: hur mycket ökade det, eller vad hände mellan två tider?
  const n = 6, idx = idxOf(t, n, rng), step = rng.pick([2, 5]);
  const c = linjeChart(t, idx, kurva(t.form, n, step, step * 10, step, rng), step);
  const v = c.serier[0].v;
  if (rng.next() < 0.6) {
    const pairs: [number, number][] = [];
    for (let a = 0; a < n; a++) for (let z = a + 1; z < n; z++) if (v[z] > v[a] && !v.includes(v[z] - v[a])) pairs.push([a, z]);
    if (!pairs.length) return null;
    const [a, z] = rng.pick(pairs), d = v[z] - v[a];
    const prompt = t.hurMycket(t.kat[idx[a]], t.kat[idx[z]]);
    if (inText(prompt, d)) return null;
    return {
      ...b, kind: 'las', prompt, chart: c, answer: String(d), enhet: t.svarEnhet,
      cand: cands(d, [[v[z], 'svarade-varde'], [v[a], 'svarade-varde'], [v[a] + v[z], 'summa-skillnad']]), visa: [a, z],
      los: `${c.kat[a]}: ${fmtNum(v[a])}. ${c.kat[z]}: ${fmtNum(v[z])}. ${fmtNum(v[z])} − ${fmtNum(v[a])} = ${fmtNum(d)}.`,
      tips: 'Läs av båda punkterna först. Ökningen är skillnaden: det senare talet minus det tidigare.',
    };
  }
  const i = rng.int(n - 1), upp = v[i + 1] > v[i];
  const steg = mening(t.okade), sjonk = mening(t.minskade);
  return {
    ...b, kind: 'val', prompt: `Vad hände mellan ${t.kat[idx[i]].p} och ${t.kat[idx[i + 1]].p}?`, chart: c, answer: upp ? steg : sjonk,
    alts: [{ text: upp ? steg : sjonk }, { text: upp ? sjonk : steg, err: 'okning-minskning' }, { text: 'Ingenting ändrades', err: 'jamforde-fel' }],
    visa: [i, i + 1],
    los: `Linjen går ${upp ? 'uppåt' : 'nedåt'} mellan de två punkterna: från ${fmtNum(v[i])} till ${fmtNum(v[i + 1])}.`,
    tips: 'Följ linjen från den första tiden till den andra. Går den uppåt eller nedåt?',
  };
}

/** Två linjer i samma diagram. */
function tva(b: Base, rng: Rng): DQ | null {
  const t = rng.pick([TEMP, SOLROS]);
  const n = 5, idx = idxOf(t, n, rng), step = 2;
  const v = kurva(t.form, n, 8, 30, step, rng);
  const off = v.map(() => step * (1 + rng.int(3)));
  const v2 = v.map((x, i) => x - off[i]);
  if (v2.some((x) => x <= 0) || new Set(v2).size < n || (t.form === 'vaxt' && v2.some((x, i) => i && x <= v2[i - 1]))) return null;
  const c = linjeChart(t, idx, v, step, v2);
  const i = rng.int(n);
  if (b.level === 0) {
    const j = rng.int(2), val = c.serier[j].v, other = c.serier[1 - j].v;
    const prompt = t.lasSerie!(j, t.kat[idx[i]]);
    if (inText(prompt, val[i])) return null;
    return {
      ...b, kind: 'las', prompt, chart: c, answer: String(val[i]), enhet: t.svarEnhet,
      cand: cands(val[i], [[other[i], 'fel-serie'], ...neighbours(val, i), ...(t.x ? [[t.x[idx[i]], 'x-y-bytt'] as [number, string]] : [])]),
      visa: [i], los: `${t.serier![j]}: ${j === 0 ? 'den hela linjen med runda prickar' : 'den streckade linjen med fyrkanter'}. ${c.kat[i]} ligger den punkten på ${fmtNum(val[i])}.`,
      tips: 'Kolla först i teckenförklaringen vilken linje som är vilken. Följ sedan rätt linje.',
    };
  }
  const d = v[i] - v2[i];
  const prompt = t.skillnad!(t.kat[idx[i]]);
  if (inText(prompt, d)) return null;
  return {
    ...b, kind: 'las', prompt, chart: c, answer: String(d), enhet: t.svarEnhet,
    cand: cands(d, [[v[i], 'svarade-varde'], [v2[i], 'svarade-varde'], [v[i] + v2[i], 'summa-skillnad']]), visa: [i],
    los: `${t.serier![0]}: ${fmtNum(v[i])}. ${t.serier![1]}: ${fmtNum(v2[i])}. ${fmtNum(v[i])} − ${fmtNum(v2[i])} = ${fmtNum(d)}.`,
    tips: 'Läs av båda linjerna vid samma tid. Skillnaden är det större talet minus det mindre.',
  };
}

function rita(b: Base, rng: Rng): DQ {
  const t = rng.pick(LINJER);
  const n = b.level === 0 ? 4 : 5, idx = idxOf(t, n, rng), step = b.level === 0 ? 1 : rng.pick([2, 5]);
  const q = stapelBygg(b, t, idx, kurva(t.form, n, step, step * 8, step, rng), step, 'linje');
  q.chart.ikoner = undefined;
  q.kalla!.ikoner = undefined;
  return q;
}

/** Vilket diagram passar? [data, rätt diagram, varför]. */
const TYPER: [string, 'Linjediagram' | 'Stapeldiagram' | 'Cirkeldiagram', string][] = [
  ['Temperaturen varje timme under en dag', 'Linjediagram', 'Temperaturen ändras över tid. Linjen visar hur den går upp och ner.'],
  ['Hur lång solrosen är varje vecka', 'Linjediagram', 'Solrosen växer över tid. Linjen visar hur den växer.'],
  ['Hur många som badade varje månad under ett år', 'Linjediagram', 'Antalet ändras över tid, månad för månad.'],
  ['Hur stor del av klassen som går, cyklar eller åker buss till skolan', 'Cirkeldiagram', 'Det är delar av en helhet: hela klassen är hela cirkeln.'],
  ['Hur stor del av godispåsen som är lakrits, choklad och gelé', 'Cirkeldiagram', 'Det är delar av en helhet: hela påsen är hela cirkeln.'],
  ['Hur stor del av dagen du sover, är i skolan och leker', 'Cirkeldiagram', 'Det är delar av en helhet: hela dygnet är hela cirkeln.'],
  ['Hur många av varje fågel som Fågelvakten såg', 'Stapeldiagram', 'Det är antal av olika saker som ska jämföras. En stapel för varje fågel.'],
  ['Hur många mål varje lag gjorde i cupen', 'Stapeldiagram', 'Det är antal för olika lag som ska jämföras. En stapel för varje lag.'],
  ['Hur många kilo av varje grönsak som såldes', 'Stapeldiagram', 'Det är mängder av olika saker som ska jämföras. En stapel för varje grönsak.'],
];

function valj(b: Base, rng: Rng): DQ {
  const [data, right, why] = rng.pick(TYPER);
  const alla = ['Linjediagram', 'Stapeldiagram', 'Cirkeldiagram'] as const;
  return {
    ...b, kind: 'val', prompt: `Vilket diagram passar bäst för: ${data.toLocaleLowerCase('sv')}?`,
    chart: { typ: 'lista', titel: '', enhet: '', katNamn: '', kat: [], serier: [{ namn: '', v: [] }], axel: { min: 0, max: 1, steg: 1 } },
    answer: right, alts: alla.map((a) => (a === right ? { text: a } : { text: a, err: 'fel-diagramtyp' })),
    los: why,
    tips: 'Ändras något över tid? Är det delar av en helhet? Eller ska man jämföra hur många det finns av olika saker?',
  };
}

const MODES: M[] = ['las', 'forandring', 'tva', 'rita', 'valj'];

export function makeQ(spec: QuestionSpec, rng: Rng): DQ | null {
  const mode: M = spec.mode === 'blandat' ? (spec.trap === 'topp-inte-okning' ? 'forandring' : rng.pick(MODES)) : spec.mode as M;
  const b: Base = { mode, level: Math.min(Math.max(0, spec.level), MAX[mode]), skill: SKILL[mode] };
  switch (mode) {
    case 'las': return las(b, rng);
    case 'forandring': return forandring(b, rng, spec.trap);
    case 'tva': return tva(b, rng);
    case 'rita': return rita(b, rng);
    case 'valj': return valj(b, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const mode = MODES.find((m) => SKILL[m] === skill);
  return mode ? Array.from({ length: MAX[mode] + 1 }, (_, level) => ({ mode, level })) : [];
}

/** Exempel till Klassrummet: temperaturen en dag. */
export const EXEMPEL_LINJE = linjeChart(TEMP, [0, 1, 2, 3, 4, 5], [4, 8, 14, 16, 12, 10], 2);
export const EXEMPEL_TVA = linjeChart(TEMP, [1, 2, 3, 4, 5], [8, 14, 16, 12, 10], 2, [4, 8, 12, 8, 6]);
