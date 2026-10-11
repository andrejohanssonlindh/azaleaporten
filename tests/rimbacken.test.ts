import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { diagnoseAny, explainAny, hintFor, mentions } from '../src/engines/ord/check';
import { rimGame } from '../src/games/rim';
import { items, makeQ, type RQ } from '../src/games/rim/logic';
import { BETYDELSER, ORDPAR, RIM, SAMMANSATTA, UTTRYCK, VERS } from '../src/games/rim/ord';
import { RIMBACKEN } from '../src/games/rim/content';
import { skillLabel } from '../src/content/skills';
import { allNodes, type QuestionSpec } from '../src/platform/rpg/types';

// Rimbäcken: innehållet håller ihop, varje fråga har exakt ett rätt svar, och förklaringarna avslöjar aldrig svaret.

/** Svaret står i texten: som eget ord (ett ord) eller som hel fras (flera ord). */
const reveals = (text: string, answer: string) =>
  answer.includes(' ') ? text.toLocaleLowerCase('sv').includes(answer.toLocaleLowerCase('sv')) : mentions(text, answer);

const rimmar = (a: string, rime: string) => a.endsWith(rime);

describe('Rimbäckens innehåll', () => {
  it('rimgrupperna rimmar, och inget ord rimmar med en annan grupp', () => {
    const all = RIM.flatMap(([, ws]) => ws);
    expect(new Set(all).size).toBe(all.length);
    for (const [rime, ws] of RIM) {
      expect(ws.length, rime).toBeGreaterThanOrEqual(3);
      for (const w of ws) expect(rimmar(w, rime), `${w} -${rime}`).toBe(true);
    }
    for (const [rime, ws] of RIM) for (const [other] of RIM) if (other !== rime) for (const w of ws) expect(rimmar(w, other), `${w} -${other}`).toBe(false);
  });

  it('verserna: luckan sist, svaret står inte i versen, och felen rimmar inte', () => {
    for (const [verse, answer, meaning, start] of VERS) {
      expect(verse.endsWith('___.'), verse).toBe(true);
      expect(verse.split('\n').length, verse).toBe(2);
      expect(mentions(verse, answer), verse).toBe(false);
      expect(new Set([answer, meaning, start]).size, verse).toBe(3);
      expect(start[0], `${answer} ${start}`).toBe(answer[0]);
    }
  });

  it('ordparen: synonym, motsats och närliggande ord är olika', () => {
    for (const [w, syn, ant, rel] of ORDPAR) expect(new Set([w, syn, ant, rel]).size, w).toBe(4);
    const words = ORDPAR.map((r) => r[0]);
    expect(new Set(words).size).toBe(words.length);
  });

  it('sammansatta ord: två delar, förklaringen nämner inte ordet, och bakfram-ordet är ett annat ord', () => {
    for (const [, raw, desc, flipDesc, flipWord] of SAMMANSATTA) {
      const [a, b] = raw.split('|');
      expect(b, raw).toBeTruthy();
      expect(mentions(desc, a + b), raw).toBe(false);
      expect(flipWord, raw).not.toBe(a + b);
      expect(desc, raw).not.toBe(flipDesc);
    }
  });

  it('betydelser och uttryck: rätt betydelse finns inte bland felen', () => {
    for (const [w, , meaning, others] of BETYDELSER) expect(others.includes(meaning), w).toBe(false);
    for (const [p, meaning, literal, other] of UTTRYCK) expect(new Set([meaning, literal, other]).size, p).toBe(3);
  });
});

/** Alla frågeinställningar området använder: banor och bossar (med och utan fälla, och fas 2). */
function specs(): QuestionSpec[] {
  const out: QuestionSpec[] = [];
  for (const n of allNodes(RIMBACKEN)) {
    if (n.type === 'stage') out.push(n.spec);
    else for (const s of n.pool) out.push(s, { ...s, level: s.level + 1 }, ...(n.trap ? [{ ...s, trap: n.trap }, { ...s, level: s.level + 1, trap: n.trap }] : []));
  }
  return out;
}

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => {
    for (const spec of specs()) {
      for (let seed = 0; seed < 80; seed++) {
        const q = makeQ(spec, rngFrom(seed * 7919 + spec.level));
        const where = `${JSON.stringify(spec)} ${q.topic} ${q.answer}`;
        expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
        expect(rimGame.specsForSkill(q.skill).length, q.skill).toBeGreaterThan(0);
        expect(q.kind).toBe('val');
        expect(q.alts!.filter((a) => !a.err).map((a) => a.text), where).toEqual([q.answer]);
        expect(q.alts!.length, where).toBe(3);
        expect(new Set(q.alts!.map((a) => a.text.toLocaleLowerCase('sv'))).size, where).toBe(3);
        if (q.sentence) expect(reveals(q.sentence, q.answer), where).toBe(false);
        expect(reveals(q.prompt, q.answer), where).toBe(false);
        const h = hintFor(rimGame, q);
        expect(reveals(h, q.answer) || h.includes('…'), `ledtråd: ${where}: ${h}`).toBe(false);
        expect(rimGame.solution(q).toLocaleLowerCase('sv')).toContain(q.answer.toLocaleLowerCase('sv'));
        for (const a of q.alts!.filter((x) => x.err)) {
          const tag = diagnoseAny(rimGame, q, a.text);
          expect(tag, where).toBe(a.err);
          const ex = explainAny(rimGame, tag, q, a.text);
          expect(reveals(`${ex.title} ${ex.text}`, q.answer), `${where}: ${a.text} → ${tag}: ${ex.text}`).toBe(false);
          expect(`${ex.title} ${ex.text}`, `behövde maskas: ${where} ${tag}`).not.toContain('…');
          expect(ex.text, where).not.toMatch(/undefined|""/);
        }
      }
    }
  });

  it('rimfrågor: rätt svar rimmar, felen gör det inte', () => {
    for (let seed = 0; seed < 300; seed++) {
      const q = makeQ({ mode: 'rim', level: 0 }, rngFrom(seed));
      const rime = RIM.find(([, ws]) => ws.includes(q.word))![0];
      for (const a of q.alts!) expect(rimmar(a.text, rime), `${q.word}: ${a.text}`).toBe(!a.err);
    }
  });

  it('bossens fälla: ett av de fel alternativen är just det felet', () => {
    for (const n of allNodes(RIMBACKEN)) {
      if (n.type !== 'boss' || !n.trap) continue;
      for (const s of n.pool) for (let seed = 0; seed < 80; seed++) {
        const q = makeQ({ ...s, trap: n.trap }, rngFrom(seed));
        expect(q.alts!.some((a) => a.err === n.trap), `${n.id} ${q.answer}`).toBe(true);
      }
    }
  });

  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(RIMBACKEN)) {
      if (n.type !== 'stage') continue;
      expect(items(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
      const qs = Array.from({ length: 10 }, (_, i) => makeQ(n.spec, rngFrom(i), { seed: 99, index: i }));
      expect(new Set(qs.map((q) => `${q.topic}/${q.row}`)).size, n.id).toBe(10);
      const again = makeQ(n.spec, rngFrom(3), { seed: 99, index: 3 });
      expect(`${again.topic}/${again.row}`).toBe(`${qs[3].topic}/${qs[3].row}`);
    }
  });

  it('nivå 0 använder bara de lättare orden', () => {
    for (let seed = 0; seed < 300; seed++) {
      const q: RQ = makeQ({ mode: 'blandat', level: 0 }, rngFrom(seed));
      if (q.topic === 'motsats' || q.topic === 'synonym') expect(ORDPAR[q.row][4]).toBe(1);
      if (q.topic === 'sammansatt') expect(SAMMANSATTA[q.row][5]).toBe(1);
      expect(['rim', 'motsats', 'synonym', 'sammansatt']).toContain(q.topic);
    }
  });
});
