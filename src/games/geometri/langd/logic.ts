import type { Rng } from '../../../platform/rng';
import type { QuestionSpec } from '../../../platform/rpg/types';
import type { DrillQ, Explained, Note } from '../../../engines/drill/types';
import { near, range, regular, sv, type Pt } from '../draw';

// Oxie: mät längd och omkrets. Läs av linjalen, byt enhet, räkna omkrets och hitta sidan som fattas.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'linjal' | 'enheter' | 'omkrets' | 'saknad';

export interface LQ extends DrillQ {
  mode: Mode;
  /** linjal: föremålet går från s till e (cm). */
  s?: number;
  e?: number;
  thing?: string;
  /** enheter: värde, från-enhet, till-enhet. */
  v?: number;
  from?: string;
  to?: string;
  /** omkrets/saknad: figuren, sidornas längder och vilka sidor som har etikett ('?' = den som söks). */
  pts?: Pt[];
  sides?: number[];
  labels?: (string | null)[];
  unit?: string;
  /** saknad: den givna omkretsen. */
  per?: number;
  shape?: 'rektangel' | 'kvadrat' | 'triangel' | 'sexhorning' | 'femhorning' | 'L';
}

export const ERR: Record<string, string> = {
  'lasta-slutet': 'Läser av där föremålet slutar, fast det inte börjar på noll',
  'raknade-streck': 'Räknar strecken i stället för stegen',
  'fel-enhet': 'Blandar ihop centimeter och millimeter',
  'fel-antal-nollor': 'Gångrar eller delar med fel tal när enheten byts',
  'fel-hall': 'Gångrar när det ska delas (eller tvärtom)',
  'bara-tva-sidor': 'Räknar bara sidorna som har mått',
  'raknade-area': 'Räknar ytan i stället för omkretsen',
  'glomde-en-sida': 'Glömmer en sida',
  'glomde-halvera': 'Glömmer att det finns två sidor av varje',
  'trodde-kvadrat': 'Delar med fyra fast det inte är en kvadrat',
};

const SKILL = {
  linjal: 'ma.geo.linjal', linjalMm: 'ma.geo.linjal-mm', enheter: 'ma.geo.langdenheter', enheterDec: 'ma.geo.langdenheter-decimal',
  omkrets: 'ma.geo.omkrets', omkretsKlurig: 'ma.geo.omkrets-kluriga', saknad: 'ma.geo.omkrets-saknad',
};

const MM: Record<string, number> = { mm: 1, cm: 10, dm: 100, m: 1000, km: 1000000 };
const THINGS = ['brädan', 'pennan', 'kritan', 'skruven', 'kammen'];

/* ---------- linjalen ---------- */

function linjal(level: number, rng: Rng, trap: boolean): LQ {
  const thing = rng.pick(THINGS);
  if (level === 3) {
    const s = range(rng, 1, 4) + range(rng, 0, 9) / 10;
    const len = range(rng, 25, 95);
    const e = Math.round(s * 10 + len) / 10;
    return { mode: 'linjal', level, skill: SKILL.linjalMm, thing, s, e, answer: len, prompt: `Hur lång är ${thing} i millimeter?`, parts: [null, 'mm'] };
  }
  const s = level === 0 && !trap ? 0 : level === 2 ? rng.pick(trap ? [1, 2, 3, 1.5, 2.5] : [0, 1, 2, 3, 1.5, 2.5]) : range(rng, 1, 4);
  const len = level === 2 ? range(rng, 3, 8) + 0.5 : range(rng, 3, level === 0 ? 12 : 9);
  const e = s + len;
  return { mode: 'linjal', level, skill: level === 2 ? SKILL.linjalMm : SKILL.linjal, thing, s, e, answer: len,
    keypad: Number.isInteger(len) ? undefined : 'decimal', prompt: `Hur lång är ${thing}?`, parts: [null, 'cm'] };
}

/* ---------- enheter ---------- */

function enheter(level: number, rng: Rng): LQ {
  const up: [string, string, number[]][] = [['cm', 'mm', [2, 9]], ['m', 'cm', [2, 9]], ['m', 'dm', [2, 9]], ['dm', 'cm', [2, 9]]];
  let from: string, to: string, v: number;
  if (level === 0) {
    const [f, t, [lo, hi]] = rng.pick(up);
    [from, to, v] = [f, t, range(rng, lo, hi)];
  } else if (level <= 2) {
    const pairs: [string, string][] = level === 1 ? [['cm', 'mm'], ['m', 'cm'], ['km', 'm'], ['dm', 'cm']] : [['m', 'mm'], ['km', 'm'], ['m', 'cm'], ['dm', 'mm'], ['cm', 'mm']];
    const [big, small] = rng.pick(pairs);
    const n = level === 1 ? range(rng, 2, 9) : range(rng, 11, 48);
    if (rng.next() < 0.5) [from, to, v] = [big, small, n];
    else [from, to, v] = [small, big, n * (MM[big] / MM[small])];
  } else {
    const [big, small] = rng.pick([['m', 'cm'], ['km', 'm'], ['cm', 'mm'], ['m', 'mm']] as [string, string][]);
    const n = range(rng, 1, 9) + rng.pick([0.5, 0.2, 0.25, 0.75, 0.4]);
    if (rng.next() < 0.5) [from, to, v] = [big, small, n];
    else [from, to, v] = [small, big, Math.round(n * (MM[big] / MM[small]))];
  }
  const answer = Math.round((v * MM[from]) / MM[to] * 1000) / 1000;
  return { mode: 'enheter', level, skill: level === 3 ? SKILL.enheterDec : SKILL.enheter, v, from, to, answer,
    keypad: Number.isInteger(answer) ? undefined : 'decimal', parts: [v, from, '=', null, to] };
}

/* ---------- omkrets ---------- */

const rect = (a: number, b: number): Pt[] => [[0, 0], [a, 0], [a, b], [0, b]];

function omkrets(level: number, rng: Rng, trap: boolean): LQ {
  const unit = level >= 2 ? rng.pick(['cm', 'm']) : 'cm';
  if (level <= 1 || trap) {
    const square = !trap && rng.next() < 0.3;
    const a = range(rng, 3, 9), b = square ? a : range(rng, 2, a - 1 || 2);
    const sides = [a, b, a, b];
    const all = level === 0 && !trap;
    const labels = sides.map((x, i) => (all || i < (square ? 1 : 2) ? `${x} ${unit}` : null));
    return { mode: 'omkrets', level, skill: SKILL.omkrets, shape: square ? 'kvadrat' : 'rektangel', pts: rect(a, b), sides, labels, unit,
      answer: 2 * a + 2 * b, prompt: square && !all ? 'En kvadrat har fyra lika långa sidor. Hur lång är omkretsen?' : 'Hur lång är omkretsen – hela vägen runt?', parts: ['Omkrets', null, unit] };
  }
  if (level === 2) {
    const kind = rng.pick(['triangel', 'femhorning', 'sexhorning'] as const);
    if (kind === 'sexhorning') {
      const a = range(rng, 4, 15);
      return { mode: 'omkrets', level, skill: SKILL.omkretsKlurig, shape: kind, pts: regular(6, 0, 0, 1), sides: Array(6).fill(a), labels: [`${a} ${unit}`, null, null, null, null, null], unit,
        answer: 6 * a, prompt: 'Sexhörningen har lika långa sidor. Hur lång är omkretsen?', parts: ['Omkrets', null, unit] };
    }
    const n = kind === 'triangel' ? 3 : 5;
    const pts: Pt[] = kind === 'triangel' ? [[0, 0], [2, 0.2], [0.6, 1.4]] : [[0, 1], [1, 0], [2.2, 0.6], [2, 2], [0.4, 2.1]];
    const sides = Array.from({ length: n }, () => range(rng, 8, 35));
    return { mode: 'omkrets', level, skill: SKILL.omkretsKlurig, shape: kind, pts, sides, labels: sides.map((x) => `${x} ${unit}`), unit,
      answer: sides.reduce((s, x) => s + x, 0), prompt: 'Hur lång är omkretsen?', parts: ['Omkrets', null, unit] };
  }
  const W = range(rng, 6, 14), H = range(rng, 5, 12), w1 = range(rng, 2, W - 2), h1 = range(rng, 2, H - 2);
  const pts: Pt[] = [[0, 0], [W, 0], [W, h1], [w1, h1], [w1, H], [0, H]];
  const sides = [W, h1, W - w1, H - h1, w1, H];
  const labels = sides.map((x, i) => ([0, 1, 4, 5].includes(i) ? `${x} ${unit}` : null));
  return { mode: 'omkrets', level, skill: SKILL.omkretsKlurig, shape: 'L', pts, sides, labels, unit, tools: 'kladd',
    answer: 2 * W + 2 * H, prompt: 'Alla hörn är räta. Två sidor saknar mått – räkna ut dem först. Hur lång är omkretsen?', parts: ['Omkrets', null, unit] };
}

function saknad(level: number, rng: Rng): LQ {
  const unit = level >= 2 ? 'm' : 'cm';
  if (level <= 1 && rng.next() < 0.35) {
    const a = range(rng, 3, 12);
    return { mode: 'saknad', level, skill: SKILL.saknad, shape: 'kvadrat', pts: rect(1, 1), sides: [a, a, a, a], labels: ['?', null, null, null], unit, per: 4 * a,
      answer: a, prompt: `En kvadrat har omkretsen ${4 * a} ${unit}. Hur lång är en sida?`, parts: ['Sidan', null, unit] };
  }
  if (level <= 1) {
    const a = range(rng, 5, 14), b = range(rng, 2, a - 1);
    return { mode: 'saknad', level, skill: SKILL.saknad, shape: 'rektangel', pts: rect(a, b), sides: [a, b, a, b], labels: [`${a} ${unit}`, '?', null, null], unit, per: 2 * a + 2 * b,
      answer: b, prompt: `Rektangelns omkrets är ${2 * a + 2 * b} ${unit}. Hur lång är den korta sidan?`, parts: ['Sidan', null, unit] };
  }
  if (level === 2) {
    const sides = [range(rng, 10, 30), range(rng, 10, 30), range(rng, 10, 30)];
    const per = sides[0] + sides[1] + sides[2];
    return { mode: 'saknad', level, skill: SKILL.saknad, shape: 'triangel', pts: [[0, 0], [2, 0.2], [0.6, 1.4]], sides, labels: [`${sides[0]} ${unit}`, `${sides[1]} ${unit}`, '?'], unit, per,
      answer: sides[2], prompt: `Triangelns omkrets är ${per} ${unit}. Hur lång är sidan som fattas?`, parts: ['Sidan', null, unit] };
  }
  const a = range(rng, 12, 40), b = range(rng, 5, a - 3);
  return { mode: 'saknad', level, skill: SKILL.saknad, shape: 'rektangel', pts: rect(a, b), sides: [a, b, a, b], labels: [`${a} ${unit}`, '?', null, null], unit, per: 2 * a + 2 * b, tools: 'kladd',
    answer: b, prompt: `Skejtplanen är en rektangel med omkretsen ${2 * a + 2 * b} ${unit}. Den långa sidan är ${a} ${unit}. Hur lång är den korta sidan?`, parts: ['Sidan', null, unit] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): LQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'lasta-slutet') mode = 'linjal';
  if (spec.trap === 'bara-tva-sidor') mode = 'omkrets';
  if (mode === 'blandat') mode = rng.pick(['linjal', 'enheter', 'omkrets', 'saknad'] as const);
  switch (mode) {
    case 'linjal': return linjal(spec.trap ? Math.min(2, Math.max(1, level)) : level, rng, !!spec.trap);
    case 'enheter': return enheter(level, rng);
    case 'omkrets': return omkrets(level, rng, !!spec.trap);
    case 'saknad': return saknad(level, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.linjal: return [{ mode: 'linjal', level: 1 }];
    case SKILL.linjalMm: return [{ mode: 'linjal', level: 2 }, { mode: 'linjal', level: 3 }];
    case SKILL.enheter: return [{ mode: 'enheter', level: 1 }, { mode: 'enheter', level: 2 }];
    case SKILL.enheterDec: return [{ mode: 'enheter', level: 3 }];
    case SKILL.omkrets: return [{ mode: 'omkrets', level: 1 }];
    case SKILL.omkretsKlurig: return [{ mode: 'omkrets', level: 2 }, { mode: 'omkrets', level: 3 }];
    case SKILL.saknad: return [{ mode: 'saknad', level: 1 }, { mode: 'saknad', level: 2 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

export function diagnose(q: LQ, given: number): string | undefined {
  switch (q.mode) {
    case 'linjal':
      if (q.level === 3) {
        if (near(given, q.e! * 10)) return 'lasta-slutet';
        if (near(given, q.answer / 10)) return 'fel-enhet';
        return undefined;
      }
      if (q.s! > 0 && near(given, q.e!)) return 'lasta-slutet';
      if (near(given, q.answer * 10) || near(given, q.answer / 10)) return 'fel-enhet';
      if (Number.isInteger(q.answer) && given === q.answer + 1) return 'raknade-streck';
      return undefined;
    case 'enheter': {
      const f = MM[q.from!] / MM[q.to!];
      if (near(given, q.v! / f, 1e-6)) return 'fel-hall';
      if ([10, 0.1, 100, 0.01].some((k) => near(given, q.answer * k, 1e-6))) return 'fel-antal-nollor';
      return undefined;
    }
    case 'omkrets': {
      const s = q.sides!;
      const labeled = s.filter((_, i) => q.labels![i] !== null).reduce((a, b) => a + b, 0);
      if (labeled < q.answer && given === labeled) return 'bara-tva-sidor';
      if ((q.shape === 'rektangel' || q.shape === 'kvadrat') && given === s[0] * s[1] && given !== q.answer) return 'raknade-area';
      if (q.shape === 'L' && given === s[0] * s[5] - s[2] * s[3]) return 'raknade-area';
      if (s.some((x) => given === q.answer - x)) return 'glomde-en-sida';
      return undefined;
    }
    case 'saknad': {
      const p = q.per!;
      if (q.shape === 'rektangel') {
        const a = q.sides![0];
        if (given === p - 2 * a) return 'glomde-halvera';
        if (given === p - a) return 'glomde-en-sida';
        if (near(given, p / 4)) return 'trodde-kvadrat';
      }
      if (q.shape === 'kvadrat' && near(given, p / 2)) return 'glomde-halvera';
      if (q.shape === 'triangel' && (given === p - q.sides![0] || given === p - q.sides![1])) return 'glomde-en-sida';
      return undefined;
    }
  }
}

export function explain(tag: string, q: LQ, _given: number): Explained {
  switch (tag) {
    case 'lasta-slutet': return { title: 'Den börjar inte på noll', text: `${cap(q.thing!)} börjar inte vid nollan. Läs av var den börjar och var den slutar – längden är skillnaden mellan dem.` };
    case 'raknade-streck': return { title: 'Räkna stegen, inte strecken', text: 'Från ett streck till nästa är det en centimeter. Räkna hoppen mellan strecken, inte strecken själva.' };
    case 'fel-enhet': return { title: 'Centimeter eller millimeter?', text: q.level === 3 ? 'Frågan gäller millimeter. Varje centimeter är tio små millimetersteg.' : 'Frågan gäller centimeter. De långa strecken med siffror är centimeter.' };
    case 'fel-antal-nollor': return { title: 'Hur många gånger större?', text: `Tänk på hur många ${q.to} det går på en ${q.from === 'km' ? 'kilometer' : q.from}. 1 cm = 10 mm, 1 dm = 10 cm, 1 m = 100 cm, 1 km = 1000 m.` };
    case 'fel-hall': return { title: 'Åt vilket håll?', text: MM[q.from!] > MM[q.to!] ? `${q.to} är en mindre enhet. Det behövs fler av dem – gånger, inte delat.` : `${q.to} är en större enhet. Det behövs färre av dem – delat, inte gånger.` };
    case 'bara-tva-sidor': return { title: 'Hela vägen runt', text: 'Omkretsen är alla sidor tillsammans – även de som inte har något mått. Sidorna mitt emot varandra är lika långa.' };
    case 'raknade-area': return { title: 'Det där är ytan', text: 'Du räknade ut hur stor ytan är. Omkretsen är sträckan runt kanten – lägg ihop sidorna.' };
    case 'glomde-en-sida': return { title: 'En sida saknas', text: 'Du glömde en sida. Peka på varje sida i tur och ordning när du lägger ihop.' };
    case 'glomde-halvera': return { title: 'Två av varje', text: q.shape === 'kvadrat' ? 'En kvadrat har fyra lika långa sidor. Omkretsen ska delas på alla fyra.' : 'En rektangel har två långa och två korta sidor. Det du har kvar är båda de korta sidorna tillsammans.' };
    case 'trodde-kvadrat': return { title: 'Inte en kvadrat', text: 'Sidorna är inte lika långa. Ta bort de två långa sidorna från omkretsen först.' };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function solution(q: LQ): string {
  switch (q.mode) {
    case 'linjal': return q.level === 3
      ? `${cap(q.thing!)} går från ${sv(q.s! * 10)} mm till ${sv(q.e! * 10)} mm: ${q.answer} mm.`
      : `${cap(q.thing!)} går från ${sv(q.s!)} till ${sv(q.e!)}: ${sv(q.e!)} − ${sv(q.s!)} = ${sv(q.answer)} cm.`;
    case 'enheter': return `${sv(q.v!)} ${q.from} = ${sv(q.answer)} ${q.to}.`;
    case 'omkrets': return `${q.sides!.join(' + ')} = ${q.answer} ${q.unit}.`;
    case 'saknad':
      if (q.shape === 'kvadrat') return `${q.per} / 4 = ${q.answer} ${q.unit}.`;
      if (q.shape === 'triangel') return `${q.per} − ${q.sides![0]} − ${q.sides![1]} = ${q.answer} ${q.unit}.`;
      return `${q.per} − ${q.sides![0]} − ${q.sides![0]} = ${2 * q.answer}, och det är två korta sidor: ${2 * q.answer} / 2 = ${q.answer} ${q.unit}.`;
  }
}

export function hint(q: LQ): string {
  switch (q.mode) {
    case 'linjal': return q.level === 3 ? 'Läs av var den börjar och slutar i millimeter (tio små streck per centimeter), och ta skillnaden.' : 'Var börjar den, och var slutar den? Längden är skillnaden.';
    case 'enheter': return 'Ska det bli fler eller färre? Till en mindre enhet: gånger. Till en större: delat. 1 m = 100 cm, 1 cm = 10 mm, 1 km = 1000 m.';
    case 'omkrets': return q.shape === 'L' ? 'De två sidorna utan mått: jämför med sidan mitt emot. Lägg sedan ihop alla sex sidor.' : 'Gå runt hela figuren och lägg ihop varje sida. Sidor mitt emot varandra i en rektangel är lika långa.';
    case 'saknad': return q.shape === 'kvadrat' ? 'Alla fyra sidor är lika långa. Dela omkretsen i fyra lika delar.' : q.shape === 'triangel' ? 'Ta bort de sidor du vet från omkretsen.' : 'Ta bort båda de långa sidorna från omkretsen. Det som blir kvar är två korta sidor.';
  }
}

export function notes(q: LQ): Note[] {
  if (q.mode === 'omkrets' || q.mode === 'saknad') return [
    { name: 'Omkrets', text: 'Alla sidor tillsammans, hela vägen runt.' },
    { name: 'Rektangel', text: 'O = 2 · lång sida + 2 · kort sida' },
    { name: 'Kvadrat', text: 'O = 4 · sidan' },
  ];
  return [{ name: 'Längdenheter', text: '1 cm = 10 mm · 1 dm = 10 cm · 1 m = 100 cm · 1 km = 1000 m' }];
}
