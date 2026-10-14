import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt } from '../../engines/karta/types';
import { normNamn } from '../../engines/karta/check';
import { LAND, LAND_BY_ID, namnTvilling } from './land';
import { GRUPPER, grannar, iGrupp, landKarta } from './kartor';
import { BALLONG_MODES, gruppDel, landTag } from './ballong';
import { dra, valj, type GQ } from './gen';

// Huvudstadsexpressen (åk 3–6): land → huvudstad (välj, sedan skriv), huvudstad → land, och vilken stad
// som INTE är huvudstad. Samma grupper som Ballongresan. Stavningen övas inte: ett eller två fel tecken
// räknas som rätt ("Rätt! Det stavas …"), men en annan stad som spelet känner till är alltid fel.
// Lägen, färdighets-id:n och felkoder är permanenta.

interface Base { mode: string; level: number; skill: string }

// Länder där huvudstaden heter som landet (eller står i namnet) frågas inte – svaret skulle stå i frågan.
const SAMMA = ['luxemburg', 'monaco', 'singapore', 'guatemala', 'panama', 'kongo'];
const fragbara = (grupp: string) => iGrupp(grupp).filter((id) => !SAMMA.includes(id));

const allaStader = (id: string) => [LAND_BY_ID[id].stad, ...(LAND_BY_ID[id].stadAlias ?? [])];

function landTillStad(b: Base, rng: Rng, grupp: string, id: string, trap?: string): GQ {
  const l = LAND_BY_ID[id];
  const wrong: Alt[] = [
    ...(l.stader ?? []).map((text) => ({ text, err: 'storsta-staden' })),
    ...grannar(id).filter((x) => !SAMMA.includes(x)).map((x) => ({ text: LAND_BY_ID[x].stad, err: 'granne-huvudstad' })),
    ...fragbara(grupp).filter((x) => x !== id).map((x) => ({ text: LAND_BY_ID[x].stad, err: 'fel-stad' })),
  ];
  return {
    ...b, kind: 'val', prompt: `Vad heter huvudstaden i ${l.namn}?`, karta: landKarta(GRUPPER[grupp].vy, [], [id]), lyser: [id], om: l.namn,
    answer: l.stad, alts: valj(rng, { text: l.stad }, wrong, 3, [trap, 'storsta-staden', 'granne-huvudstad']),
    los: `Huvudstaden i ${l.namn} heter ${l.stad}.`, tips: `Huvudstaden börjar på ${l.stad.charAt(0)}.`,
  };
}

function stadTillLand(b: Base, rng: Rng, grupp: string, id: string): GQ {
  const l = LAND_BY_ID[id];
  const tvilling = namnTvilling(id);
  const others = [...fragbara(grupp).filter((x) => x !== id), ...grannar(id), ...(tvilling ? [tvilling] : [])];
  const wrong: Alt[] = others.map((x) => ({ text: LAND_BY_ID[x].namn, err: landTag(id, x) }));
  return {
    ...b, kind: 'val', prompt: `${l.stad} är huvudstad i vilket land?`, om: l.stad,
    answer: l.namn, alts: valj(rng, { text: l.namn }, wrong, 3, ['liknande-namn', 'granne']),
    los: `${l.stad} är huvudstad i ${l.namn}.`, tips: `Landet börjar på ${l.namn.charAt(0)}.`,
  };
}

function inteHuvudstad(b: Base, rng: Rng, grupp: string, ctx?: QuestionCtx): GQ | null {
  const med = iGrupp(grupp).filter((id) => LAND_BY_ID[id].stader?.length);
  const huvud = fragbara(grupp);
  if (!med.length || huvud.length < 3) return null;
  const id = dra(med, rng, ctx, `inte/${grupp}`);
  const right = LAND_BY_ID[id].stader![0];
  const wrong = huvud.map((x) => ({ text: LAND_BY_ID[x].stad, err: 'ar-huvudstad' }));
  return {
    ...b, kind: 'val', prompt: 'Vilken av städerna är INTE en huvudstad?', om: LAND_BY_ID[id].namn,
    answer: right, alts: valj(rng, { text: right }, wrong, 3),
    los: `${right} är en stor stad i ${LAND_BY_ID[id].namn}, men huvudstaden heter ${LAND_BY_ID[id].stad}.`,
    tips: 'Tre av städerna är huvudstäder. En är bara stor och känd.',
  };
}

function skriv(b: Base, grupp: string, id: string): GQ {
  const l = LAND_BY_ID[id];
  const egna = new Set(allaStader(id).map(normNamn));
  const cand: Record<string, string> = {};
  const add = (namn: string, tag: string) => { const k = normNamn(namn); if (!egna.has(k) && !(k in cand)) cand[k] = tag; };
  for (const s of l.stader ?? []) add(s, 'storsta-staden');
  for (const x of grannar(id)) for (const s of allaStader(x)) add(s, 'granne-huvudstad');
  // Alla andra huvudstäder: en annan huvudstad är aldrig rätt, hur lik den än är.
  for (const x of LAND) if (x.id !== id) for (const s of allaStader(x.id)) add(s, 'fel-stad');
  return {
    ...b, kind: 'skriv', prompt: `Skriv namnet på huvudstaden i ${l.namn}.`, karta: landKarta(GRUPPER[grupp].vy, [], [id]), lyser: [id], om: l.namn,
    answer: l.stad, answers: l.stadAlias, cand,
    los: `Huvudstaden i ${l.namn} heter ${l.stad}.`, tips: `Huvudstaden börjar på ${l.stad.charAt(0)} och har ${[...l.stad].filter((c) => /\p{L}/u.test(c)).length} bokstäver.`,
  };
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): GQ | null {
  const trapOk = (g: string) => fragbara(g).some((id) => LAND_BY_ID[id].stader?.length);
  const grupp = spec.mode === 'blandat' ? rng.pick(BALLONG_MODES.filter((g) => !spec.trap || trapOk(g))) : spec.mode;
  const level = Math.min(Math.max(0, spec.level), 2);
  const b: Base = { mode: grupp, level, skill: `geo.huvudstad.${gruppDel(grupp)}` };
  const alla = fragbara(grupp);
  if (spec.trap === 'storsta-staden') {
    const med = alla.filter((id) => LAND_BY_ID[id].stader?.length);
    if (med.length) {
      const id = dra(med, rng, ctx, `trap/${grupp}/${level}`);
      return level >= 2 ? skriv(b, grupp, id) : landTillStad(b, rng, grupp, id, spec.trap);
    }
  }
  const ids = level === 0 ? (alla.filter((id) => LAND_BY_ID[id].band === 1).length >= 4 ? alla.filter((id) => LAND_BY_ID[id].band === 1) : alla) : alla;
  const typ = level === 0 ? 'land' : level === 1 ? rng.pick(['land', 'stad', 'stad', 'inte'] as const) : rng.pick(['skriv', 'skriv', 'stad'] as const);
  if (typ === 'inte') return inteHuvudstad(b, rng, grupp, ctx);
  const id = dra(ids, rng, ctx, `${typ}/${grupp}/${level}`);
  if (typ === 'skriv') return skriv(b, grupp, id);
  return typ === 'stad' ? stadTillLand(b, rng, grupp, id) : landTillStad(b, rng, grupp, id, spec.trap);
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const m = /^geo\.huvudstad\.(.+)$/.exec(skill);
  if (!m) return [];
  return BALLONG_MODES.filter((g) => gruppDel(g) === m[1]).flatMap((mode) => [0, 1, 2].map((level) => ({ mode, level })));
}
