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
const GEO: Record<string, string> = {
  'former-grund': 'cirkel, triangel, kvadrat och rektangel', manghorningar: 'månghörningarna', fyrhorningar: 'fyrhörningarna',
  'former-vridna': 'former som ligger snett', horn: 'hörn och sidor', 'horn-kluriga': 'hörn på kluriga former', sortera: 'att hitta alla av en form',
  spegla: 'att spegla figurer', symmetrisk: 'symmetriska figurer', symmetrilinjer: 'symmetrilinjer', 'monster-upprepa': 'mönster som upprepas',
  'monster-vaxande': 'växande mönster', 'spegla-koordinat': 'spegling i koordinatsystem',
  linjal: 'att mäta med linjal', 'linjal-mm': 'millimeter på linjalen', langdenheter: 'längdenheter', 'langdenheter-decimal': 'längdenheter med decimaler',
  omkrets: 'omkrets', 'omkrets-kluriga': 'omkrets på kluriga figurer', 'omkrets-saknad': 'sidan som fattas i omkretsen',
  'vinkel-namn': 'vinklarnas namn', 'vinkel-jamfor': 'att jämföra vinklar', gradskiva: 'gradskivan', varv: 'varv och grader',
  'vinklar-linje': 'vinklar längs en linje', 'vinklar-triangel': 'vinklarna i en triangel', 'vinklar-runt': 'vinklar runt en punkt och i fyrhörningar',
  'area-rutor': 'area i rutor', 'area-halva': 'halva rutor och trianglar på rutat papper', 'area-rektangel': 'rektangelns area',
  'area-decimal': 'area med decimaltal', 'area-saknad': 'sidan som fattas i arean', 'area-triangel': 'triangelns area', 'area-sammansatt': 'sammansatta figurer',
  'kroppar-namn': 'kropparnas namn', 'kroppar-vardag': 'kroppar i vardagen', 'kroppar-delar': 'sidoytor, kanter och hörn',
  'volym-kuber': 'volym i kuber', 'volym-ratblock': 'rätblockets volym', 'volym-liter': 'volym i liter', volymenheter: 'liter, deciliter och milliliter',
  'radie-diameter': 'radie och diameter', 'cirkel-omkrets': 'cirkelns omkrets', 'cirkel-area': 'cirkelns area', 'cirkel-delar': 'halv- och kvartscirklar',
  skala: 'skala', 'skala-forstoring': 'förstoring i skala',
};
const TAL = ['nollans', 'ettans', 'tvåans', 'treans', 'fyrans', 'femmans', 'sexans', 'sjuans', 'åttans', 'nians', 'tians', 'elvans', 'tolvans'];

export function skillLabel(skill: string): string {
  const [, topic, rest] = /^ma\.([a-z]+)\.(.+)$/.exec(skill) ?? [];
  if (topic === 'tid' && TID[rest]) return TID[rest];
  if (topic === 'add' && ADD[rest]) return ADD[rest];
  if (topic === 'sub' && SUB[rest]) return SUB[rest];
  if (topic === 'pengar' && PENGAR[rest]) return PENGAR[rest];
  if (topic === 'brak' && BRAK[rest]) return BRAK[rest];
  if (topic === 'geo' && GEO[rest]) return GEO[rest];
  if (LINJE[`${topic}.${rest}`]) return LINJE[`${topic}.${rest}`];
  if (topic === 'mult' && TAL[Number(rest)]) return `${TAL[Number(rest)]} tabell`;
  if (topic === 'div' && /^\d+$/.test(rest)) return `delat med ${rest}`;
  return 'något du har övat på';
}

export const cap = (s: string) => (s.startsWith('"') ? `"${s.charAt(1).toUpperCase()}${s.slice(2)}` : s.charAt(0).toUpperCase() + s.slice(1));
