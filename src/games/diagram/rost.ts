import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import { axisFor, sum, type Chart } from '../../engines/diagram/chart';
import { fmtNum } from '../../engines/drill/check';
import { DJUR, ROSTER, type Sak, type Tema } from './data';
import { cands, chartOf, grannar, mestQ, pickKat, type Base, type DQ, type Extra } from './gen';

// Omröstningstorget (åk 3–6): cirkeldiagram. Största och minsta biten, hur stor del (hälften, en fjärdedel …),
// procent → hur många (Andelsankan svarar med procenten), hur många procent, och från staplar till cirkel.
// Lägen, färdighets-id:n och felkoder är permanenta.

type M = 'cirkel' | 'procent' | 'jamfor';
const MAX: Record<M, number> = { cirkel: 1, procent: 2, jamfor: 1 };
const SKILL: Record<M, string> = { cirkel: 'ma.stat.cirkel', procent: 'ma.stat.cirkel-procent', jamfor: 'ma.stat.cirkel-jamfor' };

export const ROST_ERR: Record<string, string> = {
  'andel-antal': 'Blandar ihop procent och antal',
  'fel-andel': 'Ser inte hur stor del av cirkeln biten är',
};

export const rostExtra: Extra = {
  err: ROST_ERR,
  explain(tag, q) {
    if (tag === 'andel-antal') {
      return q.prompt.includes('procent')
        ? { title: 'Procent, inte antal', text: 'Du svarade med hur många. Frågan gäller procent: hur många av hundra. Hur stor del av alla är det? Räkna om det till "av hundra".' }
        : { title: 'Antal, inte procent', text: 'Talet vid biten är procent: hur många av hundra. Men det var inte hundra som var med! Räkna ut hur många det blir av alla.' };
    }
    if (tag === 'fel-andel') {
      return { title: 'Jämför med hela cirkeln', text: 'Hela cirkeln är alla. En halv cirkel är hälften. Fyra lika stora bitar fyller cirkeln om varje bit är en fjärdedel. Tre lika stora bitar fyller den om varje bit är en tredjedel.' };
    }
    return undefined;
  },
};

/** Hur theme-frågorna låter: hur stor del, hur många alla var, och hur många procent. */
const DEL: Record<string, (k: Sak) => string> = {
  djur: (k) => `Hur stor del av klassen röstade på ${k.p}?`,
  glass: (k) => `Hur stor del av glassarna var ${k.p}?`,
  lek: (k) => `Hur stor del av klassen röstade på ${k.p}?`,
  skolvag: (k) => `Hur stor del av barnen ${k.p} till skolan?`,
};
const ALLA: Record<string, (n: number) => string> = {
  djur: (n) => `${n} barn röstade.`,
  glass: (n) => `${n} glassar såldes.`,
  lek: (n) => `${n} barn röstade.`,
  skolvag: (n) => `Det går ${n} barn i skolan.`,
};
const PROCENT: Record<string, (k: Sak) => string> = {
  djur: (k) => `Hur många procent röstade på ${k.p}?`,
  glass: (k) => `Hur många procent av glassarna var ${k.p}?`,
  lek: (k) => `Hur många procent röstade på ${k.p}?`,
  skolvag: (k) => `Hur många procent av barnen ${k.p} till skolan?`,
};

/** Delar av tolv där minst en bit är en hel bråkdel (alla bitar olika stora). */
const DELAR = [[6, 4, 2], [6, 3, 2, 1], [9, 2, 1], [4, 5, 3], [3, 4, 5], [6, 5, 1], [3, 7, 2], [8, 3, 1], [4, 6, 2]];
const BRAK: [number, string][] = [[1 / 2, 'Hälften'], [1 / 3, 'En tredjedel'], [1 / 4, 'En fjärdedel'], [3 / 4, 'Tre fjärdedelar']];
const brakNamn = (x: number) => BRAK.find(([f]) => Math.abs(f - x) < 1e-9)?.[1];

function cirkel(t: Tema, idx: number[], v: number[], etikett: Chart['etikett']): Chart {
  return chartOf(t, idx, v, 'cirkel', axisFor(sum(v), Math.max(1, Math.ceil(sum(v) / 10))), { etikett });
}

/** Hur stor del av cirkeln? Från bitarna själva (nivå 1) eller från ett stapeldiagram (jamför). */
function delQ(b: Base, rng: Rng, franStaplar: boolean): DQ | null {
  const t = rng.pick(ROSTER);
  const k = franStaplar ? rng.pick([1, 2]) : 1;
  const v = rng.shuffle(rng.pick(DELAR)).map((x) => x * k);
  const tot = sum(v);
  const ok = v.map((x, i) => (brakNamn(x / tot) ? i : -1)).filter((i) => i >= 0);
  if (!ok.length) return null;
  const idx = pickKat(t, v.length, rng), i = rng.pick(ok);
  const right = brakNamn(v[i] / tot)!;
  const chart = franStaplar ? chartOf(t, idx, v, 'stapel', axisFor(Math.max(...v) + 1, k)) : cirkel(t, idx, v, 'ingen');
  const fraga = DEL[t.id](t.kat[idx[i]]);
  return {
    ...b, kind: 'val', prompt: franStaplar ? `Om staplarna ritas som ett cirkeldiagram: ${fraga.charAt(0).toLocaleLowerCase('sv')}${fraga.slice(1)}` : fraga, chart,
    answer: right, alts: BRAK.map(([, n]) => (n === right ? { text: n } : { text: n, err: 'fel-andel' })), visa: [i],
    los: franStaplar
      ? `Alla tillsammans: ${v.map(fmtNum).join(' + ')} = ${fmtNum(tot)}. ${chart.kat[i]} har ${fmtNum(v[i])} av ${fmtNum(tot)}. Det är ${right.toLocaleLowerCase('sv')}.`
      : `Biten för ${chart.kat[i].toLocaleLowerCase('sv')} är ${right.toLocaleLowerCase('sv')} av hela cirkeln.`,
    tips: franStaplar
      ? 'Lägg först ihop alla staplarna: det är hela cirkeln. Hur stor del av alla är stapeln?'
      : 'Jämför biten med hela cirkeln. Hur många sådana bitar skulle behövas för att fylla cirkeln?',
  };
}

/** n olika procenttal (steg om step) som blir 100 tillsammans. */
function procentTal(n: number, step: number, rng: Rng): number[] | null {
  const p: number[] = [];
  for (let i = 0; i < n - 1; i++) p.push(step * (1 + rng.int(Math.floor(60 / step))));
  p.push(100 - sum(p));
  return p[n - 1] > 0 && new Set(p).size === n ? p : null;
}

function procent(b: Base, rng: Rng, trap?: string): DQ | null {
  const t = rng.pick(ROSTER);
  const level = trap === 'andel-antal' ? Math.max(1, b.level) : b.level;
  const N = level === 0 ? 100 : rng.pick([10, 20, 50, 200, 300, 400]);
  const p = procentTal(3 + rng.int(2), N === 10 || N === 50 ? 10 : 5, rng);
  if (!p) return null;
  const v = p.map((x) => (x * N) / 100);
  const idx = pickKat(t, p.length, rng), i = rng.int(p.length), k = t.kat[idx[i]];
  if (level <= 1) {
    const chart = cirkel(t, idx, v, 'procent');
    return {
      ...b, level, kind: 'las', prompt: `${ALLA[t.id](N)} ${t.las(k)}`, chart, answer: String(v[i]),
      cand: cands(v[i], [[p[i], 'andel-antal'], ...grannar(v, i)]), visa: [i],
      los: N === 100
        ? `${fmtNum(p[i])} % betyder ${fmtNum(p[i])} av hundra. Det var 100 som var med, så det blir ${fmtNum(v[i])}.`
        : `${fmtNum(p[i])} % betyder ${fmtNum(p[i])} av hundra. 1 % av ${N} är ${fmtNum(N / 100)}, så ${fmtNum(p[i])} % är ${fmtNum(p[i])} · ${fmtNum(N / 100)} = ${fmtNum(v[i])}.`,
      tips: N === 100 ? 'Procent betyder "av hundra". Hur många var med?' : 'Procent betyder "av hundra". Hur många är en procent av alla? Räkna sedan bitens procent gånger det.',
    };
  }
  if (p[i] === N) return null;
  const chart = cirkel(t, idx, v, 'antal');
  return {
    ...b, level, kind: 'las', prompt: `${ALLA[t.id](N)} ${PROCENT[t.id](k)}`, chart, answer: String(p[i]),
    cand: cands(p[i], [[v[i], 'andel-antal'], ...grannar(p, i).map(([x]) => [x, 'fel-stapel'] as [number, string])]), visa: [i],
    los: `${fmtNum(v[i])} av ${N}. 1 % av ${N} är ${fmtNum(N / 100)}, och ${fmtNum(v[i])} / ${fmtNum(N / 100)} = ${fmtNum(p[i])}. Det är ${fmtNum(p[i])} %.`,
    tips: 'Procent betyder "av hundra". Hur många är en procent av alla? Hur många sådana får plats i biten?',
  };
}

/** Hur många fler, i ett cirkeldiagram med procent. */
function flerProcent(b: Base, rng: Rng): DQ | null {
  const t = rng.pick(ROSTER);
  const N = rng.pick([20, 200, 300, 400]);
  const p = procentTal(3, 5, rng);
  if (!p) return null;
  const v = p.map((x) => (x * N) / 100);
  const idx = pickKat(t, 3, rng);
  const [a, c] = rng.shuffle([0, 1, 2]).slice(0, 2).sort((x, y) => v[y] - v[x]);
  const d = v[a] - v[c];
  if (v.includes(d) || p.includes(d)) return null;
  return {
    ...b, kind: 'las', prompt: `${ALLA[t.id](N)} ${t.fler(t.kat[idx[a]], t.kat[idx[c]])}`, chart: cirkel(t, idx, v, 'procent'), answer: String(d),
    cand: cands(d, [[p[a] - p[c], 'andel-antal'], [v[a] + v[c], 'summa-skillnad'], [v[a], 'svarade-varde']]), visa: [a, c],
    los: `${fmtNum(p[a])} % av ${N} är ${fmtNum(v[a])}, och ${fmtNum(p[c])} % av ${N} är ${fmtNum(v[c])}. ${fmtNum(v[a])} − ${fmtNum(v[c])} = ${fmtNum(d)}.`,
    tips: 'Räkna först om båda bitarnas procent till hur många. Ta sedan skillnaden.',
  };
}

const MODES: M[] = ['cirkel', 'procent', 'jamfor'];

export function makeQ(spec: QuestionSpec, rng: Rng): DQ | null {
  const mode: M = spec.mode === 'blandat' ? (spec.trap === 'andel-antal' ? 'procent' : rng.pick(MODES)) : spec.mode as M;
  const b: Base = { mode, level: Math.min(Math.max(0, spec.level), MAX[mode]), skill: SKILL[mode] };
  switch (mode) {
    case 'cirkel': {
      if (b.level === 1) return delQ(b, rng, false);
      const t = rng.pick(ROSTER), v = rng.shuffle(rng.pick(DELAR)), idx = pickKat(t, v.length, rng);
      return mestQ(b, t, cirkel(t, idx, v, 'ingen'), rng.next() < 0.6 ? 'mest' : 'minst', true);
    }
    case 'procent': return procent(b, rng, spec.trap);
    case 'jamfor': return b.level === 0 ? delQ(b, rng, true) : flerProcent(b, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const mode = MODES.find((m) => SKILL[m] === skill);
  return mode ? Array.from({ length: MAX[mode] + 1 }, (_, level) => ({ mode, level })) : [];
}

/** Exempel till Klassrummet. */
export const EXEMPEL_CIRKEL = cirkel(DJUR, [0, 1, 2], [6, 3, 3], 'ingen');
export const EXEMPEL_PROCENT = cirkel(DJUR, [0, 1, 2], [50, 30, 20], 'procent');
