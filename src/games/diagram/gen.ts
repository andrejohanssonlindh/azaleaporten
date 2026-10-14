import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { axisFor, type Chart } from '../../engines/diagram/chart';
import { joinVals, splitVals } from '../../engines/diagram/check';
import type { DiagramGame, DiagramQ, Explained, Plock } from '../../engines/diagram/types';
import { fmtNum } from '../../engines/drill/check';
import type { Tema } from './data';

// Diagramdalens gemensamma frågor: läsa av, flest och färst, hur många fler, sammanlagt och bygga.
// Varje fråga räknar ut de typiska felsvaren (som klockans candidates()) och vilket missförstånd de visar.
// Felkoderna är permanenta.

export interface DQ extends DiagramQ {
  /** Typiska felsvar (talet som text) och deras felkod. */
  cand?: Record<string, string>;
  /** Hur man tänker (visas när frågan är klar; får innehålla svaret). */
  los: string;
  /** Ledtråden (aldrig svaret). */
  tips: string;
}

export const ERR: Record<string, string> = {
  femgrupp: 'Räknar en femgrupp som fyra (eller sex)',
  'fel-stapel': 'Läser av fel stapel eller rad',
  'rutor-inte-varde': 'Räknar rutor i stället för att läsa skalan',
  'mellan-linjer': 'Läser fel mellan två streck på skalan',
  'nyckel-glomd': 'Räknar bilderna och glömmer nyckeln',
  'halv-bild': 'Missar vad den halva bilden betyder',
  'summa-skillnad': 'Lägger ihop när frågan är hur många fler',
  'svarade-varde': 'Svarar med ett av talen i stället för skillnaden',
  'missade-rad': 'Missar en rad när allt ska läggas ihop',
  'mest-minst': 'Blandar ihop flest och färst',
  'jamforde-fel': 'Jämför fel',
  'raknade-fel': 'Räknar en sak för mycket eller för lite',
  'fel-hojd': 'Bygger en stapel för hög eller för låg',
};

/** Grunden för en fråga: läge, nivå och färdighet. */
export interface Base { mode: string; level: number; skill: string }

/** Kategorier ur ett tema: n stycken i följd (veckodagar) eller blandade. Index i temats lista. */
export function pickKat(t: Tema, n: number, rng: Rng): number[] {
  const all = t.kat.map((_, i) => i);
  if (t.ordnad) { const s = rng.int(all.length - n + 1); return all.slice(s, s + n); }
  return rng.shuffle(all).slice(0, n);
}

/** n olika värden, jämna steg, mellan lo och hi. Olika värden ger aldrig oavgjort om flest och färst. */
export function distinct(n: number, lo: number, hi: number, step: number, rng: Rng): number[] {
  const pool: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) pool.push(v);
  return rng.shuffle(pool).slice(0, n);
}

export function chartOf(t: Tema, idx: number[], v: number[], typ: Chart['typ'], axel: Chart['axel'], extra: Partial<Chart> = {}): Chart {
  return {
    typ, titel: t.titel, enhet: t.enhet, katNamn: t.katNamn,
    kat: idx.map((i) => t.kat[i].namn), ikoner: idx.map((i) => t.kat[i].ikon),
    serier: [{ namn: t.titel, v }], axel, ...extra,
  };
}

/** Typiska felsvar → felkod. Det första som anges vinner; svaret självt och omöjliga tal hoppas över. */
export function cands(answer: number, list: [number, string][]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [n, tag] of list) {
    if (!Number.isFinite(n) || n < 0 || Math.abs(n - answer) < 1e-9) continue;
    const k = String(Math.round(n * 1000) / 1000);
    if (!(k in out)) out[k] = tag;
  }
  return out;
}

/** Felsvaret att läsa av grannarna (raden eller stapeln bredvid). */
export const grannar = (v: number[], i: number): [number, string][] =>
  [v[i - 1], v[i + 1]].filter((x) => x !== undefined).map((x) => [x, 'fel-stapel']);

const del = (c: Chart) => (c.typ === 'stapel' ? 'stapel' : 'rad');
const dela = (c: Chart) => (c.typ === 'stapel' ? 'staplarna' : 'raderna');

/* ---------- frågor som finns i flera lägen ---------- */

/** Vilken kategori har flest (eller färst)? Som val, eller som tryck på diagrammet. */
export function mestQ(b: Base, t: Tema, chart: Chart, which: 'mest' | 'minst', tryck: boolean): DQ {
  const v = chart.serier[0].v;
  const right = v.indexOf(which === 'mest' ? Math.max(...v) : Math.min(...v));
  const other = v.indexOf(which === 'mest' ? Math.min(...v) : Math.max(...v));
  const tagOf = (j: number) => (j === other ? 'mest-minst' : 'jamforde-fel');
  const q = which === 'mest' ? t.mest : t.minst;
  const storst = which === 'mest';
  const tips = chart.typ === 'tabell' ? `Jämför talen i tabellen. Vilket är ${storst ? 'störst' : 'minst'}?`
    : chart.typ === 'streck' ? `Vilken rad har ${storst ? 'flest' : 'färst'} streck?`
      : chart.typ === 'bild' ? `Vilken rad har ${storst ? 'flest' : 'färst'} bilder?`
        : chart.liggande ? `Vilken stapel är ${storst ? 'längst' : 'kortast'}?` : `Vilken stapel är ${storst ? 'högst' : 'lägst'}?`;
  const los = `${chart.kat[right]}: ${fmtNum(v[right])} ${t.enhet}. Det är ${storst ? 'mest' : 'minst'} av alla.`;
  if (tryck) {
    return {
      ...b, kind: 'tryck', prompt: `${q} Tryck på ${chart.typ === 'stapel' ? 'stapeln' : 'raden'}.`, chart, answer: `k${right}`,
      misses: Object.fromEntries(v.map((_, j) => [`k${j}`, tagOf(j)]).filter(([k]) => k !== `k${right}`)), visa: [right], los, tips,
    };
  }
  return {
    ...b, kind: 'val', prompt: q, chart, answer: chart.kat[right],
    alts: chart.kat.map((k, j) => (j === right ? { text: k } : { text: k, err: tagOf(j) })), visa: [right], los, tips,
  };
}

/** Hur många fler? Null om datan inte ger en fråga med ett enda tydligt svar (då dras ny data). */
export function flerQ(b: Base, t: Tema, idx: number[], chart: Chart, rng: Rng): DQ | null {
  const v = chart.serier[0].v;
  const pairs: [number, number][] = [];
  for (let a = 0; a < v.length; a++) for (let c = 0; c < v.length; c++) {
    const d = v[a] - v[c];
    // Skillnaden får inte vara ett av talen i diagrammet (då kan man inte se om barnet läst av eller räknat).
    if (d > 0 && !v.includes(d)) pairs.push([a, c]);
  }
  if (!pairs.length) return null;
  const [a, c] = rng.pick(pairs);
  const d = v[a] - v[c];
  return {
    ...b, kind: 'las', prompt: t.fler(t.kat[idx[a]], t.kat[idx[c]]), chart, answer: String(d), enhet: t.svarEnhet,
    cand: cands(d, [[v[a] + v[c], 'summa-skillnad'], [v[a], 'svarade-varde'], [v[c], 'svarade-varde']]),
    visa: [a, c],
    los: `${chart.kat[a]} har ${fmtNum(v[a])} och ${chart.kat[c]} har ${fmtNum(v[c])}. ${fmtNum(v[a])} − ${fmtNum(v[c])} = ${fmtNum(d)}.`,
    tips: 'Läs av båda först. Hur många fler är skillnaden: det större talet minus det mindre.',
  };
}

/** Hur många sammanlagt? */
export function summaQ(b: Base, t: Tema, chart: Chart): DQ {
  const v = chart.serier[0].v;
  const sum = v.reduce((x, y) => x + y, 0);
  return {
    ...b, kind: 'las', prompt: t.alla, chart, answer: String(sum), enhet: t.svarEnhet,
    cand: cands(sum, v.map((x) => [sum - x, 'missade-rad'])),
    visa: v.map((_, i) => i),
    los: `${v.map(fmtNum).join(' + ')} = ${fmtNum(sum)}.`,
    tips: `Läs av ${dela(chart)} en i taget och lägg ihop allihop.`,
  };
}

/* ---------- bygga ---------- */

/** Saker utspridda på en bild (ett rutnät 9 × 4 med lite slump, så att inget hamnar på varandra). */
export function scatter(ikoner: string[], counts: number[], rng: Rng): Plock[] {
  const cells = rng.shuffle(Array.from({ length: 36 }, (_, i) => i));
  const out: Plock[] = [];
  let k = 0;
  ikoner.forEach((ikon, j) => {
    for (let c = 0; c < counts[j]; c++) {
      const cell = cells[k++];
      out.push({ ikon, x: (cell % 9 + 0.2 + rng.next() * 0.6) / 9, y: (Math.floor(cell / 9) + 0.2 + rng.next() * 0.6) / 4 });
    }
  });
  return out;
}

/** Rita streck: från en tabell eller från en bild. */
export function streckBygg(b: Base, t: Tema, idx: number[], v: number[], rng: Rng, franBild: boolean): DQ {
  const chart = chartOf(t, idx, v, 'streck', { min: 0, max: 20, steg: 1 });
  return {
    ...b, kind: 'bygg', chart, answer: joinVals(v),
    prompt: franBild ? t.plock! : 'Rita lika många streck som det står i tabellen.',
    kalla: franBild ? undefined : { ...chartOf(t, idx, v, 'tabell', chart.axel), titel: t.titel },
    bild: franBild ? scatter(idx.map((i) => t.kat[i].ikon), v, rng) : undefined,
    los: `${chart.kat.map((k, i) => `${k}: ${v[i]}`).join(', ')}. Det femte strecket dras snett över de fyra.`,
    tips: franBild ? 'Räkna en sorts sak i taget och peka på varje sak när du räknar den.' : 'Ta en rad i taget. Tryck på + lika många gånger som talet i tabellen.',
  };
}

/** Bygg staplar från en tabell. */
export function stapelBygg(b: Base, t: Tema, idx: number[], v: number[], step: number): DQ {
  const axel = axisFor(Math.max(Math.max(...v) + step, 5 * step), step);
  const chart = chartOf(t, idx, v, 'stapel', axel);
  return {
    ...b, kind: 'bygg', chart, answer: joinVals(v),
    prompt: 'Bygg staplarna så att de visar talen i tabellen. Tryck i diagrammet, eller använd pilarna.',
    kalla: chartOf(t, idx, v, 'tabell', axel),
    los: `${chart.kat.map((k, i) => `${k}: ${fmtNum(v[i])}`).join(', ')}.`,
    tips: step === 1 ? 'Varje streck på axeln är ett steg. Bygg en stapel i taget och kolla talet vid axeln.' : 'Kolla först hur mycket varje streck på axeln är värt. Bygg sedan en stapel i taget.',
  };
}

/** Felkoden för ett byggt diagram: en rad eller stapel lite fel, eller rätt tal på fel ställe. */
export function diagnoseBygg(q: DQ, given: string): string | undefined {
  const a = splitVals(q.answer), g = splitVals(given);
  const diff = a.map((x, i) => (x === g[i] ? -1 : i)).filter((i) => i >= 0);
  if (diff.length >= 2 && [...a].sort((x, y) => x - y).join() === [...g].sort((x, y) => x - y).join()) return 'fel-stapel';
  const step = q.chart.typ === 'streck' ? 1 : q.chart.axel.steg;
  if (diff.length === 1 && Math.abs(a[diff[0]] - g[diff[0]]) === step) return q.chart.typ === 'streck' ? 'raknade-fel' : 'fel-hojd';
  return undefined;
}

/* ---------- förklaringar ---------- */

/** Förklaringen vid fel. Säger hur man gör – aldrig svaret. */
export function explain(tag: string, q: DQ): Explained {
  const c = q.chart;
  switch (tag) {
    case 'femgrupp':
      return { title: 'Räkna femgrupperna', text: 'Ett knippe med fyra streck och ett snett över är fem streck – inte fyra. Räkna fem för varje knippe, och sedan ett för varje streck som är kvar.' };
    case 'fel-stapel':
      return q.kind === 'bygg'
        ? { title: 'Rätt tal, fel ställe', text: `Talen finns med, men några har hamnat på fel ${del(c)}. Kolla namnet på varje ${del(c)} mot tabellen.` }
        : { title: `Fel ${del(c)}`, text: `Du läste av en annan ${del(c)}. Leta först upp rätt namn, och följ sedan ${c.typ === 'stapel' ? 'stapeln' : 'raden'}.` };
    case 'rutor-inte-varde':
      return { title: 'Läs skalan', text: 'Du räknade rutorna. Men varje ruta är inte värd ett! Titta på talen vid axeln: hur mycket ökar de för varje streck?' };
    case 'mellan-linjer':
      return { title: 'Mitt emellan', text: 'Stapeln slutar mellan två streck på skalan. Vilka tal står på strecken under och över? Vilket tal ligger mitt emellan dem?' };
    case 'nyckel-glomd':
      return { title: 'Glöm inte nyckeln', text: 'Du räknade bilderna. Men titta på nyckeln under diagrammet: en bild betyder fler än en!' };
    case 'halv-bild':
      return { title: 'Den halva bilden', text: 'Titta på den sista bilden i raden: den är bara halv. En halv bild betyder hälften så många som en hel bild.' };
    case 'summa-skillnad':
      return { title: 'Hur många fler?', text: '"Hur många fler" betyder skillnaden mellan talen. Du lade ihop dem. Ta det större talet minus det mindre.' };
    case 'svarade-varde':
      return { title: 'Jämför de två', text: 'Du svarade med ett av talen. Frågan är hur många fler: hur stor är skillnaden mellan dem?' };
    case 'missade-rad':
      return { title: 'Alla ska med', text: `Sammanlagt betyder alla tillsammans. Kolla att du fick med varenda ${del(c)}.` };
    case 'mest-minst':
      return { title: 'Flest eller färst?', text: 'Läs frågan en gång till: ska du hitta det största eller det minsta?' };
    case 'jamforde-fel':
      return { title: 'Jämför igen', text: `Titta på alla ${dela(c)} en gång till. ${q.tips}` };
    case 'raknade-fel':
      return { title: 'Räkna igen', text: 'Nästan! En rad har ett streck för mycket eller för lite. Räkna en gång till, rad för rad.' };
    case 'fel-hojd':
      return { title: 'Kolla höjden', text: 'Nästan! En stapel är ett steg för hög eller för låg. Jämför varje stapel med talet i tabellen.' };
    default:
      return { title: 'Inte riktigt', text: `Prova igen. ${q.tips}` };
  }
}

/* ---------- spelet ---------- */

/** Ett diagramspel av en frågegenerator. make får ge null; då dras ny data (frågan blir ändå densamma för samma seed). */
export function diagramGame(id: string, gen: (spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx) => DQ | null, specsForSkill: (skill: string) => QuestionSpec[]): DiagramGame<DQ> {
  return {
    id,
    make(spec, rng, ctx) {
      for (let i = 0; i < 200; i++) {
        const q = gen(spec, rng, ctx);
        if (q) return q;
      }
      throw new Error(`${id}: ingen fråga för ${JSON.stringify(spec)}`);
    },
    diagnose: (q, given) => (q.kind === 'bygg' ? diagnoseBygg(q, given) : q.cand?.[given]),
    explain: (tag, q) => explain(tag, q),
    solution: (q) => q.los,
    hint: (q) => q.tips,
    specsForSkill,
    errLabels: ERR,
  };
}
