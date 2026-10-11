import type { Rng } from '../../../platform/rng';
import type { QuestionSpec } from '../../../platform/rpg/types';
import type { DrillQ, Explained, Note } from '../../../engines/drill/types';
import { near, range, sv } from '../draw';

// Kroksbäck: kroppar i 3D och volym. Namnge kroppar, räkna sidoytor/kanter/hörn, räkna kuber,
// rätblockets volym och liter. Färdighets-id:n och felkoder är permanenta.

export type Mode = 'namn' | 'delar' | 'kuber' | 'volym' | 'liter';

export const SOLIDS = ['kub', 'rätblock', 'cylinder', 'klot', 'kon', 'pyramid', 'prisma', 'tetraeder'];
const FLAT = ['kvadrat', 'rektangel', 'cirkel', 'cirkel', 'triangel', 'triangel', 'triangel', 'triangel'];
const FLAT_ID = 100; // flervalsvärden ≥ 100 är platta former
const FLAT_NAMES = ['kvadrat', 'rektangel', 'cirkel', 'triangel'];

export type Part = 'hörn' | 'kanter' | 'sidoytor';
/** Antal delar, och hur många som syns i teckningen (de streckade linjerna är dolda). */
export const PARTS: Record<number, { all: Record<Part, number>; seen: Record<Part, number> }> = {
  0: { all: { hörn: 8, kanter: 12, sidoytor: 6 }, seen: { hörn: 7, kanter: 9, sidoytor: 3 } },
  1: { all: { hörn: 8, kanter: 12, sidoytor: 6 }, seen: { hörn: 7, kanter: 9, sidoytor: 3 } },
  5: { all: { hörn: 5, kanter: 8, sidoytor: 5 }, seen: { hörn: 4, kanter: 5, sidoytor: 2 } },
  6: { all: { hörn: 6, kanter: 9, sidoytor: 5 }, seen: { hörn: 5, kanter: 6, sidoytor: 2 } },
  7: { all: { hörn: 4, kanter: 6, sidoytor: 4 }, seen: { hörn: 4, kanter: 5, sidoytor: 2 } },
};

const THINGS: [string, string, number][] = [
  ['en burk', '🥫', 2], ['en tärning', '🎲', 0], ['en fotboll', '⚽', 3], ['en glasstrut', '🍦', 4], ['ett paket', '📦', 1],
  ['ett tält', '⛺', 6], ['en apelsin', '🍊', 3], ['ett stearinljus', '🕯️', 2], ['en mjölkkartong', '🥛', 1], ['en partyhatt', '🥳', 4],
];

export interface KQ extends DrillQ {
  mode: Mode;
  solid?: number;
  thing?: [string, string];
  part?: Part;
  /** kuber/volym: längd, bredd, höjd. kuber nivå 2: höjden på varje stapel (en trappa). */
  dims?: [number, number, number];
  stairs?: number[];
  liters?: boolean;
  /** liter: värde och enheter. */
  v?: number;
  from?: string;
  to?: string;
}

export const ERR: Record<string, string> = {
  '2d-namn': 'Använder namnet på en platt form',
  'kub-ratblock': 'Blandar ihop kub och rätblock',
  'kon-pyramid': 'Blandar ihop kon och pyramid',
  'bara-synliga': 'Räknar bara det som syns',
  'blandade-delar': 'Blandar ihop hörn, kanter och sidoytor',
  'raknade-framsidan': 'Räknar bara kuberna på framsidan',
  adderade: 'Lägger ihop måtten i stället för att multiplicera',
  'glomde-hojden': 'Glömmer höjden',
  'fel-antal-nollor': 'Gångrar eller delar med fel tal när enheten byts',
  'fel-hall': 'Gångrar när det ska delas (eller tvärtom)',
};

const SKILL = {
  namn: 'ma.geo.kroppar-namn', vardag: 'ma.geo.kroppar-vardag', delar: 'ma.geo.kroppar-delar', kuber: 'ma.geo.volym-kuber',
  ratblock: 'ma.geo.volym-ratblock', liter: 'ma.geo.volym-liter', enheter: 'ma.geo.volymenheter',
};

/* ---------- namn ---------- */

function namn(level: number, rng: Rng): KQ {
  const pool = level === 0 ? [0, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6];
  if (level >= 2) {
    const [name, icon, solid] = rng.pick(THINGS);
    const others = rng.shuffle(pool.filter((k) => k !== solid)).slice(0, 2);
    const flat = FLAT_ID + FLAT_NAMES.indexOf(FLAT[solid]);
    const choices = rng.shuffle([solid, ...others, flat]).map((v) => ({ label: v >= FLAT_ID ? FLAT_NAMES[v - FLAT_ID] : SOLIDS[v], value: v }));
    return { mode: 'namn', level, skill: SKILL.vardag, solid, thing: [name, icon], answer: solid, choices, prompt: `Vilken kropp liknar ${name}?`, parts: [null] };
  }
  const solid = rng.pick(pool);
  const pair: Record<number, number> = { 0: 1, 1: 0, 4: 5, 5: 4 };
  const near1 = level === 1 && pair[solid] !== undefined ? [pair[solid]] : [];
  const others = rng.shuffle(pool.filter((k) => k !== solid && !near1.includes(k))).slice(0, 2 - near1.length);
  const flat = FLAT_ID + FLAT_NAMES.indexOf(FLAT[solid]);
  const choices = rng.shuffle([solid, ...near1, ...others, flat]).map((v) => ({ label: v >= FLAT_ID ? FLAT_NAMES[v - FLAT_ID] : SOLIDS[v], value: v }));
  return { mode: 'namn', level, skill: SKILL.namn, solid, answer: solid, choices, prompt: 'Vad heter kroppen?', parts: [null] };
}

/* ---------- delar ---------- */

const named = (s: number) => ['kuben', 'rätblocket', 'cylindern', 'klotet', 'konen', 'pyramiden', 'prismat', 'tetraedern'][s];

function delar(level: number, rng: Rng, trap: boolean): KQ {
  const solid = level === 0 ? 0 : rng.pick(level === 1 ? [0, 1, 5, 6] : [1, 5, 6, 7]);
  const part: Part = level === 0 && !trap ? rng.pick(['hörn', 'sidoytor'] as Part[]) : rng.pick(['hörn', 'kanter', 'sidoytor'] as Part[]);
  return { mode: 'delar', level, skill: SKILL.delar, solid, part, answer: PARTS[solid].all[part],
    prompt: `Hur många ${part} har ${named(solid)}${solid === 7 ? ' (en pyramid med en triangel som botten)' : ''}? Räkna även de du inte ser.`, parts: [null, part] };
}

/* ---------- kuber ---------- */

export const seenCubes = ([l, w, h]: [number, number, number]) => l * w * h - (l - 1) * (w - 1) * (h - 1);

function kuber(level: number, rng: Rng, trap: boolean): KQ {
  if (level === 2 && !trap) {
    const n = range(rng, 3, 4), w = range(rng, 1, 2);
    const stairs = Array.from({ length: n }, (_, i) => n - i);
    return { mode: 'kuber', level, skill: SKILL.kuber, dims: [n, w, n], stairs, answer: stairs.reduce((s, x) => s + x, 0) * w,
      prompt: 'Trappan är byggd av småkuber, utan hål. Hur många kuber är det?', parts: [null, 'kuber'] };
  }
  const dims: [number, number, number] = level === 0 && !trap ? [range(rng, 2, 3), range(rng, 1, 2), range(rng, 1, 2)]
    : level === 3 ? [range(rng, 4, 6), range(rng, 3, 5), range(rng, 2, 4)] : [range(rng, 2, 4), range(rng, 2, 3), range(rng, 2, 3)];
  return { mode: 'kuber', level, skill: SKILL.kuber, dims, answer: dims[0] * dims[1] * dims[2],
    prompt: 'Rätblocket är byggt av småkuber, hela vägen igenom. Hur många kuber är det?', parts: [null, 'kuber'] };
}

/* ---------- volym ---------- */

function volym(level: number, rng: Rng): KQ {
  if (level === 3) {
    const pick = () => rng.pick([10, 20, 25, 30, 40, 50, 60]);
    const dims: [number, number, number] = [pick(), pick(), pick()];
    const answer = (dims[0] * dims[1] * dims[2]) / 1000;
    return { mode: 'volym', level, skill: SKILL.liter, dims, liters: true, answer, keypad: Number.isInteger(answer) ? undefined : 'decimal', tools: 'raknare',
      prompt: 'Akvariet är ett rätblock. Hur många liter vatten får plats? (1 liter = 1 dm³ = 1000 cm³)', parts: [null, 'liter'] };
  }
  const max = level <= 1 ? 6 : 15;
  const dims: [number, number, number] = [range(rng, 2, max), range(rng, 2, max), range(rng, 2, level <= 1 ? 5 : 10)];
  return { mode: 'volym', level, skill: SKILL.ratblock, dims, answer: dims[0] * dims[1] * dims[2], tools: level >= 2 ? 'kladd' : undefined,
    prompt: 'Hur stor är rätblockets volym?', parts: ['Volym', null, 'cm³'] };
}

/* ---------- liter ---------- */

const ML: Record<string, number> = { ml: 1, cl: 10, dl: 100, l: 1000, 'cm³': 1, 'dm³': 1000 };

function liter(level: number, rng: Rng): KQ {
  const pairs: [string, string][][] = [
    [['l', 'dl']],
    [['l', 'ml'], ['dl', 'cl'], ['cl', 'ml'], ['l', 'cl'], ['l', 'dl']],
    [['dm³', 'l'], ['cm³', 'ml'], ['dm³', 'cm³'], ['l', 'cm³'], ['dl', 'ml']],
    [['l', 'dl'], ['l', 'ml'], ['dl', 'ml'], ['dm³', 'cm³']],
  ];
  const [big, small] = rng.pick(pairs[level]);
  const ratio = ML[big] / ML[small];
  let from: string, to: string, v: number;
  if (level === 3) {
    const n = range(rng, 1, 4) + rng.pick([0.5, 0.25, 0.2, 0.75]);
    if (rng.next() < 0.5) [from, to, v] = [big, small, n];
    else [from, to, v] = [small, big, Math.round(n * ratio)];
  } else {
    const n = rng.pick(level === 0 ? [2, 3, 4, 5, 6, 7, 8, 9] : [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]); // inte 10: då står svaret i ledtråden
    if (ratio === 1 || rng.next() < 0.5) [from, to, v] = [big, small, n];
    else [from, to, v] = [small, big, n * ratio];
  }
  const answer = Math.round(((v * ML[from]) / ML[to]) * 1000) / 1000;
  return { mode: 'liter', level, skill: SKILL.enheter, v, from, to, answer, keypad: Number.isInteger(answer) ? undefined : 'decimal', parts: [v, from, '=', null, to] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): KQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'bara-synliga' && mode !== 'kuber') mode = 'delar';
  if (spec.trap === 'adderade') mode = 'volym';
  if (mode === 'blandat') mode = rng.pick(['namn', 'delar', 'kuber', 'volym', 'liter'] as const);
  switch (mode) {
    case 'namn': return namn(level, rng);
    case 'delar': return delar(level, rng, !!spec.trap);
    case 'kuber': return kuber(level, rng, !!spec.trap);
    case 'volym': return volym(spec.trap ? Math.min(2, level) : level, rng);
    case 'liter': return liter(level, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.namn: return [{ mode: 'namn', level: 0 }, { mode: 'namn', level: 1 }];
    case SKILL.vardag: return [{ mode: 'namn', level: 2 }];
    case SKILL.delar: return [{ mode: 'delar', level: 1 }];
    case SKILL.kuber: return [{ mode: 'kuber', level: 1 }, { mode: 'kuber', level: 2 }];
    case SKILL.ratblock: return [{ mode: 'volym', level: 1 }, { mode: 'volym', level: 2 }];
    case SKILL.liter: return [{ mode: 'volym', level: 3 }];
    case SKILL.enheter: return [{ mode: 'liter', level: 1 }, { mode: 'liter', level: 2 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

export function diagnose(q: KQ, given: number): string | undefined {
  switch (q.mode) {
    case 'namn': {
      if (given >= FLAT_ID) return '2d-namn';
      const pair = [q.answer, given].sort().join();
      if (pair === '0,1') return 'kub-ratblock';
      if (pair === '4,5') return 'kon-pyramid';
      return undefined;
    }
    case 'delar': {
      const p = PARTS[q.solid!];
      if (given === p.seen[q.part!] && given !== q.answer) return 'bara-synliga';
      if (Object.values(p.all).includes(given) && given !== q.answer) return 'blandade-delar';
      return undefined;
    }
    case 'kuber': {
      const [l, w, h] = q.dims!;
      if (q.stairs) return given === q.stairs.reduce((s, x) => s + x, 0) && w > 1 ? 'raknade-framsidan' : undefined;
      if (given === seenCubes([l, w, h]) && given !== q.answer) return 'bara-synliga';
      if (given === l * h && w > 1) return 'raknade-framsidan';
      return undefined;
    }
    case 'volym': {
      const [l, b, h] = q.dims!;
      if (q.liters) {
        if ([1, 10, 100, 0.1, 0.01].some((k) => near(given, q.answer * 1000 * k, 1e-6)) && !near(given, q.answer)) return 'fel-antal-nollor';
        return undefined;
      }
      if (given === l + b + h) return 'adderade';
      if ((given === l * b || given === b * h || given === l * h) && given !== q.answer) return 'glomde-hojden';
      return undefined;
    }
    case 'liter': {
      const f = ML[q.from!] / ML[q.to!];
      if (f !== 1 && near(given, q.v! / f, 1e-6)) return 'fel-hall';
      if ([10, 0.1, 100, 0.01, 1000, 0.001].some((k) => near(given, q.answer * k, 1e-6))) return 'fel-antal-nollor';
      return undefined;
    }
  }
}

export function explain(tag: string, q: KQ, _given: number): Explained {
  switch (tag) {
    case '2d-namn': return { title: 'Den är inte platt', text: 'Det namnet hör till en platt form, som man ritar på ett papper. Kroppar har tre dimensioner – man kan hålla dem i handen.' };
    case 'kub-ratblock': return { title: 'Kub eller rätblock?', text: 'En kub har alla sidor lika långa – som en tärning. Ett rätblock kan vara längre åt något håll – som ett paket.' };
    case 'kon-pyramid': return { title: 'Kon eller pyramid?', text: 'En kon har en rund botten – som en glasstrut. En pyramid har en botten med raka kanter och hörn.' };
    case 'bara-synliga': return { title: 'Baksidan också', text: q.mode === 'kuber' ? 'Du räknade bara kuberna du ser. Det finns kuber inuti och bakom också – blocket är byggt hela vägen igenom.' : 'Du räknade bara det du ser. De streckade linjerna visar baksidan – räkna med den också!' };
    case 'blandade-delar': return { title: 'Hörn, kanter och sidoytor', text: 'Hörn är spetsarna. Kanter är linjerna där två ytor möts. Sidoytor är de platta ytorna. Vilket frågas det efter?' };
    case 'raknade-framsidan': return { title: 'Fler lager bakåt', text: 'Du räknade bara kuberna på framsidan. Bakom dem finns fler lager – räkna hur många lager det är.' };
    case 'adderade': return { title: 'Gånger, inte plus', text: 'Volymen är längden gånger bredden gånger höjden. Tänk dig lager av kuber: en botten, och så många lager på höjden.' };
    case 'glomde-hojden': return { title: 'Alla tre måtten', text: 'Du räknade ut bottenytan. Gånger höjden också – så många lager som får plats.' };
    case 'fel-antal-nollor': return q.mode === 'volym'
      ? { title: 'Från cm³ till liter', text: 'Räkna först volymen i cm³. En liter är tusen cm³ – dela med tusen.' }
      : { title: 'Hur många gånger större?', text: '1 l = 10 dl = 100 cl = 1000 ml. 1 dm³ = 1 l, och 1 cm³ = 1 ml.' };
    case 'fel-hall': return { title: 'Åt vilket håll?', text: ML[q.from!] > ML[q.to!] ? `${q.to} är en mindre enhet. Det behövs fler av dem – gånger, inte delat.` : `${q.to} är en större enhet. Det behövs färre av dem – delat, inte gånger.` };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: KQ): string {
  switch (q.mode) {
    case 'namn': return q.thing ? `${q.thing[0].replace(/^(en|ett) /, '').replace(/^./, (c) => c.toUpperCase())} liknar en ${SOLIDS[q.answer]}.` : `Det är en ${SOLIDS[q.answer]}.`;
    case 'delar': {
      const p = PARTS[q.solid!];
      return `${named(q.solid!).replace(/^./, (c) => c.toUpperCase())} har ${p.all.hörn} hörn, ${p.all.kanter} kanter och ${p.all.sidoytor} sidoytor.`;
    }
    case 'kuber': {
      const [l, w, h] = q.dims!;
      if (q.stairs) return `Framsidan: ${q.stairs.join(' + ')} = ${q.answer / w} kuber${w > 1 ? `, och ${w} lager bakåt: ${q.answer} kuber` : ''}.`;
      return `${l} · ${w} = ${l * w} kuber i varje lager, och ${h} lager: ${l * w} · ${h} = ${q.answer} kuber.`;
    }
    case 'volym': {
      const [l, b, h] = q.dims!;
      return q.liters ? `${l} · ${b} · ${h} = ${l * b * h} cm³ = ${sv(q.answer)} liter.` : `${l} · ${b} · ${h} = ${q.answer} cm³.`;
    }
    case 'liter': return `${sv(q.v!)} ${q.from} = ${sv(q.answer)} ${q.to}.`;
  }
}

export function hint(q: KQ): string {
  switch (q.mode) {
    case 'namn': return 'Är den rund eller har den raka kanter? Har den en spets? Är alla sidor lika långa?';
    case 'delar': return q.part === 'hörn' ? 'Hörnen är spetsarna. Räkna uppe och nere, fram och bak.' : q.part === 'kanter' ? 'Kanterna är linjerna där ytorna möts. De streckade är på baksidan.' : 'Sidoytorna är de platta ytorna: fram, bak, upp, ner och på sidorna.';
    case 'kuber': return q.stairs ? 'Räkna kuberna på framsidan, stapel för stapel. Hur många lager är det bakåt?' : 'Räkna kuberna i det översta lagret (längd gånger bredd). Hur många lager är det?';
    case 'volym': return q.liters ? 'Räkna volymen i cm³: längd · bredd · höjd. Sedan: 1000 cm³ är en liter.' : 'Volymen är längd · bredd · höjd: en botten av kuber, gånger antalet lager.';
    case 'liter': return '1 l = 10 dl = 100 cl = 1000 ml, och 1 dm³ = 1 l. Ska det bli fler eller färre?';
  }
}

export function notes(): Note[] {
  return [
    { name: 'Rätblock', text: 'Volym = längd · bredd · höjd' },
    { name: 'Liter', text: '1 l = 1 dm³ = 1000 cm³' },
    { name: 'Mindre enheter', text: '1 l = 10 dl = 100 cl = 1000 ml · 1 cm³ = 1 ml' },
  ];
}
