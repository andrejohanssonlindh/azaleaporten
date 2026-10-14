import { rngFrom, type Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { TEXTER, type Fragetyp, type Texttyp } from './texter';

// Berättelsebiblioteket: läs en kort text och svara. Texten visas ovanför frågan (spelets Visual).
// I en runda kommer frågorna om samma text efter varandra, så att barnet läser texten en gång och svarar flera gånger.
// Alla frågor är val; felen står på alternativen. Färdighets-id:n ('sv.las.*') och felkoder är permanenta.

export type Topic = Fragetyp | 'texttyp';

export interface LQ extends OrdQ {
  topic: Topic;
  /** Texten (index i TEXTER) och frågan i den (-1 = vad är det för sorts text). */
  text: number;
  row: number;
}

export const ERR: Record<string, string> = {
  'inte-i-texten': 'Svarar något som låter rätt men inte står i texten',
  'fel-detalj': 'Väljer något ur texten som inte svarar på frågan',
  'bara-ytan': 'Missar ledtråden mellan raderna',
  'fel-ordbetydelse': 'Gissar fel betydelse av ordet',
  'bara-en-del': 'Väljer en detalj i stället för vad hela texten handlar om',
  'fel-texttyp': 'Blandar ihop olika sorters texter',
};

const SKILL: Record<Topic, string> = { raden: 'raden', mellan: 'mellan', ord: 'ord', huvud: 'huvudtanke', texttyp: 'texttyp' };

export const TYPNAMN: Record<Texttyp, string> = {
  berattelse: 'en berättelse', fakta: 'en faktatext', instruktion: 'en instruktion', brev: 'ett brev', dikt: 'en dikt', annons: 'en annons',
};

/** Hur man känner igen en sorts text; nämner aldrig någon annan sort. */
const KANNETECKEN: Record<Texttyp, string> = {
  berattelse: 'En berättelse har personer eller djur som det händer något med, från början till slut.',
  fakta: 'En faktatext berättar sant om något, så att man lär sig mer om det.',
  instruktion: 'En instruktion talar om hur man gör något, ofta steg för steg.',
  brev: 'Ett brev börjar ofta med "Hej" eller "Kära" och slutar med vem som skrev det.',
  dikt: 'En dikt har korta rader, och ibland rimmar den.',
  annons: 'En annons vill att många ska läsa den, till exempel för att bjuda in till något eller söka någon.',
};

/* ---------- vilka frågor som finns ---------- */

interface Item { t: Topic; text: number; row: number }

function topicsFor(mode: string, level: number): Topic[] {
  switch (mode) {
    case 'raden': case 'mellan': case 'ord': case 'huvud': case 'texttyp': return [mode];
    default: return level === 0 ? ['raden', 'mellan', 'ord', 'huvud'] : ['raden', 'mellan', 'ord', 'huvud', 'texttyp'];
  }
}

const hasTag = (x: Item, tag: string) => x.row >= 0 && TEXTER[x.text].fragor[x.row].fel.some(([, t]) => t === tag);

export function items(mode: string, level: number, trap?: string): Item[] {
  const ts = topicsFor(mode, level);
  const out: Item[] = [];
  TEXTER.forEach((tx, text) => {
    if (level === 0 && tx.band !== 1) return;
    tx.fragor.forEach((f, row) => { if (ts.includes(f.typ)) out.push({ t: f.typ, text, row }); });
    if (ts.includes('texttyp')) out.push({ t: 'texttyp', text, row: -1 });
  });
  if (!trap || !ERR[trap]) return out;
  const hit = out.filter((x) => hasTag(x, trap));
  return hit.length ? hit : items('blandat', level).filter((x) => hasTag(x, trap));
}

const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

/**
 * Kortleken för en runda: texterna i blandad ordning, och varje texts frågor efter varandra (också de blandade).
 * Samma runda och index ger alltid samma fråga.
 */
export function deck(pool: Item[], seed: number, key: string): Item[] {
  const rng = rngFrom((seed ^ hash(key)) >>> 0);
  const texts = rng.shuffle([...new Set(pool.map((x) => x.text))]);
  return texts.flatMap((t) => rng.shuffle(pool.filter((x) => x.text === t)));
}

/* ---------- frågor ---------- */

function build(x: Item, rng: Rng): Omit<LQ, 'mode' | 'level' | 'skill' | 'topic' | 'text' | 'row'> {
  const tx = TEXTER[x.text];
  if (x.t === 'texttyp') {
    const answer = TYPNAMN[tx.typ];
    const others = rng.shuffle((Object.keys(TYPNAMN) as Texttyp[]).filter((t) => t !== tx.typ)).slice(0, 2);
    const alts = rng.shuffle([{ text: answer }, ...others.map((t) => ({ text: TYPNAMN[t], err: 'fel-texttyp' }))]);
    const prompt = 'Vad är det här för sorts text?';
    return { kind: 'val', prompt, answer, alts, say: `${prompt} ${alts.map((a) => a.text).join('. ')}.` };
  }
  const f = tx.fragor[x.row];
  // Varje fråga har exakt två fel, så fällan (om frågan valdes för den) står alltid med.
  const wrong: Alt[] = f.fel.map(([text, err]) => ({ text, err }));
  const alts = rng.shuffle([{ text: f.svar }, ...wrong]);
  return { kind: 'val', prompt: f.q, answer: f.svar, alts, say: `${f.q} ${alts.map((a) => a.text).join('. ')}.` };
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): LQ {
  const level = Math.max(0, Math.min(1, spec.level));
  const pool = items(spec.mode, level, spec.trap);
  const key = `${spec.mode}/${level}/${spec.trap ?? ''}`;
  const x = ctx ? (() => { const d = deck(pool, ctx.seed, key); return d[ctx.index % d.length]; })() : rng.pick(pool);
  return { mode: spec.mode, level, skill: `sv.las.${SKILL[x.t]}`, topic: x.t, text: x.text, row: x.row, ...build(x, rng) };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case 'sv.las.raden': return [{ mode: 'raden', level: 0 }, { mode: 'raden', level: 1 }];
    case 'sv.las.mellan': return [{ mode: 'mellan', level: 0 }, { mode: 'mellan', level: 1 }];
    case 'sv.las.ord': return [{ mode: 'ord', level: 0 }, { mode: 'ord', level: 1 }];
    case 'sv.las.huvudtanke': return [{ mode: 'huvud', level: 0 }, { mode: 'huvud', level: 1 }];
    case 'sv.las.texttyp': return [{ mode: 'texttyp', level: 1 }];
    default: return [];
  }
}

export const diagnose = (): string | undefined => undefined;

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

const typOf = (given: string) => (Object.keys(TYPNAMN) as Texttyp[]).find((t) => TYPNAMN[t] === given.toLocaleLowerCase('sv'));

export function explain(tag: string, q: LQ, given: string): Explained {
  switch (tag) {
    case 'inte-i-texten':
      return { title: 'Står det i texten?', text: 'Det låter rimligt, men det står inte så i texten. Leta upp stället i texten som handlar om det här och läs det igen.' };
    case 'fel-detalj':
      return { title: 'Det står i texten – men svarar inte på frågan', text: 'Det du valde finns i texten, men det svarar på en annan fråga. Läs frågan igen: vad är det den vill veta?' };
    case 'bara-ytan':
      return { title: 'Läs mellan raderna', text: 'Det du valde stämmer, men det svarar inte på frågan. Svaret står inte rakt ut. Leta efter ledtrådar: vad gör och säger personerna, och vad betyder det?' };
    case 'fel-ordbetydelse':
      return { title: 'Vad betyder ordet här?', text: 'Leta upp ordet i texten och läs meningen runt det. Prova att byta ut ordet mot ditt svar. Betyder meningen samma sak då?' };
    case 'bara-en-del':
      return { title: 'Bara en bit av texten', text: 'Det där finns med i texten, men texten handlar om mer än så. Vad handlar hela texten om, från början till slut?' };
    case 'fel-texttyp': {
      const t = typOf(given);
      return { title: 'Inte riktigt den sorten', text: `${t ? KANNETECKEN[t] : ''} Stämmer det på den här texten? Titta på hur texten ser ut och vad den vill.`.trim() };
    }
    default:
      return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function hint(q: LQ): string {
  switch (q.topic) {
    case 'raden': return 'Svaret står i texten. Leta upp stället som handlar om det frågan undrar över.';
    case 'mellan': return 'Svaret står inte rakt ut. Leta efter ledtrådar i texten och tänk: vad betyder de?';
    case 'ord': return 'Leta upp ordet i texten. Läs meningen runt det och prova att byta ut ordet.';
    case 'huvud': return 'Tänk på hela texten, inte bara en del. Vad skulle du svara om någon frågade vad den handlar om?';
    case 'texttyp': return 'Titta på hur texten ser ut: har den steg, korta rader eller en hälsning? Och vad vill den: berätta, lära ut eller bjuda in?';
  }
}

export function solution(q: LQ): string {
  return q.topic === 'texttyp' ? `Det här är ${q.answer}.` : `Svar: ${q.answer}.`;
}
