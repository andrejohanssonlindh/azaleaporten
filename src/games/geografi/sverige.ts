import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { projektor, vyById } from '../../engines/karta/proj';
import type { Alt, Karta, Prick, Yta } from '../../engines/karta/types';
import { LAND_BY_ID, LAND_BY_ISO, NORDEN } from './land';
import { VY, grannar, landKarta } from './kartor';
import { dra, valj, type GQ } from './gen';

// Sverigeresan (åk 1–6): flyg över Sverige som Nils Holgersson. Städer, sjöar, öar och Kebnekaise,
// grannländerna och Norden, landsdelarna och (band 2) landskapen.
// Lägen, färdighets-id:n och felkoder är permanenta. Städernas lägen är ungefärliga (grader).

export type SverigeMode = 'stader' | 'natur' | 'norden' | 'landsdelar' | 'landskap' | 'blandat';

const SKILL: Record<Exclude<SverigeMode, 'blandat'>, string> = {
  stader: 'geo.sverige.stader', natur: 'geo.sverige.natur', norden: 'geo.sverige.norden', landsdelar: 'geo.sverige.landsdelar', landskap: 'geo.sverige.landskap',
};
const MAX: Record<Exclude<SverigeMode, 'blandat'>, number> = { stader: 1, natur: 1, norden: 1, landsdelar: 0, landskap: 0 };

interface Base { mode: string; level: number; skill: string }

type Landsdel = 'Götaland' | 'Svealand' | 'Norrland';

/** Städer: namn, longitud, latitud, landskap (null = ligger i två), landsdel, stor (band 1). */
export const STADER: { namn: string; lon: number; lat: number; landskap: string | null; del: Landsdel; stor?: boolean }[] = [
  { namn: 'Stockholm', lon: 18.07, lat: 59.33, landskap: null, del: 'Svealand', stor: true },
  { namn: 'Göteborg', lon: 11.97, lat: 57.71, landskap: 'Västergötland', del: 'Götaland', stor: true },
  { namn: 'Malmö', lon: 13.0, lat: 55.6, landskap: 'Skåne', del: 'Götaland', stor: true },
  { namn: 'Uppsala', lon: 17.64, lat: 59.86, landskap: 'Uppland', del: 'Svealand', stor: true },
  { namn: 'Kiruna', lon: 20.22, lat: 67.86, landskap: 'Lappland', del: 'Norrland', stor: true },
  { namn: 'Umeå', lon: 20.26, lat: 63.83, landskap: 'Västerbotten', del: 'Norrland', stor: true },
  { namn: 'Luleå', lon: 22.15, lat: 65.58, landskap: 'Norrbotten', del: 'Norrland', stor: true },
  { namn: 'Visby', lon: 18.29, lat: 57.64, landskap: 'Gotland', del: 'Götaland', stor: true },
  { namn: 'Västerås', lon: 16.54, lat: 59.61, landskap: 'Västmanland', del: 'Svealand' },
  { namn: 'Örebro', lon: 15.21, lat: 59.27, landskap: 'Närke', del: 'Svealand' },
  { namn: 'Linköping', lon: 15.62, lat: 58.41, landskap: 'Östergötland', del: 'Götaland' },
  { namn: 'Jönköping', lon: 14.16, lat: 57.78, landskap: 'Småland', del: 'Götaland' },
  { namn: 'Helsingborg', lon: 12.69, lat: 56.05, landskap: 'Skåne', del: 'Götaland' },
  { namn: 'Gävle', lon: 17.14, lat: 60.67, landskap: 'Gästrikland', del: 'Norrland' },
  { namn: 'Sundsvall', lon: 17.31, lat: 62.39, landskap: 'Medelpad', del: 'Norrland' },
  { namn: 'Östersund', lon: 14.64, lat: 63.18, landskap: 'Jämtland', del: 'Norrland' },
  { namn: 'Karlstad', lon: 13.5, lat: 59.38, landskap: 'Värmland', del: 'Svealand' },
  { namn: 'Kalmar', lon: 16.36, lat: 56.66, landskap: 'Småland', del: 'Götaland' },
  { namn: 'Falun', lon: 15.63, lat: 60.61, landskap: 'Dalarna', del: 'Svealand' },
  { namn: 'Halmstad', lon: 12.86, lat: 56.67, landskap: 'Halland', del: 'Götaland' },
  { namn: 'Karlskrona', lon: 15.59, lat: 56.16, landskap: 'Blekinge', del: 'Götaland' },
  { namn: 'Nyköping', lon: 17.0, lat: 58.75, landskap: 'Södermanland', del: 'Svealand' },
];

export const LANDSKAP: Record<Landsdel, string[]> = {
  Götaland: ['Skåne', 'Blekinge', 'Halland', 'Småland', 'Öland', 'Gotland', 'Östergötland', 'Västergötland', 'Bohuslän', 'Dalsland'],
  Svealand: ['Värmland', 'Närke', 'Västmanland', 'Uppland', 'Södermanland', 'Dalarna'],
  Norrland: ['Gästrikland', 'Hälsingland', 'Härjedalen', 'Jämtland', 'Medelpad', 'Ångermanland', 'Västerbotten', 'Norrbotten', 'Lappland'],
};

/** De stora sjöarna (ungefärliga konturer, grader). */
const SJOAR: { id: string; namn: string; poly: [number, number][] }[] = [
  { id: 'vanern', namn: 'Vänern', poly: [[12.4, 58.65], [12.55, 59.05], [12.95, 59.35], [13.35, 59.4], [13.75, 59.3], [14.1, 59.15], [13.95, 58.85], [13.55, 58.7], [13.25, 58.55], [12.9, 58.4], [12.55, 58.45]] },
  { id: 'vattern', namn: 'Vättern', poly: [[14.1, 57.8], [14.3, 57.8], [14.55, 58.1], [14.8, 58.45], [14.8, 58.75], [14.65, 58.85], [14.45, 58.55], [14.25, 58.2]] },
  { id: 'malaren', namn: 'Mälaren', poly: [[16.15, 59.4], [16.6, 59.55], [17.1, 59.62], [17.6, 59.55], [17.95, 59.35], [17.6, 59.32], [17.1, 59.3], [16.6, 59.35]] },
  { id: 'hjalmaren', namn: 'Hjälmaren', poly: [[15.3, 59.2], [15.7, 59.25], [16.2, 59.25], [16.3, 59.15], [15.8, 59.1], [15.4, 59.1]] },
  { id: 'storsjon', namn: 'Storsjön', poly: [[14.3, 63.05], [14.55, 63.0], [14.75, 63.2], [14.6, 63.35], [14.35, 63.3]] },
  { id: 'siljan', namn: 'Siljan', poly: [[14.55, 60.85], [14.9, 60.8], [15.05, 61.0], [14.8, 61.1], [14.55, 61.0]] },
];
const KEBNEKAISE = { lon: 18.53, lat: 67.9 };

const sid = (namn: string) => `stad-${namn.toLocaleLowerCase('sv')}`;
const PR = () => projektor(vyById('sverige'));

/** Landskapet i kartdatan (namnen där kan ha tillägg, t.ex. "Lappland (Lappmarken)"). */
const landskapIData = (namn: string) => Object.keys(VY.sverige.landskap ?? {}).find((k) => k === namn || k.startsWith(`${namn} `));

/**
 * Sverigekartan. stader = städer som visas (tap = går att trycka på). sjoar = sjöarna går att trycka på.
 * oar = Öland och Gotland går att trycka på. landskap = rita landskapsgränserna.
 */
function sverigeKarta(o: { stader?: string[]; tapStader?: boolean; sjoar?: 'visa' | 'tap'; oar?: boolean; landskap?: boolean; berg?: boolean } = {}): Karta {
  const v = VY.sverige, pr = PR();
  const ytor: Yta[] = [];
  for (const [iso, u] of Object.entries(v.lander)) {
    if (u.d) ytor.push({ id: `x${iso}`, d: u.d, typ: iso === '752' ? 'land' : 'bakland', namn: LAND_BY_ISO[iso]?.namn });
  }
  if (o.landskap || o.oar) {
    for (const [namn, u] of Object.entries(v.landskap ?? {})) {
      const ö = o.oar && (namn.startsWith('Gotland') || namn.startsWith('Öland'));
      if (o.landskap || ö) ytor.push({ id: `ls-${namn}`, d: u.d, typ: 'land', tap: !!ö, namn: namn.split(' ')[0], lx: u.x + (ö ? 18 : 0), ly: u.y });
    }
  }
  if (o.sjoar) {
    for (const s of SJOAR) {
      const pts = s.poly.map(([lo, la]) => pr.p(lo, la));
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      ytor.push({ id: s.id, d: `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`, typ: 'sjo', tap: o.sjoar === 'tap', namn: s.namn, lx: cx - 30, ly: cy });
    }
  }
  const prickar: Prick[] = [];
  for (const namn of o.stader ?? []) {
    const s = STADER.find((x) => x.namn === namn)!;
    const [x, y] = pr.p(s.lon, s.lat);
    prickar.push({ id: sid(namn), x, y, namn, stor: namn === 'Stockholm', tap: !!o.tapStader });
  }
  if (o.berg) { const [x, y] = pr.p(KEBNEKAISE.lon, KEBNEKAISE.lat); prickar.push({ id: 'kebnekaise', x, y, ikon: '⛰️', namn: 'Kebnekaise' }); }
  for (const p of prickar) {
    let near = Infinity;
    for (const q of prickar) if (q !== p) near = Math.min(near, Math.hypot(p.x - q.x, p.y - q.y));
    p.hit = Math.max(6, Math.min(14, near / 2));
  }
  return { w: v.w, h: v.h, hav: true, ytor, prickar, titel: 'Karta över Sverige' };
}

/* ---------- städer ---------- */

function stader(b: Base, rng: Rng, ctx?: QuestionCtx): GQ {
  const pool = STADER.filter((s) => b.level > 0 || s.stor);
  const s = dra(pool, rng, ctx, `stad/${b.level}`);
  const visas = b.level === 0 ? pool.map((x) => x.namn) : rng.shuffle(pool.filter((x) => x !== s)).slice(0, 7).map((x) => x.namn).concat(s.namn);
  if (rng.next() < 0.5) {
    return {
      ...b, kind: 'peka', prompt: `Var ligger ${s.namn}? Tryck på staden.`, karta: sverigeKarta({ stader: visas, tapStader: true }), answer: sid(s.namn), visa: [sid(s.namn)],
      misses: Object.fromEntries(visas.filter((n) => n !== s.namn).map((n) => [sid(n), 'fel-stad'])),
      los: `${s.namn} ligger i ${s.del}.`, tips: s.del === 'Norrland' ? 'Staden ligger långt norrut.' : s.del === 'Svealand' ? 'Staden ligger i mellersta Sverige.' : 'Staden ligger i södra Sverige.',
    };
  }
  const wrong: Alt[] = visas.filter((n) => n !== s.namn).map((n) => ({ text: n, err: 'fel-stad' }));
  return {
    ...b, kind: 'val', prompt: 'Vilken stad är markerad?', karta: sverigeKarta({ stader: visas }), lyser: [sid(s.namn)], visa: [sid(s.namn)], answer: s.namn,
    alts: valj(rng, { text: s.namn }, wrong, 3), los: `Det är ${s.namn}.`,
    tips: s.del === 'Norrland' ? 'Staden ligger långt norrut.' : s.del === 'Svealand' ? 'Staden ligger i mellersta Sverige.' : 'Staden ligger i södra Sverige.',
  };
}

/* ---------- sjöar, öar och berg ---------- */

function natur(b: Base, rng: Rng, ctx?: QuestionCtx): GQ | null {
  const typ = dra(b.level === 0 ? ['sjo', 'sjo', 'storst', 'berg', 'o'] : ['sjo', 'sjo', 'namnsjo', 'storst', 'berg', 'o', 'o'], rng, ctx, `natur/${b.level}`);
  const sjoPool = b.level === 0 ? SJOAR.slice(0, 3) : SJOAR;
  if (typ === 'sjo') {
    const s = rng.pick(sjoPool);
    return {
      ...b, kind: 'peka', prompt: `Tryck på ${s.namn}.`, karta: sverigeKarta({ sjoar: 'tap' }), answer: s.id, visa: [s.id], om: s.namn,
      misses: Object.fromEntries(SJOAR.filter((x) => x !== s).map((x) => [x.id, 'fel-plats'])),
      los: `Där ligger ${s.namn}.`, tips: 'Vänern är störst, och Vättern är lång och smal strax öster om den. Mälaren ligger vid Stockholm.',
    };
  }
  if (typ === 'namnsjo') {
    const s = rng.pick(SJOAR);
    const wrong = SJOAR.filter((x) => x !== s).map((x) => ({ text: x.namn, err: 'fel-plats' }));
    return {
      ...b, kind: 'val', prompt: 'Vilken sjö är markerad?', karta: sverigeKarta({ sjoar: 'visa' }), lyser: [s.id], visa: [s.id], answer: s.namn,
      alts: valj(rng, { text: s.namn }, wrong, 3), los: `Det är ${s.namn}.`, tips: 'Titta var i Sverige sjön ligger, och hur stor den är.',
    };
  }
  if (typ === 'storst') {
    const wrong = SJOAR.filter((x) => x.id !== 'vanern').map((x) => ({ text: x.namn, err: 'fel-plats' }));
    return {
      ...b, kind: 'val', prompt: 'Vilken är Sveriges största sjö?', karta: sverigeKarta({ sjoar: 'visa' }), answer: 'Vänern', visa: ['vanern'],
      alts: valj(rng, { text: 'Vänern' }, wrong, 3), los: 'Vänern är Sveriges största sjö – och en av Europas största.', tips: 'Titta på kartan: vilken sjö är störst?',
    };
  }
  if (typ === 'berg') {
    const wrong = ['Åreskutan', 'Sylarna', 'Helagsfjället', 'Sarektjåkkå'].map((text) => ({ text, err: 'fel-plats' }));
    return {
      ...b, kind: 'val', prompt: 'Vilket är Sveriges högsta berg? Det är markerat på kartan.', karta: sverigeKarta({ berg: true }), lyser: ['kebnekaise'], visa: ['kebnekaise'], answer: 'Kebnekaise',
      alts: valj(rng, { text: 'Kebnekaise' }, wrong, 3), los: 'Kebnekaise i Lappland är Sveriges högsta berg, drygt 2 000 meter högt.', tips: 'Berget ligger långt uppe i norr, i Lappland.',
    };
  }
  // Öarna: Gotland och Öland.
  const gotland = landskapIData('Gotland'), oland = landskapIData('Öland');
  if (!gotland || !oland) return null;
  const vem = rng.pick([['Gotland', gotland], ['Öland', oland]] as const);
  const andra = vem[0] === 'Gotland' ? oland : gotland;
  if (rng.next() < 0.5) {
    return {
      ...b, kind: 'peka', prompt: `Tryck på ${vem[0]}.`, karta: sverigeKarta({ oar: true }), answer: `ls-${vem[1]}`, visa: [`ls-${vem[1]}`],
      misses: { [`ls-${andra}`]: 'fel-plats' }, los: `Där ligger ${vem[0]}.`, tips: 'Gotland är Sveriges största ö och ligger mitt ute i Östersjön. Öland är lång och smal och ligger nära land.',
    };
  }
  return {
    ...b, kind: 'val', prompt: 'Vilken är Sveriges största ö?', karta: sverigeKarta({ oar: true }), answer: 'Gotland', visa: [`ls-${gotland}`],
    alts: valj(rng, { text: 'Gotland' }, [{ text: 'Öland', err: 'fel-plats' }, { text: 'Orust', err: 'fel-plats' }, { text: 'Tjörn', err: 'fel-plats' }], 3),
    los: 'Gotland är Sveriges största ö.', tips: 'Titta på kartan: vilken ö är störst?',
  };
}

/* ---------- Norden och grannarna ---------- */

function norden(b: Base, rng: Rng, ctx?: QuestionCtx, trap?: string): GQ | null {
  const typ = trap === 'granne' ? 'peka' : dra(b.level === 0 ? ['peka', 'peka', 'namnge'] : ['peka', 'namnge', 'inte', 'grannar'], rng, ctx, `norden/${b.level}`);
  const pool = trap === 'granne' ? ['sverige', 'norge', 'finland'] : NORDEN;
  const id = rng.pick(pool);
  const l = LAND_BY_ID[id];
  const tag = (x: string) => (grannar(id).includes(x) ? 'granne' : 'fel-land');
  if (typ === 'peka') {
    return {
      ...b, kind: 'peka', prompt: `Tryck på ${l.namn}.`, karta: landKarta('norden', NORDEN), answer: id, visa: [id], om: l.namn,
      misses: Object.fromEntries(NORDEN.filter((x) => x !== id).map((x) => [x, tag(x)])),
      los: `Där ligger ${l.namn}.`, tips: 'Sverige ligger i mitten. Norge ligger väster om Sverige, Finland öster om, och Danmark söder om.',
    };
  }
  if (typ === 'namnge') {
    const wrong = NORDEN.filter((x) => x !== id).map((x) => ({ text: LAND_BY_ID[x].namn, err: tag(x) }));
    return {
      ...b, kind: 'val', prompt: 'Vilket land är markerat?', karta: landKarta('norden', [], [id]), lyser: [id], visa: [id], answer: l.namn,
      alts: valj(rng, { text: l.namn }, wrong, 3, ['granne']), om: l.namn, los: `Det är ${l.namn}.`, tips: 'Titta var landet ligger: i väster, i öster, i söder – eller långt ute i havet?',
    };
  }
  if (typ === 'inte') {
    const right = rng.pick(['tyskland', 'estland', 'polen', 'storbritannien', 'nederlanderna']);
    const wrong = rng.shuffle(NORDEN).slice(0, 3).map((x) => ({ text: LAND_BY_ID[x].namn, err: 'fel-land' }));
    return {
      ...b, kind: 'val', prompt: 'Vilket av länderna hör INTE till Norden?', answer: LAND_BY_ID[right].namn, alts: valj(rng, { text: LAND_BY_ID[right].namn }, wrong, 3),
      los: `${LAND_BY_ID[right].namn} hör inte till Norden. Norden är Sverige, Norge, Danmark, Finland och Island.`, tips: 'Norden är fem länder högst upp i Europa. Vilket av länderna ligger längre söderut?',
    };
  }
  // Vilket land gränsar till Sverige?
  const right = rng.pick(['norge', 'finland']);
  const wrong = ['danmark', 'island', 'estland', 'tyskland'].map((x) => ({ text: LAND_BY_ID[x].namn, err: 'fel-land' }));
  return {
    ...b, kind: 'val', prompt: 'Vilket land har en gräns mot Sverige på land?', karta: landKarta('norden', [], ['sverige']), lyser: ['sverige'], answer: LAND_BY_ID[right].namn,
    alts: valj(rng, { text: LAND_BY_ID[right].namn }, wrong, 3), los: 'Sverige har gräns på land mot Norge och Finland. Till Danmark går det en bro över Öresund.',
    tips: 'Titta på kartan: vilka länder sitter ihop med Sverige?',
  };
}

/* ---------- landsdelar och landskap ---------- */

function landsdelar(b: Base, rng: Rng, ctx?: QuestionCtx): GQ {
  const s = dra(STADER, rng, ctx, 'landsdel');
  const wrong = (['Götaland', 'Svealand', 'Norrland'] as Landsdel[]).filter((d) => d !== s.del).map((text) => ({ text, err: 'fel-landsdel' }));
  return {
    ...b, kind: 'val', prompt: `I vilken landsdel ligger ${s.namn}?`, karta: sverigeKarta({ stader: [s.namn] }), lyser: [sid(s.namn)], om: s.namn, answer: s.del,
    alts: valj(rng, { text: s.del }, wrong, 2), los: `${s.namn} ligger i ${s.del}. Sverige har tre landsdelar: Götaland i söder, Svealand i mitten och Norrland i norr.`,
    tips: 'Titta var staden ligger på kartan: långt söderut, i mitten eller långt norrut?',
  };
}

function landskap(b: Base, rng: Rng, ctx?: QuestionCtx): GQ {
  const s = dra(STADER.filter((x) => x.landskap), rng, ctx, 'landskap');
  const wrong = LANDSKAP[s.del].filter((x) => x !== s.landskap).map((text) => ({ text, err: 'fel-landskap' }));
  return {
    ...b, kind: 'val', prompt: `I vilket landskap ligger ${s.namn}?`, karta: sverigeKarta({ stader: [s.namn], landskap: true }), lyser: [sid(s.namn)], om: s.namn, answer: s.landskap!,
    alts: valj(rng, { text: s.landskap! }, wrong, 3), los: `${s.namn} ligger i ${s.landskap}, i ${s.del}.`,
    tips: `Staden ligger i ${s.del}. Vilka landskap finns där?`,
  };
}

/* ---------- spelet ---------- */

const MODES = ['stader', 'natur', 'norden', 'landsdelar'] as const;

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): GQ | null {
  const mode = (spec.mode === 'blandat' ? (spec.trap === 'granne' ? 'norden' : rng.pick(MODES)) : spec.mode) as Exclude<SverigeMode, 'blandat'>;
  const b: Base = { mode, level: Math.min(Math.max(0, spec.level), MAX[mode]), skill: SKILL[mode] };
  switch (mode) {
    case 'stader': return stader(b, rng, ctx);
    case 'natur': return natur(b, rng, ctx);
    case 'norden': return norden(b, rng, ctx, spec.trap);
    case 'landsdelar': return landsdelar(b, rng, ctx);
    case 'landskap': return landskap(b, rng, ctx);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const mode = (Object.keys(SKILL) as (keyof typeof SKILL)[]).find((m) => SKILL[m] === skill);
  return mode ? Array.from({ length: MAX[mode] + 1 }, (_, level) => ({ mode, level })) : [];
}

/** Till Klassrummet: Norden. */
export const EXEMPEL_NORDEN = () => landKarta('norden', [], NORDEN);
