// Rubiks kub som ren modell: 54 klistermärken, drag som permutationer och frågor om bitarna.
// Kuben hålls alltid med gul upp (U) och vit ner (D), som i nybörjarmetoden. Färgerna räknas mot
// mittbitarna, så allt fungerar också när hela kuben har vridits (y).

export type Farg = 'w' | 'y' | 'g' | 'b' | 'o' | 'r';
export type Sida = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export type Vec = [number, number, number];
/** 54 tecken: sidorna i ordningen U R F D L B, nio klistermärken var i läsordning sett utifrån. */
export type Kub = string;

export const SIDOR: Sida[] = ['U', 'R', 'F', 'D', 'L', 'B'];

// Koordinater: x åt höger, y uppåt, z mot dig. Varje sida: normal n, "höger" r och "ner" d sett utifrån.
const FACE: Record<Sida, { n: Vec; r: Vec; d: Vec }> = {
  U: { n: [0, 1, 0], r: [1, 0, 0], d: [0, 0, 1] },
  R: { n: [1, 0, 0], r: [0, 0, -1], d: [0, -1, 0] },
  F: { n: [0, 0, 1], r: [1, 0, 0], d: [0, -1, 0] },
  D: { n: [0, -1, 0], r: [1, 0, 0], d: [0, 0, -1] },
  L: { n: [-1, 0, 0], r: [0, 0, 1], d: [0, -1, 0] },
  B: { n: [0, 0, -1], r: [-1, 0, 0], d: [0, -1, 0] },
};

export interface Plats { sida: Sida; pos: Vec; n: Vec }

const add = (a: Vec, b: Vec, k = 1): Vec => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];

/** Klistermärkenas platser, index 0–53. */
export const PLATSER: Plats[] = SIDOR.flatMap((sida) => {
  const f = FACE[sida];
  return Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3) - 1, col = (i % 3) - 1;
    return { sida, pos: add(add(f.n, f.r, col), f.d, row), n: f.n };
  });
});

const key = (p: Vec, n: Vec) => `${p.join(',')}|${n.join(',')}`;
const AT = new Map(PLATSER.map((p, i) => [key(p.pos, p.n), i]));
/** Klistermärket på biten vid pos som pekar åt n. */
export const platsVid = (pos: Vec, n: Vec): number => AT.get(key(pos, n))!;

export const LOST: Kub = 'yyyyyyyyy' + 'ooooooooo' + 'ggggggggg' + 'wwwwwwwww' + 'rrrrrrrrr' + 'bbbbbbbbb';

export const FARGNAMN: Record<Farg, string> = { w: 'vit', y: 'gul', g: 'grön', b: 'blå', o: 'orange', r: 'röd' };

// ---------- drag ----------

/** Grunddragen: axel (0 = x, 1 = y, 2 = z), lagret (null = hela kuben) och kvartsvarvets riktning (högerhandsregeln). */
const BAS: Record<string, { axis: 0 | 1 | 2; layer: number | null; q: 1 | -1 }> = {
  R: { axis: 0, layer: 1, q: -1 }, L: { axis: 0, layer: -1, q: 1 },
  U: { axis: 1, layer: 1, q: -1 }, D: { axis: 1, layer: -1, q: 1 },
  F: { axis: 2, layer: 1, q: -1 }, B: { axis: 2, layer: -1, q: 1 },
  x: { axis: 0, layer: null, q: -1 }, y: { axis: 1, layer: null, q: -1 }, z: { axis: 2, layer: null, q: -1 },
};

/** Ett kvarts varv runt axeln (s = +1 moturs sett från axelns plussida). */
function rot(v: Vec, axis: number, s: number): Vec {
  const [x, y, z] = v;
  if (axis === 0) return s > 0 ? [x, -z, y] : [x, z, -y];
  if (axis === 1) return s > 0 ? [z, y, -x] : [-z, y, x];
  return s > 0 ? [-y, x, z] : [y, -x, z];
}

/** Ett drag: 'R', "R'", 'R2' (och y för att vrida hela kuben). */
export type Drag = string;
export const FACE_DRAG = ['U', 'D', 'R', 'L', 'F', 'B'] as const;

export const dragBas = (d: Drag) => d[0];
/** Antal kvarts varv medurs: 1, 2 eller 3 (= prim). */
export const dragVarv = (d: Drag) => (d.endsWith("'") ? 3 : d.endsWith('2') ? 2 : 1);
const mk = (bas: string, varv: number): Drag => (varv % 4 === 0 ? '' : varv % 4 === 1 ? bas : varv % 4 === 2 ? `${bas}2` : `${bas}'`);

const PERM = new Map<Drag, number[]>();
function perm(d: Drag): number[] {
  let p = PERM.get(d);
  if (p) return p;
  const b = BAS[dragBas(d)];
  if (!b || !/^[URFDLBxyz]('|2)?$/.test(d)) throw new Error(`Okänt drag: ${d}`);
  const s = b.q;
  p = PLATSER.map((pl, i) => {
    if (b.layer !== null && pl.pos[b.axis] !== b.layer) return i;
    let pos = pl.pos, n = pl.n;
    for (let k = 0; k < dragVarv(d); k++) { pos = rot(pos, b.axis, s); n = rot(n, b.axis, s); }
    return platsVid(pos, n);
  });
  PERM.set(d, p);
  return p;
}

/** Axeln, lagret (null = hela kuben) och vinkeln i grader (högerhandsregeln) för ett drag – för att rita det. */
export function dragAxel(d: Drag): { axis: 0 | 1 | 2; layer: number | null; grader: number } {
  const b = BAS[dragBas(d)];
  const v = dragVarv(d);
  return { axis: b.axis, layer: b.layer, grader: b.q * 90 * (v === 3 ? -1 : v) };
}

/** Delar upp ett kubprogram ("R U R' U'") i drag. */
export const parse = (alg: string): Drag[] => alg.split(/\s+/).filter(Boolean).map((d) => d.replace('′', "'"));

/** Kuben efter dragen. */
export function vrid(k: Kub, alg: Drag | Drag[]): Kub {
  const drag = Array.isArray(alg) ? alg : parse(alg);
  let s = k;
  for (const d of drag) {
    const p = perm(d);
    const out = new Array<string>(54);
    for (let i = 0; i < 54; i++) out[p[i]] = s[i];
    s = out.join('');
  }
  return s;
}

export const invDrag = (d: Drag): Drag => mk(dragBas(d), 4 - dragVarv(d));
/** Programmet baklänges: omvänd ordning och varje drag åt andra hållet. */
export const inv = (alg: Drag[]): Drag[] => alg.slice().reverse().map(invDrag);

/** Slår ihop drag på samma sida (U U → U2, U U' → inget). */
export function forenkla(alg: Drag[]): Drag[] {
  const out: Drag[] = [];
  for (const d of alg) {
    const last = out[out.length - 1];
    if (last && dragBas(last) === dragBas(d)) {
      out.pop();
      const m = mk(dragBas(d), dragVarv(last) + dragVarv(d));
      if (m) out.push(m);
    } else out.push(d);
  }
  return out;
}

/** n kvarts varv av en sida som ett drag (0 = inget). */
export const varv = (bas: string, n: number): Drag[] => { const m = mk(bas, ((n % 4) + 4) % 4); return m ? [m] : []; };

export const MOTSATT: Record<string, string> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F', x: 'x', y: 'y', z: 'z' };

/** Visar ett drag med riktigt primtecken. */
export const visa = (d: Drag) => d.replace("'", '′');
export const visaAlg = (alg: Drag[]) => alg.map(visa).join(' ');

// ---------- bitar ----------

export type BitTyp = 'mitt' | 'kant' | 'horn';
export interface Bit { pos: Vec; typ: BitTyp; platser: number[] }

/** Kubens 26 synliga bitar. */
export const BITAR: Bit[] = (() => {
  const m = new Map<string, number[]>();
  PLATSER.forEach((p, i) => { const k = p.pos.join(','); m.set(k, [...(m.get(k) ?? []), i]); });
  return [...m.entries()].map(([k, platser]) => ({
    pos: k.split(',').map(Number) as Vec,
    typ: platser.length === 1 ? 'mitt' : platser.length === 2 ? 'kant' : 'horn',
    platser,
  }));
})();

const BIT_AT = new Map(BITAR.map((b) => [b.pos.join(','), b]));
export const bitVid = (pos: Vec) => BIT_AT.get(pos.join(','))!;
export const bitMed = (plats: number) => bitVid(PLATSER[plats].pos);

/** Mittbitens färg på en sida. */
export const mitt = (k: Kub, s: Sida): Farg => k[SIDOR.indexOf(s) * 9 + 4] as Farg;
/** Sidan vars mittbit har färgen. */
export const sidaMed = (k: Kub, f: Farg): Sida => SIDOR.find((s) => mitt(k, s) === f)!;
const mittAv = (k: Kub, plats: number) => mitt(k, PLATSER[plats].sida);

export const farger = (k: Kub, b: Bit): Farg[] => b.platser.map((i) => k[i] as Farg);
const sammaFarger = (a: Farg[], b: Farg[]) => a.length === b.length && a.every((f) => b.includes(f));

/** Biten sitter rätt: varje klistermärke har samma färg som mittbiten på sin sida. */
export const sitter = (k: Kub, b: Bit) => b.platser.every((i) => k[i] === mittAv(k, i));
/** Biten är på rätt plats, men kanske vriden fel. */
export const paPlats = (k: Kub, b: Bit) => sammaFarger(farger(k, b), b.platser.map((i) => mittAv(k, i)));
/** Biten (bland kanter och hörn) som har just de här färgerna. */
export const bitMedFarger = (k: Kub, f: Farg[]) => BITAR.find((b) => b.typ !== 'mitt' && sammaFarger(farger(k, b), f))!;
/** Platsen där en bit med de här färgerna hör hemma (mellan mittbitarna med samma färger). */
export const hem = (k: Kub, f: Farg[]) => BITAR.find((b) => b.typ !== 'mitt' && sammaFarger(b.platser.map((i) => mittAv(k, i)), f))!;
export const arLost = (k: Kub) => BITAR.every((b) => sitter(k, b));

/** Klistermärket på biten som ligger på sidan s (eller undefined). */
export const pa = (b: Bit, s: Sida) => b.platser.find((i) => PLATSER[i].sida === s);

export const iLager = (b: Bit, axis: 0 | 1 | 2, v: number) => b.pos[axis] === v;
