import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { deckPick } from '../../engines/ord/check';
import { BILDER, ENHETER, FARGER, gor, REGLER, RUTINER, TALMONSTER } from './data';

// Logikslingan: mönster, steg i rätt ordning, OCH/INTE och OM–SÅ–ANNARS. Färdighets-id:n är permanenta.

export interface LogikQ extends OrdQ {
  /** omsa: regeln och läget just nu (visas på ett regelkort). */
  rule?: { om: string; sa: string; annars?: string; now: string };
}

const SKILL: Record<string, string> = { monster: 'prog.logik.monster', ordning: 'prog.logik.ordning', ochinte: 'prog.logik.ochinte', omsa: 'prog.logik.omsa' };

export const ERR: Record<string, string> = {
  'harmar-sista': 'Härmade den sista bilden',
  'fel-monster': 'Hittade inte biten som upprepas',
  'fel-steg': 'Fel steg i talmönstret',
  'bytte-plats': 'Två steg bytte plats',
  'fel-ordning': 'Stegen i fel ordning',
  'och-eller': 'Bara ett av villkoren stämde (OCH)',
  'missar-inte': 'Missade INTE',
  'fel-sak': 'Stämde inte alls',
  'fel-villkor': 'Kollade inte villkoret',
  'bada-grenarna': 'Trodde att roboten gör båda',
  'glomde-annars': 'Glömde ANNARS',
};

// ---------- mönster ----------

function monsterQ(rng: Rng, lvl: number, trap: string | undefined, ctx?: QuestionCtx): LogikQ {
  const base = { mode: 'monster', level: lvl, skill: SKILL.monster, prompt: 'Vad ska stå i rutan?' };
  // Talmönster bara på nivå 1 (och aldrig för Härmapans bilder, de har ju också härmning).
  if (lvl >= 1 && rng.next() < 0.35) {
    const pool = TALMONSTER;
    const tm = deckPick(pool, rng, ctx, 'tal');
    const start = tm.start[0] + rng.int(tm.start[1] - tm.start[0] + 1);
    const n = 4 + rng.int(2);
    const seq = Array.from({ length: n + 1 }, (_, i) => start + i * tm.step);
    const answer = seq[n];
    const alts: Alt[] = [{ text: String(answer) }, { text: String(seq[n - 1]), err: 'harmar-sista' }];
    for (const w of [answer + Math.sign(tm.step), answer + tm.step, answer - Math.sign(tm.step) * 1]) {
      if (alts.length < 4 && !alts.some((a) => a.text === String(w)) && w >= 0) alts.push({ text: String(w), err: 'fel-steg' });
    }
    return { ...base, kind: 'val', sentence: `${seq.slice(0, n).join(', ')}, ___`, answer: String(answer), alts: rng.shuffle(alts) };
  }
  const units = ENHETER.filter((e) => e.band <= lvl + 1);
  for (let tries = 0; ; tries++) {
    const { unit } = deckPick(units, rng, ctx ? { ...ctx, index: ctx.index + tries } : undefined, 'enhet');
    const set = rng.shuffle(deckPick(BILDER, rng, ctx, 'bilder'));
    const len = unit.length * 2 + rng.int(unit.length) + (lvl >= 1 ? 1 : 0);
    const seq = Array.from({ length: len + 1 }, (_, i) => unit[i % unit.length]);
    // Nivå 1: ibland en lucka mitt i mönstret.
    const gap = lvl >= 1 && rng.next() < 0.4 ? unit.length + rng.int(len - unit.length) : len;
    const answer = seq[gap];
    const before = seq[gap - 1];
    if ((trap === 'harmar-sista' || gap === len) && before === answer && tries < 30) continue;
    const used = [...new Set(unit)];
    const alts: Alt[] = [{ text: set[answer][1], pic: set[answer][0] }];
    if (before !== answer) alts.push({ text: set[before][1], pic: set[before][0], err: 'harmar-sista' });
    for (const u of [...used, 3]) {
      if (alts.length >= (used.length >= 3 ? 4 : 3)) break;
      if (alts.some((a) => a.text === set[u][1])) continue;
      alts.push({ text: set[u][1], pic: set[u][0], err: 'fel-monster' });
    }
    const shown = seq.slice(0, len + (gap < len ? 1 : 0)).map((u, i) => (i === gap ? '___' : set[u][0]));
    return { ...base, kind: 'val', sentence: shown.join(' '), answer: set[answer][1], alts: rng.shuffle(alts) };
  }
}

// ---------- steg i rätt ordning ----------

function ordningQ(rng: Rng, lvl: number, ctx?: QuestionCtx): LogikQ {
  const pool = RUTINER.filter((r) => (lvl >= 1 ? r.steps.length === 5 : r.steps.length === 4));
  const r = deckPick(pool, rng, ctx, 'rutin');
  let tiles = rng.shuffle(r.steps);
  while (tiles.join() === r.steps.join()) tiles = rng.shuffle(r.steps);
  return {
    mode: 'ordning', level: lvl, skill: SKILL.ordning, kind: 'ordna', lines: true,
    prompt: `Lägg stegen i rätt ordning: ${r.title.toLocaleLowerCase('sv')}.`, answer: r.steps.join(' '), tiles,
  };
}

// ---------- OCH och INTE ----------

const namn = (c: number, rund: boolean) => `${FARGER[c][0]} ${rund ? 'cirkel' : 'fyrkant'}`;
const alt = (c: number, rund: boolean, err?: string): Alt => ({ text: namn(c, rund), pic: FARGER[c][rund ? 1 : 2], ...(err ? { err } : {}) });
const formord = (rund: boolean) => (rund ? 'rund' : 'fyrkantig');

function ochinteQ(rng: Rng, lvl: number, trap: string | undefined, ctx?: QuestionCtx): LogikQ {
  const base = { mode: 'ochinte', level: lvl, skill: SKILL.ochinte, kind: 'val' as const };
  const types = trap === 'missar-inte' ? (lvl >= 1 ? ['inte-farg', 'inte-form', 'men-inte'] : ['inte-farg', 'inte-form']) : lvl >= 1 ? ['och', 'men-inte', 'inte-form'] : ['och', 'inte-farg', 'inte-form'];
  // En kortlek med typ × färg × form, så att samma fråga inte kommer två gånger i en runda.
  const deck = types.flatMap((t) => FARGER.flatMap((_, ci) => [true, false].map((r) => [t, ci, r] as const)));
  const [type, c, rund] = deckPick(deck, rng, ctx, `ochinte${trap ?? ''}`);
  const [c2, c3] = rng.shuffle(FARGER.map((_, i) => i).filter((i) => i !== c));
  let prompt: string, alts: Alt[];
  if (type === 'och') {
    prompt = `Vilken är ${FARGER[c][0]} OCH ${formord(rund)}?`;
    alts = [alt(c, rund), alt(c, !rund, 'och-eller'), alt(c2, rund, 'och-eller'), alt(c3, !rund, 'fel-sak')];
  } else if (type === 'men-inte') {
    prompt = `Vilken är ${FARGER[c][0]} men INTE ${formord(rund)}?`;
    alts = [alt(c, !rund), alt(c, rund, 'missar-inte'), alt(c2, !rund, 'och-eller'), alt(c3, rund, 'fel-sak')];
  } else if (type === 'inte-farg') {
    prompt = `Vilken är INTE ${FARGER[c][0]}?`;
    alts = [alt(c2, rng.next() < 0.5), alt(c, true, 'missar-inte'), alt(c, false, 'missar-inte')];
  } else {
    prompt = `Vilken är INTE ${formord(rund)}?`;
    alts = [alt(c, !rund), alt(c2, rund, 'missar-inte'), alt(c3, rund, 'missar-inte')];
  }
  const right = alts.find((a) => !a.err)!;
  return { ...base, prompt, answer: right.text, alts: rng.shuffle(alts) };
}

// ---------- OM – SÅ – ANNARS ----------

const INGET = 'Gör ingenting';
const BADA = 'Gör båda sakerna';

function omsaQ(rng: Rng, lvl: number, ctx?: QuestionCtx): LogikQ {
  const r = deckPick(REGLER, rng, ctx, 'regel');
  const other = rng.pick(REGLER.filter((x) => x !== r));
  const sant = rng.next() < 0.5;
  const base = { mode: 'omsa', level: lvl, skill: SKILL.omsa, kind: 'val' as const, prompt: 'Vad gör Robo nu?' };
  const rule = { om: r.om, sa: r.sa, ...(lvl >= 1 ? { annars: r.annars } : {}), now: sant ? r.ja : r.nej };
  let alts: Alt[];
  if (lvl === 0) {
    alts = sant
      ? [{ text: gor(r.sa) }, { text: INGET, err: 'fel-villkor' }, { text: gor(other.sa), err: 'fel-sak' }]
      : [{ text: INGET }, { text: gor(r.sa), err: 'fel-villkor' }, { text: gor(other.sa), err: 'fel-sak' }];
  } else {
    alts = sant
      ? [{ text: gor(r.sa) }, { text: gor(r.annars), err: 'fel-villkor' }, { text: BADA, err: 'bada-grenarna' }, { text: gor(other.sa), err: 'fel-sak' }]
      : [{ text: gor(r.annars) }, { text: gor(r.sa), err: 'fel-villkor' }, { text: BADA, err: 'bada-grenarna' }, { text: INGET, err: 'glomde-annars' }];
  }
  return { ...base, rule, answer: alts[0].text, alts: rng.shuffle(alts) };
}

// ---------- spelet ----------

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): LogikQ {
  let mode = spec.mode;
  const lvl = Math.max(0, Math.min(spec.level, 1));
  if (mode === 'blandat') mode = rng.pick(['monster', 'ordning', 'ochinte', 'omsa']);
  switch (mode) {
    case 'ordning': return ordningQ(rng, lvl, ctx);
    case 'ochinte': return ochinteQ(rng, lvl, spec.trap, ctx);
    case 'omsa': return omsaQ(rng, lvl, ctx);
    default: return monsterQ(rng, lvl, spec.trap, ctx);
  }
}

/** ordna: två steg bredvid varandra har bytt plats, eller allmänt fel ordning. */
export function diagnose(q: LogikQ, given: string): string | undefined {
  if (q.kind !== 'ordna') return undefined;
  const steps = RUTINER.find((r) => r.steps.join(' ') === q.answer)!.steps;
  for (let i = 0; i + 1 < steps.length; i++) {
    const s = steps.slice();
    [s[i], s[i + 1]] = [s[i + 1], s[i]];
    if (s.join(' ').toLocaleLowerCase('sv') === given.toLocaleLowerCase('sv')) return 'bytte-plats';
  }
  return 'fel-ordning';
}

export function explain(tag: string, q: LogikQ): Explained {
  switch (tag) {
    case 'harmar-sista': return { title: 'Inte bara samma igen', text: 'Mönstret säger inte bara samma sak en gång till. Leta efter biten som upprepas – vad kommer efter den?' };
    case 'fel-monster': return { title: 'Hitta biten som upprepas', text: 'Peka på varje bild och säg dem högt. Vilken del kommer om och om igen?' };
    case 'fel-steg': return { title: 'Räkna steget', text: 'Hur mycket ändras det mellan två tal bredvid varandra? Blir det lika mycket varje gång?' };
    case 'bytte-plats': return { title: 'Nästan!', text: 'Två steg har bytt plats. Tänk dig att du gör det på riktigt: vilket av dem måste hända först?' };
    case 'fel-ordning': return { title: 'Gör det i tanken', text: 'Tänk dig att du gör det på riktigt, steg för steg. Vad måste hända först, innan något annat går?' };
    case 'och-eller': return { title: 'OCH betyder båda', text: 'Den du valde stämmer bara på det ena. OCH betyder att både färgen och formen måste stämma.' };
    case 'missar-inte': return { title: 'Läs INTE', text: 'Läs frågan en gång till – det står INTE! Den du valde är just det som frågan inte vill ha.' };
    case 'fel-sak': return q.mode === 'omsa'
      ? { title: 'Det står inte i regeln', text: 'Robo gör bara det som regeln säger. Läs regeln igen.' }
      : { title: 'Titta igen', text: 'Titta på både färgen och formen. Stämmer någon av dem med frågan?' };
    case 'fel-villkor': return { title: 'Kolla villkoret', text: 'Stämmer det som står efter OM, just nu? Bara då gör Robo det som står efter SÅ.' };
    case 'bada-grenarna': return { title: 'Bara en sak', text: 'Robo gör bara en av sakerna: SÅ-delen om villkoret stämmer, annars ANNARS-delen.' };
    case 'glomde-annars': return { title: 'Det finns ett ANNARS', text: 'När villkoret inte stämmer gör Robo det som står efter ANNARS.' };
    default: return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function hint(q: LogikQ): string {
  switch (q.mode) {
    case 'monster': return /\d/.test(q.sentence ?? '') ? 'Hur mycket ändras talen varje gång?' : 'Säg mönstret högt. Vilken bit upprepas?';
    case 'ordning': return 'Vad måste du göra allra först? Och vad gör du allra sist?';
    case 'ochinte': return 'Läs frågan långsamt. Står det OCH eller INTE?';
    default: return 'Stämmer villkoret efter OM, just nu?';
  }
}

export function solution(q: LogikQ): string {
  if (q.kind === 'ordna') return `Rätt ordning: ${RUTINER.find((r) => r.steps.join(' ') === q.answer)!.steps.map((s, i) => `${i + 1}. ${s}`).join('  ')}`;
  if (q.mode === 'omsa') return `Robo: ${q.answer}.`;
  return `Rätt svar: ${q.answer}.`;
}

export const specsForSkill = (skill: string): QuestionSpec[] => {
  const mode = Object.entries(SKILL).find(([, s]) => s === skill)?.[0];
  return mode ? [{ mode, level: 0 }, { mode, level: 1 }] : [];
};
