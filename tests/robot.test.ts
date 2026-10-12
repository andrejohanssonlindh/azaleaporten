import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { allNodes, type AreaDef } from '../src/platform/rpg/types';
import type { Prog, RobotGame, RobotQ, World } from '../src/engines/robot/types';
import { blockAt, ids, isLoop, replaceAt, run, samePos, size, solve, solves, swapLR } from '../src/engines/robot/world';
import { checkBug, diagnoseProg, explainRobot, ROBOT_ERR } from '../src/engines/robot/check';
import { buggjaktenGame, kodstigenGame, loopverkstadenGame } from '../src/games/robot/logic';
import { BUGGJAKTEN, KODSTIGEN, LOOPVERKSTADEN } from '../src/games/robot/content';
import { skillLabel } from '../src/content/skills';
import { specsOf } from './ordcheck';

const W: World = { w: 5, h: 5, start: [0, 0], dir: 1, goal: [2, 0], rocks: [[1, 1]], gems: [] };

describe('robotens värld', () => {
  it('pilar flyttar åt sitt håll, svängar vänder bara', () => {
    expect(run(W, ['R', 'R']).end).toEqual([2, 0]);
    expect(run(W, ['F', 'H', 'F']).end).toEqual([1, 0]); // krockar i stenen på (1,1)
    expect(run(W, ['F', 'H', 'F']).crash).toEqual([1, 1]);
    expect(run(W, ['V', 'F']).crash).toEqual([0, -1]);
    expect(run(W, ['H', 'H', 'V']).dir).toBe(2);
  });

  it('loopar, id:n och ändringar', () => {
    const p: Prog = ['F', { rep: 3, body: ['F', { rep: 2, body: ['H'] }] }];
    expect(ids(p)).toEqual(['0', '1', '1.0', '1.1', '1.1.0']);
    expect(blockAt(p, '1.1.0')).toBe('H');
    expect(size(p)).toBe(5);
    expect(replaceAt(p, '1.0', null)).toEqual(['F', { rep: 3, body: [{ rep: 2, body: ['H'] }] }]);
    expect(swapLR(p)).toEqual(['F', { rep: 3, body: ['F', { rep: 2, body: ['V'] }] }]);
    expect(run({ ...W, rocks: [], w: 9 }, [{ rep: 4, body: ['R'] }]).end).toEqual([4, 0]);
  });

  it('lösaren hittar kortaste vägen förbi stenar och genom diamanter', () => {
    const w: World = { w: 4, h: 3, start: [0, 0], dir: 1, goal: [3, 0], rocks: [[1, 0], [2, 0]], gems: [[0, 2]] };
    const sol = solve(w, 'pilar')!;
    expect(solves(w, sol)).toBe(true);
    expect(sol.length).toBe(7);
    expect(solves(w, solve(w, 'svang')!)).toBe(true);
  });

  it('diagnosen känner igen vanliga fel', () => {
    const q = { world: { w: 5, h: 5, start: [2, 0], dir: 2, goal: [3, 2], rocks: [], gems: [] }, palette: 'svang', kind: 'bygg' } as unknown as RobotQ;
    // Roboten tittar nedåt: vänster för den är höger för barnet.
    expect(solves(q.world, ['F', 'F', 'V', 'F'])).toBe(true);
    expect(diagnoseProg(q, ['F', 'F', 'H', 'F'])).toBe('vanster-hoger');
    expect(diagnoseProg(q, ['F', 'F', 'V', 'F', 'F'])).toBe('ett-steg');
    expect(diagnoseProg(q, ['F', 'F', 'F', 'F', 'F', 'F'])).toBe('krock');
  });
});

/** Varje fråga i området går att svara rätt på, har precis ett rätt svar, och felen har förklaringar. */
function checkRobotArea(def: AreaDef, g: RobotGame, seeds = 25) {
  for (const spec of specsOf(def)) {
    for (let seed = 0; seed < seeds; seed++) {
      const q = g.make(spec, rngFrom(seed * 7919 + spec.level));
      const where = `${def.areaId} ${JSON.stringify(spec)} seed ${seed}`;
      expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
      expect(g.specsForSkill(q.skill).length, q.skill).toBeGreaterThan(0);
      expect(q.world.w * q.world.h, where).toBeLessThanOrEqual(42);
      const tags: string[] = [];
      if (q.kind === 'bygg') {
        expect(solves(q.world, q.solution!), where).toBe(true);
        if (q.maxBlocks) expect(size(q.solution!), where).toBeLessThanOrEqual(q.maxBlocks);
        expect(samePos(q.world.start, q.world.goal!), where).toBe(false);
      }
      if (q.kind === 'vart') {
        expect(q.world.goal, where).toBeUndefined();
        const t = run(q.world, q.prog!);
        expect(t.crash, where).toBeUndefined();
        const right = q.spots!.filter((s) => !s.err);
        expect(right.length, where).toBe(1);
        expect(right[0].at, where).toEqual(t.end);
        expect(new Set(q.spots!.map((s) => `${s.at}`)).size, where).toBe(q.spots!.length);
        expect(q.spots!.length, where).toBeGreaterThanOrEqual(3);
        tags.push(...q.spots!.filter((s) => s.err).map((s) => s.err!));
      }
      if (q.kind === 'bugg') {
        expect(solves(q.world, q.prog!), where).toBe(false);
        expect(solves(q.world, q.solution!), where).toBe(true);
        expect(q.targets!.length, where).toBeGreaterThan(0);
        for (const id of ids(q.prog!)) {
          const tag = checkBug(q, id);
          if (tag) tags.push(tag);
        }
        expect(tags.length, `${where}: minst ett block som inte är fel`).toBeGreaterThan(0);
      }
      if (q.kind === 'lucka') {
        const hole = blockAt(q.prog!, q.hole!);
        const works = q.fills!.filter((f) => solves(q.world, replaceAt(q.prog!, q.hole!, isLoop(hole) ? { rep: f.fill as number, body: hole.body } : (f.fill as never))));
        expect(works.length, where).toBe(1);
        expect(works[0].err, where).toBeUndefined();
        expect(q.fills!.filter((f) => !f.err).length, where).toBe(1);
        tags.push(...q.fills!.filter((f) => f.err).map((f) => f.err!));
      }
      for (const tag of tags) {
        expect(ROBOT_ERR[tag], `${where}: etikett ${tag}`).toBeTruthy();
        const ex = explainRobot(tag, q);
        expect(ex.text.length, where).toBeGreaterThan(10);
      }
    }
  }
}

/** Bossens fälla finns bland felen i varje fråga där det går att se (vart, bugg, lucka). */
function checkRobotTraps(def: AreaDef, g: RobotGame) {
  for (const n of allNodes(def)) {
    if (n.type !== 'boss' || !n.trap) continue;
    for (const s of n.pool) for (const level of [s.level, s.level + 1]) for (let seed = 0; seed < 30; seed++) {
      const q = g.make({ ...s, level, trap: n.trap }, rngFrom(seed));
      if (q.kind === 'vart') expect(q.spots!.some((x) => x.err === n.trap), `${n.id} ${seed}`).toBe(true);
      if (q.kind === 'lucka') expect(q.fills!.some((x) => x.err === n.trap), `${n.id} ${seed}`).toBe(true);
      if (q.kind === 'bugg') expect(ids(q.prog!).some((id) => checkBug(q, id) === n.trap), `${n.id} ${seed}`).toBe(true);
      if (q.kind === 'bygg' && n.trap === 'vanster-hoger') {
        expect([2, 3], `${n.id} ${seed}`).toContain(q.world.dir);
        expect(solves(q.world, swapLR(q.solution!)), `${n.id} ${seed}`).toBe(false);
      }
    }
  }
}

describe('Kodstigen', () => {
  it('alla frågor går att lösa och har förklarade fel', () => checkRobotArea(KODSTIGEN, kodstigenGame));
  it('bossarnas fällor', () => checkRobotTraps(KODSTIGEN, kodstigenGame));
});

describe('Loopverkstaden', () => {
  it('alla frågor går att lösa och har förklarade fel', () => checkRobotArea(LOOPVERKSTADEN, loopverkstadenGame));
  it('bossarnas fällor', () => checkRobotTraps(LOOPVERKSTADEN, loopverkstadenGame));
  it('loop-bygg kräver en loop: utan loop räcker inte blocken', () => {
    for (let seed = 0; seed < 40; seed++) {
      const q = loopverkstadenGame.make({ mode: 'loop-bygg', level: seed % 3 }, rngFrom(seed));
      expect(solve(q.world, q.palette)!.length, `${seed}`).toBeGreaterThan(q.maxBlocks!);
    }
  });
});

describe('Buggjakten', () => {
  it('alla frågor går att lösa och har förklarade fel', () => checkRobotArea(BUGGJAKTEN, buggjaktenGame));
  it('bossens fälla', () => checkRobotTraps(BUGGJAKTEN, buggjaktenGame));
});
