import { expect } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { diagnoseAny, explainAny, hintFor, isRight, mentions } from '../src/engines/ord/check';
import type { OrdGame, OrdQ } from '../src/engines/ord/types';
import { skillLabel } from '../src/content/skills';
import { allNodes, type AreaDef, type QuestionSpec } from '../src/platform/rpg/types';

// Gemensamma kontroller för ordspel (Västerön): ett rätt svar, unika alternativ, och
// förklaringar och ledtrådar som aldrig avslöjar svaret.

/** Svaret står i texten: som eget ord (ett ord) eller som hel fras (flera ord). */
export const reveals = (text: string, answer: string) =>
  answer.includes(' ') ? text.toLocaleLowerCase('sv').includes(answer.toLocaleLowerCase('sv')) : mentions(text, answer);

/** Alla frågeinställningar området använder: banor och bossar (med och utan fälla, och fas 2). */
export function specsOf(def: AreaDef): QuestionSpec[] {
  const out: QuestionSpec[] = [];
  for (const n of allNodes(def)) {
    if (n.type === 'stage') out.push(n.spec);
    else for (const s of n.pool) out.push(s, { ...s, level: s.level + 1 }, ...(n.trap ? [{ ...s, trap: n.trap }, { ...s, level: s.level + 1, trap: n.trap }] : []));
  }
  return out;
}

export function checkQuestion<Q extends OrdQ>(g: OrdGame<Q>, q: Q, where: string) {
  expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
  expect(g.specsForSkill(q.skill).length, q.skill).toBeGreaterThan(0);
  expect(reveals(q.prompt, q.answer), `prompt: ${where}`).toBe(false);
  if (q.sentence) expect(reveals(q.sentence, q.answer), `mening: ${where}`).toBe(false);
  const h = hintFor(g, q);
  expect(reveals(h, q.answer) || h.includes('…'), `ledtråd: ${where}: ${h}`).toBe(false);
  expect(g.solution(q).toLocaleLowerCase('sv'), where).toContain(q.answer.toLocaleLowerCase('sv'));
  const explainOk = (tag: string, given: string) => {
    const ex = explainAny(g, tag, q, given);
    const all = `${ex.title} ${ex.text}`;
    expect(reveals(all, q.answer), `${where}: ${given} → ${tag}: ${ex.text}`).toBe(false);
    expect(all, `behövde maskas: ${where} ${tag}: ${ex.text}`).not.toContain('…');
    expect(all, where).not.toMatch(/undefined|""|"\?"/);
    expect(g.errLabels[tag] ?? ['bokstav-saknas', 'bokstav-extra', 'bytt-ordning', 'annat'].includes(tag), `${where}: etikett för ${tag}`).toBeTruthy();
  };
  if (q.kind === 'val' || q.kind === 'skriv') {
    if (q.kind === 'val' || q.alts) {
      const alts = q.alts!;
      expect(alts.filter((a) => !a.err).map((a) => a.text), where).toEqual([q.answer]);
      expect(new Set(alts.map((a) => a.text.toLocaleLowerCase('sv'))).size, where).toBe(alts.length);
      expect(new Set(alts.map((a) => (a.label ?? a.pic ?? a.text).toLocaleLowerCase('sv'))).size, `knapptexter: ${where}`).toBe(alts.length);
      expect(alts.length, where).toBeGreaterThanOrEqual(3);
      for (const a of alts.filter((x) => x.err)) {
        expect(isRight(q, a.text), `${where}: ${a.text}`).toBe(false);
        const tag = diagnoseAny(g, q, a.text);
        expect(tag, `${where}: ${a.text}`).toBe(a.err);
        explainOk(tag, a.text);
      }
    }
  }
  if (q.kind === 'markera') {
    for (let i = 0; i < q.tokens!.length; i++) if (!q.targets!.includes(i)) {
      const tag = q.misses?.[i] ?? q.missTag ?? 'annat';
      const ex = g.explainMiss?.(q, i, tag);
      if (ex) expect(reveals(`${ex.title} ${ex.text}`, q.answer), `${where}: miss ${i}`).toBe(false);
    }
  }
}

export function checkArea<Q extends OrdQ>(def: AreaDef, g: OrdGame<Q>, seeds = 60) {
  for (const spec of specsOf(def)) {
    for (let seed = 0; seed < seeds; seed++) {
      const q = g.make(spec, rngFrom(seed * 7919 + spec.level));
      checkQuestion(g, q, `${JSON.stringify(spec)} ${q.answer}`);
    }
  }
}

/** Bossens fälla: ett av alternativen är just det felet. */
export function checkTraps<Q extends OrdQ>(def: AreaDef, g: OrdGame<Q>, has: (q: Q, trap: string) => boolean = (q, t) => !!q.alts?.some((a) => a.err === t)) {
  for (const n of allNodes(def)) {
    if (n.type !== 'boss' || !n.trap) continue;
    for (const s of n.pool) for (const level of [s.level, s.level + 1]) for (let seed = 0; seed < 60; seed++) {
      const q = g.make({ ...s, level, trap: n.trap }, rngFrom(seed));
      expect(has(q, n.trap), `${n.id} ${q.answer}`).toBe(true);
    }
  }
}

/** Ingen fråga kommer tillbaka i samma runda, och samma index ger samma fråga. */
export function checkDecks<Q extends OrdQ>(def: AreaDef, g: OrdGame<Q>, key: (q: Q) => string) {
  for (const n of allNodes(def)) {
    if (n.type !== 'stage') continue;
    const qs = Array.from({ length: 10 }, (_, i) => g.make(n.spec, rngFrom(i), { seed: 99, index: i }));
    expect(new Set(qs.map(key)).size, n.id).toBe(10);
    const again = g.make(n.spec, rngFrom(3), { seed: 99, index: 3 });
    expect(key(again), n.id).toBe(key(qs[3]));
  }
}
