import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHero, type NewHero } from '../src/platform/profiles';
import {
  advance, currentQuestion, findNode, finishRun, getArea, questionForSkill, saveArea, recordAnswer, REVIEW_NODE, runOver, startReview, startRun,
} from '../src/platform/rpg/progress';
import { addDays, dayOf, dueSkills, getSkills, mistByArea, reviewPlan, seedSkills, step, TOP_BOX } from '../src/platform/learning/skills';
import { currentStreak, getQuests, noteRun, weekOf } from '../src/platform/learning/quests';
import { logEvents } from '../src/platform/learning/events';
import { getInv, saveInv } from '../src/platform/rpg/inventory';
import { importV01, parseV01Paste } from '../src/platform/legacy/klockaV01';
import { greeting } from '../src/platform/greeting';
import { skillLabel } from '../src/content/skills';
import { loadAllGames, PLAYABLE, regionProgress } from '../src/content/areas';
import { rngFrom } from '../src/platform/rng';
import { allNodes, type AreaDef, type PathNode, type StageDef } from '../src/platform/rpg/types';
import { freshStorage } from './helpers';

const GAMES = await loadAllGames();

const T0 = new Date(2026, 9, 12, 16, 0); // en måndag
const setDay = (n: number) => vi.setSystemTime(new Date(T0.getFullYear(), T0.getMonth(), T0.getDate() + n, 16, 0));

beforeEach(() => { freshStorage(); vi.useFakeTimers({ toFake: ['Date'] }); setDay(0); });
afterEach(() => { vi.useRealTimers(); });

const hero = (patch: Partial<NewHero> = {}) => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4, ...patch }).id;
const area = (id: string) => PLAYABLE[id].def;

/** Spelar en runda; answers[i] = rätt/fel. Returnerar resultatet och frågornas färdigheter. */
function play(hid: string, a: AreaDef, n: PathNode, answers: boolean[], kind?: 'practice') {
  const game = GAMES[a.areaId];
  let run = startRun(hid, a, n, kind);
  const skills: string[] = [];
  for (const c of answers) {
    const q = currentQuestion(run, n, game);
    skills.push(game.skillOf(q));
    run = recordAnswer(hid, run, n, { correct: c, ms: 2000, hint: false }, game.skillOf(q), c ? undefined : 'annat');
    if (runOver(run)) break;
    run = advance(hid, run);
  }
  return { o: finishRun(hid, a, run), skills };
}

function review(hid: string, a: AreaDef, correct = true) {
  const game = GAMES[a.areaId];
  let run = startReview(hid, a, reviewPlan(hid, a.areaId, 5));
  const asked: string[] = [];
  while (!runOver(run)) {
    const q = currentQuestion(run, REVIEW_NODE, game);
    asked.push(game.skillOf(q));
    run = recordAnswer(hid, run, REVIEW_NODE, { correct, ms: 2000, hint: false }, game.skillOf(q));
    if (!runOver(run)) run = advance(hid, run);
  }
  return { o: finishRun(hid, a, run), asked, planned: run.review! };
}

describe('Leitner-schemat', () => {
  const d = '2026-10-12';
  it('rätt flyttar upp en låda – högst en gång per dag', () => {
    let it = step(undefined, 'x', true, false, d);
    expect(it).toMatchObject({ box: 1, due: addDays(d, 1), seen: 1, correct: 1 });
    it = step(it, 'x', true, false, d);
    expect(it.box).toBe(1);
    it = step(it, 'x', true, false, addDays(d, 1));
    expect(it).toMatchObject({ box: 2, due: addDays(d, 3) });
  });

  it('fel: två lådor ner och tillbaka imorgon (inte idag)', () => {
    let it = { box: 4, due: d, seen: 5, correct: 5, area: 'x', lastSeen: d };
    it = step(it, 'x', false, false, d, 'halv');
    expect(it).toMatchObject({ box: 2, due: addDays(d, 2), lastErr: 'halv', lastErrDay: d });
    it = step(step(undefined, 'x', false, false, d), 'x', false, false, d);
    expect(it).toMatchObject({ box: 0, due: addDays(d, 1) });
  });

  it('ledtråd räknas men flyttar inte upp, och lådan har ett tak', () => {
    expect(step(undefined, 'x', true, true, d).box).toBe(0);
    let it = step(undefined, 'x', true, false, d);
    for (let i = 1; i < 60; i++) it = step(it, 'x', true, false, addDays(d, i * 20));
    expect(it.box).toBe(TOP_BOX);
  });
});

describe('dimman och repetitionen', () => {
  it('det man spelat idag blir dimma imorgon; repetitionen frågar om exakt det och jagar bort den', () => {
    const hid = hero();
    const tab = area('tabellgruvan');
    play(hid, tab, findNode(tab, 'tvaan-femman-tian')!, [false, ...Array(9).fill(true)]);
    expect(mistByArea(hid)).toEqual({});
    setDay(1);
    expect(mistByArea(hid).tabellgruvan).toBeGreaterThan(0);
    const { o, asked, planned } = review(hid, tab);
    expect(asked).toEqual(planned);
    expect(o.kind).toBe('review');
    expect(o.xp).toBeGreaterThan(0);
    expect(mistByArea(hid).tabellgruvan).toBeUndefined();
  });

  it('felet från igår kommer först i repetitionen', () => {
    const hid = hero();
    const tab = area('tabellgruvan');
    const { skills } = play(hid, tab, findNode(tab, 'tvaan-femman-tian')!, [...Array(9).fill(true), false]);
    setDay(1);
    expect(dueSkills(hid, 'tabellgruvan')[0].skill).toBe(skills[9]);
    expect(dueSkills(hid, 'tabellgruvan')[0].item.box).toBe(0);
  });

  it('varje färdighet som spelen ger kan repeteras för sig', () => {
    for (const [id, { def }] of Object.entries(PLAYABLE)) {
      const game = GAMES[id];
      const seen = new Set<string>();
      for (const n of allNodes(def).filter((x): x is StageDef => x.type === 'stage')) {
        for (let i = 0; i < 60; i++) seen.add(game.skillOf(game.makeQuestion(n.spec, rngFrom(i * 31 + n.id.length))));
      }
      for (const s of seen) {
        expect(game.specsForSkill(s).length, s).toBeGreaterThan(0);
        expect(game.skillOf(questionForSkill(game, s, rngFrom(7))), s).toBe(s);
        expect(skillLabel(s), s).not.toBe('något du har övat på');
      }
    }
  });

  it('hjältar från före schemat får det byggt ur händelseloggen', () => {
    const hid = hero();
    logEvents(hid, [
      { t: T0.toISOString(), a: 'tidstornet', n: 'femminutare', k: 'ma.tid.i-halv', c: false, ms: 1, e: 'halv' },
      { t: T0.toISOString(), a: 'tidstornet', n: 'femminutare', k: 'ma.tid.hel', c: true, ms: 1 },
    ]);
    const s = getSkills(hid);
    expect(s.seeded).toBe(true);
    expect(s.items['ma.tid.i-halv']).toMatchObject({ box: 0, due: dayOf(), lastErr: 'halv' });
    expect(s.items['ma.tid.hel'].box).toBe(2);
    expect(dueSkills(hid).map((d) => d.skill)).toEqual(['ma.tid.i-halv']);
  });

  it('importen från v0.1 lägger dimma på det som var svårt, utan att röra det som redan finns', () => {
    const hid = hero();
    getSkills(hid);
    seedSkills(hid, [{ t: '', a: 'tidstornet', n: 'x', k: 'ma.tid.hel', c: true, ms: 1 }]);
    const paste = readFileSync(new URL('./fixtures/storage/legacy-klocka-v01.json', import.meta.url), 'utf8');
    importV01(hid, 'Hjälte1', parseV01Paste(paste)!['Hjälte1']);
    const s = getSkills(hid);
    expect(s.items['ma.tid.hel'].box).toBe(2); // fanns redan: orörd
    // Två gamla fel (halv tre, kvart i fyra) blir dimma direkt; de rätta hamnar längre fram.
    expect(dueSkills(hid, 'tidstornet').map((d) => d.skill).sort()).toEqual(['ma.tid.halv', 'ma.tid.kvart']);
  });
});

describe('Uppdragstavlan', () => {
  it('ny hjälte: tre uppdrag, och inget om dimma', () => {
    const hid = hero();
    const q = getQuests(hid).list;
    expect(q).toHaveLength(3);
    expect(q.map((x) => x.kind)).toEqual(['framsteg', 'klara', 'ang']);
  });

  it('dagen efter ett fel: jaga dimman, öva på det svåra, ta nästa steg', () => {
    const hid = hero();
    const tio = area('tiokompisbron');
    play(hid, tio, findNode(tio, 'tiokompisar')!, [false, ...Array(9).fill(true)]);
    setDay(1);
    const q = getQuests(hid).list;
    expect(q.map((x) => x.kind)).toEqual(['dimma', 'ova', 'framsteg']);
    expect(q[0]).toMatchObject({ areaId: 'tiokompisbron' });
    expect(q[1]).toMatchObject({ nodeId: 'tiokompisar' });
    expect(q[2]).toMatchObject({ areaId: 'tiokompisbron', nodeId: 'plus-till-20' });
  });

  it('alla tre klara ger dagens kista en gång, och sviten växer dag för dag', () => {
    const hid = hero();
    const tio = area('tiokompisbron');
    const doAll = () => {
      for (const q of getQuests(hid).list) {
        noteRun(hid, { kind: q.kind === 'dimma' ? 'review' : q.kind === 'ang' ? 'practice' : 'stage', areaId: q.areaId ?? 'tiokompisbron', nodeId: q.nodeId ?? 'x', cleared: true, won: false, progressed: true });
      }
    };
    play(hid, tio, findNode(tio, 'tiokompisar')!, Array(10).fill(true));
    const chests0 = getInv(hid).chests.length;
    doAll();
    expect(getQuests(hid).chest).toBe(true);
    expect(getInv(hid).chests.length).toBe(chests0 + 1);
    expect(getInv(hid).chests.at(-1)!.kind).toBe('dag');
    doAll();
    expect(getInv(hid).chests.length).toBe(chests0 + 1);
    expect(currentStreak(getQuests(hid)).n).toBe(1);
    setDay(1); doAll();
    expect(currentStreak(getQuests(hid)).n).toBe(2);
    // En missad dag: frysdagen räddar sviten (en gång per vecka).
    setDay(3); doAll();
    expect(currentStreak(getQuests(hid)).n).toBe(3);
    setDay(5);
    expect(currentStreak(getQuests(hid)).n).toBe(0);
    doAll();
    expect(currentStreak(getQuests(hid)).n).toBe(1);
    expect(getQuests(hid).best).toBe(3);
  });

  it('sköldamuletter räddar sviten när frysdagen inte räcker', () => {
    const hid = hero();
    const doAll = () => {
      for (const q of getQuests(hid).list) noteRun(hid, { kind: q.kind === 'dimma' ? 'review' : q.kind === 'ang' ? 'practice' : 'stage', areaId: q.areaId ?? 'x', nodeId: q.nodeId ?? 'x', cleared: true, won: false, progressed: true });
    };
    doAll();
    const inv = getInv(hid);
    saveInv(hid, { ...inv, potions: { ...inv.potions, skold: 1 } });
    setDay(3); // två missade dagar: frysdagen + en amulett
    expect(currentStreak(getQuests(hid), dayOf(), 1).n).toBe(1);
    expect(currentStreak(getQuests(hid), dayOf(), 0).n).toBe(0);
    const news = (() => { let n; for (const q of getQuests(hid).list) n = noteRun(hid, { kind: q.kind === 'dimma' ? 'review' : q.kind === 'ang' ? 'practice' : 'stage', areaId: q.areaId ?? 'x', nodeId: q.nodeId ?? 'x', cleared: true, won: false, progressed: true }); return n!; })();
    expect(news.streak).toBe(2);
    expect(news.usedFreeze).toBe(true);
    expect(news.usedAmulets).toBe(1);
    expect(getInv(hid).potions.skold).toBe(0);
  });

  it('en riktig runda bockar av rätt uppdrag', () => {
    const hid = hero();
    const tio = area('tiokompisbron');
    const { o } = play(hid, tio, findNode(tio, 'tiokompisar')!, Array(10).fill(true));
    const news = noteRun(hid, { kind: 'stage', areaId: 'tiokompisbron', nodeId: 'tiokompisar', cleared: o.cleared, won: false, progressed: o.firstClear });
    expect(news.done.map((q) => q.kind).sort()).toEqual(['framsteg', 'klara']);
    expect(news.allDone).toBe(false);
  });

  it('veckan börjar på måndag', () => {
    expect(weekOf('2026-10-12')).toBe('2026-10-12');
    expect(weekOf('2026-10-18')).toBe('2026-10-12');
    expect(weekOf('2026-10-19')).toBe('2026-10-19');
  });
});

describe('Mästare Kastanj', () => {
  it('berättar hur det gick och var dimman ligger', () => {
    const g = greeting('Hjälte1', '2026-10-10T08:00:00', 'Femminutare i Tidstornet', T0, {
      lastResult: { correct: 9, total: 10 }, mist: { skill: skillLabel('ma.tid.i-halv'), area: 'Tidstornet', count: 3 },
    });
    expect(g).toContain('fick 9 av 10');
    expect(g).toContain('"fem i halv" (och 2 till) i Tidstornet');
    expect(g).toContain('jaga bort');
  });
});

describe('Talbergens regionboss', () => {
  it('öppnar efter tre Mästare, blandar spel och lägger dimman i rätt område', () => {
    const hid = hero();
    const top = PLAYABLE.talbergen;
    expect(regionProgress(hid, top.def)).toMatchObject({ have: 0, need: 3, open: false });
    for (const a of ['tiokompisbron', 'tabellgruvan', 'myntmarknaden']) {
      const def = area(a);
      const m = allNodes(def).find((n) => n.type === 'boss' && n.kind === 'mastare')!;
      const s = getArea(hid, a);
      saveArea(hid, a, { ...s, bosses: { ...s.bosses, [m.id]: { defeated: true, attempts: 1, wins: 1 } } });
    }
    expect(regionProgress(hid, top.def).open).toBe(true);

    const boss = top.def.eras[0].nodes[0];
    let run = startRun(hid, top.def, boss);
    const areas = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const q = currentQuestion(run, boss, GAMES.talbergen);
      areas.add(GAMES.talbergen.areaOf!(q));
      run = recordAnswer(hid, run, boss, { correct: false, ms: 1000, hint: false }, GAMES.talbergen.skillOf(q), undefined, GAMES.talbergen.areaOf!(q));
      if (runOver(run)) run = startRun(hid, top.def, boss); else run = advance(hid, run);
    }
    expect(areas.size).toBeGreaterThan(2);
    setDay(1);
    const mist = mistByArea(hid);
    expect(mist.talbergen).toBeUndefined();
    expect(Object.keys(mist).every((a) => areas.has(a))).toBe(true);
  });
});
