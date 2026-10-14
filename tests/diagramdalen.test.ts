import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { allNodes, type AreaDef } from '../src/platform/rpg/types';
import { axisFor, axisPos, distortion, pictos, tally, ticks, type Chart } from '../src/engines/diagram/chart';
import { diagnoseAny, explainAny, isRight, joinVals, splitVals } from '../src/engines/diagram/check';
import type { DiagramGame } from '../src/engines/diagram/types';
import { fagelGame, skordGame } from '../src/games/diagram';
import { FAGELTORNET, SKORDEMARKNADEN } from '../src/games/diagram/content';
import type { DQ } from '../src/games/diagram/gen';
import { skillLabel } from '../src/content/skills';
import { specsOf } from './ordcheck';

const bar = (v: number[], extra: Partial<Chart> = {}): Chart => ({
  typ: 'stapel', titel: 'Test', enhet: 'st', katNamn: 'Sak', kat: v.map((_, i) => `K${i}`), serier: [{ namn: 'Test', v }], axel: axisFor(Math.max(...v), 10), ...extra,
});

describe('diagrammodellen', () => {
  it('axel, streck och bilder', () => {
    expect(axisFor(37, 10)).toEqual({ min: 0, max: 40, steg: 10 });
    expect(ticks(bar([10, 40]))).toEqual([0, 10, 20, 30, 40]);
    expect(axisPos(bar([10, 40]), 20)).toBe(0.5);
    expect(tally(13)).toEqual({ buntar: 2, rest: 3 });
    expect(pictos(25, 10)).toEqual({ hela: 2, halv: true });
    expect(pictos(30, 10)).toEqual({ hela: 3, halv: false });
  });

  it('distortion(): ärliga diagram förvränger inte, knepen gör det (minst 1,5 gånger)', () => {
    const honest = bar([40, 44, 48]);
    expect(distortion(honest)).toBeLessThan(1.1);
    // Axeln börjar på 38: 48 ser fem gånger så stor ut som 40.
    expect(distortion({ ...honest, lur: { axelStart: 38 } })).toBeGreaterThanOrEqual(1.5);
    expect(distortion(bar([10, 20], { lur: { bredd: [1, 2] } }))).toBeGreaterThanOrEqual(1.5);
    expect(distortion(bar([10, 20], { lur: { ytskala: true } }))).toBeGreaterThanOrEqual(1.5);
    expect(distortion(bar([10, 100], { lur: { ojamnSkala: [0, 10, 20, 50, 100] } }))).toBeGreaterThanOrEqual(1.5);
  });
});

/** Svaret står som eget tal i texten. */
const hasNumber = (text: string, n: string) => new RegExp(`(?<![\\d,.])${n.replace('.', '[.,]')}(?![\\d]|[,.]\\d)`).test(text);

/** Varje fråga i området: ett rätt svar, felsvaren känns igen, och förklaringar och ledtrådar avslöjar aldrig svaret. */
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
      const v = q.chart.serier[0].v;
      if (q.chart.typ === 'bild') for (const x of v) expect(x / q.chart.bild!.per, where).toBeLessThanOrEqual(8);
      else for (const x of v) expect(x, where).toBeLessThanOrEqual(q.chart.axel.max);

      const wrongs: string[] = [];
      if (q.kind === 'las') {
        expect(Number.isFinite(Number(q.answer)), where).toBe(true);
        expect(hasNumber(q.prompt, q.answer), `prompt: ${where}`).toBe(false);
        expect(hasNumber(q.tips, q.answer), `ledtråd: ${where}`).toBe(false);
        expect(hasNumber(q.los, q.answer), `lösning: ${where}`).toBe(true);
        for (const [given, tag] of Object.entries(q.cand ?? {})) {
          expect(isRight(q, given), where).toBe(false);
          expect(diagnoseAny(g, q, given), `${where}: ${given}`).toBe(tag);
          wrongs.push(given);
        }
        if (q.mode === 'jamfor' && !q.prompt.includes('sammanlagt')) expect(v.map(String), `skillnaden är ett av talen: ${where}`).not.toContain(q.answer);
      }
      if (q.kind === 'val' || q.kind === 'sant') {
        const alts = q.alts!;
        expect(alts.filter((a) => !a.err).map((a) => a.text), where).toEqual([q.answer]);
        expect(new Set(alts.map((a) => a.text)).size, where).toBe(alts.length);
        expect(alts.length, where).toBeGreaterThanOrEqual(3);
        for (const a of alts.filter((x) => x.err)) { expect(diagnoseAny(g, q, a.text), where).toBe(a.err); wrongs.push(a.text); }
      }
      if (q.kind === 'tryck') {
        const parts = q.chart.kat.map((_, i) => `k${i}`);
        expect(parts, where).toContain(q.answer);
        for (const p of parts.filter((x) => x !== q.answer)) { expect(q.misses?.[p], `${where}: ${p}`).toBeTruthy(); wrongs.push(p); }
      }
      if (q.kind === 'bygg') {
        const a = splitVals(q.answer), { min, max, steg } = q.chart.axel;
        for (const x of a) { expect(x, where).toBeGreaterThan(min); expect(x, where).toBeLessThanOrEqual(max); expect(x % steg, where).toBe(0); }
        expect(q.kalla || q.bild, where).toBeTruthy();
        if (q.bild) for (let i = 0; i < a.length; i++) expect(q.bild.filter((p) => p.ikon === q.chart.ikoner![i]).length, where).toBe(a[i]);
        const step = q.chart.typ === 'streck' ? 1 : steg;
        const off = joinVals(a.map((x, i) => (i === 0 ? x + step : x)));
        expect(diagnoseAny(g, q, off), where).toBe(q.chart.typ === 'streck' ? 'raknade-fel' : 'fel-hojd');
        const swapped = joinVals([a[1], a[0], ...a.slice(2)]);
        expect(diagnoseAny(g, q, swapped), where).toBe('fel-stapel');
        wrongs.push(off, swapped, joinVals(a.map(() => min)));
      }
      for (const given of wrongs) {
        const tag = diagnoseAny(g, q, given);
        tags.add(tag);
        expect(g.errLabels[tag] ?? (tag === 'annat' ? 'Annat fel' : undefined), `${where}: etikett för ${tag}`).toBeTruthy();
        const ex = explainAny(g, tag, q, given);
        const all = `${ex.title} ${ex.text}`;
        expect(all, where).not.toMatch(/undefined|NaN/);
        if (q.kind === 'las') expect(hasNumber(all, q.answer), `${where}: ${tag}: ${all}`).toBe(false);
        if (q.kind === 'val') expect(all, `${where}: ${tag}`).not.toContain(q.answer);
      }
    }
  }
  return tags;
}

describe('Fågeltornet', () => {
  it('varje fråga har ett rätt svar, och inget fel avslöjar det', () => {
    const tags = checkArea(FAGELTORNET, fagelGame);
    for (const t of ['femgrupp', 'fel-stapel', 'summa-skillnad', 'svarade-varde', 'missade-rad', 'mest-minst', 'jamforde-fel', 'raknade-fel']) expect(tags, t).toContain(t);
  });

  it('femgruppen: Strecktrollets svar (knippet som fyra) känns igen', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = fagelGame.make({ mode: 'streck', level: 1, trap: 'femgrupp' }, rngFrom(seed));
      const n = Number(q.answer), b = Math.floor(n / 5);
      expect(b, `seed ${seed}`).toBeGreaterThan(0);
      expect(diagnoseAny(fagelGame, q, String(n - b))).toBe('femgrupp');
    }
  });
});

describe('Skördemarknaden', () => {
  it('varje fråga har ett rätt svar, och inget fel avslöjar det', () => {
    const tags = checkArea(SKORDEMARKNADEN, skordGame);
    for (const t of ['rutor-inte-varde', 'mellan-linjer', 'nyckel-glomd', 'halv-bild', 'fel-stapel', 'summa-skillnad', 'mest-minst', 'fel-hojd']) expect(tags, t).toContain(t);
  });

  it('skalan: att räkna rutor känns igen, och mellan strecken ligger svaret mitt emellan', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = skordGame.make({ mode: 'stapel', level: 1 }, rngFrom(seed));
      expect(diagnoseAny(skordGame, q, String(Number(q.answer) / q.chart.axel.steg))).toBe('rutor-inte-varde');
      const m = skordGame.make({ mode: 'stapel', level: 2 }, rngFrom(seed));
      const s = m.chart.axel.steg, x = Number(m.answer);
      expect(x % s, `seed ${seed}`).toBe(s / 2);
      expect(diagnoseAny(skordGame, m, String(x - s / 2))).toBe('mellan-linjer');
    }
  });

  it('bildnyckeln: att räkna bilderna känns igen, och en halv bild är hälften', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = skordGame.make({ mode: 'bild', level: 1 }, rngFrom(seed));
      expect(diagnoseAny(skordGame, q, String(Number(q.answer) / q.chart.bild!.per))).toBe('nyckel-glomd');
      const h = skordGame.make({ mode: 'bild', level: 2 }, rngFrom(seed));
      const per = h.chart.bild!.per;
      expect(pictos(Number(h.answer), per).halv, `seed ${seed}`).toBe(true);
      expect(diagnoseAny(skordGame, h, String(Number(h.answer) - per / 2))).toBe('halv-bild');
    }
  });
});

describe('Diagramdalens bossar', () => {
  it('varje fälla kan slå till i varje fråga som riktar in sig på den', () => {
    for (const [def, g] of [[FAGELTORNET, fagelGame], [SKORDEMARKNADEN, skordGame]] as const) {
      for (const n of allNodes(def)) {
        if (n.type !== 'boss' || !n.trap) continue;
        for (const s of n.pool) for (const level of [s.level, s.level + 1]) for (let seed = 0; seed < 40; seed++) {
          const q = g.make({ ...s, level, trap: n.trap }, rngFrom(seed));
          expect(Object.values(q.cand ?? {}), `${n.id} nivå ${level} seed ${seed}`).toContain(n.trap);
        }
      }
    }
  });

  it('samma seed ger samma fråga', () => {
    for (const [def, g] of [[FAGELTORNET, fagelGame], [SKORDEMARKNADEN, skordGame]] as const) for (const spec of specsOf(def)) {
      expect(JSON.stringify(g.make(spec, rngFrom(42)))).toBe(JSON.stringify(g.make(spec, rngFrom(42))));
    }
  });
});
