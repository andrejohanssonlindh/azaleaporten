import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import { tally } from '../../engines/diagram/chart';
import { FAGLAR, PLOCK, TORNET } from './data';
import { cands, chartOf, distinct, flerQ, grannar, mestQ, pickKat, streckBygg, summaQ, type Base, type DQ } from './gen';

// Fågeltornet (åk 1–3): streckdiagram och tabeller. Läsa av streck i femgrupper, läsa en tabell,
// jämföra (flest, färst, hur många fler, sammanlagt) och rita streck själv – från en tabell eller en bild.
// Lägen, färdighets-id:n och felkoder är permanenta.

export type FagelMode = 'streck' | 'tabell' | 'jamfor' | 'rita' | 'blandat';

const SKILL: Record<Exclude<FagelMode, 'blandat'>, string> = {
  streck: 'ma.stat.streck', tabell: 'ma.stat.tabell', jamfor: 'ma.stat.tabell-jamfor', rita: 'ma.stat.streck-rita',
};
const MAX: Record<Exclude<FagelMode, 'blandat'>, number> = { streck: 1, tabell: 1, jamfor: 2, rita: 1 };
const AXEL = { min: 0, max: 20, steg: 1 };

function streck(b: Base, rng: Rng, trap?: string): DQ {
  const t = rng.pick(TORNET);
  const n = b.level === 0 ? 3 + rng.int(2) : 4 + rng.int(2);
  const idx = pickKat(t, n, rng);
  const v = b.level === 0 ? distinct(n, 1, 9, 1, rng) : distinct(n, 3, 19, 1, rng);
  // Den som frågas har minst en femgrupp (alltid vid fällan, oftast annars), så att femgruppen spelar roll.
  const big = v.map((x, i) => (x >= 5 ? i : -1)).filter((i) => i >= 0);
  if (!big.length) v[0] = 5 + rng.int(5);
  const i = trap === 'femgrupp' || rng.next() < 0.8 ? rng.pick(big.length ? big : [0]) : rng.int(n);
  const chart = chartOf(t, idx, v, 'streck', AXEL);
  const { buntar, rest } = tally(v[i]);
  return {
    ...b, kind: 'las', prompt: t.las(t.kat[idx[i]]), chart, answer: String(v[i]),
    cand: cands(v[i], [[v[i] - buntar, 'femgrupp'], [v[i] + buntar, 'femgrupp'], ...grannar(v, i)]),
    visa: [i],
    los: buntar ? `${buntar === 1 ? 'En femgrupp är 5' : `${buntar} femgrupper är ${buntar * 5}`}${rest ? `, och ${rest} streck till: ${buntar * 5} + ${rest} = ${v[i]}` : ''}.` : `${rest} streck.`,
    tips: 'Leta upp rätt rad. Räkna fem för varje knippe med ett snett streck, och sedan ett för varje streck som är kvar.',
  };
}

function tabell(b: Base, rng: Rng): DQ {
  const t = rng.pick(TORNET);
  const n = b.level === 0 ? 3 + rng.int(2) : 5;
  const idx = pickKat(t, n, rng);
  const v = b.level === 0 ? distinct(n, 1, 10, 1, rng) : distinct(n, 2, 20, 1, rng);
  const i = rng.int(n);
  const chart = chartOf(t, idx, v, 'tabell', AXEL);
  return {
    ...b, kind: 'las', prompt: t.las(t.kat[idx[i]]), chart, answer: String(v[i]),
    cand: cands(v[i], grannar(v, i)),
    visa: [i],
    los: `Leta upp ${chart.kat[i].toLocaleLowerCase('sv')} i tabellen. Talet på samma rad är ${v[i]}.`,
    tips: 'Leta upp namnet i den vänstra kolumnen. Talet står på samma rad, längst till höger.',
  };
}

function jamfor(b: Base, rng: Rng): DQ | null {
  const t = rng.pick(TORNET);
  if (b.level === 0) {
    const n = 4;
    const idx = pickKat(t, n, rng);
    const chart = chartOf(t, idx, distinct(n, 1, 12, 1, rng), rng.next() < 0.5 ? 'tabell' : 'streck', AXEL);
    return mestQ(b, t, chart, rng.next() < 0.6 ? 'mest' : 'minst', false);
  }
  const n = 3 + rng.int(2);
  const idx = pickKat(t, n, rng);
  const v = b.level === 1 ? distinct(n, 1, 12, 1, rng) : distinct(n, 2, 16, 1, rng);
  const chart = chartOf(t, idx, v, b.level === 1 ? 'tabell' : 'streck', AXEL);
  return rng.next() < 0.6 ? flerQ(b, t, idx, chart, rng) : summaQ(b, t, chart);
}

function rita(b: Base, rng: Rng): DQ {
  if (b.level === 0) {
    const t = rng.pick(TORNET);
    const idx = pickKat(t, 3, rng);
    return streckBygg(b, t, idx, distinct(3, 1, 9, 1, rng), rng, false);
  }
  const t = rng.pick(PLOCK);
  const idx = pickKat(t, 3, rng);
  return streckBygg(b, t, idx, distinct(3, 2, 7, 1, rng), rng, true);
}

const MODES = ['streck', 'tabell', 'jamfor', 'rita'] as const;

export function makeQ(spec: QuestionSpec, rng: Rng): DQ | null {
  const mode = (spec.mode === 'blandat' ? rng.pick(spec.trap ? ['streck'] as const : MODES) : spec.mode) as Exclude<FagelMode, 'blandat'>;
  const b: Base = { mode, level: Math.min(Math.max(0, spec.level), MAX[mode]), skill: SKILL[mode] };
  switch (mode) {
    case 'streck': return streck(b, rng, spec.trap);
    case 'tabell': return tabell(b, rng);
    case 'jamfor': return jamfor(b, rng);
    case 'rita': return rita(b, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const mode = (Object.keys(SKILL) as (keyof typeof SKILL)[]).find((m) => SKILL[m] === skill);
  return mode ? Array.from({ length: MAX[mode] + 1 }, (_, level) => ({ mode, level })) : [];
}

/** Ett exempel till Klassrummet: fåglarna som Fågelvakten räknade. */
export const EXEMPEL = chartOf(FAGLAR, [1, 2, 4], [7, 12, 3], 'streck', AXEL);
