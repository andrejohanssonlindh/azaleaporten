import { cap, fmt, h12, minWord, NUM, stMin, tOf, type Phrase } from './language';
import type { BetweenQ, TimeQ } from './questions';
import { bMin, durStr, MAX_LEVEL } from './questions';

// Diagnos av fel: vilken missuppfattning ligger bakom svaret? Portat från v0.1.
// Felkoderna är permanenta (de sparas i händelseloggen och används av bossarnas fällor).

export const ERR: Record<string, string> = {
  rel: 'Blandar ihop i och över',
  hm: 'Blandar ihop timme och minut',
  hour: 'Fel timme (t.ex. halv elva = 10:30)',
  min: 'Fel minuter',
  base100: 'Räknar med 100 minuter per timme',
  count: 'Fel antal hela timmar',
  mincount: 'Fel antal minuter (tid emellan)',
  halv: 'Missar eller lägger till "halv"',
  period: 'Fel förmiddag/eftermiddag',
  other: 'Annat fel',
};

/** Vad man får om man läser timvisaren som minutvisare och tvärtom. */
export function hmSwapTime(h: number, m: number, lvl: number): number {
  const nh = h12(Math.round(m / 5));
  const pos = (h % 12) * 5 + m / 12;
  let nm = lvl < MAX_LEVEL ? Math.round(pos / 5) * 5 : Math.round(pos);
  nm %= 60;
  return tOf(nh, nm);
}

export interface Candidate { t: number; tag: string; s?: Phrase }

/** Typiska fel utifrån hur tiden uttrycks. */
export function candidates(s: Phrase, hmT: number | null): Candidate[] {
  const out: { s?: Phrase; t?: number; tag: string }[] = [];
  const down = { ...s, H: h12(s.H - 1) }, up = { ...s, H: h12(s.H + 1) };
  const preferDown = s.halv || s.rel === 'i';
  if (s.rel) out.push({ s: { ...s, rel: s.rel === 'i' ? 'över' : 'i' }, tag: 'rel' });
  if (hmT != null) out.push({ t: hmT, tag: 'hm' });
  out.push({ s: preferDown ? down : up, tag: 'hour' });
  out.push({ s: { ...s, halv: !s.halv }, tag: 'halv' });
  out.push({ s: preferDown ? up : down, tag: 'hour' });
  return out.map((c) => ({ ...c, t: c.s ? stMin(c.s) : c.t! }));
}

export function diagnose(q: TimeQ, uh: number, um: number, hmT: number | null): string {
  const corT = tOf(q.h, q.m), uT = tOf(uh, um);
  if (uT === corT) return 'period';
  if ((uh === q.m && um === q.h) || (q.s.rel && uh === q.s.n && um === q.s.H)) return 'hm';
  for (const c of candidates(q.s, hmT)) if (c.t === uT) return c.tag;
  if (um === q.m) return 'hour';
  if (uh % 12 === q.h % 12) return 'min';
  return 'other';
}

type Md = 'clock' | 'words' | 'choice' | 'between';
type PQ = Pick<TimeQ, 'h' | 'm' | 'isFm' | 's'> & { level?: number };

function errTitle0(tag: string, q: PQ) {
  switch (tag) {
    case 'rel': return 'Du blandade ihop i och över';
    case 'hm': return 'Du läste siffran i stället för minuterna';
    case 'halv': return q.s.halv ? 'Du glömde "halv"' : 'Det ska inte vara "halv"';
  }
  return 'Det var fel alternativ';
}

function explain0(tag: string, q: PQ) {
  const s = q.s, m = q.m;
  switch (tag) {
    case 'rel':
      return s.halv ? 'Nära 6:an räknar man från halv. Före 6:an säger man "i halv", efter 6:an "över halv".'
        : 'På klockans högra sida säger man "över". På vänstra sidan säger man "i".';
    case 'hm': return `Minutvisaren pekar på ${m / 5}, men varje siffra är fem minuter. ${m / 5} × 5 = ${m} minuter.`;
    case 'halv': return s.halv ? 'Minutvisaren är nära 6:an, så man räknar från halv.' : 'Minutvisaren är nära 12:an, så man räknar från hel timme, inte från halv.';
  }
  return 'Varje siffra på klockan är fem minuter.';
}

export function errTitle(tag: string, q: PQ, md: Md, level: number): string {
  if (md === 'choice' && level === 0) return errTitle0(tag, q);
  switch (tag) {
    case 'rel': return 'Du blandade ihop i och över';
    case 'hm': return 'Du blandade ihop timme och minut';
    case 'hour': return 'Rätt minuter, men fel timme';
    case 'min': return 'Rätt timme, men fel minuter';
    case 'halv': return q.s.halv ? 'Du glömde "halv"' : 'Det ska inte vara "halv"';
    case 'period': return 'Du blandade ihop förmiddag och eftermiddag';
  }
  return md === 'choice' ? 'Det var fel alternativ' : 'Både timme och minuter blev fel';
}

export function explain(tag: string, q: PQ, md: Md, level: number): string {
  if (md === 'choice' && level === 0) return explain0(tag, q);
  const s = q.s, hw = NUM[s.H], nw = s.rel ? minWord(s.n) : '';
  const mins = nw === 'kvart' ? 'en kvart' : nw + ' minuter';
  switch (tag) {
    case 'rel':
      return `"${cap(nw)} över" betyder ${mins} efter. "${cap(nw)} i" betyder ${mins} kvar till.`;
    case 'hm':
      if (md === 'words') return `Timmen är ordet sist: "${s.halv ? 'halv ' : ''}${hw}".${s.rel ? ` "${cap(nw)}" är minuterna.` : ''}`;
      return 'Den korta visaren visar timmen. Den långa visar minuterna.';
    case 'hour':
      if (s.halv) return `"Halv ${hw}" betyder halvvägs till ${hw}. Timmen är alltså en mindre än ${hw}.`;
      if (s.rel === 'i') return `"I ${hw}" betyder att klockan inte har blivit ${hw} än.`;
      return md === 'words' ? `"Över ${hw}" betyder att klockan redan har passerat ${hw}.` : 'Timvisaren visar timmen den just har passerat, inte nästa.';
    case 'min':
      if (md !== 'words') return 'Titta på den långa visaren. Varje siffra på klockan är fem minuter.';
      if (s.halv) return `Räkna från halvtimmen (30 minuter) och ${s.rel === 'över' ? 'lägg till' : 'dra bort'} ${s.n === 15 ? 'en kvart' : s.n + ' minuter'}.`;
      return s.rel === 'i' ? `"${cap(nw)} i" betyder att det är ${mins} kvar till hel timme.` : s.rel ? `"${cap(nw)} över" betyder ${mins} efter hel timme.` : 'Det är jämn timme, alltså 00 minuter.';
    case 'halv':
      if (s.halv) return `"Halv" betyder en halvtimme före ${hw}.`;
      return md === 'words' ? 'Det står inget "halv" i den här tiden.' : 'Minutvisaren är inte i närheten av halvtimmen (6:an).';
    case 'period': {
      const t = (q.isFm ? q.h : q.h + 12) + q.m / 60;
      if (t >= 8 && t < 20) return t < 12 ? 'Solen har inte nått toppen än, så det är förmiddag. Timmen ska vara mindre än 12.' : 'Solen har passerat toppen, så det är eftermiddag. Lägg till 12 på timmen.';
      return t >= 20 ? 'Månen har inte nått toppen än, så det är kväll. Lägg till 12 på timmen.' : 'Månen har passerat toppen, så det är efter midnatt. Timmen ska vara mindre än 12.';
    }
  }
  return md === 'words' ? 'Ta en del i taget: först timmen, sedan minuterna.' : 'Titta på en visare i taget: först den korta (timmen), sedan den långa (minuterna).';
}

export interface BetweenDiag { tag: string; title: string; text: string }

export function diagBetween(q: BetweenQ, uh: number, um: number): BetweenDiag {
  const A = bMin(q.a), B = bMin(q.b), D = B - A, U = uh * 60 + um, Dh = Math.floor(D / 60), Dm = D % 60;
  const step = 'Räkna i steg: först fram till nästa hela timme, sedan hela timmar, sedan resten.';
  if (uh === Dm && um === Dh) return { tag: 'hm', title: 'Du blandade ihop timmar och minuter', text: 'Timmarna skrivs i första rutan, minuterna i andra.' };
  const r100 = q.b.h24 * 100 + q.b.m - (q.a.h24 * 100 + q.a.m);
  if (uh === Math.floor(r100 / 100) && um === r100 % 100) return { tag: 'base100', title: 'En timme har 60 minuter, inte 100', text: step };
  if (Math.abs(U - D) === 720) return { tag: 'period', title: 'Du blandade ihop förmiddag och eftermiddag', text: 'Tryck på tiderna och titta på himlen: är solen eller månen före eller efter toppen?' };
  for (const k of ['a', 'b'] as const) {
    const t = q[k];
    if (t.fmt === 'digits') continue;
    const T = bMin(t), pq: PQ = { h: h12(t.h24), m: t.m, isFm: t.h24 < 12, s: t.s };
    const cands = candidates(t.s, t.fmt === 'clock' ? hmSwapTime(pq.h, t.m, q.level) : null);
    for (const c of cands) {
      let d = (((c.t - tOf(pq.h, t.m)) % 720) + 720) % 720;
      if (d >= 360) d -= 720;
      const alt = T + d, D2 = k === 'a' ? B - alt : alt - A;
      if (D2 === U) {
        const which = k === 'a' ? 'första' : 'andra';
        return { tag: c.tag, title: `${errTitle(c.tag, pq, t.fmt as Md, q.level)} (${which} tiden)`, text: explain(c.tag, pq, t.fmt as Md, q.level) };
      }
    }
  }
  if (um === Dm) return { tag: 'count', title: 'Rätt minuter, men fel antal timmar', text: step };
  if (uh === Dh) return { tag: 'mincount', title: 'Rätt antal timmar, men fel minuter', text: step };
  return { tag: 'other', title: 'Det blev fel', text: step };
}

/** Uträkningen i steg för Tid emellan, t.ex. ["09:15 → 10:00: 45 min", ...]. Sista raden är totalen. */
export function betweenSteps(A: number, B: number): string[] {
  const fmtM = (x: number) => fmt(Math.floor(x / 60), x % 60);
  const parts: [number, number][] = [];
  let cur = A;
  if (A % 60 && Math.floor(A / 60) < Math.floor(B / 60)) {
    const nx = (Math.floor(A / 60) + 1) * 60;
    parts.push([cur, nx]);
    cur = nx;
  }
  const fullEnd = Math.floor(B / 60) * 60;
  if (fullEnd > cur) { parts.push([cur, fullEnd]); cur = fullEnd; }
  if (B > cur) parts.push([cur, B]);
  const lines = parts.length > 1 ? parts.map(([x, y]) => `${fmtM(x)} → ${fmtM(y)}: ${durStr(y - x)}`) : [];
  return [...lines, `${fmtM(A)} → ${fmtM(B)}: ${durStr(B - A)}`];
}
