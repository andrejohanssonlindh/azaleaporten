import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type HQ } from './logic';

// Hamnen som frågefabrik.

export const hamnenGame: OrdGame<HQ> = { id: 'hamnen', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR };

export const hamnen = ordModule(hamnenGame);
