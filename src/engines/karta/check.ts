import { parseAnswer, sameNumber } from '../drill/check';
import type { Explained, KartaGame, KartaQ } from './types';

// Rättning för alla kartspel. Felkoderna här är permanenta.

export const ENGINE_ERR: Record<string, string> = {
  annat: 'Annat fel',
};

/** Ett namn i jämförbar form: små bokstäver, utan accenter (men å, ä och ö kvar), utan mellanslag och skiljetecken. */
const SKYDDA: Record<string, string> = { å: '1', ä: '2', ö: '3' };
const ATER: Record<string, string> = { 1: 'å', 2: 'ä', 3: 'ö' };

export function normNamn(s: string): string {
  // Siffror tas bort först, så att 1–3 kan hålla platsen för å, ä och ö medan accenterna tas bort.
  return s.normalize('NFC').toLocaleLowerCase('sv').replace(/\d/g, '')
    .replace(/[åäö]/g, (c) => SKYDDA[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[123]/g, (c) => ATER[c])
    .replace(/[^\p{L}]/gu, '');
}

/** Hur många bokstäver som behöver ändras (Levenshtein). */
export function avstand(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/** Hur många stavfel ett namn tål: korta namn inga, längre ett eller två. Det är geografi som övas, inte stavning. */
export const tal = (n: number) => (n <= 4 ? 0 : n <= 8 ? 1 : 2);

/** Ett skrivet namn är nära nog ett av de godkända. */
export const nara = (given: string, target: string) => {
  const g = normNamn(given), t = normNamn(target);
  return !!g && avstand(g, t) <= tal(t.length);
};

export function isRight(q: KartaQ, given: string): boolean {
  if (q.kind === 'tal') {
    const n = parseAnswer(given);
    return n !== null && sameNumber(n, Number(q.answer));
  }
  if (q.kind === 'skriv') {
    const g = normNamn(given);
    // Ett annat namn som frågan känner till (en annan huvudstad, den största staden) är alltid fel, även om det liknar svaret.
    if (q.cand && g in q.cand) return false;
    return [q.answer, ...(q.answers ?? [])].some((a) => nara(given, a));
  }
  if (q.kind === 'peka') return given === q.answer || !!q.answers?.includes(given);
  return given === q.answer;
}

/** Svaret var rätt men stavat lite annorlunda (då visas hur det stavas). */
export const felstavat = (q: KartaQ, given: string) =>
  q.kind === 'skriv' && ![q.answer, ...(q.answers ?? [])].some((a) => normNamn(a) === normNamn(given));

export function diagnoseAny<Q extends KartaQ>(q: Q, given: string): string {
  const alt = q.alts?.find((a) => a.err && a.text === given);
  if (alt?.err) return alt.err;
  if (q.kind === 'peka') return q.misses?.[given] ?? 'annat';
  if (q.kind === 'skriv') return q.cand?.[normNamn(given)] ?? 'annat';
  if (q.kind === 'tal') {
    const n = parseAnswer(given);
    return (n !== null && q.cand?.[String(n)]) || 'annat';
  }
  return 'annat';
}

export function explainAny<Q extends KartaQ>(g: KartaGame<Q>, tag: string, q: Q, given: string): Explained {
  if (tag === 'annat') return { title: 'Inte riktigt', text: `Prova igen. ${q.tips}` };
  return g.explain(tag, q, given);
}

export const errLabel = (g: KartaGame<KartaQ>, tag: string) => g.errLabels[tag] ?? ENGINE_ERR[tag];
