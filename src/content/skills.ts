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
const PENGAR: Record<string, string> = {
  mynt: 'myntens värde', sedlar: 'sedlar och mynt', summa: 'priser tillsammans', styckpris: 'styckpris',
  vaxel: 'växeln', 'vaxel-stor': 'växel på stora sedlar',
};
const LINJE: Record<string, string> = {
  'tallinje.las-20': 'tallinjen till 20', 'tallinje.las-100': 'tallinjen till 100', 'tallinje.las-1000': 'tallinjen till 1000',
  'tallinje.las-tiondelar': 'tiondelar på tallinjen', 'avrunda.tiotal': 'avrundning till tiotal', 'avrunda.hundratal': 'avrundning till hundratal',
  'avrunda.heltal': 'avrundning av decimaltal', 'negativa.las': 'negativa tal', 'negativa.temperatur': 'termometern',
  'negativa.rakna': 'räkning förbi noll', 'decimal.addera': 'plus med tiondelar', 'decimal.overgang': 'tiondelar som blir en hel',
  'decimal.subtrahera': 'minus med tiondelar',
};
const BRAK: Record<string, string> = {
  namnge: 'att namnge bråk', 'jamfor-namnare': 'bråk med samma nämnare', 'jamfor-taljare': 'vilken bit som är störst',
  'jamfor-halv': 'mer eller mindre än en halv', likvardiga: 'likvärdiga bråk', 'del-av': 'del av ett antal',
  addera: 'plus med bråk', subtrahera: 'minus med bråk',
};
const TAL = ['nollans', 'ettans', 'tvåans', 'treans', 'fyrans', 'femmans', 'sexans', 'sjuans', 'åttans', 'nians', 'tians', 'elvans', 'tolvans'];

export function skillLabel(skill: string): string {
  const [, topic, rest] = /^ma\.([a-z]+)\.(.+)$/.exec(skill) ?? [];
  if (topic === 'tid' && TID[rest]) return TID[rest];
  if (topic === 'add' && ADD[rest]) return ADD[rest];
  if (topic === 'sub' && SUB[rest]) return SUB[rest];
  if (topic === 'pengar' && PENGAR[rest]) return PENGAR[rest];
  if (topic === 'brak' && BRAK[rest]) return BRAK[rest];
  if (LINJE[`${topic}.${rest}`]) return LINJE[`${topic}.${rest}`];
  if (topic === 'mult' && TAL[Number(rest)]) return `${TAL[Number(rest)]} tabell`;
  if (topic === 'div' && /^\d+$/.test(rest)) return `delat med ${rest}`;
  return 'något du har övat på';
}

export const cap = (s: string) => (s.startsWith('"') ? `"${s.charAt(1).toUpperCase()}${s.slice(2)}` : s.charAt(0).toUpperCase() + s.slice(1));
