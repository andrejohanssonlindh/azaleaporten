// Seedad slump (mulberry32). Frågor i en runda genereras med den så att en omladdning
// fortsätter med exakt samma frågor, och så att tester blir deterministiska.

export interface Rng {
  next(): number;
  int(n: number): number;
  pick<T>(a: readonly T[]): T;
  shuffle<T>(a: readonly T[]): T[];
}

export function rngFrom(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number) => Math.floor(next() * n);
  return {
    next,
    int,
    pick: (a) => a[int(a.length)],
    shuffle: (a) => {
      const out = a.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32);
