import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { deckPick } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { numWord } from '../engelska/tal';

// Big Ben-tornet: klockan på engelska. "half past three" är 3:30 – men "halv tre" är 2:30!
// Frågetyper: klocka (urtavla → engelska), digital (3:40 → engelska), ord (engelska → digital),
// hor (hör tiden → digital), ampm (24-timmarsklocka → a.m./p.m.).
// Färdighets-id:n ('en.tid.<sort>') och felkoder är permanenta.

export type How = 'klocka' | 'digital' | 'ord' | 'hor' | 'ampm';

export interface BQ extends OrdQ {
  how: How;
  /** Tiden: h = 1–12 (ampm: 0–23), m = 0–59. */
  h: number;
  m: number;
  /** Tiden på engelska. */
  phrase: string;
}

export const ERR: Record<string, string> = {
  'half-past': 'Översätter "halv tre" till "half past three" (half past räknar från timmen som har varit)',
  'past-to': 'Blandar ihop past (över) och to (i)',
  'fel-timme': 'Väljer fel timme',
  visare: 'Blandar ihop timvisaren och minutvisaren',
  'fel-minut': 'Läser minuterna fel',
  'am-pm': 'Blandar ihop a.m. (förmiddag) och p.m. (eftermiddag och kväll)',
  tjugofyra: 'Säger tiden med 24-timmarsklockan på engelska',
};

/* ---------- tiden på engelska ---------- */

const wrap = (h: number) => ((h - 1 + 120) % 12) + 1;
export const hourWord = (h: number) => numWord(wrap(h));

function minWord(n: number): string {
  if (n === 15) return 'quarter';
  if (n % 5 === 0) return numWord(n);
  return `${numWord(n)} ${n === 1 ? 'minute' : 'minutes'}`;
}

/** Tiden som man säger den: "quarter to four". h = 1–12. */
export function phrase(h: number, m: number): string {
  if (m === 0) return `${hourWord(h)} o'clock`;
  if (m === 30) return `half past ${hourWord(h)}`;
  if (m < 30) return `${minWord(m)} past ${hourWord(h)}`;
  return `${minWord(60 - m)} to ${hourWord(h + 1)}`;
}

/** Tiden som man läser en digital klocka: "three forty", "three oh five". */
export function digitalPhrase(h: number, m: number): string {
  return `${hourWord(h)} ${m === 0 ? "o'clock" : m < 10 ? `oh ${numWord(m)}` : numWord(m)}`;
}

export const digital = (h: number, m: number) => `${wrap(h)}:${String(m).padStart(2, '0')}`;
export const digital24 = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

/** a.m./p.m.: "seven p.m.", "seven thirty a.m." */
export function ampmPhrase(h24: number, m: number): string {
  return `${hourWord(h24)}${m ? ` ${m < 10 ? `oh ${numWord(m)}` : numWord(m)}` : ''} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
}

/* ---------- nivåer ---------- */

/** Minuterna per nivå: 0 = hel och halv, 1 = + kvart, 2 = + fem över …, 3 = + fem i …, 4 = alla minuter. */
const MINS: number[][] = [
  [0, 30],
  [0, 15, 30, 45],
  [0, 5, 10, 15, 20, 25, 30, 45],
  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29,
    31, 32, 33, 34, 36, 37, 38, 39, 41, 42, 43, 44, 46, 47, 48, 49, 51, 52, 53, 54, 56, 57, 58, 59],
];
export const MAX_LEVEL = 5;

/** Kort för fällorna: halv-fällan behöver halvtimmar, past/to behöver tider som inte är hela eller halva. */
const TRAP_MINS: Record<string, (m: number) => boolean> = {
  'half-past': (m) => m === 30,
  'past-to': (m) => m % 30 !== 0,
};

interface Card { how: How; h: number; m: number }

function howsFor(mode: string, level: number): How[] {
  if (mode === 'blandat') return level >= 5 ? ['klocka', 'digital', 'ord', 'hor', 'ampm'] : ['klocka', 'digital', 'ord', 'hor'];
  if (mode === 'ampm') return ['ampm'];
  return [mode as How];
}

export function cards(mode: string, level: number, trap?: string): Card[] {
  const lv = Math.max(0, Math.min(MAX_LEVEL, level));
  const mins = MINS[Math.min(lv, 4)].filter((m) => !trap || !TRAP_MINS[trap] || TRAP_MINS[trap](m));
  const usable = mins.length ? mins : MINS[3].filter((m) => !trap || !TRAP_MINS[trap] || TRAP_MINS[trap](m));
  const out: Card[] = [];
  for (const how of howsFor(mode, lv)) {
    if (how === 'ampm') {
      for (const h of [6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]) for (const m of [0, 30, 15, 45]) out.push({ how, h, m });
    } else {
      for (let h = 1; h <= 12; h++) for (const m of usable) out.push({ how, h, m });
    }
  }
  return out;
}

/* ---------- frågor ---------- */

/** En fel tid med sin felkod. */
interface Wrong { h: number; m: number; err: string }

/**
 * Typiska fel för en tid. toWords = barnet ska säga tiden på engelska (felet är en annan fras);
 * annars ska barnet läsa en engelsk fras (felet är en annan tid).
 */
function wrongTimes(h: number, m: number, level: number, toWords: boolean, clock: boolean, rng: Rng): Wrong[] {
  const out: Wrong[] = [];
  if (m === 30) out.push({ h: toWords ? h + 1 : h - 1, m: 30, err: 'half-past' });
  if (m % 30 !== 0) out.push(m < 30 ? { h: h - 1, m: 60 - m, err: 'past-to' } : { h: h + 1, m: 60 - m, err: 'past-to' });
  if (m > 30) out.push({ h: toWords ? h - 1 : h + 1, m, err: 'fel-timme' });
  else out.push({ h: h + 1, m, err: 'fel-timme' });
  if (clock && m % 5 === 0 && m !== 0) {
    const sh = m / 5, sm = (h % 12) * 5;
    if (sh !== h % 12 || sm !== m) out.push({ h: sh || 12, m: sm, err: 'visare' });
  }
  const mins = MINS[Math.min(level, 4)].filter((x) => x !== m);
  const near = [...mins].sort((a, b) => Math.abs(a - m) - Math.abs(b - m));
  for (const x of [near[0], near[1], rng.pick(mins)]) if (x !== undefined) out.push({ h, m: x, err: 'fel-minut' });
  return out;
}

/** Rätt svar, fällan först, sedan ett fel av varje sort. Alternativen blandas. */
function choose(rng: Rng, right: string, wrong: Alt[], trap: string | undefined, n: number): Alt[] {
  const seen = new Set([right]);
  const uniq = wrong.filter((a) => (seen.has(a.text) ? false : (seen.add(a.text), true)));
  const first = uniq.filter((a) => a.err === trap).slice(0, 1);
  const kinds = new Set<string>();
  const varied = uniq.filter((a) => !first.includes(a) && (kinds.has(a.err!) ? false : (kinds.add(a.err!), true)));
  const rest = rng.shuffle(uniq.filter((a) => !first.includes(a) && !varied.includes(a)));
  return rng.shuffle([{ text: right }, ...[...first, ...rng.shuffle(varied), ...rest].slice(0, n)]);
}

function build(c: Card, level: number, rng: Rng, trap?: string): Omit<BQ, 'mode' | 'level' | 'skill'> {
  const n = level >= 2 ? 3 : 2;
  const { how, h, m } = c;
  if (how === 'ampm') {
    const right = ampmPhrase(h, m);
    const wrong: Alt[] = [
      { text: ampmPhrase((h + 12) % 24, m), err: 'am-pm' },
      { text: `${numWord(h)}${m ? ` ${numWord(m)}` : " o'clock"}`, err: 'tjugofyra' },
      { text: ampmPhrase(h < 12 ? h + 1 : h - 1, m), err: 'fel-timme' },
    ];
    return { how, h, m, phrase: right, kind: 'val', prompt: 'Hur säger man tiden på engelska?', answer: right, alts: choose(rng, right, wrong, trap, n), lang: 'en-GB' };
  }
  const p = phrase(h, m);
  const toWords = how === 'klocka' || how === 'digital';
  const wrongs = wrongTimes(h, m, level, toWords, how === 'klocka', rng);
  if (toWords) {
    // Vid den digitala klockan räknas även "three forty" som rätt sätt att säga det, men alternativen är fraserna.
    const alts = choose(rng, p, wrongs.map((w) => ({ text: phrase(w.h, w.m), err: w.err })), trap, n);
    return {
      how, h, m, phrase: p, kind: 'val', prompt: how === 'klocka' ? 'Vad är klockan på engelska?' : 'Hur säger man tiden på engelska?',
      answer: p, alts, say: alts.map((a) => a.text).join('. '), lang: 'en-GB',
    };
  }
  const right = digital(h, m);
  const alts = choose(rng, right, wrongs.map((w) => ({ text: digital(w.h, w.m), err: w.err })), trap, n);
  return how === 'hor'
    ? { how, h, m, phrase: p, kind: 'val', prompt: 'Lyssna! Vad är klockan?', listen: true, answer: right, alts, say: `It's ${p}.`, read: `It's ${p}.`, lang: 'en-GB' }
    : { how, h, m, phrase: p, kind: 'val', prompt: 'Vad är klockan?', sentence: `"It's ${p}."`, answer: right, alts, say: `It's ${p}.`, lang: 'en-GB' };
}

/** Färdigheten för en tid. */
export function skillFor(how: How, m: number): string {
  if (how === 'ampm') return 'en.tid.ampm';
  if (m === 0) return 'en.tid.hel';
  if (m === 30) return 'en.tid.half';
  if (m === 15 || m === 45) return 'en.tid.quarter';
  if (m % 5 === 0) return m < 30 ? 'en.tid.past' : 'en.tid.to';
  return 'en.tid.minuter';
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): BQ {
  const level = Math.max(0, Math.min(MAX_LEVEL, spec.level));
  const pool = cards(spec.mode, level, spec.trap);
  const c = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  return { mode: spec.mode, level, skill: skillFor(c.how, c.m), ...build(c, level, rng, spec.trap) };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const both = (level: number) => [{ mode: 'klocka', level }, { mode: 'ord', level }];
  switch (skill) {
    case 'en.tid.hel': case 'en.tid.half': return both(0);
    case 'en.tid.quarter': return both(1);
    case 'en.tid.past': return both(2);
    case 'en.tid.to': return both(3);
    case 'en.tid.minuter': return [{ mode: 'digital', level: 4 }, { mode: 'klocka', level: 4 }];
    case 'en.tid.ampm': return [{ mode: 'ampm', level: 5 }];
    default: return [];
  }
}

export const diagnose = (): string | undefined => undefined;

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

const SV = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];

/** Ett exempel med halv som inte är frågans tid. */
function halfExample(q: BQ): string {
  const e = [3, 7, 10].find((x) => x !== wrap(q.h) && x !== wrap(q.h + 1) && x !== wrap(q.h - 1))!;
  return `"half past ${hourWord(e)}" är halv ${SV[e + 1]} på svenska`;
}

/** Ett exempel på past/to med andra minuter än frågans. */
function pastToExample(q: BQ): string {
  const n = [10, 20, 5].find((x) => x !== q.m && x !== 60 - q.m)!;
  return `"${numWord(n)} past" är ${n} över och "${numWord(n)} to" är ${n} i`;
}

export function explain(tag: string, q: BQ): Explained {
  const read = q.how === 'ord' || q.how === 'hor';
  switch (tag) {
    case 'half-past':
      return { title: 'Half-past-spöket lurade dig!', text: `På engelska räknar man halvtimmen från timmen som har varit: ${halfExample(q)}. På svenska räknar man mot timmen som kommer – så "halv" och "half past" pekar åt olika håll!` };
    case 'past-to':
      return { title: 'Past eller to?', text: `"past" betyder över och "to" betyder i: ${pastToExample(q)}.` };
    case 'fel-timme':
      return { title: 'Kolla timmen', text: 'Vid "past" hör timmen till den som har varit. Vid "to" är det timmen som snart kommer – precis som "i" på svenska.' };
    case 'visare':
      return { title: 'Visarna bytte plats', text: 'Den korta visaren visar timmen och den långa visaren visar minuterna. Titta igen!' };
    case 'fel-minut':
      return read
        ? { title: 'Kolla minuterna', text: 'Timmen stämmer, men inte minuterna. Quarter är en kvart och half är en halvtimme. Läs eller lyssna igen.' }
        : { title: 'Kolla minuterna', text: 'Timmen stämmer, men inte minuterna. Titta var den långa visaren pekar.' };
    case 'am-pm':
      return { title: 'a.m. eller p.m.?', text: 'a.m. är från midnatt till tolv på dagen (natt och förmiddag). p.m. är efter tolv (eftermiddag och kväll).' };
    case 'tjugofyra':
      return { title: 'Inte på engelska', text: 'På engelska säger man inte tiden med 24-timmarsklockan. Man räknar till tolv och lägger till a.m. eller p.m.' };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function hint(q: BQ): string {
  switch (q.how) {
    case 'klocka': return 'Titta först på den korta visaren (timmen), sedan på den långa (minuterna). Past = över, to = i.';
    case 'digital': return 'Minuterna efter kolon: upp till 30 säger man past, efter 30 säger man to och räknar mot nästa timme.';
    case 'ord': case 'hor': return 'Past = över och to = i. Half past räknar från timmen som har varit.';
    case 'ampm': return 'Räkna bort tolv från timmarna efter lunch. a.m. = förmiddag, p.m. = eftermiddag och kväll.';
  }
}

export function solution(q: BQ): string {
  if (q.how === 'ampm') return `${digital24(q.h, q.m)} är "${q.answer}".`;
  return `${digital(q.h, q.m)} är "${q.phrase}" på engelska.${q.m === 30 ? ` På svenska: halv ${SV[wrap(q.h + 1)]}.` : ''}${q.how === 'digital' && q.m % 15 !== 0 ? ` Man kan också säga "${digitalPhrase(q.h, q.m)}".` : ''}`;
}
