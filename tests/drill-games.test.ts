import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { diagnoseAny, explainAny, fmtNum, sameNumber } from '../src/engines/drill/check';
import type { DrillGame, DrillQ, Frac, Part } from '../src/engines/drill/types';
import { tiokompisGame } from '../src/games/tiokompis';
import { tabellerGame } from '../src/games/tabeller';
import { pengarGame } from '../src/games/pengar';
import { tallinjeGame } from '../src/games/tallinje';
import { brakGame } from '../src/games/brak';
import { formerGame } from '../src/games/geometri/former';
import { symmetriGame } from '../src/games/geometri/symmetri';
import { langdGame } from '../src/games/geometri/langd';
import { vinklarGame } from '../src/games/geometri/vinklar';
import { areaGame } from '../src/games/geometri/area';
import { kropparGame } from '../src/games/geometri/kroppar';
import { cirklarGame } from '../src/games/geometri/cirklar';
import { diagnose as diagP, makeQ as makeP, type PQ } from '../src/games/pengar/logic';
import { diagnose as diagL, makeQ as makeL, type LQ } from '../src/games/tallinje/logic';
import { diagnose as diagB, makeQ as makeB, type BQ } from '../src/games/brak/logic';
import { PLAYABLE } from '../src/content/areas';
import { skillLabel } from '../src/content/skills';
import { allNodes, type QuestionSpec } from '../src/platform/rpg/types';

// Samma kontroller för alla drillspel: varje fråga går att svara på, och förklaringar avslöjar inte svaret.

const GAMES: Record<string, DrillGame<DrillQ>> = {
  tiokompis: tiokompisGame as unknown as DrillGame<DrillQ>, tabeller: tabellerGame as unknown as DrillGame<DrillQ>,
  pengar: pengarGame as unknown as DrillGame<DrillQ>, tallinje: tallinjeGame as unknown as DrillGame<DrillQ>, brak: brakGame as unknown as DrillGame<DrillQ>,
  former: formerGame as unknown as DrillGame<DrillQ>, symmetri: symmetriGame as unknown as DrillGame<DrillQ>, langd: langdGame as unknown as DrillGame<DrillQ>,
  vinklar: vinklarGame as unknown as DrillGame<DrillQ>, area: areaGame as unknown as DrillGame<DrillQ>, kroppar: kropparGame as unknown as DrillGame<DrillQ>,
  cirklar: cirklarGame as unknown as DrillGame<DrillQ>,
};

const blanks = (parts: Part[]) => parts.reduce<number>((s, p) => s + (p === null ? 1 : typeof p === 'object' ? ((p as Frac).n === null ? 1 : 0) + ((p as Frac).d === null ? 1 : 0) : 0), 0);
const reveals = (n: number) => new RegExp(`(^|[\\s(])(=|är|blir)\\s+${fmtNum(n).replace(/[−,]/g, (c) => `\\${c}`)}(?![0-9,])`);

/** Alla frågeinställningar ett område använder: banor, bossar (med och utan fälla, och fas 2). */
function specsOf(areaId: string): QuestionSpec[] {
  const out: QuestionSpec[] = [];
  for (const n of allNodes(PLAYABLE[areaId].def)) {
    if (n.type === 'stage') out.push(n.spec);
    else for (const s of n.pool) out.push(s, { ...s, level: s.level + 1 }, ...(n.trap ? [{ ...s, trap: n.trap }] : []));
  }
  return out;
}

describe('alla drillspel', () => {
  for (const { def } of Object.values(PLAYABLE)) {
    const g = GAMES[def.gameId];
    if (!g) continue;
    it(`${def.title}: varje fråga har en ruta, ett rimligt svar, ett namn och förklaringar som inte avslöjar svaret`, () => {
      for (const spec of specsOf(def.areaId)) {
        for (let seed = 0; seed < 120; seed++) {
          const q = g.make(spec, rngFrom(seed * 104729 + spec.level));
          const where = `${def.areaId} ${JSON.stringify(spec)} seed ${seed}`;
          expect(Number.isFinite(q.answer), where).toBe(true);
          expect(blanks(q.parts), where).toBe(1);
          if (q.choices) expect(q.choices.some((c) => sameNumber(c.value, q.answer)), where).toBe(true);
          if (q.answer < 0) expect(q.keypad, where).toBe('signed');
          if (!Number.isInteger(q.answer)) expect(q.keypad, where).toBe('decimal');
          expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
          expect(g.specsForSkill(q.skill).length, q.skill).toBeGreaterThan(0);
          expect(g.hint(q).length).toBeGreaterThan(5);
          if (seed % 4) continue;
          const wrong = q.choices ? q.choices.map((c) => c.value) : [q.answer + 1, q.answer - 1, q.answer + 10, q.answer * 10, -q.answer, q.answer / 10, 0, 1];
          for (const given of wrong.filter((x) => !sameNumber(x, q.answer))) {
            const tag = diagnoseAny(g, q, given);
            const e = explainAny(g, tag, q, given);
            const visible = q.parts.some((p) => p === q.answer || (typeof p === 'object' && p && ((p as Frac).n === q.answer || (p as Frac).d === q.answer)));
            if (!visible && tag !== 'noll-ett') expect(`${e.title} ${e.text}`, `${where} ${tag} ${given}`).not.toMatch(reveals(q.answer));
          }
        }
      }
    });
  }
});

describe('Myntmarknaden', () => {
  const p = (patch: Partial<PQ>): PQ => ({ mode: 'rakna', level: 0, skill: 's', parts: [], answer: 0, ...patch } as PQ);
  it('känner igen typiska misstag', () => {
    const coins = p({ pieces: [10, 5, 2, 1], answer: 18 });
    expect(diagP(coins, 4)).toBe('raknade-antal');
    expect(diagP(coins, 13)).toBe('missat-mynt');
    expect(diagP(coins, 20)).toBe('raknat-dubbelt');
    const change = p({ mode: 'vaxel', paid: 50, answer: 13, wares: [{ icon: '', name: '', price: 37 }] });
    expect(diagP(change, 37)).toBe('priset');
    expect(diagP(change, 27)).toBe('lanade-inte');
    expect(diagP(change, 87)).toBe('fel-satt');
  });
  it('Myntskatans fälla: fler mynt än kronor skulle stämma', () => {
    for (let s = 0; s < 200; s++) {
      const q = makeP({ mode: 'pris', level: 1, trap: 'raknade-antal' }, rngFrom(s));
      expect(q.mode).toBe('rakna');
      expect(q.answer).not.toBe(q.pieces!.length);
    }
  });
  it('växeln är aldrig negativ, och summan ryms i det man betalar med', () => {
    for (let l = 0; l < 4; l++) for (let s = 0; s < 200; s++) {
      const q = makeP({ mode: 'vaxel', level: l }, rngFrom(s));
      expect(q.answer).toBeGreaterThan(0);
      expect(q.answer).toBeLessThan(q.paid!);
    }
  });
});

describe('Tallinjebron', () => {
  it('pilen hamnar aldrig på en siffra man kan läsa av', () => {
    for (let l = 0; l < 4; l++) for (let s = 0; s < 200; s++) {
      const q = makeL({ mode: 'las', level: l }, rngFrom(s));
      const { mark, label, min, max } = q.line!;
      expect(Math.abs(mark / label - Math.round(mark / label))).toBeGreaterThan(1e-6);
      expect(mark).toBeGreaterThan(min);
      expect(mark).toBeLessThan(max);
    }
  });
  it('avrundning: 5 uppåt, och typiska misstag', () => {
    const q = (value: number, to: number): LQ => ({ mode: 'avrunda', level: 0, skill: 's', parts: [], value, to, answer: Math.round(value / to + 1e-9) * to });
    expect(q(45, 10).answer).toBe(50);
    expect(diagL(q(45, 10), 40)).toBe('fem-regeln');
    expect(diagL(q(47, 10), 40)).toBe('avrundade-ner');
    expect(diagL(q(43, 10), 50)).toBe('avrundade-upp');
    expect(diagL(q(347, 100), 350)).toBe('fel-plats');
    for (let s = 0; s < 100; s++) {
      const t = makeL({ mode: 'avrunda', level: 1, trap: 'fem-regeln' }, rngFrom(s));
      expect((t.value! / t.to!) % 1).toBeCloseTo(0.5);
    }
  });
  it('negativa tal: tecken och riktning', () => {
    const q: LQ = { mode: 'negativa', level: 1, skill: 's', parts: [], a: 3, b: 5, op: '−', answer: -2 };
    expect(diagL(q, 2)).toBe('teckenfel');
    expect(diagL(q, 8)).toBe('fel-riktning');
    for (let s = 0; s < 200; s++) {
      const t = makeL({ mode: 'negativa', level: 2 }, rngFrom(s));
      expect(Math.sign(t.a!)).not.toBe(Math.sign(t.answer)); // går alltid förbi noll
    }
  });
  it('decimaltal: kommafel', () => {
    const q: LQ = { mode: 'decimal', level: 1, skill: 's', parts: [], a: 0.6, b: 0.7, op: '+', answer: 1.3, keypad: 'decimal' };
    expect(diagL(q, 13)).toBe('kommafel');
    expect(diagL(q, 0.13)).toBe('kommafel');
  });
});

describe('Bråkbageriet', () => {
  const b = (patch: Partial<BQ>): BQ => ({ mode: 'namnge', level: 0, skill: 's', parts: [], answer: 0, f: [], ...patch } as BQ);
  it('känner igen typiska misstag', () => {
    expect(diagB(b({ f: [{ n: 3, d: 8 }], blankIn: 'n', answer: 3 }), 5)).toBe('raknade-tomma');
    expect(diagB(b({ f: [{ n: 3, d: 8 }], blankIn: 'n', answer: 3 }), 8)).toBe('raknade-alla');
    expect(diagB(b({ mode: 'jamfor', f: [{ n: 1, d: 3 }, { n: 1, d: 5 }], answer: 2 }), 0)).toBe('storre-namnare');
    expect(diagB(b({ mode: 'addera', op: '+', blankIn: 'd', f: [{ n: 1, d: 4 }, { n: 1, d: 4 }, { n: 2, d: 4 }], answer: 4 }), 8)).toBe('adderade-namnare');
    expect(diagB(b({ mode: 'lika', blankIn: 'n', whole: 2, f: [{ n: 1, d: 2 }, { n: 2, d: 4 }], answer: 2 }), 3)).toBe('adderade');
    expect(diagB(b({ mode: 'delav', whole: 12, f: [{ n: 2, d: 3 }], answer: 8 }), 4)).toBe('glomde-taljaren');
  });
  it('Glufsgrisens fälla: samma täljare, olika nämnare', () => {
    for (let s = 0; s < 200; s++) {
      const q = makeB({ mode: 'addera', level: 0, trap: 'storre-namnare' }, rngFrom(s));
      expect(q.mode).toBe('jamfor');
      expect(q.f[0].n).toBe(q.f[1].n);
    }
  });
  it('del av ett antal går alltid jämnt ut', () => {
    for (let l = 0; l < 4; l++) for (let s = 0; s < 200; s++) expect(Number.isInteger(makeB({ mode: 'delav', level: l }, rngFrom(s)).answer)).toBe(true);
  });
});
