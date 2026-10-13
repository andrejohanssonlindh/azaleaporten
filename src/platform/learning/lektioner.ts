import { getHeroState, saveHeroState } from '../profiles';
import { LEKTION } from '../rpg/balance';
import { giveXP, today } from '../rpg/progress';
import type { AreaDef, LessonMeta } from '../rpg/types';
import { getEvents } from './events';

// Klassrummet: frivilliga lektioner bredvid banorna. Här finns när en lektion ska föreslås och vilka som är lästa.
// Innehållet ligger i spelens kod (GameModule.lessons); här används bara AreaDef.lessons (data i huvudfilen).

/** none = inget förslag, mild = en liten knapp, stark = Mästare Kastanj frågar. */
export type Nudge = 'none' | 'mild' | 'stark';

/** Hur mycket ett barn behöver en lektion, utifrån första svaren (rätt/fel). */
export function nudgeFor(answers: { correct: boolean }[]): Nudge {
  const wrong = answers.filter((a) => !a.correct).length;
  if (!answers.length) return 'none';
  const rate = wrong / answers.length;
  if (wrong >= LEKTION.stark.min && rate >= LEKTION.stark.rate) return 'stark';
  if (wrong >= LEKTION.mild.min && rate > LEKTION.mild.rate) return 'mild';
  return 'none';
}

/** Lektionen som hör till en bana eller boss i området. */
export const lessonForNode = (def: AreaDef, nodeId: string): LessonMeta | undefined =>
  def.lessons?.find((l) => l.nodes.includes(nodeId));

/** Lektionen som förklarar en färdighet (för repetition och regionbossar). */
export const lessonForSkill = (def: AreaDef, skill: string): LessonMeta | undefined =>
  def.lessons?.find((l) => l.skills?.some((s) => (s.endsWith('.') ? skill.startsWith(s) : skill === s)));

/** Hur det har gått på lektionens banor den senaste tiden (de senaste svaren, oavsett runda). */
export function recentNudge(hid: string, areaId: string, lesson: LessonMeta): Nudge {
  const recent = getEvents(hid).filter((e) => e.a === areaId && lesson.nodes.includes(e.n)).slice(-LEKTION.window);
  return nudgeFor(recent.map((e) => ({ correct: e.c })));
}

export const lessonKey = (areaId: string, lessonId: string) => `${areaId}/${lessonId}`;

export const lessonDone = (hid: string, areaId: string, lessonId: string): boolean =>
  !!getHeroState(hid).lektioner[lessonKey(areaId, lessonId)];

/** Markerar lektionen som genomgången. Första gången ger den lite XP (till hjälten och områdets kunskap). */
export function finishLesson(hid: string, areaId: string, lessonId: string): { first: boolean; xp: number; levelUps: number } {
  const s = getHeroState(hid);
  const key = lessonKey(areaId, lessonId);
  if (s.lektioner[key]) return { first: false, xp: 0, levelUps: 0 };
  saveHeroState(hid, { ...s, lektioner: { ...s.lektioner, [key]: today() } });
  return { first: true, ...giveXP(hid, areaId, LEKTION.xp) };
}
