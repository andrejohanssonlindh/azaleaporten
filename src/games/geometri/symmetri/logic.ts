import type { Rng } from '../../../platform/rng';
import type { QuestionSpec } from '../../../platform/rpg/types';
import type { Choice, DrillQ, Explained } from '../../../engines/drill/types';
import { range, regular, rotate, type Pt } from '../draw';

// Svampen: symmetri och mönster. Spegla en figur i rutnät, räkna symmetrilinjer, upprepade och växande
// mönster, och spegla punkter i ett koordinatsystem. Färdighets-id:n och felkoder är permanenta.

export type Mode = 'spegla' | 'linjer' | 'upprepa' | 'vaxa' | 'koordinat';

export type Grid = number[][];
export type Kind = 'ratt' | 'kopia' | 'fel-axel';

export interface SymShape { name: string; pts: Pt[]; axes: { p: Pt; a: number }[] }

export interface SQ extends DrillQ {
  mode: Mode;
  /** spegla: figuren, spegelns läge och alternativen A–C. */
  grid?: Grid;
  axis?: 'v' | 'h';
  opts?: Grid[];
  kinds?: Kind[];
  /** linjer: formen och dess symmetrilinjer. */
  shape?: SymShape;
  /** upprepa: mönstrets enhet, hur mycket som visas och platsen som efterfrågas. */
  unit?: number[];
  shown?: number;
  pos?: number;
  /** vaxa: figur n har start + steg · n rutor. */
  start?: number;
  step?: number;
  fig?: number;
  inverse?: boolean;
  /** koordinat: punkten och spegellinjen (x = m eller y = m). */
  pt?: Pt;
  line?: { dir: 'x' | 'y'; m: number };
}

export const ERR: Record<string, string> = {
  flyttade: 'Flyttar figuren i stället för att spegla den',
  'fel-axel': 'Speglar åt fel håll',
  diagonal: 'Tror att diagonalen alltid är en symmetrilinje',
  'glomde-diagonal': 'Glömmer symmetrilinjerna på snedden',
  'bara-nasta': 'Tar bara nästa figur i mönstret',
  'glomde-start': 'Glömmer rutorna som fanns från början',
  'gangrade-forsta': 'Tar första figuren gånger figurens nummer',
  'stannade-vid-linjen': 'Stannar på spegellinjen',
  'fel-avstand': 'Fel avstånd från spegellinjen',
};

const SKILL = {
  spegla: 'ma.geo.spegla', symmetrisk: 'ma.geo.symmetrisk', linjer: 'ma.geo.symmetrilinjer',
  upprepa: 'ma.geo.monster-upprepa', vaxa: 'ma.geo.monster-vaxande', koordinat: 'ma.geo.spegla-koordinat',
};

/* ---------- spegla i rutnät ---------- */

const same = (a: Grid, b: Grid) => a.every((row, r) => row.every((c, k) => c === b[r][k]));
export const mirror = (g: Grid, axis: 'v' | 'h'): Grid => (axis === 'v' ? g.map((row) => [...row].reverse()) : [...g].reverse().map((row) => [...row]));

function spegla(level: number, rng: Rng): SQ {
  const n = level === 0 ? 3 : level === 3 ? 5 : 4;
  const [lo, hi] = [[2, 3], [3, 5], [4, 6], [5, 8]][level];
  const axis: 'v' | 'h' = level >= 2 && rng.next() < 0.5 ? 'h' : 'v';
  let grid: Grid = [];
  for (let tries = 0; tries < 50; tries++) {
    const cells = rng.shuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, range(rng, lo, hi));
    grid = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (cells.includes(r * n + c) ? 1 : 0)));
    const m = mirror(grid, axis), o = mirror(grid, axis === 'v' ? 'h' : 'v');
    if (!same(m, grid) && !same(o, grid) && !same(m, o)) break;
  }
  const raw: [Grid, Kind][] = [[mirror(grid, axis), 'ratt'], [grid, 'kopia'], [mirror(grid, axis === 'v' ? 'h' : 'v'), 'fel-axel']];
  const order = rng.shuffle([0, 1, 2]);
  const opts = order.map((i) => raw[i][0]), kinds = order.map((i) => raw[i][1]);
  const choices: Choice[] = ['A', 'B', 'C'].map((label, value) => ({ label, value }));
  return { mode: 'spegla', level, skill: SKILL.spegla, grid, axis, opts, kinds, answer: kinds.indexOf('ratt'), choices,
    prompt: 'Spegeln är den streckade linjen. Vilken bild visar spegelbilden?', parts: [null] };
}

/* ---------- symmetrilinjer ---------- */

const reg = (name: string, n: number): SymShape => ({ name, pts: regular(n, 0, 0, 1), axes: Array.from({ length: n }, (_, k) => ({ p: [0, 0] as Pt, a: -Math.PI / 2 + (k * Math.PI) / n })) });
const V = Math.PI / 2;
export const SHAPES: Record<string, SymShape> = {
  kvadrat: { name: 'kvadrat', pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]], axes: [0, V, Math.PI / 4, -Math.PI / 4].map((a) => ({ p: [0, 0], a })) },
  rektangel: { name: 'rektangel', pts: [[-1, -0.55], [1, -0.55], [1, 0.55], [-1, 0.55]], axes: [0, V].map((a) => ({ p: [0, 0], a })) },
  liksidig: { ...reg('liksidig triangel', 3), name: 'liksidig triangel' },
  likbent: { name: 'likbent triangel', pts: [[0, -1.2], [0.6, 0.6], [-0.6, 0.6]], axes: [{ p: [0, 0], a: V }] },
  oliksidig: { name: 'triangel', pts: [[0, 0], [1.8, 0.2], [0.4, 1.1]], axes: [] },
  romb: { name: 'romb', pts: [[0, -1], [0.62, 0], [0, 1], [-0.62, 0]], axes: [0, V].map((a) => ({ p: [0, 0], a })) },
  parallellogram: { name: 'parallellogram', pts: [[0, 0], [1.6, 0], [2.2, 1], [0.6, 1]], axes: [] },
  femhorning: reg('femhörning', 5),
  sexhorning: reg('sexhörning', 6),
  attahorning: reg('åttahörning', 8),
  hus: { name: 'hus', pts: [[0, 1], [1, 0], [2, 1], [2, 2.2], [0, 2.2]], axes: [{ p: [1, 1], a: V }] },
  pil: { name: 'pil', pts: [[0, 1], [2, 1], [2, 0], [3.2, 1.5], [2, 3], [2, 2], [0, 2]], axes: [{ p: [1, 1.5], a: 0 }] },
  T: { name: 'T-form', pts: [[0, 0], [3, 0], [3, 1], [2, 1], [2, 3], [1, 3], [1, 1], [0, 1]], axes: [{ p: [1.5, 1], a: V }] },
  L: { name: 'L-form', pts: [[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [0, 3]], axes: [] },
  Z: { name: 'Z-form', pts: [[0, 0], [2, 0], [2, 1], [3, 1], [3, 2], [1, 2], [1, 1], [0, 1]], axes: [] },
  kors: { name: 'kors', pts: [[1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1], [1, 1]], axes: [0, V, Math.PI / 4, -Math.PI / 4].map((a) => ({ p: [1.5, 1.5], a })) },
  trapets: { name: 'parallelltrapets', pts: [[0, 1], [2, 1], [1.5, 0], [0.5, 0]], axes: [{ p: [1, 0.5], a: V }] },
  drake: { name: 'drake', pts: [[0, 0], [2, 1], [0, 2], [0.8, 1]], axes: [{ p: [1, 1], a: 0 }] },
};
const LEVEL_SHAPES = [
  ['hus', 'pil', 'T', 'likbent', 'drake', 'L', 'Z', 'oliksidig', 'parallellogram'],
  ['kvadrat', 'rektangel', 'likbent', 'liksidig', 'hus', 'T', 'L', 'trapets'],
  ['kvadrat', 'rektangel', 'liksidig', 'romb', 'parallellogram', 'femhorning', 'sexhorning', 'kors', 'Z', 'attahorning'],
];

function linjer(level: number, rng: Rng, trap: boolean): SQ {
  const key = trap ? rng.pick(['rektangel', 'parallellogram']) : rng.pick(LEVEL_SHAPES[Math.min(2, level)]);
  let shape = SHAPES[key];
  if (level === 3) {
    const a = rng.next() * Math.PI * 2;
    shape = { ...shape, pts: rotate(shape.pts, a, 0, 0), axes: shape.axes.map((x) => ({ p: rotate([x.p], a, 0, 0)[0], a: x.a + a })) };
  }
  const n = shape.axes.length;
  if (level === 0) {
    return { mode: 'linjer', level, skill: SKILL.symmetrisk, shape, answer: n > 0 ? 1 : 0, choices: [{ label: 'Ja', value: 1 }, { label: 'Nej', value: 0 }],
      prompt: 'Är figuren symmetrisk? Kan du vika den så att halvorna hamnar precis på varandra?', parts: [null] };
  }
  return { mode: 'linjer', level, skill: SKILL.linjer, shape, answer: n, prompt: 'Hur många symmetrilinjer har figuren?', parts: [null, 'symmetrilinjer'] };
}

/* ---------- mönster ---------- */

export const SYMBOLS = ['●', '▲', '■', '★'];

function upprepa(level: number, rng: Rng): SQ {
  const len = level === 0 ? rng.pick([2, 3]) : level === 1 ? rng.pick([2, 3]) : rng.pick([3, 4]);
  let unit: number[];
  do { unit = Array.from({ length: len }, () => rng.int(level >= 2 ? 4 : 3)); } while (new Set(unit).size < 2 || (len === 4 && unit[0] === unit[2] && unit[1] === unit[3]));
  const shown = len * 2 + (level === 0 ? 1 : 2);
  const pos = level === 0 ? shown + 1 : level === 1 ? range(rng, shown + 3, 15) : range(rng, 20, level === 3 ? 60 : 40);
  const used = [...new Set(unit)].sort();
  return { mode: 'upprepa', level, skill: SKILL.upprepa, unit, shown, pos, answer: unit[(pos - 1) % len],
    choices: used.map((v) => ({ label: SYMBOLS[v], value: v })), prompt: pos === shown + 1 ? `Mönstret fortsätter likadant. Vilken form kommer på plats ${pos}?` : `Mönstret fortsätter likadant. Vilken form kommer på plats ${pos}? Det är inte nästa form – räkna vidare ända till ${pos}.`, parts: [null] };
}

export const tiles = (q: SQ, n: number) => q.start! + q.step! * n;

function vaxa(level: number, rng: Rng): SQ {
  const step = range(rng, level === 0 ? 1 : 2, level === 0 ? 2 : level === 1 ? 3 : 4);
  const start = range(rng, level === 0 ? 0 : 1, level === 0 ? 2 : 3);
  const base = { mode: 'vaxa' as const, level, skill: SKILL.vaxa, start, step };
  if (level === 3 && rng.next() < 0.5) {
    const fig = range(rng, 8, 25);
    return { ...base, fig, inverse: true, answer: fig, prompt: `Vilken figur har ${start + step * fig} rutor?`, parts: ['Figur', null] };
  }
  const fig = level === 0 ? 4 : level === 1 ? range(rng, 5, 6) : level === 2 ? 10 : rng.pick([20, 25, 30, 50]);
  return { ...base, fig, answer: start + step * fig, prompt: `Hur många rutor har figur ${fig}?`, parts: [null, 'rutor'] };
}

/* ---------- koordinater ---------- */

function koordinat(level: number, rng: Rng): SQ {
  const dir: 'x' | 'y' = level >= 3 && rng.next() < 0.5 ? 'y' : 'x';
  const max = dir === 'x' ? 10 : 8;
  const m = range(rng, 3, max - 3);
  let v: number;
  do { v = range(rng, Math.max(0, 2 * m - max), Math.min(max, 2 * m)); } while (v === m);
  const other = range(rng, 1, dir === 'x' ? 7 : 9);
  const pt: Pt = dir === 'x' ? [v, other] : [other, v];
  return { mode: 'koordinat', level, skill: SKILL.koordinat, pt, line: { dir, m }, answer: 2 * m - v,
    prompt: `Spegla punkten P (${pt[0]}, ${pt[1]}) i linjen ${dir} = ${m}. Vilken ${dir}-koordinat får spegelbilden?`, parts: [`${dir} =`, null] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): SQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'flyttade') mode = 'spegla';
  if (spec.trap === 'diagonal') mode = 'linjer';
  if (mode === 'blandat') mode = rng.pick(['spegla', 'linjer', 'upprepa', 'vaxa', 'koordinat'] as const);
  switch (mode) {
    case 'spegla': return spegla(level, rng);
    case 'linjer': return linjer(spec.trap ? Math.max(1, level) : level, rng, spec.trap === 'diagonal');
    case 'upprepa': return upprepa(level, rng);
    case 'vaxa': return vaxa(level, rng);
    case 'koordinat': return koordinat(Math.max(2, level), rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.spegla: return [{ mode: 'spegla', level: 1 }];
    case SKILL.symmetrisk: return [{ mode: 'linjer', level: 0 }];
    case SKILL.linjer: return [{ mode: 'linjer', level: 1 }, { mode: 'linjer', level: 2 }];
    case SKILL.upprepa: return [{ mode: 'upprepa', level: 1 }];
    case SKILL.vaxa: return [{ mode: 'vaxa', level: 1 }, { mode: 'vaxa', level: 2 }];
    case SKILL.koordinat: return [{ mode: 'koordinat', level: 2 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

export function diagnose(q: SQ, given: number): string | undefined {
  switch (q.mode) {
    case 'spegla': {
      const k = q.kinds![given];
      return k === 'kopia' ? 'flyttade' : k === 'fel-axel' ? 'fel-axel' : undefined;
    }
    case 'linjer':
      if (q.level === 0) return undefined;
      if (q.shape!.name === 'rektangel' && given === 4) return 'diagonal';
      if (q.shape!.name === 'parallellogram' && given > 0) return 'diagonal';
      if (q.shape!.name === 'kvadrat' && given === 2) return 'glomde-diagonal';
      return undefined;
    case 'upprepa': return undefined;
    case 'vaxa': {
      const n = q.fig!;
      if (q.inverse) return q.start! > 0 && given === (q.start! + q.step! * n) / q.step! ? 'glomde-start' : undefined;
      if (n > 4 && given === tiles(q, 4)) return 'bara-nasta';
      if (q.start! > 0 && given === q.step! * n) return 'glomde-start';
      if (q.start! > 0 && given === tiles(q, 1) * n) return 'gangrade-forsta';
      return undefined;
    }
    case 'koordinat': {
      const v = q.line!.dir === 'x' ? q.pt![0] : q.pt![1], m = q.line!.m;
      if (given === m) return 'stannade-vid-linjen';
      if (Math.sign(given - m) === Math.sign(q.answer - m) && Math.abs(given - m) !== Math.abs(v - m)) return 'fel-avstand';
      return undefined;
    }
  }
}

export function explain(tag: string, q: SQ, _given: number): Explained {
  switch (tag) {
    case 'flyttade': return { title: 'Du flyttade figuren', text: 'Den bilden är bara flyttad, inte speglad. I en spegel hamnar det som är närmast spegeln närmast spegeln på andra sidan också!' };
    case 'fel-axel': return { title: 'Åt fel håll', text: q.axis === 'v' ? 'Den bilden är vänd upp och ner. Spegeln står lodrätt, så höger och vänster byter plats – men upp och ner är kvar.' : 'Den bilden är vänd åt sidan. Spegeln ligger vågrätt, så upp och ner byter plats – men höger och vänster är kvar.' };
    case 'diagonal': return { title: 'Vik på snedden?', text: q.shape!.name === 'rektangel' ? 'Vik en rektangel längs diagonalen – hamnar hörnen på varandra? Bara vikningar där halvorna täcker varandra helt räknas.' : 'Prova att vika en parallellogram i tanken – åt alla håll. Hamnar halvorna någon gång precis på varandra?' };
    case 'glomde-diagonal': return { title: 'Snedda linjer också', text: 'En kvadrat kan vikas på fler sätt än rakt. Prova att vika den från hörn till hörn!' };
    case 'bara-nasta': return { title: 'Längre fram', text: `Du räknade ut nästa figur. Men frågan gäller figur ${q.fig}. Hur många rutor kommer till för varje ny figur?` };
    case 'glomde-start': return { title: 'Rutorna från början', text: `Varje figur får ${q.step} nya rutor, men det fanns ${q.start} ${q.start === 1 ? 'ruta' : 'rutor'} redan från början. Glöm inte dem!` };
    case 'gangrade-forsta': return { title: 'Inte gånger hela figuren', text: 'Rutorna från början kommer bara med en gång – de växer inte. Det är bara de nya rutorna som blir fler för varje figur.' };
    case 'stannade-vid-linjen': return { title: 'Hela vägen över', text: 'Du stannade på spegellinjen. Spegelbilden ligger lika långt bakom linjen som punkten ligger framför den.' };
    case 'fel-avstand': return { title: 'Lika långt', text: 'Räkna rutorna från punkten till linjen. Spegelbilden ska ligga lika många rutor från linjen, fast på andra sidan.' };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: SQ): string {
  switch (q.mode) {
    case 'spegla': return `Bild ${'ABC'[q.answer]} är spegelbilden: det som är närmast spegeln är närmast spegeln på andra sidan också.`;
    case 'linjer': {
      const n = q.shape!.axes.length;
      if (q.level === 0) return n ? 'Ja! Den kan vikas så att halvorna täcker varandra.' : 'Nej, hur man än viker den hamnar halvorna inte precis på varandra.';
      return `${n === 0 ? 'Ingen' : n} symmetrilinje${n === 1 ? '' : 'r'}. ${n ? 'De är inritade i figuren.' : ''}`.trim();
    }
    case 'upprepa': return `Mönstret upprepas var ${q.unit!.length}:e plats. Plats ${q.pos} får ${SYMBOLS[q.answer]}.`;
    case 'vaxa': return q.inverse
      ? `${q.start! + q.step! * q.fig!} − ${q.start} = ${q.step! * q.fig!}, och ${q.step! * q.fig!} / ${q.step} = ${q.fig}. Det är figur ${q.fig}.`
      : `Figur ${q.fig}: ${q.start} ${q.start === 1 ? 'ruta' : 'rutor'} från början + ${q.step} · ${q.fig} nya = ${q.answer} rutor.`;
    case 'koordinat': {
      const v = q.line!.dir === 'x' ? q.pt![0] : q.pt![1], m = q.line!.m;
      return `P ligger ${Math.abs(v - m)} steg från linjen. Spegelbilden ligger lika långt på andra sidan: ${q.line!.dir} = ${q.answer}.`;
    }
  }
}

export function hint(q: SQ): string {
  switch (q.mode) {
    case 'spegla': return 'Titta på rutorna närmast spegeln. I spegelbilden ska de också vara närmast spegeln.';
    case 'linjer': return 'Tänk dig att du viker figuren. Hamnar halvorna precis på varandra? Prova rakt, på tvären och på snedden.';
    case 'upprepa': return `Hitta biten som upprepas. Hur lång är den? Räkna sedan i hopp av den längden fram till plats ${q.pos}.`;
    case 'vaxa': return 'Hur många rutor kommer till från en figur till nästa? Och hur många fanns från början?';
    case 'koordinat': return 'Räkna hur många steg punkten är från linjen. Gå lika många steg på andra sidan.';
  }
}
