// Namn på färdigheterna, så som Mästare Kastanj säger dem ("dimman har krupit in över sjuans tabell").
// Små bokstäver; använd cap() i början av en mening.

const TID: Record<string, string> = {
  hel: 'hela timmar', halv: '"halv"', kvart: 'kvart i och kvart över', over: 'minuter över', i: 'minuter i',
  'over-halv': '"fem över halv"', 'i-halv': '"fem i halv"', emellan: 'tid emellan',
};
const ADD: Record<string, string> = {
  tiokompisar: 'tiokompisarna', hundrakompisar: 'hundrakompisarna', 'inom-20': 'plus upp till 20', 'over-tio': 'plus över tian',
  'tvasiffrigt-ental': 'plus med ental', tvasiffrigt: 'plus med tiotal och ental', 'saknad-term': 'talet som fattas i plus',
};
const SUB: Record<string, string> = {
  'inom-20': 'minus upp till 20', 'over-tio': 'minus över tian', 'tvasiffrigt-ental': 'minus med ental',
  tvasiffrigt: 'minus med tiotal och ental', 'saknad-term': 'talet som fattas i minus',
};
const TAL = ['nollans', 'ettans', 'tvåans', 'treans', 'fyrans', 'femmans', 'sexans', 'sjuans', 'åttans', 'nians', 'tians', 'elvans', 'tolvans'];

export function skillLabel(skill: string): string {
  const [, topic, rest] = /^ma\.([a-z]+)\.(.+)$/.exec(skill) ?? [];
  if (topic === 'tid' && TID[rest]) return TID[rest];
  if (topic === 'add' && ADD[rest]) return ADD[rest];
  if (topic === 'sub' && SUB[rest]) return SUB[rest];
  if (topic === 'mult' && TAL[Number(rest)]) return `${TAL[Number(rest)]} tabell`;
  if (topic === 'div' && /^\d+$/.test(rest)) return `delat med ${rest}`;
  return 'något du har övat på';
}

export const cap = (s: string) => (s.startsWith('"') ? `"${s.charAt(1).toUpperCase()}${s.slice(2)}` : s.charAt(0).toUpperCase() + s.slice(1));
