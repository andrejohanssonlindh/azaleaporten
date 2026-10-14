import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, explainMiss, hint, makeQ, solution, specsForSkill, type OQ } from './logic';

// Ordklassernas tempel som frågefabrik.

export const ordklassGame: OrdGame<OQ> = { id: 'ordklass', make: makeQ, diagnose, explain, explainMiss, solution, hint, specsForSkill, errLabels: ERR };

export const ordklass = ordModule(ordklassGame);
