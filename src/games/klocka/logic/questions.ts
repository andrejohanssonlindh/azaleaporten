import type { Rng } from '../../../platform/rng';
import { h12, minToHM, render, renderMin, structs, tOf, type Phrase } from './language';
import { candidates, hmSwapTime } from './diagnose';

// Frågegenerering. Allt är serialiserbart så att en pågående runda kan sparas.

export type Mode = 'clock' | 'words' | 'choice' | 'between';
/** Nivå 0–7, se LEVELS. */
export type Level = number;
/** Fällor som bossar riktar in sig på (samma namn som felkoderna). */
export type Trap = 'halv' | 'rel' | 'period' | 'hm';

const FIVE = Array.from({ length: 12 }, (_, i) => i * 5);

/**
 * Nivåstegen. Varje nivå lägger till en sak, så att barnet aldrig möter en tid som inte har övats än.
 * mins = minuter som kan komma, pm = även eftermiddag och kväll, alt = även "tio i halv"/"tio över halv"
 * för :20/:40 (och därmed fem i/över halv för :25/:35, som inte finns på lägre nivåer).
 */
export const LEVELS: { mins: number[]; pm: boolean; alt: boolean; desc: string }[] = [
  { mins: [0, 15, 30, 45], pm: false, alt: false, desc: 'Bara minutvisaren: vad betyder den?' },
  { mins: [0, 30], pm: false, alt: false, desc: 'Hel och halv timme' },
  { mins: [0, 15, 30, 45], pm: false, alt: false, desc: 'Hel, halv och kvart' },
  { mins: [0, 15, 20, 30, 40, 45], pm: false, alt: false, desc: 'Tjugo över och tjugo i' },
  { mins: FIVE.filter((m) => m !== 25 && m !== 35), pm: false, alt: false, desc: 'Fem och tio över och i' },
  { mins: FIVE.filter((m) => m !== 25 && m !== 35), pm: true, alt: false, desc: 'Eftermiddag och kväll' },
  { mins: FIVE, pm: true, alt: true, desc: 'Fem i halv, tio över halv' },
  { mins: Array.from({ length: 60 }, (_, i) => i), pm: true, alt: true, desc: 'Alla minuter' },
];
export const MAX_LEVEL = LEVELS.length - 1;
export const MINS = LEVELS.map((l) => l.mins);
export const LEVEL_DESC = LEVELS.map((l) => l.desc);
const lv = (level: number) => LEVELS[Math.max(0, Math.min(MAX_LEVEL, level))];

export interface Option { text: string; tag: string }
export interface TimeQ { kind: 'time'; mode: 'clock' | 'words' | 'choice'; level: Level; h: number; m: number; isFm: boolean; s: Phrase; opts?: Option[] }
export interface BTime { h24: number; m: number; fmt: 'clock' | 'words' | 'digits'; s: Phrase }
export interface BetweenQ { kind: 'between'; mode: 'between'; level: Level; a: BTime; b: BTime }
export type KQ = TimeQ | BetweenQ;

/** Sätten att säga tiden som nivån använder. "Tjugofem i fyra" och liknande sägs sällan, så de kommer aldrig. */
export function phrasings(h: number, m: number, lvl: number): Phrase[] {
  const v = structs(h, m);
  const altOk = lv(lvl).alt && ((m >= 20 && m <= 24) || (m >= 36 && m <= 40));
  return altOk ? v : v.slice(0, 1);
}

export function variant(h: number, m: number, lvl: number, rng: Rng): Phrase {
  const v = phrasings(h, m, lvl);
  return v.length > 1 && rng.next() < 0.5 ? v[1] : v[0];
}

const samePhrase = (a: Phrase, b: Phrase) => a.n === b.n && a.rel === b.rel && a.halv === b.halv && a.H === b.H;

/** Minuter som passar en fälla på given nivå. */
function trapMinutes(trap: Trap | undefined, level: Level): number[] {
  const all = lv(level).mins;
  switch (trap) {
    case 'halv': {
      const f = all.filter((m) => m >= 20 && m <= 40);
      return f.length ? f : all;
    }
    case 'rel': return all.filter((m) => m !== 0 && m !== 30);
    case 'hm': return all.filter((m) => m >= 5 && m <= 55 && m !== 30);
    default: return all;
  }
}

export function makeQ(mode: Mode, level: Level, rng: Rng, trap?: Trap): KQ {
  if (mode === 'between') return makeBetween(level, rng);
  if (mode !== 'choice' && level === 0) level = 1;
  level = Math.max(0, Math.min(MAX_LEVEL, level));
  const m = rng.pick(trapMinutes(trap, level));
  const h = rng.int(11) + 1;
  // Kvällsfällan (Nattkorpen) tar med eftermiddag och kväll även före kvällsnivån.
  const isFm = lv(level).pm || trap === 'period' ? rng.next() < 0.5 : true;
  let s = mode === 'clock' ? structs(h, m)[0] : variant(h, m, level, rng);
  if (trap === 'halv' && mode !== 'clock') s = phrasings(h, m, level).find((x) => x.halv) ?? s;
  const q: TimeQ = { kind: 'time', mode, level, h, m, isFm, s };
  if (mode === 'choice') q.opts = level === 0 ? makeOptions0(q, rng) : makeOptions(q, rng);
  return q;
}

export function makeOptions(q: TimeQ, rng: Rng): Option[] {
  const corT = tOf(q.h, q.m);
  const cands = candidates(q.s, hmSwapTime(q.h, q.m, q.level));
  const first = cands.filter((c) => c.tag === 'rel' || c.tag === 'hm');
  const rest = rng.shuffle(cands.filter((c) => !(c.tag === 'rel' || c.tag === 'hm')));
  const mins = lv(q.level).mins;
  // Fel alternativ får bara använda minuter och uttryck som nivån har övat.
  const fits = (c: { t: number; s?: Phrase }) => {
    const hm = minToHM(c.t);
    return mins.includes(hm.m) && (!c.s || phrasings(hm.h, hm.m, q.level).some((p) => samePhrase(p, c.s!)));
  };
  const seen = new Set([corT]);
  const picked: { t: number; tag: string; s?: Phrase }[] = [];
  for (const c of [...first, ...rest]) {
    if (picked.length >= 3) break;
    if (seen.has(c.t) || !fits(c)) continue;
    seen.add(c.t);
    picked.push(c);
  }
  while (picked.length < 3) {
    const t = rng.int(12) * 60 + rng.pick(mins);
    if (seen.has(t)) continue;
    seen.add(t);
    picked.push({ t, tag: 'other' });
  }
  const opts = [{ text: render(q.s), tag: 'correct' }].concat(picked.map((c) => {
    const hm = minToHM(c.t);
    return { text: c.s ? render(c.s) : render(variant(hm.h, hm.m, q.level, rng)), tag: c.tag };
  }));
  return rng.shuffle(opts);
}

export function makeOptions0(q: TimeQ, rng: Rng): Option[] {
  const s = q.s, m = q.m;
  const val = (x: Phrase) => {
    let t = x.H * 60 - (x.halv ? 30 : 0);
    if (x.rel === 'över') t += x.n; else if (x.rel === 'i') t -= x.n;
    return (((t % 720) + 720) % 720) % 60;
  };
  const cands: { s: Phrase; tag: string }[] = [];
  if (s.rel) cands.push({ s: { ...s, rel: s.rel === 'i' ? 'över' : 'i' }, tag: 'rel' });
  if (m > 0 && m / 5 !== m) cands.push({ s: { n: m / 5, rel: 'över', halv: false, H: 1 }, tag: 'hm' });
  cands.push({ s: { ...s, halv: !s.halv }, tag: 'halv' });
  const seen = new Set([m]);
  const picked: { s: Phrase; tag: string }[] = [];
  for (const c of cands) {
    const v = val(c.s);
    // "Tre över" (siffran som minuter) är ett lärorikt fel; andra fel håller sig till nivåns minuter.
    if (seen.has(v) || (c.tag !== 'hm' && !MINS[0].includes(v))) continue;
    seen.add(v);
    picked.push(c);
    if (picked.length >= 3) break;
  }
  while (picked.length < 3) {
    const mm = rng.pick(MINS[0]);
    if (seen.has(mm)) continue;
    seen.add(mm);
    picked.push({ s: structs(1, mm)[0], tag: 'other' });
  }
  return rng.shuffle([{ text: renderMin(s), tag: 'correct' }].concat(picked.map((c) => ({ text: renderMin(c.s), tag: c.tag }))));
}

export function makeBetween(level: Level, rng: Rng): BetweenQ {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, level));
  const { mins, pm } = lv(lvl);
  const maxD = lvl <= 3 ? 240 : lvl <= 6 ? 360 : 540;
  let a = { h24: 9, m: 15 }, b = { h24: 11, m: 45 };
  for (let i = 0; i < 1000; i++) {
    const ah = 6 + rng.int(15), am = rng.pick(mins);
    const bh = ah + rng.int(maxD / 60 + 1), bm = rng.pick(mins);
    const D = bh * 60 + bm - (ah * 60 + am);
    if (bh > 23 || D < 10 || D > maxD) continue;
    // Innan kvällen är övad håller sig båda tiderna till förmiddagen.
    if (!pm && bh * 60 + bm > 12 * 60) continue;
    a = { h24: ah, m: am };
    b = { h24: bh, m: bm };
    break;
  }
  // Först två tider på samma sätt (båda digitala eller båda analoga); blandat är svårare och kommer sen.
  let fa: BTime['fmt'], fb: BTime['fmt'];
  if (!pm) fa = fb = rng.pick(['clock', 'digits'] as const);
  else {
    const fmts = ['clock', 'words', 'digits'] as const;
    fa = rng.pick(fmts);
    fb = rng.pick(fmts);
    while (fa === 'digits' && fb === 'digits') fb = rng.pick(fmts);
  }
  const mk = (t: { h24: number; m: number }, f: BTime['fmt']): BTime => ({
    ...t, fmt: f, s: f === 'clock' ? structs(h12(t.h24), t.m)[0] : variant(h12(t.h24), t.m, lvl, rng),
  });
  return { kind: 'between', mode: 'between', level: lvl, a: mk(a, fa), b: mk(b, fb) };
}

export const bMin = (t: { h24: number; m: number }) => t.h24 * 60 + t.m;
export const bD = (q: BetweenQ) => bMin(q.b) - bMin(q.a);
export function durStr(d: number) {
  const h = Math.floor(d / 60), m = d % 60;
  return h && m ? `${h} tim ${m} min` : h ? `${h} tim` : `${m} min`;
}
