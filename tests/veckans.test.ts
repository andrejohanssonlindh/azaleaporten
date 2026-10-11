import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHero } from '../src/platform/profiles';
import { advance, currentQuestion, finishRun, questionForSkill, recordAnswer, runOver, startReview, VECKANS_NODE } from '../src/platform/rpg/progress';
import { currentList, getVeckansRecord, parseWords, saveList, veckansSkill, VECKANS_AREA, wordOfSkill } from '../src/platform/learning/veckans';
import { dueSkills, getSkills } from '../src/platform/learning/skills';
import { getQuests, noteRun } from '../src/platform/learning/quests';
import { diagnoseAny, explainAny, isRight, mentions } from '../src/engines/ord/check';
import { stavningGame } from '../src/games/stavning';
import { makeQ, type SQ } from '../src/games/stavning/logic';
import { skillLabel } from '../src/content/skills';
import { loadAllGames, PLAYABLE } from '../src/content/areas';
import { rngFrom } from '../src/platform/rng';
import { freshStorage } from './helpers';

// Veckans ord: skolans stavningsord som en vuxen skriver in blir en runda, ett dagligt uppdrag
// och – ord för ord – färdigheter som kommer tillbaka som repetition.

const GAMES = await loadAllGames();
const T0 = new Date(2026, 9, 12, 16, 0);
const setDay = (n: number) => vi.setSystemTime(new Date(T0.getFullYear(), T0.getMonth(), T0.getDate() + n, 16, 0));
beforeEach(() => { freshStorage(); vi.useFakeTimers({ toFake: ['Date'] }); setDay(0); });
afterEach(() => { vi.useRealTimers(); });

const hero = () => createHero({ name: 'Hjälte2', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 2 }).id;
const WORDS = ['hoppa', 'sjö', 'Lund', 'tjugo', 'glassbil'];
const own = (w: string) => makeQ({ mode: `ord:${w}`, level: 1 }, rngFrom(1)) as SQ;

describe('ordlistan', () => {
  it('tolkar det en vuxen skriver: rader eller kommatecken, utan dubbletter och skräp', () => {
    expect(parseWords('hoppa\n glass , sjö;\n\nHoppa\n3. tjugo!')).toEqual(['hoppa', 'glass', 'sjö', 'tjugo']);
    expect(parseWords(Array.from({ length: 30 }, (_, i) => `ord${'a'.repeat(i)}`).join('\n')).length).toBe(20);
  });

  it('gäller en vecka; en ny lista samma dag ersätter, en ny dag läggs först', () => {
    const hid = hero();
    expect(currentList(hid)).toBeNull();
    saveList(hid, ['a', 'b']);
    saveList(hid, ['hoppa']);
    expect(getVeckansRecord(hid).lists).toHaveLength(1);
    setDay(6);
    expect(currentList(hid)?.words).toEqual(['hoppa']);
    setDay(7);
    expect(currentList(hid)).toBeNull();
    saveList(hid, WORDS);
    expect(getVeckansRecord(hid).lists.map((l) => l.words[0])).toEqual(['hoppa', 'hoppa']);
  });
});

describe('frågorna', () => {
  it('varje ord blir en egen färdighet med namn, och kan repeteras för sig', () => {
    for (const w of WORDS) {
      const s = veckansSkill(w);
      expect(wordOfSkill(s)).toBe(w);
      expect(skillLabel(s)).toBe(`veckans ord "${w}"`);
      const q = questionForSkill(GAMES[VECKANS_AREA], s, rngFrom(3)) as SQ;
      expect(q.skill).toBe(s);
      expect(q.answer).toBe(w);
      expect(q.kind).toBe('skriv');
      expect(q.say).toContain(w);
    }
  });

  it('känner igen typiska fel även i ord som inte finns i träsket, och avslöjar aldrig ordet', () => {
    const tag = (w: string, g: string) => diagnoseAny(stavningGame, own(w), g);
    expect(tag('hoppa', 'hopa')).toBe('enkel-konsonant');
    expect(tag('sjö', 'schö')).toBe('sj-ljud');
    expect(tag('Lund', 'lund')).toBe('stor-bokstav');
    expect(isRight(own('Lund'), 'Lund')).toBe(true);
    expect(isRight(own('hoppa'), 'Hoppa')).toBe(true);
    for (const w of [...WORDS, 'och', 'det', 'med', 'kort', 'vokal', 'bokstav', 'ljud', 'stavning']) {
      const q = own(w);
      expect(q.alts!.filter((a) => a.err).length, w).toBeGreaterThan(0);
      for (const g of [...q.alts!.map((a) => a.text), w.slice(1), `${w}x`, 'qq'].filter((g) => !isRight(q, g))) {
        const e = explainAny(stavningGame, diagnoseAny(stavningGame, q, g), q, g);
        expect(mentions(`${e.title} ${e.text}`, w), `${w} ← ${g}: ${e.text}`).toBe(false);
      }
      expect(mentions(stavningGame.hint(q), w), w).toBe(false);
    }
  });
});

describe('rundan', () => {
  function playVeckans(hid: string, wrong: string[] = []) {
    const def = PLAYABLE[VECKANS_AREA].def;
    const game = GAMES[VECKANS_AREA];
    let run = startReview(hid, def, currentList(hid)!.words.map(veckansSkill), 'veckans');
    expect(run.nodeId).toBe(VECKANS_NODE.id);
    while (!runOver(run)) {
      const q = currentQuestion(run, VECKANS_NODE, game) as SQ;
      const ok = !wrong.includes(q.answer);
      run = recordAnswer(hid, run, VECKANS_NODE, { correct: ok, ms: 3000, hint: false }, q.skill, ok ? undefined : 'annat');
      if (!runOver(run)) run = advance(hid, run);
    }
    const o = finishRun(hid, def, run);
    return { o, news: noteRun(hid, { kind: 'veckans', areaId: VECKANS_AREA, nodeId: VECKANS_NODE.id, cleared: false, won: false, progressed: false }) };
  }

  it('alla ord en gång; felen visas och kommer tillbaka imorgon som dimma i Stavningsträsket', () => {
    const hid = hero();
    saveList(hid, WORDS);
    const { o } = playVeckans(hid, ['sjö', 'Lund']);
    expect(o.kind).toBe('veckans');
    expect(o.total).toBe(WORDS.length);
    expect(o.correct).toBe(3);
    expect(o.missed!.map(wordOfSkill).sort()).toEqual(['Lund', 'sjö']);
    expect(o.xp).toBeGreaterThan(0);
    expect(Object.keys(getSkills(hid).items).sort()).toEqual(WORDS.map(veckansSkill).sort());
    setDay(1);
    expect(dueSkills(hid, VECKANS_AREA).map((d) => d.skill)).toEqual(expect.arrayContaining([veckansSkill('sjö'), veckansSkill('Lund')]));
  });

  it('dagens första uppdrag är veckans ord, och rundan bockar av det', () => {
    const hid = hero();
    saveList(hid, WORDS);
    expect(getQuests(hid).list[0]).toMatchObject({ kind: 'veckans', done: false });
    const { news } = playVeckans(hid);
    expect(news.done.map((q) => q.kind)).toContain('veckans');
    setDay(8); // listan är för gammal: inget uppdrag längre
    expect(getQuests(hid).list.some((q) => q.kind === 'veckans')).toBe(false);
  });
});
