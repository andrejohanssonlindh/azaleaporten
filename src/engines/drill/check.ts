import type { DrillGame, DrillQ, Explained } from './types';

// Rättning som gäller alla drillspel. Felkoderna här är permanenta.

export const ENGINE_ERR: Record<string, string> = {
  'omvanda-siffror': 'Vänder på siffrorna',
  annat: 'Annat fel',
};

const reversed = (n: number) => Number(String(n).split('').reverse().join(''));

/** Tolkar barnets svar. null = inte ett heltal (barnet får en vänlig uppmaning, och det räknas inte som svar). */
export function parseAnswer(s: string): number | null {
  const t = s.replace(/\s+/g, '');
  if (!/^-?\d{1,6}$/.test(t)) return null;
  return Number(t);
}

export function diagnoseAny<Q extends DrillQ>(g: DrillGame<Q>, q: Q, given: number): string {
  const tag = g.diagnose(q, given);
  if (tag) return tag;
  if (q.answer >= 10 && given !== q.answer && reversed(given) === q.answer) return 'omvanda-siffror';
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
