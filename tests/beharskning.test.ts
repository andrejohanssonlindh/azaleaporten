import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHero, getHeroState, type NewHero } from '../src/platform/profiles';
import {
  advance, currentQuestion, findNode, finishRun, getArea, grantKunskapTitles, learn, recordAnswer, REVIEW_NODE, runOver, saveArea, startReview, startRun,
} from '../src/platform/rpg/progress';
import { bestBox, getSkills, reviewPlan, solidCount, step } from '../src/platform/learning/skills';
import { KUNSKAP_TITLE_LEVELS, kunskapLevel, MASTERY } from '../src/platform/rpg/balance';
import { cosmetic, unlocked } from '../src/platform/rpg/wardrobe';
import { loadAllGames, PLAYABLE } from '../src/content/areas';
import { freshStorage } from './helpers';

// Behärskning: det som sitter kvar dag efter dag ger kunskaps-XP – en gång per ny högsta låda,
// utan bonusar från klass eller utrustning, och kunskapen kan aldrig sjunka.

const GAMES = await loadAllGames();
const T0 = new Date(2026, 9, 12, 16, 0);
const setDay = (n: number) => vi.setSystemTime(new Date(T0.getFullYear(), T0.getMonth(), T0.getDate() + n, 16, 0));

beforeEach(() => { freshStorage(); vi.useFakeTimers({ toFake: ['Date'] }); setDay(0); });
afterEach(() => { vi.useRealTimers(); });

const hero = (patch: Partial<NewHero> = {}) => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4, ...patch }).id;
const SKILL = 'ma.mult.7';
const AREA = 'tabellgruvan';
const kxp = (hid: string) => getArea(hid, AREA).xp;

/** Svarar rätt på färdigheten de dagar då lådorna går upp: 0, 1, 3, 7, 15. */
const CLIMB_DAYS = [0, 1, 3, 7, 15];

describe('högsta lådan', () => {
  it('minns den högsta lådan även när lådan sjunker', () => {
    const d = '2026-10-12';
    const it4 = { box: 4, due: d, seen: 9, correct: 9, area: AREA, lastSeen: d };
    const wrong = step(it4, AREA, false, false, d);
    expect(wrong.box).toBe(2);
    expect(bestBox(wrong)).toBe(4);
    const again = step(wrong, AREA, true, false, wrong.due);
    expect(again.box).toBe(3);
    expect(again.best).toBe(4);
  });
});

describe('behärsknings-XP', () => {
  it('ges en gång per ny högsta låda, och bara över dagar', () => {
    const hid = hero();
    let total = 0;
    for (const [i, day] of CLIMB_DAYS.entries()) {
      setDay(day);
      const g = learn(hid, AREA, SKILL, true, false);
      expect(g.xp, `dag ${day}`).toBe(MASTERY.xp[i + 1]);
      total += g.xp;
      // Fler rätt samma dag ger inget mer.
      expect(learn(hid, AREA, SKILL, true, false).xp).toBe(0);
    }
    expect(total).toBe(MASTERY.xp.reduce((a, b) => a + b, 0));
    expect(getSkills(hid).items[SKILL].box).toBe(5);
    expect(solidCount(hid, AREA)).toBe(1);
  });

  it('efter ett fel ger det inget förrän färdigheten når högre än förut – och kunskapen sjunker aldrig', () => {
    const hid = hero();
    for (const day of CLIMB_DAYS.slice(0, 4)) { setDay(day); learn(hid, AREA, SKILL, true, false); } // låda 4
    const before = kxp(hid);
    setDay(8);
    expect(learn(hid, AREA, SKILL, false, false).xp).toBe(0); // låda 2
    expect(kxp(hid)).toBe(before);
    setDay(10);
    expect(learn(hid, AREA, SKILL, true, false).xp).toBe(0); // låda 3, under det bästa
    setDay(14);
    expect(learn(hid, AREA, SKILL, true, false).xp).toBe(0); // låda 4, lika med det bästa
    expect(getSkills(hid).items[SKILL].box).toBe(4);
    setDay(22);
    expect(learn(hid, AREA, SKILL, true, false).xp).toBe(MASTERY.xp[5]); // låda 5: nytt rekord
  });

  it('ledtrådar flyttar inte upp lådan och ger alltså ingen behärskning', () => {
    const hid = hero();
    expect(learn(hid, AREA, SKILL, true, true).xp).toBe(0);
    setDay(1);
    expect(learn(hid, AREA, SKILL, true, true).xp).toBe(0);
  });

  it('påverkas inte av trollkarlens XP-bonus (lärandets integritet)', () => {
    const hid = hero({ heroClass: 'trollkarl' });
    learn(hid, AREA, SKILL, true, false);
    setDay(1);
    expect(learn(hid, AREA, SKILL, true, false).xp).toBe(MASTERY.xp[2]);
    expect(kxp(hid)).toBe(MASTERY.xp[2]);
  });

  it('syns på resultatskärmen efter en repetition', () => {
    const hid = hero();
    const def = PLAYABLE[AREA].def;
    const game = GAMES[AREA];
    const node = findNode(def, 'tvaan-femman-tian')!;
    let run = startRun(hid, def, node);
    while (!runOver(run)) {
      const q = currentQuestion(run, node, game);
      run = recordAnswer(hid, run, node, { correct: true, ms: 2000, hint: false }, game.skillOf(q));
      if (!runOver(run)) run = advance(hid, run);
    }
    expect(finishRun(hid, def, run).mastery).toBeUndefined(); // dag 0: allt hamnar i låda 1
    setDay(1);
    let rev = startReview(hid, def, reviewPlan(hid, AREA, 5));
    while (!runOver(rev)) {
      const q = currentQuestion(rev, REVIEW_NODE, game);
      rev = recordAnswer(hid, rev, REVIEW_NODE, { correct: true, ms: 2000, hint: false }, game.skillOf(q));
      if (!runOver(rev)) rev = advance(hid, rev);
    }
    const o = finishRun(hid, def, rev);
    expect(o.mastery!.skills.length).toBeGreaterThan(0);
    expect(o.mastery!.xp).toBe(new Set(o.mastery!.skills).size * MASTERY.xp[2]);
  });
});

describe('kunskapsnivåer och titlar', () => {
  it('nivå 5 och 10 ger områdets titlar, en gång', () => {
    const hid = hero();
    const def = PLAYABLE[AREA].def;
    const [t5, t10] = def.kunskap.titles!;
    const xpFor = (lvl: number) => { let x = 0; while (kunskapLevel(x).level < lvl) x += 10; return x; };
    saveArea(hid, AREA, { ...getArea(hid, AREA), xp: xpFor(KUNSKAP_TITLE_LEVELS[0]) });
    expect(grantKunskapTitles(hid, def)).toEqual([t5]);
    expect(grantKunskapTitles(hid, def)).toEqual([]);
    saveArea(hid, AREA, { ...getArea(hid, AREA), xp: xpFor(KUNSKAP_TITLE_LEVELS[1]) });
    expect(grantKunskapTitles(hid, def)).toEqual([t10]);
    expect(getHeroState(hid).titles).toEqual([t5, t10]);
  });

  it('varje område på kartan har två unika kunskapstitlar som inte krockar med bossarnas', () => {
    const all: string[] = [];
    const bossTitles = new Set(Object.values(PLAYABLE).flatMap(({ def }) => def.eras.flatMap((e) => e.nodes.flatMap((n) => (n.type === 'boss' ? [n.titleReward] : [])))));
    for (const { def } of Object.values(PLAYABLE)) {
      expect(def.kunskap.titles?.length, def.areaId).toBe(2);
      all.push(...def.kunskap.titles!);
    }
    expect(new Set(all).size).toBe(all.length);
    for (const t of all) expect(bossTitles.has(t), t).toBe(false);
  });
});

describe('Garderoben', () => {
  it('Visdomsljuset låses upp när 15 saker suttit som berget', () => {
    const hid = hero();
    const u = cosmetic('aura.visdom')!.unlock!;
    const skills = Array.from({ length: 15 }, (_, i) => `ma.mult.${i % 13}-${i}`);
    for (const day of CLIMB_DAYS.slice(0, 4)) {
      setDay(day);
      for (const s of skills.slice(0, 14)) learn(hid, AREA, s, true, false);
    }
    expect(unlocked(hid, u)).toBe(false);
    for (const day of [16, 17, 19, 23]) { setDay(day); learn(hid, AREA, skills[14], true, false); }
    expect(solidCount(hid)).toBe(15);
    expect(unlocked(hid, u)).toBe(true);
  });
});
