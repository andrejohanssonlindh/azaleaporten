import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import type { DrillQ, Explained } from '../../engines/drill/types';

// Myntmarknaden: svenska mynt och sedlar, att lägga ihop priser och att få växel tillbaka.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'rakna' | 'pris' | 'vaxel' | 'blandat';

export interface Ware { icon: string; name: string; price: number }

export interface PQ extends DrillQ {
  mode: Exclude<Mode, 'blandat'>;
  /** rakna: mynten och sedlarna som ligger på bordet. */
  pieces?: number[];
  /** pris/vaxel: varorna (vid styckpris: en vara och antal). */
  wares?: Ware[];
  count?: number;
  /** vaxel: sedeln eller myntet man betalar med. */
  paid?: number;
}

export const COINS = [1, 2, 5, 10];
export const NOTES = [20, 50, 100, 200, 500];

export const ERR: Record<string, string> = {
  'raknade-antal': 'Räknar antalet mynt i stället för värdet',
  'missat-mynt': 'Missar ett mynt eller en sedel',
  'raknat-dubbelt': 'Räknar ett mynt två gånger',
  'fel-satt': 'Räknar med fel räknesätt',
  priset: 'Svarar med priset i stället för växeln',
  'lanade-inte': 'Tar minsta från största i stället för att låna',
  'tio-fel': 'En tia fel',
};

const WARES: [string, string][] = [
  ['🍦', 'en glass'], ['🍎', 'ett äpple'], ['🧃', 'en saft'], ['🥨', 'en kringla'], ['🎈', 'en ballong'], ['🍪', 'en kaka'],
  ['📒', 'ett block'], ['🧸', 'en nalle'], ['⚽', 'en boll'], ['🖍️', 'kritor'], ['🍌', 'en banan'], ['🧁', 'en muffin'],
  ['🪁', 'en drake'], ['🎲', 'en tärning'], ['🥕', 'en morot'], ['🍿', 'popcorn'],
];

const range = (rng: Rng, lo: number, hi: number) => lo + rng.int(hi - lo + 1);
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const tens = (n: number) => Math.floor(n / 10);
const ones = (n: number) => n % 10;
export const kr = (n: number) => `${n} kr`;
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function wares(rng: Rng, prices: number[]): Ware[] {
  return rng.shuffle(WARES).slice(0, prices.length).map(([icon, name], i) => ({ icon, name, price: prices[i] }));
}

const SKILL: Record<PQ['mode'], string[]> = {
  rakna: ['ma.pengar.mynt', 'ma.pengar.sedlar', 'ma.pengar.sedlar', 'ma.pengar.sedlar'],
  pris: ['ma.pengar.summa', 'ma.pengar.summa', 'ma.pengar.summa', 'ma.pengar.styckpris'],
  vaxel: ['ma.pengar.vaxel', 'ma.pengar.vaxel', 'ma.pengar.vaxel-stor', 'ma.pengar.vaxel-stor'],
};

function rakna(level: number, rng: Rng, trap: boolean): PQ {
  const kinds = [[1, 2, 5, 10], [1, 2, 5, 10, 20, 50], [5, 10, 20, 50, 100, 200], [10, 20, 50, 100, 200, 500]][level];
  const max = [20, 100, 500, 1000][level];
  let pieces: number[];
  for (;;) {
    const n = trap ? range(rng, 3, 5) : range(rng, 2, level === 0 ? 4 : 5);
    pieces = Array.from({ length: n }, () => rng.pick(trap ? kinds.filter((k) => k >= 2) : kinds)).sort((a, b) => b - a);
    if (sum(pieces) <= max && (!trap || sum(pieces) !== n)) break;
  }
  return { mode: 'rakna', level, skill: SKILL.rakna[level], pieces, answer: sum(pieces), prompt: 'Hur mycket pengar är det?', parts: [null, 'kr'] };
}

function pris(level: number, rng: Rng): PQ {
  if (level === 3) {
    const count = range(rng, 2, 5);
    const w = wares(rng, [rng.pick([5, 6, 8, 10, 12, 15, 20, 25])]);
    return { mode: 'pris', level, skill: SKILL.pris[3], wares: w, count, answer: count * w[0].price,
      prompt: `${capFirst(w[0].name)} kostar ${kr(w[0].price)}. Vad kostar ${count} stycken?`, parts: ['Det kostar', null, 'kr'] };
  }
  const prices = level === 0 ? [range(rng, 1, 9), range(rng, 1, 9)]
    : level === 1 ? [range(rng, 11, 49), range(rng, 5, 39)]
      : [range(rng, 15, 99), range(rng, 15, 99), range(rng, 5, 49)];
  const w = wares(rng, prices);
  return { mode: 'pris', level, skill: SKILL.pris[level], wares: w, answer: sum(prices),
    prompt: `Du köper ${w.map((x) => x.name).join(level === 2 ? ', ' : ' och ').replace(/, ([^,]*)$/, ' och $1')}. Vad kostar det tillsammans?`,
    parts: ['Tillsammans', null, 'kr'] };
}

function vaxel(level: number, rng: Rng, trap: boolean): PQ {
  let paid: number, prices: number[];
  for (;;) {
    paid = [10, rng.pick([20, 50]), 100, rng.pick([200, 500])][level];
    prices = level === 3 ? [range(rng, 20, 149), range(rng, 10, 99)] : [range(rng, level === 0 ? 1 : 3, paid - 1)];
    const p = sum(prices);
    if (p < paid && (!trap || ones(p) !== 0)) break;
  }
  const w = wares(rng, prices);
  const what = w.map((x) => `${x.name} för ${kr(x.price)}`).join(' och ');
  return { mode: 'vaxel', level, skill: SKILL.vaxel[level], wares: w, paid, answer: paid - sum(prices),
    prompt: `Du köper ${what} och betalar med ${paid >= 20 ? `en ${paid}-lapp` : `en tiokrona`}. Hur mycket får du tillbaka?`,
    parts: ['Tillbaka', null, 'kr'] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): PQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode;
  if (spec.trap === 'raknade-antal') mode = 'rakna';
  if (spec.trap === 'lanade-inte') mode = 'vaxel';
  if (mode === 'blandat') mode = rng.pick(['rakna', 'pris', 'vaxel'] as const);
  if (mode === 'rakna') return rakna(level, rng, spec.trap === 'raknade-antal');
  if (mode === 'pris') return pris(level, rng);
  return vaxel(level, rng, spec.trap === 'lanade-inte');
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const out: QuestionSpec[] = [];
  for (const mode of ['rakna', 'pris', 'vaxel'] as const) SKILL[mode].forEach((s, level) => { if (s === skill) out.push({ mode, level }); });
  return out;
}

/* ---------- diagnos ---------- */

export function diagnose(q: PQ, given: number): string | undefined {
  if (q.mode === 'rakna') {
    const p = q.pieces!;
    if (given === p.length) return 'raknade-antal';
    if (p.some((x) => given === q.answer - x)) return 'missat-mynt';
    if (p.some((x) => given === q.answer + x)) return 'raknat-dubbelt';
  }
  if (q.mode === 'pris') {
    if (q.count && given === q.count + q.wares![0].price) return 'fel-satt';
    if (q.wares!.length === 2 && given === Math.abs(q.wares![0].price - q.wares![1].price)) return 'fel-satt';
  }
  if (q.mode === 'vaxel') {
    const price = q.answer === q.paid! ? 0 : q.paid! - q.answer;
    if (given === price) return 'priset';
    if (given === q.paid! + price) return 'fel-satt';
    if (ones(price) > ones(q.paid!) && given === 10 * (tens(q.paid!) - tens(price)) + ones(price) - ones(q.paid!)) return 'lanade-inte';
  }
  if (Math.abs(given - q.answer) === 10) return 'tio-fel';
  return undefined;
}

export function explain(tag: string, q: PQ, given: number): Explained {
  const price = q.paid ? q.paid - q.answer : 0;
  switch (tag) {
    case 'raknade-antal': return { title: 'Du räknade mynten', text: `Det ligger ${given} saker på bordet, men de är värda olika mycket! Titta på siffran på varje mynt och sedel och lägg ihop dem.` };
    case 'missat-mynt': return { title: 'Ett fattas', text: 'Du har missat ett mynt eller en sedel. Peka på varje och räkna en gång till.' };
    case 'raknat-dubbelt': return { title: 'Ett för mycket', text: 'Du har räknat något två gånger. Börja med de största och peka på varje bara en gång.' };
    case 'fel-satt': return q.mode === 'vaxel'
      ? { title: 'Du lade ihop', text: `Du ska få tillbaka det som blir över när ${kr(price)} är betalt. Räkna från ${price} upp till ${q.paid}.` }
      : q.count ? { title: 'Du lade ihop', text: `${q.count} stycken som kostar ${kr(q.wares![0].price)} var – det är ${q.count} gånger priset.` }
        : { title: 'Du räknade minus', text: 'Du ska betala för allt, så priserna ska läggas ihop.' };
    case 'priset': return { title: 'Det var priset', text: `Det kostar ${kr(price)}. Men hur mycket blir över av ${q.paid} kr när du har betalat?` };
    case 'lanade-inte': return { title: 'Du räknade baklänges', text: `${q.paid} − ${price}: i entalen står ${ones(q.paid!)} − ${ones(price)}. Det går inte att byta plats! Räkna hellre uppåt från ${price}.` };
    case 'tio-fel': return { title: 'En tia fel', text: `Ditt svar är tio för ${given > q.answer ? 'mycket' : 'lite'}. Titta på tiorna en gång till.` };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: PQ): string {
  if (q.mode === 'rakna') return `${q.pieces!.join(' + ')} = ${kr(q.answer)}.`;
  if (q.mode === 'pris') return q.count ? `${q.count} · ${q.wares![0].price} = ${kr(q.answer)}.` : `${q.wares!.map((w) => w.price).join(' + ')} = ${kr(q.answer)}.`;
  const price = q.paid! - q.answer;
  return `${q.paid} − ${price} = ${kr(q.answer)}. Kolla: ${price} + ${q.answer} = ${q.paid}.`;
}

export function hint(q: PQ): string {
  if (q.mode === 'rakna') return 'Börja med de största: sedlarna först, sedan mynten. Räkna vidare för varje.';
  if (q.mode === 'pris') return q.count ? `Lägg ihop ${q.wares![0].price} kr ${q.count} gånger.` : 'Lägg ihop tiorna först, sedan entalen.';
  const price = q.paid! - q.answer;
  const ten = (tens(price) + 1) * 10;
  return ones(price) && ten < q.paid! ? `Räkna uppåt från ${price} till ${q.paid}: först till ${ten}, sedan resten.` : `Räkna uppåt från ${price} till ${q.paid}.`;
}
