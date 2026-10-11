import type { Rng } from '../../../platform/rng';
import type { QuestionSpec } from '../../../platform/rpg/types';
import type { DrillQ, Explained, Note } from '../../../engines/drill/types';
import { near, range, sv } from '../draw';
import type { Grid } from '../symmetri/logic';

// Bryggeriet: area. Räkna rutor, rektangelns och triangelns area, sidan som fattas och sammansatta figurer.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'rutor' | 'rektangel' | 'saknad' | 'triangel' | 'sammansatt';

export interface AQ extends DrillQ {
  mode: Mode;
  /** rutor: rutnätet (0 tom, 1 hel ruta, 2–3 halv ruta). Nivå 3: en rätvinklig triangel ovanpå (kateter a och b rutor). */
  cells?: Grid;
  tri?: { a: number; b: number };
  /** rektangel/saknad/triangel: sidor (b = bas, h = höjd, s = sned sida). */
  a?: number;
  b?: number;
  h?: number;
  s?: number;
  square?: boolean;
  grid?: boolean;
  unit?: string;
  /** triangel: rätvinklig eller med höjden inritad. */
  right?: boolean;
  /** sammansatt: L-formen (som i Oxie): bredd, höjd och urtaget. */
  L?: { W: number; H: number; w1: number; h1: number };
}

export const ERR: Record<string, string> = {
  'raknade-omkrets': 'Räknar omkretsen i stället för arean',
  adderade: 'Lägger ihop sidorna i stället för att multiplicera',
  'halva-som-hela': 'Räknar halva rutor som hela',
  'glomde-halva': 'Glömmer de halva rutorna',
  subtraherade: 'Tar minus i stället för delat',
  'glomde-halvera': 'Glömmer att dela med två för triangeln',
  'sned-sida': 'Använder den sneda sidan i stället för höjden',
  'hela-rektangeln': 'Glömmer att ta bort biten som fattas',
  dubbelraknade: 'Räknar en bit två gånger',
};

const SKILL = {
  rutor: 'ma.geo.area-rutor', halva: 'ma.geo.area-halva', rektangel: 'ma.geo.area-rektangel', decimal: 'ma.geo.area-decimal',
  saknad: 'ma.geo.area-saknad', triangel: 'ma.geo.area-triangel', sammansatt: 'ma.geo.area-sammansatt',
};

const sq = (u: string) => `${u}²`;

/* ---------- rutor ---------- */

const W = 9, H = 6;
const blank = (): Grid => Array.from({ length: H }, () => Array(W).fill(0));
const fill = (g: Grid, x: number, y: number, w: number, h: number) => { for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) g[r][c] = 1; };

/** Omkretsen (i rutsidor) runt de fyllda rutorna. */
export function perimeterOf(g: Grid): number {
  let p = 0;
  g.forEach((row, r) => row.forEach((v, c) => {
    if (v !== 1) return;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g[r + dr]?.[c + dc] !== 1) p++;
  }));
  return p;
}

function rutor(level: number, rng: Rng): AQ {
  const g = blank();
  if (level === 3) {
    const a = range(rng, 3, 8), b = range(rng, 2, 5);
    return { mode: 'rutor', level, skill: SKILL.halva, cells: g, tri: { a, b }, answer: (a * b) / 2, keypad: (a * b) % 2 ? 'decimal' : undefined,
      prompt: 'Hur många rutor stor är triangeln? Tänk på rektangeln runt den.', parts: [null, 'rutor'] };
  }
  const w = range(rng, 2, level === 0 ? 5 : 4), h = range(rng, 2, level === 0 ? 4 : 3);
  const x = range(rng, 1, W - w - 3), y = range(rng, 0, H - h - 1);
  fill(g, x, y, w, h);
  if (level >= 1) {
    // En till bit bredvid: blir en L- eller T-form.
    const w2 = range(rng, 1, 3), h2 = range(rng, 1, 2);
    const x2 = Math.min(W - w2, x + range(rng, 0, w)), y2 = Math.min(H - h2, y + h);
    fill(g, x2, y2, w2, h2);
  }
  let halves = 0;
  if (level === 2) {
    const spots: [number, number][] = [];
    g.forEach((row, r) => row.forEach((v, c) => { if (v === 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => g[r + dr]?.[c + dc] === 1)) spots.push([r, c]); }));
    for (const [r, c] of rng.shuffle(spots).slice(0, range(rng, 2, 4))) { g[r][c] = rng.pick([2, 3]); halves++; }
  }
  const full = g.flat().filter((v) => v === 1).length;
  return { mode: 'rutor', level, skill: level === 2 ? SKILL.halva : SKILL.rutor, cells: g, answer: full + halves / 2, keypad: halves % 2 ? 'decimal' : undefined,
    prompt: level === 2 ? 'Hur många rutor stor är ytan? Två halva rutor blir en hel.' : 'Hur många rutor stor är ytan?', parts: [null, 'rutor'] };
}

/* ---------- rektangel ---------- */

function rektangel(level: number, rng: Rng, trap: boolean): AQ {
  const unit = level >= 2 ? rng.pick(['cm', 'm']) : 'cm';
  const square = !trap && level >= 1 && rng.next() < 0.3;
  let a: number, b: number;
  if (level === 3) {
    a = range(rng, 2, 9) + rng.pick([0.5, 0.2, 0.4]);
    b = square ? a : range(rng, 2, 8);
  } else {
    a = level === 2 ? range(rng, 11, 25) : range(rng, 3, level === 0 ? 9 : 12);
    b = square ? a : range(rng, 2, level === 2 ? 9 : Math.min(9, a));
  }
  const answer = Math.round(a * b * 100) / 100;
  return { mode: 'rektangel', level, skill: level === 3 ? SKILL.decimal : SKILL.rektangel, a, b, square, grid: level === 0 && !trap, unit, answer,
    keypad: Number.isInteger(answer) ? undefined : 'decimal', tools: level === 3 ? 'raknare' : undefined,
    prompt: square ? 'Alla sidor i en kvadrat är lika långa. Hur stor är arean?' : 'Hur stor är rektangelns area?', parts: ['Area', null, sq(unit)] };
}

function saknad(level: number, rng: Rng): AQ {
  const unit = level >= 2 ? 'm' : 'cm';
  const a = range(rng, 2, level >= 2 ? 12 : 9), b = range(rng, 2, level >= 2 ? 15 : 9);
  return { mode: 'saknad', level, skill: SKILL.saknad, a, b, unit, answer: b, tools: level >= 2 ? 'kladd' : undefined,
    prompt: `Rektangeln har arean ${a * b} ${sq(unit)}. Den ena sidan är ${a} ${unit}. Hur lång är den andra sidan?`, parts: ['Sidan', null, unit] };
}

/* ---------- triangel ---------- */

function triangel(level: number, rng: Rng): AQ {
  const unit = level >= 2 ? rng.pick(['cm', 'm']) : 'cm';
  const right = level <= 1;
  const b = range(rng, 3, level >= 2 ? 16 : 10), h = range(rng, Math.max(2, Math.ceil(b / 3)), level >= 2 ? 12 : 8);
  const s = right ? undefined : h + range(rng, 1, 4);
  const answer = (b * h) / 2;
  return { mode: 'triangel', level, skill: SKILL.triangel, b, h, s, right, unit, answer, keypad: Number.isInteger(answer) ? undefined : 'decimal', tools: level >= 2 ? 'kladd' : undefined,
    prompt: right ? 'Triangeln är halva rektangeln. Hur stor är triangelns area?' : 'Hur stor är triangelns area? Den streckade linjen är höjden.', parts: ['Area', null, sq(unit)] };
}

/* ---------- sammansatt ---------- */

export const lArea = ({ W: w, H: hh, w1, h1 }: { W: number; H: number; w1: number; h1: number }) => w * h1 + w1 * (hh - h1);

function sammansatt(level: number, rng: Rng): AQ {
  const unit = rng.pick(['m', 'cm']);
  const Wd = range(rng, 6, 14), Hd = range(rng, 5, 12), w1 = range(rng, 2, Wd - 2), h1 = range(rng, 2, Hd - 2);
  const L = { W: Wd, H: Hd, w1, h1 };
  return { mode: 'sammansatt', level, skill: SKILL.sammansatt, L, unit, answer: lArea(L), tools: 'kladd',
    prompt: 'Alla hörn är räta. Dela figuren i två rektanglar. Hur stor är arean?', parts: ['Area', null, sq(unit)] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): AQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'raknade-omkrets') mode = 'rektangel';
  if (spec.trap === 'glomde-halvera') mode = 'triangel';
  if (mode === 'blandat') mode = rng.pick(['rutor', 'rektangel', 'saknad', 'triangel', 'sammansatt'] as const);
  switch (mode) {
    case 'rutor': return rutor(level, rng);
    case 'rektangel': return rektangel(spec.trap ? Math.min(2, level) : level, rng, !!spec.trap);
    case 'saknad': return saknad(level, rng);
    case 'triangel': return triangel(level, rng);
    case 'sammansatt': return sammansatt(level, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.rutor: return [{ mode: 'rutor', level: 0 }, { mode: 'rutor', level: 1 }];
    case SKILL.halva: return [{ mode: 'rutor', level: 2 }, { mode: 'rutor', level: 3 }];
    case SKILL.rektangel: return [{ mode: 'rektangel', level: 1 }, { mode: 'rektangel', level: 2 }];
    case SKILL.decimal: return [{ mode: 'rektangel', level: 3 }];
    case SKILL.saknad: return [{ mode: 'saknad', level: 1 }];
    case SKILL.triangel: return [{ mode: 'triangel', level: 1 }, { mode: 'triangel', level: 2 }];
    case SKILL.sammansatt: return [{ mode: 'sammansatt', level: 3 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

export function diagnose(q: AQ, given: number): string | undefined {
  switch (q.mode) {
    case 'rutor': {
      if (q.tri) return near(given, q.tri.a * q.tri.b) ? 'glomde-halvera' : undefined;
      const g = q.cells!, full = g.flat().filter((v) => v === 1).length, halves = g.flat().filter((v) => v > 1).length;
      if (halves && given === full + halves) return 'halva-som-hela';
      if (halves && given === full) return 'glomde-halva';
      if (given === perimeterOf(g) && given !== q.answer) return 'raknade-omkrets';
      return undefined;
    }
    case 'rektangel': {
      const [a, b] = [q.a!, q.b!];
      if (near(given, 2 * a + 2 * b, 1e-6) && !near(given, q.answer)) return 'raknade-omkrets';
      if (near(given, a + b, 1e-6) && !near(given, q.answer)) return 'adderade';
      return undefined;
    }
    case 'saknad':
      if (given === q.a! * q.b! - q.a!) return 'subtraherade';
      return undefined;
    case 'triangel':
      if (near(given, q.b! * q.h!) && !near(given, q.answer)) return 'glomde-halvera';
      if (q.s && (near(given, (q.b! * q.s) / 2) || near(given, q.b! * q.s))) return 'sned-sida';
      if (given === q.b! + q.h!) return 'adderade';
      return undefined;
    case 'sammansatt': {
      const { W: w, H: hh, w1, h1 } = q.L!;
      if (given === 2 * w + 2 * hh) return 'raknade-omkrets';
      if (given === w * hh) return 'hela-rektangeln';
      if (given === w * h1 + w1 * hh || given === w1 * hh + w * h1) return 'dubbelraknade';
      return undefined;
    }
  }
}

export function explain(tag: string, q: AQ, _given: number): Explained {
  switch (tag) {
    case 'raknade-omkrets': return { title: 'Det där är omkretsen', text: 'Du räknade sträckan runt kanten. Arean är hur stor ytan är – hur många rutor som får plats inuti.' };
    case 'adderade': return { title: 'Gånger, inte plus', text: q.mode === 'triangel' ? 'Arean räknas med gånger: basen gånger höjden, och sedan delat med två.' : 'Tänk dig rader med rutor: så många rutor i varje rad, och så många rader. Det blir gånger!' };
    case 'halva-som-hela': return { title: 'Halva rutor', text: 'De halva rutorna är bara halva. Två halva rutor blir tillsammans en hel.' };
    case 'glomde-halva': return { title: 'Glöm inte de halva', text: 'De halva rutorna räknas också – två halva rutor blir en hel.' };
    case 'subtraherade': return { title: 'Delat, inte minus', text: `Arean är sidan gånger sidan. Vilket tal gånger ${q.a} blir arean? Det är delat du ska räkna.` };
    case 'glomde-halvera': return { title: 'Bara halva', text: 'Triangeln är bara hälften av rektangeln runt den. Dela med två!' };
    case 'sned-sida': return { title: 'Höjden, inte den sneda sidan', text: 'Höjden är den streckade linjen som går rakt upp från basen. Den sneda sidan är längre än höjden.' };
    case 'hela-rektangeln': return { title: 'En bit fattas', text: 'Du räknade arean av hela rektangeln runt figuren. Men en bit i hörnet fattas – den ska inte räknas.' };
    case 'dubbelraknade': return { title: 'En bit två gånger', text: 'Dina två rektanglar överlappar varandra, så en bit räknades två gånger. Dela figuren så att bitarna inte går in i varandra.' };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: AQ): string {
  const u = q.unit ?? '';
  switch (q.mode) {
    case 'rutor': return q.tri ? `Rektangeln runt triangeln är ${q.tri.a} · ${q.tri.b} = ${q.tri.a * q.tri.b} rutor. Triangeln är hälften: ${sv(q.answer)} rutor.` : `Ytan är ${sv(q.answer)} rutor stor.`;
    case 'rektangel': return `${sv(q.a!)} · ${sv(q.b!)} = ${sv(q.answer)} ${sq(u)}.`;
    case 'saknad': return `${q.a! * q.b!} / ${q.a} = ${q.answer} ${u}, för ${q.a} · ${q.b} = ${q.a! * q.b!}.`;
    case 'triangel': return `${q.b} · ${q.h} = ${q.b! * q.h!}, och hälften: ${q.b! * q.h!} / 2 = ${sv(q.answer)} ${sq(u)}.`;
    case 'sammansatt': {
      const { W: w, H: hh, w1, h1 } = q.L!;
      return `Övre rektangeln: ${w} · ${h1} = ${w * h1}. Nedre: ${w1} · ${hh - h1} = ${w1 * (hh - h1)}. Tillsammans ${q.answer} ${sq(u)}.`;
    }
  }
}

export function hint(q: AQ): string {
  switch (q.mode) {
    case 'rutor': return q.tri ? 'Rita rektangeln runt triangeln och räkna dess rutor. Triangeln är hälften.' : q.level === 2 ? 'Räkna de hela rutorna. Para sedan ihop de halva två och två.' : 'Räkna rad för rad. Hur många rutor i varje rad?';
    case 'rektangel': return 'Arean är basen gånger höjden: så många rutor i varje rad, gånger antalet rader.';
    case 'saknad': return `Vilket tal gånger ${q.a} blir ${q.a! * q.b!}?`;
    case 'triangel': return 'En triangel är halva rektangeln: basen gånger höjden, delat med två.';
    case 'sammansatt': return 'Dra en linje så att figuren blir två rektanglar. Räkna ut sidorna som saknas, räkna arean av var och en och lägg ihop.';
  }
}

export function notes(): Note[] {
  return [
    { name: 'Rektangel', text: 'Area = basen · höjden' },
    { name: 'Triangel', text: 'Area = basen · höjden / 2' },
    { name: 'Enheter', text: 'cm² = kvadratcentimeter, m² = kvadratmeter' },
  ];
}
