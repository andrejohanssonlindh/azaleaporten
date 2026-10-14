import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt } from '../../engines/karta/types';
import { LAND_BY_ID, NORDEN, type Del } from './land';
import { META } from './kartor';
import { FLAGGOR, LIKNANDE_FLAGGOR, liknarFlagga } from './flaggor';
import { dra, valj, type GQ } from './gen';

// Flaggmasten (åk 1–6): flagga → land och land → flagga. Norden först, sedan Europa och resten av världen,
// och till sist flaggor som är lätta att blanda ihop (Randiga Rita).
// Lägen, färdighets-id:n och felkoder är permanenta.

export const FLAGG_MODES = ['norden', 'europa', 'varlden', 'lika'] as const;
type FlaggMode = (typeof FLAGG_MODES)[number];

interface Base { mode: string; level: number; skill: string }

/** Flaggans världsdel (Ryssland och Turkiet räknas till Europa här). */
export function flaggDel(id: string): Del {
  if (id === 'ryssland' || id === 'turkiet') return 'europa';
  return META[LAND_BY_ID[id].iso].del as Del;
}

const MED = Object.keys(FLAGGOR).filter((id) => LAND_BY_ID[id]);
const POOL: Record<FlaggMode, string[]> = {
  norden: NORDEN,
  europa: MED.filter((id) => flaggDel(id) === 'europa'),
  varlden: MED.filter((id) => flaggDel(id) !== 'europa'),
  lika: [...new Set(LIKNANDE_FLAGGOR.flat())].filter((id) => FLAGGOR[id]),
};

/** Svarstext för ett flaggalternativ (inte landets namn – det skulle stå i frågan). */
const fl = (id: string) => `flagga:${id}`;

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): GQ {
  const mode: FlaggMode = spec.mode === 'blandat' ? (spec.trap ? 'lika' : rng.pick(FLAGG_MODES)) : (spec.mode as FlaggMode);
  const level = Math.min(Math.max(0, spec.level), 1);
  const pool = spec.trap === 'liknande-flagga' ? POOL.lika : POOL[mode];
  const id = dra(pool, rng, ctx, `${mode}/${level}/${spec.trap ?? ''}`);
  const l = LAND_BY_ID[id];
  const b: Base = { mode, level, skill: `geo.flagga.${flaggDel(id)}` };
  const lika = liknarFlagga(id).filter((x) => FLAGGOR[x]);
  const andra = [...lika, ...pool.filter((x) => x !== id && !lika.includes(x)), ...POOL.europa.filter((x) => x !== id)];
  const tag = (x: string) => (lika.includes(x) ? 'liknande-flagga' : 'fel-land');
  if (level === 1 && rng.next() < 0.5) {
    const wrong: Alt[] = andra.map((x) => ({ text: fl(x), flagga: x, err: tag(x) }));
    return {
      ...b, kind: 'val', prompt: `Vilken flagga har ${l.namn}?`, om: l.namn, answer: fl(id), alts: valj(rng, { text: fl(id), flagga: id }, wrong, 3, [spec.trap, 'liknande-flagga']),
      los: `Det här är flaggan för ${l.namn}.`, tips: tipsFor(id),
    };
  }
  const wrong: Alt[] = andra.map((x) => ({ text: LAND_BY_ID[x].namn, err: tag(x) }));
  return {
    ...b, kind: 'val', prompt: 'Vilket land har den här flaggan?', flagga: id, answer: l.namn, alts: valj(rng, { text: l.namn }, wrong, 3, [spec.trap, 'liknande-flagga']),
    los: `Det är flaggan för ${l.namn}.`, tips: tipsFor(id),
  };
}

function tipsFor(id: string): string {
  const d = flaggDel(id);
  if (NORDEN.includes(id)) return 'Alla länder i Norden har ett kors på flaggan. Titta på färgerna!';
  return d === 'europa' ? 'Landet ligger i Europa. Titta noga på färgerna och åt vilket håll ränderna går.' : 'Landet ligger utanför Europa. Titta noga på färgerna och mönstret.';
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const m = /^geo\.flagga\.(.+)$/.exec(skill);
  if (!m) return [];
  if (m[1] === 'europa') return [{ mode: 'norden', level: 0 }, { mode: 'europa', level: 0 }, { mode: 'europa', level: 1 }];
  return MED.some((id) => flaggDel(id) === m[1]) ? [{ mode: 'varlden', level: 0 }, { mode: 'varlden', level: 1 }] : [];
}
