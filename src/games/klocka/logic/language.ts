// Svenskt tidsspråk. Portat från Klockövning v0.1.
// En tid uttrycks som en struktur {n, rel, halv, H}: "fem i halv tre" = {n:5, rel:'i', halv:true, H:3}.

export type Rel = 'över' | 'i' | null;
export interface Phrase { n: number; rel: Rel; halv: boolean; H: number }

export const NUM = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv',
  'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton', 'tjugo'];

export function minWord(n: number): string {
  if (n === 15) return 'kvart';
  if (n === 1) return 'en';
  if (n <= 20) return NUM[n];
  if (n < 30) return 'tjugo' + (n === 21 ? 'en' : NUM[n - 20]);
  return String(n);
}

export function h12(h: number): number {
  h = ((h % 12) + 12) % 12;
  return h === 0 ? 12 : h;
}

export const pad = (n: number) => String(n).padStart(2, '0');
export const fmt = (h: number, m: number) => pad(h) + ':' + pad(m);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function render(s: Phrase): string {
  const hw = NUM[s.H];
  const core = s.halv ? 'halv ' + hw : hw;
  if (!s.rel) return s.halv ? core : 'prick ' + hw;
  return minWord(s.n) + ' ' + s.rel + ' ' + core;
}

/** Minuter på en 12-timmarsurtavla (0–719). */
export function stMin(s: Phrase): number {
  let t = s.H * 60 - (s.halv ? 30 : 0);
  if (s.rel === 'över') t += s.n;
  else if (s.rel === 'i') t -= s.n;
  return ((t % 720) + 720) % 720;
}

export const tOf = (h: number, m: number) => (h % 12) * 60 + m;
export const minToHM = (t: number) => ({ h: h12(Math.floor(t / 60)), m: t % 60 });

/** Giltiga sätt att säga tiden, det vanligaste först. */
export function structs(h: number, m: number): Phrase[] {
  const H = h12(h), N = h12(h + 1);
  if (m === 0) return [{ n: 0, rel: null, halv: false, H }];
  if (m === 30) return [{ n: 0, rel: null, halv: true, H: N }];
  const over: Phrase = { n: m, rel: 'över', halv: false, H };
  const iHalv: Phrase = { n: 30 - m, rel: 'i', halv: true, H: N };
  const overHalv: Phrase = { n: m - 30, rel: 'över', halv: true, H: N };
  const iN: Phrase = { n: 60 - m, rel: 'i', halv: false, H: N };
  if (m < 20) return [over];
  if (m < 25) return [over, iHalv];
  if (m < 30) return [iHalv, over];
  if (m < 40) return [overHalv, iN];
  if (m === 40) return [iN, overHalv];
  return [iN];
}

export function periodWord(h24: number): string {
  if (h24 < 5) return 'på natten';
  if (h24 < 10) return 'på morgonen';
  if (h24 < 12) return 'på förmiddagen';
  if (h24 < 18) return 'på eftermiddagen';
  return 'på kvällen';
}

/** Minutdel och timdel för ledtråden (färgade ord). */
export function phraseParts(s: Phrase): { min: string; hour: string } {
  if (s.rel) return { min: minWord(s.n) + ' ' + s.rel, hour: (s.halv ? 'halv ' : '') + NUM[s.H] };
  if (s.halv) return { min: 'halv', hour: NUM[s.H] };
  return { min: 'prick', hour: NUM[s.H] };
}

/** Bara minutvisaren (nivå 0). */
export function renderMin(s: Phrase): string {
  if (!s.rel) return s.halv ? 'halv' : 'hel timme';
  return minWord(s.n) + ' ' + s.rel + (s.halv ? ' halv' : '');
}

/** Typ av uttryck, används som färdighets-id (ma.tid.<typ>). Permanenta värden. */
export function phraseKind(s: Phrase): 'hel' | 'halv' | 'kvart' | 'over' | 'i' | 'over-halv' | 'i-halv' {
  if (!s.rel) return s.halv ? 'halv' : 'hel';
  if (s.n === 15 && !s.halv) return 'kvart';
  if (s.halv) return s.rel === 'över' ? 'over-halv' : 'i-halv';
  return s.rel === 'över' ? 'over' : 'i';
}
