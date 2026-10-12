import { describe, expect, it } from 'vitest';
import { PAUS, sayable } from '../src/platform/speech';

describe('Uppläsning', () => {
  it('läser inte "dam" som en förkortning, men rör inte andra ord', () => {
    expect(sayable('En gammal dam sitter på bänken.', 'sv-SE')).toBe('En gammal daam sitter på bänken.');
    expect(sayable('Damen och damm.', 'sv-SE')).toBe('daamen och damm.');
    expect(sayable('dam', 'en-GB')).toBe('dam');
  });
  it('pausmarkören delar upp diktamen', () => {
    expect(`ord.${PAUS}En mening.${PAUS}ord.`.split('|').map((p) => p.trim())).toEqual(['ord.', 'En mening.', 'ord.']);
  });
});
