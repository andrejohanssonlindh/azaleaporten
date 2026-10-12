import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type GQ } from './logic';

// Glosviken som frågefabrik.

export const glosorGame: OrdGame<GQ> = { id: 'glosor', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR };

export const glosor = ordModule(glosorGame);
