import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, getProfile, heroKey, saveHeroState } from '../profiles';
import { randomSeed, rngFrom, type Rng } from '../rng';
import { BOSS, BOSS_HP_SCALE, CLEAR_MIN, FAST_MS, HINTS_PER_DAY, LOOT, minHits, needXP, PRACTICE_LENGTH, REWARD, RUN_LENGTH, TIRED_AFTER_MS, XP } from './balance';
import { addChest, bumpPity, effects, getInv, giveSignatureItem, givePetItem, heroStats, useLifePotion, type Chest } from './inventory';
import type { Item } from './items';
import { getEvents, logEvents, type LogEvent } from '../learning/events';
import { noteAnswer } from '../learning/skills';
import { allNodes, type AreaDef, type BossDef, type GameModule, type PathNode, type QuestionSpec, type StageDef } from './types';

// Rundor, bossstrider och belöningar. Allt sparas direkt efter varje svar,
// så att en omladdning fortsätter exakt där barnet var (samma frågor via seed + index).

/* ---------- poster ---------- */

export interface StageProgress { stars: number; cleared: boolean; best: number; runs: number; clearedAt?: string }
export interface BossProgress { defeated: boolean; attempts: number; wins: number; lastWinDay?: string }
export interface AreaProgress { v: number; stages: Record<string, StageProgress>; bosses: Record<string, BossProgress>; xp: number }

export const AREA: RecordSpec<AreaProgress> = { version: 1, defaults: () => ({ v: 1, stages: {}, bosses: {}, xp: 0 }) };

export interface Answer { correct: boolean; ms: number; hint: boolean; fixed?: 'self' | 'shown' }

export interface RunState {
  kind: 'stage' | 'practice' | 'boss' | 'review';
  areaId: string;
  nodeId: string;
  seed: number;
  /** Fråga som visas just nu. */
  index: number;
  results: Answer[];
  startedAt: string;
  xp: number;
  levelUps: number;
  hp?: number;
  maxHp?: number;
  hearts?: number;
  maxHearts?: number;
  /** Satt för bossstrider från fas 3: HP räknas i poäng (träffar × 10) och utrustning påverkar skadan. */
  hpScale?: number;
  lastHit?: { dmg: number; crit: boolean };
  /** Repetitionsrunda: färdigheten för varje fråga (bestäms när rundan startar). */
  review?: string[];
}

/** Repetitionsrundor hör inte till stigen; de spelas på den här låtsasnoden. */
export const REVIEW_NODE: StageDef = { type: 'stage', id: 'dimma', name: 'Glömskans dimma', icon: '🌫️', desc: 'Repetition', spec: { mode: '', level: 0 }, thrMs: 0 };

export interface PlayState {
  v: number;
  run: RunState | null;
  last: { areaId: string; nodeId: string; at: string; result?: { correct: number; total: number } } | null;
  day: string;
  activeMs: number;
  hintsUsed: number;
}

export const PLAY: RecordSpec<PlayState> = {
  version: 1,
  defaults: () => ({ v: 1, run: null, last: null, day: '', activeMs: 0, hintsUsed: 0 }),
};

export const getArea = (hid: string, areaId: string) => loadRecord(heroKey(hid, 'area:' + areaId), AREA).value;
export const saveArea = (hid: string, areaId: string, a: AreaProgress) => saveRecord(heroKey(hid, 'area:' + areaId), AREA, a);

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function getPlay(hid: string): PlayState {
  const p = loadRecord(heroKey(hid, 'play'), PLAY).value;
  if (p.day !== today()) return { ...p, day: today(), activeMs: 0, hintsUsed: 0 };
  return p;
}
export const savePlay = (hid: string, p: PlayState) => saveRecord(heroKey(hid, 'play'), PLAY, p);

export { getEvents, type LogEvent };

/* ---------- karta: vad är öppet? ---------- */

export function nodeDone(p: AreaProgress, n: PathNode): boolean {
  return n.type === 'stage' ? !!p.stages[n.id]?.cleared : !!p.bosses[n.id]?.defeated;
}

export function nodeStatus(area: AreaDef, p: AreaProgress, nodeId: string): 'done' | 'open' | 'locked' {
  const nodes = allNodes(area);
  const i = nodes.findIndex((n) => n.id === nodeId);
  if (i < 0) return 'locked';
  if (nodeDone(p, nodes[i])) return 'done';
  return i === 0 || nodeDone(p, nodes[i - 1]) ? 'open' : 'locked';
}

export const nextOpenNode = (area: AreaDef, p: AreaProgress) => allNodes(area).find((n) => nodeStatus(area, p, n.id) === 'open');
export const findNode = (area: AreaDef, id: string) => allNodes(area).find((n) => n.id === id);

/* ---------- hjälpmedel och trötthet ---------- */

export function hintsLeft(hid: string): number {
  const prof = getProfile(hid);
  const inv = getInv(hid);
  const bonus = inv.bonusHints.day === today() ? inv.bonusHints.n : 0;
  return Math.max(0, HINTS_PER_DAY + (prof?.heroClass === 'uppfinnare' ? 1 : 0) + effects.extraHints(heroStats(hid)) + bonus - getPlay(hid).hintsUsed);
}
export function useHint(hid: string): boolean {
  if (hintsLeft(hid) < 1) return false;
  const p = getPlay(hid);
  savePlay(hid, { ...p, hintsUsed: p.hintsUsed + 1 });
  return true;
}
export const isTired = (hid: string) => getPlay(hid).activeMs >= TIRED_AFTER_MS;

/* ---------- XP och kastanjer ---------- */

/** Ger XP till hjälten och områdets kunskap. Returnerar faktisk XP och antal nya nivåer. */
export function giveXP(hid: string, areaId: string, base: number): { xp: number; levelUps: number } {
  if (base <= 0) return { xp: 0, levelUps: 0 };
  const cls = getProfile(hid)?.heroClass;
  const xp = Math.round(base * (1 + (cls === 'trollkarl' ? XP.trollkarlBonus : 0) + effects.xpBonus(heroStats(hid))));
  const s = getHeroState(hid);
  s.xp += xp;
  let levelUps = 0;
  while (s.xp >= needXP(s.level)) { s.xp -= needXP(s.level); s.level++; levelUps++; }
  saveHeroState(hid, s);
  const a = getArea(hid, areaId);
  saveArea(hid, areaId, { ...a, xp: a.xp + xp });
  return { xp, levelUps };
}

/** Ger kastanjer, om hjälten inte är trött för dagen. Returnerar faktiskt antal. */
export function giveKastanjer(hid: string, n: number): number {
  if (n <= 0 || isTired(hid)) return 0;
  const s = getHeroState(hid);
  saveHeroState(hid, { ...s, kastanjer: s.kastanjer + n });
  return n;
}

/* ---------- rundor ---------- */

export function runLength(run: RunState): number {
  if (run.kind === 'review') return run.review?.length ?? PRACTICE_LENGTH;
  return run.kind === 'practice' ? PRACTICE_LENGTH : run.kind === 'stage' ? RUN_LENGTH : Infinity;
}

export function startRun(hid: string, area: AreaDef, node: PathNode, kind: RunState['kind'] = node.type === 'boss' ? 'boss' : 'stage'): RunState {
  const run: RunState = { kind, areaId: area.areaId, nodeId: node.id, seed: randomSeed(), index: 0, results: [], startedAt: new Date().toISOString(), xp: 0, levelUps: 0 };
  if (kind === 'boss' && node.type === 'boss') {
    const cls = getProfile(hid)?.heroClass;
    const potion = useLifePotion(hid) ? 1 : 0;
    const hearts = Math.min(BOSS.maxHearts, BOSS.hearts + (cls === 'riddare' ? BOSS.riddareHearts : 0) + effects.extraHearts(heroStats(hid)) + potion);
    const hp = node.hp * BOSS_HP_SCALE;
    Object.assign(run, { hp, maxHp: hp, hearts, maxHearts: hearts, hpScale: BOSS_HP_SCALE });
    const a = getArea(hid, area.areaId);
    const b = a.bosses[node.id] ?? { defeated: false, attempts: 0, wins: 0 };
    saveArea(hid, area.areaId, { ...a, bosses: { ...a.bosses, [node.id]: { ...b, attempts: b.attempts + 1 } } });
  }
  const p = getPlay(hid);
  savePlay(hid, { ...p, run, last: { areaId: area.areaId, nodeId: node.id, at: new Date().toISOString() } });
  return run;
}

/** Startar en repetitionsrunda på givna färdigheter (en per fråga). */
export function startReview(hid: string, area: AreaDef, skills: string[]): RunState {
  const run: RunState = { kind: 'review', areaId: area.areaId, nodeId: REVIEW_NODE.id, seed: randomSeed(), index: 0, results: [], startedAt: new Date().toISOString(), xp: 0, levelUps: 0, review: skills };
  const p = getPlay(hid);
  savePlay(hid, { ...p, run });
  return run;
}

/** En fråga som tränar exakt en färdighet: provar spelets inställningar för den tills frågan träffar. */
export function questionForSkill(game: GameModule, skill: string, rng: Rng): unknown {
  const specs = game.specsForSkill(skill);
  if (!specs.length) throw new Error(`Ingen fråga för ${skill}`);
  let q: unknown;
  for (let i = 0; i < 200; i++) {
    q = game.makeQuestion(rng.pick(specs), rng);
    if (game.skillOf(q) === skill) return q;
  }
  return q;
}

/** Frågan för aktuellt index. Deterministisk: samma seed och index ger samma fråga. */
export function questionSpec(run: RunState, node: PathNode, rngNext: () => number): QuestionSpec {
  if (node.type === 'stage') return node.spec;
  const boss = node as BossDef;
  const spec = boss.pool[Math.floor(rngNext() * boss.pool.length)];
  if (run.kind === 'practice') return spec;
  const phase2 = (run.hp ?? 0) <= (run.maxHp ?? 0) / 2;
  return { ...spec, level: phase2 ? spec.level + 1 : spec.level, trap: run.index % 2 === 0 ? boss.trap : undefined };
}

export function currentQuestion(run: RunState, node: PathNode, game: GameModule): unknown {
  const rng = rngFrom(run.seed + run.index * 7919);
  if (run.review) return questionForSkill(game, run.review[run.index % run.review.length], rng);
  return game.makeQuestion(questionSpec(run, node, rng.next), rng);
}

/** Registrerar första svaret på aktuell fråga. */
export function recordAnswer(hid: string, run: RunState, node: PathNode, a: Answer, skill: string, errTag?: string): RunState {
  if (run.results.length > run.index) return run; // redan registrerat (t.ex. efter omladdning)
  const next: RunState = { ...run, results: [...run.results, a] };
  const base = a.correct ? (run.kind === 'practice' || run.kind === 'review' ? XP.practiceCorrect : XP.correct) * (a.hint ? XP.hintFactor : 1) : 0;
  const g = giveXP(hid, run.areaId, base);
  next.xp += g.xp;
  next.levelUps += g.levelUps;
  if (run.kind === 'boss') {
    if (a.correct) {
      const hit = bossHit(hid, run, node as BossDef, a.ms);
      next.hp = Math.max(0, (run.hp ?? 0) - hit.dmg);
      next.lastHit = hit;
    } else {
      next.hearts = Math.max(0, (run.hearts ?? 0) - 1);
      next.lastHit = undefined;
    }
  }
  noteAnswer(hid, run.areaId, skill, a.correct, a.hint, errTag);
  logEvents(hid, [{ t: new Date().toISOString(), a: run.areaId, n: node.id, k: skill, c: a.correct, ms: a.ms, ...(errTag ? { e: errTag } : {}), ...(a.hint ? { h: true } : {}) }]);
  const p = getPlay(hid);
  savePlay(hid, { ...p, run: next, activeMs: p.activeMs + Math.min(a.ms, 60_000) });
  return next;
}

/** Skada för ett rätt svar. Taket gör att ingen utrustning kan vinna med färre än minHits rätta svar. */
export function bossHit(hid: string, run: RunState, boss: BossDef, ms: number): { dmg: number; crit: boolean } {
  if (!run.hpScale) return { dmg: 1, crit: false }; // strid påbörjad före fas 3
  const st = heroStats(hid);
  const ranger = getProfile(hid)?.heroClass === 'ranger';
  const crit = Math.random() < effects.critChance(st, ranger);
  const raw = effects.damage(st) + (ms < FAST_MS ? effects.fastBonus(st) : 0) + (crit ? 5 : 0);
  const cap = Math.floor((run.maxHp ?? 0) / minHits(boss.kind, boss.hp));
  return { dmg: Math.min(raw, cap), crit };
}

/** Barnet rättade sitt fel: liten XP-bonus, och frågan räknas som klar. */
export function recordFixed(hid: string, run: RunState, fixed: 'self' | 'shown'): RunState {
  const results = run.results.slice();
  const last = results[run.index];
  if (last && !last.correct && !last.fixed) {
    results[run.index] = { ...last, fixed };
    let { xp, levelUps } = run;
    if (fixed === 'self') { const g = giveXP(hid, run.areaId, XP.fix); xp += g.xp; levelUps += g.levelUps; }
    run = { ...run, results, xp, levelUps };
    const p = getPlay(hid);
    savePlay(hid, { ...p, run });
  }
  return run;
}

export function runOver(run: RunState): boolean {
  if (run.kind === 'boss') return (run.hp ?? 0) <= 0 || (run.hearts ?? 0) <= 0;
  return run.results.length >= runLength(run);
}

/** Går till nästa fråga och sparar. */
export function advance(hid: string, run: RunState): RunState {
  const next = { ...run, index: run.index + 1 };
  const p = getPlay(hid);
  savePlay(hid, { ...p, run: next });
  return next;
}

export function abandonRun(hid: string) {
  const p = getPlay(hid);
  savePlay(hid, { ...p, run: null });
}

/* ---------- avslut och belöning ---------- */

export interface Outcome {
  kind: RunState['kind'];
  correct: number;
  total: number;
  avgMs: number;
  usedHint: boolean;
  cleared: boolean;
  firstClear: boolean;
  stars: number;
  newStars: number;
  bossWon: boolean;
  firstWin: boolean;
  xp: number;
  kastanjer: number;
  levelUps: number;
  tired: boolean;
  gained: { pet?: string; mentor?: string; title?: string; items?: Item[] };
  chests: Chest[];
}

export function starsFor(correct: number, total: number, avgMs: number, usedHint: boolean, thrMs: number): number {
  if (total < RUN_LENGTH || correct < CLEAR_MIN) return 0;
  if (correct < RUN_LENGTH) return 1;
  return !usedHint && avgMs <= thrMs ? 3 : 2;
}

/** Föremålsnivå för en nod: stiger längs stigen. */
export const nodeIlvl = (area: AreaDef, nodeId: string) => 1 + Math.floor(Math.max(0, allNodes(area).findIndex((n) => n.id === nodeId)) / 2);

/** Föremålsnivå för repetition: som den längsta noden hjälten klarat i området. */
const areaIlvl = (area: AreaDef, p: AreaProgress) => Math.max(1, ...allNodes(area).filter((n) => nodeDone(p, n)).map((n) => nodeIlvl(area, n.id)));

export function finishRun(hid: string, area: AreaDef, run: RunState, extras: { signature?: { name: string; slot: string; flavor: string } } = {}): Outcome {
  const node = run.kind === 'review' ? REVIEW_NODE : findNode(area, run.nodeId)!;
  const correct = run.results.filter((r) => r.correct).length;
  const total = run.results.length;
  const avgMs = total ? run.results.reduce((s, r) => s + r.ms, 0) / total : 0;
  const usedHint = run.results.some((r) => r.hint);
  const o: Outcome = { kind: run.kind, correct, total, avgMs, usedHint, cleared: false, firstClear: false, stars: 0, newStars: 0,
    bossWon: false, firstWin: false, xp: run.xp, kastanjer: 0, levelUps: run.levelUps, tired: isTired(hid), gained: {}, chests: [] };
  const ilvl = run.kind === 'review' ? areaIlvl(area, getArea(hid, area.areaId)) : nodeIlvl(area, run.nodeId);
  let chest: { minRarity: 0 | 1 | 2; boss?: boolean } | null = null;
  const reward = (r: { xp?: number; kastanjer?: number }) => {
    const g = giveXP(hid, run.areaId, r.xp ?? 0);
    o.xp += g.xp;
    o.levelUps += g.levelUps;
    o.kastanjer += giveKastanjer(hid, r.kastanjer ?? 0);
  };

  const a = getArea(hid, area.areaId);
  if (run.kind === 'stage' && node.type === 'stage') {
    const sp = a.stages[node.id] ?? { stars: 0, cleared: false, best: 0, runs: 0 };
    const stars = starsFor(correct, total, avgMs, usedHint, node.thrMs);
    o.stars = stars;
    o.cleared = stars > 0;
    o.firstClear = o.cleared && !sp.cleared;
    o.newStars = Math.max(0, stars - sp.stars);
    saveArea(hid, area.areaId, { ...getArea(hid, area.areaId), stages: { ...a.stages, [node.id]: {
      stars: Math.max(sp.stars, stars), cleared: sp.cleared || o.cleared, best: Math.max(sp.best, correct), runs: sp.runs + 1,
      clearedAt: sp.clearedAt ?? (o.cleared ? new Date().toISOString() : undefined),
    } } });
    if (o.firstClear) reward({ ...REWARD.firstClear, kastanjer: REWARD.firstClear.kastanjer + REWARD.newStar.kastanjer * Math.max(0, stars - 1) });
    else if (o.cleared) reward({ ...REWARD.replayClear, kastanjer: REWARD.replayClear.kastanjer + REWARD.newStar.kastanjer * o.newStars });
    else reward(REWARD.failedRun);
    if (o.firstClear) chest = { minRarity: stars === 3 ? 1 : 0 };
    else if (o.cleared && (stars === 3 && o.newStars > 0)) chest = { minRarity: 2 };
    else if (Math.random() < (o.cleared ? LOOT.replayClearChance : LOOT.failedRunChance)) chest = { minRarity: 0 };
  } else if (run.kind === 'review') {
    reward(REWARD.reviewDone);
    if (Math.random() < LOOT.practiceChance) chest = { minRarity: 0 };
  } else if (run.kind === 'practice') {
    reward(REWARD.practiceDone);
    if (Math.random() < LOOT.practiceChance) chest = { minRarity: 0 };
  } else if (run.kind === 'boss' && node.type === 'boss') {
    const bp = a.bosses[node.id] ?? { defeated: false, attempts: 1, wins: 0 };
    o.bossWon = (run.hp ?? 1) <= 0;
    o.firstWin = o.bossWon && !bp.defeated;
    saveArea(hid, area.areaId, { ...getArea(hid, area.areaId), bosses: { ...a.bosses, [node.id]: {
      ...bp, defeated: bp.defeated || o.bossWon, wins: bp.wins + (o.bossWon ? 1 : 0), lastWinDay: o.bossWon ? today() : bp.lastWinDay,
    } } });
    if (o.firstWin) {
      reward(node.kind === 'mastare' ? REWARD.mastareFirstWin : REWARD.bossFirstWin);
      const s = getHeroState(hid);
      const key = `${area.areaId}:${node.id}`;
      if (node.kind === 'monster' && node.pet && !s.pets.includes(key)) { s.pets = [...s.pets, key]; o.gained.pet = node.pet.name; }
      if (node.kind === 'mastare' && !s.mentors.includes(key)) { s.mentors = [...s.mentors, key]; o.gained.mentor = node.name; }
      if (!s.titles.includes(node.titleReward)) { s.titles = [...s.titles, node.titleReward]; s.title = node.titleReward; o.gained.title = node.titleReward; }
      saveHeroState(hid, s);
      const items: Item[] = [];
      if (node.kind === 'monster' && node.pet) { const it = givePetItem(hid, key, node.pet, node.trap); if (it) items.push(it); }
      if (node.kind === 'mastare' && extras.signature) { const it = giveSignatureItem(hid, key, extras.signature); if (it) items.push(it); }
      if (items.length) o.gained.items = items;
      chest = { minRarity: 2, boss: true };
    } else if (o.bossWon) {
      // Mindre belöning, och bara en gång per dag och boss.
      if (bp.lastWinDay !== today()) { reward(REWARD.bossRewin); chest = { minRarity: 1, boss: true }; }
    } else reward(REWARD.bossLoss);
  }

  // Skattkista: aldrig när hjälten är trött; annars garanterad efter några rundor utan.
  if (!o.tired) {
    if (!chest && getInv(hid).pity + 1 >= LOOT.pityRuns) chest = { minRarity: 0 };
    if (chest) {
      const c = addChest(hid, { ilvl: ilvl + (chest.boss ? 1 : 0), minRarity: chest.minRarity, kind: chest.boss ? 'boss' : 'vanlig', source: node.name });
      o.chests.push(c);
    } else bumpPity(hid);
  }
  const p = getPlay(hid);
  const showResult = (run.kind === 'stage' || run.kind === 'practice') && p.last;
  savePlay(hid, { ...p, run: null, last: showResult ? { ...p.last!, result: { correct, total } } : p.last });
  return o;
}

export type { StageDef, BossDef };
