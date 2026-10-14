import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt } from '../../engines/karta/types';
import { LAND_BY_ID, namnTvilling, type Del } from './land';
import { GRUPPER, META, grannar, iGrupp, landKarta, riktning } from './kartor';
import { dra, valj, type GQ } from './gen';
import { STRECK } from './kartrummet';

// Ballongresan (åk 3–6): peka ut länderna på kartan, säg vilket land som är markerat, grannar och
// "vilket land ligger norr om X?". Grupperna går Norden → Västeuropa → Syd- och Östeuropa → hela Europa → världsdel för världsdel.
// Lägen (= grupperna i kartor.ts), färdighets-id:n och felkoder är permanenta.

export const BALLONG_MODES = ['norden', 'vast', 'syd', 'ost', 'europa', 'afrika', 'asien', 'nordamerika', 'sydamerika', 'oceanien'] as const;
export type BallongMode = (typeof BALLONG_MODES)[number] | 'blandat';

/** Gruppens världsdel (Europas delar räknas till Europa). */
export const gruppDel = (g: string): Del => (['norden', 'vast', 'syd', 'ost', 'europa'].includes(g) ? 'europa' : (g as Del));

interface Base { mode: string; level: number; skill: string }

/** Felkoden när barnet väljer land x i stället för id. */
export function landTag(id: string, x: string): string {
  if (namnTvilling(id) === x) return 'liknande-namn';
  if (grannar(id).includes(x)) return 'granne';
  return 'fel-land';
}

const band1 = (ids: string[]) => { const b = ids.filter((id) => LAND_BY_ID[id].band === 1); return b.length >= 4 ? b : ids; };

function peka(b: Base, grupp: string, ids: string[], id: string): GQ {
  const l = LAND_BY_ID[id];
  return {
    ...b, kind: 'peka', prompt: `Var ligger ${l.namn}? Tryck på landet.`, karta: landKarta(GRUPPER[grupp].vy, ids), answer: id, visa: [id], om: l.namn,
    misses: Object.fromEntries(ids.filter((x) => x !== id).map((x) => [x, landTag(id, x)])),
    los: `Där ligger ${l.namn}.`, tips: tipsFor(id),
  };
}

function namnge(b: Base, rng: Rng, grupp: string, ids: string[], id: string, trap?: string): GQ {
  const l = LAND_BY_ID[id];
  const tvilling = namnTvilling(id);
  const others = [...ids.filter((x) => x !== id), ...(tvilling && !ids.includes(tvilling) ? [tvilling] : [])];
  const wrong: Alt[] = others.map((x) => ({ text: LAND_BY_ID[x].namn, err: landTag(id, x) }));
  return {
    ...b, kind: 'val', prompt: 'Vilket land är markerat?', karta: landKarta(GRUPPER[grupp].vy, [], [id]), lyser: [id], visa: [id], om: l.namn,
    answer: l.namn, alts: valj(rng, { text: l.namn }, wrong, 3, [trap, 'liknande-namn', 'granne']),
    los: `Det är ${l.namn}.`, tips: tipsFor(id),
  };
}

/** Ledtråd: grannarna (aldrig landet självt). */
function tipsFor(id: string): string {
  const g = grannar(id).map((x) => LAND_BY_ID[x].namn);
  if (!g.length) return 'Landet har inga grannar på land – det ligger på en eller flera öar.';
  return `Landet har gräns mot ${g.length === 1 ? g[0] : `${g.slice(0, -1).slice(0, 3).join(', ')} och ${g[g.length - 1]}`}.`;
}

function grannQ(b: Base, rng: Rng, grupp: string, ids: string[], ctx?: QuestionCtx): GQ | null {
  const ok = ids.filter((id) => grannar(id).some((x) => ids.includes(x)) && ids.filter((x) => x !== id && !grannar(id).includes(x)).length >= 3);
  if (!ok.length) return null;
  const id = dra(ok, rng, ctx, `granne/${grupp}`);
  const l = LAND_BY_ID[id];
  const right = rng.pick(grannar(id).filter((x) => ids.includes(x)));
  const wrong = ids.filter((x) => x !== id && !grannar(id).includes(x)).map((x) => ({ text: LAND_BY_ID[x].namn, err: namnTvilling(right) === x ? 'liknande-namn' : 'fel-land' }));
  return {
    ...b, kind: 'val', prompt: `Vilket av länderna gränsar till ${l.namn}?`, karta: landKarta(GRUPPER[grupp].vy, [], [id]), lyser: [id], om: l.namn,
    answer: LAND_BY_ID[right].namn, alts: valj(rng, { text: LAND_BY_ID[right].namn }, wrong, 3), visa: [id, right],
    los: `${LAND_BY_ID[right].namn} har gräns mot ${l.namn}.`, tips: `Hitta ${l.namn} på kartan. Vilka länder sitter ihop med det?`,
  };
}

/** Vilket land ligger norr (öster, söder, väster) om X? Bara när ett enda grannland tydligt ligger åt det hållet. */
function riktQ(b: Base, rng: Rng, grupp: string, ids: string[], ctx?: QuestionCtx): GQ | null {
  const fragor: { id: string; dir: number; right: string; andra: string[] }[] = [];
  for (const id of ids) {
    const g = grannar(id);
    for (const dir of [0, 2, 4, 6]) {
      const diff = (x: string) => Math.abs(((riktning(id, x) - dir * 45 + 540) % 360) - 180);
      const nara = g.filter((x) => diff(x) <= 30);
      if (nara.length === 1 && g.every((x) => x === nara[0] || diff(x) > 60)) fragor.push({ id, dir, right: nara[0], andra: g.filter((x) => x !== nara[0]) });
    }
  }
  if (!fragor.length) return null;
  const f = dra(fragor, rng, ctx, `rikt/${grupp}`);
  const l = LAND_BY_ID[f.id];
  const spegel = (8 - f.dir) % 8;
  const wrong: Alt[] = [
    ...f.andra.map((x) => {
      const d = Math.abs(((riktning(f.id, x) - spegel * 45 + 540) % 360) - 180);
      return { text: LAND_BY_ID[x].namn, err: spegel !== f.dir && d <= 45 ? 'ost-vast' : 'fel-riktning' };
    }),
    ...ids.filter((x) => x !== f.id && x !== f.right && !f.andra.includes(x)).map((x) => ({ text: LAND_BY_ID[x].namn, err: 'fel-land' })),
  ];
  if (wrong.length < 2) return null;
  return {
    ...b, kind: 'val', prompt: `Vilket land ligger ${STRECK[f.dir]} om ${l.namn}?`, karta: landKarta(GRUPPER[grupp].vy, [], [f.id]), lyser: [f.id], om: l.namn,
    answer: LAND_BY_ID[f.right].namn, alts: valj(rng, { text: LAND_BY_ID[f.right].namn }, wrong, 3, ['ost-vast', 'fel-riktning']), visa: [f.id, f.right],
    los: `${LAND_BY_ID[f.right].namn} ligger ${STRECK[f.dir]} om ${l.namn}.`, tips: `Hitta ${l.namn} på kartan. Norr är uppåt. Vilket grannland ligger åt det hållet?`,
  };
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): GQ | null {
  const trapOk = (g: string) => iGrupp(g).some((id) => namnTvilling(id));
  const grupp = spec.mode === 'blandat'
    ? rng.pick(BALLONG_MODES.filter((g) => !spec.trap || trapOk(g)))
    : spec.mode;
  const level = Math.min(Math.max(0, spec.level), 1);
  const b: Base = { mode: grupp, level, skill: `geo.land.${gruppDel(grupp)}` };
  const alla = iGrupp(grupp);
  if (spec.trap === 'liknande-namn') {
    const med = alla.filter((id) => namnTvilling(id));
    if (med.length) return namnge(b, rng, grupp, alla, dra(med, rng, ctx, `trap/${grupp}`), spec.trap);
  }
  const ids = level === 0 ? band1(alla) : alla;
  const typ = level === 0 ? rng.pick(['peka', 'peka', 'namnge'] as const) : rng.pick(['peka', 'namnge', 'granne', 'rikt'] as const);
  if (typ === 'granne') return grannQ(b, rng, grupp, alla, ctx);
  if (typ === 'rikt') return riktQ(b, rng, grupp, alla, ctx);
  const id = dra(ids, rng, ctx, `${typ}/${grupp}/${level}`);
  return typ === 'peka' ? peka(b, grupp, ids, id) : namnge(b, rng, grupp, ids, id, spec.trap);
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const m = /^geo\.land\.(.+)$/.exec(skill);
  if (!m) return [];
  return BALLONG_MODES.filter((g) => gruppDel(g) === m[1]).flatMap((mode) => [{ mode, level: 0 }, { mode, level: 1 }]);
}

/** Används av tester: världsdelen för ett land enligt kartdatan. */
export const metaDel = (id: string) => META[LAND_BY_ID[id].iso]?.del;
