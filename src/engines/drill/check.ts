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
