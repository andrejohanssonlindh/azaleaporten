import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { ClockFace } from '../klocka/ui/ClockFace';
import { diagnose, digital, digital24, ERR, explain, hint, makeQ, solution, specsForSkill, type BQ } from './logic';

// Big Ben-tornet som frågefabrik. Urtavlan är Tidstornets.

function Visual({ q, done }: { q: BQ; done: boolean }) {
  if (q.how === 'klocka' || ((q.how === 'ord' || q.how === 'hor') && done)) {
    return <div class="bigben-clock"><ClockFace h={q.h} m={q.m} size={done && q.how !== 'klocka' ? 150 : 220} /></div>;
  }
  if (q.how === 'digital' || q.how === 'ampm') {
    return <div class="bigben-digital" aria-label="Digital klocka">{q.how === 'ampm' ? digital24(q.h, q.m) : digital(q.h, q.m)}</div>;
  }
  return null;
}

export const bigbenGame: OrdGame<BQ> = { id: 'bigben', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR, Visual };

export const bigben = ordModule(bigbenGame);
