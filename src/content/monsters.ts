// Stigmonster: små busar som dyker upp i vanliga banor. Rätta svar slår till dem; besegrade ger azaleablad.
// Ordningen är permanent (en pågående runda pekar ut monstret med ett index).

export const STIGMONSTER: { name: string; icon: string }[] = [
  { name: 'Glömsnigeln', icon: '🐌' },
  { name: 'Slarvlarven', icon: '🐛' },
  { name: 'Fladdermusen Flaxa', icon: '🦇' },
  { name: 'Spöket Slarv', icon: '👻' },
  { name: 'Busråttan', icon: '🐀' },
  { name: 'Skorpionen Stick', icon: '🦂' },
  { name: 'Grisbusen', icon: '🐗' },
  { name: 'Ödlan Snabbtunga', icon: '🦎' },
  { name: 'Slemmonstret', icon: '👾' },
  { name: 'Bläckfisken Klabb', icon: '🐙' },
];

export const stigmonster = (seed: number, k: number) => STIGMONSTER[(seed + k * 7) % STIGMONSTER.length];
