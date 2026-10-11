import { h12 } from './language';

// Tolka fri text till en tid ("tio i halv elva på kvällen", "22:30", "kl 0845"). Portat från v0.1.

export function parseTime(val: string): { h: number; mn: number } | null {
  let v = val.trim().replace(/[.,]/g, ':');
  if (/^\d+$/.test(v)) {
    if (v.length === 3) v = '0' + v;
    if (v.length === 4) v = v.slice(0, 2) + ':' + v.slice(2);
    if (v.length <= 2) v = v + ':00';
  }
  const mt = v.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!mt) return null;
  const h = parseInt(mt[1]), mn = parseInt(mt[2]);
  if (h < 0 || h > 24 || mn < 0 || mn > 59) return null;
  return { h: h === 24 ? 0 : h, mn };
}

const UNITS: Record<string, number> = { en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9 };
const WNUM: Record<string, number> = {
  noll: 0, tio: 10, elva: 11, tolv: 12, tretton: 13, fjorton: 14, femton: 15, sexton: 16, sjutton: 17, arton: 18, aderton: 18, nitton: 19,
  tjugo: 20, tjugi: 20, tju: 20, trettio: 30, tretti: 30, fyrtio: 40, förti: 40, femtio: 50, femti: 50, kvart: 15, ...UNITS,
};

function wordNum(w: string): number | null {
  if (/^\d{1,2}$/.test(w)) return parseInt(w);
  if (w in WNUM) return WNUM[w];
  for (const [p, v] of [['tjugo', 20], ['tjugi', 20], ['trettio', 30], ['tretti', 30], ['fyrtio', 40], ['förti', 40], ['femtio', 50], ['femti', 50], ['tju', 20]] as const) {
    if (w.startsWith(p) && w.slice(p.length) in UNITS) return v + UNITS[w.slice(p.length)];
  }
  return null;
}

const STOP = new Set(['klockan', 'kl', 'är', 'den', 'det', 'hon', 'prick', 'precis', 'exakt', 'jämnt', 'minuter', 'minut', 'min', 'ungefär', 'cirka', 'ca', 'typ', 'på', 'om', 'och',
  'morgonen', 'morgon', 'förmiddagen', 'förmiddag', 'fm', 'natten', 'natt', 'eftermiddagen', 'eftermiddag', 'em', 'kvällen', 'kväll', 'ikväll', 'imorse', 'inatt', 'nu', 'snart', 'strax']);

export interface Parsed { h12: number; m: number; h24: number | null }

function finish(h: number, m: number, is24: boolean, period: 'am' | 'pm' | null, natt: boolean): Parsed {
  if (is24) return { h12: h12(h), m, h24: h };
  let h24: number | null = null;
  if (period === 'am') h24 = h === 12 ? 0 : h;
  if (period === 'pm') h24 = h === 12 ? 12 : h + 12;
  if (natt && h >= 9 && h < 12) h24 = h + 12; // "halv tolv på natten" = 23:30
  return { h12: h, m, h24 };
}

export function parseAny(raw: string): Parsed | null {
  let s = raw.toLowerCase().trim();
  if (!s) return null;
  let period: 'am' | 'pm' | null = null, natt = false;
  if (/morgon|förmiddag|\bfm\b|morse/.test(s)) period = 'am';
  if (/natt/.test(s)) { period = 'am'; natt = true; }
  if (/eftermiddag|\bem\b|kväll/.test(s)) period = 'pm';
  const dTry = s.replace(/klockan|kl\.?/g, ' ').replace(/(på|i)\s+(kväll|morse|natt|eftermiddag|förmiddag|morgon)[a-zåäö]*/g, ' ').replace(/\b(fm|em)\b/g, ' ').trim();
  const d = parseTime(dTry);
  if (d) {
    let h = d.h;
    if (h <= 12) {
      if (period === 'pm' && h < 12) h += 12;
      if (natt && h >= 9 && h < 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
    }
    return finish(h, d.mn, true, period, natt);
  }

  s = s.replace(/\b(i|på)\s+(kväll|morse|natt|eftermiddag|förmiddag|morgon)[a-zåäö]*/g, ' ');
  s = s.replace(/[!?.,;:]/g, ' ').replace(/-/g, ' ');
  s = s.replace(/(^|\s)halv(?=[a-zåäö])/g, '$1halv ');
  s = s.replace(/(tjugo|tjugi|trettio|tretti|fyrtio|förti|femtio|femti)\s+(en|ett|två|tre|fyra|fem|sex|sju|åtta|nio)(?=\s|$)/g, '$1$2');
  const toks: (number | string)[] = [];
  for (const w of s.split(/\s+/).filter(Boolean)) {
    if (STOP.has(w)) continue;
    if (w === 'över' || w === 'efter') { toks.push('över'); continue; }
    if (w === 'i' || w === 'före' || w === 'innan') { toks.push('i'); continue; }
    if (w === 'halv' || w === 'halva') { toks.push('halv'); continue; }
    const n = wordNum(w);
    if (n == null) return null;
    toks.push(n);
  }
  const sig = toks.map((t) => (typeof t === 'number' ? 'N' : t)).join(' ');
  const N = toks.filter((t): t is number => typeof t === 'number');
  let t: number;
  let H = N[N.length - 1];
  const n = N[0];
  if (H === 24) H = 0;
  if (H == null || H > 23) return null;
  switch (sig) {
    case 'N': t = H * 60; break;
    case 'N N': H = N[0]; if (N[0] > 23 || N[1] > 59) return null; t = N[0] * 60 + N[1]; break;
    case 'halv N': t = H * 60 - 30; break;
    case 'N över N': if (n < 1 || n > 30) return null; t = H * 60 + n; break;
    case 'N i N': if (n < 1 || n > 30) return null; t = H * 60 - n; break;
    case 'N över halv N': if (n < 1 || n > 15) return null; t = H * 60 - 30 + n; break;
    case 'N i halv N': if (n < 1 || n > 15) return null; t = H * 60 - 30 - n; break;
    default: return null;
  }
  const is24 = H > 12 || H === 0;
  if (is24) {
    t = ((t % 1440) + 1440) % 1440;
    return finish(Math.floor(t / 60), t % 60, true, period, natt);
  }
  t = ((t % 720) + 720) % 720;
  return finish(h12(Math.floor(t / 60)), t % 60, false, period, natt);
}
