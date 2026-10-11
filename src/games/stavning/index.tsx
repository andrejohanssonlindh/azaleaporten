import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type SQ } from './logic';

// Stavningsträsket som frågefabrik.

export const stavningGame: OrdGame<SQ> = { id: 'stavning', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR };

export const stavning = ordModule(stavningGame);
