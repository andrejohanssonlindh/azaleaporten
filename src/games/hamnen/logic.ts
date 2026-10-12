import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { avoid, deckPick } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { ANTAL, DJUR, FARGER, FORVAXLA_FRAGA, FORVAXLAS, FRAGOR, FRASER, INSTRUKTIONER, LJUD, numWord, SAKER, STAVAS, VAR, VEM } from './fraser';

// Hamnen: lyssna på engelska och välj. Alla frågor är hörfrågor (listen): det engelska läses upp och står
// inte utskrivet, utom när enheten saknar en engelsk röst – då läser barnet i stället.
// Färdighets-id:n ('en.lyssna.<ämne>') och felkoder är permanenta.

export type Topic = 'siffror' | 'bokstaver' | 'stava' | 'fraser' | 'instruktioner' | 'fragor' | 'meningar';

export interface HQ extends OrdQ {
  topic: Topic;
  /** Vilket kort i kortleken (för tester). */
  row: string;
  /** Det engelska som hörs. */
  en: string;
  /** Talet (siffror), bokstaven (bokstaver), eller den fras som lätt blandas ihop med den här. */
  twin?: string;
}

const SKILL: Record<Topic, string> = {
  siffror: 'siffror', bokstaver: 'bokstaver', stava: 'bokstaver', fraser: 'fraser', instruktioner: 'instruktioner', fragor: 'fragor', meningar: 'meningar',
};

export const ERR: Record<string, string> = {
  'teen-ty': 'Blandar ihop -teen och -ty (thirteen och thirty)',
  'fel-tal': 'Hör fel tal',
  bokstavsljud: 'Tror att en engelsk bokstav heter som den svenska',
  'fel-bokstav': 'Hör fel bokstav',
  'liknande-fras': 'Blandar ihop två fraser som låter nästan likadant',
  'fel-fras': 'Förstår inte frasen',
  fragord: 'Lyssnar inte på frågeordet (what, where, who …)',
  'fel-svar': 'Svaret passar inte till frågan',
  preposition: 'Hör fel på on, under, in, behind eller next to',
  'fel-ord': 'Hör fel på ett av orden',
  pronomen: 'Blandar ihop he och she (eller I och you)',
};

/* ---------- korten i ett läge ---------- */

type Card = { t: Topic; i: number; k?: string };

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const TEENS = range(13, 19);
const TIOTAL = [20, 30, 40, 50, 60, 70, 80, 90];
const LETTERS = Object.keys(LJUD);

/** Meningskorten: k = mall ('var', 'har', 'antal'), i = delarna kodade som ett tal. */
function meningar(level: number): Card[] {
  const out: Card[] = [];
  const preps = level === 0 ? 3 : VAR.prep.length;
  for (let a = 0; a < VAR.saker.length; a++) for (let b = 0; b < preps; b++) for (let c = 0; c < VAR.plats.length; c++) out.push({ t: 'meningar', k: 'var', i: a * 100 + b * 10 + c });
  const vem = level === 0 ? 4 : VEM.length;
  for (let a = 0; a < vem; a++) for (let b = 0; b < FARGER.length; b++) for (let c = 0; c < SAKER.length; c++) out.push({ t: 'meningar', k: 'har', i: a * 100 + b * 10 + c });
  if (level > 0) for (let a = 0; a < VEM.length; a++) for (let b = 0; b < ANTAL.length; b++) for (let c = 0; c < DJUR.length; c++) out.push({ t: 'meningar', k: 'antal', i: a * 100 + b * 10 + c });
  return out;
}

const rows = <T extends unknown[]>(t: Topic, list: T[], level: number, band: (r: T) => number) =>
  list.map((r, i) => ({ r, i })).filter(({ r }) => level > 0 || band(r) === 1).map(({ i }) => ({ t, i }));

function cardsFor(topic: Topic, level: number): Card[] {
  switch (topic) {
    case 'siffror':
      return (level === 0 ? range(0, 12) : level === 1 ? [...TEENS, ...TIOTAL, 100] : [...TEENS, ...TIOTAL, ...range(21, 99).filter((n) => n % 10)]).map((i) => ({ t: 'siffror', i }));
    case 'bokstaver': return LETTERS.map((_, i) => ({ t: 'bokstaver', i }));
    case 'stava': return STAVAS.map((_, i) => ({ t: 'stava', i }));
    case 'fraser': return rows('fraser', FRASER, level, (r) => r[3]);
    case 'instruktioner': return rows('instruktioner', INSTRUKTIONER, level, (r) => r[3]);
    case 'fragor': return rows('fragor', FRAGOR, level, (r) => r[3]);
    case 'meningar': return meningar(level);
  }
}

/** Ämnena i ett läge. 'bokstaver' på nivå 1 = ord som stavas högt. */
function topicsFor(mode: string, level: number): [Topic, number][] {
  switch (mode) {
    case 'bokstaver': return level === 0 ? [['bokstaver', 0]] : [['stava', 1]];
    case 'siffror': case 'fraser': case 'instruktioner': case 'fragor': case 'meningar': return [[mode, level]];
    default: // blandat
      return level === 0
        ? [['siffror', 0], ['bokstaver', 0], ['fraser', 0], ['instruktioner', 0], ['fragor', 0], ['meningar', 0]]
        : [['siffror', 2], ['stava', 1], ['fraser', 1], ['instruktioner', 1], ['fragor', 1], ['meningar', 1]];
  }
}

export function cards(mode: string, level: number, trap?: string): Card[] {
  if (trap === 'teen-ty') return [...TEENS, ...TIOTAL.filter((n) => n >= 30)].map((i) => ({ t: 'siffror', i }));
  if (trap === 'bokstavsljud') return [...Object.keys(FORVAXLAS).map((l) => ({ t: 'bokstaver' as Topic, i: LETTERS.indexOf(l) })), ...(level > 0 ? cardsFor('stava', 1) : [])];
  const lv = Math.max(0, Math.min(2, level));
  return topicsFor(mode, lv).flatMap(([t, l]) => cardsFor(t, l));
}

/* ---------- frågor ---------- */

/** Rätt svar först, sedan felen (fällan alltid med). Alternativen blandas. */
function choose(rng: Rng, right: string, wrong: Alt[], trap: string | undefined, n: number): Alt[] {
  const seen = new Set([right.toLocaleLowerCase('sv')]);
  const uniq = wrong.filter((a) => { const k = a.text.toLocaleLowerCase('sv'); return seen.has(k) ? false : (seen.add(k), true); });
  const first = uniq.filter((a) => a.err === trap).slice(0, 1);
  const rest = uniq.filter((a) => !first.includes(a));
  // Det första felet i listan är det "bästa" (det som speglar missuppfattningen); resten blandas.
  const ordered = [...first, ...rest.slice(0, 1), ...rng.shuffle(rest.slice(1))];
  return rng.shuffle([{ text: right }, ...ordered.slice(0, n)]);
}

type Built = Omit<HQ, 'mode' | 'level' | 'skill' | 'topic' | 'row' | 'kind' | 'listen' | 'lang'>;

function sifferQ(n: number, lv: number, rng: Rng): Built {
  const wrong: Alt[] = [];
  if (n >= 13 && n <= 19) wrong.push({ text: String((n - 10) * 10), err: 'teen-ty' });
  if (n >= 30 && n <= 90 && n % 10 === 0) wrong.push({ text: String(n / 10 + 10), err: 'teen-ty' });
  const near = n < 13 ? [n - 1, n + 1, n + 2, n - 2, n + 3] : n % 10 ? [n + 10, n - 10, n + 1, n - 1] : [n + 10, n - 10, n + 1, n - 20, n - 1];
  for (const m of rng.shuffle(near.filter((m) => m >= 0 && m <= 100 && m !== n))) wrong.push({ text: String(m), err: 'fel-tal' });
  const en = numWord(n);
  return { prompt: 'Lyssna! Vilket tal hör du?', answer: String(n), alts: choose(rng, String(n), wrong, 'teen-ty', lv >= 2 ? 3 : 2), say: en, read: en, en };
}

function bokstavQ(i: number, rng: Rng): Built {
  const l = LETTERS[i];
  const wrong: Alt[] = [];
  if (FORVAXLAS[l]) wrong.push({ text: FORVAXLAS[l], err: 'bokstavsljud' });
  for (const x of rng.shuffle(LETTERS.filter((x) => x !== l && x !== FORVAXLAS[l])).slice(0, 3)) wrong.push({ text: x, err: 'fel-bokstav' });
  return { prompt: 'Lyssna! Vilken bokstav hör du?', answer: l, alts: choose(rng, l, wrong, 'bokstavsljud', 2), say: l, read: l, en: l };
}

function stavaQ(i: number, rng: Rng): Built {
  const [word, trap, other] = STAVAS[i];
  const letters = word.toUpperCase().split('');
  return {
    prompt: 'Lyssna! Ordet stavas bokstav för bokstav. Vilket ord är det?', answer: word,
    alts: choose(rng, word, [{ text: trap, err: 'bokstavsljud' }, { text: other, err: 'fel-bokstav' }], 'bokstavsljud', 2),
    say: letters.join(', '), read: letters.join(' – '), en: word, twin: trap,
  };
}

function fraseQ(t: 'fraser' | 'instruktioner', i: number, lv: number, rng: Rng): Built {
  const list = t === 'fraser' ? FRASER : INSTRUKTIONER;
  const [en, sv, twin] = list[i];
  const tw = list.find((r) => r[0] === twin)!;
  const others = list.filter((r) => r[0] !== en && r[0] !== twin && (lv > 0 || r[3] === 1)).map((r) => ({ text: r[1], err: 'fel-fras' }));
  return {
    prompt: t === 'fraser' ? 'Lyssna! Vad betyder det?' : 'Hör efter! Vad ska du göra?', answer: sv,
    alts: choose(rng, sv, [{ text: tw[1], err: 'liknande-fras' }, ...others], undefined, lv >= 1 ? 3 : 2), say: en, read: en, en, twin,
  };
}

function fragaQ(i: number, lv: number, rng: Rng): Built {
  const [q, a, kind] = FRAGOR[i];
  const near = FORVAXLA_FRAGA[kind] ?? [];
  const traps = FRAGOR.filter((r) => near.includes(r[2]) && r[1] !== a).map((r) => ({ text: r[1], err: 'fragord' }));
  const others = FRAGOR.filter((r) => r[2] !== kind && !near.includes(r[2])).map((r) => ({ text: r[1], err: 'fel-svar' }));
  return {
    prompt: 'Lyssna på frågan! Vilket svar passar?', answer: a,
    alts: choose(rng, a, [...rng.shuffle(traps).slice(0, 1), ...others], 'fragord', lv >= 1 ? 3 : 2), say: q, read: q, en: q,
  };
}

/** En annan del än nummer i ur listan. */
const otherIdx = (rng: Rng, n: number, i: number, max = n) => { const k = rng.int(max - 1); return k >= i ? k + 1 : k; };

function meningQ(k: string, code: number, lv: number, rng: Rng): Built {
  const a = Math.floor(code / 100), b = Math.floor(code / 10) % 10, c = code % 10;
  let en: string, right: (a: number, b: number, c: number) => string;
  const wrong: Alt[] = [];
  if (k === 'var') {
    right = (x, y, z) => `${VAR.saker[x][1]} är ${VAR.prep[y][1]} ${VAR.plats[z][1]}.`;
    en = `The ${VAR.saker[a][0]} is ${VAR.prep[b][0]} the ${VAR.plats[c][0]}.`;
    const preps = lv === 0 ? 3 : VAR.prep.length;
    wrong.push({ text: right(a, otherIdx(rng, preps, b), c), err: 'preposition' });
    wrong.push({ text: right(otherIdx(rng, VAR.saker.length, a), b, c), err: 'fel-ord' });
    wrong.push({ text: right(a, b, otherIdx(rng, VAR.plats.length, c)), err: 'fel-ord' });
  } else {
    const swap = [1, 0, 3, 2, 5, 4][a]; // I ↔ You, He ↔ She, We ↔ They
    const [p, , have] = VEM[a];
    if (k === 'har') {
      right = (x, y, z) => `${VEM[x][1]} har en ${FARGER[y][1]} ${SAKER[z][1]}.`;
      en = `${p} ${have} a ${FARGER[b][0]} ${SAKER[c][0]}.`;
      wrong.push({ text: right(a, otherIdx(rng, FARGER.length, b), c), err: 'fel-ord' });
      wrong.push({ text: right(a, b, otherIdx(rng, SAKER.length, c)), err: 'fel-ord' });
    } else {
      right = (x, y, z) => `${VEM[x][1]} har ${ANTAL[y][1]} ${DJUR[z][1]}.`;
      en = `${p} ${have} ${ANTAL[b][0]} ${DJUR[c][0]}.`;
      wrong.push({ text: right(a, otherIdx(rng, ANTAL.length, b), c), err: 'fel-tal' });
      wrong.push({ text: right(a, b, otherIdx(rng, DJUR.length, c)), err: 'fel-ord' });
    }
    wrong.push({ text: right(swap, b, c), err: 'pronomen' });
  }
  const answer = right(a, b, c);
  return { prompt: 'Lyssna! Vad betyder meningen?', answer, alts: choose(rng, answer, rng.shuffle(wrong), undefined, lv >= 1 ? 3 : 2), say: en, read: en, en };
}

function build(card: Card, lv: number, rng: Rng): Built {
  switch (card.t) {
    case 'siffror': return sifferQ(card.i, lv, rng);
    case 'bokstaver': return bokstavQ(card.i, rng);
    case 'stava': return stavaQ(card.i, rng);
    case 'fraser': case 'instruktioner': return fraseQ(card.t, card.i, lv, rng);
    case 'fragor': return fragaQ(card.i, lv, rng);
    case 'meningar': return meningQ(card.k!, card.i, lv, rng);
  }
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): HQ {
  const level = Math.max(0, Math.min(2, spec.level));
  const pool = cards(spec.mode, level, spec.trap);
  const card = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  const q = build(card, level, rng);
  return {
    mode: spec.mode, level, skill: `en.lyssna.${SKILL[card.t]}`, topic: card.t, row: `${card.k ?? ''}${card.i}`,
    kind: 'val', listen: true, lang: 'en-GB', ...q,
  };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case 'en.lyssna.siffror': return [{ mode: 'siffror', level: 0 }, { mode: 'siffror', level: 1 }, { mode: 'siffror', level: 2 }];
    case 'en.lyssna.bokstaver': return [{ mode: 'bokstaver', level: 0 }, { mode: 'bokstaver', level: 1 }];
    case 'en.lyssna.fraser': return [{ mode: 'fraser', level: 0 }, { mode: 'fraser', level: 1 }];
    case 'en.lyssna.instruktioner': return [{ mode: 'instruktioner', level: 0 }, { mode: 'instruktioner', level: 1 }];
    case 'en.lyssna.fragor': return [{ mode: 'fragor', level: 0 }, { mode: 'fragor', level: 1 }];
    case 'en.lyssna.meningar': return [{ mode: 'meningar', level: 0 }, { mode: 'meningar', level: 1 }];
    default: return [];
  }
}

export const diagnose = (): string | undefined => undefined;

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

/** Ett exempelpar -teen/-ty som inte innehåller svaret. */
function teenTy(q: HQ): string {
  const n = Number(q.answer);
  const [t, y] = [[16, 60], [17, 70], [18, 80], [14, 40]].find(([a, b]) => a !== n && b !== n)!;
  return `"${numWord(t)}" är ${t} och "${numWord(y)}" är ${y}`;
}

export function explain(tag: string, q: HQ, given: string): Explained {
  switch (tag) {
    case 'teen-ty':
      return { title: '-teen eller -ty?', text: `Lyssna på slutet! ${teenTy(q)}. -teen är långt och betonas i slutet. -ty är kort och betonas i början.` };
    case 'fel-tal':
      if (q.topic === 'meningar') return { title: 'Hur många?', text: 'Lyssna en gång till på talet i meningen. Hur många är det?' };
      return { title: 'Inte det talet', text: `Det var inte ${given}. Lyssna en gång till – säg talet tyst för dig själv på engelska.` };
    case 'bokstavsljud':
      if (q.topic === 'stava') return { title: 'Engelska bokstäver heter inte som svenska', text: `Engelska E låter som svenskt "ii", och engelska A låter som "ej". G och J byter nästan ljud med varandra. Lyssna igen!` };
      return { title: 'Engelska bokstäver heter inte som svenska', text: `Det var inte ${given}. På engelska låter ${given} som "${LJUD[given]}". Lyssna igen!` };
    case 'fel-bokstav':
      return q.topic === 'stava'
        ? { title: 'Inte riktigt', text: 'Lyssna på varje bokstav, en i taget. Vilket ord blir det?' }
        : { title: 'Inte den bokstaven', text: `Det var inte ${given}. På engelska låter ${given} som "${LJUD[given]}". Lyssna igen!` };
    case 'liknande-fras':
      return { title: 'Nästan!', text: `Det du valde är "${q.twin}" på engelska – det låter nästan likadant. Lyssna en gång till!` };
    case 'fel-fras':
      return { title: 'Inte riktigt', text: q.topic === 'instruktioner' ? 'Lyssna på varje ord. Vad vill de att du ska göra?' : 'Lyssna på varje ord. När säger man så?' };
    case 'fragord':
      return { title: 'Lyssna på frågeordet!', text: 'Det svaret passar till en annan fråga. Lyssna på början av frågan: what (vad), where (var), who (vem), when (när), how (hur)?' };
    case 'fel-svar':
      return { title: 'Passar inte', text: 'Lyssna på frågan igen. Vad vill de veta?' };
    case 'preposition':
      return { title: 'Var är den?', text: 'Lyssna på det lilla ordet som säger var: on (på), under, in (i), behind (bakom) eller next to (bredvid).' };
    case 'fel-ord':
      return { title: 'Lyssna en gång till', text: 'Nästan! Men ett av orden stämmer inte. Lyssna ord för ord.' };
    case 'pronomen':
      return { title: 'Vem?', text: avoid(q.answer, 'Lyssna på första ordet: he är han, she är hon, I är jag och you är du.', 'Lyssna på första ordet i meningen. Vem handlar det om?') };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function hint(q: HQ): string {
  switch (q.topic) {
    case 'siffror': return Number(q.answer) >= 13 ? 'Lyssna på slutet: -teen (tonåren) eller -ty (tiotalen)?' : 'Lyssna en gång till och räkna tyst på engelska tills du kommer till talet.';
    case 'bokstaver': return avoid(q.answer, 'Engelska bokstäver heter inte alltid som svenska. E låter som "ii" och A som "ej".', 'Engelska bokstäver heter inte alltid som svenska. Lyssna noga på ljudet.');
    case 'stava': return 'Skriv bokstäverna i luften medan du lyssnar.';
    case 'fraser': return 'Lyssna på hela frasen. När säger man så?';
    case 'instruktioner': return 'Lyssna på första ordet – det säger vad du ska göra.';
    case 'fragor': return 'Lyssna på första ordet i frågan: what, where, who, when eller how?';
    case 'meningar': return 'Lyssna ord för ord: vem, vad och var?';
  }
}

export function solution(q: HQ): string {
  switch (q.topic) {
    case 'siffror': return `"${q.en}" är ${q.answer}.`;
    case 'bokstaver': return `Du hörde ${q.answer}. Den låter som "${LJUD[q.answer]}" på engelska.`;
    case 'stava': return `${q.en.toUpperCase().split('').join(' – ')} blir ${q.answer}.`;
    case 'fragor': return `"${q.en}" – "${q.answer}"`;
    default: return `"${q.en}" betyder: ${q.answer}`;
  }
}
