// Stigmonster: små busar som dyker upp i vanliga banor. Rätta svar slår till dem; besegrade ger azaleablad.
// Ordningen är permanent (en pågående runda pekar ut monstret med ett index).

import type { Group } from '../platform/rpg/vapen';

/** group = vapengrupp (sten-sax-påse): vilket vapen som biter bäst. */
export const STIGMONSTER: { name: string; icon: string; group: Group }[] = [
  { name: 'Glömsnigeln', icon: '🐌', group: 'magi' },
  { name: 'Slarvlarven', icon: '🐛', group: 'avstand' },
  { name: 'Fladdermusen Flaxa', icon: '🦇', group: 'avstand' },
  { name: 'Spöket Slarv', icon: '👻', group: 'magi' },
  { name: 'Busråttan', icon: '🐀', group: 'narstrid' },
  { name: 'Skorpionen Stick', icon: '🦂', group: 'narstrid' },
  { name: 'Grisbusen', icon: '🐗', group: 'narstrid' },
  { name: 'Ödlan Snabbtunga', icon: '🦎', group: 'avstand' },
  { name: 'Slemmonstret', icon: '👾', group: 'magi' },
  { name: 'Bläckfisken Klabb', icon: '🐙', group: 'magi' },
];

export const stigmonster = (seed: number, k: number) => STIGMONSTER[(seed + k * 7) % STIGMONSTER.length];
