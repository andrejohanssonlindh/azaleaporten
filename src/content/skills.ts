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
const STAV: Record<string, string> = {
  smaord: 'småorden', dubbel: 'dubbelteckning', lang: 'lång vokal med en konsonant', m: 'm-regeln', ck: 'ck',
  ng: 'ng-ljudet', j: 'j-ljudet', sj: 'sj-ljudet', tj: 'tj-ljudet', oa: 'o som låter å',
  stor: 'stor och liten bokstav', sammansatt: 'sammansatta ord',
};
const ORD: Record<string, string> = {
  rim: 'rim', motsats: 'motsatser', synonym: 'synonymer', sammansatt: 'vad sammansatta ord betyder',
  betydelse: 'ord med flera betydelser', uttryck: 'uttryck',
};
const MENING: Record<string, string> = {
  punkt: 'stor bokstav och punkt', grans: 'var en mening slutar', tecken: 'punkt, frågetecken och utropstecken',
  ordfoljd: 'ordföljd', samband: 'sambandsord', komma: 'kommatecken', anforing: 'anföring',
};
const ORDKLASS: Record<string, string> = {
  substantiv: 'substantiv', verb: 'verb', adjektiv: 'adjektiv', pronomen: 'pronomen (ordklassen)', preposition: 'prepositioner',
};
const BOJN: Record<string, string> = {
  genus: 'en- och ett-ord', plural: 'plural', bestamd: 'bestämd form', tempus: 'verbens tider', starka: 'starka verb',
  komparation: 'att jämföra (stor – större – störst)', pronomen: 'pronomen i rätt form (han – honom, de – dem)',
};
const LAS: Record<string, string> = {
  raden: 'att hitta svaret i texten', mellan: 'att läsa mellan raderna', ord: 'ords betydelse i en text',
  huvudtanke: 'vad en text handlar om', texttyp: 'olika sorters texter',
};
const GLOSOR: Record<string, string> = {
  farger: 'färger på engelska', siffror: 'siffror på engelska', djur: 'djur på engelska', familj: 'familjen på engelska',
  kroppen: 'kroppen på engelska', mat: 'mat på engelska', klader: 'kläder på engelska', skolan: 'skolord på engelska',
  leksaker: 'leksaker på engelska', vader: 'väder på engelska', hemmet: 'hemmet på engelska', stan: 'stan och resor på engelska',
  naturen: 'naturen på engelska', verb: 'engelska verb', kanslor: 'känslor på engelska', dagar: 'dagar och månader på engelska',
  yrken: 'yrken på engelska', falska: 'falska vänner',
};
const LYSSNA: Record<string, string> = {
  siffror: 'engelska tal', bokstaver: 'engelska bokstäver', fraser: 'engelska fraser', instruktioner: 'instruktioner på engelska',
  fragor: 'frågor på engelska', meningar: 'meningar på engelska',
};
const ENTID: Record<string, string> = {
  hel: "o'clock", half: 'half past', quarter: 'quarter past och quarter to', past: 'minuter past', to: 'minuter to',
  minuter: 'varenda minut på engelska', ampm: 'a.m. och p.m.',
};
const ENSTAV: Record<string, string> = {
  'c-k': 'c, k och ck på engelska', y: 'y på engelska', w: 'w på engelska', th: 'th', 'ee-ea': 'ee och ea', 'sh-ch': 'sh och ch',
  'lang-i': 'engelska aj-ljudet', 'lang-a': 'engelska ej-ljudet', 'oo-ou': 'oo, ou och ow', dubbel: 'dubbla bokstäver på engelska',
  tyst: 'tysta bokstäver', plural: 'engelsk plural',
};
const GRAM: Record<string, string> = {
  'a-an': 'a och an', be: 'am, is och are', plural: 'engelsk plural', 's-form': '-s efter he, she och it', fragord: 'engelska frågeord',
  prep: 'in, on och under', do: "don't och doesn't", ordfoljd: 'engelsk ordföljd',
};
const PROG: Record<string, string> = {
  'logik.monster': 'mönster', 'logik.ordning': 'steg i rätt ordning', 'logik.ochinte': 'och, eller och inte', 'logik.omsa': 'om … så',
  'kod.pilar': 'att styra roboten med pilar', 'kod.svang': 'att styra roboten med svängar', 'kod.vart': 'att följa ett program',
  'kod.diamant': 'robotvägar med diamanter',
  'loop.antal': 'varv i loopar', 'loop.vart': 'att följa en loop', 'loop.bygg': 'att bygga med loopar', 'loop.nastlad': 'loopar i loopar',
  'bugg.pilar': 'buggar med pilar', 'bugg.svang': 'buggar med svängar', 'bugg.loop': 'buggar i loopar', 'bugg.laga': 'att laga program',
  'py.print': 'print i Python', 'py.variabel': 'variabler i Python', 'py.text': 'text och tal i Python', 'py.if': 'if och else i Python',
  'py.for': 'for-loopar i Python', 'py.fel': 'fel i Python-kod',
};
const STAT: Record<string, string> = {
  streck: 'streckdiagram', 'streck-rita': 'att rita streck', tabell: 'tabeller', 'tabell-jamfor': 'att jämföra i tabeller',
  stapel: 'stapeldiagram', 'stapel-skala': 'skalan i stapeldiagram', 'stapel-jamfor': 'att jämföra staplar', 'stapel-rita': 'att bygga stapeldiagram',
  bild: 'bilddiagram', 'bild-halv': 'halva bilder i bilddiagram',
};
const TAL = ['nollans', 'ettans', 'tvåans', 'treans', 'fyrans', 'femmans', 'sexans', 'sjuans', 'åttans', 'nians', 'tians', 'elvans', 'tolvans'];

export function skillLabel(skill: string): string {
  const [, svTopic, svRest] = /^sv\.([a-z]+)\.(.+)$/.exec(skill) ?? [];
  if (svTopic === 'stav' && STAV[svRest]) return STAV[svRest];
  if (svTopic === 'veckans') return `veckans ord "${svRest}"`;
  if (svTopic === 'ord' && ORD[svRest]) return ORD[svRest];
  if (svTopic === 'mening' && MENING[svRest]) return MENING[svRest];
  if (svTopic === 'ordklass' && ORDKLASS[svRest]) return ORDKLASS[svRest];
  if (svTopic === 'bojn' && BOJN[svRest]) return BOJN[svRest];
  if (svTopic === 'las' && LAS[svRest]) return LAS[svRest];
  const [, enTopic, enRest] = /^en\.([a-z]+)\.(.+)$/.exec(skill) ?? [];
  if (enTopic === 'glosor' && GLOSOR[enRest]) return GLOSOR[enRest];
  if (enTopic === 'lyssna' && LYSSNA[enRest]) return LYSSNA[enRest];
  if (enTopic === 'tid' && ENTID[enRest]) return ENTID[enRest];
  if (enTopic === 'stav' && ENSTAV[enRest]) return ENSTAV[enRest];
  if (enTopic === 'gram' && GRAM[enRest]) return GRAM[enRest];
  const [, progRest] = /^prog\.(.+)$/.exec(skill) ?? [];
  if (progRest && PROG[progRest]) return PROG[progRest];
  const [, topic, rest] = /^ma\.([a-z]+)\.(.+)$/.exec(skill) ?? [];
  if (topic === 'tid' && TID[rest]) return TID[rest];
  if (topic === 'add' && ADD[rest]) return ADD[rest];
  if (topic === 'sub' && SUB[rest]) return SUB[rest];
  if (topic === 'pengar' && PENGAR[rest]) return PENGAR[rest];
  if (topic === 'brak' && BRAK[rest]) return BRAK[rest];
  if (topic === 'geo' && GEO[rest]) return GEO[rest];
  if (topic === 'stat' && STAT[rest]) return STAT[rest];
  if (LINJE[`${topic}.${rest}`]) return LINJE[`${topic}.${rest}`];
  if (topic === 'mult' && TAL[Number(rest)]) return `${TAL[Number(rest)]} tabell`;
  if (topic === 'div' && /^\d+$/.test(rest)) return `delat med ${rest}`;
  return 'något du har övat på';
}

export const cap = (s: string) => (s.startsWith('"') ? `"${s.charAt(1).toUpperCase()}${s.slice(2)}` : s.charAt(0).toUpperCase() + s.slice(1));
