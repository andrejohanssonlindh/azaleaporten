import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import { axisFor, pictos, type Chart } from '../../engines/diagram/chart';
import { fmtNum } from '../../engines/drill/check';
import { GRONSAKER, MARKNADEN, type Tema } from './data';
import { cands, chartOf, distinct, flerQ, grannar, mestQ, pickKat, stapelBygg, summaQ, type Base, type DQ } from './gen';

// Skördemarknaden (åk 1–4): stapeldiagram och bilddiagram. Läsa av en stapel (först i steg om ett, sedan med
// en skala och mellan strecken), jämföra, läsa ett bilddiagram med nyckel (och halva bilder) och bygga staplar.
// Lägen, färdighets-id:n och felkoder är permanenta.

export type SkordMode = 'stapel' | 'jamfor' | 'bild' | 'rita' | 'blandat';
type M = Exclude<SkordMode, 'blandat'>;

const MAX: Record<M, number> = { stapel: 3, jamfor: 2, bild: 2, rita: 1 };

function skillOf(mode: M, level: number): string {
  if (mode === 'stapel') return level === 0 ? 'ma.stat.stapel' : 'ma.stat.stapel-skala';
  if (mode === 'bild') return level < 2 ? 'ma.stat.bild' : 'ma.stat.bild-halv';
  return mode === 'jamfor' ? 'ma.stat.stapel-jamfor' : 'ma.stat.stapel-rita';
}

const SKILLS: [string, QuestionSpec[]][] = [
  ['ma.stat.stapel', [{ mode: 'stapel', level: 0 }]],
  ['ma.stat.stapel-skala', [{ mode: 'stapel', level: 1 }, { mode: 'stapel', level: 2 }, { mode: 'stapel', level: 3 }]],
  ['ma.stat.stapel-jamfor', [{ mode: 'jamfor', level: 0 }, { mode: 'jamfor', level: 1 }, { mode: 'jamfor', level: 2 }]],
  ['ma.stat.bild', [{ mode: 'bild', level: 0 }, { mode: 'bild', level: 1 }]],
  ['ma.stat.bild-halv', [{ mode: 'bild', level: 2 }]],
  ['ma.stat.stapel-rita', [{ mode: 'rita', level: 0 }, { mode: 'rita', level: 1 }]],
];

/** Axeln: minst fem steg, och lite luft ovanför den högsta stapeln. */
const axel = (v: number[], step: number) => axisFor(Math.max(Math.max(...v) + step / 2, 5 * step), step);
const onLine = (x: number, step: number) => Math.abs(x / step - Math.round(x / step)) < 1e-9;

/** Läs av en stapel. Felsvaren: grannstaplarna, rutorna (talet delat med steget) och strecken intill. */
function lasStapel(b: Base, t: Tema, idx: number[], chart: Chart, i: number): DQ {
  const v = chart.serier[0].v, step = chart.axel.steg, x = v[i];
  const line = onLine(x, step);
  const list: [number, string][] = [];
  if (step > 1 && line) list.push([x / step, 'rutor-inte-varde']);
  if (!line) list.push([x - step / 2, 'mellan-linjer'], [x + step / 2, 'mellan-linjer']);
  return {
    ...b, kind: 'las', prompt: t.las(t.kat[idx[i]]), chart, answer: String(x), enhet: t.svarEnhet,
    cand: cands(x, [...list, ...grannar(v, i)]),
    visa: [i],
    los: line
      ? `Stapeln för ${chart.kat[i].toLocaleLowerCase('sv')} slutar vid strecket där det står ${fmtNum(x)}.`
      : `Stapeln slutar mitt emellan ${fmtNum(x - step / 2)} och ${fmtNum(x + step / 2)}. Mitt emellan är ${fmtNum(x)}.`,
    tips: step === 1
      ? 'Följ stapelns topp rakt åt sidan till axeln. Vilket tal står där?'
      : 'Titta först på skalan: hur mycket ökar talen för varje streck? Följ sedan stapelns topp till axeln.',
  };
}

function stapel(b: Base, rng: Rng, trap?: string): DQ | null {
  const t = rng.pick(MARKNADEN);
  if (b.level === 0) {
    const n = 3 + rng.int(2), idx = pickKat(t, n, rng), v = distinct(n, 1, 10, 1, rng);
    const chart = chartOf(t, idx, v, 'stapel', axel(v, 1));
    const i = rng.int(n);
    if (rng.next() < 0.5) return lasStapel(b, t, idx, chart, i);
    return {
      ...b, kind: 'tryck', prompt: `Tryck på stapeln som visar ${v[i]}.`, chart, answer: `k${i}`,
      misses: Object.fromEntries(v.map((_, j) => [`k${j}`, 'fel-stapel']).filter(([k]) => k !== `k${i}`)), visa: [i],
      los: `Stapeln för ${chart.kat[i].toLocaleLowerCase('sv')} slutar vid ${v[i]}.`,
      tips: 'Hitta talet på axeln och följ strecket rakt åt sidan tills det träffar toppen av en stapel.',
    };
  }
  if (b.level === 1) {
    const step = rng.pick([2, 5]), n = 4, idx = pickKat(t, n, rng), v = distinct(n, step * 2, step * 10, step, rng);
    return lasStapel(b, t, idx, chartOf(t, idx, v, 'stapel', axel(v, step)), rng.int(n));
  }
  // Nivå 2 (och 3 med stora tal): staplar som slutar mellan strecken, ibland liggande.
  const step = b.level === 2 ? rng.pick([2, 10]) : rng.pick([50, 100]);
  const n = b.level === 2 ? 4 : 5, idx = pickKat(t, n, rng), v = distinct(n, step / 2, step * 10, step / 2, rng);
  // Fällan Rutspindeln behöver en stapel på ett streck (annars går det inte att räkna rutor).
  const ask = v.map((x, i) => (onLine(x, step) === (trap === 'rutor-inte-varde') ? i : -1)).filter((i) => i >= 0);
  if (!ask.length) return null;
  const chart = chartOf(t, idx, v, 'stapel', axel(v, step), { liggande: rng.next() < 0.4 });
  return lasStapel(b, t, idx, chart, rng.pick(ask));
}

function jamfor(b: Base, rng: Rng): DQ | null {
  const t = rng.pick(MARKNADEN);
  if (b.level === 0) {
    const n = 4, idx = pickKat(t, n, rng), v = distinct(n, 1, 10, 1, rng);
    return mestQ(b, t, chartOf(t, idx, v, 'stapel', axel(v, 1)), rng.next() < 0.6 ? 'mest' : 'minst', true);
  }
  const step = b.level === 1 ? rng.pick([1, 2]) : rng.pick([5, 10]);
  const n = 3 + rng.int(2), idx = pickKat(t, n, rng), v = distinct(n, step, step * 9, step, rng);
  const chart = chartOf(t, idx, v, 'stapel', axel(v, step), { liggande: b.level === 2 && rng.next() < 0.3 });
  return rng.next() < 0.6 ? flerQ(b, t, idx, chart, rng) : summaQ(b, t, chart);
}

function bild(b: Base, rng: Rng): DQ | null {
  const t = rng.pick(MARKNADEN);
  const per = b.level === 0 ? 2 : b.level === 1 ? rng.pick([5, 10]) : rng.pick([2, 4, 10]);
  const half = b.level === 2;
  const n = 3 + rng.int(2), idx = pickKat(t, n, rng);
  const v = distinct(n, half ? per / 2 : per, per * 8, half ? per / 2 : per, rng);
  const halves = v.map((x, i) => (pictos(x, per).halv ? i : -1)).filter((i) => i >= 0);
  if (half && !halves.length) return null;
  const i = half ? rng.pick(halves) : rng.int(n);
  const chart = chartOf(t, idx, v, 'bild', axisFor(per * 8, per), { bild: { per, ikon: t.ikon } });
  const { hela, halv } = pictos(v[i], per);
  // Den halva bilden först: med en tvåa som nyckel kan "bara de hela" och "räknade bilderna" bli samma tal.
  const list: [number, string][] = halv ? [[v[i] - per / 2, 'halv-bild'], [v[i] + per / 2, 'halv-bild']] : [];
  list.push([hela + (halv ? 1 : 0), 'nyckel-glomd'], [hela + (halv ? 0.5 : 0), 'nyckel-glomd']);
  return {
    ...b, kind: 'las', prompt: t.las(t.kat[idx[i]]), chart, answer: String(v[i]), enhet: t.svarEnhet,
    cand: cands(v[i], [...list, ...grannar(v, i)]),
    visa: [i],
    los: `${hela} ${hela === 1 ? 'bild' : 'bilder'} · ${per} = ${hela * per}${halv ? `, och en halv bild är ${per / 2} till: ${hela * per} + ${per / 2} = ${v[i]}` : ''}.`,
    tips: half ? 'Kolla nyckeln: hur mycket är en hel bild värd? Och en halv bild är hälften av det.' : 'Kolla nyckeln under diagrammet: hur mycket är varje bild värd? Räkna sedan bilderna i steg.',
  };
}

function rita(b: Base, rng: Rng): DQ {
  const t = rng.pick(MARKNADEN);
  if (b.level === 0) {
    const idx = pickKat(t, 3, rng);
    return stapelBygg(b, t, idx, distinct(3, 1, 8, 1, rng), 1);
  }
  const step = rng.pick([2, 5]), idx = pickKat(t, 4, rng);
  return stapelBygg(b, t, idx, distinct(4, step, step * 8, step, rng), step);
}

const MODES = ['stapel', 'jamfor', 'bild', 'rita'] as const;

export function makeQ(spec: QuestionSpec, rng: Rng): DQ | null {
  // Vid en fälla väljs ett läge där fällan kan slå till.
  const mode: M = spec.mode === 'blandat'
    ? (spec.trap === 'rutor-inte-varde' ? 'stapel' : spec.trap === 'nyckel-glomd' ? 'bild' : rng.pick(MODES))
    : spec.mode as M;
  const min = spec.trap === 'rutor-inte-varde' && mode === 'stapel' ? 1 : 0;
  const level = Math.min(Math.max(min, spec.level), MAX[mode]);
  const b: Base = { mode, level, skill: skillOf(mode, level) };
  switch (mode) {
    case 'stapel': return stapel(b, rng, spec.trap);
    case 'jamfor': return jamfor(b, rng);
    case 'bild': return bild(b, rng);
    case 'rita': return rita(b, rng);
  }
}

export const specsForSkill = (skill: string): QuestionSpec[] => SKILLS.find(([s]) => s === skill)?.[1] ?? [];

/** Exempel till Klassrummet. */
export const EXEMPEL_STAPEL = chartOf(GRONSAKER, [0, 1, 3], [15, 5, 20], 'stapel', { min: 0, max: 25, steg: 5 });
export const EXEMPEL_BILD = chartOf(GRONSAKER, [0, 1, 3], [15, 10, 25], 'bild', { min: 0, max: 40, steg: 5 }, { bild: { per: 5 } });
