import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { allNodes, type AreaDef } from '../src/platform/rpg/types';
import { distortion, lagat, sum } from '../src/engines/diagram/chart';
import { diagnoseAny, explainAny, isRight, joinVals, splitVals } from '../src/engines/diagram/check';
import type { DiagramGame } from '../src/engines/diagram/types';
import * as dal from '../src/games/diagram';
import * as content from '../src/games/diagram/content';
import type { DQ } from '../src/games/diagram/gen';
import { skillLabel } from '../src/content/skills';
import { specsOf } from './ordcheck';

// Diagramdalen, del två: Väderstationen, Omröstningstorget, Vågmästarens bod, Spegelsalen och Skvallerpressen.
// Samma kontroller som för de första områdena, plus laga och knepen.

/** Svaret står som eget tal i texten. */
const hasNumber = (text: string, n: string) => new RegExp(`(?<![\\d,.])${n.replace('.', '[.,]')}(?![\\d]|[,.]\\d)`).test(text);

/** Alla felkoder som en fråga kan ge (felsvar, fel alternativ och fel delar). */
const tagsOf = (q: DQ) => [...Object.values(q.cand ?? {}), ...(q.alts ?? []).flatMap((a) => (a.err ? [a.err] : [])), ...Object.values(q.misses ?? {})];

function checkArea(def: AreaDef, g: DiagramGame<DQ>, seeds = 60) {
  const tags = new Set<string>();
  for (const spec of specsOf(def)) {
    for (let seed = 0; seed < seeds; seed++) {
      const q = g.make(spec, rngFrom(seed * 7919 + spec.level), { seed, index: seed % 10 });
      const where = `${def.areaId} ${JSON.stringify(spec)} seed ${seed}`;
      expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
      expect(g.specsForSkill(q.skill).length, q.skill).toBeGreaterThan(0);
      expect(isRight(q, q.answer), where).toBe(true);
      expect(new Set(q.chart.kat).size, where).toBe(q.chart.kat.length);
      for (const s of q.chart.serier) for (const x of s.v) { expect(Number.isFinite(x), where).toBe(true); expect(x, where).toBeLessThanOrEqual(q.chart.axel.max); }
      if (q.chart.lur && q.chart.typ !== 'cirkel' && !q.chart.lur.utanEnhet) expect(distortion(q.chart), `knepet förvränger: ${where}`).toBeGreaterThanOrEqual(1.5);
      if (q.chart.typ === 'cirkel' && q.chart.lur?.ejHundra) expect(sum(q.chart.lur.ejHundra), where).toBeGreaterThan(100);

      const wrongs: string[] = [];
      if (q.kind === 'las') {
        expect(Number.isFinite(Number(q.answer)), where).toBe(true);
        expect(hasNumber(q.prompt, q.answer), `prompt: ${where}: ${q.prompt}`).toBe(false);
        expect(hasNumber(q.tips, q.answer), `ledtråd: ${where}`).toBe(false);
        expect(hasNumber(q.los, q.answer), `lösning: ${where}: ${q.los}`).toBe(true);
        for (const [given, tag] of Object.entries(q.cand ?? {})) {
          expect(isRight(q, given), where).toBe(false);
          expect(diagnoseAny(g, q, given), `${where}: ${given}`).toBe(tag);
          wrongs.push(given);
        }
      }
      if (q.kind === 'val' || q.kind === 'sant') {
        const alts = q.alts!;
        expect(alts.filter((a) => !a.err).map((a) => a.text), where).toEqual([q.answer]);
        expect(new Set(alts.map((a) => a.text)).size, where).toBe(alts.length);
        expect(alts.length, where).toBeGreaterThanOrEqual(3);
        for (const a of alts.filter((x) => x.err)) { expect(diagnoseAny(g, q, a.text), where).toBe(a.err); wrongs.push(a.text); }
      }
      if (q.kind === 'tryck') {
        const parts = [...q.chart.kat.map((_, i) => `k${i}`), ...(q.misses?.axel || q.answer === 'axel' ? ['axel'] : [])];
        expect(parts, where).toContain(q.answer);
        for (const p of parts.filter((x) => x !== q.answer && !q.targets?.includes(x))) { expect(q.misses?.[p], `${where}: ${p}`).toBeTruthy(); wrongs.push(p); }
      }
      if (q.kind === 'bygg') {
        const a = splitVals(q.answer), { min, max, steg } = q.chart.axel;
        for (const x of a) { expect(x, where).toBeGreaterThan(min); expect(x, where).toBeLessThanOrEqual(max); expect(x % steg, where).toBe(0); }
        expect(q.kalla, where).toBeTruthy();
        const off = joinVals(a.map((x, i) => (i === 0 ? x + steg : x)));
        expect(diagnoseAny(g, q, off), where).toBe('fel-hojd');
        wrongs.push(off, joinVals([a[1], a[0], ...a.slice(2)]));
      }
      if (q.kind === 'laga') {
        // Som det ritades är det fel; helt lagat är det rätt.
        const start = q.laga === 'axel' ? `a:${q.chart.lur!.axelStart}` : `b:${q.chart.lur!.bredd!.join(',')}`;
        expect(isRight(q, start), where).toBe(false);
        expect(isRight(q, q.laga === 'axel' ? 'a:0' : `b:${q.chart.kat.map(() => 1).join(',')}`), where).toBe(true);
        expect(distortion(lagat(q.chart, q.answer)), where).toBeLessThan(1.1);
        wrongs.push(start);
      }
      for (const given of wrongs) {
        const tag = diagnoseAny(g, q, given);
        tags.add(tag);
        expect(g.errLabels[tag] ?? (tag === 'annat' ? 'Annat fel' : undefined), `${where}: etikett för ${tag}`).toBeTruthy();
        const ex = explainAny(g, tag, q, given);
        const all = `${ex.title} ${ex.text}`;
        expect(all, where).not.toMatch(/undefined|NaN/);
        if (q.kind === 'las') expect(hasNumber(all, q.answer), `${where}: ${tag}: ${all}`).toBe(false);
        if (q.kind === 'val' || q.kind === 'sant') expect(all, `${where}: ${tag}`).not.toContain(q.answer);
      }
    }
  }
  return tags;
}

/** Varje monsters fälla finns bland felen i varje fråga som riktar in sig på den. */
function checkTraps(def: AreaDef, g: DiagramGame<DQ>) {
  for (const n of allNodes(def)) {
    if (n.type !== 'boss' || !n.trap) continue;
    for (const s of n.pool) for (const level of [s.level, s.level + 1]) for (let seed = 0; seed < 40; seed++) {
      const q = g.make({ ...s, level, trap: n.trap }, rngFrom(seed));
      expect(tagsOf(q), `${n.id} nivå ${level} seed ${seed}`).toContain(n.trap);
    }
  }
}

const AREAS: [string, AreaDef, DiagramGame<DQ>, string[]][] = [
  ['Väderstationen', content.VADERSTATIONEN, dal.vaderGame, ['fel-punkt', 'x-y-bytt', 'topp-inte-okning', 'okning-minskning', 'fel-serie', 'fel-diagramtyp', 'mellan-linjer', 'svarade-varde', 'fel-hojd']],
  ['Omröstningstorget', content.OMROSTNINGSTORGET, dal.rostGame, ['andel-antal', 'fel-andel', 'mest-minst', 'summa-skillnad']],
];

for (const [name, def, g, expected] of AREAS) {
  describe(name, () => {
    it('varje fråga har ett rätt svar, och inget fel avslöjar det', () => {
      const tags = checkArea(def, g);
      for (const t of expected) expect(tags, t).toContain(t);
    });
    it('monstrens fällor kan slå till', () => checkTraps(def, g));
    it('samma seed ger samma fråga', () => {
      for (const spec of specsOf(def)) expect(JSON.stringify(g.make(spec, rngFrom(42)))).toBe(JSON.stringify(g.make(spec, rngFrom(42))));
    });
  });
}
