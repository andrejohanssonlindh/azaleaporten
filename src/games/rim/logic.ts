import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { avoid, deckPick, mentions } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { BETYDELSER, ORDPAR, RIM, SAMMANSATTA, UTTRYCK, VERS } from './ord';

// Rimbäcken: rim, motsatser, synonymer, sammansatta ord, ord med flera betydelser och uttryck.
// Alla frågor är val. Varje fel alternativ bär sin felkod, så diagnosen kommer från innehållet.
// Färdighets-id:n ('sv.ord.<ämne>') och felkoder är permanenta.

/** Frågetyperna. vers = fyll i rimmet, ordet = vad heter det sammansatta ordet. */
export type Topic = 'rim' | 'vers' | 'motsats' | 'synonym' | 'sammansatt' | 'ordet' | 'betydelse' | 'uttryck';

export interface RQ extends OrdQ {
  topic: Topic;
  /** Raden i innehållet (för tester). */
  row: number;
  /** Ordet frågan handlar om: rimordet, ordet i första raden, ordet som ska ha en motsats osv. Aldrig svaret. */
  word: string;
  /** Sammansatta ord: sista delen, och ordet med en/ett ("en bokhylla"). */
  last?: string;
  named?: string;
}

const SKILL: Record<Topic, string> = {
  rim: 'rim', vers: 'rim', motsats: 'motsats', synonym: 'synonym', sammansatt: 'sammansatt', ordet: 'sammansatt', betydelse: 'betydelse', uttryck: 'uttryck',
};

export const ERR: Record<string, string> = {
  'rim-borjan': 'Väljer ett ord som börjar likadant i stället för att rimma',
  'rim-nastan': 'Nästan rim: samma vokal men olika slut',
  'inte-rim': 'Väljer ett ord som inte rimmar',
  'rim-betydelse': 'Väljer ett ord som passar men inte rimmar',
  tvartom: 'Blandar ihop motsats och synonym',
  narliggande: 'Väljer ett ord som bara hör till samma ämne',
  'forsta-delen': 'Tror att första delen bestämmer vad ordet är',
  'fel-betydelse': 'Gissar en betydelse som inte stämmer',
  'annan-betydelse': 'Väljer en annan betydelse av ordet',
  bokstavligt: 'Tar uttrycket bokstavligt',
};

/** Felkoder som en boss kan sikta på, och frågetyperna som kan ge dem. */
const TRAP_TOPICS: Record<string, Topic[]> = {
  tvartom: ['motsats', 'synonym'],
  bokstavligt: ['uttryck'],
  'rim-borjan': ['rim', 'vers'],
  'forsta-delen': ['sammansatt', 'ordet'],
};

/* ---------- innehållet som frågetyper ---------- */

const RIM_WORDS = RIM.flatMap(([rime, words], g) => words.map((w) => ({ w, g, rime })));
const vowelOf = (rime: string) => [...rime].find((c) => 'aeiouyåäö'.includes(c))!;

const band = (t: Topic, i: number): 1 | 2 =>
  t === 'motsats' || t === 'synonym' ? ORDPAR[i][4] : t === 'sammansatt' || t === 'ordet' ? SAMMANSATTA[i][5] : t === 'uttryck' ? UTTRYCK[i][4] : 1;

const size: Record<Topic, number> = {
  rim: RIM_WORDS.length, vers: VERS.length, motsats: ORDPAR.length, synonym: ORDPAR.length,
  sammansatt: SAMMANSATTA.length, ordet: SAMMANSATTA.length, betydelse: BETYDELSER.length, uttryck: UTTRYCK.length,
};

/** Frågetyperna i ett läge. Nivå 0 = det lättaste; nivå 1+ = svårare frågetyper och alla ord. */
function topicsFor(mode: string, level: number): Topic[] {
  switch (mode) {
    case 'rim': return [level === 0 ? 'rim' : 'vers'];
    case 'motsats': return ['motsats'];
    case 'synonym': return ['synonym'];
    case 'tvartom': return ['motsats', 'synonym'];
    case 'sammansatt': return [level === 0 ? 'sammansatt' : 'ordet'];
    case 'betydelse': return ['betydelse'];
    case 'uttryck': return ['uttryck'];
    default: // blandat
      return level === 0 ? ['rim', 'motsats', 'synonym', 'sammansatt']
        : level === 1 ? ['vers', 'motsats', 'synonym', 'sammansatt', 'ordet', 'uttryck']
          : ['vers', 'motsats', 'synonym', 'ordet', 'betydelse', 'uttryck'];
  }
}

interface Item { t: Topic; i: number }

export function items(mode: string, level: number, trap?: string): Item[] {
  const ok = (t: Topic, i: number) => level > 0 || band(t, i) === 1;
  const of = (ts: Topic[]) => ts.flatMap((t) => Array.from({ length: size[t] }, (_, i) => ({ t, i })).filter(({ t, i }) => ok(t, i)));
  const all = of(topicsFor(mode, level));
  if (!trap || !TRAP_TOPICS[trap]) return all;
  const hit = all.filter((x) => TRAP_TOPICS[trap].includes(x.t));
  return hit.length ? hit : of(TRAP_TOPICS[trap]);
}

/* ---------- frågor ---------- */

/** Svaret först, sedan felen; fällan (om den finns) alltid med. Alternativen blandas. */
function choose(rng: Rng, right: string, wrong: Alt[], trap?: string, n = 2): Alt[] {
  const seen = new Set([right.toLocaleLowerCase('sv')]);
  const uniq = wrong.filter((a) => { const k = a.text.toLocaleLowerCase('sv'); return seen.has(k) ? false : (seen.add(k), true); });
  const first = uniq.filter((a) => a.err === trap);
  const rest = rng.shuffle(uniq.filter((a) => a.err !== trap));
  return rng.shuffle([{ text: right }, ...[...first, ...rest].slice(0, n)]);
}

function rimQ(i: number, rng: Rng, trap?: string): Omit<RQ, 'mode' | 'level' | 'skill' | 'topic' | 'row'> {
  const { w, g, rime } = RIM_WORDS[i];
  const right = rng.pick(RIM[g][1].filter((x) => x !== w));
  const others = RIM_WORDS.filter((x) => x.g !== g);
  const start2 = others.filter((x) => x.w.slice(0, 2) === w.slice(0, 2));
  const start1 = others.filter((x) => x.w[0] === w[0]);
  const near = others.filter((x) => vowelOf(x.rime) === vowelOf(rime));
  const wrong: Alt[] = [];
  const startPick = start2.length ? start2 : start1;
  if (startPick.length) wrong.push({ text: rng.pick(startPick).w, err: 'rim-borjan' });
  const unused = (xs: typeof others) => xs.filter((x) => !wrong.some((a) => a.text === x.w));
  if (unused(near).length) wrong.push({ text: rng.pick(unused(near)).w, err: 'rim-nastan' });
  while (wrong.length < 2) wrong.push({ text: rng.pick(unused(others)).w, err: 'inte-rim' });
  const alts = choose(rng, right, wrong, trap);
  const prompt = `Vilket ord rimmar på "${w}"?`;
  return { kind: 'val', prompt, answer: right, alts, word: w, say: `Vilket ord rimmar på ${w}? ${alts.map((a) => a.text).join('. ')}.` };
}

function versQ(i: number, rng: Rng, trap?: string) {
  const [verse, answer, meaning, start] = VERS[i];
  const word = verse.split('\n')[0].replace(/[,.!?]+$/, '').split(' ').at(-1)!;
  const alts = choose(rng, answer, [{ text: meaning, err: 'rim-betydelse' }, { text: start, err: 'rim-borjan' }], trap);
  return { kind: 'val' as const, prompt: 'Vilket ord fattas? Det ska rimma.', sentence: verse, answer, alts, word, say: verse.replace('___', '…').replace('\n', ' ') };
}

function parQ(t: 'motsats' | 'synonym', i: number, rng: Rng, trap?: string) {
  const [word, syn, ant, rel] = ORDPAR[i];
  const answer = t === 'motsats' ? ant : syn;
  const alts = choose(rng, answer, [{ text: t === 'motsats' ? syn : ant, err: 'tvartom' }, { text: rel, err: 'narliggande' }], trap);
  const prompt = t === 'motsats' ? `Vad är motsatsen till "${word}"?` : `Vilket ord betyder nästan samma sak som "${word}"?`;
  return { kind: 'val' as const, prompt, answer, alts, word, say: prompt };
}

function sammansattQ(t: 'sammansatt' | 'ordet', i: number, rng: Rng, trap?: string) {
  const [art, raw, desc, flipDesc, flipWord] = SAMMANSATTA[i];
  const word = raw.replace('|', '');
  const last = raw.split('|')[1];
  const named = art ? `${art} ${word}` : word;
  const other = SAMMANSATTA[(i + 1 + rng.int(SAMMANSATTA.length - 1)) % SAMMANSATTA.length];
  if (t === 'sammansatt') {
    const alts = choose(rng, desc, [{ text: flipDesc, err: 'forsta-delen' }, { text: other[2], err: 'fel-betydelse' }], trap);
    const prompt = `Vad är ${named}?`;
    return { kind: 'val' as const, prompt, answer: desc, alts, word, last, named, say: prompt };
  }
  const alts = choose(rng, word, [{ text: flipWord, err: 'forsta-delen' }, { text: other[1].replace('|', ''), err: 'fel-betydelse' }], trap);
  return { kind: 'val' as const, prompt: 'Vilket ord betyder så här?', sentence: desc, answer: word, alts, word: desc, last, named, say: `Vilket ord betyder ${desc}?` };
}

function betydelseQ(i: number, rng: Rng, trap?: string) {
  const [word, sentence, meaning, others] = BETYDELSER[i];
  const strange = BETYDELSER.filter((r) => r[0] !== word).map((r) => r[2]);
  const wrong: Alt[] = [...others.map((text) => ({ text, err: 'annan-betydelse' }))];
  if (wrong.length < 2) wrong.push({ text: rng.pick(strange), err: 'fel-betydelse' });
  const prompt = `Vad betyder "${word}" i meningen?`;
  return { kind: 'val' as const, prompt, sentence, answer: meaning, alts: choose(rng, meaning, wrong, trap), word, say: `${prompt} ${sentence}` };
}

function uttryckQ(i: number, rng: Rng, trap?: string) {
  const [phrase, meaning, literal, other] = UTTRYCK[i];
  const alts = choose(rng, meaning, [{ text: literal, err: 'bokstavligt' }, { text: other, err: 'fel-betydelse' }], trap);
  return { kind: 'val' as const, prompt: 'Vad betyder uttrycket?', sentence: `"${phrase}"`, answer: meaning, alts, word: phrase, say: `Vad betyder uttrycket ${phrase}?` };
}

export function build(t: Topic, i: number, rng: Rng, trap?: string) {
  switch (t) {
    case 'rim': return rimQ(i, rng, trap);
    case 'vers': return versQ(i, rng, trap);
    case 'motsats': case 'synonym': return parQ(t, i, rng, trap);
    case 'sammansatt': case 'ordet': return sammansattQ(t, i, rng, trap);
    case 'betydelse': return betydelseQ(i, rng, trap);
    case 'uttryck': return uttryckQ(i, rng, trap);
  }
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): RQ {
  const level = Math.max(0, Math.min(2, spec.level));
  const pool = items(spec.mode, level, spec.trap);
  const { t, i } = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  return { mode: spec.mode, level, skill: `sv.ord.${SKILL[t]}`, topic: t, row: i, ...build(t, i, rng, spec.trap) };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case 'sv.ord.rim': return [{ mode: 'rim', level: 0 }, { mode: 'rim', level: 1 }];
    case 'sv.ord.motsats': return [{ mode: 'motsats', level: 0 }, { mode: 'motsats', level: 1 }];
    case 'sv.ord.synonym': return [{ mode: 'synonym', level: 0 }, { mode: 'synonym', level: 1 }];
    case 'sv.ord.sammansatt': return [{ mode: 'sammansatt', level: 0 }, { mode: 'sammansatt', level: 1 }];
    case 'sv.ord.betydelse': return [{ mode: 'betydelse', level: 0 }];
    case 'sv.ord.uttryck': return [{ mode: 'uttryck', level: 0 }, { mode: 'uttryck', level: 1 }];
    default: return [];
  }
}

/** Ingen rättning av skrivna svar behövs: alla frågor är val, och felen står på alternativen. */
export const diagnose = (): string | undefined => undefined;

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

/** Ett exempelpar där inget av orden är svaret eller frågans ord. */
function pair(q: RQ, pairs: [string, string][]): string {
  const p = pairs.find(([a, b]) => ![a, b].some((x) => mentions(q.answer, x) || mentions(q.word, x))) ?? pairs[0];
  return `"${p[0]} – ${p[1]}"`;
}
const MOTSATSER: [string, string][] = [['upp', 'ner'], ['dag', 'natt'], ['ja', 'nej'], ['först', 'sist']];
const SYNONYMER: [string, string][] = [['kompis', 'vän'], ['prata', 'snacka'], ['springa', 'rusa'], ['titta', 'kika']];
const RIMPAR: [string, string][] = [['sol', 'stol'], ['hus', 'mus'], ['katt', 'hatt'], ['sten', 'ben']];
// Sammansatta ord som inte finns bland frågorna, så att de aldrig är svaret.
const LEDER: [string, string][] = [['äppelpaj', 'paj'], ['ryggsäck', 'säck'], ['ostbit', 'bit'], ['blomkruka', 'kruka']];

function leder(q: RQ): string {
  const [a, b] = LEDER.filter(([w]) => !mentions(q.answer, w)).slice(0, 2);
  return `En ${a[0]} är en ${a[1]}, och en ${b[0]} är en ${b[1]}.`;
}

export function explain(tag: string, q: RQ): Explained {
  const motsats = q.topic === 'motsats';
  switch (tag) {
    case 'rim-borjan':
      return { title: 'Börjar likadant – men rimmar inte', text: `Ord som rimmar slutar likadant. Det är slutet som ska låta lika, inte början. Säg "${q.word}" högt och lyssna på slutet.` };
    case 'rim-nastan':
      return { title: 'Nästan!', text: `Vokalen låter likadant, men slutet är olika. Säg "${q.word}" och ditt ord högt. Låter slutet exakt lika?` };
    case 'inte-rim':
      return { title: 'Rimmar inte', text: `Säg "${q.word}" högt, och sedan alternativen. Vilket låter likadant i slutet, som ${pair(q, RIMPAR)}?` };
    case 'rim-betydelse':
      return { title: 'Passar – men rimmar inte', text: `Ordet passar i versen, men det rimmar inte. I en vers rimmar sista ordet på varje rad. Lyssna på "${q.word}" i första raden.` };
    case 'tvartom':
      return motsats
        ? { title: 'Tvärtomtrollet lurade dig!', text: `Det ordet betyder nästan samma sak som "${q.word}". En motsats betyder tvärtom, som ${pair(q, MOTSATSER)}.` }
        : { title: 'Tvärtomtrollet lurade dig!', text: `Det ordet betyder tvärtom mot "${q.word}". Här letar vi efter ett ord som betyder nästan samma sak, som ${pair(q, SYNONYMER)}.` };
    case 'narliggande':
      return { title: 'Hör ihop – men betyder inte samma sak', text: `Ordet hör ihop med "${q.word}", men det betyder inte ${motsats ? 'tvärtom' : 'samma sak'}. Prova att byta ut "${q.word}" mot ordet i en mening. Blir det ${motsats ? 'tvärtom' : 'nästan samma sak'}?` };
    case 'forsta-delen':
      return { title: 'Sista delen bestämmer', text: `I ett sammansatt ord berättar den sista delen vad det är. ${leder(q)} Vad är det då för sak vi letar efter?` };
    case 'annan-betydelse':
      return { title: 'Ordet har flera betydelser', text: 'Ordet kan betyda flera saker – och det du valde är en av dem! Men i den här meningen betyder det något annat. Läs meningen igen.' };
    case 'bokstavligt':
      return { title: 'Inte bokstavligt!', text: 'Ett uttryck betyder nästan aldrig det orden säger. Det handlar inte om riktiga saker. Tänk: när skulle någon säga så?' };
    case 'fel-betydelse':
      return {
        title: 'Inte riktigt',
        text: q.topic === 'uttryck' ? 'Tänk dig att någon säger så. Vad vill de säga med det?'
          : q.topic === 'betydelse' ? 'Läs meningen igen. Vilken betydelse passar just här?'
            : 'Titta på båda delarna i ordet. Vilken förklaring handlar om båda delarna?',
      };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function hint(q: RQ): string {
  switch (q.topic) {
    case 'rim': return `Säg orden högt. Ord som rimmar låter likadant i slutet, som ${pair(q, RIMPAR)}.`;
    case 'vers': return 'Lyssna på sista ordet i första raden. Ordet som fattas ska rimma på det.';
    case 'motsats': return `En motsats betyder tvärtom, som ${pair(q, MOTSATSER)}.`;
    case 'synonym': return `En synonym betyder nästan samma sak, som ${pair(q, SYNONYMER)}.`;
    case 'sammansatt': case 'ordet': return avoid(q.answer, 'Den sista delen i ett sammansatt ord berättar vad det är.', 'Sista delen i ordet berättar vad det är för sak.');
    case 'betydelse': return 'Läs hela meningen. Vilken betydelse passar just här?';
    case 'uttryck': return 'Ett uttryck betyder oftast något annat än orden säger. När skulle någon säga så?';
  }
}

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv') + s.slice(1);

export function solution(q: RQ): string {
  switch (q.topic) {
    case 'rim': case 'vers': return `"${q.answer}" rimmar på "${q.word}".`;
    case 'motsats': return `Motsatsen till "${q.word}" är "${q.answer}".`;
    case 'synonym': return `"${q.answer}" betyder nästan samma sak som "${q.word}".`;
    case 'sammansatt': return `${cap(q.named!)} är ${q.answer}. Sista delen, "${q.last}", berättar vad det är.`;
    case 'ordet': return `${cap(q.named!)} är ${q.word}. Sista delen, "${q.last}", berättar vad det är.`;
    case 'betydelse': return `Här betyder "${q.word}": ${q.answer}.`;
    case 'uttryck': return `"${q.word}" betyder: ${q.answer}.`;
  }
}
