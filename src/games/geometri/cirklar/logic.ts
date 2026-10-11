import type { Rng } from '../../../platform/rng';
import type { QuestionSpec } from '../../../platform/rpg/types';
import type { DrillQ, Explained, Note } from '../../../engines/drill/types';
import { near, range, round1, sv } from '../draw';

// Stapelbäddsparken: finalparken. Cirklar (radie, diameter, omkrets, area – med räknare och formelkort)
// och skala. Man räknar med π ≈ 3,14 och avrundar till en decimal; räknarens π godtas också.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'radie' | 'omkrets' | 'area' | 'skala';

export interface CQ extends DrillQ {
  mode: Mode;
  /** Det givna måttet: radien eller diametern. */
  r?: number;
  given?: 'r' | 'd';
  /** radie: vad som efterfrågas. omkrets: varv = hur många varv hjulet rullar; reverse = omkretsen är given. */
  ask?: 'r' | 'd';
  turns?: number;
  reverse?: boolean;
  /** area: hel, halv eller kvarts cirkel. */
  part?: 1 | 2 | 4;
  /** skala: 1:k (förminskning) eller k:1 (förstoring), måttet och enheterna. */
  scale?: { a: number; b: number };
  v?: number;
  vUnit?: string;
  toReal?: boolean;
  unit?: string;
}

export const PI = 3.14;

export const ERR: Record<string, string> = {
  'radie-diameter': 'Blandar ihop radie och diameter',
  'radie-som-diameter': 'Räknar med radien i stället för diametern',
  'diameter-som-radie': 'Räknar med diametern i stället för radien',
  'area-formel': 'Använder areaformeln för omkretsen',
  'omkrets-formel': 'Använder omkretsformeln för arean',
  'glomde-pi': 'Glömmer π',
  'hela-cirkeln': 'Räknar hela cirkeln fast det är en del',
  gangrade: 'Gångrar med π i stället för att dela',
  'fel-hall': 'Gångrar med skalan när det ska delas (eller tvärtom)',
  'fel-enhet': 'Glömmer att byta enhet',
};

const SKILL = {
  radie: 'ma.geo.radie-diameter', omkrets: 'ma.geo.cirkel-omkrets', area: 'ma.geo.cirkel-area', delar: 'ma.geo.cirkel-delar',
  skala: 'ma.geo.skala', forstoring: 'ma.geo.skala-forstoring',
};

/** Svar räknat med π ≈ 3,14 (avrundat), och hur mycket svaret får avvika (räknarens π, avrundning). */
function piAnswer(f: (pi: number) => number): { answer: number; tol: number } {
  const approx = f(PI), exact = f(Math.PI);
  return { answer: round1(approx), tol: Math.abs(exact - approx) + 0.1 };
}
const roundNote = 'Räkna med π ≈ 3,14 och avrunda till en decimal.';

function radie(level: number, rng: Rng, trap: boolean): CQ {
  const ask: 'r' | 'd' = rng.next() < 0.5 ? 'r' : 'd';
  const r = level === 0 && !trap ? range(rng, 2, 12) : range(rng, 2, 25) + (rng.next() < 0.5 ? 0.5 : 0);
  const known = ask === 'r' ? 2 * r : r;
  const answer = ask === 'r' ? r : 2 * r;
  return { mode: 'radie', level, skill: SKILL.radie, r, given: ask === 'r' ? 'd' : 'r', ask, answer, keypad: Number.isInteger(answer) ? undefined : 'decimal',
    prompt: ask === 'r' ? `Diametern är ${sv(known)} cm. Hur lång är radien?` : `Radien är ${sv(known)} cm. Hur lång är diametern?`, parts: [ask, '=', null, 'cm'] };
}

function omkrets(level: number, rng: Rng): CQ {
  const base = { mode: 'omkrets' as const, level, skill: SKILL.omkrets, tools: 'raknare' as const, keypad: 'decimal' as const };
  if (level === 3) {
    const d = range(rng, 3, 20);
    const O = round1(PI * d);
    const { answer, tol } = piAnswer((pi) => O / pi);
    return { ...base, r: d / 2, reverse: true, unit: 'cm', answer: round1(answer), tol,
      prompt: `En cirkel har omkretsen ${sv(O)} cm. Hur lång är diametern? ${roundNote}`, parts: ['d', '≈', null, 'cm'] };
  }
  if (level === 2) {
    const d = rng.pick([5, 5.4, 6, 5.6, 7]), turns = rng.pick([10, 20]);
    const { answer, tol } = piAnswer((pi) => pi * d * turns);
    return { ...base, r: d / 2, given: 'd', turns, unit: 'cm', answer, tol,
      prompt: `Skejthjulet har diametern ${sv(d)} cm. Hur långt rullar brädan när hjulet snurrar ${turns} varv? ${roundNote}`, parts: [null, 'cm'] };
  }
  const given: 'r' | 'd' = level === 0 ? 'd' : 'r';
  const r = level === 0 ? range(rng, 1, 10) : range(rng, 2, 12);
  const known = given === 'd' ? 2 * r : r;
  const { answer, tol } = piAnswer((pi) => pi * 2 * r);
  return { ...base, r, given, unit: 'cm', answer, tol,
    prompt: `${given === 'd' ? 'Diametern' : 'Radien'} är ${known} cm. Hur lång är omkretsen? ${roundNote}`, parts: ['O', '≈', null, 'cm'] };
}

function area(level: number, rng: Rng): CQ {
  const part: 1 | 2 | 4 = level >= 2 ? rng.pick([2, 4, 1] as const) : 1;
  const given: 'r' | 'd' = level === 1 || (level === 3 && rng.next() < 0.5) ? 'd' : 'r';
  const r = range(rng, 2, 10);
  const known = given === 'd' ? 2 * r : r;
  const { answer, tol } = piAnswer((pi) => (pi * r * r) / part);
  const what = part === 1 ? 'cirkeln' : part === 2 ? 'halvcirkeln (bowlen sedd uppifrån)' : 'kvartscirkeln (quarterpipen sedd från sidan)';
  return { mode: 'area', level, skill: part === 1 ? SKILL.area : SKILL.delar, r, given, part, unit: 'cm', answer, tol, tools: 'raknare', keypad: 'decimal',
    prompt: `${given === 'd' ? 'Diametern' : 'Radien'} är ${known} cm. Hur stor är arean av ${what}? ${roundNote}`, parts: ['A', '≈', null, 'cm²'] };
}

function skala(level: number, rng: Rng): CQ {
  const base = { mode: 'skala' as const, level, tools: 'kladd' as const };
  if (level === 3 && rng.next() < 0.6) {
    // Förstoring: en liten skruv i kullagret, ritad större.
    const k = rng.pick([2, 5, 10]);
    const real = range(rng, 2, 9);
    const toReal = rng.next() < 0.5;
    return { ...base, skill: SKILL.forstoring, scale: { a: k, b: 1 }, v: toReal ? real * k : real, vUnit: 'mm', toReal, unit: 'mm', answer: toReal ? real : real * k,
      prompt: toReal ? `Skruven är ritad i skala ${k}:1. På bilden är den ${real * k} mm. Hur lång är den i verkligheten?` : `Skruven är ${real} mm. Hur lång blir den på en bild i skala ${k}:1?`,
      parts: [null, 'mm'] };
  }
  const k = level === 0 ? 100 : rng.pick([50, 100, 200, 1000]);
  if (level <= 1 || rng.next() < 0.5) {
    const cm = range(rng, 2, 12);
    const realCm = cm * k;
    const toM = realCm % 100 === 0;
    return { ...base, skill: SKILL.skala, scale: { a: 1, b: k }, v: cm, vUnit: 'cm', toReal: true, unit: toM ? 'm' : 'cm', answer: toM ? realCm / 100 : realCm,
      prompt: `Ritningen över parken är i skala 1:${k}. Rampen är ${cm} cm på ritningen. Hur lång är den i verkligheten?`, parts: [null, toM ? 'm' : 'cm'] };
  }
  const cm = range(rng, 2, 12);
  const m = (cm * k) / 100;
  return { ...base, skill: SKILL.skala, scale: { a: 1, b: k }, v: m, vUnit: 'm', toReal: false, unit: 'cm', answer: cm,
    prompt: `Räcket är ${sv(m)} m långt. Hur långt blir det på en ritning i skala 1:${k}?`, parts: [null, 'cm'] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): CQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'radie-diameter') mode = 'radie';
  if (spec.trap === 'glomde-pi' && mode !== 'area') mode = 'omkrets';
  if (mode === 'blandat') mode = rng.pick(['radie', 'omkrets', 'area', 'skala'] as const);
  switch (mode) {
    case 'radie': return radie(level, rng, !!spec.trap);
    case 'omkrets': return omkrets(spec.trap ? Math.min(1, level) : level, rng);
    case 'area': return area(spec.trap ? Math.min(1, level) : level, rng);
    case 'skala': return skala(level, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.radie: return [{ mode: 'radie', level: 0 }, { mode: 'radie', level: 1 }];
    case SKILL.omkrets: return [{ mode: 'omkrets', level: 0 }, { mode: 'omkrets', level: 1 }];
    case SKILL.area: return [{ mode: 'area', level: 0 }, { mode: 'area', level: 1 }];
    case SKILL.delar: return [{ mode: 'area', level: 2 }];
    case SKILL.skala: return [{ mode: 'skala', level: 1 }, { mode: 'skala', level: 2 }];
    case SKILL.forstoring: return [{ mode: 'skala', level: 3 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

export function diagnose(q: CQ, given: number): string | undefined {
  const tol = q.tol ?? 1e-9;
  const is = (v: number) => near(given, round1(v), tol) && !near(given, q.answer, tol);
  const r = q.r!, d = 2 * r;
  switch (q.mode) {
    case 'radie':
      if (q.ask === 'r' && (near(given, d) || near(given, 2 * d))) return 'radie-diameter';
      if (q.ask === 'd' && (near(given, r) || near(given, r / 2))) return 'radie-diameter';
      return undefined;
    case 'omkrets': {
      if (q.reverse) {
        const O = round1(PI * d);
        if (is(O * PI)) return 'gangrade';
        if (is(O / PI / 2)) return 'radie-diameter';
        return undefined;
      }
      const t = q.turns ?? 1;
      if (q.given === 'r' && is(PI * r * t)) return 'radie-som-diameter';
      if (is(PI * r * r * t)) return 'area-formel';
      if (near(given, d * t) || (q.given === 'r' && near(given, r * t))) return 'glomde-pi';
      if (q.turns && is(PI * d)) return 'hela-cirkeln';
      return undefined;
    }
    case 'area': {
      const p = q.part!;
      if (p > 1 && is(PI * r * r)) return 'hela-cirkeln';
      if (is((PI * d * d) / p)) return 'diameter-som-radie';
      if (is((PI * d) / p)) return 'omkrets-formel';
      if (near(given, (r * r) / p) || near(given, (d * d) / p)) return 'glomde-pi';
      return undefined;
    }
    case 'skala': {
      const { a, b } = q.scale!;
      const k = Math.max(a, b), v = q.v!;
      // Åt fel håll: gånger i stället för delat (eller tvärtom), i svarets enhet.
      const wrong = a > b ? (q.toReal ? v * k : v / k) : q.toReal ? (q.unit === 'm' ? v / k / 100 : v / k) : (v * 100 * k);
      if (near(given, wrong, 1e-6)) return 'fel-hall';
      if ([100, 0.01, 10, 0.1].some((x) => near(given, q.answer * x, 1e-6))) return 'fel-enhet';
      return undefined;
    }
  }
}

export function explain(tag: string, q: CQ, _given: number): Explained {
  switch (tag) {
    case 'radie-diameter': return { title: 'Radie eller diameter?', text: 'Radien går från mitten ut till kanten. Diametern går tvärs över hela cirkeln, genom mitten – den är dubbelt så lång som radien.' };
    case 'radie-som-diameter': return { title: 'Diametern, inte radien', text: 'Omkretsen är π gånger diametern. Du fick radien – hur lång är då diametern?' };
    case 'diameter-som-radie': return { title: 'Radien, inte diametern', text: 'Arean räknas med radien: π · r · r. Du fick diametern – radien är hälften så lång.' };
    case 'area-formel': return { title: 'Det där är arean', text: 'π · r · r ger arean, ytan inuti. Omkretsen är sträckan runt: π gånger diametern.' };
    case 'omkrets-formel': return { title: 'Det där är omkretsen', text: 'π · d ger omkretsen, sträckan runt. Arean är ytan inuti: π · r · r.' };
    case 'glomde-pi': return { title: 'Glöm inte π', text: 'Omkretsen är drygt tre gånger diametern – det är det π betyder. Gånger π!' };
    case 'hela-cirkeln': return q.mode === 'area'
      ? { title: 'Bara en del', text: `Det är bara ${q.part === 2 ? 'halva' : 'en fjärdedel av'} cirkeln. Räkna hela cirkelns area och dela sedan.` }
      : { title: 'Alla varven', text: 'Du räknade ut ett varv. Hjulet snurrar fler varv än så!' };
    case 'gangrade': return { title: 'Delat, inte gånger', text: 'Omkretsen är π gånger diametern. Då får man diametern genom att dela omkretsen med π.' };
    case 'fel-hall': {
      const { a, b } = q.scale!;
      return { title: 'Större eller mindre?', text: a > b ? `I skala ${a}:1 förstoras allt ${a} gånger på bilden. Ska det bli större eller mindre?` : `I skala 1:${b} förminskas allt ${b} gånger på ritningen. Ska det bli större eller mindre?` };
    }
    case 'fel-enhet': return { title: 'Vilken enhet?', text: `Titta på enheten i svaret: ${q.unit}. En meter är hundra centimeter.` };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: CQ): string {
  const r = q.r!, d = 2 * r, a = sv(q.answer);
  switch (q.mode) {
    case 'radie': return q.ask === 'r' ? `Radien är halva diametern: ${sv(d)} / 2 = ${a} cm.` : `Diametern är två radier: 2 · ${sv(r)} = ${a} cm.`;
    case 'omkrets':
      if (q.reverse) return `d = O / π ≈ ${sv(round1(PI * d))} / 3,14 ≈ ${a} cm.`;
      if (q.turns) return `Ett varv: π · ${sv(d)} ≈ ${sv(round1(PI * d))} cm. ${q.turns} varv: ≈ ${a} cm.`;
      return `O = π · d ≈ 3,14 · ${sv(d)} ≈ ${a} cm.`;
    case 'area': return `A = π · r · r ≈ 3,14 · ${sv(r)} · ${sv(r)}${q.part! > 1 ? ` / ${q.part}` : ''} ≈ ${a} cm².`;
    case 'skala': {
      const { a: x, b: y } = q.scale!;
      return x > y ? `Skala ${x}:1: bilden är ${x} gånger större. Svaret: ${a} ${q.unit}.` : `Skala 1:${y}: verkligheten är ${y} gånger större. Svaret: ${a} ${q.unit}.`;
    }
  }
}

export function hint(q: CQ): string {
  switch (q.mode) {
    case 'radie': return 'Diametern går tvärs över cirkeln. Radien går från mitten till kanten – den är halva diametern.';
    case 'omkrets': return q.reverse ? 'O = π · d. Dela omkretsen med π för att få diametern.' : q.turns ? 'Ett varv rullar brädan lika långt som hjulets omkrets: π · d. Gånger antalet varv.' : 'O = π · d. Har du radien? Diametern är två radier.';
    case 'area': return `A = π · r · r. Har du diametern? Radien är hälften.${q.part! > 1 ? ` Dela sedan med ${q.part}.` : ''}`;
    case 'skala': return q.scale!.a > q.scale!.b ? `I skala ${q.scale!.a}:1 förstoras allt ${q.scale!.a} gånger. Ska svaret bli större eller mindre?` : `I skala 1:${q.scale!.b} motsvarar varje centimeter på ritningen ${q.scale!.b} cm i verkligheten. Byt till rätt enhet sist.`;
  }
}

export function notes(q: CQ): Note[] {
  if (q.mode === 'skala') return [
    { name: 'Skala 1:100', text: '1 cm på ritningen = 100 cm i verkligheten' },
    { name: 'Skala 5:1', text: 'Bilden är 5 gånger större än verkligheten' },
    { name: 'Enheter', text: '1 m = 100 cm · 1 cm = 10 mm' },
  ];
  return [
    { name: 'π (pi)', text: 'π ≈ 3,14' },
    { name: 'Diameter', text: 'd = 2 · r (två radier)' },
    { name: 'Omkrets', text: 'O = π · d' },
    { name: 'Area', text: 'A = π · r · r = π · r²' },
  ];
}
