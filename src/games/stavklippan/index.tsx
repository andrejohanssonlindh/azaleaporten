import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, explainMiss, hint, makeQ, solution, specsForSkill, type KQ } from './logic';

// Stavklippan som frågefabrik.

export const stavklippanGame: OrdGame<KQ> = { id: 'stavklippan', make: makeQ, diagnose, explain, explainMiss, solution, hint, specsForSkill, errLabels: ERR };

export const stavklippan = ordModule(stavklippanGame);
