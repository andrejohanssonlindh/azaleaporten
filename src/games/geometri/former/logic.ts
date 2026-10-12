import type { Rng } from '../../../platform/rng';
import type { QuestionSpec } from '../../../platform/rpg/types';
import type { Choice, DrillQ, Explained } from '../../../engines/drill/types';
import { range, regular, rotate, type Pt } from '../draw';

// Fluffy: former. Namnge former, "är det här en …?", räkna hörn och sidor, hitta alla av en sort.
// Färdighets-id:n och felkoder är permanenta.

export type Mode = 'namn' | 'ar' | 'horn' | 'sortera';

export const NAMES = ['cirkel', 'triangel', 'kvadrat', 'rektangel', 'femhörning', 'sexhörning', 'åttahörning', 'romb', 'parallellogram', 'parallelltrapets'];
const PLURAL = ['cirklar', 'trianglar', 'kvadrater', 'rektanglar', 'femhörningar', 'sexhörningar', 'åttahörningar', 'romber', 'parallellogrammer', 'parallelltrapetser'];
const CORNERS = [0, 3, 4, 4, 5, 6, 8, 4, 4, 4];
const QUAD = [2, 3, 7, 8, 9];
const OTHER = 10; // en figur utan namn (t.ex. en L-form)

/** En form i frågan. pts = null är en cirkel. odd = vriden eller oregelbunden. */
export interface Shape { kind: number; pts: Pt[] | null; odd: boolean; inward?: number }

export interface FQ extends DrillQ {
  mode: Mode;
  shapes: Shape[];
  /** ar/sortera: formen frågan gäller. */
  ask?: number;
  /** horn: räknar man hörn eller sidor. */
  count?: 'hörn' | 'sidor';
}

export const ERR: Record<string, string> = {
  'vriden-form': 'Tror att en form byter namn när den ligger snett',
  fyrhorningar: 'Blandar ihop fyrhörningarna',
  'fel-antal-horn': 'Räknar hörnen fel när formen ska namnges',
  'raknade-start-igen': 'Räknar första hörnet två gånger',
  'missade-ett': 'Missar ett hörn',
  'missade-inat': 'Missar hörn som pekar inåt',
  cirkel: 'Tror att cirkeln har hörn',
  'raknade-alla': 'Räknar alla formerna',
};

const SKILL = {
  grund: 'ma.geo.former-grund', mang: 'ma.geo.manghorningar', fyr: 'ma.geo.fyrhorningar', vridna: 'ma.geo.former-vridna',
  horn: 'ma.geo.horn', hornKlurig: 'ma.geo.horn-kluriga', sortera: 'ma.geo.sortera',
};

const JA_NEJ: Choice[] = [{ label: 'Ja', value: 1 }, { label: 'Nej', value: 0 }];
const angle = (rng: Rng) => (0.3 + rng.next() * 0.9) * (rng.next() < 0.5 ? 1 : -1);

/** Ritar en form av en viss sort, "vanlig" eller vriden/oregelbunden. */
export function makeShape(kind: number, odd: boolean, rng: Rng): Shape {
  const turn = (pts: Pt[], a = angle(rng)) => rotate(pts, a, 0, 0);
  let pts: Pt[] | null;
  switch (kind) {
    case 0: pts = null; break;
    case 1:
      pts = !odd ? regular(3, 0, 0, 1)
        : rng.next() < 0.3 ? regular(3, 0, 0, 1, Math.PI / 2)
          : turn([[0, 0], [1.4 + rng.next() * 0.6, 0.1 + rng.next() * 0.3], [0.2 + rng.next() * 0.5, 0.8 + rng.next() * 0.5]]);
      break;
    case 2: pts = odd ? (rng.next() < 0.5 ? regular(4, 0, 0, 1, 0) : turn(regular(4, 0, 0, 1, Math.PI / 4))) : regular(4, 0, 0, 1, Math.PI / 4); break;
    case 3: { const r: Pt[] = [[0, 0], [1.9, 0], [1.9, 1], [0, 1]]; pts = odd ? turn(r) : r; break; }
    case 4: case 5: case 6: {
      const n = CORNERS[kind];
      pts = !odd ? regular(n, 0, 0, 1)
        : turn(Array.from({ length: n }, (_, i): Pt => {
          const a = ((i + (rng.next() - 0.5) * 0.5) * 2 * Math.PI) / n, r = 0.62 + rng.next() * 0.38;
          return [r * Math.cos(a), r * Math.sin(a)];
        }));
      break;
    }
    case 7: { const r: Pt[] = [[0, -1], [0.62, 0], [0, 1], [-0.62, 0]]; pts = odd ? turn(r) : r; break; }
    case 8: { const r: Pt[] = [[0, 0], [1.6, 0], [2.2, 1], [0.6, 1]]; pts = odd ? turn(r) : r; break; }
    default: { const r: Pt[] = [[0, 1], [2, 1], [1.5, 0], [0.5, 0]]; pts = odd ? turn(r, rng.next() < 0.5 ? Math.PI : angle(rng)) : r; }
  }
  return { kind, pts, odd };
}

// Formerna med hörn som pekar inåt (eller udda figurer) för de klurigare hörnfrågorna.
const TRICKY: { pts: Pt[]; inward: number; hard: boolean }[] = [
  { pts: [[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [0, 3]], inward: 1, hard: false }, // L
  { pts: [[0, 1], [2, 1], [2, 0], [3.2, 1.5], [2, 3], [2, 2], [0, 2]], inward: 2, hard: false }, // pil
  { pts: [[0, 0], [2, 1], [0, 2], [0.8, 1]], inward: 1, hard: false }, // pilspets
  { pts: [[0, 1], [1, 0], [2, 1], [2, 2.2], [0, 2.2]], inward: 0, hard: false }, // hus
  { pts: [[0, 0], [2, 0], [2, 1], [3, 1], [3, 2], [1, 2], [1, 1], [0, 1]], inward: 2, hard: false }, // Z
  { pts: [[0, 0], [3, 0], [3, 1], [2, 1], [2, 3], [1, 3], [1, 1], [0, 1]], inward: 2, hard: true }, // T
  { pts: [[0, 0], [1, 0], [1, 2], [2, 2], [2, 0], [3, 0], [3, 3], [0, 3]], inward: 2, hard: true }, // U
  { pts: [[1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1], [1, 1]], inward: 4, hard: true }, // kors
  { pts: Array.from({ length: 10 }, (_, i): Pt => { const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 0.42 : 1; return [r * Math.cos(a), r * Math.sin(a)]; }), inward: 5, hard: true }, // stjärna
];

function namn(level: number, rng: Rng): FQ {
  let kind: number, pool: number[];
  if (level === 0) { kind = rng.int(4); pool = [0, 1, 2, 3]; }
  else if (level === 1) { kind = range(rng, 1, 6); pool = [1, 2, 3, 4, 5, 6]; }
  else if (level === 2) { kind = rng.pick(QUAD); pool = QUAD; }
  else { kind = rng.pick([1, 3, 4, 5, 6]); pool = [1, 2, 3, 4, 5, 6]; } // inga romber/parallellogrammer: en vriden rektangel är ju också en sådan
  const opts = [kind, ...rng.shuffle(pool.filter((k) => k !== kind)).slice(0, 3)];
  const choices = rng.shuffle(opts).map((k) => ({ label: NAMES[k], value: k }));
  const skill = [SKILL.grund, SKILL.mang, SKILL.fyr, SKILL.vridna][level];
  return { mode: 'namn', level, skill, shapes: [makeShape(kind, level === 3, rng)], answer: kind, choices, prompt: 'Vad heter formen?', parts: [null] };
}

function ar(level: number, rng: Rng, forceYes: boolean): FQ {
  const ask = rng.pick([1, 2, 3, 4, 5]);
  const yes = forceYes || rng.next() < 0.6;
  const lookalike: Record<number, number[]> = { 1: [9], 2: [3, 7], 3: [8], 4: [5], 5: [4] };
  const shape = yes ? makeShape(ask, true, rng) : makeShape(rng.pick(lookalike[ask]), rng.next() < 0.5, rng);
  return { mode: 'ar', level, skill: SKILL.vridna, shapes: [shape], ask, answer: yes ? 1 : 0, choices: JA_NEJ, prompt: `Är det här en ${NAMES[ask]}?`, parts: [null] };
}

function horn(level: number, rng: Rng, noCircle: boolean): FQ {
  let shape: Shape;
  if (level <= 1) {
    const kind = level === 0 ? (noCircle ? range(rng, 1, 3) : rng.int(4)) : range(rng, 1, 6);
    shape = makeShape(kind, level === 1 && rng.next() < 0.4, rng);
  } else {
    const t = rng.pick(TRICKY.filter((x) => level === 3 || !x.hard));
    shape = { kind: OTHER, pts: rotate(t.pts, level === 3 ? angle(rng) : 0, 0, 0), odd: true, inward: t.inward };
  }
  const count = shape.kind === 0 || level === 0 || rng.next() < 0.5 ? 'hörn' : 'sidor';
  const answer = shape.pts ? shape.pts.length : 0;
  return { mode: 'horn', level, skill: level <= 1 ? SKILL.horn : SKILL.hornKlurig, shapes: [shape], count, answer,
    prompt: `Hur många ${count} har formen?`, parts: [null, count] };
}

/**
 * Sortera handlar om att känna igen former, även sneda – inte om att räkna hörn noga. Därför är
 * fem-, sex- och åttahörningar här alltid regelbundna (bara vridna), och nivå 1 håller sig till
 * triangel, kvadrat och rektangel.
 */
function sortera(level: number, rng: Rng): FQ {
  const target = level === 0 ? rng.pick([1, 2, 0]) : level === 1 ? rng.pick([1, 2, 3]) : rng.pick([1, 2, 3, 4, 5]);
  const total = level <= 1 ? 6 : 8;
  const k = range(rng, 2, level === 0 ? 3 : 4);
  const odd = level === 0 ? 0 : range(rng, 1, k - 1);
  const look: Record<number, number[]> = level <= 1
    ? { 0: [1, 2, 3], 1: [2, 3, 0], 2: [3, 1, 0], 3: [2, 1, 0] }
    : { 1: [9, 2, 3, 0], 2: [3, 7, 1, 0], 3: [8, 1, 0, 9], 4: [5, 1, 3], 5: [4, 6, 2] };
  const shape = (kind: number, tilt: boolean): Shape => (kind >= 4 && kind <= 6
    ? { kind, pts: tilt ? rotate(regular(CORNERS[kind], 0, 0, 1), angle(rng), 0, 0) : regular(CORNERS[kind], 0, 0, 1), odd: tilt }
    : makeShape(kind, tilt, rng));
  const shapes: Shape[] = [];
  for (let i = 0; i < k; i++) shapes.push(shape(target, i < odd));
  while (shapes.length < total) shapes.push(shape(rng.pick(look[target]), level > 0 && rng.next() < 0.5));
  return { mode: 'sortera', level, skill: SKILL.sortera, shapes: rng.shuffle(shapes), ask: target, answer: k,
    prompt: `Hur många ${PLURAL[target]} finns det?`, parts: [null, PLURAL[target]] };
}

export function makeQ(spec: QuestionSpec, rng: Rng): FQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'vriden-form' && mode !== 'sortera') mode = 'ar';
  if (spec.trap === 'raknade-start-igen') mode = 'horn';
  if (mode === 'blandat') mode = rng.pick(['namn', 'ar', 'horn', 'sortera'] as const);
  switch (mode) {
    case 'namn': return namn(level, rng);
    case 'ar': return ar(Math.max(2, level), rng, spec.trap === 'vriden-form');
    case 'horn': return horn(spec.trap ? Math.max(1, level) : level, rng, !!spec.trap);
    case 'sortera': return sortera(spec.trap ? Math.max(1, level) : level, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.grund: return [{ mode: 'namn', level: 0 }];
    case SKILL.mang: return [{ mode: 'namn', level: 1 }];
    case SKILL.fyr: return [{ mode: 'namn', level: 2 }];
    case SKILL.vridna: return [{ mode: 'ar', level: 2 }, { mode: 'namn', level: 3 }];
    case SKILL.horn: return [{ mode: 'horn', level: 0 }, { mode: 'horn', level: 1 }];
    case SKILL.hornKlurig: return [{ mode: 'horn', level: 2 }, { mode: 'horn', level: 3 }];
    case SKILL.sortera: return [{ mode: 'sortera', level: 1 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

export function diagnose(q: FQ, given: number): string | undefined {
  const s = q.shapes[0];
  switch (q.mode) {
    case 'namn':
      if (QUAD.includes(q.answer) && QUAD.includes(given)) return 'fyrhorningar';
      if (q.answer > 0 && given > 0 && CORNERS[given] !== CORNERS[q.answer]) return 'fel-antal-horn';
      return undefined;
    case 'ar':
      if (q.answer === 1) return 'vriden-form';
      return QUAD.includes(q.ask!) && QUAD.includes(s.kind) ? 'fyrhorningar' : 'fel-antal-horn';
    case 'horn':
      if (q.answer === 0) return given > 0 ? 'cirkel' : undefined;
      if (s.inward && given === q.answer - s.inward) return 'missade-inat';
      if (given === q.answer + 1) return 'raknade-start-igen';
      if (given === q.answer - 1) return 'missade-ett';
      return undefined;
    case 'sortera': {
      const typical = q.shapes.filter((x) => x.kind === q.ask && !x.odd).length;
      if (typical < q.answer && given === typical) return 'vriden-form';
      if (given === q.shapes.length) return 'raknade-alla';
      return undefined;
    }
  }
}

const QUAD_TEXT = 'Kvadrat: fyra lika långa sidor och räta hörn. Rektangel: räta hörn, och sidorna mitt emot varandra lika långa. Romb: fyra lika långa sidor men sneda hörn. Parallellogram: sneda hörn, sidorna mitt emot varandra lika långa.';

export function explain(tag: string, q: FQ, _given: number): Explained {
  switch (tag) {
    case 'vriden-form': return q.mode === 'sortera'
      ? { title: 'De sneda räknas också', text: `Du räknade bara de som ser vanliga ut. En form som ligger snett eller ser lite annorlunda ut kan också vara en ${NAMES[q.ask!]}. Räkna hörnen!` }
      : { title: 'Den ligger bara snett', text: 'En form byter inte namn när den vrids. Vrid den i tanken – och räkna hörnen och titta på sidorna.' };
    case 'fyrhorningar': return { title: 'Titta på sidorna och hörnen', text: QUAD_TEXT };
    case 'fel-antal-horn': return { title: 'Räkna hörnen', text: 'Namnet säger hur många hörn formen har: tre hörn – triangel, fem hörn – femhörning, sex hörn – sexhörning. Räkna en gång till!' };
    case 'raknade-start-igen': return { title: 'Ett hörn för mycket', text: 'Du räknade nog hörnet där du började två gånger. Sätt fingret på första hörnet och sluta när du kommer tillbaka dit.' };
    case 'missade-ett': return { title: 'Ett hörn saknas', text: 'Du missade ett. Gå runt formen långsamt och räkna varje hörn en gång.' };
    case 'missade-inat': return { title: 'Hörnen som pekar inåt', text: 'Hörn som pekar in i formen är också hörn. Räkna dem också!' };
    case 'cirkel': return { title: 'En cirkel är rund', text: 'En cirkel är rund hela vägen runt. Finns det någon spets någonstans?' };
    case 'raknade-alla': return { title: 'Bara en sorts form', text: `Du räknade alla formerna. Räkna bara ${PLURAL[q.ask!]}.` };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: FQ): string {
  const s = q.shapes[0];
  switch (q.mode) {
    case 'namn': return q.answer === 0 ? 'Den är rund och har inga hörn – en cirkel.' : `Den har ${CORNERS[q.answer]} hörn: en ${NAMES[q.answer]}.${QUAD.includes(q.answer) ? ' Titta på sidorna och hörnen för att se vilken fyrhörning.' : ''}`;
    case 'ar': return q.answer ? `Ja! Det är en ${NAMES[q.ask!]}, fast den ligger snett eller ser lite ovanlig ut.` : `Nej, det är en ${s.kind < OTHER ? NAMES[s.kind] : 'annan form'}.`;
    case 'horn': return q.answer === 0 ? 'En cirkel har inga hörn.' : `Formen har ${q.answer} ${q.count}.${s.inward ? ` ${s.inward} av hörnen pekar inåt.` : ''}${q.count === 'sidor' ? ' Lika många sidor som hörn!' : ''}`;
    case 'sortera': {
      const odd = q.shapes.filter((x) => x.kind === q.ask && x.odd).length;
      return `Det finns ${q.answer} ${PLURAL[q.ask!]}${odd ? ` – ${odd} av dem ligger snett eller ser ovanliga ut` : ''}.`;
    }
  }
}

export function hint(q: FQ): string {
  switch (q.mode) {
    case 'namn': return q.level === 2 ? 'Titta på sidorna: vilka är lika långa? Är hörnen räta eller sneda?' : q.level === 0 ? 'Är den rund? Hur många hörn har den? Är alla sidor lika långa?' : 'Räkna hörnen – namnet säger hur många det är.';
    case 'ar': return 'Vrid formen i tanken. Räkna hörnen och titta på sidorna – det är de som bestämmer namnet.';
    case 'horn': return 'Sätt fingret på ett hörn och räkna varvet runt. Sluta när du är tillbaka där du började. Hörn som pekar inåt räknas också.';
    case 'sortera': return 'Gå igenom formerna en i taget och räkna hörnen. Formen kan ligga snett och ändå vara samma sort!';
  }
}
