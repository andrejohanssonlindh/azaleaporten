import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { getHeroState, getProfile, heroKey, saveHeroState } from '../profiles';
import { randomSeed, rngFrom } from '../rng';
import { BOSS, CLEAR_MIN, HINTS_PER_DAY, needXP, PRACTICE_LENGTH, REWARD, RUN_LENGTH, TIRED_AFTER_MS, XP } from './balance';
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
  kind: 'stage' | 'practice' | 'boss';
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
}

export interface PlayState {
  v: number;
  run: RunState | null;
  last: { areaId: string; nodeId: string; at: string } | null;
  day: string;
  activeMs: number;
  hintsUsed: number;
}

export const PLAY: RecordSpec<PlayState> = {
  version: 1,
  defaults: () => ({ v: 1, run: null, last: null, day: '', activeMs: 0, hintsUsed: 0 }),
};

export interface LogEvent { t: string; a: string; n: string; k: string; c: boolean; ms: number; e?: string; h?: boolean }
interface EventLog { v: number; log: LogEvent[] }
const EVENTS: RecordSpec<EventLog> = { version: 1, defaults: () => ({ v: 1, log: [] }) };
const EVENT_CAP = 3000;

export const getArea = (hid: string, areaId: string) => loadRecord(heroKey(hid, 'area:' + areaId), AREA).value;
export const saveArea = (hid: string, areaId: string, a: AreaProgress) => saveRecord(heroKey(hid, 'area:' + areaId), AREA, a);

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function getPlay(hid: string): PlayState {
  const p = loadRecord(heroKey(hid, 'play'), PLAY).value;
  if (p.day !== today()) return { ...p, day: today(), activeMs: 0, hintsUsed: 0 };
  return p;
}
export const savePlay = (hid: string, p: PlayState) => saveRecord(heroKey(hid, 'play'), PLAY, p);

export function getEvents(hid: string): LogEvent[] { return loadRecord(heroKey(hid, 'events'), EVENTS).value.log; }
function logEvent(hid: string, e: LogEvent) {
  const r = loadRecord(heroKey(hid, 'events'), EVENTS).value;
  r.log.push(e);
  if (r.log.length > EVENT_CAP) r.log.splice(0, r.log.length - EVENT_CAP);
  saveRecord(heroKey(hid, 'events'), EVENTS, r);
}

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
  return Math.max(0, HINTS_PER_DAY + (prof?.heroClass === 'uppfinnare' ? 1 : 0) - getPlay(hid).hintsUsed);
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
  const xp = Math.round(base * (cls === 'trollkarl' ? 1 + XP.trollkarlBonus : 1));
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
  return run.kind === 'practice' ? PRACTICE_LENGTH : run.kind === 'stage' ? RUN_LENGTH : Infinity;
}

export function startRun(hid: string, area: AreaDef, node: PathNode, kind: RunState['kind'] = node.type === 'boss' ? 'boss' : 'stage'): RunState {
  const run: RunState = { kind, areaId: area.areaId, nodeId: node.id, seed: randomSeed(), index: 0, results: [], startedAt: new Date().toISOString(), xp: 0, levelUps: 0 };
  if (kind === 'boss' && node.type === 'boss') {
    const cls = getProfile(hid)?.heroClass;
    const hearts = Math.min(BOSS.maxHearts, BOSS.hearts + (cls === 'riddare' ? BOSS.riddareHearts : 0));
    Object.assign(run, { hp: node.hp, maxHp: node.hp, hearts, maxHearts: hearts });
    const a = getArea(hid, area.areaId);
    const b = a.bosses[node.id] ?? { defeated: false, attempts: 0, wins: 0 };
    saveArea(hid, area.areaId, { ...a, bosses: { ...a.bosses, [node.id]: { ...b, attempts: b.attempts + 1 } } });
  }
  const p = getPlay(hid);
  savePlay(hid, { ...p, run, last: { areaId: area.areaId, nodeId: node.id, at: new Date().toISOString() } });
  return run;
}

/** Frågan för aktuellt index. Deterministisk: samma seed och index ger samma fråga. */
export function questionSpec(run: RunState, node: PathNode, rngNext: () => number): QuestionSpec {
  if (node.type === 'stage') return node.spec;
  const boss = node as BossDef;
  const spec = boss.pool[Math.floor(rngNext() * boss.pool.length)];
  if (run.kind === 'practice') return spec;
  const phase2 = (run.hp ?? 0) <= (run.maxHp ?? 0) / 2;
  return { ...spec, level: phase2 ? Math.min(3, spec.level + 1) : spec.level, trap: run.index % 2 === 0 ? boss.trap : undefined };
}

export function currentQuestion(run: RunState, node: PathNode, game: GameModule): unknown {
  const rng = rngFrom(run.seed + run.index * 7919);
  return game.makeQuestion(questionSpec(run, node, rng.next), rng);
}

/** Registrerar första svaret på aktuell fråga. */
export function recordAnswer(hid: string, run: RunState, node: PathNode, a: Answer, skill: string, errTag?: string): RunState {
  if (run.results.length > run.index) return run; // redan registrerat (t.ex. efter omladdning)
  const next: RunState = { ...run, results: [...run.results, a] };
  const base = a.correct ? (run.kind === 'practice' ? XP.practiceCorrect : XP.correct) * (a.hint ? XP.hintFactor : 1) : 0;
  const g = giveXP(hid, run.areaId, base);
  next.xp += g.xp;
  next.levelUps += g.levelUps;
  if (run.kind === 'boss') {
    if (a.correct) next.hp = Math.max(0, (run.hp ?? 0) - 1);
    else next.hearts = Math.max(0, (run.hearts ?? 0) - 1);
  }
  logEvent(hid, { t: new Date().toISOString(), a: run.areaId, n: node.id, k: skill, c: a.correct, ms: a.ms, ...(errTag ? { e: errTag } : {}), ...(a.hint ? { h: true } : {}) });
  const p = getPlay(hid);
  savePlay(hid, { ...p, run: next, activeMs: p.activeMs + Math.min(a.ms, 60_000) });
  return next;
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
  gained: { pet?: string; mentor?: string; title?: string };
}

export function starsFor(correct: number, total: number, avgMs: number, usedHint: boolean, thrMs: number): number {
  if (total < RUN_LENGTH || correct < CLEAR_MIN) return 0;
  if (correct < RUN_LENGTH) return 1;
  return !usedHint && avgMs <= thrMs ? 3 : 2;
}

export function finishRun(hid: string, area: AreaDef, run: RunState): Outcome {
  const node = findNode(area, run.nodeId)!;
  const correct = run.results.filter((r) => r.correct).length;
  const total = run.results.length;
  const avgMs = total ? run.results.reduce((s, r) => s + r.ms, 0) / total : 0;
  const usedHint = run.results.some((r) => r.hint);
  const o: Outcome = { kind: run.kind, correct, total, avgMs, usedHint, cleared: false, firstClear: false, stars: 0, newStars: 0,
    bossWon: false, firstWin: false, xp: run.xp, kastanjer: 0, levelUps: run.levelUps, tired: isTired(hid), gained: {} };
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
  } else if (run.kind === 'practice') {
    reward(REWARD.practiceDone);
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
    } else if (o.bossWon) {
      // Mindre belöning, och bara en gång per dag och boss.
      if (bp.lastWinDay !== today()) reward(REWARD.bossRewin);
    } else reward(REWARD.bossLoss);
  }
  const p = getPlay(hid);
  savePlay(hid, { ...p, run: null });
  return o;
}

export type { StageDef, BossDef };
