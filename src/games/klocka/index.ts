import type { GameModule } from '../../platform/rpg/types';
import { makeQ, MAX_LEVEL, type KQ, type Mode, type Trap } from './logic/questions';
import { phraseKind } from './logic/language';
import { QuestionView } from './ui/QuestionView';
import { ERR } from './logic/diagnose';

// Klockspelet som frågefabrik för plattformen (Tidstornet).

export const klocka: GameModule = {
  id: 'klocka',
  makeQuestion: (spec, rng) => makeQ(spec.mode as Mode, Math.min(MAX_LEVEL, spec.level), rng, spec.trap as Trap | undefined),
  /** Färdighets-id (permanenta): ma.tid.emellan, ma.tid.hel, ma.tid.halv, ma.tid.kvart, ma.tid.over, ma.tid.i, ma.tid.over-halv, ma.tid.i-halv */
  skillOf: (raw) => {
    const q = raw as KQ;
    return q.kind === 'between' ? 'ma.tid.emellan' : `ma.tid.${phraseKind(q.s)}`;
  },
  specsForSkill: (skill) => {
    const kind = skill.replace('ma.tid.', '');
    if (kind === 'emellan') return [{ mode: 'between', level: 4 }];
    const level = { hel: 1, halv: 1, kvart: 2, 'over-halv': 6, 'i-halv': 6 }[kind] ?? 4;
    return (['words', 'clock', 'choice'] as const).map((mode) => ({ mode, level }));
  },
  errLabel: (tag) => ERR[tag],
  View: QuestionView,
};
