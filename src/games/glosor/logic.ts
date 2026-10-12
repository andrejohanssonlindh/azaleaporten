import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { avoid, deckPick } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { FALSKA, LIKNAR, TEMAN, type Glosa } from './ord';

// Glosviken: engelska ord tema för tema. Alla frågor är val:
// - bild: bild → engelska ordet
// - hor: hör ordet → välj bild
// - sv-en: svenska ordet → engelska
// - en-sv: engelska ordet → vad det betyder
// - falsk: en falsk vän → vad det betyder
// Varje fel alternativ bär sin felkod. Färdighets-id:n ('en.glosor.<tema>') och felkoder är permanenta.

export type How = 'bild' | 'hor' | 'sv-en' | 'en-sv' | 'falsk';

export interface GQ extends OrdQ {
  /** Temat (falska vänner = 'falska'). */
  topic: string;
  how: How;
  en: string;
  sv: string;
  /** Raden i temat (eller i FALSKA). */
  row: number;
}

export const ERR: Record<string, string> = {
  'samma-tema': 'Väljer ett annat ord från samma tema',
  liknar: 'Blandar ihop ord som ser ut eller låter nästan likadant',
  'falsk-van': 'Luras av en falsk vän (ordet liknar ett svenskt ord)',
};

interface W { t: number; i: number; en: string; sv: string; pic: string; band: 1 | 2 }

const ALL: W[] = TEMAN.flatMap((tema, t) => tema.words.map(([en, sv, pic, band]: Glosa, i) => ({ t, i, en, sv, pic, band })));
const low = (s: string) => s.toLocaleLowerCase('sv');
const byEn = new Map(ALL.map((w) => [low(w.en), w]));
const bySv = new Map(ALL.map((w) => [low(w.sv), w]));

/** Ordets frågetyper: bildfrågor kräver en bild, översättning kräver att orden skiljer sig. */
function hows(w: W): How[] {
  const out: How[] = [];
  if (w.pic) out.push('bild', 'hor');
  if (low(w.en) !== low(w.sv)) out.push('sv-en', 'en-sv');
  return out;
}

/** Nivå 0 = bilder och svenska → engelska; nivå 1 = alla frågetyper; nivå 2 = alla ord (även band 2). */
const LEVEL_HOWS: How[][] = [['bild', 'hor', 'sv-en'], ['bild', 'hor', 'sv-en', 'en-sv'], ['bild', 'hor', 'sv-en', 'en-sv']];

/** De ord som ser ut eller låter som ordet. */
const twins = (en: string) => (LIKNAR.find((g) => g.includes(en)) ?? []).filter((x) => x !== en).map((x) => byEn.get(low(x))!);

/** Ett liknande ord som går att använda i frågetypen (hörfrågor behöver en bild). */
const twinsFor = (w: W, how: How) => twins(w.en).filter((x) => (how === 'hor' ? !!x.pic : how === 'en-sv' ? low(x.sv) !== low(w.sv) : true));

/** Ett kort i rundans kortlek: ett ord och en frågetyp, eller en falsk vän. */
export type Item = { w: W; how: How } | { f: number };

/**
 * Korten i ett läge: ett tema eller 'blandat'. Nivå under 2 tar bara band 1-ord
 * (ett tema utan band 1-ord tar alla sina ord, men 'blandat' hoppar då över temat).
 * Samma ord kan komma med flera frågetyper: först se det, sedan höra det.
 */
export function items(mode: string, level: number, trap?: string): Item[] {
  const lv = Math.max(0, Math.min(2, level));
  if (mode === 'falska' || trap === 'falsk-van') return FALSKA.map((_, f) => ({ f }));
  const temas = mode === 'blandat' ? TEMAN.map((_, t) => t) : [TEMAN.findIndex((x) => x.id === mode)].filter((t) => t >= 0);
  const words = ALL.filter((w) => temas.includes(w.t));
  const inBand = words.filter((w) => lv >= 2 || w.band === 1 || (mode !== 'blandat' && !ALL.some((x) => x.t === w.t && x.band === 1)));
  const cards = (ws: W[]) => ws.flatMap((w) => hows(w).filter((h) => LEVEL_HOWS[lv].includes(h)).map((how) => ({ w, how })));
  let pool: Item[] = cards(inBand);
  if (trap === 'liknar') {
    const hit = cards(inBand).filter(({ w, how }) => twinsFor(w, how).length);
    pool = hit.length ? hit : cards(ALL).filter(({ w, how }) => twinsFor(w, how).length);
  }
  if (mode === 'blandat' && lv >= 2 && !trap) pool = [...pool, ...FALSKA.map((_, f) => ({ f }))];
  return pool;
}

/* ---------- frågor ---------- */

/** Rätt svar och felen. Först fällan, sedan en falsk vän och ett liknande ord (de bästa felen), sedan resten. Alternativen blandas. */
function choose(rng: Rng, right: Alt, wrong: Alt[], trap: string | undefined, n: number): Alt[] {
  const seen = new Set([low(right.text)]);
  const uniq = wrong.filter((a) => { const k = low(a.text); return seen.has(k) ? false : (seen.add(k), true); });
  const first: Alt[] = [];
  for (const tag of [trap, 'falsk-van', 'liknar']) {
    const a = tag && uniq.find((x) => x.err === tag && !first.includes(x));
    if (a) first.push(a);
  }
  const rest = rng.shuffle(uniq.filter((a) => !first.includes(a)));
  return rng.shuffle([right, ...[...first, ...rest].slice(0, n)]);
}

function wordQ(w: W, how: How, lv: number, rng: Rng, trap?: string): Omit<GQ, 'mode' | 'level' | 'skill'> {
  const n = lv >= 2 ? 3 : 2;
  // Fel från samma tema och samma band (så att alternativen är ord barnet kan ha mött).
  const mates = ALL.filter((x) => x.t === w.t && x !== w && (lv >= 2 || x.band === w.band));
  const tw = twinsFor(w, how);
  const base = { topic: TEMAN[w.t].id, how, en: w.en, sv: w.sv, row: w.i };
  switch (how) {
    case 'bild': case 'sv-en': {
      const wrong: Alt[] = [...tw.map((x) => ({ text: x.en, err: 'liknar' })), ...mates.map((x) => ({ text: x.en, err: 'samma-tema' }))];
      const alts = choose(rng, { text: w.en }, wrong, trap, n);
      const say = alts.map((a) => a.text).join('. ');
      return how === 'bild'
        ? { ...base, kind: 'val', prompt: 'Vad heter det här på engelska?', pic: w.pic, answer: w.en, alts, say, lang: 'en-GB' }
        : { ...base, kind: 'val', prompt: `Vad heter "${w.sv}" på engelska?`, answer: w.en, alts, say, lang: 'en-GB' };
    }
    case 'en-sv': {
      const falsk = FALSKA.find(([en]) => en === w.en);
      const wrong: Alt[] = [
        ...(falsk ? [{ text: falsk[2], err: 'falsk-van' }] : []),
        ...tw.map((x) => ({ text: x.sv, err: 'liknar' })),
        ...mates.filter((x) => low(x.sv) !== low(x.en)).map((x) => ({ text: x.sv, err: 'samma-tema' })),
      ];
      const alts = choose(rng, { text: w.sv }, wrong, trap, n);
      return { ...base, kind: 'val', prompt: `Vad betyder "${w.en}"?`, answer: w.sv, alts, say: w.en, lang: 'en-GB' };
    }
    case 'hor': {
      const wrong: Alt[] = [...tw.map((x) => ({ text: x.en, pic: x.pic, err: 'liknar' })), ...mates.filter((x) => x.pic).map((x) => ({ text: x.en, pic: x.pic, err: 'samma-tema' }))];
      const alts = choose(rng, { text: w.en, pic: w.pic }, wrong, trap, n);
      return { ...base, kind: 'val', prompt: 'Lyssna! Vilken bild är det?', listen: true, answer: w.en, alts, say: w.en, read: w.en, lang: 'en-GB' };
    }
    default: throw new Error(how);
  }
}

function falskQ(f: number, lv: number, rng: Rng, trap?: string): Omit<GQ, 'mode' | 'level' | 'skill'> {
  const [en, sv, false_] = FALSKA[f];
  const others = FALSKA.filter((_, k) => k !== f).map(([, s]) => ({ text: s, err: 'samma-tema' }));
  const alts = choose(rng, { text: sv }, [{ text: false_, err: 'falsk-van' }, ...others], trap, lv >= 2 ? 3 : 2);
  return { topic: 'falska', how: 'falsk', en, sv, row: f, kind: 'val', prompt: `Vad betyder "${en}" på engelska?`, answer: sv, alts, say: en, lang: 'en-GB' };
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): GQ {
  const level = Math.max(0, Math.min(2, spec.level));
  const pool = items(spec.mode, level, spec.trap);
  const it = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  const q = 'f' in it ? falskQ(it.f, level, rng, spec.trap) : wordQ(it.w, it.how, level, rng, spec.trap);
  return { mode: spec.mode, level, skill: `en.glosor.${q.topic}`, ...q };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const m = /^en\.glosor\.(.+)$/.exec(skill);
  if (!m) return [];
  if (m[1] === 'falska') return [{ mode: 'falska', level: 2 }];
  return TEMAN.some((t) => t.id === m[1]) ? [{ mode: m[1], level: 0 }, { mode: m[1], level: 2 }] : [];
}

/** Inga skrivna svar: felen står på alternativen. */
export const diagnose = (): string | undefined => undefined;

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

const temaOf = (q: GQ) => (q.topic === 'falska' ? 'falska vänner' : TEMAN.find((t) => t.id === q.topic)!.name.toLocaleLowerCase('sv'));

export function explain(tag: string, q: GQ, given: string): Explained {
  const asEn = byEn.get(low(given));
  const asSv = bySv.get(low(given));
  switch (tag) {
    case 'falsk-van':
      return { title: 'En falsk vän!', text: `"${q.en}" ser ut som ett svenskt ord, men det är en falsk vän. På engelska betyder det något helt annat. Tänk på engelska!` };
    case 'liknar':
      if (q.how === 'hor') return { title: 'Det låter nästan likadant', text: `Bilden du valde heter "${given}" på engelska. Det låter nästan som ordet du hörde – lyssna noga på varje ljud.` };
      if (q.how === 'en-sv') return { title: 'Ser nästan likadant ut', text: `Du tänkte nog på "${asSv?.en ?? given}" – det ser nästan likadant ut! Titta noga på varje bokstav i "${q.en}".` };
      return { title: 'Ser nästan likadant ut', text: `"${given}" ser nästan likadant ut, men det betyder "${asEn?.sv ?? '?'}". Titta noga på varje bokstav.` };
    case 'samma-tema':
      if (q.how === 'falsk') return { title: 'Inte riktigt', text: avoid(q.answer, `Det är vad ett annat ord betyder. Läs "${q.en}" igen – vad betyder det på engelska?`, 'Läs ordet igen. Vad betyder det på engelska?') };
      if (q.how === 'hor') return { title: 'Inte den bilden', text: `Bilden du valde heter "${given}" på engelska. Lyssna en gång till!` };
      if (q.how === 'en-sv') return { title: 'Inte riktigt', text: `"${given}" heter "${asSv?.en ?? '?'}" på engelska. Läs ordet "${q.en}" igen.` };
      return { title: 'Inte riktigt', text: `"${given}" hör också till ${temaOf(q)}, men det betyder "${asEn?.sv ?? '?'}".` };
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function hint(q: GQ): string {
  switch (q.how) {
    case 'bild': case 'sv-en': return `Det engelska ordet börjar på "${q.en.charAt(0)}".`;
    case 'en-sv': return avoid(q.answer, `Ordet hör till ${temaOf(q)}. Säg det högt – låter det som något du känner igen?`, 'Säg ordet högt – låter det som något du känner igen?');
    case 'hor': return `Lyssna igen. Ordet hör till ${temaOf(q)}.`;
    case 'falsk': return 'Tänk inte på svenska! Ordet ser svenskt ut, men på engelska betyder det något annat.';
  }
}

export function solution(q: GQ): string {
  if (q.how === 'falsk') return `"${q.en}" betyder "${q.sv}" – inte ${FALSKA[q.row][2]}.`;
  return `"${q.en}" betyder "${q.sv}".`;
}
