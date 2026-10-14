import { parseAnswer, sameNumber } from '../drill/check';
import type { DiagramGame, DiagramQ, Explained } from './types';

// Rättning som gäller alla diagramspel. Felkoderna här är permanenta.

export const ENGINE_ERR: Record<string, string> = {
  annat: 'Annat fel',
};

/** Byggda värden som text (så sparas och jämförs de). */
export const joinVals = (v: number[]) => v.join(',');
export const splitVals = (s: string) => s.split(',').map(Number);

export function isRight(q: DiagramQ, given: string): boolean {
  if (q.kind === 'las') {
    const n = parseAnswer(given);
    return n !== null && sameNumber(n, Number(q.answer));
  }
  if (q.kind === 'tryck') return given === q.answer || !!q.targets?.includes(given);
  if (q.kind === 'bygg') {
    const a = splitVals(q.answer), g = splitVals(given);
    return a.length === g.length && a.every((x, i) => sameNumber(x, g[i]));
  }
  return given === q.answer;
}

export function diagnoseAny<Q extends DiagramQ>(g: DiagramGame<Q>, q: Q, given: string): string {
  const alt = q.alts?.find((a) => a.err && a.text === given);
  if (alt?.err) return alt.err;
  if (q.kind === 'tryck' && q.misses?.[given]) return q.misses[given];
  const n = q.kind === 'las' ? parseAnswer(given) : null;
  return g.diagnose(q, n === null ? given : String(n)) ?? 'annat';
}

export function explainAny<Q extends DiagramQ>(g: DiagramGame<Q>, tag: string, q: Q, given: string): Explained {
  if (tag === 'annat') return { title: 'Inte riktigt', text: `Prova igen. ${g.hint(q)}` };
  return g.explain(tag, q, given);
}

export const errLabel = (g: DiagramGame<DiagramQ>, tag: string) => g.errLabels[tag] ?? ENGINE_ERR[tag];
