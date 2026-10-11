import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, explainMiss, hint, makeQ, solution, specsForSkill, type MQ } from './logic';

// Meningssmedjan som frågefabrik.

export const meningGame: OrdGame<MQ> = { id: 'mening', make: makeQ, diagnose, explain, explainMiss, solution, hint, specsForSkill, errLabels: ERR };

export const mening = ordModule(meningGame);
