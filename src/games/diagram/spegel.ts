import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import { axisFor, seenRatio, type Chart } from '../../engines/diagram/chart';
import type { Alt } from '../../engines/diagram/types';
import { fmtNum } from '../../engines/drill/check';
import { FRUKT, GLASS, GRONSAKER, MAL, DJUR, type Tema } from './data';
import { cands, chartOf, pickKat, type Base, type DQ, type Extra } from './gen';

// Spegelsalen (åk 4–6): diagram som lurar ögat. Axeln börjar inte på 0 (Axelklipparen), skalan har ojämna steg,
// staplarna är olika breda, bilderna växer åt alla håll (Ballongblåsaren), två diagram med olika skalor
// (Skalbytaren) och diagram utan tal. Barnet hittar knepet, trycker på det som lurar, räknar ut hur det är
// på riktigt och lagar diagrammet. Ungefär var fjärde "hitta knepet"-fråga är ärlig – alla diagram lurar inte.
// Lägen, färdighets-id:n och felkoder är permanenta.

export type Knep = 'axel' | 'skala' | 'bredd' | 'yta' | 'olika' | 'enhet';
const KNEP: Knep[] = ['axel', 'skala', 'bredd', 'yta', 'olika', 'enhet'];
const MAX: Record<Knep, number> = { axel: 2, skala: 2, bredd: 2, yta: 1, olika: 1, enhet: 0 };

/** Knepets namn (som alternativ) och felkoden om barnet inte ser det. */
const NAMN: Record<Knep, string> = {
  axel: 'Axeln börjar inte på 0',
  skala: 'Stegen på axeln är olika stora',
  bredd: 'Staplarna är olika breda',
  yta: 'Bilderna växer åt alla håll',
  olika: 'Diagrammen har olika skalor',
  enhet: 'Det finns inga tal på axeln',
};
const TAG: Record<Knep, string> = {
  axel: 'axel-inte-noll', skala: 'ojamn-skala', bredd: 'bredd-lurar', yta: 'yta-lurar', olika: 'olika-skalor', enhet: 'utan-enhet',
};
export const ARLIGT = 'Diagrammet är ärligt';

export const SPEGEL_ERR: Record<string, string> = {
  'axel-inte-noll': 'Luras av en axel som inte börjar på 0',
  'ojamn-skala': 'Luras av en skala med ojämna steg',
  'bredd-lurar': 'Luras av staplar som är olika breda',
  'yta-lurar': 'Luras av bilder som växer åt alla håll',
  'olika-skalor': 'Jämför diagram med olika skalor',
  'utan-enhet': 'Ser inte att talen saknas',
  'ser-fusk-overallt': 'Tror att ett ärligt diagram lurar',
  'fel-knep': 'Hittar ett knep som inte finns',
  'fel-del': 'Trycker på en del som inte lurar',
};

export const spegelExtra: Extra = {
  err: SPEGEL_ERR,
  explain(tag) {
    switch (tag) {
      case 'axel-inte-noll':
        return { title: 'Kolla axeln', text: 'Titta var axeln börjar. Börjar den inte på noll ser små skillnader jättestora ut. Läs talen i stället för att jämföra höjderna.' };
      case 'ojamn-skala':
        return { title: 'Kolla stegen', text: 'Titta på talen vid axeln. Ökar de lika mycket för varje streck? Om stegen är olika stora går det inte att jämföra höjderna. Läs talen.' };
      case 'bredd-lurar':
        return { title: 'Bredden lurar', text: 'En bredare stapel ser större ut, men det är bara höjden som visar talet. Jämför talen, inte hur stora staplarna ser ut.' };
      case 'yta-lurar':
        return { title: 'Ytan lurar', text: 'När en bild blir dubbelt så hög blir den också dubbelt så bred – då ser den fyra gånger så stor ut! Jämför talen i stället för bilderna.' };
      case 'olika-skalor':
        return { title: 'Olika skalor', text: 'Diagrammen har olika tal på axlarna. En stapel som ser hög ut kan vara värd mindre. Läs av talet i varje diagram först, och jämför sedan talen.' };
      case 'utan-enhet':
        return { title: 'Var är talen?', text: 'Titta på axeln: finns det några tal? Utan tal kan man inte veta hur stora sakerna är.' };
      case 'ser-fusk-overallt':
        return { title: 'Alla diagram lurar inte', text: 'Kolla igen: börjar axeln på noll, är stegen lika stora, är staplarna lika breda och finns talen med? Ibland är ett diagram precis som det ska.' };
      case 'fel-knep':
        return { title: 'Ett annat knep', text: 'Det knepet finns inte i det här diagrammet. Kolla axeln, stegen, bredden och bilderna – en sak i taget.' };
      case 'fel-del':
        return { title: 'Den delen är ärlig', text: 'Den delen ritas som den ska. Vad är det som får diagrammet att se konstigt ut? Kolla talen vid axeln och hur breda staplarna är.' };
      default:
        return undefined;
    }
  },
};

const TEMAN = [GRONSAKER, GLASS, FRUKT, MAL, DJUR];
const BYAR = [GRONSAKER, GLASS, FRUKT];

/** Ett diagram med knepet, och vilka staplar som är störst och minst. */
interface Lurat { t: Tema; chart: Chart; kalla?: Chart; hi: number; lo: number; ratio?: number; fraga?: number }

const tal = (c: Chart): Chart => ({ ...c, talPa: true });

function rita(knep: Knep, rng: Rng): Lurat | null {
  const t = rng.pick(knep === 'olika' ? BYAR : TEMAN);
  if (knep === 'axel') {
    const L = rng.pick([40, 60, 80]), n = 3 + rng.int(2);
    const lo = L + 1 + rng.int(3), hi = L + 6 + rng.int(4);
    const mid = rng.shuffle(Array.from({ length: hi - lo - 1 }, (_, i) => lo + 1 + i)).slice(0, n - 2);
    const v = rng.shuffle([lo, hi, ...mid]);
    const idx = pickKat(t, n, rng);
    return { t, chart: tal(chartOf(t, idx, v, 'stapel', { min: 0, max: L + 10, steg: 10 }, { lur: { axelStart: L } })), hi: v.indexOf(hi), lo: v.indexOf(lo) };
  }
  if (knep === 'skala') {
    const [lo, hi] = rng.pick([[10, 50], [10, 100], [20, 100], [20, 80], [10, 80]]);
    const others = rng.shuffle([15, 30, 40, 60, 70].filter((x) => x > lo && x < hi)).slice(0, 1 + rng.int(2));
    const v = rng.shuffle([lo, hi, ...others]);
    const idx = pickKat(t, v.length, rng);
    return { t, chart: tal(chartOf(t, idx, v, 'stapel', { min: 0, max: 100, steg: 10 }, { lur: { ojamnSkala: [0, 10, 20, 50, 100] } })), hi: v.indexOf(hi), lo: v.indexOf(lo), ratio: hi / lo };
  }
  if (knep === 'bredd' || knep === 'yta') {
    const r = rng.pick([2, 3]), step = rng.pick([5, 10]);
    const lo = step * (1 + rng.int(knep === 'yta' ? 3 : 2)), hi = lo * r;
    const mid = lo + step * (1 + rng.int(Math.max(1, (hi - lo) / step - 1)));
    if (mid >= hi) return null;
    const v = rng.shuffle([lo, hi, mid]);
    const idx = pickKat(t, 3, rng);
    const lur = knep === 'bredd' ? { bredd: v.map((x) => (x === hi ? 2 : 1)) } : { ytskala: true };
    return { t, chart: tal(chartOf(t, idx, v, 'stapel', axisFor(hi + step, step), { lur })), hi: v.indexOf(hi), lo: v.indexOf(lo), ratio: r };
  }
  if (knep === 'enhet') {
    const n = 4, idx = pickKat(t, n, rng), v = rng.shuffle([2, 3, 5, 6, 8, 9]).slice(0, n).map((x) => x * 10);
    return { t, chart: chartOf(t, idx, v, 'stapel', axisFor(100, 10), { lur: { utanEnhet: true } }), hi: v.indexOf(Math.max(...v)), lo: v.indexOf(Math.min(...v)) };
  }
  // olika: två byar, samma saker, olika skalor. I den fråga som ställs ser den mindre stapeln högre ut.
  const idx = pickKat(t, 3, rng), c = rng.int(3);
  const a = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), b = rng.shuffle([5, 10, 15, 20, 25, 30, 35, 40, 45]).slice(0, 3);
  a[c] = 6 + rng.int(4);
  b[c] = rng.pick([10, 15, 20, 25]);
  if (new Set(a).size < 3 || new Set(b).size < 3) return null;
  const by = (namn: string, v: number[], max: number, steg: number) => ({ ...chartOf(t, idx, v, 'stapel', { min: 0, max, steg }), titel: `${t.titel} i ${namn}` });
  return { t, kalla: by('Talby', a, 10, 2), chart: by('Ekby', b, 50, 10), hi: c, lo: c, fraga: c };
}

/** Ett ärligt diagram: samma sorts data, men inget knep. */
function arligt(knep: Knep, rng: Rng): Lurat | null {
  if (knep === 'olika') {
    const l = rita('olika', rng);
    if (!l) return null;
    return { ...l, kalla: { ...l.kalla!, axel: l.chart.axel } };
  }
  const l = rita(knep === 'enhet' ? 'axel' : knep, rng);
  if (!l) return null;
  const v = l.chart.serier[0].v;
  return { ...l, chart: { ...l.chart, lur: undefined, axel: axisFor(Math.max(...v) + 5, 10) } };
}

/** "Vad är det som lurar?" Ungefär var fjärde gång är diagrammet ärligt. */
function vad(b: Base, knep: Knep, rng: Rng, trap?: string): DQ | null {
  const arlig = !trap && rng.next() < 0.25;
  const l = arlig ? arligt(knep, rng) : rita(knep, rng);
  if (!l) return null;
  const andra = rng.shuffle(KNEP.filter((k) => k !== knep && k !== 'olika' && (knep === 'olika' || k !== 'enhet'))).slice(0, 2);
  const alts: Alt[] = arlig
    ? [{ text: ARLIGT }, { text: NAMN[knep], err: 'ser-fusk-overallt' }, ...andra.map((k) => ({ text: NAMN[k], err: 'ser-fusk-overallt' }))]
    : [{ text: NAMN[knep] }, { text: ARLIGT, err: TAG[knep] }, ...andra.map((k) => ({ text: NAMN[k], err: 'fel-knep' }))];
  return {
    ...b, kind: 'val', prompt: knep === 'olika' ? 'Diagrammen ser ut att visa samma sak. Vad lurar?' : 'Vad är det som lurar i diagrammet?',
    chart: l.chart, kalla: l.kalla, bredvid: !!l.kalla, answer: arlig ? ARLIGT : NAMN[knep], alts: rng.shuffle(alts), sanning: true,
    los: arlig
      ? 'Axeln börjar på noll, stegen är lika stora, staplarna är lika breda och talen finns med. Det här diagrammet lurar inte.'
      : `${NAMN[knep]}. ${FORKLARING[knep]}`,
    tips: 'Kolla en sak i taget: var börjar axeln? Är stegen lika stora? Är staplarna lika breda? Finns talen med?',
  };
}

const FORKLARING: Record<Knep, string> = {
  axel: 'Därför ser små skillnader jättestora ut.',
  skala: 'Därför går det inte att jämföra höjderna.',
  bredd: 'Därför ser den breda stapeln mycket större ut än den är.',
  yta: 'En bild som är dubbelt så hög blir också dubbelt så bred, och ser fyra gånger så stor ut.',
  olika: 'En stapel som ser hög ut i det ena diagrammet kan vara värd mindre än en låg stapel i det andra.',
  enhet: 'Utan tal kan man inte veta hur stora sakerna är.',
};

/** Hur många gånger så stort är det egentligen? Den som tittar på bilden svarar fel. */
function hur(b: Base, knep: Knep, rng: Rng): DQ | null {
  const l = rita(knep, rng);
  if (!l || !l.ratio) return null;
  const { chart: c, hi, lo, ratio } = l;
  const seen = Math.round(seenRatio(c, hi, lo));
  if (seen === ratio) return null;
  const v = c.serier[0].v;
  return {
    ...b, kind: 'las', prompt: `Hur många gånger så stort är talet för ${c.kat[hi].toLocaleLowerCase('sv')} som talet för ${c.kat[lo].toLocaleLowerCase('sv')}?`,
    chart: c, answer: String(ratio), sanning: true,
    cand: cands(ratio, [[seen, TAG[knep]], [v[hi] - v[lo], 'svarade-varde']]), visa: [hi, lo],
    los: `${fmtNum(v[hi])} är ${fmtNum(ratio)} gånger så mycket som ${fmtNum(v[lo])}, för ${fmtNum(v[lo])} · ${fmtNum(ratio)} = ${fmtNum(v[hi])}. Men på bilden ser det ut som ungefär ${fmtNum(seen)} gånger.`,
    tips: 'Lita inte på hur stort det ser ut. Läs talen, och räkna ut hur många gånger det mindre talet får plats i det större.',
  };
}

/** Axeln: vad visar diagrammet egentligen? Eller: tryck på det som lurar. */
function axelQ(b: Base, rng: Rng): DQ | null {
  const l = rita('axel', rng);
  if (!l) return null;
  const { chart: c, hi, lo } = l;
  if (rng.next() < 0.5) {
    const A = c.kat[hi], B = c.kat[lo];
    return {
      ...b, kind: 'val', prompt: 'Vad visar diagrammet egentligen?', chart: c, answer: `${A} är bara lite mer än ${B}`, sanning: true,
      alts: rng.shuffle([
        { text: `${A} är bara lite mer än ${B}` },
        { text: `${A} är många gånger mer än ${B}`, err: 'axel-inte-noll' },
        { text: `${B} är mer än ${A}`, err: 'jamforde-fel' },
      ]),
      visa: [hi, lo],
      los: `${A}: ${fmtNum(c.serier[0].v[hi])}. ${B}: ${fmtNum(c.serier[0].v[lo])}. Skillnaden är liten – men axeln börjar på ${fmtNum(c.lur!.axelStart!)}, så den ser stor ut.`,
      tips: 'Titta först på var axeln börjar. Läs sedan talen vid staplarna och jämför dem.',
    };
  }
  return tryckQ(b, c, 'axel', 'axel-inte-noll');
}

/** Tryck på det som lurar. */
function tryckQ(b: Base, c: Chart, answer: string, missTag: string): DQ {
  const parts = [...c.kat.map((_, i) => `k${i}`), 'axel'].filter((p) => p !== answer);
  return {
    ...b, kind: 'tryck', prompt: 'Tryck på det som lurar ögat i diagrammet.', chart: c, answer, sanning: true,
    misses: Object.fromEntries(parts.map((p) => [p, missTag])),
    visa: answer.startsWith('k') ? [Number(answer.slice(1))] : undefined,
    los: answer === 'axel' ? `Axelns tal börjar inte på noll${c.lur?.ojamnSkala ? ', och stegen är olika stora' : ''}. Därför ser skillnaderna fel ut.` : `${c.kat[Number(answer.slice(1))]} är bredare än de andra staplarna. Därför ser den större ut än den är.`,
    tips: 'Kolla talen vid axeln och hur breda staplarna är. Vad är inte som det brukar?',
  };
}

/** Två byar med olika skalor: var såldes flest? */
function olikaQ(b: Base, rng: Rng): DQ | null {
  const l = rita('olika', rng);
  if (!l) return null;
  const { t, chart, kalla, fraga: c } = l;
  const sak = t.kat.find((k) => k.namn === chart.kat[c!])!;
  return {
    ...b, kind: 'val', prompt: `Var såldes det mest av ${sak.namn.toLocaleLowerCase('sv')}: i Talby eller i Ekby?`, chart, kalla, bredvid: true, answer: 'I Ekby',
    alts: [{ text: 'I Ekby' }, { text: 'I Talby', err: 'olika-skalor' }, { text: 'Lika mycket', err: 'jamforde-fel' }], visa: [c!],
    los: `Talby: ${fmtNum(kalla!.serier[0].v[c!])}. Ekby: ${fmtNum(chart.serier[0].v[c!])}. Stapeln i Talby ser högre ut, men där går axeln bara till ${fmtNum(kalla!.axel.max)}.`,
    tips: 'Läs av talet vid axeln i båda diagrammen. Jämför sedan talen – inte hur höga staplarna ser ut.',
  };
}

/** Laga diagrammet: flytta axelns början till noll, eller gör staplarna lika breda. */
function laga(b: Base, knep: 'axel' | 'bredd', rng: Rng): DQ | null {
  const l = rita(knep, rng);
  if (!l) return null;
  const c = l.chart;
  return {
    ...b, kind: 'laga', laga: knep, chart: c,
    prompt: knep === 'axel' ? 'Laga diagrammet! Flytta axelns början så att diagrammet blir ärligt.' : 'Laga diagrammet! Gör staplarna så att diagrammet blir ärligt.',
    answer: knep === 'axel' ? 'a:0' : `b:${c.kat.map(() => 1).join(',')}`,
    los: knep === 'axel' ? 'När axeln börjar på noll syns det hur stora skillnaderna egentligen är.' : 'När alla staplar är lika breda är det bara höjden som syns – och höjden visar talet.',
    tips: knep === 'axel' ? 'En ärlig axel börjar på noll.' : 'Alla staplar ska vara lika breda.',
  };
}

export function makeQ(spec: QuestionSpec, rng: Rng): DQ | null {
  const trapKnep = (Object.keys(TAG) as Knep[]).find((k) => TAG[k] === spec.trap);
  const knep: Knep = spec.mode === 'blandat' ? (trapKnep ?? rng.pick(KNEP)) : spec.mode as Knep;
  const level = spec.mode === 'blandat' ? Math.min(spec.level + rng.int(2), MAX[knep]) : Math.min(Math.max(0, spec.level), MAX[knep]);
  const b: Base = { mode: knep, level, skill: `ma.stat.lura.${knep}` };
  if (level === 0 || knep === 'enhet') return vad(b, knep, rng, spec.trap);
  switch (knep) {
    case 'axel': return level === 2 ? laga(b, 'axel', rng) : axelQ(b, rng);
    case 'skala': return level === 2 ? vad(b, knep, rng, spec.trap) : rng.next() < 0.6 ? hur(b, knep, rng) : (() => { const l = rita('skala', rng); return l && tryckQ(b, l.chart, 'axel', 'ojamn-skala'); })();
    case 'bredd': {
      if (level === 2) return laga(b, 'bredd', rng);
      if (rng.next() < 0.6) return hur(b, knep, rng);
      const l = rita('bredd', rng);
      return l && tryckQ(b, l.chart, `k${l.hi}`, 'fel-del');
    }
    case 'yta': return hur(b, knep, rng);
    case 'olika': return olikaQ(b, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const m = /^ma\.stat\.lura\.(.+)$/.exec(skill);
  const knep = KNEP.find((k) => k === m?.[1]);
  return knep ? Array.from({ length: MAX[knep] + 1 }, (_, level) => ({ mode: knep, level })) : [];
}

/** Exempel till Klassrummet. */
export const EXEMPEL_AXEL = tal(chartOf(GLASS, [0, 1, 2], [48, 42, 45], 'stapel', { min: 0, max: 50, steg: 10 }, { lur: { axelStart: 40 } }));
export const EXEMPEL_YTA = tal(chartOf(FRUKT, [0, 2], [10, 20], 'stapel', axisFor(25, 5), { lur: { ytskala: true } }));
