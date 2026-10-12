import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import type { Atom, Cmd, Dir, Palette, Prog, RobotGame, RobotQ, World } from '../../engines/robot/types';
import { addRocks, fixable, injectBug, luckaFills, patternWorld, puzzle, randomProg, vartSpots, type PuzzleOpts } from '../../engines/robot/gen';
import { blockAt, compress, ids, isLoop, size, solve, solves, swapLR } from '../../engines/robot/world';

// Robotöns tre robotområden: Kodstigen (styra roboten), Loopverkstaden (loopar) och Buggjakten (hitta felet).
// Ett läge (mode) + en nivå (level) blir en fråga. Färdighets-id:n är permanenta.

const clampLevel = (level: number, max: number) => Math.max(0, Math.min(level, max));

/** En vart-fråga: programmet och rutorna A–D. Provar nya program tills fällan (om någon) får en egen ruta. */
function vartQ(rng: Rng, base: Omit<RobotQ, 'kind' | 'prompt' | 'world'>, make: () => { world: World; prog: Prog } | null, trap?: string): RobotQ {
  for (let tries = 0; tries < 300; tries++) {
    const m = make();
    if (!m) continue;
    const world = { ...m.world, goal: undefined, gems: [] };
    const spots = vartSpots(rng, world, m.prog, tries < 250 ? trap : undefined);
    if (!spots) continue;
    return { ...base, kind: 'vart', prompt: 'Var hamnar roboten när programmet har körts?', world, prog: m.prog, spots };
  }
  throw new Error(`Ingen vart-fråga för ${base.mode}`);
}

const BYGG_PROMPT: Record<Palette, string> = {
  pilar: 'Bygg ett program som tar roboten till 🔋.',
  svang: 'Bygg ett program som tar roboten till 🔋. Kolla vart roboten tittar!',
};

function byggQ(rng: Rng, base: Omit<RobotQ, 'kind' | 'prompt' | 'world'>, o: PuzzleOpts, trap?: string): RobotQ {
  for (let tries = 0; tries < 40; tries++) {
    const { world, sol } = puzzle(rng, o);
    // Spegeltrollets fråga: roboten tittar nedåt eller åt vänster, så att dess vänster inte är barnets vänster, och lösningen svänger.
    if (trap === 'vanster-hoger' && (world.dir === 0 || world.dir === 1 || solves(world, swapLR(sol))) && tries < 39) continue;
    const gems = world.gems.length ? (world.gems.length > 1 ? ' Plocka alla 💎 på vägen.' : ' Plocka 💎 på vägen.') : '';
    return { ...base, kind: 'bygg', prompt: BYGG_PROMPT[o.palette] + gems, world, palette: o.palette, solution: compress(sol as Prog) };
  }
  throw new Error('unreachable');
}

// ---------- Kodstigen ----------

const KOD_BYGG: Record<string, PuzzleOpts[]> = {
  pilar: [
    { w: 4, h: 4, palette: 'pilar', len: [2, 4] },
    { w: 5, h: 5, palette: 'pilar', len: [4, 7], rocks: [3, 5], rocksMatter: true },
  ],
  svang: [
    { w: 5, h: 5, palette: 'svang', len: [3, 5] },
    { w: 5, h: 5, palette: 'svang', len: [5, 8], rocks: [3, 5], rocksMatter: true },
  ],
  diamant: [
    { w: 5, h: 5, palette: 'pilar', len: [5, 9], gems: 2, rocks: [1, 3] },
    { w: 6, h: 5, palette: 'svang', len: [7, 12], gems: 2, rocks: [2, 4] },
  ],
};

const KOD_SKILL: Record<string, string> = {
  pilar: 'prog.kod.pilar', svang: 'prog.kod.svang', diamant: 'prog.kod.diamant', 'pilar-vart': 'prog.kod.vart', 'svang-vart': 'prog.kod.vart',
};

function kodMake(spec: QuestionSpec, rng: Rng): RobotQ {
  let mode = spec.mode;
  if (mode === 'blandat') mode = rng.pick(spec.level >= 1 ? ['pilar', 'svang', 'diamant', 'pilar-vart', 'svang-vart'] : ['pilar', 'svang', 'pilar-vart', 'svang-vart']);
  const skill = KOD_SKILL[mode];
  if (mode === 'pilar-vart' || mode === 'svang-vart') {
    const palette: Palette = mode === 'pilar-vart' ? 'pilar' : 'svang';
    const lvl = clampLevel(spec.level, 1);
    const len: [number, number] = palette === 'pilar' ? (lvl ? [5, 7] : [3, 4]) : (lvl ? [6, 8] : [4, 5]);
    const base = { mode, level: lvl, skill, palette };
    return vartQ(rng, base, () => {
      const world: World = { w: 5, h: 5, start: [rng.int(5), rng.int(5)], dir: palette === 'svang' ? (rng.int(4) as Dir) : 1, rocks: [], gems: [] };
      if (spec.trap === 'vanster-hoger' && palette === 'svang' && world.dir !== 2) world.dir = rng.pick([2, 3] as const);
      const prog = randomProg(rng, world, palette, len, lvl + 1);
      return prog ? { world, prog } : null;
    }, spec.trap);
  }
  const opts = KOD_BYGG[mode] ?? KOD_BYGG.pilar;
  const lvl = clampLevel(spec.level, opts.length - 1);
  return byggQ(rng, { mode, level: lvl, skill, palette: opts[lvl].palette }, opts[lvl], spec.trap);
}

export const kodstigenGame: RobotGame = {
  id: 'kodstigen',
  make: kodMake,
  specsForSkill: (skill) => ({
    'prog.kod.pilar': [{ mode: 'pilar', level: 0 }, { mode: 'pilar', level: 1 }],
    'prog.kod.svang': [{ mode: 'svang', level: 0 }, { mode: 'svang', level: 1 }],
    'prog.kod.diamant': [{ mode: 'diamant', level: 0 }, { mode: 'diamant', level: 1 }],
    'prog.kod.vart': [{ mode: 'pilar-vart', level: 0 }, { mode: 'svang-vart', level: 0 }],
  } as Record<string, QuestionSpec[]>)[skill] ?? [],
};

// ---------- Loopverkstaden ----------

/** Mönster att upprepa: kroppen och hur många varv som är rimliga. */
const PATTERNS: Record<Palette, { body: Atom[]; reps: [number, number] }[]> = {
  pilar: [
    { body: ['R'], reps: [3, 5] }, { body: ['D'], reps: [3, 4] }, { body: ['R', 'D'], reps: [2, 4] }, { body: ['D', 'R'], reps: [2, 4] },
    { body: ['R', 'R', 'D'], reps: [2, 2] }, { body: ['U', 'R'], reps: [2, 4] }, { body: ['R', 'U', 'R'], reps: [2, 2] }, { body: ['D', 'D', 'R'], reps: [2, 2] },
  ],
  svang: [
    { body: ['F'], reps: [3, 5] }, { body: ['F', 'H', 'F', 'V'], reps: [2, 3] }, { body: ['F', 'V', 'F', 'H'], reps: [2, 3] },
    { body: ['F', 'F', 'H'], reps: [2, 3] }, { body: ['F', 'F', 'V'], reps: [2, 3] }, { body: ['F', 'H', 'F'], reps: [2, 2] },
  ],
};

/** Ett program med en loop: kanske ett block före och efter. */
function loopProg(rng: Rng, palette: Palette, multi: boolean, extras: boolean): Prog {
  const pats = PATTERNS[palette].filter((p) => !multi || p.body.length > 1);
  const p = rng.pick(pats);
  const rep = p.reps[0] + rng.int(p.reps[1] - p.reps[0] + 1);
  const prog: Prog = [{ rep, body: [...p.body] }];
  if (extras && rng.next() < 0.5) prog.unshift(rng.pick(palette === 'pilar' ? ['R', 'D'] as Atom[] : ['F', 'H', 'V'] as Atom[]));
  if (extras && rng.next() < 0.5) prog.push(palette === 'pilar' ? rng.pick(['R', 'D', 'U'] as Atom[]) : 'F');
  return prog;
}

/** Loopar i loopar: [[F]×k, H]×n eller [[R]×k, D]×n. */
function nestedProg(rng: Rng, palette: Palette): Prog {
  const k = 2 + rng.int(2), n = 2 + rng.int(2);
  const inner: Cmd = { rep: k, body: [palette === 'pilar' ? 'R' : 'F'] };
  const turn: Atom = palette === 'pilar' ? rng.pick(['D', 'U'] as Atom[]) : rng.pick(['H', 'V'] as Atom[]);
  return [{ rep: n, body: [inner, turn] }];
}

const LOOP_SKILL: Record<string, string> = { antal: 'prog.loop.antal', 'loop-vart': 'prog.loop.vart', 'loop-bygg': 'prog.loop.bygg', nastlad: 'prog.loop.nastlad' };

function loopWorld(rng: Rng, palette: Palette, prog: Prog, gems = 0): World | null {
  return patternWorld(rng, palette === 'pilar' ? 6 : 6, 6, prog, palette, gems);
}

function loopMake(spec: QuestionSpec, rng: Rng): RobotQ {
  let mode = spec.mode;
  if (mode === 'blandat') mode = rng.pick(spec.level >= 1 ? ['antal', 'loop-vart', 'loop-bygg', 'nastlad'] : ['antal', 'loop-vart', 'loop-bygg']);
  const skill = LOOP_SKILL[mode];
  const lvl = clampLevel(spec.level, mode === 'nastlad' ? 1 : 2);
  const palette: Palette = lvl === 0 && mode !== 'nastlad' ? 'pilar' : mode === 'nastlad' ? (rng.next() < 0.5 ? 'pilar' : 'svang') : 'svang';
  const base = { mode, level: lvl, skill, palette };

  if (mode === 'loop-vart' || (mode === 'nastlad' && lvl === 0)) {
    return vartQ(rng, base, () => {
      const prog = mode === 'nastlad' ? nestedProg(rng, palette) : loopProg(rng, palette, spec.trap === 'bara-forsta' || lvl >= 1, lvl >= 2);
      const world = loopWorld(rng, palette, prog);
      return world ? { world, prog } : null;
    }, spec.trap);
  }

  if (mode === 'antal') {
    for (let tries = 0; tries < 300; tries++) {
      const prog = loopProg(rng, palette, false, lvl >= 1);
      let world = loopWorld(rng, palette, prog);
      if (!world) continue;
      world = addRocks(rng, world, 2 + rng.int(3), prog);
      const hole = ids(prog).find((id) => isLoop(blockAt(prog, id)))!;
      const fills = luckaFills(world, prog, hole, palette);
      if (!fills) continue;
      return { ...base, kind: 'lucka', prompt: 'Hur många varv ska loopen gå för att roboten ska komma till 🔋?', world, prog, hole, fills };
    }
    throw new Error('Ingen antal-fråga');
  }

  // Bygg med loopar: blocken räcker bara om man använder en loop.
  for (let tries = 0; tries < 300; tries++) {
    const nested = mode === 'nastlad';
    const prog = nested ? nestedProg(rng, palette) : loopProg(rng, palette, lvl >= 1, false);
    let world = loopWorld(rng, palette, prog, lvl >= 2 && !nested ? 2 : 0);
    if (!world) continue;
    world = addRocks(rng, world, 2 + rng.int(3), prog);
    const maxBlocks = size(prog) + 1;
    const plain = solve(world, palette);
    if (!plain || plain.length <= maxBlocks) continue;
    if (!solves(world, prog)) continue;
    const gems = world.gems.length ? ' Plocka alla 💎 på vägen.' : '';
    return { ...base, kind: 'bygg', prompt: `Bygg ett program som tar roboten till 🔋. Använd en loop!${gems}`, world, loops: true, maxBlocks, solution: prog };
  }
  throw new Error('Ingen loop-bygg-fråga');
}

export const loopverkstadenGame: RobotGame = {
  id: 'loopverkstaden',
  make: loopMake,
  specsForSkill: (skill) => ({
    'prog.loop.antal': [{ mode: 'antal', level: 0 }, { mode: 'antal', level: 1 }],
    'prog.loop.vart': [{ mode: 'loop-vart', level: 0 }, { mode: 'loop-vart', level: 1 }],
    'prog.loop.bygg': [{ mode: 'loop-bygg', level: 0 }, { mode: 'loop-bygg', level: 1 }],
    'prog.loop.nastlad': [{ mode: 'nastlad', level: 0 }, { mode: 'nastlad', level: 1 }],
  } as Record<string, QuestionSpec[]>)[skill] ?? [],
};

// ---------- Buggjakten ----------

const BUGG_SKILL: Record<string, string> = { pilar: 'prog.bugg.pilar', svang: 'prog.bugg.svang', loop: 'prog.bugg.loop', laga: 'prog.bugg.laga' };

function buggMake(spec: QuestionSpec, rng: Rng): RobotQ {
  let mode = spec.mode;
  if (mode === 'blandat') mode = rng.pick(spec.level >= 1 ? ['pilar', 'svang', 'loop', 'laga'] : ['pilar', 'svang', 'laga']);
  const skill = BUGG_SKILL[mode];
  const lvl = clampLevel(spec.level, 1);
  const early = spec.trap === 'sista-blocket';

  if (mode === 'laga') {
    const palette: Palette = lvl === 0 ? 'pilar' : 'svang';
    for (let tries = 0; tries < 300; tries++) {
      const { world, sol } = puzzle(rng, { w: 5, h: 5, palette, len: lvl ? [5, 8] : [3, 6], rocks: [2, 4] });
      const prog = compress(sol);
      const holes = ids(prog).filter((id) => !isLoop(blockAt(prog, id)));
      const hole = rng.pick(holes);
      const fills = luckaFills(world, prog, hole, palette);
      if (!fills) continue;
      return { mode, level: lvl, skill, palette, kind: 'lucka', prompt: 'Ett block har ramlat bort. Vilket block ska sitta där frågetecknet är?', world, prog, hole, fills };
    }
    throw new Error('Ingen laga-fråga');
  }

  const palette: Palette = mode === 'pilar' ? 'pilar' : mode === 'svang' ? 'svang' : (lvl === 0 ? 'pilar' : 'svang');
  for (let tries = 0; tries < 300; tries++) {
    let world: World, sol: Prog;
    if (mode === 'loop') {
      const p = loopProg(rng, palette, true, true);
      const w = patternWorld(rng, 6, 6, p, palette);
      if (!w) continue;
      world = addRocks(rng, w, 2 + rng.int(3), p); sol = p;
    } else {
      const len: [number, number] = early ? [5, 8] : lvl ? [5, 9] : [3, 6];
      ({ world, sol } = puzzle(rng, { w: 5, h: 5, palette, len, rocks: lvl ? [2, 4] : [0, 2] }));
      sol = compress(sol);
    }
    if (early && ids(sol).length < 4) continue;
    const bug = injectBug(rng, world, sol, palette, early);
    if (!bug) continue;
    const targets = fixable(world, bug.prog, palette);
    if (!targets.includes(bug.bug)) continue;
    // Fällan behöver block efter felet att skylla på.
    if (early && ids(bug.prog).indexOf(bug.bug) > ids(bug.prog).length - 3) continue;
    // Inte en fråga där nästan alla block går att rätta.
    if (targets.length > Math.ceil(ids(bug.prog).length / 2)) continue;
    return {
      mode, level: lvl, skill, palette, kind: 'bugg',
      prompt: 'Roboten skulle till 🔋, men något är fel i programmet. Tryck på blocket som är fel.',
      world, prog: bug.prog, solution: sol, targets,
    };
  }
  throw new Error('Ingen bugg-fråga');
}

export const buggjaktenGame: RobotGame = {
  id: 'buggjakten',
  make: buggMake,
  specsForSkill: (skill) => ({
    'prog.bugg.pilar': [{ mode: 'pilar', level: 0 }, { mode: 'pilar', level: 1 }],
    'prog.bugg.svang': [{ mode: 'svang', level: 0 }, { mode: 'svang', level: 1 }],
    'prog.bugg.loop': [{ mode: 'loop', level: 0 }, { mode: 'loop', level: 1 }],
    'prog.bugg.laga': [{ mode: 'laga', level: 0 }, { mode: 'laga', level: 1 }],
  } as Record<string, QuestionSpec[]>)[skill] ?? [],
};

