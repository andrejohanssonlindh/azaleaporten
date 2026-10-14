import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt, Karta, Prick, Yta, Linje } from '../../engines/karta/types';
import { dra, valj, type GQ } from './gen';

// Kartrummet (åk 1–6): kartkunskap på Kartritarinnans egen karta över ön. Väderstreck på kompassrosen,
// vad som ligger åt vilket håll, kartsymboler, höjdfärger, skala och (band 2) en karta där norr inte är uppåt.
// Lägen, färdighets-id:n och felkoder är permanenta.

export type KartMode = 'vaderstreck' | 'riktning' | 'symboler' | 'skala' | 'vriden' | 'blandat';

const SKILL: Record<Exclude<KartMode, 'blandat'>, string> = {
  vaderstreck: 'geo.karta.vaderstreck', riktning: 'geo.karta.riktning', symboler: 'geo.karta.symboler', skala: 'geo.karta.skala', vriden: 'geo.karta.vriden',
};
const MAX: Record<Exclude<KartMode, 'blandat'>, number> = { vaderstreck: 1, riktning: 1, symboler: 1, skala: 1, vriden: 0 };

/** Väderstrecken medsols från norr, med ord. */
export const STRECK = ['norr', 'nordost', 'öster', 'sydost', 'söder', 'sydväst', 'väster', 'nordväst'];
const KORT = ['N', 'NO', 'Ö', 'SO', 'S', 'SV', 'V', 'NV'];
/** Spegelbilden öst ↔ väst (norr och söder är sina egna). */
const spegel = (i: number) => (8 - i) % 8;
const motsatt = (i: number) => (i + 4) % 8;

/** Platserna på Kartritarinnans karta: väderstreck från Azaleabyn (index i STRECK) och avstånd. */
export const PLATSER: { id: string; namn: string; ikon: string; dir: number; r: number }[] = [
  { id: 'azaleabyn', namn: 'Azaleabyn', ikon: '🏘️', dir: -1, r: 0 },
  { id: 'talbergen', namn: 'Talbergen', ikon: '⛰️', dir: 0, r: 135 },
  { id: 'spelon', namn: 'Spelön', ikon: '🎡', dir: 1, r: 185 },
  { id: 'hamnen', namn: 'Hamnen', ikon: '⚓', dir: 2, r: 140 },
  { id: 'betongbukten', namn: 'Betongbukten', ikon: '🛹', dir: 3, r: 170 },
  { id: 'ovningsangen', namn: 'Övningsängen', ikon: '🎯', dir: 4, r: 140 },
  { id: 'diagramdalen', namn: 'Diagramdalen', ikon: '📊', dir: 5, r: 170 },
  { id: 'ordskogen', namn: 'Ordskogen', ikon: '🌲', dir: 6, r: 140 },
  { id: 'kompasson', namn: 'Kompassön', ikon: '🧭', dir: 7, r: 185 },
];
const C = 205;
const plats = (id: string) => PLATSER.find((p) => p.id === id)!;

/** Platsens läge på kartan, när kartan är vriden vrid grader (norr pekar dit). */
function lage(p: (typeof PLATSER)[number], vrid = 0): [number, number] {
  if (p.dir < 0) return [C, C];
  const a = ((p.dir * 45 + vrid) * Math.PI) / 180;
  return [C + Math.sin(a) * p.r, C - Math.cos(a) * p.r];
}

/** Väderstreck (index) från en plats till en annan, om det är tydligt (inom 10° från mitten av ett väderstreck). */
function streckMellan(a: string, b: string): number | null {
  const [x1, y1] = lage(plats(a)), [x2, y2] = lage(plats(b));
  const deg = ((Math.atan2(x2 - x1, y1 - y2) * 180) / Math.PI + 360) % 360;
  const i = Math.round(deg / 45) % 8;
  return Math.abs(((deg - i * 45 + 540) % 360) - 180) <= 10 ? i : null;
}

const ON: Yta = { id: 'on', d: `M${C - 196} ${C}a196 196 0 1 0 392 0a196 196 0 1 0 -392 0z`, typ: 'land' };

/** Kartritarinnans karta. tap = platserna går att trycka på. */
function onKarta(vrid = 0, tap = false, ros = true): Karta {
  const prickar: Prick[] = PLATSER.map((p) => { const [x, y] = lage(p, vrid); return { id: p.id, x, y, ikon: p.ikon, namn: p.namn, tap, hit: 26 }; });
  return { w: 410, h: 410, hav: true, ytor: [ON], prickar, ros: ros ? { x: 382, y: 384, r: 17, vrid } : undefined, titel: 'Kartritarinnans karta över ön' };
}

/* ---------- väderstreck ---------- */

function vaderstreck(b: Base, rng: Rng, ctx?: QuestionCtx, trap?: string): GQ {
  // N står redan utskrivet på rosen, så det frågas inte. Fällan ost-vast tar bara öst/väst-hållen.
  const pool = (b.level === 0 ? [2, 4, 6] : [1, 2, 3, 4, 5, 6, 7]).filter((i) => trap !== 'ost-vast' || spegel(i) !== i);
  const i = dra(pool, rng, ctx, `vs/${b.level}/${trap ?? ''}`);
  const opts = b.level === 0 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6, 7];
  const wrong: Alt[] = opts.filter((j) => j !== i).map((j) => ({ text: STRECK[j], err: j === spegel(i) ? 'ost-vast' : 'fel-vaderstreck' }));
  return {
    ...b, kind: 'val', prompt: 'Åt vilket väderstreck pekar den röda pilen?',
    karta: { w: 160, h: 160, hav: false, ytor: [], ros: { x: 80, y: 80, r: 52, pil: KORT[i] }, titel: 'Kompassros' },
    answer: STRECK[i], alts: valj(rng, { text: STRECK[i] }, wrong, b.level === 0 ? 3 : 3, [trap, 'ost-vast']),
    los: `Pilen pekar mot ${STRECK[i]}. Medsols från norr: norr, nordost, öster, sydost, söder, sydväst, väster, nordväst.`,
    tips: 'Börja vid N, som står utskrivet, och gå medsols runt rosen.',
  };
}

/* ---------- vad ligger åt vilket håll ---------- */

function riktning(b: Base, rng: Rng, ctx?: QuestionCtx, trap?: string): GQ | null {
  if (b.level === 0) {
    // Från Azaleabyn, de fyra huvudvädersträcken. Svara med plats (val) eller tryck på platsen (peka).
    const dirs = trap === 'ost-vast' ? [2, 6] : [0, 2, 4, 6];
    const i = dra(dirs, rng, ctx, `r0/${trap ?? ''}`);
    const right = PLATSER.find((p) => p.dir === i)!;
    const tagOf = (dir: number) => (dir === spegel(i) && dir !== i ? 'ost-vast' : 'fel-riktning');
    const prompt = `Vad ligger ${STRECK[i]} om Azaleabyn?`;
    const base = { ...b, om: 'Azaleabyn', los: `${right.namn} ligger ${STRECK[i]} om Azaleabyn.`, tips: 'Titta på kompassrosen i hörnet. Var på kartan är det hållet?' };
    if (rng.next() < 0.5) {
      const wrong = PLATSER.filter((p) => p.dir >= 0 && p.dir % 2 === 0 && p.dir !== i).map((p) => ({ text: p.namn, err: tagOf(p.dir) }));
      return { ...base, kind: 'val', prompt, karta: onKarta(), lyser: ['azaleabyn'], answer: right.namn, alts: valj(rng, { text: right.namn }, wrong, 3, [trap, 'ost-vast']) };
    }
    const misses = Object.fromEntries(PLATSER.filter((p) => p.id !== right.id).map((p) => [p.id, p.dir < 0 ? 'fel-plats' : tagOf(p.dir)]));
    return { ...base, kind: 'peka', prompt: `${prompt} Tryck på platsen.`, karta: onKarta(0, true), lyser: ['azaleabyn'], answer: right.id, misses, visa: [right.id] };
  }
  // Nivå 1: mellan två platser, alla åtta väderstreck. Svara med väderstreck.
  const pairs: [string, string, number][] = [];
  for (const a of PLATSER) for (const c of PLATSER) {
    if (a === c) continue;
    const i = streckMellan(a.id, c.id);
    if (i !== null && (trap !== 'ost-vast' || spegel(i) !== i)) pairs.push([a.id, c.id, i]);
  }
  const [a, c, i] = dra(pairs, rng, ctx, `r1/${trap ?? ''}`);
  const wrong: Alt[] = [spegel(i), motsatt(i), (i + 1) % 8, (i + 7) % 8].filter((j) => j !== i).map((j) => ({ text: STRECK[j], err: j === spegel(i) ? 'ost-vast' : 'fel-riktning' }));
  return {
    ...b, kind: 'val', prompt: `Du går från ${plats(a).namn} till ${plats(c).namn}. Åt vilket håll går du?`,
    karta: onKarta(), lyser: [a, c], answer: STRECK[i], alts: valj(rng, { text: STRECK[i] }, wrong, 3, [trap, 'ost-vast']), om: plats(a).namn,
    los: `${plats(c).namn} ligger ${STRECK[i]} om ${plats(a).namn}.`,
    tips: `Lägg fingret på ${plats(a).namn}. Åt vilket håll på kompassrosen flyttar du det för att komma till ${plats(c).namn}?`,
  };
}

/* ---------- vriden karta (band 2) ---------- */

function vriden(b: Base, rng: Rng, ctx?: QuestionCtx, trap?: string): GQ {
  const vrid = dra([90, 180, 270], rng, ctx, 'vrid');
  const dirs = trap === 'ost-vast' ? [2, 6] : [0, 2, 4, 6];
  const i = dra(dirs, rng, ctx, `vr/${trap ?? ''}`);
  const right = PLATSER.find((p) => p.dir === i)!;
  // Det som ligger uppåt på skärmen är norr-upp-felet; spegelbilden är öst-väst-felet.
  const upp = PLATSER.find((p) => p.dir === (8 - vrid / 45 + i) % 8)!;
  const misses = Object.fromEntries(PLATSER.filter((p) => p.id !== right.id).map((p) => [
    p.id, p.dir < 0 ? 'fel-plats' : p.id === upp.id ? 'norr-upp' : p.dir === spegel(i) ? 'ost-vast' : 'fel-riktning',
  ]));
  return {
    ...b, kind: 'peka', prompt: `Den här kartan är vriden! Vad ligger ${STRECK[i]} om Azaleabyn? Tryck på platsen.`,
    karta: onKarta(vrid, true), lyser: ['azaleabyn'], answer: right.id, misses, visa: [right.id], om: 'Azaleabyn',
    los: `${right.namn} ligger ${STRECK[i]} om Azaleabyn. På den här kartan pekar N inte uppåt, så ${STRECK[i]} är inte där det brukar vara.`,
    tips: 'Titta på kompassrosen: åt vilket håll pekar N? Utgå från den.',
  };
}

/* ---------- kartsymboler och höjdfärger ---------- */

const SYMBOLER: { namn: string; rita: () => { ytor?: Yta[]; linjer?: Linje[]; prickar?: Prick[] } }[] = [
  { namn: 'Väg', rita: () => ({ linjer: [{ id: 's', d: 'M15 70 C50 30 90 90 145 45', typ: 'vag' }] }) },
  { namn: 'Järnväg', rita: () => ({ linjer: [{ id: 's', d: 'M15 70 C50 30 90 90 145 45', typ: 'jarnvag' }] }) },
  { namn: 'Sjö', rita: () => ({ ytor: [{ id: 's', d: 'M40 40 C70 15 125 25 125 55 C125 90 60 100 40 75 Z', typ: 'sjo' }] }) },
  { namn: 'Skog', rita: () => ({ ytor: [{ id: 's', d: 'M30 30 H130 V90 H30 Z', typ: 'skog' }] }) },
  { namn: 'Åker', rita: () => ({ ytor: [{ id: 's', d: 'M30 30 H130 V90 H30 Z', typ: 'aker' }] }) },
  { namn: 'Hus', rita: () => ({ prickar: [{ id: 's', x: 80, y: 60, stor: true }] }) },
];

function symboler(b: Base, rng: Rng, ctx?: QuestionCtx): GQ {
  if (b.level === 0 || rng.next() < 0.4) {
    const i = dra(SYMBOLER.map((_, k) => k), rng, ctx, 'sym');
    const s = SYMBOLER[i];
    const wrong = SYMBOLER.filter((_, k) => k !== i).map((x) => ({ text: x.namn, err: 'fel-symbol' }));
    return {
      ...b, kind: 'val', prompt: 'Vad visar den här kartsymbolen?',
      karta: { w: 160, h: 120, hav: false, ytor: [], ...s.rita(), titel: 'En kartsymbol' },
      answer: s.namn, alts: valj(rng, { text: s.namn }, wrong, 3),
      los: `Symbolen visar: ${s.namn.toLocaleLowerCase('sv')}.`, tips: 'Kartsymbolerna ser ut ungefär som det de visar. Titta på formen och färgen.',
    };
  }
  // Höjdfärger: tre kullar, tryck på den högsta (eller lägsta).
  const ordning = rng.shuffle(['hojd-lag', 'hojd-mellan', 'hojd-hog'] as const);
  const lagst = rng.next() < 0.3;
  const ytor: Yta[] = ordning.map((typ, k) => ({ id: `k${k}`, d: `M${30 + k * 120} 150 C${45 + k * 120} 70 ${115 + k * 120} 70 ${130 + k * 120} 150 Z`, typ, tap: true }));
  const right = `k${ordning.indexOf(lagst ? 'hojd-lag' : 'hojd-hog')}`;
  return {
    ...b, kind: 'peka', prompt: lagst ? 'Färgerna visar hur högt landet är. Tryck på det lägsta området.' : 'Färgerna visar hur högt landet är. Tryck på det högsta berget.',
    karta: { w: 400, h: 170, hav: false, ytor, titel: 'Tre områden med olika höjdfärg' },
    answer: right, misses: Object.fromEntries(ytor.filter((y) => y.id !== right).map((y) => [y.id, 'fel-hojd'])),
    los: 'Grönt är lågt land, gult och ljusbrunt är högre, och mörkbrunt är högst.', tips: 'På kartor betyder grönt lågt land och brunt högt land.',
  };
}

/* ---------- skala ---------- */

function skala(b: Base, rng: Rng, trap?: string): GQ | null {
  const k = b.level === 0 ? rng.pick([2, 3, 4, 5, 10]) : rng.pick([10, 20, 25, 50, 100]);
  const cm = 2 + rng.int(8);
  const [a, c] = rng.shuffle(PLATSER.filter((p) => p.dir >= 0)).slice(0, 2);
  const karta = onKarta(0, false);
  const kartaUt: Karta = { ...karta, skala: { x: 20, y: 395, px: 40, text: `1 cm = ${k} km` } };
  const tillbaka = b.level === 1 && !trap && rng.next() < 0.4;
  if (tillbaka) {
    const km = cm * k;
    const cand: Record<string, string> = { [String(km * k)]: 'skala-bakvand', [String(km)]: 'skala-glomd' };
    if (cand[String(cm)]) return null;
    return {
      ...b, kind: 'tal', om: 'tillbaka', prompt: `Från ${a.namn} till ${c.namn} är det ${km} km i verkligheten. Skalan är 1 cm = ${k} km. Hur många cm är det på kartan?`,
      karta: kartaUt, lyser: [a.id, c.id], answer: String(cm), enhet: 'cm', cand,
      los: `Varje cm på kartan är ${k} km. ${km} km delat med ${k} är ${cm} cm.`,
      tips: 'På kartan är allt mindre. Hur många gånger får skalans kilometer plats i sträckan?',
    };
  }
  const km = cm * k;
  const cand: Record<string, string> = { [String(cm)]: 'skala-glomd', [String(cm + k)]: 'skala-plus' };
  if (Number.isInteger((cm * 10) / k)) cand[String(cm / k)] = 'skala-bakvand';
  if (cand[String(km)] || cm + k === km) return null;
  return {
    ...b, kind: 'tal', prompt: `På kartan är det ${cm} cm från ${a.namn} till ${c.namn}. Skalan är 1 cm = ${k} km. Hur långt är det i verkligheten?`,
    karta: kartaUt, lyser: [a.id, c.id], answer: String(km), enhet: 'km', cand,
    los: `Varje cm på kartan är ${k} km i verkligheten. ${cm} · ${k} = ${km} km.`,
    tips: 'Varje centimeter på kartan är lika många kilometer som skalan säger. Hur många centimeter är det?',
  };
}

/* ---------- spelet ---------- */

interface Base { mode: string; level: number; skill: string }

const MODES = ['vaderstreck', 'riktning', 'symboler', 'skala'] as const;

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): GQ | null {
  const mode = (spec.mode === 'blandat' ? rng.pick(spec.trap === 'ost-vast' ? ['vaderstreck', 'riktning'] as const : MODES) : spec.mode) as Exclude<KartMode, 'blandat'>;
  const b: Base = { mode, level: Math.min(Math.max(0, spec.level), MAX[mode]), skill: SKILL[mode] };
  switch (mode) {
    case 'vaderstreck': return vaderstreck(b, rng, ctx, spec.trap);
    case 'riktning': return riktning(b, rng, ctx, spec.trap);
    case 'symboler': return symboler(b, rng, ctx);
    case 'skala': return skala(b, rng, spec.trap);
    case 'vriden': return vriden(b, rng, ctx, spec.trap);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const mode = (Object.keys(SKILL) as (keyof typeof SKILL)[]).find((m) => SKILL[m] === skill);
  return mode ? Array.from({ length: MAX[mode] + 1 }, (_, level) => ({ mode, level })) : [];
}

/** Till Klassrummet: kartan och en kompassros med alla bokstäver. */
export const EXEMPEL_KARTA = onKarta();
export const EXEMPEL_ROS: Karta = { w: 200, h: 200, hav: false, ytor: [], ros: { x: 100, y: 100, r: 62, alla: true }, titel: 'Kompassros med alla väderstreck' };
