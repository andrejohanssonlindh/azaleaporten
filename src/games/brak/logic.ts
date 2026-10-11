import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import type { Choice, DrillQ, Explained, Frac } from '../../engines/drill/types';

// Bråkbageriet: bråk som pajbitar. Namnge, jämföra, likvärdiga bråk, del av ett antal, plus och minus.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'namnge' | 'jamfor' | 'lika' | 'delav' | 'addera';

export interface F { n: number; d: number }

export interface BQ extends DrillQ {
  mode: Mode;
  /** Bråket (eller bråken) i frågan. */
  f: F[];
  /** delav: antalet man tar en del av. lika: faktorn. */
  whole?: number;
  op?: '+' | '−';
  /** Vilken del av bråket som är rutan ('n' täljare, 'd' nämnare). */
  blankIn?: 'n' | 'd';
  /** namnge: rita som paj eller som chokladkaka. */
  shape?: 'paj' | 'kaka';
}

export const ERR: Record<string, string> = {
  'storre-namnare': 'Tror att större nämnare betyder större bit',
  'raknade-tomma': 'Räknar de tomma bitarna',
  'raknade-alla': 'Räknar alla bitar i stället för de färgade',
  'adderade-namnare': 'Lägger ihop nämnarna också',
  adderade: 'Lägger till i stället för att multiplicera',
  'glomde-taljaren': 'Glömmer täljaren (tar bara en del)',
  'fel-satt': 'Räknar med fel räknesätt',
};

const CMP: Choice[] = [{ label: '<', value: 0 }, { label: '=', value: 1 }, { label: '>', value: 2 }];
const range = (rng: Rng, lo: number, hi: number) => lo + rng.int(hi - lo + 1);
const fr = (f: F, blank?: 'n' | 'd'): Frac => ({ n: blank === 'n' ? null : f.n, d: blank === 'd' ? null : f.d });
const val = (f: F) => f.n / f.d;
const cmp = (a: F, b: F) => (Math.abs(val(a) - val(b)) < 1e-9 ? 1 : val(a) < val(b) ? 0 : 2);
export const fstr = (f: F) => `${f.n}/${f.d}`;

const SKILL = {
  namnge: 'ma.brak.namnge', jamforD: 'ma.brak.jamfor-namnare', jamforN: 'ma.brak.jamfor-taljare', jamforHalv: 'ma.brak.jamfor-halv',
  lika: 'ma.brak.likvardiga', delav: 'ma.brak.del-av', addera: 'ma.brak.addera', subtrahera: 'ma.brak.subtrahera',
};

function namnge(level: number, rng: Rng): BQ {
  const d = rng.pick([[2, 3, 4], [2, 3, 4, 5, 6, 8], [3, 4, 5, 6, 8, 10, 12]][Math.min(2, level)]);
  const n = range(rng, 1, d - 1);
  const blankIn = level === 0 || rng.next() < 0.7 ? 'n' : 'd';
  return { mode: 'namnge', level, skill: SKILL.namnge, f: [{ n, d }], blankIn, shape: rng.next() < 0.5 ? 'paj' : 'kaka',
    answer: blankIn === 'n' ? n : d, prompt: 'Hur stor del är färgad?', parts: [fr({ n, d }, blankIn)] };
}

function jamfor(level: number, rng: Rng, trap: boolean): BQ {
  const kind = trap ? 1 : level === 3 ? rng.int(3) : Math.min(level, 2);
  let a: F, b: F, skill: string;
  if (kind === 0) { const d = range(rng, 3, 10); a = { n: range(rng, 1, d - 1), d }; b = { n: range(rng, 1, d - 1), d }; skill = SKILL.jamforD; }
  else if (kind === 1) { const n = range(rng, 1, 3); const ds = rng.shuffle([2, 3, 4, 5, 6, 8, 10].filter((x) => x > n)); a = { n, d: ds[0] }; b = { n, d: rng.next() < 0.15 ? ds[0] : ds[1] }; skill = SKILL.jamforN; }
  else {
    const half = { n: 1, d: 2 };
    const d = rng.pick([4, 6, 8, 10]);
    const other = { n: range(rng, 1, d - 1), d };
    [a, b] = rng.next() < 0.5 ? [half, other] : [other, half];
    skill = SKILL.jamforHalv;
  }
  return { mode: 'jamfor', level, skill, f: [a, b], answer: cmp(a, b), choices: CMP, prompt: 'Vilken bit är störst? Välj <, = eller >.', parts: [fr(a), null, fr(b)] };
}

function lika(level: number, rng: Rng): BQ {
  const base = rng.pick([{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 2, d: 3 }, { n: 1, d: 4 }, { n: 3, d: 4 }, { n: 2, d: 5 }]);
  const k = level <= 1 ? 2 : range(rng, 2, 5);
  const big = { n: base.n * k, d: base.d * k };
  if (level === 3 && rng.next() < 0.5) {
    // Förkorta: 6/8 = 3/?
    return { mode: 'lika', level, skill: SKILL.lika, f: [big, base], whole: k, blankIn: 'd', answer: base.d, prompt: 'Samma storlek på biten – vad fattas?', parts: [fr(big), '=', fr(base, 'd')] };
  }
  const blankIn = rng.next() < 0.5 ? 'n' : 'd';
  return { mode: 'lika', level, skill: SKILL.lika, f: [base, big], whole: k, blankIn, answer: blankIn === 'n' ? big.n : big.d,
    prompt: 'Samma storlek på biten – vad fattas?', parts: [fr(base), '=', fr(big, blankIn)] };
}

function delav(level: number, rng: Rng): BQ {
  const d = rng.pick([[2, 4], [2, 3, 4, 5], [3, 4, 5, 6], [2, 3, 4, 5, 6, 8, 10]][level]);
  const n = level >= 2 ? range(rng, 1, d - 1) : 1;
  const whole = d * range(rng, 2, level === 0 ? 5 : 10);
  return { mode: 'delav', level, skill: SKILL.delav, f: [{ n, d }], whole, answer: (whole / d) * n,
    prompt: `Bagaren har ${whole} bullar. Hur många är ${fstr({ n, d })} av dem?`, parts: [fr({ n, d }), 'av', whole, '=', null] };
}

function addera(level: number, rng: Rng): BQ {
  const d = rng.pick([4, 5, 6, 8, 10, 12]);
  const minus = level >= 3 && rng.next() < 0.5;
  let a: number, b: number;
  do { a = range(rng, 1, d - 1); b = range(rng, 1, d - 1); } while (minus ? a <= b : a + b > d);
  const c = minus ? a - b : a + b;
  const blankIn = level >= 2 && rng.next() < 0.5 ? 'd' : 'n';
  return { mode: 'addera', level, skill: minus ? SKILL.subtrahera : SKILL.addera, f: [{ n: a, d }, { n: b, d }, { n: c, d }], op: minus ? '−' : '+', blankIn,
    answer: blankIn === 'n' ? c : d, parts: [fr({ n: a, d }), minus ? '−' : '+', fr({ n: b, d }), '=', fr({ n: c, d }, blankIn)] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): BQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'storre-namnare') mode = 'jamfor';
  if (spec.trap === 'adderade-namnare') mode = 'addera';
  if (mode === 'blandat') mode = rng.pick(['namnge', 'jamfor', 'lika', 'delav', 'addera'] as const);
  switch (mode) {
    case 'namnge': return namnge(level, rng);
    case 'jamfor': return jamfor(level, rng, spec.trap === 'storre-namnare');
    case 'lika': return lika(Math.max(1, level), rng);
    case 'delav': return delav(level, rng);
    case 'addera': {
      const q = addera(Math.max(1, spec.trap ? 2 : level), rng);
      return spec.trap ? { ...q, blankIn: 'd', answer: q.f[0].d, parts: [...q.parts.slice(0, 4), fr(q.f[2], 'd')] } : q;
    }
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.namnge: return [{ mode: 'namnge', level: 1 }];
    case SKILL.jamforD: return [{ mode: 'jamfor', level: 0 }];
    case SKILL.jamforN: return [{ mode: 'jamfor', level: 1 }];
    case SKILL.jamforHalv: return [{ mode: 'jamfor', level: 2 }];
    case SKILL.lika: return [{ mode: 'lika', level: 2 }];
    case SKILL.delav: return [{ mode: 'delav', level: 1 }, { mode: 'delav', level: 2 }];
    case SKILL.addera: return [{ mode: 'addera', level: 1 }];
    case SKILL.subtrahera: return [{ mode: 'addera', level: 3 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

export function diagnose(q: BQ, given: number): string | undefined {
  const [a, b] = q.f;
  switch (q.mode) {
    case 'namnge':
      if (q.blankIn === 'n' && given === a.d - a.n) return 'raknade-tomma';
      if (q.blankIn === 'n' && given === a.d) return 'raknade-alla';
      if (q.blankIn === 'd' && given === a.d - a.n) return 'raknade-tomma';
      return undefined;
    case 'jamfor':
      if (a.n === b.n && a.d !== b.d && given === (a.d < b.d ? 0 : 2)) return 'storre-namnare';
      return undefined;
    case 'lika': {
      const [from, to] = q.f;
      if (from.n > to.n) return given === from.d - (from.n - to.n) ? 'adderade' : undefined; // förkorta: drog bort samma tal
      if (q.blankIn === 'n' && given === from.n + (to.d - from.d)) return 'adderade';
      if (q.blankIn === 'd' && given === from.d + (to.n - from.n)) return 'adderade';
      return undefined;
    }
    case 'delav':
      if (a.n > 1 && given === q.whole! / a.d) return 'glomde-taljaren';
      if (given === q.whole! * a.d || given === q.whole! - a.d || given === q.whole! + a.d) return 'fel-satt';
      return undefined;
    case 'addera':
      if (q.blankIn === 'd' && given === (q.op === '+' ? 2 * a.d : 0)) return 'adderade-namnare';
      if (q.blankIn === 'n' && q.op === '+' && given === Math.abs(a.n - b.n)) return 'fel-satt';
      if (q.blankIn === 'n' && q.op === '−' && given === a.n + b.n) return 'fel-satt';
      return undefined;
  }
}

export function explain(tag: string, q: BQ, given: number): Explained {
  const [a, b] = q.f;
  switch (tag) {
    case 'raknade-tomma': return { title: 'Du räknade de tomma', text: 'Täljaren (talet överst) är de färgade bitarna. Nämnaren (talet under) är hur många bitar det finns sammanlagt.' };
    case 'raknade-alla': return { title: 'Bara de färgade', text: 'Talet överst är hur många bitar som är färgade – inte alla bitar.' };
    case 'storre-namnare': return { title: 'Fler bitar = mindre bitar', text: `Delar man en paj i ${Math.max(a.d, b.d)} bitar blir varje bit mindre än om man delar den i ${Math.min(a.d, b.d)}. Större nämnare betyder mindre bit!` };
    case 'adderade': return { title: 'Gånger, inte plus', text: 'Delar du varje bit i lika många nya bitar, ändras både talet över och under strecket lika många gånger. Gånger – inte plus!' };
    case 'glomde-taljaren': return { title: 'Du tog bara en del', text: `${given} är 1/${a.d} av ${q.whole}. Men frågan gäller ${fstr(a)} – det är ${a.n} sådana delar.` };
    case 'fel-satt': return q.mode === 'delav'
      ? { title: 'Dela upp', text: `${fstr(a)} av ${q.whole}: dela först de ${q.whole} bullarna i ${a.d} lika stora högar.` }
      : { title: q.op === '+' ? 'Du räknade minus' : 'Du räknade plus', text: q.op === '+' ? 'Tecknet är +. Lägg ihop bitarna.' : 'Tecknet är −. Ta bort bitar.' };
    case 'adderade-namnare': return { title: 'Bitarna är lika stora', text: `Bitarna är ${a.d}-delar hela tiden. Lägger du ihop bitar blir det fler bitar – men de är fortfarande lika stora. Nämnaren ändras inte!` };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: BQ): string {
  const [a, b, c] = q.f;
  switch (q.mode) {
    case 'namnge': return `${a.n} av ${a.d} bitar är färgade: ${fstr(a)}.`;
    case 'jamfor': return `${fstr(a)} ${CMP[q.answer].label} ${fstr(b)}.`;
    case 'lika': return a.n > b.n ? `${fstr(a)} = ${fstr(b)} (dela både över och under med ${q.whole}).` : `${fstr(a)} = ${fstr(b)} (gånger ${q.whole} både över och under).`;
    case 'delav': return `${q.whole} / ${a.d} = ${q.whole! / a.d}${a.n > 1 ? `, och ${a.n} · ${q.whole! / a.d} = ${q.answer}` : ''}.`;
    case 'addera': return `${fstr(a)} ${q.op} ${fstr(b)} = ${fstr(c)}.`;
  }
}

export function hint(q: BQ): string {
  const [a, b] = q.f;
  switch (q.mode) {
    case 'namnge': return q.blankIn === 'n' ? 'Räkna de färgade bitarna.' : 'Räkna alla bitar, både färgade och tomma.';
    case 'jamfor': return a.d === b.d ? 'Bitarna är lika stora – vem har flest?' : a.n === b.n ? 'Lika många bitar – men vilka bitar är störst?' : 'Är bråket mer eller mindre än en halv?';
    case 'lika': return 'Vad har man gånger talet med på andra sidan? Gör likadant.';
    case 'delav': return `Dela ${q.whole} i ${a.d} lika stora högar${a.n > 1 ? `, och ta ${a.n} högar` : ''}.`;
    case 'addera': return 'Lägg ihop (eller ta bort) bitarna. Bitarnas storlek är densamma.';
  }
}
