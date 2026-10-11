import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type RQ } from './logic';

// Rimbäcken som frågefabrik.

export const rimGame: OrdGame<RQ> = { id: 'rim', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR };

export const rim = ordModule(rimGame);
