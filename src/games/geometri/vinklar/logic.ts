import type { Rng } from '../../../platform/rng';
import type { QuestionSpec } from '../../../platform/rpg/types';
import type { Choice, DrillQ, Explained, Note } from '../../../engines/drill/types';
import { range, sv, type Pt } from '../draw';

// Sibbarp: vinklar i bowlen. Spetsig/rät/trubbig, jämför vinklar, läs av gradskivan, varv och grader
// (skejttrick!) och vinklar som fattas. Färdighets-id:n och felkoder är permanenta.

export type Mode = 'sort' | 'jamfor' | 'gradskiva' | 'varv' | 'summa';
export type SumKind = 'linje' | 'rat' | 'triangel' | 'likbent' | 'runt' | 'fyrhorning';

export interface VQ extends DrillQ {
  mode: Mode;
  /** sort/gradskiva: vinkelns storlek och riktningen på första benet (grader, moturs från höger). */
  deg?: number;
  rot?: number;
  /** jamfor: två vinklar med sina benlängder. */
  pair?: { deg: number; rot: number; arm: number }[];
  /** gradskiva: ligger första benet åt höger (0 på inre skalan) eller vänster. */
  side?: 'h' | 'v';
  /** varv: antal varv (och åt vilket håll frågan går). */
  turns?: number;
  reverse?: boolean;
  extra?: number;
  /** summa: vilken sorts figur, kända vinklar (i ordning; null = den som söks) och hörnen. */
  kind?: SumKind;
  angles?: (number | null)[];
  pts?: Pt[];
}

export const NAMES = ['spetsig', 'rät', 'trubbig', 'rak'];

export const ERR: Record<string, string> = {
  'spetsig-trubbig': 'Blandar ihop spetsig och trubbig',
  'langa-ben': 'Tror att längre ben betyder större vinkel',
  'fel-skala': 'Läser av fel skala på gradskivan',
  hundra: 'Tror att ett varv är hundra grader',
  'blandar-varv': 'Blandar ihop halvt och helt varv',
  'fel-summa': 'Använder fel vinkelsumma',
  adderade: 'Lägger ihop de kända vinklarna',
  'glomde-en': 'Glömmer en av de kända vinklarna',
  'glomde-halvera': 'Glömmer att dela lika på två vinklar',
};

const SKILL = {
  namn: 'ma.geo.vinkel-namn', jamfor: 'ma.geo.vinkel-jamfor', gradskiva: 'ma.geo.gradskiva', varv: 'ma.geo.varv',
  linje: 'ma.geo.vinklar-linje', triangel: 'ma.geo.vinklar-triangel', runt: 'ma.geo.vinklar-runt',
};

const CMP: Choice[] = [{ label: 'A', value: 0 }, { label: 'B', value: 1 }, { label: 'Lika', value: 2 }];
const step = (rng: Rng, lo: number, hi: number, by: number) => lo + by * rng.int(Math.floor((hi - lo) / by) + 1);

function sort(level: number, rng: Rng): VQ {
  const t = level === 0 ? rng.int(3) : rng.next() < 0.1 ? 3 : rng.int(3);
  const deg = t === 1 ? 90 : t === 3 ? 180
    : level === 2 && rng.next() < 0.5 ? (t === 0 ? range(rng, 72, 84) : range(rng, 96, 108))
      : t === 0 ? step(rng, level === 0 ? 25 : 15, level === 0 ? 65 : 75, 5) : step(rng, level === 0 ? 115 : 105, level === 0 ? 160 : 170, 5);
  const rot = level === 0 ? 0 : rng.int(360);
  const choices = (level === 0 ? [0, 1, 2] : [0, 1, 2, 3]).map((v) => ({ label: NAMES[v], value: v }));
  return { mode: 'sort', level, skill: SKILL.namn, deg, rot, answer: t, choices, prompt: 'Vad heter vinkeln?', parts: [null] };
}

function jamfor(level: number, rng: Rng, trap: boolean): VQ {
  const equal = !trap && level > 0 && rng.next() < 0.15;
  const a = step(rng, 25, 150, 5);
  let b: number;
  const gap = level === 0 ? 30 : 15;
  do { b = equal ? a : step(rng, 25, 150, 5); } while (!equal && Math.abs(a - b) < gap);
  // Lurigt: oftast får den mindre vinkeln de längre benen (fällan: alltid).
  const mislead = trap || (level > 0 && rng.next() < 0.6);
  const longIdx = equal ? rng.int(2) : mislead === (a < b) ? 0 : 1;
  const short = level === 0 && !trap ? 0.85 : 0.45;
  const [armA, armB] = [longIdx === 0 ? 1 : short, longIdx === 1 ? 1 : short];
  const pair = [{ deg: a, rot: level === 0 ? 0 : rng.int(360), arm: armA }, { deg: b, rot: level === 0 ? 0 : rng.int(360), arm: armB }];
  return { mode: 'jamfor', level, skill: SKILL.jamfor, pair, answer: equal ? 2 : a > b ? 0 : 1, choices: CMP, prompt: 'Vilken vinkel är störst?', parts: [null] };
}

function gradskiva(level: number, rng: Rng, trap: boolean): VQ {
  const by = level >= 2 ? 5 : 10;
  let deg: number;
  do { deg = step(rng, by, 180 - by, by); } while (deg === 90);
  const side: 'h' | 'v' = level === 0 && !trap ? 'h' : rng.next() < 0.5 ? 'h' : 'v';
  return { mode: 'gradskiva', level, skill: SKILL.gradskiva, deg, side, answer: deg, prompt: 'Hur stor är vinkeln? Läs av gradskivan.', parts: [null, '°'] };
}

const TURN_WORDS: Record<number, string> = { 0.25: 'ett kvarts varv', 0.5: 'ett halvt varv', 0.75: 'tre kvarts varv', 1: 'ett helt varv', 1.5: 'ett och ett halvt varv', 2: 'två hela varv', 2.5: 'två och ett halvt varv', 3: 'tre hela varv' };

function varv(level: number, rng: Rng): VQ {
  if (level <= 1) {
    const turns = rng.pick(level === 0 ? [0.25, 0.5, 1] : [0.75, 1.5, 2, 0.5, 2.5]);
    return { mode: 'varv', level, skill: SKILL.varv, turns, answer: turns * 360, prompt: `Skejtaren snurrar ${TURN_WORDS[turns]}. Hur många grader är det?`, parts: [TURN_WORDS[turns], '=', null, '°'] };
  }
  if (level === 2 || rng.next() < 0.5) {
    const turns = rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 0.25, 0.75]);
    return { mode: 'varv', level, skill: SKILL.varv, turns, reverse: true, answer: turns, keypad: Number.isInteger(turns) ? undefined : 'decimal',
      prompt: `Tricket heter ${turns * 360}. Skejtaren snurrar ${turns * 360}°. Hur många varv är det?`, parts: [turns * 360, '°', '=', null, 'varv'] };
  }
  const [a, b] = [rng.pick([180, 360, 540]), rng.pick([90, 180, 360])];
  return { mode: 'varv', level, skill: SKILL.varv, turns: (a + b) / 360, extra: b, answer: a + b,
    prompt: `Skejtaren snurrar ${a}° och sedan ${b}° till åt samma håll. Hur många grader är det tillsammans?`, parts: [a, '+', b, '=', null, '°'] };
}

/** Hörnen i en triangel med vinklarna A (vänster), B (höger) och basen 0–1. */
function triangle(A: number, B: number): Pt[] {
  const a = (A * Math.PI) / 180, b = (B * Math.PI) / 180;
  const h = Math.sin(a) * Math.sin(b) / Math.sin(a + b), x = h / Math.tan(a);
  return [[0, 0], [1, 0], [x, -h]];
}

function summa(level: number, rng: Rng): VQ {
  const kinds = ([['linje', 'rat'], ['linje', 'triangel'], ['triangel', 'fyrhorning', 'linje'], ['runt', 'fyrhorning', 'likbent', 'triangel']] as SumKind[][])[level];
  const kind = rng.pick(kinds);
  const by = level <= 1 ? 10 : level === 2 ? 5 : 1;
  const base = { mode: 'summa' as const, level, kind, tools: level >= 2 ? 'kladd' as const : undefined };
  switch (kind) {
    case 'linje': {
      let a: number;
      do { a = step(rng, 20, 160, by); } while (a === 90);
      return { ...base, skill: SKILL.linje, angles: [a, null], answer: 180 - a, prompt: 'Vinklarna ligger längs en rak linje. Hur stor är vinkeln som fattas?', parts: ['?', '=', null, '°'] };
    }
    case 'rat': {
      const a = step(rng, 20, 70, by);
      return { ...base, skill: SKILL.linje, angles: [a, null], answer: 90 - a, prompt: 'Tillsammans bildar vinklarna en rät vinkel. Hur stor är vinkeln som fattas?', parts: ['?', '=', null, '°'] };
    }
    case 'triangel': case 'likbent': {
      let A: number, B: number;
      if (kind === 'likbent') { const top = step(rng, 30, 120, 2); A = B = (180 - top) / 2; }
      else do { A = step(rng, 30, 100, by); B = step(rng, 30, 100, by); } while (A + B > 150);
      const C = 180 - A - B;
      const missing = kind === 'likbent' ? rng.int(2) : rng.int(3);
      const all = [A, B, C];
      const angles = all.map((x, i) => (kind === 'likbent' ? (i === 2 ? x : null) : i === missing ? null : x));
      return { ...base, skill: SKILL.triangel, angles, pts: triangle(A, B), answer: kind === 'likbent' ? A : all[missing],
        prompt: kind === 'likbent' ? 'Triangeln är likbent: de två vinklarna nere vid basen är lika stora. Hur stor är en av dem?' : 'Hur stor är vinkeln som fattas i triangeln?', parts: ['?', '=', null, '°'] };
    }
    case 'runt': {
      const n = 4;
      let parts: number[];
      do { parts = Array.from({ length: n - 1 }, () => step(rng, 40, 130, by)); } while (parts.reduce((s, x) => s + x, 0) > 320);
      const x = 360 - parts.reduce((s, v) => s + v, 0);
      return { ...base, skill: SKILL.runt, angles: [...parts, null], answer: x, prompt: 'Vinklarna går ett helt varv runt punkten. Hur stor är vinkeln som fattas?', parts: ['?', '=', null, '°'] };
    }
    case 'fyrhorning': {
      let pts: Pt[], ang: number[];
      do {
        pts = [[0, 0], [range(rng, 8, 12), range(rng, -2, 2)], [range(rng, 7, 12), range(rng, 6, 9)], [range(rng, -2, 2), range(rng, 5, 9)]];
        ang = pts.map((p, i) => {
          const a = pts[(i + 3) % 4], b = pts[(i + 1) % 4];
          const v1 = Math.atan2(a[1] - p[1], a[0] - p[0]), v2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
          let d = Math.abs(v1 - v2) * (180 / Math.PI);
          if (d > 180) d = 360 - d;
          return Math.round(d);
        });
      } while (ang.some((x) => x < 45 || x > 140) || ang.reduce((s, x) => s + x, 0) !== 360);
      const missing = rng.int(4);
      return { ...base, skill: SKILL.runt, pts, angles: ang.map((x, i) => (i === missing ? null : x)), answer: ang[missing],
        prompt: 'Hur stor är vinkeln som fattas i fyrhörningen?', parts: ['?', '=', null, '°'] };
    }
  }
}

export function makeQ(spec: QuestionSpec, rng: Rng): VQ {
  const level = Math.min(3, Math.max(0, spec.level));
  let mode = spec.mode as Mode | 'blandat';
  if (spec.trap === 'langa-ben') mode = 'jamfor';
  if (spec.trap === 'fel-skala') mode = 'gradskiva';
  if (mode === 'blandat') mode = rng.pick(['sort', 'jamfor', 'gradskiva', 'varv', 'summa'] as const);
  switch (mode) {
    case 'sort': return sort(level, rng);
    case 'jamfor': return jamfor(level, rng, spec.trap === 'langa-ben');
    case 'gradskiva': return gradskiva(level, rng, spec.trap === 'fel-skala');
    case 'varv': return varv(level, rng);
    case 'summa': return summa(level, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case SKILL.namn: return [{ mode: 'sort', level: 1 }];
    case SKILL.jamfor: return [{ mode: 'jamfor', level: 1 }];
    case SKILL.gradskiva: return [{ mode: 'gradskiva', level: 1 }, { mode: 'gradskiva', level: 2 }];
    case SKILL.varv: return [{ mode: 'varv', level: 1 }, { mode: 'varv', level: 2 }];
    case SKILL.linje: return [{ mode: 'summa', level: 0 }];
    case SKILL.triangel: return [{ mode: 'summa', level: 1 }, { mode: 'summa', level: 2 }];
    case SKILL.runt: return [{ mode: 'summa', level: 3 }];
  }
  return [];
}

/* ---------- diagnos ---------- */

const SUM: Record<SumKind, number> = { linje: 180, rat: 90, triangel: 180, likbent: 180, runt: 360, fyrhorning: 360 };

export function diagnose(q: VQ, given: number): string | undefined {
  switch (q.mode) {
    case 'sort': return (q.answer === 0 && given === 2) || (q.answer === 2 && given === 0) ? 'spetsig-trubbig' : undefined;
    case 'jamfor': {
      const [a, b] = q.pair!;
      const longer = a.arm > b.arm ? 0 : b.arm > a.arm ? 1 : -1;
      return longer >= 0 && given === longer && given !== q.answer ? 'langa-ben' : undefined;
    }
    case 'gradskiva': return given === 180 - q.answer ? 'fel-skala' : undefined;
    case 'varv':
      if (q.extra) return undefined;
      if (q.reverse) {
        const d = q.turns! * 360;
        if (given === d / 100) return 'hundra';
        if (given === d / 180 || given === d / 720) return 'blandar-varv';
        return undefined;
      }
      if (given === q.turns! * 100) return 'hundra';
      if (given === q.turns! * 180 || given === q.turns! * 720) return 'blandar-varv';
      return undefined;
    case 'summa': {
      const known = q.angles!.filter((x): x is number => x !== null);
      const sum = known.reduce((s, x) => s + x, 0);
      if (q.kind === 'likbent') {
        if (given === 180 - known[0]) return 'glomde-halvera';
        if ([90, 360].some((S) => given === (S - known[0]) / 2)) return 'fel-summa';
        return undefined;
      }
      if (known.length > 1 && given === sum && given !== q.answer) return 'adderade';
      if ([90, 180, 360].some((S) => S !== SUM[q.kind!] && given === S - sum)) return 'fel-summa';
      if (known.length > 1 && known.some((x) => given === SUM[q.kind!] - x)) return 'glomde-en';
      return undefined;
    }
  }
}

const SUM_TEXT: Record<SumKind, string> = {
  linje: 'Vinklarna längs en rak linje är 180° tillsammans – ett halvt varv.',
  rat: 'Vinklarna tillsammans bildar en rät vinkel, 90° – ett kvarts varv.',
  triangel: 'De tre vinklarna i en triangel är alltid 180° tillsammans.',
  likbent: 'De tre vinklarna i en triangel är alltid 180° tillsammans.',
  runt: 'Vinklarna runt en punkt är ett helt varv tillsammans: 360°.',
  fyrhorning: 'De fyra vinklarna i en fyrhörning är alltid 360° tillsammans.',
};

export function explain(tag: string, q: VQ, _given: number): Explained {
  switch (tag) {
    case 'spetsig-trubbig': return { title: 'Spetsig eller trubbig?', text: 'Spetsig vinkel: mindre än en rät vinkel – smal och vass som en spets. Trubbig vinkel: större än en rät vinkel – bred och trubbig.' };
    case 'langa-ben': return { title: 'Benens längd spelar ingen roll', text: 'En vinkel är hur mycket benen är isär – hur stort hörnet är. Längre ben gör inte vinkeln större!' };
    case 'fel-skala': return { title: 'Fel skala', text: 'Gradskivan har två skalor. Börja vid benet som ligger längs nollan och följ den skalan som börjar på 0 där.' };
    case 'hundra': return { title: 'Inte hundra', text: 'Ett varv är inte hundra grader. Ett kvarts varv är en rät vinkel, och fyra räta vinklar blir ett helt varv.' };
    case 'blandar-varv': return { title: 'Halvt eller helt?', text: 'Ett halvt varv: du står vänd åt andra hållet. Ett helt varv: du är tillbaka där du började. Ett halvt varv har hälften så många grader som ett helt.' };
    case 'fel-summa': return { title: 'Hur mycket blir de tillsammans?', text: SUM_TEXT[q.kind!] };
    case 'adderade': return { title: 'Det som fattas', text: `Du lade ihop vinklarna du vet. ${SUM_TEXT[q.kind!]} Den som fattas är det som blir kvar.` };
    case 'glomde-en': return { title: 'En vinkel till', text: 'Du tog bara bort en av de kända vinklarna. Ta bort alla vinklar du vet.' };
    case 'glomde-halvera': return { title: 'Två lika stora', text: 'Det som blir kvar ska delas lika på de två vinklarna vid basen.' };
  }
  return { title: 'Inte riktigt', text: `Prova så här: ${hint(q)}` };
}

export function solution(q: VQ): string {
  switch (q.mode) {
    case 'sort': return q.answer === 1 ? 'Precis 90°: en rät vinkel.' : q.answer === 3 ? 'Benen ligger på en rak linje: en rak vinkel, 180°.' : `${q.deg}° är ${q.answer === 0 ? 'mindre' : 'större'} än en rät vinkel: ${NAMES[q.answer]}.`;
    case 'jamfor': {
      const [a, b] = q.pair!;
      return `A är ${a.deg}° och B är ${b.deg}°. ${q.answer === 2 ? 'Lika stora!' : `${'AB'[q.answer]} är störst – oavsett hur långa benen är.`}`;
    }
    case 'gradskiva': return `Följ skalan som börjar på 0 vid det ena benet: ${q.answer}°.`;
    case 'varv': return q.extra ? `${q.answer - q.extra}° + ${q.extra}° = ${q.answer}°.` : q.reverse ? `Ett varv är 360°. ${q.turns! * 360}° / 360° = ${sv(q.turns!)} varv.` : `Ett varv är 360°. ${sv(q.turns!)} · 360° = ${q.answer}°.`;
    case 'summa': {
      const known = q.angles!.filter((x): x is number => x !== null);
      if (q.kind === 'likbent') return `180° − ${known[0]}° = ${180 - known[0]}°, delat på två: ${q.answer}°.`;
      return `${SUM[q.kind!]}° − ${known.map((x) => `${x}°`).join(' − ')} = ${q.answer}°.`;
    }
  }
}

export function hint(q: VQ): string {
  switch (q.mode) {
    case 'sort': return 'Jämför med ett hörn på ett papper – det är en rät vinkel. Är vinkeln mindre, lika stor eller större?';
    case 'jamfor': return 'Titta bara på hur mycket benen är isär vid hörnet. Hur långa benen är spelar ingen roll.';
    case 'gradskiva': return 'Hitta benet som ligger längs nollan. Följ den skalan som börjar på 0 där, fram till det andra benet.';
    case 'varv': return q.reverse ? 'Ett helt varv är 360°. Hur många gånger ryms 360° i snurren?' : q.extra ? 'Lägg ihop de två snurrarna.' : 'Ett kvarts varv är en rät vinkel. Hur många räta vinklar ryms i snurren?';
    case 'summa': return `${SUM_TEXT[q.kind!]} Ta bort de vinklar du vet.`;
  }
}

export function notes(): Note[] {
  return [
    { name: 'Rät vinkel', text: '90° (ett kvarts varv)' },
    { name: 'Rak linje', text: '180° (ett halvt varv)' },
    { name: 'Helt varv', text: '360°' },
    { name: 'Triangel', text: 'Vinklarna är 180° tillsammans' },
    { name: 'Fyrhörning', text: 'Vinklarna är 360° tillsammans' },
  ];
}
