import type { GameModule } from '../../platform/rpg/types';
import { makeQ, type KQ, type Level, type Mode, type Trap } from './logic/questions';
import { phraseKind } from './logic/language';
import { QuestionView } from './ui/QuestionView';
import { ERR } from './logic/diagnose';

// Klockspelet som frågefabrik för plattformen (Tidstornet).

export const klocka: GameModule = {
  id: 'klocka',
  makeQuestion: (spec, rng) => makeQ(spec.mode as Mode, spec.level as Level, rng, spec.trap as Trap | undefined),
  /** Färdighets-id (permanenta): ma.tid.emellan, ma.tid.hel, ma.tid.halv, ma.tid.kvart, ma.tid.over, ma.tid.i, ma.tid.over-halv, ma.tid.i-halv */
  skillOf: (raw) => {
    const q = raw as KQ;
    return q.kind === 'between' ? 'ma.tid.emellan' : `ma.tid.${phraseKind(q.s)}`;
  },
  errLabel: (tag) => ERR[tag],
  View: QuestionView,
};
