import type { DrillGame, DrillQ, Explained } from './types';

// Rättning som gäller alla drillspel. Felkoderna här är permanenta.

export const ENGINE_ERR: Record<string, string> = {
  'omvanda-siffror': 'Vänder på siffrorna',
  annat: 'Annat fel',
};

const reversed = (n: number) => Number(String(n).split('').reverse().join(''));

/** Tolkar barnets svar: heltal, decimaltal med komma eller punkt, och minus. null = inte ett tal (räknas inte som svar). */
export function parseAnswer(s: string): number | null {
  const t = s.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (!/^-?(\d{1,6}(\.\d{1,3})?|\.\d{1,3})$/.test(t)) return null;
  return Number(t);
}

/** Samma tal (decimaltal jämförs utan avrundningsfel). */
export const sameNumber = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** Rätt svar? Inom q.tol om frågan tillåter avrundning. */
export const isRight = (q: DrillQ, given: number) => Math.abs(given - q.answer) <= (q.tol ?? 1e-9);

/** Tal som svenska barn skriver dem: decimalkomma och riktigt minustecken. */
export const fmtNum = (n: number) => String(Math.round(n * 1000) / 1000).replace('.', ',').replace('-', '−');

export function diagnoseAny<Q extends DrillQ>(g: DrillGame<Q>, q: Q, given: number): string {
  const tag = g.diagnose(q, given);
  if (tag) return tag;
  if (Number.isInteger(q.answer) && Number.isInteger(given) && q.answer >= 10 && given !== q.answer && reversed(given) === q.answer) return 'omvanda-siffror';
  return 'annat';
}

export function explainAny<Q extends DrillQ>(g: DrillGame<Q>, tag: string, q: Q, given: number): Explained {
  if (tag === 'omvanda-siffror') {
    return { title: 'Siffrorna bytte plats', text: `Du skrev ${given}. Du har räknat rätt, men tiotal och ental har bytt plats. Tiotalet skrivs först!` };
  }
  if (tag === 'annat') return { title: 'Inte riktigt', text: `Prova så här: ${g.hint(q)}` };
  return g.explain(tag, q, given);
}

export const errLabel = (g: DrillGame<DrillQ>, tag: string) => g.errLabels[tag] ?? ENGINE_ERR[tag];

/* ---------- uppläsning ---------- */

const SAY_OP: Record<string, string> = {
  '+': 'plus', '−': 'minus', '-': 'minus', '·': 'gånger', '/': 'delat med', '=': 'är lika med', '<': 'är mindre än', '>': 'är större än',
  ':': 'till', '≈': 'är ungefär',
};
const SAY_UNIT: Record<string, string> = {
  kr: 'kronor', mm: 'millimeter', cm: 'centimeter', dm: 'decimeter', m: 'meter', km: 'kilometer', l: 'liter', dl: 'deciliter', cl: 'centiliter', ml: 'milliliter',
  'cm²': 'kvadratcentimeter', 'm²': 'kvadratmeter', 'dm²': 'kvadratdecimeter', 'cm³': 'kubikcentimeter', 'dm³': 'kubikdecimeter', 'm³': 'kubikmeter', '°': 'grader', g: 'gram', kg: 'kilo',
};
const DELAR: Record<number, string> = { 3: 'tredjedel', 4: 'fjärdedel', 5: 'femtedel', 6: 'sjättedel', 7: 'sjundedel', 8: 'åttondel', 9: 'niondel', 10: 'tiondel', 12: 'tolftedel' };

/** Ett bråk i ord: "tre fjärdedelar", "en halv", "hur många femtedelar". */
function sayFrac(n: number | null, d: number | null): string {
  if (d === null) return `${n} delat med vad`;
  const one = d === 2 ? 'halv' : DELAR[d] ?? `${d}-del`;
  const many = d === 2 ? 'halvor' : `${one}ar`;
  if (n === null) return `hur många ${many}`;
  return n === 1 ? `en ${one}` : `${fmtNum(n)} ${many}`;
}

/** Tecken i löptext i ord: "−6" → "minus 6", "x = 3" → "x är lika med 3". */
const sayText = (t: string) => t
  .replace(/[−-](?=\d)/g, 'minus ').replace(/−/g, ' minus ').replace(/\s*=\s*/g, ' är lika med ').replace(/·/g, ' gånger ')
  .replace(/≈/g, ' ungefär ').replace(/</g, ' mindre än ').replace(/>/g, ' större än ').replace(/π/g, 'pi')
  .replace(/\s+/g, ' ').replace(/ ([,.?!])/g, '$1').trim();

/** Frågan som text att läsa upp: instruktionen, uppställningen ("sju plus vad är lika med tolv") och alternativen. */
export function spoken(q: DrillQ): string {
  const eq = q.parts.map((p) => {
    if (p === null) return q.choices ? '…' : 'vad';
    if (typeof p === 'number') return fmtNum(p).replace('−', 'minus ');
    if (typeof p === 'object') return sayFrac(p.n, p.d);
    return SAY_OP[p] ?? SAY_UNIT[p] ?? sayText(p);
  }).join(' ');
  const choices = q.choices && !q.prompt?.includes('Välj') ? ` Välj: ${q.choices.map((c) => SAY_OP[c.label] ?? sayText(c.label)).join(', ')}.` : '';
  const head = q.prompt ? sayText(q.prompt) : '';
  // En ensam ruta ("vad") säger inget mer än frågan.
  return [head, eq === 'vad' || eq === '…' ? '' : `${eq}.`, choices.trim()].filter(Boolean).join(' ');
}
