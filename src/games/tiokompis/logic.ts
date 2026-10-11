import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import type { DrillQ, Explained, Part } from '../../engines/drill/types';

// Tiokompisbron: plus och minus upp till 100, med och utan tiotalsövergång.
// En fråga är "a op b = c" där en av a, b, c är rutan barnet fyller i.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'par' | 'plus' | 'minus' | 'saknas';
export type Op = '+' | '−';

export interface TQ extends DrillQ {
  mode: Mode;
  op: Op;
  a: number;
  b: number;
  c: number;
  /** Vilket tal som är rutan: 0 = a, 1 = b, 2 = c. */
  blank: 0 | 1 | 2;
}

export const ERR: Record<string, string> = {
  'fel-satt': 'Räknar med fel räknesätt',
  'glomd-tia': 'Tappar tian (minnessiffran)',
  'lanade-inte': 'Tar minsta från största i stället för att låna',
  'glomd-lan': 'Glömmer att en tia är lånad',
  'tio-fel': 'En tia fel',
  'ett-fel': 'Räknar ett för mycket eller för lite',
};

const LEVELS: Record<Mode, [number, number]> = { par: [0, 2], plus: [0, 3], minus: [0, 3], saknas: [1, 3] };

const tens = (n: number) => Math.floor(n / 10);
const ones = (n: number) => n % 10;
const range = (rng: Rng, lo: number, hi: number) => lo + rng.int(hi - lo + 1);

/** Drar tal tills villkoret stämmer (deterministiskt med samma rng). */
function draw<T>(gen: () => T, ok: (t: T) => boolean): T {
  for (let i = 0; i < 500; i++) { const t = gen(); if (ok(t)) return t; }
  throw new Error('tiokompis: hittade inget tal');
}

const SKILL = {
  par: ['ma.add.tiokompisar', 'ma.add.hundrakompisar', 'ma.add.hundrakompisar'],
  plus: ['ma.add.inom-20', 'ma.add.over-tio', 'ma.add.tvasiffrigt-ental', 'ma.add.tvasiffrigt'],
  minus: ['ma.sub.inom-20', 'ma.sub.over-tio', 'ma.sub.tvasiffrigt-ental', 'ma.sub.tvasiffrigt'],
};

function build(mode: Mode, level: number, op: Op, a: number, b: number, blank: 0 | 1 | 2, skill: string): TQ {
  const c = op === '+' ? a + b : a - b;
  const nums = [a, b, c];
  const parts: Part[] = [nums[0], op, nums[1], '=', nums[2]];
  parts[blank === 2 ? 4 : blank === 1 ? 2 : 0] = null;
  return { mode, level, op, a, b, c, blank, answer: nums[blank], parts, skill };
}

function plusNums(level: number, rng: Rng, forceCarry: boolean): [number, number] {
  if (level <= 0) return draw(() => [range(rng, 1, 18), range(rng, 1, 9)] as [number, number], ([a, b]) => ones(a) + b <= 9 || a + b === 10);
  if (level === 1) return draw(() => [range(rng, 2, 9), range(rng, 2, 9)] as [number, number], ([a, b]) => a + b > 10);
  if (level === 2) {
    const carry = forceCarry || rng.next() < 0.8;
    return draw(() => [range(rng, 11, 89), range(rng, 2, 9)] as [number, number], ([a, b]) => ones(a) !== 0 && (ones(a) + b >= 10) === carry && a + b <= 99);
  }
  const carry = forceCarry || rng.next() < 0.75;
  return draw(() => [range(rng, 11, 79), range(rng, 11, 89)] as [number, number], ([a, b]) => a + b <= 99 && (ones(a) + ones(b) >= 10) === carry);
}

function minusNums(level: number, rng: Rng, forceBorrow: boolean): [number, number] {
  if (level <= 0) return draw(() => [range(rng, 2, 19), range(rng, 1, 9)] as [number, number], ([a, b]) => b < a && (a <= 10 || b <= ones(a)));
  if (level === 1) return draw(() => [range(rng, 11, 18), range(rng, 2, 9)] as [number, number], ([a, b]) => b > ones(a));
  if (level === 2) {
    const borrow = forceBorrow || rng.next() < 0.8;
    return draw(() => [range(rng, 21, 99), range(rng, 2, 9)] as [number, number], ([a, b]) => (b > ones(a)) === borrow);
  }
  const borrow = forceBorrow || rng.next() < 0.75;
  return draw(() => { const a = range(rng, 31, 99); return [a, range(rng, 11, a - 10)] as [number, number]; },
    ([a, b]) => (ones(b) > ones(a)) === borrow && a - b >= 10);
}

export function makeQ(spec: QuestionSpec, rng: Rng): TQ {
  let mode = spec.mode as Mode;
  let level = spec.level;
  // Bossens fälla styr vilken sorts fråga det blir.
  if (spec.trap === 'glomd-tia') { mode = 'plus'; level = Math.max(1, level); }
  if (spec.trap === 'lanade-inte') { mode = 'minus'; level = Math.max(1, level); }
  const [lo, hi] = LEVELS[mode] ?? [0, 0];
  level = Math.min(hi, Math.max(lo, level));
  const trapped = !!spec.trap;

  if (mode === 'par') {
    const total = level === 0 ? 10 : 100;
    const a = level === 0 ? range(rng, 1, 9) : level === 1 ? 10 * range(rng, 1, 9) : draw(() => range(rng, 11, 89), (x) => ones(x) !== 0);
    return build(mode, level, '+', a, total - a, 1, SKILL.par[level]);
  }
  if (mode === 'plus') { const [a, b] = plusNums(level, rng, trapped); return build(mode, level, '+', a, b, 2, SKILL.plus[level]); }
  if (mode === 'minus') { const [a, b] = minusNums(level, rng, trapped); return build(mode, level, '−', a, b, 2, SKILL.minus[level]); }
  // saknas: ett tal i mitten eller först fattas
  if (level === 1 || (level === 2 && rng.next() < 0.5) || (level === 3 && rng.next() < 0.5)) {
    const [a, b] = plusNums(level === 1 ? 1 : level, rng, true);
    return build(mode, level, '+', a, b, 1, 'ma.add.saknad-term');
  }
  if (level === 2) { const [a, b] = minusNums(1, rng, true); return build(mode, level, '−', a, b, 0, 'ma.sub.saknad-term'); }
  const [a, b] = minusNums(3, rng, false);
  return build(mode, level, '−', a, b, 1, 'ma.sub.saknad-term');
}

/* ---------- diagnos ---------- */

/** De två talen barnet ser (utom rutan). */
const knowns = (q: TQ): [number, number] => (q.blank === 2 ? [q.a, q.b] : q.blank === 1 ? [q.a, q.c] : [q.b, q.c]);

export function diagnose(q: TQ, given: number): string | undefined {
  const [x, y] = knowns(q);
  const wrongOp = q.answer === x + y ? Math.abs(x - y) : x + y;
  if (given === wrongOp) return 'fel-satt';
  if (q.blank === 2 && q.op === '+' && ones(q.a) + ones(q.b) >= 10) {
    const noCarry = ones(q.a + q.b) + 10 * (tens(q.a) + tens(q.b));
    const glued = Number(`${tens(q.a) + tens(q.b)}${ones(q.a) + ones(q.b)}`);
    if (given === noCarry || given === glued) return 'glomd-tia';
  }
  if (q.blank === 2 && q.op === '−' && ones(q.b) > ones(q.a)) {
    if (given === 10 * (tens(q.a) - tens(q.b)) + ones(q.b) - ones(q.a)) return 'lanade-inte';
    if (given === q.answer + 10) return 'glomd-lan';
  }
  if (Math.abs(given - q.answer) === 10) return 'tio-fel';
  if (Math.abs(given - q.answer) === 1) return 'ett-fel';
  return undefined;
}

/* ---------- förklaringar (avslöjar aldrig svaret – barnet ska rätta själv) ---------- */

export function explain(tag: string, q: TQ, given: number): Explained {
  const { a, b, c } = q;
  switch (tag) {
    case 'fel-satt':
      if (q.blank === 2) return q.op === '+'
        ? { title: 'Du räknade minus', text: 'Tecknet är +. Då ska talen läggas ihop.' }
        : { title: 'Du räknade plus', text: `Tecknet är −. Då ska du ta bort ${b} från ${a}.` };
      if (q.blank === 1 && q.op === '+') return { title: 'Du lade ihop talen', text: `Vi letar efter talet som fattas. Hur mycket behöver ${a} för att bli ${c}? Räkna från ${a} upp till ${c}.` };
      if (q.blank === 1) return { title: 'Du lade ihop talen', text: `Hur mycket ska bort från ${a} för att det ska bli ${c} kvar? Räkna från ${c} upp till ${a}.` };
      return { title: 'Talet ska vara större', text: `Om du tar bort ${b} och det blir ${c} kvar, måste du ha haft mer än ${c} från början. Lägg ihop ${c} och ${b}.` };
    case 'glomd-tia':
      if (a + b === 10) return { title: 'Du tappade en tia', text: `${a} och ${b} är tiokompisar – tillsammans blir de en hel tia!` };
      return a < 10 && b < 10
        ? { title: 'Du tappade en tia', text: `${a} + ${b} blir mer än 10. Fyll först upp till 10: ${a} + ${10 - a} = 10. Lägg sedan till det som är kvar av ${b}.` }
        : { title: 'Du tappade en tia', text: `Entalen ${ones(a)} + ${ones(b)} blir ${ones(a) + ones(b)} – det är en ny tia! Den ska följa med till tiotalen.` };
    case 'lanade-inte':
      return a < 20
        ? { title: 'Du räknade baklänges', text: `Du kan inte ta ${b} från ${ones(a)} genom att vända på dem. Ta först bort ${ones(a)}, så kommer du till ${a - ones(a)}. Ta sedan bort resten.` }
        : { title: 'Du räknade baklänges', text: `I entalen står det ${ones(a)} − ${ones(b)}. Du får inte byta plats på dem! Låna en tia: ${10 + ones(a)} − ${ones(b)}. Då blir det en tia mindre kvar.` };
    case 'glomd-lan':
      return { title: 'Tian du lånade', text: 'Du lånade en tia till entalen – bra! Men då finns det en tia mindre kvar i tiotalen.' };
    case 'tio-fel':
      if (q.mode === 'par' && q.level > 0 && ones(a) !== 0 && given > q.answer) {
        return { title: 'En tia för mycket', text: `När entalen blir 10 (${ones(a)} + ${10 - ones(a)}) blir det en ny tia. Därför behövs en tia mindre än du tror.` };
      }
      return { title: 'En tia fel', text: `Ditt svar är tio för ${given > q.answer ? 'mycket' : 'lite'}. Titta på tiotalen en gång till.` };
    case 'ett-fel':
      return { title: 'Nästan – ett ifrån!', text: 'Räkna en gång till, lugnt. När du räknar uppåt börjar du på talet efter det du står på.' };
  }
  return { title: 'Inte riktigt', text: solution(q) };
}

const eqText = (q: TQ) => `${q.a} ${q.op} ${q.b} = ${q.c}`;

export function solution(q: TQ): string {
  const { a, b, c } = q;
  if (q.mode === 'par') {
    if (q.level === 0) return `${a} och ${b} är tiokompisar – tillsammans blir de 10.`;
    if (ones(a) === 0) return `${a} och ${b} är hundrakompisar: ${tens(a)} tior och ${tens(b)} tior blir 10 tior.`;
    const up = a + 10 - ones(a);
    return `${a} + ${10 - ones(a)} = ${up}, och ${up} + ${100 - up} = 100. Alltså ${a} + ${b} = 100.`;
  }
  if (q.blank !== 2) return `${eqText(q)}. Talet som fattades var ${q.answer}.`;
  if (q.op === '+') {
    if (b < 10 && ones(a) + b > 10) { const r = 10 - ones(a); return `${a} + ${b} = ${a} + ${r} + ${b - r} = ${c}. Först upp till ${a + r}, sedan resten.`; }
    if (a >= 10 && b >= 10) return `Tiotal: ${tens(a) * 10} + ${tens(b) * 10} = ${(tens(a) + tens(b)) * 10}. Ental: ${ones(a)} + ${ones(b)} = ${ones(a) + ones(b)}. Tillsammans ${c}.`;
    return `${eqText(q)}.`;
  }
  if (b < 10 && b > ones(a) && a > 10) return `${a} − ${b} = ${a} − ${ones(a)} − ${b - ones(a)} = ${c}. Först ner till ${a - ones(a)}, sedan resten.`;
  if (b >= 10) return `${a} − ${tens(b) * 10} = ${a - tens(b) * 10}, och ${a - tens(b) * 10} − ${ones(b)} = ${c}.`;
  return `${eqText(q)}.`;
}

export function hint(q: TQ): string {
  const { a, b, c } = q;
  if (q.mode === 'par') return q.level === 0 ? 'Hur många rutor är tomma?' : `Gå först upp till närmaste hela tiotal, sedan vidare till 100.`;
  if (q.blank === 1 && q.op === '+') return `Räkna från ${a} upp till ${c}.`;
  if (q.blank === 1) return `Räkna från ${c} upp till ${a}.`;
  if (q.blank === 0) return `Vänd på det: ${c} + ${b} = ?`;
  if (q.op === '+') {
    if (b < 10 && ones(a) + b > 10) return `Gör en tia först: ${a} + ${10 - ones(a)} = ${a + 10 - ones(a)}. Hur mycket är kvar av ${b}?`;
    if (b >= 10) return 'Lägg ihop tiotalen för sig och entalen för sig.';
    return 'Börja på det stora talet och räkna uppåt.';
  }
  if (b < 10 && b > ones(a) && a > 10) return `Ta dig först ner till ${a - ones(a)}: ${a} − ${ones(a)}. Hur mycket mer ska bort?`;
  if (b >= 10) return ones(b) === 0 ? `Ta bort ${tens(b)} tior. Entalen ändras inte.` : `Ta bort tiotalen först: ${a} − ${tens(b) * 10} = ${a - tens(b) * 10}. Ta sedan bort ${ones(b)}.`;
  return 'Börja på det stora talet och räkna baklänges.';
}
