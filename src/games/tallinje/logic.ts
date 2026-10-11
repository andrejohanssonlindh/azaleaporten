import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import type { DrillQ, Explained } from '../../engines/drill/types';
import { fmtNum } from '../../engines/drill/check';

// Tallinjebron: tallinjen, avrundning, negativa tal och decimaltal.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'las' | 'avrunda' | 'negativa' | 'decimal';

/** En tallinje att rita: min–max med streck var tick:e och siffror var label:e. mark = pilens tal. */
export interface Line { min: number; max: number; tick: number; label: number; mark: number; markLabel?: boolean }

export interface LQ extends DrillQ {
  mode: Mode;
  line?: Line;
  /** avrunda: talet och vad det avrundas till (10, 100 eller 1). */
  value?: number;
  to?: number;
  /** negativa/decimal: a op b. */
  a?: number;
  b?: number;
  op?: '+' | '−';
}

export const ERR: Record<string, string> = {
  'fel-skala': 'Räknar strecken som ettor fast de är värda mer',
  'raknade-streck': 'Räknar ett streck fel',
  'avrundade-ner': 'Avrundar alltid nedåt',
  'fem-regeln': 'Glömmer att 5 avrundas uppåt',
  'avrundade-upp': 'Avrundar uppåt fast talet är närmare nedåt',
  'fel-plats': 'Avrundar till fel ställe',
  teckenfel: 'Glömmer minustecknet',
  'fel-riktning': 'Går åt fel håll på tallinjen',
  kommafel: 'Sätter kommat på fel ställe',
};

const range = (rng: Rng, lo: number, hi: number) => lo + rng.int(hi - lo + 1);
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const isInt = (n: number) => Math.abs(n - Math.round(n)) < 1e-9;

const SKILL: Record<Mode, string[]> = {
  las: ['ma.tallinje.las-20', 'ma.tallinje.las-100', 'ma.tallinje.las-1000', 'ma.tallinje.las-tiondelar'],
  avrunda: ['ma.avrunda.tiotal', 'ma.avrunda.hundratal', 'ma.avrunda.heltal', 'ma.avrunda.tiotal'],
  negativa: ['ma.negativa.las', 'ma.negativa.temperatur', 'ma.negativa.temperatur', 'ma.negativa.rakna'],
  decimal: ['ma.decimal.addera', 'ma.decimal.overgang', 'ma.decimal.subtrahera', 'ma.decimal.overgang'],
};

function las(level: number, rng: Rng): LQ {
  let line: Line;
  if (level === 0) line = { min: 0, max: 20, tick: 1, label: 5, mark: range(rng, 1, 19) };
  else if (level === 1) { const lo = 10 * range(rng, 0, 8); line = { min: lo, max: lo + 20, tick: 1, label: 10, mark: lo + range(rng, 1, 19) }; }
  else if (level === 2) line = { min: 0, max: 1000, tick: 50, label: 100, mark: 50 * range(rng, 1, 19) };
  else line = { min: 0, max: 2, tick: 0.1, label: 1, mark: r3(0.1 * range(rng, 1, 19)) };
  if (line.mark % line.label === 0) line.mark += line.tick; // pilen på ett omärkt streck
  line.mark = r3(line.mark);
  return { mode: 'las', level, skill: SKILL.las[level], line, answer: line.mark, prompt: 'Vilket tal pekar pilen på?', parts: [null], keypad: level === 3 ? 'decimal' : 'int' };
}

function avrunda(level: number, rng: Rng): LQ {
  const kind = level === 3 ? rng.int(3) : level;
  let value: number, to: number;
  if (kind === 0) { to = 10; value = draw(rng, () => range(rng, 11, 99), (v) => v % 10 !== 0); }
  else if (kind === 1) { to = 100; value = draw(rng, () => range(rng, 101, 999), (v) => v % 100 !== 0); }
  else { to = 1; value = r3(draw(rng, () => range(rng, 11, 99), (v) => v % 10 !== 0) / 10); }
  // Var tredje fråga hamnar precis på mitten (5:an), där regeln behövs.
  if (rng.int(3) === 0) value = r3(Math.floor(value / to) * to + to / 2);
  const answer = r3(Math.floor(value / to + 0.5 + 1e-9) * to);
  const lo = r3(Math.floor(value / to) * to);
  const what = to === 10 ? 'närmaste tiotal' : to === 100 ? 'närmaste hundratal' : 'närmaste heltal';
  return { mode: 'avrunda', level, skill: SKILL.avrunda[kind === 2 ? 2 : kind], value, to, answer,
    line: { min: lo, max: r3(lo + to), tick: to / 10, label: to, mark: value, markLabel: true },
    prompt: `Avrunda ${fmtNum(value)} till ${what}.`, parts: [value, '≈', null], keypad: 'int' };
}

function negativa(level: number, rng: Rng): LQ {
  if (level === 0) {
    const mark = draw(rng, () => range(rng, -9, 9), (v) => v !== 0 && v % 5 !== 0);
    return { mode: 'negativa', level, skill: SKILL.negativa[0], line: { min: -10, max: 10, tick: 1, label: 5, mark }, answer: mark,
      prompt: 'Vilket tal pekar pilen på?', parts: [null], keypad: 'signed' };
  }
  const span = level === 1 ? 10 : 20;
  for (;;) {
    const a = range(rng, -span + 2, span - 2);
    const up = rng.next() < 0.5;
    const b = range(rng, 2, span);
    const c = up ? a + b : a - b;
    // Frågan ska gå förbi noll (det är det som är klurigt).
    if (Math.abs(c) > span || Math.sign(a) === Math.sign(c) || c === 0 || a === 0) continue;
    if (level === 3) return { mode: 'negativa', level, skill: SKILL.negativa[3], a, b, op: up ? '+' : '−', answer: c, parts: [a, up ? '+' : '−', b, '=', null], keypad: 'signed' };
    return { mode: 'negativa', level, skill: SKILL.negativa[level], a, b, op: up ? '+' : '−', answer: c, keypad: 'signed',
      prompt: `Termometern visar ${fmtNum(a)} grader. Det blir ${b} grader ${up ? 'varmare' : 'kallare'}. Hur varmt är det nu?`, parts: [null, 'grader'],
      line: { min: -span, max: span, tick: 1, label: 5, mark: a } };
  }
}

function decimal(level: number, rng: Rng): LQ {
  const kind = level === 3 ? rng.int(3) : level;
  for (;;) {
    const a = range(rng, 1, kind === 2 ? 49 : 9), b = range(rng, 1, 9);
    if (kind === 0 && a + b >= 10) continue;
    if (kind === 1 && a + b <= 10) continue;
    if (kind === 2 && (a <= b || a % 10 >= b)) continue; // minus som går över heltalet
    const A = r3(a / 10), B = r3(b / 10);
    const op = kind === 2 ? '−' : '+';
    const answer = r3(op === '+' ? A + B : A - B);
    return { mode: 'decimal', level, skill: SKILL.decimal[kind], a: A, b: B, op, answer, parts: [A, op, B, '=', null], keypad: 'decimal' };
  }
}

function draw(_rng: Rng, gen: () => number, ok: (v: number) => boolean): number {
  for (let i = 0; i < 500; i++) { const v = gen(); if (ok(v)) return v; }
  throw new Error('tallinje: hittade inget tal');
}

export function makeQ(spec: QuestionSpec, rng: Rng): LQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'fem-regeln' || spec.trap === 'avrundade-ner') mode = 'avrunda';
  if (spec.trap === 'teckenfel' || spec.trap === 'fel-riktning') mode = 'negativa';
  if (mode === 'blandat') mode = rng.pick(['las', 'avrunda', 'negativa', 'decimal'] as const);
  if (mode === 'las') return las(level, rng);
  if (mode === 'avrunda') {
    const q = avrunda(level, rng);
    if (spec.trap === 'fem-regeln') { // alltid precis på mitten
      const lo = q.line!.min, v = r3(lo + q.to! / 2);
      return { ...q, value: v, answer: r3(lo + q.to!), line: { ...q.line!, mark: v }, prompt: q.prompt!.replace(/^Avrunda [^ ]+/, `Avrunda ${fmtNum(v)}`), parts: [v, '≈', null] };
    }
    return q;
  }
  if (mode === 'negativa') return negativa(spec.trap ? Math.max(1, level) : level, rng);
  return decimal(level, rng);
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const out: QuestionSpec[] = [];
  for (const mode of ['las', 'avrunda', 'negativa', 'decimal'] as const) SKILL[mode].forEach((s, level) => { if (s === skill) out.push({ mode, level }); });
  return out;
}

/* ---------- diagnos ---------- */

export function diagnose(q: LQ, given: number): string | undefined {
  const near = (x: number) => Math.abs(given - x) < 1e-9;
  if (q.mode === 'las') {
    const l = q.line!;
    const base = r3(Math.floor((l.mark + 1e-9) / l.label) * l.label);
    if (l.tick !== 1 && near(r3(base + (l.mark - base) / l.tick))) return 'fel-skala';
    if (!isInt(l.mark) && (near(l.mark * 10) || near(l.mark / 10))) return 'kommafel';
    if (near(l.mark + l.tick) || near(l.mark - l.tick)) return 'raknade-streck';
    if (near(-l.mark)) return 'teckenfel';
    return undefined;
  }
  if (q.mode === 'avrunda') {
    const to = q.to!, v = q.value!;
    const down = r3(Math.floor(v / to) * to), up = r3(down + to);
    const half = Math.abs(v - (down + to / 2)) < 1e-9;
    if (near(down) && half) return 'fem-regeln';
    if (near(down)) return 'avrundade-ner';
    if (near(up)) return 'avrundade-upp';
    if (near(v) || near(Math.round(v)) || [1, 10, 100, 1000].some((t) => t !== to && near(Math.round(v / t) * t))) return 'fel-plats';
    return undefined;
  }
  if (q.mode === 'negativa') {
    if (q.line && q.level === 0) return near(-q.answer) ? 'teckenfel' : near(q.answer + 1) || near(q.answer - 1) ? 'raknade-streck' : undefined;
    const other = q.op === '+' ? q.a! - q.b! : q.a! + q.b!;
    if (near(-q.answer)) return 'teckenfel';
    if (near(other)) return 'fel-riktning';
    return undefined;
  }
  if (near(q.answer * 10) || near(q.answer / 10) || near(q.answer / 100)) return 'kommafel';
  if (q.op === '+' && near(r3((Math.round(q.a! * 10) + Math.round(q.b! * 10)) / 100))) return 'kommafel';
  return undefined;
}

export function explain(tag: string, q: LQ, given: number): Explained {
  const l = q.line;
  switch (tag) {
    case 'fel-skala': return { title: 'Varje streck är mer än 1', text: `Mellan ${fmtNum(l!.min)} och ${fmtNum(l!.min + l!.label)} finns ${Math.round(l!.label / l!.tick)} steg. Då är varje streck värt ${fmtNum(l!.tick)}.` };
    case 'raknade-streck': return { title: 'Ett streck fel', text: 'Du är bara ett streck ifrån! Börja vid närmaste siffra och räkna strecken en gång till.' };
    case 'kommafel': return { title: 'Kommat hamnade fel', text: q.mode === 'decimal' && q.op === '+'
      ? `Tiondelarna ${Math.round(q.a! * 10)} + ${Math.round(q.b! * 10)} blir fler än tio – då blir det en hel! Tio tiondelar är 1.`
      : 'Titta var talet ligger: före eller efter 1? Kommat skiljer heltalen från tiondelarna.' };
    case 'fem-regeln': return { title: 'Precis på mitten', text: `${fmtNum(q.value!)} ligger precis mitt emellan. Då är regeln: avrunda uppåt.` };
    case 'avrundade-ner': return { title: 'Närmast uppåt', text: `Titta på tallinjen: ${fmtNum(q.value!)} ligger närmare det högre talet.` };
    case 'avrundade-upp': return { title: 'Närmast nedåt', text: `Titta på tallinjen: ${fmtNum(q.value!)} ligger närmare det lägre talet.` };
    case 'fel-plats': return { title: 'Fel ställe', text: `Avrunda till ${q.to === 10 ? 'ett helt tiotal (slutar på 0)' : q.to === 100 ? 'ett helt hundratal (slutar på 00)' : 'ett heltal (inga decimaler)'}.` };
    case 'teckenfel': return { title: 'Minus eller plus?', text: given > 0 ? 'Svaret ligger under noll – glöm inte minustecknet! Tryck på ±.' : 'Svaret ligger över noll, så det ska inte ha något minustecken.' };
    case 'fel-riktning': return { title: 'Åt fel håll', text: q.op === '+' ? 'Varmare betyder uppåt på termometern – åt höger på tallinjen.' : 'Kallare betyder nedåt på termometern – åt vänster på tallinjen.' };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: LQ): string {
  if (q.mode === 'las') return `Pilen pekar på ${fmtNum(q.answer)}.`;
  if (q.mode === 'avrunda') return `${fmtNum(q.value!)} ≈ ${fmtNum(q.answer)}.`;
  if (q.mode === 'negativa' && q.level === 0) return `Pilen pekar på ${fmtNum(q.answer)}.`;
  return `${fmtNum(q.a!)} ${q.op} ${fmtNum(q.b!)} = ${fmtNum(q.answer)}.`;
}

export function hint(q: LQ): string {
  if (q.mode === 'las') return `Varje streck är värt ${fmtNum(q.line!.tick)}. Börja vid närmaste siffra och räkna strecken.`;
  if (q.mode === 'avrunda') return 'Vilket av talen i ändarna ligger pilen närmast? Mitt emellan avrundas uppåt.';
  if (q.mode === 'negativa') return q.level === 0 ? 'Till vänster om noll är talen negativa.' : 'Ta det i två steg: först till noll, sedan resten.';
  return 'Räkna i tiondelar: 0,7 är 7 tiondelar. Tio tiondelar blir 1.';
}
