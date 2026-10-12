import { describe, expect, it } from 'vitest';
import { BEATS, foeGroup, matchup, MATCHUP, withMatchup, type Group } from '../src/platform/rpg/vapen';
import { STIGMONSTER } from '../src/content/monsters';

describe('vapengrupper (sten-sax-påse)', () => {
  it('varje grupp slår en och förlorar mot en', () => {
    const all: Group[] = ['narstrid', 'avstand', 'magi'];
    for (const g of all) {
      expect(matchup(g, BEATS[g])).toBe('stark');
      expect(matchup(BEATS[g], g)).toBe('svag');
      expect(matchup(g, g)).toBeNull();
    }
    expect(BEATS.narstrid).toBe('magi');
    expect(BEATS.magi).toBe('avstand');
    expect(BEATS.avstand).toBe('narstrid');
    expect(matchup(null, 'magi')).toBeNull();
  });
  it('fel vapen går aldrig under grundskadan, rätt vapen ger extra', () => {
    expect(withMatchup(10, 'svag')).toBe(10);
    expect(withMatchup(11, 'svag')).toBe(10);
    expect(withMatchup(14, 'svag')).toBe(12);
    expect(withMatchup(10, 'stark')).toBe(10 + MATCHUP.stark);
  });
  it('fiender utan uttalad grupp får alltid samma grupp', () => {
    expect(foeGroup('brovaktaren')).toBe(foeGroup('brovaktaren'));
    expect(foeGroup('x', 'magi')).toBe('magi');
    expect(new Set(STIGMONSTER.map((m) => m.group)).size).toBe(3);
  });
});
