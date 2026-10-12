import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { avoid, deckPick, mentions, same } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { RULE_IDS, RULES, type Ord, type Rule } from './ord';

// Stavklippan: engelsk stavning. Nivå 0 = välj rätt stavning, 1 = diktat (lätta ord), 2 = diktat (alla ord),
// 3 = hitta det felstavade ordet bland fyra. Typiska felstavningar genereras per regel (som klockans
// candidates()): de blir både fel alternativ och diagnos av det barnet skriver.
// Färdighets-id:n ('en.stav.<regel>') och felkoder är permanenta.

export interface KQ extends OrdQ {
  rule: Rule;
  /** Raden i regelns ordlista. */
  row: number;
  sv: string;
}

export const ERR: Record<string, string> = {
  'som-svenska': 'Stavar som det låter på svenska',
  ck: 'Glömmer k:et i ck',
  'th-ljud': 'Skriver t, d eller f i stället för th',
  'ee-ea': 'Blandar ihop ee och ea',
  'sh-ch': 'Blandar ihop sh och ch',
  'magiskt-e': 'Glömmer det tysta e:t på slutet',
  'aj-ljud': 'Stavar aj-ljudet på fel sätt (i-e, igh eller y)',
  'ai-ay': 'Blandar ihop ai och ay',
  'ou-ow': 'Blandar ihop ou och ow',
  'bara-ett-o': 'Skriver bara ett o där det ska vara oo',
  'enkel-bokstav': 'Glömmer en dubbel bokstav',
  'le-el': 'Skriver -el i stället för -le',
  'tyst-bokstav': 'Glömmer en tyst bokstav',
  plural: 'Fel pluraländelse (-s, -es, -ies)',
};

/** Lägen som blandar flera regler. */
const MODES: Record<string, Rule[]> = {
  del1: ['c-k', 'y', 'w', 'th', 'ee-ea', 'sh-ch'],
  del2: ['lang-i', 'lang-a', 'oo-ou'],
  del3: ['dubbel', 'tyst', 'plural'],
  blandat: RULE_IDS,
};

interface Entry { rule: Rule; row: number; en: string; sv: string; pic: string; band: 1 | 2 }

export const ENTRIES: Entry[] = RULE_IDS.flatMap((rule) => RULES[rule].words.map(([en, sv, pic, band]: Ord, row) => ({ rule, row, en, sv, pic, band })));

/* ---------- typiska felstavningar ---------- */

/** Felstavningar som inte följer ett enkelt mönster. */
const EXTRA: Record<string, [string, string][]> = {
  white: [['vajt', 'som-svenska']], we: [['vi', 'som-svenska']], walk: [['wok', 'tyst-bokstav'], ['vok', 'som-svenska']],
  woman: [['voman', 'som-svenska']], wizard: [['visard', 'som-svenska']],
  you: [['ju', 'som-svenska']], your: [['jor', 'som-svenska']],
  baby: [['bejbi', 'som-svenska'], ['babey', 'ai-ay']], table: [['tejbel', 'som-svenska']], make: [['mejk', 'som-svenska']],
  knee: [['nee', 'tyst-bokstav'], ['ni', 'som-svenska']], know: [['now', 'tyst-bokstav'], ['nou', 'som-svenska']],
  knife: [['nife', 'tyst-bokstav'], ['najf', 'som-svenska']], write: [['rite', 'tyst-bokstav'], ['rajt', 'som-svenska']],
  wrong: [['rong', 'tyst-bokstav'], ['vrong', 'som-svenska']], climb: [['clim', 'tyst-bokstav'], ['klajm', 'som-svenska']],
  listen: [['lisen', 'tyst-bokstav'], ['lissen', 'som-svenska']], castle: [['casle', 'tyst-bokstav'], ['kassel', 'som-svenska']],
  ghost: [['gost', 'tyst-bokstav'], ['goust', 'som-svenska']], half: [['haf', 'tyst-bokstav'], ['haaf', 'som-svenska']],
  knock: [['nock', 'tyst-bokstav'], ['nok', 'som-svenska']], wrist: [['rist', 'tyst-bokstav'], ['vrist', 'som-svenska']],
  comb: [['com', 'tyst-bokstav'], ['koum', 'som-svenska']], thumb: [['thum', 'tyst-bokstav'], ['tam', 'som-svenska']],
  hour: [['our', 'tyst-bokstav'], ['auer', 'som-svenska']], talk: [['tak', 'tyst-bokstav'], ['tok', 'som-svenska']],
  island: [['iland', 'tyst-bokstav'], ['ajland', 'som-svenska']], autumn: [['autum', 'tyst-bokstav'], ['otum', 'som-svenska']],
  answer: [['anser', 'tyst-bokstav'], ['aanser', 'som-svenska']], lamb: [['lam', 'tyst-bokstav'], ['lamm', 'som-svenska']],
  watch: [['wotj', 'som-svenska']], cheese: [['tjis', 'som-svenska']], children: [['tjildren', 'som-svenska']],
  thanks: [['tanks', 'th-ljud'], ['tänks', 'som-svenska']], three: [['tree', 'th-ljud'], ['tri', 'som-svenska']],
  glasses: [['glases', 'enkel-bokstav'], ['glassar', 'som-svenska']], buses: [['buss', 'plural'], ['bussar', 'som-svenska']],
  ice: [['ajs', 'som-svenska'], ['ise', 'aj-ljud']], eat: [['it', 'som-svenska'], ['eet', 'ee-ea']],
  eight: [['ejt', 'som-svenska']], egg: [['eg', 'enkel-bokstav'], ['ägg', 'som-svenska']], ball: [['bal', 'enkel-bokstav'], ['boll', 'som-svenska']],
  hello: [['helo', 'enkel-bokstav'], ['hallo', 'annat']], coffee: [['cofee', 'enkel-bokstav'], ['kaffi', 'som-svenska']],
  feather: [['feder', 'th-ljud'], ['fäder', 'som-svenska']], earth: [['eart', 'th-ljud'], ['öörth', 'som-svenska']],
  birthday: [['birtday', 'th-ljud'], ['börthdej', 'som-svenska']], together: [['togeder', 'th-ljud'], ['tugether', 'annat']],
};

/** Så skulle en svensk skriva ljuden: k för hårt c, s för mjukt c, sk och kv. */
const svensk = (t: string) => t.replace(/^c(?=[aoulr]|ej|aj)/, 'k').replace(/c$/, 's').replace(/^sch/, 'sk').replace(/^qu/, 'kv');

const add = (out: Alt[], word: string, raw: string, err: string) => {
  const text = err === 'som-svenska' ? svensk(raw) : raw;
  if (text && text !== word && !/(.)\1\1/.test(text) && !out.some((a) => a.text === text)) out.push({ text, err });
};

/** Byt första förekomsten av ett mönster. */
const sub = (w: string, re: RegExp, to: string) => w.replace(re, to);

/** Alla typiska felstavningar av ordet, de mest typiska först. */
export function variants(e: Entry): Alt[] {
  const w = e.en, out: Alt[] = [];
  for (const [t, err] of EXTRA[w] ?? []) add(out, w, t, err);
  switch (e.rule) {
    case 'c-k':
      add(out, w, w.replace(/ck/g, 'k').replace(/c(?![eihk])/g, 'k'), 'som-svenska');
      if (w.includes('ck')) add(out, w, w.replace('ck', 'c'), 'ck');
      add(out, w, w.replace(/c(?![eihk])/, 'k'), 'som-svenska');
      break;
    case 'y':
      add(out, w, w.replace(/^y/, 'j'), 'som-svenska');
      add(out, w, w.replace(/^y/, 'j').replace(/ay$/, 'aj'), 'som-svenska');
      break;
    case 'w':
      add(out, w, w.replace(/w/g, 'v'), 'som-svenska');
      add(out, w, w.replace(/w/, 'v'), 'som-svenska');
      break;
    case 'th':
      add(out, w, sub(w, /^th/, 't'), 'th-ljud');
      add(out, w, sub(w, /(?<=.)th/, 'd'), 'th-ljud');
      add(out, w, sub(w, /th$/, 't'), 'th-ljud');
      add(out, w, sub(w, /th$/, 'f'), 'th-ljud');
      break;
    case 'ee-ea':
      add(out, w, w.replace(/ee|ea/, 'i'), 'som-svenska');
      add(out, w, w.includes('ee') ? w.replace('ee', 'ea') : w.replace('ea', 'ee'), 'ee-ea');
      break;
    case 'sh-ch':
      add(out, w, w.replace(/sh/g, 'sj').replace(/t?ch/g, 'tj'), 'som-svenska');
      add(out, w, w.includes('sh') ? w.replace('sh', 'ch') : w.replace(/t?ch/, 'sh'), 'sh-ch');
      break;
    case 'lang-i':
      if (/igh/.test(w)) { add(out, w, w.replace('igh', 'aj'), 'som-svenska'); add(out, w, w.replace('igh', 'i') + 'e', 'aj-ljud'); add(out, w, w.replace('igh', 'ig'), 'tyst-bokstav'); }
      else if (/y$/.test(w)) { add(out, w, w.replace(/y$/, 'aj'), 'som-svenska'); add(out, w, w.replace(/y$/, 'igh'), 'aj-ljud'); }
      else if (/i[^aeiou]e$/.test(w)) { add(out, w, w.replace(/i([^aeiou])e$/, 'aj$1'), 'som-svenska'); add(out, w, w.slice(0, -1), 'magiskt-e'); add(out, w, w.replace(/i([^aeiou])e$/, 'y$1e'), 'aj-ljud'); }
      else { add(out, w, w.replace('i', 'aj'), 'som-svenska'); add(out, w, w.replace('i', 'y'), 'aj-ljud'); }
      break;
    case 'lang-a':
      if (/a[^aeiou]e$/.test(w)) { add(out, w, w.replace(/a([^aeiou])e$/, 'ej$1'), 'som-svenska'); add(out, w, w.slice(0, -1), 'magiskt-e'); }
      if (w.includes('ai')) { add(out, w, w.replace('ai', 'ej'), 'som-svenska'); add(out, w, w.replace('ai', 'ay'), 'ai-ay'); }
      if (/ay$/.test(w)) { add(out, w, w.replace(/ay$/, 'ej'), 'som-svenska'); add(out, w, w.replace(/ay$/, 'ai'), 'ai-ay'); }
      break;
    case 'oo-ou':
      if (w.includes('oo')) { add(out, w, w.replace('oo', 'u'), 'som-svenska'); add(out, w, w.replace('oo', 'o'), 'bara-ett-o'); }
      if (w.includes('ou')) { add(out, w, w.replace('ou', 'au'), 'som-svenska'); add(out, w, w.replace('ou', 'ow'), 'ou-ow'); }
      if (w.includes('ow')) { add(out, w, w.replace('ow', 'au'), 'som-svenska'); add(out, w, w.replace('ow', 'ou'), 'ou-ow'); }
      break;
    case 'dubbel':
      for (const m of w.matchAll(/([^aeiou])\1/g)) add(out, w, w.slice(0, m.index) + w.slice(m.index + 1), 'enkel-bokstav');
      break;
    case 'plural':
      if (/[^aeiou]ies$/.test(w)) add(out, w, w.replace(/ies$/, 'ys'), 'plural');
      if (/[aeiou]ys$/.test(w)) add(out, w, w.replace(/ys$/, 'ies'), 'plural');
      if (/(s|x|sh|ch)es$/.test(w)) add(out, w, w.replace(/es$/, 's'), 'plural');
      if (/(s|x|sh|ch)es$/.test(w)) add(out, w, w.replace(/es$/, 'ar'), 'som-svenska');
      break;
  }
  if (/[^aeiou]le$/.test(w)) add(out, w, w.replace(/le$/, 'el'), 'le-el');
  // Reserv: en bokstav för lite, eller två som bytt plats (motorns egna felkoder).
  const v = w.search(/[aeiou][^aeiou]/);
  if (v >= 0) add(out, w, w.slice(0, v) + w[v + 1] + w[v] + w.slice(v + 2), 'bytt-ordning');
  add(out, w, w.slice(0, -1), 'bokstav-saknas');
  return out;
}

/* ---------- frågor ---------- */

/** Felstavningar som råkar vara riktiga ord (engelska eller svenska). De duger som fel alternativ men inte att leta efter. */
const REAL = new Set([...ENTRIES.map((e) => e.en), 'tree', 'now', 'our', 'rite', 'wash', 'ship', 'sea', 'see', 'meet', 'weak', 'plan', 'tak', 'com', 'vet',
  'bus', 'buss', 'it', 'god', 'bok', 'fot', 'mun', 'wok', 'tanks', 'lam', 'lamm', 'nock', 'rist', 'kit', 'lit', 'tim', 'ni', 'boll', 'ägg', 'tok', 'feat',
  'reed', 'tee', 'bet', 'bad', 'bat', 'chip', 'sherry', 'rid', 'fit', 'slip', 'nite', 'lite', 'rite', 'hallo', 'cap', 'chop', 'sip', 'dej', 'sej', 'plan', 'nam', 'mon', 'bot', 'but', 'wet', 'web', 'vi', 'ju', 'dag', 'tim', 'lik', 'mak']);

const rulesFor = (mode: string): Rule[] => MODES[mode] ?? (RULE_IDS.includes(mode as Rule) ? [mode as Rule] : RULE_IDS);

export function pool(mode: string, level: number, trap?: string): Entry[] {
  const lv = Math.max(0, Math.min(3, level));
  const inBand = (e: Entry) => lv === 2 || lv === 3 || e.band === 1;
  const all = ENTRIES.filter((e) => rulesFor(mode).includes(e.rule) && inBand(e));
  if (!trap) return all;
  const hits = (e: Entry) => variants(e).some((a) => a.err === trap);
  const t = all.filter(hits);
  return t.length ? t : ENTRIES.filter(hits);
}

/** De två felen som visas: fällan först, annars "som på svenska", sedan regelns eget fel. */
function wrongPair(e: Entry, rng: Rng, trap?: string): Alt[] {
  const vs = variants(e);
  const pick: Alt[] = [];
  for (const tag of [trap, 'som-svenska']) { const a = tag && vs.find((x) => x.err === tag && !pick.includes(x)); if (a) pick.push(a); }
  const rest = vs.filter((a) => !pick.includes(a));
  const main = rest.filter((a) => !['bytt-ordning', 'bokstav-saknas'].includes(a.err!));
  return [...pick, ...main, ...rng.shuffle(rest.filter((a) => !main.includes(a)))].slice(0, 2);
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): KQ {
  const level = Math.max(0, Math.min(3, spec.level));
  const p = pool(spec.mode, level, spec.trap);
  const e = deckPick(p, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  const base = { mode: spec.mode, level, skill: `en.stav.${e.rule}`, rule: e.rule, row: e.row, sv: e.sv, answer: e.en, lang: 'en-GB' as const };
  const wrong = wrongPair(e, rng, spec.trap);
  if (level === 3) {
    // Ett felstavat ord (som inte råkar vara ett riktigt ord) bland tre rätt stavade.
    const bad = [...wrong, ...variants(e)].find((a) => !REAL.has(a.text) && !['bytt-ordning', 'bokstav-saknas'].includes(a.err!)) ?? wrong[0];
    const others = rng.shuffle(ENTRIES.filter((x) => x.en !== e.en && !variants(e).some((a) => a.text === x.en))).slice(0, 3).map((x) => x.en);
    const tokens = rng.shuffle([bad.text, ...others]);
    return { ...base, kind: 'markera', prompt: 'Ett av orden är felstavat. Tryck på det!', tokens, targets: [tokens.indexOf(bad.text)], missTag: bad.err };
  }
  const alts = rng.shuffle([{ text: e.en }, ...wrong]);
  if (level === 0) return { ...base, kind: 'val', prompt: `Hur stavas "${e.sv}" på engelska?`, pic: e.pic || undefined, alts, say: e.en };
  return { ...base, kind: 'skriv', prompt: `Lyssna och skriv på engelska: "${e.sv}"`, pic: e.pic || undefined, alts, say: `${e.en}. ${e.en}.` };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const rule = skill.split('.')[2] as Rule;
  return skill.startsWith('en.stav.') && RULE_IDS.includes(rule) ? [{ mode: rule, level: 0 }, { mode: rule, level: 1 }] : [];
}

const entryOf = (q: KQ) => ENTRIES.find((e) => e.rule === q.rule && e.row === q.row)!;

export function diagnose(q: KQ, given: string): string | undefined {
  return variants(entryOf(q)).find((a) => same(a.text, given))?.err;
}

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

/** Två exempel ur regeln som inte är svaret (eller liknar det). */
function examples(q: KQ, rule: Rule = q.rule, test: (en: string) => boolean = () => true): string {
  const ex = RULES[rule].words.map((w) => w[0]).filter((w) => w !== q.answer && !mentions(w, q.answer) && test(w) && w.length > 2 && !q.answer.includes(w) && !w.includes(q.answer)).slice(0, 2);
  return ex.length === 2 ? ` Som i "${ex[0]}" och "${ex[1]}".` : '';
}

export function explain(tag: string, q: KQ): Explained {
  const tip = RULES[q.rule].tip;
  switch (tag) {
    case 'som-svenska':
      return { title: 'Det låter rätt – på svenska!', text: `Du stavade som det låter på svenska, men engelska stavas annorlunda. ${tip}${examples(q)}` };
    case 'ck':
      return { title: 'ck', text: `Efter en kort vokal stavas k-ljudet med ck.${examples(q, 'c-k', (w) => w.includes('ck'))}` };
    case 'th-ljud':
      return { title: 'th-ljudet', text: `th är ett eget ljud: tungan mellan tänderna, och blås. Det stavas alltid th – aldrig t, d eller f.${examples(q, 'th')}` };
    case 'ee-ea':
      return { title: 'ee eller ea?', text: 'Rätt ljud! Men det långa i-ljudet kan stavas både ee och ea, och det här ordet stavas på det andra sättet. Det är bara att lära sig utantill.' };
    case 'sh-ch':
      return { title: 'sh eller ch?', text: `sh låter som svenskt sj, och ch låter som tj. Vilket ljud hör du i ordet?${examples(q, 'sh-ch')}` };
    case 'magiskt-e':
      return { title: 'Det tysta e:t', text: 'Ett tyst e på slutet får vokalen att säga sitt namn: "pin" blir "pine" och "cap" blir "cape". Glöm inte e:t!' };
    case 'aj-ljud':
      return { title: 'Aj-ljudet', text: `Aj-ljudet kan stavas med i och tyst e, med igh eller med y. Det här ordet stavas på ett av de andra sätten.` };
    case 'ai-ay':
      return { title: 'ai eller ay?', text: 'Ej-ljudet stavas oftast ai inne i ordet och ay i slutet av ordet.' };
    case 'ou-ow':
      return { title: 'ou eller ow?', text: 'Au-ljudet stavas ou eller ow. Ofta ow i slutet av ordet och ou inne i ordet – men det finns undantag. Prova det andra sättet!' };
    case 'bara-ett-o':
      return { title: 'Två o', text: `Det långa u-ljudet stavas med två o på engelska.${examples(q, 'oo-ou', (w) => w.includes('oo'))}` };
    case 'enkel-bokstav':
      return { title: 'En bokstav ska vara dubbel', text: 'Efter en kort vokal skrivs konsonanten ofta dubbelt, precis som på svenska. Säg ordet – var är vokalen kort?' };
    case 'le-el':
      return { title: '-le, inte -el', text: avoid(q.answer, 'Många engelska ord slutar på -le där svenskan har -el: "little", "candle", "bottle".', 'Många engelska ord slutar på -le där svenskan har -el: "candle", "castle", "purple".', 'Många engelska ord slutar på -le där svenskan har -el.') };
    case 'tyst-bokstav':
      return { title: 'En tyst bokstav', text: 'Det här ordet har en bokstav som skrivs men inte hörs. Vilken fattas? Tänk på hur ordet ser ut när du har sett det skrivet.' };
    case 'plural':
      return { title: 'Plural', text: RULES.plural.tip };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function explainMiss(q: KQ, i: number): Explained {
  return { title: 'Det är rätt stavat', text: `"${q.tokens![i]}" är rätt stavat. Leta vidare – vilket ord ser konstigt ut?` };
}

export function hint(q: KQ): string {
  return `${RULES[q.rule].tip}${examples(q)}`;
}

export function solution(q: KQ): string {
  return `"${q.sv}" stavas ${q.answer} på engelska.`;
}
