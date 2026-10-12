import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { deckPick, norm } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { ARTIKEL, BYGG, FRAGEORD, FRAGEORD_SV, FRAGORD, NEKA, ORDFOLJD, PLURAL, PREP, SAK, SUBJEKT, TAL, VARA, VERB } from './meningar';

// Piratskeppet: första engelska grammatiken. a/an, am/is/are, plural, -s i presens, frågeord,
// prepositioner (med bild), don't/doesn't och ordföljd (välj eller bygg meningen).
// Färdighets-id:n ('en.gram.<ämne>') och felkoder är permanenta.

export type Topic = 'artikel' | 'vara' | 'plural' | 's-form' | 'fragord' | 'prep' | 'neka' | 'ordfoljd' | 'bygg';

export interface PQ extends OrdQ {
  topic: Topic;
  /** Kortet i kortleken (för tester). */
  row: string;
  /** prep: vad som står var (bilden). */
  scene?: { sak: string; obj: 'box' | 'table'; prep: string };
  /** bygg: ordningar som är svensk ordföljd. */
  svensk?: string[];
}

const SKILL: Record<Topic, string> = {
  artikel: 'a-an', vara: 'be', plural: 'plural', 's-form': 's-form', fragord: 'fragord', prep: 'prep', neka: 'do', ordfoljd: 'ordfoljd', bygg: 'ordfoljd',
};

export const ERR: Record<string, string> = {
  'a-an': 'Blandar ihop a och an',
  'glomt-artikel': 'Glömmer a/an (som på svenska: "Hon är lärare")',
  'be-form': 'Fel form av am/is/are',
  'glomt-s': 'Glömmer -s (two cat, she play)',
  'extra-s': 'Sätter -s där det inte ska vara (I plays)',
  'ing-form': 'Använder -ing utan am/is/are',
  'plural-andelse': 'Fel ändelse (-s, -es eller -ies)',
  regelbunden: 'Sätter -s på ett oregelbundet ord (childs, mouses)',
  'dubbel-plural': 'Sätter -s på ett ord som redan är plural (childrens)',
  fragord: 'Fel frågeord',
  preposition: 'Fel preposition (in, on, under …)',
  'do-does': "Blandar ihop do/don't och does/doesn't",
  'glomt-do': 'Glömmer do/does i frågor och nekande meningar',
  'svensk-ordfoljd': 'Svensk ordföljd på engelska (Today go I …)',
  ordfoljd: 'Orden i fel ordning',
};

/* ---------- korten ---------- */

interface Card { t: Topic; i: number; j?: number; k?: number }

const OBJ: ('box' | 'table')[] = ['box', 'table'];
/** Prepositioner som går att rita vid lådan och bordet ("under lådan" och "i bordet" går inte). */
const prepFits = (p: string, obj: 'box' | 'table') => !(obj === 'box' && p === 'under') && !(obj === 'table' && p === 'in');

const band = <T extends unknown[]>(list: T[], lv: number, b: (r: T) => number) => list.map((r, i) => ({ r, i })).filter(({ r }) => lv > 0 || b(r) === 1).map(({ i }) => i);

function cardsFor(t: Topic, lv: number): Card[] {
  switch (t) {
    case 'artikel': return band(ARTIKEL, lv, (r) => r[2]).map((i) => ({ t, i }));
    case 'vara': return band(VARA, lv, (r) => r[2]).map((i) => ({ t, i }));
    case 'plural': return band(PLURAL, lv, (r) => r[3]).map((i) => ({ t, i }));
    case 's-form': {
      const out: Card[] = [];
      for (const i of band(SUBJEKT, lv, (r) => r[2])) for (const j of band(VERB, lv, (r) => r[3])) out.push({ t, i, j });
      return out;
    }
    case 'fragord': return band(FRAGORD, lv, (r) => r[3]).map((i) => ({ t, i }));
    case 'prep': {
      const out: Card[] = [];
      for (const i of band(PREP, lv, (r) => r[2])) for (let j = 0; j < SAK.length; j++) for (let k = 0; k < OBJ.length; k++) if (prepFits(PREP[i][0], OBJ[k])) out.push({ t, i, j, k });
      return out;
    }
    case 'neka': return band(NEKA, lv, (r) => r[2]).map((i) => ({ t, i }));
    case 'ordfoljd': return band(ORDFOLJD, lv, (r) => r[3]).map((i) => ({ t, i }));
    case 'bygg': return band(BYGG, lv, (r) => r[4]).map((i) => ({ t, i }));
  }
}

const ALL_TOPICS: Topic[] = ['artikel', 'vara', 'plural', 's-form', 'fragord', 'prep', 'neka', 'ordfoljd', 'bygg'];

function topicsFor(mode: string, lv: number): Topic[] {
  if ((ALL_TOPICS as string[]).includes(mode)) return [mode as Topic];
  return lv === 0 ? ['artikel', 'vara', 'plural', 's-form', 'fragord', 'prep', 'neka'] : ALL_TOPICS;
}

/** Kort där bossens fälla kan dyka upp. */
const TRAPS: Record<string, (c: Card) => boolean> = {
  'glomt-s': (c) => (c.t === 'plural' && PLURAL[c.i][2].some(([, e]) => e === 'glomt-s')) || (c.t === 's-form' && SUBJEKT[c.i][1]),
  'svensk-ordfoljd': (c) => c.t === 'ordfoljd' || (c.t === 'bygg' && BYGG[c.i][3].length > 0),
};

export function cards(mode: string, level: number, trap?: string): Card[] {
  const lv = Math.max(0, Math.min(1, level));
  const all = topicsFor(mode, lv).flatMap((t) => cardsFor(t, lv));
  if (!trap || !TRAPS[trap]) return all;
  const hit = all.filter(TRAPS[trap]);
  return hit.length ? hit : ALL_TOPICS.flatMap((t) => cardsFor(t, 1)).filter(TRAPS[trap]);
}

/* ---------- frågor ---------- */

/** Rätt svar, fällan först, sedan resten. Alternativen blandas. */
function choose(rng: Rng, right: string, wrong: Alt[], trap: string | undefined, n: number): Alt[] {
  const seen = new Set([right.toLowerCase()]);
  const uniq = wrong.filter((a) => (seen.has(a.text.toLowerCase()) ? false : (seen.add(a.text.toLowerCase()), true)));
  const first = uniq.filter((a) => a.err === trap).slice(0, 1);
  const rest = uniq.filter((a) => !first.includes(a));
  return rng.shuffle([{ text: right }, ...[...first, ...rest.slice(0, 1), ...rng.shuffle(rest.slice(1))].slice(0, n)]);
}

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ING: Record<string, string> = { swim: 'swimming', run: 'running' };
const ing = (b: string) => ING[b] ?? (b.endsWith('e') ? `${b.slice(0, -1)}ing` : `${b}ing`);

/** Den första texten som inte innehåller svaret (svaret kan vara flera ord, som "an hour"). */
const avoidPhrase = (answer: string, ...texts: string[]) => texts.find((t) => !t.toLowerCase().includes(answer.toLowerCase())) ?? texts.at(-1)!;
/** Svaret i luckan: med stor bokstav om luckan står först. */
const inGap = (sentence: string, w: string) => (sentence.startsWith('___') ? capFirst(w) : w);
const fill = (sentence: string, w: string) => sentence.replace('___', w);

type Built = Omit<PQ, 'mode' | 'level' | 'skill' | 'topic' | 'row'>;

function gapQ(sentence: string, right: string, wrong: Alt[], rng: Rng, trap: string | undefined, n: number, prompt = 'Vilket passar i luckan?'): Built {
  const r = inGap(sentence, right);
  const ws = wrong.map((a) => ({ ...a, text: inGap(sentence, a.text) }));
  return { kind: 'val', prompt, sentence, answer: r, alts: choose(rng, r, ws, trap, n), lang: 'en-GB' };
}

function build(c: Card, lv: number, rng: Rng, trap?: string): Built {
  const n = lv >= 1 ? 3 : 2;
  switch (c.t) {
    case 'artikel': {
      const [sentence, right] = ARTIKEL[c.i];
      const [art, ...rest] = right.split(' ');
      const noun = rest.join(' ');
      return gapQ(sentence, right, [{ text: `${art === 'a' ? 'an' : 'a'} ${noun}`, err: 'a-an' }, { text: noun, err: 'glomt-artikel' }], rng, trap, 2);
    }
    case 'vara': {
      const [sentence, right] = VARA[c.i];
      return gapQ(sentence, right, (['am', 'is', 'are'] as const).filter((x) => x !== right).map((text) => ({ text, err: 'be-form' })), rng, trap, 2);
    }
    case 'plural': {
      const [one, many, wrong] = PLURAL[c.i];
      const sentence = `one ${one} – ${TAL[c.i % TAL.length]} ___`;
      return { kind: 'val', prompt: 'Hur blir det när de är flera?', sentence, answer: many, alts: choose(rng, many, wrong.map(([text, err]) => ({ text, err })), trap, 2), lang: 'en-GB' };
    }
    case 's-form': {
      const [subj, third] = SUBJEKT[c.i];
      const [base, s, rest] = VERB[c.j!];
      const sentence = `${subj} ___ ${rest}.`;
      const right = third ? s : base;
      const wrong: Alt[] = third
        ? [{ text: base, err: 'glomt-s' }, { text: ing(base), err: 'ing-form' }]
        : [{ text: s, err: 'extra-s' }, { text: ing(base), err: 'ing-form' }];
      if (third && s !== `${base}s`) wrong.push({ text: `${base}s`, err: 'plural-andelse' });
      return gapQ(sentence, right, wrong, rng, trap, n);
    }
    case 'fragord': {
      const [q, reply, right] = FRAGORD[c.i];
      const wrong = FRAGEORD.filter((w) => w !== right).map((text) => ({ text, err: 'fragord' }));
      return { ...gapQ(`${q} – ${reply}`, right, rng.shuffle(wrong), rng, trap, n, 'Vilket frågeord passar?') };
    }
    case 'prep': {
      const [p] = PREP[c.i];
      const [sak, emoji] = SAK[c.j!];
      const obj = OBJ[c.k!];
      const sentence = `The ${sak} is ___ the ${obj}.`;
      const others = PREP.filter(([x, , b]) => x !== p && (lv > 0 || b === 1)).map(([text]) => ({ text, err: 'preposition' }));
      return { ...gapQ(sentence, p, rng.shuffle(others), rng, trap, n, 'Titta på bilden. Var är den?'), scene: { sak: emoji, obj, prep: p } };
    }
    case 'neka': {
      const [sentence, right] = NEKA[c.i];
      const isQ = sentence.startsWith('___');
      const other = { "don't": "doesn't", "doesn't": "don't", Do: 'Does', Does: 'Do' }[right]!;
      const third = isQ ? (right === 'Do' ? 'Are' : 'Is') : 'not';
      return gapQ(sentence, right, [{ text: other, err: 'do-does' }, { text: third, err: 'glomt-do' }], rng, trap, 2);
    }
    case 'ordfoljd': {
      const [right, svensk, annan] = ORDFOLJD[c.i];
      return {
        kind: 'val', prompt: 'Vilken mening är rätt engelska?', answer: right, lang: 'en-GB',
        alts: choose(rng, right, [{ text: svensk, err: 'svensk-ordfoljd' }, { text: annan, err: 'ordfoljd' }], trap, 2),
      };
    }
    case 'bygg': {
      const [tiles, end, also, svensk] = BYGG[c.i];
      const answer = tiles.join(' ');
      const ok = new Set([answer, ...also].map((x) => x.toLowerCase()));
      let shuffled = rng.shuffle(tiles);
      for (let k = 0; k < 10 && ok.has(shuffled.join(' ').toLowerCase()); k++) shuffled = rng.shuffle(tiles);
      return { kind: 'ordna', prompt: 'Bygg meningen på engelska. Tryck på bitarna i rätt ordning.', tiles: shuffled, end, answer, answers: also, svensk, lang: 'en-GB' };
    }
  }
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): PQ {
  const level = Math.max(0, Math.min(1, spec.level));
  const pool = cards(spec.mode, level, spec.trap);
  const c = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  return { mode: spec.mode, level, skill: `en.gram.${SKILL[c.t]}`, topic: c.t, row: `${c.i}/${c.j ?? ''}/${c.k ?? ''}`, ...build(c, level, rng, spec.trap) };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const t = (Object.keys(SKILL) as Topic[]).filter((k) => `en.gram.${SKILL[k]}` === skill);
  return t.flatMap((x) => [{ mode: x, level: 0 }, { mode: x, level: 1 }]);
}

/** bygg: svensk ordföljd känns igen; annars är det bara fel ordning. */
export function diagnose(q: PQ, given: string): string | undefined {
  if (q.kind !== 'ordna') return undefined;
  const g = norm(given).toLowerCase();
  return q.svensk?.some((x) => x.toLowerCase() === g) ? 'svensk-ordfoljd' : 'ordfoljd';
}

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

const BE_USE: Record<string, string> = { am: 'I (jag)', is: 'he, she, it och en enda person eller sak', are: 'we, you, they och flera' };
const DO_USE: Record<string, string> = { do: 'I, you, we och they', "don't": 'I, you, we och they', does: 'he, she, it och en enda person', "doesn't": 'he, she, it och en enda person' };
const SV_PREP: Record<string, string> = Object.fromEntries(PREP.map(([en, sv]) => [en, sv]));

/** Ett exempel som inte är frågans svar. */
const exampleS = (q: PQ) => [['sing', 'sings'], ['jump', 'jumps'], ['walk', 'walks']].find(([b, s]) => !q.answer.toLowerCase().startsWith(b) && q.answer !== s)!;

export function explain(tag: string, q: PQ, given: string): Explained {
  const g = given.toLowerCase();
  switch (tag) {
    case 'a-an':
      return { title: 'a eller an?', text: avoidPhrase(q.answer, 'Före ett vokalljud heter det an, annars a. Det är ljudet som räknas, inte bokstaven: "an hour" men "a uniform".', 'Före ett vokalljud heter det an, annars a. Det är ljudet som räknas, inte bokstaven: "an hour" men "a university".', 'Före ett vokalljud heter det an, annars a. Säg ordet högt – vilket ljud börjar det med?') };
    case 'glomt-artikel':
      return { title: 'Glöm inte a eller an!', text: avoidPhrase(q.answer, 'På engelska ska det stå a eller an framför – även före yrken: "She is a dentist". På svenska säger man bara "Hon är tandläkare".', 'På engelska ska det stå a eller an framför – även före yrken. På svenska säger man bara "Hon är tandläkare".') };
    case 'be-form':
      return { title: 'Fel form', text: `"${g}" hör ihop med ${BE_USE[g]}. Vem eller vad handlar meningen om?` };
    case 'glomt-s':
      if (q.topic === 'plural') return { title: 'Flera!', text: 'När det är flera får ordet oftast -s på engelska: one pen – two pens.' };
      { const [b, s] = exampleS(q); return { title: 'Glöm inte -s!', text: `Efter he, she, it och ett namn får verbet ett -s i presens: I ${b} – she ${s}.` }; }
    case 'extra-s':
      { const [b, s] = exampleS(q); return { title: 'Inget -s här', text: `Bara efter he, she, it och ett namn får verbet -s. Efter I, you, we och they står verbet utan -s: she ${s} – they ${b}.` }; }
    case 'ing-form':
      return { title: 'Inte -ing här', text: '-ing använder man med am, is eller are framför: "She is singing". Här står verbet ensamt.' };
    case 'plural-andelse':
      return q.topic === 's-form'
        ? { title: 'Rätt tanke – fel ändelse', text: 'Verb som slutar på s, x, sh, ch eller o får -es (she kisses, he mixes), och efter konsonant + y blir det -ies.' }
        : { title: 'Rätt tanke – fel ändelse', text: 'Efter s, x, sh och ch blir det -es: one kiss – two kisses. Efter konsonant + y blir det -ies: one lady – two ladies. Annars bara -s.' };
    case 'regelbunden':
      return { title: 'Ett oregelbundet ord', text: 'Det här ordet får inte -s i plural – det byter form, precis som på svenska: en mus – två möss.' };
    case 'dubbel-plural':
      return { title: 'Redan plural!', text: 'Du har hittat rätt pluralform, så den behöver inget -s till. Ordet är redan plural.' };
    case 'fragord':
      return { title: 'Fel frågeord', text: `"${given}" betyder ${FRAGEORD_SV[given] ?? '…'}. Titta på svaret efter tankstrecket – vad frågar man efter: en sak, en plats, en person, en tid, hur eller varför?` };
    case 'preposition':
      return { title: 'Titta på bilden', text: `Det du valde betyder "${SV_PREP[g]}". Titta på bilden igen – var är den?` };
    case 'do-does':
      return { title: 'Fel hjälpverb', text: `"${g}" hör ihop med ${DO_USE[g]}. Vem handlar meningen om?` };
    case 'glomt-do':
      return { title: 'Ett litet hjälpverb behövs', text: q.sentence?.startsWith('___') ? 'När man frågar något på engelska behövs ett litet hjälpverb först – inte am, is eller are när det finns ett annat verb i meningen.' : 'När man säger "inte" på engelska behövs ett litet hjälpverb före not.' };
    case 'svensk-ordfoljd':
      return { title: 'Svensk ordföljd!', text: 'Så säger man på svenska, men inte på engelska. På engelska kommer den som gör något (I, we, she) före verbet – även när meningen börjar med "today" eller "now". Och ord som always och never står före verbet.' };
    case 'ordfoljd':
      return { title: 'Fel ordning', text: 'Orden står i fel ordning. På engelska är ordningen nästan alltid: vem – gör – vad.' };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function hint(q: PQ): string {
  switch (q.topic) {
    case 'artikel': return 'Säg ordet efter luckan högt. Börjar det med ett vokalljud?';
    case 'vara': return 'Vem handlar meningen om: jag, en person eller sak, eller flera?';
    case 'plural': return 'De flesta ord får -s när de är flera. Några ord byter form i stället!';
    case 's-form': return 'Är det he, she, it eller ett namn? Då får verbet -s.';
    case 'fragord': return 'Titta på svaret efter tankstrecket. Är det en plats, en tid, en person eller en sak?';
    case 'prep': return 'Titta noga på bilden. Var är den?';
    case 'neka': return 'Vem handlar meningen om – en person (he, she, it) eller flera?';
    case 'ordfoljd': case 'bygg': return 'Vem gör något? På engelska kommer det ordet före verbet.';
  }
}

export function solution(q: PQ): string {
  if (q.topic === 'ordfoljd') return `Rätt: ${q.answer}`;
  if (q.topic === 'bygg') return `Rätt: ${capFirst(q.answer)}${q.svensk?.length ? `. På svenska blir ordföljden en annan – men på engelska kommer den som gör något före verbet.` : ''}`;
  if (q.topic === 'plural') return `${q.sentence!.replace('___', q.answer)}`;
  if (q.topic === 'prep') return `${fill(q.sentence!, q.answer)} (${SV_PREP[q.answer]})`;
  return capFirst(fill(q.sentence!, q.answer));
}
