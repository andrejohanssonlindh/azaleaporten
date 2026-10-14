import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { deckPick, mentions } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { GENUSADJ, KOMP, MENINGAR, PRONOMEN, SUBST, VERB, type Klass } from './ord';

// Ordklassernas tempel: hitta ordklasser i en mening (markera), säg vilken ordklass ett ord är,
// och böj orden rätt (en/ett, plural, bestämd form, tempus, jämförelse, pronomen).
// Färdighets-id:n ('sv.ordklass.*', 'sv.bojn.*') och felkoder är permanenta.

export type Topic =
  | 'subst' | 'verb' | 'adj' | 'pron' | 'prep' | 'vilken'
  | 'genus' | 'plural' | 'bestamd' | 'pret' | 'pres' | 'sup' | 'komp' | 'superl' | 'pronomen';

export interface OQ extends OrdQ {
  topic: Topic;
  /** Raden i innehållet (för tester). */
  row: number;
  /** vilken: ordets plats i meningen. genus: adjektivet. */
  k?: number;
  /** Ordet frågan handlar om (substantivet, verbets infinitiv, adjektivets grundform, ordet i vilken-frågan). Aldrig svaret. */
  word: string;
  /** markera: alla ord som är rätt att trycka på. */
  hits?: string[];
  /** markera: ordklassen i varje ord. */
  classes?: Klass[];
}

export const ERR: Record<string, string> = {
  'fel-ordklass': 'Blandar ihop ordklasserna',
  'fel-genus': 'Blandar ihop en och ett',
  'fel-form': 'Rätt ord men fel form',
  'fel-plural': 'Fel ändelse i plural',
  'regelbunden-plural': 'Böjer ett krångligt ord som ett vanligt (musar)',
  'starkt-verb': 'Böjer ett starkt verb med -de (gådde)',
  'fel-tempus': 'Fel tid på verbet',
  'regelbunden-komparation': 'Jämför ett krångligt ord som ett vanligt (storare)',
  'fel-grad': 'Blandar ihop -are och -ast',
  'de-dem': 'Blandar ihop de och dem',
  'subjekt-objekt': 'Blandar ihop formerna (han – honom, jag – mig)',
  'fel-person': 'Väljer fel person',
};

const NAMN: Record<Klass, string> = { s: 'substantiv', v: 'verb', a: 'adjektiv', p: 'pronomen', r: 'preposition', x: 'annat' };
const MED_ART: Record<Klass, string> = { s: 'ett substantiv', v: 'ett verb', a: 'ett adjektiv', p: 'ett pronomen', r: 'en preposition', x: 'något annat' };
const MARK: Partial<Record<Topic, Klass>> = { subst: 's', verb: 'v', adj: 'a', pron: 'p', prep: 'r' };
const SKILL_KLASS: Record<Klass, string> = { s: 'substantiv', v: 'verb', a: 'adjektiv', p: 'pronomen', r: 'preposition', x: 'substantiv' };

/* ---------- meningarna ---------- */

export interface Tok { w: string; c: Klass }

export function tokensOf(i: number): Tok[] {
  return MENINGAR[i][0].split(' ').map((t) => { const [w, c] = t.split(':'); return { w, c: c as Klass }; });
}

/** Meningen som den visas: stor bokstav först och punkt sist. */
export function shown(i: number): string[] {
  const ws = tokensOf(i).map((t) => t.w);
  ws[0] = cap(ws[0]);
  ws[ws.length - 1] += '.';
  return ws;
}

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv') + s.slice(1);
/** Ordet utan stor bokstav (namn och ord mitt i meningen skrivs som de står). */
const plain = (i: number, k: number) => (k === 0 ? tokensOf(i)[k].w.toLocaleLowerCase('sv') : tokensOf(i)[k].w);

/* ---------- vilka frågor som finns ---------- */

interface Item { t: Topic; i: number; k?: number }

const strong = (i: number) => !!VERB[i][4];
const irregularKomp = (i: number) => !!KOMP[i][3];

/** Ordklasserna som en vilken-fråga kan handla om, per nivå. */
const VILKEN: Klass[][] = [['s', 'v'], ['s', 'v', 'a'], ['s', 'v', 'a', 'p', 'r']];

function topicsFor(mode: string, level: number): Topic[] {
  switch (mode) {
    case 'subst': return ['subst'];
    case 'verb': return ['verb'];
    case 'adj': return ['adj'];
    case 'smaord': return ['pron', 'prep'];
    case 'vilken': return ['vilken'];
    case 'genus': return ['genus'];
    case 'plural': return ['plural'];
    case 'bestamd': return ['bestamd'];
    case 'tempus': return level === 0 ? ['pret', 'pres'] : ['pret', 'pres', 'sup'];
    case 'starka': return ['pret'];
    case 'komparation': return level === 0 ? ['komp'] : ['komp', 'superl'];
    case 'pronomen': return ['pronomen'];
    default: // blandat
      return level === 0 ? ['subst', 'verb', 'vilken', 'genus', 'plural', 'pret', 'pres']
        : level === 1 ? ['adj', 'vilken', 'genus', 'plural', 'bestamd', 'pret', 'sup', 'komp', 'pronomen']
          : ['pron', 'prep', 'vilken', 'bestamd', 'pret', 'sup', 'superl', 'pronomen'];
  }
}

const TRAP_TOPICS: Record<string, Topic[]> = { 'fel-ordklass': ['vilken'], 'starkt-verb': ['pret'] };

function bandOf(t: Topic, i: number): 1 | 2 {
  switch (t) {
    case 'genus': case 'plural': case 'bestamd': return SUBST[i][5];
    case 'pret': case 'pres': case 'sup': return VERB[i][5];
    case 'komp': case 'superl': return KOMP[i][5];
    case 'pronomen': return PRONOMEN[i][4];
    default: return MENINGAR[i][1];
  }
}

function itemsOf(t: Topic, level: number, onlyStrong: boolean): Item[] {
  const out: Item[] = [];
  const add = (i: number, k?: number) => { if (level > 0 || bandOf(t, i) === 1) out.push({ t, i, k }); };
  switch (t) {
    case 'subst': case 'verb': case 'adj': case 'pron': case 'prep':
      MENINGAR.forEach((_, i) => { if (tokensOf(i).some((x) => x.c === MARK[t])) add(i); });
      break;
    case 'vilken': {
      const ok = VILKEN[Math.min(level, 2)];
      MENINGAR.forEach((_, i) => tokensOf(i).forEach((x, k) => { if (ok.includes(x.c)) add(i, k); }));
      break;
    }
    case 'genus': SUBST.forEach((_, i) => add(i, i % GENUSADJ.length)); break;
    // Ord som är likadana i plural (ett glas – två glas) skulle stå i frågan, så de är bara med i bestämd form.
    case 'plural': SUBST.forEach((r, i) => { if (r[2] !== r[0]) add(i); }); break;
    case 'bestamd': SUBST.forEach((_, i) => add(i)); break;
    case 'pret': VERB.forEach((_, i) => { if (!onlyStrong || strong(i)) add(i); }); break;
    case 'pres': case 'sup': VERB.forEach((_, i) => add(i)); break;
    case 'komp': case 'superl': KOMP.forEach((_, i) => add(i)); break;
    case 'pronomen': PRONOMEN.forEach((_, i) => add(i)); break;
  }
  return out;
}

export function items(mode: string, level: number, trap?: string): Item[] {
  const onlyStrong = mode === 'starka' || trap === 'starkt-verb';
  const of = (ts: Topic[]) => ts.flatMap((t) => itemsOf(t, level, onlyStrong));
  const all = of(topicsFor(mode, level));
  if (!trap || !TRAP_TOPICS[trap]) return all;
  const hit = all.filter((x) => TRAP_TOPICS[trap].includes(x.t));
  return hit.length ? hit : of(TRAP_TOPICS[trap]);
}

/* ---------- frågor ---------- */

type Built = Omit<OQ, 'mode' | 'level' | 'skill' | 'topic' | 'row' | 'k'>;

/** Rätt svar och felen (fällan alltid med, om den finns), blandade. */
function choose(rng: Rng, right: string, wrong: Alt[], trap?: string, n = 2): Alt[] {
  const seen = new Set([right.toLocaleLowerCase('sv')]);
  const uniq = wrong.filter((a) => { const k = a.text.toLocaleLowerCase('sv'); return seen.has(k) ? false : (seen.add(k), true); });
  const first = uniq.filter((a) => a.err === trap);
  const rest = rng.shuffle(uniq.filter((a) => a.err !== trap));
  return rng.shuffle([{ text: right }, ...[...first, ...rest].slice(0, n)]);
}

function markeraQ(t: Topic, i: number): Built {
  const c = MARK[t]!;
  const toks = tokensOf(i);
  const tokens = shown(i);
  const targets = toks.map((x, k) => (x.c === c ? k : -1)).filter((k) => k >= 0);
  const misses = Object.fromEntries(toks.map((_, k) => k).filter((k) => !targets.includes(k)).map((k) => [k, 'fel-ordklass']));
  const hits = targets.map((k) => plain(i, k));
  // Inte "Tryck på …": "på" är själv en preposition och kan vara svaret.
  const prompt = `Vilket ord är ${MED_ART[c]}?`;
  return {
    kind: 'markera', prompt, tokens, targets, misses, missTag: 'fel-ordklass', answer: hits[0], hits,
    classes: toks.map((x) => x.c), word: NAMN[c], say: `${prompt} ${tokens.join(' ')}`,
  };
}

function vilkenQ(i: number, k: number, level: number, rng: Rng): Built {
  const c = tokensOf(i)[k].c;
  const word = plain(i, k);
  const pool = VILKEN[Math.min(level, 2)].length >= 3 ? VILKEN[Math.min(level, 2)] : (['s', 'v', 'a'] as Klass[]);
  const wrong = pool.filter((x) => x !== c).map((x) => ({ text: NAMN[x], err: 'fel-ordklass' }));
  const prompt = `Vilken ordklass är "${word}"?`;
  const sentence = shown(i).join(' ');
  return { kind: 'val', prompt, sentence, answer: NAMN[c], alts: choose(rng, NAMN[c], wrong), word, say: `${prompt} ${sentence}` };
}

const slutarPaVokal = (w: string) => /[aeiouyåäö]$/.test(w);

function genusQ(i: number, k: number, rng: Rng): Built {
  const [w, g] = SUBST[i];
  const [u, n] = GENUSADJ[k];
  const form = (art: string, adj: string) => `${art} ${adj} ${w}`;
  const right = form(g, g === 'ett' ? n : u);
  const other = g === 'ett' ? 'en' : 'ett';
  const wrong: Alt[] = [{ text: form(other, other === 'ett' ? n : u), err: 'fel-genus' }, { text: form(g, g === 'ett' ? u : n), err: 'fel-form' }];
  const alts = choose(rng, right, wrong);
  return { kind: 'val', prompt: 'Vilket är rätt?', answer: right, alts, word: w, say: `Vilket är rätt? ${alts.map((a) => a.text).join('. ')}.` };
}

/** Pluralformer som barn brukar gissa på: de vanliga ändelserna. */
export function pluralGissningar(i: number): string[] {
  const [w, , pl, best, , , reg] = SUBST[i];
  const base = /[ae]$/.test(w) ? w.slice(0, -1) : w;
  return [base + 'ar', base + 'er', base + 'or', w + 'n']
    .filter((x) => x !== pl && x !== best && x !== reg && x !== w);
}

function pluralQ(i: number, rng: Rng): Built {
  const [w, g, pl, , , , reg] = SUBST[i];
  const wrong: Alt[] = [...(reg ? [{ text: reg, err: 'regelbunden-plural' }] : []), ...rng.shuffle(pluralGissningar(i)).map((text) => ({ text, err: 'fel-plural' }))];
  const sentence = `${cap(g)} ${w}, två ___.`;
  const alts = choose(rng, pl, wrong, reg ? 'regelbunden-plural' : undefined);
  return { kind: 'val', prompt: 'Hur blir det när det är flera?', sentence, answer: pl, alts, word: w, say: `${g} ${w}, två … ${alts.map((a) => a.text).join('. ')}.` };
}

export function genusByte(i: number): string {
  const [w, g] = SUBST[i];
  return g === 'en' ? (slutarPaVokal(w) ? w + 't' : w + 'et') : (slutarPaVokal(w) ? w + 'n' : w + 'en');
}

function bestamdQ(i: number, rng: Rng): Built {
  const [w, g, pl, best, bestPl] = SUBST[i];
  // Genusfelet först (om det inte råkar vara en riktig form av ordet, som "husen"), sedan formfelen.
  const byte = genusByte(i);
  const wrong: Alt[] = [...([bestPl, pl, w].includes(byte) ? [] : [{ text: byte, err: 'fel-genus' }]), { text: bestPl, err: 'fel-form' }, { text: pl, err: 'fel-form' }, { text: w, err: 'fel-form' }];
  const seen = new Set([best]);
  const uniq = wrong.filter((a) => (seen.has(a.text) ? false : (seen.add(a.text), true)));
  const alts = rng.shuffle([{ text: best }, ...uniq.slice(0, 2)]);
  const sentence = `${g} ${w} → ___`;
  return { kind: 'val', prompt: 'Hur blir ordet i bestämd form?', sentence, answer: best, alts, word: w, say: `Hur blir ${g} ${w} i bestämd form?` };
}

type Tid = 'pret' | 'pres' | 'sup';
const RAM: Record<Tid, (rest: string) => string> = {
  pret: (r) => `Igår ___ jag ${r}.`,
  pres: (r) => `Varje dag ___ jag ${r}.`,
  sup: (r) => `Jag har ___ ${r} många gånger.`,
};

function verbQ(t: Tid, i: number, rng: Rng, trap?: string): Built {
  const [inf, pres, pret, sup, fel, , rest] = VERB[i];
  const right = t === 'pret' ? pret : t === 'pres' ? pres : sup;
  const wrong: Alt[] = t === 'pret'
    ? [{ text: pres, err: 'fel-tempus' }, fel ? { text: fel, err: 'starkt-verb' } : { text: sup, err: 'fel-tempus' }]
    : t === 'pres' ? [{ text: pret, err: 'fel-tempus' }, { text: inf, err: 'fel-form' }]
      : [{ text: pret, err: 'fel-tempus' }, { text: pres, err: 'fel-tempus' }];
  const prompt = `Vilket ord passar? (${inf})`;
  const sentence = RAM[t](rest);
  const alts = choose(rng, right, wrong, trap);
  return { kind: 'val', prompt, sentence, answer: right, alts, word: inf, say: `${sentence.replace('___', '…')} ${alts.map((a) => a.text).join('. ')}.` };
}

function kompQ(t: 'komp' | 'superl', i: number, rng: Rng): Built {
  const [pos, komp, sup, felK, felS, , kS, sS] = KOMP[i];
  const right = t === 'komp' ? komp : sup;
  const wrong: Alt[] = t === 'komp'
    ? [{ text: sup, err: 'fel-grad' }, irregularKomp(i) ? { text: felK, err: 'regelbunden-komparation' } : { text: `mer ${pos}`, err: 'fel-form' }]
    : [{ text: komp, err: 'fel-grad' }, irregularKomp(i) ? { text: felS, err: 'regelbunden-komparation' } : { text: `mest ${pos}`, err: 'fel-form' }];
  const sentence = t === 'komp' ? kS : sS;
  const alts = choose(rng, right, wrong);
  return { kind: 'val', prompt: `Vilket ord passar? (${pos})`, sentence, answer: right, alts, word: pos, say: `${sentence.replace('___', '…')} ${alts.map((a) => a.text).join('. ')}.` };
}

export const pronomenTag = (right: string, form: string) =>
  [right, form].every((x) => ['de', 'dem'].includes(x.toLocaleLowerCase('sv'))) ? 'de-dem' : 'subjekt-objekt';

function pronomenQ(i: number, rng: Rng): Built {
  const [sentence, right, form, person] = PRONOMEN[i];
  const alts = choose(rng, right, [{ text: form, err: pronomenTag(right, form) }, { text: person, err: 'fel-person' }]);
  return { kind: 'val', prompt: 'Vilket ord passar?', sentence, answer: right, alts, word: sentence.split(' ')[0], say: `${sentence.replace('___', '…')} ${alts.map((a) => a.text).join('. ')}.` };
}

function build(x: Item, level: number, rng: Rng, trap?: string): Built {
  switch (x.t) {
    case 'subst': case 'verb': case 'adj': case 'pron': case 'prep': return markeraQ(x.t, x.i);
    case 'vilken': return vilkenQ(x.i, x.k!, level, rng);
    case 'genus': return genusQ(x.i, x.k!, rng);
    case 'plural': return pluralQ(x.i, rng);
    case 'bestamd': return bestamdQ(x.i, rng);
    case 'pret': case 'pres': case 'sup': return verbQ(x.t, x.i, rng, trap);
    case 'komp': case 'superl': return kompQ(x.t, x.i, rng);
    case 'pronomen': return pronomenQ(x.i, rng);
  }
}

function skillOf(x: Item): string {
  switch (x.t) {
    case 'subst': case 'verb': case 'adj': case 'pron': case 'prep': return `sv.ordklass.${SKILL_KLASS[MARK[x.t]!]}`;
    case 'vilken': return `sv.ordklass.${SKILL_KLASS[tokensOf(x.i)[x.k!].c]}`;
    case 'genus': return 'sv.bojn.genus';
    case 'plural': return 'sv.bojn.plural';
    case 'bestamd': return 'sv.bojn.bestamd';
    case 'pret': return strong(x.i) ? 'sv.bojn.starka' : 'sv.bojn.tempus';
    case 'pres': case 'sup': return 'sv.bojn.tempus';
    case 'komp': case 'superl': return 'sv.bojn.komparation';
    case 'pronomen': return 'sv.bojn.pronomen';
  }
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): OQ {
  const level = Math.max(0, Math.min(2, spec.level));
  const pool = items(spec.mode, level, spec.trap);
  const x = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  return { mode: spec.mode, level, skill: skillOf(x), topic: x.t, row: x.i, k: x.k, ...build(x, level, rng, spec.trap) };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case 'sv.ordklass.substantiv': return [{ mode: 'subst', level: 0 }, { mode: 'subst', level: 1 }];
    case 'sv.ordklass.verb': return [{ mode: 'verb', level: 0 }, { mode: 'verb', level: 1 }];
    case 'sv.ordklass.adjektiv': return [{ mode: 'adj', level: 0 }, { mode: 'adj', level: 1 }];
    case 'sv.ordklass.pronomen': case 'sv.ordklass.preposition': return [{ mode: 'smaord', level: 1 }, { mode: 'vilken', level: 2 }];
    case 'sv.bojn.genus': return [{ mode: 'genus', level: 0 }, { mode: 'genus', level: 1 }];
    case 'sv.bojn.plural': return [{ mode: 'plural', level: 0 }, { mode: 'plural', level: 1 }];
    case 'sv.bojn.bestamd': return [{ mode: 'bestamd', level: 0 }, { mode: 'bestamd', level: 1 }];
    case 'sv.bojn.tempus': return [{ mode: 'tempus', level: 0 }, { mode: 'tempus', level: 1 }];
    case 'sv.bojn.starka': return [{ mode: 'starka', level: 0 }, { mode: 'starka', level: 1 }];
    case 'sv.bojn.komparation': return [{ mode: 'komparation', level: 0 }, { mode: 'komparation', level: 1 }];
    case 'sv.bojn.pronomen': return [{ mode: 'pronomen', level: 0 }, { mode: 'pronomen', level: 1 }];
    default: return [];
  }
}

/** Alla frågor är val eller markera; felen står på alternativen och orden. */
export const diagnose = (): string | undefined => undefined;

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

/** Den första texten som inte nämner något av orden (svaret, och i markera alla rätta ord). */
function fri(words: string[], ...texts: string[]): string {
  return texts.find((t) => !words.some((w) => mentions(t, w))) ?? texts[texts.length - 1];
}
const svar = (q: OQ) => q.hits ?? [q.answer];

/** Vad en ordklass är; sista texten har inga exempel och passar alltid. */
const DEF: Record<Klass, string[]> = {
  s: [
    'Ett substantiv är namnet på en sak, ett djur eller en person. Man kan sätta en eller ett framför: en stol, ett äpple.',
    'Ett substantiv är namnet på en sak, ett djur eller en person. Man kan sätta en eller ett framför: en båt, ett lamm.',
    'Ett substantiv är namnet på en sak, ett djur eller en person. Man kan sätta en eller ett framför.',
  ],
  v: [
    'Ett verb är något man gör eller något som händer: hoppa, skratta, sova. Prova att sätta jag framför.',
    'Ett verb är något man gör eller något som händer: dansa, äta, gråta. Prova att sätta jag framför.',
    'Ett verb är något man gör eller något som händer. Prova att sätta jag framför.',
  ],
  a: [
    'Ett adjektiv beskriver hur något är: snäll, grön, rund. Det får plats mellan en och ett substantiv: en snäll katt.',
    'Ett adjektiv beskriver hur något är: arg, lila, platt. Det får plats mellan en och ett substantiv: en arg katt.',
    'Ett adjektiv beskriver hur något är. Det får plats mellan en och ett substantiv.',
  ],
  p: [
    'Ett pronomen är ett litet ord som står i stället för ett namn: jag, du, hon, vi.',
    'Ett pronomen är ett litet ord som står i stället för ett namn: han, ni, dem, honom.',
    'Ett pronomen är ett litet ord som står i stället för ett namn eller en person.',
  ],
  r: [
    'En preposition är ett litet ord som berättar var något är eller hur saker hänger ihop: på, under, bakom.',
    'En preposition är ett litet ord som berättar var något är eller hur saker hänger ihop: i, över, mellan.',
    'En preposition är ett litet ord som berättar var något är, som var en boll ligger.',
  ],
  x: ['Det är ett litet hjälpord.'],
};

/** Ett test för ordklassen, utan att nämna någon annan ordklass. */
const TEST: Record<string, string> = {
  substantiv: 'Ett substantiv kan man sätta en eller ett framför.',
  verb: 'Ett verb är något man gör – man kan sätta jag framför.',
  adjektiv: 'Ett adjektiv beskriver hur något är – det får plats mellan "en" och "katt".',
  pronomen: 'Ett pronomen står i stället för ett namn, som jag, du eller hon.',
  preposition: 'En preposition berättar var något är, som på eller under.',
};
const PROVA: Record<string, (w: string) => string> = {
  substantiv: (w) => `Går det att säga "en ${w}" eller "ett ${w}"?`,
  verb: (w) => `Går det att säga "jag ${w}"?`,
  adjektiv: (w) => `Går det att säga "en ${w} katt"?`,
  pronomen: (w) => `Står "${w}" i stället för ett namn?`,
  preposition: (w) => `Berättar "${w}" var något är?`,
};

export function explainMiss(q: OQ, i: number): Explained {
  const c = q.classes![i];
  const look = MARK[q.topic]!;
  const ord = core(q.tokens![i]);
  const what = c === 'x' ? `"${ord}" är inte ${MED_ART[look]}.` : `"${ord}" är ${MED_ART[c]}.`;
  return { title: c === 'x' ? 'Inte det ordet' : `Det där är ${MED_ART[c]}`, text: `${what} ${fri(svar(q), ...DEF[look])}` };
}

const core = (t: string) => t.replace(/[.,!?]+$/, '').toLocaleLowerCase('sv');

/** Exempel som aldrig är svaret: det första paret där inget av orden är svaret. */
function exempel(q: OQ, par: string[]): string {
  return fri(svar(q), ...par);
}

export function explain(tag: string, q: OQ, given: string): Explained {
  switch (tag) {
    case 'fel-ordklass': {
      const g = given.toLocaleLowerCase('sv');
      return { title: `Inte ${MED_ART[(Object.keys(NAMN) as Klass[]).find((k) => NAMN[k] === g) ?? 'x']}`, text: `${TEST[g] ?? ''} ${PROVA[g]?.(q.word) ?? ''} Testa de andra ordklasserna på samma sätt.`.trim() };
    }
    case 'fel-genus':
      return q.topic === 'genus'
        ? { title: 'En eller ett?', text: `Säg "${q.word}" med en och med ett framför. Vilket låter rätt? Sedan ska ordet i mitten passa ihop med det.` }
        : { title: 'En eller ett?', text: `Är det en ${q.word} eller ett ${q.word}? En-ord får -en eller -n i bestämd form, som båten. Ett-ord får -et eller -t, som lammet.` };
    case 'fel-form':
      if (q.topic === 'genus') return { title: 'Ordet i mitten ska också passa', text: exempel(q, ['Med ett-ord får ordet i mitten ett t på slutet: ett grönt tak, men en grön dörr.', 'Med ett-ord får ordet i mitten ett t på slutet: ett blött papper, men en blöt vante.']) };
      if (q.topic === 'bestamd') return { title: 'Bara en', text: 'Det du valde betyder inte en bestämd sak. Här menar vi en enda sak som vi redan vet vilken det är, som båten eller lammet.' };
      if (q.topic === 'pres') return { title: 'Nutid', text: exempel(q, ['Efter "jag" i nutid slutar verbet oftast på r, som "jag dansar" eller "jag gråter".', 'Efter "jag" i nutid slutar verbet oftast på r, som "jag skrattar".']) };
      return { title: 'Korta ord får en ändelse', text: 'Korta ord som det här får en ändelse i stället för "mer" och "mest": snäll – snällare – snällast.' };
    case 'fel-plural':
      return { title: 'Fel ändelse', text: pluralRegel(q) };
    case 'regelbunden-plural':
      return { title: 'Ett krångligt ord!', text: `"${q.word}" följer inte den vanliga regeln. ${vokalByte(q) ? 'Vokalen inne i ordet ändras när det är flera, som en strand – två stränder.' : 'Det har en egen form när det är flera.'} Säg ordet högt: hur låter det när det är flera?` };
    case 'starkt-verb':
      return { title: 'Gådde-gåsen lurade dig!', text: `${exempel(q, ['Många verb följer inte regeln med -de. De byter vokal i stället, som sitta – satt och dricka – drack.', 'Många verb följer inte regeln med -de. De byter vokal i stället, som springa – sprang och sjunga – sjöng.', 'Många verb följer inte regeln med -de. De byter vokal i stället, som bita – bet och flyga – flög.'])} Hur låter "${q.word}" när det redan har hänt?` };
    case 'fel-tempus':
      if (q.topic === 'pret') return { title: 'Det hände igår', text: `"Igår" betyder att det redan har hänt. ${exempel(q, ['Då står verbet i dåtid, som "igår dansade jag" eller "igår grät jag".', 'Då står verbet i dåtid, som "igår skrattade jag".'])}` };
      if (q.topic === 'pres') return { title: 'Det händer nu', text: `"Varje dag" betyder att det händer nu, hela tiden. ${exempel(q, ['Då står verbet i nutid, som "varje dag dansar jag".', 'Då står verbet i nutid, som "varje dag skrattar jag".'])}` };
      return { title: 'Efter "har"', text: exempel(q, ['Efter "har" står verbet i en egen form: jag har dansat, jag har gråtit.', 'Efter "har" står verbet i en egen form: jag har skrattat.']) };
    case 'fel-grad':
      return q.topic === 'komp'
        ? { title: 'Två saker jämförs', text: 'När man jämför två saker med "än" slutar ordet oftast på -are eller -re: snällare än.' }
        : { title: 'Mest av alla', text: 'När något är mest av alla slutar ordet oftast på -ast eller -st: snällast av alla.' };
    case 'regelbunden-komparation':
      return { title: 'Ett krångligt ord!', text: `"${q.word}" följer inte den vanliga regeln med -are och -ast. Det ändras på ett eget sätt, som låg – lägre – lägst. Säg det högt: hur brukar man säga?` };
    case 'de-dem':
      return { title: 'Vilken form?', text: 'Prova att byta ut ordet mot "vi" eller "oss". Passar "vi", så är det formen för den som gör något. Passar "oss", så är det formen för den som något händer med.' };
    case 'subjekt-objekt':
      return { title: 'Rätt person – fel form', text: 'Ordet har två former: en när personen gör något själv, och en när något händer med personen. Läs meningen: gör personen något, eller händer något med den?' };
    case 'fel-person':
      return { title: 'Vem handlar det om?', text: 'Läs början av meningen igen. Handlar det om en pojke, en flicka, flera stycken, eller om den som pratar?' };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

function vokalByte(q: OQ): boolean {
  const v = (s: string) => [...s].find((c) => 'aeiouyåäö'.includes(c));
  const row = SUBST[q.row];
  return v(row[0]) !== v(row[2]);
}

function pluralRegel(q: OQ): string {
  const [w, g] = SUBST[q.row];
  if (g === 'en' && w.endsWith('a')) return 'En-ord som slutar på -a får oftast -or när det är flera, som en gata – två gator.';
  if (g === 'ett' && slutarPaVokal(w)) return 'Ett-ord som slutar på en vokal får oftast -n när det är flera, som ett frimärke – två frimärken.';
  if (g === 'ett') return 'Ett-ord som slutar på en konsonant ser ofta likadana ut när det är flera, som ett lamm – två lamm.';
  return 'En-ord får oftast -ar eller -er när det är flera, som en båt – två båtar och en park – två parker. Säg dina alternativ högt: vilket låter rätt?';
}

export function hint(q: OQ): string {
  switch (q.topic) {
    case 'subst': case 'verb': case 'adj': case 'pron': case 'prep': return fri(svar(q), ...DEF[MARK[q.topic]!]);
    case 'vilken': return q.level >= 2
      ? 'Testa ordet: Kan man sätta en eller ett framför? Är det något man gör? Beskriver det hur något är? Står det i stället för ett namn? Berättar det var något är?'
      : 'Testa ordet: Kan man sätta en eller ett framför? Är det något man gör? Beskriver det hur något är?';
    case 'genus': return 'Säg ordet med en och med ett framför. Ordet i mitten får ett t på slutet när det är ett ett-ord.';
    case 'plural': return pluralRegel(q);
    case 'bestamd': return `Bestämd form betyder att vi vet vilken ${q.word} det är. ${SUBST[q.row][1] === 'en' ? 'En-ord får -en eller -n på slutet.' : 'Ett-ord får -et eller -t på slutet.'}`;
    case 'pret': return 'Igår betyder dåtid. Hur säger man det när det redan har hänt?';
    case 'pres': return 'Varje dag betyder nutid. Hur säger man det när det händer nu?';
    case 'sup': return 'Efter "har" kommer en egen form av verbet. Hur säger man: jag har gjort det?';
    case 'komp': return 'Två saker jämförs med "än". Hur säger man när den ena är mer än den andra?';
    case 'superl': return 'Något är mest av alla. Hur säger man det?';
    case 'pronomen': return 'Läs början: vem handlar det om? Gör den personen något, eller händer något med den?';
  }
}

export function solution(q: OQ): string {
  switch (q.topic) {
    case 'subst': case 'verb': case 'adj': case 'pron': case 'prep': {
      const c = MARK[q.topic]!;
      const n = q.hits!.length;
      return n === 1 ? `"${q.hits![0]}" är ${MED_ART[c]}.` : `${cap(NAMN[c])} i meningen: ${q.hits!.map((h) => `"${h}"`).join(', ')}.`;
    }
    case 'vilken': return `"${q.word}" är ${MED_ART[(Object.keys(NAMN) as Klass[]).find((k) => NAMN[k] === q.answer)!]}.`;
    case 'genus': return `Det heter ${q.answer}. ${cap(q.word)} är ett ${SUBST[q.row][1]}-ord.`;
    case 'plural': return `${cap(SUBST[q.row][1])} ${q.word}, två ${q.answer}.`;
    case 'bestamd': return `${SUBST[q.row][1]} ${q.word} → ${q.answer}`;
    case 'pret': case 'pres': case 'sup': {
      const [inf, pres, pret, sup] = VERB[q.row];
      return `${q.sentence!.replace('___', q.answer)} (${inf} – ${pres} – ${pret} – ${sup})`;
    }
    case 'komp': case 'superl': {
      const [pos, komp, sup] = KOMP[q.row];
      return `${q.sentence!.replace('___', q.answer)} (${pos} – ${komp} – ${sup})`;
    }
    case 'pronomen': return q.sentence!.replace('___', q.answer);
  }
}
