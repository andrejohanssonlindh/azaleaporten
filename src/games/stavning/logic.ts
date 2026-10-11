import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { avoid, core, deckPick, same } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { ORD, type Rule, type Row } from './ord';

// Stavningsträsket: välj rätt stavning (nivå 0), skriv ordet du hör (1, och 2 med svårare ord),
// hitta det felstavade ordet i en mening (3). Typiska felstavningar räknas ut av reglerna nedan
// (som klockans candidates()): de blir fel alternativ, och de känner igen barnets fel.
// Färdighets-id:n ('sv.stav.<regel>') och felkoder är permanenta.

export type { Rule };

export interface SQ extends OrdQ { rule: Rule }

export interface Entry { word: string; parts?: string[]; sentence: string; band: 1 | 2; x: string[]; rule: Rule }

export const RULES = Object.keys(ORD) as Rule[];

export const ENTRIES: Entry[] = (Object.entries(ORD) as [Rule, Row[]][]).flatMap(([rule, rows]) =>
  rows.map(([w, sentence, band = 1, x = []]) => ({ word: w.replace('|', ''), parts: w.includes('|') ? w.split('|') : undefined, sentence, band, x, rule })));

/** Lägen: en regel, eller flera blandade. */
const MODES: Record<string, Rule[]> = {
  ...Object.fromEntries(RULES.map((r) => [r, [r]])),
  vokal: ['dubbel', 'lang'], mck: ['m', 'ck'], sjtj: ['sj', 'tj'], blandat: RULES,
};

export const ERR: Record<string, string> = {
  'enkel-konsonant': 'Enkel konsonant efter kort vokal',
  'dubbel-konsonant': 'Dubbel konsonant efter lång vokal',
  'm-regeln': 'Dubbelt m i slutet av ordet',
  ck: 'kk i stället för ck',
  'ng-ljud': 'Stavar ng-ljudet fel',
  'j-ljud': 'Stavar j-ljudet fel',
  'sj-ljud': 'Stavar sj-ljudet fel',
  'tj-ljud': 'Stavar tj-ljudet fel',
  'o-a': 'Skriver å där det ska vara o',
  talsprak: 'Skriver som man pratar',
  'stor-bokstav': 'Glömmer stor bokstav',
  'liten-bokstav': 'Stor bokstav där det ska vara liten',
  sarskrivning: 'Särskrivning (delar ord som hör ihop)',
};

/** Felkoderna som hör till en regel (fel alternativ väljs bland dem). */
const RULE_TAGS: Record<Rule, string[]> = {
  smaord: ['talsprak'], dubbel: ['enkel-konsonant'], lang: ['dubbel-konsonant', 'm-regeln'], m: ['m-regeln', 'enkel-konsonant'],
  ck: ['ck', 'enkel-konsonant'], ng: ['ng-ljud'], j: ['j-ljud'], sj: ['sj-ljud'], tj: ['tj-ljud'], oa: ['o-a'],
  stor: ['stor-bokstav', 'liten-bokstav'], sammansatt: ['sarskrivning'],
};

/* ---------- felstavningar ---------- */

const VOWELS = 'aeiouyåäö';
const DOUBLABLE = 'bdfgklmnprstv';

function sub(w: string, re: RegExp, reps: string[] | ((m: string) => string[]), tag: string, out: Alt[]) {
  for (const m of w.matchAll(re)) {
    const i = m.index!;
    for (const r of typeof reps === 'function' ? reps(m[0]) : reps) out.push({ text: w.slice(0, i) + r + w.slice(i + m[0].length), err: tag });
  }
}

/** Felstavningar per typ av fel. Varje funktion lägger till sina varianter av ett rättstavat ord. */
const GEN: Record<string, (w: string, out: Alt[]) => void> = {
  enkel: (w, o) => { sub(w, /(bb|dd|ff|gg|ll|mm|nn|pp|rr|ss|tt|vv)/g, (m) => [m[0]], 'enkel-konsonant', o); sub(w, /ck/g, ['k'], 'enkel-konsonant', o); },
  ck: (w, o) => sub(w, /ck/g, ['kk'], 'ck', o),
  dubbla: (w, o) => {
    for (let i = 0; i < w.length - 1; i++) {
      const c = w[i + 1];
      const end = i + 2 === w.length;
      if (!VOWELS.includes(w[i]) || !DOUBLABLE.includes(c) || !(end || VOWELS.includes(w[i + 2]))) continue;
      o.push({ text: w.slice(0, i + 1) + (c === 'k' ? 'ck' : c + c) + w.slice(i + 2), err: c === 'm' && end ? 'm-regeln' : 'dubbel-konsonant' });
    }
  },
  ng: (w, o) => { sub(w, /ng/g, ['n', 'ngg', 'nng'], 'ng-ljud', o); sub(w, /nk/g, ['ngk'], 'ng-ljud', o); sub(w, /gn/g, ['ngn', 'ng'], 'ng-ljud', o); },
  j: (w, o) => { sub(w, /^(hj|dj|lj|gj)/g, ['j', 'g'], 'j-ljud', o); sub(w, /^g(?=[eiyäö])/g, ['j', 'gj'], 'j-ljud', o); sub(w, /^j/g, ['g', 'gj', 'hj'], 'j-ljud', o); },
  sj: (w, o) => {
    sub(w, /skj/g, ['sj', 'sch', 'stj', 'sh', 'ch'], 'sj-ljud', o);
    sub(w, /stj/g, ['sj', 'skj', 'sch', 'sh'], 'sj-ljud', o);
    sub(w, /sch/g, ['sj', 'sh', 'skj', 'ch'], 'sj-ljud', o);
    sub(w, /sj/g, ['sch', 'sh', 'skj', 'stj', 'ch', 'sk', 'tj'], 'sj-ljud', o);
    sub(w, /(?<!s)ch/g, ['sj', 'sch', 'sh', 'tj'], 'sj-ljud', o);
    sub(w, /sk(?=[eiyäö])/g, ['sj', 'sch', 'sh', 'skj'], 'sj-ljud', o);
    sub(w, /tion/g, ['sjon', 'schon', 'shon', 'tjon'], 'sj-ljud', o);
  },
  tj: (w, o) => { sub(w, /tj/g, ['kj', 'ch', 'sj', 'k'], 'tj-ljud', o); sub(w, /kj/g, ['tj', 'ch', 'sj'], 'tj-ljud', o); sub(w, /^k(?=[eiyäö])/g, ['tj', 'kj', 'ch', 'sj'], 'tj-ljud', o); },
};

/** Generatorerna i den ordning de prövas: regelns egen först, så att felet får regelns felkod. */
const ORDER: Record<Rule, string[]> = {
  smaord: [], dubbel: ['enkel'], lang: ['dubbla'], m: ['dubbla', 'enkel'], ck: ['ck', 'enkel'], ng: ['ng'], j: ['j'],
  sj: ['sj'], tj: ['tj'], oa: [], stor: [], sammansatt: [],
};
const ALL_GENS = Object.keys(GEN);

/** Alla typiska felstavningar av ordet, med felkod. Regelns egna kommer först. */
export function variants(e: Entry): Alt[] {
  const w = e.word;
  const out: Alt[] = e.x.map((text) => ({ text, err: e.rule === 'smaord' ? 'talsprak' : RULE_TAGS[e.rule][0] }));
  if (e.rule === 'stor') out.push({ text: (w[0] === w[0].toLocaleUpperCase('sv') ? w[0].toLocaleLowerCase('sv') : w[0].toLocaleUpperCase('sv')) + w.slice(1), err: w[0] === w[0].toLocaleUpperCase('sv') ? 'stor-bokstav' : 'liten-bokstav' });
  if (e.parts) out.push({ text: e.parts.join(' '), err: 'sarskrivning' }, { text: e.parts.join('-'), err: 'sarskrivning' });
  if (e.rule === 'oa') sub(w, /o/g, ['å'], 'o-a', out);
  const low = w.toLocaleLowerCase('sv');
  for (const g of [...ORDER[e.rule], ...ALL_GENS.filter((x) => !ORDER[e.rule].includes(x))]) {
    const o: Alt[] = [];
    GEN[g](low, o);
    out.push(...(e.rule === 'stor' && w !== low ? o.map((a) => ({ ...a, text: w[0] + a.text.slice(1) })) : o));
  }
  const seen = new Set<string>([w]);
  return out.filter((a) => (seen.has(a.text) ? false : (seen.add(a.text), true)));
}

/** De fel alternativ en fråga visar: regelns typiska fel, högst två (bara ett när reglerna ger ett bra). */
export function distractors(e: Entry, trap?: string): Alt[] {
  const own = variants(e).filter((a) => RULE_TAGS[e.rule].includes(a.err!) && !same(a.text, e.word, e.rule === 'stor'));
  const sorted = trap ? [...own.filter((a) => a.err === trap), ...own.filter((a) => a.err !== trap)] : own;
  return sorted.slice(0, e.rule === 'lang' || e.rule === 'stor' ? 1 : 2);
}

/* ---------- frågor ---------- */

const PROMPT_VAL: Partial<Record<Rule, string>> = {
  stor: 'Stor eller liten bokstav? Välj rätt ord.',
  sammansatt: 'Ett ord eller två? Välj rätt.',
};

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): SQ {
  const level = Math.max(0, Math.min(3, spec.level));
  const rules = MODES[spec.mode] ?? RULES;
  const band = (e: Entry) => level >= 2 || e.band === 1;
  let pool = ENTRIES.filter((e) => rules.includes(e.rule) && band(e));
  if (spec.trap) {
    // Bossens fälla: ord där just det felet är ett av de felaktiga alternativen.
    const hits = (e: Entry) => distractors(e, spec.trap).some((a) => a.err === spec.trap);
    const t = pool.filter(hits);
    pool = t.length ? t : ENTRIES.filter((e) => band(e) && hits(e));
  }
  const e = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  const tokens = e.sentence.split(' ');
  const idx = tokens.findIndex((t) => core(t) === e.word);
  const wrong = distractors(e, spec.trap);
  const base = { mode: spec.mode, level, skill: `sv.stav.${e.rule}`, rule: e.rule, answer: e.word, caseStrict: e.rule === 'stor' };

  if (level === 3) {
    const bad = wrong[0].text;
    const out = tokens.flatMap((t, i) => (i === idx ? t.replace(e.word, bad).split(' ') : [t]));
    const targets = bad.includes(' ') ? [idx, idx + 1] : [idx];
    return { ...base, kind: 'markera', prompt: 'Ett ord i meningen är felstavat. Tryck på det!', tokens: out, targets, missTag: wrong[0].err, say: 'Ett ord i meningen är felstavat. Tryck på det!' };
  }
  const sentence = tokens.map((t, i) => (i === idx ? t.replace(e.word, '___') : t)).join(' ');
  const alts = rng.shuffle([{ text: e.word }, ...wrong]);
  if (level === 0) return { ...base, kind: 'val', prompt: PROMPT_VAL[e.rule] ?? 'Vilken stavning är rätt?', sentence, alts, say: e.sentence };
  return {
    ...base, kind: 'skriv', sentence, alts,
    prompt: e.rule === 'stor' ? 'Lyssna och skriv ordet som fattas. Stor eller liten bokstav?' : 'Lyssna och skriv ordet som fattas.',
    say: `${e.word}. ${e.sentence} ${e.word}.`,
  };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const rule = skill.split('.')[2] as Rule;
  return RULES.includes(rule) ? [{ mode: rule, level: 0 }, { mode: rule, level: 1 }] : [];
}

const entryOf = (q: SQ) => ENTRIES.find((e) => e.word === q.answer && e.rule === q.rule)!;

/* ---------- diagnos ---------- */

export function diagnose(q: SQ, given: string): string | undefined {
  const e = entryOf(q);
  const hit = variants(e).find((a) => same(a.text, given, q.caseStrict));
  if (hit) return hit.err;
  if (/[\s-]/.test(given) && same(given.replace(/[\s-]+/g, ''), q.answer)) return 'sarskrivning';
  if (q.caseStrict && same(given, q.answer)) return q.answer[0] === q.answer[0].toLocaleUpperCase('sv') ? 'stor-bokstav' : 'liten-bokstav';
  return undefined;
}

/* ---------- förklaringar (avslöjar aldrig svaret – barnet ska rätta själv) ---------- */

/** Exempelord som inte är (en del av) svaret. */
function ex(q: SQ, words: string[], n: number): string {
  const a = q.answer.toLocaleLowerCase('sv');
  return words.filter((w) => { const l = w.toLocaleLowerCase('sv'); return !a.includes(l) && !l.includes(a); }).slice(0, n).map((w) => `"${w}"`).join(', ');
}

const PAIRS_M: [string, string][] = [['kam', 'kamma'], ['hem', 'hemma'], ['rum', 'rummet'], ['dum', 'dumma'], ['tom', 'tomma']];
const PAIRS_TAL: [string, string][] = [['ja', 'jag'], ['va', 'vad'], ['me', 'med'], ['de', 'det'], ['å', 'och']];

// Texterna undviker småord som "och", "det" och "är" – de är ju själva svar i småordsbanorna.
// avoid() väljer en annan formulering om svaret ändå skulle stå i texten.
export function explain(tag: string, q: SQ): Explained {
  const w = q.answer;
  switch (tag) {
    case 'enkel-konsonant':
      return {
        title: avoid(w, 'Kort vokal – dubbel konsonant', 'Snabb vokal – dubbel konsonant'),
        text: avoid(w, `Säg ordet långsamt. Hör du att vokalen låter kort? Efter en kort vokal brukar man skriva två konsonanter. Exempel: ${ex(q, ['katt', 'hoppa', 'mamma', 'glass', 'tack'], 2)}.`,
          `Säg ordet långsamt. Hör du att vokalen låter snabb? Efter en snabb vokal brukar man skriva två konsonanter. Exempel: ${ex(q, ['katt', 'hoppa', 'mamma', 'glass', 'tack'], 2)}.`),
      };
    case 'dubbel-konsonant':
      return {
        title: avoid(w, 'Lång vokal – en konsonant', 'Utdragen vokal – en konsonant'),
        text: avoid(w, `Lyssna på vokalen. Hör du att den låter lång? Efter en lång vokal räcker en konsonant. Exempel: ${ex(q, ['sol', 'glas', 'mat', 'bok'], 2)}.`,
          `Lyssna på vokalen. Hör du att den låter utdragen? Efter en utdragen vokal räcker en konsonant. Exempel: ${ex(q, ['sol', 'glas', 'mat', 'bok'], 2)}.`),
      };
    case 'm-regeln': {
      const [k, l] = PAIRS_M.find(([x, y]) => !w.includes(x) && !y.includes(w))!;
      return { title: 'M-regeln', text: `Inget ord slutar på två m. Man skriver "${k}" – men "${l}", där ordet fortsätter.` };
    }
    case 'ck':
      return { title: 'Två k skrivs ck', text: `Man skriver aldrig kk. Man skriver ck i stället. Exempel: ${ex(q, ['tack', 'vecka', 'docka', 'flicka'], 2)}.` };
    case 'ng-ljud':
      return { title: 'ng-ljudet', text: `ng-ljudet kan stavas ng (${ex(q, ['lång', 'kung', 'sjunga'], 1)}), n före k (${ex(q, ['bank', 'tänka', 'blinka'], 1)}) eller g före n (${ex(q, ['regn', 'vagn', 'lugn'], 1)}). Vilket passar här?` };
    case 'j-ljud':
      return { title: 'j-ljudet', text: `j-ljudet kan stavas j, g, gj, hj, dj eller lj. Exempel: ${ex(q, ['gilla', 'hjälp', 'djur', 'ljus', 'gjorde', 'jul'], 3)}. Vilka bokstäver passar här?` };
    case 'sj-ljud':
      return { title: 'sj-ljudet', text: `sj-ljudet har många stavningar: sj, sk, skj, stj, ch, -tion. Exempel: ${ex(q, ['sjö', 'skina', 'skjorta', 'stjärna', 'choklad'], 3)}.` };
    case 'tj-ljud':
      return { title: 'tj-ljudet', text: `tj-ljudet kan stavas tj, k eller kj. Exempel: ${ex(q, ['tjugo', 'kind', 'kjol', 'tjock'], 3)}. Före e, i, y, ä, ö låter k ofta tj.` };
    case 'o-a':
      return { title: 'Låter å – skrivs o', text: `Ljudet låter å, men i många ord skrivs ljudet o. Exempel: ${ex(q, ['sova', 'blomma', 'folk', 'moln'], 2)}.` };
    case 'talsprak': {
      const [say, write] = PAIRS_TAL.find(([, y]) => !same(y, w))!;
      return { title: 'Skriftspråk – inte talspråk', text: `Många småord uttalas kortare än de skrivs. Man säger "${say}" men skriver "${write}". Hur ser ordet ut i skrift?` };
    }
    case 'stor-bokstav':
      return { title: 'Stor bokstav', text: `Namn på personer, städer, länder eller hav börjar alltid på stor bokstav. Exempel: ${ex(q, ['Malmö', 'Sverige', 'Maja'], 2)}.` };
    case 'liten-bokstav':
      return { title: 'Liten bokstav', text: `Veckodagar, månader, högtider eller språk får liten bokstav. Exempel: ${ex(q, ['måndag', 'juli', 'jul', 'svenska'], 2)}. Engelskan gör tvärtom!` };
    case 'sarskrivning':
      return { title: 'Ett ord – inte två', text: `Två ord kan bli ett nytt ord – då skrivs de ihop. Exempel: ${ex(q, ['snögubbe', 'fotboll', 'julklapp', 'glassbil'], 2)}. Delar man ordet kan betydelsen ändras!` };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

const HINT: Record<Rule, string> = {
  smaord: 'Småord säger vi ofta slarvigt. Hur ser ordet ut i skrift?',
  dubbel: 'Lyssna på vokalen. Kort vokal – två konsonanter efter.',
  lang: 'Lyssna på vokalen. Lång vokal – bara en konsonant efter.',
  m: 'M-regeln: inget ord slutar på två m. Men mitt i ett ord kan m bli dubbelt.',
  ck: 'Två k skrivs alltid ck.',
  ng: 'ng-ljudet kan skrivas ng, n före k, eller g före n.',
  j: 'j-ljudet kan skrivas j, g, gj, hj, dj eller lj.',
  sj: 'sj-ljudet kan skrivas sj, sk, skj, stj, sch, ch eller -tion.',
  tj: 'tj-ljudet kan skrivas tj, k eller kj.',
  oa: 'Ljudet låter å – men i många ord skrivs ljudet o.',
  stor: 'Namn på personer eller platser får stor bokstav. Dagar, månader, högtider eller språk får liten.',
  sammansatt: 'Två ord kan bli ett nytt ord. Då skrivs de ihop.',
};

export function hint(q: SQ): string {
  const letters = q.answer.replace(/[\s-]/g, '').length;
  return q.kind === 'skriv' ? `${HINT[q.rule]} Ordet har ${letters} bokstäver.` : HINT[q.rule];
}

function tip(q: SQ): string {
  const w = q.answer;
  switch (q.rule) {
    case 'smaord': return 'Småord skrivs inte alltid som de låter.';
    case 'dubbel': return 'Kort vokal – och då dubbel konsonant.';
    case 'lang': return 'Lång vokal – och då en konsonant.';
    case 'm': return w.endsWith('mm') || !w.endsWith('m') ? 'Mitt i ordet kan m bli dubbelt.' : 'M-regeln: inget ord slutar med mm.';
    case 'ck': return 'Två k skrivs ck.';
    case 'ng': return /nk/.test(w) ? 'n före k låter som ng.' : /gn/.test(w) ? 'g före n låter som ng.' : 'Här skrivs ng-ljudet ng.';
    case 'j': return `Här skrivs j-ljudet "${/^(hj|dj|lj|gj|g|j)/.exec(w)?.[0]}".`;
    case 'sj': return `Här skrivs sj-ljudet "${/(skj|stj|sch|sj|sk|ch|tion|ge|si)/.exec(w)?.[0]}".`;
    case 'tj': return `Här skrivs tj-ljudet "${/(tj|kj|k)/.exec(w)?.[0]}".`;
    case 'oa': return 'o som låter å.';
    case 'stor': return w[0] === w[0].toLocaleUpperCase('sv') ? 'Det är ett namn, så det får stor bokstav.' : 'Dagar, månader, högtider och språk har liten bokstav.';
    case 'sammansatt': return `Två ord blir ett: ${entryOf(q).parts!.join(' + ')}.`;
  }
}

export function solution(q: SQ): string {
  return `Rätt stavat: ${q.answer}. ${tip(q)}`;
}
