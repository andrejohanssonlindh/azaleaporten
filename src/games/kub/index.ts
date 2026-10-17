import type { GameModule } from '../../platform/rpg/types';
import { KUB_ERR, makeKub, specsForSkill, type KubQ } from './logic';
import { KubView } from './View';
import { KUBLABBET } from './lektioner';

// Kublabbet som frågefabrik.

export const kub: GameModule = {
  id: 'kublabbet',
  makeQuestion: (spec, rng) => makeKub(spec, rng),
  skillOf: (q) => (q as KubQ).skill,
  specsForSkill,
  errLabel: (tag) => KUB_ERR[tag],
  View: KubView,
  lessons: KUBLABBET,
};
