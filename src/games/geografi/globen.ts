import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt } from '../../engines/karta/types';
import { DELAR, HAV, LAND, delNamn, type Del } from './land';
import { META, VY, delAv, varldKarta } from './kartor';
import { dra, valj, type GQ } from './gen';

// Globen (åk 1–6): de sju världsdelarna och de fem haven. Peka ut dem, säg vad som är markerat,
// och "Vilken världsdel ligger X i?" – med Grönland, Mexiko och öarna kring Indonesien som medvetna fällor.
// Lägen, färdighets-id:n och felkoder är permanenta.

export type GlobMode = 'delar' | 'hav' | 'land' | 'blandat';

const SKILL: Record<Exclude<GlobMode, 'blandat'>, string> = { delar: 'geo.varldsdel.namn', hav: 'geo.varldsdel.hav', land: 'geo.varldsdel.land' };
const MAX: Record<Exclude<GlobMode, 'blandat'>, number> = { delar: 1, hav: 1, land: 1 };

interface Base { mode: string; level: number; skill: string }

const fullNamn = (d: Del) => (d === 'oceanien' ? 'Australien (som också kallas Oceanien)' : delNamn(d));

/** Felkoden när barnet väljer världsdel `fel` för något som ligger i `ratt`. */
function delTag(ratt: Del, fel: Del, om?: string): string {
  if (om === 'gronland' && fel === 'europa') return 'politisk';
  const amerika: Del[] = ['nordamerika', 'sydamerika'], oa: Del[] = ['asien', 'oceanien'];
  if (amerika.includes(ratt) && amerika.includes(fel)) return 'nord-syd-amerika';
  if (oa.includes(ratt) && oa.includes(fel)) return 'oceanien-asien';
  return 'fel-varldsdel';
}

/* ---------- världsdelarna ---------- */

function delar(b: Base, rng: Rng, ctx?: QuestionCtx, trap?: string): GQ | null {
  const typ = b.level === 0 || trap ? rng.pick(['peka', 'namnge'] as const) : rng.pick(['peka', 'namnge', 'storst', 'ekvator'] as const);
  const d = dra(DELAR.map((x) => x.id), rng, ctx, `delar/${b.level}`);
  if (typ === 'peka') {
    return {
      ...b, kind: 'peka', prompt: `Tryck på ${delNamn(d)}.`, karta: varldKarta({ delar: true }), answer: d, visa: [d],
      misses: Object.fromEntries(DELAR.filter((x) => x.id !== d).map((x) => [x.id, delTag(d, x.id)])),
      los: `Där ligger ${fullNamn(d)}.`, tips: 'Det finns sju världsdelar. Tänk på var vi bor – i Europa – och utgå därifrån.',
    };
  }
  if (typ === 'namnge') {
    const wrong: Alt[] = DELAR.filter((x) => x.id !== d).map((x) => ({ text: x.namn, err: delTag(d, x.id) }));
    return {
      ...b, kind: 'val', prompt: 'Vilken världsdel är markerad?', karta: varldKarta(), lyser: [d], visa: [d], answer: delNamn(d),
      alts: valj(rng, { text: delNamn(d) }, wrong, 3, [trap, 'nord-syd-amerika', 'oceanien-asien']),
      los: `Det är ${fullNamn(d)}.`, tips: 'Titta på formen och var den ligger. Ligger den norr eller söder om ekvatorn?',
    };
  }
  if (typ === 'storst') {
    const minst = rng.next() < 0.4;
    const right: Del = minst ? 'oceanien' : 'asien';
    const wrong = (['europa', 'afrika', 'nordamerika', 'sydamerika', 'antarktis', 'asien', 'oceanien'] as Del[]).filter((x) => x !== right).map((x) => ({ text: delNamn(x), err: 'fel-varldsdel' }));
    return {
      ...b, kind: 'val', prompt: minst ? 'Vilken är den minsta världsdelen?' : 'Vilken är den största världsdelen?', karta: varldKarta(), answer: delNamn(right),
      alts: valj(rng, { text: delNamn(right) }, wrong, 3, minst ? [] : []), visa: [right],
      los: minst ? 'Den minsta världsdelen är Australien, som också kallas Oceanien.' : 'Asien är störst – nästan en tredjedel av all land på jorden.',
      tips: 'Jämför världsdelarnas storlek på kartan.',
    };
  }
  return ekvator(b, rng, ctx);
}

/** Ligger det norr eller söder om ekvatorn? */
const EKVATOR: { id: string; namn: string; norr: boolean; del?: Del }[] = [
  { id: 'europa', namn: 'Europa', norr: true, del: 'europa' }, { id: 'nordamerika', namn: 'Nordamerika', norr: true, del: 'nordamerika' },
  { id: 'antarktis', namn: 'Antarktis', norr: false, del: 'antarktis' },
  { id: 'sverige', namn: 'Sverige', norr: true }, { id: 'kanada', namn: 'Kanada', norr: true }, { id: 'japan', namn: 'Japan', norr: true },
  { id: 'argentina', namn: 'Argentina', norr: false }, { id: 'sydafrika', namn: 'Sydafrika', norr: false },
  { id: 'nyazeeland', namn: 'Nya Zeeland', norr: false }, { id: 'chile', namn: 'Chile', norr: false },
];

function ekvator(b: Base, rng: Rng, ctx?: QuestionCtx): GQ {
  const e = dra(EKVATOR, rng, ctx, 'ekv');
  const right = e.norr ? 'Norr om ekvatorn' : 'Söder om ekvatorn';
  const alts = valj(rng, { text: right }, [{ text: e.norr ? 'Söder om ekvatorn' : 'Norr om ekvatorn', err: 'norr-soder' }, { text: 'Precis på ekvatorn', err: 'norr-soder' }], 2);
  return {
    ...b, kind: 'val', prompt: `Var ligger ${e.namn}, jämfört med ekvatorn?`, om: e.namn,
    karta: varldKarta({ ekvator: true, prick: e.del ? undefined : e.id }), lyser: [e.del ?? e.id],
    answer: right, alts, los: `${e.namn} ligger ${e.norr ? 'norr' : 'söder'} om ekvatorn.`, tips: 'Hitta den streckade linjen, ekvatorn. Ligger det ovanför eller nedanför den?',
  };
}

/* ---------- haven ---------- */

const MELLAN: { fraga: string; hav: string }[] = [
  { fraga: 'Vilket hav ligger mellan Europa och Nordamerika?', hav: 'atlanten' },
  { fraga: 'Vilket hav ligger mellan Afrika och Australien?', hav: 'indiska' },
  { fraga: 'Vilket hav ligger mellan Asien och Nordamerika?', hav: 'stilla' },
  { fraga: 'Vilket är det största havet?', hav: 'stilla' },
  { fraga: 'Vilket hav ligger runt Antarktis?', hav: 'sodra' },
  { fraga: 'Vilket hav ligger runt Nordpolen?', hav: 'norra' },
];

function hav(b: Base, rng: Rng, ctx?: QuestionCtx): GQ {
  const pool = b.level === 0 ? HAV.slice(0, 3) : HAV;
  const typ = b.level === 0 ? rng.pick(['peka', 'namnge'] as const) : rng.pick(['peka', 'namnge', 'mellan'] as const);
  const namn = (id: string) => HAV.find((x) => x.id === id)!.namn;
  if (typ === 'mellan') {
    const m = dra(MELLAN, rng, ctx, 'mellan');
    const wrong = HAV.filter((x) => x.id !== m.hav).map((x) => ({ text: x.namn, err: 'fel-hav' }));
    return {
      ...b, kind: 'val', prompt: m.fraga, karta: varldKarta({ hav: true }), answer: namn(m.hav), alts: valj(rng, { text: namn(m.hav) }, wrong, 3), visa: [m.hav],
      los: `Det är ${namn(m.hav)}.`, tips: 'Titta på kartan: vilket hav finns på det stället?',
    };
  }
  const h = dra(pool, rng, ctx, `hav/${b.level}`);
  if (typ === 'peka') {
    return {
      ...b, kind: 'peka', prompt: `Tryck på ${h.namn}.`, karta: varldKarta({ hav: true }), answer: h.id, visa: [h.id],
      misses: Object.fromEntries(HAV.filter((x) => x.id !== h.id).map((x) => [x.id, 'fel-hav'])),
      los: `Där ligger ${h.namn}.`, tips: 'Det största havet ligger mellan Asien och Amerika. Atlanten ligger mellan Europa och Amerika.',
    };
  }
  const wrong = pool.filter((x) => x.id !== h.id).map((x) => ({ text: x.namn, err: 'fel-hav' }));
  return {
    ...b, kind: 'val', prompt: 'Vilket hav är markerat?', karta: varldKarta({ hav: true }), lyser: [h.id], visa: [h.id], answer: h.namn,
    alts: valj(rng, { text: h.namn }, wrong, 3), los: `Det är ${h.namn}.`, tips: 'Vilka världsdelar ligger runt havet?',
  };
}

/* ---------- vilken världsdel ligger landet i? ---------- */

interface Sak { id: string; namn: string; del: Del; band: 1 | 2 }

// Landet Australien frågas inte (svaret skulle stå i frågan). Grönland är inget land, men en ö som hör till Danmark.
const SAKER: Sak[] = [
  ...LAND.filter((l) => l.id !== 'australien' && delAv(l.id)).map((l) => ({ id: l.id, namn: l.namn, del: delAv(l.id)!, band: l.band })),
  { id: 'gronland', namn: 'Grönland', del: 'nordamerika', band: 1 },
];
// Sakerna som fällorna gäller.
const FALLA: Record<string, string[]> = {
  politisk: ['gronland'], 'nord-syd-amerika': ['mexiko', 'kuba', 'panama', 'costarica', 'guatemala', 'jamaica', 'colombia', 'venezuela'],
  'oceanien-asien': ['indonesien', 'papuanyaguinea', 'filippinerna', 'nyazeeland'],
};
const TVA: { id: string; namn: string; delar: [Del, Del] }[] = [
  { id: 'ryssland', namn: 'Ryssland', delar: ['europa', 'asien'] }, { id: 'turkiet', namn: 'Turkiet', delar: ['europa', 'asien'] },
  { id: 'egypten', namn: 'Egypten', delar: ['afrika', 'asien'] },
];

function landDel(b: Base, rng: Rng, ctx?: QuestionCtx, trap?: string): GQ {
  if (b.level === 1 && !trap && rng.next() < 0.15) {
    const t = dra(TVA, rng, ctx, 'tva');
    const par = (a: Del, c: Del) => `${delNamn(a)} och ${delNamn(c)}`;
    const right = par(...t.delar);
    const wrong = [par('europa', 'afrika'), par('asien', 'oceanien'), par('asien', 'nordamerika'), par('europa', 'nordamerika')].filter((x) => x !== right).map((text) => ({ text, err: 'fel-varldsdel' }));
    return {
      ...b, kind: 'val', prompt: `${t.namn} ligger i två världsdelar. Vilka?`, om: t.namn, karta: varldKarta({ prick: t.id }), answer: right, alts: valj(rng, { text: right }, wrong, 3),
      los: `${t.namn} ligger i två världsdelar: ${right}.`, tips: 'Titta var landet ligger. Gränsen mellan världsdelarna går rakt igenom det.',
    };
  }
  const fall = trap && FALLA[trap] ? SAKER.filter((s) => FALLA[trap].includes(s.id)) : null;
  const pool = fall ?? SAKER.filter((s) => (b.level === 0 ? s.band === 1 : true));
  const s = dra(pool, rng, ctx, `land/${b.level}/${trap ?? ''}`);
  const valbara = (b.level === 0 ? DELAR.filter((d) => d.id !== 'antarktis') : DELAR).filter((d) => d.id !== s.del);
  const wrong: Alt[] = valbara.map((d) => ({ text: d.namn, err: delTag(s.del, d.id, s.id) }));
  const kartan = b.level === 0 || s.id === 'gronland';
  return {
    ...b, kind: 'val', prompt: `I vilken världsdel ligger ${s.namn}?`, om: s.namn,
    karta: kartan ? varldKarta({ prick: s.id === 'gronland' ? undefined : s.id }) : undefined,
    lyser: kartan ? [s.id === 'gronland' ? 'nordamerika' : s.id] : undefined,
    answer: delNamn(s.del), alts: valj(rng, { text: delNamn(s.del) }, wrong, b.level === 0 ? 3 : 5, [trap, 'politisk', 'nord-syd-amerika', 'oceanien-asien', 'fel-varldsdel']),
    los: s.id === 'gronland'
      ? 'Grönland hör till Danmark, men ön ligger i Nordamerika.'
      : `${s.namn} ligger i ${fullNamn(s.del)}.`,
    tips: kartan ? 'Titta var pricken är. Vilken världsdel är det?' : 'Tänk på vilka länder som ligger nära. I vilken världsdel ligger de?',
  };
}

/* ---------- spelet ---------- */

const MODES = ['delar', 'hav', 'land'] as const;

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): GQ | null {
  const mode = (spec.mode === 'blandat' ? (spec.trap ? 'land' : rng.pick(MODES)) : spec.mode) as Exclude<GlobMode, 'blandat'>;
  const b: Base = { mode, level: Math.min(Math.max(0, spec.level), MAX[mode]), skill: SKILL[mode] };
  switch (mode) {
    case 'delar': return delar(b, rng, ctx, spec.trap);
    case 'hav': return hav(b, rng, ctx);
    case 'land': return landDel(b, rng, ctx, spec.trap);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const mode = (Object.keys(SKILL) as (keyof typeof SKILL)[]).find((m) => SKILL[m] === skill);
  return mode ? Array.from({ length: MAX[mode] + 1 }, (_, level) => ({ mode, level })) : [];
}

/** Grönland finns i kartdatan (för tester). */
export const GRONLAND_FINNS = !!VY.varld.lander['304'] && META['304']?.del === 'nordamerika';
