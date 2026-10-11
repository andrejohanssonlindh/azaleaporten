import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import type { DrillQ, Explained, Part } from '../../engines/drill/types';

// Tabellgruvan: gångertabellerna 0–10, division som omvänd multiplikation och det gömda talet.
// En fråga är "x op y = z" där en av x, y, z är rutan. Färdighets-id:n och felkoder är permanenta.

export type Mode = 'ganger' | 'delat' | 'saknas' | 'blandat';
export type Op = '·' | '/';

export interface MQ extends DrillQ {
  mode: Exclude<Mode, 'blandat'>;
  op: Op;
  x: number;
  y: number;
  z: number;
  blank: 0 | 1 | 2;
}

export const ERR: Record<string, string> = {
  plus: 'Plussar i stället för gånger',
  granntabell: 'Hamnar på grannen i tabellen',
  'noll-ett': 'Glömmer reglerna för 0 och 1',
  'fel-satt': 'Räknar med fel räknesätt',
};

/** Tabeller per nivå: 2, 5, 10 → 3, 4 → 6–9 → alla. */
export const TABLES: number[][] = [[2, 5, 10], [3, 4], [6, 7, 8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10]];

const range = (rng: Rng, lo: number, hi: number) => lo + rng.int(hi - lo + 1);

function build(mode: MQ['mode'], level: number, op: Op, x: number, y: number, blank: 0 | 1 | 2, skill: string): MQ {
  const z = op === '·' ? x * y : x / y;
  const nums = [x, y, z];
  const parts: Part[] = [x, op, y, '=', z];
  parts[blank === 2 ? 4 : blank === 1 ? 2 : 0] = null;
  return { mode, level, op, x, y, z, blank, answer: nums[blank], parts, skill };
}

/** Tabellen för en fråga: oftast nivåns egna, ibland en tidigare (så att de inte glöms bort). */
function pickTable(level: number, rng: Rng): number {
  if (level > 0 && level < 3 && rng.next() < 0.2) return rng.pick(TABLES.slice(0, level).flat());
  return rng.pick(TABLES[level]);
}

function nollEtt(level: number, rng: Rng): MQ {
  const n = range(rng, 2, 10);
  const r = rng.int(5);
  if (r === 0) return build('ganger', level, '·', n, 0, 2, 'ma.mult.0');
  if (r === 1) return build('ganger', level, '·', 0, n, 2, 'ma.mult.0');
  if (r === 2) return build('ganger', level, '·', 1, n, 2, 'ma.mult.1');
  if (r === 3) return build('ganger', level, '·', n, 1, 2, 'ma.mult.1');
  return rng.next() < 0.5 ? build('delat', level, '/', n, 1, 2, 'ma.div.1') : build('delat', level, '/', 0, n, 2, 'ma.div.0');
}

export function makeQ(spec: QuestionSpec, rng: Rng): MQ {
  const level = Math.min(3, Math.max(0, spec.level));
  if (spec.trap === 'noll-ett') return nollEtt(level, rng);
  let mode = spec.mode as Mode;
  if (spec.trap === 'plus' || spec.trap === 'granntabell') mode = 'ganger';
  if (mode === 'blandat') { const r = rng.next(); mode = r < 0.5 ? 'ganger' : r < 0.8 ? 'delat' : 'saknas'; }
  if (level === 3 && rng.next() < 0.12) return nollEtt(level, rng);

  const t = spec.trap === 'granntabell' ? rng.pick(TABLES[2]) : pickTable(level, rng);
  const k = spec.trap ? range(rng, 3, 9) : range(rng, mode === 'ganger' ? 1 : 2, 10);
  const swap = rng.next() < 0.5;
  if (mode === 'delat') return build('delat', level, '/', t * k, t, 2, `ma.div.${t}`);
  if (mode === 'saknas') return swap ? build('saknas', level, '·', t, k, 1, `ma.mult.${t}`) : build('saknas', level, '·', k, t, 0, `ma.mult.${t}`);
  return swap ? build('ganger', level, '·', k, t, 2, `ma.mult.${t}`) : build('ganger', level, '·', t, k, 2, `ma.mult.${t}`);
}

/* ---------- diagnos ---------- */

/** Den kända faktorn och produkten i en fråga där en faktor fattas. */
const known = (q: MQ) => (q.blank === 0 ? { f: q.y, p: q.z } : { f: q.x, p: q.z });

export function diagnose(q: MQ, given: number): string | undefined {
  const { x, y } = q;
  if (q.mode === 'ganger') {
    if (x === 0 || y === 0) return 'noll-ett';
    if (x === 1 || y === 1) return 'noll-ett';
    if (given === x + y) return 'plus';
    const near = [x * (y - 1), x * (y + 1), (x - 1) * y, (x + 1) * y];
    if (x > 1 && y > 1 && near.includes(given)) return 'granntabell';
    return undefined;
  }
  if (q.mode === 'delat') {
    if ((y === 1 || x === 0) && given !== q.answer) return 'noll-ett';
    if (given === x - y || given === x * y) return 'fel-satt';
    if (Math.abs(given - q.answer) === 1) return 'granntabell';
    return undefined;
  }
  const { f, p } = known(q);
  if (given === p - f || given === p + f) return 'fel-satt';
  if (Math.abs(given - q.answer) === 1) return 'granntabell';
  return undefined;
}

/* ---------- förklaringar ---------- */

const groups = (n: number, of: number) => (n <= 4 ? Array(n).fill(of).join(' + ') : `${n} stycken ${of}:or`);

export function explain(tag: string, q: MQ, given: number): Explained {
  const { x, y } = q;
  switch (tag) {
    case 'plus':
      return { title: 'Du räknade plus', text: `${x} · ${y} betyder ${x} gånger ${y}, alltså ${groups(x, y)}. Inte ${x} + ${y}.` };
    case 'noll-ett':
      if (q.mode === 'delat') return y === 1
        ? { title: 'Ett-regeln', text: 'Delat med 1 ändrar ingenting. Om en enda person får allt, får hen allt!' }
        : { title: 'Noll-regeln', text: 'Noll delat med något blir alltid 0. Har du inga kakor att dela, får ingen någon kaka.' };
      return x === 0 || y === 0
        ? { title: 'Noll-regeln', text: 'Allt gånger 0 blir 0. Noll grupper – då har du ingenting!' }
        : { title: 'Ett-regeln', text: 'Gånger 1 ändrar ingenting – talet blir sig självt.' };
    case 'granntabell':
      if (q.mode === 'ganger') {
        const steps = given > q.answer ? 'långt' : 'kort';
        return { title: 'Grannen i tabellen', text: `Du hamnade på grannen – ett steg för ${steps} i tabellen. Räkna från ett tal du är säker på, t.ex. 5 · ${Math.max(x, y)}.` };
      }
      if (q.mode === 'delat') return { title: 'Nästan!', text: `Kolla: ${given} · ${y} = ${given * y}, inte ${x}. Prova grannen.` };
      { const { f, p } = known(q); return { title: 'Nästan!', text: `Kolla: ${f} · ${given} = ${f * given}, inte ${p}. Prova grannen.` }; }
    case 'fel-satt':
      if (q.mode === 'delat') return { title: 'Fel räknesätt', text: `${x} / ${y} betyder: hur många ${y}:or får plats i ${x}? Tänk ${y} · ? = ${x}.` };
      { const { f, p } = known(q); return { title: 'Fel räknesätt', text: `Vi letar efter talet som gånger ${f} blir ${p}. Räkna i ${f}-steg tills du kommer till ${p}.` }; }
  }
  return { title: 'Inte riktigt', text: solution(q) };
}

export function solution(q: MQ): string {
  const { x, y, z } = q;
  if (q.mode === 'delat') return x === 0 ? `0 / ${y} = 0.` : `${x} / ${y} = ${z}, för ${z} · ${y} = ${x}.`;
  if (q.mode === 'saknas') return `${x} · ${y} = ${z}. Det gömda talet var ${q.answer}.`;
  const nine = (x === 9 || y === 9) && z >= 18 && z <= 90 ? ` Nians trick: ${Math.floor(z / 10)} + ${z % 10} = 9!` : '';
  return `${x} · ${y} = ${z}.${x !== y && x > 1 && y > 1 ? ` Samma som ${y} · ${x}.` : ''}${nine}`;
}

export function hint(q: MQ): string {
  const { x, y } = q;
  if (q.mode === 'delat') return x === 0 || y === 1 ? 'Tänk på reglerna för 0 och 1.' : `Tänk baklänges: ${y} · ? = ${x}.`;
  if (q.mode === 'saknas') { const { f, p } = known(q); return `Räkna i ${f}-steg tills du kommer till ${p}.`; }
  const k = Math.min(x, y), t = Math.max(x, y);
  if (k === 0) return 'Noll grupper – hur mycket blir det?';
  if (k === 1) return `En enda ${t}:a.`;
  if (k === 2) return `Dubbla ${t}.`;
  if (k === 3) return `${t} + ${t} + ${t}.`;
  if (k === 4) return `Dubbla ${t}, och dubbla igen.`;
  if (k === 5) return `Hälften av 10 · ${t}.`;
  if (t === 10) return 'Gånger 10: sätt en nolla efter talet.';
  return `5 · ${t} = ${5 * t}. ${k - 5 === 1 ? `Lägg till en ${t}:a till.` : `Lägg till ${k - 5} ${t}:or till.`}`;
}
