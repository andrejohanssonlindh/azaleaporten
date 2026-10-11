import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { isRight } from '../src/engines/drill/check';
import { calc } from '../src/engines/drill/Tools';
import * as F from '../src/games/geometri/former/logic';
import * as S from '../src/games/geometri/symmetri/logic';
import * as L from '../src/games/geometri/langd/logic';
import * as V from '../src/games/geometri/vinklar/logic';
import * as A from '../src/games/geometri/area/logic';
import * as K from '../src/games/geometri/kroppar/logic';
import * as C from '../src/games/geometri/cirklar/logic';

const seeds = (n = 200) => Array.from({ length: n }, (_, i) => rngFrom(i * 7919 + 13));

describe('räknaren', () => {
  it('räknar med prioritet, π, kvadrat och parenteser', () => {
    expect(calc('3,14 × 5²')).toBeCloseTo(78.5);
    expect(calc('2π')).toBeCloseTo(2 * Math.PI);
    expect(calc('(2+3)×4')).toBe(20);
    expect(calc('2+3×4')).toBe(14);
    expect(calc('−3+5')).toBe(2);
    expect(calc('7÷2')).toBe(3.5);
  });
  it('säger ifrån när det inte går', () => {
    expect(calc('5÷0')).toBeNull();
    expect(calc('1,2,3')).toBeNull();
    expect(calc('(2+3')).toBeNull();
    expect(calc('×')).toBeNull();
    expect(calc('')).toBeNull();
  });
});

describe('Fluffy: former', () => {
  it('Snurrsnigelns fälla: det finns alltid sneda former att missa', () => {
    for (const r of seeds()) {
      const q = F.makeQ({ mode: 'sortera', level: 1, trap: 'vriden-form' }, r);
      const typical = q.shapes.filter((s) => s.kind === q.ask && !s.odd).length;
      expect(typical).toBeLessThan(q.answer);
      expect(F.diagnose(q, typical)).toBe('vriden-form');
      const ar = F.makeQ({ mode: 'ar', level: 2, trap: 'vriden-form' }, r);
      expect(ar.answer).toBe(1);
      expect(F.diagnose(ar, 0)).toBe('vriden-form');
    }
  });
  it('räknar hörn rätt, även inåtpekande', () => {
    for (const r of seeds()) {
      const q = F.makeQ({ mode: 'horn', level: 2 }, r);
      expect(q.answer).toBe(q.shapes[0].pts!.length);
      if (q.shapes[0].inward) expect(F.diagnose(q, q.answer - q.shapes[0].inward)).toBe('missade-inat');
      const g = F.makeQ({ mode: 'horn', level: 1, trap: 'raknade-start-igen' }, r);
      expect(g.answer).toBeGreaterThanOrEqual(3);
      expect(F.diagnose(g, g.answer + 1)).toBe('raknade-start-igen');
    }
  });
  it('namn: rätt svar finns bland alternativen och fyrhörningar blandas ihop', () => {
    for (const r of seeds()) {
      const q = F.makeQ({ mode: 'namn', level: 2 }, r);
      expect(q.choices!.some((c) => c.value === q.answer)).toBe(true);
      const other = q.choices!.find((c) => c.value !== q.answer)!;
      expect(F.diagnose(q, other.value)).toBe('fyrhorningar');
    }
  });
});

describe('Svampen: symmetri och mönster', () => {
  it('spegla: tre olika alternativ – spegelbild, kopia och fel håll', () => {
    for (const r of seeds()) {
      const q = S.makeQ({ mode: 'spegla', level: 2 }, r);
      expect(new Set(q.opts!.map((o) => JSON.stringify(o))).size).toBe(3);
      expect(q.opts![q.answer]).toEqual(S.mirror(q.grid!, q.axis!));
      expect(S.diagnose(q, q.kinds!.indexOf('kopia'))).toBe('flyttade');
      expect(S.diagnose(q, q.kinds!.indexOf('fel-axel'))).toBe('fel-axel');
    }
  });
  it('symmetrilinjer: Flamingons fälla ger rektanglar och parallellogrammer', () => {
    for (const r of seeds(50)) {
      const q = S.makeQ({ mode: 'linjer', level: 1, trap: 'diagonal' }, r);
      expect(['rektangel', 'parallellogram']).toContain(q.shape!.name);
      expect(S.diagnose(q, q.shape!.name === 'rektangel' ? 4 : 2)).toBe('diagonal');
    }
    expect(S.SHAPES.kvadrat.axes).toHaveLength(4);
    expect(S.SHAPES.sexhorning.axes).toHaveLength(6);
    expect(S.SHAPES.parallellogram.axes).toHaveLength(0);
  });
  it('växande mönster: typiska misstag', () => {
    const q: S.SQ = { mode: 'vaxa', level: 2, skill: 's', parts: [], start: 2, step: 3, fig: 10, answer: 32 };
    expect(S.diagnose(q, 30)).toBe('glomde-start');
    expect(S.diagnose(q, 50)).toBe('gangrade-forsta');
    expect(S.diagnose(q, 14)).toBe('bara-nasta');
  });
  it('koordinater: spegelbilden ligger inom rutnätet', () => {
    for (const r of seeds()) {
      const q = S.makeQ({ mode: 'koordinat', level: 3 }, r);
      const max = q.line!.dir === 'x' ? 10 : 8;
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(max);
      expect(S.diagnose(q, q.line!.m)).toBe('stannade-vid-linjen');
    }
  });
  it('upprepade mönster: svaret följer enheten', () => {
    for (const r of seeds()) {
      const q = S.makeQ({ mode: 'upprepa', level: 2 }, r);
      expect(q.answer).toBe(q.unit![(q.pos! - 1) % q.unit!.length]);
    }
  });
});

describe('Oxie: längd och omkrets', () => {
  it('Mätmaskens fälla: föremålet börjar aldrig på noll', () => {
    for (const r of seeds()) {
      const q = L.makeQ({ mode: 'linjal', level: 1, trap: 'lasta-slutet' }, r);
      expect(q.s).toBeGreaterThan(0);
      expect(q.e!).toBeLessThanOrEqual(15);
      expect(L.diagnose(q, q.e!)).toBe('lasta-slutet');
    }
  });
  it('Kantkrabbans fälla: bara två sidor har mått', () => {
    for (const r of seeds()) {
      const q = L.makeQ({ mode: 'omkrets', level: 2, trap: 'bara-tva-sidor' }, r);
      expect(q.shape).toBe('rektangel');
      expect(L.diagnose(q, q.sides![0] + q.sides![1])).toBe('bara-tva-sidor');
    }
  });
  it('enheter och omkrets räknas rätt', () => {
    for (const r of seeds()) {
      const q = L.makeQ({ mode: 'enheter', level: 3 }, r);
      const mm: Record<string, number> = { mm: 1, cm: 10, dm: 100, m: 1000, km: 1000000 };
      expect(q.answer).toBeCloseTo((q.v! * mm[q.from!]) / mm[q.to!]);
      const o = L.makeQ({ mode: 'omkrets', level: 3 }, r);
      expect(o.answer).toBe(o.sides!.reduce((s, x) => s + x, 0));
    }
    const e: L.LQ = { mode: 'enheter', level: 1, skill: 's', parts: [], v: 3, from: 'm', to: 'cm', answer: 300 };
    expect(L.diagnose(e, 30)).toBe('fel-antal-nollor');
    expect(L.diagnose(e, 0.03)).toBe('fel-hall');
  });
  it('sidan som fattas: typiska misstag', () => {
    const q: L.LQ = { mode: 'saknad', level: 1, skill: 's', parts: [], shape: 'rektangel', sides: [9, 4, 9, 4], per: 26, answer: 4 };
    expect(L.diagnose(q, 8)).toBe('glomde-halvera');
    expect(L.diagnose(q, 17)).toBe('glomde-en-sida');
  });
});

describe('Sibbarp: vinklar', () => {
  it('Sälens fälla: fel skala på gradskivan', () => {
    for (const r of seeds()) {
      const q = V.makeQ({ mode: 'gradskiva', level: 2, trap: 'fel-skala' }, r);
      expect(q.answer).not.toBe(90);
      expect(V.diagnose(q, 180 - q.answer)).toBe('fel-skala');
    }
  });
  it('Bläckfiskens fälla: den mindre vinkeln har de längre benen', () => {
    for (const r of seeds()) {
      const q = V.makeQ({ mode: 'jamfor', level: 1, trap: 'langa-ben' }, r);
      const [a, b] = q.pair!;
      const longer = a.arm > b.arm ? 0 : 1;
      expect(longer).not.toBe(q.answer);
      expect(V.diagnose(q, longer)).toBe('langa-ben');
    }
  });
  it('vinkelsummor stämmer, och fyrhörningens hörn passar ihop', () => {
    const SUM = { linje: 180, rat: 90, triangel: 180, likbent: 180, runt: 360, fyrhorning: 360 };
    for (let level = 0; level < 4; level++) for (const r of seeds(100)) {
      const q = V.makeQ({ mode: 'summa', level }, r);
      const known = q.angles!.filter((x): x is number => x !== null);
      const total = q.kind === 'likbent' ? known[0] + 2 * q.answer : known.reduce((s, x) => s + x, 0) + q.answer;
      expect(total).toBe(SUM[q.kind!]);
      expect(q.answer).toBeGreaterThan(0);
    }
  });
  it('varv: typiska misstag', () => {
    const q: V.VQ = { mode: 'varv', level: 0, skill: 's', parts: [], turns: 0.5, answer: 180 };
    expect(V.diagnose(q, 50)).toBe('hundra');
    expect(V.diagnose(q, 360)).toBe('blandar-varv');
  });
});

describe('Bryggeriet: area', () => {
  it('Kantkrypets fälla: omkretsen i stället för arean', () => {
    for (const r of seeds()) {
      const q = A.makeQ({ mode: 'rektangel', level: 1, trap: 'raknade-omkrets' }, r);
      const p = 2 * q.a! + 2 * q.b!;
      if (p !== q.answer) expect(A.diagnose(q, p)).toBe('raknade-omkrets');
    }
  });
  it('Dubbeldrakens fälla: glömmer att dela med två', () => {
    for (const r of seeds()) {
      const q = A.makeQ({ mode: 'triangel', level: 1, trap: 'glomde-halvera' }, r);
      expect(q.answer).toBe((q.b! * q.h!) / 2);
      expect(A.diagnose(q, q.b! * q.h!)).toBe('glomde-halvera');
    }
  });
  it('rutor och L-former räknas rätt', () => {
    for (const r of seeds()) {
      const q = A.makeQ({ mode: 'rutor', level: 2 }, r);
      const cells = q.cells!.flat();
      expect(q.answer).toBe(cells.filter((c) => c === 1).length + cells.filter((c) => c > 1).length / 2);
      const s = A.makeQ({ mode: 'sammansatt', level: 3 }, r);
      const { W, H, w1, h1 } = s.L!;
      expect(s.answer).toBe(W * H - (W - w1) * (H - h1));
      expect(A.diagnose(s, W * H)).toBe('hela-rektangeln');
    }
  });
});

describe('Kroksbäck: kroppar och volym', () => {
  it('Ugglans fälla: räknar bara det som syns', () => {
    for (const r of seeds(50)) {
      const q = K.makeQ({ mode: 'delar', level: 0, trap: 'bara-synliga' }, r);
      expect(K.diagnose(q, K.PARTS[q.solid!].seen[q.part!])).toBe('bara-synliga');
      const k = K.makeQ({ mode: 'kuber', level: 1, trap: 'bara-synliga' }, r);
      expect(K.diagnose(k, K.seenCubes(k.dims!))).toBe('bara-synliga');
    }
  });
  it('Plusormens fälla: lägger ihop måtten', () => {
    for (const r of seeds()) {
      const q = K.makeQ({ mode: 'volym', level: 1, trap: 'adderade' }, r);
      const [l, b, h] = q.dims!;
      expect(q.answer).toBe(l * b * h);
      expect(K.diagnose(q, l + b + h)).toBe('adderade');
    }
  });
  it('platta formers namn och liter', () => {
    for (const r of seeds(50)) {
      const q = K.makeQ({ mode: 'namn', level: 1 }, r);
      const flat = q.choices!.find((c) => c.value >= 100)!;
      expect(K.diagnose(q, flat.value)).toBe('2d-namn');
    }
    const a = K.makeQ({ mode: 'volym', level: 3 }, rngFrom(5));
    expect(a.answer).toBeCloseTo((a.dims![0] * a.dims![1] * a.dims![2]) / 1000);
  });
});

describe('Stapelbäddsparken: cirklar och skala', () => {
  it('både π ≈ 3,14 och räknarens π godtas – men inte ett fel på en hel', () => {
    for (let level = 0; level < 4; level++) for (const r of seeds(100)) {
      for (const mode of ['omkrets', 'area']) {
        const q = C.makeQ({ mode, level }, r);
        expect(q.tol!).toBeLessThan(0.5);
        expect(q.tools).toBe('raknare');
        expect(isRight(q, q.answer + 1)).toBe(false);
        expect(isRight(q, q.answer - 1)).toBe(false);
      }
    }
    const q = C.makeQ({ mode: 'area', level: 0 }, rngFrom(3));
    const r = q.r!;
    expect(isRight(q, Math.round(Math.PI * r * r * 10) / 10)).toBe(true);
    expect(isRight(q, Math.round(3.14 * r * r * 10) / 10)).toBe(true);
  });
  it('typiska misstag med radie, diameter och π', () => {
    const o = C.makeQ({ mode: 'omkrets', level: 1 }, rngFrom(9));
    expect(C.diagnose(o, Math.round(3.14 * o.r! * 10) / 10)).toBe('radie-som-diameter');
    expect(C.diagnose(o, o.r!)).toBe('glomde-pi');
    const a = C.makeQ({ mode: 'area', level: 1 }, rngFrom(9));
    expect(C.diagnose(a, Math.round(3.14 * 4 * a.r! * a.r! * 10) / 10)).toBe('diameter-som-radie');
    for (const r of seeds(50)) {
      const q = C.makeQ({ mode: 'radie', level: 0, trap: 'radie-diameter' }, r);
      expect(C.diagnose(q, q.ask === 'r' ? 2 * q.r! : q.r!)).toBe('radie-diameter');
    }
  });
  it('skala åt fel håll', () => {
    for (let level = 0; level < 4; level++) for (const r of seeds(100)) {
      const q = C.makeQ({ mode: 'skala', level }, r);
      expect(q.answer).toBeGreaterThan(0);
      const { a, b } = q.scale!;
      const k = Math.max(a, b);
      const wrong = a > b ? (q.toReal ? q.v! * k : q.v! / k) : q.toReal ? (q.unit === 'm' ? q.v! / k / 100 : q.v! / k) : q.v! * 100 * k;
      if (Math.abs(wrong - q.answer) > 1e-6) expect(C.diagnose(q, wrong)).toBe('fel-hall');
    }
  });
});
