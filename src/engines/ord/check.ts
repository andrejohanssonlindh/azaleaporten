import { rngFrom, type Rng } from '../../platform/rng';
import type { QuestionCtx } from '../../platform/rpg/types';
import type { Explained, OrdGame, OrdQ } from './types';

// Rättning som gäller alla ordspel. Felkoderna här är permanenta.

export const ENGINE_ERR: Record<string, string> = {
  'bokstav-saknas': 'En bokstav saknas',
  'bokstav-extra': 'En bokstav för mycket',
  'bytt-ordning': 'Bokstäver i fel ordning',
  annat: 'Annat fel',
};

/** Samma skrivsätt för jämförelser: ett mellanslag mellan orden, inget punkt på slutet. */
export const norm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');

/** Jämför två ord, med eller utan hänsyn till stor bokstav. */
export const same = (a: string, b: string, caseStrict = false) =>
  caseStrict ? norm(a) === norm(b) : norm(a).toLocaleLowerCase('sv') === norm(b).toLocaleLowerCase('sv');

const exactNorm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ');

/** Jämför två svar på frågans sätt: exakt (med skiljetecken och stor bokstav) eller som ord. */
export const sameAs = (q: OrdQ, a: string, b: string, caseStrict = q.caseStrict) =>
  q.exact ? exactNorm(a) === exactNorm(b) : same(a, b, caseStrict);

export const isRight = (q: OrdQ, given: string) => [q.answer, ...(q.answers ?? [])].some((a) => sameAs(q, given, a));

/** Ett ord i en mening utan skiljetecken runt om. */
export const core = (token: string) => token.replace(/^[«"'(]+|[.,!?:;»"')]+$/g, '');

/** Fel som inte hör till någon regel: en bokstav för lite eller för mycket, två som bytt plats. */
export function editTag(answer: string, given: string): string | undefined {
  const a = answer.toLocaleLowerCase('sv'), g = given.toLocaleLowerCase('sv');
  const drops = (long: string, short: string) => [...long].some((_, i) => long.slice(0, i) + long.slice(i + 1) === short);
  if (g.length === a.length - 1 && drops(a, g)) return 'bokstav-saknas';
  if (g.length === a.length + 1 && drops(g, a)) return 'bokstav-extra';
  if (g.length === a.length) {
    const diff = [...a].map((c, i) => (c === g[i] ? -1 : i)).filter((i) => i >= 0);
    if (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === g[diff[1]] && a[diff[1]] === g[diff[0]]) return 'bytt-ordning';
  }
  return undefined;
}

/** Står ordet som eget ord i texten? */
export const mentions = (text: string, word: string) =>
  text.split(/[^\p{L}]+/u).some((t) => t && t.toLocaleLowerCase('sv') === word.toLocaleLowerCase('sv'));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Skyddsnät: ersätter svaret med … om det ändå skulle stå i en förklaring eller ledtråd. */
export const mask = (text: string, word: string) =>
  mentions(text, word) ? text.replace(new RegExp(`(?<!\\p{L})${escapeRe(word)}(?!\\p{L})`, 'giu'), '…') : text;

/** Den första texten som inte innehåller svaret (småord som "och" och "det" är ju också svar). */
export const avoid = (word: string, ...texts: string[]) => texts.find((t) => !mentions(t, word)) ?? mask(texts[0], word);

export function diagnoseAny<Q extends OrdQ>(g: OrdGame<Q>, q: Q, given: string): string {
  const alt = q.alts?.find((a) => a.err && sameAs(q, a.text, given, true));
  if (alt?.err) return alt.err;
  return g.diagnose(q, norm(given)) ?? editTag(norm(q.answer), norm(given)) ?? 'annat';
}

function explainRaw<Q extends OrdQ>(g: OrdGame<Q>, tag: string, q: Q, given: string): Explained {
  if (tag === 'bokstav-saknas') return { title: 'En bokstav fattas', text: 'En bokstav fattas någonstans. Säg ordet långsamt, ljud för ljud – hör du alla ljuden?' };
  if (tag === 'bokstav-extra') return { title: 'En bokstav extra', text: 'En bokstav ska strykas. Läs ditt svar långsamt, bokstav för bokstav.' };
  if (tag === 'bytt-ordning') return { title: 'Två bokstäver bytte plats', text: 'Alla bokstäver finns där, men två står i fel ordning. Säg ordet långsamt.' };
  if (tag === 'annat') return { title: 'Inte riktigt', text: `Prova igen. ${g.hint(q)}` };
  return g.explain(tag, q, given);
}

/** Förklaringen vid ett fel. Svaret står aldrig i den – barnet ska rätta själv. */
export function explainAny<Q extends OrdQ>(g: OrdGame<Q>, tag: string, q: Q, given: string): Explained {
  const e = explainRaw(g, tag, q, given);
  return { title: mask(e.title, q.answer), text: mask(e.text, q.answer) };
}

/** Ledtråden, utan svaret. */
export const hintFor = <Q extends OrdQ>(g: OrdGame<Q>, q: Q) => mask(g.hint(q), q.answer);

export const errLabel = (g: OrdGame<OrdQ>, tag: string) => g.errLabels[tag] ?? ENGINE_ERR[tag];

const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

/**
 * Drar ett kort ur en kortlek som blandas en gång per runda: inom en runda kommer
 * samma ord inte tillbaka förrän alla andra har varit med. Utan ctx (fri övning) dras ett slumpvis.
 */
export function deckPick<T>(pool: readonly T[], rng: Rng, ctx: QuestionCtx | undefined, key: string): T {
  if (!ctx) return rng.pick(pool);
  const order = rngFrom((ctx.seed ^ hash(key)) >>> 0).shuffle(pool);
  return order[ctx.index % order.length];
}
